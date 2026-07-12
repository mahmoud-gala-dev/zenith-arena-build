import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ReactNode } from "react";


export type PermissionKey =
  | "dashboard.view"
  | "pages.manage"
  | "services.manage"
  | "products.manage"
  | "projects.manage"
  | "blog.manage"
  | "leads.manage"
  | "media.manage"
  | "settings.manage"
  | "users.manage";

/**
 * Maps admin route pathname prefixes to the permission required to view/edit them.
 * Order matters: longest/most-specific paths first.
 */
const ROUTE_PERMISSIONS: Array<{ prefix: string; perm: PermissionKey }> = [
  { prefix: "/admin/users", perm: "users.manage" },
  { prefix: "/admin/settings-keys", perm: "settings.manage" },
  { prefix: "/admin/settings", perm: "settings.manage" },
  { prefix: "/admin/seo", perm: "settings.manage" },
  { prefix: "/admin/translations", perm: "settings.manage" },
  { prefix: "/admin/social-cache", perm: "settings.manage" },
  { prefix: "/admin/qa-reports", perm: "settings.manage" },
  { prefix: "/admin/audit-logs", perm: "settings.manage" },
  { prefix: "/admin/media", perm: "media.manage" },
  { prefix: "/admin/gallery", perm: "media.manage" },
  { prefix: "/admin/hero-slides", perm: "pages.manage" },
  { prefix: "/admin/pages", perm: "pages.manage" },
  { prefix: "/admin/about", perm: "pages.manage" },
  { prefix: "/admin/legal", perm: "pages.manage" },
  { prefix: "/admin/services", perm: "services.manage" },
  { prefix: "/admin/products", perm: "products.manage" },
  { prefix: "/admin/downloads-analytics", perm: "products.manage" },
  { prefix: "/admin/downloads", perm: "products.manage" },
  { prefix: "/admin/download-leads", perm: "leads.manage" },
  { prefix: "/admin/leads", perm: "leads.manage" },
  { prefix: "/admin/newsletter", perm: "leads.manage" },
  { prefix: "/admin/applications", perm: "leads.manage" },
  { prefix: "/admin/projects", perm: "projects.manage" },
  { prefix: "/admin/governorates", perm: "projects.manage" },
  { prefix: "/admin/clients", perm: "projects.manage" },
  { prefix: "/admin/certificates", perm: "projects.manage" },
  { prefix: "/admin/testimonials", perm: "projects.manage" },
  { prefix: "/admin/faqs", perm: "projects.manage" },
  { prefix: "/admin/careers", perm: "projects.manage" },
  { prefix: "/admin/blog", perm: "blog.manage" },
  { prefix: "/admin/categories", perm: "blog.manage" },
  { prefix: "/admin", perm: "dashboard.view" },
];

export function permissionForPath(pathname: string): PermissionKey | null {
  for (const { prefix, perm } of ROUTE_PERMISSIONS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return perm;
  }
  return null;
}

async function fetchMyPermissions(): Promise<PermissionKey[]> {
  const { data, error } = await supabase.rpc("get_my_permissions");
  if (error) return [];
  return ((data as string[] | null) ?? []) as PermissionKey[];
}

export function useMyPermissions() {
  return useQuery({
    queryKey: ["rbac", "my-permissions"],
    queryFn: fetchMyPermissions,
    staleTime: 60_000,
  });
}

export function useCan(perm: PermissionKey | null | undefined) {
  const { data, isLoading } = useMyPermissions();
  if (!perm) return { can: true, isLoading };
  return { can: (data ?? []).includes(perm), isLoading };
}

const DENY_MSG_EN = "Access denied — you don't have permission for this action.";
const DENY_MSG_AR = "لا تملك الصلاحية لتنفيذ هذا الإجراء.";

export function notifyAccessDenied(perm?: PermissionKey | null) {
  toast.error(DENY_MSG_EN, {
    description: perm ? `${DENY_MSG_AR}  (${perm})` : DENY_MSG_AR,
  });
}

/**
 * Returns a guard() wrapper that blocks the action with a toast when the
 * caller lacks `perm`. Also exposes `can` for disabling UI in the same call.
 *
 *   const { can, guard } = useGuard("users.manage");
 *   <Button disabled={!can} onClick={guard(async () => save())}>Save</Button>
 */
export function useGuard(perm: PermissionKey | null | undefined) {
  const { can, isLoading } = useCan(perm);
  function guard<T extends unknown[], R>(fn: (...args: T) => R) {
    return (...args: T): R | undefined => {
      if (!can) {
        notifyAccessDenied(perm ?? null);
        return undefined;
      }
      return fn(...args);
    };
  }
  return { can, isLoading, guard };
}

/** Conditionally renders children only when the current user has `perm`. */
export function Can({
  perm,
  fallback = null,
  children,
}: {
  perm: PermissionKey | null | undefined;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can, isLoading } = useCan(perm);
  if (isLoading) return null;
  return <>{can ? children : fallback}</>;
}

