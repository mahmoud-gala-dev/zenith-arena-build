import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { serviceConfig } from "@/lib/admin-cms-config";

export const Route = createFileRoute("/_authenticated/admin/services")({
  component: AdminServicesPage,
});

function AdminServicesPage() {
  return (
    <AdminShell title="Services CMS">
      <CmsCollectionPage config={serviceConfig} />
    </AdminShell>
  );
}
