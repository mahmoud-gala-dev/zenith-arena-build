import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { jobApplicationsConfig } from "@/lib/admin-cms-config";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/applications")({
  component: AdminApplicationsPage,
});

function AdminApplicationsPage() {
  const [busy, setBusy] = useState<string | null>(null);

  async function openCv(path: string) {
    if (!path) return;
    setBusy(path);
    try {
      const { data, error } = await supabase.storage
        .from("applications")
        .createSignedUrl(path, 60 * 10);
      if (error || !data?.signedUrl) throw error ?? new Error("No URL");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      toast.error("Could not open CV.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminShell title="Job Applications">
      <div className="mb-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Paste a CV path into the field below to open a temporary signed link (10 min).
        <div className="mt-3 flex gap-2">
          <input
            id="cvpath"
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            placeholder="e.g. 2026-07-12/xxxx-cv.pdf"
          />
          <Button
            size="sm"
            onClick={() => {
              const el = document.getElementById("cvpath") as HTMLInputElement | null;
              if (el?.value) openCv(el.value.trim());
            }}
            disabled={busy !== null}
          >
            {busy ? "Opening..." : "Open CV"}
          </Button>
        </div>
      </div>
      <CmsCollectionPage config={jobApplicationsConfig} />
    </AdminShell>
  );
}
