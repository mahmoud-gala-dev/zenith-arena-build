import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { downloadsConfig } from "@/lib/admin-cms-config";

export const Route = createFileRoute("/_authenticated/admin/downloads")({
  component: AdminDownloadsPage,
});

function AdminDownloadsPage() {
  return (
    <AdminShell title="Downloads CMS">
      <CmsCollectionPage config={downloadsConfig} />
    </AdminShell>
  );
}
