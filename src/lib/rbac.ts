import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createElement, Fragment, type ReactNode, type MouseEvent as ReactMouseEvent, type FormEvent as ReactFormEvent } from "react";
import { logAdminAudit } from "@/lib/admin-audit";




/**
 * Permission keys follow the convention `<page>.<action>` where `<action>` is
 * one of `view` / `create` / `update` / `delete`. Legacy coarse keys such as
 * `settings.manage` and `content.ai` remain valid and are still granted to
 * super_admin.
 */
export type PermissionKey = string;
export type CrudAction = "view" | "create" | "update" | "delete";

/** Extract the admin page slug from a router pathname. Returns null for non-admin routes. */
export function adminPageFromPath(pathname: string): string | null {
  if (!pathname.startsWith("/admin")) return null;
  const rest = pathname.slice("/admin".length).replace(/^\//, "");
  if (!rest) return "dashboard";
  return rest.split("/")[0];
}

/** Returns the `<page>.view` permission required to open an admin route. */
export function permissionForPath(pathname: string): PermissionKey | null {
  const page = adminPageFromPath(pathname);
  return page ? `${page}.view` : null;
}

/** Returns the granular CRUD permission required for an admin route action. */
export function crudPermissionForPath(pathname: string, action: CrudAction): PermissionKey | null {
  const page = adminPageFromPath(pathname);
  return page ? `${page}.${action}` : null;
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
  "content.ai": { en: "Use AI assistant", ar: "استخدام المساعد الذكي" },
};

const DENY_TITLE_EN = "Access denied";
const DENY_TITLE_AR = "تم رفض الوصول";
const DENY_FALLBACK_EN = "You don't have permission for this action.";
const DENY_FALLBACK_AR = "لا تملك الصلاحية لتنفيذ هذا الإجراء.";

const ACTION_LABELS: Record<string, { en: string; ar: string }> = {
  view: { en: "view", ar: "عرض" },
  create: { en: "create", ar: "إنشاء" },
  update: { en: "update", ar: "تعديل" },
  delete: { en: "delete", ar: "حذف" },
  manage: { en: "manage", ar: "إدارة" },
};

function describeMissingPermission(perm?: PermissionKey | null) {
  if (perm && PERMISSION_LABELS[perm]) {
    const { en, ar } = PERMISSION_LABELS[perm];
    return {
      title: `${DENY_TITLE_EN} · ${DENY_TITLE_AR}`,
      description: `Requires: ${en} — يتطلب صلاحية: ${ar}`,
    };
  }
  if (perm && perm.includes(".")) {
    const [page, action] = perm.split(".");
    const nicePage = page.replaceAll("-", " ");
    const actionLabel = ACTION_LABELS[action] ?? { en: action, ar: action };
    return {
      title: `${DENY_TITLE_EN} · ${DENY_TITLE_AR}`,
      description: `Requires: ${actionLabel.en} on ${nicePage} — يتطلب صلاحية: ${actionLabel.ar} على ${nicePage}`,
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

/**
 * Returns a guard bound to the CRUD permission of the currently-active admin
 * page, e.g. `useCrudGuard("create")` on `/admin/leads` checks `leads.create`.
 */
export function useCrudGuard(action: CrudAction) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const perm = crudPermissionForPath(pathname, action);
  return useGuard(perm);
}

