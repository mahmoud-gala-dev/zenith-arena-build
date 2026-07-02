import { useState } from "react";
import { GripVertical, Trash2, Plus, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateImageUrl } from "@/lib/imageValidation";

type Props = {
  label: string;
  value: string[]; // array of image URLs
  onChange: (next: string[]) => void;
  aspect?: string;
};

/** Drag-and-drop reorderable gallery editor with strict URL validation. */
export function GalleryOrderEditor({ label, value, onChange, aspect = "aspect-[4/3]" }: Props) {
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
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
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://…/photo.jpg"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <Button type="button" size="sm" onClick={add} disabled={status === "checking"}>
          {status === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add
        </Button>
      </div>
      {status === "error" && message && (
        <p className="flex items-start gap-1.5 text-xs text-destructive"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {message}</p>
      )}
      {status === "idle" && items.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Drag to reorder — {items.length} image{items.length === 1 ? "" : "s"}</p>
      )}

      {items.length === 0 ? (
        <div className={`${aspect} w-full rounded-md border border-dashed border-border bg-secondary/40 grid place-items-center text-xs text-muted-foreground`}>
          Gallery is empty
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
