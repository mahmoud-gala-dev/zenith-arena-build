import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { pagesConfig } from "@/lib/admin-cms-config";

export const Route = createFileRoute("/_authenticated/admin/pages")({
  component: AdminPagesPage,
});

function AdminPagesPage() {
  return (
    <AdminShell title="Pages CMS">
      <CmsCollectionPage config={pagesConfig} />
    </AdminShell>
  );
}
