import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Inbox, FolderKanban, Image as ImageIcon, TrendingUp,
  FileText, Eye, Users as UsersIcon, CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: OverviewPage,
});

type Stats = {
  leads: number; newLeads: number; wonLeads: number;
  projects: number; media: number;
  articles: number; publishedArticles: number; draftArticles: number;
  users: number;
};
type Lead = { id: string; name: string; email: string; service: string | null; status: string; created_at: string };
type Article = { id: string; title_en: string | null; title_ar: string | null; status: string; created_at: string; published_at: string | null };
type DealRow = {
  status: string;
  deal_value_expected: number | string | null;
  deal_value_actual: number | string | null;
  won_at: string | null;
  created_at: string;
};

const STATUS_ORDER = ["new", "contacted", "qualified", "proposal_sent", "won", "lost"];
const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))", "#f59e0b"];

/** Stage-based win probability used to weight the open pipeline. */
const STAGE_PROBABILITY: Record<string, number> = {
  new: 0.1,
  contacted: 0.2,
  qualified: 0.4,
  proposal_sent: 0.6,
};

const num = (v: number | string | null | undefined) => {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const fmtMoney = (v: number) =>
  new Intl.NumberFormat(undefined, { notation: v >= 1_000_000 ? "compact" : "standard", maximumFractionDigits: 1 })
    .format(Math.round(v)) + " EGP";


function OverviewPage() {
  const [stats, setStats] = useState<Stats>({
    leads: 0, newLeads: 0, wonLeads: 0, projects: 0, media: 0,
    articles: 0, publishedArticles: 0, draftArticles: 0, users: 0,
  });
  const [recent, setRecent] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [
        leadsAll, leadsNew, leadsWon, projects, media,
        articlesAll, articlesPub, articlesDraft, usersAll,
        recentLeads, everyLead, everyArticle, recentArts, dealRows,
      ] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "won"),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("media_files").select("*", { count: "exact", head: true }),
        supabase.from("blog_posts").select("*", { count: "exact", head: true }),
        supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("id,name,email,service,status,created_at").order("created_at", { ascending: false }).limit(6),
        supabase.from("leads").select("id,status,created_at").gte("created_at", since),
        supabase.from("blog_posts").select("id,status,created_at,published_at").gte("created_at", since),
        supabase.from("blog_posts").select("id,title_en,title_ar,status,created_at,published_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("leads").select("status,deal_value_expected,deal_value_actual,won_at,created_at"),
      ]);
      setStats({
        leads: leadsAll.count ?? 0,
        newLeads: leadsNew.count ?? 0,
        wonLeads: leadsWon.count ?? 0,
        projects: projects.count ?? 0,
        media: media.count ?? 0,
        articles: articlesAll.count ?? 0,
        publishedArticles: articlesPub.count ?? 0,
        draftArticles: articlesDraft.count ?? 0,
        users: usersAll.count ?? 0,
      });
      setRecent((recentLeads.data ?? []) as Lead[]);
      setAllLeads((everyLead.data ?? []) as Lead[]);
      setAllArticles((everyArticle.data ?? []) as Article[]);
      setRecentArticles((recentArts.data ?? []) as Article[]);
      setDeals((dealRows.data ?? []) as unknown as DealRow[]);
      setLoading(false);
    })();
  }, []);

  const revenue = (() => {
    const open = deals.filter((d) => !["won", "lost"].includes(d.status));
    const won = deals.filter((d) => d.status === "won");
    const openValue = open.reduce((s, d) => s + num(d.deal_value_expected), 0);
    const weighted = open.reduce(
      (s, d) => s + num(d.deal_value_expected) * (STAGE_PROBABILITY[d.status] ?? 0.1),
      0,
    );
    const wonValue = won.reduce((s, d) => s + (num(d.deal_value_actual) || num(d.deal_value_expected)), 0);
    const closed = deals.filter((d) => ["won", "lost"].includes(d.status)).length;
    const winRate = closed ? Math.round((won.length / closed) * 100) : 0;
    const cycles = won
      .filter((d) => d.won_at)
      .map((d) => (new Date(d.won_at as string).getTime() - new Date(d.created_at).getTime()) / 86400000)
      .filter((n) => Number.isFinite(n) && n >= 0);
    const avgCycle = cycles.length ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : 0;
    return { openValue, weighted, wonValue, winRate, avgCycle };
  })();

  const funnel = (() => {
    const total = deals.length || 1;
    const reached = (from: number) =>
      deals.filter((d) => {
        const i = STATUS_ORDER.indexOf(d.status);
        return d.status === "won" ? true : i >= from && d.status !== "lost";
      }).length;
    return [
      { stage: "Captured", count: deals.length, pct: 100 },
      { stage: "Contacted", count: reached(1), pct: Math.round((reached(1) / total) * 100) },
      { stage: "Qualified", count: reached(2), pct: Math.round((reached(2) / total) * 100) },
      { stage: "Proposal", count: reached(3), pct: Math.round((reached(3) / total) * 100) },
      {
        stage: "Won",
        count: deals.filter((d) => d.status === "won").length,
        pct: Math.round((deals.filter((d) => d.status === "won").length / total) * 100),
      },
    ];
  })();


  const cards = [
    { label: "Total leads", value: stats.leads, icon: Inbox, tone: "from-primary to-primary/80" },
    { label: "New leads", value: stats.newLeads, icon: TrendingUp, tone: "from-emerald-500 to-emerald-600" },
    { label: "Won deals", value: stats.wonLeads, icon: CheckCircle2, tone: "from-amber-500 to-orange-600" },
    { label: "Projects", value: stats.projects, icon: FolderKanban, tone: "from-sky-500 to-indigo-600" },
    { label: "Total articles", value: stats.articles, icon: FileText, tone: "from-violet-500 to-fuchsia-600" },
    { label: "Published", value: stats.publishedArticles, icon: Eye, tone: "from-emerald-500 to-teal-600" },
    { label: "Media files", value: stats.media, icon: ImageIcon, tone: "from-rose-500 to-pink-600" },
    { label: "Users", value: stats.users, icon: UsersIcon, tone: "from-slate-500 to-slate-700" },
  ];

  const now = Date.now();
  const days: { day: string; leads: number; articles: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    days.push({
      day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      leads: allLeads.filter((l) => l.created_at.slice(0, 10) === key).length,
      articles: allArticles.filter((a) => a.created_at.slice(0, 10) === key).length,
    });
  }

  const byStatus = STATUS_ORDER.map((s) => ({
    status: s.replace("_", " "),
    count: allLeads.filter((l) => l.status === s).length,
  }));

  const articleStatusData = [
    { name: "Published", value: stats.publishedArticles },
    { name: "Draft", value: stats.draftArticles },
    { name: "Other", value: Math.max(0, stats.articles - stats.publishedArticles - stats.draftArticles) },
  ].filter((x) => x.value > 0);

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
          <h2 className="text-lg font-semibold text-foreground">Leads vs Articles — last 30 days</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days}>
                <defs>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gArts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="leads" name="Leads" stroke="hsl(var(--primary))" fill="url(#gLeads)" strokeWidth={2} />
                <Area type="monotone" dataKey="articles" name="Articles" stroke="#8b5cf6" fill="url(#gArts)" strokeWidth={2} />
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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Articles by status</h2>
          <div className="mt-4 h-64">
            {articleStatusData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No articles yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={articleStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {articleStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent articles</h2>
            <Link to="/admin/blog" className="text-sm font-medium text-primary hover:underline">Manage →</Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            {recentArticles.length === 0 && !loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No articles yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="py-2">Title</th><th className="py-2">Status</th><th className="py-2">Created</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentArticles.map((a) => (
                    <tr key={a.id}>
                      <td className="py-3 font-medium text-foreground">{a.title_en || a.title_ar || "Untitled"}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs uppercase ${a.status === "published" ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground"}`}>{a.status}</span>
                      </td>
                      <td className="py-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
