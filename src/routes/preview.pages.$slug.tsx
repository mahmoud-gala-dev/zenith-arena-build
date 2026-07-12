import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { useLang } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

type Search = { token?: string; lang?: "en" | "ar" };

export const Route = createFileRoute("/preview/pages/$slug")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    token: typeof s.token === "string" ? s.token : undefined,
    lang: s.lang === "ar" || s.lang === "en" ? s.lang : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Draft preview — Egytic Sports" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PublicPreview,
});

import type { Section } from "@/lib/types";
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

function Denied({ msg }: { msg: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <ShieldAlert className="h-10 w-10 mx-auto text-destructive" />
        <h1 className="text-xl font-semibold">Preview link invalid</h1>
        <p className="text-sm text-muted-foreground">{msg}</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Go to homepage</Link>
        </Button>
      </div>
    </div>
  );
}

function PublicPreview() {
  const { slug } = Route.useParams();
  const { token, lang: searchLang } = useSearch({ from: "/preview/pages/$slug" });
  const { lang: uiLang, setLang } = useLang();
  const lang = searchLang ?? uiLang;
  const ar = lang === "ar";

  const { data, isLoading, error } = useQuery({
    queryKey: ["preview-token", token, slug],
    enabled: !!token,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_page_by_preview_token", { _token: token! });
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        slug_en: string | null; slug_ar: string | null;
        title_en: string | null; title_ar: string | null;
        content_en: string | null; content_ar: string | null;
        status: string; effective_at: string | null;
        version_number: number | null;
      }>;
      const match = rows.find((r) => r.slug_en === slug || r.slug_ar === slug);
      return match ?? null;
    },
  });

  if (!token) return <Denied msg="This preview URL is missing its access token." />;
  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading preview…</p>;
  if (error) return <Denied msg="Unable to load preview." />;
  if (!data) return <Denied msg="This link has expired, been revoked, or does not match this page." />;

  const title = ar ? data.title_ar ?? data.title_en ?? "" : data.title_en ?? "";
  const content = ar ? data.content_ar ?? data.content_en ?? "" : data.content_en ?? "";
  const { intro, sections } = parseSections(content);
  const isLive = data.status === "published" && (!data.effective_at || new Date(data.effective_at) <= new Date());

  return (
    <>
      <div className="sticky top-0 z-50 border-b bg-amber-500/95 text-black px-4 py-2 text-xs flex flex-wrap items-center gap-3 justify-between">
        <span className="font-medium">
          Private preview · {data.version_number != null ? `pinned to v${data.version_number}` : "current draft"} · status={data.status}
          {data.effective_at ? ` · effective ${new Date(data.effective_at).toLocaleString()}` : ""}
          {" · "}
          <span className={isLive ? "text-emerald-900" : "text-red-900"}>
            {isLive ? "currently LIVE" : "not live yet"}
          </span>
        </span>
        <div className="flex gap-1">
          <Button size="sm" variant={ar ? "ghost" : "secondary"} onClick={() => setLang("en")}>EN</Button>
          <Button size="sm" variant={ar ? "secondary" : "ghost"} onClick={() => setLang("ar")}>AR</Button>
        </div>
      </div>
      <SiteLayout>
        <PageHero eyebrow={ar ? "معاينة خاصة" : "Private preview"} title={title || (ar ? "بدون عنوان" : "Untitled")} subtitle={intro} />
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
