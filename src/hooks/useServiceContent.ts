import { queryOptions, useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ImageVariantsManifest } from "@/hooks/useSignedImage";

export type ServiceFaq = { q_en: string; q_ar?: string; a_en: string; a_ar?: string };

export type ServiceRow = {
  id: string;
  slug_en: string;
  slug_ar: string | null;
  title_en: string;
  title_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  category: string | null;
  icon: string | null;
  cover_image: string | null;
  header_image: string | null;
  og_image: string | null;
  og_image_ar: string | null;
  cover_image_variants: ImageVariantsManifest | null;
  header_image_variants: ImageVariantsManifest | null;
  og_image_variants: ImageVariantsManifest | null;
  og_image_ar_variants: ImageVariantsManifest | null;
  alt_en: string | null;
  alt_ar: string | null;
  gallery_images: string[];
  faqs: ServiceFaq[];
  seo_title_en: string | null;
  seo_title_ar: string | null;
  seo_description_en: string | null;
  seo_description_ar: string | null;
  status: string;
  featured: boolean;
  sort_order: number;
  updated_at?: string | null;
};

function normalizeGallery(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string" && !!v);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string" && !!v) : [];
    } catch {
      return [];

    }
  }
  return [];
}

function normalizeFaqs(value: unknown): ServiceFaq[] {
  const arr = Array.isArray(value)
    ? value
    : typeof value === "string" && value.trim()
      ? (() => { try { return JSON.parse(value); } catch { return []; } })()
      : [];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((f: unknown) => {
      const o = (f ?? {}) as Record<string, unknown>;
      const q_en = typeof o.q_en === "string" ? o.q_en : typeof o.question === "string" ? (o.question as string) : "";
      const a_en = typeof o.a_en === "string" ? o.a_en : typeof o.answer === "string" ? (o.answer as string) : "";
      const q_ar = typeof o.q_ar === "string" ? (o.q_ar as string) : undefined;
      const a_ar = typeof o.a_ar === "string" ? (o.a_ar as string) : undefined;
      return { q_en, a_en, q_ar, a_ar };
    })
    .filter((f) => f.q_en && f.a_en);
}

function normalize(row: Record<string, unknown>): ServiceRow {
  return {
    ...(row as ServiceRow),
    gallery_images: normalizeGallery((row as { gallery_images?: unknown }).gallery_images),
    faqs: normalizeFaqs((row as { faqs?: unknown }).faqs),
  };
}

export type ServicesSort = "featured" | "newest" | "oldest" | "az" | "za";
export type ServicesPageParams = { q?: string; category?: string; page?: number; pageSize?: number; sort?: ServicesSort; lang?: "en" | "ar" };
export type ServicesPage = { rows: ServiceRow[]; total: number; page: number; pageSize: number };

function applySort(query: ReturnType<typeof supabase.from<"services">>["select"] extends (...a: unknown[]) => infer R ? R : never, sort: ServicesSort, lang: "en" | "ar") {
  // Chainable order() calls
  switch (sort) {
    case "newest":
      return query.order("updated_at", { ascending: false, nullsFirst: false });
    case "oldest":
      return query.order("updated_at", { ascending: true, nullsFirst: true });
    case "az":
      return query.order(lang === "ar" ? "title_ar" : "title_en", { ascending: true, nullsFirst: false });
    case "za":
      return query.order(lang === "ar" ? "title_ar" : "title_en", { ascending: false, nullsFirst: false });
    case "featured":
    default:
      return query.order("featured", { ascending: false }).order("sort_order", { ascending: true });
  }
}



const FIVE_MIN = 5 * 60 * 1000;
const HALF_HOUR = 30 * 60 * 1000;

export const servicesPublishedQueryOptions = queryOptions<ServiceRow[]>({
  queryKey: ["services", "published"],
  staleTime: FIVE_MIN,
  gcTime: HALF_HOUR,
  queryFn: async () => {
    const { data: rows, error } = await supabase
      .from("services")
      .select("*")
      .eq("status", "published")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (rows ?? []).map((r) => normalize(r as Record<string, unknown>));
  },
});

export const serviceBySlugQueryOptions = (slug: string) =>
  queryOptions<ServiceRow | null>({
    queryKey: ["services", "by-slug", slug],
    staleTime: FIVE_MIN,
    gcTime: HALF_HOUR,
    enabled: !!slug,
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from("services")
        .select("*")
        .eq("slug_en", slug)
        .maybeSingle();
      if (error) throw error;
      return row ? normalize(row as Record<string, unknown>) : null;
    },
  });

export function useServicesList() {
  const q = useQuery(servicesPublishedQueryOptions);
  return { data: q.data ?? [], loading: q.isLoading };
}

export function useServiceBySlug(slug: string) {
  const q = useQuery(serviceBySlugQueryOptions(slug));
  return { data: q.data ?? null, loading: q.isLoading };
}

export const servicesPageQueryOptions = (params: ServicesPageParams) => {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, params.pageSize ?? 9));
  const q = (params.q ?? "").trim();
  const category = (params.category ?? "").trim();
  return queryOptions<ServicesPage>({
    queryKey: ["services", "page", { q, category, page, pageSize }],
    staleTime: FIVE_MIN,
    gcTime: HALF_HOUR,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = supabase
        .from("services")
        .select("*", { count: "exact" })
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .range(from, to);
      if (category) query = query.eq("category", category);
      if (q) {
        const escaped = q.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
        const like = `%${escaped}%`;
        query = query.or(
          [
            `title_en.ilike.${like}`,
            `title_ar.ilike.${like}`,
            `description_en.ilike.${like}`,
            `description_ar.ilike.${like}`,
            `category.ilike.${like}`,
          ].join(","),
        );
      }
      const { data: rows, error, count } = await query;
      if (error) throw error;
      return {
        rows: (rows ?? []).map((r) => normalize(r as Record<string, unknown>)),
        total: count ?? 0,
        page,
        pageSize,
      };
    },
  });
};

export function useServicesPage(params: ServicesPageParams) {
  const q = useQuery(servicesPageQueryOptions(params));
  return { data: q.data, loading: q.isLoading, fetching: q.isFetching };
}

export const servicesCategoriesQueryOptions = queryOptions<string[]>({
  queryKey: ["services", "categories"],
  staleTime: 15 * 60 * 1000,
  gcTime: HALF_HOUR,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("services")
      .select("category")
      .eq("status", "published")
      .not("category", "is", null);
    if (error) throw error;
    const set = new Set<string>();
    for (const r of data ?? []) {
      const c = (r as { category?: string | null }).category;
      if (c && c.trim()) set.add(c.trim());
    }
    return Array.from(set).sort();
  },
});


