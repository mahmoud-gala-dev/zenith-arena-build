import { useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, X, Upload, Crop as CropIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { validateImageUrl, type ImageValidationOptions } from "@/lib/imageValidation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageCropDialog } from "@/components/admin/ImageCropDialog";
import { uploadImageWithVariants } from "@/lib/imagePipeline";
import type { ImageVariantsManifest } from "@/hooks/useSignedImage";
import { refreshIfExpiring, DEFAULT_SIGNED_TTL } from "@/lib/signedUrl";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Optional multi-size WebP manifest. When provided the UI shows a badge and enables the pipeline. */
  variants?: ImageVariantsManifest | null;
  onVariantsChange?: (m: ImageVariantsManifest | null) => void;
  /** Tailwind aspect class for the preview panels. */
  aspect?: string;
  /** Numeric aspect (w/h) for the cropper. Falls back to 16/9. */
  aspectRatio?: number;
  options?: ImageValidationOptions;
  help?: string;
  bucket?: string;
  folder?: string;
};

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** URL input + upload with crop dialog and responsive WebP variants. */
export function StrictImageUrlField({
  label,
  value,
  onChange,
  variants,
  onVariantsChange,
  aspect = "aspect-[16/9]",
  aspectRatio = 16 / 9,
  options,
  help,
  bucket = "service-media",
  folder = "",
}: Props) {
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">(value ? "ok" : "idle");
  const [message, setMessage] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ w: number; h: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function commit(next: string) {
    const trimmed = next.trim();
    setDraft(trimmed);
    if (!trimmed) {
      setStatus("idle"); setMessage(null); setMeta(null);
      onChange("");
      onVariantsChange?.(null);
      return;
    }
    setStatus("checking"); setMessage("Validating image…");
    const fresh = await refreshIfExpiring(trimmed);
    const result = await validateImageUrl(fresh, options);
    if (result.ok) {
      setStatus("ok"); setMessage(null); setMeta({ w: result.width, h: result.height });
      onChange(fresh);
    } else {
      setStatus("error"); setMessage(result.error);
    }
  }

  function pickFile(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file."); return; }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`Image too large — max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.`);
      return;
    }
    setPendingFile(file);
  }

  async function handleCroppedBlob(blob: Blob) {
    setPendingFile(null);
    setUploading(true);
    try {
      const { primaryUrl, manifest } = await uploadImageWithVariants(blob, {
        bucket, folder, widths: [480, 960, 1600],
      });
      onVariantsChange?.(manifest);
      await commit(primaryUrl);
      toast.success(`Uploaded — ${Object.keys(manifest.paths).length} responsive sizes generated.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed.";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const previewUrl = value && status !== "error" ? value : "";
  const variantCount = variants ? Object.keys(variants.paths).length : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {variantCount > 0 && (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <CropIcon className="h-3 w-3" /> {variantCount} × WebP
          </Badge>
        )}
      </div>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
      <div className="flex flex-wrap gap-2">
        <Input
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft !== value && commit(draft)}
          placeholder="https://…"
          className="min-w-0 flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={() => commit(draft)} disabled={status === "checking"}>
          {status === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate"}
        </Button>
        <Button
          type="button" variant="secondary" size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="Upload & crop image"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span className="ml-1">Upload & Crop</span>
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => commit("")} aria-label="Clear">
            <X className="h-4 w-4" />
          </Button>
        )}
        <input
          ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
        />
      </div>
      {status === "error" && message && (
        <p className="flex items-start gap-1.5 text-xs text-destructive"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {message}</p>
      )}
      {status === "ok" && meta && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Valid — {meta.w}×{meta.h}px</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Before</p>
          <div className={`${aspect} w-full rounded-md border border-dashed border-border bg-gradient-to-br from-secondary to-secondary/50`} />
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">After</p>
          <div className={`${aspect} w-full overflow-hidden rounded-md border border-border bg-secondary`}>
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">No image</div>
            )}
          </div>
        </div>
      </div>

      <ImageCropDialog
        file={pendingFile}
        aspect={aspectRatio}
        onCancel={() => setPendingFile(null)}
        onConfirm={handleCroppedBlob}
        title={`Crop — ${label}`}
      />
    </div>
  );
}

// keep TTL import used to avoid tree-shake surprises during future edits
void DEFAULT_SIGNED_TTL;
