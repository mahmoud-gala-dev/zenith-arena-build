import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Gauge, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/qa-reports")({
  component: QaReportsPage,
});

interface Report {
  id: string;
  run_at: string;
  commit_sha: string | null;
  branch: string | null;
  viewport: string;
  page: string;
  lcp_ms: number | null;
  cls: number | null;
  wa_overlap: boolean | null;
  more_opened: boolean | null;
  screenshot_url: string | null;
  notes: string | null;
}

function tone(lcp: number | null, cls: number | null, overlap: boolean | null) {
  if (overlap) return "fail";
  if ((lcp ?? 0) > 2500 || (cls ?? 0) > 0.1) return "warn";
  return "pass";
}

function QaReportsPage() {
  const [rows, setRows] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("qa_reports")
      .select("*")
      .order("run_at", { ascending: false })
      .limit(200);
    setRows((data as Report[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Group by run_at (rounded to minute) + commit
  const runs = new Map<string, Report[]>();
  rows.forEach((r) => {
    const key = `${r.run_at.slice(0, 16)}::${r.commit_sha ?? "local"}`;
    if (!runs.has(key)) runs.set(key, []);
    runs.get(key)!.push(r);
  });

  return (
    <AdminShell title="QA Reports">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Gauge className="h-5 w-5 text-primary" />
                Playwright + Web Vitals history
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Uploaded by CI on every release across iPhone, Android, tablet and desktop. Rows flag when
                WhatsApp overlaps the tab bar (blocking release) or LCP/CLS breach the "Good" threshold.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="shrink-0">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {runs.size === 0 && !loading && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No QA runs yet. CI will populate this page after the next release build.
          </div>
        )}

        {Array.from(runs.entries()).map(([key, group]) => {
          const first = group[0];
          const failing = group.filter((g) => g.wa_overlap).length;
          const warns = group.filter((g) => !g.wa_overlap && ((g.lcp_ms ?? 0) > 2500 || (g.cls ?? 0) > 0.1)).length;
          return (
            <div key={key} className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6">
              <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {new Date(first.run_at).toLocaleString()}
                    {first.branch && <span className="ms-2 text-xs text-muted-foreground">· {first.branch}</span>}
                    {first.commit_sha && (
                      <span className="ms-2 font-mono text-xs text-muted-foreground">
                        {first.commit_sha.slice(0, 7)}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{group.length} checks</p>
                </div>
                <div className="flex shrink-0 gap-2 text-xs">
                  {failing > 0 && (
                    <span className="rounded-full bg-destructive/10 px-3 py-1 font-medium text-destructive">
                      {failing} blocking
                    </span>
                  )}
                  {warns > 0 && (
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-700 dark:text-amber-400">
                      {warns} warnings
                    </span>
                  )}
                  {failing === 0 && warns === 0 && (
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-400">
                      All good
                    </span>
                  )}
                </div>
              </header>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="text-start text-xs uppercase text-muted-foreground">
                      <th className="pb-2 text-start font-medium">Viewport</th>
                      <th className="pb-2 text-start font-medium">Page</th>
                      <th className="pb-2 text-end font-medium">LCP</th>
                      <th className="pb-2 text-end font-medium">CLS</th>
                      <th className="pb-2 text-center font-medium">WA / More</th>
                      <th className="pb-2 text-end font-medium">Shot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {group.map((r) => {
                      const t = tone(r.lcp_ms, r.cls, r.wa_overlap);
                      return (
                        <tr key={r.id} className="align-top">
                          <td className="py-2 font-mono text-xs text-muted-foreground">{r.viewport}</td>
                          <td className="py-2 text-foreground">{r.page}</td>
                          <td className={cn("py-2 text-end tabular-nums", (r.lcp_ms ?? 0) > 2500 && "text-amber-600")}>
                            {r.lcp_ms ?? "—"}<span className="text-xs text-muted-foreground"> ms</span>
                          </td>
                          <td className={cn("py-2 text-end tabular-nums", (r.cls ?? 0) > 0.1 && "text-amber-600")}>
                            {r.cls?.toFixed(3) ?? "—"}
                          </td>
                          <td className="py-2 text-center">
                            {r.wa_overlap ? (
                              <span className="inline-flex items-center gap-1 text-destructive">
                                <AlertCircle className="h-4 w-4" />overlap
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />ok
                              </span>
                            )}
                            {r.more_opened === false && (
                              <span className="ms-2 text-xs text-destructive">More✗</span>
                            )}
                          </td>
                          <td className="py-2 text-end">
                            {r.screenshot_url ? (
                              <a
                                href={r.screenshot_url}
                                target="_blank"
                                rel="noopener"
                                className={cn(
                                  "inline-flex items-center gap-1 text-xs font-medium",
                                  t === "fail" ? "text-destructive" : "text-primary",
                                )}
                              >
                                view <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
