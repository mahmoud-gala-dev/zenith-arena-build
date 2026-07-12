# خطة تنفيذ Batches A → D بالتوازي المنطقي

الهدف: إزالة كل البيانات الثابتة المتبقية وربطها بالأدمن، مع تنظيف الأنواع.

## Batch A — About Page ديناميكية (رسالة واحدة)
**Migration:**
- جدول `about_sections` (key, title_en, title_ar, body_en, body_ar, image_url, sort_order, kind: story|mission|vision|value|stat|milestone)
- GRANT: SELECT لـ anon + authenticated، ALL لـ service_role
- RLS: قراءة عامة، كتابة لـ `is_staff(auth.uid())`
- Seed بالمحتوى الحالي من صفحة About (story/mission/values)

**Frontend:**
- `src/lib/queries.ts`: `aboutSectionsQuery()`
- `src/routes/about.tsx`: loader + `useSuspenseQuery`، عرض الأقسام حسب `kind` و`sort_order`
- SEO bilingual من `seo_settings`

**Admin:**
- `src/components/admin/AboutPanel.tsx`: CRUD كامل (إضافة/تعديل/حذف/ترتيب drag)
- رفع صور عبر bucket `media`
- تسجيله في `src/routes/admin/about.tsx`

## Batch B — بذر Legal Pages (شرطي)
- فحص `pages` للتأكد من وجود صفحات: privacy, terms, cookies, refund
- إن نقصت: `supabase--insert` بالمحتوى الأساسي EN/AR
- لا تغييرات على الكود (الصفحات ديناميكية بالفعل)

## Batch C — i18n في قاعدة البيانات (رسالتان)

**رسالة 1 — Migration + Seed:**
- جدول `translations` (key TEXT PK, en TEXT, ar TEXT, namespace TEXT, updated_at)
- GRANT + RLS (قراءة عامة، كتابة staff)
- Seed كل مفاتيح `src/lib/translations.ts` الحالية (~240 مفتاح)
- Trigger `update_updated_at`

**رسالة 2 — Provider + Admin:**
- `src/lib/queries.ts`: `translationsQuery()` مع `staleTime: 5min`
- تحديث `LanguageProvider.tsx`: يجلب الترجمات من DB، fallback على الملف الثابت أثناء التحميل
- `src/components/admin/TranslationsPanel.tsx`: جدول قابل للتحرير inline مع بحث وفلترة namespace وتصدير/استيراد JSON
- زر "Reload translations" يستدعي `queryClient.invalidateQueries`

## Batch D — تنظيف نهائي وبناء
- حذف/تقليل `src/lib/translations.ts` (يبقى fallback أدنى فقط)
- توحيد الأنواع في `src/lib/types.ts` (About, Translation, ...) وإزالة التكرارات
- فحص `rg` لأي بيانات ثابتة متبقية (arrays hardcoded في components)
- التأكد من كل الصفحات تجلب من DB
- تشغيل typecheck + build وإصلاح أي أخطاء
- تقرير نهائي للمستخدم بما تم

## ملاحظات تقنية
- كل الجداول الجديدة تتبع قاعدة GRANT الإلزامية قبل RLS
- كل loader في route عام لا يستدعي server fn محمي
- الأدمن محمي بـ `is_staff()` كالمعتاد
- كل CRUD في الأدمن يستخدم `queryClient.invalidateQueries` بعد النجاح

## ترتيب التنفيذ
1. Batch A (migration ينتظر موافقة → ثم كود)
2. Batch B (فحص أولاً، seed إن لزم)
3. Batch C رسالة 1 (migration+seed) → رسالة 2 (كود)
4. Batch D (تنظيف + build)

كل batch يبدأ فقط بعد اكتمال السابق للحفاظ على استقرار البناء.