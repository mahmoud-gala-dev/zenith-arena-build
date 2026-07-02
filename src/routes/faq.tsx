import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently Asked Questions — APEX Sports Infrastructure" },
      {
        name: "description",
        content:
          "Answers to common questions about football pitch construction, running tracks, court surfaces, timelines, budgets, certifications and maintenance.",
      },
      { property: "og:title", content: "Frequently Asked Questions — APEX" },
      {
        property: "og:description",
        content: "Timelines, budgets, certifications, maintenance and more.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { lang } = useLang();
  const ar = lang === "ar";

  const tx = ar
    ? {
        eyebrow: "الأسئلة الشائعة",
        title: "إجابات على أكثر ما يُسأل عنه",
        sub: "لم تجد إجابتك؟ تحدث مع فريقنا مباشرة.",
        ctaTitle: "لا يزال لديك سؤال؟",
        ctaBtn: "تواصل معنا",
      }
    : {
        eyebrow: "FAQ",
        title: "Answers to the questions we hear most",
        sub: "Can't find what you're looking for? Speak with our team directly.",
        ctaTitle: "Still have a question?",
        ctaBtn: "Contact us",
      };

  const groups = [
    {
      label: { en: "Projects & Timelines", ar: "المشاريع والجداول الزمنية" },
      items: [
        {
          q: {
            en: "How long does it take to build a football pitch?",
            ar: "كم يستغرق بناء ملعب كرة قدم؟",
          },
          a: {
            en: "A standard 11-a-side synthetic turf pitch takes 8–12 weeks from ground-breaking to handover, subject to site conditions. Natural and hybrid pitches typically require 4–6 months.",
            ar: "يستغرق ملعب صناعي قياسي لـ 11 لاعبًا من 8 إلى 12 أسبوعًا من بدء الأعمال حتى التسليم، وفقًا لظروف الموقع. أما الملاعب الطبيعية والهجينة فتتطلب عادة 4–6 أشهر.",
          },
        },
        {
          q: { en: "Do you handle design as well as construction?", ar: "هل تنفذون التصميم بالإضافة إلى التشييد؟" },
          a: {
            en: "Yes — we're a turnkey partner. Our in-house teams cover feasibility, concept design, technical drawings, construction, certification, and long-term maintenance.",
            ar: "نعم — نحن شريك متكامل. تغطي فرقنا الداخلية دراسات الجدوى والتصميم المفاهيمي والمخططات الفنية والتنفيذ والاعتماد والصيانة طويلة الأمد.",
          },
        },
        {
          q: { en: "Can you work in remote locations?", ar: "هل يمكنكم العمل في مواقع نائية؟" },
          a: {
            en: "Yes. We regularly mobilise crews, equipment and materials to remote sites across the Middle East and North Africa.",
            ar: "نعم. نُعبّئ بانتظام الفرق والمعدات والمواد إلى مواقع نائية في الشرق الأوسط وشمال أفريقيا.",
          },
        },
      ],
    },
    {
      label: { en: "Costs & Budget", ar: "التكاليف والميزانية" },
      items: [
        {
          q: { en: "How much does a padel court cost?", ar: "كم تكلفة ملعب البادل؟" },
          a: {
            en: "Panoramic glass padel courts typically range from USD 25,000 to USD 45,000 depending on structure, turf, and LED lighting selection. We provide a detailed quote after a site visit.",
            ar: "تتراوح تكلفة ملاعب البادل الزجاجية البانورامية عادة بين 25,000 و45,000 دولار أمريكي حسب الهيكل والعشب واختيار الإضاءة. نقدم عرض سعر مفصلاً بعد زيارة الموقع.",
          },
        },
        {
          q: { en: "What's included in a quote?", ar: "ما الذي يتضمنه عرض السعر؟" },
          a: {
            en: "Site preparation, sub-base, drainage, surfacing, fencing, lighting, equipment, testing and certification are all itemised — no hidden costs.",
            ar: "تحضير الموقع، القاعدة السفلية، التصريف، الأسطح، التسييج، الإضاءة، المعدات، الاختبار والاعتماد — كلها مفصّلة بدون تكاليف خفية.",
          },
        },
      ],
    },
    {
      label: { en: "Certifications & Standards", ar: "الاعتمادات والمعايير" },
      items: [
        {
          q: { en: "Are your surfaces certified?", ar: "هل أسطحكم معتمدة؟" },
          a: {
            en: "Yes — we install FIFA Quality / Quality Pro, World Athletics Class 1 & 2, ITF, and FINA-compliant systems, all backed by independent laboratory testing.",
            ar: "نعم — نركّب أنظمة معتمدة FIFA Quality / Quality Pro وWorld Athletics فئة 1 و2 وITF ومطابقة لـ FINA، جميعها مدعومة باختبارات مختبرات مستقلة.",
          },
        },
        {
          q: { en: "Do you provide certification documentation?", ar: "هل تقدّمون وثائق الاعتماد؟" },
          a: {
            en: "Every project is handed over with a full documentation pack: material certificates, test reports, warranties and maintenance schedules.",
            ar: "يُسلَّم كل مشروع بحزمة توثيق كاملة: شهادات المواد وتقارير الاختبار والضمانات وجداول الصيانة.",
          },
        },
      ],
    },
    {
      label: { en: "Maintenance & Warranty", ar: "الصيانة والضمان" },
      items: [
        {
          q: { en: "What warranty do you offer?", ar: "ما الضمان الذي تقدّمونه؟" },
          a: {
            en: "Playing surfaces carry manufacturer warranties of 8–10 years, structures up to 15 years, and workmanship 2 years — one of the longest guarantees in the industry.",
            ar: "أسطح اللعب مضمونة من المصنّع 8–10 سنوات، والهياكل حتى 15 سنة، والتنفيذ سنتان — من بين أطول الضمانات في الصناعة.",
          },
        },
        {
          q: { en: "Do you offer maintenance contracts?", ar: "هل تقدّمون عقود صيانة؟" },
          a: {
            en: "Yes — annual preventive maintenance, quarterly grooming, resurfacing, and certification renewals are available as bundled service plans.",
            ar: "نعم — الصيانة الوقائية السنوية والتمشيط الفصلي وإعادة تأهيل الأسطح وتجديد الاعتمادات متاحة ضمن خطط خدمة متكاملة.",
          },
        },
      ],
    },
  ];

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />

      <section className="py-16">
        <div className="mx-auto max-w-4xl space-y-12 px-4 sm:px-6 lg:px-8">
          {groups.map((g, gi) => (
            <Reveal key={gi}>
              <h2 className="mb-4 text-xl font-bold text-foreground">{ar ? g.label.ar : g.label.en}</h2>
              <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-2 shadow-soft">
                {g.items.map((it, i) => (
                  <AccordionItem key={i} value={`${gi}-${i}`} className="border-border">
                    <AccordionTrigger className="text-start text-base font-semibold">
                      {ar ? it.q.ar : it.q.en}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {ar ? it.a.ar : it.a.en}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          ))}

          <Reveal className="rounded-3xl bg-gradient-primary p-8 text-center text-primary-foreground shadow-elegant">
            <h3 className="text-xl font-bold sm:text-2xl">{tx.ctaTitle}</h3>
            <Button asChild variant="gold" size="lg" className="mt-5">
              <Link to="/contact">{tx.ctaBtn}</Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
