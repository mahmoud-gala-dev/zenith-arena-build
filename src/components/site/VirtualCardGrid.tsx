import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/**
 * Windowed responsive grid. Renders only the rows currently in view (plus
 * a small overscan) which drastically reduces render cost for long lists.
 *
 * Columns are computed from the container width, so it stays fully
 * responsive while keeping virtualization simple.
 */
export function VirtualCardGrid<T>({
  items,
  renderItem,
  estimatedRowHeight = 420,
  gap = 24,
  columns = { base: 1, md: 2, lg: 3 },
  threshold = 18,
  className,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimatedRowHeight?: number;
  gap?: number;
  columns?: { base: number; md?: number; lg?: number };
  /** Below this count we render normally (avoids virtualization overhead). */
  threshold?: number;
  className?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(columns.base);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      if (w >= 1024 && columns.lg) setCols(columns.lg);
      else if (w >= 768 && columns.md) setCols(columns.md);
      else setCols(columns.base);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [columns.base, columns.md, columns.lg]);

  const rows = Math.ceil(items.length / cols);
  const shouldVirtualize = items.length >= threshold;

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => (shouldVirtualize ? window as unknown as HTMLElement : null),
    estimateSize: () => estimatedRowHeight + gap,
    overscan: 3,
    observeElementRect: (instance, cb) => {
      const el = parentRef.current;
      if (!el) return () => {};
      const measure = () => {
        const rect = el.getBoundingClientRect();
        cb({ width: rect.width, height: window.innerHeight });
      };
      measure();
      window.addEventListener("resize", measure);
      window.addEventListener("scroll", measure, { passive: true });
      return () => {
        window.removeEventListener("resize", measure);
        window.removeEventListener("scroll", measure);
      };
    },
    observeElementOffset: (instance, cb) => {
      const el = parentRef.current;
      if (!el) return () => {};
      const measure = () => {
        const rect = el.getBoundingClientRect();
        cb(-rect.top, false);
      };
      measure();
      window.addEventListener("scroll", measure, { passive: true });
      window.addEventListener("resize", measure);
      return () => {
        window.removeEventListener("scroll", measure);
        window.removeEventListener("resize", measure);
      };
    },
  });

  const virtualRows = shouldVirtualize ? rowVirtualizer.getVirtualItems() : [];

  const gridStyle = useMemo<React.CSSProperties>(
    () => ({ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap }),
    [cols, gap],
  );

  if (!shouldVirtualize) {
    return (
      <div ref={parentRef} className={className} style={gridStyle}>
        {items.map((item, i) => renderItem(item, i))}
      </div>
    );
  }

  return (
    <div ref={parentRef} className={className} style={{ position: "relative", height: rowVirtualizer.getTotalSize() }}>
      {virtualRows.map((vr) => {
        const start = vr.index * cols;
        const rowItems = items.slice(start, start + cols);
        return (
          <div
            key={vr.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${vr.start}px)`,
              paddingBottom: gap,
            }}
          >
            <div style={gridStyle}>
              {rowItems.map((item, i) => renderItem(item, start + i))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
