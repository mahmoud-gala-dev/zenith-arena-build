
CREATE TABLE public.governorates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  logo_url text,
  region_en text,
  region_ar text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.governorates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.governorates TO authenticated;
GRANT ALL ON public.governorates TO service_role;
ALTER TABLE public.governorates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read governorates" ON public.governorates FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Staff manage governorates" ON public.governorates FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER governorates_updated_at BEFORE UPDATE ON public.governorates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.projects ADD COLUMN governorate_id uuid REFERENCES public.governorates(id) ON DELETE SET NULL;
CREATE INDEX projects_governorate_idx ON public.projects(governorate_id);
