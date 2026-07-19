import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Silence sonner side effects in tests; we spy on the mock instead.
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    message: vi.fn(),
  }),
}));

// Never hit Supabase during unit tests.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
    },
  },
}));

// Don't write audit rows from tests.
vi.mock("@/lib/admin-audit", () => ({
  logAdminAudit: vi.fn().mockResolvedValue(undefined),
}));

// Enable React act() environment for hydrateRoot/createRoot tests.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

