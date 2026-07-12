import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { translations, type Dict, type Lang } from "./translations";
import { translationsQueryOptions } from "@/lib/queries";

interface LanguageContextValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: Dict;
  isRTL: boolean;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "apex-lang";

/** Deep-clone the static dict and override leaves whose dot-path is present in the DB overrides map. */
function mergeOverrides(base: Dict, overrides: Record<string, string> | undefined): Dict {
  if (!overrides || Object.keys(overrides).length === 0) return base;
  // Structured clone keeps nested objects intact
  const clone = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value !== "string" || value.length === 0) continue;
    const parts = key.split(".");
    let node: Record<string, unknown> = clone;
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      const next = node[seg];
      if (typeof next !== "object" || next === null) {
        node[seg] = {};
      }
      node = node[seg] as Record<string, unknown>;
    }
    node[parts[parts.length - 1]] = value;
  }
  return clone as unknown as Dict;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const { data: overrides } = useQuery(translationsQueryOptions);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("lang");
    if (fromUrl === "ar" || fromUrl === "en") {
      setLangState(fromUrl);
      window.localStorage.setItem(STORAGE_KEY, fromUrl);
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "ar" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", dir);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get("lang") !== next) {
          url.searchParams.set("lang", next);
          window.history.replaceState(window.history.state, "", url.toString());
        }
      } catch {
        /* noop */
      }
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "ar" : "en");
  }, [lang, setLang]);

  const t = useMemo<Dict>(() => {
    const base = translations[lang];
    return mergeOverrides(base, overrides?.[lang]);
  }, [lang, overrides]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      isRTL: lang === "ar",
      t,
      setLang,
      toggleLang,
    }),
    [lang, t, setLang, toggleLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

/** Pick a localized value from a { en, ar } content object. */
export function useLocalized() {
  const { lang } = useLang();
  return function pick<T>(obj: { en: T; ar: T }): T {
    return obj[lang];
  };
}
