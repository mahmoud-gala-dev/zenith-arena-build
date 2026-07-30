/**
 * Durable rate limiting backed by the database.
 *
 * The previous in-memory Map only limited a single Worker isolate, so attackers
 * could bypass it simply by spreading requests across instances. `rate_limit_hit`
 * is an atomic SECURITY DEFINER function (service_role only) that counts recent
 * attempts and records the current one in a single round-trip.
 */
export async function rateLimitOk(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("rate_limit_hit", {
      _key: key,
      _max: max,
      _window_seconds: windowSeconds,
    });
    if (error) {
      console.error("[rateLimit] rpc failed", error);
      // Fail open on infrastructure errors so genuine users are never blocked.
      return true;
    }
    return data === true;
  } catch (err) {
    console.error("[rateLimit] unexpected error", err);
    return true;
  }
}

export function requestIp(req: Request | null | undefined): string {
  return (
    req?.headers.get("cf-connecting-ip") ||
    req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
