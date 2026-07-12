import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Copy, Link2, Trash2, Ban, Search, RefreshCw } from "lucide-react";
import { useMyRoles } from "@/hooks/useMyRoles";

type StatusFilter = "all" | "active" | "expired" | "revoked";
type SortKey = "created_desc" | "expires_asc" | "expires_desc" | "last_viewed_desc" | "views_desc";

type Token = {
  id: string;
  page_id: string;
  token: string;
  label: string | null;
  created_by_email: string | null;
  expires_at: string;
  revoked_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
  created_at: string;
  version_id: string | null;
};

type Version = {
  id: string;
  version_number: number;
  created_at: string;
  action: string;
  actor_email: string | null;
};

const CURRENT_DRAFT = "__current__";

function randomToken(len = 40) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, len);
}

export function PreviewLinksCard({
  pageId,
  slug,
  disabled,
}: {
  pageId: string | undefined;
  slug: string;
  disabled?: boolean;
}) {
  const qc = useQueryClient();
  const { canPreviewDrafts, roles } = useMyRoles();
  const [label, setLabel] = useState("");
  const [days, setDays] = useState(7);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_desc");

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ["admin", "legal", "preview-tokens", pageId],
    enabled: !!pageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_preview_tokens")
        .select("*")
        .eq("page_id", pageId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Token[];
    },
  });

  async function createToken() {
    if (!pageId) return;
    if (!canPreviewDrafts) {
      toast.error("Your role cannot create draft preview links");
      return;
    }
    setCreating(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const token = randomToken(40);
      const expires = new Date(Date.now() + Math.max(1, days) * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from("page_preview_tokens").insert({
        page_id: pageId,
        token,
        label: label.trim() || null,
        expires_at: expires,
        created_by: uid,
        created_by_email: userRes.user?.email ?? null,
      });
      if (error) throw error;
      setLabel("");
      qc.invalidateQueries({ queryKey: ["admin", "legal", "preview-tokens", pageId] });
      const url = `${window.location.origin}/preview/pages/${slug}?token=${token}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Preview link created and copied to clipboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create link");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    const { error } = await supabase
      .from("page_preview_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "legal", "preview-tokens", pageId] });
    toast.success("Link revoked");
  }

  async function remove(id: string) {
    const { error } = await supabase.from("page_preview_tokens").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "legal", "preview-tokens", pageId] });
    toast.success("Link deleted");
  }

  async function renew(t: Token) {
    if (!canPreviewDrafts) {
      toast.error("Your role cannot renew preview links");
      return;
    }
    const raw = window.prompt(`Extend "${t.label || "Untitled link"}" by how many days?`, "7");
    if (raw === null) return;
    const n = Math.max(1, Math.min(90, Math.floor(Number(raw))));
    if (!Number.isFinite(n) || n <= 0) return toast.error("Enter a number between 1 and 90");
    const base = !t.revoked_at && new Date(t.expires_at) > new Date() ? new Date(t.expires_at) : new Date();
    const next = new Date(base.getTime() + n * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("page_preview_tokens")
      .update({ expires_at: next, revoked_at: null })
      .eq("id", t.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "legal", "preview-tokens", pageId] });
    toast.success(`Extended by ${n} day${n === 1 ? "" : "s"} — views preserved`);
  }

  function urlFor(t: Token) {
    return `${window.location.origin}/preview/pages/${slug}?token=${t.token}`;
  }

  function statusOf(t: Token): { label: string; className: string } {
    if (t.revoked_at) return { label: "Revoked", className: "bg-red-500/15 text-red-700" };
    if (new Date(t.expires_at) <= new Date())
      return { label: "Expired", className: "bg-neutral-500/15 text-neutral-700" };
    return { label: "Active", className: "bg-emerald-500/15 text-emerald-700" };
  }

  function statusKey(t: Token): Exclude<StatusFilter, "all"> {
    if (t.revoked_at) return "revoked";
    if (new Date(t.expires_at) <= new Date()) return "expired";
    return "active";
  }

  const counts = useMemo(() => {
    const c = { all: tokens.length, active: 0, expired: 0, revoked: 0 };
    for (const t of tokens) c[statusKey(t)] += 1;
    return c;
  }, [tokens]);

  const filteredTokens = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = tokens.filter((t) => {
      if (statusFilter !== "all" && statusKey(t) !== statusFilter) return false;
      if (!q) return true;
      return (
        (t.label ?? "").toLowerCase().includes(q) ||
        (t.created_by_email ?? "").toLowerCase().includes(q) ||
        t.token.toLowerCase().includes(q)
      );
    });
    const ts = (v: string | null) => (v ? new Date(v).getTime() : 0);
    const sorted = list.slice().sort((a, b) => {
      switch (sortKey) {
        case "expires_asc":
          return ts(a.expires_at) - ts(b.expires_at);
        case "expires_desc":
          return ts(b.expires_at) - ts(a.expires_at);
        case "last_viewed_desc":
          return ts(b.last_viewed_at) - ts(a.last_viewed_at);
        case "views_desc":
          return (b.view_count ?? 0) - (a.view_count ?? 0);
        case "created_desc":
        default:
          return ts(b.created_at) - ts(a.created_at);
      }
    });
    return sorted;
  }, [tokens, search, statusFilter, sortKey]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4" /> Private preview links
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Share a tokenised URL so authorised reviewers can open the current draft — including unpublished versions —
          without publishing. Links expire automatically and can be revoked anytime.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto] items-end">
          <div className="space-y-1">
            <Label className="text-xs">Label (optional)</Label>
            <Input
              placeholder="e.g. Legal team review"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={disabled || !canPreviewDrafts}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Expires in (days)</Label>
            <Input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(Number(e.target.value) || 7)}
              disabled={disabled || !canPreviewDrafts}
            />
          </div>
          <Button
            onClick={createToken}
            disabled={disabled || creating || !pageId || !canPreviewDrafts}
            title={
              !canPreviewDrafts ? `Your role (${roles.join(", ") || "none"}) cannot create draft preview links` : undefined
            }
          >
            {creating ? "Creating…" : "Create link"}
          </Button>
        </div>

        {tokens.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] items-center">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by label, email, or token…"
                className="pl-7 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({counts.all})</SelectItem>
                <SelectItem value="active">Active ({counts.active})</SelectItem>
                <SelectItem value="expired">Expired ({counts.expired})</SelectItem>
                <SelectItem value="revoked">Revoked ({counts.revoked})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Newest first</SelectItem>
                <SelectItem value="last_viewed_desc">Last viewed</SelectItem>
                <SelectItem value="expires_asc">Expiring soonest</SelectItem>
                <SelectItem value="expires_desc">Expiring latest</SelectItem>
                <SelectItem value="views_desc">Most viewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading links…</p>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">No preview links yet.</p>
        ) : filteredTokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">No links match the current filters.</p>
        ) : (
          <ul className="space-y-2">
            {filteredTokens.map((t) => {
              const st = statusOf(t);
              const url = urlFor(t);
              return (
                <li key={t.id} className="rounded border p-3 text-sm space-y-2">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
                      <span className="font-medium">{t.label || "Untitled link"}</span>
                      <span className="text-xs text-muted-foreground">
                        by {t.created_by_email ?? "unknown"} · expires {new Date(t.expires_at).toLocaleString()} ·{" "}
                        {t.view_count} view{t.view_count === 1 ? "" : "s"}
                        {t.last_viewed_at ? ` · last ${new Date(t.last_viewed_at).toLocaleString()}` : ""}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await navigator.clipboard.writeText(url);
                          toast.success("Link copied");
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => renew(t)}
                        disabled={!canPreviewDrafts}
                        title={
                          !canPreviewDrafts
                            ? "Your role cannot renew preview links"
                            : t.revoked_at
                            ? "Reactivate and extend this link"
                            : "Extend expiration; keeps the same token and view count"
                        }
                      >
                        <RefreshCw className="h-3 w-3 mr-1" /> Renew
                      </Button>
                      {!t.revoked_at && (
                        <Button size="sm" variant="outline" onClick={() => revoke(t.id)}>
                          <Ban className="h-3 w-3 mr-1" /> Revoke
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => remove(t.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <code className="block truncate text-xs text-muted-foreground">{url}</code>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
