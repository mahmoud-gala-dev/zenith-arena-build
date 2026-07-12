import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { downloadsPublishedQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/downloads")({
  loader: ({ context }) => context.queryClient.ensureQueryData(downloadsPublishedQueryOptions),
  head: () => ({
    meta: [
      { title: "Catalogs & Technical Downloads — Egytic Sports" },
      {
        name: "description",
        content:
          "Download the Egytic company profile, product catalogs, technical datasheets, certificates and maintenance guides for sports construction projects.",
      },
      { property: "og:title", content: "Catalogs & Technical Downloads — Egytic" },
      { property: "og:description", content: "Company profile, product catalogs, datasheets and maintenance guides." },
    ],
  }),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => null,
  component: DownloadsPage,
});

const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  profile: { en: "Company Profile", ar: "ملف الشركة" },
  catalog: { en: "Product Catalogs", ar: "كتالوجات المنتجات" },
  datasheet: { en: "Technical Datasheets", ar: "بيانات فنية" },
  certificate: { en: "Certifications", ar: "شهادات" },
  guide: { en: "Installation & Maintenance", ar: "أدلة التركيب والصيانة" },
};

function DownloadsPage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { data: items } = useSuspenseQuery(downloadsPublishedQueryOptions);

  const tx = ar
    ? { eyebrow: "التحميلات", title: "الكتالوجات والملفات التقنية", sub: "حمّل ملف الشركة وكتالوجات المنتجات وشهادات الاعتماد وأدلة التركيب والصيانة.", download: "تحميل", empty: "لا توجد ملفات بعد." }
    : { eyebrow: "Downloads", title: "Catalogs & technical documents", sub: "Download our company profile, product catalogs, certifications, installation and maintenance guides.", download: "Download", empty: "No downloads yet." };

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const it of items) {
      const key = it.category || "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries());
  }, [items]);

  const labelFor = (key: string) => {
    const preset = CATEGORY_LABELS[key];
    if (preset) return ar ? preset.ar : preset.en;
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {items.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">{tx.empty}</p>
          ) : (
            grouped.map(([cat, rows]) => (
              <Reveal key={cat} className="mb-14">
                <h2 className="mb-6 text-2xl font-bold text-foreground">{labelFor(cat)}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {rows.map((r) => (
                    <div key={r.id} className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary overflow-hidden">
                        {r.preview_image ? (
                          <img src={r.preview_image} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <FileText className="h-6 w-6" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground">{ar ? r.title_ar : r.title_en}</h3>
                        {(ar ? r.description_ar : r.description_en) && (
                          <p className="mt-1 text-sm text-muted-foreground">{ar ? r.description_ar : r.description_en}</p>
                        )}
                        {r.file_url ? (
                          <Button asChild size="sm" variant="outline" className="mt-4">
                            <a href={r.file_url} target="_blank" rel="noreferrer">
                              <Download className="h-4 w-4" />
                              {tx.download}
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="mt-4" disabled>
                            <Download className="h-4 w-4" />
                            {tx.download}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            ))
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
