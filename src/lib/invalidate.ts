import { useQueryClient } from "@tanstack/react-query";

/**
 * Returns a callback that invalidates every TanStack Query whose key starts
 * with any of the provided table names. Use inside admin pages so that
 * after each save/delete/reorder the public-facing queries in
 * `src/lib/queries.ts` refetch immediately instead of waiting for
 * `staleTime` to elapse.
 */
export function useInvalidateTables(tables: string[]) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) &&
        typeof q.queryKey[0] === "string" &&
        tables.includes(q.queryKey[0] as string),
    });
  };
}
