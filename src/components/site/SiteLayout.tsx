import { useEffect, type ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";
import { SplashScreen } from "./SplashScreen";
import { MobileShell } from "./mobile/MobileShell";
import { PageTransition } from "./PageTransition";
import { captureAttribution } from "@/lib/attribution";

export function SiteLayout({ children }: { children: ReactNode }) {
  // Capture campaign / referrer data on the first public page view of the visit
  // so any lead submitted later carries the channel that produced it.
  useEffect(() => {
    captureAttribution();
  }, []);

  return (

    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 rtl:focus:left-auto rtl:focus:right-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-elegant focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <SplashScreen />
      <Header />
      <MobileShell />
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-dvh pt-16 pb-[calc(env(safe-area-inset-bottom)+4.75rem)] md:pt-0 md:pb-0 focus:outline-none"
      >
        <PageTransition>{children}</PageTransition>
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  );
}
