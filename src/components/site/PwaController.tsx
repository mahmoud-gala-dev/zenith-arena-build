import { useEffect, useState } from "react";
import { registerPwa } from "@/lib/pwa/register";

type Bip = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const INSTALL_DISMISS_KEY = "egytic:pwa:install-dismissed";
const UPDATE_DISMISS_KEY = "egytic:pwa:update-dismissed";

/**
 * Client-only PWA controller:
 * - Registers the service worker via the guarded wrapper.
 * - Captures `beforeinstallprompt` for an in-app install button.
 * - Surfaces "new version available" with a one-click reload.
 * Renders nothing on the server (Suspense/SSR-safe).
 */
export function PwaController() {
  const [installEvt, setInstallEvt] = useState<Bip | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [update, setUpdate] = useState<null | (() => Promise<void>)>(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  useEffect(() => {
    setInstallDismissed(localStorage.getItem(INSTALL_DISMISS_KEY) === "1");
    setUpdateDismissed(false); // update banner is per-session

    const onBip = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as Bip);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);

    // Fire-and-forget; the wrapper handles all guards internally.
    void registerPwa(({ updateAndReload }) => setUpdate(() => updateAndReload));

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const showInstall = !!installEvt && !installed && !installDismissed;
  const showUpdate = !!update && !updateDismissed;

  if (!showInstall && !showUpdate) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+16px)] z-[60] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      {showUpdate && (
        <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-border/50 bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
          <span className="flex-1 text-sm">
            نسخة جديدة متاحة · A new version is available.
          </span>
          <button
            type="button"
            onClick={() => void update?.()}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => setUpdateDismissed(true)}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Dismiss update"
          >
            ✕
          </button>
        </div>
      )}
      {showInstall && (
        <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-border/50 bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
          <img src="/icon.png" alt="" className="h-8 w-8 rounded-md" />
          <div className="flex-1 text-sm leading-tight">
            <div className="font-semibold">Install Egytic</div>
            <div className="text-xs text-muted-foreground">
              أضف التطبيق إلى الشاشة الرئيسية للوصول السريع.
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!installEvt) return;
              await installEvt.prompt();
              const res = await installEvt.userChoice;
              if (res.outcome === "dismissed") {
                localStorage.setItem(INSTALL_DISMISS_KEY, "1");
                setInstallDismissed(true);
              }
              setInstallEvt(null);
            }}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Install
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(INSTALL_DISMISS_KEY, "1");
              setInstallDismissed(true);
            }}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Dismiss install"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
