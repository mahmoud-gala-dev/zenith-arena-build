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
  const { can } = useCan("content.ai");
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
    <Button type="button" size={size} variant="outline" onClick={run} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
      AI · Suggest SEO ({language.toUpperCase()})
    </Button>
  );
}
