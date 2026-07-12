import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { useLang } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Egytic Sports" },
      {
        name: "description",
        content:
          "How Egytic collects, uses and protects personal information submitted through our website and services.",
      },
      { property: "og:title", content: "Privacy Policy — Egytic" },
      { property: "og:description", content: "How we handle your personal information." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { lang } = useLang();
  const ar = lang === "ar";

  const tx = ar
    ? {
        eyebrow: "الخصوصية",
        title: "سياسة الخصوصية",
        sub: "آخر تحديث: يناير 2026.",
        sections: [
          { h: "المعلومات التي نجمعها", p: "نجمع المعلومات التي تقدّمها طوعًا عند طلب عرض سعر أو الاشتراك في نشرتنا الإخبارية أو التواصل معنا، مثل الاسم والبريد الإلكتروني والهاتف وتفاصيل المشروع." },
          { h: "كيف نستخدم معلوماتك", p: "نستخدم معلوماتك للرد على استفساراتك وإعداد عروض الأسعار وتحسين خدماتنا وإرسال تحديثات ذات صلة عند اشتراكك في ذلك." },
          { h: "مشاركة المعلومات", p: "لا نبيع بياناتك. قد نشاركها فقط مع مزودي خدمة موثوقين لتمكين تشغيلنا (استضافة، بريد إلكتروني، تحليلات) وضمن حدود التزامات السرية." },
          { h: "أمن البيانات", p: "نطبق ضوابط إدارية وتقنية لحماية معلوماتك، بما في ذلك التشفير أثناء النقل والوصول المقيّد." },
          { h: "حقوقك", p: "يحق لك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها. تواصل معنا عبر privacy@egyticsports.com." },
          { h: "ملفات تعريف الارتباط", p: "نستخدم ملفات تعريف الارتباط لتشغيل الموقع وقياس الأداء. يمكنك التحكم في تفضيلاتك من إعدادات المتصفح." },
        ],
      }
    : {
        eyebrow: "Privacy",
        title: "Privacy Policy",
        sub: "Last updated: January 2026.",
        sections: [
          { h: "Information we collect", p: "We collect information you voluntarily provide when requesting a quote, subscribing to our newsletter, or contacting us — including name, email, phone, and project details." },
          { h: "How we use your information", p: "We use your information to respond to inquiries, prepare quotes, improve our services, and send relevant updates when you opt in." },
          { h: "Sharing", p: "We do not sell your data. We may share it only with trusted service providers who enable our operations (hosting, email, analytics), under confidentiality obligations." },
          { h: "Data security", p: "We apply administrative and technical safeguards, including encryption in transit and restricted access." },
          { h: "Your rights", p: "You may request access to, correction of, or deletion of your data. Contact us at privacy@egyticsports.com." },
          { h: "Cookies", p: "We use cookies to operate the site and measure performance. You can manage your preferences through your browser settings." },
        ],
      };

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {tx.sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold text-foreground">{s.h}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{s.p}</p>
            </section>
          ))}
        </div>
      </article>
    </SiteLayout>
  );
}
