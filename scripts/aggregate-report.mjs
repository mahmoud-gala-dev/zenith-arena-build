#!/usr/bin/env node
/**
 * Aggregates every per-script `report.json` under qa-report/* plus the
 * pixelmatch summary (`visual-diff.json`) into a single top-level
 * `qa-report/report.json`. The workflow uploads the whole `qa-report/`
 * directory as an artifact and this file is the human/CI entry point.
 *
 * Exits 1 if any suite reported errors or any pixel diff exceeded the
 * configured ratio, so the CI job fails on drift even if a previous
 * step forgot to propagate its non-zero exit.
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = "qa-report";
if (!existsSync(ROOT)) {
  console.error(`aggregate-report: ${ROOT}/ not found — did the visual scripts run?`);
  process.exit(2);
}

const suites = [];
for (const entry of readdirSync(ROOT)) {
  const dir = join(ROOT, entry);
  if (!statSync(dir).isDirectory()) continue;
  const reportPath = join(dir, "report.json");
  if (!existsSync(reportPath)) continue;
  try {
    suites.push({ suite: entry, ...JSON.parse(readFileSync(reportPath, "utf8")) });
  } catch (err) {
    suites.push({ suite: entry, parse_error: String(err) });
  }
}

let visualDiff = null;
const vdPath = join(ROOT, "visual-diff.json");
if (existsSync(vdPath)) {
  try { visualDiff = JSON.parse(readFileSync(vdPath, "utf8")); }
  catch (err) { visualDiff = { parse_error: String(err) }; }
}

const errorCount = suites.reduce(
  (n, s) => n + (Array.isArray(s.errors) ? s.errors.length : 0), 0,
);
const diffFailed = visualDiff?.failed ?? 0;

const summary = {
  generated_at: new Date().toISOString(),
  commit: process.env.GITHUB_SHA ?? null,
  run_id: process.env.GITHUB_RUN_ID ?? null,
  status: errorCount === 0 && diffFailed === 0 ? "pass" : "fail",
  totals: {
    suites: suites.length,
    assertion_errors: errorCount,
    pixel_diff_failed: diffFailed,
    pixel_diff_passed: visualDiff?.passed ?? 0,
    pixel_diff_seeded: visualDiff?.seeded ?? 0,
  },
  suites,
  pixelmatch: visualDiff,
};

writeFileSync(join(ROOT, "report.json"), JSON.stringify(summary, null, 2));
console.log(
  `aggregate-report: ${summary.status.toUpperCase()} — ` +
  `${suites.length} suites, ${errorCount} assertion errors, ${diffFailed} pixel-diff failures.`,
);

if (summary.status !== "pass") process.exit(1);
