import { useMemo } from "react";
import { MessageCircle } from "lucide-react";
import { useContactInfo, useSocialLinks, toWhatsAppNumber } from "@/lib/settings";
import { buildWhatsAppUrl, type WhatsAppMessageContext } from "@/lib/whatsapp";
import { useLang } from "@/i18n/LanguageProvider";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Props = {
  /** Live form field values — WA link updates as the user types. */
  fields?: Omit<WhatsAppMessageContext, "ar" | "brand" | "pageUrl">;
  /** Analytics source (e.g. "service_quote_form", "quote_page"). */
  source?: string;
  className?: string;
  label?: string;
  brand?: string;
  variant?: "solid" | "outline";
};

export function WhatsAppSendButton({
  fields,
  source,
  className,
  label,
  brand = "Egytic Sports",
  variant = "outline",
}: Props) {
  const { lang, t } = useLang();
  const ar = lang === "ar";
  const contact = useContactInfo();
  const social = useSocialLinks();
  const number = toWhatsAppNumber(social.whatsapp || contact.whatsapp);

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

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        trackEvent({ name: "whatsapp_prefilled_click", source: source ?? "unknown", number })
      }
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
