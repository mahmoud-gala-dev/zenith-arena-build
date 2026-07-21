import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/reset-admin-pw")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = request.headers.get("x-secret") ?? "";
        if (!secret || secret !== process.env.N8N_INBOUND_SECRET) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { email, password } = (await request.json()) as { email: string; password: string };
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: list, error: le } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (le) return new Response(le.message, { status: 500 });
        const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (!user) return new Response("User not found", { status: 404 });
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password,
          email_confirm: true,
        });
        if (error) return new Response(error.message, { status: 500 });
        return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
      },
    },
  },
});
