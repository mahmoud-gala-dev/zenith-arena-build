import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useServicesList() {
  const [data, setData] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: rows } = await supabase
        .from("services")
        .select("*")
        .eq("status", "published")
        .order("sort_order", { ascending: true });
      if (cancel) return;
      setData((rows ?? []).map((r) => normalize(r as Record<string, unknown>)));
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, []);
  return { data, loading };
}

export function useServiceBySlug(slug: string) {
  const [data, setData] = useState<ServiceRow | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: row } = await supabase
        .from("services")
        .select("*")
        .eq("slug_en", slug)
        .maybeSingle();
      if (cancel) return;
      setData(row ? normalize(row as Record<string, unknown>) : null);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [slug]);
  return { data, loading };
}
