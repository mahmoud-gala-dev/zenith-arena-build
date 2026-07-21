import { useRef, useState } from "react";
import { Loader2, Paperclip, Trash2, Upload, ArrowUp, ArrowDown, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCan } from "@/lib/rbac";

export type Attachment = {
  path: string;
  filename: string;
  size: number;
  mime: string;
  label_en?: string;
  label_ar?: string;
};

interface Props {
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
  /** Permission required to modify (upload/rename/remove/reorder). Read-only if user lacks it. */
  permission: string;
  /** Optional folder prefix inside the bucket (e.g. slug). */
  folder?: string;
}

const BUCKET = "article-attachments";
const MAX_MB = 25;

function formatSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function AttachmentsField({ value, onChange, permission, folder = "misc" }: Props) {
  const { can, isLoading } = useCan(permission);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const attachments = Array.isArray(value) ? value : [];

  async function handleFiles(files: FileList) {
    if (!can) return toast.error("You don't have permission to add attachments here.");
    setUploading(true);
    setProgress(0);
    const next = [...attachments];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > MAX_MB * 1024 * 1024) {
          toast.error(`${file.name} exceeds ${MAX_MB}MB`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
        if (error) throw error;
        next.push({
          path,
          filename: file.name,
          size: file.size,
          mime: file.type || "application/octet-stream",
          label_en: file.name.replace(/\.[^.]+$/, ""),
          label_ar: "",
        });
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      onChange(next);
      toast.success("Attachments uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(idx: number) {
    if (!can) return;
    const item = attachments[idx];
    try {
      await supabase.storage.from(BUCKET).remove([item.path]);
    } catch {
      /* best-effort */
    }
    const next = attachments.filter((_, i) => i !== idx);
    onChange(next);
  }

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= attachments.length) return;
    const next = [...attachments];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  function updateLabel(idx: number, patch: Partial<Attachment>) {
    const next = attachments.map((a, i) => (i === idx ? { ...a, ...patch } : a));
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label className="flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Downloadable attachments
          <span className="text-xs font-normal text-muted-foreground">({attachments.length})</span>
        </Label>
        {isLoading ? null : can ? (
          <>
            <input
              ref={inputRef}
              type="file"
              hidden
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg,.webp"
              onChange={(e) => e.target.files && e.target.files.length > 0 && handleFiles(e.target.files)}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? ` ${progress}%` : " Add files"}
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Read-only — no permission for this content type.</span>
        )}
      </div>

      {attachments.length === 0 ? (
        <div className="rounded border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
          No attachments yet. Max {MAX_MB}MB per file. Supported: PDF, Office docs, images, zip.
        </div>
      ) : (
        <ul className="space-y-2">
          {attachments.map((a, i) => (
            <li key={`${a.path}-${i}`} className="rounded border border-border/60 bg-background/50 p-3">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="truncate font-medium">{a.filename}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatSize(a.size)} · {a.mime.split("/").pop()}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Display label (EN)"
                      value={a.label_en ?? ""}
                      disabled={!can}
                      onChange={(e) => updateLabel(i, { label_en: e.target.value })}
                    />
                    <Input
                      dir="rtl"
                      placeholder="اسم العرض (AR)"
                      value={a.label_ar ?? ""}
                      disabled={!can}
                      onChange={(e) => updateLabel(i, { label_ar: e.target.value })}
                    />
                  </div>
                </div>
                {can && (
                  <div className="flex flex-col gap-1">
                    <Button type="button" size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === attachments.length - 1} aria-label="Move down">
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => remove(i)} aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
