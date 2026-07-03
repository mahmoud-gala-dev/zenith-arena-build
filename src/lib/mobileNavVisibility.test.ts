import { describe, it, expect } from "vitest";
import {
  clampIdleMs,
  computeMobileNavVisibility,
  DEFAULT_IDLE_MS,
  MAX_IDLE_MS,
  MIN_IDLE_MS,
} from "@/lib/mobileNavVisibility";

describe("clampIdleMs", () => {
  it("returns the default when input is not a finite number", () => {
    expect(clampIdleMs(undefined)).toBe(DEFAULT_IDLE_MS);
    expect(clampIdleMs(null)).toBe(DEFAULT_IDLE_MS);
    expect(clampIdleMs("220")).toBe(DEFAULT_IDLE_MS);
    expect(clampIdleMs(NaN)).toBe(DEFAULT_IDLE_MS);
  });

  it("clamps below the minimum", () => {
    expect(clampIdleMs(0)).toBe(MIN_IDLE_MS);
    expect(clampIdleMs(50)).toBe(MIN_IDLE_MS);
  });

  it("clamps above the maximum", () => {
    expect(clampIdleMs(1000)).toBe(MAX_IDLE_MS);
  });

  it("keeps values inside the allowed range", () => {
    expect(clampIdleMs(150)).toBe(150);
    expect(clampIdleMs(300)).toBe(300);
    expect(clampIdleMs(400)).toBe(400);
  });
});

describe("computeMobileNavVisibility", () => {
  it("hides the nav while scrolling", () => {
    const v = computeMobileNavVisibility({ scrolling: true, reducedMotion: false });
    expect(v.hidden).toBe(true);
    expect(v.transitionMs).toBeGreaterThan(0);
  });

  it("shows the nav when idle", () => {
    const v = computeMobileNavVisibility({ scrolling: false, reducedMotion: false });
    expect(v.hidden).toBe(false);
  });

  it("disables the transition for reduced-motion users", () => {
    const v = computeMobileNavVisibility({ scrolling: true, reducedMotion: true });
    expect(v.transitionMs).toBe(0);
  });
});
