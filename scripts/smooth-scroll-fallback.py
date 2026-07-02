"""
E2E: verify Smooth Scroll fallback triggers for each capability signal.

Runs three scenarios against the preview URL:
  1. prefers-reduced-motion:reduce  -> reason "reduced-motion"
  2. Save-Data via connection stub    -> reason "save-data"
  3. Simulated sub-40fps for 3s+      -> reason "jank-fallback" +
     localStorage["perf:disable-smooth-scroll"] === "1"

Usage:
  python3 scripts/smooth-scroll-fallback.py [BASE_URL]

Default BASE_URL is http://localhost:8080.
"""

from __future__ import annotations
import asyncio
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
OUT = Path("/tmp/browser/smooth-scroll")
OUT.mkdir(parents=True, exist_ok=True)


async def read_state(page):
    return await page.evaluate(
        "() => window.__smoothScroll && {"
        "enabled: window.__smoothScroll.enabled,"
        "reason: window.__smoothScroll.reason }"
    )


async def wait_for_state(page, timeout_ms=4000):
    for _ in range(timeout_ms // 100):
        st = await read_state(page)
        if st:
            return st
        await page.wait_for_timeout(100)
    return None


async def scenario_reduced_motion(pw):
    browser = await pw.chromium.launch(headless=True)
    ctx = await browser.new_context(
        viewport={"width": 1280, "height": 1800},
        reduced_motion="reduce",
    )
    page = await ctx.new_page()
    await page.goto(BASE_URL, wait_until="domcontentloaded")
    st = await wait_for_state(page)
    assert st and st["enabled"] is False, f"expected disabled, got {st}"
    assert st["reason"] == "reduced-motion", f"expected reduced-motion, got {st}"
    await page.screenshot(path=str(OUT / "1_reduced_motion.png"))
    await browser.close()
    print("[ok] reduced-motion -> disabled")


async def scenario_save_data(pw):
    browser = await pw.chromium.launch(headless=True)
    ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
    # Stub navigator.connection BEFORE any script runs.
    await ctx.add_init_script(
        "Object.defineProperty(navigator, 'connection', {"
        "  configurable: true,"
        "  get: () => ({ saveData: true, effectiveType: '4g' })"
        "});"
    )
    page = await ctx.new_page()
    await page.goto(BASE_URL, wait_until="domcontentloaded")
    st = await wait_for_state(page)
    assert st and st["enabled"] is False, f"expected disabled, got {st}"
    assert st["reason"] == "save-data", f"expected save-data, got {st}"
    await page.screenshot(path=str(OUT / "2_save_data.png"))
    await browser.close()
    print("[ok] save-data -> disabled")


async def scenario_jank(pw):
    """
    Simulate sustained jank by hijacking requestAnimationFrame with a busy
    loop so each frame takes ~40ms (~25fps). Then scroll continuously for
    ~4s and verify the watchdog fires.
    """
    browser = await pw.chromium.launch(headless=True)
    ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
    page = await ctx.new_page()
    # Clear any prior "user-disabled" flag from earlier test runs.
    await page.add_init_script("try{localStorage.removeItem('perf:disable-smooth-scroll')}catch(e){}")
    # After Lenis starts, inject a per-frame busy loop so rAF runs at ~25fps.
    await page.add_init_script(
        "setTimeout(() => {"
        "  const origRAF = window.requestAnimationFrame;"
        "  window.requestAnimationFrame = (cb) => origRAF((t) => {"
        "    const end = performance.now() + 40;"
        "    while (performance.now() < end) {}"
        "    cb(t);"
        "  });"
        "}, 500);"
    )
    await page.goto(BASE_URL, wait_until="domcontentloaded")
    # Confirm it started enabled.
    st = await wait_for_state(page)
    assert st and st["enabled"] is True, f"expected enabled at start, got {st}"

    # Drive continuous scrolling for 4+ seconds.
    for _ in range(50):
        await page.mouse.wheel(0, 60)
        await page.wait_for_timeout(80)

    # Poll for fallback.
    disabled = False
    reason = None
    for _ in range(30):
        st = await read_state(page)
        if st and st["enabled"] is False:
            disabled = True
            reason = st["reason"]
            break
        await page.wait_for_timeout(200)

    stored = await page.evaluate("() => localStorage.getItem('perf:disable-smooth-scroll')")
    await page.screenshot(path=str(OUT / "3_jank.png"))
    await browser.close()

    assert disabled, "watchdog never triggered fallback"
    assert reason == "jank-fallback", f"expected jank-fallback, got {reason}"
    assert stored == "1", f"expected localStorage flag, got {stored!r}"
    print("[ok] sustained jank -> jank-fallback (localStorage persisted)")


async def main():
    async with async_playwright() as pw:
        await scenario_reduced_motion(pw)
        await scenario_save_data(pw)
        await scenario_jank(pw)
    print("\nAll scenarios passed. Screenshots:", OUT)


if __name__ == "__main__":
    asyncio.run(main())
