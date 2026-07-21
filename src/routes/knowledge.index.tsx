import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, User, Search, X } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { CardGridSkeleton } from "@/components/site/Skeletons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLang } from "@/i18n/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-knowledge.jpg";
import { seoSettingsByRouteQueryOptions } from "@/lib/queries";
import { buildSeoHead } from "@/lib/seo-head";
import { parseQuery, scoreDoc, buildSuggestions, type SearchableDoc } from "@/lib/search/knowledge-search";


export const Route = createFileRoute("/knowledge/")({
  loader: async ({ context }) => ({
    seo: await context.queryClient.ensureQueryData(seoSettingsByRouteQueryOptions("/knowledge")),
  }),
  component: KnowledgePage,
  head: ({ loaderData }) =>
    buildSeoHead({
      routePath: "/knowledge",
      seo: loaderData?.seo ?? null,
      fallbackTitleEn: "Knowledge Center — Articles, Guides & Insights | Egytic Sports",
      fallbackTitleAr: "مركز المعرفة — مقالات وأدلة ورؤى | إيجيتك سبورتس",
      fallbackDescEn: "Search technical articles, standards guides and construction insights for sports facilities. Filter by category, tag and reading time.",
      fallbackDescAr: "ابحث في المقالات الفنية وأدلة المعايير ورؤى الإنشاء للمنشآت الرياضية. فلترة حسب الفئة والوسم وزمن القراءة.",
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
  category_id: string | null;
  tags: string[] | null;
  content_type: string | null;
}

interface CategoryRow {
  id: string;
  title_en: string;
  title_ar: string;
}

type SortKey = "newest" | "oldest" | "reading" | "title";
type TypeKey = "all" | "article" | "guide" | "case_study";

function KnowledgePage() {
  const { t, lang } = useLang();
  const ar = lang === "ar";

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [tag, setTag] = useState<string>("all");
  const [type, setType] = useState<TypeKey>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog_posts", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id,slug_en,title_en,title_ar,excerpt_en,excerpt_ar,featured_image,author_name,reading_time,published_at,category_id,tags,content_type")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BlogRow[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["blog_categories", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("id,title_en,title_ar")
        .eq("status", "published")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CategoryRow[];
    },
  });

  const allTags = useMemo(() => {
    const s = new Set<string>();
    posts.forEach((p) => (p.tags ?? []).forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = posts.filter((p) => {
      if (category !== "all" && p.category_id !== category) return false;
      if (tag !== "all" && !(p.tags ?? []).includes(tag)) return false;
      if (type !== "all" && (p.content_type ?? "article") !== type) return false;
      if (query) {
        const hay = [p.title_en, p.title_ar, p.excerpt_en, p.excerpt_ar, ...(p.tags ?? [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "newest") return (b.published_at ?? "").localeCompare(a.published_at ?? "");
      if (sort === "oldest") return (a.published_at ?? "").localeCompare(b.published_at ?? "");
      if (sort === "reading") return (a.reading_time ?? 0) - (b.reading_time ?? 0);
      if (sort === "title") {
        const at = ar ? a.title_ar : a.title_en;
        const bt = ar ? b.title_ar : b.title_en;
        return at.localeCompare(bt);
      }
      return 0;
    });
    return list;
  }, [posts, q, category, tag, type, sort, ar]);

  const hasFilters = q !== "" || category !== "all" || tag !== "all" || type !== "all" || sort !== "newest";
  const clearFilters = () => { setQ(""); setCategory("all"); setTag("all"); setType("all"); setSort("newest"); };

  const typeLabel = (v: string | null): string => {
    const k = (v ?? "article") as string;
    if (k === "guide") return t.knowledgeList.typeGuide;
    if (k === "case_study") return t.knowledgeList.typeCaseStudy;
    return t.knowledgeList.typeArticle;
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow={t.nav.knowledge}
        title={t.sections.knowledgeTitle}
        subtitle={t.sections.knowledgeSub}
        bgImage={heroImg}
      />
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 grid gap-3 md:grid-cols-12">
            <div className="relative md:col-span-5">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.knowledgeList.searchPlaceholder}
                className="ps-9"
              />
            </div>
            <div className="md:col-span-3">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder={t.knowledgeList.allCategories} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.knowledgeList.allCategories}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{ar ? c.title_ar : c.title_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger><SelectValue placeholder={t.knowledgeList.allTags} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.knowledgeList.allTags}</SelectItem>
                  {allTags.map((tg) => (
                    <SelectItem key={tg} value={tg}>{tg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t.knowledgeList.sortNewest}</SelectItem>
                  <SelectItem value="oldest">{t.knowledgeList.sortOldest}</SelectItem>
                  <SelectItem value="reading">{t.knowledgeList.sortReadingTime}</SelectItem>
                  <SelectItem value="title">{t.knowledgeList.sortTitle}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            {(["all", "article", "guide", "case_study"] as TypeKey[]).map((k) => {
              const label = k === "all" ? t.knowledgeList.allTypes
                : k === "article" ? t.knowledgeList.typeArticle
                : k === "guide" ? t.knowledgeList.typeGuide
                : t.knowledgeList.typeCaseStudy;
              const active = type === k;
              return (
                <Button
                  key={k}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => setType(k)}
                  className="rounded-full"
                >
                  {label}
                </Button>
              );
            })}
            <div className="ms-auto flex items-center gap-3">
              <Badge variant="secondary">
                {t.knowledgeList.resultsCount.replace("{count}", String(filtered.length))}
              </Badge>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="me-1 h-4 w-4" /> {t.knowledgeList.clearFilters}
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <CardGridSkeleton count={6} />
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground">{t.knowledgeList.empty}</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground">{t.knowledgeList.noResults}</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p, i) => (
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
                      <div className="mb-2">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{typeLabel(p.content_type)}</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
                        {ar ? p.title_ar : p.title_en}
                      </h3>
                      <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">
                        {ar ? p.excerpt_ar : p.excerpt_en}
                      </p>
                      {(p.tags ?? []).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {(p.tags ?? []).slice(0, 3).map((tg) => (
                            <Badge key={tg} variant="outline" className="text-[10px]">{tg}</Badge>
                          ))}
                        </div>
                      )}
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
