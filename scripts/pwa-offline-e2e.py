#!/usr/bin/env python3
"""
Offline navigation E2E for the PWA.

The production SW is built by vite-plugin-pwa with:
  - NetworkFirst for `request.mode === 'navigate'` (4s timeout)
  - navigateFallback: '/offline.html'

Spinning up the full Cloudflare-Workers SSR build in CI just to test that
contract is impractical, so this test runs a minimal fixture in
scripts/pwa-offline-fixture/ whose sw.js replays the same runtime-caching
rule against a real Chromium.

Assertions:

1. Cached-route offline navigation
     - Visit / while online → SW precaches /, /about.html, /offline.html.
     - Go offline (context.set_offline(True)).
     - Click <a href="/about.html"> → About page loads from cache.

2. Uncached-route offline navigation
     - Still offline, click <a href="/never-cached.html">.
     - The SW must serve the /offline.html fallback (not a browser error).
     - Assert the [data-testid="offline-marker"] element is visible.

3. Recovery
     - Go back online, navigate to /never-cached.html which now returns a real
       404 from the origin — the SW should NOT keep hiding it behind the
       offline fallback (proves NetworkFirst reaches the network again).

Run:  python3 scripts/pwa-offline-e2e.py
Exit: 0 pass, non-zero fail. Screenshots + report.json in qa-report/pwa-offline/.
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
FIXTURE = ROOT / "scripts" / "pwa-offline-fixture"
OUT = ROOT / "qa-report" / "pwa-offline"
OUT.mkdir(parents=True, exist_ok=True)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def end_headers(self):
        self.send_header("Service-Worker-Allowed", "/")
        # Prevent HTTP cache from masking the network layer — we want the SW
        # to be the only source of "cached" responses during the offline steps.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def start_server() -> tuple[socketserver.TCPServer, int]:
    os.chdir(FIXTURE)
    httpd = socketserver.TCPServer(("127.0.0.1", 0), QuietHandler)
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, port


async def wait_for_controller(page, timeout=10_000) -> None:
    await page.wait_for_function(
        "() => navigator.serviceWorker.controller !== null", timeout=timeout
    )


async def run() -> int:
    if not FIXTURE.exists():
        print(f"✗ fixture not found at {FIXTURE}")
        return 2

    httpd, port = start_server()
    base = f"http://127.0.0.1:{port}"
    print(f"→ fixture on {base}")

    problems: list[str] = []

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 900, "height": 700},
                service_workers="allow",
            )
            page = await context.new_page()
            page.on("pageerror", lambda e: print("PAGEERROR:", e))

            # ---- 1. warm the cache online ----
            await page.goto(base + "/index.html", wait_until="load")
            await page.wait_for_function(
                "() => document.body.dataset.registered === '1'", timeout=10_000
            )
            # First load usually isn't controlled — reload once so `clients.claim`
            # + `activate` make the SW authoritative for this page.
            if await page.evaluate("() => !navigator.serviceWorker.controller"):
                await page.reload(wait_until="load")
                await wait_for_controller(page)
            # Warm the About cache entry with a real navigation while online.
            await page.click("#to-about")
            await page.wait_for_selector("[data-testid=page]:has-text('About')")
            await page.goto(base + "/index.html", wait_until="load")
            await wait_for_controller(page)
            await page.screenshot(path=str(OUT / "01-online-home.png"))
            print("✓ SW controls page; /about.html precached via navigation")

            # ---- 2. drop the network ----
            await context.set_offline(True)
            print("→ offline")

            # 2a. Cached route still navigates.
            try:
                await page.click("#to-about")
                await page.wait_for_selector(
                    "[data-testid=page]:has-text('About')", timeout=8_000
                )
                await page.screenshot(path=str(OUT / "02-offline-cached.png"))
                print("✓ offline navigation to cached /about.html works")
            except PWTimeout:
                await page.screenshot(path=str(OUT / "02-fail.png"))
                problems.append("cached route did not load while offline")

            # Back to home for the next step.
            await page.goto(base + "/index.html", wait_until="load")

            # 2b. Uncached route → offline.html fallback.
            try:
                await page.click("#to-missing")
                await page.wait_for_selector(
                    "[data-testid=offline-marker]", timeout=8_000
                )
                title = await page.title()
                heading = await page.text_content("[data-testid=page]")
                await page.screenshot(path=str(OUT / "03-offline-fallback.png"))
                if title != "Offline" or heading != "Offline":
                    problems.append(
                        f"offline fallback rendered wrong document (title={title!r} heading={heading!r})"
                    )
                else:
                    print("✓ uncached route served /offline.html while offline")
            except PWTimeout:
                await page.screenshot(path=str(OUT / "03-fail.png"))
                problems.append("uncached offline navigation did not render offline.html")

            # ---- 3. recovery ----
            await context.set_offline(False)
            print("→ back online")
            # /online-only.html exists on the origin but isn't in the SW cache.
            # NetworkFirst must reach the network and serve it, not the offline page.
            resp = await page.goto(base + "/online-only.html", wait_until="load")
            status = resp.status if resp else None
            heading = await page.text_content("[data-testid=page]")
            marker = await page.query_selector("[data-testid=offline-marker]")
            if status != 200 or heading != "Online only" or marker is not None:
                problems.append(
                    f"after coming back online, SW did not serve the network response "
                    f"(status={status} heading={heading!r} offlineMarker={marker is not None})"
                )
            await page.screenshot(path=str(OUT / "04-recovered.png"))

            report = {
                "base": base,
                "problems": problems,
                "recovery_status": status,
            }
            (OUT / "report.json").write_text(json.dumps(report, indent=2))

            await browser.close()

        if problems:
            print("✗ FAIL")
            for pr in problems:
                print(f"  · {pr}")
            return 1

        print("✓ PASS — PWA navigations work online and cached; /offline.html is "
              "served when the network is off and an uncached route is requested.")
        return 0
    finally:
        httpd.shutdown()
        httpd.server_close()


if __name__ == "__main__":
    sys.exit(asyncio.run(run()))
