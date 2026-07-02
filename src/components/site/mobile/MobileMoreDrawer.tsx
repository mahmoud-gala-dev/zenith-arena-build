import { Link } from "@tanstack/react-router";
import { ChevronRight, Phone, Mail, MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string };

export function MobileMoreDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { lang, t } = useLang();
  const ar = lang === "ar";
  const close = () => onOpenChange(false);

  const groups: { label: string; items: Item[] }[] = [
    {
      label: ar ? "استكشف" : "Explore",
      items: [
        { to: "/services", label: t.nav.services },
        { to: "/gallery", label: ar ? "معرض الصور" : "Gallery" },
        { to: "/clients", label: ar ? "العملاء" : "Clients" },
        { to: "/about", label: t.nav.about },
      ],
    },
    {
      label: ar ? "الشركة" : "Company",
      items: [
        { to: "/contact", label: t.nav.contact },
        { to: "/careers", label: ar ? "الوظائف" : "Careers" },
        { to: "/faq", label: ar ? "الأسئلة الشائعة" : "FAQ" },
        { to: "/downloads", label: ar ? "التحميلات" : "Downloads" },
        { to: "/certificates", label: ar ? "الشهادات" : "Certificates" },
      ],
    },
    {
      label: ar ? "قانوني" : "Legal",
      items: [
        { to: "/privacy", label: ar ? "الخصوصية" : "Privacy" },
        { to: "/terms", label: ar ? "الشروط" : "Terms" },
      ],
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={ar ? "left" : "right"}
        className="flex w-full max-w-sm flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border/70 px-5 pb-4 pt-6">
          <SheetTitle className="text-xl font-black tracking-tight">
            {ar ? "القائمة" : "Menu"}
          </SheetTitle>
        </SheetHeader>

        <div
          className="flex-1 overflow-y-auto overscroll-contain px-3 py-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
        >
          <Button asChild variant="hero" className="mb-4 h-12 w-full text-base font-semibold">
            <Link to="/quote" onClick={close}>
              {t.nav.quote}
            </Link>
          </Button>

          {groups.map((g) => (
            <div key={g.label} className="mb-4">
              <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {g.label}
              </div>
              <ul className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                {g.items.map((item, i) => (
                  <li key={item.to} className={cn(i > 0 && "border-t border-border/60")}>
                    <Link
                      to={item.to}
                      onClick={close}
                      className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-accent active:bg-accent"
                    >
                      <span>{item.label}</span>
                      <ChevronRight
                        className={cn("h-4 w-4 shrink-0 text-muted-foreground", ar && "rotate-180")}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mt-2 grid grid-cols-3 gap-2">
            <a
              href="tel:+201000000000"
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border border-border/70 bg-card text-xs font-medium text-foreground transition-colors hover:bg-accent active:scale-[0.97]"
            >
              <Phone className="h-4 w-4 text-primary" />
              {ar ? "اتصال" : "Call"}
            </a>
            <a
              href="mailto:info@egytic.com"
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border border-border/70 bg-card text-xs font-medium text-foreground transition-colors hover:bg-accent active:scale-[0.97]"
            >
              <Mail className="h-4 w-4 text-primary" />
              {ar ? "بريد" : "Email"}
            </a>
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noopener"
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border border-border/70 bg-card text-xs font-medium text-foreground transition-colors hover:bg-accent active:scale-[0.97]"
            >
              <MessageCircle className="h-4 w-4 text-primary" />
              WhatsApp
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
