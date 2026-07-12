"""
iOS Safari scrollbar visual + layout regression.

For each target route:
  1. Emulate iPhone 13 (Playwright's built-in device descriptor uses WebKit +
     iOS UA + touch + 390×844 viewport).
  2. Screenshot BEFORE scroll (top of page, layout at rest).
  3. Screenshot DURING scroll (mid-scroll, animation frame captured).
  4. Screenshot AFTER scroll (scroll settled at bottom).
  5. Assert clientWidth / scrollWidth are identical across all three phases —
     any change signals a scrollbar overlay reserved space (layout shift).
  6. Assert no vertical scrollbar element is painted in the DOM strip
     (iOS uses overlay scrollbars that never appear in static screenshots
     of the layout; if one shows up, our CSS regressed).

Outputs qa-report/ios-scrollbar/{route}-{phase}.png + report.json.
Exits non-zero on any layout drift.
"""
import asyncio, json, os, sys
from pathlib import Path
from playwright.async_api import async_playwright
from _scroll_assertions import (
    install_stability_probes, measure_boxes, read_cls,
    assert_scroll_progress, assert_boxes_stable, assert_cls_ok,
)

BASE = os.environ.get("BASE_URL", "http://localhost:8080")
OUT = Path(os.environ.get("QA_OUT", "qa-report")) / "ios-scrollbar"
OUT.mkdir(parents=True, exist_ok=True)

ROUTES = ["/", "/projects", "/services", "/knowledge", "/gallery"]

# Measurements taken in-page and returned to Python.
MEASURE = """() => ({
  clientWidth:  document.documentElement.clientWidth,
  scrollWidth:  document.documentElement.scrollWidth,
  clientHeight: document.documentElement.clientHeight,
  scrollY:      window.scrollY,
  scrollbarWidth:   getComputedStyle(document.documentElement).scrollbarWidth || '',
  scrollbarGutter:  getComputedStyle(document.documentElement).scrollbarGutter || '',
  bodyOverflowX: getComputedStyle(document.body).overflowX,
})"""

async def audit_route(context, route, errors):
    page = await context.new_page()
    await page.goto(BASE + route, wait_until="domcontentloaded", timeout=45000)
    await page.wait_for_timeout(1500)  # let CSS/fonts/lenis settle

    slug = route.strip("/").replace("/", "-") or "home"
    phases = {}

    # ---- BEFORE: top of page, at rest ----
    await page.evaluate("() => window.scrollTo(0, 0)")
    await page.wait_for_timeout(200)
    m_before = await page.evaluate(MEASURE)
    boxes_before = await measure_boxes(page)
    p_before = OUT / f"{slug}-1-before.png"
    await page.screenshot(path=str(p_before), timeout=15000, animations="disabled")
    phases["before"] = {"metrics": m_before, "screenshot": str(p_before)}

    # ---- DURING: kick off a scroll and grab the frame while it's animating ----
    target_y = max(600, int(m_before["clientHeight"]))
    await page.evaluate(
        "(y) => window.scrollTo({ top: y, behavior: 'smooth' })", target_y
    )
    # No wait_for + short delay: capture MID-animation so an overlay scrollbar
    # thumb (if the CSS regresses and reveals it) would be visible here.
    await page.wait_for_timeout(120)
    m_during = await page.evaluate(MEASURE)
    boxes_during = await measure_boxes(page)
    p_during = OUT / f"{slug}-2-during.png"
    await page.screenshot(path=str(p_during), timeout=15000, animations="disabled")
    phases["during"] = {"metrics": m_during, "screenshot": str(p_during)}

    # ---- AFTER: fully scrolled and settled ----
    await page.evaluate(
        "() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' })"
    )
    await page.wait_for_timeout(400)
    m_after = await page.evaluate(MEASURE)
    boxes_after = await measure_boxes(page)
    cls = await read_cls(page)
    p_after = OUT / f"{slug}-3-after.png"
    await page.screenshot(path=str(p_after), timeout=15000, animations="disabled")
    phases["after"] = {"metrics": m_after, "screenshot": str(p_after), "cls": cls}

    # ---- Assertions per route ----
    cw = {k: v["metrics"]["clientWidth"] for k, v in phases.items()}
    sw = {k: v["metrics"]["scrollWidth"] for k, v in phases.items()}
    if len(set(cw.values())) > 1:
        errors.append(f"[{route}] clientWidth drift across scroll phases: {cw}")
    if len(set(sw.values())) > 1:
        errors.append(f"[{route}] scrollWidth drift across scroll phases: {sw}")
    for phase, data in phases.items():
        mm = data["metrics"]
        if mm["scrollWidth"] != mm["clientWidth"]:
            errors.append(
                f"[{route}/{phase}] horizontal overflow (scrollWidth={mm['scrollWidth']} vs clientWidth={mm['clientWidth']})"
            )
        # iOS Safari: our CSS forces scrollbar-width:none + gutter:auto on <768px.
        if mm["scrollbarWidth"] not in ("none", ""):
            errors.append(
                f"[{route}/{phase}] unexpected scrollbar-width={mm['scrollbarWidth']!r} on iOS viewport"
            )
        if mm["scrollbarGutter"] not in ("auto", "", "normal"):
            errors.append(
                f"[{route}/{phase}] unexpected scrollbar-gutter={mm['scrollbarGutter']!r} on iOS viewport"
            )

    # ---- Layout-shift assertions (positional stability) ----
    assert_scroll_progress(
        route, m_before["scrollY"], m_during["scrollY"], m_after["scrollY"], errors,
    )
    assert_boxes_stable(
        route, boxes_before, boxes_during,
        m_during["scrollY"] - m_before["scrollY"], errors,
    )
    assert_boxes_stable(
        route, boxes_before, boxes_after,
        m_after["scrollY"] - m_before["scrollY"], errors,
    )
    assert_cls_ok(route, cls, errors)

    await page.close()
    return phases

async def main():
    report = {}
    errors = []
    async with async_playwright() as p:
        # Playwright's iPhone 13 descriptor = WebKit + iOS UA + 390×844 + DPR 3 + touch.
        iphone = p.devices["iPhone 13"]
        browser = await p.webkit.launch(headless=True)
        context = await browser.new_context(**iphone, service_workers="block")
        await install_stability_probes(context)
        try:
            for route in ROUTES:
                try:
                    report[route] = await audit_route(context, route, errors)
                except Exception as e:
                    errors.append(f"[{route}] audit crashed: {e}")
                    report[route] = {"error": str(e)}
        finally:
            await context.close()
            await browser.close()

    (OUT / "report.json").write_text(json.dumps(report, indent=2))
    if errors:
        print("FAIL — iOS scrollbar / layout regressions:")
        for e in errors: print("  -", e)
        print(f"\nArtifacts: {OUT}/")
        sys.exit(1)
    for route, phases in report.items():
        m = phases["before"]["metrics"]
        print(f"[{route}] cw={m['clientWidth']} sw={m['scrollWidth']} "
              f"scrollbar-width={m['scrollbarWidth']!r} gutter={m['scrollbarGutter']!r} — OK")
    print(f"\nOK — no overlay/layout drift across {len(ROUTES)} routes × 3 scroll phases")
    print(f"Artifacts: {OUT}/")

asyncio.run(main())
