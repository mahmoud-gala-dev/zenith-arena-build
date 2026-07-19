import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, User } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { CardGridSkeleton } from "@/components/site/Skeletons";
import { useLang } from "@/i18n/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-knowledge.jpg";
import { seoSettingsByRouteQueryOptions } from "@/lib/queries";
import { buildSeoHead } from "@/lib/seo-head";


export const Route = createFileRoute("/knowledge/")({
  loader: async ({ context }) => ({
    seo: await context.queryClient.ensureQueryData(seoSettingsByRouteQueryOptions("/knowledge")),
  }),
  component: KnowledgePage,
  head: ({ loaderData }) =>
    buildSeoHead({
      routePath: "/knowledge",
      seo: loaderData?.seo ?? null,
      fallbackTitleEn: "Knowledge Center — Egytic Sports",
      fallbackTitleAr: "مركز المعرفة — إيجيتك سبورتس",
      fallbackDescEn: "Technical articles, standards guides and construction insights for sports facilities.",
      fallbackDescAr: "مقالات فنية وأدلة معايير ورؤى إنشائية للمنشآت الرياضية.",
    }),
});


interface BlogRow {
  id: string;
  slug_en: string;
  title_en: string;
  title_ar: string;
  excerpt_en: string | null;
  excerpt_ar: string | null;
  featured_image: string | null;
  author_name: string;
  reading_time: number;
  published_at: string | null;
}

function KnowledgePage() {
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog_posts", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id,slug_en,title_en,title_ar,excerpt_en,excerpt_ar,featured_image,author_name,reading_time,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BlogRow[];
    },
  });

  return (
    <SiteLayout>
      <PageHero
        eyebrow={t.nav.knowledge}
        title={t.sections.knowledgeTitle}
        subtitle={t.sections.knowledgeSub}
        bgImage={heroImg}
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <CardGridSkeleton count={6} />
          ) : posts.length === 0 ? (

            <p className="text-center text-muted-foreground">{t.knowledgeList.empty}</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p, i) => (
                <Reveal key={p.id} delay={i * 50}>
                  <Link
                    to="/knowledge/$slug"
                    params={{ slug: p.slug_en }}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
                  >
                    {p.featured_image && (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={p.featured_image}
                          alt={ar ? p.title_ar : p.title_en}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
                        {ar ? p.title_ar : p.title_en}
                      </h3>
                      <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">
                        {ar ? p.excerpt_ar : p.excerpt_en}
                      </p>
                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" /> {p.author_name}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.reading_time}m</span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
