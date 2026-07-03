import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


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
  } | null;
}

const TABLES = ["all", "hero_slides", "blog_posts", "qa_reports"] as const;
const ACTIONS = ["all", "INSERT", "UPDATE", "DELETE"] as const;

function actionTone(a: string) {
  if (a === "INSERT") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  if (a === "DELETE") return "bg-destructive/10 text-destructive";
  return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
}

function AuditLogsPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<(typeof TABLES)[number]>("all");
  const [action, setAction] = useState<(typeof ACTIONS)[number]>("all");
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);


  async function load() {
    setLoading(true);
    let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300);
    if (table !== "all") query = query.eq("table_name", table);
    if (action !== "all") query = query.eq("action", action);
    if (dateFrom) query = query.gte("created_at", new Date(dateFrom).toISOString());
    if (dateTo) query = query.lte("created_at", new Date(dateTo + "T23:59:59").toISOString());
    const { data } = await query;
    setRows((data as AuditRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [table, action, dateFrom, dateTo]);

  const filtered = useMemo(() => {

    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.actor_email, r.table_name, r.record_id, (r.changes?.changed_fields ?? []).join(",")]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle)),
    );
  }, [rows, q]);

  function exportCSV() {
    const header = ["When", "Actor", "Table", "Action", "Record", "Changed fields"];
    const lines = [header.join(",")].concat(
      filtered.map((r) => [
        new Date(r.created_at).toISOString(),
        r.actor_email ?? "system",
        r.table_name,
        r.action,
        r.record_id ?? "",
        (r.changes?.changed_fields ?? []).join("|"),
      ].map((c) => `"${String(c).replaceAll(`"`, `""`)}"`).join(",")),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
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
      head: [["When", "Actor", "Table", "Action", "Changed"]],
      body: filtered.map((r) => [
        new Date(r.created_at).toLocaleString(),
        r.actor_email ?? "system",
        r.table_name,
        r.action,
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
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute inset-y-0 start-2 my-auto h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} className="ps-8" placeholder="Search actor, record id, field…" />
            </div>
            <Select value={table} onValueChange={(v) => setTable(v as typeof table)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TABLES.map((t) => <SelectItem key={t} value={t}>{t === "all" ? "All tables" : t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={action} onValueChange={(v) => setAction(v as typeof action)}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a === "all" ? "All actions" : a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" aria-label="From date" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" aria-label="To date" />
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

          <p className="mt-2 text-xs text-muted-foreground">
            Automatic audit trail for Hero Slides, Blog articles and QA Reports. Showing latest 300 events.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-start font-medium">When</th>
                <th className="px-3 py-2 text-start font-medium">Actor</th>
                <th className="px-3 py-2 text-start font-medium">Table</th>
                <th className="px-3 py-2 text-start font-medium">Action</th>
                <th className="px-3 py-2 text-start font-medium">Changed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">No audit events match these filters.</td></tr>
              )}
              {filtered.map((r) => {
                const isOpen = expanded === r.id;
                return (
                  <>
                    <tr key={r.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setExpanded(isOpen ? null : r.id)}>
                      <td className="px-3 py-2 tabular-nums text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{r.actor_email ?? <span className="text-muted-foreground">system</span>}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.table_name}</td>
                      <td className="px-3 py-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", actionTone(r.action))}>{r.action}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {r.changes?.changed_fields?.length ? r.changes?.changed_fields.slice(0, 4).join(", ") + (r.changes?.changed_fields.length > 4 ? "…" : "") : "—"}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${r.id}-detail`} className="bg-muted/20">
                        <td colSpan={5} className="px-3 py-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <div className="mb-1 text-xs font-semibold text-muted-foreground">Before</div>
                              <pre className="max-h-72 overflow-auto rounded bg-background p-2 text-xs">{JSON.stringify(r.changes?.old ?? {}, null, 2)}</pre>
                            </div>
                            <div>
                              <div className="mb-1 text-xs font-semibold text-muted-foreground">After</div>
                              <pre className="max-h-72 overflow-auto rounded bg-background p-2 text-xs">{JSON.stringify(r.changes?.new ?? {}, null, 2)}</pre>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">Record id: <span className="font-mono">{r.record_id}</span></p>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
