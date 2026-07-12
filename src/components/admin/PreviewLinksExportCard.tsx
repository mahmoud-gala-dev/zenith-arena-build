import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Download, FileSpreadsheet } from "lucide-react";

type Row = {
  id: string;
  page_id: string;
  token: string;
  label: string | null;
  created_by_email: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
};
type PageRow = { id: string; slug: string; label: string };
type StatusFilter = "all" | "active" | "expired" | "revoked";
type DateBasis = "created_at" | "last_viewed_at" | "expires_at";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function statusOf(t: Row): Exclude<StatusFilter, "all"> {
  if (t.revoked_at) return "revoked";
  if (new Date(t.expires_at) <= new Date()) return "expired";
  return "active";
}

export function PreviewLinksExportCard({ pages }: { pages: PageRow[] }) {
  const [pageFilter, setPageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateBasis, setDateBasis] = useState<DateBasis>("created_at");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const pageIds = useMemo(() => pages.map((p) => p.id).filter(Boolean), [pages]);

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ["admin", "legal", "preview-tokens", "all", pageIds.sort().join(",")],
    enabled: pageIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_preview_tokens")
        .select("*")
        .in("page_id", pageIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const pageMap = useMemo(() => {
    const m = new Map<string, PageRow>();
    for (const p of pages) if (p.id) m.set(p.id, p);
    return m;
  }, [pages]);

  const filtered = useMemo(() => {
    const fromMs = from ? new Date(from).getTime() : null;
    const toMs = to ? new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    return tokens.filter((t) => {
      if (pageFilter !== "all" && t.page_id !== pageFilter) return false;
      if (statusFilter !== "all" && statusOf(t) !== statusFilter) return false;
      const iso = t[dateBasis];
      const ms = iso ? new Date(iso).getTime() : null;
      if (fromMs !== null && (ms === null || ms < fromMs)) return false;
      if (toMs !== null && (ms === null || ms > toMs)) return false;
      return true;
    });
  }, [tokens, pageFilter, statusFilter, dateBasis, from, to]);

  function download() {
    if (filtered.length === 0) {
      toast.error("No rows match the current filters");
      return;
    }
    const header = [
      "page_slug",
      "page_label",
      "label",
      "status",
      "created_at",
      "created_by_email",
      "expires_at",
      "revoked_at",
      "last_viewed_at",
      "view_count",
      "token",
      "preview_url",
    ];
    const origin = window.location.origin;
    const lines = [header.join(",")];
    for (const t of filtered) {
      const p = pageMap.get(t.page_id);
      lines.push(
        [
          p?.slug ?? "",
          p?.label ?? "",
          t.label ?? "",
          statusOf(t),
          t.created_at,
          t.created_by_email ?? "",
          t.expires_at,
          t.revoked_at ?? "",
          t.last_viewed_at ?? "",
          t.view_count ?? 0,
          t.token,
          `${origin}/preview/pages/${p?.slug ?? ""}?token=${t.token}`,
        ]
          .map(csvEscape)
          .join(","),
      );
    }
    const blob = new Blob(["\ufeff" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `preview-links_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} row${filtered.length === 1 ? "" : "s"}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSpreadsheet className="h-4 w-4" /> Export preview links & view log
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Filter tokens across legal pages then download a CSV including view counts, last viewed timestamp, expiry, and shareable URL.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Page</Label>
            <Select value={pageFilter} onValueChange={setPageFilter}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All pages</SelectItem>
                {pages.map((p) => (
                  <SelectItem key={p.id || p.slug} value={p.id || "__missing__"} disabled={!p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date field</Label>
            <Select value={dateBasis} onValueChange={(v) => setDateBasis(v as DateBasis)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created</SelectItem>
                <SelectItem value="last_viewed_at">Last viewed</SelectItem>
                <SelectItem value="expires_at">Expires</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {isLoading
              ? "Loading tokens…"
              : `${filtered.length} of ${tokens.length} link${tokens.length === 1 ? "" : "s"} match`}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPageFilter("all");
                setStatusFilter("all");
                setDateBasis("created_at");
                setFrom("");
                setTo("");
              }}
            >
              Reset
            </Button>
            <Button size="sm" onClick={download} disabled={isLoading || filtered.length === 0}>
              <Download className="h-3 w-3 mr-1" /> Export CSV
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
