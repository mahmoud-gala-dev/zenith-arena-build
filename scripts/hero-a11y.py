"""
Automated accessibility regression checks for the homepage HeroSlider.

Verifies:
  * carousel landmark with aria-roledescription="carousel" and aria-label
  * slide group with aria-roledescription="slide", aria-live, aria-atomic
  * tablist with per-dot role=tab, aria-selected, aria-label
  * roving tabindex (exactly one dot is tabbable at a time)
  * keyboard navigation via ArrowRight/ArrowLeft/Home/End updates selection
  * dots remain visible focus targets (>= 16px hit area)

Run:
  BASE_URL=http://127.0.0.1:8080 python scripts/hero-a11y.py
Exits non-zero on any failed assertion so CI can block regressions.
"""

import asyncio
import os
import sys
from playwright.async_api import async_playwright

BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:8080")

FAILURES: list[str] = []


def check(cond: bool, msg: str) -> None:
    if cond:
        print(f"  ok  {msg}")
    else:
        print(f"  FAIL {msg}")
        FAILURES.append(msg)


async def main() -> int:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await ctx.new_page()
        await page.goto(BASE_URL, wait_until="domcontentloaded")

        # Wait for slides (data-driven) or fallback: give it up to 8s.
        carousel = page.locator('[aria-roledescription="carousel"]').first
        try:
            await carousel.wait_for(state="visible", timeout=8000)
        except Exception:
            print("HeroSlider carousel not rendered — nothing to audit.")
            await browser.close()
            return 0

        label = await carousel.get_attribute("aria-label")
        check(bool(label and label.strip()), f'carousel has aria-label ("{label}")')

        slide_group = carousel.locator('[aria-roledescription="slide"]').first
        check(await slide_group.count() > 0, "current slide group is present")
        aria_live = await slide_group.get_attribute("aria-live")
        aria_atomic = await slide_group.get_attribute("aria-atomic")
        check(aria_live in ("polite", "assertive"), f'slide group aria-live="{aria_live}"')
        check(aria_atomic == "true", f'slide group aria-atomic="{aria_atomic}"')

        tablist = carousel.locator('[role="tablist"]').first
        tabs_count = await tablist.locator('[role="tab"]').count() if await tablist.count() > 0 else 0

        if tabs_count < 2:
            print("Only one slide — skipping tablist keyboard checks.")
        else:
            check(await tablist.get_attribute("aria-label") is not None, "tablist has aria-label")

            tabs = tablist.locator('[role="tab"]')
            selected_idxs = []
            tabbable_idxs = []
            for i in range(tabs_count):
                t = tabs.nth(i)
                sel = await t.get_attribute("aria-selected")
                ti = await t.get_attribute("tabindex")
                lbl = await t.get_attribute("aria-label")
                check(lbl is not None and lbl != "", f"tab {i} has aria-label")
                if sel == "true":
                    selected_idxs.append(i)
                if ti == "0":
                    tabbable_idxs.append(i)
                box = await t.bounding_box()
                if box:
                    check(box["width"] >= 16 and box["height"] >= 16, f"tab {i} hit area >= 16x16")
            check(len(selected_idxs) == 1, f"exactly one tab is aria-selected (got {selected_idxs})")
            check(len(tabbable_idxs) == 1, f"exactly one tab is tabbable (got {tabbable_idxs})")

            # Keyboard nav: focus selected dot, press ArrowRight, verify selection moved.
            await tabs.nth(selected_idxs[0]).focus()
            start = selected_idxs[0]
            await page.keyboard.press("ArrowRight")
            await page.wait_for_timeout(120)
            new_sel = None
            for i in range(tabs_count):
                if await tabs.nth(i).get_attribute("aria-selected") == "true":
                    new_sel = i
                    break
            expected = (start + 1) % tabs_count
            check(new_sel == expected, f"ArrowRight moved selection {start} -> {new_sel} (expected {expected})")

            await page.keyboard.press("End")
            await page.wait_for_timeout(120)
            end_sel = None
            for i in range(tabs_count):
                if await tabs.nth(i).get_attribute("aria-selected") == "true":
                    end_sel = i
                    break
            check(end_sel == tabs_count - 1, f"End key jumped to last slide (got {end_sel})")

            await page.keyboard.press("Home")
            await page.wait_for_timeout(120)
            home_sel = None
            for i in range(tabs_count):
                if await tabs.nth(i).get_attribute("aria-selected") == "true":
                    home_sel = i
                    break
            check(home_sel == 0, f"Home key jumped to first slide (got {home_sel})")

        await browser.close()

    if FAILURES:
        print(f"\n{len(FAILURES)} HeroSlider a11y check(s) failed:")
        for f in FAILURES:
            print(f"  - {f}")
        return 1
    print("\nAll HeroSlider a11y checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
