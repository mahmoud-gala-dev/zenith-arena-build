import { useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { submitLead } from "@/lib/leads.functions";
import { useContactInfo } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLang } from "@/i18n/LanguageProvider";
import { LeadSuccessDialog, type LeadSummary } from "@/components/site/LeadSuccessDialog";
import { WhatsAppSendButton } from "@/components/site/WhatsAppSendButton";

interface Props {
  serviceSlug: string;
  serviceTitle: string;
}

export function ServiceQuoteForm({ serviceSlug, serviceTitle }: Props) {
  const { lang, t: T } = useLang();
  const ar = lang === "ar";
  const contact = useContactInfo();

  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const submit = useServerFn(submitLead);

  const t = T.components.serviceQuote;
  const subtitle = `${t.subtitlePrefix} ${serviceTitle}. ${t.subtitleSuffix}`;
  const mailBody = `${t.mailBodyPrefix} "${serviceTitle}".`;
  const mailHref = contact.email
    ? `mailto:${contact.email}?subject=${encodeURIComponent(`[${serviceTitle}] ${t.mailSubjectSuffix}`)}&body=${encodeURIComponent(mailBody)}`
    : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const website = String(fd.get("website") ?? "");
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedMessage = message.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) { toast.error(t.invalidEmail); return; }
    const digits = trimmedPhone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) { toast.error(t.invalidPhone); return; }

    setSubmitting(true);
    try {
      await submit({
        data: {
          type: "quote",
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          service: serviceSlug,
          message: trimmedMessage || `Inline request from /services/${serviceSlug}`,
          preferred_contact: "email",
          website,
        },
      });
      setSummary({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone || null,
        service: serviceSlug,
        serviceLabel: serviceTitle,
        message: trimmedMessage || null,
        intent: "quote",
        source: `service:${serviceSlug}`,
      });
      setSent(true);
      setSuccessOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <section className="relative overflow-hidden border-t border-border bg-gradient-to-b from-secondary/30 via-background to-background py-16">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-primary/5 blur-2xl" aria-hidden />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
          <div className="grid gap-0 md:grid-cols-5">
            <div className="relative bg-primary/5 p-8 md:col-span-2 md:border-r rtl:md:border-r-0 rtl:md:border-l border-border">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{t.eyebrow}</span>
              <h2 className="mt-4 text-2xl font-bold text-foreground leading-tight">{t.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>

              <div className="mt-8 space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.or}</p>
                <WhatsAppSendButton
                  label={t.whatsapp}
                  source={`service_quote_form:${serviceSlug}`}
                  className="w-full"
                  fields={{
                    name,
                    email,
                    phone,
                    message,
                    service: serviceTitle,
                  }}
                />
                {mailHref && (
                  <a href={mailHref}
                     className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition">
                    <Mail className="h-4 w-4 text-primary" /> {t.email_us}
                  </a>
                )}
              </div>
            </div>

            <div className="p-8 md:col-span-3">
              {sent ? (
                <div className="flex flex-col items-center justify-center text-center py-10 animate-fade-in">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                    <Send className="relative h-16 w-16 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-foreground">{t.success}</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm">{t.successBody}</p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="hero" onClick={() => setSuccessOpen(true)}>
                      {ar ? "عرض ملخص الطلب" : "View submission"}
                    </Button>
                    <Button variant="outline" onClick={() => setSent(false)}>{t.another}</Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <input type="text" name="website" tabIndex={-1} autoComplete="off"
                         className="absolute left-[-9999px] h-0 w-0 opacity-0" aria-hidden="true" />
                  <div>
                    <Label htmlFor="sq-name">{t.name}</Label>
                    <Input id="sq-name" name="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="sq-email">{t.email}</Label>
                      <Input id="sq-email" name="email" type="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="sq-phone">{t.phone}</Label>
                      <Input id="sq-phone" name="phone" type="tel" required maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="sq-message">{t.message}</Label>
                    <Textarea id="sq-message" name="message" rows={3} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1.5" />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="submit" variant="hero" className="flex-1" disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {submitting ? t.submitting : t.submit}
                    </Button>
                    <WhatsAppSendButton
                      variant="solid"
                      label={ar ? "إرسال عبر واتساب" : "Send via WhatsApp"}
                      source={`service_quote_form_inline:${serviceSlug}`}
                      fields={{ name, email, phone, message, service: serviceTitle }}
                    />
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
    <LeadSuccessDialog open={successOpen} onOpenChange={setSuccessOpen} summary={summary} />
    </>
  );
}
