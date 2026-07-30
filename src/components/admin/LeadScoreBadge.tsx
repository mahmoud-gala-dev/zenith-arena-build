import { BAND_STYLES, scoreLead, type ScorableLead } from "@/lib/lead-score";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** Compact score chip; hover reveals the signals behind the number. */
export function LeadScoreBadge({ lead }: { lead: ScorableLead }) {
  const { score, band, reasons } = scoreLead(lead);
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex min-w-[3rem] items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${BAND_STYLES[band]}`}
          >
            {score} · {band}
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <ul className="space-y-0.5 text-xs">
            {reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


/** Expanded breakdown for the lead detail drawer. */
export function LeadScorePanel({ lead }: { lead: ScorableLead }) {
  const { score, band, reasons } = scoreLead(lead);
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase text-muted-foreground">Lead score</span>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${BAND_STYLES[band]}`}>
          {score} / 100 · {band}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${score}%` }} />
      </div>
      <ul className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        {reasons.map((r) => <li key={r}>{r}</li>)}
      </ul>
    </div>
  );
}
