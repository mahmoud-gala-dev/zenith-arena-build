import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ImageVariantsManifest } from "@/hooks/useSignedImage";

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
  cover_image_variants: ImageVariantsManifest | null;
  header_image_variants: ImageVariantsManifest | null;
  og_image_variants: ImageVariantsManifest | null;
  alt_en: string | null;
  alt_ar: string | null;
  gallery_images: string[];
  seo_title_en: string | null;
  seo_title_ar: string | null;
  seo_description_en: string | null;
  seo_description_ar: string | null;
  status: string;
  featured: boolean;
  sort_order: number;
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

function normalize(row: Record<string, unknown>): ServiceRow {
  return { ...(row as ServiceRow), gallery_images: normalizeGallery((row as { gallery_images?: unknown }).gallery_images) };
}

const FIVE_MIN = 5 * 60 * 1000;

export function useServicesList() {
  const q = useQuery({
    queryKey: ["services", "published"],
    staleTime: FIVE_MIN,
    gcTime: 30 * 60 * 1000,
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
  return { data: q.data ?? [], loading: q.isLoading };
}

export function useServiceBySlug(slug: string) {
  const q = useQuery({
    queryKey: ["services", "by-slug", slug],
    staleTime: FIVE_MIN,
    gcTime: 30 * 60 * 1000,
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
  return { data: q.data ?? null, loading: q.isLoading };
}
