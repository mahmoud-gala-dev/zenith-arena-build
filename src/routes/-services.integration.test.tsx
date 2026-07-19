/**
 * Integration tests for the services route data flow.
 *
 * Covers three guarantees:
 *  1. The loader queries (`servicesPublishedQueryOptions`,
 *     `serviceBySlugQueryOptions`) return normalized DTOs and the "missing
 *     slug" case resolves to `null` so the route can throw `notFound()`.
 *  2. `ensureQueryData` primes the QueryClient cache exactly the way the
 *     route loader does, and the same client can be consumed synchronously
 *     via `useSuspenseQuery` — mirroring SSR → hydration.
 *  3. Rendering the component tree that reads from that cache produces
 *     identical HTML on the server (`renderToString`) and after client
 *     hydration (`hydrateRoot`), with no React hydration warnings.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { renderToString } from "react-dom/server";
import { act } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

// --- Supabase mock ----------------------------------------------------------
// The global test setup mocks `@/integrations/supabase/client` without a
// `.from()` builder. Re-mock here with a fluent builder so query functions
// resolve deterministically.

type Row = Record<string, unknown>;

const state: {
  rows: Row[];
  filterSlug?: string | null;
  errorOnce?: Error | null;
} = { rows: [] };

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = chain;
  builder.eq = (col: string, val: string) => {
    if (col === "slug_en") state.filterSlug = val;
    return builder;
  };
  builder.order = chain;
  builder.range = chain;
  builder.or = chain;
  builder.maybeSingle = async () => {
    if (state.errorOnce) {
      const err = state.errorOnce;
      state.errorOnce = null;
      return { data: null, error: err };
    }
    const row = state.rows.find((r) => r.slug_en === state.filterSlug) ?? null;
    return { data: row, error: null };
  };
  // Awaiting the builder itself returns the list (published list path).
  builder.then = (resolve: (v: { data: Row[]; error: null }) => unknown) =>
    resolve({ data: state.rows, error: null });
  return builder;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => makeBuilder()),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: () => {} } },
      })),
    },
  },
}));

import {
  servicesPublishedQueryOptions,
  serviceBySlugQueryOptions,
  type ServiceRow,
} from "@/hooks/useServiceContent";

// --- Fixtures ---------------------------------------------------------------

const fixtureRow = (over: Partial<Row> = {}): Row => ({
  id: "svc-1",
  slug_en: "football-pitches",
  slug_ar: "ملاعب-كرة-قدم",
  title_en: "Football Pitches",
  title_ar: "ملاعب كرة القدم",
  description_en: "FIFA-grade turnkey pitches.",
  description_ar: "ملاعب كرة قدم بمعايير الفيفا.",
  category: "Football",
  status: "published",
  featured: true,
  sort_order: 1,
  gallery_images: ["/a.jpg", "/b.jpg"],
  faqs: [{ q_en: "How long?", a_en: "12 weeks." }],
  ...over,
});

beforeEach(() => {
  state.rows = [fixtureRow()];
  state.filterSlug = null;
  state.errorOnce = null;
});

afterEach(() => {
  vi.clearAllMocks();
});

// --- 1. Loader query correctness -------------------------------------------

describe("services loader queries", () => {
  it("returns normalized published services (gallery + faqs coerced)", async () => {
    const rows = await servicesPublishedQueryOptions.queryFn!({} as never);
    expect(rows).toHaveLength(1);
    expect(rows[0].slug_en).toBe("football-pitches");
    expect(rows[0].gallery_images).toEqual(["/a.jpg", "/b.jpg"]);
    expect(rows[0].faqs[0]).toMatchObject({ q_en: "How long?", a_en: "12 weeks." });
  });

  it("returns null for unknown slug so the route can throw notFound()", async () => {
    const opts = serviceBySlugQueryOptions("does-not-exist");
    const result = await opts.queryFn!({} as never);
    expect(result).toBeNull();
  });

  it("resolves the matching row for a known slug", async () => {
    const opts = serviceBySlugQueryOptions("football-pitches");
    const result = (await opts.queryFn!({} as never)) as ServiceRow | null;
    expect(result).not.toBeNull();
    expect(result!.title_en).toBe("Football Pitches");
    expect(result!.faqs).toHaveLength(1);
  });

  it("normalizes gallery/faqs that arrive as JSON strings", async () => {
    state.rows = [
      fixtureRow({
        slug_en: "athletics",
        gallery_images: JSON.stringify(["/x.jpg"]) as unknown as string[],
        faqs: JSON.stringify([{ q_en: "Q", a_en: "A" }]) as unknown as ServiceRow["faqs"],
      }),
    ];
    const opts = serviceBySlugQueryOptions("athletics");
    const result = (await opts.queryFn!({} as never)) as ServiceRow;
    expect(result.gallery_images).toEqual(["/x.jpg"]);
    expect(result.faqs).toEqual([{ q_en: "Q", a_en: "A", q_ar: undefined, a_ar: undefined }]);
  });

  it("propagates Supabase errors so the route errorComponent activates", async () => {
    state.errorOnce = new Error("db-down");
    const opts = serviceBySlugQueryOptions("football-pitches");
    await expect(opts.queryFn!({} as never)).rejects.toThrow("db-down");
  });
});

// --- 2. ensureQueryData primes the cache like the real loader --------------

describe("services loader → QueryClient priming", () => {
  it("populates the cache and serves the same reference synchronously", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const primed = await qc.ensureQueryData(servicesPublishedQueryOptions);
    const cached = qc.getQueryData(servicesPublishedQueryOptions.queryKey);
    expect(cached).toBe(primed);
    expect((cached as ServiceRow[])[0].slug_en).toBe("football-pitches");
  });
});

// --- 3. SSR renders + client hydrates without warnings ---------------------

function ServiceTitle({ slug }: { slug: string }) {
  const { data } = useSuspenseQuery(serviceBySlugQueryOptions(slug));
  return (
    <article>
      <h1 data-testid="title">{data!.title_en}</h1>
      <p data-testid="desc">{data!.description_en}</p>
    </article>
  );
}

function App({ client, slug }: { client: QueryClient; slug: string }) {
  return (
    <QueryClientProvider client={client}>
      <Suspense fallback={<div>loading</div>}>
        <ServiceTitle slug={slug} />
      </Suspense>
    </QueryClientProvider>
  );
}

describe("services SSR + hydration", () => {
  it("renders on the server and hydrates on the client with no warnings", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // "Server" pass: prime cache, then renderToString.
    const serverClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await serverClient.ensureQueryData(serviceBySlugQueryOptions("football-pitches"));
    const html = renderToString(<App client={serverClient} slug="football-pitches" />);
    expect(html).toContain("Football Pitches");
    expect(html).toContain("FIFA-grade turnkey pitches.");

    // "Client" pass: same cache shape, then hydrate the identical markup.
    const clientClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await clientClient.ensureQueryData(serviceBySlugQueryOptions("football-pitches"));

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    await act(async () => {
      hydrateRoot(container, <App client={clientClient} slug="football-pitches" />);
    });

    expect(container.querySelector('[data-testid="title"]')?.textContent).toBe(
      "Football Pitches",
    );

    // Any hydration mismatch would fire a React error/warning call.
    const hydrationNoise = [...errorSpy.mock.calls, ...warnSpy.mock.calls]
      .flat()
      .filter((m): m is string => typeof m === "string")
      .filter((m) => /hydrat|did not match|mismatch/i.test(m));
    expect(hydrationNoise).toEqual([]);

    document.body.removeChild(container);
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("client-only render (no SSR) also produces the expected markup", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await qc.ensureQueryData(serviceBySlugQueryOptions("football-pitches"));

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<App client={qc} slug="football-pitches" />);
    });
    expect(container.querySelector('[data-testid="desc"]')?.textContent).toBe(
      "FIFA-grade turnkey pitches.",
    );
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
