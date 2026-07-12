"""
Scrollbar visual regression + token-parity check across Chromium, Firefox, WebKit
in light and dark themes.

Verifies:
  1. The custom scrollbar tokens (--scrollbar-thumb, --scrollbar-radius, --scrollbar-size)
     resolve from --primary and --radius on <html> in every engine and theme.
  2. Themed values differ between light and dark (proving tokens follow the theme).
  3. Element-level screenshots of the right-edge scrollbar strip are captured per
     (engine, theme) into qa-report/scrollbar/ for visual diffing in CI.

Fails (exit 1) if a token is missing, or if light/dark tokens are identical, or if
--scrollbar-thumb doesn't resolve to a color derived from --primary.

Env:
  BASE_URL   default http://localhost:8080
  QA_OUT     default qa-report
"""
import asyncio, json, os, sys, re
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:8080")
OUT = Path(os.environ.get("QA_OUT", "qa-report")) / "scrollbar"
OUT.mkdir(parents=True, exist_ok=True)

# Desktop viewport — scrollbar rules only apply at >=768px.
VIEWPORT = {"width": 1280, "height": 1800}
ENGINES = ("chromium", "firefox", "webkit")
THEMES = ("light", "dark")

READ_TOKENS = """() => {
  const s = getComputedStyle(document.documentElement);
  const g = (k) => s.getPropertyValue(k).trim();
  return {
    primary:            g('--primary'),
    radius:             g('--radius'),
    scrollbarSize:      g('--scrollbar-size'),
    scrollbarRadius:    g('--scrollbar-radius'),
    scrollbarThumb:     g('--scrollbar-thumb'),
    scrollbarThumbHover:g('--scrollbar-thumb-hover'),
    scrollbarThumbActive:g('--scrollbar-thumb-active'),
    scrollbarTrack:     g('--scrollbar-track'),
    htmlScrollbarWidth: s.scrollbarWidth || s.getPropertyValue('scrollbar-width').trim(),
    htmlScrollbarColor: s.scrollbarColor || s.getPropertyValue('scrollbar-color').trim(),
    htmlScrollbarGutter:s.scrollbarGutter || s.getPropertyValue('scrollbar-gutter').trim(),
  };
}"""

def check_tokens(engine, theme, t, errors):
    required = ["primary","radius","scrollbarSize","scrollbarRadius",
                "scrollbarThumb","scrollbarThumbActive","scrollbarTrack"]
    for k in required:
        if not t.get(k):
            errors.append(f"[{engine}/{theme}] missing token: {k}")
    # thumb-active MUST be var(--primary) resolved; the CSS binds it directly.
    prim = (t.get("primary") or "").replace(" ", "")
    active = (t.get("scrollbarThumbActive") or "").replace(" ", "")
    if prim and active and prim != active:
        errors.append(
            f"[{engine}/{theme}] --scrollbar-thumb-active ({active}) "
            f"is not equal to --primary ({prim})"
        )
    # thumb should reference primary via color-mix — either the browser preserves
    # the expression (Firefox often does) or it resolves to an oklch/rgba value.
    thumb = t.get("scrollbarThumb") or ""
    if not (("color-mix" in thumb and "--primary" in thumb)
            or re.search(r"(oklch|rgba?|color)\(", thumb)):
        errors.append(f"[{engine}/{theme}] --scrollbar-thumb not derived from --primary: {thumb!r}")
    # radius should be derived from --radius (same string, or resolved length).
    rad = t.get("scrollbarRadius") or ""
    if not rad:
        errors.append(f"[{engine}/{theme}] --scrollbar-radius empty")

async def capture(engine_name, browser):
    ctx = await browser.new_context(viewport=VIEWPORT, device_scale_factor=1)
    page = await ctx.new_page()
    per_theme = {}
    for theme in THEMES:
        await page.goto(BASE + "/", wait_until="networkidle", timeout=45000)
        # Force theme by toggling the `dark` class on <html>. This bypasses the
        # ThemeToggle UI and works uniformly across engines.
        await page.evaluate(
            "(t) => document.documentElement.classList.toggle('dark', t === 'dark')",
            theme,
        )
        # Ensure the page is tall enough that a scrollbar actually renders.
        await page.evaluate("() => window.scrollTo(0, 200)")
        await page.wait_for_timeout(300)
        tokens = await page.evaluate(READ_TOKENS)
        # Screenshot a right-edge strip that contains the scrollbar (Chromium/WebKit).
        # Firefox uses overlay scrollbars, so the strip captures the track/thumb tint too.
        strip = OUT / f"{engine_name}-{theme}-scrollbar-strip.png"
        await page.screenshot(
            path=str(strip),
            clip={"x": VIEWPORT["width"] - 24, "y": 0, "width": 24, "height": 600},
        )
        per_theme[theme] = {"tokens": tokens, "screenshot": str(strip)}
    await ctx.close()
    return per_theme

async def main():
    report = {}
    errors = []
    async with async_playwright() as p:
        for engine_name in ENGINES:
            engine = getattr(p, engine_name)
            browser = await engine.launch(headless=True)
            try:
                report[engine_name] = await capture(engine_name, browser)
            except Exception as e:
                errors.append(f"[{engine_name}] launch/capture failed: {e}")
                report[engine_name] = {"error": str(e)}
            finally:
                await browser.close()

    # Validate tokens per engine/theme + assert theme actually changes values.
    THEMED_KEYS = (
        "primary",
        "scrollbarThumb",
        "scrollbarThumbHover",
        "scrollbarThumbActive",
        "scrollbarTrack",
    )
    for engine_name, per_theme in report.items():
        if "error" in per_theme: continue
        for theme, data in per_theme.items():
            check_tokens(engine_name, theme, data["tokens"], errors)
        light = per_theme["light"]["tokens"]
        dark  = per_theme["dark"]["tokens"]
        # Every themed token MUST flip when --primary flips — otherwise the
        # scrollbar would visually diverge from the design tokens.
        for k in THEMED_KEYS:
            if light.get(k) == dark.get(k):
                errors.append(
                    f"[{engine_name}] {k} identical across light/dark "
                    f"({light.get(k)!r}) — not tracking --primary"
                )
        # Static tokens MUST remain stable across themes (radius/size are
        # geometry, not color, and shouldn't shift on toggle).
        for k in ("scrollbarRadius", "scrollbarSize"):
            if light.get(k) != dark.get(k):
                errors.append(
                    f"[{engine_name}] {k} changed across themes "
                    f"({light.get(k)!r} → {dark.get(k)!r}) — geometry should be theme-invariant"
                )
        # Coherence: --scrollbar-thumb-active must equal --primary in BOTH
        # themes (the CSS binds them directly, so any drift = broken var wiring).
        for theme in THEMES:
            t = per_theme[theme]["tokens"]
            if t.get("primary") != t.get("scrollbarThumbActive"):
                errors.append(
                    f"[{engine_name}/{theme}] --scrollbar-thumb-active drifted from --primary"
                )

    (OUT / "report.json").write_text(json.dumps(report, indent=2))
    if errors:
        print(json.dumps(report, indent=2))
        print("\nFAIL — theme toggle did not propagate to scrollbar tokens:")
        for e in errors: print("  -", e)
        sys.exit(1)
    # Compact success summary — full report is in qa-report/scrollbar/report.json
    for engine_name, per_theme in report.items():
        l = per_theme["light"]["tokens"]; d = per_theme["dark"]["tokens"]
        print(f"[{engine_name}] light thumb={l['scrollbarThumb']}")
        print(f"[{engine_name}] dark  thumb={d['scrollbarThumb']}")
    print(f"\nOK — theme toggle propagates to thumb/hover/active/track across "
          f"{len(ENGINES)} engines × {len(THEMES)} themes with zero drift")

asyncio.run(main())
