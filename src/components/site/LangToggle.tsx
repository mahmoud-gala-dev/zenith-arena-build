import { Languages } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export function LangToggle({ light = false }: { light?: boolean }) {
  const { lang, toggleLang } = useLang();
  return (
    <button
      onClick={toggleLang}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
        light
          ? "border-white/25 text-white hover:bg-white/10"
          : "border-border text-foreground hover:bg-accent",
      )}
      aria-label="Toggle language"
    >
      <Languages className="h-3.5 w-3.5" />
      {lang === "en" ? "العربية" : "English"}
    </button>
  );
}
