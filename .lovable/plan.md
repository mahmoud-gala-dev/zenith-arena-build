# Smooth Scroll + Mobile-App Experience

Two coordinated upgrades: buttery scrolling everywhere, and a native-app feel when the site is viewed on a phone.

## 1) Site-wide smooth scrolling

- Add Lenis (industry-standard smooth scroll) wired at the root layout via a `SmoothScroll` provider.
- Respect `prefers-reduced-motion` — users with reduced motion get native scroll, no interference.
- Sync with anchor links (`#section`) and route changes (scroll to top on navigation, restore position on back).
- Add momentum easing for touch devices without breaking pull-to-refresh or overscroll on iOS.
- Enable CSS `scroll-behavior: smooth` fallback and `overscroll-behavior: contain` on modal/sheet containers to prevent scroll chaining.

## 2) Mobile-app-like shell (only when viewport < md)

A dedicated mobile layer that overlays the existing responsive site — desktop/tablet stay untouched.

### Bottom tab bar (fixed)
- 5 tabs: Home · Projects · Products · Knowledge · More
- Active tab highlighted with primary color pill + label; icons from lucide.
- Safe-area padding (`env(safe-area-inset-bottom)`) so it clears the iOS home indicator.
- Hides on scroll-down, reveals on scroll-up (app-style behavior).

### Mobile top bar
- Compact 56px header: logo (left), page title (center, contextual), search + language toggle (right).
- Replaces the current desktop header on mobile only.
- Sticky with translucent backdrop-blur when scrolled.

### Full-screen drawer for "More"
- Slide-in sheet with: Services, Gallery, Clients, About, Contact, Careers, FAQ, Downloads, Certificates, Legal, Theme, Language.
- Grouped with section labels, chevrons, and 44px min tap targets.

### App-style page transitions
- Framer Motion page transitions between routes (slide + fade on mobile only).
- Wrapped around `<Outlet />` with `AnimatePresence`.

### Native touch interactions
- Cards get press-scale (`active:scale-[0.98]`) feedback.
- Horizontal snap-scroll rails for governorate chips, category filters, and featured items on mobile (like App Store shelves).
- Pull-to-refresh visual affordance on listing pages (Projects, Products, Knowledge).
- Bottom-sheet variant for filters on Projects page instead of the current inline grid.

### Standalone / installable feel
- Update `manifest.webmanifest` with `display: standalone`, theme color, maskable icons.
- iOS meta tags: `apple-mobile-web-app-capable`, status bar style.
- Splash screen already exists — tune timing on mobile.

## 3) Responsive polish pass across all breakpoints

Systematic sweep on all 14 routes at 360 / 390 / 414 / 768 / 1024 / 1280 / 1536:

- Typography scale: introduce fluid clamp-based sizes for hero titles and section headings.
- Spacing: replace fixed paddings on hero/sections with fluid tokens (`clamp()` where useful).
- Grid audits: enforce `min-w-0` on flex/grid text children; `shrink-0` on avatars/logos/badges.
- Tables (admin): wrap in horizontal-scroll containers with sticky first column on mobile.
- Long strings (bilingual): `text-balance` on titles, `hyphens-auto` on Arabic paragraphs.
- Buttons/inputs: enforce 44px min height on touch viewports.
- Images: verify `sizes` attributes on responsive images to save mobile bandwidth.

## 4) Performance guardrails

- Playwright audit script (already exists) re-run after implementation on all viewports to verify LCP < 2.5s and CLS < 0.1.
- No layout shift from the new bottom bar (reserve space via `padding-bottom` on `<main>` when mobile shell is active).

## Technical details

- New files:
  - `src/components/site/SmoothScroll.tsx` — Lenis provider, RAF loop, cleanup, reduced-motion guard.
  - `src/components/site/mobile/MobileShell.tsx` — orchestrator; renders top bar + bottom tabs + drawer when `useIsMobile()` is true.
  - `src/components/site/mobile/MobileTopBar.tsx`
  - `src/components/site/mobile/MobileTabBar.tsx` — scroll-hide behavior via `useScrollDirection` hook.
  - `src/components/site/mobile/MobileMoreDrawer.tsx` — uses existing shadcn `Sheet`.
  - `src/components/site/PageTransition.tsx` — Framer Motion wrapper (mobile-only).
  - `src/hooks/useScrollDirection.ts`
  - `src/hooks/useIsMobile.ts` (if not already present).
- Edits:
  - `src/routes/__root.tsx` — mount `<SmoothScroll>`, add iOS meta tags.
  - `src/components/site/SiteLayout.tsx` — swap in `<MobileShell>` on mobile, hide desktop `Header`/`Footer` accordingly, reserve bottom padding.
  - `src/routes/projects.index.tsx` — convert governorate grid to horizontal snap-scroll on mobile; filters into bottom sheet.
  - `public/manifest.webmanifest` — PWA polish.
  - `src/styles.css` — safe-area utilities, snap-scroll utility, fluid type tokens.
- Deps to add: `lenis` (Studio Freight's rebrand of `@studio-freight/lenis`), already have `framer-motion`.

## Out of scope

- Real service worker / offline caching (can be a follow-up if you want true PWA install).
- Rebuilding desktop layouts — desktop stays as-is.
- Changing content, copy, or branding.

## Verification

- Playwright screenshots at 375px on: Home, Projects, Products, Knowledge, Gallery, a detail page — confirming bottom tab bar, top bar, drawer, and page transitions.
- Console: 0 errors; scroll feel verified with a manual test snippet.
- CLS/LCP re-audit after changes.
