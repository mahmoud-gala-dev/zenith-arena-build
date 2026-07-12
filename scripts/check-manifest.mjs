#!/usr/bin/env node
/**
 * Manifest sanity checker.
 *
 * Reads public/manifest.webmanifest and asserts:
 *   • JSON is valid
 *   • start_url and scope are present, absolute-from-root, and start_url ⊂ scope
 *   • every icon `src` exists on disk under public/, has non-zero size,
 *     declared MIME roughly matches the extension, and PNG icons whose
 *     `sizes` is `WxH` actually decode to that pixel size
 *   • every shortcut has name + url + points at a known route file under
 *     src/routes/ (index.tsx or matching leaf)
 *
 * Exit code 0 on success, 1 on any failure. Run with `node scripts/check-manifest.mjs`.
 */
import { readFileSync, statSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, extname } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const PUBLIC = join(ROOT, "public");
const ROUTES = join(ROOT, "src/routes");
const MANIFEST_PATH = join(PUBLIC, "manifest.webmanifest");

const problems = [];
const ok = [];
const fail = (msg) => problems.push(msg);
const pass = (msg) => ok.push(msg);

// ---------- load ----------
if (!existsSync(MANIFEST_PATH)) {
  console.error("✗ public/manifest.webmanifest not found");
  process.exit(1);
}
let raw;
try {
  raw = readFileSync(MANIFEST_PATH, "utf8");
} catch (e) {
  console.error("✗ cannot read manifest:", e.message);
  process.exit(1);
}
let manifest;
try {
  manifest = JSON.parse(raw);
  pass("manifest is valid JSON");
} catch (e) {
  console.error("✗ manifest is not valid JSON:", e.message);
  process.exit(1);
}

// ---------- start_url / scope ----------
const scope = manifest.scope;
const startUrl = manifest.start_url;
if (typeof scope !== "string" || !scope.startsWith("/")) {
  fail(`scope must be an absolute path starting with "/", got ${JSON.stringify(scope)}`);
} else {
  pass(`scope = ${scope}`);
}
if (typeof startUrl !== "string" || !startUrl.startsWith("/")) {
  fail(`start_url must be an absolute path starting with "/", got ${JSON.stringify(startUrl)}`);
} else {
  // strip query/hash before scope containment check
  const startPath = startUrl.split("?")[0].split("#")[0] || "/";
  if (typeof scope === "string" && !startPath.startsWith(scope)) {
    fail(`start_url path ${startPath} is outside scope ${scope}`);
  } else {
    pass(`start_url = ${startUrl} (within scope)`);
  }
}
if (manifest.id && typeof manifest.id === "string" && !manifest.id.startsWith("/")) {
  fail(`id should start with "/", got ${JSON.stringify(manifest.id)}`);
}

// ---------- icons ----------
const MIME = { ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".ico": "image/x-icon" };
const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
if (!icons.length) fail("manifest has no icons");

// tiny PNG dimension reader — reads IHDR at bytes 16..23
function readPngSize(path) {
  const buf = readFileSync(path);
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

for (const icon of icons) {
  const label = `icon ${JSON.stringify(icon.src)}`;
  if (typeof icon.src !== "string" || !icon.src.startsWith("/")) {
    fail(`${label}: src must be an absolute path starting with "/"`);
    continue;
  }
  const file = join(PUBLIC, icon.src.slice(1));
  if (!existsSync(file)) {
    fail(`${label}: file not found at public${icon.src}`);
    continue;
  }
  const size = statSync(file).size;
  if (size === 0) {
    fail(`${label}: file is empty`);
    continue;
  }
  const ext = extname(file).toLowerCase();
  const expected = MIME[ext];
  if (icon.type && expected && icon.type !== expected) {
    fail(`${label}: declared type "${icon.type}" does not match extension ${ext} (${expected})`);
    continue;
  }
  // For PNG icons whose sizes is "WxH", verify actual pixel dimensions.
  if (ext === ".png" && typeof icon.sizes === "string" && /^\d+x\d+$/.test(icon.sizes)) {
    const [w, h] = icon.sizes.split("x").map(Number);
    const actual = readPngSize(file);
    if (!actual) {
      fail(`${label}: not a valid PNG`);
      continue;
    }
    if (actual.w !== w || actual.h !== h) {
      fail(`${label}: declared ${w}x${h} but file is ${actual.w}x${actual.h}`);
      continue;
    }
  }
  pass(`${label} (${size} bytes${icon.purpose ? `, purpose=${icon.purpose}` : ""})`);
}

// require at least one maskable and one any-purpose icon (recommended)
const purposes = icons.flatMap((i) => (typeof i.purpose === "string" ? i.purpose.split(/\s+/) : ["any"]));
if (!purposes.includes("any")) fail("no icon has purpose=any");
if (!purposes.includes("maskable")) fail("no icon has purpose=maskable (Android adaptive icons need this)");

// ---------- shortcuts ----------
// Build a set of routes that exist under src/routes/. We treat the file basename
// (minus the .tsx) as the route segment, so /projects matches projects.tsx,
// /quote matches quote.tsx, and /admin matches admin/index.tsx or admin.tsx.
function collectRoutes(dir, prefix = "") {
  const out = new Set();
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const name = entry.name;
    if (entry.isDirectory()) {
      for (const r of collectRoutes(join(dir, name), `${prefix}/${name}`)) out.add(r);
      continue;
    }
    if (!name.endsWith(".tsx")) continue;
    const base = name.replace(/\.tsx$/, "");
    if (base === "__root" || base.startsWith("-")) continue;
    if (base === "index") {
      out.add(prefix || "/");
    } else {
      // flat dot convention: `projects.$slug` → `/projects/:slug`
      const path = base
        .split(".")
        .map((seg) => (seg.startsWith("$") ? `:${seg.slice(1)}` : seg))
        .join("/");
      out.add(`${prefix}/${path}`);
    }
  }
  return out;
}

const routeSet = collectRoutes(ROUTES);
// normalize (strip trailing slash except "/")
const knownRoutes = new Set(
  Array.from(routeSet).map((r) => (r.length > 1 && r.endsWith("/") ? r.slice(0, -1) : r)),
);

const shortcuts = Array.isArray(manifest.shortcuts) ? manifest.shortcuts : [];
for (const sc of shortcuts) {
  const label = `shortcut ${JSON.stringify(sc.name || sc.url)}`;
  if (!sc.name || typeof sc.name !== "string") fail(`${label}: missing name`);
  if (typeof sc.url !== "string" || !sc.url.startsWith("/")) {
    fail(`${label}: url must be an absolute path starting with "/"`);
    continue;
  }
  const path = sc.url.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  // exact match, or a dynamic parent (e.g. /projects matches /projects/:slug parent /projects)
  const matches = knownRoutes.has(path);
  if (!matches) {
    fail(`${label}: url ${sc.url} does not match any route in src/routes/`);
    continue;
  }
  if (typeof scope === "string" && !path.startsWith(scope)) {
    fail(`${label}: url ${sc.url} is outside scope ${scope}`);
    continue;
  }
  pass(`${label} → ${sc.url}`);
}

// ---------- report ----------
console.log(`\n✓ ${ok.length} checks passed`);
for (const line of ok) console.log(`  · ${line}`);
if (problems.length) {
  console.log(`\n✗ ${problems.length} problems:`);
  for (const line of problems) console.log(`  · ${line}`);
  process.exit(1);
}
console.log("\nmanifest.webmanifest looks good.");
