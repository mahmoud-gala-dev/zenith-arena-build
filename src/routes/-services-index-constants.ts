export const SITE_URL = "https://zenith-arena-build.lovable.app";
export const DEFAULT_PAGE_SIZE = 9;

export type SortKey = "featured" | "newest" | "oldest" | "az" | "za";
export const SORT_KEYS: readonly SortKey[] = ["featured", "newest", "oldest", "az", "za"] as const;
