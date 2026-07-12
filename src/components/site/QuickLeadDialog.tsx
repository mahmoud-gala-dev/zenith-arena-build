import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Phone, MessageCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLang } from "@/i18n/LanguageProvider";
import { useContactInfo, useSocialLinks, toWhatsAppNumber } from "@/lib/settings";
import { submitLead } from "@/lib/leads.functions";
import { trackEvent } from "@/lib/analytics";
import { LeadSuccessDialog, type LeadSummary } from "@/components/site/LeadSuccessDialog";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Where the dialog was opened from — powers analytics + lead attribution. */
  source: string;
  /** "callback" = brief call-me-back form; "quote" = short quote request. */
  intent?: "callback" | "quote";
};

export function QuickLeadDialog({ open, onOpenChange, source, intent = "callback" }: Props) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const contact = useContactInfo();
  const social = useSocialLinks();
  const wa = toWhatsAppNumber(social.whatsapp || contact.whatsapp);
  const submit = useServerFn(submitLead);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [summary, setSummary] = useState<LeadSummary | null>(null);

  useEffect(() => {
    if (open) trackEvent({ name: "quick_lead_open", source });
  }, [open, source]);

  const title =
    intent === "quote"
      ? t.components.quickLead.quoteTitle
      : t.components.quickLead.callbackTitle;
  const desc =
    intent === "quote"
      ? t.components.quickLead.quoteDesc
      : t.components.quickLead.callbackDesc;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setBusy(true);
    try {
      const contextLine = `\n\n[source: ${source}]`;
      await submit({
        data: {
          type: intent === "quote" ? "quote" : "contact",
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          message: (message.trim() || (intent === "callback" ? t.components.quickLead.callbackFromHeader : "")) + contextLine,
          preferred_contact: phone.trim() ? "phone" : "email",
          website,
        },
      });
      trackEvent({
        name: "quick_lead_submit",
        source,
        type: intent,
        has_phone: Boolean(phone.trim()),
      });
      toast.success(t.components.quickLead.thanks);
      setSummary({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        message: message.trim() || null,
        intent: intent === "quote" ? "quote" : "callback",
        source,
      });
      setName(""); setPhone(""); setEmail(""); setMessage("");
      onOpenChange(false);
      setSuccessOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      trackEvent({ name: "quick_lead_error", source, message: msg });
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const waHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(
        t.components.quickLead.waHi,
      )}`
    : null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir={ar ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              onClick={() => trackEvent({ name: "header_phone_click", surface: "dialog", phone: contact.phone })}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              <Phone className="h-4 w-4" />
              {t.components.quickLead.callNow}
            </a>
          )}
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent({ name: "header_whatsapp_click", surface: "dialog", number: wa! })}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          )}
        </div>

        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center"><span className="bg-background px-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{t.components.quickLead.or}</span></div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3">
          {/* Honeypot */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
            aria-hidden
          />
          <div className="grid gap-1.5">
            <Label htmlFor="ql-name">{t.components.quickLead.name}</Label>
            <Input id="ql-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ql-phone">{t.components.quickLead.phone}</Label>
              <Input id="ql-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} dir="ltr" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ql-email">{t.components.quickLead.email}</Label>
              <Input id="ql-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} dir="ltr" />
            </div>
          </div>
          {intent === "quote" && (
            <div className="grid gap-1.5">
              <Label htmlFor="ql-msg">{t.components.quickLead.projectDetails}</Label>
              <Textarea id="ql-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
            </div>
          )}

          <Button type="submit" variant="hero" className="mt-1 h-11 rounded-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (intent === "quote" ? t.components.quickLead.sendRequest : t.components.quickLead.requestCallback)}
            {!busy && <Arrow className="h-4 w-4" />}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            {t.components.quickLead.needFullForm}
            <Link
              to="/quote"
              onClick={() => {
                trackEvent({ name: "header_cta_click", surface: "main_bar", action: "full_form" });
                onOpenChange(false);
              }}
              className="font-semibold text-primary hover:underline"
            >
              {t.components.quickLead.openQuotePage}
            </Link>
          </p>
        </form>
      </DialogContent>
    </Dialog>
    <LeadSuccessDialog open={successOpen} onOpenChange={setSuccessOpen} summary={summary} />
    </>
  );
}
