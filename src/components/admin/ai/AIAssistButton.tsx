import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, Wand2, Languages, Scissors, Expand, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { aiImproveText, aiTranslate } from "@/lib/ai/ai.functions";
import { useCan } from "@/lib/rbac";

type Props = {
  value: string;
  onChange: (next: string) => void;
  language?: "en" | "ar";
  translateTo?: "en" | "ar";
  size?: "sm" | "icon";
  className?: string;
};

/**
 * ✨ Inline AI assist button — appears next to any text/textarea field.
 * Modes: improve · shorten · expand · summarize · fix grammar · SEO rewrite · translate.
 */
export function AIAssistButton({
  value,
  onChange,
  language = "en",
  translateTo,
  size = "icon",
  className,
}: Props) {
  const { can } = useCan("content.ai");
  const [loading, setLoading] = useState<string | null>(null);
  const improveFn = useServerFn(aiImproveText);
  const translateFn = useServerFn(aiTranslate);

  if (!can) return null;

  async function run(mode: any, label: string) {
    if (!value?.trim()) {
      toast.error("Field is empty");
      return;
    }
    setLoading(label);
    try {
      const res = await improveFn({ data: { text: value, mode, language } });
      onChange(res.text);
      toast.success(`AI: ${label}`);
    } catch (e: any) {
      toast.error(e?.message ?? "AI request failed");
    } finally {
      setLoading(null);
    }
  }

  async function runTranslate() {
    if (!value?.trim()) {
      toast.error("Field is empty");
      return;
    }
    const to = translateTo ?? (language === "en" ? "ar" : "en");
    setLoading("Translate");
    try {
      const res = await translateFn({ data: { text: value, to, from: "auto" } });
      onChange(res.text);
      toast.success(`Translated to ${to.toUpperCase()}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Translation failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size={size}
          variant="outline"
          className={className}
          disabled={!!loading}
          title="AI assistant"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {size !== "icon" && <span className="ms-1">{loading ?? "AI"}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>AI actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => run("improve", "Improve")}>
          <Wand2 className="h-4 w-4 mr-2" /> Improve writing
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("fix_grammar", "Fix grammar")}>
          <CheckCircle2 className="h-4 w-4 mr-2" /> Fix grammar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("shorten", "Shorten")}>
          <Scissors className="h-4 w-4 mr-2" /> Make shorter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("expand", "Expand")}>
          <Expand className="h-4 w-4 mr-2" /> Expand
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("summarize", "Summarize")}>
          <FileText className="h-4 w-4 mr-2" /> Summarize
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("seo_rewrite", "SEO rewrite")}>
          <Sparkles className="h-4 w-4 mr-2" /> SEO rewrite
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={runTranslate}>
          <Languages className="h-4 w-4 mr-2" />
          Translate → {(translateTo ?? (language === "en" ? "ar" : "en")).toUpperCase()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
