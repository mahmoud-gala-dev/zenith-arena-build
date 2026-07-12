import { useState } from "react";
import { z } from "zod";
import { submitLead } from "@/lib/leads.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Clock, CheckCircle2, MessageCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import heroContact from "@/assets/hero-contact.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import { useQuery } from "@tanstack/react-query";
import { servicesPublishedQueryOptions } from "@/hooks/useServiceContent";
import { useContactInfo, useSocialLinks, toWhatsAppNumber } from "@/lib/settings";


export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact Egytic Sports — Get a Project Consultation" },
      {
        name: "description",
        content:
          "Talk to Egytic Sports engineers about your football pitch, athletics track, indoor arena, or aquatic centre. Detailed proposals delivered within 48 hours.",
      },
      { property: "og:title", content: "Contact Egytic Sports" },
      {
        property: "og:description",
        content: "Reach our engineering team for a tailored sports construction consultation.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
      { property: "og:image", content: heroContact.url },
      { property: "og:image:width", content: "1920" },
      { property: "og:image:height", content: "1080" },
      { property: "og:image:alt", content: "Egytic Sports headquarters at dusk" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Contact Egytic Sports" },
      { name: "twitter:description", content: "Get a tailored sports construction consultation." },
      { name: "twitter:image", content: heroContact.url },
    ],
    links: [
      { rel: "canonical", href: "/contact" },
      { rel: "alternate", hrefLang: "en", href: "/contact" },
      { rel: "alternate", hrefLang: "ar", href: "/contact" },
      { rel: "alternate", hrefLang: "x-default", href: "/contact" },
      { rel: "preload", as: "image", href: heroContact.url, fetchpriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Egytic Sports",
          mainEntity: {
            "@type": "Organization",
            name: "Egytic Sports",
            email: "hello@egyticsports.com",
            areaServed: ["EG", "SA", "AE", "QA"],
            contactPoint: [
              {
                "@type": "ContactPoint",
                contactType: "sales",
                email: "hello@egyticsports.com",
                availableLanguage: ["en", "ar"],
              },
            ],
          },
        }),
      },
    ],
  }),
});


function ContactPage() {
  const { t, lang } = useLang();
  const L = useLocalized();
  const contact = useContactInfo();
  const social = useSocialLinks();
  const wa = toWhatsAppNumber(social.whatsapp || contact.whatsapp);
  const ar = lang === "ar";
  const officeLine = contact.offices
    .map((o) => (ar ? o.city_ar || o.city_en : o.city_en))
    .filter(Boolean)
    .join(" · ") || "—";
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projectType, setProjectType] = useState("");
  const { data: dbServices } = useQuery(servicesPublishedQueryOptions);


  const schema = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255),
    message: z.string().trim().min(1).max(2000),
  });

  const submit = useServerFn(submitLead);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      type: "contact" as const,
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? "") || null,
      service: projectType || null,
      budget_range: String(fd.get("budget") ?? "") || null,
      message: String(fd.get("message") ?? ""),
      website: String(fd.get("website") ?? ""),
    };
    const check = schema.safeParse(payload);
    if (!check.success) return toast.error(check.error.issues[0].message);
    setSubmitting(true);
    try {
      await submit({ data: payload });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }



  return (
    <SiteLayout>
      <PageHero eyebrow={t.nav.contact} title={t.contact.title} subtitle={t.contact.sub} bgImage={heroContact.url} />

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="space-y-5 lg:col-span-1">
            {[
              { icon: MapPin, label: t.contact.office, value: officeLine },
              { icon: Mail, label: t.contact.email, value: contact.email },
              { icon: Clock, label: t.contact.hours, value: ar ? contact.hours_ar : contact.hours_en },
            ]
              .filter((c) => Boolean(c.value))
              .map((c, i) => (
                <div key={i} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    <p className="font-medium text-foreground">{c.value}</p>
                  </div>
                </div>
              ))}
            {wa ? (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 py-4 font-semibold text-primary-foreground shadow-soft"
              >
                <MessageCircle className="h-5 w-5" />
                {t.cta.whatsapp}
              </a>
            ) : null}

          </div>


          <div className="rounded-3xl border border-border bg-card p-8 shadow-soft lg:col-span-2">
            {sent ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="mt-6 max-w-md text-lg font-medium text-foreground">{t.contact.success}</p>
                <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
                  {t.cta.send}
                </Button>
              </div>
            ) : (
              <form className="grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name">{t.contact.name}</Label>
                  <Input id="name" name="name" required maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t.contact.email}</Label>
                  <Input id="email" name="email" type="email" required maxLength={255} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t.contact.phone}</Label>
                  <Input id="phone" name="phone" type="tel" maxLength={30} />
                </div>
                <div className="space-y-2">
                  <Label>{t.contact.projectType}</Label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.contact.projectType} />
                    </SelectTrigger>
                    <SelectContent>
                      {(dbServices ?? []).filter((s) => s.slug_en).map((s) => (
                        <SelectItem key={s.id} value={s.slug_en}>
                          {L({ en: s.title_en, ar: s.title_ar ?? s.title_en })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="budget">{t.contact.budget}</Label>
                  <Input id="budget" name="budget" maxLength={60} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="message">{t.contact.message}</Label>
                  <Textarea id="message" name="message" rows={5} required maxLength={2000} />
                </div>
                {/* Honeypot — hidden from users, bots typically fill any input. */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />
                <div className="sm:col-span-2">

                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                    {t.cta.send}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
