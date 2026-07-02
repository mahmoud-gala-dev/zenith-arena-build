import { useEffect, useState, useSyncExternalStore } from "react";
import type { SmoothScrollState } from "./SmoothScroll";

/**
 * Tiny floating diagnostic panel for smooth-scroll performance.
 * Toggle open with Alt+P, or by setting localStorage["perf:overlay"] = "1".
 * Shows live FPS, current enabled state, last reason, and a manual on/off
 * switch that persists via SmoothScroll.setEnabled().
 */

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const s = window.__smoothScroll;
  if (!s) {
    // Poll until state exists (SmoothScroll mounts on next tick).
    const id = window.setInterval(() => {
      if (window.__smoothScroll) {
        window.clearInterval(id);
        cb();
      }
    }, 100);
    return () => window.clearInterval(id);
  }
  return s.subscribe(cb);
}

function getSnapshot(): SmoothScrollState | null {
  if (typeof window === "undefined") return null;
  return window.__smoothScroll ?? null;
}

function getServerSnapshot(): SmoothScrollState | null {
  return null;
}

export function PerfOverlay() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("perf:overlay") === "1") setOpen(true);
    } catch {
      /* ignore */
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        setOpen((v) => {
          const next = !v;
          try {
            localStorage.setItem("perf:overlay", next ? "1" : "0");
          } catch {
            /* ignore */
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  const enabled = state?.enabled ?? false;
  const reason = state?.reason ?? "…";
  const fps = state?.fps ?? 0;
  const fpsColor = fps >= 55 ? "#22c55e" : fps >= 40 ? "#eab308" : "#ef4444";

  return (
    <div
      role="status"
      aria-live="polite"
      data-lenis-prevent
      style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        zIndex: 2147483000,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 11,
        color: "#fff",
        background: "rgba(15,23,42,0.92)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8,
        padding: "8px 10px",
        minWidth: 180,
        backdropFilter: "blur(6px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <strong style={{ fontWeight: 600 }}>Smooth scroll</strong>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            try {
              localStorage.setItem("perf:overlay", "0");
            } catch {
              /* ignore */
            }
          }}
          aria-label="Close diagnostic panel"
          style={{
            background: "transparent",
            color: "inherit",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          ×
        </button>
      </div>
      <div style={{ marginTop: 6, display: "grid", gap: 3 }}>
        <div>
          FPS: <span style={{ color: fpsColor, fontWeight: 700 }}>{fps.toFixed(0)}</span>
        </div>
        <div>
          Status:{" "}
          <span style={{ color: enabled ? "#22c55e" : "#f87171" }}>{enabled ? "on" : "off"}</span>
        </div>
        <div style={{ opacity: 0.75 }}>Reason: {reason}</div>
      </div>
      <button
        type="button"
        onClick={() => state?.setEnabled(!enabled)}
        style={{
          marginTop: 8,
          width: "100%",
          padding: "6px 8px",
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.18)",
          background: enabled ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.18)",
          color: "#fff",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {enabled ? "Disable smooth scroll" : "Enable smooth scroll"}
      </button>
      <div style={{ marginTop: 6, opacity: 0.55, fontSize: 10 }}>Alt+P to toggle panel</div>
    </div>
  );
}
