import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";
import { SplashScreen } from "./SplashScreen";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SplashScreen />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
