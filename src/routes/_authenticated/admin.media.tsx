import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Upload, Copy, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAdminPageGuard } from "@/lib/rbac";


export const Route = createFileRoute("/_authenticated/admin/media")({
  component: MediaPage,
});

type MediaFile = {
  id: string;
  file_path: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};

function MediaPage() {
  const { can, guard, buttonProps } = useAdminPageGuard();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);


  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("media_files").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setFiles((data ?? []) as MediaFile[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Max file size is 20 MB");
      return;
    }
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user?.id ?? "anon"}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("media").upload(path, file, {
      cacheControl: "3600", upsert: false,
    });
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { data: signed } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365);
    const { error: dbErr } = await supabase.from("media_files").insert({
      uploader_id: user?.id ?? null,
      file_path: path, file_url: signed?.signedUrl ?? "", file_name: file.name,
      file_type: file.type, file_size: file.size,
    });
    setUploading(false);
    if (dbErr) return toast.error(dbErr.message);
    toast.success("Uploaded");
    if (fileInput.current) fileInput.current.value = "";
    load();
  }

  async function remove(f: MediaFile) {
    if (!confirm("Delete this file?")) return;
    await supabase.storage.from("media").remove([f.file_path]);
    const { error } = await supabase.from("media_files").delete().eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("URL copied");
  }

  const filtered = files.filter((f) => !q || f.file_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminShell title="Media Library">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" className="max-w-sm" />
        <div className="ml-auto">
          <input ref={fileInput} type="file" hidden onChange={onUpload}
            accept="image/*,application/pdf" />
          <Button
            {...buttonProps({ pending: uploading })}
            onClick={guard(() => fileInput.current?.click(), { action: "upload_media" })}
          >
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload file
          </Button>
        </div>
      </div>


      {loading ? (
        <p className="py-12 text-center text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
          No media yet. Upload images or PDFs to use across services, projects and blog.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((f) => (
            <div key={f.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <div className="relative aspect-square bg-secondary">
                {f.file_type?.startsWith("image/") ? (
                  <img src={f.file_url} alt={f.file_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                    {f.file_type || "file"}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-medium text-foreground" title={f.file_name}>{f.file_name}</p>
                <div className="mt-2 flex gap-1">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => copyUrl(f.file_url)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => remove(f)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
