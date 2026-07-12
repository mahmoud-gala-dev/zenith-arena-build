import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const WINDOW_MS = 30 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const buckets = new Map<string, number[]>();

function rateLimitOk(key: string): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) return false;
  arr.push(now);
  buckets.set(key, arr);
  return true;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const schema = z.object({
  job_id: z.string().uuid().nullable().optional(),
  job_title: z.string().trim().max(200).optional(),
  applicant_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional(),
  cover_letter: z.string().trim().max(3000).optional(),
  cv_filename: z.string().trim().min(1).max(200),
  cv_mime: z.string().trim().max(120),
  cv_base64: z.string().min(10),
  website: z.string().max(0).optional().or(z.literal("")),
});

function b64ToBytes(b64: string): Uint8Array {
  const raw = b64.includes(",") ? b64.split(",", 2)[1] : b64;
  const bin = atob(raw);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const req = getRequest();
    const ip =
      req?.headers.get("cf-connecting-ip") ||
      req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (!rateLimitOk(ip)) throw new Error("Too many submissions. Please try again later.");

    if (!ALLOWED_MIME.has(data.cv_mime)) throw new Error("CV must be a PDF or Word document.");
    const bytes = b64ToBytes(data.cv_base64);
    if (bytes.byteLength > MAX_BYTES) throw new Error("CV must be under 5 MB.");
    if (bytes.byteLength < 100) throw new Error("CV file is empty.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const safeName = data.cv_filename.replace(/[^\w.\-]+/g, "_").slice(-80);
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("applications")
      .upload(path, bytes, { contentType: data.cv_mime, upsert: false });
    if (upErr) {
      console.error("[submitApplication upload]", upErr);
      throw new Error("Could not upload CV. Please try again.");
    }

    const { error: insErr } = await supabaseAdmin.from("job_applications").insert({
      job_id: data.job_id ?? null,
      job_title: data.job_title ?? null,
      applicant_name: data.applicant_name,
      email: data.email.toLowerCase(),
      phone: data.phone ?? null,
      cover_letter: data.cover_letter ?? null,
      cv_url: path,
      status: "new",
    });
    if (insErr) {
      console.error("[submitApplication insert]", insErr);
      throw new Error("Could not save your application. Please try again.");
    }
    return { ok: true as const };
  });
