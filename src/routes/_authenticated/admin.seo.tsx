import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { seoConfig } from "@/lib/admin-cms-config";

export const Route = createFileRoute("/_authenticated/admin/seo")({
  component: AdminSeoPage,
});

function AdminSeoPage() {
  return (
    <AdminShell title="SEO Manager">
      <CmsCollectionPage config={seoConfig} />
    </AdminShell>
  );
}
