import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { clientsConfig } from "@/lib/admin-cms-config";

export const Route = createFileRoute("/_authenticated/admin/clients")({
  component: AdminClientsPage,
});

function AdminClientsPage() {
  return (
    <AdminShell title="Clients CMS">
      <CmsCollectionPage config={clientsConfig} />
    </AdminShell>
  );
}
