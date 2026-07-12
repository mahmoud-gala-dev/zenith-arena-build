import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { TranslationsPanel } from "@/components/admin/TranslationsPanel";

export const Route = createFileRoute("/_authenticated/admin/translations")({
  component: () => (
    <AdminShell title="Translations (i18n)">
      <TranslationsPanel />
    </AdminShell>
  ),
});
