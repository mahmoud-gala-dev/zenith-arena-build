import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Loader2, Search, ExternalLink, Upload, X, Languages, Star, ImageIcon, Link2 as Link2Icon, Eye, Calendar as CalendarIcon,
} from "lucide-react";
import { BlogCategoriesManager } from "@/components/admin/BlogCategoriesManager";
import { TagsManager, slugifyTag, type Tag } from "@/components/admin/TagsManager";
import { TranslationLinkPanel } from "@/components/admin/TranslationLinkPanel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useInvalidateTables } from "@/lib/invalidate";
import { AIAssistButton, AITranslateSync, AISeoSuggest, AIContentDialog } from "@/components/admin/ai";


export const Route = createFileRoute("/_authenticated/admin/blog")({
  component: AdminBlogPage,
});

type Article = {
  id?: string;
  translation_group_id?: string;
  category_id?: string | null;
  slug_en?: string; slug_ar?: string;
  title_en?: string; title_ar?: string;
  excerpt_en?: string; excerpt_ar?: string;
  content_en?: string; content_ar?: string;
  featured_image?: string; og_image?: string;
  author_name?: string; reading_time?: number;
  tags?: string[];
  seo_title_en?: string; seo_title_ar?: string;
  seo_description_en?: string; seo_description_ar?: string;
  seo_keywords?: string;
  canonical_url_en?: string; canonical_url_ar?: string;
  noindex?: boolean;
  status?: "published" | "draft" | "archived";
  featured?: boolean;
  scheduled_at?: string | null;
  published_at?: string | null;
  updated_at?: string;
};

type Category = { id: string; slug_en: string; title_en: string; title_ar: string };

type PublishState = "draft" | "scheduled" | "published";

function derivePublishState(a: Pick<Article, "status" | "scheduled_at">): PublishState {
  if (a.status === "published") return "published";
  if (a.status === "draft" && a.scheduled_at && new Date(a.scheduled_at) > new Date()) return "scheduled";
  return "draft";
}

// Format a UTC ISO string into a value <input type="datetime-local"> accepts.
function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

const EMPTY: Article = {
  slug_en: "", slug_ar: "", title_en: "", title_ar: "",
  excerpt_en: "", excerpt_ar: "", content_en: "", content_ar: "",
  featured_image: "", og_image: "", author_name: "Egytic Editorial Team",
  reading_time: 5, tags: [], seo_title_en: "", seo_title_ar: "",
  seo_description_en: "", seo_description_ar: "", seo_keywords: "",
  canonical_url_en: "", canonical_url_ar: "", noindex: false,
  status: "draft", featured: false, category_id: null, scheduled_at: null,
};

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^\w\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function AdminBlogPage() {
  const invalidate = useInvalidateTables(["blog_posts", "blog_categories", "tags"]);
  const [rows, setRows] = useState<Article[]>([]);
  const [cats, setCats] = useState<Category[]>([]);

  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [translationFilter, setTranslationFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Article | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: posts, error }, { data: c }, { data: t }] = await Promise.all([
      supabase.from("blog_posts").select("*").order("updated_at", { ascending: false }),
      supabase.from("blog_categories").select("id, slug_en, title_en, title_ar").order("title_en"),
      supabase.from("tags").select("id, slug, name_en, name_ar").order("name_en"),
    ]);
    if (error) toast.error(error.message);
    setRows((posts as Article[]) ?? []);
    setCats((c as Category[]) ?? []);
    setTags((t as Tag[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && derivePublishState(r) !== statusFilter && r.status !== statusFilter) return false;
      if (categoryFilter !== "all" && (r.category_id ?? "") !== categoryFilter) return false;
      if (translationFilter === "complete" && !(r.title_en && r.title_ar)) return false;
      if (translationFilter === "en-only" && !(r.title_en && !r.title_ar)) return false;
      if (translationFilter === "ar-only" && !(r.title_ar && !r.title_en)) return false;
      if (!q) return true;
      return [r.title_en, r.title_ar, r.slug_en, r.slug_ar, r.excerpt_en, r.excerpt_ar, r.seo_keywords]
        .some((v) => (v ?? "").toString().toLowerCase().includes(q));
    });
  }, [rows, query, statusFilter, categoryFilter, translationFilter]);

  async function save() {
    if (!editing) return;
    if (!editing.title_en?.trim() && !editing.title_ar?.trim())
      return toast.error("At least one title (EN or AR) is required");
    if (!editing.slug_en?.trim()) return toast.error("English slug is required");
    const validSlugs = new Set(tags.map((t) => t.slug));
    const invalid = (editing.tags ?? []).filter((t) => !validSlugs.has(t));
    if (invalid.length) {
      return toast.error(`Unknown tag${invalid.length > 1 ? "s" : ""}: ${invalid.join(", ")}. Create ${invalid.length > 1 ? "them" : "it"} in Manage tags first.`);
    }
    // Validate scheduled date
    if (editing.status === "draft" && editing.scheduled_at) {
      const when = new Date(editing.scheduled_at);
      if (isNaN(when.getTime())) return toast.error("Invalid schedule date");
    }
    setSaving(true);
    try {
      const payload: Article = {
        ...editing,
        slug_en: slugify(editing.slug_en ?? editing.title_en ?? ""),
        slug_ar: editing.slug_ar ? slugify(editing.slug_ar) : editing.slug_ar,
        tags: Array.from(new Set((editing.tags ?? []).filter(Boolean))),
        reading_time: Number(editing.reading_time) || 5,
        category_id: editing.category_id || null,
        scheduled_at: editing.status === "draft" ? (editing.scheduled_at || null) : null,
        published_at: editing.status === "published"
          ? (editing.published_at ?? new Date().toISOString())
          : editing.published_at ?? null,
      };
      const { id, ...rest } = payload;
      const q = id
        ? supabase.from("blog_posts").update(rest as never).eq("id", id)
        : supabase.from("blog_posts").insert(rest as never);
      const { error } = await q;
      if (error) throw error;
      toast.success(id ? "Article updated" : "Article created");
      setEditing(null);
      invalidate();
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); invalidate(); load(); }
    setDeleteId(null);
  }

  async function toggleField(row: Article, key: "status" | "featured", value: unknown) {
    if (!row.id) return;
    const { error } = await supabase.from("blog_posts").update({ [key]: value } as never).eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [key]: value } : r)));
    invalidate();
  }


  return (
    <AdminShell title="Knowledge Center — Articles">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder="Search title, slug, keywords…" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.title_en}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={translationFilter} onValueChange={setTranslationFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All translations</SelectItem>
              <SelectItem value="complete">EN + AR</SelectItem>
              <SelectItem value="en-only">EN only</SelectItem>
              <SelectItem value="ar-only">AR only</SelectItem>
            </SelectContent>
          </Select>
          <BlogCategoriesManager onChanged={load} />
          <TagsManager onChanged={load} />
          <Button onClick={() => setEditing({ ...EMPTY })}><Plus className="h-4 w-4" /> New article</Button>
        </div>

        <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3 w-16">Image</th>
                <th className="p-3">Title</th>
                <th className="p-3 w-40">Category</th>
                <th className="p-3 w-32">Translations</th>
                <th className="p-3 w-40">Tags</th>
                <th className="p-3 w-32">Status</th>
                <th className="p-3 w-24">Featured</th>
                <th className="p-3 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline" /> Loading…</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No articles found.</td></tr>
              )}
              {!loading && filtered.map((r) => {
                const cat = cats.find((c) => c.id === r.category_id);
                const enOk = !!r.title_en?.trim();
                const arOk = !!r.title_ar?.trim();
                return (
                  <tr key={r.id} className="border-t border-border/50 hover:bg-muted/20">
                    <td className="p-3">
                      {r.featured_image ? (
                        <img src={r.featured_image} alt="" loading="lazy" className="h-10 w-14 rounded object-cover" />
                      ) : <div className="h-10 w-14 rounded bg-muted/40 grid place-items-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-foreground">{r.title_en || <span className="text-muted-foreground">— untitled —</span>}</div>
                      {r.title_ar && <div className="text-xs text-muted-foreground" dir="rtl">{r.title_ar}</div>}
                      <div className="text-xs text-muted-foreground">/{r.slug_en}</div>
                    </td>
                    <td className="p-3">{cat ? <Badge variant="secondary">{cat.title_en}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="p-3">
                      <div className="flex gap-1 items-center">
                        <Badge variant={enOk ? "default" : "outline"} className="text-[10px]">EN</Badge>
                        <Badge variant={arOk ? "default" : "outline"} className="text-[10px]">AR</Badge>
                        {(() => {
                          const linked = rows.filter((x) => x.id !== r.id && x.translation_group_id === r.translation_group_id).length;
                          return linked > 0 ? (
                            <Badge variant="secondary" className="text-[10px] gap-1" title="Linked translations">
                              <Link2Icon className="h-3 w-3" />{linked}
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(r.tags ?? []).slice(0, 3).map((slug) => {
                          const tag = tags.find((t) => t.slug === slug);
                          return (
                            <Badge key={slug} variant={tag ? "outline" : "destructive"} className="text-[10px]" title={tag ? tag.name_ar : "Unknown tag"}>
                              {tag?.name_en ?? slug}
                            </Badge>
                          );
                        })}
                        {(r.tags?.length ?? 0) > 3 && <span className="text-xs text-muted-foreground">+{(r.tags!.length - 3)}</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <Select value={r.status ?? "draft"} onValueChange={(v) => toggleField(r, "status", v)}>
                          <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        {derivePublishState(r) === "scheduled" && (
                          <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/60 text-amber-600">
                            <CalendarIcon className="h-3 w-3" />
                            {new Date(r.scheduled_at!).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3"><Switch checked={!!r.featured} onCheckedChange={(v) => toggleField(r, "featured", v)} /></td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        {r.slug_en && (
                          <Button size="icon" variant="ghost" asChild title="Preview in staff mode">
                            <a href={`/preview/knowledge/${r.slug_en}`} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /></a>
                          </Button>
                        )}
                        {r.slug_en && r.status === "published" && (
                          <Button size="icon" variant="ghost" asChild title="Open live">
                            <a href={`/knowledge/${r.slug_en}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => setEditing({ ...r, tags: r.tags ?? [] })}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(r.id ?? null)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit article" : "New article"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <ArticleEditor
              value={editing}
              onChange={setEditing}
              cats={cats}
              tags={tags}
              onTagsChanged={load}
            />

          )}
          <DialogFooter className="gap-2 sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {editing?.slug_en && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/preview/knowledge/${editing.slug_en}?lang=en`} target="_blank" rel="noreferrer">
                      <Eye className="h-4 w-4" /> Preview EN
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/preview/knowledge/${editing.slug_en}?lang=ar`} target="_blank" rel="noreferrer">
                      <Eye className="h-4 w-4" /> Preview AR
                    </a>
                  </Button>
                </>
              )}
              {!editing?.id && (
                <span className="text-xs text-muted-foreground self-center">Save first to enable preview.</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete article?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}

function ArticleEditor({
  value, onChange, cats, tags, onTagsChanged,
}: {
  value: Article;
  onChange: (v: Article) => void;
  cats: Category[];
  tags: Tag[];
  onTagsChanged: () => void;
}) {
  const set = (patch: Partial<Article>) => onChange({ ...value, ...patch });
  const [tagSearch, setTagSearch] = useState("");
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);

  const selectedSlugs = new Set(value.tags ?? []);
  const tagsBySlug = useMemo(() => Object.fromEntries(tags.map((t) => [t.slug, t] as const)), [tags]);
  const unknownSelected = (value.tags ?? []).filter((s) => !tagsBySlug[s]);
  const filteredTags = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    return tags.filter((t) => {
      if (selectedSlugs.has(t.slug)) return false;
      if (!q) return true;
      return [t.slug, t.name_en, t.name_ar].some((v) => v.toLowerCase().includes(q));
    });
  }, [tags, selectedSlugs, tagSearch]);

  function toggleTag(slug: string) {
    const next = selectedSlugs.has(slug)
      ? (value.tags ?? []).filter((s) => s !== slug)
      : Array.from(new Set([...(value.tags ?? []), slug]));
    set({ tags: next });
  }

  async function createTagFromSearch() {
    const raw = tagSearch.trim();
    if (!raw) return;
    const slug = slugifyTag(raw);
    if (!slug) return toast.error("Invalid tag name");
    if (tagsBySlug[slug]) {
      toggleTag(slug);
      setTagSearch("");
      return;
    }
    setCreatingTag(true);
    const { error } = await supabase.from("tags").insert({ slug, name_en: raw, name_ar: raw } as never);
    setCreatingTag(false);
    if (error) return toast.error(error.message);
    toast.success(`Tag "${raw}" created — remember to add its Arabic name in Manage tags.`);
    set({ tags: Array.from(new Set([...(value.tags ?? []), slug])) });
    setTagSearch("");
    onTagsChanged();
  }


  const publishState: PublishState = derivePublishState(value);
  function setPublishState(next: PublishState) {
    if (next === "published") {
      set({ status: "published", scheduled_at: null });
    } else if (next === "scheduled") {
      // default schedule = 1 hour from now if none set
      const when = value.scheduled_at && new Date(value.scheduled_at) > new Date()
        ? value.scheduled_at
        : new Date(Date.now() + 60 * 60 * 1000).toISOString();
      set({ status: "draft", scheduled_at: when });
    } else {
      set({ status: "draft", scheduled_at: null });
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={value.category_id ?? "__none"} onValueChange={(v) => set({ category_id: v === "__none" ? null : v })}>
            <SelectTrigger><SelectValue placeholder="Uncategorized" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Uncategorized</SelectItem>
              {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.title_en} — {c.title_ar}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Publish workflow</Label>
          <Select value={publishState} onValueChange={(v) => setPublishState(v as PublishState)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft — hidden from site</SelectItem>
              <SelectItem value="scheduled">Scheduled — publish at set time</SelectItem>
              <SelectItem value="published">Published — live now</SelectItem>
              {value.status === "archived" && <SelectItem value="draft">Archived (unarchive → draft)</SelectItem>}
            </SelectContent>
          </Select>
          {value.status === "archived" && (
            <p className="text-xs text-muted-foreground">Currently archived. Choose Draft to restore.</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Reading time (min)</Label>
          <Input type="number" min={1} value={value.reading_time ?? 5} onChange={(e) => set({ reading_time: Number(e.target.value) })} />
        </div>
      </div>

      {publishState === "scheduled" && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-amber-600" /> Go-live date &amp; time
          </Label>
          <Input
            type="datetime-local"
            value={toLocalInput(value.scheduled_at)}
            onChange={(e) => {
              const v = e.target.value;
              set({ scheduled_at: v ? new Date(v).toISOString() : null });
            }}
          />
          <p className="text-xs text-muted-foreground">
            Kept as Draft until this time, then automatically published. Uses your local timezone.
          </p>
        </div>
      )}


      {value.id && value.translation_group_id && (
        <TranslationLinkPanel
          post={{
            id: value.id,
            translation_group_id: value.translation_group_id,
            title_en: value.title_en,
            title_ar: value.title_ar,
            slug_en: value.slug_en,
          }}
        />
      )}
      {!value.id && (
        <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
          Save the article first to link it to an existing translation.
        </div>
      )}


      <Tabs defaultValue="en" className="w-full">
        <TabsList>
          <TabsTrigger value="en" className="gap-2"><Languages className="h-3 w-3" /> English</TabsTrigger>
          <TabsTrigger value="ar" className="gap-2"><Languages className="h-3 w-3" /> العربية</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="en" className="space-y-3 pt-3">
          <div className="flex items-center justify-between gap-2 flex-wrap rounded-md border bg-muted/30 p-2">
            <span className="text-xs text-muted-foreground">✨ AI helpers (English)</span>
            <div className="flex items-center gap-2 flex-wrap">
              <AIContentDialog
                triggerLabel="Draft full post"
                defaultKind="blog_post"
                defaultLanguage="en"
                onInsert={(text) => set({ content_en: (value.content_en ? value.content_en + "\n\n" : "") + text })}
                targetTable="blog_posts"
                targetId={value.id}
              />
              <AITranslateSync
                enValue={value.content_en ?? ""}
                arValue={value.content_ar ?? ""}
                onSetEn={(t) => set({ content_en: t })}
                onSetAr={(t) => set({ content_ar: t })}
                label="Sync content"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title (EN) *</Label>
              <div className="flex gap-2">
                <Input value={value.title_en ?? ""} onChange={(e) => set({ title_en: e.target.value, slug_en: value.id ? value.slug_en : slugify(e.target.value) })} />
                <AIAssistButton value={value.title_en ?? ""} onChange={(t) => set({ title_en: t })} language="en" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Slug (EN) *</Label>
              <Input value={value.slug_en ?? ""} onChange={(e) => set({ slug_en: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center justify-between">
              <span>Excerpt (EN)</span>
              <AIAssistButton value={value.excerpt_en ?? ""} onChange={(t) => set({ excerpt_en: t })} language="en" size="sm" />
            </Label>
            <Textarea rows={3} maxLength={500} value={value.excerpt_en ?? ""} onChange={(e) => set({ excerpt_en: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center justify-between">
              <span>Content (EN) — supports "## Heading" for auto-TOC</span>
              <AIAssistButton value={value.content_en ?? ""} onChange={(t) => set({ content_en: t })} language="en" size="sm" />
            </Label>
            <Textarea rows={12} maxLength={20000} value={value.content_en ?? ""} onChange={(e) => set({ content_en: e.target.value })} />
          </div>
        </TabsContent>

        <TabsContent value="ar" className="space-y-3 pt-3">
          <div className="flex items-center justify-between gap-2 flex-wrap rounded-md border bg-muted/30 p-2">
            <span className="text-xs text-muted-foreground">✨ مساعد الذكاء الاصطناعي (العربية)</span>
            <div className="flex items-center gap-2 flex-wrap">
              <AIContentDialog
                triggerLabel="صياغة مقال"
                defaultKind="blog_post"
                defaultLanguage="ar"
                onInsert={(text) => set({ content_ar: (value.content_ar ? value.content_ar + "\n\n" : "") + text })}
                targetTable="blog_posts"
                targetId={value.id}
              />
              <AITranslateSync
                enValue={value.content_en ?? ""}
                arValue={value.content_ar ?? ""}
                onSetEn={(t) => set({ content_en: t })}
                onSetAr={(t) => set({ content_ar: t })}
                label="مزامنة"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>العنوان (AR)</Label>
              <div className="flex gap-2">
                <Input dir="rtl" value={value.title_ar ?? ""} onChange={(e) => set({ title_ar: e.target.value, slug_ar: value.id ? value.slug_ar : slugify(e.target.value) })} />
                <AIAssistButton value={value.title_ar ?? ""} onChange={(t) => set({ title_ar: t })} language="ar" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Slug (AR)</Label>
              <Input value={value.slug_ar ?? ""} onChange={(e) => set({ slug_ar: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center justify-between">
              <span>مقتطف (AR)</span>
              <AIAssistButton value={value.excerpt_ar ?? ""} onChange={(t) => set({ excerpt_ar: t })} language="ar" size="sm" />
            </Label>
            <Textarea dir="rtl" rows={3} maxLength={500} value={value.excerpt_ar ?? ""} onChange={(e) => set({ excerpt_ar: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center justify-between">
              <span>المحتوى (AR)</span>
              <AIAssistButton value={value.content_ar ?? ""} onChange={(t) => set({ content_ar: t })} language="ar" size="sm" />
            </Label>
            <Textarea dir="rtl" rows={12} maxLength={20000} value={value.content_ar ?? ""} onChange={(e) => set({ content_ar: e.target.value })} />
          </div>
        </TabsContent>


        <TabsContent value="media" className="space-y-4 pt-3">
          <ImageField
            label="Featured image"
            value={value.featured_image ?? ""}
            onChange={(url) => set({ featured_image: url })}
            folder="blog"
          />
          <ImageField
            label="Social share image (og:image)"
            value={value.og_image ?? ""}
            onChange={(url) => set({ og_image: url })}
            folder="blog/og"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Author</Label>
              <Input value={value.author_name ?? ""} onChange={(e) => set({ author_name: e.target.value })} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={!!value.featured} onCheckedChange={(v) => set({ featured: v })} />
              <Label className="flex items-center gap-1"><Star className="h-3 w-3" /> Featured on Knowledge Center</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tags" className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <Label>Tags <span className="text-xs text-muted-foreground font-normal">({(value.tags ?? []).length} selected)</span></Label>
            <span className="text-xs text-muted-foreground">Only tags from the tag library can be assigned.</span>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[44px] p-2 rounded border border-border/60 bg-background/50">
            {(value.tags ?? []).length === 0 && (
              <span className="text-xs text-muted-foreground px-1 py-0.5">No tags selected yet.</span>
            )}
            {(value.tags ?? []).map((slug) => {
              const tag = tagsBySlug[slug];
              const known = !!tag;
              return (
                <Badge
                  key={slug}
                  variant={known ? "secondary" : "destructive"}
                  className="gap-1"
                  title={known ? `${tag.name_en} — ${tag.name_ar}` : "Unknown tag — remove or create it in Manage tags"}
                >
                  <span>{tag?.name_en ?? slug}</span>
                  {tag?.name_ar && <span className="text-[10px] opacity-70" dir="rtl">· {tag.name_ar}</span>}
                  <button type="button" onClick={() => toggleTag(slug)} aria-label={`Remove ${tag?.name_en ?? slug}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>

          {unknownSelected.length > 0 && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
              {unknownSelected.length} unknown tag{unknownSelected.length > 1 ? "s" : ""}: {unknownSelected.join(", ")}. Remove or register them before saving.
            </div>
          )}

          <Popover open={tagPickerOpen} onOpenChange={setTagPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" type="button">
                <Plus className="h-4 w-4" /> Add tags
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="start">
              <Input
                autoFocus
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder="Search or create tag…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredTags.length === 0 && tagSearch.trim()) {
                    e.preventDefault();
                    createTagFromSearch();
                  }
                }}
              />
              <div className="mt-2 max-h-64 overflow-y-auto">
                {filteredTags.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground space-y-2">
                    <div>No matching tags.</div>
                    {tagSearch.trim() && (
                      <Button size="sm" variant="secondary" onClick={createTagFromSearch} disabled={creatingTag}>
                        {creatingTag ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        Create "{tagSearch.trim()}"
                      </Button>
                    )}
                  </div>
                ) : (
                  <ul className="text-sm">
                    {filteredTags.slice(0, 30).map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-accent flex items-center justify-between gap-2"
                          onClick={() => { toggleTag(t.slug); setTagSearch(""); }}
                        >
                          <span>
                            <span className="font-medium">{t.name_en}</span>
                            <span className="text-xs text-muted-foreground ml-2" dir="rtl">{t.name_ar}</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">{t.slug}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {tags.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No tags exist yet. Use <strong>Manage tags</strong> in the toolbar to create some.
            </p>
          )}
        </TabsContent>


        <TabsContent value="seo" className="space-y-3 pt-3">
          <div className="flex items-center justify-between gap-2 flex-wrap rounded-md border bg-muted/30 p-2">
            <span className="text-xs text-muted-foreground">✨ AI SEO helpers</span>
            <div className="flex items-center gap-2 flex-wrap">
              <AISeoSuggest
                content={value.content_en ?? value.excerpt_en ?? value.title_en ?? ""}
                subject={value.title_en}
                language="en"
                onApply={(seo) => set({
                  seo_title_en: seo.title ?? value.seo_title_en,
                  seo_description_en: seo.description ?? value.seo_description_en,
                  seo_keywords: Array.isArray(seo.keywords) ? seo.keywords.join(", ") : (seo.keywords ?? value.seo_keywords),
                })}
              />
              <AISeoSuggest
                content={value.content_ar ?? value.excerpt_ar ?? value.title_ar ?? ""}
                subject={value.title_ar}
                language="ar"
                onApply={(seo) => set({
                  seo_title_ar: seo.title ?? value.seo_title_ar,
                  seo_description_ar: seo.description ?? value.seo_description_ar,
                })}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>SEO title (EN)</Label>
              <Input maxLength={70} value={value.seo_title_en ?? ""} onChange={(e) => set({ seo_title_en: e.target.value })} />
              <p className="text-xs text-muted-foreground">{(value.seo_title_en ?? "").length}/70</p>
            </div>
            <div className="space-y-1.5">
              <Label>SEO title (AR)</Label>
              <Input dir="rtl" maxLength={70} value={value.seo_title_ar ?? ""} onChange={(e) => set({ seo_title_ar: e.target.value })} />
              <p className="text-xs text-muted-foreground">{(value.seo_title_ar ?? "").length}/70</p>
            </div>
            <div className="space-y-1.5">
              <Label>SEO description (EN)</Label>
              <Textarea rows={3} maxLength={160} value={value.seo_description_en ?? ""} onChange={(e) => set({ seo_description_en: e.target.value })} />
              <p className="text-xs text-muted-foreground">{(value.seo_description_en ?? "").length}/160</p>
            </div>
            <div className="space-y-1.5">
              <Label>SEO description (AR)</Label>
              <Textarea dir="rtl" rows={3} maxLength={160} value={value.seo_description_ar ?? ""} onChange={(e) => set({ seo_description_ar: e.target.value })} />
              <p className="text-xs text-muted-foreground">{(value.seo_description_ar ?? "").length}/160</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>SEO keywords</Label>
            <Input value={value.seo_keywords ?? ""} onChange={(e) => set({ seo_keywords: e.target.value })} placeholder="football turf, construction, egypt" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Canonical URL (EN)</Label>
              <Input
                type="url"
                placeholder={value.slug_en ? `https://zenith-arena-build.lovable.app/knowledge/${value.slug_en}` : "https://example.com/canonical-path"}
                value={value.canonical_url_en ?? ""}
                onChange={(e) => set({ canonical_url_en: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Leave empty to auto-use the article's public URL.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Canonical URL (AR)</Label>
              <Input
                type="url"
                dir="ltr"
                placeholder={value.slug_en ? `https://zenith-arena-build.lovable.app/knowledge/${value.slug_en}?lang=ar` : ""}
                value={value.canonical_url_ar ?? ""}
                onChange={(e) => set({ canonical_url_ar: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Optional override for the Arabic version.</p>
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={!!value.noindex}
              onChange={(e) => set({ noindex: e.target.checked })}
            />
            <span>
              <span className="font-medium">Hide from search engines (noindex)</span>
              <span className="block text-xs text-muted-foreground">Adds a robots noindex,nofollow tag on the public article page.</span>
            </span>
          </label>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ImageField({
  label, value, onChange, folder,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-3 items-start">
        <div className="w-32 h-20 shrink-0 rounded border border-border/60 bg-muted/30 grid place-items-center overflow-hidden">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
        </div>
        <div className="flex-1 space-y-2">
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" />
          <div className="flex gap-2">
            <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
            </Button>
            {value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}><X className="h-4 w-4" /> Clear</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}
