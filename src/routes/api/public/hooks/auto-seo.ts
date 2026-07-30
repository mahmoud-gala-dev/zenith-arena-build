import { createFileRoute } from "@tanstack/react-router";
import { runAutoSeo } from "@/lib/ai/auto-seo.functions";

export const Route = createFileRoute("/api/public/hooks/auto-seo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Verify the caller with a dedicated cron secret. The Supabase
        // publishable key must NOT be used here: it ships in the client bundle,
        // so anyone could trigger paid AI work (cost/DoS).
        const expected = process.env.CRON_TASK_SECRET ?? "";
        const provided =
          request.headers.get("x-cron-secret") ??
          (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
        if (!expected || provided !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
            status: 500, headers: { "content-type": "application/json" },
          });
        }
        let body: { table?: any; limit?: number } = {};
        try { body = await request.json(); } catch {}

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const result = await runAutoSeo(supabaseAdmin, key, { table: body.table, limit: body.limit ?? 10 });

        await supabaseAdmin.from("ai_usage_logs").insert({
          action: "auto_seo_cron",
          model: "google/gemini-3-flash-preview",
          success: true,
          total_tokens: 0,
          duration_ms: 0,
        });

        return new Response(JSON.stringify({ success: true, ...result }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
