# خطة متكاملة: Admin + AI Assistant

## الهدف
تحويل لوحة الأدمن إلى بيئة عمل ذكية يساعدك فيها الذكاء الاصطناعي (Lovable AI Gateway – Gemini) في: توليد المحتوى، الترجمة التلقائية EN↔AR، اقتراح SEO، تلخيص Leads، وإنشاء مسودات كاملة للمقالات/الخدمات/المشاريع من موجز قصير.

---

## المرحلة 1 – البنية التحتية للذكاء الاصطناعي (Foundation)
1. تفعيل `LOVABLE_API_KEY` (موجود بالفعل ✅).
2. إنشاء `src/lib/ai-gateway.server.ts` — provider مشترك عبر AI SDK.
3. إنشاء `src/lib/ai/*.functions.ts` — server functions محمية بـ `requireSupabaseAuth` + فحص `has_permission('content.manage')`:
   - `generateContent` (توليد نص)
   - `translateContent` (ترجمة EN↔AR مع الحفاظ على المصطلحات)
   - `generateSeoMeta` (title/description/keywords/OG)
   - `improveText` (تحسين/تلخيص/إعادة صياغة)
   - `generateAltText` (وصف بديل للصور من URL)
   - `summarizeLead` (تلخيص Lead + اقتراح رد)
4. جدول `ai_usage_logs` لتتبع استخدام الذكاء الاصطناعي (user_id, action, tokens, cost_estimate, created_at) — مع RLS.

## المرحلة 2 – مكوّنات AI قابلة لإعادة الاستخدام
1. `<AIAssistButton>` — زر ✨ بجانب أي حقل نصي: توليد/تحسين/ترجمة.
2. `<AITranslateSync>` — زر ترجمة تلقائية بين EN/AR في كل الـEditors الثنائية.
3. `<AISeoSuggest>` — يقترح SEO بناءً على المحتوى الحالي.
4. `<AIContentDialog>` — Modal كامل للتوليد من موجز (Brief → Full draft).
5. `<AIImageAltGenerator>` — يمرّ على كل الصور بدون alt ويولّدها دفعة واحدة.

## المرحلة 3 – دمج AI في وحدات الأدمن

| الوحدة | ميزات AI |
|---|---|
| **Blog Posts** | توليد مقال كامل من عنوان + كلمات مفتاحية، ترجمة تلقائية، اقتراح صور، توليد TOC، ملخص، وسوم |
| **Services** | توليد وصف الخدمة، مزايا، FAQ (5–8 أسئلة)، SEO، ترجمة |
| **Projects** | توليد قصة المشروع، وصف تقني، نقاط بارزة، ترجمة alt للصور |
| **Products** | توليد وصف تسويقي + مواصفات + SEO |
| **Downloads/Catalogs** | استخراج ملخص من PDF/عنوان → وصف + SEO |
| **Pages (Legal/About)** | مساعد صياغة قانونية/تسويقية + ترجمة محافِظة على المصطلحات |
| **Leads** | تلخيص طلب العميل + مسودة رد WhatsApp/Email بالعربي والإنجليزي |
| **FAQ** | توليد أسئلة شائعة من وصف الخدمة |
| **Testimonials** | تنقيح لغوي + ترجمة |
| **Governorates** | توليد وصف تعريفي مختصر لكل محافظة |

## المرحلة 4 – تحسينات الأدمن العامة (بدون AI)
1. **Global Command Palette** (Cmd+K) — بحث عبر كل الجداول والانتقال السريع.
2. **Bulk Actions** — تحديد متعدد + نشر/حذف/تصدير جماعي.
3. **Draft Auto-save** — حفظ تلقائي كل 30ث للمحررات الطويلة.
4. **Rich Content Blocks** — محرر Blocks (لا Markdown خام) للـBlog والصفحات.
5. **Media Library** موحّدة مع بحث وفلاتر وتاجات.
6. **Dashboard Widgets قابلة للتخصيص** — سحب/إفلات.
7. **Notifications Center** محسّن (real-time عبر Supabase Realtime).
8. **Activity Feed** لكل مورد (من `audit_logs`).
9. **CSV Import** للمشاريع/المنتجات/Leads.
10. **2FA** للحسابات الإدارية.

## المرحلة 5 – حوكمة AI
1. صفحة `/admin/ai-settings`:
   - اختيار الموديل الافتراضي (Gemini Flash/Pro).
   - نغمة الكتابة (رسمية/تسويقية/تقنية).
   - قاموس مصطلحات (Glossary) لضمان ثبات الترجمة (مثلاً "Egytic Sports" لا تُترجم).
   - حدود يومية للاستخدام لكل مستخدم.
2. صفحة `/admin/ai-usage` — لوحة استهلاك مع رسوم بيانية.
3. زر "Regenerate" + "Undo" لكل توليد.
4. تحذير: كل ناتج AI يُعرض كـ **مسودة** ويتطلب موافقة بشرية قبل النشر.

---

## التنفيذ المقترح على 4 دفعات

- **Batch A (Foundation):** المرحلة 1 + المرحلة 2 (المكوّنات الأساسية).
- **Batch B (Content AI):** دمج AI في Blog + Services + Projects.
- **Batch C (Ops AI):** Leads + Products + Downloads + FAQ + Testimonials + Governorates.
- **Batch D (UX + Governance):** المرحلة 4 كاملة + المرحلة 5.

---

## التفاصيل التقنية

- **الموديل الافتراضي:** `google/gemini-3-flash-preview` (سريع، متعدد اللغات، مجاني ضمن حصة Lovable).
- **للمهام الأصعب:** `google/gemini-3.1-pro-preview` (اختياري من إعدادات AI).
- **Streaming** لكل التوليدات الطويلة عبر `streamText` + `useChat`.
- **Structured output** لـ SEO/FAQ عبر AI SDK `Output.object` (بدون قيود Schema).
- **حماية:** كل الاستدعاءات عبر `createServerFn` + `requireSupabaseAuth` + فحص RBAC.
- **Rate limiting** بسيط في `ai_usage_logs` (منع أكثر من N طلب/دقيقة لكل مستخدم).
- **لا بيانات ثابتة** — كل الإعدادات (نغمة، Glossary، حدود) في جدول `ai_settings`.

---

## المخرجات المتوقعة
- تقليل وقت إدخال مقال كامل ثنائي اللغة من **~45 دقيقة** إلى **~5 دقائق**.
- ضمان جودة SEO موحّدة لكل الصفحات.
- ترجمة دقيقة ومتسقة EN↔AR.
- تلخيص Leads + ردود جاهزة → استجابة أسرع للعملاء.

هل نبدأ بـ **Batch A** الآن؟
