import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Download, Loader2, Lock, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { submitLead } from "@/lib/leads.functions";
import { getDownloadSignedUrl } from "@/lib/downloads.functions";
import { trackDownloadEvent } from "@/lib/downloadTracking";
import { useLang } from "@/i18n/LanguageProvider";

type Size = "default" | "sm" | "lg";
type Variant = "default" | "secondary" | "outline";

interface Props {
  fileUrl: string | null;
  title: string;
  slug: string;
  downloadId?: string | null;
  requiresLead: boolean;
  label: string;
  size?: Size;
  variant?: Variant;
  className?: string;
  children?: ReactNode;
}

export function DownloadGateButton({
  fileUrl,
  title,
  slug,
  downloadId = null,
  requiresLead,
  label,
  size = "default",
  variant = "default",
  className,
}: Props) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", website: "" });
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const submit = useServerFn(submitLead);
  const sign = useServerFn(getDownloadSignedUrl);

  useEffect(() => {
    let cancelled = false;
    supabase.from("settings").select("value").eq("key", "contact_info").maybeSingle().then(({ data }) => {
      if (cancelled) return;
      const v = (data?.value ?? {}) as { whatsapp?: string; phone?: string };
      const raw = (v.whatsapp || v.phone || "").trim();
      const digits = raw.replace(/[^\d]/g, "");
      setWhatsapp(digits || null);
    });
    return () => { cancelled = true; };
  }, []);

  async function openSignedUrl(): Promise<string | null> {
    if (!downloadId) {
      toast.error(ar ? "الملف غير متاح" : "File unavailable");
      return null;
    }
    try {
      const { url } = await sign({ data: { downloadId } });
      setDownloadUrl(url);
      const win = window.open(url, "_blank", "noopener,noreferrer");
      setPopupBlocked(!win);
      return url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ar ? "تعذّر إنشاء رابط التحميل" : "Could not create download link");
      return null;
    }
  }

  if (!fileUrl) {
    return (
      <Button size={size} variant={variant} disabled className={className}>
        <Download className="h-4 w-4" /> {label}
      </Button>
    );
  }

  if (!requiresLead) {
    return (
      <Button
        size={size}
        variant={variant}
        className={className}
        disabled={fetchingUrl}
        onClick={async () => {
          setFetchingUrl(true);
          try {
            const url = await openSignedUrl();
            if (url) void trackDownloadEvent("download", downloadId);
          } finally {
            setFetchingUrl(false);
          }
        }}
      >
        {fetchingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {label}
      </Button>
    );
  }


  const T = ar
    ? {
        title: "املأ البيانات لبدء التحميل",
        desc: "نستخدم بياناتك فقط لإرسال روابط التحميل والتحديثات ذات الصلة.",
        name: "الاسم الكامل",
        email: "البريد الإلكتروني",
        phone: "رقم الجوال",
        cancel: "إلغاء",
        cta: "بدء التحميل",
        sending: "جارٍ الإرسال…",
        success: "تم — يبدأ التحميل الآن",
        error: "تعذّر الإرسال. حاول مرة أخرى.",
        required: "الرجاء تعبئة الاسم والبريد ورقم الجوال.",
        invalidEmail: "صيغة البريد الإلكتروني غير صحيحة.",
        invalidPhone: "رقم الجوال غير صحيح (7 أرقام على الأقل).",
        duplicate: "لقد أرسلت طلبًا لهذا الملف بالفعل. جارٍ فتح رابط التحميل…",
        successTitle: "تم استلام بياناتك بنجاح",
        successDesc: "بدأ تحميلك. للتحدث مع فريق المبيعات مباشرة، تواصل معنا عبر واتساب.",
        whatsapp: "تواصل مع المبيعات عبر واتساب",
        close: "إغلاق",
        waMsg: (t: string) => `مرحبًا، طلبت تحميل: ${t}. أود التحدث مع فريق المبيعات.`,
      }
    : {
        title: "Enter your details to start the download",
        desc: "We use your info only to send download links and related updates.",
        name: "Full name",
        email: "Email",
        phone: "Phone",
        cancel: "Cancel",
        cta: "Start download",
        sending: "Sending…",
        success: "Thanks — your download is starting",
        error: "Could not submit. Please try again.",
        required: "Name, email and phone are required.",
        invalidEmail: "Please enter a valid email address.",
        invalidPhone: "Please enter a valid phone number (min 7 digits).",
        duplicate: "You already requested this file. Reopening your download…",
        successTitle: "Your details were received",
        successDesc: "Your download has started. To talk to our sales team directly, message us on WhatsApp.",
        whatsapp: "Chat with sales on WhatsApp",
        close: "Close",
        waMsg: (t: string) => `Hi, I just requested the ${t} catalog. I'd like to talk to sales.`,
      };

  const dedupeKey = `dl-lead:${slug}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    if (!name || !email || !phone) {
      toast.error(T.required);
      return;
    }
    // RFC-lite email pattern.
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    if (!emailOk) {
      toast.error(T.invalidEmail);
      return;
    }
    // Phone: allow +, spaces, dashes, parentheses; require ≥7 digits total.
    const digits = phone.replace(/\D/g, "");
    const phoneOk = /^[+\d][\d\s\-()]{5,}$/.test(phone) && digits.length >= 7 && digits.length <= 15;
    if (!phoneOk) {
      toast.error(T.invalidPhone);
      return;
    }
    // Client-side dedupe — same catalog already submitted from this browser.
    try {
      const prev = typeof window !== "undefined" ? window.localStorage.getItem(dedupeKey) : null;
      if (prev && Date.now() - Number(prev) < 24 * 60 * 60 * 1000) {
        toast.info(T.duplicate);
        setSubmitted(true);
        void trackDownloadEvent("download", downloadId);
        await openSignedUrl();
        return;
      }
    } catch { /* localStorage unavailable */ }

    setSubmitting(true);
    try {
      await submit({
        data: {
          type: "contact",
          name,
          email,
          phone,
          service: `Download: ${title}`,
          message: `Download requested: ${title} (/downloads/${slug})`,
          website: form.website,
        },
      });
      try { window.localStorage.setItem(dedupeKey, String(Date.now())); } catch { /* ignore */ }
      toast.success(T.success);
      setSubmitted(true);
      void trackDownloadEvent("download", downloadId);
      await openSignedUrl();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : T.error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
      >
        <Lock className="h-4 w-4" /> {label}
      </Button>
      <Dialog open={open} onOpenChange={(v) => {
        if (submitting) return;
        setOpen(v);
        if (!v) { setSubmitted(false); setForm({ name: "", email: "", phone: "", website: "" }); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{submitted ? T.successTitle : T.title}</DialogTitle>
            <DialogDescription>{submitted ? T.successDesc : T.desc}</DialogDescription>
          </DialogHeader>
          {submitted ? (
            <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>{T.success}</span>
              </div>
              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(T.waMsg(title))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1ebe57] transition"
                >
                  <MessageCircle className="h-4 w-4" /> {T.whatsapp}
                </a>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>{T.close}</Button>
              </DialogFooter>
            </div>
          ) : (
          <form onSubmit={onSubmit} className="space-y-4" dir={ar ? "rtl" : "ltr"}>
            <div className="space-y-1.5">
              <Label htmlFor="dl-name">{T.name}</Label>
              <Input
                id="dl-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoComplete="name"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dl-email">{T.email}</Label>
              <Input
                id="dl-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                autoComplete="email"
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dl-phone">{T.phone}</Label>
              <Input
                id="dl-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                autoComplete="tel"
                required
                maxLength={30}
              />
            </div>
            {/* Honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              className="hidden"
              aria-hidden="true"
            />
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                {T.cancel}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {T.sending}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> {T.cta}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
