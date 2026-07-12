
CREATE TABLE public.about_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.about_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.about_content TO authenticated;
GRANT ALL ON public.about_content TO service_role;

ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "about_content public read"
  ON public.about_content FOR SELECT
  USING (true);

CREATE POLICY "about_content staff write"
  ON public.about_content FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER update_about_content_updated_at
  BEFORE UPDATE ON public.about_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_about_content
  AFTER INSERT OR UPDATE OR DELETE ON public.about_content
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

INSERT INTO public.about_content (key, value) VALUES
('hero', '{"image_url": "", "eyebrow_en": "About", "eyebrow_ar": "من نحن", "title_en": "Egytic Sports", "title_ar": "إيجيتك سبورتس", "subtitle_en": "Egypt''s trusted partner for sports infrastructure — from concept to championship.", "subtitle_ar": "شريككم الموثوق في مصر لبناء البنية التحتية الرياضية — من الفكرة إلى البطولة."}'::jsonb),
('story', '{"title_en": "Our Story", "title_ar": "قصتنا", "body_en": "Egytic Sports designs, builds, and maintains professional sports facilities across Egypt with international standards and a passion for local excellence.", "body_ar": "تصمم إيجيتك سبورتس وتنشئ وتصون المنشآت الرياضية الاحترافية في جميع أنحاء مصر بمعايير دولية وشغف بالتميز المحلي."}'::jsonb),
('values', '[
  {"icon": "ShieldCheck", "title_en": "Certified Quality", "title_ar": "جودة معتمدة", "desc_en": "FIFA, ITF and FIBA compliant installations.", "desc_ar": "منشآت مطابقة لمعايير الفيفا والاتحاد الدولي للتنس وفيبا."},
  {"icon": "Cpu", "title_en": "Modern Technology", "title_ar": "تقنية حديثة", "desc_en": "Latest surfaces, smart lighting and IoT monitoring.", "desc_ar": "أحدث الأسطح والإضاءة الذكية والمراقبة."},
  {"icon": "Wrench", "title_en": "Full Lifecycle", "title_ar": "دورة حياة كاملة", "desc_en": "Design, build, and long-term maintenance under one roof.", "desc_ar": "تصميم وتنفيذ وصيانة طويلة الأمد تحت سقف واحد."},
  {"icon": "Award", "title_en": "Proven Track Record", "title_ar": "سجل حافل", "desc_en": "Hundreds of projects delivered across governorates.", "desc_ar": "مئات المشاريع المنفذة في مختلف المحافظات."}
]'::jsonb),
('stats', '[
  {"key": "projects", "value": "250+", "label_en": "Projects Delivered", "label_ar": "مشروع منفذ"},
  {"key": "years", "value": "15+", "label_en": "Years of Experience", "label_ar": "سنة خبرة"},
  {"key": "clients", "value": "180+", "label_en": "Happy Clients", "label_ar": "عميل سعيد"},
  {"key": "governorates", "value": "20+", "label_en": "Governorates Covered", "label_ar": "محافظة"}
]'::jsonb);
