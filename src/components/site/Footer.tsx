import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  MapPin,
  Phone,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LanguageProvider";
import { useContactInfo, useSocialLinks, toWhatsAppNumber } from "@/lib/settings";
import { menusByLocationQueryOptions, governoratesActiveQueryOptions } from "@/lib/queries";
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
  const Arrow = ar ? ArrowLeft : ArrowRight;

  const wa = toWhatsAppNumber(social.whatsapp || contact.whatsapp);
  const socialLinks: { name: string; href: string; Icon: typeof Linkedin }[] = [
    { name: "LinkedIn", href: social.linkedin, Icon: Linkedin },
    { name: "Instagram", href: social.instagram, Icon: Instagram },
    { name: "Facebook", href: social.facebook, Icon: Facebook },
    { name: "X (Twitter)", href: social.x, Icon: Twitter },
    { name: "YouTube", href: social.youtube, Icon: Youtube },
    ...(wa ? [{ name: "WhatsApp", href: `https://wa.me/${wa}`, Icon: MessageCircle }] : []),
  ].filter((s) => Boolean(s.href));

  const { data: footerMenu } = useQuery(menusByLocationQueryOptions("footer"));
  const { data: governorates } = useQuery(governoratesActiveQueryOptions);
  const legalHrefs = new Set(["/privacy", "/terms", "/careers"]);
  const items = (footerMenu ?? []).map((m) => ({
    to: m.href,
    label: ar ? m.label_ar || m.label_en : m.label_en,
  }));
  const resources = items.filter((i) => !legalHrefs.has(i.to));
  const legal = items.filter((i) => legalHrefs.has(i.to));
  const govs = (governorates ?? []).slice(0, 12);

  return (
    <footer className="relative hidden overflow-hidden bg-ink text-ink-foreground md:block">
      {/* Cinematic accents */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />

      {/* CTA strip */}
      <div className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
              {t.components.footer.buildWith}
            </p>
            <h3 className="mt-2 max-w-2xl font-display text-2xl leading-tight text-white sm:text-3xl">
              {t.components.footer.tagline}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="gold" size="lg">
              <Link to="/quote">
                {t.cta.quote}
                <Arrow className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link to="/contact">{t.nav.contact}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Logo light />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">{t.footer.tagline}</p>

            <div className="mt-6 space-y-3 text-sm text-white/75">
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="group flex items-start gap-3 hover:text-white">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
                    <Phone className="h-4 w-4" />
                  </span>
                  <span dir="ltr">{contact.phone}</span>
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="group flex items-start gap-3 hover:text-white">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
                    <Mail className="h-4 w-4" />
                  </span>
                  <span>{contact.email}</span>
                </a>
              )}
              {contact.offices.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <ul className="space-y-1">
                    {contact.offices.slice(0, 3).map((o, i) => {
                      const city = ar ? o.city_ar || o.city_en : o.city_en;
                      const addr = ar ? o.address_ar || o.address_en : o.address_en;
                      return (
                        <li key={i} className="leading-relaxed">
                          <span className="font-medium text-white">{city}</span>
                          {addr && <span className="text-white/55"> — {addr}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {socialLinks.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {socialLinks.map(({ name, href, Icon }) => (
                  <a
                    key={name}
                    href={href}
                    aria-label={name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Explore */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">{t.footer.explore}</h4>
            <span className="mt-2 block h-px w-8 bg-primary" />
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li><Link to="/services" className="inline-block py-1 transition hover:text-white hover:translate-x-0.5">{t.nav.services}</Link></li>
              <li><Link to="/projects" className="inline-block py-1 transition hover:text-white hover:translate-x-0.5">{t.nav.projects}</Link></li>
              <li><Link to="/products" className="inline-block py-1 transition hover:text-white hover:translate-x-0.5">{t.nav.products}</Link></li>
              <li><Link to="/gallery" className="inline-block py-1 transition hover:text-white hover:translate-x-0.5">{t.components.footer.gallery}</Link></li>
              <li><Link to="/knowledge" className="inline-block py-1 transition hover:text-white hover:translate-x-0.5">{t.nav.knowledge}</Link></li>
              <li><Link to="/about" className="inline-block py-1 transition hover:text-white hover:translate-x-0.5">{t.nav.about}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
              {t.components.footer.resources}
            </h4>
            <span className="mt-2 block h-px w-8 bg-primary" />
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              {resources.map((r) => (
                <li key={r.to}><Link to={r.to} className="inline-block py-1 transition hover:text-white hover:translate-x-0.5">{r.label}</Link></li>
              ))}
              <li><Link to="/downloads" className="inline-block py-1 transition hover:text-white hover:translate-x-0.5">{t.components.footer.downloads}</Link></li>
              <li><Link to="/quote" className="inline-block py-1 transition hover:text-white hover:translate-x-0.5">{t.cta.quote}</Link></li>
            </ul>
          </div>

          {/* Coverage / Governorates map */}
          <div className="lg:col-span-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
              {t.components.footer.coverageMap}
            </h4>
            <span className="mt-2 block h-px w-8 bg-primary" />
            <p className="mt-4 text-xs text-white/50">
              {t.components.footer.projectsAcross}
            </p>
            {govs.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {govs.map((g) => (
                  <li key={g.id}>
                    <Link
                      to="/governorates/$slug"
                      params={{ slug: g.slug }}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-primary/50 hover:bg-primary/10 hover:text-white"
                    >
                      {ar ? g.name_ar || g.name_en : g.name_en}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-white/40">—</p>
            )}

            {/* Newsletter */}
            <div className="mt-8">
              <h5 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">{t.footer.newsletter}</h5>
              <p className="mt-2 text-xs text-white/55">{t.footer.newsletterSub}</p>
              <form
                className="mt-3 flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!subEmail.trim()) return;
                  setSubBusy(true);
                  try {
                    await subscribe({ data: { email: subEmail.trim(), locale: ar ? "ar" : "en", source: "footer", website: "" } });
                    toast.success(t.components.footer.subscribeSuccess);
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
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-14 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:grid-cols-3">
          <div className="flex items-center gap-3 text-sm text-white/70">
            <Trophy className="h-5 w-5 text-primary" />
            <span>{t.components.footer.fifa}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/70">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>{t.components.footer.warranty}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/70">
            <MapPin className="h-5 w-5 text-primary" />
            <span>{t.components.footer.nationwide}</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center">
          <p>© {year} {t.brandFull}. {t.footer.rights}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.map((l) => (
              <li key={l.to}><Link to={l.to} className="hover:text-white">{l.label}</Link></li>
            ))}
            <li><Link to="/auth" className="hover:text-white">{t.components.footer.admin}</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
