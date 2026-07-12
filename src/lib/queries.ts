import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Project as ViewProject } from "@/lib/site-data";

export function dbProjectToView(p: DbProject): ViewProject {
  return {
    slug: p.slug_en,
    image: p.cover_image ?? "",
    category: p.sport_type ?? p.service_category ?? "other",
    title: { en: p.title_en, ar: p.title_ar ?? p.title_en },
    client: { en: p.client ?? "", ar: p.client ?? "" },
    location: { en: p.location ?? p.city ?? p.country ?? "", ar: p.location ?? p.city ?? p.country ?? "" },
    year: p.year ? String(p.year) : "",
    scope: { en: p.service_category ?? "", ar: p.service_category ?? "" },
    overview: { en: p.overview_en ?? p.description_en ?? "", ar: p.overview_ar ?? p.description_ar ?? p.overview_en ?? p.description_en ?? "" },
    stats: [],
  };
}


const FIVE_MIN = 5 * 60 * 1000;
const FIFTEEN_MIN = 15 * 60 * 1000;
const HALF_HOUR = 30 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const TWO_HOUR = 2 * 60 * 60 * 1000;



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
  slug_ar: string | null;
  title_en: string;
  title_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  overview_en: string | null;
  overview_ar: string | null;
  client: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  year: number | null;
  area_sqm: number | null;
  surface_type: string | null;
  sport_type: string | null;
  service_category: string | null;
  cover_image: string | null;
  gallery: unknown;
  seo_title: string | null;
  seo_description: string | null;
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
  staleTime: FIFTEEN_MIN,
  gcTime: TWO_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("governorates")
      .select("id,slug,name_en,name_ar,logo_url,region_en,region_ar")
      .eq("active", true)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as Gov[];
  },
});

const PROJECT_COLUMNS =
  "id,slug_en,slug_ar,title_en,title_ar,description_en,description_ar,overview_en,overview_ar,client,location,country,city,year,area_sqm,surface_type,sport_type,service_category,cover_image,gallery,seo_title,seo_description,governorate_id";

export const projectsPublishedListQueryOptions = queryOptions<DbProject[]>({
  queryKey: ["projects", "published-list"],
  staleTime: FIVE_MIN,
  gcTime: HALF_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("status", "published")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as DbProject[];
  },
});

export const projectBySlugQueryOptions = (slug: string) =>
  queryOptions<DbProject | null>({
    queryKey: ["projects", "by-slug", slug],
    staleTime: FIVE_MIN,
    gcTime: HALF_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(PROJECT_COLUMNS)
        .eq("status", "published")
        .or(`slug_en.eq.${slug},slug_ar.eq.${slug}`)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as DbProject | null;
    },
  });

export const homeClientsQueryOptions = queryOptions<HomeClient[]>({
  queryKey: ["home-clients"],
  staleTime: FIFTEEN_MIN,
  gcTime: TWO_HOUR,
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

export const heroSlidesActiveQueryOptions = (locale: "en" | "ar" = "en") =>
  queryOptions<HeroSlide[]>({
    queryKey: ["hero_slides", "active", locale],
    staleTime: HALF_HOUR,
    gcTime: ONE_HOUR,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .or(
          // Published now OR scheduled and the schedule time has arrived.
          `and(status.eq.published,or(scheduled_at.is.null,scheduled_at.lte.${nowIso})),and(status.eq.draft,scheduled_at.lte.${nowIso})`,
        );
      if (error) throw error;
      const rows = (data ?? []) as HeroSlide[];
      // Order per-locale: fall back to global sort_order when locale-specific order is missing.
      const orderKey = locale === "ar" ? "sort_order_ar" : "sort_order";
      return rows.slice().sort((a, b) => {
        const av = (a as Record<string, unknown>)[orderKey] as number | null ?? a.sort_order ?? 0;
        const bv = (b as Record<string, unknown>)[orderKey] as number | null ?? b.sort_order ?? 0;
        return (av ?? 0) - (bv ?? 0);
      });
    },
  });

export type GalleryRow = Database["public"]["Tables"]["gallery"]["Row"];
export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type TestimonialRow = Database["public"]["Tables"]["testimonials"]["Row"];
export type DownloadRow = Database["public"]["Tables"]["downloads"]["Row"];
export type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductCategoryRow = Database["public"]["Tables"]["product_categories"]["Row"];
export type BlogRow = {
  id: string;
  slug_en: string;
  title_en: string;
  title_ar: string;
  excerpt_en: string | null;
  excerpt_ar: string | null;
  featured_image: string | null;
};

export const galleryPublishedQueryOptions = queryOptions<GalleryRow[]>({
  queryKey: ["gallery", "published"],
  staleTime: FIVE_MIN,
  gcTime: HALF_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .eq("status", "published")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as GalleryRow[];
  },
});

export const clientsPublishedQueryOptions = queryOptions<ClientRow[]>({
  queryKey: ["clients", "published"],
  staleTime: FIFTEEN_MIN,
  gcTime: TWO_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("status", "published")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as ClientRow[];
  },
});

export const testimonialsPublishedQueryOptions = queryOptions<TestimonialRow[]>({
  queryKey: ["testimonials", "published"],
  staleTime: FIFTEEN_MIN,
  gcTime: TWO_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("status", "published")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as TestimonialRow[];
  },
});

export const downloadsPublishedQueryOptions = queryOptions<DownloadRow[]>({
  queryKey: ["downloads", "published"],
  staleTime: FIFTEEN_MIN,
  gcTime: TWO_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("downloads")
      .select("*")
      .eq("status", "published")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as DownloadRow[];
  },
});

export const certificatesPublishedQueryOptions = queryOptions<CertificateRow[]>({
  queryKey: ["certificates", "published"],
  staleTime: FIFTEEN_MIN,
  gcTime: TWO_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("status", "published")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as CertificateRow[];
  },
});

export const productsPublishedQueryOptions = queryOptions<ProductRow[]>({
  queryKey: ["products", "published"],
  staleTime: FIVE_MIN,
  gcTime: HALF_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "published")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as ProductRow[];
  },
});

export const productCategoriesQueryOptions = queryOptions<ProductCategoryRow[]>({
  queryKey: ["product_categories", "published"],
  staleTime: FIFTEEN_MIN,
  gcTime: TWO_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("product_categories")
      .select("*")
      .eq("status", "published")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as ProductCategoryRow[];
  },
});

export const productBySlugQueryOptions = (slug: string) =>
  queryOptions<ProductRow | null>({
    queryKey: ["products", "by-slug", slug],
    staleTime: FIVE_MIN,
    gcTime: HALF_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "published")
        .or(`slug_en.eq.${slug},slug_ar.eq.${slug}`)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ProductRow | null;
    },
  });

export const blogPostsPublishedQueryOptions = queryOptions<BlogRow[]>({
  queryKey: ["blog_posts", "published-min"],
  staleTime: FIVE_MIN,
  gcTime: HALF_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id,slug_en,title_en,title_ar,excerpt_en,excerpt_ar,featured_image")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as BlogRow[];
  },
});

export type FaqItem = Database["public"]["Tables"]["faq_items"]["Row"];
export type JobOpening = Database["public"]["Tables"]["job_openings"]["Row"];

export const faqItemsPublishedQueryOptions = queryOptions<FaqItem[]>({
  queryKey: ["faq_items", "published"],
  staleTime: FIFTEEN_MIN,
  gcTime: ONE_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("faq_items")
      .select("*")
      .eq("is_published", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as FaqItem[];
  },
});

export type AboutValueItem = {
  icon: string;
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
};
export type AboutStatItem = {
  key: string;
  value: string;
  label_en: string;
  label_ar: string;
};
export type AboutContent = {
  hero: { image_url: string; eyebrow_en: string; eyebrow_ar: string; title_en: string; title_ar: string; subtitle_en: string; subtitle_ar: string };
  story: { title_en: string; title_ar: string; body_en: string; body_ar: string };
  values: AboutValueItem[];
  stats: AboutStatItem[];
};

export const aboutContentQueryOptions = queryOptions<AboutContent>({
  queryKey: ["about_content"],
  staleTime: FIFTEEN_MIN,
  gcTime: ONE_HOUR,
  queryFn: async () => {
    const { data, error } = await (supabase as unknown as {
      from: (t: string) => { select: (c: string) => Promise<{ data: Array<{ key: string; value: unknown }> | null; error: unknown }> };
    })
      .from("about_content")
      .select("key,value");
    if (error) throw error;
    const map: Record<string, unknown> = {};
    for (const row of data ?? []) map[row.key] = row.value;
    return {
      hero: (map.hero as AboutContent["hero"]) ?? { image_url: "", eyebrow_en: "About", eyebrow_ar: "من نحن", title_en: "", title_ar: "", subtitle_en: "", subtitle_ar: "" },
      story: (map.story as AboutContent["story"]) ?? { title_en: "", title_ar: "", body_en: "", body_ar: "" },
      values: (map.values as AboutValueItem[]) ?? [],
      stats: (map.stats as AboutStatItem[]) ?? [],
    };
  },
});

export const jobOpeningsOpenQueryOptions = queryOptions<JobOpening[]>({
  queryKey: ["job_openings", "open"],
  staleTime: FIVE_MIN,
  gcTime: HALF_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("job_openings")
      .select("*")
      .eq("is_open", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as JobOpening[];
  },
});



export type PageRow = Database["public"]["Tables"]["pages"]["Row"];

export const pageBySlugQueryOptions = (slug: string) =>
  queryOptions<PageRow | null>({
    queryKey: ["pages", "by-slug", slug],
    staleTime: FIFTEEN_MIN,
    gcTime: TWO_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("status", "published")
        .or(`slug_en.eq.${slug},slug_ar.eq.${slug}`)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as PageRow | null;
    },
  });

