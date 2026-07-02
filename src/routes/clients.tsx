import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Quote } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title: "Our Clients — Egytic Sports" },
      {
        name: "description",
        content:
          "Federations, ministries, universities and clubs across the Middle East and North Africa trust Egytic to deliver world-class sports infrastructure.",
      },
      { property: "og:title", content: "Our Clients — Egytic" },
      {
        property: "og:description",
        content: "Federations, ministries, universities and clubs trust Egytic.",
      },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const { lang } = useLang();
  const ar = lang === "ar";

  const tx = ar
    ? {
        eyebrow: "العملاء",
        title: "شركاء نجاح عبر المنطقة",
        sub: "نفخر بخدمة اتحادات رياضية وحكومات وأندية ومؤسسات تعليمية رائدة.",
        testimonialsTitle: "شهادات العملاء",
        cta: "انضم إلى قائمة عملائنا",
        ctaBtn: "ابدأ مشروعك",
      }
    : {
        eyebrow: "Clients",
        title: "Partners we're proud to serve",
        sub: "Federations, ministries, universities and leading clubs across the region trust Egytic.",
        testimonialsTitle: "What our clients say",
        cta: "Join our roster of clients",
        ctaBtn: "Start your project",
      };

  const groups = [
    {
      label: { en: "Federations & Ministries", ar: "الاتحادات والوزارات" },
      logos: ["Ministry of Sports", "Football Federation", "Athletics Federation", "Olympic Committee", "Ministry of Education", "Tennis Federation"],
    },
    {
      label: { en: "Clubs & Academies", ar: "الأندية والأكاديميات" },
      logos: ["Royal Club", "Elite Academy", "Champions FC", "Aspire Club", "Skyline Padel", "Aqua Swim Team"],
    },
    {
      label: { en: "Universities & Schools", ar: "الجامعات والمدارس" },
      logos: ["King University", "Gulf Institute", "International School", "Sports College", "Cambridge Academy", "Delta University"],
    },
    {
      label: { en: "Developers & Municipalities", ar: "المطوّرون والبلديات" },
      logos: ["Vision Developments", "City Municipality", "Green Districts", "Riverside Group", "Urban Living Co.", "Coastal Estates"],
    },
  ];

  const testimonials = [
    {
      quote: {
        en: "Egytic delivered a FIFA-quality pitch on an aggressive timeline without compromising a single specification. World-class execution.",
        ar: "سلّمت إيجيتك ملعبًا بمعايير الفيفا في جدول زمني ضاغط دون التنازل عن أي مواصفة. تنفيذ من الطراز العالمي.",
      },
      name: { en: "Eng. Faisal Al-Otaibi", ar: "م. فيصل العتيبي" },
      role: { en: "Head of Facilities, National Football Federation", ar: "رئيس المرافق، الاتحاد الوطني لكرة القدم" },
    },
    {
      quote: {
        en: "From design to certification, their engineers made complex decisions simple. Our athletes now train on a truly world-class track.",
        ar: "من التصميم إلى الاعتماد، جعل مهندسوهم القرارات المعقدة سهلة. يتدرب رياضيونا الآن على مضمار عالمي حقًا.",
      },
      name: { en: "Dr. Maha Al-Farsi", ar: "د. مها الفارسي" },
      role: { en: "Director, Olympic Training Center", ar: "مديرة، مركز التدريب الأولمبي" },
    },
    {
      quote: {
        en: "The most organised sports contractor we've worked with. Transparent, precise and genuinely accountable.",
        ar: "أكثر مقاولي المنشآت الرياضية تنظيمًا تعاملنا معهم. شفافية ودقة ومسؤولية حقيقية.",
      },
      name: { en: "Sami Rahal", ar: "سامي رحّال" },
      role: { en: "Project Director, Vision Developments", ar: "مدير المشاريع، فيجن للتطوير" },
    },
  ];

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />

      <section className="py-16">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          {groups.map((g, gi) => (
            <Reveal key={gi}>
              <h2 className="text-xl font-bold text-foreground">{ar ? g.label.ar : g.label.en}</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {g.logos.map((name, i) => (
                  <div
                    key={i}
                    className="flex aspect-[3/2] items-center justify-center rounded-xl border border-border bg-card p-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-soft transition-colors hover:text-primary"
                  >
                    {name}
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground">{tx.testimonialsTitle}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={i}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-soft">
                  <Quote className="h-8 w-8 text-primary/40" />
                  <p className="mt-4 flex-1 text-foreground/85">{ar ? t.quote.ar : t.quote.en}</p>
                  <div className="mt-6 border-t border-border pt-4">
                    <p className="font-semibold text-foreground">{ar ? t.name.ar : t.name.en}</p>
                    <p className="text-sm text-muted-foreground">{ar ? t.role.ar : t.role.en}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 rounded-3xl bg-gradient-primary p-10 text-center text-primary-foreground shadow-elegant sm:p-14">
          <h3 className="text-2xl font-bold sm:text-3xl">{tx.cta}</h3>
          <Button asChild variant="gold" size="lg">
            <Link to="/contact">
              {tx.ctaBtn}
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
