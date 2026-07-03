import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw redirect({ to: "/auth" });
    const { data: isStaff, error } = await supabase.rpc("is_staff", { _user_id: uid });
    if (error || !isStaff) {
      throw redirect({ to: "/admin/unauthorized" as never });
    }
    return { userId: uid };
  },
  component: () => <Outlet />,
  notFoundComponent: Unauthorized,
});

function Unauthorized() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold">Access denied — غير مصرح</h1>
      <p className="text-muted-foreground max-w-md">
        Your account doesn't have staff permissions to access the admin panel.
        <br />
        حسابك لا يملك صلاحيات الوصول إلى لوحة الإدارة.
      </p>
      <Link to="/" className="underline">← Back to site / العودة إلى الموقع</Link>
    </div>
  );
}
