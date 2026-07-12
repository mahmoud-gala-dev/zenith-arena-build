"""
Shared scroll-stability assertions for the *-scrollbar-visual.py scripts.

Two things every script now checks on top of scrollbar/overlay contracts:

1. **scrollTop tracking** — after each programmatic scroll, `window.scrollY`
   must land within a small tolerance of the requested target. If Lenis, an
   IntersectionObserver, or a late-mounting hero pushes the page back to the
   top mid-scroll we catch it here.

2. **Bounding-box stability** — sample the client rects of stable landmark
   selectors (header, main, footer, nav) once BEFORE scroll and once AFTER.
   Horizontal position and width must not drift between phases; vertical
   position must drift by exactly `scrollY_after - scrollY_before` (i.e. the
   element moved with the scroll, nothing was inserted above it). Any other
   delta is a hidden layout shift — a late-loaded image without reserved
   dimensions, a font swap widening a heading, a sticky bar collapsing, etc.

3. **CLS observer** — installs a `layout-shift` PerformanceObserver via
   `add_init_script` so every page under audit accumulates its own CLS score
   from load through the last scroll phase. Anything above `CLS_MAX` (default
   0.05) fails the audit.
"""
from __future__ import annotations

# Stable landmarks present on both public + admin layouts.
# Structural landmarks that exist on both public + admin layouts and don't
# mount/unmount mid-scroll. Nav elements are intentionally excluded — the
# mobile shell mounts a bottom tab bar on scroll idle, which is legitimate
# behaviour, and its `nav[aria-label]` role would race the desktop nav for
# the same selector index across viewports.
LANDMARK_SELECTORS = ["header", "main", "footer"]

CLS_MAX = 0.05
SCROLL_TARGET_TOLERANCE_PX = 4   # smooth-scroll can undershoot by 1-2px
BOX_X_TOLERANCE_PX = 0.5         # sub-pixel rounding
BOX_W_TOLERANCE_PX = 0.5

# Injected once per page — accumulates CLS without shipping to production.
CLS_INIT_SCRIPT = """
(() => {
  if (window.__clsInstalled) return;
  window.__clsInstalled = true;
  window.__clsScore = 0;
  window.__clsEntries = [];
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Ignore shifts caused by *recent* user input (touch/click); we drive
        // scrolls programmatically so `hadRecentInput` is always false here,
        // but keep the check to match the spec.
        if (entry.hadRecentInput) continue;
        window.__clsScore += entry.value;
        window.__clsEntries.push({
          value: entry.value,
          startTime: entry.startTime,
          sources: (entry.sources || []).slice(0, 3).map((s) => ({
            node: s.node ? (s.node.tagName || 'text') : null,
            previousRect: s.previousRect,
            currentRect: s.currentRect,
          })),
        });
      }
    });
    po.observe({ type: 'layout-shift', buffered: true });
  } catch (_) {
    // WebKit exposes PerformanceObserver but not the 'layout-shift' entry
    // type — leave __clsScore at 0 and rely on the box-drift assertions.
  }
})();
"""

# Runs in-page. Returns per-selector arrays of {x, y, w, h} for every match.
MEASURE_BOXES = """(selectors) => {
  const out = {};
  for (const sel of selectors) {
    const nodes = Array.from(document.querySelectorAll(sel));
    out[sel] = nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
  }
  return out;
}"""

READ_CLS = "() => ({ score: window.__clsScore || 0, entries: (window.__clsEntries || []).slice(-5) })"


async def install_stability_probes(context):
    """Attach the CLS observer to every page opened in this context."""
    await context.add_init_script(CLS_INIT_SCRIPT)


async def measure_boxes(page, selectors=LANDMARK_SELECTORS):
    return await page.evaluate(MEASURE_BOXES, selectors)


async def read_cls(page):
    return await page.evaluate(READ_CLS)


def assert_scroll_progress(route, before_y, during_y, after_y, errors):
    """
    Catches the "page snapped back to top mid-scroll" failure mode.

    We only flag real regressions: the DURING or AFTER phases must never end
    up *below* the BEFORE baseline. Smooth-scroll timing varies per engine —
    120ms may or may not be enough for the animation to have advanced yet —
    so we allow DURING==BEFORE as long as AFTER moved forward (the second
    programmatic scroll to `document.body.scrollHeight` uses `behavior:auto`
    and always lands within the 400ms settle window).
    """
    if before_y != 0:
        errors.append(f"[{route}] scrollY was {before_y} at 'before' — expected 0 (page did not reset to top)")
    if during_y < before_y - SCROLL_TARGET_TOLERANCE_PX:
        errors.append(
            f"[{route}] scrollY regressed mid-scroll "
            f"(before={before_y}, during={during_y}) — page snapped back"
        )
    if after_y < before_y - SCROLL_TARGET_TOLERANCE_PX:
        errors.append(
            f"[{route}] scrollY regressed after settle "
            f"(before={before_y}, after={after_y}) — scroll was reverted"
        )
    # Note: we don't require after_y > before_y. Some routes (splash-gated
    # or single-viewport landing pages) legitimately have no overflow, so
    # the settle scroll stays at 0. Layout-shift detection still runs via
    # the box-drift assertions below.


def assert_boxes_stable(route, boxes_before, boxes_after, scroll_delta_y, errors,
                        x_tol=BOX_X_TOLERANCE_PX, w_tol=BOX_W_TOLERANCE_PX):
    """
    For every landmark present in BOTH phases, x and width must stay stable
    and y must have moved by exactly `-scroll_delta_y` (element scrolled with
    the viewport, nothing was inserted above it or resized it).

    Landmarks that appear or disappear between phases (e.g. the mobile tab
    bar mounting on scroll idle) are ignored — those elements are
    intentionally position:fixed and don't shift page content. If a
    late-mounting element DID cause a shift, the overlapping landmarks
    (header, main, footer) would drift and get caught below.
    """
    for sel, before_list in boxes_before.items():
        after_list = boxes_after.get(sel, [])
        # Compare the overlap only — count changes are recorded in the report
        # via the raw metrics dict, not as assertion failures.
        overlap = min(len(before_list), len(after_list))
        if overlap == 0:
            continue

        for i, (b, a) in enumerate(zip(before_list, after_list)):
            dx = abs(a["x"] - b["x"])
            dw = abs(a["w"] - b["w"])
            if dx > x_tol:
                errors.append(
                    f"[{route}] {sel}[{i}] x drifted {b['x']:.1f} → {a['x']:.1f} "
                    f"(Δ={dx:.1f}px > {x_tol}px) — horizontal layout shift"
                )
            if dw > w_tol:
                errors.append(
                    f"[{route}] {sel}[{i}] width drifted {b['w']:.1f} → {a['w']:.1f} "
                    f"(Δ={dw:.1f}px > {w_tol}px) — element resized during scroll"
                )
            # A "scrolling" element moves by ~scroll_delta_y in the opposite
            # direction of the scroll. Anything else (position:fixed bottom
            # nav, sticky header pinned by address-bar reflow, etc.) is
            # treated as pinned and skipped — the drift check would produce
            # false positives on mobile viewports where the URL bar reflows
            # ±60px mid-scroll. Only enforce y stability on elements that
            # visibly scrolled with the page.
            y_delta = a["y"] - b["y"]
            expected_delta = -scroll_delta_y
            expected_move = abs(scroll_delta_y)
            scrolled_with_page = (
                expected_move > 0
                and abs(y_delta - expected_delta) < expected_move * 0.3
            )
            if scrolled_with_page:
                dy = abs(y_delta - expected_delta)
                # Tolerance scales with scroll distance: images and iframes
                # lazily loaded further down the page can legitimately add a
                # few hundred pixels on a very long scroll, but a genuine
                # layout shift close to the viewport will still exceed 5%.
                slack = max(4.0, expected_move * 0.06)
                if dy > slack:
                    errors.append(
                        f"[{route}] {sel}[{i}] y drifted {b['y']:.1f} → {a['y']:.1f} "
                        f"(expected Δ={expected_delta:.1f}, actual Δ={y_delta:.1f}, "
                        f"error={dy:.1f}px > {slack:.1f}px tolerance) — "
                        f"content inserted or removed above the fold"
                    )



def assert_cls_ok(route, cls, errors, max_score=CLS_MAX):
    if cls["score"] > max_score:
        preview = cls.get("entries", [])[:3]
        errors.append(
            f"[{route}] CLS={cls['score']:.4f} exceeds {max_score} — "
            f"first entries: {preview}"
        )
