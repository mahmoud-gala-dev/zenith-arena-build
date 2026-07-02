# Finish remaining polish — one batch

Execution order (dependencies first):

## 1. Detail pages
- `src/routes/projects.$slug.tsx` — hero image, overview, client/location/year/area/surface, scope, challenges, solution, gallery, related services + related projects, CTA
- `src/routes/blog.$slug.tsx` — cover, category, author, reading time, TOC, content (markdown/HTML), tags, related articles, JSON-LD Article, per-route head()
- Wire `Cards.tsx` project + blog cards to link via `<Link to="/projects/$slug" params>` and `<Link to="/blog/$slug" params>`

## 2. Language switcher + dark mode
- `src/lib/i18n.tsx` — tiny context: `{ lang: 'en'|'ar', dir, t, setLang }`, persisted in localStorage, applies `dir` + `lang` on `<html>`
- Extend existing static string dictionaries (header/footer/home) to consume `t()`
- `src/components/site/LangSwitcher.tsx` + `ThemeToggle.tsx` (uses existing `next-themes` or a small class-toggle on `<html>`)
- Mount both in `Header.tsx`

## 3. SEO plumbing
- `src/routes/sitemap[.]xml.ts` — server route enumerating static routes + dynamic services/projects/blog/products slugs (publishable-key server client, `TO anon` reads)
- `public/robots.txt` — `User-agent: * / Allow: /`

## 4. PWA (manifest-only — no service worker per Lovable rules)
- `public/manifest.webmanifest` + icons entry
- `<link rel="manifest">`, `theme-color`, `apple-touch-icon` in `__root.tsx` head

## 5. Dashboard charts + CSV export
- `src/routes/_authenticated/admin.index.tsx` — add recharts area/bar for leads-by-status and leads-over-time using existing data
- `src/routes/_authenticated/admin.leads.tsx` — "Export CSV" button that serializes current filtered rows

## Technical notes
- All new routes get `head()` with route-specific title/description/og:*; `og:image` only on leaves with a real cover
- Public loaders use `context.queryClient.ensureQueryData` + a public server fn (no `requireSupabaseAuth`)
- Add `errorComponent` + `notFoundComponent` to any route with a loader
- No new npm deps needed except possibly `recharts` (check first — likely already present via shadcn chart)
- No service worker (Lovable preview safety)

Ready to build straight through.