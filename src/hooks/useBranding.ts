import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LogoMotionConfig = {
  enabled: boolean;
  intensity: number; // 0..100
  speed: number; // 0..100 (higher = faster)
};

export type Branding = {
  logo_light_url: string;
  logo_dark_url: string;
  logo_motion: {
    en: LogoMotionConfig;
    ar: LogoMotionConfig;
  };
};

export const DEFAULT_LOGO_MOTION: LogoMotionConfig = {
  enabled: true,
  intensity: 70,
  speed: 50,
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
      const motion = (v.logo_motion ?? {}) as Partial<Branding["logo_motion"]>;
      return {
        logo_light_url: v.logo_light_url ?? "",
        logo_dark_url: v.logo_dark_url ?? "",
        logo_motion: {
          en: { ...DEFAULT_LOGO_MOTION, ...(motion.en ?? {}) },
          ar: { ...DEFAULT_LOGO_MOTION, ...(motion.ar ?? {}) },
        },
      };
    },
  });
}
