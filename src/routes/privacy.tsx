import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { pageBySlugQueryOptions } from "@/lib/queries";
import { buildLegalHead } from "@/lib/legal-head";

export const Route = createFileRoute("/privacy")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(pageBySlugQueryOptions("privacy")),
  head: ({ loaderData }) =>
    buildLegalHead(loaderData, {
      fallbackTitleEn: "Privacy Policy — Egytic Sports",
      fallbackTitleAr: "سياسة الخصوصية — إيجيتك سبورتس",
      fallbackDescEn:
        "How Egytic collects, uses and protects personal information submitted through our website and services.",
      fallbackDescAr:
        "كيف تجمع إيجيتك المعلومات الشخصية وتستخدمها وتحميها عبر موقعنا وخدماتنا.",
    }),
  component: () => (
    <LegalPage slug="privacy" eyebrowEn="Privacy" eyebrowAr="الخصوصية" />
  ),
});
