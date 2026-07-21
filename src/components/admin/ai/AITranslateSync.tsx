import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Languages, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { aiTranslate } from "@/lib/ai/ai.functions";
import { useCan } from "@/lib/rbac";

type Props = {
  enValue: string;
  arValue: string;
  onSetEn: (next: string) => void;
  onSetAr: (next: string) => void;
  label?: string;
};

/**
 * Bilingual sync — one click translates EN→AR or AR→EN.
 * Drop into any editor with paired EN/AR fields.
 */
export function AITranslateSync({ enValue, arValue, onSetEn, onSetAr, label }: Props) {
  const { can } = useCan("content.ai.run");
  const [busy, setBusy] = useState<"en2ar" | "ar2en" | null>(null);
  const translateFn = useServerFn(aiTranslate);

  if (!can) return null;

  async function run(dir: "en2ar" | "ar2en") {
    const src = dir === "en2ar" ? enValue : arValue;
    if (!src?.trim()) {
      toast.error("Source field is empty");
      return;
    }
    setBusy(dir);
    try {
      const to = dir === "en2ar" ? "ar" : "en";
      const res = await translateFn({ data: { text: src, to, from: "auto" } });
      (dir === "en2ar" ? onSetAr : onSetEn)(res.text);
      toast.success(`Translated → ${to.toUpperCase()}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Translation failed");
    } finally {
      setBusy(null);
    }
  }

  const btn =
    "h-7 rounded-full border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 " +
    "px-3 text-[11px] font-medium text-primary shadow-sm transition-all " +
    "hover:from-primary/20 hover:to-primary/10 hover:border-primary/40 hover:shadow-md hover:text-primary " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-primary/20 bg-primary/[0.03] px-2 py-1">
      <Languages className="h-3.5 w-3.5 text-primary/70" />
      {label && <span className="text-[11px] text-muted-foreground">{label}</span>}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={btn}
        disabled={busy !== null || !enValue?.trim()}
        onClick={() => run("en2ar")}
      >
        {busy === "en2ar" ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : null}
        EN <ArrowRight className="h-3 w-3 mx-1" /> AR
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={btn}
        disabled={busy !== null || !arValue?.trim()}
        onClick={() => run("ar2en")}
      >
        {busy === "ar2en" ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : null}
        AR <ArrowLeft className="h-3 w-3 mx-1" /> EN
      </Button>
    </div>
  );
}
