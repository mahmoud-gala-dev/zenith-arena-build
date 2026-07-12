"""
iPad Safari scrollbar regression.

Emulates "iPad Pro 11" (Playwright's built-in descriptor = WebKit + iPadOS UA +
touch + 834×1194 viewport, DPR 2). Same before/during/after scroll phases as
the iPhone script — but the tablet viewport is ≥768px so our CSS switches
scrollbar-width/gutter into the desktop styling; assertions match that.

Artifacts: qa-report/ipad-scrollbar/{route}-{phase}.png + report.json.
Exit != 0 on any layout drift, overlay leak, or horizontal overflow.
"""
import asyncio, json, os, sys
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:8080")
OUT = Path(os.environ.get("QA_OUT", "qa-report")) / "ipad-scrollbar"
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

# Tablet viewport hits the ≥768px CSS branch — scrollbar-width may be "thin"
# and scrollbar-gutter "stable"; either is fine as long as it stays constant
# across phases so no overlay pops in mid-scroll.
ALLOWED_SBW = {"none", "thin", "auto", ""}
ALLOWED_SBG = {"auto", "stable", "normal", "", "stable both-edges"}

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
                f"[{route}/{phase}] unexpected scrollbar-width={mm['scrollbarWidth']!r} on iPad viewport"
            )
        if mm["scrollbarGutter"] not in ALLOWED_SBG:
            errors.append(
                f"[{route}/{phase}] unexpected scrollbar-gutter={mm['scrollbarGutter']!r} on iPad viewport"
            )

    await page.close()
    return phases

async def main():
    report = {}
    errors = []
    async with async_playwright() as p:
        ipad = p.devices["iPad Pro 11"]
        browser = await p.webkit.launch(headless=True)
        context = await browser.new_context(**ipad, service_workers="block")
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
        print("FAIL — iPad Safari scrollbar / layout regressions:")
        for e in errors: print("  -", e)
        print(f"\nArtifacts: {OUT}/")
        sys.exit(1)
    for route, phases in report.items():
        m = phases["before"]["metrics"]
        print(f"[{route}] cw={m['clientWidth']} sw={m['scrollWidth']} "
              f"scrollbar-width={m['scrollbarWidth']!r} gutter={m['scrollbarGutter']!r} — OK")
    print(f"\nOK — no overlay/layout drift across {len(ROUTES)} routes × 3 scroll phases (iPad Safari)")
    print(f"Artifacts: {OUT}/")

asyncio.run(main())
