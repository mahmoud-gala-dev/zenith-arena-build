import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { useLang } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert, EyeOff } from "lucide-react";
import { useMyRoles } from "@/hooks/useMyRoles";

type Search = { at?: string; lang?: "en" | "ar" };

export const Route = createFileRoute("/_authenticated/admin/legal/preview/$slug")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    at: typeof s.at === "string" ? s.at : undefined,
    lang: s.lang === "ar" || s.lang === "en" ? s.lang : undefined,
  }),
  component: PreviewPage,
});

type Section = { h: string; body: string; draft: boolean };

// Strip HTML-comment draft markers: <!-- draft:start --> ... <!-- draft:end -->
function stripDraftBlocks(md: string): string {
  return md.replace(/<!--\s*draft:start\s*-->[\s\S]*?<!--\s*draft:end\s*-->/gi, "");
}

function parseSections(md: string): { intro: string; sections: Section[] } {
  const text = (md ?? "").trim();
  if (!text) return { intro: "", sections: [] };
  const parts = text.split(/\n##\s+/);
  const intro = parts[0].startsWith("## ") ? "" : parts.shift() ?? "";
  const sections: Section[] = parts.map((chunk) => {
    const cleaned = chunk.replace(/^##\s+/, "");
    const nl = cleaned.indexOf("\n");
    const h = (nl === -1 ? cleaned : cleaned.slice(0, nl)).trim();
    const body = nl === -1 ? "" : cleaned.slice(nl + 1).trim();
    // Section is a draft when heading starts with [DRAFT] or [draft]
    const draft = /^\[\s*draft\s*\]/i.test(h);
    const cleanHeading = h.replace(/^\[\s*draft\s*\]\s*/i, "");
    return { h: cleanHeading, body, draft };
  });
  return { intro: intro.trim(), sections };
}

function AccessDenied({ reason }: { reason: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <ShieldAlert className="h-10 w-10 mx-auto text-destructive" />
        <h1 className="text-xl font-semibold">Preview access denied</h1>
        <p className="text-sm text-muted-foreground">{reason}</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/legal">
            <ArrowLeft className="h-3 w-3 mr-1" /> Back to editor
          </Link>
        </Button>
      </div>
    </div>
  );
}

function PreviewPage() {
  const { slug } = Route.useParams();
  const { at, lang: searchLang } = useSearch({ from: "/_authenticated/admin/legal/preview/$slug" });
  const { lang: uiLang, setLang } = useLang();
  const lang = searchLang ?? uiLang;
  const ar = lang === "ar";

  const {
    ready: rolesReady,
    roles,
    canPreview,
    canPreviewDrafts,
    canPreviewScheduled,
    canRevealDraftSections,
  } = useMyRoles();

  const previewAt = at ? new Date(at) : null;
  const previewValid = previewAt && !Number.isNaN(previewAt.getTime());
  const effectiveDate = previewValid ? previewAt! : new Date();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["admin", "legal", "preview", slug],
    enabled: rolesReady && canPreview,
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

  if (!rolesReady) return <p className="p-6 text-sm text-muted-foreground">Checking permissions…</p>;

  if (!canPreview) {
    return (
      <AccessDenied
        reason={
          roles.length === 0
            ? "Your account has no staff role assigned. Ask a super admin to grant you editor or content_manager access."
            : `Your role (${roles.join(", ")}) cannot open draft previews.`
        }
      />
    );
  }

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading preview…</p>;
  if (error || !page) return <p className="p-6 text-sm text-destructive">Page not found.</p>;

  const isUnpublished = page.status !== "published";
  const isScheduledFuture =
    page.status === "published" &&
    !!page.effective_at &&
    new Date(page.effective_at).getTime() > effectiveDate.getTime();

  // Role gates for content states
  if (isUnpublished && !canPreviewDrafts) {
    return (
      <AccessDenied reason="This page is unpublished. Only admin/editor roles can preview draft (unpublished) content." />
    );
  }
  if (isScheduledFuture && !canPreviewScheduled) {
    return (
      <AccessDenied reason="This page is scheduled for a future date. Your role cannot preview scheduled content ahead of time." />
    );
  }

  const wouldBeLive =
    page.status === "published" &&
    (!page.effective_at || new Date(page.effective_at).getTime() <= effectiveDate.getTime());

  const title = ar ? page.title_ar ?? page.title_en ?? "" : page.title_en ?? "";
  const rawContent = ar ? page.content_ar ?? page.content_en ?? "" : page.content_en ?? "";

  // For users without draft-section reveal permission, strip <!-- draft:start/end --> blocks
  // and hide [DRAFT] headed sections.
  const sanitizedContent = canRevealDraftSections ? rawContent : stripDraftBlocks(rawContent);
  const parsed = parseSections(sanitizedContent);
  const visibleSections = canRevealDraftSections
    ? parsed.sections
    : parsed.sections.filter((s) => !s.draft);
  const hiddenDraftCount = parsed.sections.length - visibleSections.length;

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
          <span className="rounded bg-black/10 px-2 py-0.5">
            role: {roles.join(", ") || "none"}
          </span>
          {hiddenDraftCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-black/15 px-2 py-0.5">
              <EyeOff className="h-3 w-3" /> {hiddenDraftCount} draft section{hiddenDraftCount === 1 ? "" : "s"} hidden
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={ar ? "ghost" : "secondary"} onClick={() => setLang("en")}>EN</Button>
          <Button size="sm" variant={ar ? "secondary" : "ghost"} onClick={() => setLang("ar")}>AR</Button>
        </div>
      </div>
      <SiteLayout>
        <PageHero eyebrow={ar ? "معاينة" : "Preview"} title={title || (ar ? "بدون عنوان" : "Untitled")} subtitle={parsed.intro} />
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {visibleSections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {ar ? "لا يوجد محتوى بعد لهذه اللغة." : "No content yet for this language."}
              </p>
            )}
            {visibleSections.map((s, i) => (
              <section key={i}>
                <h2 className="text-xl font-bold text-foreground">
                  {s.h}
                  {s.draft && canRevealDraftSections && (
                    <span className="ml-2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-xs align-middle">
                      DRAFT
                    </span>
                  )}
                </h2>
                {s.body && <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{s.body}</p>}
              </section>
            ))}
          </div>
        </article>
      </SiteLayout>
    </>
  );
}
