
insert into public.menus (location, label_en, label_ar, href, sort_order, status) values
  ('mobile', 'Services', 'الخدمات', '/services', 1, 'published'),
  ('mobile', 'Projects', 'المشاريع', '/projects', 2, 'published'),
  ('mobile', 'Products', 'المنتجات', '/products', 3, 'published'),
  ('mobile', 'Gallery', 'المعرض', '/gallery', 4, 'published'),
  ('mobile', 'Clients', 'العملاء', '/clients', 5, 'published'),
  ('mobile', 'Certificates', 'الشهادات', '/certificates', 6, 'published'),
  ('mobile', 'Knowledge', 'المعرفة', '/knowledge', 7, 'published'),
  ('mobile', 'Downloads', 'التحميلات', '/downloads', 8, 'published'),
  ('mobile', 'About', 'من نحن', '/about', 9, 'published'),
  ('mobile', 'Careers', 'الوظائف', '/careers', 10, 'published'),
  ('mobile', 'FAQ', 'الأسئلة الشائعة', '/faq', 11, 'published'),
  ('mobile', 'Contact', 'تواصل معنا', '/contact', 12, 'published'),
  ('mobile', 'Privacy', 'الخصوصية', '/privacy', 13, 'published'),
  ('mobile', 'Terms', 'الشروط', '/terms', 14, 'published')
on conflict do nothing;
