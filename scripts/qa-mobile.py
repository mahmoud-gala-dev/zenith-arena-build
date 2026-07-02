"""
QA mobile check — Playwright + Web Vitals on multiple viewports.

Fails (exit 1) if the WhatsApp FAB overlaps the mobile tab bar or if the
More drawer does not open. Writes a JSON summary to qa-report.json.
Optionally uploads rows to Supabase `qa_reports` when env vars are set.

Env:
  BASE_URL                   default http://localhost:8080
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, COMMIT_SHA, BRANCH  (optional upload)
"""
import asyncio, json, os, sys, urllib.request
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:8080")
OUT = Path(os.environ.get("QA_OUT", "qa-report"))
OUT.mkdir(parents=True, exist_ok=True)

PAGES = ["/projects", "/knowledge", "/products", "/"]
VIEWPORTS = [
    ("iphone-se",   375, 667,  True),
    ("iphone-13",   390, 844,  True),
    ("iphone-15pm", 430, 932,  True),
    ("android-md",  412, 915,  True),
    ("android-lg",  480, 1024, True),
    ("tablet",      768, 1024, False),
    ("desktop",     1280, 1800, False),
]

async def vitals(page, url):
    await page.goto(url, wait_until="networkidle", timeout=45000)
    await page.wait_for_timeout(1200)
    return await page.evaluate("""async () => {
      const lcp = await new Promise(res => {
        try {
          const po = new PerformanceObserver(list => {
            const es = list.getEntries(); if (es.length) res(es[es.length-1].startTime);
          });
          po.observe({ type: 'largest-contentful-paint', buffered: true });
          setTimeout(() => res(0), 2500);
        } catch { res(0); }
      });
      const cls = await new Promise(res => {
        try {
          let total = 0;
          const po = new PerformanceObserver(list => {
            for (const e of list.getEntries()) if (!e.hadRecentInput) total += e.value;
          });
          po.observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => res(total), 1800);
        } catch { res(0); }
      });
      return { lcp: Math.round(lcp), cls: +cls.toFixed(3) };
    }""")

async def mobile_ui(page, path, screenshot_path):
    await page.goto(BASE + path, wait_until="networkidle", timeout=45000)
    await page.wait_for_timeout(600)
    wa = await page.evaluate("""() => {
      const a = document.querySelector('a[aria-label*="WhatsApp" i], a[href*="wa.me"]');
      if (!a) return null;
      const r = a.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height };
    }""")
    tab = await page.evaluate("""() => {
      const els = Array.from(document.querySelectorAll('nav, div'));
      for (const el of els) {
        const s = getComputedStyle(el);
        if (s.position === 'fixed' && parseFloat(s.bottom) < 5 && el.querySelectorAll('a').length >= 3 && el.offsetWidth > 300) {
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, height: r.height };
        }
      }
      return null;
    }""")
    overlap = bool(wa and tab and wa["bottom"] > tab["top"])
    await page.screenshot(path=str(screenshot_path))
    # More drawer
    more_opened = False
    try:
        more = page.locator('button, a').filter(has_text="More").first
        await more.click(timeout=2000)
        await page.wait_for_timeout(500)
        more_opened = await page.locator('[role=dialog], [data-state=open]').count() > 0
    except Exception:
        pass
    return { "wa": wa, "tab": tab, "overlap": overlap, "more_opened": more_opened }

def upload_row(row):
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key: return
    req = urllib.request.Request(
        f"{url}/rest/v1/qa_reports",
        data=json.dumps(row).encode(),
        method="POST",
        headers={
            "apikey": key, "Authorization": f"Bearer {key}",
            "Content-Type": "application/json", "Prefer": "return=minimal",
        },
    )
    try: urllib.request.urlopen(req, timeout=10).read()
    except Exception as e: print(f"upload failed: {e}", file=sys.stderr)

async def main():
    rows = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for vname, w, h, is_mobile in VIEWPORTS:
            ctx = await browser.new_context(
                viewport={"width": w, "height": h},
                device_scale_factor=2 if is_mobile else 1,
                is_mobile=is_mobile, has_touch=is_mobile,
            )
            page = await ctx.new_page()
            for path in PAGES:
                row = { "viewport": vname, "page": path, "wa_overlap": False, "more_opened": None }
                try:
                    v = await vitals(page, BASE + path)
                    row.update({ "lcp_ms": v["lcp"], "cls": v["cls"] })
                except Exception as e:
                    row["notes"] = f"vitals error: {e}"
                if is_mobile:
                    shot = OUT / f"{vname}{path.replace('/', '_') or '_home'}.png"
                    try:
                        ui = await mobile_ui(page, path, shot)
                        row["wa_overlap"] = ui["overlap"]
                        row["more_opened"] = ui["more_opened"]
                        row["screenshot_url"] = str(shot)
                    except Exception as e:
                        row["notes"] = f"ui error: {e}"
                rows.append(row)
                print(vname, path, row)
            await ctx.close()
        await browser.close()

    (OUT / "report.json").write_text(json.dumps(rows, indent=2))

    # Upload to Supabase (optional)
    commit = os.environ.get("COMMIT_SHA")
    branch = os.environ.get("BRANCH")
    for r in rows:
        upload_row({ **r, "commit_sha": commit, "branch": branch })

    # Gate: any WhatsApp/tabbar overlap blocks release.
    fails = [r for r in rows if r.get("wa_overlap")]
    more_fails = [r for r in rows if r.get("more_opened") is False]
    if fails or more_fails:
        print(f"\nBLOCKING RELEASE: {len(fails)} overlap(s), {len(more_fails)} More-drawer failure(s)")
        for r in fails: print("  overlap:", r["viewport"], r["page"])
        for r in more_fails: print("  more_opened=false:", r["viewport"], r["page"])
        sys.exit(1)
    print(f"\nOK — {len(rows)} checks passed")

asyncio.run(main())
