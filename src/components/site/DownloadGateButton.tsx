import { useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, Lock } from "lucide-react";
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
  const [form, setForm] = useState({ name: "", email: "", phone: "", website: "" });
  const submit = useServerFn(submitLead);
  const sign = useServerFn(getDownloadSignedUrl);

  async function openSignedUrl(): Promise<string | null> {
    if (!downloadId) {
      toast.error(ar ? "الملف غير متاح" : "File unavailable");
      return null;
    }
    try {
      const { url } = await sign({ data: { downloadId } });
      window.open(url, "_blank", "noopener,noreferrer");
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
      };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error(T.required);
      return;
    }
    setSubmitting(true);
    try {
      await submit({
        data: {
          type: "contact",
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          service: `Download: ${title}`,
          message: `Download requested: ${title} (/downloads/${slug})`,
          website: form.website,
        },
      });
      toast.success(T.success);
      setOpen(false);
      setForm({ name: "", email: "", phone: "", website: "" });
      void trackDownloadEvent("download", downloadId);
      window.open(fileUrl!, "_blank", "noopener,noreferrer");
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
      <Dialog open={open} onOpenChange={(v) => !submitting && setOpen(v)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{T.title}</DialogTitle>
            <DialogDescription>{T.desc}</DialogDescription>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    </>
  );
}
