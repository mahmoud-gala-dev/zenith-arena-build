import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LanguageProvider";

export function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:col-span-1">
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
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t.footer.explore}
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li><Link to="/services" className="hover:text-white">{t.nav.services}</Link></li>
              <li><Link to="/projects" className="hover:text-white">{t.nav.projects}</Link></li>
              <li><Link to="/products" className="hover:text-white">{t.nav.products}</Link></li>
              <li><Link to="/knowledge" className="hover:text-white">{t.nav.knowledge}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t.footer.company}
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li><Link to="/about" className="hover:text-white">{t.nav.about}</Link></li>
              <li><Link to="/contact" className="hover:text-white">{t.nav.contact}</Link></li>
              <li><Link to="/contact" className="hover:text-white">{t.cta.quote}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t.footer.newsletter}
            </h4>
            <p className="mt-4 text-sm text-white/60">{t.footer.newsletterSub}</p>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
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
