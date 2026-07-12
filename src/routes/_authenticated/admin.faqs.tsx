import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { faqItemsConfig } from "@/lib/admin-cms-config";

export const Route = createFileRoute("/_authenticated/admin/faqs")({
  component: AdminFaqsPage,
});

function AdminFaqsPage() {
  return (
    <AdminShell title="FAQ Items">
      <CmsCollectionPage config={faqItemsConfig} />
    </AdminShell>
  );
}
