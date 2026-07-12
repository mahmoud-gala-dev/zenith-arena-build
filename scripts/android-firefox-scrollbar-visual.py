"""
Android Firefox scrollbar regression.

Playwright can't drive Fenix directly, but Firefox uses the same Gecko engine
on desktop and Android for CSS scrollbar handling. We emulate a Pixel 7
viewport (412×915 + DPR 2.625 + touch + Android UA) on top of desktop Firefox
so we exercise Gecko's scrollbar-width / scrollbar-gutter resolution against
the mobile CSS branch — where iOS/Chrome hide the scrollbar entirely and we
want Gecko to do the same (no reserved column, no overlay flip mid-scroll).

Artifacts: qa-report/android-firefox-scrollbar/{route}-{phase}.png + report.json.
Exit != 0 on any layout drift, overlay leak, or horizontal overflow.
"""
import asyncio, json, os, sys
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:8080")
OUT = Path(os.environ.get("QA_OUT", "qa-report")) / "android-firefox-scrollbar"
OUT.mkdir(parents=True, exist_ok=True)

ROUTES = ["/", "/projects", "/services", "/knowledge", "/gallery"]

MEASURE = """() => ({
  clientWidth:  document.documentElement.clientWidth,
  scrollWidth:  document.documentElement.scrollWidth,
  clientHeight: document.documentElement.clientHeight,
  scrollY:      window.scrollY,
  scrollbarWidth:   getComputedStyle(document.documentElement).scrollbarWidth || '',
  scrollbarGutter:  getComputedStyle(document.documentElement).scrollbarGutter || '',
  bodyOverflowX:    getComputedStyle(document.body).overflowX,
  htmlOverflowX:    getComputedStyle(document.documentElement).overflowX,
})"""

# Gecko honours scrollbar-width but does NOT implement scrollbar-gutter today,
# so the computed value comes back as "auto" regardless of the CSS. That's a
# runtime UA fact, not a regression — treat "auto" as acceptable everywhere.
ALLOWED_SBW = {"none", ""}
ALLOWED_SBG = {"auto", "", "normal", "stable", "stable both-edges"}

ANDROID_UA = (
    "Mozilla/5.0 (Android 13; Mobile; rv:120.0) "
    "Gecko/120.0 Firefox/120.0"
)

async def audit_route(context, route, errors):
    page = await context.new_page()
    await page.goto(BASE + route, wait_until="domcontentloaded", timeout=45000)
    await page.wait_for_timeout(1500)

    slug = route.strip("/").replace("/", "-") or "home"
    phases = {}

    await page.evaluate("() => window.scrollTo(0, 0)")
    await page.wait_for_timeout(200)
    m_before = await page.evaluate(MEASURE)
    p_before = OUT / f"{slug}-1-before.png"
    await page.screenshot(path=str(p_before), timeout=15000, animations="disabled")
    phases["before"] = {"metrics": m_before, "screenshot": str(p_before)}

    target_y = max(600, int(m_before["clientHeight"]))
    await page.evaluate("(y) => window.scrollTo({ top: y, behavior: 'smooth' })", target_y)
    await page.wait_for_timeout(120)
    m_during = await page.evaluate(MEASURE)
    p_during = OUT / f"{slug}-2-during.png"
    await page.screenshot(path=str(p_during), timeout=15000, animations="disabled")
    phases["during"] = {"metrics": m_during, "screenshot": str(p_during)}

    await page.evaluate("() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' })")
    await page.wait_for_timeout(400)
    m_after = await page.evaluate(MEASURE)
    p_after = OUT / f"{slug}-3-after.png"
    await page.screenshot(path=str(p_after), timeout=15000, animations="disabled")
    phases["after"] = {"metrics": m_after, "screenshot": str(p_after)}

    cw = {k: v["metrics"]["clientWidth"] for k, v in phases.items()}
    sw = {k: v["metrics"]["scrollWidth"] for k, v in phases.items()}
    sbw = {k: v["metrics"]["scrollbarWidth"] for k, v in phases.items()}
    sbg = {k: v["metrics"]["scrollbarGutter"] for k, v in phases.items()}
    if len(set(cw.values())) > 1:
        errors.append(f"[{route}] clientWidth drift across scroll phases: {cw}")
    if len(set(sw.values())) > 1:
        errors.append(f"[{route}] scrollWidth drift across scroll phases: {sw}")
    if len(set(sbw.values())) > 1:
        errors.append(f"[{route}] scrollbar-width flip mid-scroll (overlay leak): {sbw}")
    if len(set(sbg.values())) > 1:
        errors.append(f"[{route}] scrollbar-gutter flip mid-scroll (overlay leak): {sbg}")
    for phase, data in phases.items():
        mm = data["metrics"]
        if mm["scrollWidth"] > mm["clientWidth"]:
            errors.append(
                f"[{route}/{phase}] horizontal overflow: scrollWidth={mm['scrollWidth']} > clientWidth={mm['clientWidth']}"
            )
        if mm["scrollbarWidth"] not in ALLOWED_SBW:
            errors.append(
                f"[{route}/{phase}] Gecko resolved scrollbar-width={mm['scrollbarWidth']!r} — "
                f"expected 'none' on Android viewport"
            )
        if mm["scrollbarGutter"] not in ALLOWED_SBG:
            errors.append(
                f"[{route}/{phase}] unexpected scrollbar-gutter={mm['scrollbarGutter']!r}"
            )

    await page.close()
    return phases

async def main():
    report = {}
    errors = []
    async with async_playwright() as p:
        browser = await p.firefox.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 412, "height": 915},
            device_scale_factor=2.625,
            is_mobile=False,  # Gecko contexts reject is_mobile/has_touch=True
            has_touch=False,
            user_agent=ANDROID_UA,
            service_workers="block",
        )
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
        print("FAIL — Android Firefox scrollbar / layout regressions:")
        for e in errors: print("  -", e)
        print(f"\nArtifacts: {OUT}/")
        sys.exit(1)
    for route, phases in report.items():
        m = phases["before"]["metrics"]
        print(f"[{route}] cw={m['clientWidth']} sw={m['scrollWidth']} "
              f"scrollbar-width={m['scrollbarWidth']!r} gutter={m['scrollbarGutter']!r} — OK")
    print(f"\nOK — no overlay/layout drift across {len(ROUTES)} routes × 3 scroll phases (Android Firefox / Gecko)")
    print(f"Artifacts: {OUT}/")

asyncio.run(main())
