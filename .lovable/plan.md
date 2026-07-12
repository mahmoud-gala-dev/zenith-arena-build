# Phase 7 — Zero Static Data (Final)

نطاق شامل من 4 حزم يُنفَّذ بالترتيب. كل حزمة قائمة بذاتها ويمكن مراجعتها قبل الانتقال للتالية.

## Batch A — About page dynamic (DB + Admin + Route)

**Migration** `about_content` (single-row keyed content):
- عمود واحد `key` (unique) + `value jsonb` — يخزّن: hero image url, story_en/ar, mission_en/ar, values[] (icon + title_en/ar + desc_en/ar), stats[] (key, value, label_en/ar).
- Public SELECT (anon+authenticated), staff write via `is_staff()`.
- Audit trigger.

**Admin**: `src/routes/_authenticated/admin.about.tsx` — form ثنائي اللغة مع رفع صورة hero عبر `StrictImageUrlField`، محرر لـ values/stats (add/remove/reorder).

**Frontend**: refactor `src/routes/about.tsx` ليقرأ من `aboutContentQueryOptions` بدل `aboutImg` و `heroStats`.

## Batch B — Legal pages dynamic (/privacy, /terms)

استخدام جدول `pages` الموجود بالفعل:
- بذر صفّي `privacy` و `terms` (bilingual title/body HTML).
- Refactor `src/routes/privacy.tsx` و `src/routes/terms.tsx` لقراءة `pageBySlugQueryOptions` من DB وعرض HTML عبر sanitized renderer.
- Admin editor موجود في `admin.pages.tsx` — نتأكد أن CRUD يعمل مع rich text (bilingual).

## Batch C — Dynamic i18n

**Migration** `translations`:
- `namespace text` + `key text` + `value_en text` + `value_ar text` + unique(namespace,key).
- Public SELECT, staff write, audit trigger.

**Bootstrap**: seed migration ينسخ كل نصوص `src/i18n/translations.ts` الحالية إلى الجدول (namespace = section: nav, hero, footer, cta, ...).

**Runtime**: `src/i18n/LanguageProvider.tsx` يحمّل translations عبر server-safe query عند bootstrap (loader في `__root.tsx`) ويدمجها فوق fallback static (يبقى في-code كـ safety net فقط، لا يُستخدم إن نجح الفetch).

**Admin**: `src/routes/_authenticated/admin.translations.tsx` — جدول بحث/تصفية حسب namespace، edit inline لكل مفتاح (EN/AR)، زر "Add key".

## Batch D — حذف site-data.ts

- نقل الأنواع (`Project`, `Service`, `Article`, إلخ) إلى `src/lib/types.ts`.
- تحديث كل imports في المشروع.
- حذف `src/lib/site-data.ts` والأصول المرتبطة غير المستخدمة.
- typecheck نظيف.

## ترتيب التسليم
1. Batch A (migration → admin → route) — رسالة واحدة.
2. Batch B — رسالة واحدة.
3. Batch C (migration + seed + provider + admin) — رسالتان (migration منفصلة عن الكود).
4. Batch D (تنظيف نهائي) — رسالة واحدة.

## خارج النطاق
- تغيير التصميم البصري.
- ترجمة محتوى جديد لم يكن موجودًا مسبقًا (فقط نقل الحالي إلى DB).
- تعديل الجداول الموجودة (services, products, ...) لأنها ديناميكية بالفعل.

## Confirm
قل **"ابدأ Batch A"** لأبدأ التنفيذ، أو حدّد أي batch تريد تخطّيه.
