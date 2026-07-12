import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Office = {
  city_en: string;
  city_ar: string;
  country_en: string;
  country_ar: string;
  address_en?: string;
  address_ar?: string;
};

export type ContactInfo = {
  email: string;
  phone: string;
  whatsapp: string;
  hours_en: string;
  hours_ar: string;
  offices: Office[];
};

export type SocialLinks = {
  linkedin: string;
  instagram: string;
  facebook: string;
  x: string;
  youtube: string;
  whatsapp: string;
};

export type BrandName = {
  en: string;
  ar: string;
  tagline_en: string;
  tagline_ar: string;
};

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  email: "hello@egyticsports.com",
  phone: "",
  whatsapp: "",
  hours_en: "Sun–Thu · 9:00–18:00 (GMT+2)",
  hours_ar: "الأحد–الخميس · 9:00–18:00 (توقيت القاهرة)",
  offices: [{ city_en: "Cairo", city_ar: "القاهرة", country_en: "Egypt", country_ar: "مصر" }],
};

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  linkedin: "",
  instagram: "",
  facebook: "",
  x: "",
  youtube: "",
  whatsapp: "",
};

export const DEFAULT_BRAND_NAME: BrandName = {
  en: "Egytic Sports",
  ar: "إيجيتك سبورتس",
  tagline_en: "Sports Construction & Infrastructure",
  tagline_ar: "إنشاءات وبنية تحتية رياضية",
};

export type SeoDefaults = {
  site_name_en: string;
  site_name_ar: string;
  default_title_en: string;
  default_title_ar: string;
  default_description_en: string;
  default_description_ar: string;
  default_og_image_url: string;
  twitter_handle: string;
  theme_color: string;
  author: string;
  title_template_en: string;
  title_template_ar: string;
};

export const DEFAULT_SEO_DEFAULTS: SeoDefaults = {
  site_name_en: "Egytic Sports",
  site_name_ar: "إيجيتك سبورتس",
  default_title_en: "Egytic — Sports Construction & Infrastructure",
  default_title_ar: "إيجيتك — إنشاءات وبنية تحتية رياضية",
  default_description_en:
    "Egytic Sports designs and builds FIFA-grade football pitches, World Athletics tracks, indoor arenas, courts and aquatic centers. Turnkey sports infrastructure engineered to last.",
  default_description_ar:
    "إيجيتك سبورتس تصمم وتنفذ ملاعب كرة قدم بمعايير الفيفا، ومضامير ألعاب قوى معتمدة، وصالات مغلقة وملاعب ومنشآت مائية. بنية تحتية رياضية متكاملة.",
  default_og_image_url: "",
  twitter_handle: "",
  theme_color: "#0b0f19",
  author: "Egytic Sports Infrastructure",
  title_template_en: "{page} — {site}",
  title_template_ar: "{page} — {site}",
};

const FIVE_MIN = 5 * 60 * 1000;

async function fetchSetting<T>(key: string, fallback: T): Promise<T> {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return { ...fallback, ...((data?.value as Partial<T>) ?? {}) } as T;
}

export const contactInfoQueryOptions = queryOptions({
  queryKey: ["settings", "contact_info"],
  queryFn: () => fetchSetting<ContactInfo>("contact_info", DEFAULT_CONTACT_INFO),
  staleTime: FIVE_MIN,
});

export const socialLinksQueryOptions = queryOptions({
  queryKey: ["settings", "social_links"],
  queryFn: () => fetchSetting<SocialLinks>("social_links", DEFAULT_SOCIAL_LINKS),
  staleTime: FIVE_MIN,
});

export const brandNameQueryOptions = queryOptions({
  queryKey: ["settings", "brand_name"],
  queryFn: () => fetchSetting<BrandName>("brand_name", DEFAULT_BRAND_NAME),
  staleTime: FIVE_MIN,
});

export function useContactInfo(): ContactInfo {
  return useQuery(contactInfoQueryOptions).data ?? DEFAULT_CONTACT_INFO;
}

export function useSocialLinks(): SocialLinks {
  return useQuery(socialLinksQueryOptions).data ?? DEFAULT_SOCIAL_LINKS;
}

export function useBrandName(): BrandName {
  return useQuery(brandNameQueryOptions).data ?? DEFAULT_BRAND_NAME;
}

/** Digits-only phone for WhatsApp / tel links. */
export function toWhatsAppNumber(v: string): string {
  return (v || "").replace(/\D+/g, "");
}
