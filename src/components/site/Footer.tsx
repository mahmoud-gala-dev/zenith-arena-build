import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Facebook, Instagram, Linkedin, Youtube, Twitter } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LanguageProvider";

const socialLinks = [
  { name: "LinkedIn", href: "https://www.linkedin.com/company/apexsports", Icon: Linkedin },
  { name: "Instagram", href: "https://www.instagram.com/apexsports", Icon: Instagram },
  { name: "Facebook", href: "https://www.facebook.com/apexsports", Icon: Facebook },
  { name: "X (Twitter)", href: "https://twitter.com/apexsports", Icon: Twitter },
  { name: "YouTube", href: "https://www.youtube.com/@apexsports", Icon: Youtube },
];

export function Footer() {
  const { t, lang } = useLang();
  const year = new Date().getFullYear();
  const ar = lang === "ar";

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
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Riyadh · Dubai · Doha
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> +966 5X XXX XXXX
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> hello@apexsports.co
              </p>
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
            <form className="mt-4 flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                required
                placeholder={t.footer.emailPlaceholder}
                className="border-white/15 bg-white/5 text-white placeholder:text-white/40"
              />
              <Button type="submit" variant="gold" size="sm">
                {t.footer.subscribe}
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
