import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
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
  is_active: true, sort_order: 0,
  fog_intensity: 0.6, spotlight_intensity: 0.6, vignette_intensity: 0.6,
} as SlideInput;

function AdminHeroSlides() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SlideInput | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("hero_slides").select("*").order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setSlides(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function startNew() {
    setEditingId(null);
    setEditing({ ...empty, sort_order: (slides.at(-1)?.sort_order ?? 0) + 1 });
  }
  function startEdit(s: Slide) {
    setEditingId(s.id);
    setEditing({ ...s });
  }

  async function upload(file: File) {
    setUploading(true);
    try {
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
    const payload = { ...editing };
    const res = editingId
      ? await supabase.from("hero_slides").update(payload).eq("id", editingId)
      : await supabase.from("hero_slides").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editingId ? "Slide updated" : "Slide created");
    setEditing(null); setEditingId(null);
    load();
  }

  async function remove() {
    if (!deleteId) return;
    const { error } = await supabase.from("hero_slides").delete().eq("id", deleteId);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setDeleteId(null);
    load();
  }

  async function reorder(id: string, dir: -1 | 1) {
    const idx = slides.findIndex((s) => s.id === id);
    const swap = slides[idx + dir];
    if (!swap) return;
    const a = slides[idx];
    await Promise.all([
      supabase.from("hero_slides").update({ sort_order: swap.sort_order }).eq("id", a.id),
      supabase.from("hero_slides").update({ sort_order: a.sort_order }).eq("id", swap.id),
    ]);
    load();
  }

  async function toggleActive(s: Slide) {
    await supabase.from("hero_slides").update({ is_active: !s.is_active }).eq("id", s.id);
    load();
  }

  const set = <K extends keyof SlideInput>(k: K, v: SlideInput[K]) => setEditing((e) => (e ? { ...e, [k]: v } : e));

  return (
    <AdminShell title="Hero Slides">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Animated homepage banner. Drag order with arrows. Everything shown to visitors is fully editable.</p>
        <Button onClick={startNew}><Plus className="mr-2 h-4 w-4" />New slide</Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : slides.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">No slides yet. Create the first one.</div>
      ) : (
        <div className="grid gap-4">
          {slides.map((s, i) => (
            <div key={s.id} className="flex items-center gap-4 rounded-lg border bg-card p-3">
              <img src={s.image_url} alt="" className="h-20 w-32 flex-none rounded object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">#{s.sort_order}</span>
                  <h3 className="truncate font-semibold">{s.title_en}</h3>
                  {!s.is_active && <span className="rounded bg-muted px-2 py-0.5 text-xs">Hidden</span>}
                </div>
                <p className="line-clamp-1 text-sm text-muted-foreground">{s.subtitle_en}</p>
              </div>
              <div className="flex items-center gap-1">
                <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => reorder(s.id, -1)}><ArrowUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" disabled={i === slides.length - 1} onClick={() => reorder(s.id, 1)}><ArrowDown className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => startEdit(s)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit slide" : "New slide"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div>
                <Label>Image</Label>
                {editing.image_url ? (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={editing.image_url} alt="" className="h-24 w-40 rounded object-cover" />
                    <Button variant="outline" size="sm" onClick={() => set("image_url", "")}>Replace</Button>
                  </div>
                ) : (
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground hover:bg-secondary/40">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Uploading…" : "Click to upload image"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                  </label>
                )}
                <Input className="mt-2" placeholder="…or paste image URL" value={editing.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label>Eyebrow (EN)</Label><Input value={editing.eyebrow_en ?? ""} onChange={(e) => set("eyebrow_en", e.target.value)} /></div>
                <div><Label>Eyebrow (AR)</Label><Input dir="rtl" value={editing.eyebrow_ar ?? ""} onChange={(e) => set("eyebrow_ar", e.target.value)} /></div>
                <div><Label>Title (EN) *</Label><Input value={editing.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} /></div>
                <div><Label>Title (AR)</Label><Input dir="rtl" value={editing.title_ar ?? ""} onChange={(e) => set("title_ar", e.target.value)} /></div>
                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <div><Label>Subtitle (EN)</Label><Textarea rows={3} value={editing.subtitle_en ?? ""} onChange={(e) => set("subtitle_en", e.target.value)} /></div>
                  <div><Label>Subtitle (AR)</Label><Textarea rows={3} dir="rtl" value={editing.subtitle_ar ?? ""} onChange={(e) => set("subtitle_ar", e.target.value)} /></div>
                </div>
              </div>

              <div className="rounded-lg border bg-secondary/30 p-3">
                <p className="mb-2 text-sm font-semibold">Primary button</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Label (EN)</Label><Input value={editing.primary_label_en ?? ""} onChange={(e) => set("primary_label_en", e.target.value)} /></div>
                  <div><Label>Label (AR)</Label><Input dir="rtl" value={editing.primary_label_ar ?? ""} onChange={(e) => set("primary_label_ar", e.target.value)} /></div>
                  <div><Label>Link</Label><Input placeholder="/quote" value={editing.primary_href ?? ""} onChange={(e) => set("primary_href", e.target.value)} /></div>
                </div>
              </div>

              <div className="rounded-lg border bg-secondary/30 p-3">
                <p className="mb-2 text-sm font-semibold">Secondary button</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Label (EN)</Label><Input value={editing.secondary_label_en ?? ""} onChange={(e) => set("secondary_label_en", e.target.value)} /></div>
                  <div><Label>Label (AR)</Label><Input dir="rtl" value={editing.secondary_label_ar ?? ""} onChange={(e) => set("secondary_label_ar", e.target.value)} /></div>
                  <div><Label>Link</Label><Input placeholder="/projects" value={editing.secondary_href ?? ""} onChange={(e) => set("secondary_href", e.target.value)} /></div>
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
                <div><Label>Sort order</Label><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} /></div>
                <div className="flex items-end gap-2"><Switch checked={editing.is_active ?? true} onCheckedChange={(v) => set("is_active", v)} /><span className="text-sm">Active</span></div>
                <div className="flex items-end gap-2"><Switch checked={(editing as any).hide_cta ?? false} onCheckedChange={(v) => set("hide_cta" as any, v)} /><span className="text-sm">Hide CTA buttons</span></div>
              </div>

              <div className="rounded-lg border bg-secondary/30 p-3">
                <p className="mb-3 text-sm font-semibold">Cinematic backdrop intensity</p>
                <p className="mb-4 text-xs text-muted-foreground">Fine-tune fog density, volumetric spotlights, and the vignette per slide. Set to 0 to disable an effect.</p>
                {(["fog_intensity", "spotlight_intensity", "vignette_intensity"] as const).map((key) => {
                  const label = key === "fog_intensity" ? "Fog" : key === "spotlight_intensity" ? "Spotlights" : "Vignette";
                  const val = ((editing as any)[key] ?? 0.6) as number;
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
                        onValueChange={(v) => set(key as any, v[0] as any)}
                      />
                    </div>
                  );
                })}
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
