import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Award, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { useLang } from "@/i18n/LanguageProvider";
import { certificatesPublishedQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/certificates")({
  loader: ({ context }) => context.queryClient.ensureQueryData(certificatesPublishedQueryOptions),
  head: () => ({
    meta: [
      { title: "Certifications & Standards — Egytic Sports" },
      {
        name: "description",
        content:
          "Egytic holds FIFA Quality, World Athletics, ITF, FINA and ISO 9001/14001/45001 certifications for sports construction and infrastructure.",
      },
      { property: "og:title", content: "Certifications & Standards — Egytic" },
      { property: "og:description", content: "FIFA, World Athletics, ITF, FINA and ISO certifications." },
    ],
  }),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => null,
  component: CertificatesPage,
});

function CertificatesPage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { data: certs } = useSuspenseQuery(certificatesPublishedQueryOptions);

  const tx = ar
    ? {
        eyebrow: "الشهادات والاعتمادات",
        title: "معايير عالمية موثّقة",
        sub: "نلتزم بأصرم معايير الجودة والسلامة والاستدامة في الصناعة الرياضية والبناء.",
        issuedBy: "الجهة المصدرة",
        number: "الرقم",
        issued: "صادرة في",
        expires: "سارية حتى",
        valid: "سارية",
        empty: "لا توجد شهادات بعد.",
      }
    : {
        eyebrow: "Certifications",
        title: "Independently verified standards",
        sub: "We hold the industry's most demanding certifications for quality, safety and sustainability.",
        issuedBy: "Issued by",
        number: "No.",
        issued: "Issued",
        expires: "Valid until",
        valid: "Valid",
        empty: "No certificates yet.",
      };

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {certs.length === 0 ? (
            <p className="col-span-full py-16 text-center text-muted-foreground">{tx.empty}</p>
          ) : (
            certs.map((c) => {
              const Icon = c.featured ? Award : ShieldCheck;
              const title = ar ? c.title_ar : c.title_en;
              const body = ar ? c.issuer_ar : c.issuer_en;
              return (
                <Reveal key={c.id}>
                  <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant">
                    {c.image_url ? (
                      <div className="mb-5 aspect-[16/10] overflow-hidden rounded-xl bg-secondary">
                        <img src={c.image_url} alt={title} loading="lazy" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
                        <Icon className="h-7 w-7" />
                      </div>
                    )}
                    <h3 className="mt-2 text-lg font-bold text-foreground">{title}</h3>
                    <div className="mt-3 space-y-2 text-sm">
                      {body && (
                        <p>
                          <span className="text-muted-foreground">{tx.issuedBy}: </span>
                          <span className="text-foreground">{body}</span>
                        </p>
                      )}
                      {c.certificate_number && (
                        <p>
                          <span className="text-muted-foreground">{tx.number}: </span>
                          <span className="text-foreground">{c.certificate_number}</span>
                        </p>
                      )}
                      {c.issued_at && (
                        <p>
                          <span className="text-muted-foreground">{tx.issued}: </span>
                          <span className="text-foreground">{new Date(c.issued_at).toLocaleDateString(ar ? "ar-EG" : "en-GB")}</span>
                        </p>
                      )}
                      {c.expires_at && (
                        <p>
                          <span className="text-muted-foreground">{tx.expires}: </span>
                          <span className="text-foreground">{new Date(c.expires_at).toLocaleDateString(ar ? "ar-EG" : "en-GB")}</span>
                        </p>
                      )}
                    </div>
                    <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary" style={{ marginTop: "1.25rem" }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {tx.valid}
                    </span>
                  </div>
                </Reveal>
              );
            })
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
