/**
 * Central shared types.
 * Route-local search params, form drafts, and page-specific shapes stay in their own files.
 * Only truly shared primitives and DB row aliases belong here.
 */
import type { Database } from "@/integrations/supabase/types";

/** Bilingual label pair used across cards, menus, filters. */
export type L = { en: string; ar: string };

/** Legal / long-form page section (heading + body). */
export type Section = { h: string; body: string };

/** DB Row aliases — one canonical import path. */
export type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type BlogRow = Database["public"]["Tables"]["blog_posts"]["Row"];
export type GalleryRow = Database["public"]["Tables"]["gallery"]["Row"];
export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type TestimonialRow = Database["public"]["Tables"]["testimonials"]["Row"];
export type DownloadRow = Database["public"]["Tables"]["downloads"]["Row"];
export type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"];
export type FaqItemRow = Database["public"]["Tables"]["faq_items"]["Row"];
export type JobOpeningRow = Database["public"]["Tables"]["job_openings"]["Row"];
export type GovernorateRow = Database["public"]["Tables"]["governorates"]["Row"];
export type HeroSlideRow = Database["public"]["Tables"]["hero_slides"]["Row"];
export type PageRow = Database["public"]["Tables"]["pages"]["Row"];
export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type AppRole = Database["public"]["Enums"]["app_role"];
