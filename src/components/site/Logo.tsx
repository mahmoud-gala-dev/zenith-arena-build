import { cn } from "@/lib/utils";

/** Placeholder brand monogram — swap for the uploaded logo when available. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-soft",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M12 3L4 20h4l1.5-3.5h5L16 20h4L12 3zm-1 10l1-2.5 1 2.5h-2z" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-lg font-bold tracking-tight",
            light ? "text-white" : "text-foreground",
          )}
          style={{ fontFamily: "var(--font-display)" }}
        >
          APEX
        </span>
        <span
          className={cn(
            "text-[10px] font-medium uppercase tracking-[0.25em]",
            light ? "text-white/60" : "text-muted-foreground",
          )}
        >
          Sports
        </span>
      </span>
    </span>
  );
}
