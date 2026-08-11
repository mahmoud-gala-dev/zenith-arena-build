import { useRef, useState } from "react";
import { GripVertical, Trash2, Plus, AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { validateImageUrl } from "@/lib/imageValidation";
import { uploadImageWithVariants } from "@/lib/imagePipeline";

type Props = {
  label: string;
  value: string[]; // array of image URLs
  onChange: (next: string[]) => void;
  aspect?: string;
  /** Storage bucket used by the multi-file uploader. */
  bucket?: string;
  /** Folder prefix inside the bucket. */
  folder?: string;
  /** Set false to hide the direct-upload control. */
  enableUpload?: boolean;
};

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

/** Drag-and-drop reorderable gallery editor with multi-file upload + strict URL validation. */
export function GalleryOrderEditor({
  label,
  value,
  onChange,
  aspect = "aspect-[4/3]",
  bucket = "media",
  folder = "gallery",
  enableUpload = true,
}: Props) {
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pct, setPct] = useState(0);
  const [uploadLabel, setUploadLabel] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const items = Array.isArray(value) ? value : [];

  async function add() {
    const url = draft.trim();
    if (!url) return;
    setStatus("checking");
    setMessage("Validating image…");
    const result = await validateImageUrl(url);
    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    onChange([...items, url]);
    setDraft("");
    setStatus("idle");
    setMessage(null);
  }

  async function uploadFiles(files: FileList) {
    const list = Array.from(files);
    setUploading(true);
    setPct(0);
    const added: string[] = [];
    try {
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image — skipped.`);
          continue;
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          toast.error(`${file.name} exceeds ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB — skipped.`);
          continue;
        }
        setUploadLabel(`${file.name} (${i + 1}/${list.length})`);
        const { primaryUrl } = await uploadImageWithVariants(file, {
          bucket,
          folder,
          widths: [480, 960, 1600],
          onProgress: (p) => setPct(Math.round(((i + p.pct) / list.length) * 100)),
        });
        added.push(primaryUrl);
      }
      if (added.length) {
        onChange([...items, ...added]);
        toast.success(`${added.length} image${added.length === 1 ? "" : "s"} added to the gallery.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setPct(0);
      setUploadLabel("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function onDrop(target: number) {
    if (dragIndex === null || dragIndex === target) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    onChange(next);
    setDragIndex(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{label}</Label>
        {enableUpload && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files?.length && uploadFiles(e.target.files)}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span className="ml-1">{uploading ? `Uploading ${pct}%` : "Upload images"}</span>
            </Button>
          </>
        )}
      </div>

      <div
        onDragOver={(e) => { if (enableUpload) e.preventDefault(); }}
        onDrop={(e) => {
          if (!enableUpload || uploading) return;
          if (e.dataTransfer?.files?.length) {
            e.preventDefault();
            uploadFiles(e.dataTransfer.files);
          }
        }}
        className="flex gap-2"
      >
        <Input
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://…/photo.jpg  — or drop files here"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <Button type="button" size="sm" onClick={add} disabled={status === "checking" || uploading}>
          {status === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add
        </Button>
      </div>

      {uploading && (
        <div className="space-y-1 rounded-md border border-border/60 bg-secondary/40 p-2">
          <Progress value={pct} className="h-2" />
          <p className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{uploadLabel}</span>
            <span className="tabular-nums">{pct}%</span>
          </p>
        </div>
      )}

      {status === "error" && message && (
        <p className="flex items-start gap-1.5 text-xs text-destructive"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {message}</p>
      )}
      {status === "idle" && items.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Drag to reorder — {items.length} image{items.length === 1 ? "" : "s"}</p>
      )}

      {items.length === 0 ? (
        <div className={`${aspect} w-full rounded-md border border-dashed border-border bg-secondary/40 grid place-items-center text-xs text-muted-foreground`}>
          Gallery is empty — upload files or paste URLs
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((url, i) => (
            <li
              key={`${url}-${i}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              onDragEnd={() => setDragIndex(null)}
              className={`group relative overflow-hidden rounded-lg border bg-card shadow-soft ${dragIndex === i ? "opacity-50 ring-2 ring-primary" : "border-border"}`}
            >
              <div className={`${aspect} w-full overflow-hidden bg-secondary`}>
                <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="absolute left-1 top-1 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                <GripVertical className="h-3 w-3" /> {i + 1}
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Remove image"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
