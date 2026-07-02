import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Briefcase, Users, TrendingUp, Heart, Globe, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers at Egytic — Build the World's Best Sports Facilities" },
      {
        name: "description",
        content:
          "Join Egytic and help build FIFA-grade pitches, Olympic tracks and world-class arenas across the Middle East and North Africa. Open roles in engineering, project management and operations.",
      },
      { property: "og:title", content: "Careers at Egytic Sports" },
      {
        property: "og:description",
        content: "Open roles in engineering, project management and operations.",
      },
    ],
  }),
  component: CareersPage,
});

function CareersPage() {
  const { lang } = useLang();
  const ar = lang === "ar";

  const tx = ar
    ? {
        eyebrow: "الوظائف",
        title: "ابنِ مسيرتك مع إيجيتك",
        sub: "انضم إلى فريق يصمم وينفّذ أرقى المنشآت الرياضية في المنطقة.",
        whyTitle: "لماذا إيجيتك",
        openTitle: "الوظائف المتاحة",
        apply: "قدّم الآن",
        noJobsTitle: "لا ترى وظيفتك المناسبة؟",
        noJobsSub: "أرسل سيرتك الذاتية وسنتواصل معك عند توفر الفرصة المناسبة.",
        sendCv: "أرسل السيرة الذاتية",
      }
    : {
        eyebrow: "Careers",
        title: "Build your career with Egytic",
        sub: "Join a team designing and delivering the finest sports facilities in the region.",
        whyTitle: "Why Egytic",
        openTitle: "Open positions",
        apply: "Apply now",
        noJobsTitle: "Don't see the right role?",
        noJobsSub: "Send us your CV and we'll be in touch when a matching role opens.",
        sendCv: "Send your CV",
      };

  const perks = [
    {
      icon: TrendingUp,
      title: { en: "Career growth", ar: "نمو مهني" },
      desc: { en: "Clear paths, mentorship and international project exposure.", ar: "مسارات واضحة وتوجيه وتعرّض لمشاريع دولية." },
    },
    {
      icon: Heart,
      title: { en: "Great benefits", ar: "مزايا مميّزة" },
      desc: { en: "Competitive salary, healthcare, relocation and family support.", ar: "راتب تنافسي ورعاية صحية ودعم انتقال وعائلة." },
    },
    {
      icon: Users,
      title: { en: "World-class team", ar: "فريق عالمي المستوى" },
      desc: { en: "Work alongside FIFA & World Athletics-certified engineers.", ar: "اعمل بجانب مهندسين معتمدين من الفيفا والاتحاد الدولي." },
    },
    {
      icon: Globe,
      title: { en: "Iconic projects", ar: "مشاريع مميزة" },
      desc: { en: "Stadiums, Olympic tracks and landmark arenas across the region.", ar: "استادات ومضامير أولمبية ومنشآت بارزة في المنطقة." },
    },
  ];

  const jobs = [
    {
      title: { en: "Senior Civil Engineer — Sports Structures", ar: "مهندس مدني أول — الهياكل الرياضية" },
      dept: { en: "Engineering", ar: "الهندسة" },
      location: { en: "Riyadh, Saudi Arabia", ar: "الرياض، السعودية" },
      type: { en: "Full-time", ar: "دوام كامل" },
    },
    {
      title: { en: "Project Manager — Football Turf", ar: "مدير مشروع — عشب كرة القدم" },
      dept: { en: "Delivery", ar: "التنفيذ" },
      location: { en: "Dubai, UAE", ar: "دبي، الإمارات" },
      type: { en: "Full-time", ar: "دوام كامل" },
    },
    {
      title: { en: "Track Surfacing Specialist", ar: "أخصائي أسطح المضامير" },
      dept: { en: "Operations", ar: "العمليات" },
      location: { en: "Doha, Qatar", ar: "الدوحة، قطر" },
      type: { en: "Full-time", ar: "دوام كامل" },
    },
    {
      title: { en: "BIM / CAD Designer", ar: "مصمم BIM / كاد" },
      dept: { en: "Engineering", ar: "الهندسة" },
      location: { en: "Remote / Regional", ar: "عن بُعد / إقليمي" },
      type: { en: "Contract", ar: "عقد" },
    },
    {
      title: { en: "HSE Manager", ar: "مدير الصحة والسلامة والبيئة" },
      dept: { en: "Safety", ar: "السلامة" },
      location: { en: "Riyadh, Saudi Arabia", ar: "الرياض، السعودية" },
      type: { en: "Full-time", ar: "دوام كامل" },
    },
    {
      title: { en: "Sales Engineer — Aquatics", ar: "مهندس مبيعات — الرياضات المائية" },
      dept: { en: "Commercial", ar: "التجاري" },
      location: { en: "Kuwait / Bahrain", ar: "الكويت / البحرين" },
      type: { en: "Full-time", ar: "دوام كامل" },
    },
  ];

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-2xl font-bold text-foreground">{tx.whyTitle}</h2>
          </Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {perks.map((p, i) => (
              <Reveal key={i}>
                <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                    <p.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{ar ? p.title.ar : p.title.en}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{ar ? p.desc.ar : p.desc.en}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-2xl font-bold text-foreground">{tx.openTitle}</h2>
          </Reveal>
          <div className="mt-8 space-y-3">
            {jobs.map((j, i) => (
              <Reveal key={i}>
                <div className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
                      {ar ? j.title.ar : j.title.en}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" /> {ar ? j.dept.ar : j.dept.en}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" /> {ar ? j.location.ar : j.location.en}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {ar ? j.type.ar : j.type.en}
                      </span>
                    </div>
                  </div>
                  <Button variant="hero" size="sm">
                    {tx.apply}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-ink p-10 text-center text-ink-foreground shadow-elegant sm:p-14">
          <h3 className="text-2xl font-bold sm:text-3xl">{tx.noJobsTitle}</h3>
          <p className="mt-3 text-white/70">{tx.noJobsSub}</p>
          <Button variant="gold" size="lg" className="mt-6">
            {tx.sendCv}
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
