import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { pageBySlugQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Egytic Sports" },
      { name: "description", content: "How Egytic collects, uses and protects personal information submitted through our website and services." },
      { property: "og:title", content: "Privacy Policy — Egytic" },
      { property: "og:description", content: "How we handle your personal information." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(pageBySlugQueryOptions("privacy"));
  },
  component: () => <LegalPage slug="privacy" eyebrowEn="Privacy" eyebrowAr="الخصوصية" />,
});
