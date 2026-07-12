import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createElement, Fragment, type ReactNode } from "react";
import { logAdminAudit } from "@/lib/admin-audit";



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

export function notifyAccessDenied(
  perm?: PermissionKey | null,
  context?: { resource?: string; recordId?: string | null; action?: string },
) {
  toast.error(DENY_MSG_EN, {
    description: perm ? `${DENY_MSG_AR}  (${perm})` : DENY_MSG_AR,
  });
  void logAdminAudit({
    action: "PERMISSION_DENIED",
    resource:
      context?.resource ??
      (typeof window !== "undefined" ? window.location.pathname : "admin"),
    recordId: context?.recordId ?? null,
    details: {
      permission: perm ?? null,
      attempted_action: context?.action ?? null,
      pathname: typeof window !== "undefined" ? window.location.pathname : null,
    },
  });
}

/**
 * Returns a guard() wrapper that blocks the action with a toast when the
 * caller lacks `perm`. Also exposes helpers for consistent UI blocking:
 *
 *   const { can, guard, buttonProps, submitProps } = useGuard("users.manage");
 *   <Button {...buttonProps({ pending: isSaving })} onClick={guard(save)}>
 *     Save
 *   </Button>
 *   <form {...submitProps(onSubmit)}>…</form>
 */
export function useGuard(perm: PermissionKey | null | undefined) {
  const { can, isLoading } = useCan(perm);

  function guard<T extends unknown[], R>(
    fn: (...args: T) => R,
    context?: { resource?: string; action?: string; recordId?: string | null },
  ) {
    return (...args: T): R | undefined => {
      if (!can) {
        notifyAccessDenied(perm ?? null, context);
        return undefined;
      }
      return fn(...args);
    };
  }

  /**
   * Spreadable props for any button/action element. When blocked the button is
   * visually disabled (aria-disabled + disabled), keeps focusable semantics,
   * and — if the caller forgets to wrap onClick in `guard` — the pointer-down
   * still gets intercepted. When a mutation is `pending`, the button also
   * disables to prevent duplicate submits.
   */
  function buttonProps(opts?: { pending?: boolean }) {
    const pending = !!opts?.pending;
    const blocked = !can;
    return {
      "aria-disabled": (blocked || pending) as boolean,
      "data-pending": pending || undefined,
      disabled: blocked || pending,
      onClickCapture: (e: React.MouseEvent) => {
        if (blocked) {
          e.preventDefault();
          e.stopPropagation();
          notifyAccessDenied(perm ?? null);
        }
      },
    } as const;
  }

  /**
   * Spreadable props for a <form>. Blocks submit entirely when the user lacks
   * permission — preventing browser-native form actions AND user handlers.
   */
  function submitProps<E extends HTMLFormElement>(
    handler: (e: React.FormEvent<E>) => void | Promise<void>,
    context?: { resource?: string; action?: string; recordId?: string | null },
  ) {
    return {
      "aria-disabled": (!can) as boolean,
      onSubmit: (e: React.FormEvent<E>) => {
        if (!can) {
          e.preventDefault();
          e.stopPropagation();
          notifyAccessDenied(perm ?? null, context);
          return;
        }
        return handler(e);
      },
    } as const;
  }

  return { can, isLoading, guard, buttonProps, submitProps };
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
  return createElement(Fragment, null, can ? children : fallback);
}



