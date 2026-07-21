import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createElement, Fragment, type ReactNode, type MouseEvent as ReactMouseEvent, type FormEvent as ReactFormEvent } from "react";
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
  | "users.manage"
  | "content.ai";

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

/**
 * Human-readable, bilingual labels for each permission. Kept intentionally
 * generic — we surface *why* an action was blocked without exposing internal
 * policy keys, table names, or record identifiers to the UI.
 */
const PERMISSION_LABELS: Record<PermissionKey, { en: string; ar: string }> = {
  "dashboard.view": { en: "View admin dashboard", ar: "عرض لوحة التحكم" },
  "pages.manage": { en: "Manage site pages", ar: "إدارة صفحات الموقع" },
  "services.manage": { en: "Manage services", ar: "إدارة الخدمات" },
  "products.manage": { en: "Manage products", ar: "إدارة المنتجات" },
  "projects.manage": { en: "Manage projects", ar: "إدارة المشاريع" },
  "blog.manage": { en: "Manage knowledge center", ar: "إدارة مركز المعرفة" },
  "leads.manage": { en: "Manage leads", ar: "إدارة العملاء المحتملين" },
  "media.manage": { en: "Manage media library", ar: "إدارة مكتبة الوسائط" },
  "settings.manage": { en: "Manage site settings", ar: "إدارة إعدادات الموقع" },
  "users.manage": { en: "Manage users & roles", ar: "إدارة المستخدمين والأدوار" },
};

const DENY_TITLE_EN = "Access denied";
const DENY_TITLE_AR = "تم رفض الوصول";
const DENY_FALLBACK_EN = "You don't have permission for this action.";
const DENY_FALLBACK_AR = "لا تملك الصلاحية لتنفيذ هذا الإجراء.";

function describeMissingPermission(perm?: PermissionKey | null) {
  if (perm && PERMISSION_LABELS[perm]) {
    const { en, ar } = PERMISSION_LABELS[perm];
    return {
      title: `${DENY_TITLE_EN} · ${DENY_TITLE_AR}`,
      description: `Requires: ${en} — يتطلب صلاحية: ${ar}`,
    };
  }
  return {
    title: `${DENY_TITLE_EN} · ${DENY_TITLE_AR}`,
    description: `${DENY_FALLBACK_EN} — ${DENY_FALLBACK_AR}`,
  };
}

export function notifyAccessDenied(
  perm?: PermissionKey | null,
  context?: { resource?: string; recordId?: string | null; action?: string },
) {
  const { title, description } = describeMissingPermission(perm);
  toast.error(title, {
    id: `access-denied:${perm ?? "unknown"}`,
    description,
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
      onClickCapture: (e: ReactMouseEvent) => {
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
    handler: (e: ReactFormEvent<E>) => void | Promise<void>,
    context?: { resource?: string; action?: string; recordId?: string | null },
  ) {
    return {
      "aria-disabled": (!can) as boolean,
      onSubmit: (e: ReactFormEvent<E>) => {
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

/**
 * Convenience: returns a `useGuard()` bound to the permission that controls
 * the current admin route (via `permissionForPath`). Lets any admin page
 * disable its mutating buttons/forms consistently without hardcoding the
 * permission key it already inherits from the router:
 *
 *   const { can, buttonProps, submitProps } = useAdminPageGuard();
 *   <Button {...buttonProps({ pending: isSaving })}>Save</Button>
 */
export function useAdminPageGuard() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const perm = permissionForPath(pathname);
  return useGuard(perm);
}




