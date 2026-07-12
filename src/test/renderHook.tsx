/**
 * Tiny helper: mount a hook inside a QueryClientProvider and return the last
 * captured value. We avoid @testing-library/react's `renderHook` to keep the
 * setup portable across React 18/19 shipping in the workspace.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, act, cleanup } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderHookWithClient<T>(hook: () => T, qc = makeQueryClient()) {
  const captured: { current: T | undefined } = { current: undefined };
  function HookHost() {
    captured.current = hook();
    return null;
  }
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  const utils = render(createElement(wrapper, null, createElement(HookHost)));
  return {
    ...utils,
    result: captured,
    async waitForNextUpdate(cond: () => boolean, timeoutMs = 1000) {
      const start = Date.now();
      while (!cond()) {
        if (Date.now() - start > timeoutMs) throw new Error("waitForNextUpdate timed out");
        await act(async () => {
          await new Promise((r) => setTimeout(r, 10));
        });
      }
    },
  };
}
