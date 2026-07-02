import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";
import { SplashScreen } from "./SplashScreen";
import { MobileShell } from "./mobile/MobileShell";
import { PageTransition } from "./PageTransition";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SplashScreen />
      <Header />
      <MobileShell />
      <main
        className="min-h-screen pt-14 md:pt-0"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 4.75rem)" }}
      >
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
