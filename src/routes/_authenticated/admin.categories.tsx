import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsCollectionPage } from "@/components/admin/CmsCollectionPage";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categoryConfigs } from "@/lib/admin-cms-config";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const [active, setActive] = useState(categoryConfigs[0].table);
  const config = categoryConfigs.find((item) => item.table === active) ?? categoryConfigs[0];

  return (
    <AdminShell title="Categories">
      <Tabs value={String(active)} onValueChange={(value) => setActive(value as typeof active)} className="space-y-5">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {categoryConfigs.map((item) => <TabsTrigger key={item.table} value={String(item.table)}>{item.title}</TabsTrigger>)}
        </TabsList>
        <CmsCollectionPage key={config.table} config={config} />
      </Tabs>
    </AdminShell>
  );
}
