import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/site-data";
import { useLang } from "@/i18n/LanguageProvider";

export function WhatsAppButton() {
  const { t, isRTL } = useLang();
  const href = `https://wa.me/${WHATSAPP_NUMBER}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed z-40 flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5 md:!bottom-5"
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + 6.25rem)",
        ...(isRTL ? { left: "1.25rem" } : { right: "1.25rem" }),
      }}
      aria-label={t.cta.whatsapp}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">{t.cta.whatsapp}</span>
    </a>
  );
}
