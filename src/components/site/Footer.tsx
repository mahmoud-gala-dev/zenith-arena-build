import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MapPin, Facebook, Instagram, Linkedin, Youtube, Twitter, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LanguageProvider";
import { useContactInfo, useSocialLinks, toWhatsAppNumber } from "@/lib/settings";
import { subscribeNewsletter } from "@/lib/newsletter.functions";




export function Footer() {
  const { t, lang } = useLang();
  const contact = useContactInfo();
  const social = useSocialLinks();
  const subscribe = useServerFn(subscribeNewsletter);
  const [subEmail, setSubEmail] = useState("");
  const [subBusy, setSubBusy] = useState(false);
  const year = new Date().getFullYear();
  const ar = lang === "ar";

  const wa = toWhatsAppNumber(social.whatsapp || contact.whatsapp);
  const socialLinks: { name: string; href: string; Icon: typeof Linkedin }[] = [
    { name: "LinkedIn", href: social.linkedin, Icon: Linkedin },
    { name: "Instagram", href: social.instagram, Icon: Instagram },
    { name: "Facebook", href: social.facebook, Icon: Facebook },
    { name: "X (Twitter)", href: social.x, Icon: Twitter },
    { name: "YouTube", href: social.youtube, Icon: Youtube },
    ...(wa ? [{ name: "WhatsApp", href: `https://wa.me/${wa}`, Icon: MessageCircle }] : []),
  ].filter((s) => Boolean(s.href));
  const officeLine = contact.offices
    .map((o) => (ar ? o.city_ar || o.city_en : o.city_en))
    .filter(Boolean)
    .join(" · ");


  const resources = ar
    ? [
        { to: "/downloads", label: "التحميلات" },
        { to: "/certificates", label: "الشهادات" },
        { to: "/clients", label: "العملاء" },
        { to: "/gallery", label: "المعرض" },
        { to: "/faq", label: "الأسئلة الشائعة" },
      ]
    : [
        { to: "/downloads", label: "Downloads" },
        { to: "/certificates", label: "Certifications" },
        { to: "/clients", label: "Clients" },
        { to: "/gallery", label: "Gallery" },
        { to: "/faq", label: "FAQ" },
      ];

  const legal = ar
    ? [
        { to: "/careers", label: "الوظائف" },
        { to: "/privacy", label: "سياسة الخصوصية" },
        { to: "/terms", label: "الشروط والأحكام" },
      ]
    : [
        { to: "/careers", label: "Careers" },
        { to: "/privacy", label: "Privacy Policy" },
        { to: "/terms", label: "Terms & Conditions" },
      ];

  return (
    <footer className="hidden bg-ink text-ink-foreground md:block">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo light />
            <p className="mt-4 max-w-xs text-sm text-white/60">{t.footer.tagline}</p>
            <div className="mt-6 space-y-2 text-sm text-white/70">
              {officeLine && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> {officeLine}
                </p>
              )}
              {contact.email && (
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href={`mailto:${contact.email}`} className="hover:text-white">{contact.email}</a>
                </p>
              )}


            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {socialLinks.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  aria-label={name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:border-primary hover:bg-primary/10 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">{t.footer.explore}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li><Link to="/services" className="inline-block py-1 hover:text-white">{t.nav.services}</Link></li>
              <li><Link to="/projects" className="inline-block py-1 hover:text-white">{t.nav.projects}</Link></li>
              <li><Link to="/products" className="inline-block py-1 hover:text-white">{t.nav.products}</Link></li>
              <li><Link to="/knowledge" className="inline-block py-1 hover:text-white">{t.nav.knowledge}</Link></li>
              <li><Link to="/about" className="inline-block py-1 hover:text-white">{t.nav.about}</Link></li>
              <li><Link to="/contact" className="inline-block py-1 hover:text-white">{t.nav.contact}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              {ar ? "الموارد" : "Resources"}
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              {resources.map((r) => (
                <li key={r.to}><Link to={r.to} className="inline-block py-1 hover:text-white">{r.label}</Link></li>
              ))}
              <li><Link to="/quote" className="inline-block py-1 hover:text-white">{t.cta.quote}</Link></li>
              <li><Link to="/auth" className="inline-block py-1 hover:text-white">{ar ? "دخول الإدارة" : "Admin"}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">{t.footer.newsletter}</h4>
            <p className="mt-4 text-sm text-white/60">{t.footer.newsletterSub}</p>
            <form
              className="mt-4 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!subEmail.trim()) return;
                setSubBusy(true);
                try {
                  await subscribe({ data: { email: subEmail.trim(), locale: ar ? "ar" : "en", source: "footer", website: "" } });
                  toast.success(ar ? "تم الاشتراك بنجاح." : "Subscribed. Thanks!");
                  setSubEmail("");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not subscribe.");
                } finally {
                  setSubBusy(false);
                }
              }}
            >
              <Input
                type="email"
                required
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                placeholder={t.footer.emailPlaceholder}
                className="border-white/15 bg-white/5 text-white placeholder:text-white/40"
              />
              <Button type="submit" variant="gold" size="sm" disabled={subBusy}>
                {subBusy ? "…" : t.footer.subscribe}
              </Button>
            </form>

            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/50">
              {legal.map((l) => (
                <li key={l.to}><Link to={l.to} className="inline-block py-1 hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <p>© {year} {t.brandFull}. {t.footer.rights}</p>
          <p>Engineering excellence · FIFA & World Athletics certified</p>
        </div>
      </div>
    </footer>
  );
}
