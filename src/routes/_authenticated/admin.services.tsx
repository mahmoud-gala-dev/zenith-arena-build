import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { TableRowsSkeleton } from "@/components/site/Skeletons";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { StrictImageUrlField, type FieldStatus } from "@/components/admin/StrictImageUrlField";
import { GalleryOrderEditor } from "@/components/admin/GalleryOrderEditor";
import { ServiceLivePreview } from "@/components/admin/ServiceLivePreview";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ImageVariantsManifest } from "@/hooks/useSignedImage";
import { invalidateManifestCache } from "@/hooks/useSignedImage";
import { insertImageVersion } from "@/hooks/useImageVersions";
import { ImageHistoryButton } from "@/components/admin/ImageHistoryButton";


export const Route = createFileRoute("/_authenticated/admin/services")({
  component: AdminServicesPage,
});


type ServiceRow = {
  id?: string;
  slug_en: string;
  slug_ar: string | null;
  title_en: string;
  title_ar: string | null;
  category: string | null;
  icon: string | null;
  description_en: string | null;
  description_ar: string | null;
  cover_image: string | null;
  header_image: string | null;
  og_image: string | null;
  cover_image_variants: ImageVariantsManifest | null;
  header_image_variants: ImageVariantsManifest | null;
  og_image_variants: ImageVariantsManifest | null;
  alt_en: string | null;
  alt_ar: string | null;
  gallery_images: string[];
  seo_title_en: string | null;
  seo_title_ar: string | null;
  seo_description_en: string | null;
  seo_description_ar: string | null;
  status: string;
  featured: boolean;
  sort_order: number;
  updated_at?: string;
};

const EMPTY: ServiceRow = {
  slug_en: "", slug_ar: "", title_en: "", title_ar: "",
  category: "Sports Courts", icon: "Goal",
  description_en: "", description_ar: "",
  cover_image: "", header_image: "", og_image: "",
  cover_image_variants: null, header_image_variants: null, og_image_variants: null,
  alt_en: "", alt_ar: "",
  gallery_images: [],
  seo_title_en: "", seo_title_ar: "",
  seo_description_en: "", seo_description_ar: "",
  status: "published", featured: false, sort_order: 0,
};


function toArray(g: unknown): string[] {
  if (Array.isArray(g)) return g.filter((v): v is string => typeof v === "string");
  if (typeof g === "string" && g.trim()) { try { const p = JSON.parse(g); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
}

function AdminServicesPage() {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("services").select("*").order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setRows(((data ?? []) as unknown as ServiceRow[]).map((r) => ({ ...r, gallery_images: toArray(r.gallery_images) })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function validate(v: ServiceRow): string | null {
    if (!v.slug_en.trim()) return "English slug is required";
    if (!v.title_en.trim()) return "English title is required";
    if (v.slug_en.length > 140) return "Slug too long";
    return null;
  }

  async function save() {
    if (!editing) return;
    const err = validate(editing);
    if (err) { toast.error(err); return; }
    setSaving(true);
    const { id, updated_at: _u, ...rest } = editing;
    void _u;
    const payload = { ...rest, gallery_images: rest.gallery_images ?? [] };
    const { error } = id
      ? await supabase.from("services").update(payload).eq("id", id)
      : await supabase.from("services").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Service saved");
    setEditing(null);
    load();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("services").delete().eq("id", deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success("Service deleted");
    setDeleteId(null);
    setRows((p) => p.filter((r) => r.id !== deleteId));
  }

  return (
    <AdminShell title="Services CMS">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Manage service pages with strict image validation, drag-and-drop gallery ordering, and live page preview.</p>
            <div className="mt-2 flex gap-2 text-xs">
              <Badge variant="secondary">{rows.length} total</Badge>
              <Badge variant="outline">{rows.filter((r) => r.status === "published").length} published</Badge>
            </div>
          </div>
          <Button onClick={() => setEditing({ ...EMPTY })}><Plus className="h-4 w-4" /> New service</Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Cover</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Gallery</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <TableRowsSkeleton rows={5} columns={5} />
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">No services yet.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    {row.cover_image ? <img src={row.cover_image} alt={row.alt_en || row.title_en} className="h-12 w-16 rounded object-cover" loading="lazy" /> : <div className="h-12 w-16 rounded bg-secondary" />}
                  </td>
                  <td className="px-4 py-3 font-medium">{row.title_en}<div className="text-xs text-muted-foreground" dir="rtl">{row.title_ar}</div></td>
                  <td className="px-4 py-3 text-muted-foreground">{row.slug_en}</td>
                  <td className="px-4 py-3"><Badge variant="secondary">{row.gallery_images.length} images</Badge></td>
                  <td className="px-4 py-3"><Badge variant={row.status === "published" ? "default" : "outline"}>{row.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing({ ...row, gallery_images: toArray(row.gallery_images) })}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => row.id && setDeleteId(row.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit service" : "New service"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              {/* Form */}
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="English slug *"><Input value={editing.slug_en} onChange={(e) => setEditing({ ...editing, slug_en: e.target.value })} /></Field>
                  <Field label="Arabic slug"><Input dir="rtl" value={editing.slug_ar ?? ""} onChange={(e) => setEditing({ ...editing, slug_ar: e.target.value })} /></Field>
                  <Field label="English title *"><Input value={editing.title_en} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} /></Field>
                  <Field label="Arabic title"><Input dir="rtl" value={editing.title_ar ?? ""} onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} /></Field>
                  <Field label="Category"><Input value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></Field>
                  <Field label="Icon"><Input value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} /></Field>
                  <Field label="English alt text (for images)"><Input value={editing.alt_en ?? ""} onChange={(e) => setEditing({ ...editing, alt_en: e.target.value })} maxLength={180} /></Field>
                  <Field label="Arabic alt text"><Input dir="rtl" value={editing.alt_ar ?? ""} onChange={(e) => setEditing({ ...editing, alt_ar: e.target.value })} maxLength={180} /></Field>
                </div>

                <Field label="English description"><Textarea rows={3} value={editing.description_en ?? ""} onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} maxLength={2500} /></Field>
                <Field label="Arabic description"><Textarea dir="rtl" rows={3} value={editing.description_ar ?? ""} onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })} maxLength={2500} /></Field>

                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="mb-3 text-sm font-medium">Images — pick a tab, then Upload &amp; Crop or paste a URL.</p>
                  <Tabs defaultValue="cover">
                    <TabsList className="mb-3">
                      <TabsTrigger value="cover">Cover (16:10)</TabsTrigger>
                      <TabsTrigger value="header">Header (21:9)</TabsTrigger>
                      <TabsTrigger value="og">Social (1.91:1)</TabsTrigger>
                    </TabsList>
                    <TabsContent value="cover" className="mt-0">
                      <StrictImageUrlField
                        label="Cover image (card thumbnail)"
                        value={editing.cover_image ?? ""}
                        onChange={(v) => setEditing({ ...editing, cover_image: v })}
                        variants={editing.cover_image_variants}
                        onVariantsChange={(m) => setEditing({ ...editing, cover_image_variants: m })}
                        aspect="aspect-[16/10]"
                        aspectRatio={16 / 10}
                        options={{ minWidth: 600, minHeight: 375 }}
                        help="Recommended 1200×750 · WebP variants auto-generated · ≤ 8MB"
                        folder="services/cover"
                      />
                    </TabsContent>
                    <TabsContent value="header" className="mt-0">
                      <StrictImageUrlField
                        label="Header image (page hero)"
                        value={editing.header_image ?? ""}
                        onChange={(v) => setEditing({ ...editing, header_image: v })}
                        variants={editing.header_image_variants}
                        onVariantsChange={(m) => setEditing({ ...editing, header_image_variants: m })}
                        aspect="aspect-[21/9]"
                        aspectRatio={21 / 9}
                        options={{ minWidth: 1200, minHeight: 500 }}
                        help="Recommended 1920×820 · WebP variants auto-generated · ≤ 8MB"
                        folder="services/header"
                      />
                    </TabsContent>
                    <TabsContent value="og" className="mt-0">
                      <StrictImageUrlField
                        label="Social share image (og:image)"
                        value={editing.og_image ?? ""}
                        onChange={(v) => setEditing({ ...editing, og_image: v })}
                        variants={editing.og_image_variants}
                        onVariantsChange={(m) => setEditing({ ...editing, og_image_variants: m })}
                        aspect="aspect-[1200/630]"
                        aspectRatio={1200 / 630}
                        options={{ minWidth: 1200, minHeight: 630 }}
                        help="Facebook/Twitter card — 1200×630 recommended"
                        folder="services/og"
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <GalleryOrderEditor
                    label="Gallery images (drag to reorder)"
                    value={editing.gallery_images}
                    onChange={(v) => setEditing({ ...editing, gallery_images: v })}
                  />
                </div>


                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="SEO title (EN)"><Input value={editing.seo_title_en ?? ""} onChange={(e) => setEditing({ ...editing, seo_title_en: e.target.value })} maxLength={70} /></Field>
                  <Field label="SEO title (AR)"><Input dir="rtl" value={editing.seo_title_ar ?? ""} onChange={(e) => setEditing({ ...editing, seo_title_ar: e.target.value })} maxLength={70} /></Field>
                  <Field label="SEO description (EN)"><Textarea rows={2} value={editing.seo_description_en ?? ""} onChange={(e) => setEditing({ ...editing, seo_description_en: e.target.value })} maxLength={200} /></Field>
                  <Field label="SEO description (AR)"><Textarea dir="rtl" rows={2} value={editing.seo_description_ar ?? ""} onChange={(e) => setEditing({ ...editing, seo_description_ar: e.target.value })} maxLength={200} /></Field>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={editing.featured} onCheckedChange={(c) => setEditing({ ...editing, featured: c })} /> Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    Status
                    <select className="rounded border border-border bg-background px-2 py-1" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                  <Field label="Sort order"><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field>
                </div>
              </div>

              {/* Live preview */}
              <div className="lg:sticky lg:top-4 lg:h-fit">
                <ServiceLivePreview values={editing as unknown as Record<string, unknown>} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete service?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
