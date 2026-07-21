import { createServerFn } from "@tanstack/react-start";

export const resetAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string; token: string }) => d)
  .handler(async ({ data }) => {
    if (data.token !== process.env.N8N_INBOUND_SECRET) {
      throw new Error("Unauthorized");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list, error: le } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (le) throw le;
    const user = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    if (!user) throw new Error("User not found");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: data.password,
      email_confirm: true,
    });
    if (error) throw error;
    return { ok: true };
  });
