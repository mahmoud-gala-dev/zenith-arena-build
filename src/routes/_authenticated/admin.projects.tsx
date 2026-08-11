import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useInvalidateTables } from "@/lib/invalidate";
import { StrictImageUrlField } from "@/components/admin/StrictImageUrlField";
import { GalleryOrderEditor } from "@/components/admin/GalleryOrderEditor";
import { AIAssistButton, AITranslateSync, AIContentDialog } from "@/components/admin/ai";


export const Route = createFileRoute("/_authenticated/admin/projects")({
  component: ProjectsPage,
});

type Project = {
  id: string;
  slug_en: string;
  title_en: string;
  title_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  client: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  year: number | null;
  sport_type: string | null;
  cover_image: string | null;
  gallery: string[] | null;
  status: string;
  featured: boolean;
  governorate_id: string | null;
  created_at: string;
};

type GovOption = { id: string; name_en: string; name_ar: string };

const emptyProject: Partial<Project> = {
  slug_en: "", title_en: "", title_ar: "", description_en: "", description_ar: "",
  client: "", location: "", country: "", city: "", year: new Date().getFullYear(),
  sport_type: "", cover_image: "", gallery: [], status: "published", featured: false, governorate_id: null,
};

function ProjectsPage() {
  const invalidate = useInvalidateTables(["projects"]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Partial<Project> | null>(null);
  const [govs, setGovs] = useState<GovOption[]>([]);

  async function load() {
    setLoading(true);
    const [{ data, error }, { data: gdata }] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("governorates").select("id,name_en,name_ar").order("sort_order"),
    ]);
    if (error) toast.error(error.message);
    setProjects((data ?? []) as Project[]);
    setGovs((gdata ?? []) as GovOption[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    if (!editing.slug_en || !editing.title_en) return toast.error("Slug and English title are required");
    const payload = {
      slug_en: editing.slug_en, title_en: editing.title_en, title_ar: editing.title_ar || null,
      description_en: editing.description_en || null, description_ar: editing.description_ar || null,
      client: editing.client || null, location: editing.location || null,
      country: editing.country || null, city: editing.city || null,
      year: editing.year ? Number(editing.year) : null, sport_type: editing.sport_type || null,
      cover_image: editing.cover_image || null, status: editing.status || "published",
      gallery: Array.isArray(editing.gallery) ? editing.gallery : [],
      featured: !!editing.featured,
      governorate_id: editing.governorate_id || null,
    };
    const { error } = editing.id
      ? await supabase.from("projects").update(payload).eq("id", editing.id)
      : await supabase.from("projects").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    invalidate();
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    invalidate();
    load();
  }


  return (
    <AdminShell title="Projects">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing({ ...emptyProject })}><Plus className="mr-2 h-4 w-4" /> New project</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Loading…</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No projects yet. Create one to get started.</td></tr>
            ) : projects.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-foreground">{p.title_en}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.client ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.location ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.year ?? "—"}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs uppercase">{p.status}</span></td>
                <td className="px-4 py-3">{p.featured ? "★" : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit project" : "New project"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 flex items-center justify-between gap-2 flex-wrap rounded-md border bg-muted/30 p-2">
                <span className="text-xs text-muted-foreground">✨ AI helpers</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <AIContentDialog
                    triggerLabel="Draft project story"
                    defaultKind="project_story"
                    defaultLanguage="en"
                    onInsert={(text) => setEditing({ ...editing, description_en: (editing.description_en ? editing.description_en + "\n\n" : "") + text })}
                    targetTable="projects"
                    targetId={editing.id}
                  />
                  <AITranslateSync
                    enValue={editing.description_en ?? ""}
                    arValue={editing.description_ar ?? ""}
                    onSetEn={(t) => setEditing({ ...editing, description_en: t })}
                    onSetAr={(t) => setEditing({ ...editing, description_ar: t })}
                    label="Sync EN↔AR"
                  />
                </div>
              </div>
              <Field label="Slug (EN) *"><Input value={editing.slug_en ?? ""} onChange={(e) => setEditing({ ...editing, slug_en: e.target.value })} /></Field>
              <Field label="Year"><Input type="number" value={editing.year ?? ""} onChange={(e) => setEditing({ ...editing, year: Number(e.target.value) })} /></Field>
              <Field label="Title (EN) *">
                <div className="flex gap-2">
                  <Input value={editing.title_en ?? ""} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} />
                  <AIAssistButton value={editing.title_en ?? ""} onChange={(t) => setEditing({ ...editing, title_en: t })} language="en" />
                </div>
              </Field>
              <Field label="Title (AR)">
                <div className="flex gap-2">
                  <Input value={editing.title_ar ?? ""} onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} dir="rtl" />
                  <AIAssistButton value={editing.title_ar ?? ""} onChange={(t) => setEditing({ ...editing, title_ar: t })} language="ar" />
                </div>
              </Field>
              <Field label="Client"><Input value={editing.client ?? ""} onChange={(e) => setEditing({ ...editing, client: e.target.value })} /></Field>
              <Field label="Sport type"><Input value={editing.sport_type ?? ""} onChange={(e) => setEditing({ ...editing, sport_type: e.target.value })} /></Field>
              <Field label="Country"><Input value={editing.country ?? ""} onChange={(e) => setEditing({ ...editing, country: e.target.value })} /></Field>
              <Field label="City"><Input value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></Field>
              <Field label="Location (display)"><Input value={editing.location ?? ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></Field>
              <Field label="Governorate">
                <select value={editing.governorate_id ?? ""} onChange={(e) => setEditing({ ...editing, governorate_id: e.target.value || null })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— None —</option>
                  {govs.map((g) => (<option key={g.id} value={g.id}>{g.name_en} — {g.name_ar}</option>))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <StrictImageUrlField
                  label="Cover image"
                  value={editing.cover_image ?? ""}
                  onChange={(v) => setEditing({ ...editing, cover_image: v })}
                  bucket="media"
                  folder="projects/covers"
                  aspect="aspect-[16/9]"
                  aspectRatio={16 / 9}
                  help="Upload & crop, or paste a URL. Recommended 1600×900."
                />
              </div>
              <div className="sm:col-span-2">
                <GalleryOrderEditor
                  label="Project gallery"
                  value={Array.isArray(editing.gallery) ? editing.gallery : []}
                  onChange={(next) => setEditing({ ...editing, gallery: next })}
                  bucket="media"
                  folder="projects/gallery"
                />

              </div>
              <div className="sm:col-span-2">
                <Field label={<span className="flex items-center justify-between">Description (EN) <AIAssistButton value={editing.description_en ?? ""} onChange={(t) => setEditing({ ...editing, description_en: t })} language="en" size="sm" /></span>}>
                  <Textarea rows={3} value={editing.description_en ?? ""} onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label={<span className="flex items-center justify-between">Description (AR) <AIAssistButton value={editing.description_ar ?? ""} onChange={(t) => setEditing({ ...editing, description_ar: t })} language="ar" size="sm" /></span>}>
                  <Textarea rows={3} dir="rtl" value={editing.description_ar ?? ""} onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })} />
                </Field>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={!!editing.featured} onCheckedChange={(v) => setEditing({ ...editing, featured: v })} />
                <Label>Featured</Label>
              </div>
              <Field label="Status">
                <select value={editing.status ?? "published"} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
