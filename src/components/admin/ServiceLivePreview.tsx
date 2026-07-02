import { StrictImageUrlField } from "./StrictImageUrlField";
import { GalleryOrderEditor } from "./GalleryOrderEditor";

type Values = Record<string, unknown>;

/** Live preview of a service page reflecting current edit values. */
export function ServiceLivePreview({ values }: { values: Values }) {
  const title_en = String(values.title_en || "Service title");
  const title_ar = String(values.title_ar || "");
  const description_en = String(values.description_en || "");
  const cover = String(values.cover_image || "");
  const header = String(values.header_image || "");
  const alt_en = String(values.alt_en || title_en);
  const gallery: string[] = Array.isArray(values.gallery_images)
    ? (values.gallery_images as string[])
    : (() => { try { const p = JSON.parse(String(values.gallery_images || "[]")); return Array.isArray(p) ? p : []; } catch { return []; } })();

  return (
    <div className="space-y-4 rounded-xl border border-border bg-secondary/30 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Live preview</p>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-lg bg-ink text-white">
        {header ? (
          <img src={header} alt="" className="h-40 w-full object-cover opacity-50" />
        ) : (
          <div className="h-40 w-full bg-gradient-to-br from-ink to-primary/60" />
        )}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/90 to-transparent p-4">
          <h3 className="text-lg font-bold">{title_en}</h3>
          {title_ar && <p className="text-sm text-white/80" dir="rtl">{title_ar}</p>}
        </div>
      </div>
      {/* Card + description */}
      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <div className="aspect-square overflow-hidden rounded-md border border-border bg-secondary">
          {cover ? <img src={cover} alt={alt_en} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-[10px] text-muted-foreground">No cover</div>}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-6">{description_en || "Description will appear here."}</p>
      </div>
      {/* Gallery */}
      {gallery.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Gallery ({gallery.length})</p>
          <div className="flex gap-1.5 overflow-x-auto">
            {gallery.slice(0, 8).map((url, i) => (
              <img key={`${url}-${i}`} src={url} alt="" className="h-14 w-20 flex-shrink-0 rounded object-cover" loading="lazy" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { StrictImageUrlField, GalleryOrderEditor };
