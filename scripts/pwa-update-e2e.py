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

            # ---- intercept sw.js → return original + marker ----
            marker = f"/* pwa-e2e v2 {os.urandom(4).hex()} */"

            async def handle_sw(route):
                resp = await route.fetch()
                body = await resp.body()
                new_body = body + b"\n" + marker.encode()
                headers = {k: v for k, v in resp.headers.items()}
                headers["content-length"] = str(len(new_body))
                await route.fulfill(status=200, headers=headers, body=new_body)

            await context.route("**/sw.js", handle_sw)

            # ---- reload → new SW installs → parks in waiting ----
            await page.reload(wait_until="load")
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

            print("✓ new SW is waiting; Reload button enabled")
            await page.screenshot(path=str(OUT / "02-waiting.png"))

            # ---- instrument the page ----
            before = await page.evaluate(
                """() => {
                    window.__reloadCalled = false;
                    window.__controllerChanged = false;
                    window.__ctrlBefore = navigator.serviceWorker.controller?.scriptURL || null;
                    try {
                        Object.defineProperty(window.location, 'reload', {
                            configurable: true,
                            value: () => { window.__reloadCalled = true; },
                        });
                    } catch { window.reload = () => { window.__reloadCalled = true; }; }
                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                        window.__controllerChanged = true;
                    }, { once: true });
                    return window.__ctrlBefore;
                }"""
            )
            print(f"  controller before click: {before}")

            # ---- click Reload (the behavior under test) ----
            await page.click("#reload-btn")

            # ---- wait for both signals within 10s ----
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

            (OUT / "report.json").write_text(
                json.dumps({"base": base, "marker": marker, **post}, indent=2)
            )

            problems = []
            if not post["controllerChanged"]:
                problems.append("controllerchange never fired — skipWaiting did not take effect")
            if not post["reloadCalled"]:
                problems.append("updateAndReload never invoked window.location.reload()")
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
    finally:
        httpd.shutdown()
        httpd.server_close()


if __name__ == "__main__":
    sys.exit(asyncio.run(run()))
