import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { IconPicker } from "@/components/admin/IconPicker";
import { aboutContentQueryOptions, type AboutContent, type AboutValueItem, type AboutStatItem } from "@/lib/queries";
import { useAdminPageGuard } from "@/lib/rbac";

export const Route = createFileRoute("/_authenticated/admin/about")({
  component: AdminAboutPage,
});

const db = supabase as unknown as {
  from: (t: string) => {
    upsert: (row: unknown, opts?: unknown) => Promise<{ error: unknown }>;
  };
};

function AdminAboutPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(aboutContentQueryOptions);
  const [state, setState] = useState<AboutContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data && !state) setState(data); }, [data, state]);

  if (isLoading || !state) return <AdminShell title="About Page"><div className="p-8">Loading…</div></AdminShell>;

  const save = async () => {
    setSaving(true);
    try {
      const rows = [
        { key: "hero", value: state.hero },
        { key: "story", value: state.story },
        { key: "values", value: state.values },
        { key: "stats", value: state.stats },
      ];
      for (const r of rows) {
        const { error } = await db.from("about_content").upsert(r, { onConflict: "key" });
        if (error) throw error;
      }
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["about_content"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const move = <T,>(arr: T[], from: number, to: number): T[] => {
    if (to < 0 || to >= arr.length) return arr;
    const copy = [...arr];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  };

  return (
    <AdminShell title="About Page">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Hero</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Hero image URL</Label>
              <Input value={state.hero.image_url} onChange={(e) => setState({ ...state, hero: { ...state.hero, image_url: e.target.value } })} placeholder="https://..." />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Eyebrow (EN)</Label><Input value={state.hero.eyebrow_en} onChange={(e) => setState({ ...state, hero: { ...state.hero, eyebrow_en: e.target.value } })} /></div>
              <div><Label>Eyebrow (AR)</Label><Input value={state.hero.eyebrow_ar} onChange={(e) => setState({ ...state, hero: { ...state.hero, eyebrow_ar: e.target.value } })} dir="rtl" /></div>
              <div><Label>Title (EN)</Label><Input value={state.hero.title_en} onChange={(e) => setState({ ...state, hero: { ...state.hero, title_en: e.target.value } })} /></div>
              <div><Label>Title (AR)</Label><Input value={state.hero.title_ar} onChange={(e) => setState({ ...state, hero: { ...state.hero, title_ar: e.target.value } })} dir="rtl" /></div>
              <div className="sm:col-span-2"><Label>Subtitle (EN)</Label><Textarea rows={2} value={state.hero.subtitle_en} onChange={(e) => setState({ ...state, hero: { ...state.hero, subtitle_en: e.target.value } })} /></div>
              <div className="sm:col-span-2"><Label>Subtitle (AR)</Label><Textarea rows={2} dir="rtl" value={state.hero.subtitle_ar} onChange={(e) => setState({ ...state, hero: { ...state.hero, subtitle_ar: e.target.value } })} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Story</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div><Label>Title (EN)</Label><Input value={state.story.title_en} onChange={(e) => setState({ ...state, story: { ...state.story, title_en: e.target.value } })} /></div>
            <div><Label>Title (AR)</Label><Input value={state.story.title_ar} onChange={(e) => setState({ ...state, story: { ...state.story, title_ar: e.target.value } })} dir="rtl" /></div>
            <div className="sm:col-span-2"><Label>Body (EN)</Label><Textarea rows={4} value={state.story.body_en} onChange={(e) => setState({ ...state, story: { ...state.story, body_en: e.target.value } })} /></div>
            <div className="sm:col-span-2"><Label>Body (AR)</Label><Textarea rows={4} dir="rtl" value={state.story.body_ar} onChange={(e) => setState({ ...state, story: { ...state.story, body_ar: e.target.value } })} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Values</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setState({ ...state, values: [...state.values, { icon: "Star", title_en: "", title_ar: "", desc_en: "", desc_ar: "" }] })}>
              <Plus className="h-4 w-4 mr-1" /> Add value
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.values.map((v, i) => (
              <div key={i} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setState({ ...state, values: move(state.values, i, i - 1) })}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setState({ ...state, values: move(state.values, i, i + 1) })}><ArrowDown className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setState({ ...state, values: state.values.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Icon</Label><IconPicker value={v.icon} onChange={(name) => updateItem(state, setState, "values", i, { ...v, icon: name })} /></div>
                  <div />
                  <div><Label>Title (EN)</Label><Input value={v.title_en} onChange={(e) => updateItem(state, setState, "values", i, { ...v, title_en: e.target.value })} /></div>
                  <div><Label>Title (AR)</Label><Input dir="rtl" value={v.title_ar} onChange={(e) => updateItem(state, setState, "values", i, { ...v, title_ar: e.target.value })} /></div>
                  <div><Label>Description (EN)</Label><Textarea rows={2} value={v.desc_en} onChange={(e) => updateItem(state, setState, "values", i, { ...v, desc_en: e.target.value })} /></div>
                  <div><Label>Description (AR)</Label><Textarea rows={2} dir="rtl" value={v.desc_ar} onChange={(e) => updateItem(state, setState, "values", i, { ...v, desc_ar: e.target.value })} /></div>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Icon names must match a <code>lucide-react</code> export (e.g. <code>ShieldCheck</code>, <code>Cpu</code>, <code>Wrench</code>, <code>Award</code>, <code>Star</code>). Falls back to <code>ShieldCheck</code> if unknown.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Stats</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setState({ ...state, stats: [...state.stats, { key: `stat_${Date.now()}`, value: "", label_en: "", label_ar: "" }] })}>
              <Plus className="h-4 w-4 mr-1" /> Add stat
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.stats.map((s, i) => (
              <div key={i} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setState({ ...state, stats: move(state.stats, i, i - 1) })}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setState({ ...state, stats: move(state.stats, i, i + 1) })}><ArrowDown className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setState({ ...state, stats: state.stats.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Key (internal)</Label><Input value={s.key} onChange={(e) => updateItem(state, setState, "stats", i, { ...s, key: e.target.value })} /></div>
                  <div><Label>Value (e.g. 250+)</Label><Input value={s.value} onChange={(e) => updateItem(state, setState, "stats", i, { ...s, value: e.target.value })} /></div>
                  <div><Label>Label (EN)</Label><Input value={s.label_en} onChange={(e) => updateItem(state, setState, "stats", i, { ...s, label_en: e.target.value })} /></div>
                  <div><Label>Label (AR)</Label><Input dir="rtl" value={s.label_ar} onChange={(e) => updateItem(state, setState, "stats", i, { ...s, label_ar: e.target.value })} /></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="sticky bottom-4 flex justify-end">
          <Button size="lg" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>
    </AdminShell>
  );
}

function updateItem(
  state: AboutContent,
  setState: (s: AboutContent) => void,
  field: "values" | "stats",
  i: number,
  next: AboutValueItem | AboutStatItem,
) {
  if (field === "values") {
    const arr = [...state.values];
    arr[i] = next as AboutValueItem;
    setState({ ...state, values: arr });
  } else {
    const arr = [...state.stats];
    arr[i] = next as AboutStatItem;
    setState({ ...state, stats: arr });
  }
}
