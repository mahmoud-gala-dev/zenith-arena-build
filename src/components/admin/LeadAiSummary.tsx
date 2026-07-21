import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { aiSummarizeLead } from "@/lib/ai/ai.functions";
import { useCan } from "@/lib/rbac";

type Props = {
  leadId: string;
  phone?: string | null;
};

type Result = {
  summary_en?: string;
  summary_ar?: string;
  intent?: string;
  priority?: "low" | "medium" | "high";
  reply_en?: string;
  reply_ar?: string;
  raw?: string;
};

const PRIORITY_TONE: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

export function LeadAiSummary({ leadId, phone }: Props) {
  const { can } = useCan("content.ai");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const summarize = useServerFn(aiSummarizeLead);

  if (!can) return null;

  async function run() {
    setBusy(true);
    try {
      const res = await summarize({ data: { leadId } });
      setResult(res.result as Result);
      toast.success(`Summarized with ${res.model}`);
    } catch (e: any) {
      toast.error(e?.message ?? "AI summarize failed");
    } finally {
      setBusy(false);
    }
  }

  function copy(text?: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  const waHref = (text?: string) => {
    if (!phone || !text) return null;
    return `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" /> AI assistant
        </div>
        <Button size="sm" variant="outline" onClick={run} disabled={busy}>
          {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
          {result ? "Regenerate" : "Summarize & draft reply"}
        </Button>
      </div>

      {result && (
        <div className="mt-3 grid gap-3 text-sm">
          {(result.intent || result.priority) && (
            <div className="flex flex-wrap gap-2">
              {result.intent && <Badge variant="secondary">Intent: {result.intent}</Badge>}
              {result.priority && (
                <Badge className={PRIORITY_TONE[result.priority] ?? ""}>
                  Priority: {result.priority}
                </Badge>
              )}
            </div>
          )}

          {result.summary_en && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs uppercase text-muted-foreground">Summary (EN)</p>
                <Button size="sm" variant="ghost" onClick={() => copy(result.summary_en)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="whitespace-pre-wrap text-foreground">{result.summary_en}</p>
            </div>
          )}
          {result.summary_ar && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs uppercase text-muted-foreground">Summary (AR)</p>
                <Button size="sm" variant="ghost" onClick={() => copy(result.summary_ar)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p dir="rtl" className="whitespace-pre-wrap text-foreground">{result.summary_ar}</p>
            </div>
          )}

          {result.reply_en && (
            <div className="rounded-md border border-border bg-background p-2">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs uppercase text-muted-foreground">Draft reply (EN)</p>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => copy(result.reply_en)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  {waHref(result.reply_en) && (
                    <a href={waHref(result.reply_en)!} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost"><MessageCircle className="h-3 w-3" /></Button>
                    </a>
                  )}
                </div>
              </div>
              <p className="whitespace-pre-wrap text-foreground">{result.reply_en}</p>
            </div>
          )}
          {result.reply_ar && (
            <div className="rounded-md border border-border bg-background p-2">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs uppercase text-muted-foreground">Draft reply (AR)</p>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => copy(result.reply_ar)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  {waHref(result.reply_ar) && (
                    <a href={waHref(result.reply_ar)!} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost"><MessageCircle className="h-3 w-3" /></Button>
                    </a>
                  )}
                </div>
              </div>
              <p dir="rtl" className="whitespace-pre-wrap text-foreground">{result.reply_ar}</p>
            </div>
          )}

          {result.raw && !result.summary_en && (
            <pre className="whitespace-pre-wrap rounded-md bg-muted p-2 text-xs">{result.raw}</pre>
          )}
        </div>
      )}
    </div>
  );
}
