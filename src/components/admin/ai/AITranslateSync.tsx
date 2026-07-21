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

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy !== null || !enValue?.trim()}
        onClick={() => run("en2ar")}
      >
        {busy === "en2ar" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Languages className="h-3.5 w-3.5 mr-1.5" />}
        EN <ArrowRight className="h-3.5 w-3.5 mx-1" /> AR
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy !== null || !arValue?.trim()}
        onClick={() => run("ar2en")}
      >
        {busy === "ar2en" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Languages className="h-3.5 w-3.5 mr-1.5" />}
        AR <ArrowLeft className="h-3.5 w-3.5 mx-1" /> EN
      </Button>
    </div>
  );
}
