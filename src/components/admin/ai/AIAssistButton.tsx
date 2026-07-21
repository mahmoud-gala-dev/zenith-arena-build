import { useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, Wand2, Languages, Scissors, Expand, FileText, CheckCircle2, Undo2, RotateCw } from "lucide-react";
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

type LastRun =
  | { kind: "improve"; mode: string; label: string; language: "en" | "ar"; input: string }
  | { kind: "translate"; to: "en" | "ar"; input: string };

/**
 * ✨ Inline AI assist button — appears next to any text/textarea field.
 * Modes: improve · shorten · expand · summarize · fix grammar · SEO rewrite · translate.
 * Governance: keeps a per-instance history stack so the user can Undo the last
 * AI edit or Regenerate it (Phase 5 — AI Governance).
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

  // History stack: stores previous values so Undo can pop back through
  // multiple AI edits. `lastRun` remembers the last operation for Regenerate.
  const historyRef = useRef<string[]>([]);
  const [historyDepth, setHistoryDepth] = useState(0);
  const [lastRun, setLastRun] = useState<LastRun | null>(null);

  if (!can) return null;

  function pushHistory(prev: string) {
    historyRef.current.push(prev);
    if (historyRef.current.length > 20) historyRef.current.shift();
    setHistoryDepth(historyRef.current.length);
  }

  function undo() {
    const prev = historyRef.current.pop();
    if (prev === undefined) {
      toast.error("Nothing to undo");
      return;
    }
    setHistoryDepth(historyRef.current.length);
    onChange(prev);
    toast.success("Reverted last AI edit");
  }

  async function run(mode: any, label: string) {
    if (!value?.trim()) {
      toast.error("Field is empty");
      return;
    }
    setLoading(label);
    const prev = value;
    try {
      const res = await improveFn({ data: { text: value, mode, language } });
      pushHistory(prev);
      setLastRun({ kind: "improve", mode, label, language, input: prev });
      onChange(res.text);
      toast.success(`AI: ${label} — draft, review before saving`);
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
    const prev = value;
    try {
      const res = await translateFn({ data: { text: value, to, from: "auto" } });
      pushHistory(prev);
      setLastRun({ kind: "translate", to, input: prev });
      onChange(res.text);
      toast.success(`Translated to ${to.toUpperCase()} — draft, review before saving`);
    } catch (e: any) {
      toast.error(e?.message ?? "Translation failed");
    } finally {
      setLoading(null);
    }
  }

  async function regenerate() {
    if (!lastRun) {
      toast.error("No previous AI action to regenerate");
      return;
    }
    setLoading("Regenerate");
    const prev = value;
    try {
      if (lastRun.kind === "improve") {
        const res = await improveFn({
          data: { text: lastRun.input, mode: lastRun.mode as any, language: lastRun.language },
        });
        pushHistory(prev);
        onChange(res.text);
        toast.success(`Regenerated: ${lastRun.label}`);
      } else {
        const res = await translateFn({
          data: { text: lastRun.input, to: lastRun.to, from: "auto" },
        });
        pushHistory(prev);
        onChange(res.text);
        toast.success(`Regenerated translation → ${lastRun.to.toUpperCase()}`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Regenerate failed");
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={regenerate} disabled={!lastRun}>
          <RotateCw className="h-4 w-4 mr-2" /> Regenerate last
        </DropdownMenuItem>
        <DropdownMenuItem onClick={undo} disabled={historyDepth === 0}>
          <Undo2 className="h-4 w-4 mr-2" />
          Undo AI edit {historyDepth > 0 ? `(${historyDepth})` : ""}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
