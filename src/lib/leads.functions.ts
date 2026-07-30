import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { rateLimitOk as dbRateLimitOk, requestIp } from "@/lib/security/rate-limit.server";
import { verifyTurnstile } from "@/lib/security/turnstile.server";

// In-memory sliding-window rate limiter. Worker instances are short-lived and
// horizontally scaled, so this is a best-effort first line of defence — the
// real guarantee is that public inserts on `leads` are no longer allowed by RLS.
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 3;
const buckets = new Map<string, number[]>();

function rateLimitOk(key: string, max = MAX_PER_WINDOW): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= max) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= WINDOW_MS)) buckets.delete(k);
    }
  }
  return true;
}

const attributionSchema = {
  utm_source: z.string().trim().max(200).nullable().optional(),
  utm_medium: z.string().trim().max(200).nullable().optional(),
  utm_campaign: z.string().trim().max(200).nullable().optional(),
  utm_term: z.string().trim().max(200).nullable().optional(),
  utm_content: z.string().trim().max(200).nullable().optional(),
  landing_page: z.string().trim().max(400).nullable().optional(),
  referrer: z.string().trim().max(400).nullable().optional(),
  referrer_host: z.string().trim().max(200).nullable().optional(),
};

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
  ...attributionSchema,
  website: z.string().max(0).optional().or(z.literal("")),
  turnstile_token: z.string().max(4096).nullable().optional(),
});


export const submitLead = createServerFn({ method: "POST" })
  .validator((input: unknown) => leadSchema.parse(input))
  .handler(async ({ data }) => {
    const ip = requestIp(getRequest());

    // Layer 1: in-isolate burst guard (cheap). Layer 2: durable DB window.
    if (!rateLimitOk(ip) || !(await dbRateLimitOk(`lead:${ip}`, MAX_PER_WINDOW, WINDOW_MS / 1000))) {
      throw new Error("Too many submissions. Please try again in a few minutes.");
    }

    const captcha = await verifyTurnstile(data.turnstile_token, ip);
    if (!captcha.ok) {
      console.warn("[submitLead] captcha rejected", captcha.reason);
      throw new Error("Verification failed. Please reload the page and try again.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { website: _honeypot, turnstile_token: _captchaToken, ...payload } = data;
    void _captchaToken;
    void _honeypot;
    const { error } = await supabaseAdmin.from("leads").insert(payload as never);
    if (error) {
      console.error("[submitLead] insert failed", error);
      throw new Error("Could not save your request. Please try again.");
    }
    return { ok: true as const };
  });

// -------------------- WhatsApp click tracking --------------------

const waClickSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).nullable().optional(),
  phone: z.string().trim().min(4).max(30),
  service: z.string().trim().max(160).nullable().optional(),
  message: z.string().trim().max(2000).nullable().optional(),
  source: z.string().trim().max(80).default("quote_page"),
  page_url: z.string().trim().max(500).nullable().optional(),
  ...attributionSchema,
  turnstile_token: z.string().max(4096).nullable().optional(),
});


export const logWhatsAppSend = createServerFn({ method: "POST" })
  .validator((input: unknown) => waClickSchema.parse(input))
  .handler(async ({ data }) => {
    const ip = requestIp(getRequest());
    // Allow more WhatsApp clicks than form submits — user may re-open the chat.
    if (!rateLimitOk(`wa:${ip}`, 10) || !(await dbRateLimitOk(`wa:${ip}`, 10, WINDOW_MS / 1000))) {
      return { ok: false as const, reason: "rate_limited" };
    }

    const waCaptcha = await verifyTurnstile(data.turnstile_token, ip);
    if (!waCaptcha.ok) {
      return { ok: false as const, reason: "captcha_failed" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const digits = data.phone.replace(/[^0-9]/g, "");

    // Try to attach to a recent lead (same email or phone in last 7 days).
    let leadId: string | null = null;
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
    const orConds: string[] = [];
    if (data.email) orConds.push(`email.eq.${data.email.toLowerCase()}`);
    if (digits) orConds.push(`phone.ilike.%${digits.slice(-9)}%`);
    if (orConds.length) {
      const { data: found } = await supabaseAdmin
        .from("leads")
        .select("id, whatsapp_thread")
        .or(orConds.join(","))
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(1);
      if (found && found.length > 0) leadId = found[0].id as string;
    }

    const entry = {
      at: now,
      direction: "outgoing" as const,
      channel: "whatsapp" as const,
      body: data.message ?? "",
      source: data.source,
      page_url: data.page_url ?? null,
      via: "web_click" as const,
    };

    if (leadId) {
      const { data: row } = await supabaseAdmin
        .from("leads")
        .select("whatsapp_thread")
        .eq("id", leadId)
        .maybeSingle();
      const thread = Array.isArray((row as { whatsapp_thread?: unknown } | null)?.whatsapp_thread)
        ? ((row as { whatsapp_thread: unknown[] }).whatsapp_thread as unknown[])
        : [];
      const { error } = await supabaseAdmin
        .from("leads")
        .update({
          whatsapp_thread: [...thread, entry],
          whatsapp_last_at: now,
          preferred_contact: "whatsapp",
        } as never)
        .eq("id", leadId);
      if (error) console.error("[logWhatsAppSend] update failed", error);
      return { ok: true as const, leadId, attached: true };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("leads")
      .insert({
        type: "contact",
        status: "new",
        name: data.name,
        email: data.email?.toLowerCase() || `wa-${digits}@no-email.local`,
        phone: data.phone,
        service: data.service ?? null,
        message: data.message ?? null,
        source: data.source,
        intent: "whatsapp",
        preferred_contact: "whatsapp",
        utm_source: data.utm_source ?? null,
        utm_medium: data.utm_medium ?? null,
        utm_campaign: data.utm_campaign ?? null,
        utm_term: data.utm_term ?? null,
        utm_content: data.utm_content ?? null,
        landing_page: data.landing_page ?? null,
        referrer: data.referrer ?? null,
        referrer_host: data.referrer_host ?? null,
        whatsapp_thread: [entry],
        whatsapp_last_at: now,
      } as never)

      .select("id")
      .single();
    if (error) {
      console.error("[logWhatsAppSend] insert failed", error);
      return { ok: false as const, reason: "db_error" };
    }
    return { ok: true as const, leadId: (inserted as { id: string }).id, attached: false };
  });

// -------------------- Admin: append WhatsApp reply / note --------------------

const appendSchema = z.object({
  leadId: z.string().uuid(),
  direction: z.enum(["incoming", "outgoing"]),
  body: z.string().trim().min(1).max(4000),
});

export const appendWhatsAppMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => appendSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    // Only staff may write.
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Forbidden");

    const { data: row, error: readErr } = await supabase
      .from("leads")
      .select("whatsapp_thread")
      .eq("id", data.leadId)
      .maybeSingle();
    if (readErr || !row) throw new Error("Lead not found");

    const thread = Array.isArray((row as { whatsapp_thread?: unknown }).whatsapp_thread)
      ? ((row as { whatsapp_thread: unknown[] }).whatsapp_thread as unknown[])
      : [];
    const now = new Date().toISOString();
    const email = (claims as { email?: string } | null)?.email ?? null;
    const entry = {
      at: now,
      direction: data.direction,
      channel: "whatsapp" as const,
      body: data.body,
      actor_id: userId,
      actor_email: email,
      via: "admin_manual" as const,
    };
    const { error } = await supabase
      .from("leads")
      .update({
        whatsapp_thread: [...thread, entry],
        whatsapp_last_at: now,
      } as never)
      .eq("id", data.leadId);
    if (error) throw new Error(error.message);
    return { ok: true as const, entry };
  });
