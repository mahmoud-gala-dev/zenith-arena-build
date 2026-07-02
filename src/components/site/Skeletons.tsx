import { cn } from "@/lib/utils";

/**
 * Reusable skeleton building blocks with a soft shimmer animation.
 * Use these on data-driven public pages while queries resolve.
 */
export function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-secondary/60 via-secondary to-secondary/60 bg-[length:200%_100%]",
        className,
      )}
    />
  );
}

/** Card-shaped skeleton matching ProjectCard / product listing tiles. */
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft" aria-hidden>
      <SkeletonBox className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <SkeletonBox className="h-3 w-24" />
        <SkeletonBox className="h-5 w-3/4" />
        <SkeletonBox className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Two-column skeleton row for the services list layout. */
export function ServiceRowSkeleton({ reverse = false }: { reverse?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid items-center gap-10 lg:grid-cols-2",
        reverse && "lg:[&>div:first-child]:order-2",
      )}
    >
      <div className="space-y-5">
        <SkeletonBox className="h-14 w-14 rounded-2xl" />
        <SkeletonBox className="h-8 w-2/3" />
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-5/6" />
        <SkeletonBox className="h-4 w-4/6" />
        <SkeletonBox className="mt-2 h-11 w-40 rounded-full" />
      </div>
      <SkeletonBox className="aspect-[4/3] w-full rounded-3xl" />
    </div>
  );
}

/** Full detail-page skeleton used while a single record is fetched. */
export function DetailPageSkeleton() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink pt-32 pb-16" aria-hidden>
        <SkeletonBox className="absolute inset-0 h-full w-full rounded-none opacity-40" />
        <div className="relative mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
          <SkeletonBox className="h-4 w-40 bg-white/20" />
          <SkeletonBox className="h-10 w-3/4 bg-white/20" />
          <SkeletonBox className="h-4 w-1/2 bg-white/20" />
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="space-y-4 lg:col-span-2">
            <SkeletonBox className="h-6 w-40" />
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-4 w-11/12" />
            <SkeletonBox className="h-4 w-10/12" />
            <SkeletonBox className="h-4 w-9/12" />
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <SkeletonBox className="h-24 rounded-2xl" />
              <SkeletonBox className="h-24 rounded-2xl" />
              <SkeletonBox className="h-24 rounded-2xl" />
            </div>
          </div>
          <SkeletonBox className="h-64 rounded-2xl" />
        </div>
      </section>
    </>
  );
}

/** Skeleton rows for admin CMS tables (matches CmsCollectionPage layout). */
export function TableRowsSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} aria-hidden>
          <td className="px-4 py-3"><SkeletonBox className="h-4 w-4 rounded" /></td>
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} className="px-4 py-3">
              <SkeletonBox className={c === 0 ? "h-10 w-16 rounded-md" : "h-4 w-full max-w-[180px]"} />
            </td>
          ))}
          <td className="px-4 py-3"><SkeletonBox className="ml-auto h-8 w-16" /></td>
        </tr>
      ))}
    </>
  );
}

/** Skeleton for admin edit/create dialog forms. */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div aria-hidden className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-10 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a project detail media gallery grid + specs sidebar. */
export function ProjectDetailContentSkeleton() {
  return (
    <div aria-hidden className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
      <div className="space-y-6 lg:col-span-2">
        <SkeletonBox className="h-6 w-40" />
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-11/12" />
        <SkeletonBox className="h-4 w-10/12" />
        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonBox className="h-24 rounded-2xl" />
          <SkeletonBox className="h-24 rounded-2xl" />
          <SkeletonBox className="h-24 rounded-2xl" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBox key={i} className="aspect-[4/3] w-full rounded-xl" />
          ))}
        </div>
      </div>
      <aside className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <SkeletonBox className="h-5 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBox className="h-3 w-24" />
            <SkeletonBox className="h-4 w-40" />
          </div>
        ))}
        <SkeletonBox className="mt-2 h-11 w-full rounded-full" />
      </aside>
    </div>
  );
}
