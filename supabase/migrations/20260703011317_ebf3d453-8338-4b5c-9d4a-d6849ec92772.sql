
CREATE INDEX IF NOT EXISTS idx_hero_slides_active_sort ON public.hero_slides (is_active, sort_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_governorates_active_sort ON public.governorates (active, sort_order) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_projects_status_sort ON public.projects (status, sort_order) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_services_status_sort ON public.services (status, sort_order) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_status_sort ON public.products (status, sort_order) WHERE status = 'published';
