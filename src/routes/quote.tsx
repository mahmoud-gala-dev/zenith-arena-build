import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import * as Icons from "lucide-react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import { useQuery } from "@tanstack/react-query";
import { servicesPublishedQueryOptions } from "@/hooks/useServiceContent";
import { quotePageSettingsQueryOptions } from "@/lib/queries";
import { submitLead } from "@/lib/leads.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { LeadSuccessDialog, type LeadSummary } from "@/components/site/LeadSuccessDialog";
import { WhatsAppSendButton } from "@/components/site/WhatsAppSendButton";



export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Request a Quote — Egytic Sports" },
      {
        name: "description",
        content:
          "Request a detailed quote for football pitches, running tracks, courts, pools and sports flooring. Our engineers respond within 48 hours.",
      },
      { property: "og:title", content: "Request a Quote — Egytic" },
      {
        property: "og:description",
        content: "Detailed proposals from FIFA & World Athletics-certified engineers within 48 hours.",
      },
    ],
  }),
  component: QuotePage,
});

function QuotePage() {
  const { lang } = useLang();
  const L = useLocalized();
  const ar = lang === "ar";
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serviceValue, setServiceValue] = useState("");
  const [budgetValue, setBudgetValue] = useState("");
  const [contactMethod, setContactMethod] = useState("email");
  const [nameVal, setNameVal] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
  const [messageVal, setMessageVal] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const { data: dbServices } = useQuery(servicesPublishedQueryOptions);
  const { data: quotePage } = useQuery(quotePageSettingsQueryOptions);


  const submitSchema = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(1).max(30),
  });

  const submit = useServerFn(submitLead);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      type: "quote" as const,
      name: String(fd.get("name") ?? ""),
      company: String(fd.get("company") ?? "") || null,
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? "") || null,
      country: String(fd.get("country") ?? "") || null,
      city: String(fd.get("city") ?? "") || null,
      service: serviceValue || null,
      project_area: String(fd.get("area") ?? "") || null,
      budget_range: budgetValue || null,
      start_date: String(fd.get("start") ?? "") || null,
      message: String(fd.get("message") ?? "") || null,
      preferred_contact: contactMethod,
      website: String(fd.get("website") ?? ""),
    };
    const check = submitSchema.safeParse(payload);
    if (!check.success) return toast.error(check.error.issues[0].message);
    setSubmitting(true);
    try {
      await submit({ data: payload });
      const svcLabel = dbServices?.find((s) => s.slug_en === serviceValue);
      setSummary({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        service: serviceValue || null,
        serviceLabel: svcLabel ? (ar ? svcLabel.title_ar ?? svcLabel.title_en : svcLabel.title_en) : null,
        message: payload.message,
        intent: "quote",
        source: "quote_page",
      });
      setSent(true);
      setSuccessOpen(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }


  const tx = ar
    ? {
        eyebrow: "طلب عرض سعر",
        title: "احصل على عرض دقيق خلال 48 ساعة",
        sub: "أخبرنا عن مشروعك وسيتواصل معك أحد مهندسينا الأول بعرض تفصيلي.",
        name: "الاسم الكامل",
        company: "الشركة / الجهة",
        email: "البريد الإلكتروني",
        phone: "الهاتف",
        country: "الدولة",
        city: "المدينة",
        projectType: "نوع المشروع",
        sport: "الرياضة",
        service: "الخدمة المطلوبة",
        area: "المساحة التقديرية (م²)",
        budget: "نطاق الميزانية",
        start: "تاريخ البدء المتوقع",
        message: "تفاصيل إضافية",
        contactMethod: "طريقة التواصل المفضلة",
        methods: { email: "البريد", phone: "الهاتف", whatsapp: "واتساب" },
        submit: "إرسال طلب العرض",
        successTitle: "تم استلام طلبك",
        successSub: "سيتواصل معك أحد مهندسينا خلال يوم عمل واحد بعرض تفصيلي.",
        another: "طلب آخر",
      }

    : {
        eyebrow: "Request a Quote",
        title: "Get an accurate proposal within 48 hours",
        sub: "Tell us about your project and one of our senior engineers will respond with a detailed proposal.",
        name: "Full name",
        company: "Company / organization",
        email: "Email",
        phone: "Phone",
        country: "Country",
        city: "City",
        projectType: "Project type",
        sport: "Sport",
        service: "Service required",
        area: "Estimated area (m²)",
        budget: "Budget range",
        start: "Expected start date",
        message: "Additional details",
        contactMethod: "Preferred contact method",
        methods: { email: "Email", phone: "Phone", whatsapp: "WhatsApp" },
        submit: "Send my request",
        successTitle: "Request received",
        successSub: "One of our engineers will be in touch within one business day with a detailed proposal.",
        another: "Send another",
      };

  const budgetRanges = ar
    ? (quotePage?.budget_ranges_ar ?? [])
    : (quotePage?.budget_ranges_en ?? []);
  const promises = quotePage?.promises ?? [];

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <aside className="space-y-4 lg:col-span-1">
            {promises.map((p, i) => {
              const IconCmp = (Icons as unknown as Record<string, typeof CheckCircle2>)[p.icon] ?? CheckCircle2;
              return (
                <div key={i} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                    <IconCmp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{ar ? p.title_ar : p.title_en}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{ar ? p.desc_ar : p.desc_en}</p>
                  </div>
                </div>
              );
            })}
          </aside>


          <div className="rounded-3xl border border-border bg-card p-8 shadow-soft lg:col-span-2">
            {sent ? (
              <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-foreground">{tx.successTitle}</h3>
                <p className="mt-2 max-w-md text-muted-foreground">{tx.successSub}</p>
                <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
                  {tx.another}
                </Button>
              </div>
            ) : (
              <form className="grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

                <div className="space-y-2">
                  <Label htmlFor="q-name">{tx.name}*</Label>
                  <Input id="q-name" name="name" required maxLength={100} value={nameVal} onChange={(e) => setNameVal(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-company">{tx.company}</Label>
                  <Input id="q-company" name="company" maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-email">{tx.email}*</Label>
                  <Input id="q-email" name="email" type="email" required maxLength={255} value={emailVal} onChange={(e) => setEmailVal(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-phone">{tx.phone}*</Label>
                  <Input id="q-phone" name="phone" type="tel" required maxLength={30} value={phoneVal} onChange={(e) => setPhoneVal(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-country">{tx.country}</Label>
                  <Input id="q-country" name="country" maxLength={60} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-city">{tx.city}</Label>
                  <Input id="q-city" name="city" maxLength={60} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{tx.service}*</Label>
                  <Select value={serviceValue} onValueChange={setServiceValue}>
                    <SelectTrigger><SelectValue placeholder={tx.service} /></SelectTrigger>
                    <SelectContent>
                      {(dbServices ?? []).filter((s) => s.slug_en).map((s) => (
                        <SelectItem key={s.id} value={s.slug_en}>
                          {L({ en: s.title_en, ar: s.title_ar ?? s.title_en })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-area">{tx.area}</Label>
                  <Input id="q-area" name="area" type="number" min={0} />
                </div>
                <div className="space-y-2">
                  <Label>{tx.budget}</Label>
                  <Select value={budgetValue} onValueChange={setBudgetValue}>
                    <SelectTrigger><SelectValue placeholder={tx.budget} /></SelectTrigger>
                    <SelectContent>
                      {budgetRanges.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="q-start">{tx.start}</Label>
                  <Input id="q-start" name="start" type="date" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="q-message">{tx.message}</Label>
                  <Textarea id="q-message" name="message" rows={5} maxLength={2000} value={messageVal} onChange={(e) => setMessageVal(e.target.value)} />
                </div>
                <div className="space-y-3 sm:col-span-2">
                  <Label>{tx.contactMethod}</Label>
                  <RadioGroup value={contactMethod} onValueChange={setContactMethod} className="flex flex-wrap gap-4">
                    {(["email", "phone", "whatsapp"] as const).map((m) => (
                      <label key={m} className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm">
                        <RadioGroupItem value={m} id={`m-${m}`} />
                        <span>{tx.methods[m]}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" variant="hero" size="lg" className="flex-1" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : tx.submit}
                  </Button>
                  <WhatsAppSendButton
                    variant="solid"
                    className="sm:w-auto"
                    label={ar ? "إرسال عبر واتساب" : "Send via WhatsApp"}
                    source="quote_page"
                    fields={{
                      name: nameVal,
                      email: emailVal,
                      phone: phoneVal,
                      message: messageVal,
                      service:
                        dbServices?.find((s) => s.slug_en === serviceValue)
                          ? (ar
                              ? dbServices.find((s) => s.slug_en === serviceValue)!.title_ar ?? dbServices.find((s) => s.slug_en === serviceValue)!.title_en
                              : dbServices.find((s) => s.slug_en === serviceValue)!.title_en)
                          : null,
                    }}
                  />
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
      <LeadSuccessDialog open={successOpen} onOpenChange={setSuccessOpen} summary={summary} />
    </SiteLayout>
  );
}
