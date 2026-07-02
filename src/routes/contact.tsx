import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Clock, CheckCircle2, MessageCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
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
import { services, WHATSAPP_NUMBER } from "@/lib/site-data";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const { t } = useLang();
  const L = useLocalized();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projectType, setProjectType] = useState("");

  const schema = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255),
    message: z.string().trim().min(1).max(2000),
  });

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
    };
    const check = schema.safeParse(payload);
    if (!check.success) return toast.error(check.error.issues[0].message);
    setSubmitting(true);
    const { error } = await supabase.from("leads").insert(payload as never);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setSent(true);
  }


  return (
    <SiteLayout>
      <PageHero eyebrow={t.nav.contact} title={t.contact.title} subtitle={t.contact.sub} />

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="space-y-5 lg:col-span-1">
            {[
              { icon: MapPin, label: t.contact.office, value: "Riyadh · Dubai · Doha" },
              { icon: Phone, label: t.contact.phone, value: "+966 5X XXX XXXX" },
              { icon: Mail, label: t.contact.email, value: "hello@apexsports.co" },
              { icon: Clock, label: t.contact.hours, value: t.contact.hours },
            ].map((c, i) => (
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
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 py-4 font-semibold text-primary-foreground shadow-soft"
            >
              <MessageCircle className="h-5 w-5" />
              {t.cta.whatsapp}
            </a>
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
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{L(s.title)}</SelectItem>
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
