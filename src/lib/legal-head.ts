import type { PageRow } from "@/lib/queries";

type Fallbacks = {
  fallbackTitleEn: string;
  fallbackTitleAr: string;
  fallbackDescEn: string;
  fallbackDescAr: string;
};

type SeoRow = PageRow & {
  seo_title_en?: string | null;
  seo_title_ar?: string | null;
  seo_description_en?: string | null;
  seo_description_ar?: string | null;
  seo_keywords_en?: string | null;
  seo_keywords_ar?: string | null;
};

function pick(...values: Array<string | null | undefined>): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export function buildLegalHead(page: PageRow | null | undefined, fb: Fallbacks) {
  const p = (page ?? null) as SeoRow | null;

  const titleEn = pick(p?.seo_title_en, p?.title_en, fb.fallbackTitleEn);
  const titleAr = pick(p?.seo_title_ar, p?.title_ar, fb.fallbackTitleAr);
  const descEn = pick(p?.seo_description_en, fb.fallbackDescEn);
  const descAr = pick(p?.seo_description_ar, fb.fallbackDescAr);
  const keywordsEn = pick(p?.seo_keywords_en);
  const keywordsAr = pick(p?.seo_keywords_ar);

  const meta: Array<Record<string, string>> = [
    { title: titleEn },
    { name: "description", content: descEn },
    { property: "og:title", content: titleEn },
    { property: "og:description", content: descEn },
    { property: "og:locale", content: "en_US" },
    { property: "og:locale:alternate", content: "ar_EG" },
    { property: "og:title:ar", content: titleAr },
    { property: "og:description:ar", content: descAr },
  ];

  const keywords = [keywordsEn, keywordsAr].filter(Boolean).join(", ");
  if (keywords) meta.push({ name: "keywords", content: keywords });

  return { meta };
}
