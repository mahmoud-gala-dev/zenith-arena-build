import { useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateImageUrl, type ImageValidationOptions } from "@/lib/imageValidation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  aspect?: string; // tailwind e.g. "aspect-[16/9]"
  options?: ImageValidationOptions;
  help?: string;
  /** Storage bucket to upload into. Defaults to "service-media". */
  bucket?: string;
  /** Optional folder prefix inside the bucket. */
  folder?: string;
};

const ONE_YEAR = 60 * 60 * 24 * 365;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

/** URL input + direct file upload with dimension/type validation and side-by-side before/after preview. */
export function StrictImageUrlField({
  label,
  value,
  onChange,
  aspect = "aspect-[16/9]",
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
  const fileRef = useRef<HTMLInputElement>(null);

  async function commit(next: string) {
    const trimmed = next.trim();
    setDraft(trimmed);
    if (!trimmed) {
      setStatus("idle");
      setMessage(null);
      setMeta(null);
      onChange("");
      return;
    }
    setStatus("checking");
    setMessage("Validating image…");
    const result = await validateImageUrl(trimmed, options);
    if (result.ok) {
      setStatus("ok");
      setMessage(null);
      setMeta({ w: result.width, h: result.height });
      onChange(trimmed);
    } else {
      setStatus("error");
      setMessage(result.error);
    }
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`Image too large — max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.`);
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const path = `${folder ? folder.replace(/^\/+|\/+$/g, "") + "/" : ""}${stamp}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
      if (upErr) throw upErr;

      // Try public URL first (works if bucket is public); fall back to a long-lived signed URL.
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      let finalUrl = pub?.publicUrl ?? "";
      const head = finalUrl ? await fetch(finalUrl, { method: "HEAD" }).catch(() => null) : null;
      if (!head || !head.ok) {
        const { data: signed, error: sErr } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, ONE_YEAR);
        if (sErr) throw sErr;
        finalUrl = signed?.signedUrl ?? "";
      }
      if (!finalUrl) throw new Error("Failed to resolve uploaded image URL.");
      await commit(finalUrl);
      toast.success("Image uploaded.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed.";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
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
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="Upload image"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span className="ml-1">Upload</span>
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => commit("")} aria-label="Clear">
            <X className="h-4 w-4" />
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
      </div>
      {status === "error" && message && (
        <p className="flex items-start gap-1.5 text-xs text-destructive"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {message}</p>
      )}
      {status === "ok" && meta && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Valid — {meta.w}×{meta.h}px</p>
      )}
      {/* Before / After preview */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Before</p>
          <div className={`${aspect} w-full rounded-md border border-dashed border-border bg-gradient-to-br from-secondary to-secondary/50`} />
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">After</p>
          <div className={`${aspect} w-full overflow-hidden rounded-md border border-border bg-secondary`}>
            {value && status !== "error" ? (
              <img src={value} alt="Preview" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">No image</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

