import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTopBar } from "./MobileTopBar";
import { MobileTabBar } from "./MobileTabBar";
import { MobileMoreDrawer } from "./MobileMoreDrawer";

/**
 * Mobile-only app-like chrome: top bar, bottom tab bar, and a "More" drawer.
 * Renders nothing on md+ viewports — desktop keeps its own <Header>/<Footer>.
 */
export function MobileShell() {
  const isMobile = useIsMobile();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!isMobile) return null;

  return (
    <>
      <MobileTopBar />
      <MobileTabBar onOpenMore={() => setMoreOpen(true)} />
      <MobileMoreDrawer open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
