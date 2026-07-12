# Complete Dynamic Content Wiring Plan

Comprehensive plan to eliminate every hardcoded content block identified in the audit and connect the entire frontend to Supabase + Admin panel.

## Phase 1 — Critical Fix (immediate)
**`/projects/$slug` reads from static data → 404 for admin-created projects**
- Refactor `src/routes/projects.$slug.tsx` to fetch from `projects` table via `queryOptions` (lookup by `slug_en`/`slug_ar` in current locale).
- Keep `head()` SEO derived from loader data.
- Add owner-side query helper in `src/lib/queries.ts` (`projectBySlugQueryOptions`).
- Static `site-data.ts` projects deprecated as fallback only.

## Phase 2 — Wire Public Pages to Existing Tables
For each page: add `queryOptions` in `src/lib/queries.ts`, use `ensureQueryData` in loader, `useSuspenseQuery` in component, map DB row → view model, preserve current UI/design.

| Page | Table | Notes |
|---|---|---|
| `/gallery` | `gallery` | Filter chips derived from distinct categories in DB |
| `/clients` | `clients` + `testimonials` | Two parallel queries |
| `/downloads` | `downloads` | Signed URLs from storage if private |
| `/certificates` | `certificates` | Sort by `sort_order` |
| `/products` + `/products/$slug` | `products` + `product_categories` | Same pattern as projects |
| Home (projects/articles/testimonials sections) | `projects`, `blog_posts`, `testimonials` | Limit 3–6 featured rows |

## Phase 3 — Centralize Contact & Social in `settings`
- Seed `settings` rows: `contact_info` (email, offices[]), `social_links` (linkedin, instagram, facebook, x, youtube, whatsapp), `brand_name`.
- Build `src/lib/settings.ts` with `useSettings(key)` hook + server-safe `getSetting()`.
- Refactor `Footer.tsx`, `contact.tsx`, `WhatsAppButton.tsx`, root Organization JSON-LD (`sameAs`) to consume settings.
- Extend `src/routes/_authenticated/admin.settings.tsx` with dedicated tabs: **Contact Info**, **Social Links** (typed form, not raw JSON).

## Phase 4 — New Tables + Admin + Frontend

### 4a. FAQ
- Table `faq_items` (question_en/ar, answer_en/ar, category, sort_order, is_published).
- Admin page `/admin/faqs` (CRUD, drag-reorder, bilingual, category tabs).
- Refactor `/faq` to load from DB; keep FAQPage JSON-LD.

### 4b. Careers (Job Openings)
- Table `job_openings` (title_en/ar, department, location, type, description_en/ar, requirements, is_open, sort_order).
- Table `job_applications` (job_id, applicant_name, email, phone, cv_url, cover_letter, status).
- Storage bucket `applications` (private) for CVs.
- Admin: `/admin/careers` (jobs CRUD) + `/admin/applications` (inbox with status workflow).
- Refactor `/careers` to load from DB. Apply button opens dialog → uploads CV → `submitApplication` server fn.

### 4c. Newsletter
- Table `newsletter_subscribers` (email unique, locale, subscribed_at, unsubscribed_at, source).
- Server fn `subscribeNewsletter` (rate-limited, email validation, upsert).
- Footer form wired to it with toast feedback.
- Admin page `/admin/newsletter` (list, search, CSV export, unsubscribe).

## Phase 5 — Brand Cleanup
- Grep all `apex`/`ApexSports` references → replace with `Egytic Sports` or read from `settings.brand_name`.
- Rename `site-data.ts` static leftovers or gut it entirely once all pages migrated.

## Technical Details

**Data loading pattern (per project convention):**
```ts
// src/lib/queries.ts
export const galleryQueryOptions = queryOptions({
  queryKey: ['gallery'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('gallery').select('*').eq('is_published', true)
      .order('sort_order');
    if (error) throw error; return data;
  },
  staleTime: 5 * 60_000,
});
```

**Loader shape:**
```ts
loader: ({ context }) => context.queryClient.ensureQueryData(galleryQueryOptions)
```

**Settings hook (real-time):**
```ts
export function useSetting<T>(key: string, fallback: T): T {
  const { data } = useSuspenseQuery(settingQueryOptions(key));
  return (data?.value as T) ?? fallback;
}
```

**Migrations sequence:** run one migration per new table (faq_items, job_openings, job_applications, newsletter_subscribers) + one migration adding `contact_info`/`social_links`/`brand_name` rows to `settings`. All follow the mandatory `CREATE → GRANT → RLS → POLICY` pattern with audit-log triggers attached where applicable.

**RLS:**
- `faq_items`, `job_openings` → public SELECT where `is_published`/`is_open`, staff write.
- `job_applications`, `newsletter_subscribers` → no public SELECT; INSERT via server fn (service role); staff SELECT.

## Delivery Order
1. Phase 1 (critical, ~1 message).
2. Phase 2 (~2 messages, batched per page group).
3. Phase 3 (~1 message).
4. Phase 4a → 4b → 4c (~3 messages, one per feature).
5. Phase 5 cleanup (~1 message).

## Out of Scope
- Redesign / visual changes (audit was structural).
- Rewriting existing admin panels that already work.
- Migration of static blog articles into `blog_posts` (already partially wired).
