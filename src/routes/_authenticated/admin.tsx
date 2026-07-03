import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw redirect({ to: "/auth" });
    const { data: isStaff } = await supabase.rpc("is_staff", { _user_id: uid });
    return { userId: uid, isStaff: !!isStaff };
  },
  component: AdminGate,
});

function AdminGate() {
  const { isStaff } = Route.useRouteContext();
  if (!isStaff) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-3xl font-bold">Access denied — غير مصرح</h1>
        <p className="text-muted-foreground max-w-md">
          Your account doesn't have staff permissions.
          <br />
          حسابك لا يملك صلاحيات الوصول إلى لوحة الإدارة.
        </p>
        <div className="flex gap-3 mt-2">
          <Link to="/" className="underline">← Back to site</Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/auth";
            }}
            className="underline text-muted-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }
  return <Outlet />;
}
