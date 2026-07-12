import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Download, Trash2, ExternalLink, Plus, Pencil, Phone, Mail, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LeadTimeline } from "@/components/admin/LeadTimeline";

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
      [
        "Name", "Email", "Phone", "Company", "Country", "City",
        "Type", "Intent", "Service", "Project Type", "Sport Type", "Area (m²)",
        "Budget", "Start Date", "Preferred Contact", "Source",
        "Status", "Message", "Internal Notes", "Attachment URL", "Created At",
      ],
      ...filtered.map((l) => [
        l.name, l.email, l.phone ?? "", l.company ?? "", l.country ?? "", l.city ?? "",
        l.type, l.intent ?? "", l.service ?? "", l.project_type ?? "", l.sport_type ?? "", l.project_area ?? "",
        l.budget_range ?? "", l.start_date ?? "", l.preferred_contact ?? "", l.source ?? "",
        l.status, (l.message ?? "").replace(/\r?\n/g, " "), (l.internal_notes ?? "").replace(/\r?\n/g, " "),
        l.attachment_url ?? "", new Date(l.created_at).toISOString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    // BOM so Excel opens UTF-8 (Arabic) correctly
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}-${filtered.length}rows.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} leads`);
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
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="mr-2 h-4 w-4" /> New Lead</Button>
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
                  <div className="flex justify-end gap-1">
                    {l.phone && (
                      <>
                        <Button asChild variant="ghost" size="sm" title="Call">
                          <a href={`tel:${l.phone}`} onClick={(e) => e.stopPropagation()}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button asChild variant="ghost" size="sm" title="WhatsApp">
                          <a
                            href={`https://wa.me/${l.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${l.name}, regarding your inquiry with Egytic Sports`)}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MessageCircle className="h-4 w-4 text-emerald-600" />
                          </a>
                        </Button>
                      </>
                    )}
                    {l.email && (
                      <Button asChild variant="ghost" size="sm" title="Email">
                        <a
                          href={`mailto:${l.email}?subject=${encodeURIComponent("Egytic Sports — Your inquiry")}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditing(l); setFormOpen(true); }} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteLead(l.id); }} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => { setEditing(selected); setFormOpen(true); }}>
                    <Pencil className="mr-1 h-3 w-3" /> Edit
                  </Button>
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
                <div className="sm:col-span-2">
                  <label className="text-xs uppercase text-muted-foreground">Activity timeline</label>
                  <div className="mt-2"><LeadTimeline leadId={selected.id} /></div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <LeadFormDialog
        open={formOpen}
        lead={editing}
        onOpenChange={setFormOpen}
        onSaved={(saved) => {
          setLeads((prev) => {
            const exists = prev.some((l) => l.id === saved.id);
            return exists ? prev.map((l) => (l.id === saved.id ? saved : l)) : [saved, ...prev];
          });
          if (selected?.id === saved.id) setSelected(saved);
          setFormOpen(false);
        }}
      />
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

const TYPES = ["quote", "contact", "download", "newsletter", "career"] as const;
const CONTACT_PREFS = ["email", "phone", "whatsapp"] as const;

type LeadFormState = {
  name: string; email: string; phone: string; company: string;
  country: string; city: string; type: string; status: string;
  intent: string; source: string; service: string; budget_range: string;
  project_type: string; sport_type: string; project_area: string;
  preferred_contact: string; start_date: string; message: string;
  internal_notes: string; attachment_url: string;
};

function emptyForm(): LeadFormState {
  return {
    name: "", email: "", phone: "", company: "", country: "", city: "",
    type: "contact", status: "new", intent: "", source: "manual", service: "",
    budget_range: "", project_type: "", sport_type: "", project_area: "",
    preferred_contact: "", start_date: "", message: "", internal_notes: "", attachment_url: "",
  };
}

function toForm(l: Lead): LeadFormState {
  return {
    name: l.name ?? "", email: l.email ?? "", phone: l.phone ?? "", company: l.company ?? "",
    country: l.country ?? "", city: l.city ?? "", type: l.type ?? "contact", status: l.status ?? "new",
    intent: l.intent ?? "", source: l.source ?? "", service: l.service ?? "",
    budget_range: l.budget_range ?? "", project_type: l.project_type ?? "",
    sport_type: l.sport_type ?? "", project_area: l.project_area ?? "",
    preferred_contact: l.preferred_contact ?? "", start_date: l.start_date ?? "",
    message: l.message ?? "", internal_notes: l.internal_notes ?? "", attachment_url: l.attachment_url ?? "",
  };
}

function LeadFormDialog({
  open, lead, onOpenChange, onSaved,
}: {
  open: boolean;
  lead: Lead | null;
  onOpenChange: (o: boolean) => void;
  onSaved: (l: Lead) => void;
}) {
  const [form, setForm] = useState<LeadFormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(lead ? toForm(lead) : emptyForm());
  }, [open, lead]);

  function set<K extends keyof LeadFormState>(k: K, v: LeadFormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone || null,
      company: form.company || null,
      country: form.country || null,
      city: form.city || null,
      type: form.type as Lead["type"],
      status: form.status as Lead["status"],
      intent: form.intent || null,
      source: form.source || null,
      service: form.service || null,
      budget_range: form.budget_range || null,
      project_type: form.project_type || null,
      sport_type: form.sport_type || null,
      project_area: form.project_area || null,
      preferred_contact: form.preferred_contact || null,
      start_date: form.start_date || null,
      message: form.message || null,
      internal_notes: form.internal_notes || null,
      attachment_url: form.attachment_url || null,
    };
    if (lead) {
      const { data, error } = await supabase.from("leads").update(payload as never).eq("id", lead.id).select().single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Lead updated");
      onSaved(data as unknown as Lead);
    } else {
      const { data, error } = await supabase.from("leads").insert(payload as never).select().single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Lead created");
      onSaved(data as unknown as Lead);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "New Lead"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name *"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Email *"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Company"><Input value={form.company} onChange={(e) => set("company", e.target.value)} /></Field>
          <Field label="Country"><Input value={form.country} onChange={(e) => set("country", e.target.value)} /></Field>
          <Field label="City"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
          <Field label="Type">
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Intent"><Input value={form.intent} onChange={(e) => set("intent", e.target.value)} /></Field>
          <Field label="Source"><Input value={form.source} onChange={(e) => set("source", e.target.value)} /></Field>
          <Field label="Service"><Input value={form.service} onChange={(e) => set("service", e.target.value)} /></Field>
          <Field label="Budget range"><Input value={form.budget_range} onChange={(e) => set("budget_range", e.target.value)} /></Field>
          <Field label="Project type"><Input value={form.project_type} onChange={(e) => set("project_type", e.target.value)} /></Field>
          <Field label="Sport type"><Input value={form.sport_type} onChange={(e) => set("sport_type", e.target.value)} /></Field>
          <Field label="Project area"><Input value={form.project_area} onChange={(e) => set("project_area", e.target.value)} /></Field>
          <Field label="Preferred contact">
            <Select value={form.preferred_contact || "none"} onValueChange={(v) => set("preferred_contact", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {CONTACT_PREFS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Start date"><Input type="date" value={form.start_date ? form.start_date.slice(0, 10) : ""} onChange={(e) => set("start_date", e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Attachment URL"><Input value={form.attachment_url} onChange={(e) => set("attachment_url", e.target.value)} /></Field></div>
          <div className="sm:col-span-2">
            <Field label="Message">
              <textarea rows={3} className="w-full rounded-md border border-border bg-background p-2 text-sm" value={form.message} onChange={(e) => set("message", e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Internal notes">
              <textarea rows={3} className="w-full rounded-md border border-border bg-background p-2 text-sm" value={form.internal_notes} onChange={(e) => set("internal_notes", e.target.value)} />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : lead ? "Save changes" : "Create lead"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
