import { useState } from "react";
import { Loader2, Mail, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { submitLead } from "@/lib/leads.functions";
import { useContactInfo, useSocialLinks, toWhatsAppNumber } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLang } from "@/i18n/LanguageProvider";
import { LeadSuccessDialog, type LeadSummary } from "@/components/site/LeadSuccessDialog";

interface Props {
  serviceSlug: string;
  serviceTitle: string;
}

export function ServiceQuoteForm({ serviceSlug, serviceTitle }: Props) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const contact = useContactInfo();
  const social = useSocialLinks();
  const waNumber = toWhatsAppNumber(social.whatsapp || contact.whatsapp);

  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [successOpen, setSuccessOpen] = useState(false);
  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const submit = useServerFn(submitLead);

  const t = ar
    ? {
        eyebrow: "طلب سريع",
        title: "احصل على عرض سعر لهذه الخدمة",
        subtitle: `تواصل مع فريقنا الهندسي للحصول على عرض مخصص لخدمة ${serviceTitle}. الرد خلال 48 ساعة.`,
        name: "الاسم الكامل",
        email: "البريد الإلكتروني",
        phone: "رقم الجوال",
        message: "تفاصيل المشروع (اختياري)",
        submit: "أرسل الطلب",
        submitting: "جارٍ الإرسال…",
        or: "أو",
        whatsapp: "تواصل عبر واتساب",
        email_us: "راسلنا عبر البريد",
        success: "تم استلام طلبك بنجاح",
        successBody: "سيتواصل معك فريق المبيعات خلال 48 ساعة.",
        another: "إرسال طلب آخر",
        invalidEmail: "بريد إلكتروني غير صالح",
        invalidPhone: "رقم جوال غير صالح",
        error: "تعذّر إرسال الطلب — حاول مجددًا.",
      }
    : {
        eyebrow: "Quick request",
        title: "Get a quote for this service",
        subtitle: `Talk to our engineers about ${serviceTitle}. We respond within 48 hours.`,
        name: "Full name",
        email: "Email address",
        phone: "Phone number",
        message: "Project details (optional)",
        submit: "Send request",
        submitting: "Sending…",
        or: "or",
        whatsapp: "Chat on WhatsApp",
        email_us: "Email us",
        success: "Request received",
        successBody: "Our sales team will reach out within 48 hours.",
        another: "Send another request",
        invalidEmail: "Invalid email address",
        invalidPhone: "Invalid phone number",
        error: "Could not send request — please try again.",
      };

  const waMessage = ar
    ? `مرحبًا، أرغب في الحصول على عرض سعر لخدمة "${serviceTitle}".`
    : `Hi, I'd like a quote for "${serviceTitle}".`;
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`
    : null;
  const mailHref = contact.email
    ? `mailto:${contact.email}?subject=${encodeURIComponent(`[${serviceTitle}] ${ar ? "طلب عرض سعر" : "Quote request"}`)}&body=${encodeURIComponent(waMessage)}`
    : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();
    const website = String(fd.get("website") ?? "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error(t.invalidEmail); return; }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) { toast.error(t.invalidPhone); return; }

    setSubmitting(true);
    try {
      await submit({
        data: {
          type: "quote",
          name,
          email,
          phone,
          service: serviceSlug,
          message: message || `Inline request from /services/${serviceSlug}`,
          preferred_contact: "email",
          website,
        },
      });
      setFormData({ name, phone, email });
      setSummary({
        name,
        email,
        phone: phone || null,
        service: serviceSlug,
        serviceLabel: serviceTitle,
        message: message || null,
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
      {/* Ambient accents */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-primary/5 blur-2xl" aria-hidden />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
          <div className="grid gap-0 md:grid-cols-5">
            {/* Left panel — intro + fallbacks */}
            <div className="relative bg-primary/5 p-8 md:col-span-2 md:border-r rtl:md:border-r-0 rtl:md:border-l border-border">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{t.eyebrow}</span>
              <h2 className="mt-4 text-2xl font-bold text-foreground leading-tight">{t.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{t.subtitle}</p>

              <div className="mt-8 space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.or}</p>
                {waHref && (
                  <a href={waHref} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition">
                    <MessageCircle className="h-4 w-4 text-primary" /> {t.whatsapp}
                  </a>
                )}
                {mailHref && (
                  <a href={mailHref}
                     className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition">
                    <Mail className="h-4 w-4 text-primary" /> {t.email_us}
                  </a>
                )}
              </div>
            </div>

            {/* Right panel — form */}
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
                  {/* Honeypot */}
                  <input type="text" name="website" tabIndex={-1} autoComplete="off"
                         className="absolute left-[-9999px] h-0 w-0 opacity-0" aria-hidden="true" />
                  <div>
                    <Label htmlFor="sq-name">{t.name}</Label>
                    <Input id="sq-name" name="name" required maxLength={100} defaultValue={formData.name} className="mt-1.5" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="sq-email">{t.email}</Label>
                      <Input id="sq-email" name="email" type="email" required maxLength={255} defaultValue={formData.email} className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="sq-phone">{t.phone}</Label>
                      <Input id="sq-phone" name="phone" type="tel" required maxLength={30} defaultValue={formData.phone} className="mt-1.5" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="sq-message">{t.message}</Label>
                    <Textarea id="sq-message" name="message" rows={3} maxLength={2000} className="mt-1.5" />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {submitting ? t.submitting : t.submit}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
