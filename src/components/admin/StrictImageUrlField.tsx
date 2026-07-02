import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateImageUrl, type ImageValidationOptions } from "@/lib/imageValidation";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  aspect?: string; // tailwind e.g. "aspect-[16/9]"
  options?: ImageValidationOptions;
  help?: string;
};

/** URL-based image input with dimension/type validation and side-by-side before/after preview. */
export function StrictImageUrlField({ label, value, onChange, aspect = "aspect-[16/9]", options, help }: Props) {
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">(value ? "ok" : "idle");
  const [message, setMessage] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ w: number; h: number } | null>(null);

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

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
      <div className="flex gap-2">
        <Input
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft !== value && commit(draft)}
          placeholder="https://…"
        />
        <Button type="button" variant="outline" size="sm" onClick={() => commit(draft)} disabled={status === "checking"}>
          {status === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => commit("")} aria-label="Clear">
            <X className="h-4 w-4" />
          </Button>
        )}
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
