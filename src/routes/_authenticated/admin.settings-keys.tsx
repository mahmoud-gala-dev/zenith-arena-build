import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2, Copy, Search, Languages } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/settings-keys")({
  component: SettingsKeysPage,
});

type SettingRow = { key: string; value: unknown; updated_at: string | null };

function countLangFields(obj: unknown): { en: number; ar: number } {
  let en = 0, ar = 0;
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) { v.forEach(walk); return; }
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (k.endsWith("_en")) en++;
      else if (k.endsWith("_ar")) ar++;
      walk(val);
    }
  };
  walk(obj);
  return { en, ar };
}

function SettingsKeysPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "settings-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("key,value,updated_at")
        .order("key", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SettingRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? rows.filter((r) => r.key.toLowerCase().includes(q)) : rows;
  }, [rows, filter]);

  const current = rows.find((r) => r.key === selected) ?? null;

  useEffect(() => {
    if (!selected && rows.length) setSelected(rows[0].key);
  }, [rows, selected]);

  useEffect(() => {
    if (current) {
      setDraft(JSON.stringify(current.value ?? {}, null, 2));
      setJsonError(null);
    }
  }, [current?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  function validate(text: string): unknown | null {
    try { const v = JSON.parse(text); setJsonError(null); return v; }
    catch (e) { setJsonError((e as Error).message); return null; }
  }

  async function save() {
    if (!current) return;
    const v = validate(draft);
    if (v === null) { toast.error("Invalid JSON"); return; }
    const { error } = await supabase.from("settings").update({ value: v as never }).eq("key", current.key);
    if (error) { toast.error(error.message); return; }
    toast.success(`Saved "${current.key}"`);
    qc.invalidateQueries({ queryKey: ["admin", "settings-keys"] });
    qc.invalidateQueries({ queryKey: ["settings", current.key] });
  }

  async function createKey() {
    const k = newKey.trim();
    if (!k) { toast.error("Key required"); return; }
    if (rows.some((r) => r.key === k)) { toast.error("Key already exists"); return; }
    const { error } = await supabase.from("settings").insert({ key: k, value: {} as never });
    if (error) { toast.error(error.message); return; }
    toast.success(`Created "${k}"`);
    setNewKey(""); setCreating(false); setSelected(k);
    qc.invalidateQueries({ queryKey: ["admin", "settings-keys"] });
  }

  async function duplicate() {
    if (!current) return;
    const base = `${current.key}_copy`;
    let candidate = base; let i = 2;
    while (rows.some((r) => r.key === candidate)) { candidate = `${base}${i++}`; }
    const { error } = await supabase.from("settings").insert({ key: candidate, value: current.value as never });
    if (error) { toast.error(error.message); return; }
    toast.success(`Duplicated as "${candidate}"`);
    setSelected(candidate);
    qc.invalidateQueries({ queryKey: ["admin", "settings-keys"] });
  }

  async function remove() {
    if (!current) return;
    const { error } = await supabase.from("settings").delete().eq("key", current.key);
    if (error) { toast.error(error.message); return; }
    toast.success(`Deleted "${current.key}"`);
    setDeleteOpen(false); setSelected(null);
    qc.invalidateQueries({ queryKey: ["admin", "settings-keys"] });
  }

  const langCounts = current ? countLangFields(current.value) : { en: 0, ar: 0 };

  return (
    <AdminShell title="Settings Keys">
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-xl border border-border bg-card p-3">
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search keys" className="pl-8 h-9" />
            </div>
            <Button size="sm" onClick={() => setCreating((v) => !v)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {creating && (
            <div className="mb-3 space-y-2 rounded-md border border-border p-2">
              <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. contact_page" className="h-8" />
              <div className="flex gap-2">
                <Button size="sm" onClick={createKey} className="flex-1">Create</Button>
                <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setNewKey(""); }}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="max-h-[70vh] space-y-1 overflow-y-auto">
            {isLoading && <div className="p-3 text-xs text-muted-foreground">Loading…</div>}
            {!isLoading && filtered.length === 0 && (
              <div className="p-3 text-xs text-muted-foreground">No keys.</div>
            )}
            {filtered.map((r) => {
              const c = countLangFields(r.value);
              const active = selected === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setSelected(r.key)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <div className="font-mono text-xs">{r.key}</div>
                  <div className={`mt-1 flex gap-1 text-[10px] ${active ? "opacity-80" : "text-muted-foreground"}`}>
                    {c.en > 0 && <span>EN·{c.en}</span>}
                    {c.ar > 0 && <span>AR·{c.ar}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-xl border border-border bg-card p-5">
          {!current ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Select a key to edit its JSON value.</div>
          ) : (
            <>
              <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-mono text-lg font-semibold">{current.key}</h2>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Languages className="h-3 w-3" />
                    <Badge variant="outline">EN fields: {langCounts.en}</Badge>
                    <Badge variant="outline">AR fields: {langCounts.ar}</Badge>
                    {current.updated_at && <span>Updated {new Date(current.updated_at).toLocaleString()}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={duplicate}><Copy className="h-4 w-4" />Duplicate</Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4" />Delete
                  </Button>
                  <Button size="sm" onClick={save} disabled={!!jsonError}>
                    <Save className="h-4 w-4" />Save
                  </Button>
                </div>
              </header>

              <Textarea
                value={draft}
                onChange={(e) => { setDraft(e.target.value); validate(e.target.value); }}
                spellCheck={false}
                className="min-h-[60vh] font-mono text-xs"
              />
              {jsonError ? (
                <p className="mt-2 text-xs text-destructive">JSON error: {jsonError}</p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Bilingual convention: fields ending in <code>_en</code> / <code>_ar</code> are auto-counted per key.
                </p>
              )}
            </>
          )}
        </section>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{current?.key}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the settings key permanently. Any page reading it will fall back to defaults.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
