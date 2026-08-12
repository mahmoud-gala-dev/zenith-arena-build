INSERT INTO public.projects (slug_en, title_en, title_ar, city, country, location, governorate_id, status, featured, cover_image, gallery)
SELECT 'islamic-education-school-monufia', 'Islamic Education School — Monufia', 'التربية الإسلامية — المنوفية', 'Shebin El-Kom', 'Egypt', 'Monufia, Egypt',
  (SELECT id FROM public.governorates WHERE lower(name_en) LIKE '%monufia%' OR lower(name_en) LIKE '%menoufia%' OR name_ar LIKE '%المنوفية%' LIMIT 1),
  'published', false,
  '/__l5e/assets-v1/b6b383bb-faff-4be1-ba2c-3c4a49eeb0f3/islamic-education-school-monufia-1.jpg',
  to_jsonb(ARRAY[
    '/__l5e/assets-v1/b6b383bb-faff-4be1-ba2c-3c4a49eeb0f3/islamic-education-school-monufia-1.jpg',
    '/__l5e/assets-v1/62dc8227-8396-4a03-b45e-165396a218ff/islamic-education-school-monufia-2.jpg',
    '/__l5e/assets-v1/498620df-0c4c-4965-94fc-d8c796016972/islamic-education-school-monufia-3.jpg',
    '/__l5e/assets-v1/26637a5f-ecea-4141-a9ee-64673957cdc4/islamic-education-school-monufia-4.jpg',
    '/__l5e/assets-v1/da1d1864-a356-444d-a3e7-d95722a715e1/islamic-education-school-monufia-5.jpg',
    '/__l5e/assets-v1/5b9e8eb1-8121-499a-83d5-a191e3a5221a/islamic-education-school-monufia-6.jpg'
  ])
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE slug_en = 'islamic-education-school-monufia');

INSERT INTO public.projects (slug_en, title_en, title_ar, city, country, location, governorate_id, status, featured, cover_image, gallery)
SELECT 'riyad-al-salheen-monufia', 'Riyad Al-Salheen School — Monufia', 'رياض الصالحين — المنوفية', 'Shebin El-Kom', 'Egypt', 'Monufia, Egypt',
  (SELECT id FROM public.governorates WHERE lower(name_en) LIKE '%monufia%' OR lower(name_en) LIKE '%menoufia%' OR name_ar LIKE '%المنوفية%' LIMIT 1),
  'published', false,
  '/__l5e/assets-v1/e0baa9ae-8f79-4be4-bd7a-a542764d8302/riyad-al-salheen-monufia-1.jpg',
  to_jsonb(ARRAY[
    '/__l5e/assets-v1/e0baa9ae-8f79-4be4-bd7a-a542764d8302/riyad-al-salheen-monufia-1.jpg',
    '/__l5e/assets-v1/5ca18ad3-1e78-403a-944a-deeadfddca57/riyad-al-salheen-monufia-2.jpg',
    '/__l5e/assets-v1/3a9144d5-ac00-4da0-93a5-e6a619a6ee8b/riyad-al-salheen-monufia-3.jpg',
    '/__l5e/assets-v1/ed294756-ad95-4a7e-852f-396fecbfe483/riyad-al-salheen-monufia-4.jpg',
    '/__l5e/assets-v1/ca336f1e-1331-4878-a72c-457229fc9311/riyad-al-salheen-monufia-5.jpg',
    '/__l5e/assets-v1/fe29d6f1-d2c1-4696-b964-b6f3caf12c5d/riyad-al-salheen-monufia-6.jpg',
    '/__l5e/assets-v1/bc1890d9-095d-440d-a623-a39d01c74701/riyad-al-salheen-monufia-7.jpg',
    '/__l5e/assets-v1/960a3c5c-7e56-46cb-bd22-022a34509815/riyad-al-salheen-monufia-8.jpg',
    '/__l5e/assets-v1/815406e7-e058-4a98-9517-71d26f7e70b4/riyad-al-salheen-monufia-9.jpg',
    '/__l5e/assets-v1/23cfe1dc-4dff-432a-9f15-bab6ae1f47f1/riyad-al-salheen-monufia-10.jpg',
    '/__l5e/assets-v1/8c8bb36c-9582-4055-9e56-846f95775777/riyad-al-salheen-monufia-11.jpg',
    '/__l5e/assets-v1/3f5ae4c5-55a3-441e-9247-1b56fdfad7de/riyad-al-salheen-monufia-12.jpg',
    '/__l5e/assets-v1/398a5367-c857-48ef-86e5-e42e58065819/riyad-al-salheen-monufia-13.jpg',
    '/__l5e/assets-v1/31b74582-6e7a-4ee3-b755-cba319f9699f/riyad-al-salheen-monufia-14.jpg'
  ])
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE slug_en = 'riyad-al-salheen-monufia');