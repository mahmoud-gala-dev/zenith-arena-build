import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { pageBySlugQueryOptions } from "@/lib/queries";
import { buildLegalHead } from "@/lib/legal-head";

export const Route = createFileRoute("/terms")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(pageBySlugQueryOptions("terms")),
  head: ({ loaderData }) =>
    buildLegalHead(loaderData, {
      fallbackTitleEn: "Terms & Conditions — Egytic Sports",
      fallbackTitleAr: "الشروط والأحكام — إيجيتك سبورتس",
      fallbackDescEn:
        "Terms and conditions governing the use of the Egytic Sports website and services.",
      fallbackDescAr:
        "الشروط والأحكام التي تحكم استخدام موقع وخدمات إيجيتك سبورتس.",
    }),
  component: () => (
    <LegalPage slug="terms" eyebrowEn="Terms" eyebrowAr="الشروط" />
  ),
});
