import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { certificatesConfig } from "@/lib/admin-cms-config";

export const Route = createFileRoute("/_authenticated/admin/certificates")({
  component: AdminCertificatesPage,
});

function AdminCertificatesPage() {
  return (
    <AdminShell title="Certificates CMS">
      <CmsCollectionPage config={certificatesConfig} />
    </AdminShell>
  );
}
