import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Download, FileText, RefreshCw, Search, X, Copy, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TableRowsSkeleton } from "@/components/site/Skeletons";
import { usePaged, AdminPagination } from "@/components/admin/AdminPagination";



export const Route = createFileRoute("/_authenticated/admin/audit-logs")({
  component: AuditLogsPage,
});

interface AuditRow {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_email: string | null;
  table_name: string;
  record_id: string | null;
  action: string;
  changes: {
    changed_fields?: string[];
    old?: Record<string, unknown> | null;
    new?: Record<string, unknown> | null;
    details?: Record<string, unknown> | null;
  } | null;
}


const ACTIONS = ["all", "INSERT", "UPDATE", "DELETE", "PERMISSION_DENIED", "SENSITIVE_CHANGE"] as const;

function actionTone(a: string) {
  if (a === "INSERT") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  if (a === "DELETE") return "bg-destructive/10 text-destructive";
  if (a === "PERMISSION_DENIED") return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  if (a === "SENSITIVE_CHANGE") return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
  return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
}

// Escape PostgREST ilike wildcards / commas to keep the search literal.
function sanitizeIlike(v: string) {
  return v.replace(/[,%()]/g, " ").trim();
}

function AuditLogsPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<string>("all");
  const [action, setAction] = useState<(typeof ACTIONS)[number]>("all");
  const [actor, setActor] = useState("");
  const [recordId, setRecordId] = useState("");
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [tableOptions, setTableOptions] = useState<string[]>([]);
  const [actors, setActors] = useState<string[]>([]);

  async function loadFacets() {
    // Distinct-ish facets pulled from a recent slice — cheap and good enough for a picker.
    const { data } = await supabase
      .from("audit_logs")
      .select("table_name, actor_email")
      .order("created_at", { ascending: false })
      .limit(1000);
    const t = new Set<string>();
    const a = new Set<string>();
    (data ?? []).forEach((r: { table_name: string | null; actor_email: string | null }) => {
      if (r.table_name) t.add(r.table_name);
      if (r.actor_email) a.add(r.actor_email);
    });
    setTableOptions([...t].sort());
    setActors([...a].sort());
  }

  async function load() {
    setLoading(true);
    let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300);
    if (table !== "all") query = query.eq("table_name", table);
    if (action !== "all") query = query.eq("action", action);
    if (dateFrom) query = query.gte("created_at", new Date(dateFrom).toISOString());
    if (dateTo) query = query.lte("created_at", new Date(dateTo + "T23:59:59").toISOString());
    const actorTrim = sanitizeIlike(actor);
    if (actorTrim) query = query.ilike("actor_email", `%${actorTrim}%`);
    const recTrim = sanitizeIlike(recordId);
    if (recTrim) query = query.ilike("record_id", `%${recTrim}%`);
    const { data } = await query;
    setRows((data as AuditRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadFacets(); }, []);
  useEffect(() => {
    load();
     
  }, [table, action, dateFrom, dateTo, actor, recordId]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      const haystack = [
        r.actor_email,
        r.actor_id,
        r.table_name,
        r.record_id,
        r.action,
        (r.changes?.changed_fields ?? []).join(","),
        r.changes?.old ? JSON.stringify(r.changes.old) : "",
        r.changes?.new ? JSON.stringify(r.changes.new) : "",
      ]
        .filter(Boolean)
        .join(" \u0001 ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, q]);

  const { page, setPage, pageCount, pageItems, total } = usePaged(filtered, 50);

  const activeFilterCount =
    (table !== "all" ? 1 : 0) +
    (action !== "all" ? 1 : 0) +
    (actor.trim() ? 1 : 0) +
    (recordId.trim() ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (q.trim() ? 1 : 0);

  function clearFilters() {
    setTable("all");
    setAction("all");
    setActor("");
    setRecordId("");
    setDateFrom("");
    setDateTo("");
    setQ("");
  }

  function exportCSV() {
    const header = ["When", "Actor", "Actor ID", "Table", "Action", "Record", "Changed fields"];
    const lines = [header.join(",")].concat(
      filtered.map((r) => [
        new Date(r.created_at).toISOString(),
        r.actor_email ?? "system",
        r.actor_id ?? "",
        r.table_name,
        r.action,
        r.record_id ?? "",
        (r.changes?.changed_fields ?? []).join("|"),
      ].map((c) => `"${String(c).replaceAll(`"`, `""`)}"`).join(",")),
    );
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportPDF() {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Audit Log", 14, 14);
    doc.setFontSize(9);
    doc.text(`Exported ${new Date().toLocaleString()} · ${filtered.length} events`, 14, 20);
    autoTable(doc, {
      startY: 24,
      head: [["When", "Actor", "Table", "Action", "Record", "Changed"]],
      body: filtered.map((r) => [
        new Date(r.created_at).toLocaleString(),
        r.actor_email ?? "system",
        r.table_name,
        r.action,
        r.record_id ?? "",
        (r.changes?.changed_fields ?? []).slice(0, 6).join(", "),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 41, 59] },
    });
    doc.save(`audit-log-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <AdminShell title="Audit Log">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute inset-y-0 start-2 my-auto h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="ps-8"
                placeholder="Free-text search across actor, record, fields, before/after JSON…"
              />
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={!filtered.length}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF} disabled={!filtered.length}>
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Table</label>
              <Select value={table} onValueChange={setTable}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tables</SelectItem>
                  {tableOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Action</label>
              <Select value={action} onValueChange={(v) => setAction(v as typeof action)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a === "all" ? "All actions" : a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Admin user</label>
              <Input
                list="audit-actors"
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                placeholder="email contains…"
              />
              <datalist id="audit-actors">
                {actors.map((a) => <option key={a} value={a} />)}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Record ID</label>
              <Input value={recordId} onChange={(e) => setRecordId(e.target.value)} placeholder="uuid / id contains…" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {rows.length} loaded events (latest 300 match server filters).
            </p>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />
                Clear filters ({activeFilterCount})
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-start font-medium">When</th>
                <th className="px-3 py-2 text-start font-medium">Actor</th>
                <th className="px-3 py-2 text-start font-medium">Table</th>
                <th className="px-3 py-2 text-start font-medium">Action</th>
                <th className="px-3 py-2 text-start font-medium">Record</th>
                <th className="px-3 py-2 text-start font-medium">Changed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && <TableRowsSkeleton rows={10} columns={6} />}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">No audit events match these filters.</td></tr>
              )}
              {!loading && pageItems.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setSelected(r)}
                >
                  <td className="px-3 py-2 tabular-nums text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{r.actor_email ?? <span className="text-muted-foreground">system</span>}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.table_name}</td>
                  <td className="px-3 py-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", actionTone(r.action))}>{r.action}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                    {r.record_id ? r.record_id.slice(0, 8) + (r.record_id.length > 8 ? "…" : "") : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {r.changes?.changed_fields?.length ? r.changes.changed_fields.slice(0, 4).join(", ") + (r.changes.changed_fields.length > 4 ? "…" : "") : "—"}
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
          <AdminPagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} label="حدث" />
        </div>
      </div>

      <AuditDetailDrawer row={selected} onClose={() => setSelected(null)} />

    </AdminShell>
  );
}

// ---------------- Detail Drawer ----------------

interface AuditDetailDrawerProps {
  row: AuditRow | null;
  onClose: () => void;
}

function AuditDetailDrawer({ row, onClose }: AuditDetailDrawerProps) {
  const open = row !== null;
  if (!row) {
    return (
      <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <SheetContent className="w-full sm:max-w-2xl" />
      </Sheet>
    );
  }

  const changes = row.changes ?? {};
  const changedFields = changes.changed_fields ?? [];
  const before = (changes.old ?? {}) as Record<string, unknown>;
  const after = (changes.new ?? {}) as Record<string, unknown>;
  const details = (changes.details ?? {}) as Record<string, unknown>;
  const isDenial = row.action === "PERMISSION_DENIED";
  const isSensitive = row.action === "SENSITIVE_CHANGE";
  const hasDiff = changedFields.length > 0 || Object.keys(before).length > 0 || Object.keys(after).length > 0;

  const permission = typeof details.permission === "string" ? details.permission : null;
  const attemptedAction = typeof details.attempted_action === "string" ? details.attempted_action : null;
  const pathname = typeof details.pathname === "string" ? details.pathname : null;
  const summary = typeof details.summary === "string" ? details.summary : null;

  function copy(value: unknown, label: string) {
    try {
      navigator.clipboard.writeText(typeof value === "string" ? value : JSON.stringify(value, null, 2));
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  }

  function fmt(v: unknown): string {
    if (v === null || v === undefined) return "—";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    try { return JSON.stringify(v); } catch { return String(v); }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", actionTone(row.action))}>{row.action}</span>
            <span className="font-mono text-xs text-muted-foreground">{row.table_name}</span>
          </div>
          <SheetTitle className="text-lg">
            {summary ?? (isDenial ? "Permission denied" : hasDiff ? `${changedFields.length || Object.keys(after).length} field${(changedFields.length || Object.keys(after).length) === 1 ? "" : "s"} changed` : "Event details")}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {new Date(row.created_at).toLocaleString()} · {row.actor_email ?? "system"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {/* Request metadata */}
          <section className="rounded-xl border border-border bg-muted/20 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Request metadata</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
              <MetaRow label="Event id" value={row.id} mono onCopy={() => copy(row.id, "Event id")} />
              <MetaRow label="Timestamp" value={new Date(row.created_at).toISOString()} mono />
              <MetaRow label="Actor email" value={row.actor_email ?? "system"} />
              <MetaRow label="Actor id" value={row.actor_id ?? "—"} mono onCopy={row.actor_id ? () => copy(row.actor_id!, "Actor id") : undefined} />
              <MetaRow label="Table / resource" value={row.table_name} mono />
              <MetaRow label="Record id" value={row.record_id ?? "—"} mono onCopy={row.record_id ? () => copy(row.record_id!, "Record id") : undefined} />
              {pathname && <MetaRow label="Path" value={pathname} mono />}
            </dl>
          </section>

          {/* Permission denial context */}
          {isDenial && (
            <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
              <div className="mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <ShieldAlert className="h-4 w-4" />
                <h3 className="text-xs font-semibold uppercase tracking-wide">Permission denial context</h3>
              </div>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
                <MetaRow label="Missing permission" value={permission ?? "—"} mono />
                <MetaRow label="Attempted action" value={attemptedAction ?? "—"} />
                <MetaRow label="Route" value={pathname ?? "—"} mono />
                <MetaRow label="Actor" value={row.actor_email ?? "anonymous"} />
              </dl>
              <p className="mt-2 text-[11px] text-muted-foreground">
                The user attempted a guarded action without the required permission. Grant it via <span className="font-mono">/admin/users</span> or adjust the role matrix.
              </p>
            </section>
          )}

          {/* Diff view */}
          {hasDiff && (
            <section className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Before / After diff {changedFields.length > 0 && <span className="ml-1 font-normal normal-case text-muted-foreground/80">({changedFields.length} changed)</span>}
                </h3>
                <Button size="sm" variant="ghost" onClick={() => copy(changes, "Full change payload")}>
                  <Copy className="h-3.5 w-3.5" /> Copy JSON
                </Button>
              </div>
              {changedFields.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground">
                      <tr>
                        <th className="px-2 py-1.5 text-start font-medium">Field</th>
                        <th className="px-2 py-1.5 text-start font-medium">Before</th>
                        <th className="px-2 py-1.5 text-start font-medium">After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {changedFields.map((f) => (
                        <tr key={f} className="align-top">
                          <td className="px-2 py-1.5 font-mono text-[11px]">{f}</td>
                          <td className="px-2 py-1.5 text-destructive/90"><code className="break-all">{fmt(before[f])}</code></td>
                          <td className="px-2 py-1.5 text-emerald-700 dark:text-emerald-400"><code className="break-all">{fmt(after[f])}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[11px] font-semibold text-muted-foreground">Before</div>
                    <pre className="max-h-72 overflow-auto rounded bg-background p-2 text-[11px]">{JSON.stringify(before, null, 2)}</pre>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-semibold text-muted-foreground">After</div>
                    <pre className="max-h-72 overflow-auto rounded bg-background p-2 text-[11px]">{JSON.stringify(after, null, 2)}</pre>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Sensitive change / app-level details */}
          {(isSensitive || (!isDenial && Object.keys(details).length > 0)) && (
            <section className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Application context</h3>
                <Button size="sm" variant="ghost" onClick={() => copy(details, "Details payload")}>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
              </div>
              <pre className="max-h-80 overflow-auto rounded bg-muted/30 p-2 text-[11px]">{JSON.stringify(details, null, 2)}</pre>
            </section>
          )}

          {!hasDiff && !isDenial && !isSensitive && Object.keys(details).length === 0 && (
            <p className="text-xs text-muted-foreground">No structured payload was recorded for this event.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MetaRow({ label, value, mono, onCopy }: { label: string; value: string; mono?: boolean; onCopy?: () => void }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-2 border-b border-border/40 py-1 last:border-b-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 flex-1 break-all text-end", mono && "font-mono text-[11px]")}>
        {value}
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="ms-1.5 inline-flex align-middle text-muted-foreground hover:text-foreground"
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </dd>
    </div>
  );
}
