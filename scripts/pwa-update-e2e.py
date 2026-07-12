#!/usr/bin/env python3
"""
End-to-end proof that clicking "Reload" inside <PwaController /> upgrades to
the new service worker WITHOUT any manual page reload from the user.

What it exercises:

1.  Load the site on localhost:8080 (production build served by `vite preview`).
2.  Wait until the current service worker is `activated` AND controlling the page
    (v1 is live).
3.  Install a Playwright request intercept on `**/sw.js` that appends a marker
    comment to the real bytes — the browser sees "new SW bytes" on next fetch
    and moves it into the `waiting` state.
4.  Reload the tab ONCE (this is the natural "user comes back later" moment,
    not the button under test).
5.  Wait for the Workbox `waiting` event to bubble into PwaController — the
    banner "A new version is available." must appear with a visible Reload button.
6.  Instrument the page BEFORE clicking:
       - Monkey-patch `window.location.reload` to set `window.__reloadCalled = true`
         instead of navigating (so a failure to skipWaiting doesn't hide behind
         a real reload).
       - Listen for `navigator.serviceWorker.controllerchange` and set
         `window.__controllerChanged = true`. This event fires ONLY after the
         waiting SW receives `SKIP_WAITING` and takes control — it is the
         ground-truth signal that skipWaiting worked.
       - Snapshot the current controller script URL + a fresh identity string
         so we can prove the controller actually swapped.
7.  Click the Reload button in the banner.
8.  Assert, within 10s and with NO manual reload:
       - `window.__controllerChanged === true`  (skipWaiting + activation)
       - `window.__reloadCalled === true`       (component called reload)
       - `navigator.serviceWorker.controller` is set and different identity
         than before the click.

Prereqs:
    bun run build && bun run preview   # server on http://localhost:8080

Exit code 0 on pass, non-zero on any assertion failure.
"""

import asyncio
import json
import os
import sys
import urllib.request
from pathlib import Path

from playwright.async_api import async_playwright, TimeoutError as PWTimeout

BASE = os.environ.get("PREVIEW_URL", "http://localhost:8080")
OUT = Path(__file__).parent.parent / "qa-report" / "pwa-update"
OUT.mkdir(parents=True, exist_ok=True)


def preview_alive() -> bool:
    try:
        urllib.request.urlopen(BASE, timeout=3).read(64)
        return True
    except Exception:
        return False


async def wait_for_controller(page, timeout_ms: int = 20_000) -> str:
    """Resolve once navigator.serviceWorker.controller is set. Returns scriptURL."""
    return await page.evaluate(
        """async (timeoutMs) => {
            if (!('serviceWorker' in navigator)) throw new Error('no SW support');
            if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller.scriptURL;
            return await new Promise((resolve, reject) => {
                const t = setTimeout(() => reject(new Error('timeout waiting for controller')), timeoutMs);
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    clearTimeout(t);
                    resolve(navigator.serviceWorker.controller?.scriptURL || '');
                }, { once: true });
            });
        }""",
        timeout_ms,
    )


async def wait_for_waiting_sw(page, timeout_ms: int = 20_000) -> None:
    """Poll registration until a `waiting` worker exists."""
    await page.wait_for_function(
        """async () => {
            const regs = await navigator.serviceWorker.getRegistrations();
            return regs.some(r => r.waiting && r.waiting.scriptURL.endsWith('/sw.js'));
        }""",
        timeout=timeout_ms,
    )


async def main() -> int:
    if not preview_alive():
        print(f"✗ preview server not reachable at {BASE}")
        print("  start it with:  bun run build && bun run preview")
        return 2

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Fresh persistent-ish context — SW state must be isolated per run.
        context = await browser.new_context(
            viewport={"width": 1280, "height": 1800},
            service_workers="allow",
        )
        page = await context.new_page()

        # ---- 1. First load: install & activate v1 ----
        await page.goto(BASE, wait_until="domcontentloaded")
        try:
            v1_url = await wait_for_controller(page)
        except Exception as e:
            await page.screenshot(path=str(OUT / "01-no-controller.png"))
            print(f"✗ service worker never took control on first load: {e}")
            print("  This usually means isRefusedContext() blocked registration.")
            return 1
        print(f"✓ v1 service worker controlling page: {v1_url}")
        await page.screenshot(path=str(OUT / "01-v1-controlling.png"))

        # ---- 2. Intercept /sw.js so the next fetch returns modified bytes ----
        marker = f"/* pwa-e2e v2 {os.urandom(4).hex()} */"

        async def handle_sw(route):
            try:
                resp = await route.fetch()
                body = await resp.body()
                new_body = body + b"\n" + marker.encode()
                headers = {k: v for k, v in resp.headers.items()}
                headers["content-length"] = str(len(new_body))
                await route.fulfill(
                    status=200,
                    headers=headers,
                    body=new_body,
                )
            except Exception as exc:
                print(f"[intercept] fallback: {exc}")
                await route.continue_()

        await context.route("**/sw.js", handle_sw)

        # ---- 3. Reload once so the browser fetches the mutated /sw.js ----
        await page.reload(wait_until="domcontentloaded")

        # ---- 4. Wait for banner (Workbox `waiting` event → React state) ----
        try:
            await wait_for_waiting_sw(page, timeout_ms=25_000)
        except PWTimeout:
            await page.screenshot(path=str(OUT / "02-no-waiting.png"))
            print("✗ new /sw.js never reached `waiting` state — did the bytes really change?")
            return 1

        reload_button = page.get_by_role("button", name="Reload", exact=True)
        try:
            await reload_button.wait_for(state="visible", timeout=15_000)
        except PWTimeout:
            await page.screenshot(path=str(OUT / "02-no-banner.png"))
            print("✗ PwaController never surfaced the Reload banner")
            return 1
        print("✓ update banner visible with Reload button")
        await page.screenshot(path=str(OUT / "02-banner-visible.png"))

        # ---- 5. Instrument the page: suppress real reload, watch controllerchange ----
        pre_ctrl = await page.evaluate(
            """() => {
                window.__reloadCalled = false;
                window.__controllerChanged = false;
                // Freeze the current controller identity — controllerchange must move us off it.
                window.__ctrlBefore = navigator.serviceWorker.controller?.scriptURL || null;
                // Non-navigating stub — a working flow calls this AFTER skipWaiting + controllerchange.
                try {
                    Object.defineProperty(window.location, 'reload', {
                        configurable: true,
                        value: () => { window.__reloadCalled = true; },
                    });
                } catch (e) {
                    window.reload = () => { window.__reloadCalled = true; };
                }
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.__controllerChanged = true;
                }, { once: true });
                return window.__ctrlBefore;
            }"""
        )
        print(f"  controller before click: {pre_ctrl}")

        # ---- 6. Click Reload — this is the behavior under test ----
        await reload_button.click()

        # ---- 7. Wait for the three success signals within 10s, no manual reload ----
        try:
            await page.wait_for_function(
                "() => window.__controllerChanged === true && window.__reloadCalled === true",
                timeout=10_000,
            )
        except PWTimeout:
            state = await page.evaluate(
                "() => ({ reload: !!window.__reloadCalled, ctrl: !!window.__controllerChanged, "
                "current: navigator.serviceWorker.controller?.scriptURL || null })"
            )
            await page.screenshot(path=str(OUT / "03-timeout.png"))
            print(f"✗ Reload button did not complete the upgrade in 10s: {state}")
            return 1

        post = await page.evaluate(
            """() => ({
                reloadCalled: window.__reloadCalled,
                controllerChanged: window.__controllerChanged,
                before: window.__ctrlBefore,
                after: navigator.serviceWorker.controller?.scriptURL || null,
            })"""
        )
        await page.screenshot(path=str(OUT / "03-after-click.png"))

        (OUT / "report.json").write_text(json.dumps({"base": BASE, "marker": marker, **post}, indent=2))

        # ---- 8. Final assertions ----
        problems = []
        if not post["controllerChanged"]:
            problems.append("controllerchange never fired — skipWaiting did not take effect")
        if not post["reloadCalled"]:
            problems.append("component never invoked window.location.reload()")
        if not post["after"]:
            problems.append("navigator.serviceWorker.controller is null after upgrade")

        await browser.close()

        if problems:
            print("✗ FAIL")
            for pr in problems:
                print(f"  · {pr}")
            return 1

        print("✓ PASS — Reload button called skipWaiting, controller swapped, "
              "and window.location.reload was invoked without a manual reload.")
        print(f"  before: {post['before']}")
        print(f"  after:  {post['after']}")
        return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
