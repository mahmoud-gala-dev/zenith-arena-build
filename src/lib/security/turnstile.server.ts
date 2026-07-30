/**
 * Cloudflare Turnstile verification (server-only).
 *
 * Enforcement is opt-in by configuration: when `TURNSTILE_SECRET_KEY` is not
 * set the check is skipped so public forms keep working before the keys are
 * added. Once the secret exists, every guarded submission must carry a valid,
 * unused token.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult =
  | { ok: true; skipped: boolean }
  | { ok: false; reason: string };

export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string | null,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };

  if (!token || token.length < 10 || token.length > 4096) {
    return { ok: false, reason: "missing_token" };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (json.success) return { ok: true, skipped: false };
    const codes = json["error-codes"] ?? ["invalid"];
    // Misconfiguration on our side (bad/placeholder secret key) must not block
    // real customers from submitting — log loudly and let the request through.
    if (codes.some((c) => c === "invalid-input-secret" || c === "missing-input-secret")) {
      console.error("[turnstile] TURNSTILE_SECRET_KEY is invalid — captcha bypassed", codes);
      return { ok: true, skipped: true };
    }
    return { ok: false, reason: codes.join(",") };
  } catch (err) {
    console.error("[turnstile] verification request failed", err);
    // Fail closed: a configured captcha that cannot be verified must not pass.
    return { ok: false, reason: "verification_unavailable" };
  }
}
