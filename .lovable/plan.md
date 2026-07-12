# تقرير الفحص الشامل — Egytic Sports

## 1) نطاق الفحص
- **34 صفحة أدمن** تحت `_authenticated/admin.*`
- **28 صفحة عامة** تحت `src/routes/`
- **36 جدول** في قاعدة البيانات (Cloud) — كلها بـ RLS ومربوطة بـ `src/lib/queries.ts`
- المكونات المشتركة: `Header`, `Footer`, `Logo`, `HeroSlider`, `SplashScreen`, `MobileShell`, `QuickLeadDialog`, `DownloadGateButton`, `ServiceQuoteForm`, `PageHero`, `Breadcrumbs`

## 2) نتيجة الربط Admin ↔ Frontend

### ✅ موديولات مربوطة بالكامل (Admin CRUD ← DB → Frontend)
Services · Projects · Products · Governorates · Certificates · Clients · Testimonials · Blog · FAQ items · Gallery · Downloads · Hero Slides · Menus · Translations · SEO Settings · Job Openings · Applications · Leads · Newsletter · About Content · Legal Pages · Settings · Users/Roles · Audit Logs · Cache Refresh · Media · Product Categories · Service Categories · Project Categories · Download Analytics · QA Reports · Page Versions/Preview

### ⚠️ فجوات مكتشفة (بيانات ثابتة داخل الفرونت)

| # | الملف | الثابت | الجدول المفترض |
|---|---|---|---|
| A1 | `src/routes/index.tsx` (9 مواضع `lang==='ar'?`) | Hero CTAs, chips, poster titles/subs, "Watch reel", "Warranty…", "Design–build turnkey" | `homepage_sections` (موجود بالأدمن، غير مستهلَك) |
| A2 | `src/routes/index.tsx` L58-106 | JSON-LD name/description الثابت | `seo_settings` (موجود) |
| B1 | `src/routes/certificates.tsx` L43-55 | eyebrow/title/sub بالعربي والإنجليزي | `translations` |
| B2 | `src/routes/clients.tsx` L44-45 | eyebrow/title/sub/testimonialsTitle/cta/empty… | `translations` |
| B3 | `src/routes/faq.tsx` L47-48 | eyebrow/title/sub/ctaTitle/ctaBtn | `translations` |
| B4 | `src/routes/quote.tsx` L101-127 | title/sub/feature bullets | `translations` |
| B5 | `src/routes/gallery.tsx` | Empty state + filter labels | `translations` |
| B6 | `src/routes/downloads.tsx` (7 مواضع) | Section titles, empty states, filters | `translations` |
| B7 | `src/routes/careers.tsx` (12 موضع) | Empty state, apply CTA labels | `translations` |
| C1 | `src/components/site/Header.tsx` (25 موضع) | aria-labels, "Call now / اتصل الآن", "Instant chat", CTA fallback | `translations` |
| C2 | `src/components/site/Footer.tsx` (12 موضع) | Column titles, trust badges, newsletter labels | `translations` |
| C3 | `src/components/site/QuickLeadDialog.tsx` (17 موضع) | Form labels, success/error toasts | `translations` |
| C4 | `src/components/site/DownloadGateButton.tsx` L148 | Consent copy | `translations` |
| C5 | `src/components/site/ServiceQuoteForm.tsx` L65 | Success body | `translations` |
| C6 | `src/components/site/ShareButtons.tsx` / `ImageLightbox.tsx` | UI labels | `translations` |
| D1 | `src/routes/projects.index.tsx` (18 موضع) · `governorates.$slug.tsx` (13 موضع) | Filter labels, sort options, empty states | `translations` |

**الإجمالي:** ~155 حرفياً ثنائي اللغة موزّعة على 15 ملف. لا توجد بيانات مجالية (خدمات/منتجات/إلخ) ثابتة — كل الفجوات في **UI copy فقط**.

## 3) خطة تنفيذ على 4 دفعات متوازية

### Batch 1 — الصفحة الرئيسية (`index.tsx`)
- استهلاك `homepage_sections` عبر `queries.ts` لعرض chips, poster titles/subs, CTAs.
- استهلاك `seo_settings` (row=`home`) لـ JSON-LD organization/website بدل الثوابت.
- إضافة seeds SQL لأي مفتاح ناقص في `homepage_sections` بلغتين.

### Batch 2 — صفحات الدعم (certificates / clients / faq / quote / gallery / downloads / careers)
- إضافة مفاتيح translation namespace لكل صفحة (`page.certificates.hero.title` …).
- استبدال كل كتلة `ar ? … : …` باستدعاء `t(key)` من `useTranslations`.
- تشغيل migration واحد يزرع كل المفاتيح بلغتين (INSERT … ON CONFLICT).

### Batch 3 — المكونات المشتركة (Header / Footer / QuickLeadDialog / DownloadGate / ServiceQuoteForm / ShareButtons / ImageLightbox)
- توسيع namespaces: `header.*`, `footer.*`, `dialog.lead.*`, `form.quote.*`, `share.*`.
- استبدال داخل كل مكوّن ثم اختبار a11y (aria-labels تبقى ديناميكية).
- Migration seed للمفاتيح الجديدة.

### Batch 4 — قوائم/فلاتر (`projects.index.tsx`, `governorates.$slug.tsx`) + توثيق ونهائي
- Namespace `filters.*` (all / featured / newest / sort / empty …).
- تشغيل `bunx tsgo` + سكان security + مراجعة أن لا تبقى `ar ? "` في `src/routes`/`src/components/site`.
- تحديث `admin.translations.tsx` لعرض الـ namespaces الجديدة مجمّعة.

## 4) القرارات المطلوبة قبل البدء
1. **Batch 1 يستلزم إضافة صفوف افتراضية إلى `homepage_sections`** (~12 مفتاح) — هل تريدني أن أزرعها الآن؟
2. **Batches 2–4** تعتمد على جدول `translations` الحالي — سأزرع ~140 مفتاحاً بلغتين. موافق؟
3. هل تريد تنفيذ **الأربع دفعات بالتوازي في نفس الدور** أم واحدة تلو الأخرى (لسهولة المراجعة)؟

## تفاصيل تقنية
- الجداول جاهزة: `translations(key, ar, en, namespace, …)`, `homepage_sections(key, title_ar, title_en, subtitle_ar, subtitle_en, cta_label_*, cta_href, order_index, is_active)`, `seo_settings(page_key, …)`.
- الـ hook `useTranslations()` موجود في `src/lib/i18n` ويقرأ من cache Query.
- كل الـ migrations ستستخدم `INSERT ... ON CONFLICT (key) DO NOTHING` للأمان.
- لن تتغير أي واجهات API/RLS — فقط استهلاك بيانات موجودة + زرع نصوص.
