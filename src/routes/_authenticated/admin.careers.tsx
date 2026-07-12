import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { jobOpeningsConfig } from "@/lib/admin-cms-config";

export const Route = createFileRoute("/_authenticated/admin/careers")({
  component: AdminCareersPage,
});

function AdminCareersPage() {
  return (
    <AdminShell title="Job Openings">
      <CmsCollectionPage config={jobOpeningsConfig} />
    </AdminShell>
  );
}
