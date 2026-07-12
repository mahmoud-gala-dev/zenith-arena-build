import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { useLang } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Search = { at?: string; lang?: "en" | "ar" };

export const Route = createFileRoute("/_authenticated/admin/legal/preview/$slug")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    at: typeof s.at === "string" ? s.at : undefined,
    lang: s.lang === "ar" || s.lang === "en" ? s.lang : undefined,
  }),
  component: PreviewPage,
});

type Section = { h: string; body: string };
function parseSections(md: string): { intro: string; sections: Section[] } {
  const text = (md ?? "").trim();
  if (!text) return { intro: "", sections: [] };
  const parts = text.split(/\n##\s+/);
  const intro = parts[0].startsWith("## ") ? "" : parts.shift() ?? "";
  const sections: Section[] = parts.map((chunk) => {
    const cleaned = chunk.replace(/^##\s+/, "");
    const nl = cleaned.indexOf("\n");
    if (nl === -1) return { h: cleaned.trim(), body: "" };
    return { h: cleaned.slice(0, nl).trim(), body: cleaned.slice(nl + 1).trim() };
  });
  return { intro: intro.trim(), sections };
}

function PreviewPage() {
  const { slug } = Route.useParams();
  const { at, lang: searchLang } = useSearch({ from: "/_authenticated/admin/legal/preview/$slug" });
  const { lang: uiLang, setLang } = useLang();
  const lang = searchLang ?? uiLang;
  const ar = lang === "ar";

  const previewAt = at ? new Date(at) : null;
  const previewValid = previewAt && !Number.isNaN(previewAt.getTime());
  const effectiveDate = previewValid ? previewAt! : new Date();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["admin", "legal", "preview", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .or(`slug_en.eq.${slug},slug_ar.eq.${slug}`)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading preview…</p>;
  if (error || !page) return <p className="p-6 text-sm text-destructive">Page not found.</p>;

  const wouldBeLive =
    page.status === "published" &&
    (!page.effective_at || new Date(page.effective_at).getTime() <= effectiveDate.getTime());

  const title = ar ? page.title_ar ?? page.title_en ?? "" : page.title_en ?? "";
  const content = ar ? page.content_ar ?? page.content_en ?? "" : page.content_en ?? "";
  const { intro, sections } = parseSections(content);

  return (
    <>
      <div className="sticky top-0 z-50 border-b bg-amber-500/95 text-black px-4 py-2 text-xs flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/legal" className="inline-flex items-center gap-1 font-semibold hover:underline">
            <ArrowLeft className="h-3 w-3" /> Back to editor
          </Link>
          <span className="font-medium">
            Preview · {slug} · {effectiveDate.toLocaleString()} ·{" "}
            <span className={wouldBeLive ? "text-emerald-900" : "text-red-900"}>
              {wouldBeLive ? "LIVE at this date" : "NOT live — hidden from visitors"}
            </span>
          </span>
          <span className="opacity-70">
            status={page.status}
            {page.effective_at ? ` · effective ${new Date(page.effective_at).toLocaleString()}` : " · no effective date"}
          </span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={ar ? "ghost" : "secondary"} onClick={() => setLang("en")}>EN</Button>
          <Button size="sm" variant={ar ? "secondary" : "ghost"} onClick={() => setLang("ar")}>AR</Button>
        </div>
      </div>
      <SiteLayout>
        <PageHero eyebrow={ar ? "معاينة" : "Preview"} title={title || (ar ? "بدون عنوان" : "Untitled")} subtitle={intro} />
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {ar ? "لا يوجد محتوى بعد لهذه اللغة." : "No content yet for this language."}
              </p>
            )}
            {sections.map((s, i) => (
              <section key={i}>
                <h2 className="text-xl font-bold text-foreground">{s.h}</h2>
                {s.body && <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{s.body}</p>}
              </section>
            ))}
          </div>
        </article>
      </SiteLayout>
    </>
  );
}
