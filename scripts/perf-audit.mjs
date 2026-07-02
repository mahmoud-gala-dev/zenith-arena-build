#!/usr/bin/env node
/**
 * Performance audit for Projects / Products / Knowledge across 3 viewports.
 * Measures LCP, CLS, layout overflow, and console errors. Writes a report.
 *
 * Run:   node scripts/perf-audit.mjs
 * Requires the dev server at http://localhost:8080 and Playwright installed.
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = process.env.PERF_BASE_URL ?? "http://localhost:8080";
const OUT = "/tmp/perf-audit";
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  { name: "projects", path: "/projects" },
  { name: "products", path: "/products" },
  { name: "knowledge", path: "/knowledge" },
  { name: "gallery", path: "/gallery" },
];

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
];

const measure = `
  new Promise((resolve) => {
    let cls = 0;
    let lcp = 0;
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) lcp = last.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch (e) {}
    setTimeout(() => {
      const de = document.documentElement;
      const overflow = Math.max(0, de.scrollWidth - de.clientWidth);
      resolve({ lcp: Math.round(lcp), cls: Number(cls.toFixed(4)), overflow });
    }, 3500);
  })
`;

const rate = (metric, value) => {
  if (metric === "lcp") return value < 2500 ? "good" : value < 4000 ? "needs-improvement" : "poor";
  if (metric === "cls") return value < 0.1 ? "good" : value < 0.25 ? "needs-improvement" : "poor";
  return "n/a";
};

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    // Skip splash to avoid inflating LCP
    await page.goto(BASE);
    await page.evaluate(() => sessionStorage.setItem("apex-splash-seen", "1"));
    for (const r of ROUTES) {
      errors.length = 0;
      await page.goto(BASE + r.path, { waitUntil: "load" });
      const m = await page.evaluate(measure);
      results.push({
        viewport: vp.name,
        route: r.path,
        lcp: m.lcp,
        lcp_rating: rate("lcp", m.lcp),
        cls: m.cls,
        cls_rating: rate("cls", m.cls),
        overflow_px: m.overflow,
        errors: errors.length,
      });
    }
    await ctx.close();
  }
  await browser.close();

  const md = [
    "# Performance audit",
    "",
    "| Viewport | Route | LCP (ms) | LCP | CLS | CLS | Overflow | Errors |",
    "|---|---|---:|:--:|---:|:--:|---:|---:|",
    ...results.map((r) =>
      `| ${r.viewport} | ${r.route} | ${r.lcp} | ${r.lcp_rating} | ${r.cls} | ${r.cls_rating} | ${r.overflow_px}px | ${r.errors} |`,
    ),
  ].join("\n");

  writeFileSync(`${OUT}/report.json`, JSON.stringify(results, null, 2));
  writeFileSync(`${OUT}/report.md`, md);
  console.log(md);
  console.log(`\nWritten to ${OUT}/report.md and ${OUT}/report.json`);
})();
