"""
Android Chrome scrollbar regression.

Emulates Pixel 7 (Playwright's built-in descriptor = Chromium + Android UA +
touch + 412×915 viewport, DPR 2.625). For each route:
  1. Screenshot BEFORE / DURING / AFTER scroll.
  2. Assert clientWidth/scrollWidth stay constant (no layout shift from a
     reserved scrollbar gutter).
  3. Assert no horizontal overflow (scrollWidth == clientWidth).
  4. Assert Android Chrome resolves scrollbar-width:none and
     scrollbar-gutter:auto on the mobile viewport, so no overlay/reserved
     column can appear.

Artifacts: qa-report/android-scrollbar/{route}-{phase}.png + report.json.
Exit != 0 on any drift.
"""
import asyncio, json, os, sys
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:8080")
OUT = Path(os.environ.get("QA_OUT", "qa-report")) / "android-scrollbar"
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
    if len(set(cw.values())) > 1:
        errors.append(f"[{route}] clientWidth drift across scroll phases: {cw}")
    if len(set(sw.values())) > 1:
        errors.append(f"[{route}] scrollWidth drift across scroll phases: {sw}")
    for phase, data in phases.items():
        mm = data["metrics"]
        if mm["scrollWidth"] > mm["clientWidth"]:
            errors.append(
                f"[{route}/{phase}] horizontal overflow: scrollWidth={mm['scrollWidth']} > clientWidth={mm['clientWidth']}"
            )
        # Android Chrome must resolve scrollbar-width:none on the mobile viewport
        # so no reserved column can create a layout shift or overlay.
        if mm["scrollbarWidth"] not in ("none", ""):
            errors.append(
                f"[{route}/{phase}] unexpected scrollbar-width={mm['scrollbarWidth']!r}"
            )
        if mm["scrollbarGutter"] not in ("auto", "", "normal"):
            errors.append(
                f"[{route}/{phase}] unexpected scrollbar-gutter={mm['scrollbarGutter']!r}"
            )

    await page.close()
    return phases

async def main():
    report = {}
    errors = []
    async with async_playwright() as p:
        pixel = p.devices["Pixel 7"]
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(**pixel, service_workers="block")
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
        print("FAIL — Android Chrome scrollbar / layout regressions:")
        for e in errors: print("  -", e)
        print(f"\nArtifacts: {OUT}/")
        sys.exit(1)
    for route, phases in report.items():
        m = phases["before"]["metrics"]
        print(f"[{route}] cw={m['clientWidth']} sw={m['scrollWidth']} "
              f"scrollbar-width={m['scrollbarWidth']!r} gutter={m['scrollbarGutter']!r} "
              f"body-overflow-x={m['bodyOverflowX']!r} — OK")
    print(f"\nOK — no overlay/layout drift across {len(ROUTES)} routes × 3 scroll phases (Android Chrome)")
    print(f"Artifacts: {OUT}/")

asyncio.run(main())
