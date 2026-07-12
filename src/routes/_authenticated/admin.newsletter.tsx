import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { newsletterConfig } from "@/lib/admin-cms-config";

export const Route = createFileRoute("/_authenticated/admin/newsletter")({
  component: AdminNewsletterPage,
});

function AdminNewsletterPage() {
  return (
    <AdminShell title="Newsletter Subscribers">
      <CmsCollectionPage config={newsletterConfig} />
    </AdminShell>
  );
}
