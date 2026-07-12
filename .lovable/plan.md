# تقرير الفحص الشامل — Egytic Sports (تحديث 2026-07-12)

## 1) نطاق الفحص
- **34 صفحة أدمن** تحت `_authenticated/admin.*`
- **28 صفحة عامة** تحت `src/routes/`
- **36 جدول** DB — كلها بـ RLS ومربوطة عبر `src/lib/queries.ts`
- المكونات المشتركة: `Header`, `Footer`, `HeroSlider`, `QuickLeadDialog`, `DownloadGateButton`, `ServiceQuoteForm`, `MobileShell`, `ShareButtons`, `ImageLightbox`

## 2) نتيجة الربط Admin ↔ Frontend

### ✅ موديولات مربوطة بالكامل (Admin CRUD ← DB → Frontend)
Services · Projects · Products · Governorates · Certificates · Clients · Testimonials · Blog · Categories · Tags · FAQ · Gallery · Downloads · Hero Slides · Menus · Translations · SEO Settings · Job Openings · Applications · Leads (+ Timeline/Audit) · Newsletter · About · Legal Pages · Settings · Users/Roles/Permissions · Audit Logs · Cache Refresh · Media · Download Analytics · QA Reports · Page Versions/Preview · Homepage Sections

### ⚠️ فجوات — كلها UI copy ثابت داخل الفرونت (بدون بيانات مجالية)

فحص `rg` أرجع **38 ملف** يحتوي شرطيات `lang === 'ar' ? … : …`. لا توجد بيانات محتوى ثابتة (خدمات/منتجات/مقالات) — كل الفجوات نصوص واجهة فقط.

| # | الملف | العدد التقريبي | الوجهة |
|---|---|---|---|
| A1 | `routes/index.tsx` | 9 | `homepage_sections` + `translations` |
| A2 | `routes/index.tsx` (JSON-LD) | 3 | `seo_settings` (row=`home`) |
| B1 | `routes/certificates.tsx` | 6 | `translations` ns=`page.certificates` |
| B2 | `routes/clients.tsx` | 7 | `translations` ns=`page.clients` |
| B3 | `routes/faq.tsx` | 5 | `translations` ns=`page.faq` |
| B4 | `routes/quote.tsx` | 8 | `translations` ns=`page.quote` |
| B5 | `routes/gallery.tsx` | 6 | `translations` ns=`page.gallery` |
| B6 | `routes/downloads.tsx` + `downloads.$slug.tsx` | 12 | `translations` ns=`page.downloads` |
| B7 | `routes/careers.tsx` | 12 | `translations` ns=`page.careers` |
| B8 | `routes/about.tsx` · `contact.tsx` · `knowledge.index.tsx` · `knowledge.$slug.tsx` · `products.$slug.tsx` · `projects.index.tsx` · `products.index.tsx` · `governorates.$slug.tsx` · `services.index.tsx` · `services.$slug.tsx` | 30+ | `translations` بحسب الصفحة |
| C1 | `components/site/Header.tsx` | 14 | `translations` ns=`header` |
| C2 | `components/site/Footer.tsx` | 12 | `translations` ns=`footer` |
| C3 | `components/site/QuickLeadDialog.tsx` | 17 | `translations` ns=`dialog.lead` |
| C4 | `DownloadGateButton.tsx` · `ServiceQuoteForm.tsx` · `WhatsAppSendButton.tsx` · `LeadSuccessDialog.tsx` | 15 | `translations` ns=`form.*` |
| C5 | `ShareButtons.tsx` · `ImageLightbox.tsx` · `GallerySection.tsx` · `Cards.tsx` · `HeroSlider.tsx` · `LegalPage.tsx` | 12 | `translations` ns=`ui.*` |
| C6 | `mobile/MobileTopBar.tsx` · `MobileTabBar.tsx` · `MobileMoreDrawer.tsx` | 9 | `translations` ns=`mobile` |

**الإجمالي:** ~180 حرفياً ثنائي اللغة موزعة على 38 ملف.

## 3) خطة تنفيذ — 4 دفعات متوازية

### Batch 1 — الصفحة الرئيسية + JSON-LD
- استهلاك `homepage_sections` (chips, poster titles, CTAs) عبر `queries.ts`.
- استهلاك `seo_settings` (`page_key='home'`) لـ Organization/WebSite JSON-LD.
- Migration: seed لأي مفتاح ناقص في الجدولين بلغتين (`INSERT … ON CONFLICT DO NOTHING`).

### Batch 2 — الصفحات العامة (13 ملف)
- إضافة مفاتيح `translations` لكل صفحة بـ namespace واضح (`page.<name>.<key>`).
- استبدال كل `lang === 'ar' ? … : …` بـ `t('page.<name>.<key>')` من `useTranslations`.
- Migration واحد يزرع ~120 مفتاح بلغتين.

### Batch 3 — المكونات المشتركة (12 ملف)
- Namespaces: `header.*`, `footer.*`, `dialog.lead.*`, `form.quote.*`, `form.download.*`, `ui.share.*`, `ui.gallery.*`, `mobile.*`.
- استبدال داخل كل مكوّن مع الحفاظ على a11y (`aria-label` ديناميكية عبر `t()`).
- Migration seed ~60 مفتاح.

### Batch 4 — الفلاتر/القوائم + التحقق النهائي
- Namespace `filters.*` (all / featured / newest / sort / empty …) للـ `projects.index.tsx`, `products.index.tsx`, `governorates.$slug.tsx`, `services.index.tsx`.
- تحديث `admin.translations.tsx` لعرض الـ namespaces مجمعة مع فلترة سريعة.
- تشغيل `bunx tsgo --noEmit`, vitest, security scan.
- شرط النجاح: `rg "lang === 'ar' \?" src/routes src/components/site` = صفر مطابقات.

## 4) تفاصيل تقنية
- الجداول جاهزة: `translations(key, ar, en, namespace)`, `homepage_sections(...)`, `seo_settings(page_key, ...)`.
- Hook `useTranslations()` موجود في `src/i18n/LanguageProvider.tsx` ويقرأ من Query cache.
- كل migrations تستخدم `ON CONFLICT (key) DO NOTHING`.
- لن تتغير أي واجهات RLS/API — استهلاك بيانات موجودة + زرع نصوص فقط.
- الأدمن سيصبح مصدر الحقيقة الوحيد لكل نص UI ثنائي اللغة.

## 5) قرارات مطلوبة قبل البدء
1. **زرع صفوف افتراضية في `homepage_sections`** (~12 مفتاح) الآن؟
2. **زرع ~180 مفتاح translations** بلغتين الآن؟
3. **تنفيذ الأربع دفعات بالتوازي في نفس الدور** أم دفعة تلو الأخرى للمراجعة؟
