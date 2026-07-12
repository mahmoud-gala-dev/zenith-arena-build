import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, Link2, Trash2, Ban } from "lucide-react";
import { useMyRoles } from "@/hooks/useMyRoles";

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
};

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

  function urlFor(t: Token) {
    return `${window.location.origin}/preview/pages/${slug}?token=${t.token}`;
  }

  function statusOf(t: Token): { label: string; className: string } {
    if (t.revoked_at) return { label: "Revoked", className: "bg-red-500/15 text-red-700" };
    if (new Date(t.expires_at) <= new Date())
      return { label: "Expired", className: "bg-neutral-500/15 text-neutral-700" };
    return { label: "Active", className: "bg-emerald-500/15 text-emerald-700" };
  }

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

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading links…</p>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">No preview links yet.</p>
        ) : (
          <ul className="space-y-2">
            {tokens.map((t) => {
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
