import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { ArticleCard } from "@/components/site/Cards";
import { useLang } from "@/i18n/LanguageProvider";
import { articles } from "@/lib/site-data";

export const Route = createFileRoute("/knowledge/")({
  component: KnowledgePage,
});

function KnowledgePage() {
  const { t } = useLang();
  return (
    <SiteLayout>
      <PageHero eyebrow={t.nav.knowledge} title={t.sections.knowledgeTitle} subtitle={t.sections.knowledgeSub} />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a, i) => (
              <Reveal key={a.slug} delay={i * 50}>
                <ArticleCard article={a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}