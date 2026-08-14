import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FolderUp, Sparkles, Loader2, CheckCircle2, Folder, Images, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { uploadImageWithVariants } from "@/lib/imagePipeline";
import { aiNameProjectFolders } from "@/lib/ai/ai.functions";

type GovOption = { id: string; name_en: string; name_ar: string };

type FolderGroup = {
  folder: string;
  files: File[];
  title_en: string;
  title_ar: string;
  slug: string;
  urls: string[];
  uploaded: number;
  projectId?: string;
};

const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif|bmp|tiff?)$/i;

function slugify(input: string) {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return base || `project-${Date.now().toString(36)}`;
}

export function BulkFolderImport({ govs, onDone }: { govs: GovOption[]; onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const nameFolders = useServerFn(aiNameProjectFolders);

  const [open, setOpen] = useState(false);
  const [govId, setGovId] = useState("");
  const [rootName, setRootName] = useState("");
  const [groups, setGroups] = useState<FolderGroup[]>([]);
  const [busy, setBusy] = useState<null | "upload" | "ai" | "save">(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    // Keep folder structure: the File System Access API flattens dropped dirs.
    useFsAccessApi: false,
    noClick: true,
    accept: { "image/*": [] },
    onDrop: (accepted) => pick(accepted),
  });


  function pick(files: FileList | File[] | null) {
    if (!files || files.length === 0) return;
    const map = new Map<string, File[]>();
    let root = "";
    for (const file of Array.from(files as ArrayLike<File>)) {
      if (!IMAGE_RE.test(file.name)) continue;
      const rel = (file as any).webkitRelativePath || (file as any).path || file.name;
      const parts = String(rel).split("/").filter(Boolean);
      if (!root && parts.length > 1) root = parts[0];
      // governorate folder / project folder / [...] / image
      const folder = parts.length >= 3 ? parts[1] : parts.length === 2 ? parts[0] : "Untitled";
      const list = map.get(folder) ?? [];
      list.push(file);
      map.set(folder, list);
    }
    if (map.size === 0) return toast.error("لا توجد صور داخل المجلد المحدد");
    setRootName(root);
    setGroups(
      [...map.entries()].map(([folder, list]) => ({
        folder,
        files: list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
        title_en: folder,
        title_ar: folder,
        slug: slugify(folder),
        urls: [],
        uploaded: 0,
      })),
    );
    // Preselect governorate by folder-name match
    const match = govs.find(
      (g) => root && (root.includes(g.name_ar) || root.toLowerCase().includes(g.name_en.toLowerCase())),
    );
    if (match) setGovId(match.id);
    toast.success(`تم قراءة ${map.size} مشروع / ${files.length} ملف`);
  }

  /** Stage 1 — upload every image of every project folder. */
  async function runUpload() {
    if (groups.length === 0) return;
    setBusy("upload");
    const total = groups.reduce((n, g) => n + g.files.length, 0);
    let done = 0;
    try {
      const next = [...groups];
      for (let i = 0; i < next.length; i++) {
        const g = next[i];
        const urls: string[] = [...g.urls];
        for (const file of g.files.slice(g.urls.length)) {
          setStatus(`${g.folder} — ${file.name}`);
          const res = await uploadImageWithVariants(file, {
            bucket: "media",
            folder: `projects/gallery/${g.slug}`,
            baseName: g.slug,
          });
          urls.push(res.primaryUrl);
          done += 1;
          setProgress(Math.round(((done + g.urls.length) / total) * 100));
        }
        next[i] = { ...g, urls, uploaded: urls.length };
        setGroups([...next]);
      }
      setStatus("تم رفع كل الصور");
      toast.success("المرحلة الأولى: تم رفع الصور");
    } catch (e: any) {
      toast.error(e?.message ?? "فشل الرفع");
    } finally {
      setBusy(null);
    }
  }

  /** Stage 2 — AI names each folder (EN/AR + slug). */
  async function runAi() {
    if (groups.length === 0) return;
    setBusy("ai");
    setStatus("الذكاء الاصطناعي يسمّي المشاريع…");
    try {
      const gov = govs.find((g) => g.id === govId);
      const { items } = await nameFolders({
        data: {
          folders: groups.map((g) => g.folder),
          governorate: gov ? `${gov.name_en} / ${gov.name_ar}` : rootName || undefined,
        },
      });
      setGroups((prev) =>
        prev.map((g) => {
          const hit = items.find((i) => i.folder === g.folder);
          if (!hit) return g;
          return {
            ...g,
            title_en: hit.title_en || g.title_en,
            title_ar: hit.title_ar || g.title_ar,
            slug: slugify(hit.slug || hit.title_en || g.folder),
          };
        }),
      );
      toast.success("المرحلة الثانية: تم توليد الأسماء");
    } catch (e: any) {
      toast.error(e?.message ?? "فشل توليد الأسماء");
    } finally {
      setBusy(null);
      setStatus("");
    }
  }

  /** Create the project rows. */
  async function saveProjects() {
    const ready = groups.filter((g) => g.urls.length > 0);
    if (ready.length === 0) return toast.error("ارفع الصور أولاً (المرحلة الأولى)");
    setBusy("save");
    try {
      const rows = ready.map((g) => ({
        slug_en: g.slug,
        title_en: g.title_en,
        title_ar: g.title_ar,
        cover_image: g.urls[0],
        gallery: g.urls,
        governorate_id: govId || null,
        status: "published",
        featured: false,
      }));
      const { error } = await supabase.from("projects").insert(rows);
      if (error) throw error;
      toast.success(`تم إنشاء ${rows.length} مشروع`);
      setGroups([]);
      setProgress(0);
      setOpen(false);
      onDone();
    } catch (e: any) {
      toast.error(e?.message ?? "فشل الحفظ");
    } finally {
      setBusy(null);
    }
  }

  const totalFiles = groups.reduce((n, g) => n + g.files.length, 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderUp className="mr-2 h-4 w-4" /> Bulk folder import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>استيراد مجلد محافظة (مشاريع + صور)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            اختر مجلد المحافظة الذي يحتوي على مجلد لكل مشروع وداخله الصور. المرحلة 1: رفع الصور.
            المرحلة 2: توليد أسماء المشاريع عربي/إنجليزي بالذكاء الاصطناعي.
          </p>

          <div
            {...getRootProps()}
            className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-border bg-secondary/20"
            }`}
          >
            <input {...getInputProps()} />
            <FolderUp className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">اسحب وأفلت مجلد المحافظة هنا</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {rootName ? `المجلد: ${rootName}` : "مجلد المحافظة ← مجلدات المشاريع ← الصور"}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                اختيار مجلد
              </Button>
              {groups.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!!busy}
                  onClick={() => {
                    setGroups([]);
                    setRootName("");
                    setProgress(0);
                  }}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> تفريغ
                </Button>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              // @ts-expect-error non-standard directory attributes
              webkitdirectory="true"
              directory="true"
              onChange={(e) => pick(e.target.files)}
            />
          </div>

          {groups.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <div key={g.folder} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                  <Folder className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium" title={g.folder}>
                      {g.title_ar || g.folder}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">{g.folder}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                    <Images className="h-3.5 w-3.5" />
                    {g.urls.length}/{g.files.length}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>المحافظة</Label>
              <select
                value={govId}
                onChange={(e) => setGovId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— None —</option>
                {govs.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name_en} — {g.name_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {groups.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={runUpload} disabled={!!busy}>
                  {busy === "upload" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderUp className="mr-2 h-4 w-4" />}
                  1) رفع الصور ({totalFiles})
                </Button>
                <Button variant="secondary" onClick={runAi} disabled={!!busy}>
                  {busy === "ai" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  2) توليد الأسماء بالذكاء الاصطناعي
                </Button>
                <Button variant="default" onClick={saveProjects} disabled={!!busy}>
                  {busy === "save" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  حفظ المشاريع
                </Button>
              </div>

              {(busy === "upload" || progress > 0) && (
                <div className="space-y-1">
                  <Progress value={progress} />
                  <p className="text-xs text-muted-foreground">{status}</p>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Folder</th>
                      <th className="px-3 py-2">Title (EN)</th>
                      <th className="px-3 py-2">Title (AR)</th>
                      <th className="px-3 py-2">Slug</th>
                      <th className="px-3 py-2">Photos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {groups.map((g, i) => (
                      <tr key={g.folder}>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{g.folder}</td>
                        <td className="px-3 py-2">
                          <Input
                            value={g.title_en}
                            onChange={(e) =>
                              setGroups((prev) => prev.map((x, j) => (j === i ? { ...x, title_en: e.target.value } : x)))
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            dir="rtl"
                            value={g.title_ar}
                            onChange={(e) =>
                              setGroups((prev) => prev.map((x, j) => (j === i ? { ...x, title_ar: e.target.value } : x)))
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={g.slug}
                            onChange={(e) =>
                              setGroups((prev) => prev.map((x, j) => (j === i ? { ...x, slug: e.target.value } : x)))
                            }
                          />
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {g.urls.length}/{g.files.length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
