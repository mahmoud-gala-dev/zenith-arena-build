
-- =========================
-- Phase 4a: FAQ items
-- =========================
CREATE TABLE public.faq_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_en text NOT NULL,
  question_ar text,
  answer_en text NOT NULL,
  answer_ar text,
  category text NOT NULL DEFAULT 'general',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faq_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq_items TO authenticated;
GRANT ALL ON public.faq_items TO service_role;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faq_items_public_read" ON public.faq_items FOR SELECT USING (is_published = true);
CREATE POLICY "faq_items_staff_read_all" ON public.faq_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "faq_items_staff_write" ON public.faq_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER faq_items_updated_at BEFORE UPDATE ON public.faq_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER faq_items_audit AFTER INSERT OR UPDATE OR DELETE ON public.faq_items FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- =========================
-- Phase 4b: Job openings + applications
-- =========================
CREATE TABLE public.job_openings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title_en text NOT NULL,
  title_ar text,
  department_en text,
  department_ar text,
  location_en text,
  location_ar text,
  employment_type text NOT NULL DEFAULT 'Full-time',
  description_en text,
  description_ar text,
  requirements_en text,
  requirements_ar text,
  is_open boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.job_openings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_openings TO authenticated;
GRANT ALL ON public.job_openings TO service_role;
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_openings_public_read" ON public.job_openings FOR SELECT USING (is_open = true);
CREATE POLICY "job_openings_staff_read_all" ON public.job_openings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "job_openings_staff_write" ON public.job_openings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER job_openings_updated_at BEFORE UPDATE ON public.job_openings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER job_openings_audit AFTER INSERT OR UPDATE OR DELETE ON public.job_openings FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TABLE public.job_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.job_openings(id) ON DELETE SET NULL,
  job_title text,
  applicant_name text NOT NULL,
  email text NOT NULL,
  phone text,
  cv_url text,
  cover_letter text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- No anon grants: submissions go through service_role via server fn
GRANT SELECT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_applications_staff_read" ON public.job_applications FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "job_applications_staff_write" ON public.job_applications FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER job_applications_audit AFTER INSERT OR UPDATE OR DELETE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- =========================
-- Phase 4c: Newsletter subscribers
-- =========================
CREATE TABLE public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  locale text NOT NULL DEFAULT 'en',
  source text,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- No anon grants: subscriptions go through service_role via server fn
GRANT SELECT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "newsletter_staff_read" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "newsletter_staff_write" ON public.newsletter_subscribers FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER newsletter_subscribers_updated_at BEFORE UPDATE ON public.newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- Seed a few FAQ items so the page is not empty
-- =========================
INSERT INTO public.faq_items (question_en, question_ar, answer_en, answer_ar, category, sort_order) VALUES
('How long does it take to build a football pitch?','كم يستغرق بناء ملعب كرة قدم؟','A standard 11-a-side synthetic turf pitch takes 8–12 weeks from ground-breaking to handover. Natural and hybrid pitches typically require 4–6 months.','يستغرق ملعب صناعي قياسي لـ 11 لاعبًا من 8 إلى 12 أسبوعًا من بدء الأعمال حتى التسليم. أما الملاعب الطبيعية والهجينة فتتطلب عادة 4–6 أشهر.','projects', 10),
('Do you handle design as well as construction?','هل تنفذون التصميم بالإضافة إلى التشييد؟','Yes — we are a turnkey partner. Our in-house teams cover feasibility, concept design, technical drawings, construction, certification, and long-term maintenance.','نعم — نحن شريك متكامل. تغطي فرقنا الداخلية دراسات الجدوى والتصميم المفاهيمي والمخططات الفنية والتنفيذ والاعتماد والصيانة طويلة الأمد.','projects', 20),
('How much does a padel court cost?','كم تكلفة ملعب البادل؟','Panoramic glass padel courts typically range from USD 25,000 to USD 45,000 depending on structure, turf and LED lighting selection.','تتراوح تكلفة ملاعب البادل الزجاجية البانورامية عادة بين 25,000 و45,000 دولار أمريكي حسب الهيكل والعشب واختيار الإضاءة.','costs', 10),
('Are your surfaces certified?','هل أسطحكم معتمدة؟','Yes — we install FIFA Quality / Quality Pro, World Athletics Class 1 & 2, ITF and FINA-compliant systems, all backed by independent laboratory testing.','نعم — نركّب أنظمة معتمدة FIFA Quality / Quality Pro وWorld Athletics فئة 1 و2 وITF ومطابقة لـ FINA، جميعها مدعومة باختبارات مختبرات مستقلة.','certifications', 10),
('What warranty do you offer?','ما الضمان الذي تقدّمونه؟','Playing surfaces carry manufacturer warranties of 8–10 years, structures up to 15 years, and workmanship 2 years — among the longest guarantees in the industry.','أسطح اللعب مضمونة من المصنّع 8–10 سنوات، والهياكل حتى 15 سنة، والتنفيذ سنتان — من بين أطول الضمانات في الصناعة.','maintenance', 10);

-- Seed a few job openings
INSERT INTO public.job_openings (slug, title_en, title_ar, department_en, department_ar, location_en, location_ar, employment_type, description_en, description_ar, sort_order) VALUES
('senior-civil-engineer','Senior Civil Engineer — Sports Structures','مهندس مدني أول — الهياكل الرياضية','Engineering','الهندسة','Riyadh, Saudi Arabia','الرياض، السعودية','Full-time','Lead structural design and delivery of stadiums, arenas and sports halls across the region.','قيادة التصميم الإنشائي وتنفيذ الاستادات والصالات الرياضية في المنطقة.', 10),
('project-manager-turf','Project Manager — Football Turf','مدير مشروع — عشب كرة القدم','Delivery','التنفيذ','Dubai, UAE','دبي، الإمارات','Full-time','Own end-to-end delivery of FIFA-certified synthetic turf projects.','قيادة تنفيذ مشاريع العشب الصناعي المعتمدة من الفيفا من البداية للنهاية.', 20),
('track-specialist','Track Surfacing Specialist','أخصائي أسطح المضامير','Operations','العمليات','Doha, Qatar','الدوحة، قطر','Full-time','Install and QA World Athletics Class 1 & 2 running tracks.','تركيب وضبط جودة مضامير الجري المعتمدة من الاتحاد الدولي لألعاب القوى.', 30);
