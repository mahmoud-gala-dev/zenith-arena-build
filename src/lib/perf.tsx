/**
 * Lightweight performance instrumentation.
 * - Web Vitals (LCP, CLS, INP, TTFB, FCP) via `web-vitals`.
 * - React render timings via `<PerfProfiler>` (a thin wrapper around React.Profiler).
 *
 * Runs client-only. Reports are logged to the console and buffered on
 * `window.__perf` so QA scripts / devtools can inspect them.
 * Enable verbose logging with `localStorage.setItem("perf:verbose", "1")`.
 */
import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from "react";

type VitalReport = {
  name: string;
  value: number;
  rating?: string;
  id: string;
  navigationType?: string;
  ts: number;
};

type RenderReport = {
  id: string;
  phase: "mount" | "update" | "nested-update";
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
};

export type PerfEvent = {
  type: string;
  ts: number;
  data?: Record<string, unknown>;
};

type PerfBuffer = {
  vitals: VitalReport[];
  renders: RenderReport[];
  events: PerfEvent[];
  logEvent: (type: string, data?: Record<string, unknown>) => void;
  summary: () => Record<string, unknown>;
};

declare global {
  interface Window {
    __perf?: PerfBuffer;
  }
}


const isVerbose = () => {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem("perf:verbose") === "1";
  } catch {
    return false;
  }
};

function ensureBuffer(): PerfBuffer {
  const makeStub = (): PerfBuffer => ({
    vitals: [],
    renders: [],
    events: [],
    logEvent: () => {},
    summary: () => ({}),
  });
  if (typeof window === "undefined") return makeStub();
  if (window.__perf) return window.__perf;
  const buf: PerfBuffer = {
    vitals: [],
    renders: [],
    events: [],
    logEvent(type, data) {
      const ev: PerfEvent = { type, ts: performance.now(), data };
      buf.events.push(ev);
      if (isVerbose()) {
        // eslint-disable-next-line no-console
        console.info(`[perf:event] ${type}`, data ?? "");
      }
    },
    summary() {
      const byId: Record<string, { count: number; totalActual: number; maxActual: number }> = {};
      for (const r of buf.renders) {
        const s = (byId[r.id] ??= { count: 0, totalActual: 0, maxActual: 0 });
        s.count += 1;
        s.totalActual += r.actualDuration;
        s.maxActual = Math.max(s.maxActual, r.actualDuration);
      }
      const vitals: Record<string, number> = {};
      for (const v of buf.vitals) vitals[v.name] = v.value;
      return { vitals, renders: byId, events: buf.events.slice(-50) };
    },
  };
  window.__perf = buf;
  return buf;
}

export function logPerfEvent(type: string, data?: Record<string, unknown>) {
  ensureBuffer().logEvent(type, data);
}


let started = false;
export function initPerf() {
  if (started || typeof window === "undefined") return;
  started = true;
  const buf = ensureBuffer();

  void import("web-vitals").then(({ onLCP, onCLS, onINP, onTTFB, onFCP }) => {
    const push = (m: {
      name: string;
      value: number;
      rating?: string;
      id: string;
      navigationType?: string;
    }) => {
      const r: VitalReport = { ...m, ts: performance.now() };
      buf.vitals.push(r);
      if (isVerbose()) {
        // eslint-disable-next-line no-console
        console.info(`[perf] ${r.name} = ${r.value.toFixed(1)} (${r.rating ?? "n/a"})`);
      }
    };
    onLCP(push);
    onCLS(push);
    onINP(push);
    onTTFB(push);
    onFCP(push);
  });
}

const WARN_MS = 16; // one frame @60fps

const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
  const buf = ensureBuffer();
  buf.renders.push({ id, phase, actualDuration, baseDuration, startTime, commitTime });
  if (actualDuration > WARN_MS && isVerbose()) {
    // eslint-disable-next-line no-console
    console.warn(`[perf] slow render "${id}" ${phase} ${actualDuration.toFixed(1)}ms`);
  }
};

export function PerfProfiler({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
