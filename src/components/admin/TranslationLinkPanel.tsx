import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Link2, Unlink, RefreshCw, Search, AlertTriangle, Check } from "lucide-react";

export type LinkablePost = {
  id: string;
  translation_group_id: string;
  title_en?: string | null;
  title_ar?: string | null;
  slug_en?: string | null;
};

const SHARED_FIELDS = [
  "category_id",
  "featured_image",
  "og_image",
  "tags",
  "reading_time",
  "author_name",
  "seo_keywords",
  "featured",
  "status",
  "published_at",
] as const;

type SharedField = (typeof SHARED_FIELDS)[number];

const SHARED_LABELS: Record<SharedField, string> = {
  category_id: "Category",
  featured_image: "Featured image",
  og_image: "Open Graph image",
  tags: "Tags",
  reading_time: "Reading time",
  author_name: "Author",
  seo_keywords: "SEO keywords",
  featured: "Featured flag",
  status: "Publish status",
  published_at: "Publish date",
};

type SharedRow = Record<SharedField, unknown> & { id: string };

function normalize(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function sameValue(a: unknown, b: unknown): boolean {
  return normalize(a) === normalize(b);
}

export function TranslationLinkPanel({
  post,
  onChanged,
}: {
  post: LinkablePost;
  onChanged?: () => void;
}) {
  const [openLink, setOpenLink] = useState(false);
  const [openSync, setOpenSync] = useState(false);
  const [siblings, setSiblings] = useState<LinkablePost[]>([]);
  const [candidates, setCandidates] = useState<LinkablePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [pickedFields, setPickedFields] = useState<Set<SharedField>>(new Set(SHARED_FIELDS));

  // Full shared-field snapshot for current post + siblings, used by the summary.
  const [sourceRow, setSourceRow] = useState<SharedRow | null>(null);
  const [siblingRows, setSiblingRows] = useState<SharedRow[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const loadSiblings = useCallback(async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("id, translation_group_id, title_en, title_ar, slug_en")
      .eq("translation_group_id", post.translation_group_id)
      .neq("id", post.id);
    setSiblings((data as LinkablePost[]) ?? []);
  }, [post.id, post.translation_group_id]);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    const selectCols = ["id", ...SHARED_FIELDS].join(",");
    const { data } = await supabase
      .from("blog_posts")
      .select(selectCols)
      .eq("translation_group_id", post.translation_group_id);
    const rows = (data as unknown as SharedRow[]) ?? [];
    setSourceRow(rows.find((r) => r.id === post.id) ?? null);
    setSiblingRows(rows.filter((r) => r.id !== post.id));
    setSummaryLoading(false);
  }, [post.id, post.translation_group_id]);

  useEffect(() => { loadSiblings(); loadSummary(); }, [loadSiblings, loadSummary]);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("id, translation_group_id, title_en, title_ar, slug_en")
      .neq("id", post.id)
      .neq("translation_group_id", post.translation_group_id)
      .order("updated_at", { ascending: false })
      .limit(50);
    setCandidates((data as LinkablePost[]) ?? []);
    setLoading(false);
  }, [post.id, post.translation_group_id]);

  useEffect(() => { if (openLink) loadCandidates(); }, [openLink, loadCandidates]);

  const filteredCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) =>
      (c.title_en ?? "").toLowerCase().includes(q) ||
      (c.title_ar ?? "").toLowerCase().includes(q) ||
      (c.slug_en ?? "").toLowerCase().includes(q),
    );
  }, [candidates, query]);

  // Per-field diff summary: which siblings disagree with the current post.
  const fieldSummary = useMemo(() => {
    return SHARED_FIELDS.map((field) => {
      const srcVal = sourceRow ? sourceRow[field] : undefined;
      const mismatched = siblingRows.filter((r) => !sameValue(srcVal, r[field]));
      return {
        field,
        srcVal,
        mismatched,
        inSync: mismatched.length === 0,
      };
    });
  }, [sourceRow, siblingRows]);

  const outOfSyncFields = useMemo(
    () => fieldSummary.filter((f) => !f.inSync).map((f) => f.field),
    [fieldSummary],
  );

  async function linkTo(target: LinkablePost) {
    setBusy(true);
    const { error } = await supabase
      .from("blog_posts")
      .update({ translation_group_id: target.translation_group_id })
      .eq("translation_group_id", post.translation_group_id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Translations linked");
    setOpenLink(false);
    await loadSiblings();
    await loadSummary();
    onChanged?.();
  }

  async function unlink() {
    setBusy(true);
    const { error } = await supabase
      .from("blog_posts")
      .update({ translation_group_id: crypto.randomUUID() })
      .eq("id", post.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Unlinked from translation group");
    await loadSiblings();
    await loadSummary();
    onChanged?.();
  }

  function openSyncDialog(prefill?: SharedField[]) {
    // Preselect only the fields the caller wants (defaults to out-of-sync ones).
    const fields = prefill && prefill.length > 0 ? prefill : outOfSyncFields;
    setPickedFields(new Set(fields.length > 0 ? fields : SHARED_FIELDS));
    setOpenSync(true);
  }

  async function syncShared() {
    if (siblings.length === 0 || !sourceRow) return;
    if (pickedFields.size === 0) { toast.error("Pick at least one field."); return; }
    setBusy(true);
    const payload: Record<string, unknown> = {};
    for (const key of SHARED_FIELDS) {
      if (pickedFields.has(key)) payload[key] = sourceRow[key];
    }
    const { error } = await supabase
      .from("blog_posts")
      .update(payload as never)
      .eq("translation_group_id", post.translation_group_id)
      .neq("id", post.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Synced ${Object.keys(payload).length} field(s) to ${siblings.length} translation(s)`);
    setOpenSync(false);
    await loadSummary();
    onChanged?.();
  }

  async function resyncField(field: SharedField) {
    if (!sourceRow || siblings.length === 0) return;
    setBusy(true);
    const payload = { [field]: sourceRow[field] } as Record<string, unknown>;
    const { error } = await supabase
      .from("blog_posts")
      .update(payload as never)
      .eq("translation_group_id", post.translation_group_id)
      .neq("id", post.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Re-synced "${SHARED_LABELS[field]}" to ${siblings.length} translation(s)`);
    await loadSummary();
    onChanged?.();
  }

  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="text-sm font-medium">Translation group</div>
          <div className="text-xs text-muted-foreground">
            {siblings.length === 0
              ? "Not linked to any other language version."
              : `Linked to ${siblings.length} other post${siblings.length === 1 ? "" : "s"}.`}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button type="button" size="sm" variant="outline" onClick={() => setOpenLink(true)}>
            <Link2 className="h-4 w-4" /> Link translation
          </Button>
          {siblings.length > 0 && (
            <>
              <Button type="button" size="sm" variant="outline" onClick={() => openSyncDialog()}>
                <RefreshCw className="h-4 w-4" /> Sync shared fields
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={unlink} disabled={busy}>
                <Unlink className="h-4 w-4" /> Unlink
              </Button>
            </>
          )}
        </div>
      </div>

      {siblings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {siblings.map((s) => (
            <Badge key={s.id} variant="secondary" className="gap-1">
              {s.title_ar ? <span dir="rtl">{s.title_ar}</span> : null}
              {s.title_ar && s.title_en ? <span className="opacity-50">·</span> : null}
              {s.title_en ? <span>{s.title_en}</span> : null}
              {!s.title_en && !s.title_ar ? <span className="text-muted-foreground">— untitled —</span> : null}
            </Badge>
          ))}
        </div>
      )}

      {/* Shared-fields summary */}
      {siblings.length > 0 && (
        <div className="rounded-md border border-border/60 bg-muted/20">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/60">
            <div className="text-xs font-medium">
              Shared fields ·{" "}
              {summaryLoading ? (
                <span className="text-muted-foreground">loading…</span>
              ) : outOfSyncFields.length === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                  <Check className="h-3 w-3" /> all in sync
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {outOfSyncFields.length} out of sync
                </span>
              )}
            </div>
            {outOfSyncFields.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openSyncDialog(outOfSyncFields)}
                disabled={busy}
              >
                <RefreshCw className="h-3 w-3" /> Re-sync differences
              </Button>
            )}
          </div>
          <ul className="divide-y divide-border/50 text-xs">
            {fieldSummary.map(({ field, srcVal, mismatched, inSync }) => (
              <li key={field} className="grid grid-cols-[1fr_auto] items-start gap-2 px-3 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{SHARED_LABELS[field]}</span>
                    {inSync ? (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 gap-1 h-5 px-1.5">
                        <Check className="h-3 w-3" /> in sync
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400 gap-1 h-5 px-1.5">
                        <AlertTriangle className="h-3 w-3" /> differs in {mismatched.length}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-muted-foreground truncate">
                    <span className="opacity-70">this:</span> {normalize(srcVal)}
                  </div>
                  {!inSync && (
                    <div className="text-muted-foreground truncate">
                      <span className="opacity-70">other:</span>{" "}
                      {mismatched.map((m) => normalize(m[field])).join(" · ")}
                    </div>
                  )}
                </div>
                {!inSync && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7"
                    onClick={() => resyncField(field)}
                    disabled={busy}
                  >
                    <RefreshCw className="h-3 w-3" /> Re-sync
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Link dialog */}
      <Dialog open={openLink} onOpenChange={setOpenLink}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Link translation</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search title or slug…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="max-h-80 overflow-y-auto rounded border border-border/60 divide-y divide-border/50">
            {loading && <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline" /> Loading…</div>}
            {!loading && filteredCandidates.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">No posts available.</div>
            )}
            {!loading && filteredCandidates.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => linkTo(c)}
                disabled={busy}
                className="w-full text-left p-3 hover:bg-muted/40 disabled:opacity-50 flex flex-col gap-0.5"
              >
                <span className="text-sm font-medium">{c.title_en || <span className="text-muted-foreground">— no EN title —</span>}</span>
                {c.title_ar && <span className="text-xs text-muted-foreground" dir="rtl">{c.title_ar}</span>}
                <span className="text-[10px] text-muted-foreground">/{c.slug_en}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Any translations already linked to this post will join the target's group.
          </p>
        </DialogContent>
      </Dialog>

      {/* Sync dialog */}
      <Dialog open={openSync} onOpenChange={setOpenSync}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sync shared fields</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Copy the selected language-neutral fields from this post to {siblings.length} linked translation{siblings.length === 1 ? "" : "s"}. Titles, slugs, excerpts, and body content are never overwritten.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SHARED_FIELDS.map((f) => {
              const summary = fieldSummary.find((s) => s.field === f);
              const differs = summary && !summary.inSync;
              return (
                <label key={f} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={pickedFields.has(f)}
                    onCheckedChange={(v) => {
                      const next = new Set(pickedFields);
                      if (v) next.add(f); else next.delete(f);
                      setPickedFields(next);
                    }}
                  />
                  <Label className="cursor-pointer flex items-center gap-1">
                    {SHARED_LABELS[f]}
                    {differs && <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />}
                  </Label>
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenSync(false)}>Cancel</Button>
            <Button onClick={syncShared} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sync now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
