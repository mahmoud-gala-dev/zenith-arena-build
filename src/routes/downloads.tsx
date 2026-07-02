import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Award, BookOpen, Wrench, Building2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "Catalogs & Technical Downloads — Egytic Sports" },
      {
        name: "description",
        content:
          "Download the Egytic company profile, product catalogs, technical datasheets, certificates and maintenance guides for sports construction projects.",
      },
      { property: "og:title", content: "Catalogs & Technical Downloads — Egytic" },
      {
        property: "og:description",
        content: "Company profile, product catalogs, datasheets and maintenance guides.",
      },
    ],
  }),
  component: DownloadsPage,
});

function DownloadsPage() {
  const { lang } = useLang();
  const ar = lang === "ar";

  const tx = ar
    ? {
        eyebrow: "التحميلات",
        title: "الكتالوجات والملفات التقنية",
        sub: "حمّل ملف الشركة وكتالوجات المنتجات وشهادات الاعتماد وأدلة التركيب والصيانة.",
        download: "تحميل PDF",
        size: "الحجم",
        pages: "صفحة",
        categories: [
          { key: "profile", label: "ملف الشركة" },
          { key: "catalog", label: "كتالوجات المنتجات" },
          { key: "datasheet", label: "بيانات فنية" },
          { key: "certificate", label: "شهادات" },
          { key: "guide", label: "أدلة التركيب والصيانة" },
        ],
      }
    : {
        eyebrow: "Downloads",
        title: "Catalogs & technical documents",
        sub: "Download our company profile, product catalogs, certifications, installation and maintenance guides.",
        download: "Download PDF",
        size: "Size",
        pages: "pages",
        categories: [
          { key: "profile", label: "Company Profile" },
          { key: "catalog", label: "Product Catalogs" },
          { key: "datasheet", label: "Technical Datasheets" },
          { key: "certificate", label: "Certifications" },
          { key: "guide", label: "Installation & Maintenance" },
        ],
      };

  const items = [
    {
      cat: "profile",
      icon: Building2,
      title: { en: "Egytic Company Profile 2026", ar: "ملف شركة إيجيتك 2026" },
      desc: {
        en: "A complete overview of our capabilities, methodology, teams and signature projects.",
        ar: "نظرة كاملة على قدراتنا ومنهجيتنا وفرقنا ومشاريعنا المميزة.",
      },
      size: "12.4 MB",
      pages: 48,
    },
    {
      cat: "catalog",
      icon: FileText,
      title: { en: "Playing Surfaces Catalog", ar: "كتالوج أسطح اللعب" },
      desc: {
        en: "Turf, acrylic, polyurethane and hybrid systems with performance data.",
        ar: "أسطح العشب والأكريليك والبولي يوريثان والهجينة مع بيانات الأداء.",
      },
      size: "8.1 MB",
      pages: 36,
    },
    {
      cat: "catalog",
      icon: FileText,
      title: { en: "Sports Lighting Catalog", ar: "كتالوج الإضاءة الرياضية" },
      desc: {
        en: "Broadcast-grade LED lighting, poles and control systems.",
        ar: "إضاءة LED بمستوى البث وأعمدة وأنظمة تحكم.",
      },
      size: "5.6 MB",
      pages: 24,
    },
    {
      cat: "catalog",
      icon: FileText,
      title: { en: "Aquatics Systems Catalog", ar: "كتالوج الأنظمة المائية" },
      desc: {
        en: "Stainless steel pools, filtration, timing and access equipment.",
        ar: "مسابح ستانلس ستيل وترشيح وتوقيت ومعدات الوصول.",
      },
      size: "6.9 MB",
      pages: 28,
    },
    {
      cat: "datasheet",
      icon: FileText,
      title: { en: "ApexTurf Hybrid 60 — Datasheet", ar: "إيجيتك تيرف هايبرد 60 — بيانات فنية" },
      desc: {
        en: "Fiber composition, gauge, tuft density and FIFA test results.",
        ar: "تركيب الألياف والقياس والكثافة ونتائج اختبارات الفيفا.",
      },
      size: "1.2 MB",
      pages: 6,
    },
    {
      cat: "datasheet",
      icon: FileText,
      title: { en: "ApexRun Sandwich PU — Datasheet", ar: "إيجيتك ران ساندويتش PU — بيانات فنية" },
      desc: {
        en: "Layer specifications and World Athletics test data.",
        ar: "مواصفات الطبقات وبيانات اختبار الاتحاد الدولي.",
      },
      size: "1.4 MB",
      pages: 8,
    },
    {
      cat: "certificate",
      icon: Award,
      title: { en: "FIFA Quality Programme Certificate", ar: "شهادة برنامج الجودة من الفيفا" },
      desc: {
        en: "Preferred producer certification for football turf systems.",
        ar: "شهادة منتج مفضل لأنظمة عشب كرة القدم.",
      },
      size: "820 KB",
      pages: 2,
    },
    {
      cat: "certificate",
      icon: Award,
      title: { en: "ISO 9001 / 14001 / 45001", ar: "شهادات ISO 9001 / 14001 / 45001" },
      desc: {
        en: "Quality, environmental and occupational health & safety systems.",
        ar: "أنظمة الجودة والبيئة والصحة والسلامة المهنية.",
      },
      size: "1.1 MB",
      pages: 3,
    },
    {
      cat: "guide",
      icon: Wrench,
      title: { en: "Artificial Turf Maintenance Guide", ar: "دليل صيانة العشب الصناعي" },
      desc: {
        en: "Preventive care schedule, grooming and infill replenishment.",
        ar: "جدول رعاية وقائية وتمشيط وتجديد الحشوة.",
      },
      size: "2.3 MB",
      pages: 14,
    },
    {
      cat: "guide",
      icon: BookOpen,
      title: { en: "Track Resurfacing Guide", ar: "دليل إعادة تأهيل المضامير" },
      desc: {
        en: "Assessment criteria, preparation and topcoat renewal steps.",
        ar: "معايير التقييم والتحضير وخطوات تجديد الطبقة العلوية.",
      },
      size: "1.9 MB",
      pages: 12,
    },
  ];

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {tx.categories.map((cat) => {
            const rows = items.filter((i) => i.cat === cat.key);
            if (!rows.length) return null;
            return (
              <Reveal key={cat.key} className="mb-14">
                <h2 className="mb-6 text-2xl font-bold text-foreground">{cat.label}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {rows.map((r, i) => (
                    <div
                      key={i}
                      className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                        <r.icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground">{ar ? r.title.ar : r.title.en}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{ar ? r.desc.ar : r.desc.en}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          PDF · {r.size} · {r.pages} {tx.pages}
                        </p>
                        <Button size="sm" variant="outline" className="mt-4">
                          <Download className="h-4 w-4" />
                          {tx.download}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </SiteLayout>
  );
}
