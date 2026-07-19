import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

// In-memory sliding-window rate limiter. Worker instances are short-lived and
// horizontally scaled, so this is a best-effort first line of defence — the
// real guarantee is that public inserts on `leads` are no longer allowed by RLS.
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 3;
const buckets = new Map<string, number[]>();

function rateLimitOk(key: string): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  // Occasional GC of stale keys to keep the map small.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= WINDOW_MS)) buckets.delete(k);
    }
  }
  return true;
}

const leadSchema = z.object({
  type: z.enum(["contact", "quote"]),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).nullable().optional(),
  company: z.string().trim().max(200).nullable().optional(),
  country: z.string().trim().max(120).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  service: z.string().trim().max(120).nullable().optional(),
  project_area: z.string().trim().max(60).nullable().optional(),
  budget_range: z.string().trim().max(60).nullable().optional(),
  start_date: z.string().trim().max(40).nullable().optional(),
  message: z.string().trim().max(2000).nullable().optional(),
  preferred_contact: z.string().trim().max(40).nullable().optional(),
  // Simple honeypot — bots fill hidden fields, humans leave them blank.
  website: z.string().max(0).optional().or(z.literal("")),
});

export const submitLead = createServerFn({ method: "POST" })
  .validator((input: unknown) => leadSchema.parse(input))
  .handler(async ({ data }) => {
    const req = getRequest();
    const ip =
      req?.headers.get("cf-connecting-ip") ||
      req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    if (!rateLimitOk(ip)) {
      throw new Error("Too many submissions. Please try again in a few minutes.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Strip honeypot before insert.
    const { website: _honeypot, ...payload } = data;
    void _honeypot;
    const { error } = await supabaseAdmin.from("leads").insert(payload as never);
    if (error) {
      console.error("[submitLead] insert failed", error);
      throw new Error("Could not save your request. Please try again.");
    }
    return { ok: true as const };
  });
