import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle, Download, ArrowRight, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import {
  useContactInfo,
  useSocialLinks,
  toWhatsAppNumber,
  useBrandName,
} from "@/lib/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { downloadsPublishedQueryOptions, type DownloadRow } from "@/lib/queries";
import { trackEvent } from "@/lib/analytics";

export type LeadSummary = {
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null; // slug or free label
  serviceLabel?: string | null; // resolved localized label if known
  message?: string | null;
  intent: "callback" | "quote" | "contact" | "download";
  source: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  summary: LeadSummary | null;
};

/**
 * Picks a catalog to suggest based on submitted service/intent.
 * Falls back to featured catalog, then the first published one.
 */
function pickCatalog(
  downloads: DownloadRow[] | undefined,
  service: string | null | undefined,
): DownloadRow | null {
  if (!downloads?.length) return null;
  const s = (service ?? "").trim().toLowerCase();
  if (s) {
    const byCat = downloads.find(
      (d) =>
        d.category?.toLowerCase() === s ||
        d.slug_en?.toLowerCase() === s ||
        (d.title_en ?? "").toLowerCase().includes(s),
    );
    if (byCat) return byCat;
  }
  return downloads.find((d) => d.featured) ?? downloads[0];
}

export function LeadSuccessDialog({ open, onOpenChange, summary }: Props) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const contact = useContactInfo();
  const social = useSocialLinks();
  const brand = useBrandName();
  const wa = toWhatsAppNumber(social.whatsapp || contact.whatsapp);
  const { data: downloads } = useQuery(downloadsPublishedQueryOptions);

  const catalog = useMemo(
    () => pickCatalog(downloads, summary?.service ?? null),
    [downloads, summary?.service],
  );

  const t = ar
    ? {
        title: "تم استلام طلبك بنجاح",
        subtitle: "سيتواصل معك أحد مهندسينا خلال يوم عمل واحد.",
        summary: "ملخص طلبك",
        name: "الاسم",
        email: "البريد",
        phone: "الهاتف",
        service: "الخدمة / الاهتمام",
        message: "الرسالة",
        next: "الخطوات التالية",
        waTitle: "تحدث معنا الآن على واتساب",
        waDesc: "استمرار الحوار مع فريق المبيعات مباشرة.",
        waCta: "افتح واتساب",
        dlTitle: (name: string) => `حمّل الكتالوج: ${name}`,
        dlDesc: "المواصفات التقنية والمشاريع السابقة في ملف واحد.",
        dlCta: "افتح صفحة الكتالوج",
        close: "إغلاق",
      }
    : {
        title: "Request received",
        subtitle: "One of our engineers will reach out within one business day.",
        summary: "Your submission",
        name: "Name",
        email: "Email",
        phone: "Phone",
        service: "Service / interest",
        message: "Message",
        next: "Next steps",
        waTitle: "Chat with us on WhatsApp",
        waDesc: "Continue the conversation with sales directly.",
        waCta: "Open WhatsApp",
        dlTitle: (name: string) => `Download the ${name} catalog`,
        dlDesc: "Technical specs and past projects in a single file.",
        dlCta: "Open catalog page",
        close: "Close",
      };

  const waHref =
    wa && summary
      ? buildWhatsAppUrl(wa, {
          brand: ar ? brand.ar : brand.en,
          service: summary.serviceLabel || summary.service || null,
          phone: summary.phone || null,
          ar,
          extra: ar
            ? `الاسم: ${summary.name}\nالبريد: ${summary.email}`
            : `Name: ${summary.name}\nEmail: ${summary.email}`,
        })
      : null;

  const catalogSlug = catalog?.slug_en || catalog?.slug_ar || null;
  const catalogTitle = catalog ? (ar ? catalog.title_ar || catalog.title_en : catalog.title_en) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir={ar ? "rtl" : "ltr"}>
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" strokeWidth={1.75} />
          </div>
          <DialogTitle className="text-center font-display text-2xl">{t.title}</DialogTitle>
          <DialogDescription className="text-center">{t.subtitle}</DialogDescription>
        </DialogHeader>

        {summary && (
          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t.summary}
            </p>
            <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5">
              <dt className="text-muted-foreground">{t.name}</dt>
              <dd className="font-medium text-foreground">{summary.name}</dd>
              <dt className="text-muted-foreground">{t.email}</dt>
              <dd className="font-medium text-foreground break-all" dir="ltr">
                {summary.email}
              </dd>
              {summary.phone && (
                <>
                  <dt className="text-muted-foreground">{t.phone}</dt>
                  <dd className="font-medium text-foreground" dir="ltr">
                    {summary.phone}
                  </dd>
                </>
              )}
              {(summary.serviceLabel || summary.service) && (
                <>
                  <dt className="text-muted-foreground">{t.service}</dt>
                  <dd className="font-medium text-foreground">
                    {summary.serviceLabel || summary.service}
                  </dd>
                </>
              )}
              {summary.message && (
                <>
                  <dt className="text-muted-foreground">{t.message}</dt>
                  <dd className="line-clamp-3 text-foreground/80">{summary.message}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t.next}
          </p>

          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent({
                  name: "lead_success_whatsapp_click",
                  source: summary?.source ?? "unknown",
                  intent: summary?.intent ?? "unknown",
                })
              }
              className="flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 transition hover:bg-emerald-500/20"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">{t.waTitle}</p>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">{t.waDesc}</p>
              </div>
              <Arrow className="mt-2 h-4 w-4 text-emerald-700 dark:text-emerald-300" />
            </a>
          )}

          {catalog && catalogSlug && (
            <a
              href={`/downloads/${catalogSlug}`}
              onClick={() =>
                trackEvent({
                  name: "lead_success_catalog_click",
                  source: summary?.source ?? "unknown",
                  intent: summary?.intent ?? "unknown",
                  catalog: catalog.slug_en,
                })
              }
              className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 transition hover:bg-primary/10"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Download className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{t.dlTitle(catalogTitle)}</p>
                <p className="text-xs text-muted-foreground">{t.dlDesc}</p>
              </div>
              <Arrow className="mt-2 h-4 w-4 text-primary" />
            </a>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
