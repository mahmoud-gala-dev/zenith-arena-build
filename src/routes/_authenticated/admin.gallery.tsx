import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { galleryConfig } from "@/lib/admin-cms-config";

export const Route = createFileRoute("/_authenticated/admin/gallery")({
  component: AdminGalleryPage,
});

function AdminGalleryPage() {
  return (
    <AdminShell title="Gallery CMS">
      <CmsCollectionPage config={galleryConfig} />
    </AdminShell>
  );
}
