import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { useLang } from "@/i18n/LanguageProvider";
import { pageBySlugQueryOptions } from "@/lib/queries";

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

export function LegalPage({ slug, eyebrowEn, eyebrowAr }: { slug: string; eyebrowEn: string; eyebrowAr: string }) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { data: page } = useSuspenseQuery(pageBySlugQueryOptions(slug));

  const title = ar ? page?.title_ar ?? page?.title_en ?? "" : page?.title_en ?? "";
  const content = ar ? page?.content_ar ?? page?.content_en ?? "" : page?.content_en ?? "";
  const { intro, sections } = parseSections(content);

  return (
    <SiteLayout>
      <PageHero eyebrow={ar ? eyebrowAr : eyebrowEn} title={title} subtitle={intro} />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold text-foreground">{s.h}</h2>
              {s.body && <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{s.body}</p>}
            </section>
          ))}
        </div>
      </article>
    </SiteLayout>
  );
}
