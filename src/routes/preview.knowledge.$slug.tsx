import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Clock, User } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

type Search = { lang?: "en" | "ar" };

export const Route = createFileRoute("/preview/knowledge/$slug")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    lang: s.lang === "ar" || s.lang === "en" ? s.lang : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Article preview — Egytic Sports" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ArticlePreview,
});

function Denied({ msg }: { msg: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <ShieldAlert className="h-10 w-10 mx-auto text-destructive" />
        <h1 className="text-xl font-semibold">Preview unavailable</h1>
        <p className="text-sm text-muted-foreground">{msg}</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/blog">Back to admin</Link>
        </Button>
      </div>
    </div>
  );
}

function ArticlePreview() {
  const { slug } = Route.useParams();
  const { lang: qlang } = useSearch({ from: "/preview/knowledge/$slug" });
  const { lang: uiLang, setLang } = useLang();
  const lang = qlang ?? uiLang;
  const ar = lang === "ar";

  useEffect(() => {
    if (qlang && qlang !== uiLang) setLang(qlang);
  }, [qlang, uiLang, setLang]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["preview-article", slug],
    retry: false,
    queryFn: async () => {
      const { data: sess } = await supabase.auth.getUser();
      if (!sess.user) throw new Error("auth");
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .or(`slug_en.eq.${slug},slug_ar.eq.${slug}`)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading preview…</p>;
  if (error) return <Denied msg="You must be signed in as staff to preview drafts." />;
  if (!data) return <Denied msg="No article found for this slug." />;

  const p = data as {
    title_en: string; title_ar: string;
    excerpt_en: string | null; excerpt_ar: string | null;
    content_en: string | null; content_ar: string | null;
    featured_image: string | null; author_name: string; reading_time: number;
    status: string; scheduled_at: string | null; published_at: string | null;
    slug_en: string;
  };

  const title = ar ? (p.title_ar || p.title_en) : (p.title_en || p.title_ar);
  const excerpt = ar ? p.excerpt_ar : p.excerpt_en;
  const content = ar ? (p.content_ar || "") : (p.content_en || "");

  const scheduled = p.status === "draft" && p.scheduled_at && new Date(p.scheduled_at) > new Date();
  const isLive = p.status === "published";
  const stateLabel = scheduled
    ? `scheduled · goes live ${new Date(p.scheduled_at!).toLocaleString()}`
    : isLive ? "published" : p.status;

  return (
    <>
      <div className="sticky top-0 z-50 border-b bg-amber-500/95 text-black px-4 py-2 text-xs flex flex-wrap items-center gap-3 justify-between">
        <span className="font-medium">
          Staff preview · {stateLabel}
          {" · "}
          <span className={isLive ? "text-emerald-900" : "text-red-900"}>
            {isLive ? "LIVE on site" : "not live"}
          </span>
        </span>
        <div className="flex gap-1">
          <Button size="sm" variant={ar ? "ghost" : "secondary"} onClick={() => setLang("en")}>EN</Button>
          <Button size="sm" variant={ar ? "secondary" : "ghost"} onClick={() => setLang("ar")}>AR</Button>
          {isLive && (
            <Button size="sm" variant="outline" asChild>
              <Link to="/knowledge/$slug" params={{ slug: p.slug_en }}>Open live</Link>
            </Button>
          )}
        </div>
      </div>
      <SiteLayout>
        <article>
          <section className="relative overflow-hidden bg-ink pt-32 pb-14 text-white">
            {p.featured_image && (
              <img src={p.featured_image} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
            <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{title || (ar ? "بدون عنوان" : "Untitled")}</h1>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/70">
                <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" /> {p.author_name}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {p.reading_time} min</span>
              </div>
            </div>
          </section>
          <section className="py-14">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
              {excerpt && <p className="text-lg font-medium leading-relaxed text-foreground">{excerpt}</p>}
              <div className="mt-6 space-y-6">
                {content.split(/\n\n+/).map((b, i) => {
                  const t = b.trim();
                  if (!t) return null;
                  const m = /^##\s+(.+)$/.exec(t);
                  if (m) return <h2 key={i} className="pt-2 text-2xl font-bold text-foreground">{m[1]}</h2>;
                  return <p key={i} className="leading-relaxed text-muted-foreground whitespace-pre-line">{t}</p>;
                })}
                {!content && (
                  <p className="text-sm text-muted-foreground">
                    {ar ? "لا يوجد محتوى بعد لهذه اللغة." : "No content yet for this language."}
                  </p>
                )}
              </div>
            </div>
          </section>
        </article>
      </SiteLayout>
    </>
  );
}
