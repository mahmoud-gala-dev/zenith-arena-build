import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Tags as TagsIcon, Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";

export type Tag = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
};

type Editable = Partial<Tag>;

const EMPTY: Editable = { slug: "", name_en: "", name_ar: "" };

export function slugifyTag(s: string) {
  return (s || "").toLowerCase().trim()
    .replace(/[^\w\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60);
}

export function TagsManager({ onChanged }: { onChanged?: () => void }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Editable | null>(null);
  const [deleteRow, setDeleteRow] = useState<Tag | null>(null);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    const [{ data, error }, { data: posts }] = await Promise.all([
      supabase.from("tags").select("*").order("name_en"),
      supabase.from("blog_posts").select("tags"),
    ]);
    if (error) toast.error(error.message);
    setRows((data as Tag[]) ?? []);
    const counts: Record<string, number> = {};
    (posts ?? []).forEach((p: { tags: string[] | null }) => {
      (p.tags ?? []).forEach((t) => { counts[t] = (counts[t] ?? 0) + 1; });
    });
    setUsage(counts);
    setLoading(false);
  }

  useEffect(() => { if (open) load(); }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.slug, r.name_en, r.name_ar].some((v) => (v ?? "").toLowerCase().includes(q))
    );
  }, [rows, query]);

  async function save() {
    if (!editing) return;
    const name_en = (editing.name_en ?? "").trim();
    const name_ar = (editing.name_ar ?? "").trim();
    const slug = slugifyTag(editing.slug || name_en || name_ar);
    if (!name_en || !name_ar) return toast.error("Both English and Arabic names are required.");
    if (!slug) return toast.error("Slug is required.");
    const dup = rows.find((r) => r.slug === slug && r.id !== editing.id);
    if (dup) return toast.error(`Slug "${slug}" is already used.`);

    setSaving(true);
    const payload = { slug, name_en, name_ar };
    const res = editing.id
      ? await supabase.from("tags").update(payload as never).eq("id", editing.id)
      : await supabase.from("tags").insert(payload as never);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing.id ? "Tag updated" : "Tag created");
    setEditing(null);
    await load();
    onChanged?.();
  }

  async function confirmDelete() {
    if (!deleteRow) return;
    const { error } = await supabase.from("tags").delete().eq("id", deleteRow.id);
    if (error) return toast.error(error.message);
    // Remove the deleted tag slug from any blog_posts that reference it.
    const affected = await supabase
      .from("blog_posts")
      .select("id, tags")
      .contains("tags", [deleteRow.slug]);
    if (affected.data?.length) {
      await Promise.all(
        affected.data.map((p: { id: string; tags: string[] | null }) =>
          supabase.from("blog_posts")
            .update({ tags: (p.tags ?? []).filter((t) => t !== deleteRow.slug) } as never)
            .eq("id", p.id)
        )
      );
    }
    toast.success("Tag deleted");
    setDeleteRow(null);
    await load();
    onChanged?.();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline"><TagsIcon className="h-4 w-4" /> Manage tags</Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Knowledge Center — Tags</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tags…" />
            </div>
            <Button size="sm" onClick={() => setEditing({ ...EMPTY })}>
              <Plus className="h-4 w-4" /> New tag
            </Button>
          </div>

          <div className="rounded-lg border border-border/60 overflow-hidden max-h-[55vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left sticky top-0">
                <tr>
                  <th className="p-2">Name (EN / AR)</th>
                  <th className="p-2 w-40">Slug</th>
                  <th className="p-2 w-16">Uses</th>
                  <th className="p-2 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline" /> Loading…</td></tr>}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No tags yet.</td></tr>
                )}
                {!loading && filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border/50 hover:bg-muted/20">
                    <td className="p-2">
                      <div className="font-medium text-foreground">{r.name_en}</div>
                      <div className="text-xs text-muted-foreground" dir="rtl">{r.name_ar}</div>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground font-mono">{r.slug}</td>
                    <td className="p-2 text-muted-foreground">{usage[r.slug] ?? 0}</td>
                    <td className="p-2">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteRow(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit tag" : "New tag"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div>
                <Label>Name (EN) *</Label>
                <Input
                  value={editing.name_en ?? ""}
                  onChange={(e) => setEditing({
                    ...editing, name_en: e.target.value,
                    slug: editing.id ? editing.slug : slugifyTag(e.target.value),
                  })}
                />
              </div>
              <div>
                <Label>Name (AR) *</Label>
                <Input dir="rtl" value={editing.name_ar ?? ""} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: slugifyTag(e.target.value) })} />
                <p className="text-xs text-muted-foreground mt-1">Lowercase, hyphen-separated. Used in URLs and stored on articles.</p>
              </div>
              {editing.id && usage[editing.slug ?? ""] > 0 && (
                <Badge variant="secondary" className="w-fit text-xs">
                  Used on {usage[editing.slug!]} article{usage[editing.slug!] === 1 ? "" : "s"}
                </Badge>
              )}
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

      <AlertDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tag "{deleteRow?.name_en}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {(usage[deleteRow?.slug ?? ""] ?? 0) > 0
                ? `This tag is used on ${usage[deleteRow!.slug]} article(s). It will be removed from all of them.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
