import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ImageVariantsManifest } from "@/hooks/useSignedImage";

export type ImageVersion = {
  id: string;
  entity_table: string;
  entity_id: string;
  field: "cover_image" | "header_image" | "og_image";
  url: string | null;
  variants: ImageVariantsManifest | null;
  note: string | null;
  created_at: string;
};

const table = () => supabase.from("image_versions");

export async function insertImageVersion(v: Omit<ImageVersion, "id" | "created_at">) {
  if (!v.url && !v.variants) return; // nothing meaningful to snapshot
  const { error } = await table().insert({
    ...v,
    variants: (v.variants ?? null) as never,
  });
  if (error) throw error;
}

export function useImageVersions(entityTable: string, entityId: string | undefined, field: ImageVersion["field"]) {
  const [versions, setVersions] = useState<ImageVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!entityId) { setVersions([]); return; }
    setLoading(true);
    const { data, error } = await table()
      .select("*")
      .eq("entity_table", entityTable)
      .eq("entity_id", entityId)
      .eq("field", field)
      .order("created_at", { ascending: false })
      .limit(25);
    setLoading(false);
    if (!error) setVersions((data ?? []) as unknown as ImageVersion[]);
  }, [entityTable, entityId, field]);

  useEffect(() => { refetch(); }, [refetch]);

  return { versions, loading, refetch };
}
