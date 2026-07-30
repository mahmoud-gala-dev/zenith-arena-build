/**
 * Deterministic lead scoring (0–100).
 *
 * Runs client-side over data we already store, so it costs nothing and stays
 * explainable: sales can see exactly which signals lifted or dropped a lead.
 * Higher = closer to a real, funded project worth calling first.
 */

export type ScorableLead = {
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  service?: string | null;
  budget_range?: string | null;
  project_area?: string | null;
  start_date?: string | null;
  type?: string | null;
  intent?: string | null;
  preferred_contact?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer_host?: string | null;
  deal_value_expected?: number | string | null;
  whatsapp_last_at?: string | null;
  created_at?: string | null;
};

export type LeadScore = {
  score: number;
  band: "hot" | "warm" | "cold";
  reasons: string[];
};

const FREE_MAIL = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com",
  "icloud.com", "aol.com", "proton.me", "protonmail.com", "yandex.com",
];

/** Rough EGP magnitude parsed out of a free-text budget range. */
function budgetMagnitude(v?: string | null): number {
  if (!v) return 0;
  const nums = v.replace(/,/g, "").match(/\d+(?:\.\d+)?/g);
  if (!nums) return 0;
  const max = Math.max(...nums.map(Number));
  const lower = v.toLowerCase();
  if (/m|مليون/.test(lower)) return max * 1_000_000;
  if (/k|ألف|الف/.test(lower)) return max * 1_000;
  return max;
}

function num(v: number | string | null | undefined): number {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  return Number.isFinite(n as number) ? (n as number) : 0;
}

export function scoreLead(l: ScorableLead): LeadScore {
  let score = 0;
  const reasons: string[] = [];
  const add = (pts: number, why: string) => {
    score += pts;
    reasons.push(`${pts > 0 ? "+" : ""}${pts} ${why}`);
  };

  // --- Contactability -------------------------------------------------------
  const digits = (l.phone ?? "").replace(/\D/g, "");
  if (digits.length >= 7) add(15, "phone number provided");
  else add(-10, "no phone number");

  const domain = (l.email ?? "").split("@")[1]?.toLowerCase() ?? "";
  if (domain && !FREE_MAIL.includes(domain)) add(12, "business email domain");
  if (l.company?.trim()) add(8, "company named");

  // --- Budget & project size ------------------------------------------------
  const declared = num(l.deal_value_expected);
  const budget = declared || budgetMagnitude(l.budget_range);
  if (budget >= 3_000_000) add(25, "budget ≥ 3M");
  else if (budget >= 1_000_000) add(18, "budget ≥ 1M");
  else if (budget >= 300_000) add(10, "budget ≥ 300K");
  else if (l.budget_range?.trim()) add(4, "budget indicated");

  const area = Number((l.project_area ?? "").replace(/[^\d.]/g, ""));
  if (Number.isFinite(area) && area >= 1000) add(8, "large site (≥1000 m²)");
  else if (Number.isFinite(area) && area >= 200) add(4, "site size given");

  // --- Intent ---------------------------------------------------------------
  if (l.type === "quote" || l.intent === "quote") add(15, "asked for a quote");
  if (l.intent === "whatsapp" || l.preferred_contact === "whatsapp" || l.whatsapp_last_at) add(8, "engaged on WhatsApp");
  if (l.service?.trim()) add(5, "specific service selected");

  const msg = (l.message ?? "").trim();
  if (msg.length >= 200) add(8, "detailed brief");
  else if (msg.length >= 40) add(4, "wrote a real message");
  else if (msg.length === 0) add(-5, "no message");

  // --- Timeline -------------------------------------------------------------
  if (l.start_date) {
    const days = (new Date(l.start_date).getTime() - Date.now()) / 86_400_000;
    if (Number.isFinite(days)) {
      if (days <= 90) add(12, "starts within 3 months");
      else if (days <= 180) add(6, "starts within 6 months");
    }
  }

  // --- Channel quality ------------------------------------------------------
  const paid = /cpc|ppc|paid|ads?/.test((l.utm_medium ?? "").toLowerCase());
  if (paid) add(6, "paid campaign click");
  else if (l.utm_source || l.referrer_host) add(3, "attributed channel");

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band: LeadScore["band"] = clamped >= 65 ? "hot" : clamped >= 40 ? "warm" : "cold";
  return { score: clamped, band, reasons };
}

export const BAND_STYLES: Record<LeadScore["band"], string> = {
  hot: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  warm: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  cold: "bg-secondary text-muted-foreground border-border",
};
