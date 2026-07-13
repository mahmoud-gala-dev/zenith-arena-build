import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { NotFound } from "@/components/site/NotFound";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { faqItemsPublishedQueryOptions, type FaqItem } from "@/lib/queries";


export const Route = createFileRoute("/faq")({
  loader: ({ context }) => context.queryClient.ensureQueryData(faqItemsPublishedQueryOptions),
  head: () => ({
    meta: [
      { title: "Frequently Asked Questions — Egytic Sports" },
      { name: "description", content: "Answers to common questions about football pitch construction, running tracks, court surfaces, timelines, budgets, certifications and maintenance." },
      { property: "og:title", content: "Frequently Asked Questions — Egytic" },
      { property: "og:description", content: "Timelines, budgets, certifications, maintenance and more." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-8 text-center text-destructive">{error.message}</div>,
  notFoundComponent: () => <NotFound />,
  component: FaqPage,
});

function FaqPage() {
  const { lang, t: T } = useLang();
  const ar = lang === "ar";
  const { data: items } = useSuspenseQuery(faqItemsPublishedQueryOptions);

  const groups = new Map<string, FaqItem[]>();
  for (const it of items) {
    const key = it.category || "general";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }

  const tx = T.pages.faq;
  const CATEGORY_LABELS = T.pages.faq.categories as Record<string, string>;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: ar ? it.question_ar || it.question_en : it.question_en,
      acceptedAnswer: {
        "@type": "Answer",
        text: ar ? it.answer_ar || it.answer_en : it.answer_en,
      },
    })),
  };

  return (
    <SiteLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />

      <section className="py-16">
        <div className="mx-auto max-w-4xl space-y-12 px-4 sm:px-6 lg:px-8">
          {[...groups.entries()].map(([cat, list], gi) => {
            const label = CATEGORY_LABELS[cat] ?? cat;
            return (
              <Reveal key={cat}>
                <h2 className="mb-4 text-xl font-bold text-foreground">{label}</h2>
                <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-2 shadow-soft">
                  {list.map((it, i) => (
                    <AccordionItem key={it.id} value={`${gi}-${i}`} className="border-border">
                      <AccordionTrigger className="text-start text-base font-semibold">
                        {ar ? it.question_ar || it.question_en : it.question_en}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-line">
                        {ar ? it.answer_ar || it.answer_en : it.answer_en}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Reveal>
            );
          })}

          {items.length === 0 && (
            <p className="text-center text-muted-foreground">{T.pages.faq.emptyPublished}</p>
          )}

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
