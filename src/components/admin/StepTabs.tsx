import { Children, isValidElement, useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Drop-in wizard replacement for the shadcn Tabs API used by admin editors.
 * Same component shape (Tabs / TabsList / TabsTrigger / TabsContent) but renders
 * one step at a time with a progress stepper and Back / Next controls.
 */

type AnyProps = { value?: string; children?: ReactNode; className?: string };

export function StepTabsList({ children }: AnyProps) {
  return <>{children}</>;
}
export function StepTabsTrigger({ children }: AnyProps) {
  return <>{children}</>;
}
export function StepTabsContent({ children, className }: AnyProps) {
  return <div className={className}>{children}</div>;
}

function flatten(nodes: ReactNode): ReactElement<AnyProps>[] {
  const out: ReactElement<AnyProps>[] = [];
  Children.forEach(nodes, (child) => {
    if (isValidElement(child)) out.push(child as ReactElement<AnyProps>);
  });
  return out;
}

export function StepTabs({ children, className }: { children?: ReactNode; className?: string; defaultValue?: string }) {
  const nodes = useMemo(() => flatten(children), [children]);

  const triggers = useMemo(() => {
    const list = nodes.find((n) => n.type === StepTabsList);
    return list ? flatten(list.props.children).filter((n) => n.type === StepTabsTrigger) : [];
  }, [nodes]);

  const contents = useMemo(() => nodes.filter((n) => n.type === StepTabsContent), [nodes]);

  const steps = useMemo(
    () =>
      triggers
        .map((t) => ({
          value: t.props.value ?? "",
          label: t.props.children,
          content: contents.find((c) => c.props.value === t.props.value) ?? null,
        }))
        .filter((s) => s.content),
    [triggers, contents],
  );

  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex((prev) => Math.min(prev, Math.max(0, steps.length - 1)));
  }, [steps.length]);

  if (steps.length === 0) return <div className={className}>{children}</div>;

  const safeIndex = Math.min(index, steps.length - 1);
  const isLast = safeIndex === steps.length - 1;

  return (
    <div className={cn("space-y-5", className)}>
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((step, i) => {
          const done = i < safeIndex;
          const active = i === safeIndex;
          return (
            <li key={step.value} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIndex(i)}
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
              {i < steps.length - 1 && <span className="h-px w-4 bg-border" aria-hidden />}
            </li>
          );
        })}
      </ol>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((safeIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="min-h-[180px]">{steps[safeIndex]?.content}</div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">
          خطوة {safeIndex + 1} من {steps.length}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
            disabled={safeIndex === 0}
          >
            <ChevronRight className="h-4 w-4 rtl:hidden" />
            <ChevronLeft className="hidden h-4 w-4 rtl:block" />
            السابق
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIndex((prev) => Math.min(steps.length - 1, prev + 1))}
            disabled={isLast}
          >
            التالي
            <ChevronLeft className="h-4 w-4 rtl:hidden" />
            <ChevronRight className="hidden h-4 w-4 rtl:block" />
          </Button>
        </div>
      </div>
    </div>
  );
}
