import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, ExternalLink, Gauge, Loader2, Pencil, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/qa-reports")({
  component: QaReportsPage,
});

interface Report {
  id: string;
  run_at: string;
  commit_sha: string | null;
  branch: string | null;
  viewport: string;
  page: string;
  lcp_ms: number | null;
  cls: number | null;
  wa_overlap: boolean | null;
  more_opened: boolean | null;
  screenshot_url: string | null;
  notes: string | null;
}

interface ReportMedia {
  id: string;
  report_id: string;
  media_url: string;
  caption: string | null;
  sort_order: number;
}

type FormState = {
  viewport: string;
  page: string;
  lcp_ms: string;
  cls: string;
  wa_overlap: boolean;
  more_opened: boolean;
  branch: string;
  commit_sha: string;
  screenshot_url: string;
  notes: string;
  run_at: string;
};

const emptyForm = (): FormState => ({
  viewport: "iphone-15",
  page: "/",
  lcp_ms: "",
  cls: "",
  wa_overlap: false,
  more_opened: true,
  branch: "main",
  commit_sha: "",
  screenshot_url: "",
  notes: "",
  run_at: new Date().toISOString().slice(0, 16),
});

const VIEWPORTS = ["iphone-15", "iphone-se", "pixel-8", "ipad", "desktop-1280", "desktop-1920"];

function tone(lcp: number | null, cls: number | null, overlap: boolean | null) {
  if (overlap) return "fail";
  if ((lcp ?? 0) > 2500 || (cls ?? 0) > 0.1) return "warn";
  return "pass";
}

function QaReportsPage() {
  const [rows, setRows] = useState<Report[]>([]);
  const [mediaByReport, setMediaByReport] = useState<Record<string, ReportMedia[]>>({});
  const [loading, setLoading] = useState(true);
  const [canWrite, setCanWrite] = useState(false);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMedia, setEditingMedia] = useState<ReportMedia[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaFileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const [{ data: reportRows }, { data: mediaRows }] = await Promise.all([
      supabase.from("qa_reports").select("*").order("run_at", { ascending: false }).limit(200),
      supabase.from("qa_report_media").select("*").order("sort_order", { ascending: true }),
    ]);
    setRows((reportRows as Report[]) ?? []);
    const grouped: Record<string, ReportMedia[]> = {};
    for (const m of (mediaRows as ReportMedia[]) ?? []) {
      (grouped[m.report_id] ??= []).push(m);
    }
    setMediaByReport(grouped);
    setLoading(false);
  }

  async function checkStaff() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase.rpc("is_staff", { _user_id: u.user.id });
    setCanWrite(Boolean(data));
  }

  useEffect(() => { load(); checkStaff(); }, []);

  function startNew() {
    setEditingId(null);
    setEditingMedia([]);
    setEditing(emptyForm());
  }
  function startEdit(r: Report) {
    setEditingId(r.id);
    setEditingMedia(mediaByReport[r.id] ?? []);
    setEditing({
      viewport: r.viewport,
      page: r.page,
      lcp_ms: r.lcp_ms?.toString() ?? "",
      cls: r.cls?.toString() ?? "",
      wa_overlap: Boolean(r.wa_overlap),
      more_opened: r.more_opened ?? true,
      branch: r.branch ?? "main",
      commit_sha: r.commit_sha ?? "",
      screenshot_url: r.screenshot_url ?? "",
      notes: r.notes ?? "",
      run_at: new Date(r.run_at).toISOString().slice(0, 16),
    });
  }

  async function uploadScreenshot(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `qa-reports/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setEditing((e) => (e ? { ...e, screenshot_url: data.publicUrl } : e));
      toast.success("Screenshot uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function uploadMedia(file: File) {
    setUploadingMedia(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `qa-reports/media/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      const nextOrder = editingMedia.length;
      if (editingId) {
        const { data: inserted, error } = await supabase.from("qa_report_media")
          .insert({ report_id: editingId, media_url: data.publicUrl, sort_order: nextOrder })
          .select("*").single();
        if (error) throw error;
        setEditingMedia((m) => [...m, inserted as ReportMedia]);
        setMediaByReport((prev) => ({ ...prev, [editingId]: [...(prev[editingId] ?? []), inserted as ReportMedia] }));
      } else {
        // Buffer locally until the report is created.
        setEditingMedia((m) => [...m, { id: `tmp-${Date.now()}`, report_id: "", media_url: data.publicUrl, caption: null, sort_order: nextOrder }]);
      }
      toast.success("Media uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingMedia(false);
    }
  }

  async function removeMedia(m: ReportMedia) {
    if (m.id.startsWith("tmp-")) {
      setEditingMedia((rows) => rows.filter((r) => r.id !== m.id));
      return;
    }
    const { error } = await supabase.from("qa_report_media").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    setEditingMedia((rows) => rows.filter((r) => r.id !== m.id));
    if (editingId) {
      setMediaByReport((prev) => ({ ...prev, [editingId]: (prev[editingId] ?? []).filter((r) => r.id !== m.id) }));
    }
  }

  async function updateMediaCaption(m: ReportMedia, caption: string) {
    setEditingMedia((rows) => rows.map((r) => (r.id === m.id ? { ...r, caption } : r)));
    if (!m.id.startsWith("tmp-")) {
      await supabase.from("qa_report_media").update({ caption }).eq("id", m.id);
    }
  }

  async function save() {
    if (!editing) return;
    if (!editing.viewport.trim() || !editing.page.trim()) {
      return toast.error("Viewport and page are required");
    }
    setSaving(true);
    const payload = {
      viewport: editing.viewport.trim(),
      page: editing.page.trim(),
      lcp_ms: editing.lcp_ms ? Math.round(Number(editing.lcp_ms)) : null,
      cls: editing.cls ? Number(editing.cls) : null,
      wa_overlap: editing.wa_overlap,
      more_opened: editing.more_opened,
      branch: editing.branch.trim() || null,
      commit_sha: editing.commit_sha.trim() || null,
      screenshot_url: editing.screenshot_url.trim() || null,
      notes: editing.notes.trim() || null,
      run_at: new Date(editing.run_at).toISOString(),
    };
    let res;
    let newId = editingId;
    if (editingId) {
      res = await supabase.from("qa_reports").update(payload).eq("id", editingId);
    } else {
      const insertRes = await supabase.from("qa_reports").insert(payload).select("id").single();
      res = insertRes;
      newId = (insertRes.data as { id: string } | null)?.id ?? null;
      // Persist buffered media rows
      if (newId && editingMedia.length) {
        const rid = newId;
        const bufferedRows = editingMedia
          .filter((m) => m.id.startsWith("tmp-"))
          .map((m, idx) => ({ report_id: rid, media_url: m.media_url, caption: m.caption, sort_order: idx }));
        if (bufferedRows.length) {
          await supabase.from("qa_report_media").insert(bufferedRows);
        }
      }
    }
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editingId ? "Report updated" : "Report added");
    setEditing(null); setEditingId(null); setEditingMedia([]);
    load();
  }

  async function remove() {
    if (!deleteId) return;
    const { error } = await supabase.from("qa_reports").delete().eq("id", deleteId);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setDeleteId(null);
    load();
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setEditing((e) => (e ? { ...e, [k]: v } : e));

  const runs = new Map<string, Report[]>();
  rows.forEach((r) => {
    const key = `${r.run_at.slice(0, 16)}::${r.commit_sha ?? "local"}`;
    if (!runs.has(key)) runs.set(key, []);
    runs.get(key)!.push(r);
  });

  return (
    <AdminShell title="QA Reports">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Gauge className="h-5 w-5 text-primary" />
                Playwright + Web Vitals history
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Log manual QA runs or let CI push here. Rows flag when WhatsApp overlaps the tab bar
                (blocking release) or LCP/CLS breach the "Good" threshold.
              </p>
              {!canWrite && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                  Read-only — only staff can add or edit reports.
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Refresh
              </Button>
              {canWrite && (
                <Button size="sm" onClick={startNew}>
                  <Plus className="mr-1 h-4 w-4" /> New report
                </Button>
              )}
            </div>
          </div>
        </div>

        {runs.size === 0 && !loading && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No QA runs yet. {canWrite ? 'Click "New report" to add your first entry.' : "CI will populate this page after the next release build."}
          </div>
        )}

        {Array.from(runs.entries()).map(([key, group]) => {
          const first = group[0];
          const failing = group.filter((g) => g.wa_overlap).length;
          const warns = group.filter((g) => !g.wa_overlap && ((g.lcp_ms ?? 0) > 2500 || (g.cls ?? 0) > 0.1)).length;
          return (
            <div key={key} className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6">
              <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {new Date(first.run_at).toLocaleString()}
                    {first.branch && <span className="ms-2 text-xs text-muted-foreground">· {first.branch}</span>}
                    {first.commit_sha && (
                      <span className="ms-2 font-mono text-xs text-muted-foreground">
                        {first.commit_sha.slice(0, 7)}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{group.length} checks</p>
                </div>
                <div className="flex shrink-0 gap-2 text-xs">
                  {failing > 0 && (
                    <span className="rounded-full bg-destructive/10 px-3 py-1 font-medium text-destructive">
                      {failing} blocking
                    </span>
                  )}
                  {warns > 0 && (
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-700 dark:text-amber-400">
                      {warns} warnings
                    </span>
                  )}
                  {failing === 0 && warns === 0 && (
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-400">
                      All good
                    </span>
                  )}
                </div>
              </header>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-start text-xs uppercase text-muted-foreground">
                      <th className="pb-2 text-start font-medium">Viewport</th>
                      <th className="pb-2 text-start font-medium">Page</th>
                      <th className="pb-2 text-end font-medium">LCP</th>
                      <th className="pb-2 text-end font-medium">CLS</th>
                      <th className="pb-2 text-center font-medium">WA / More</th>
                      <th className="pb-2 text-end font-medium">Shot</th>
                      {canWrite && <th className="pb-2 text-end font-medium">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {group.map((r) => {
                      const t = tone(r.lcp_ms, r.cls, r.wa_overlap);
                      return (
                        <tr key={r.id} className="align-top">
                          <td className="py-2 font-mono text-xs text-muted-foreground">{r.viewport}</td>
                          <td className="py-2 text-foreground">{r.page}</td>
                          <td className={cn("py-2 text-end tabular-nums", (r.lcp_ms ?? 0) > 2500 && "text-amber-600")}>
                            {r.lcp_ms ?? "—"}<span className="text-xs text-muted-foreground"> ms</span>
                          </td>
                          <td className={cn("py-2 text-end tabular-nums", (r.cls ?? 0) > 0.1 && "text-amber-600")}>
                            {r.cls?.toFixed(3) ?? "—"}
                          </td>
                          <td className="py-2 text-center">
                            {r.wa_overlap ? (
                              <span className="inline-flex items-center gap-1 text-destructive">
                                <AlertCircle className="h-4 w-4" />overlap
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />ok
                              </span>
                            )}
                            {r.more_opened === false && (
                              <span className="ms-2 text-xs text-destructive">More✗</span>
                            )}
                          </td>
                          <td className="py-2 text-end">
                            {r.screenshot_url ? (
                              <a
                                href={r.screenshot_url}
                                target="_blank"
                                rel="noopener"
                                className={cn(
                                  "inline-flex items-center gap-1 text-xs font-medium",
                                  t === "fail" ? "text-destructive" : "text-primary",
                                )}
                              >
                                view <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          {canWrite && (
                            <td className="py-2 text-end">
                              <div className="inline-flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => startEdit(r)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setDeleteId(r.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && (setEditing(null), setEditingId(null), setEditingMedia([]))}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit QA report" : "New QA report"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Viewport *</Label>
                  <Select value={editing.viewport} onValueChange={(v) => set("viewport", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VIEWPORTS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Page *</Label>
                  <Input placeholder="/" value={editing.page} onChange={(e) => set("page", e.target.value)} />
                </div>
                <div>
                  <Label>LCP (ms)</Label>
                  <Input type="number" placeholder="2100" value={editing.lcp_ms} onChange={(e) => set("lcp_ms", e.target.value)} />
                </div>
                <div>
                  <Label>CLS</Label>
                  <Input type="number" step="0.001" placeholder="0.05" value={editing.cls} onChange={(e) => set("cls", e.target.value)} />
                </div>
                <div>
                  <Label>Branch</Label>
                  <Input placeholder="main" value={editing.branch} onChange={(e) => set("branch", e.target.value)} />
                </div>
                <div>
                  <Label>Commit SHA</Label>
                  <Input placeholder="a1b2c3d" value={editing.commit_sha} onChange={(e) => set("commit_sha", e.target.value)} />
                </div>
                <div>
                  <Label>Run at</Label>
                  <Input type="datetime-local" value={editing.run_at} onChange={(e) => set("run_at", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col justify-end">
                    <Label className="mb-2 text-xs">WhatsApp overlap</Label>
                    <Switch checked={editing.wa_overlap} onCheckedChange={(v) => set("wa_overlap", v)} />
                  </div>
                  <div className="flex flex-col justify-end">
                    <Label className="mb-2 text-xs">"More" opens</Label>
                    <Switch checked={editing.more_opened} onCheckedChange={(v) => set("more_opened", v)} />
                  </div>
                </div>
              </div>

              <div>
                <Label>Screenshot</Label>
                <div className="mt-2 flex items-start gap-3">
                  {editing.screenshot_url ? (
                    <img src={editing.screenshot_url} alt="" className="h-24 w-40 rounded object-cover ring-1 ring-border" />
                  ) : (
                    <div className="flex h-24 w-40 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">no image</div>
                  )}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadScreenshot(e.target.files[0])}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                      {uploading ? "Uploading…" : "Upload"}
                    </Button>
                    {editing.screenshot_url && (
                      <Button variant="ghost" size="sm" onClick={() => set("screenshot_url", "")}>Remove</Button>
                    )}
                  </div>
                </div>
                <Input className="mt-2" placeholder="…or paste image URL" value={editing.screenshot_url} onChange={(e) => set("screenshot_url", e.target.value)} />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>Attached media ({editingMedia.length})</Label>
                  <div>
                    <input
                      ref={mediaFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0])}
                    />
                    <Button variant="outline" size="sm" onClick={() => mediaFileRef.current?.click()} disabled={uploadingMedia}>
                      {uploadingMedia ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                      {uploadingMedia ? "Uploading…" : "Add image"}
                    </Button>
                  </div>
                </div>
                {editingMedia.length === 0 ? (
                  <p className="mt-2 rounded border border-dashed p-4 text-center text-xs text-muted-foreground">
                    No extra media. Uploads are auto-linked to this report.
                  </p>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {editingMedia.map((m) => (
                      <div key={m.id} className="group relative overflow-hidden rounded border">
                        <img src={m.media_url} alt={m.caption ?? ""} className="h-28 w-full object-cover" />
                        <Input
                          className="rounded-none border-0 border-t text-xs"
                          placeholder="Caption"
                          value={m.caption ?? ""}
                          onChange={(e) => updateMediaCaption(m, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeMedia(m)}
                          className="absolute right-1 top-1 rounded bg-background/80 p-1 opacity-0 shadow transition group-hover:opacity-100"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea rows={3} value={editing.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any context: device, network throttling, reproduction steps…" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditing(null); setEditingId(null); setEditingMedia([]); }}>Cancel</Button>
            <Button onClick={save} disabled={saving || uploading}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {editingId ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
