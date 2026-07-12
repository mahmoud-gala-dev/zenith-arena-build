import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAudit } from "@/lib/admin-audit";
import {
  useCan,
  useGuard,
  notifyAccessDenied,
  permissionForPath,
  type PermissionKey,
} from "@/lib/rbac";
import { renderHookWithClient } from "@/test/renderHook";

const rpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;
const toastError = toast.error as unknown as ReturnType<typeof vi.fn>;
const auditMock = logAdminAudit as unknown as ReturnType<typeof vi.fn>;

function seedPermissions(perms: PermissionKey[]) {
  rpc.mockReset();
  rpc.mockResolvedValue({ data: perms, error: null });
}

beforeEach(() => {
  toastError.mockReset();
  auditMock.mockReset();
  rpc.mockReset();
  rpc.mockResolvedValue({ data: [], error: null });
});

// ---------------------------------------------------------------------------
// permissionForPath
// ---------------------------------------------------------------------------
describe("permissionForPath", () => {
  it("maps /admin/users → users.manage (most specific wins over /admin)", () => {
    expect(permissionForPath("/admin/users")).toBe("users.manage");
    expect(permissionForPath("/admin/users/123")).toBe("users.manage");
  });
  it("maps /admin/leads and its children → leads.manage", () => {
    expect(permissionForPath("/admin/leads")).toBe("leads.manage");
    expect(permissionForPath("/admin/leads/42")).toBe("leads.manage");
  });
  it("falls back to dashboard.view for bare /admin", () => {
    expect(permissionForPath("/admin")).toBe("dashboard.view");
  });
  it("returns null outside /admin", () => {
    expect(permissionForPath("/")).toBeNull();
    expect(permissionForPath("/services")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// notifyAccessDenied — unified bilingual toast
// ---------------------------------------------------------------------------
describe("notifyAccessDenied", () => {
  it("emits a bilingual title and a labeled reason for a known permission", () => {
    notifyAccessDenied("leads.manage");
    expect(toastError).toHaveBeenCalledTimes(1);
    const [title, opts] = toastError.mock.calls[0];
    expect(title).toContain("Access denied");
    expect(title).toContain("تم رفض الوصول");
    expect(opts.description).toContain("Manage leads");
    expect(opts.description).toContain("إدارة العملاء المحتملين");
    // never leaks the raw key in the description
    expect(opts.description).not.toContain("leads.manage");
    // dedupes via stable id
    expect(opts.id).toBe("access-denied:leads.manage");
  });

  it("uses the generic fallback when no permission is provided", () => {
    notifyAccessDenied(null);
    const [, opts] = toastError.mock.calls[0];
    expect(opts.description).toContain("You don't have permission");
    expect(opts.description).toContain("لا تملك الصلاحية");
  });

  it("writes an audit event with the permission and pathname", async () => {
    notifyAccessDenied("users.manage", { resource: "admin.users", action: "update_role" });
    // flush the void logAdminAudit() microtask
    await Promise.resolve();
    expect(auditMock).toHaveBeenCalledTimes(1);
    const [payload] = auditMock.mock.calls[0];
    expect(payload.action).toBe("PERMISSION_DENIED");
    expect(payload.resource).toBe("admin.users");
    expect(payload.details.permission).toBe("users.manage");
    expect(payload.details.attempted_action).toBe("update_role");
  });
});

// ---------------------------------------------------------------------------
// useCan — reads memoized RPC result
// ---------------------------------------------------------------------------
describe("useCan", () => {
  it("returns can=true only when the permission is present", async () => {
    seedPermissions(["leads.manage"]);
    const { result, waitForNextUpdate } = renderHookWithClient(() => ({
      leads: useCan("leads.manage"),
      users: useCan("users.manage"),
    }));
    await waitForNextUpdate(() => result.current?.leads.isLoading === false);
    expect(result.current!.leads.can).toBe(true);
    expect(result.current!.users.can).toBe(false);
  });

  it("treats a null permission as allowed (no gate configured)", async () => {
    seedPermissions([]);
    const { result } = renderHookWithClient(() => useCan(null));
    expect(result.current!.can).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// useGuard.guard — blocks callbacks with a toast, executes when allowed
// ---------------------------------------------------------------------------
describe("useGuard.guard", () => {
  it("blocks the wrapped callback and fires the deny toast when denied (admin.users CRUD)", async () => {
    seedPermissions([]); // no users.manage
    const fn = vi.fn().mockReturnValue("ran");
    const { result, waitForNextUpdate } = renderHookWithClient(() =>
      useGuard("users.manage"),
    );
    await waitForNextUpdate(() => result.current?.isLoading === false);
    const wrapped = result.current!.guard(fn, { action: "assign_role" });
    const ret = wrapped();
    expect(ret).toBeUndefined();
    expect(fn).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError.mock.calls[0][1].description).toContain("Manage users");
  });

  it("passes through arguments and return value when the permission is granted (admin.leads CRUD)", async () => {
    seedPermissions(["leads.manage"]);
    const fn = vi.fn((a: number, b: number) => a + b);
    const { result, waitForNextUpdate } = renderHookWithClient(() =>
      useGuard("leads.manage"),
    );
    await waitForNextUpdate(() => result.current?.isLoading === false);
    const wrapped = result.current!.guard(fn);
    expect(wrapped(2, 3)).toBe(5);
    expect(fn).toHaveBeenCalledWith(2, 3);
    expect(toastError).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useGuard.buttonProps / submitProps — consistent block UX
// ---------------------------------------------------------------------------
function withClient(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(createElement(QueryClientProvider, { client: qc }, node));
}

describe("useGuard.buttonProps + submitProps", () => {
  it("marks the button aria-disabled and intercepts onClick when denied (admin.leads.manage missing)", async () => {
    seedPermissions([]); // no leads.manage
    const clicked = vi.fn();
    function Host() {
      const { buttonProps } = useGuard("leads.manage");
      const bp = buttonProps();
      return createElement(
        "button",
        {
          "data-testid": "delete-lead",
          onClick: clicked,
          ...bp,
        },
        "Delete",
      );
    }
    const { getByTestId } = withClient(createElement(Host));
    // wait a tick for the RPC to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    const btn = getByTestId("delete-lead") as HTMLButtonElement;
    expect(btn.getAttribute("aria-disabled")).toBe("true");
    expect(btn.disabled).toBe(true);
    fireEvent.click(btn);
    expect(clicked).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError.mock.calls[0][1].description).toContain("Manage leads");
  });

  it("marks the button aria-disabled during a permitted pending mutation (loading state)", async () => {
    seedPermissions(["leads.manage"]);
    function Host({ pending }: { pending: boolean }) {
      const { buttonProps } = useGuard("leads.manage");
      const bp = buttonProps({ pending });
      return createElement(
        "button",
        { "data-testid": "save-lead", ...bp },
        pending ? "Saving…" : "Save",
      );
    }
    const { getByTestId, rerender } = withClient(createElement(Host, { pending: false }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    const btn = getByTestId("save-lead") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.getAttribute("aria-disabled")).toBe("false");

    // simulate the mutation firing
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    rerender(
      createElement(QueryClientProvider, { client: qc }, createElement(Host, { pending: true })),
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    const btn2 = getByTestId("save-lead") as HTMLButtonElement;
    expect(btn2.disabled).toBe(true);
    expect(btn2.getAttribute("aria-disabled")).toBe("true");
    expect(btn2.getAttribute("data-pending")).toBe("true");
  });

  it("submitProps preventDefaults and blocks the handler when denied", async () => {
    seedPermissions([]); // no users.manage
    const handler = vi.fn();
    function Host() {
      const { submitProps } = useGuard("users.manage");
      return createElement(
        "form",
        { "data-testid": "role-form", ...submitProps(handler) },
        createElement("button", { type: "submit" }, "Save role"),
      );
    }
    const { getByTestId } = withClient(createElement(Host));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    const form = getByTestId("role-form") as HTMLFormElement;
    expect(form.getAttribute("aria-disabled")).toBe("true");
    fireEvent.submit(form);
    expect(handler).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it("submitProps invokes the handler when the permission is granted", async () => {
    seedPermissions(["users.manage"]);
    const handler = vi.fn();
    function Host() {
      const { submitProps } = useGuard("users.manage");
      return createElement(
        "form",
        { "data-testid": "role-form", ...submitProps(handler) },
        createElement("button", { type: "submit" }, "Save role"),
      );
    }
    const { getByTestId } = withClient(createElement(Host));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    fireEvent.submit(getByTestId("role-form"));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(toastError).not.toHaveBeenCalled();
  });
});
