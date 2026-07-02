import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { productConfig } from "@/lib/admin-cms-config";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProductsPage,
});

function AdminProductsPage() {
  return (
    <AdminShell title="Products CMS">
      <CmsCollectionPage config={productConfig} />
    </AdminShell>
  );
}
