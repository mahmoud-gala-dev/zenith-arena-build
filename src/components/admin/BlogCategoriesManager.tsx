import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FolderTree, Plus, Pencil, Trash2, Loader2, ArrowUp, ArrowDown } from "lucide-react";

export type BlogCategory = {
  id: string;
  slug_en: string;
  slug_ar?: string | null;
  title_en: string;
  title_ar: string;
  description_en?: string | null;
  description_ar?: string | null;
  sort_order: number;
  status: "published" | "draft" | "archived";
};

type Editable = Partial<BlogCategory>;

const EMPTY: Editable = {
  slug_en: "", slug_ar: "", title_en: "", title_ar: "",
  description_en: "", description_ar: "", sort_order: 0, status: "published",
};

function slugify(s: string) {
  return (s || "").toLowerCase().trim()
    .replace(/[^\w\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

export function BlogCategoriesManager({ onChanged }: { onChanged?: () => void }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Editable | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [usage, setUsage] = useState<Record<string, number>>({});

  async function load() {
    setLoading(true);
    const [{ data, error }, { data: posts }] = await Promise.all([
      supabase.from("blog_categories").select("*").order("sort_order").order("title_en"),
      supabase.from("blog_posts").select("category_id"),
    ]);
    if (error) toast.error(error.message);
    setRows((data as BlogCategory[]) ?? []);
    const counts: Record<string, number> = {};
    (posts ?? []).forEach((p: { category_id: string | null }) => {
      if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
    });
    setUsage(counts);
    setLoading(false);
  }

  useEffect(() => { if (open) load(); }, [open]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.sort_order - b.sort_order || a.title_en.localeCompare(b.title_en)),
    [rows],
  );

  async function save() {
    if (!editing) return;
    const payload: Editable = {
      ...editing,
      slug_en: editing.slug_en || slugify(editing.title_en || ""),
      slug_ar: editing.slug_ar || null,
      sort_order: Number(editing.sort_order ?? 0),
    };
    if (!payload.title_en || !payload.title_ar || !payload.slug_en) {
      return toast.error("Title (EN/AR) and slug are required.");
    }
    setSaving(true);
    const res = editing.id
      ? await supabase.from("blog_categories").update(payload as never).eq("id", editing.id)
      : await supabase.from("blog_categories").insert(payload as never);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing.id ? "Category updated" : "Category created");
    setEditing(null);
    await load();
    onChanged?.();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("blog_categories").delete().eq("id", deleteId);
    if (error) return toast.error(error.message);
    toast.success("Category deleted");
    setDeleteId(null);
    await load();
    onChanged?.();
  }

  async function move(row: BlogCategory, dir: -1 | 1) {
    const idx = sorted.findIndex((r) => r.id === row.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    const { error } = await supabase.from("blog_categories").upsert([
      { ...row, sort_order: swap.sort_order },
      { ...swap, sort_order: row.sort_order },
    ] as never);
    if (error) return toast.error(error.message);
    await load();
    onChanged?.();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline"><FolderTree className="h-4 w-4" /> Manage categories</Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Knowledge Center — Categories</DialogTitle>
          </DialogHeader>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => setEditing({ ...EMPTY })}>
              <Plus className="h-4 w-4" /> New category
            </Button>
          </div>

          <div className="rounded-lg border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="p-2 w-10">#</th>
                  <th className="p-2">Title (EN / AR)</th>
                  <th className="p-2 w-32">Slug</th>
                  <th className="p-2 w-24">Status</th>
                  <th className="p-2 w-16">Posts</th>
                  <th className="p-2 w-40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline" /> Loading…</td></tr>}
                {!loading && sorted.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No categories yet.</td></tr>
                )}
                {!loading && sorted.map((r, i) => (
                  <tr key={r.id} className="border-t border-border/50 hover:bg-muted/20">
                    <td className="p-2 text-muted-foreground">{r.sort_order}</td>
                    <td className="p-2">
                      <div className="font-medium text-foreground">{r.title_en}</div>
                      <div className="text-xs text-muted-foreground" dir="rtl">{r.title_ar}</div>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">/{r.slug_en}</td>
                    <td className="p-2">
                      <Badge variant={r.status === "published" ? "default" : "outline"} className="text-[10px] capitalize">{r.status}</Badge>
                    </td>
                    <td className="p-2 text-muted-foreground">{usage[r.id] ?? 0}</td>
                    <td className="p-2">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(r, -1)}><ArrowUp className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" disabled={i === sorted.length - 1} onClick={() => move(r, 1)}><ArrowDown className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Title (EN) *</Label>
                  <Input
                    value={editing.title_en ?? ""}
                    onChange={(e) => setEditing({
                      ...editing, title_en: e.target.value,
                      slug_en: editing.id ? editing.slug_en : slugify(e.target.value),
                    })}
                  />
                </div>
                <div>
                  <Label>Title (AR) *</Label>
                  <Input dir="rtl" value={editing.title_ar ?? ""} onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} />
                </div>
                <div>
                  <Label>Slug (EN) *</Label>
                  <Input value={editing.slug_en ?? ""} onChange={(e) => setEditing({ ...editing, slug_en: slugify(e.target.value) })} />
                </div>
                <div>
                  <Label>Slug (AR)</Label>
                  <Input dir="rtl" value={editing.slug_ar ?? ""} onChange={(e) => setEditing({ ...editing, slug_ar: slugify(e.target.value) })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Description (EN)</Label>
                  <Textarea rows={2} value={editing.description_en ?? ""} onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Description (AR)</Label>
                  <Textarea rows={2} dir="rtl" value={editing.description_ar ?? ""} onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })} />
                </div>
                <div>
                  <Label>Sort order</Label>
                  <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status ?? "published"} onValueChange={(v) => setEditing({ ...editing, status: v as BlogCategory["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Articles in this category will become uncategorized. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
