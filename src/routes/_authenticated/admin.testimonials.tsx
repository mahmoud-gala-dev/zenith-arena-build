import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { testimonialsConfig } from "@/lib/admin-cms-config";

export const Route = createFileRoute("/_authenticated/admin/testimonials")({
  component: AdminTestimonialsPage,
});

function AdminTestimonialsPage() {
  return (
    <AdminShell title="Testimonials CMS">
      <CmsCollectionPage config={testimonialsConfig} />
    </AdminShell>
  );
}
