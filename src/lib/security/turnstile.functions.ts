import { createServerFn } from "@tanstack/react-start";

/**
 * Exposes the (publishable) Turnstile site key to the browser.
 * Returns null when the captcha is not configured, so forms render normally.
 */
export const getTurnstileConfig = createServerFn({ method: "GET" }).handler(async () => {
  const siteKey = process.env.TURNSTILE_SITE_KEY ?? null;
  return {
    siteKey,
    enforced: Boolean(process.env.TURNSTILE_SECRET_KEY) && Boolean(siteKey),
  };
});
