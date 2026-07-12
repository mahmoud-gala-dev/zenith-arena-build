import { supabase } from "@/integrations/supabase/client";

export type DownloadEventType = "view_index" | "view_detail" | "download";

const seen = new Set<string>();

export async function trackDownloadEvent(
  event_type: DownloadEventType,
  download_id?: string | null,
) {
  if (typeof window === "undefined") return;
  const key = `${event_type}:${download_id ?? ""}:${window.location.pathname}`;
  if (seen.has(key)) return;
  seen.add(key);

  const ref = document.referrer || null;
  let referrer_host: string | null = null;
  try {
    if (ref) referrer_host = new URL(ref).host;
  } catch {
    /* ignore */
  }
  // Treat same-origin referrers as "direct" for the analytics dashboard.
  if (referrer_host && referrer_host === window.location.host) {
    referrer_host = null;
  }

  try {
    await supabase.from("download_events").insert({
      event_type,
      download_id: download_id ?? null,
      path: window.location.pathname + window.location.search,
      referrer: ref,
      referrer_host,
      user_agent: navigator.userAgent.slice(0, 500),
      language: document.documentElement.lang || null,
    });
  } catch {
    /* swallow analytics errors */
  }
}
