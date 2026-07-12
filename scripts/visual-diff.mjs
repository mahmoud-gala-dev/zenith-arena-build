#!/usr/bin/env node
/**
 * Compare qa-report/**\/*.png against qa-baselines/**\/*.png with pixelmatch.
 *
 * Behavior:
 *  - Baseline missing → seed from current run and warn (first CI run bootstraps).
 *  - Size mismatch → hard fail (can't compare, likely a layout regression).
 *  - diffRatio > THRESHOLD → fail; writes diff PNG next to the current.
 *
 * Env:
 *  PIXELMATCH_THRESHOLD  per-pixel color threshold        (default 0.1)
 *  DIFF_RATIO_MAX        max fraction of pixels changed  (default 0.005 = 0.5%)
 *  QA_DIR                current screenshots root        (default qa-report)
 *  BASELINE_DIR          baseline screenshots root       (default qa-baselines)
 *  UPDATE_BASELINES=1    overwrite baselines from current run (exits 0)
 */
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const QA = process.env.QA_DIR || "qa-report";
const BASE = process.env.BASELINE_DIR || "qa-baselines";
const PIX_THRESHOLD = Number(process.env.PIXELMATCH_THRESHOLD ?? 0.1);
const RATIO_MAX = Number(process.env.DIFF_RATIO_MAX ?? 0.005);
const UPDATE = process.env.UPDATE_BASELINES === "1";

function walkPngs(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walkPngs(p));
    else if (name.endsWith(".png") && !name.endsWith(".diff.png")) out.push(p);
  }
  return out;
}

function ensureDir(f) { mkdirSync(dirname(f), { recursive: true }); }

const currents = walkPngs(QA);
if (currents.length === 0) {
  console.error(`No PNGs under ${QA}/. Run the visual scripts first.`);
  process.exit(2);
}

const results = [];
let failed = 0, seeded = 0;

for (const cur of currents) {
  const rel = relative(QA, cur);
  const base = join(BASE, rel);

  if (UPDATE || !existsSync(base)) {
    ensureDir(base);
    copyFileSync(cur, base);
    seeded++;
    results.push({ file: rel, status: UPDATE ? "updated" : "seeded" });
    continue;
  }

  const a = PNG.sync.read(readFileSync(base));
  const b = PNG.sync.read(readFileSync(cur));
  if (a.width !== b.width || a.height !== b.height) {
    failed++;
    results.push({ file: rel, status: "size-mismatch",
      baseline: `${a.width}x${a.height}`, current: `${b.width}x${b.height}` });
    continue;
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const diffPx = pixelmatch(a.data, b.data, diff.data, a.width, a.height,
    { threshold: PIX_THRESHOLD, includeAA: false });
  const ratio = diffPx / (a.width * a.height);
  const pass = ratio <= RATIO_MAX;
  if (!pass) {
    const diffPath = cur.replace(/\.png$/, ".diff.png");
    writeFileSync(diffPath, PNG.sync.write(diff));
    failed++;
  }
  results.push({
    file: rel, status: pass ? "ok" : "fail",
    diffPixels: diffPx, totalPixels: a.width * a.height, ratio: +ratio.toFixed(6),
  });
}

const summary = {
  qaDir: QA, baselineDir: BASE,
  pixelmatchThreshold: PIX_THRESHOLD, diffRatioMax: RATIO_MAX,
  total: currents.length, seeded, failed, results,
};
mkdirSync(QA, { recursive: true });
writeFileSync(join(QA, "visual-diff.json"), JSON.stringify(summary, null, 2));

const pad = (s, n) => String(s).padEnd(n);
console.log(`\nVisual regression — threshold ${PIX_THRESHOLD}, ratio ≤ ${RATIO_MAX}`);
for (const r of results) {
  const tag = r.status === "ok" ? "OK  "
           : r.status === "seeded" ? "SEED"
           : r.status === "updated" ? "UPD "
           : "FAIL";
  const info = r.ratio != null ? `ratio=${r.ratio}` : (r.status === "size-mismatch" ? `${r.baseline} vs ${r.current}` : "");
  console.log(`  ${tag}  ${pad(r.file, 52)}  ${info}`);
}
console.log(`\n${currents.length} images | seeded ${seeded} | failed ${failed}`);
console.log(`Report: ${join(QA, "visual-diff.json")}`);

if (failed > 0 && !UPDATE) process.exit(1);
if (seeded > 0 && !UPDATE && !process.env.CI_ALLOW_SEED) {
  console.error(`\n${seeded} baseline(s) missing. Commit ${BASE}/ then re-run, or set CI_ALLOW_SEED=1.`);
  process.exit(1);
}
