INSERT INTO public.homepage_sections (section_key, title_en, title_ar, subtitle_en, subtitle_ar, sort_order, status)
VALUES
  ('featured_projects', 'Featured projects', 'مشاريع مختارة', 'A snapshot of recent sports venues we designed and delivered.', 'لمحة من أحدث المنشآت الرياضية التي صممناها ونفذناها.', 4, 'published'),
  ('why', 'Why Egytic', 'لماذا إيجيتك', 'Certified quality, engineering rigor, and long-term warranties.', 'جودة موثقة، هندسة دقيقة، وضمانات طويلة الأمد.', 5, 'published'),
  ('process', 'Our process', 'منهجية العمل', 'From site survey to handover — a transparent, milestone-driven build.', 'من المعاينة إلى التسليم — مسار شفاف قائم على مراحل واضحة.', 6, 'published'),
  ('testimonials', 'What clients say', 'آراء العملاء', NULL, NULL, 7, 'published'),
  ('clients', 'Trusted by teams across Egypt', 'يثق بنا فرق ومؤسسات في مصر', 'Federations, academies, and premier venues.', 'اتحادات، أكاديميات، ومنشآت رائدة.', 8, 'published'),
  ('knowledge', 'From the knowledge center', 'من مركز المعرفة', 'Guides, standards, and case studies from our engineering team.', 'أدلة ومعايير ودراسات حالة من فريقنا الهندسي.', 9, 'published')
ON CONFLICT (section_key) DO NOTHING;