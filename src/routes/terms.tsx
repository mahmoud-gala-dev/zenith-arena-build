import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { useLang } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Egytic Sports" },
      {
        name: "description",
        content:
          "Terms and conditions governing the use of the Egytic Sports website and services.",
      },
      { property: "og:title", content: "Terms & Conditions — Egytic" },
      { property: "og:description", content: "Terms governing the use of our website and services." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { lang } = useLang();
  const ar = lang === "ar";

  const tx = ar
    ? {
        eyebrow: "الشروط",
        title: "الشروط والأحكام",
        sub: "آخر تحديث: يناير 2026.",
        sections: [
          { h: "قبول الشروط", p: "باستخدامك لهذا الموقع فإنك توافق على الالتزام بهذه الشروط. إذا كنت لا توافق، يُرجى عدم استخدام الموقع." },
          { h: "استخدام الموقع", p: "يُتاح المحتوى للاستخدام الشخصي والتجاري المشروع. يُحظر أي استخدام يخالف القوانين المعمول بها أو يسيء إلى الخدمة." },
          { h: "الملكية الفكرية", p: "جميع النصوص والصور والعلامات التجارية والشعارات ملك لإيجيتك أو مرخّصة لها ومحمية بموجب قوانين الملكية الفكرية." },
          { h: "المحتوى المُقدَّم", p: "بإرسالك أي معلومات (مثل طلبات عروض الأسعار)، تؤكد أنها دقيقة وأنك مخوّل بتقديمها." },
          { h: "إخلاء المسؤولية", p: "يُقدَّم هذا الموقع كما هو دون ضمانات. لا نتحمّل مسؤولية أي أضرار غير مباشرة ناتجة عن استخدامه." },
          { h: "القانون المعمول به", p: "تخضع هذه الشروط لقوانين المملكة العربية السعودية، وأي نزاع يخضع للاختصاص الحصري لمحاكمها." },
          { h: "التواصل", p: "لأي استفسار قانوني، تواصل معنا على legal@apexsports.co." },
        ],
      }
    : {
        eyebrow: "Terms",
        title: "Terms & Conditions",
        sub: "Last updated: January 2026.",
        sections: [
          { h: "Acceptance", p: "By using this website you agree to be bound by these terms. If you do not agree, please do not use the site." },
          { h: "Use of the site", p: "Content is made available for legitimate personal and business use. Any use that violates applicable law or interferes with the service is prohibited." },
          { h: "Intellectual property", p: "All text, images, marks, and logos are owned by or licensed to Egytic and are protected by intellectual property laws." },
          { h: "Submitted content", p: "By submitting any information (such as a quote request), you confirm it is accurate and that you are authorised to submit it." },
          { h: "Disclaimer", p: "This site is provided \"as is\" without warranties. We are not liable for any indirect damages arising from its use." },
          { h: "Governing law", p: "These terms are governed by the laws of the Kingdom of Saudi Arabia, and any dispute is subject to the exclusive jurisdiction of its courts." },
          { h: "Contact", p: "For legal inquiries, contact legal@apexsports.co." },
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
