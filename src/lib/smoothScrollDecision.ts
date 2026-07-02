/**
 * Pure capability check for smooth scrolling. Kept dependency-free so it can
 * be unit-tested without JSDOM or React.
 */

export const SMOOTH_DISABLE_KEY = "perf:disable-smooth-scroll";

export type SmoothEnv = {
  userDisabled?: boolean;
  reducedMotion?: boolean;
  saveData?: boolean;
  effectiveType?: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;
};

export function decideSmoothScroll(env: SmoothEnv): { skip: boolean; reason: string } {
  if (env.userDisabled) return { skip: true, reason: "user-disabled" };
  if (env.reducedMotion) return { skip: true, reason: "reduced-motion" };
  if (env.saveData) return { skip: true, reason: "save-data" };
  if (env.effectiveType === "slow-2g" || env.effectiveType === "2g")
    return { skip: true, reason: `net-${env.effectiveType}` };
  const cores = env.hardwareConcurrency ?? 8;
  const mem = env.deviceMemory ?? 8;
  if (cores <= 4 && mem <= 2) return { skip: true, reason: "low-end-device" };
  return { skip: false, reason: "enabled" };
}

/**
 * Watchdog: given a sequence of 1-second FPS samples, returns true when we
 * should fall back (3 consecutive windows below the floor).
 */
export function shouldJankFallback(fpsWindows: number[], floor = 40, limit = 3): boolean {
  let bad = 0;
  for (const fps of fpsWindows) {
    if (fps < floor) {
      bad++;
      if (bad >= limit) return true;
    } else {
      bad = 0;
    }
  }
  return false;
}
