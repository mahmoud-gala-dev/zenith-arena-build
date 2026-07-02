import { describe, it, expect } from "vitest";
import { decideSmoothScroll, shouldJankFallback } from "@/lib/smoothScrollDecision";

describe("decideSmoothScroll", () => {
  it("enables on a healthy desktop environment", () => {
    expect(decideSmoothScroll({ hardwareConcurrency: 8, deviceMemory: 8 })).toEqual({
      skip: false,
      reason: "enabled",
    });
  });

  it("respects prefers-reduced-motion", () => {
    expect(decideSmoothScroll({ reducedMotion: true }).reason).toBe("reduced-motion");
  });

  it("respects Save-Data header", () => {
    expect(decideSmoothScroll({ saveData: true }).reason).toBe("save-data");
  });

  it("skips on slow-2g / 2g networks", () => {
    expect(decideSmoothScroll({ effectiveType: "2g" }).reason).toBe("net-2g");
    expect(decideSmoothScroll({ effectiveType: "slow-2g" }).reason).toBe("net-slow-2g");
  });

  it("skips on low-end devices (<=4 cores AND <=2GB)", () => {
    expect(decideSmoothScroll({ hardwareConcurrency: 4, deviceMemory: 2 }).reason).toBe(
      "low-end-device",
    );
  });

  it("does NOT skip on a low-core-only device with plenty of RAM", () => {
    expect(decideSmoothScroll({ hardwareConcurrency: 4, deviceMemory: 8 }).skip).toBe(false);
  });

  it("honors an explicit user-disabled preference", () => {
    expect(decideSmoothScroll({ userDisabled: true }).reason).toBe("user-disabled");
  });
});

describe("shouldJankFallback", () => {
  it("triggers after 3 consecutive sub-40fps windows", () => {
    expect(shouldJankFallback([30, 30, 30])).toBe(true);
  });

  it("does not trigger when a good window resets the streak", () => {
    expect(shouldJankFallback([30, 30, 60, 30, 30])).toBe(false);
  });

  it("does not trigger with only 2 bad windows", () => {
    expect(shouldJankFallback([30, 30])).toBe(false);
  });

  it("does not trigger when all windows are healthy", () => {
    expect(shouldJankFallback([60, 58, 55, 62])).toBe(false);
  });
});
