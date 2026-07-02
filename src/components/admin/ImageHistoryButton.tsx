import { History, Undo2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useImageVersions, type ImageVersion } from "@/hooks/useImageVersions";
import type { ImageVariantsManifest } from "@/hooks/useSignedImage";

type Props = {
  entityTable: string;
  entityId: string | undefined;
  field: ImageVersion["field"];
  onRevert: (v: { url: string | null; variants: ImageVariantsManifest | null }) => void;
};

export function ImageHistoryButton({ entityTable, entityId, field, onRevert }: Props) {
  const { versions, loading, refetch } = useImageVersions(entityTable, entityId, field);
  const disabled = !entityId;
  return (
    <Popover onOpenChange={(o) => o && refetch()}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled} className="gap-1.5" title={disabled ? "Save first to enable history" : "Version history"}>
          <History className="h-3.5 w-3.5" />
          History
          {versions.length > 0 && <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px]">{versions.length}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading history…</div>
        ) : versions.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">No previous versions yet. History is created automatically when you replace this image.</p>
        ) : (
          <ul className="max-h-[320px] space-y-1 overflow-y-auto">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center gap-2 rounded border border-border/60 p-2 hover:bg-secondary/40">
                <div className="h-10 w-14 shrink-0 overflow-hidden rounded bg-secondary">
                  {v.url ? <img src={v.url} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                </div>
                <div className="min-w-0 flex-1 text-[11px]">
                  <p className="truncate font-medium">{new Date(v.created_at).toLocaleString()}</p>
                  <p className="text-muted-foreground">
                    {v.variants ? `${Object.keys(v.variants.paths).length} variants` : "single URL"}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onRevert({ url: v.url, variants: v.variants })} className="gap-1 text-xs">
                  <Undo2 className="h-3 w-3" /> Revert
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
