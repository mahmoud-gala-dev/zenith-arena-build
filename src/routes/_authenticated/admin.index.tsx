import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Inbox, FolderKanban, Image as ImageIcon, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: OverviewPage,
});

type Stats = { leads: number; newLeads: number; projects: number; media: number };
type Lead = { id: string; name: string; email: string; service: string | null; status: string; created_at: string };

function OverviewPage() {
  const [stats, setStats] = useState<Stats>({ leads: 0, newLeads: 0, projects: 0, media: 0 });
  const [recent, setRecent] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [leadsAll, leadsNew, projects, media, recentLeads] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("media_files").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("id,name,email,service,status,created_at").order("created_at", { ascending: false }).limit(6),
      ]);
      setStats({
        leads: leadsAll.count ?? 0,
        newLeads: leadsNew.count ?? 0,
        projects: projects.count ?? 0,
        media: media.count ?? 0,
      });
      setRecent((recentLeads.data ?? []) as Lead[]);
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: "Total leads", value: stats.leads, icon: Inbox, tone: "from-primary to-primary/80" },
    { label: "New leads", value: stats.newLeads, icon: TrendingUp, tone: "from-emerald-500 to-emerald-600" },
    { label: "Projects", value: stats.projects, icon: FolderKanban, tone: "from-amber-500 to-orange-600" },
    { label: "Media files", value: stats.media, icon: ImageIcon, tone: "from-sky-500 to-indigo-600" },
  ];

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
