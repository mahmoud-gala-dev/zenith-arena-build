
CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  eyebrow_en TEXT,
  eyebrow_ar TEXT,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  subtitle_en TEXT,
  subtitle_ar TEXT,
  primary_label_en TEXT,
  primary_label_ar TEXT,
  primary_href TEXT,
  secondary_label_en TEXT,
  secondary_label_ar TEXT,
  secondary_href TEXT,
  image_url TEXT NOT NULL,
  overlay TEXT NOT NULL DEFAULT 'dark',
  align TEXT NOT NULL DEFAULT 'left',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hero_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
GRANT ALL ON public.hero_slides TO service_role;

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active hero slides"
ON public.hero_slides FOR SELECT
USING (is_active = true OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert hero slides"
ON public.hero_slides FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update hero slides"
ON public.hero_slides FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete hero slides"
ON public.hero_slides FOR DELETE TO authenticated
USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_hero_slides_updated_at
BEFORE UPDATE ON public.hero_slides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for hero images in existing 'media' bucket
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Staff can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can update media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media' AND public.is_staff(auth.uid()));

INSERT INTO public.hero_slides (eyebrow_en, eyebrow_ar, title_en, title_ar, subtitle_en, subtitle_ar, primary_label_en, primary_label_ar, primary_href, secondary_label_en, secondary_label_ar, secondary_href, image_url, overlay, align, sort_order) VALUES
('Egytic Sports', 'إيجيتك سبورتس', 'Building Iconic Sports Infrastructure', 'نبني منشآت رياضية استثنائية', 'From FIFA-grade stadiums to community courts — engineered, delivered, maintained.', 'من ملاعب بمعايير الفيفا إلى الملاعب المجتمعية — هندسة وتنفيذ وصيانة.', 'Get a Quote', 'اطلب عرض سعر', '/quote', 'Explore Projects', 'استكشف المشاريع', '/projects', 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=1920&q=80', 'dark', 'left', 1),
('Signature Projects', 'مشاريعنا المميزة', 'World-Class Stadiums Across Egypt', 'ملاعب عالمية في جميع أنحاء مصر', 'Delivering premium athletic venues from Cairo to Aswan with certified excellence.', 'ننفذ منشآت رياضية متميزة من القاهرة إلى أسوان بمعايير معتمدة.', 'View Portfolio', 'شاهد أعمالنا', '/projects', 'Our Services', 'خدماتنا', '/services', 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1920&q=80', 'dark', 'center', 2),
('Trusted Partner', 'شريك موثوق', 'Certified. Reliable. Ahead of Schedule.', 'معتمدون. موثوقون. نسبق المواعيد.', 'ISO-certified processes, FIFA-approved materials, and 15+ years of on-ground expertise.', 'إجراءات معتمدة من الأيزو، مواد معتمدة من الفيفا، وأكثر من 15 عامًا من الخبرة الميدانية.', 'Meet the Team', 'تعرّف علينا', '/about', 'Contact Sales', 'تواصل معنا', '/contact', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1920&q=80', 'dark', 'right', 3);
