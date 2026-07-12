import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Loader2, Search, Upload, X, FileText, ExternalLink, Download as DownloadIcon, GripVertical, Image as ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { StrictImageUrlField } from "@/components/admin/StrictImageUrlField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { signPath } from "@/lib/signedUrl";
import { useInvalidateTables } from "@/lib/invalidate";


export const Route = createFileRoute("/_authenticated/admin/downloads")({
  component: AdminDownloadsPage,
});

type DownloadFile = {
  label_en: string;
  label_ar: string;
  url: string;
  lang: "en" | "ar" | "both";
  size?: number | null;
  mime?: string | null;
};

type DownloadRow = {
  id: string;
  title_en: string;
  title_ar: string;
  slug_en: string;
  slug_ar: string | null;
  category: string;
  description_en: string | null;
  description_ar: string | null;
  file_url: string | null;
  preview_image: string | null;
  requires_lead_capture: boolean;
  status: "published" | "draft" | "archived";
  featured: boolean;
  sort_order: number;
  seo_title_en: string | null;
  seo_title_ar: string | null;
  seo_description_en: string | null;
  seo_description_ar: string | null;
  og_image: string | null;
  og_image_ar: string | null;
  files: DownloadFile[];
  gallery: string[];
  created_at: string;
  updated_at: string;
};

const BUCKET = "downloads";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

const CATEGORIES = [
  "Company Profile",
  "Product Catalog",
  "Technical Datasheet",
  "Brochure",
  "Maintenance Guide",
  "Certificate",
  "Case Study",
];

const emptyRow = (): Partial<DownloadRow> => ({
  title_en: "",
  title_ar: "",
  slug_en: "",
  slug_ar: "",
  category: "Product Catalog",
  description_en: "",
  description_ar: "",
  file_url: "",
  preview_image: "",
  requires_lead_capture: false,
  status: "published",
  featured: false,
  sort_order: 0,
  seo_title_en: "",
  seo_title_ar: "",
  seo_description_en: "",
  seo_description_ar: "",
  og_image: "",
  og_image_ar: "",
  files: [],
  gallery: [],
});


function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 140);
}

function formatBytes(n?: number | null) {
  if (!n || n <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function AdminDownloadsPage() {
  const [rows, setRows] = useState<DownloadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<DownloadRow> | null>(null);
  const [deleteRow, setDeleteRow] = useState<DownloadRow | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("downloads")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as DownloadRow[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (!q) return true;
      return [r.title_en, r.title_ar, r.slug_en, r.category].some((v) => (v ?? "").toLowerCase().includes(q));
    });
  }, [rows, query, statusFilter, categoryFilter]);

  async function handleDelete() {
    if (!deleteRow) return;
    const { error } = await supabase.from("downloads").delete().eq("id", deleteRow.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    setDeleteRow(null);
    void load();
  }

  return (
    <AdminShell title="Downloads Library">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Catalogs & files</h2>
            <p className="text-sm text-muted-foreground">
              Upload PDFs and thumbnails, manage bilingual titles, categories, and lead-gate settings.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search title, slug…"
                className="w-64 pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => setEditing(emptyRow())} className="gap-1"><Plus className="h-4 w-4" />New download</Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-20 px-4 py-3 text-left">Preview</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">File</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="w-24 px-4 py-3 text-right">Order</th>
                  <th className="w-32 px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No downloads yet.</td></tr>
                ) : filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="h-12 w-16 overflow-hidden rounded-md border border-border bg-secondary">
                        {r.preview_image ? (
                          <img src={r.preview_image} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-muted-foreground">
                            <FileText className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.title_en || <span className="text-muted-foreground">Untitled</span>}</div>
                      <div className="text-xs text-muted-foreground" dir="rtl">{r.title_ar}</div>
                      <div className="text-xs text-muted-foreground">/{r.slug_en}</div>
                    </td>
                    <td className="px-4 py-3"><Badge variant="secondary">{r.category}</Badge></td>
                    <td className="px-4 py-3">
                      {r.file_url ? (
                        <a href={r.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" /> Open
                        </a>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={r.status === "published" ? "default" : r.status === "archived" ? "outline" : "secondary"}>
                        {r.status}
                      </Badge>
                      {r.featured && <Badge className="ml-1" variant="outline">Featured</Badge>}
                      {r.requires_lead_capture && <Badge className="ml-1" variant="outline">Lead-gate</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.sort_order}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteRow(r)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <DownloadEditor
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void load(); }}
        />
      )}

      <AlertDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete download?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the record. Uploaded files stay in storage until manually cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}

function DownloadEditor({
  row, onClose, onSaved,
}: { row: Partial<DownloadRow>; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState<Partial<DownloadRow>>(() => ({
    ...row,
    files: Array.isArray(row.files) ? (row.files as DownloadFile[]) : [],
    gallery: Array.isArray(row.gallery) ? (row.gallery as string[]) : [],
  }));
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadLabel, setUploadLabel] = useState("");
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [multiUploading, setMultiUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof DownloadRow>(k: K, v: DownloadRow[K] | string | number | boolean | null) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  const files = (values.files ?? []) as DownloadFile[];
  const gallery = (values.gallery ?? []) as string[];

  function updateFiles(next: DownloadFile[]) { setValues((p) => ({ ...p, files: next })); }
  function updateGallery(next: string[]) { setValues((p) => ({ ...p, gallery: next })); }

  async function uploadOneToStorage(file: File, folder: string) {
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const base = slugify(values.slug_en || values.title_en || "file") || "file";
    const path = `${folder}/${base}-${stamp}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || undefined,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw error;
    return signPath(BUCKET, path, TEN_YEARS);
  }

  async function handleMultiFilePick(list: FileList) {
    setMultiUploading(true);
    const added: DownloadFile[] = [];
    try {
      for (const file of Array.from(list)) {
        if (file.size > 100 * 1024 * 1024) { toast.error(`${file.name}: max 100 MB — skipped`); continue; }
        const url = await uploadOneToStorage(file, "files");
        added.push({
          label_en: file.name.replace(/\.[^.]+$/, ""),
          label_ar: file.name.replace(/\.[^.]+$/, ""),
          url,
          lang: "both",
          size: file.size,
          mime: file.type || null,
        });
      }
      if (added.length) {
        updateFiles([...files, ...added]);
        toast.success(`${added.length} file(s) added`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setMultiUploading(false);
      if (multiInputRef.current) multiInputRef.current.value = "";
    }
  }

  async function handleGalleryPick(list: FileList) {
    setGalleryUploading(true);
    const added: string[] = [];
    try {
      for (const file of Array.from(list)) {
        if (!file.type.startsWith("image/")) { toast.error(`${file.name}: not an image — skipped`); continue; }
        if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name}: max 10 MB — skipped`); continue; }
        const url = await uploadOneToStorage(file, "gallery");
        added.push(url);
      }
      if (added.length) {
        updateGallery([...gallery, ...added]);
        toast.success(`${added.length} image(s) added`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function moveFile(idx: number, dir: -1 | 1) {
    const next = [...files];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    updateFiles(next);
  }
  function moveImage(idx: number, dir: -1 | 1) {
    const next = [...gallery];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    updateGallery(next);
  }

  async function handleFilePick(file: File) {
    if (file.size > 100 * 1024 * 1024) { toast.error("File too large — max 100 MB."); return; }
    setUploadingFile(true);
    setUploadPct(5);
    setUploadLabel(`Uploading ${file.name}…`);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
      const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const base = slugify(values.slug_en || values.title_en || "file") || "file";
      const path = `files/${base}-${stamp}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || undefined,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      setUploadPct(70);
      setUploadLabel("Generating link…");
      const signed = await signPath(BUCKET, path, TEN_YEARS);
      set("file_url", signed);
      setFileMeta({ name: file.name, size: file.size });
      setUploadPct(100);
      setUploadLabel("Uploaded");
      toast.success(`${file.name} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingFile(false);
      setTimeout(() => { setUploadPct(0); setUploadLabel(""); }, 1200);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!values.title_en?.trim()) { toast.error("English title is required"); return; }
    if (!values.title_ar?.trim()) { toast.error("Arabic title is required"); return; }
    const slug = values.slug_en?.trim() || slugify(values.title_en);
    if (!slug) { toast.error("Slug is required"); return; }
    setSaving(true);
    const payload = {
      title_en: values.title_en.trim(),
      title_ar: values.title_ar.trim(),
      slug_en: slug,
      slug_ar: values.slug_ar?.trim() || null,
      category: values.category || "Product Catalog",
      description_en: values.description_en?.trim() || null,
      description_ar: values.description_ar?.trim() || null,
      file_url: values.file_url?.trim() || null,
      preview_image: values.preview_image?.trim() || null,
      requires_lead_capture: !!values.requires_lead_capture,
      status: (values.status ?? "published") as DownloadRow["status"],
      featured: !!values.featured,
      sort_order: Number(values.sort_order ?? 0),
      seo_title_en: values.seo_title_en?.trim() || null,
      seo_title_ar: values.seo_title_ar?.trim() || null,
      seo_description_en: values.seo_description_en?.trim() || null,
      seo_description_ar: values.seo_description_ar?.trim() || null,
      og_image: values.og_image?.trim() || null,
      og_image_ar: values.og_image_ar?.trim() || null,
      files: files.filter((f) => f.url?.trim()).map((f) => ({
        label_en: f.label_en?.trim() || "",
        label_ar: f.label_ar?.trim() || "",
        url: f.url.trim(),
        lang: f.lang ?? "both",
        size: f.size ?? null,
        mime: f.mime ?? null,
      })),
      gallery: gallery.filter((u) => u?.trim()),
    };

    const { error } = values.id
      ? await supabase.from("downloads").update(payload as never).eq("id", values.id)
      : await supabase.from("downloads").insert([payload as never]);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(values.id ? "Updated" : "Created");
    onSaved();
  }

  const uploadedFileLabel = fileMeta
    ? `${fileMeta.name} · ${formatBytes(fileMeta.size)}`
    : values.file_url
    ? "Existing file link attached"
    : "";

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && !uploadingFile && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{values.id ? "Edit download" : "New download"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>English title *</Label>
            <Input
              value={values.title_en ?? ""}
              onChange={(e) => {
                set("title_en", e.target.value);
                if (!values.slug_en || values.slug_en === slugify(String(values.title_en ?? ""))) {
                  set("slug_en", slugify(e.target.value));
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Arabic title *</Label>
            <Input dir="rtl" value={values.title_ar ?? ""} onChange={(e) => set("title_ar", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>English slug *</Label>
            <Input value={values.slug_en ?? ""} onChange={(e) => set("slug_en", slugify(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Arabic slug</Label>
            <Input dir="rtl" value={values.slug_ar ?? ""} onChange={(e) => set("slug_ar", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={values.category ?? "Product Catalog"} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={values.status ?? "published"} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label>English description</Label>
            <Textarea rows={3} value={values.description_en ?? ""} onChange={(e) => set("description_en", e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label>Arabic description</Label>
            <Textarea rows={3} dir="rtl" value={values.description_ar ?? ""} onChange={(e) => set("description_ar", e.target.value)} />
          </div>

          <div className="md:col-span-2 rounded-xl border border-border bg-secondary/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-semibold">Catalog file (PDF, DOCX, ZIP…)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button" size="sm" variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="ml-1">Upload file</span>
                </Button>
                {values.file_url && !uploadingFile && (
                  <>
                    <Button asChild size="sm" variant="ghost">
                      <a href={values.file_url} target="_blank" rel="noreferrer" className="gap-1">
                        <DownloadIcon className="h-4 w-4" /> Test
                      </a>
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => { set("file_url", ""); setFileMeta(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,application/pdf"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFilePick(f); }}
            />
            <Input
              placeholder="…or paste an external file URL"
              value={values.file_url ?? ""}
              onChange={(e) => set("file_url", e.target.value)}
              disabled={uploadingFile}
            />
            {uploadPct > 0 && (
              <div className="mt-2 space-y-1">
                <Progress value={uploadPct} className="h-2" />
                <p className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{uploadLabel}</span><span className="tabular-nums">{uploadPct}%</span>
                </p>
              </div>
            )}
            {uploadedFileLabel && !uploadingFile && (
              <p className="mt-2 text-xs text-muted-foreground">{uploadedFileLabel}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <StrictImageUrlField
              label="Thumbnail / cover image"
              value={values.preview_image ?? ""}
              onChange={(v) => set("preview_image", v)}
              aspect="aspect-[4/3]"
              aspectRatio={4 / 3}
              bucket={BUCKET}
              folder="thumbnails"
              help="Square-ish cover image shown in the catalog list and detail hero. Upload from your device or paste a URL."
            />
          </div>

          {/* Multiple downloadable files */}
          <div className="md:col-span-2 rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Additional files (multi-file catalog)</Label>
                <p className="text-xs text-muted-foreground">
                  Attach as many files as you need. Set a language tag (EN / AR / both) and bilingual button labels.
                </p>
              </div>
              <Button
                type="button" size="sm" variant="secondary"
                onClick={() => multiInputRef.current?.click()}
                disabled={multiUploading}
              >
                {multiUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="ml-1">Upload files</span>
              </Button>
              <input
                ref={multiInputRef} type="file" multiple className="hidden"
                onChange={(e) => { if (e.target.files?.length) void handleMultiFilePick(e.target.files); }}
              />
            </div>

            {files.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No extra files yet.</p>
            ) : (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="rounded-lg border border-border bg-background p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-2 h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="grid flex-1 gap-2 md:grid-cols-2">
                        <Input
                          placeholder="Label (EN)"
                          value={f.label_en}
                          onChange={(e) => { const n = [...files]; n[i] = { ...n[i], label_en: e.target.value }; updateFiles(n); }}
                        />
                        <Input
                          dir="rtl" placeholder="التسمية (AR)"
                          value={f.label_ar}
                          onChange={(e) => { const n = [...files]; n[i] = { ...n[i], label_ar: e.target.value }; updateFiles(n); }}
                        />
                        <Input
                          className="md:col-span-2"
                          placeholder="File URL"
                          value={f.url}
                          onChange={(e) => { const n = [...files]; n[i] = { ...n[i], url: e.target.value }; updateFiles(n); }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button size="icon" variant="ghost" onClick={() => moveFile(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => moveFile(i, 1)} disabled={i === files.length - 1} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pl-6">
                      <Select
                        value={f.lang ?? "both"}
                        onValueChange={(v) => { const n = [...files]; n[i] = { ...n[i], lang: v as DownloadFile["lang"] }; updateFiles(n); }}
                      >
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="both">EN + AR</SelectItem>
                          <SelectItem value="en">English only</SelectItem>
                          <SelectItem value="ar">Arabic only</SelectItem>
                        </SelectContent>
                      </Select>
                      {f.size ? <Badge variant="outline" className="text-[11px]">{formatBytes(f.size)}</Badge> : null}
                      {f.mime ? <Badge variant="outline" className="text-[11px]">{f.mime}</Badge> : null}
                      <div className="ml-auto flex gap-1">
                        {f.url && (
                          <Button asChild size="sm" variant="ghost">
                            <a href={f.url} target="_blank" rel="noreferrer" className="gap-1">
                              <DownloadIcon className="h-4 w-4" /> Test
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => updateFiles(files.filter((_, j) => j !== i))}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button" size="sm" variant="outline"
              onClick={() => updateFiles([...files, { label_en: "", label_ar: "", url: "", lang: "both" }])}
            >
              <Plus className="mr-1 h-4 w-4" /> Add empty row
            </Button>
          </div>

          {/* Gallery preview images */}
          <div className="md:col-span-2 rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Preview gallery images</Label>
                <p className="text-xs text-muted-foreground">
                  Extra preview images shown on the catalog detail page (in addition to the thumbnail above).
                </p>
              </div>
              <Button
                type="button" size="sm" variant="secondary"
                onClick={() => galleryInputRef.current?.click()}
                disabled={galleryUploading}
              >
                {galleryUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                <span className="ml-1">Upload images</span>
              </Button>
              <input
                ref={galleryInputRef} type="file" multiple accept="image/*" className="hidden"
                onChange={(e) => { if (e.target.files?.length) void handleGalleryPick(e.target.files); }}
              />
            </div>
            {gallery.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No preview images yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                {gallery.map((src, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-lg border border-border bg-background">
                    <div className="aspect-[4/3]">
                      <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-background/90 p-1 opacity-0 transition group-hover:opacity-100">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveImage(i, -1)} disabled={i === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveImage(i, 1)} disabled={i === gallery.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateGallery(gallery.filter((_, j) => j !== i))}>
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 rounded-xl border border-border bg-secondary/30 p-4 space-y-4">
            <div>
              <Label className="text-sm font-semibold">SEO & social preview</Label>
              <p className="text-xs text-muted-foreground">
                Optional overrides used for Google results and shared links. Falls back to the title, description, and thumbnail above.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>SEO title (EN)</Label>
                <Input
                  maxLength={70}
                  value={values.seo_title_en ?? ""}
                  onChange={(e) => set("seo_title_en", e.target.value)}
                  placeholder={values.title_en ? `${values.title_en} — Egytic Sports` : "Recommended ≤ 60 chars"}
                />
                <p className="text-[11px] text-muted-foreground">{(values.seo_title_en ?? "").length}/70</p>
              </div>
              <div className="space-y-1.5">
                <Label>SEO title (AR)</Label>
                <Input
                  dir="rtl"
                  maxLength={70}
                  value={values.seo_title_ar ?? ""}
                  onChange={(e) => set("seo_title_ar", e.target.value)}
                  placeholder={values.title_ar ? `${values.title_ar} — إيجيتك سبورتس` : "يفضل ≤ 60 حرف"}
                />
                <p className="text-[11px] text-muted-foreground">{(values.seo_title_ar ?? "").length}/70</p>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Meta description (EN)</Label>
                <Textarea
                  rows={2}
                  maxLength={200}
                  value={values.seo_description_en ?? ""}
                  onChange={(e) => set("seo_description_en", e.target.value)}
                  placeholder="Recommended 120–160 chars. Falls back to the English description."
                />
                <p className="text-[11px] text-muted-foreground">{(values.seo_description_en ?? "").length}/200</p>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Meta description (AR)</Label>
                <Textarea
                  rows={2}
                  dir="rtl"
                  maxLength={200}
                  value={values.seo_description_ar ?? ""}
                  onChange={(e) => set("seo_description_ar", e.target.value)}
                  placeholder="يفضل 120–160 حرفًا. يعود تلقائيًا للوصف بالعربية إن ترك فارغًا."
                />
                <p className="text-[11px] text-muted-foreground">{(values.seo_description_ar ?? "").length}/200</p>
              </div>
              <div className="md:col-span-2">
                <StrictImageUrlField
                  label="OG image — English (1200×630 recommended)"
                  value={values.og_image ?? ""}
                  onChange={(v) => set("og_image", v)}
                  aspect="aspect-[1200/630]"
                  aspectRatio={1200 / 630}
                  bucket={BUCKET}
                  folder="og"
                  help="Optional social share image for English. Falls back to the thumbnail."
                />
              </div>
              <div className="md:col-span-2">
                <StrictImageUrlField
                  label="OG image — Arabic (1200×630 recommended)"
                  value={values.og_image_ar ?? ""}
                  onChange={(v) => set("og_image_ar", v)}
                  aspect="aspect-[1200/630]"
                  aspectRatio={1200 / 630}
                  bucket={BUCKET}
                  folder="og"
                  help="Optional Arabic-only share image. Falls back to the English OG image, then the thumbnail."
                />
              </div>
            </div>
          </div>


          <div className="space-y-1.5">
            <Label>Sort order</Label>
            <Input type="number" value={values.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} />
          </div>
          <div className="flex items-center gap-6 pt-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={!!values.featured} onCheckedChange={(v) => set("featured", v)} /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={!!values.requires_lead_capture} onCheckedChange={(v) => set("requires_lead_capture", v)} /> Lead-gate
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving || uploadingFile}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || uploadingFile}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {values.id ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
