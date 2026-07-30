/**
 * Revenue attribution capture.
 *
 * Captures UTM parameters, referrer and landing page on the visitor's FIRST
 * page view of a session and keeps them in sessionStorage, so any lead
 * submitted later in the same visit carries the channel that produced it.
 *
 * SSR-safe: every function no-ops (returns an empty payload) on the server.
 */

export type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  landing_page: string | null;
  referrer: string | null;
  referrer_host: string | null;
};

const STORAGE_KEY = "egytic.attribution.v1";

const EMPTY: Attribution = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_term: null,
  utm_content: null,
  landing_page: null,
  referrer: null,
  referrer_host: null,
};

function clean(v: string | null | undefined, max = 200): string | null {
  const s = (v ?? "").toString().trim();
  if (!s) return null;
  return s.slice(0, max);
}

/** Infer a channel label when no UTM tags are present (organic search, social…). */
function inferSource(referrerHost: string | null): string | null {
  if (!referrerHost) return null;
  const h = referrerHost.toLowerCase();
  if (h.includes("google")) return "google";
  if (h.includes("bing")) return "bing";
  if (h.includes("facebook") || h.includes("fb.")) return "facebook";
  if (h.includes("instagram")) return "instagram";
  if (h.includes("linkedin")) return "linkedin";
  if (h.includes("t.co") || h.includes("twitter") || h.includes("x.com")) return "twitter";
  if (h.includes("youtube")) return "youtube";
  if (h.includes("wa.me") || h.includes("whatsapp")) return "whatsapp";
  if (h.includes("tiktok")) return "tiktok";
  return h;
}

/**
 * Capture attribution once per session. Later calls return the stored value
 * unless the current URL carries fresh UTM tags (a new campaign click),
 * in which case the stored value is overwritten.
 */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY;

  let stored: Attribution | null = null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) stored = { ...EMPTY, ...(JSON.parse(raw) as Partial<Attribution>) };
  } catch {
    /* storage blocked — fall through to a fresh read */
  }

  const params = new URLSearchParams(window.location.search);
  const fresh: Attribution = {
    utm_source: clean(params.get("utm_source")),
    utm_medium: clean(params.get("utm_medium")),
    utm_campaign: clean(params.get("utm_campaign")),
    utm_term: clean(params.get("utm_term")),
    utm_content: clean(params.get("utm_content")),
    landing_page: clean(window.location.pathname + window.location.search, 400),
    referrer: clean(document.referrer, 400),
    referrer_host: null,
  };

  try {
    if (fresh.referrer) {
      const host = new URL(fresh.referrer).hostname;
      // Ignore same-origin referrers — they are internal navigation, not a channel.
      fresh.referrer_host = host && host !== window.location.hostname ? host : null;
      if (!fresh.referrer_host) fresh.referrer = null;
    }
  } catch {
    fresh.referrer_host = null;
  }

  if (!fresh.utm_source) fresh.utm_source = inferSource(fresh.referrer_host);

  const hasFreshCampaign = Boolean(
    params.get("utm_source") || params.get("utm_campaign") || params.get("utm_medium"),
  );

  const next = stored && !hasFreshCampaign ? stored : fresh;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  return next;
}

/** Read the stored attribution without re-capturing (SSR-safe). */
export function getAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY;
  return captureAttribution();
}
