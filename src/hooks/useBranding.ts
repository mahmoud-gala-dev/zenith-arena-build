import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Branding = {
  logo_light_url: string;
  logo_dark_url: string;
};

export function useBranding() {
  return useQuery({
    queryKey: ["settings", "branding"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Branding> => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "branding")
        .maybeSingle();
      const v = (data?.value ?? {}) as Partial<Branding>;
      return {
        logo_light_url: v.logo_light_url ?? "",
        logo_dark_url: v.logo_dark_url ?? "",
      };
    },
  });
}
