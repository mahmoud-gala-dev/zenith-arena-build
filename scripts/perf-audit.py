#!/usr/bin/env python3
"""
Performance audit for Projects / Products / Knowledge / Gallery across
mobile / tablet / desktop. Measures LCP, CLS, layout overflow, and
console errors. Writes /tmp/perf-audit/report.{md,json}.

Requires: dev server at http://localhost:8080. Playwright is preinstalled
in the sandbox — no extra setup needed.

    python3 scripts/perf-audit.py
"""
import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get("PERF_BASE_URL", "http://localhost:8080")
OUT = Path("/tmp/perf-audit")
OUT.mkdir(parents=True, exist_ok=True)

ROUTES = [
    ("projects",  "/projects"),
    ("products",  "/products"),
    ("knowledge", "/knowledge"),
    ("gallery",   "/gallery"),
]
VIEWPORTS = [
    ("mobile",  375, 812),
    ("tablet",  768, 1024),
    ("desktop", 1280, 900),
]

MEASURE_JS = r"""
() => new Promise((resolve) => {
  let cls = 0, lcp = 0;
  try {
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(list => {
      const es = list.getEntries();
      if (es.length) lcp = es[es.length - 1].startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {}
  setTimeout(() => {
    const de = document.documentElement;
    resolve({
      lcp: Math.round(lcp),
      cls: Number(cls.toFixed(4)),
      overflow: Math.max(0, de.scrollWidth - de.clientWidth),
    });
  }, 3500);
})
"""


def rate(metric, v):
    if metric == "lcp":
        return "good" if v < 2500 else "needs" if v < 4000 else "poor"
    if metric == "cls":
        return "good" if v < 0.1 else "needs" if v < 0.25 else "poor"
    return "n/a"


async def main():
    results = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        for vp_name, w, h in VIEWPORTS:
            ctx = await browser.new_context(viewport={"width": w, "height": h})
            page = await ctx.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            await page.goto(BASE)
            await page.evaluate("sessionStorage.setItem('apex-splash-seen','1')")
            for r_name, path in ROUTES:
                errors.clear()
                await page.goto(BASE + path, wait_until="load")
                m = await page.evaluate(MEASURE_JS)
                results.append({
                    "viewport": vp_name,
                    "route": path,
                    "lcp": m["lcp"],
                    "lcp_rating": rate("lcp", m["lcp"]),
                    "cls": m["cls"],
                    "cls_rating": rate("cls", m["cls"]),
                    "overflow_px": m["overflow"],
                    "errors": len(errors),
                })
            await ctx.close()
        await browser.close()

    md = [
        "# Performance audit",
        "",
        "| Viewport | Route | LCP (ms) | LCP | CLS | CLS | Overflow | Errors |",
        "|---|---|---:|:--:|---:|:--:|---:|---:|",
    ]
    for r in results:
        md.append(
            f"| {r['viewport']} | {r['route']} | {r['lcp']} | {r['lcp_rating']} "
            f"| {r['cls']} | {r['cls_rating']} | {r['overflow_px']}px | {r['errors']} |"
        )
    md_text = "\n".join(md)
    (OUT / "report.json").write_text(json.dumps(results, indent=2))
    (OUT / "report.md").write_text(md_text)
    print(md_text)
    print(f"\nWritten to {OUT}/report.md and {OUT}/report.json")


asyncio.run(main())
