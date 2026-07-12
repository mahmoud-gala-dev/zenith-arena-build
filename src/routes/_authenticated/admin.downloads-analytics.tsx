import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Download as DownloadIcon, Eye, Globe, Loader2, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/downloads-analytics")({
  component: DownloadsAnalyticsPage,
});

type EventType = "view_index" | "view_detail" | "download";
type EventRow = {
  id: string;
  event_type: EventType;
  download_id: string | null;
  path: string | null;
  referrer: string | null;
  referrer_host: string | null;
  user_agent: string | null;
  created_at: string;
};
type DownloadMeta = { id: string; title_en: string; title_ar: string; slug_en: string };

const RANGES = [
  { key: "1", label: "Last 24 hours" },
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
  { key: "all", label: "All time" },
];

function DownloadsAnalyticsPage() {
  const [range, setRange] = useState<string>("30");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [meta, setMeta] = useState<Record<string, DownloadMeta>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    let q = supabase
      .from("download_events")
      .select("id,event_type,download_id,path,referrer,referrer_host,user_agent,created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (range !== "all") {
      const since = new Date();
      since.setDate(since.getDate() - Number(range));
      q = q.gte("created_at", since.toISOString());
    }
    const [{ data: evs }, { data: dls }] = await Promise.all([
      q,
      supabase.from("downloads").select("id,title_en,title_ar,slug_en"),
    ]);
    setEvents((evs as EventRow[] | null) ?? []);
    const m: Record<string, DownloadMeta> = {};
    for (const d of (dls as DownloadMeta[] | null) ?? []) m[d.id] = d;
    setMeta(m);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [range]);

  const totals = useMemo(() => {
    let vi = 0, vd = 0, dl = 0;
    for (const e of events) {
      if (e.event_type === "view_index") vi++;
      else if (e.event_type === "view_detail") vd++;
      else if (e.event_type === "download") dl++;
    }
    return { vi, vd, dl, total: events.length };
  }, [events]);

  const perFile = useMemo(() => {
    const map = new Map<string, { downloads: number; views: number }>();
    for (const e of events) {
      if (!e.download_id) continue;
      const cur = map.get(e.download_id) ?? { downloads: 0, views: 0 };
      if (e.event_type === "download") cur.downloads++;
      else if (e.event_type === "view_detail") cur.views++;
      map.set(e.download_id, cur);
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v, meta: meta[id] }))
      .sort((a, b) => b.downloads - a.downloads || b.views - a.views);
  }, [events, meta]);

  const referrers = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      const key = e.referrer_host || "Direct / bookmark";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([host, count]) => ({ host, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [events]);

  const daily = useMemo(() => {
    const map = new Map<string, { views: number; downloads: number }>();
    for (const e of events) {
      const day = e.created_at.slice(0, 10);
      const cur = map.get(day) ?? { views: 0, downloads: 0 };
      if (e.event_type === "download") cur.downloads++;
      else cur.views++;
      map.set(day, cur);
    }
    return Array.from(map.entries())
      .map(([day, v]) => ({ day, ...v }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [events]);

  const maxDay = Math.max(1, ...daily.map((d) => d.views + d.downloads));

  function exportCsv() {
    const rows = [
      ["created_at", "event_type", "download_id", "download_title", "path", "referrer_host", "referrer", "user_agent"],
      ...events.map((e) => [
        e.created_at,
        e.event_type,
        e.download_id ?? "",
        e.download_id ? meta[e.download_id]?.title_en ?? "" : "",
        e.path ?? "",
        e.referrer_host ?? "",
        e.referrer ?? "",
        e.user_agent ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `downloads-analytics-${range}d-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" /> Downloads analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Page visits and file downloads for <Link className="underline" to="/downloads">/downloads</Link>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!events.length}>Export CSV</Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Eye className="h-5 w-5" />} label="Index views" value={totals.vi} />
          <StatCard icon={<Eye className="h-5 w-5" />} label="Detail views" value={totals.vd} />
          <StatCard icon={<DownloadIcon className="h-5 w-5" />} label="Downloads" value={totals.dl} />
          <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Total events" value={totals.total} />
        </div>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold mb-4">Activity over time</h2>
          {daily.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events in this range.</p>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {daily.map((d) => {
                const total = d.views + d.downloads;
                const pct = (total / maxDay) * 100;
                const dlPct = total ? (d.downloads / total) * pct : 0;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.day}: ${d.views} views, ${d.downloads} downloads`}>
                    <div className="w-full flex flex-col justify-end h-32 rounded overflow-hidden bg-muted">
                      <div className="w-full bg-primary" style={{ height: `${dlPct}%` }} />
                      <div className="w-full bg-primary/40" style={{ height: `${pct - dlPct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">{d.day.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded bg-primary" /> Downloads</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded bg-primary/40" /> Views</span>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <DownloadIcon className="h-5 w-5" /> Top files
            </h2>
            {perFile.length === 0 ? (
              <p className="text-sm text-muted-foreground">No file activity yet.</p>
            ) : (
              <div className="divide-y">
                {perFile.slice(0, 25).map((f) => (
                  <div key={f.id} className="py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {f.meta ? (
                          <Link to="/downloads/$slug" params={{ slug: f.meta.slug_en }} className="hover:underline">
                            {f.meta.title_en || f.meta.title_ar}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Deleted file</span>
                        )}
                      </p>
                      {f.meta && <p className="text-xs text-muted-foreground truncate">/downloads/{f.meta.slug_en}</p>}
                    </div>
                    <Badge variant="secondary">{f.views} views</Badge>
                    <Badge>{f.downloads} DL</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Globe className="h-5 w-5" /> Referrers
            </h2>
            {referrers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No referrer data yet.</p>
            ) : (
              <div className="divide-y">
                {referrers.map((r) => (
                  <div key={r.host} className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-sm truncate">{r.host}</span>
                    <Badge variant="outline">{r.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="rounded-xl border bg-card">
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold">Recent events</h2>
          </div>
          <div className="max-h-[500px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">When</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">File</th>
                  <th className="p-3">Path</th>
                  <th className="p-3">Referrer</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 200).map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">{new Date(e.created_at).toLocaleString()}</td>
                    <td className="p-3"><Badge variant={e.event_type === "download" ? "default" : "secondary"}>{e.event_type.replace("_", " ")}</Badge></td>
                    <td className="p-3 truncate max-w-[200px]">{e.download_id ? meta[e.download_id]?.title_en ?? "—" : "—"}</td>
                    <td className="p-3 truncate max-w-[220px] text-muted-foreground">{e.path}</td>
                    <td className="p-3 truncate max-w-[200px] text-muted-foreground">{e.referrer_host || "Direct"}</td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No events recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}
