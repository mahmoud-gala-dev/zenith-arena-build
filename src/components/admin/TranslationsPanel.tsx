import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { translationsAllQueryOptions, type TranslationRow } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Download, Upload, Save } from "lucide-react";
import { confirmDelete } from "@/lib/confirm";

type Draft = Record<string, { en: string; ar: string; namespace: string }>;

const db = supabase as unknown as {
  from: (t: string) => {
    upsert: (rows: unknown, opts?: unknown) => Promise<{ error: unknown }>;
    delete: () => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
    insert: (rows: unknown) => Promise<{ error: unknown }>;
  };
};

export function TranslationsPanel() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(translationsAllQueryOptions);
  const [search, setSearch] = useState("");
  const [ns, setNs] = useState<string>("all");
  const [drafts, setDrafts] = useState<Draft>({});
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newNs, setNewNs] = useState("ui");

  const namespaces = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => set.add(r.namespace));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((r) => {
      if (ns !== "all" && r.namespace !== ns) return false;
      if (!q) return true;
      return (
        r.key.toLowerCase().includes(q) ||
        r.en.toLowerCase().includes(q) ||
        r.ar.toLowerCase().includes(q)
      );
    });
  }, [data, search, ns]);

  const merged = (row: TranslationRow) => drafts[row.key] ?? { en: row.en, ar: row.ar, namespace: row.namespace };
  const dirtyCount = Object.keys(drafts).length;

  const setField = (key: string, patch: Partial<{ en: string; ar: string; namespace: string }>) => {
    const row = data.find((r) => r.key === key);
    if (!row) return;
    const current = drafts[key] ?? { en: row.en, ar: row.ar, namespace: row.namespace };
    setDrafts({ ...drafts, [key]: { ...current, ...patch } });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const rows = Object.entries(drafts).map(([key, v]) => ({ key, ...v }));
      const { error } = await db.from("translations").upsert(rows, { onConflict: "key" });
      if (error) throw error;
      toast.success(`Saved ${rows.length} translation(s)`);
      setDrafts({});
      qc.invalidateQueries({ queryKey: ["translations"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const addKey = async () => {
    const key = newKey.trim();
    if (!key) return;
    if (data.some((r) => r.key === key)) {
      toast.error("Key already exists");
      return;
    }
    const { error } = await db.from("translations").insert([{ key, namespace: newNs || "ui", en: "", ar: "" }]);
    if (error) {
      toast.error(String((error as { message?: string }).message ?? error));
      return;
    }
    toast.success("Added");
    setNewKey("");
    qc.invalidateQueries({ queryKey: ["translations"] });
  };

  const deleteKey = async (key: string) => {
    if (!(await confirmDelete(`Delete translation "${key}"?`))) return;
    const { error } = await db.from("translations").delete().eq("key", key);
    if (error) {
      toast.error(String((error as { message?: string }).message ?? error));
      return;
    }
    toast.success("Deleted");
    const next = { ...drafts };
    delete next[key];
    setDrafts(next);
    qc.invalidateQueries({ queryKey: ["translations"] });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translations-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Array<{ key: string; namespace?: string; en?: string; ar?: string }>;
      if (!Array.isArray(parsed)) throw new Error("Expected an array");
      const rows = parsed
        .filter((p) => typeof p.key === "string" && p.key)
        .map((p) => ({ key: p.key, namespace: p.namespace ?? "ui", en: p.en ?? "", ar: p.ar ?? "" }));
      const { error } = await db.from("translations").upsert(rows, { onConflict: "key" });
      if (error) throw error;
      toast.success(`Imported ${rows.length} translations`);
      qc.invalidateQueries({ queryKey: ["translations"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    }
  };

  if (isLoading) return <div className="p-8">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card>
        <CardHeader><CardTitle>Filters & Tools</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_200px_auto_auto_auto]">
          <div>
            <Label>Search</Label>
            <Input placeholder="key, English or Arabic…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <Label>Namespace</Label>
            <Select value={ns} onValueChange={setNs}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({data.length})</SelectItem>
                {namespaces.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={exportJson} className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
          <div className="flex items-end">
            <label>
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importJson(f);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" asChild className="gap-2">
                <span><Upload className="h-4 w-4" /> Import</span>
              </Button>
            </label>
          </div>
          <div className="flex items-end">
            <Button onClick={saveAll} disabled={saving || dirtyCount === 0} className="gap-2">
              <Save className="h-4 w-4" /> Save {dirtyCount > 0 ? `(${dirtyCount})` : ""}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Add new key</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_200px_auto]">
          <Input placeholder="section.subKey (e.g. nav.blog)" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
          <Input placeholder="namespace" value={newNs} onChange={(e) => setNewNs(e.target.value)} />
          <Button onClick={addKey} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Translations ({filtered.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((row) => {
            const draft = merged(row);
            const isDirty = drafts[row.key] != null;
            return (
              <div key={row.key} className={`rounded-lg border p-3 ${isDirty ? "border-primary bg-primary/5" : "border-border"}`}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-0.5 text-xs">{row.key}</code>
                    <Input
                      value={draft.namespace}
                      onChange={(e) => setField(row.key, { namespace: e.target.value })}
                      className="h-7 w-32 text-xs"
                    />
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteKey(row.key)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <Label className="text-xs">English</Label>
                    <Textarea
                      rows={2}
                      value={draft.en}
                      onChange={(e) => setField(row.key, { en: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Arabic</Label>
                    <Textarea
                      rows={2}
                      dir="rtl"
                      value={draft.ar}
                      onChange={(e) => setField(row.key, { ar: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No translations match your filters.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
