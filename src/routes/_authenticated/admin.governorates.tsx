import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useInvalidateTables } from "@/lib/invalidate";
import { AITranslateSync } from "@/components/admin/ai";
import { TableRowsSkeleton } from "@/components/site/Skeletons";
import { usePaged, AdminPagination } from "@/components/admin/AdminPagination";


export const Route = createFileRoute("/_authenticated/admin/governorates")({
  component: GovernoratesPage,
});

type Gov = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  region_en: string | null;
  region_ar: string | null;
  logo_url: string | null;
  sort_order: number;
  active: boolean;
};

const empty: Partial<Gov> = { slug: "", name_en: "", name_ar: "", region_en: "", region_ar: "", logo_url: "", sort_order: 0, active: true };

function GovernoratesPage() {
  const invalidate = useInvalidateTables(["governorates"]);
  const [rows, setRows] = useState<Gov[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Gov> | null>(null);


  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("governorates").select("*").order("sort_order");
    if (error) toast.error(error.message);
    setRows((data ?? []) as unknown as Gov[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    if (!editing.slug || !editing.name_en || !editing.name_ar) return toast.error("Slug, EN name and AR name are required");
    const payload = {
      slug: editing.slug, name_en: editing.name_en, name_ar: editing.name_ar,
      region_en: editing.region_en || null, region_ar: editing.region_ar || null,
      logo_url: editing.logo_url || null, sort_order: Number(editing.sort_order) || 0, active: !!editing.active,
    };
    const { error } = editing.id
      ? await supabase.from("governorates").update(payload).eq("id", editing.id)
      : await supabase.from("governorates").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setEditing(null); invalidate(); load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this governorate? Assigned projects will be unlinked.")) return;
    const { error } = await supabase.from("governorates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); invalidate(); load();
  }


  return (
    <AdminShell title="Governorates">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing({ ...empty })}><Plus className="mr-2 h-4 w-4" /> New governorate</Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Logo</th>
              <th className="px-4 py-3">Name (EN)</th>
              <th className="px-4 py-3">Name (AR)</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <TableRowsSkeleton rows={8} columns={7} />
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No governorates yet.</td></tr>
            ) : pageItems.map((g) => (
              <tr key={g.id}>
                <td className="px-4 py-3">
                  {g.logo_url ? <img src={g.logo_url} alt={g.name_en} className="h-10 w-10 rounded bg-secondary object-contain p-1" /> : <div className="h-10 w-10 rounded bg-secondary" />}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{g.name_en}</td>
                <td className="px-4 py-3 text-foreground" dir="rtl">{g.name_ar}</td>
                <td className="px-4 py-3 text-muted-foreground">{g.region_en ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{g.sort_order}</td>
                <td className="px-4 py-3">{g.active ? "✓" : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(g)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <AdminPagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} label="محافظة" />
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit governorate" : "New governorate"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Slug *"><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="cairo" /></F>
              <F label="Sort order"><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></F>
              <F label="Name (EN) *"><Input value={editing.name_en ?? ""} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} /></F>
              <F label="Name (AR) *"><Input dir="rtl" value={editing.name_ar ?? ""} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} /></F>
              <div className="sm:col-span-2">
                <AITranslateSync
                  enValue={editing.name_en ?? ""}
                  arValue={editing.name_ar ?? ""}
                  onSetEn={(v) => setEditing({ ...editing, name_en: v })}
                  onSetAr={(v) => setEditing({ ...editing, name_ar: v })}
                  label="Name:"
                />
              </div>
              <F label="Region (EN)"><Input value={editing.region_en ?? ""} onChange={(e) => setEditing({ ...editing, region_en: e.target.value })} /></F>
              <F label="Region (AR)"><Input dir="rtl" value={editing.region_ar ?? ""} onChange={(e) => setEditing({ ...editing, region_ar: e.target.value })} /></F>
              <div className="sm:col-span-2">
                <AITranslateSync
                  enValue={editing.region_en ?? ""}
                  arValue={editing.region_ar ?? ""}
                  onSetEn={(v) => setEditing({ ...editing, region_en: v })}
                  onSetAr={(v) => setEditing({ ...editing, region_ar: v })}
                  label="Region:"
                />
              </div>
              <div className="sm:col-span-2"><F label="Logo URL (SVG preferred)"><Input value={editing.logo_url ?? ""} onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })} placeholder="/__l5e/assets-v1/…/cairo.svg" /></F></div>
              {editing.logo_url && <div className="sm:col-span-2"><img src={editing.logo_url} alt="preview" className="h-24 rounded bg-secondary object-contain p-2" /></div>}
              <div className="flex items-center gap-3">
                <Switch checked={!!editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                <Label>Active</Label>
              </div>
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

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
