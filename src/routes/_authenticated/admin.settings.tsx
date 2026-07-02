import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { BrandingPanel } from "@/components/admin/BrandingPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { homepageConfig, menusConfig, settingsConfig } from "@/lib/admin-cms-config";

const configs = [settingsConfig, menusConfig, homepageConfig];

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [active, setActive] = useState<string>("branding");
  const cmsConfig = configs.find((item) => item.table === active);

  return (
    <AdminShell title="Settings">
      <Tabs value={active} onValueChange={setActive} className="space-y-5">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          {configs.map((item) => (
            <TabsTrigger key={item.table} value={String(item.table)}>
              {item.title}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="branding">
          <BrandingPanel />
        </TabsContent>
        {cmsConfig && <CmsCollectionPage key={cmsConfig.table} config={cmsConfig} />}
      </Tabs>
    </AdminShell>
  );
}
