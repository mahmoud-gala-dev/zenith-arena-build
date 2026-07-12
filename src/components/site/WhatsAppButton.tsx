import { MessageCircle } from "lucide-react";
import { useContactInfo, useSocialLinks, toWhatsAppNumber } from "@/lib/settings";
import { useLang } from "@/i18n/LanguageProvider";
import { useIsMobile } from "@/hooks/use-mobile";

export function WhatsAppButton() {
  const { t, isRTL } = useLang();
  const isMobile = useIsMobile();
  const contact = useContactInfo();
  const social = useSocialLinks();
  const number = toWhatsAppNumber(social.whatsapp || contact.whatsapp);
  if (!number) return null;
  const href = `https://wa.me/${number}`;



  // On mobile, clear the bottom tab bar (≈74px) + safe area with breathing room.
  // On desktop/tablet there's no tab bar, so sit closer to the edge.
  const bottom = isMobile
    ? "calc(env(safe-area-inset-bottom) + 6.25rem)"
    : "1.25rem";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed z-40 flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
      style={{
        bottom,
        ...(isRTL ? { left: "1.25rem" } : { right: "1.25rem" }),
      }}
      aria-label={t.cta.whatsapp}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">{t.cta.whatsapp}</span>
    </a>
  );
}
