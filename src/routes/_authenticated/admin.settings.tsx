import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { homepageConfig, menusConfig, settingsConfig } from "@/lib/admin-cms-config";

const configs = [settingsConfig, menusConfig, homepageConfig];

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [active, setActive] = useState(configs[0].table);
  const config = configs.find((item) => item.table === active) ?? configs[0];

  return (
    <AdminShell title="Settings">
      <Tabs value={String(active)} onValueChange={(value) => setActive(value as typeof active)} className="space-y-5">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {configs.map((item) => <TabsTrigger key={item.table} value={String(item.table)}>{item.title}</TabsTrigger>)}
        </TabsList>
        <CmsCollectionPage key={config.table} config={config} />
      </Tabs>
    </AdminShell>
  );
}
