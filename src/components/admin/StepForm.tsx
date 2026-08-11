import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type FormStep = {
  /** Stable key for the step. */
  key: string;
  /** Bilingual-friendly label shown in the stepper. */
  label: string;
  /** Optional short hint under the step title. */
  hint?: string;
  content: ReactNode;
  /** Return an error message to block moving forward / saving. */
  validate?: () => string | null;
};

/**
 * Multi-step (wizard) shell for admin create/edit forms.
 * Renders a progress stepper, one step at a time, and Back / Next / Save controls.
 */
export function StepForm({
  steps,
  saving,
  onSave,
  onCancel,
  onStepError,
  saveLabel = "حفظ",
  resetKey,
}: {
  steps: FormStep[];
  saving?: boolean;
  onSave: () => void;
  onCancel?: () => void;
  onStepError?: (message: string) => void;
  saveLabel?: string;
  /** Change this (e.g. record id) to reset back to the first step. */
  resetKey?: string;
}) {
  const visible = useMemo(() => steps.filter(Boolean), [steps]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [resetKey, visible.length]);

  const safeIndex = Math.min(index, Math.max(0, visible.length - 1));
  const current = visible[safeIndex];
  const isLast = safeIndex === visible.length - 1;

  function check(upTo: number) {
    for (let i = 0; i <= upTo; i++) {
      const error = visible[i]?.validate?.();
      if (error) {
        setIndex(i);
        onStepError?.(error);
        return false;
      }
    }
    return true;
  }

  function next() {
    if (!check(safeIndex)) return;
    setIndex((prev) => Math.min(visible.length - 1, prev + 1));
  }

  function submit() {
    if (!check(visible.length - 1)) return;
    onSave();
  }

  if (!current) return null;

  return (
    <div className="space-y-5">
      <ol className="flex flex-wrap items-center gap-2">
        {visible.map((step, i) => {
          const done = i < safeIndex;
          const active = i === safeIndex;
          return (
            <li key={step.key} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (i <= safeIndex ? setIndex(i) : check(safeIndex) && setIndex(i))}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : done
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-background/20 text-[10px]">
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {step.label}
              </button>
              {i < visible.length - 1 && <span className="h-px w-4 bg-border" aria-hidden />}
            </li>
          );
        })}
      </ol>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((safeIndex + 1) / visible.length) * 100}%` }}
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">{current.label}</p>
        {current.hint && <p className="mt-0.5 text-xs text-muted-foreground">{current.hint}</p>}
      </div>

      <div className="min-h-[180px]">{current.content}</div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">
          خطوة {safeIndex + 1} من {visible.length}
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={saving}>
              إلغاء
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
            disabled={safeIndex === 0 || saving}
          >
            <ChevronRight className="h-4 w-4 rtl:hidden" />
            <ChevronLeft className="hidden h-4 w-4 rtl:block" />
            السابق
          </Button>
          {isLast ? (
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} {saveLabel}
            </Button>
          ) : (
            <Button onClick={next} disabled={saving}>
              التالي
              <ChevronLeft className="h-4 w-4 rtl:hidden" />
              <ChevronRight className="hidden h-4 w-4 rtl:block" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Heuristic grouping of CMS field names into wizard steps. */
export type StepGroupKey = "basic" | "arabic" | "media" | "seo" | "settings";

export const stepGroupLabels: Record<StepGroupKey, string> = {
  basic: "المحتوى الأساسي",
  arabic: "المحتوى العربي",
  media: "الوسائط",
  seo: "SEO",
  settings: "الإعدادات والنشر",
};

export function groupFieldName(name: string): StepGroupKey {
  const n = name.toLowerCase();
  if (/^(seo_|og_|twitter_)|canonical|noindex|keywords|robots/.test(n)) return "seo";
  if (/(image|logo|photo|gallery|avatar|file|files|attachment|icon|media|cover|preview)/.test(n)) return "media";
  if (/(status|featured|sort_order|active|is_|published_at|scheduled_at|effective_at|rating|hide_)/.test(n)) return "settings";
  if (/_ar$/.test(n)) return "arabic";
  return "basic";
}

export const stepGroupOrder: StepGroupKey[] = ["basic", "arabic", "media", "seo", "settings"];
