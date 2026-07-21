import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, GripVertical, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { CinematicBackdrop } from "@/components/site/CinematicBackdrop";
import { useInvalidateTables } from "@/lib/invalidate";
import { AIAssistButton, AITranslateSync } from "@/components/admin/ai";


const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MIN_IMAGE_WIDTH = 1200;
const MIN_IMAGE_HEIGHT = 600;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const clamp01 = (n: unknown): number => {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0.6;
  return Math.min(1, Math.max(0, v));
};

type Slide = Database["public"]["Tables"]["hero_slides"]["Row"];
type SlideInput = Database["public"]["Tables"]["hero_slides"]["Insert"];

export const Route = createFileRoute("/_authenticated/admin/hero-slides")({
  component: AdminHeroSlides,
});

const empty: SlideInput = {
  eyebrow_en: "", eyebrow_ar: "",
  title_en: "", title_ar: "",
  subtitle_en: "", subtitle_ar: "",
  primary_label_en: "", primary_label_ar: "", primary_href: "",
  secondary_label_en: "", secondary_label_ar: "", secondary_href: "",
  image_url: "",
  overlay: "dark", align: "left",
  is_active: true, sort_order: 0, sort_order_ar: 0,
  status: "published", scheduled_at: null,
  fog_intensity: 0.6, spotlight_intensity: 0.6, vignette_intensity: 0.6,
} as SlideInput;

function AdminHeroSlides() {
  const invalidate = useInvalidateTables(["hero_slides"]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<SlideInput | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [orderLang, setOrderLang] = useState<"en" | "ar">("en");
  const localPreviewRef = useRef<string | null>(null);

  const orderCol = orderLang === "ar" ? "sort_order_ar" : "sort_order";

  useEffect(() => () => {
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("hero_slides").select("*");
    if (error) toast.error(error.message);
    const rows = (data ?? []) as Slide[];
    // Sort by the language-specific column (fall back to the shared sort_order).
    rows.sort((a, b) => {
      const av = ((a as unknown as Record<string, number | null>)[orderCol] ?? a.sort_order ?? 0);
      const bv = ((b as unknown as Record<string, number | null>)[orderCol] ?? b.sort_order ?? 0);
      return av - bv;
    });
    setSlides(rows);
    setLoading(false);
  }
  useEffect(() => { load(); /* re-sort when tab changes */ }, [orderLang]);


  function clearLocalPreview() {
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    localPreviewRef.current = null;
    setLocalPreview(null);
  }

  function startNew() {
    clearLocalPreview();
    setEditingId(null);
    setEditing({ ...empty, sort_order: (slides.at(-1)?.sort_order ?? 0) + 1 });
  }
  function startEdit(s: Slide) {
    clearLocalPreview();
    setEditingId(s.id);
    setEditing({ ...s });
  }

  function validateImage(file: File): Promise<{ width: number; height: number; url: string }> {
    return new Promise((resolve, reject) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return reject(new Error("Use JPG, PNG, WEBP or AVIF"));
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return reject(new Error(`Image must be under ${MAX_IMAGE_BYTES / 1024 / 1024} MB`));
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth < MIN_IMAGE_WIDTH || img.naturalHeight < MIN_IMAGE_HEIGHT) {
          URL.revokeObjectURL(url);
          return reject(new Error(`Minimum size ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT}px`));
        }
        resolve({ width: img.naturalWidth, height: img.naturalHeight, url });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read image"));
      };
      img.src = url;
    });
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const { url: previewUrl } = await validateImage(file);
      // Immediate local preview via object URL — swaps to the CDN URL once uploaded.
      if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
      localPreviewRef.current = previewUrl;
      setLocalPreview(previewUrl);

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setEditing((e) => (e ? { ...e, image_url: data.publicUrl } : e));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!editing) return;
    if (!editing.title_en?.trim()) return toast.error("English title is required");
    if (!editing.image_url?.trim()) return toast.error("Image is required");
    setSaving(true);
    const payload: SlideInput = {
      ...editing,
      fog_intensity: clamp01(editing.fog_intensity ?? 0.6),
      spotlight_intensity: clamp01(editing.spotlight_intensity ?? 0.6),
      vignette_intensity: clamp01(editing.vignette_intensity ?? 0.6),
    };
    const res = editingId
      ? await supabase.from("hero_slides").update(payload).eq("id", editingId)
      : await supabase.from("hero_slides").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editingId ? "Slide updated" : "Slide created");
    setEditing(null); setEditingId(null);
    invalidate();
    load();
  }


  async function remove() {
    if (!deleteId) return;
    const { error } = await supabase.from("hero_slides").delete().eq("id", deleteId);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setDeleteId(null);
    invalidate();
    load();
  }


  async function reorder(id: string, dir: -1 | 1) {
    const idx = slides.findIndex((s) => s.id === id);
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    await moveTo(idx, target);
  }

  // Reorders locally, then rewrites the language-specific sort column for every affected slide.
  // Used by both drag-and-drop and the up/down arrow buttons.
  async function moveTo(from: number, to: number) {
    if (from === to) return;
    const next = slides.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const withOrder = next.map((s, i) => ({
      ...s,
      [orderCol]: i + 1,
    })) as Slide[];
    setSlides(withOrder);
    const updates = withOrder.map((s) => {
      const val = (s as unknown as Record<string, number>)[orderCol];
      const patch = (orderCol === "sort_order_ar" ? { sort_order_ar: val } : { sort_order: val }) as SlideInput;
      return supabase.from("hero_slides").update(patch).eq("id", s.id);
    });

    const results = await Promise.all(updates);
    const err = results.find((r) => r.error)?.error;
    if (err) {
      toast.error(err.message);
      load();
    } else {
      toast.success(`Saved ${orderLang.toUpperCase()} order`);
      invalidate();
    }
  }


  async function toggleActive(s: Slide) {
    await supabase.from("hero_slides").update({ is_active: !s.is_active }).eq("id", s.id);
    invalidate();
    load();
  }


  const set = <K extends keyof SlideInput>(k: K, v: SlideInput[K]) => setEditing((e) => (e ? { ...e, [k]: v } : e));

  return (
    <AdminShell title="Hero Slides">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Animated homepage banner. Drag the handle to reorder — the order is saved per language. Scheduled draft slides auto‑publish when their time arrives.</p>
        <Button onClick={startNew}><Plus className="mr-2 h-4 w-4" />New slide</Button>
      </div>
      <div className="mb-4 inline-flex rounded-lg border bg-card p-1 text-sm">
        {(["en", "ar"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setOrderLang(l)}
            className={`rounded-md px-3 py-1.5 font-medium transition ${orderLang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {l === "en" ? "English order" : "الترتيب العربي"}
          </button>
        ))}
      </div>


      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : slides.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">No slides yet. Create the first one.</div>
      ) : (
        <div className="grid gap-4">
          {slides.map((s, i) => {
            const isDragging = dragId === s.id;
            const isOver = dragOverId === s.id && dragId !== s.id;
            return (
              <div
                key={s.id}
                draggable
                onDragStart={(e) => {
                  setDragId(s.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", s.id);
                }}
                onDragEnter={() => setDragOverId(s.id)}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDragLeave={(e) => {
                  // Only clear when we actually leave the row, not a child.
                  if (e.currentTarget === e.target) setDragOverId((cur) => (cur === s.id ? null : cur));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = slides.findIndex((x) => x.id === dragId);
                  const to = slides.findIndex((x) => x.id === s.id);
                  setDragId(null);
                  setDragOverId(null);
                  if (from >= 0 && to >= 0) moveTo(from, to);
                }}
                onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                className={`flex items-center gap-4 rounded-lg border bg-card p-3 transition ${isDragging ? "opacity-40" : ""} ${isOver ? "border-primary ring-2 ring-primary/30" : ""}`}
              >
                <button
                  type="button"
                  aria-label="Drag to reorder"
                  className="flex-none cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <GripVertical className="h-5 w-5" />
                </button>
                <img src={s.image_url} alt="" className="h-20 w-32 flex-none rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">#{(s as unknown as Record<string, number | null>)[orderCol] ?? s.sort_order} · {orderLang.toUpperCase()}</span>
                    <h3 className="truncate font-semibold">{s.title_en}</h3>
                    {s.status === "draft" && <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400">Draft</span>}
                    {s.scheduled_at && new Date(s.scheduled_at) > new Date() && (
                      <span className="rounded bg-blue-500/15 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-400">Scheduled · {new Date(s.scheduled_at).toLocaleString()}</span>
                    )}
                    {!s.is_active && <span className="rounded bg-muted px-2 py-0.5 text-xs">Hidden</span>}
                  </div>
                  <p className="line-clamp-1 text-sm text-muted-foreground">{s.subtitle_en}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                  <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => reorder(s.id, -1)} aria-label="Move slide up"><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" disabled={i === slides.length - 1} onClick={() => reorder(s.id, 1)} aria-label="Move slide down"><ArrowDown className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => startEdit(s)} aria-label="Edit slide"><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(s.id)} aria-label="Delete slide"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit slide" : "New slide"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div>
                <Label>Image</Label>
                {editing.image_url || localPreview ? (
                  <div className="mt-2 flex items-start gap-3">
                    <div className="relative">
                      <img
                        src={localPreview ?? editing.image_url ?? ""}
                        alt=""
                        className="h-24 w-40 rounded object-cover ring-1 ring-border"
                      />
                      {/* 16:9 crop-safe overlay so admins see what will be visible on the hero */}
                      <div className="pointer-events-none absolute inset-0 rounded ring-1 ring-inset ring-white/60 mix-blend-overlay" />
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40 text-white">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <p>Preview shows the safe 16:9 crop area.</p>
                      <Button variant="outline" size="sm" onClick={() => { clearLocalPreview(); set("image_url", ""); }}>
                        Replace
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground hover:bg-secondary/40">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Uploading…" : `Upload JPG/PNG/WEBP · ≥ ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT}px · ≤ ${MAX_IMAGE_BYTES / 1024 / 1024} MB`}
                    <input type="file" accept={ALLOWED_IMAGE_TYPES.join(",")} className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                  </label>
                )}
                <Input className="mt-2" placeholder="…or paste image URL" value={editing.image_url ?? ""} onChange={(e) => { clearLocalPreview(); set("image_url", e.target.value); }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label>Eyebrow (EN)</Label><Input value={editing.eyebrow_en ?? ""} onChange={(e) => set("eyebrow_en", e.target.value)} /></div>
                <div><Label>Eyebrow (AR)</Label><Input dir="rtl" value={editing.eyebrow_ar ?? ""} onChange={(e) => set("eyebrow_ar", e.target.value)} /></div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Title (EN) *</Label>
                    <AIAssistButton value={editing.title_en ?? ""} onChange={(v) => set("title_en", v)} language="en" size="icon" />
                  </div>
                  <Input value={editing.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Title (AR)</Label>
                    <AIAssistButton value={editing.title_ar ?? ""} onChange={(v) => set("title_ar", v)} language="ar" size="icon" />
                  </div>
                  <Input dir="rtl" value={editing.title_ar ?? ""} onChange={(e) => set("title_ar", e.target.value)} />
                </div>
                <div className="col-span-2 -mt-1">
                  <AITranslateSync
                    enValue={editing.title_en ?? ""}
                    arValue={editing.title_ar ?? ""}
                    onSetEn={(v) => set("title_en", v)}
                    onSetAr={(v) => set("title_ar", v)}
                    label="Title:"
                  />
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Subtitle (EN)</Label>
                      <AIAssistButton value={editing.subtitle_en ?? ""} onChange={(v) => set("subtitle_en", v)} language="en" size="icon" />
                    </div>
                    <Textarea rows={3} value={editing.subtitle_en ?? ""} onChange={(e) => set("subtitle_en", e.target.value)} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Subtitle (AR)</Label>
                      <AIAssistButton value={editing.subtitle_ar ?? ""} onChange={(v) => set("subtitle_ar", v)} language="ar" size="icon" />
                    </div>
                    <Textarea rows={3} dir="rtl" value={editing.subtitle_ar ?? ""} onChange={(e) => set("subtitle_ar", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <AITranslateSync
                      enValue={editing.subtitle_en ?? ""}
                      arValue={editing.subtitle_ar ?? ""}
                      onSetEn={(v) => set("subtitle_en", v)}
                      onSetAr={(v) => set("subtitle_ar", v)}
                      label="Subtitle:"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-secondary/30 p-3">
                <p className="mb-2 text-sm font-semibold">Primary button</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Label (EN)</Label><Input value={editing.primary_label_en ?? ""} onChange={(e) => set("primary_label_en", e.target.value)} /></div>
                  <div><Label>Label (AR)</Label><Input dir="rtl" value={editing.primary_label_ar ?? ""} onChange={(e) => set("primary_label_ar", e.target.value)} /></div>
                  <div><Label>Link</Label><Input placeholder="/quote" value={editing.primary_href ?? ""} onChange={(e) => set("primary_href", e.target.value)} /></div>
                </div>
                <div className="mt-2">
                  <AITranslateSync
                    enValue={editing.primary_label_en ?? ""}
                    arValue={editing.primary_label_ar ?? ""}
                    onSetEn={(v) => set("primary_label_en", v)}
                    onSetAr={(v) => set("primary_label_ar", v)}
                  />
                </div>
              </div>

              <div className="rounded-lg border bg-secondary/30 p-3">
                <p className="mb-2 text-sm font-semibold">Secondary button</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Label (EN)</Label><Input value={editing.secondary_label_en ?? ""} onChange={(e) => set("secondary_label_en", e.target.value)} /></div>
                  <div><Label>Label (AR)</Label><Input dir="rtl" value={editing.secondary_label_ar ?? ""} onChange={(e) => set("secondary_label_ar", e.target.value)} /></div>
                  <div><Label>Link</Label><Input placeholder="/projects" value={editing.secondary_href ?? ""} onChange={(e) => set("secondary_href", e.target.value)} /></div>
                </div>
                <div className="mt-2">
                  <AITranslateSync
                    enValue={editing.secondary_label_en ?? ""}
                    arValue={editing.secondary_label_ar ?? ""}
                    onSetEn={(v) => set("secondary_label_en", v)}
                    onSetAr={(v) => set("secondary_label_ar", v)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label>Overlay</Label>
                  <Select value={editing.overlay} onValueChange={(v) => set("overlay", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Text align</Label>
                  <Select value={editing.align} onValueChange={(v) => set("align", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Sort order (EN)</Label><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} /></div>
                <div><Label>Sort order (AR)</Label><Input type="number" value={editing.sort_order_ar ?? 0} onChange={(e) => set("sort_order_ar", Number(e.target.value))} /></div>
                <div className="flex items-end gap-2"><Switch checked={editing.is_active ?? true} onCheckedChange={(v) => set("is_active", v)} /><span className="text-sm">Active</span></div>
                <div className="flex items-end gap-2"><Switch checked={editing.hide_cta ?? false} onCheckedChange={(v) => set("hide_cta", v)} /><span className="text-sm">Hide CTA buttons</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-secondary/30 p-3">
                <div>
                  <Label>Publish status</Label>
                  <Select value={editing.status ?? "published"} onValueChange={(v) => set("status", v as "draft" | "published")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">Draft slides are hidden from visitors even if Active.</p>
                </div>
                <div>
                  <Label>Scheduled publish at</Label>
                  <Input
                    type="datetime-local"
                    value={editing.scheduled_at ? new Date(editing.scheduled_at).toISOString().slice(0, 16) : ""}
                    onChange={(e) => set("scheduled_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Leave empty to publish immediately. Slides stay hidden until this time.</p>
                </div>
              </div>



              <div className="rounded-lg border bg-secondary/30 p-3">
                <p className="mb-3 text-sm font-semibold">Cinematic backdrop intensity</p>
                <p className="mb-4 text-xs text-muted-foreground">Fine-tune fog density, volumetric spotlights, and the vignette per slide. Values are clamped to 0–1. Set to 0 to disable an effect.</p>

                <div className="grid gap-4 md:grid-cols-[1fr,240px]">
                  <div>
                    {(["fog_intensity", "spotlight_intensity", "vignette_intensity"] as const).map((key) => {
                      const label = key === "fog_intensity" ? "Fog" : key === "spotlight_intensity" ? "Spotlights" : "Vignette";
                      const val = clamp01(editing[key] ?? 0.6);
                      return (
                        <div key={key} className="mb-3">
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <Label>{label}</Label>
                            <span className="tabular-nums text-muted-foreground">{val.toFixed(2)}</span>
                          </div>
                          <Slider
                            value={[val]}
                            min={0}
                            max={1}
                            step={0.05}
                            onValueChange={(v) => set(key, clamp01(v[0]))}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="min-w-0">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Live preview</p>
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border bg-ink">
                      {editing.image_url ? (
                        <img src={editing.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
                      )}
                      <div
                        aria-hidden
                        className={
                          editing.overlay === "light"
                            ? "absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-ink/60"
                            : editing.overlay === "none"
                            ? "absolute inset-0 bg-ink/20"
                            : "absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink"
                        }
                      />
                      <CinematicBackdrop
                        fog={clamp01(editing.fog_intensity ?? 0.6)}
                        spotlights={clamp01(editing.spotlight_intensity ?? 0.6)}
                        vignette={clamp01(editing.vignette_intensity ?? 0.6)}
                      />
                      <div className="absolute inset-x-2 bottom-2 text-[10px] text-white/70">
                        Fog {clamp01(editing.fog_intensity ?? 0.6).toFixed(2)} · Spot {clamp01(editing.spotlight_intensity ?? 0.6).toFixed(2)} · Vig {clamp01(editing.vignette_intensity ?? 0.6).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this slide?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={remove}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
