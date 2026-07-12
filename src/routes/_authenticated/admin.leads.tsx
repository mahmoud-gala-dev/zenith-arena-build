import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Download, Trash2, ExternalLink, Plus, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  component: LeadsPage,
});

type Lead = {
  id: string;
  type: string;
  status: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  service: string | null;
  budget_range: string | null;
  message: string | null;
  internal_notes: string | null;
  source: string | null;
  intent: string | null;
  project_type: string | null;
  sport_type: string | null;
  project_area: string | null;
  start_date: string | null;
  preferred_contact: string | null;
  attachment_url: string | null;
  created_at: string;
};

const STATUSES = ["new", "contacted", "qualified", "proposal_sent", "won", "lost"] as const;

const STATUS_TONE: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  contacted: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  qualified: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  proposal_sent: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  won: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  lost: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [intentFilter, setIntentFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setLeads((data ?? []) as unknown as Lead[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const uniqueTypes = useMemo(() => Array.from(new Set(leads.map((l) => l.type).filter(Boolean))), [leads]);
  const uniqueIntents = useMemo(() => Array.from(new Set(leads.map((l) => l.intent).filter(Boolean))) as string[], [leads]);
  const uniqueSources = useMemo(() => Array.from(new Set(leads.map((l) => l.source).filter(Boolean))) as string[], [leads]);

  const filtered = leads.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (typeFilter !== "all" && l.type !== typeFilter) return false;
    if (intentFilter !== "all" && (l.intent ?? "") !== intentFilter) return false;
    if (sourceFilter !== "all" && (l.source ?? "") !== sourceFilter) return false;
    if (dateFilter !== "all") {
      const days = dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : dateFilter === "90d" ? 90 : 0;
      if (days > 0) {
        const cutoff = Date.now() - days * 86400_000;
        if (new Date(l.created_at).getTime() < cutoff) return false;
      }
    }
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      l.name.toLowerCase().includes(s) ||
      l.email.toLowerCase().includes(s) ||
      (l.company ?? "").toLowerCase().includes(s) ||
      (l.service ?? "").toLowerCase().includes(s) ||
      (l.phone ?? "").toLowerCase().includes(s) ||
      (l.source ?? "").toLowerCase().includes(s) ||
      (l.intent ?? "").toLowerCase().includes(s)
    );
  });

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    won: leads.filter((l) => l.status === "won").length,
    last7: leads.filter((l) => Date.now() - new Date(l.created_at).getTime() < 7 * 86400_000).length,
  }), [leads]);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("leads").update({ status: status as Lead["status"] as never }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    if (selected?.id === id) setSelected({ ...selected, status });
  }

  async function saveNotes(id: string, notes: string) {
    const { error } = await supabase.from("leads").update({ internal_notes: notes }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Notes saved");
  }

  async function deleteLead(id: string) {
    if (!confirm("Delete this lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setSelected(null);
  }

  function exportCSV() {
    const rows = [
      ["Name", "Email", "Phone", "Company", "Country", "City", "Service", "Budget", "Type", "Intent", "Source", "Status", "Date"],
      ...filtered.map((l) => [
        l.name, l.email, l.phone ?? "", l.company ?? "", l.country ?? "", l.city ?? "",
        l.service ?? "", l.budget_range ?? "", l.type, l.intent ?? "", l.source ?? "",
        l.status, new Date(l.created_at).toISOString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setQ(""); setStatusFilter("all"); setTypeFilter("all");
    setIntentFilter("all"); setSourceFilter("all"); setDateFilter("all");
  }

  return (
    <AdminShell title="Leads">
      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="New" value={stats.new} tone="text-blue-600 dark:text-blue-400" />
        <StatCard label="Won" value={stats.won} tone="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Last 7 days" value={stats.last7} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, source…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {uniqueTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={intentFilter} onValueChange={setIntentFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Intent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All intents</SelectItem>
            {uniqueIntents.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {uniqueSources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Date" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" onClick={resetFilters}>Reset</Button>
        <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Export CSV ({filtered.length})</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Intent</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No leads found.</td></tr>
            ) : filtered.map((l) => (
              <tr key={l.id} className="cursor-pointer hover:bg-secondary/40" onClick={() => setSelected(l)}>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{l.name}</div>
                  {l.company && <div className="text-xs text-muted-foreground">{l.company}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="text-foreground">{l.email}</div>
                  {l.phone && <div className="text-xs text-muted-foreground">{l.phone}</div>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{l.intent ?? l.type}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate" title={l.source ?? ""}>
                  {l.source ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{l.service ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs uppercase ${STATUS_TONE[l.status] ?? "bg-secondary"}`}>
                    {l.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(l.created_at).toLocaleDateString()} <br />
                  <span className="opacity-60">{new Date(l.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteLead(l.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.name}
                  <Badge variant="outline" className="text-xs">{selected.intent ?? selected.type}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <Info label="Email" value={selected.email} />
                <Info label="Phone" value={selected.phone} />
                <Info label="Company" value={selected.company} />
                <Info label="Location" value={[selected.city, selected.country].filter(Boolean).join(", ") || null} />
                <Info label="Type" value={selected.type} />
                <Info label="Intent" value={selected.intent} />
                <Info label="Service" value={selected.service} />
                <Info label="Budget" value={selected.budget_range} />
                <Info label="Project type" value={selected.project_type} />
                <Info label="Sport type" value={selected.sport_type} />
                <Info label="Project area" value={selected.project_area} />
                <Info label="Preferred contact" value={selected.preferred_contact} />
                <Info label="Start date" value={selected.start_date} />
                <Info label="Submitted" value={new Date(selected.created_at).toLocaleString()} />
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase text-muted-foreground">Source</p>
                  <p className="mt-1 break-all text-foreground">{selected.source || "—"}</p>
                </div>
                {selected.attachment_url && (
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase text-muted-foreground">Attachment</p>
                    <a href={selected.attachment_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-primary hover:underline">
                      View file <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase text-muted-foreground">Message</p>
                  <p className="mt-1 whitespace-pre-wrap">{selected.message || "—"}</p>
                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-2">
                  {selected.email && (
                    <a href={`mailto:${selected.email}`}><Button size="sm" variant="outline">Email</Button></a>
                  )}
                  {selected.phone && (
                    <>
                      <a href={`tel:${selected.phone}`}><Button size="sm" variant="outline">Call</Button></a>
                      <a href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline">WhatsApp</Button>
                      </a>
                    </>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs uppercase text-muted-foreground">Status</label>
                  <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs uppercase text-muted-foreground">Internal notes</label>
                  <textarea
                    defaultValue={selected.internal_notes ?? ""}
                    rows={4}
                    className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
                    onBlur={(e) => saveNotes(selected.id, e.target.value)}
                    placeholder="Notes are auto-saved on blur…"
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-foreground">{value || "—"}</p>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}
