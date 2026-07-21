import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { TrendingUp, Percent, Inbox, Target, Download as DownloadIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/kpi")({
  component: KpiPage,
});

type Lead = {
  id: string;
  status: string;
  type: string | null;
  source: string | null;
  intent: string | null;
  service: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
};

type DownloadEvent = { id: string; created_at: string; download_id: string | null };

const STATUS_ORDER = ["new", "contacted", "qualified", "proposal_sent", "won", "lost"];
const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  contacted: "#8b5cf6",
  qualified: "#f59e0b",
  proposal_sent: "#ec4899",
  won: "#10b981",
  lost: "#ef4444",
};
const PALETTE = ["hsl(var(--primary))", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9", "#ef4444", "#64748b"];

const RANGES = [
  { key: "7", label: "7d" },
  { key: "30", label: "30d" },
  { key: "90", label: "90d" },
  { key: "180", label: "6m" },
  { key: "365", label: "12m" },
] as const;

const GRANULARITIES = [
  { key: "day", label: "Daily" },
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
] as const;

type Granularity = typeof GRANULARITIES[number]["key"];

function bucketKey(d: Date, g: Granularity): string {
  if (g === "day") return d.toISOString().slice(0, 10);
  if (g === "month") return d.toISOString().slice(0, 7);
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() - dow + 1);
  return day.toISOString().slice(0, 10);
}

function KpiPage() {
  const [days, setDays] = useState<string>("30");
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [source, setSource] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [downloads, setDownloads] = useState<DownloadEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - Number(days) * 86400000).toISOString();
      const [{ data: l }, { data: d }] = await Promise.all([
        supabase.from("leads")
          .select("id,status,type,source,intent,service,country,city,created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: true }),
        supabase.from("download_events")
          .select("id,created_at,download_id")
          .gte("created_at", since),
      ]);
      if (cancelled) return;
      setLeads((l ?? []) as Lead[]);
      setDownloads((d ?? []) as DownloadEvent[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [days]);

  const filtered = useMemo(() => leads.filter((l) =>
    (source === "all" || (l.source ?? "direct") === source) &&
    (type === "all" || (l.type ?? "quote") === type)
  ), [leads, source, type]);

  const total = filtered.length;
  const won = filtered.filter((l) => l.status === "won").length;
  const lost = filtered.filter((l) => l.status === "lost").length;
  const active = total - won - lost;
  const conversionRate = total ? (won / total) * 100 : 0;
  const dropOffRate = total ? (lost / total) * 100 : 0;

  const funnel = STATUS_ORDER.map((s) => ({
    status: s.replace("_", " "),
    key: s,
    count: filtered.filter((l) => l.status === s).length,
  }));

  const sources = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of filtered) {
      const k = (l.source ?? "direct").trim() || "direct";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const availableSources = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) set.add((l.source ?? "direct").trim() || "direct");
    return Array.from(set).sort();
  }, [leads]);

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) if (l.type) set.add(l.type);
    return Array.from(set).sort();
  }, [leads]);

  const trends = useMemo(() => {
    const buckets = new Map<string, { leads: number; won: number; downloads: number }>();
    const start = new Date(Date.now() - Number(days) * 86400000);
    const cur = new Date(start);
    while (cur <= new Date()) {
      buckets.set(bucketKey(cur, granularity), { leads: 0, won: 0, downloads: 0 });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    for (const l of filtered) {
      const k = bucketKey(new Date(l.created_at), granularity);
      const b = buckets.get(k) ?? { leads: 0, won: 0, downloads: 0 };
      b.leads++;
      if (l.status === "won") b.won++;
      buckets.set(k, b);
    }
    for (const d of downloads) {
      const k = bucketKey(new Date(d.created_at), granularity);
      const b = buckets.get(k);
      if (b) b.downloads++;
    }
    return Array.from(buckets.entries()).map(([k, v]) => ({ bucket: k, ...v }));
  }, [filtered, downloads, days, granularity]);

  const topServices = useMemo(() => {
    const map = new Map<string, { total: number; won: number }>();
    for (const l of filtered) {
      const k = (l.service ?? "—").trim() || "—";
      const e = map.get(k) ?? { total: 0, won: 0 };
      e.total++;
      if (l.status === "won") e.won++;
      map.set(k, e);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8)
      .map(([name, v]) => ({ name, total: v.total, won: v.won, rate: v.total ? (v.won / v.total) * 100 : 0 }));
  }, [filtered]);

  const topGeo = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of filtered) {
      const c = (l.city || l.country || "—").trim() || "—";
      map.set(c, (map.get(c) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const kpis = [
    { label: "Total leads", value: total, icon: Inbox, tone: "from-primary to-primary/80" },
    { label: "Won", value: won, icon: Target, tone: "from-emerald-500 to-emerald-600" },
    { label: "Conversion rate", value: `${conversionRate.toFixed(1)}%`, icon: Percent, tone: "from-amber-500 to-orange-600" },
    { label: "Active pipeline", value: active, icon: TrendingUp, tone: "from-sky-500 to-indigo-600" },
    { label: "Drop-off", value: `${dropOffRate.toFixed(1)}%`, icon: TrendingUp, tone: "from-rose-500 to-pink-600" },
    { label: "Catalog downloads", value: downloads.length, icon: DownloadIcon, tone: "from-violet-500 to-fuchsia-600" },
  ];

  return (
    <AdminShell title="KPI Dashboard">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground me-2">Range:</span>
          {RANGES.map((r) => (
            <Button key={r.key} size="sm" variant={days === r.key ? "default" : "outline"} onClick={() => setDays(r.key)}>
              {r.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground me-2">Granularity:</span>
          {GRANULARITIES.map((g) => (
            <Button key={g.key} size="sm" variant={granularity === g.key ? "default" : "outline"} onClick={() => setGranularity(g.key)}>
              {g.label}
            </Button>
          ))}
        </div>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Source</label>
          <select value={source} onChange={(e) => setSource(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm">
            <option value="all">All sources</option>
            {availableSources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="text-xs font-medium text-muted-foreground ms-2">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm">
            <option value="all">All types</option>
            {availableTypes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.tone} text-white`}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{loading ? "…" : c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-foreground">Leads, wins & downloads over time</h2>
        <p className="text-xs text-muted-foreground">Filtered by source, type and range above.</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient>
                <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="leads" name="Leads" stroke="hsl(var(--primary))" fill="url(#gL)" strokeWidth={2} />
              <Area type="monotone" dataKey="won" name="Won" stroke="#10b981" fill="url(#gW)" strokeWidth={2} />
              <Area type="monotone" dataKey="downloads" name="Downloads" stroke="#8b5cf6" fill="url(#gD)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Conversion funnel</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {funnel.map((f) => <Cell key={f.key} fill={STATUS_COLORS[f.key] ?? "hsl(var(--primary))"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Traffic sources</h2>
          <div className="mt-4 h-64">
            {sources.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sources} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={90} paddingAngle={2}>
                    {sources.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Top services</h2>
            <span className="text-xs text-muted-foreground">Volume vs conversion %</span>
          </div>
          <div className="mt-4 h-72">
            {topServices.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="l" dataKey="total" name="Leads" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="rate" name="Conv. %" stroke="#10b981" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Top locations</h2>
          <div className="mt-4 h-72">
            {topGeo.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topGeo} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="value" name="Leads" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-foreground">Source performance</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Source</th>
                <th className="py-2">Leads</th>
                <th className="py-2">Won</th>
                <th className="py-2">Lost</th>
                <th className="py-2">Conv. %</th>
                <th className="py-2">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sources.length === 0 && !loading && (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No leads for the selected filters.</td></tr>
              )}
              {sources.map((s) => {
                const items = filtered.filter((l) => (l.source ?? "direct") === s.name);
                const w = items.filter((l) => l.status === "won").length;
                const lo = items.filter((l) => l.status === "lost").length;
                const rate = items.length ? (w / items.length) * 100 : 0;
                const share = total ? (items.length / total) * 100 : 0;
                return (
                  <tr key={s.name}>
                    <td className="py-3 font-medium text-foreground">{s.name}</td>
                    <td className="py-3">{items.length}</td>
                    <td className="py-3 text-emerald-600">{w}</td>
                    <td className="py-3 text-rose-600">{lo}</td>
                    <td className="py-3">{rate.toFixed(1)}%</td>
                    <td className="py-3 text-muted-foreground">{share.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
