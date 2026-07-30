import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTurnstileConfig } from "@/lib/security/turnstile.functions";

/**
 * Invisible Cloudflare Turnstile gate for public forms.
 *
 * Mounted once by SiteLayout. Forms call `getTurnstileToken()` right before
 * submitting; a fresh token is produced per submission. When the captcha is not
 * configured the hook resolves to `null` and the server skips verification.
 */

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  execute: (idOrEl: string | HTMLElement, opts?: Record<string, unknown>) => void;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Ctx = { getToken: () => Promise<string | null>; enabled: boolean };

const TurnstileContext = createContext<Ctx>({ getToken: async () => null, enabled: false });

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("turnstile script failed")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile script failed"));
    document.head.appendChild(s);
  });
}

export function TurnstileProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    queryKey: ["turnstile", "config"],
    queryFn: () => getTurnstileConfig(),
    staleTime: 60 * 60 * 1000,
  });
  const siteKey = data?.siteKey ?? null;

  const holderRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const pendingRef = useRef<{ resolve: (t: string | null) => void } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!siteKey || !holderRef.current) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !window.turnstile || !holderRef.current) return;
        widgetIdRef.current = window.turnstile.render(holderRef.current, {
          sitekey: siteKey,
          execution: "execute",
          appearance: "interaction-only",
          "response-field": false,
          callback: (token: string) => {
            pendingRef.current?.resolve(token);
            pendingRef.current = null;
          },
          "error-callback": () => {
            pendingRef.current?.resolve(null);
            pendingRef.current = null;
          },
          "timeout-callback": () => {
            pendingRef.current?.resolve(null);
            pendingRef.current = null;
          },
        });
        setReady(true);
      })
      .catch((err) => console.error("[turnstile]", err));
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
      }
      widgetIdRef.current = null;
    };
  }, [siteKey]);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!siteKey || !ready || !window.turnstile || !widgetIdRef.current) return null;
    const id = widgetIdRef.current;
    try {
      window.turnstile.reset(id);
    } catch {
      /* ignore */
    }
    return new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => {
        if (pendingRef.current) {
          pendingRef.current = null;
          resolve(null);
        }
      }, 20000);
      pendingRef.current = {
        resolve: (t) => {
          clearTimeout(timer);
          resolve(t);
        },
      };
      try {
        window.turnstile!.execute(id);
      } catch {
        clearTimeout(timer);
        pendingRef.current = null;
        resolve(null);
      }
    });
  }, [siteKey, ready]);

  const value = useMemo<Ctx>(() => ({ getToken, enabled: Boolean(siteKey) }), [getToken, siteKey]);

  return (
    <TurnstileContext.Provider value={value}>
      {children}
      <div ref={holderRef} aria-hidden className="fixed bottom-0 left-0 z-[100]" />
    </TurnstileContext.Provider>
  );
}

export function useTurnstile() {
  return useContext(TurnstileContext);
}
