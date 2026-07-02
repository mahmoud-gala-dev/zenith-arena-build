import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const FIVE_MIN = 5 * 60 * 1000;
const HALF_HOUR = 30 * 60 * 1000;

export type Gov = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  logo_url: string | null;
  region_en: string | null;
  region_ar: string | null;
};

export type DbProject = {
  id: string;
  slug_en: string;
  title_en: string;
  title_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  location: string | null;
  year: number | null;
  sport_type: string | null;
  service_category: string | null;
  cover_image: string | null;
  governorate_id: string | null;
};

export type HomeClient = {
  id: string;
  name_en: string;
  name_ar: string;
  logo_url: string | null;
  industry: string | null;
  description_en: string | null;
  description_ar: string | null;
};

export type HeroSlide = Database["public"]["Tables"]["hero_slides"]["Row"];

export const governoratesActiveQueryOptions = queryOptions<Gov[]>({
  queryKey: ["governorates", "active"],
  staleTime: FIVE_MIN,
  gcTime: HALF_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("governorates")
      .select("*")
      .eq("active", true)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as Gov[];
  },
});

export const projectsPublishedListQueryOptions = queryOptions<DbProject[]>({
  queryKey: ["projects", "published-list"],
  staleTime: FIVE_MIN,
  gcTime: HALF_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("projects")
      .select(
        "id,slug_en,title_en,title_ar,description_en,description_ar,location,year,sport_type,service_category,cover_image,governorate_id",
      )
      .eq("status", "published");
    if (error) throw error;
    return (data ?? []) as DbProject[];
  },
});

export const homeClientsQueryOptions = queryOptions<HomeClient[]>({
  queryKey: ["home-clients"],
  staleTime: FIVE_MIN,
  gcTime: HALF_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id,name_en,name_ar,logo_url,industry,description_en,description_ar")
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .limit(18);
    if (error) throw error;
    return (data ?? []) as HomeClient[];
  },
});

export const heroSlidesActiveQueryOptions = queryOptions<HeroSlide[]>({
  queryKey: ["hero_slides", "active"],
  staleTime: FIVE_MIN,
  gcTime: HALF_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as HeroSlide[];
  },
});
