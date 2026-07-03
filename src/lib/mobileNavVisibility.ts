/**
 * Pure helpers driving the mobile bottom-nav visibility behavior.
 * Extracted so they can be unit-tested without a DOM.
 */

export const MIN_IDLE_MS = 150;
export const MAX_IDLE_MS = 400;
export const DEFAULT_IDLE_MS = 220;

/** Clamp the user-configured idle delay into the allowed range. */
export function clampIdleMs(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : DEFAULT_IDLE_MS;
  return Math.min(MAX_IDLE_MS, Math.max(MIN_IDLE_MS, Math.round(n)));
}

export type MobileNavVisibilityInput = {
  scrolling: boolean;
  reducedMotion: boolean;
};

export type MobileNavVisibility = {
  hidden: boolean;
  /** ms — 0 disables the CSS transition (used for reduced-motion). */
  transitionMs: number;
};

/**
 * Decide whether the mobile bottom nav should be hidden and what
 * transition duration to apply.
 *
 * - Hidden while the user is actively scrolling.
 * - Reduced-motion users get no transition (instant show/hide).
 */
export function computeMobileNavVisibility({
  scrolling,
  reducedMotion,
}: MobileNavVisibilityInput): MobileNavVisibility {
  return {
    hidden: scrolling,
    transitionMs: reducedMotion ? 0 : 260,
  };
}
