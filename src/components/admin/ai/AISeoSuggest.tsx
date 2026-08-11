import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { aiGenerateSeo } from "@/lib/ai/ai.functions";
import { useCan } from "@/lib/rbac";

type SeoFields = {
  title?: string;
  description?: string;
  keywords?: string[] | string;
  og_title?: string;
  og_description?: string;
};

type Props = {
  content: string;
  subject?: string;
  language?: "en" | "ar";
  onApply: (seo: SeoFields) => void;
  size?: "sm" | "default";
};

export function AISeoSuggest({ content, subject, language = "en", onApply, size = "sm" }: Props) {
  const { can } = useCan("content.ai.run");
  const [busy, setBusy] = useState(false);
  const seoFn = useServerFn(aiGenerateSeo);

  if (!can) return null;

  async function run() {
    if (!content?.trim() || content.trim().length < 20) {
      toast.error("Add some content first (min 20 chars) so AI can suggest SEO");
      return;
    }
    setBusy(true);
    try {
      const res = await seoFn({ data: { content, subject, language } });
      onApply(res.seo);
      toast.success("SEO suggestions applied — review & save");
    } catch (e: any) {
      toast.error(e?.message ?? "SEO generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant="ghost"
      onClick={run}
      disabled={busy}
      className="h-8 rounded-full border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 px-3 text-xs font-medium text-primary shadow-sm transition-all hover:from-primary/20 hover:to-primary/10 hover:border-primary/40 hover:shadow-md hover:text-primary"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
      )}
      AI · Suggest SEO ({language.toUpperCase()})
    </Button>
  );
}
