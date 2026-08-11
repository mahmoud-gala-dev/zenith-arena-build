import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Download as DownloadIcon, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { TableRowsSkeleton } from "@/components/site/Skeletons";
import { usePaged, AdminPagination } from "@/components/admin/AdminPagination";

export const Route = createFileRoute("/_authenticated/admin/download-leads")({
  component: DownloadLeadsPage,
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
  message: string | null;
  internal_notes: string | null;
  created_at: string;
};

const STATUSES = ["new", "contacted", "qualified", "proposal_sent", "won", "lost"] as const;

function extractCatalog(service: string | null): { title: string; slug: string | null } {
  if (!service) return { title: "—", slug: null };
  const title = service.replace(/^Download:\s*/i, "").trim();
  return { title: title || "—", slug: null };
}

function DownloadLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [catalogFilter, setCatalogFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .ilike("service", "Download:%")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setLeads((data ?? []) as Lead[]);
    setSelectedIds(new Set());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const catalogs = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      const t = extractCatalog(l.service).title;
      if (t && t !== "—") set.add(t);
    });
    return Array.from(set).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      const cat = extractCatalog(l.service).title;
      if (catalogFilter !== "all" && cat !== catalogFilter) return false;
      if (dateFrom && new Date(l.created_at) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
        if (new Date(l.created_at) > to) return false;
      }
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        l.name.toLowerCase().includes(s) ||
        l.email.toLowerCase().includes(s) ||
        (l.phone ?? "").toLowerCase().includes(s) ||
        (l.company ?? "").toLowerCase().includes(s) ||
        cat.toLowerCase().includes(s)
      );
    });
  }, [leads, q, statusFilter, catalogFilter, dateFrom, dateTo]);

  const { page, setPage, pageCount, pageItems, total } = usePaged(filtered, 25);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("leads").update({ status: status as never }).eq("id", id);
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

  async function deleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} lead(s)?`)) return;
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("leads").delete().in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`Deleted ${ids.length}`);
    setLeads((prev) => prev.filter((l) => !selectedIds.has(l.id)));
    setSelectedIds(new Set());
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((l) => l.id)));
  }

  function exportCSV() {
    const rows = [
      ["Name", "Email", "Phone", "Company", "Country", "City", "Catalog", "Status", "Notes", "Date"],
      ...filtered.map((l) => [
        l.name, l.email, l.phone ?? "", l.company ?? "", l.country ?? "", l.city ?? "",
        extractCatalog(l.service).title, l.status, l.internal_notes ?? "",
        new Date(l.created_at).toISOString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `download-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const allChecked = filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <AdminShell title="Download Leads">
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs uppercase text-muted-foreground">Total</p>
          <p className="mt-1 text-2xl font-semibold">{leads.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs uppercase text-muted-foreground">Filtered</p>
          <p className="mt-1 text-2xl font-semibold">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs uppercase text-muted-foreground">New</p>
          <p className="mt-1 text-2xl font-semibold">{leads.filter((l) => l.status === "new").length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs uppercase text-muted-foreground">Unique catalogs</p>
          <p className="mt-1 text-2xl font-semibold">{catalogs.length}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, catalog…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={catalogFilter} onValueChange={setCatalogFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Catalog" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All catalogs</SelectItem>
            {catalogs.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[160px]" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[160px]" />
        <Button variant="outline" onClick={exportCSV}><DownloadIcon className="mr-2 h-4 w-4" /> Export CSV</Button>
        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={deleteSelected}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedIds.size})
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 w-8">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} />
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Catalog</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <TableRowsSkeleton rows={8} columns={8} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No download leads found.</td></tr>
            ) : pageItems.map((l) => {
              const cat = extractCatalog(l.service).title;
              return (
                <tr key={l.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(l.id)}
                      onChange={() => toggleOne(l.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground cursor-pointer" onClick={() => setSelected(l)}>{l.name}</td>
                  <td className="px-4 py-3 text-muted-foreground cursor-pointer" onClick={() => setSelected(l)}>{l.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cat}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs uppercase">{l.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteLead(l.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <AdminPagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} label="طلب تحميل" />
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <Info label="Email" value={selected.email} />
                <Info label="Phone" value={selected.phone} />
                <Info label="Company" value={selected.company} />
                <Info label="Country / City" value={[selected.country, selected.city].filter(Boolean).join(", ") || null} />
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase text-muted-foreground">Catalog</p>
                  <p className="mt-1 flex items-center gap-2 text-foreground">
                    {extractCatalog(selected.service).title}
                    <Link to="/downloads" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Browse
                    </Link>
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase text-muted-foreground">Message</p>
                  <p className="mt-1 whitespace-pre-wrap">{selected.message || "—"}</p>
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
