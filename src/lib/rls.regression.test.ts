/**
 * RLS Regression Tests
 *
 * Exercises each public table against the real Data API using the anon key
 * (and optionally the admin/staff account) to assert expected access.
 *
 * Roles tested:
 * - anon: no auth header session
 * - staff: signed in as super_admin (requires RLS_ADMIN_EMAIL/RLS_ADMIN_PASSWORD env)
 *
 * A test is skipped when its role isn't available. Set:
 *   RLS_ADMIN_EMAIL=admin@egytic.com RLS_ADMIN_PASSWORD=... bunx vitest run rls.regression
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;

// Access expectation per role.
// - "allow_read": SELECT must succeed (rows may be 0; error must NOT be a permission/RLS error)
// - "deny_read":  SELECT must return an error OR zero rows (never leak data)
// - "deny_write": INSERT must fail
type Access = "allow_read" | "deny_read" | "deny_write_only";

interface Expectation {
  table: string;
  anon: Access;
  staff: Access;
  /** Skip write probe on tables where an accidental row would pollute prod. Default true. */
  probeWrite?: boolean;
}

// Curated matrix derived from current RLS policies.
const MATRIX: Expectation[] = [
  // Fully public content
  { table: "services", anon: "allow_read", staff: "allow_read" },
  { table: "service_categories", anon: "allow_read", staff: "allow_read" },
  { table: "products", anon: "allow_read", staff: "allow_read" },
  { table: "product_categories", anon: "allow_read", staff: "allow_read" },
  { table: "projects", anon: "allow_read", staff: "allow_read" },
  { table: "project_categories", anon: "allow_read", staff: "allow_read" },
  { table: "blog_posts", anon: "allow_read", staff: "allow_read" },
  { table: "blog_categories", anon: "allow_read", staff: "allow_read" },
  { table: "pages", anon: "allow_read", staff: "allow_read" },
  { table: "gallery", anon: "allow_read", staff: "allow_read" },
  { table: "governorates", anon: "allow_read", staff: "allow_read" },
  { table: "clients", anon: "allow_read", staff: "allow_read" },
  { table: "certificates", anon: "allow_read", staff: "allow_read" },
  { table: "testimonials", anon: "allow_read", staff: "allow_read" },
  { table: "faq_items", anon: "allow_read", staff: "allow_read" },
  { table: "hero_slides", anon: "allow_read", staff: "allow_read" },
  { table: "homepage_sections", anon: "allow_read", staff: "allow_read" },
  { table: "menus", anon: "allow_read", staff: "allow_read" },
  { table: "tags", anon: "allow_read", staff: "allow_read" },
  { table: "translations", anon: "allow_read", staff: "allow_read" },
  { table: "seo_settings", anon: "allow_read", staff: "allow_read" },
  { table: "settings", anon: "allow_read", staff: "allow_read" },
  { table: "about_content", anon: "allow_read", staff: "allow_read" },
  { table: "downloads", anon: "allow_read", staff: "allow_read" },
  { table: "job_openings", anon: "allow_read", staff: "allow_read" },
  { table: "service_categories", anon: "allow_read", staff: "allow_read" },

  // Sensitive / admin only — anon must NOT read rows
  { table: "leads", anon: "deny_read", staff: "allow_read" },
  { table: "newsletter_subscribers", anon: "deny_read", staff: "allow_read" },
  { table: "job_applications", anon: "deny_read", staff: "allow_read" },
  { table: "audit_logs", anon: "deny_read", staff: "allow_read" },
  { table: "admin_notifications", anon: "deny_read", staff: "allow_read" },
  { table: "profiles", anon: "deny_read", staff: "allow_read" },
  { table: "user_roles", anon: "deny_read", staff: "allow_read" },
  { table: "permissions", anon: "deny_read", staff: "allow_read" },
  { table: "role_permissions", anon: "deny_read", staff: "allow_read" },
  { table: "ai_settings", anon: "deny_read", staff: "allow_read" },
  { table: "ai_usage_logs", anon: "deny_read", staff: "allow_read" },
  { table: "page_versions", anon: "deny_read", staff: "allow_read" },
  { table: "page_preview_tokens", anon: "deny_read", staff: "allow_read" },
  { table: "qa_reports", anon: "deny_read", staff: "allow_read" },
  { table: "qa_report_media", anon: "deny_read", staff: "allow_read" },
  { table: "media_files", anon: "deny_read", staff: "allow_read" },
  { table: "image_versions", anon: "deny_read", staff: "allow_read" },
  { table: "download_events", anon: "deny_read", staff: "allow_read" },
];

const hasEnv = Boolean(URL && ANON);
const adminEmail = process.env.RLS_ADMIN_EMAIL;
const adminPassword = process.env.RLS_ADMIN_PASSWORD;

function makeClient(): SupabaseClient {
  return createClient(URL!, ANON!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isPermissionError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  return (
    err.code === "42501" ||
    err.code === "PGRST301" ||
    msg.includes("permission denied") ||
    msg.includes("row-level security") ||
    msg.includes("not allowed")
  );
}

describe.skipIf(!hasEnv)("RLS regression — anonymous role", () => {
  const anon = hasEnv ? makeClient() : (null as unknown as SupabaseClient);

  for (const row of MATRIX) {
    it(`${row.table}: anon SELECT is ${row.anon}`, async () => {
      const { data, error } = await anon.from(row.table).select("*").limit(1);
      if (row.anon === "allow_read") {
        // Either succeeds, or fails only for a non-permission reason (unlikely).
        if (error) expect(isPermissionError(error)).toBe(false);
        expect(Array.isArray(data) || data === null).toBe(true);
      } else {
        // Must NOT leak rows. Either a permission error, or an empty array.
        const leaked = !error && Array.isArray(data) && data.length > 0;
        expect(leaked, `anon leaked rows from ${row.table}`).toBe(false);
      }
    });
  }

  it("anon cannot INSERT into leads via Data API (must go through server fn)", async () => {
    const { error } = await anon.from("leads").insert({
      type: "contact",
      name: "rls-test",
      email: "rls@test.invalid",
    } as never);
    expect(error).toBeTruthy();
  });

  it("anon cannot INSERT into user_roles (privilege escalation guard)", async () => {
    const { error } = await anon.from("user_roles").insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      role: "super_admin",
    } as never);
    expect(error).toBeTruthy();
  });

  it("anon cannot INSERT into audit_logs", async () => {
    const { error } = await anon
      .from("audit_logs")
      .insert({ action: "x", table_name: "x" } as never);
    expect(error).toBeTruthy();
  });
});

describe.skipIf(!hasEnv || !adminEmail || !adminPassword)(
  "RLS regression — staff (super_admin) role",
  () => {
    const staff = hasEnv ? makeClient() : (null as unknown as SupabaseClient);

    beforeAll(async () => {
      const { error } = await staff.auth.signInWithPassword({
        email: adminEmail!,
        password: adminPassword!,
      });
      if (error) throw new Error(`staff sign-in failed: ${error.message}`);
    });

    for (const row of MATRIX) {
      it(`${row.table}: staff SELECT is ${row.staff}`, async () => {
        const { data, error } = await staff.from(row.table).select("*").limit(1);
        if (row.staff === "allow_read") {
          if (error) expect(isPermissionError(error)).toBe(false);
          expect(Array.isArray(data) || data === null).toBe(true);
        } else {
          const leaked = !error && Array.isArray(data) && data.length > 0;
          expect(leaked).toBe(false);
        }
      });
    }
  },
);
