import { useMemo } from "react";
import { MessageCircle } from "lucide-react";
import { useContactInfo, useSocialLinks, toWhatsAppNumber } from "@/lib/settings";
import { buildWhatsAppUrl, type WhatsAppMessageContext } from "@/lib/whatsapp";
import { useLang } from "@/i18n/LanguageProvider";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { logWhatsAppSend } from "@/lib/leads.functions";
import { useServerFn } from "@tanstack/react-start";

type Props = {
  fields?: Omit<WhatsAppMessageContext, "ar" | "brand" | "pageUrl">;
  source?: string;
  className?: string;
  label?: string;
  brand?: string;
  variant?: "solid" | "outline";
  /** When true, log this click as a Lead (requires name + phone in fields). */
  logToLead?: boolean;
};

export function WhatsAppSendButton({
  fields,
  source,
  className,
  label,
  brand = "Egytic Sports",
  variant = "outline",
  logToLead = false,
}: Props) {
  const { lang, t } = useLang();
  const ar = lang === "ar";
  const contact = useContactInfo();
  const social = useSocialLinks();
  const number = toWhatsAppNumber(social.whatsapp || contact.whatsapp);
  const logSend = useServerFn(logWhatsAppSend);

  const href = useMemo(() => {
    if (!number) return null;
    const pageUrl = typeof window !== "undefined" ? window.location.href : null;
    return buildWhatsAppUrl(number, { ...fields, ar, brand, pageUrl });
  }, [number, fields, ar, brand]);

  if (!href) return null;

  const base =
    variant === "solid"
      ? "bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500"
      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300";

  const canLog = logToLead && !!fields?.name && !!fields?.phone && (fields.name ?? "").trim().length > 0 && (fields.phone ?? "").trim().length >= 4;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackEvent({ name: "whatsapp_prefilled_click", source: source ?? "unknown", number });
        if (canLog) {
          // Fire-and-forget; don't block WhatsApp handoff.
          const pageUrl = typeof window !== "undefined" ? window.location.href : null;
          logSend({
            data: {
              name: (fields!.name ?? "").trim(),
              email: (fields!.email ?? "").trim() || null,
              phone: (fields!.phone ?? "").trim(),
              service: fields?.service ?? null,
              message: fields?.message ?? null,
              source: source ?? "quote_page",
              page_url: pageUrl,
            },
          }).catch((err) => console.warn("[WhatsAppSendButton] log failed", err));
        }
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition",
        base,
        className,
      )}
      aria-label={label ?? t.cta.whatsapp}
    >
      <MessageCircle className="h-4 w-4" />
      {label ?? t.cta.whatsapp}
    </a>
  );
}
