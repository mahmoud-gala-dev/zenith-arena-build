
-- 1. Create translations table
CREATE TABLE public.translations (
  key         TEXT PRIMARY KEY,
  namespace   TEXT NOT NULL DEFAULT 'ui',
  en          TEXT NOT NULL DEFAULT '',
  ar          TEXT NOT NULL DEFAULT '',
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Grants
GRANT SELECT ON public.translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.translations TO authenticated;
GRANT ALL ON public.translations TO service_role;

-- 3. RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "translations public read"
  ON public.translations FOR SELECT
  USING (true);

CREATE POLICY "translations staff write"
  ON public.translations FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- 4. updated_at trigger
CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_translations_namespace ON public.translations (namespace);

-- 5. Seed all current UI strings
INSERT INTO public.translations (key, namespace, en, ar) VALUES
('brand', 'ui', 'Egytic', 'إيجيتك'),
('brandFull', 'ui', 'Egytic Sports Infrastructure', 'إيجيتك للإنشاءات الرياضية'),

('nav.home', 'nav', 'Home', 'الرئيسية'),
('nav.services', 'nav', 'Services', 'الخدمات'),
('nav.projects', 'nav', 'Projects', 'المشاريع'),
('nav.products', 'nav', 'Products', 'المنتجات'),
('nav.about', 'nav', 'About', 'من نحن'),
('nav.knowledge', 'nav', 'Knowledge', 'المعرفة'),
('nav.contact', 'nav', 'Contact', 'تواصل معنا'),
('nav.quote', 'nav', 'Request a Quote', 'اطلب عرض سعر'),

('cta.quote', 'cta', 'Request a Quote', 'اطلب عرض سعر'),
('cta.explore', 'cta', 'Explore Projects', 'استكشف المشاريع'),
('cta.viewAll', 'cta', 'View all', 'عرض الكل'),
('cta.learnMore', 'cta', 'Learn more', 'اعرف المزيد'),
('cta.getConsultation', 'cta', 'Get a Free Consultation', 'احصل على استشارة مجانية'),
('cta.whatsapp', 'cta', 'Chat on WhatsApp', 'تواصل عبر واتساب'),
('cta.downloadCatalog', 'cta', 'Download Catalog', 'تحميل الكتالوج'),
('cta.send', 'cta', 'Send Request', 'إرسال الطلب'),
('cta.viewProject', 'cta', 'View project', 'عرض المشروع'),
('cta.readArticle', 'cta', 'Read article', 'قراءة المقال'),

('hero.eyebrow', 'hero', 'Sports Construction & Infrastructure', 'الإنشاءات والبنية التحتية الرياضية'),
('hero.title1', 'hero', 'Engineering the', 'نهندس'),
('hero.title2', 'hero', 'arenas of tomorrow', 'ملاعب المستقبل'),
('hero.subtitle', 'hero', 'From FIFA-grade football pitches to Olympic athletics tracks, we design and build world-class sports facilities that perform for decades.', 'من ملاعب كرة القدم بمعايير الفيفا إلى مضامير ألعاب القوى الأولمبية، نصمم وننفذ منشآت رياضية عالمية المستوى تدوم لعقود.'),
('hero.stat1', 'hero', 'Projects delivered', 'مشروع منجز'),
('hero.stat2', 'hero', 'Countries served', 'دولة نخدمها'),
('hero.stat3', 'hero', 'Years of excellence', 'عام من التميّز'),
('hero.stat4', 'hero', 'Client satisfaction', 'رضا العملاء'),

('sections.servicesTitle', 'sections', 'What we build', 'ماذا ننفّذ'),
('sections.servicesSub', 'sections', 'End-to-end sports construction, from ground works to the final whistle.', 'إنشاءات رياضية متكاملة، من أعمال الأرض حتى صافرة النهاية.'),
('sections.projectsTitle', 'sections', 'Signature projects', 'مشاريع مميزة'),
('sections.projectsSub', 'sections', 'A portfolio trusted by federations, clubs, schools and governments.', 'محفظة أعمال تثق بها الاتحادات والأندية والمدارس والحكومات.'),
('sections.productsTitle', 'sections', 'Systems & products', 'الأنظمة والمنتجات'),
('sections.productsSub', 'sections', 'Certified surfaces, structures and equipment engineered for elite performance.', 'أسطح وهياكل ومعدات معتمدة مصممة للأداء النخبوي.'),
('sections.whyTitle', 'sections', 'Why Egytic', 'لماذا إيجيتك'),
('sections.whySub', 'sections', 'The standard the industry measures itself against.', 'المعيار الذي تقيس عليه الصناعة نفسها.'),
('sections.processTitle', 'sections', 'Our process', 'منهجية العمل'),
('sections.processSub', 'sections', 'A disciplined, transparent path from vision to opening day.', 'مسار منضبط وشفّاف من الرؤية حتى يوم الافتتاح.'),
('sections.clientsTitle', 'sections', 'Trusted by the best', 'موضع ثقة الأفضل'),
('sections.clientsSub', 'sections', 'Federations, clubs and institutions across the region.', 'اتحادات وأندية ومؤسسات في مختلف أنحاء المنطقة.'),
('sections.knowledgeTitle', 'sections', 'Knowledge Center', 'مركز المعرفة'),
('sections.knowledgeSub', 'sections', 'Technical guides, standards and case studies from our engineers.', 'أدلة تقنية ومعايير ودراسات حالة من مهندسينا.'),
('sections.testimonialsTitle', 'sections', 'What clients say', 'آراء عملائنا'),
('sections.ctaTitle', 'sections', 'Ready to build a landmark?', 'جاهز لبناء معلم بارز؟'),
('sections.ctaSub', 'sections', 'Tell us about your project and receive a detailed proposal within 48 hours.', 'أخبرنا عن مشروعك واحصل على عرض مفصّل خلال 48 ساعة.'),

('why.i1t', 'why', 'FIFA & IAAF certified', 'معتمد من الفيفا والاتحاد الدولي'),
('why.i1d', 'why', 'Surfaces and systems that meet the strictest international standards.', 'أسطح وأنظمة تلبّي أدق المعايير الدولية.'),
('why.i2t', 'why', 'In-house engineering', 'هندسة داخلية'),
('why.i2d', 'why', 'Civil, structural and surface specialists under one roof.', 'متخصصون في المدني والإنشائي والأسطح تحت سقف واحد.'),
('why.i3t', 'why', 'Turnkey delivery', 'تسليم مفتاح باليد'),
('why.i3d', 'why', 'Design, build, equip and maintain — a single accountable partner.', 'تصميم وتنفيذ وتجهيز وصيانة — شريك واحد مسؤول.'),
('why.i4t', 'why', '10-year warranties', 'ضمان 10 سنوات'),
('why.i4d', 'why', 'Confidence backed by the longest guarantees in the industry.', 'ثقة مدعومة بأطول ضمانات في الصناعة.'),

('process.s1t', 'process', 'Consultation', 'الاستشارة'),
('process.s1d', 'process', 'We study your goals, site and budget to define the right specification.', 'ندرس أهدافك والموقع والميزانية لتحديد المواصفة المناسبة.'),
('process.s2t', 'process', 'Design & engineering', 'التصميم والهندسة'),
('process.s2d', 'process', '3D concepts, technical drawings and certified material selection.', 'تصورات ثلاثية الأبعاد ومخططات فنية واختيار مواد معتمدة.'),
('process.s3t', 'process', 'Construction', 'التنفيذ'),
('process.s3d', 'process', 'Precision groundworks, drainage, surfacing and structures.', 'أعمال أرض دقيقة وتصريف ومسطحات وهياكل.'),
('process.s4t', 'process', 'Handover & care', 'التسليم والرعاية'),
('process.s4d', 'process', 'Testing, certification, training and long-term maintenance.', 'اختبار واعتماد وتدريب وصيانة طويلة الأمد.'),

('footer.tagline', 'footer', 'Building the world''s finest sports facilities.', 'نبني أرقى المنشآت الرياضية في العالم.'),
('footer.company', 'footer', 'Company', 'الشركة'),
('footer.explore', 'footer', 'Explore', 'استكشف'),
('footer.contact', 'footer', 'Contact', 'تواصل'),
('footer.rights', 'footer', 'All rights reserved.', 'جميع الحقوق محفوظة.'),
('footer.newsletter', 'footer', 'Get industry insights', 'احصل على رؤى الصناعة'),
('footer.newsletterSub', 'footer', 'Standards, case studies and product news — once a month.', 'معايير ودراسات حالة وأخبار المنتجات — مرة شهريًا.'),
('footer.subscribe', 'footer', 'Subscribe', 'اشتراك'),
('footer.emailPlaceholder', 'footer', 'Your email', 'بريدك الإلكتروني'),

('contact.title', 'contact', 'Let''s build something legendary', 'لنبنِ شيئًا أسطوريًا'),
('contact.sub', 'contact', 'Request a quote or free consultation. Our engineers respond within one business day.', 'اطلب عرض سعر أو استشارة مجانية. يرد مهندسونا خلال يوم عمل واحد.'),
('contact.name', 'contact', 'Full name', 'الاسم الكامل'),
('contact.email', 'contact', 'Email', 'البريد الإلكتروني'),
('contact.phone', 'contact', 'Phone', 'الهاتف'),
('contact.projectType', 'contact', 'Project type', 'نوع المشروع'),
('contact.budget', 'contact', 'Estimated budget', 'الميزانية التقديرية'),
('contact.message', 'contact', 'Tell us about your project', 'أخبرنا عن مشروعك'),
('contact.success', 'contact', 'Thank you! Your request has been received. We''ll be in touch shortly.', 'شكرًا لك! تم استلام طلبك وسنتواصل معك قريبًا.'),
('contact.office', 'contact', 'Head Office', 'المكتب الرئيسي'),
('contact.hours', 'contact', 'Sun–Thu, 9:00–18:00', 'الأحد–الخميس، 9:00–18:00'),

('quote.title', 'quote', 'Request a Quote', 'اطلب عرض سعر'),
('quote.sub', 'quote', 'A few details help us prepare an accurate proposal.', 'بعض التفاصيل تساعدنا على إعداد عرض دقيق.'),

('knowledge.readTime', 'knowledge', 'min read', 'دقيقة قراءة'),
('knowledge.backToList', 'knowledge', 'Back to Knowledge Center', 'العودة لمركز المعرفة'),
('knowledge.related', 'knowledge', 'Related articles', 'مقالات ذات صلة'),

('projects.filterAll', 'projects', 'All', 'الكل'),
('projects.location', 'projects', 'Location', 'الموقع'),
('projects.year', 'projects', 'Year', 'السنة'),
('projects.category', 'projects', 'Category', 'الفئة'),
('projects.scope', 'projects', 'Scope', 'النطاق'),
('projects.overview', 'projects', 'Project overview', 'نظرة عامة على المشروع'),
('projects.moreProjects', 'projects', 'More projects', 'مشاريع أخرى')
ON CONFLICT (key) DO NOTHING;
