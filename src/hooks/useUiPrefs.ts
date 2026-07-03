import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { clampIdleMs, DEFAULT_IDLE_MS } from "@/lib/mobileNavVisibility";

export type UiPrefs = {
  mobile_nav_idle_ms: number;
};

const DEFAULTS: UiPrefs = {
  mobile_nav_idle_ms: DEFAULT_IDLE_MS,
};

/**
 * Reads UI preferences from the `settings` table (key = "ui_prefs").
 * Falls back to sensible defaults if the row is missing or malformed.
 */
export function useUiPrefs() {
  return useQuery({
    queryKey: ["settings", "ui_prefs"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<UiPrefs> => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "ui_prefs")
        .maybeSingle();
      const v = (data?.value ?? {}) as Partial<UiPrefs>;
      return {
        mobile_nav_idle_ms: clampIdleMs(v.mobile_nav_idle_ms ?? DEFAULTS.mobile_nav_idle_ms),
      };
    },
  });
}
