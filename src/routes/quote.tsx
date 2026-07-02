import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Sparkles, Clock, Award, Loader2 } from "lucide-react";
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
import { services } from "@/lib/site-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Request a Quote — APEX Sports Infrastructure" },
      {
        name: "description",
        content:
          "Request a detailed quote for football pitches, running tracks, courts, pools and sports flooring. Our engineers respond within 48 hours.",
      },
      { property: "og:title", content: "Request a Quote — APEX" },
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

  const submitSchema = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(1).max(30),
  });

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
    };
    const check = submitSchema.safeParse(payload);
    if (!check.success) return toast.error(check.error.issues[0].message);
    setSubmitting(true);
    const { error } = await supabase.from("leads").insert(payload as never);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setSent(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        promises: [
          { icon: Clock, t: "رد خلال 48 ساعة", d: "من قبل مهندس أول." },
          { icon: Award, t: "عرض مفصّل", d: "بنود شفافة، بدون تكاليف خفية." },
          { icon: Sparkles, t: "استشارة مجانية", d: "مكالمة أولى لتحديد النطاق." },
        ],
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
        promises: [
          { icon: Clock, t: "48-hour response", d: "From a senior engineer." },
          { icon: Award, t: "Detailed proposal", d: "Transparent line items, no hidden costs." },
          { icon: Sparkles, t: "Free consultation", d: "Initial call to scope your project." },
        ],
      };

  const budgetRanges = ar
    ? ["أقل من 100 ألف $", "100 ألف – 500 ألف $", "500 ألف – 1 مليون $", "1 مليون – 5 مليون $", "أكثر من 5 مليون $"]
    : ["Under $100k", "$100k – $500k", "$500k – $1M", "$1M – $5M", "Over $5M"];

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <aside className="space-y-4 lg:col-span-1">
            {tx.promises.map((p, i) => (
              <div key={i} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <p.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{p.t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.d}</p>
                </div>
              </div>
            ))}
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
              <form
                className="grid gap-5 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="q-name">{tx.name}*</Label>
                  <Input id="q-name" required maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-company">{tx.company}</Label>
                  <Input id="q-company" maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-email">{tx.email}*</Label>
                  <Input id="q-email" type="email" required maxLength={255} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-phone">{tx.phone}*</Label>
                  <Input id="q-phone" type="tel" required maxLength={30} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-country">{tx.country}</Label>
                  <Input id="q-country" maxLength={60} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-city">{tx.city}</Label>
                  <Input id="q-city" maxLength={60} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{tx.service}*</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={tx.service} />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {L(s.title)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-area">{tx.area}</Label>
                  <Input id="q-area" type="number" min={0} />
                </div>
                <div className="space-y-2">
                  <Label>{tx.budget}</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={tx.budget} />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetRanges.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="q-start">{tx.start}</Label>
                  <Input id="q-start" type="date" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="q-message">{tx.message}</Label>
                  <Textarea id="q-message" rows={5} maxLength={2000} />
                </div>
                <div className="space-y-3 sm:col-span-2">
                  <Label>{tx.contactMethod}</Label>
                  <RadioGroup defaultValue="email" className="flex flex-wrap gap-4">
                    {(["email", "phone", "whatsapp"] as const).map((m) => (
                      <label key={m} className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm">
                        <RadioGroupItem value={m} id={`m-${m}`} />
                        <span>{tx.methods[m]}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" variant="hero" size="lg" className="w-full">
                    {tx.submit}
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
