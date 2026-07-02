-- Enums for CMS status and download visibility
DO $$ BEGIN
  CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Categories
CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug_en text NOT NULL UNIQUE,
  slug_ar text,
  title_en text NOT NULL,
  title_ar text NOT NULL,
  description_en text,
  description_ar text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT ALL ON public.service_categories TO service_role;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published service categories" ON public.service_categories FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage service categories" ON public.service_categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug_en text NOT NULL UNIQUE,
  slug_ar text,
  title_en text NOT NULL,
  title_ar text NOT NULL,
  description_en text,
  description_ar text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published product categories" ON public.product_categories FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage product categories" ON public.product_categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.project_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug_en text NOT NULL UNIQUE,
  slug_ar text,
  title_en text NOT NULL,
  title_ar text NOT NULL,
  description_en text,
  description_ar text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.project_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.project_categories TO authenticated;
GRANT ALL ON public.project_categories TO service_role;
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published project categories" ON public.project_categories FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage project categories" ON public.project_categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug_en text NOT NULL UNIQUE,
  slug_ar text,
  title_en text NOT NULL,
  title_ar text NOT NULL,
  description_en text,
  description_ar text,
  sort_order integer NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published blog categories" ON public.blog_categories FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage blog categories" ON public.blog_categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read tags" ON public.tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff can manage tags" ON public.tags FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  slug_en text NOT NULL UNIQUE,
  slug_ar text,
  title_en text NOT NULL,
  title_ar text NOT NULL,
  description_en text,
  description_ar text,
  content_en text,
  content_ar text,
  image_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  features_en text[] NOT NULL DEFAULT '{}',
  features_ar text[] NOT NULL DEFAULT '{}',
  specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  applications_en text[] NOT NULL DEFAULT '{}',
  applications_ar text[] NOT NULL DEFAULT '{}',
  certifications text[] NOT NULL DEFAULT '{}',
  downloads jsonb NOT NULL DEFAULT '[]'::jsonb,
  seo_title_en text,
  seo_title_ar text,
  seo_description_en text,
  seo_description_ar text,
  seo_keywords text,
  og_image text,
  status public.content_status NOT NULL DEFAULT 'published',
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published products" ON public.products FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage products" ON public.products FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Blog
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  slug_en text NOT NULL UNIQUE,
  slug_ar text,
  title_en text NOT NULL,
  title_ar text NOT NULL,
  excerpt_en text,
  excerpt_ar text,
  content_en text,
  content_ar text,
  featured_image text,
  author_name text NOT NULL DEFAULT 'Apex Editorial Team',
  reading_time integer NOT NULL DEFAULT 5,
  tags text[] NOT NULL DEFAULT '{}',
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  table_of_contents jsonb NOT NULL DEFAULT '[]'::jsonb,
  seo_title_en text,
  seo_title_ar text,
  seo_description_en text,
  seo_description_ar text,
  seo_keywords text,
  og_image text,
  status public.content_status NOT NULL DEFAULT 'published',
  featured boolean NOT NULL DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published blog posts" ON public.blog_posts FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage blog posts" ON public.blog_posts FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Downloads and assets
CREATE TABLE IF NOT EXISTS public.downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_ar text NOT NULL,
  slug_en text NOT NULL UNIQUE,
  slug_ar text,
  category text NOT NULL,
  description_en text,
  description_ar text,
  file_url text,
  preview_image text,
  requires_lead_capture boolean NOT NULL DEFAULT false,
  status public.content_status NOT NULL DEFAULT 'published',
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.downloads TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.downloads TO authenticated;
GRANT ALL ON public.downloads TO service_role;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published downloads" ON public.downloads FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage downloads" ON public.downloads FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  logo_url text,
  industry text,
  country text,
  website text,
  featured boolean NOT NULL DEFAULT false,
  status public.content_status NOT NULL DEFAULT 'published',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clients TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published clients" ON public.clients FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage clients" ON public.clients FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_ar text NOT NULL,
  issuer_en text,
  issuer_ar text,
  certificate_number text,
  issued_at date,
  expires_at date,
  image_url text,
  file_url text,
  status public.content_status NOT NULL DEFAULT 'published',
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.certificates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published certificates" ON public.certificates FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage certificates" ON public.certificates FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  role_en text,
  role_ar text,
  company_en text,
  company_ar text,
  quote_en text NOT NULL,
  quote_ar text NOT NULL,
  avatar_url text,
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  status public.content_status NOT NULL DEFAULT 'published',
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published testimonials" ON public.testimonials FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_ar text NOT NULL,
  description_en text,
  description_ar text,
  image_url text NOT NULL,
  alt_en text,
  alt_ar text,
  category text,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  status public.content_status NOT NULL DEFAULT 'published',
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery TO authenticated;
GRANT ALL ON public.gallery TO service_role;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published gallery" ON public.gallery FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage gallery" ON public.gallery FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Pages, SEO, menus and homepage sections
CREATE TABLE IF NOT EXISTS public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug_en text NOT NULL UNIQUE,
  slug_ar text,
  title_en text NOT NULL,
  title_ar text NOT NULL,
  content_en text,
  content_ar text,
  template text NOT NULL DEFAULT 'standard',
  status public.content_status NOT NULL DEFAULT 'published',
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published pages" ON public.pages FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage pages" ON public.pages FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  route_path text,
  meta_title_en text,
  meta_title_ar text,
  meta_description_en text,
  meta_description_ar text,
  keywords text,
  canonical_url text,
  og_title_en text,
  og_title_ar text,
  og_description_en text,
  og_description_ar text,
  og_image text,
  twitter_image text,
  robots_index boolean NOT NULL DEFAULT true,
  robots_follow boolean NOT NULL DEFAULT true,
  schema_type text NOT NULL DEFAULT 'WebPage',
  status public.content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seo_settings_entity_or_route CHECK (entity_id IS NOT NULL OR route_path IS NOT NULL)
);
GRANT SELECT ON public.seo_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.seo_settings TO authenticated;
GRANT ALL ON public.seo_settings TO service_role;
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published SEO settings" ON public.seo_settings FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage SEO settings" ON public.seo_settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read public settings" ON public.settings FOR SELECT TO anon, authenticated USING (is_public OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage settings" ON public.settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL,
  label_en text NOT NULL,
  label_ar text NOT NULL,
  href text NOT NULL,
  parent_id uuid REFERENCES public.menus(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menus TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.menus TO authenticated;
GRANT ALL ON public.menus TO service_role;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published menus" ON public.menus FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage menus" ON public.menus FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  title_en text,
  title_ar text,
  subtitle_en text,
  subtitle_ar text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.homepage_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.homepage_sections TO authenticated;
GRANT ALL ON public.homepage_sections TO service_role;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published homepage sections" ON public.homepage_sections FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage homepage sections" ON public.homepage_sections FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Role permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage permissions" ON public.permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read role permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage role permissions" ON public.role_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_categories_status_sort ON public.service_categories(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_categories_status_sort ON public.product_categories(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_project_categories_status_sort ON public.project_categories(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_blog_categories_status_sort ON public.blog_categories(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_products_status_featured ON public.products(status, featured, sort_order);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_featured ON public.blog_posts(status, featured, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_downloads_status_featured ON public.downloads(status, featured, sort_order);
CREATE INDEX IF NOT EXISTS idx_clients_status_featured ON public.clients(status, featured, sort_order);
CREATE INDEX IF NOT EXISTS idx_certificates_status_featured ON public.certificates(status, featured, sort_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_status_featured ON public.testimonials(status, featured, sort_order);
CREATE INDEX IF NOT EXISTS idx_gallery_status_featured ON public.gallery(status, featured, sort_order);
CREATE INDEX IF NOT EXISTS idx_gallery_project ON public.gallery(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_status_sort ON public.pages(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_seo_settings_route ON public.seo_settings(route_path);
CREATE INDEX IF NOT EXISTS idx_settings_public ON public.settings(is_public);
CREATE INDEX IF NOT EXISTS idx_menus_location_sort ON public.menus(location, sort_order);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_status_sort ON public.homepage_sections(status, sort_order);

-- Updated-at triggers
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'service_categories','product_categories','project_categories','blog_categories','tags','products','blog_posts','downloads','clients','certificates','testimonials','gallery','pages','seo_settings','settings','menus','homepage_sections','permissions'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', tbl, tbl);
  END LOOP;
END $$;