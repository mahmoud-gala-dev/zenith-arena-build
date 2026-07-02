import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { blogConfig } from "@/lib/admin-cms-config";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  component: AdminBlogPage,
});

function AdminBlogPage() {
  return (
    <AdminShell title="Blog CMS">
      <CmsCollectionPage config={blogConfig} />
    </AdminShell>
  );
}
