import { createFileRoute } from "@tanstack/react-router";
import { Award, ShieldCheck, Leaf, HardHat } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { useLang } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/certificates")({
  head: () => ({
    meta: [
      { title: "Certifications & Standards — Egytic Sports" },
      {
        name: "description",
        content:
          "Egytic holds FIFA Quality, World Athletics, ITF, FINA and ISO 9001/14001/45001 certifications for sports construction and infrastructure.",
      },
      { property: "og:title", content: "Certifications & Standards — Egytic" },
      {
        property: "og:description",
        content: "FIFA, World Athletics, ITF, FINA and ISO certifications.",
      },
    ],
  }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const { lang } = useLang();
  const ar = lang === "ar";

  const tx = ar
    ? {
        eyebrow: "الشهادات والاعتمادات",
        title: "معايير عالمية موثّقة",
        sub: "نلتزم بأصرم معايير الجودة والسلامة والاستدامة في الصناعة الرياضية والبناء.",
        issuedBy: "الجهة المصدرة",
        scope: "النطاق",
        valid: "سارية",
      }
    : {
        eyebrow: "Certifications",
        title: "Independently verified standards",
        sub: "We hold the industry's most demanding certifications for quality, safety and sustainability.",
        issuedBy: "Issued by",
        scope: "Scope",
        valid: "Valid",
      };

  const certs = [
    {
      icon: Award,
      code: "FIFA Quality Pro",
      body: { en: "FIFA — Fédération Internationale de Football", ar: "الاتحاد الدولي لكرة القدم (فيفا)" },
      scope: { en: "Football turf systems", ar: "أنظمة عشب كرة القدم" },
      color: "from-emerald-500 to-emerald-700",
    },
    {
      icon: Award,
      code: "World Athletics Class 1",
      body: { en: "World Athletics", ar: "الاتحاد الدولي لألعاب القوى" },
      scope: { en: "Running tracks & field-event surfaces", ar: "المضامير وأسطح الفعاليات الميدانية" },
      color: "from-blue-500 to-blue-700",
    },
    {
      icon: Award,
      code: "ITF Classified",
      body: { en: "International Tennis Federation", ar: "الاتحاد الدولي للتنس" },
      scope: { en: "Tennis court surfaces", ar: "أسطح ملاعب التنس" },
      color: "from-amber-500 to-amber-700",
    },
    {
      icon: Award,
      code: "FINA Compliant",
      body: { en: "Fédération Internationale de Natation", ar: "الاتحاد الدولي للسباحة" },
      scope: { en: "Competition swimming pools", ar: "مسابح المسابقات" },
      color: "from-cyan-500 to-cyan-700",
    },
    {
      icon: ShieldCheck,
      code: "ISO 9001:2015",
      body: { en: "International Organization for Standardization", ar: "المنظمة الدولية للمعايير" },
      scope: { en: "Quality management systems", ar: "أنظمة إدارة الجودة" },
      color: "from-slate-500 to-slate-700",
    },
    {
      icon: Leaf,
      code: "ISO 14001:2015",
      body: { en: "International Organization for Standardization", ar: "المنظمة الدولية للمعايير" },
      scope: { en: "Environmental management", ar: "الإدارة البيئية" },
      color: "from-green-500 to-green-700",
    },
    {
      icon: HardHat,
      code: "ISO 45001:2018",
      body: { en: "International Organization for Standardization", ar: "المنظمة الدولية للمعايير" },
      scope: { en: "Occupational health & safety", ar: "الصحة والسلامة المهنية" },
      color: "from-red-500 to-red-700",
    },
    {
      icon: ShieldCheck,
      code: "EN 14904 A4",
      body: { en: "European Committee for Standardization", ar: "اللجنة الأوروبية للمعايير" },
      scope: { en: "Indoor sports flooring performance", ar: "أداء أرضيات الرياضات الداخلية" },
      color: "from-indigo-500 to-indigo-700",
    },
  ];

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {certs.map((c, i) => (
            <Reveal key={i}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white shadow-soft`}>
                  <c.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">{c.code}</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">{tx.issuedBy}: </span>
                    <span className="text-foreground">{ar ? c.body.ar : c.body.en}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">{tx.scope}: </span>
                    <span className="text-foreground">{ar ? c.scope.ar : c.scope.en}</span>
                  </p>
                </div>
                <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1 pt-4 text-xs font-semibold text-primary" style={{ paddingTop: "0.25rem", marginTop: "1.25rem" }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {tx.valid}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
