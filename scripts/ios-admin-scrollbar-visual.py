"""
iOS Safari scrollbar/overlay regression for Admin CMS routes.

Mirrors scripts/ios-scrollbar-visual.py (WebKit + iPhone 13, 3-phase scroll +
computed style + width drift assertions) but targets the authenticated
Admin surface — the KPI dashboard, Media library, Knowledge/Blog editor, and
their siblings — so we catch any CMS-side CSS regression (data tables,
sticky toolbars, drawer overlays) that would leak an overlay scrollbar or
shift layout on iOS.

Auth: uses the Lovable-injected Supabase session
(LOVABLE_BROWSER_SUPABASE_STORAGE_KEY / _SESSION_JSON / _COOKIES_JSON,
gated by LOVABLE_BROWSER_AUTH_STATUS=injected). If no session is available
the script exits 0 with a clear "skipped" message so CI on public forks
doesn't fail — signed-in maintainers still run the assertions locally and on
protected branches.

Artifacts: qa-report/ios-admin-scrollbar/{route}-{phase}.png + report.json.
Exit != 0 on any layout drift, overlay leak, or horizontal overflow.
"""
import asyncio, json, os, sys
from pathlib import Path
from playwright.async_api import async_playwright
from _scroll_assertions import (
    install_stability_probes, measure_boxes, read_cls,
    assert_scroll_progress, assert_boxes_stable, assert_cls_ok,
)

BASE = os.environ.get("BASE_URL", "http://localhost:8080")
OUT = Path(os.environ.get("QA_OUT", "qa-report")) / "ios-admin-scrollbar"
OUT.mkdir(parents=True, exist_ok=True)

# KPI dashboard + the highest-traffic CMS editors. Adding more routes is a
# one-line change; keep this list small so the CI job stays under budget.
ROUTES = [
    "/admin",                # KPI / overview
    "/admin/media",          # media library grid
    "/admin/blog",           # Knowledge Center editor
    "/admin/projects",       # long data table
    "/admin/hero-slides",    # drag-and-drop reorder UI
    "/admin/qa-reports",     # QA workflow list
]

MEASURE = """() => ({
  clientWidth:  document.documentElement.clientWidth,
  scrollWidth:  document.documentElement.scrollWidth,
  clientHeight: document.documentElement.clientHeight,
  scrollY:      window.scrollY,
  scrollbarWidth:   getComputedStyle(document.documentElement).scrollbarWidth || '',
  scrollbarGutter:  getComputedStyle(document.documentElement).scrollbarGutter || '',
  bodyOverflowX:    getComputedStyle(document.body).overflowX,
  htmlOverflowX:    getComputedStyle(document.documentElement).overflowX,
  // Guard against inner scroll containers rendering a visible thumb — any
  // element under <main> whose computed scrollbar-width isn't 'none' on the
  // mobile viewport is an overlay leak inside the CMS.
  innerLeaks: Array.from(document.querySelectorAll('main *')).filter((el) => {
    const cs = getComputedStyle(el);
    const overflowY = cs.overflowY;
    const scrolls = overflowY === 'auto' || overflowY === 'scroll';
    if (!scrolls) return false;
    const sbw = cs.scrollbarWidth || '';
    return sbw !== 'none' && sbw !== '';
  }).slice(0, 5).map((el) => ({
    tag: el.tagName.toLowerCase(),
    cls: (el.className || '').toString().slice(0, 80),
    sbw: getComputedStyle(el).scrollbarWidth,
  })),
})"""

async def restore_supabase_session(context, page):
    """Inject the Lovable-managed Supabase session before touching /admin."""
    storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")

    if cookies_json:
        cookies = json.loads(cookies_json)
        for c in cookies:
            c["url"] = BASE
        await context.add_cookies(cookies)

    # localStorage write must happen ON the localhost origin, not before nav.
    await page.goto(BASE, wait_until="domcontentloaded")
    if storage_key and session_json:
        await page.evaluate(
            f"window.localStorage.setItem("
            f"{json.dumps(storage_key)}, {json.dumps(session_json)})"
        )

async def audit_route(context, route, errors):
    page = await context.new_page()
    await page.goto(BASE + route, wait_until="domcontentloaded", timeout=45000)
    # If _authenticated bounced us to /auth, the session injection failed —
    # record that as an error and skip the phases (screenshots would be of
    # the sign-in screen, not the CMS).
    landed = page.url
    if "/auth" in landed and route not in ("/auth",):
        errors.append(f"[{route}] auth guard redirected to {landed}; session not honoured")
        await page.close()
        return {"error": "redirected-to-auth", "url": landed}

    await page.wait_for_timeout(1800)  # CMS queries + charts settle

    slug = route.strip("/").replace("/", "-") or "admin-home"
    phases = {}

    await page.evaluate("() => window.scrollTo(0, 0)")
    await page.wait_for_timeout(200)
    m_before = await page.evaluate(MEASURE)
    boxes_before = await measure_boxes(page)
    p_before = OUT / f"{slug}-1-before.png"
    await page.screenshot(path=str(p_before), timeout=15000, animations="disabled")
    phases["before"] = {"metrics": m_before, "screenshot": str(p_before)}

    target_y = max(600, int(m_before["clientHeight"]))
    await page.evaluate(
        "(y) => window.scrollTo({ top: y, behavior: 'smooth' })", target_y
    )
    await page.wait_for_timeout(120)
    m_during = await page.evaluate(MEASURE)
    boxes_during = await measure_boxes(page)
    p_during = OUT / f"{slug}-2-during.png"
    await page.screenshot(path=str(p_during), timeout=15000, animations="disabled")
    phases["during"] = {"metrics": m_during, "screenshot": str(p_during)}

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
                f"[{route}/{phase}] horizontal overflow: "
                f"scrollWidth={mm['scrollWidth']} > clientWidth={mm['clientWidth']}"
            )
        # Same iOS mobile-viewport contract as the public script.
        if mm["scrollbarWidth"] not in ("none", ""):
            errors.append(
                f"[{route}/{phase}] unexpected scrollbar-width={mm['scrollbarWidth']!r} on iOS viewport"
            )
        if mm["scrollbarGutter"] not in ("auto", "", "normal"):
            errors.append(
                f"[{route}/{phase}] unexpected scrollbar-gutter={mm['scrollbarGutter']!r} on iOS viewport"
            )
        if mm["innerLeaks"]:
            errors.append(
                f"[{route}/{phase}] inner CMS scroll container leaks a visible scrollbar: "
                f"{mm['innerLeaks']}"
            )

    assert_scroll_progress(route, m_before["scrollY"], m_during["scrollY"], m_after["scrollY"], errors)
    assert_boxes_stable(route, boxes_before, boxes_during, m_during["scrollY"] - m_before["scrollY"], errors)
    assert_boxes_stable(route, boxes_before, boxes_after, m_after["scrollY"] - m_before["scrollY"], errors)
    assert_cls_ok(route, cls, errors)

    await page.close()
    return phases

async def main():
    auth_status = os.environ.get("LOVABLE_BROWSER_AUTH_STATUS", "no_supabase")
    if auth_status != "injected":
        print(
            f"SKIP — no injected Supabase session (LOVABLE_BROWSER_AUTH_STATUS={auth_status!r}). "
            "Sign into the Lovable preview once to mint a session, then re-run."
        )
        (OUT / "report.json").write_text(json.dumps({"skipped": auth_status}, indent=2))
        return

    report = {}
    errors = []
    async with async_playwright() as p:
        iphone = p.devices["iPhone 13"]
        browser = await p.webkit.launch(headless=True)
        context = await browser.new_context(**iphone, service_workers="block")
        await install_stability_probes(context)
        try:
            page = await context.new_page()
            await restore_supabase_session(context, page)
            await page.close()

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
        print("FAIL — iOS Admin scrollbar / overlay regressions:")
        for e in errors: print("  -", e)
        print(f"\nArtifacts: {OUT}/")
        sys.exit(1)
    for route, phases in report.items():
        if "error" in phases: continue
        m = phases["before"]["metrics"]
        print(f"[{route}] cw={m['clientWidth']} sw={m['scrollWidth']} "
              f"scrollbar-width={m['scrollbarWidth']!r} gutter={m['scrollbarGutter']!r} — OK")
    print(f"\nOK — no overlay/layout drift across {len(ROUTES)} admin routes × 3 scroll phases (iOS Safari)")
    print(f"Artifacts: {OUT}/")

asyncio.run(main())
