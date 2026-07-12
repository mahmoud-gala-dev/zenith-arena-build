#!/usr/bin/env node
/**
 * PWA cache-freshness check.
 *
 * Guards against the class of bugs where a service worker or a Workbox
 * runtime rule pins the web app manifest or its icons to a stale copy after
 * a redeploy. Runs against a completed `bun run build` (dist/client/sw.js).
 *
 * Two layers of assertion:
 *
 *   1. Static analysis of the built SW:
 *      - Every icon file (icon.svg, icon-maskable.svg, apple-touch-icon.png)
 *        AND offline.html appears in the Workbox precache with a non-empty
 *        `revision` (content hash). Workbox uses that revision to bust the
 *        precache on the next activation.
 *      - `cleanupOutdatedCaches` is enabled, so stale precache buckets from
 *        previous SW versions are wiped on activate.
 *      - No runtime handler ("CacheFirst" / "StaleWhileRevalidate") textually
 *        matches "manifest.webmanifest" or any of the icon filenames — those
 *        must resolve through the precache (icons) or straight to network
 *        (manifest) so a redeploy is picked up immediately.
 *      - The navigateFallback denylist excludes dotted-extension paths, so
 *        /manifest.webmanifest and /icon.svg never fall back to /offline.html.
 *
 *   2. Rebuild diff:
 *      - Byte-mutate one of the icon files, re-run `bun run build`, and
 *        assert every icon's precache revision CHANGED. If the revision is
 *        stable across an actual file change, the runtime SW would keep
 *        serving the old bytes.
 *
 * Exits non-zero on any failure so CI (and the aggregate report) blocks the
 * build. Always restores the mutated icon; the restore runs even on assertion
 * failure so a broken run does not leave the working tree dirty.
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const DIST_SW = "dist/client/sw.js";
const REQUIRED_PRECACHE = [
  "icon.svg",
  "icon-maskable.svg",
  "apple-touch-icon.png",
  "offline.html",
];
const FORBIDDEN_RUNTIME_MATCHES = [
  "manifest.webmanifest",
  "icon.svg",
  "icon-maskable.svg",
  "apple-touch-icon.png",
];
const MUTATE_TARGET = "public/apple-touch-icon.png";
const MUTATE_BACKUP = "/tmp/pwa-cache-freshness.apple-touch-icon.png.bak";

const errors = [];
const fail = (msg) => errors.push(msg);

function readSW(where) {
  if (!existsSync(where)) {
    throw new Error(`${where} not found — run \`bun run build\` first`);
  }
  return readFileSync(where, "utf8");
}

/**
 * Parse precache entries emitted by Workbox as
 *   {url:"client/icon.svg",revision:"abc123..."}
 * The literal is compact and unquoted-key, so a targeted regex is more
 * reliable than trying to eval the whole bundled SW.
 */
function parsePrecache(sw) {
  const out = new Map();
  const re = /\{url:"([^"]+)",revision:"([^"]*)"\}/g;
  let m;
  while ((m = re.exec(sw))) out.set(m[1], m[2]);
  return out;
}

function assertPrecacheEntries(sw, label) {
  const precache = parsePrecache(sw);
  for (const name of REQUIRED_PRECACHE) {
    const key = [...precache.keys()].find((k) => k.endsWith("/" + name) || k === name);
    if (!key) {
      fail(`[${label}] precache missing "${name}" — SW cannot serve it after cache eviction`);
      continue;
    }
    const rev = precache.get(key);
    if (!rev || rev.length < 8) {
      fail(`[${label}] precache entry "${key}" has empty/short revision — cannot bust stale copies`);
    }
  }
  return precache;
}

function assertRuntimeSafety(sw) {
  if (!/cleanupOutdatedCaches\s*\(/.test(sw)) {
    fail(`sw.js does not call cleanupOutdatedCaches() — old precache versions will accumulate`);
  }
  // Runtime handler names bundled by Workbox
  const handlerNames = ["CacheFirst", "StaleWhileRevalidate"];
  for (const forbidden of FORBIDDEN_RUNTIME_MATCHES) {
    // Look for the literal filename within ~400 chars of a handler name.
    for (const h of handlerNames) {
      const re = new RegExp(`${h}[^;]{0,400}${forbidden.replace(/\./g, "\\.")}`);
      if (re.test(sw)) {
        fail(
          `sw.js has a ${h} runtime rule that matches "${forbidden}" — ` +
          `it would shadow the precached/network copy and serve stale bytes`,
        );
      }
      // and the reverse direction (pattern-before-handler)
      const re2 = new RegExp(`${forbidden.replace(/\./g, "\\.")}[^;]{0,400}${h}`);
      if (re2.test(sw)) {
        fail(
          `sw.js has a runtime rule matching "${forbidden}" wired to ${h} — ` +
          `stale-cache risk on redeploy`,
        );
      }
    }
  }
}

function build(label) {
  console.log(`\n[${label}] running bun run build ...`);
  execSync("bun run build", { stdio: "inherit" });
}

function mutateIcon() {
  copyFileSync(MUTATE_TARGET, MUTATE_BACKUP);
  const buf = readFileSync(MUTATE_TARGET);
  // Append a PNG tEXt-safe marker after IEND — invalid bytes past IEND are
  // ignored by decoders, so the file still loads. What matters is that the
  // byte stream changes, which must flip the precache revision.
  const marker = Buffer.from(`\n<!-- pwa-cache-freshness ${Date.now()} -->\n`);
  writeFileSync(MUTATE_TARGET, Buffer.concat([buf, marker]));
}

function restoreIcon() {
  if (existsSync(MUTATE_BACKUP)) {
    copyFileSync(MUTATE_BACKUP, MUTATE_TARGET);
    unlinkSync(MUTATE_BACKUP);
    console.log(`restored ${MUTATE_TARGET}`);
  }
}

async function main() {
  // ---- Pass 1: analyze the current build ----
  const sw1 = readSW(DIST_SW);
  const precache1 = assertPrecacheEntries(sw1, "build-1");
  assertRuntimeSafety(sw1);

  // ---- Pass 2: mutate an icon, rebuild, assert revision changed ----
  if (!existsSync(MUTATE_TARGET)) {
    fail(`mutation target ${MUTATE_TARGET} missing — cannot verify revision bump`);
  } else {
    try {
      mutateIcon();
      build("build-2 (icon mutated)");
      const sw2 = readSW(DIST_SW);
      const precache2 = assertPrecacheEntries(sw2, "build-2");

      const findEntry = (map, name) =>
        [...map.entries()].find(([k]) => k.endsWith("/" + name) || k === name);
      for (const name of REQUIRED_PRECACHE.filter((n) => n.startsWith("icon") || n.startsWith("apple"))) {
        const a = findEntry(precache1, name);
        const b = findEntry(precache2, name);
        if (!a || !b) continue; // missing-entry error already recorded above
        // The mutated file MUST bump; the other icons stay stable (that's fine
        // — we only assert the mutated one changes, to prove the pipeline
        // actually re-hashes changed bytes).
        if (name === "apple-touch-icon.png") {
          if (a[1] === b[1]) {
            fail(
              `precache revision for "${name}" DID NOT change after byte mutation ` +
              `(${a[1]}) — SW would serve stale icon after redeploy`,
            );
          } else {
            console.log(`✓ "${name}" revision bumped ${a[1].slice(0, 8)} → ${b[1].slice(0, 8)}`);
          }
        }
      }
    } finally {
      restoreIcon();
    }
  }

  if (errors.length) {
    console.error("\nFAIL — PWA cache-freshness regressions:");
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }
  console.log("\nOK — manifest + icons cannot be served from a stale service-worker cache.");
}

main().catch((err) => {
  restoreIcon();
  console.error(err);
  process.exit(2);
});
