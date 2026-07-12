#!/usr/bin/env python3
"""
End-to-end contract test for the Reload button in <PwaController />.

The full app is a Cloudflare-Workers SSR build, which is impractical to spin
up in CI just to test the SW upgrade chain. Instead we run the SAME code
path — `new Workbox(...)` + `messageSkipWaiting()` + `controlling` event +
`window.location.reload()` — from `src/lib/pwa/register.ts`
(`updateAndReload`) inside a minimal fixture in scripts/pwa-fixture/. If the
wrapper's upgrade contract ever regresses, this test fails.

Flow (identical to the production Reload button):

1. Serve scripts/pwa-fixture/ over HTTP so it counts as a secure origin
   for service workers.
2. Load the fixture, wait until sw.js v1 is `activated` and controlling.
3. Intercept `**/sw.js` and append a version marker → browser sees new
   bytes on reload → new SW moves to `waiting`.
4. Reload once so the browser fetches the mutated SW. Wait for the fixture's
   status to flip to "waiting" (fires when Workbox emits `waiting`).
5. Instrument BEFORE clicking:
     - Stub window.location.reload to set __reloadCalled (no navigation).
     - Listen for `navigator.serviceWorker.controllerchange` → __controllerChanged.
     - Snapshot current controller identity.
6. Click the Reload button.
7. Assert within 10s and with NO manual reload:
     - controllerchange fired  → skipWaiting reached the SW
     - reload was invoked      → updateAndReload finished after `controlling`
     - controller URL is set (SW is now driving the page)

Run:
    python3 scripts/pwa-update-e2e.py

Exit 0 on pass, non-zero on failure. Screenshots + report.json in
qa-report/pwa-update/.
"""

import asyncio
import http.server
import json
import os
import socketserver
import sys
import threading
from pathlib import Path

from playwright.async_api import async_playwright, TimeoutError as PWTimeout

ROOT = Path(__file__).parent.parent
FIXTURE = ROOT / "scripts" / "pwa-fixture"
OUT = ROOT / "qa-report" / "pwa-update"
OUT.mkdir(parents=True, exist_ok=True)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def end_headers(self):
        # Service workers require the .js MIME to be a JS type and no Clear-Site-Data hostility.
        self.send_header("Service-Worker-Allowed", "/")
        super().end_headers()


def start_server() -> tuple[socketserver.TCPServer, int]:
    os.chdir(FIXTURE)
    # Port 0 → let the OS pick a free one so parallel runs don't collide.
    httpd = socketserver.TCPServer(("127.0.0.1", 0), QuietHandler)
    port = httpd.server_address[1]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd, port


async def run() -> int:
    if not FIXTURE.exists():
        print(f"✗ fixture not found at {FIXTURE}")
        return 2

    httpd, port = start_server()
    base = f"http://127.0.0.1:{port}"
    print(f"→ fixture on {base}")

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 900, "height": 700},
                service_workers="allow",
            )
            page = await context.new_page()
            page.on("pageerror", lambda e: print("PAGEERROR:", e))
            page.on("console", lambda m: print("CON:", m.type, m.text))

            # ---- v1 install ----
            await page.goto(base + "/", wait_until="load")
            try:
                v1 = await page.evaluate(
                    """async () => {
                        if (!('serviceWorker' in navigator)) throw new Error('no SW');
                        const reg = await navigator.serviceWorker.ready;
                        if (!navigator.serviceWorker.controller) {
                            // First install won't control the initial page; reload to claim.
                            await new Promise(r => setTimeout(r, 200));
                        }
                        return {
                            active: reg.active?.scriptURL || null,
                            controller: navigator.serviceWorker.controller?.scriptURL || null,
                        };
                    }"""
                )
            except Exception as e:
                await page.screenshot(path=str(OUT / "01-fail.png"))
                print(f"✗ SW never became ready: {e}")
                return 1

            # If not yet controlling (first install), reload once so the active SW takes control.
            if not v1["controller"]:
                await page.reload(wait_until="load")
                await page.wait_for_function(
                    "() => navigator.serviceWorker.controller !== null",
                    timeout=10_000,
                )
                v1["controller"] = await page.evaluate(
                    "() => navigator.serviceWorker.controller?.scriptURL || null"
                )

            print(f"✓ v1 controlling: {v1['controller']}")
            await page.screenshot(path=str(OUT / "01-v1-controlling.png"))

            # ---- mutate sw.js on disk → next update() fetch sees new bytes ----
            # Chromium's SW update pipeline compares byte-for-byte against the
            # installed script; route.fulfill can be short-circuited by the HTTP
            # cache, so mutate the served file directly for a reliable diff.
            sw_path = FIXTURE / "sw.js"
            original = sw_path.read_bytes()
            marker = f"/* pwa-e2e v2 {os.urandom(4).hex()} */"
            try:
                sw_path.write_bytes(original + b"\n" + marker.encode())

                await page.evaluate(
                    "async () => { const r = await navigator.serviceWorker.getRegistration();"
                    " await r.update(); }"
                )
                try:
                    await page.wait_for_function(
                        "() => document.getElementById('status')?.textContent === 'waiting'",
                        timeout=15_000,
                    )
                except PWTimeout:
                    await page.screenshot(path=str(OUT / "02-no-waiting.png"))
                    state = await page.evaluate(
                        """async () => {
                            const regs = await navigator.serviceWorker.getRegistrations();
                            return regs.map(r => ({
                                active: r.active?.scriptURL || null,
                                waiting: r.waiting?.scriptURL || null,
                                installing: r.installing?.scriptURL || null,
                            }));
                        }"""
                    )
                    print(f"✗ new SW never entered `waiting`. regs={state}")
                    return 1
            finally:
                # Restore so the fixture file stays clean between runs.
                sw_path.write_bytes(original)

            print("✓ new SW is waiting; Reload button enabled")
            await page.screenshot(path=str(OUT / "02-waiting.png"))

            # ---- instrument the page ----
            # window.location.reload is a non-configurable native; we can't stub it.
            # Instead we (a) mark a sessionStorage key in `beforeunload` and (b) wait
            # for Playwright's `load` event on the same frame — a true automatic reload
            # will fire both. We also stash the controller URL in sessionStorage so we
            # can compare across the reload boundary.
            before_ctrl = await page.evaluate(
                """() => {
                    const ctrl = navigator.serviceWorker.controller?.scriptURL || null;
                    sessionStorage.setItem('pwaE2E.ctrlBefore', ctrl || '');
                    sessionStorage.removeItem('pwaE2E.unloaded');
                    sessionStorage.removeItem('pwaE2E.controllerChanged');
                    window.addEventListener('beforeunload', () => {
                        sessionStorage.setItem('pwaE2E.unloaded', '1');
                    });
                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                        sessionStorage.setItem('pwaE2E.controllerChanged', '1');
                    }, { once: true });
                    return ctrl;
                }"""
            )
            print(f"  controller before click: {before_ctrl}")

            # ---- click Reload; wait for the automatic navigation ----
            async with page.expect_event("load", timeout=10_000) as load_info:
                await page.click("#reload-btn")
            await load_info.value

            # After the auto-reload, verify the whole chain fired.
            post = await page.evaluate(
                """() => {
                    const nav = performance.getEntriesByType('navigation')[0];
                    return {
                        unloaded: sessionStorage.getItem('pwaE2E.unloaded') === '1',
                        controllerChanged: sessionStorage.getItem('pwaE2E.controllerChanged') === '1',
                        navType: nav?.type || null,
                        before: sessionStorage.getItem('pwaE2E.ctrlBefore') || null,
                        after: navigator.serviceWorker.controller?.scriptURL || null,
                    };
                }"""
            )
            await page.screenshot(path=str(OUT / "03-after-click.png"))

            (OUT / "report.json").write_text(
                json.dumps({"base": base, "marker": marker, **post}, indent=2)
            )

            problems = []
            if not post["unloaded"] or post["navType"] != "reload":
                problems.append(
                    f"Reload button did not trigger window.location.reload() "
                    f"(unloaded={post['unloaded']} navType={post['navType']})"
                )
            if not post["controllerChanged"]:
                problems.append("controllerchange never fired — skipWaiting did not take effect")
            if not post["after"]:
                problems.append("navigator.serviceWorker.controller is null after upgrade")

            await browser.close()

            if problems:
                print("✗ FAIL")
                for pr in problems:
                    print(f"  · {pr}")
                return 1

            print("✓ PASS — Reload button called skipWaiting, controller swapped, "
                  "and the page auto-reloaded without manual intervention.")
            print(f"  before: {post['before']}")
            print(f"  after:  {post['after']}")
            return 0
    finally:
        httpd.shutdown()
        httpd.server_close()


if __name__ == "__main__":
    sys.exit(asyncio.run(run()))
