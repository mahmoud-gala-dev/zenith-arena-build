import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { pageBySlugQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Egytic Sports" },
      { name: "description", content: "Terms and conditions governing the use of the Egytic Sports website and services." },
      { property: "og:title", content: "Terms & Conditions — Egytic" },
      { property: "og:description", content: "Terms governing the use of our website and services." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(pageBySlugQueryOptions("terms"));
  },
  component: () => <LegalPage slug="terms" eyebrowEn="Terms" eyebrowAr="الشروط" />,
});
