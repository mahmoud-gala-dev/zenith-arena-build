import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Inbox, FolderKanban, Image as ImageIcon, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: OverviewPage,
});

type Stats = { leads: number; newLeads: number; projects: number; media: number };
type Lead = { id: string; name: string; email: string; service: string | null; status: string; created_at: string };

const STATUS_ORDER = ["new", "contacted", "qualified", "proposal_sent", "won", "lost"];

function OverviewPage() {
  const [stats, setStats] = useState<Stats>({ leads: 0, newLeads: 0, projects: 0, media: 0 });
  const [recent, setRecent] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [leadsAll, leadsNew, projects, media, recentLeads, everyLead] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("media_files").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("id,name,email,service,status,created_at").order("created_at", { ascending: false }).limit(6),
        // Only fetch fields needed for the charts, and only the last 30 days.
        supabase.from("leads").select("id,status,created_at").gte("created_at", since),
      ]);
      setStats({
        leads: leadsAll.count ?? 0,
        newLeads: leadsNew.count ?? 0,
        projects: projects.count ?? 0,
        media: media.count ?? 0,
      });
      setRecent((recentLeads.data ?? []) as Lead[]);
      setAllLeads((everyLead.data ?? []) as Lead[]);
      setLoading(false);
    })();
  }, []);


  const cards = [
    { label: "Total leads", value: stats.leads, icon: Inbox, tone: "from-primary to-primary/80" },
    { label: "New leads", value: stats.newLeads, icon: TrendingUp, tone: "from-emerald-500 to-emerald-600" },
    { label: "Projects", value: stats.projects, icon: FolderKanban, tone: "from-amber-500 to-orange-600" },
    { label: "Media files", value: stats.media, icon: ImageIcon, tone: "from-sky-500 to-indigo-600" },
  ];

  // Leads over last 30 days
  const now = Date.now();
  const days: { day: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    days.push({
      day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: allLeads.filter((l) => l.created_at.slice(0, 10) === key).length,
    });
  }

  const byStatus = STATUS_ORDER.map((s) => ({
    status: s.replace("_", " "),
    count: allLeads.filter((l) => l.status === s).length,
  }));

  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${c.tone} text-white`}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{loading ? "…" : c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Leads — last 30 days</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Leads by status</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent leads</h2>
          <Link to="/admin/leads" className="text-sm font-medium text-primary hover:underline">View all →</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          {recent.length === 0 && !loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No leads yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Service</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((l) => (
                  <tr key={l.id}>
                    <td className="py-3 font-medium text-foreground">{l.name}</td>
                    <td className="py-3 text-muted-foreground">{l.email}</td>
                    <td className="py-3 text-muted-foreground">{l.service ?? "—"}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs uppercase">{l.status}</span>
                    </td>
                    <td className="py-3 text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
