export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      about_content: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          ref_id: string | null
          ref_table: string | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          ref_id?: string | null
          ref_table?: string | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          ref_id?: string | null
          ref_table?: string | null
          title?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          changes: Json | null
          created_at: string
          id: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          slug_ar: string | null
          slug_en: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          slug_ar?: string | null
          slug_en: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          slug_ar?: string | null
          slug_en?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string
          category_id: string | null
          content_ar: string | null
          content_en: string | null
          created_at: string
          excerpt_ar: string | null
          excerpt_en: string | null
          faq: Json
          featured: boolean
          featured_image: string | null
          id: string
          og_image: string | null
          published_at: string | null
          reading_time: number
          seo_description_ar: string | null
          seo_description_en: string | null
          seo_keywords: string | null
          seo_title_ar: string | null
          seo_title_en: string | null
          slug_ar: string | null
          slug_en: string
          status: Database["public"]["Enums"]["content_status"]
          table_of_contents: Json
          tags: string[]
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          category_id?: string | null
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          excerpt_ar?: string | null
          excerpt_en?: string | null
          faq?: Json
          featured?: boolean
          featured_image?: string | null
          id?: string
          og_image?: string | null
          published_at?: string | null
          reading_time?: number
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_keywords?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug_ar?: string | null
          slug_en: string
          status?: Database["public"]["Enums"]["content_status"]
          table_of_contents?: Json
          tags?: string[]
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          category_id?: string | null
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          excerpt_ar?: string | null
          excerpt_en?: string | null
          faq?: Json
          featured?: boolean
          featured_image?: string | null
          id?: string
          og_image?: string | null
          published_at?: string | null
          reading_time?: number
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_keywords?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug_ar?: string | null
          slug_en?: string
          status?: Database["public"]["Enums"]["content_status"]
          table_of_contents?: Json
          tags?: string[]
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string | null
          created_at: string
          expires_at: string | null
          featured: boolean
          file_url: string | null
          id: string
          image_url: string | null
          issued_at: string | null
          issuer_ar: string | null
          issuer_en: string | null
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          certificate_number?: string | null
          created_at?: string
          expires_at?: string | null
          featured?: boolean
          file_url?: string | null
          id?: string
          image_url?: string | null
          issued_at?: string | null
          issuer_ar?: string | null
          issuer_en?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          certificate_number?: string | null
          created_at?: string
          expires_at?: string | null
          featured?: boolean
          file_url?: string | null
          id?: string
          image_url?: string | null
          issued_at?: string | null
          issuer_ar?: string | null
          issuer_en?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          country: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          featured: boolean
          id: string
          industry: string | null
          logo_url: string | null
          name_ar: string
          name_en: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          id?: string
          industry?: string | null
          logo_url?: string | null
          name_ar: string
          name_en: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          id?: string
          industry?: string | null
          logo_url?: string | null
          name_ar?: string
          name_en?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      download_events: {
        Row: {
          created_at: string
          download_id: string | null
          event_type: string
          id: string
          language: string | null
          path: string | null
          referrer: string | null
          referrer_host: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          download_id?: string | null
          event_type: string
          id?: string
          language?: string | null
          path?: string | null
          referrer?: string | null
          referrer_host?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          download_id?: string | null
          event_type?: string
          id?: string
          language?: string | null
          path?: string | null
          referrer?: string | null
          referrer_host?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "download_events_download_id_fkey"
            columns: ["download_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
        ]
      }
      downloads: {
        Row: {
          category: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          featured: boolean
          file_url: string | null
          files: Json
          gallery: Json
          id: string
          og_image: string | null
          og_image_ar: string | null
          preview_image: string | null
          requires_lead_capture: boolean
          seo_description_ar: string | null
          seo_description_en: string | null
          seo_title_ar: string | null
          seo_title_en: string | null
          slug_ar: string | null
          slug_en: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          file_url?: string | null
          files?: Json
          gallery?: Json
          id?: string
          og_image?: string | null
          og_image_ar?: string | null
          preview_image?: string | null
          requires_lead_capture?: boolean
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug_ar?: string | null
          slug_en: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          file_url?: string | null
          files?: Json
          gallery?: Json
          id?: string
          og_image?: string | null
          og_image_ar?: string | null
          preview_image?: string | null
          requires_lead_capture?: boolean
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug_ar?: string | null
          slug_en?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer_ar: string | null
          answer_en: string
          category: string
          created_at: string
          id: string
          is_published: boolean
          question_ar: string | null
          question_en: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer_ar?: string | null
          answer_en: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question_ar?: string | null
          question_en: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer_ar?: string | null
          answer_en?: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question_ar?: string | null
          question_en?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      gallery: {
        Row: {
          alt_ar: string | null
          alt_en: string | null
          category: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          featured: boolean
          id: string
          image_url: string
          project_id: string | null
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          alt_ar?: string | null
          alt_en?: string | null
          category?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          id?: string
          image_url: string
          project_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          alt_ar?: string | null
          alt_en?: string | null
          category?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          id?: string
          image_url?: string
          project_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      governorates: {
        Row: {
          active: boolean
          created_at: string
          id: string
          logo_url: string | null
          name_ar: string
          name_en: string
          region_ar: string | null
          region_en: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          logo_url?: string | null
          name_ar: string
          name_en: string
          region_ar?: string | null
          region_en?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          logo_url?: string | null
          name_ar?: string
          name_en?: string
          region_ar?: string | null
          region_en?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          align: string
          created_at: string
          eyebrow_ar: string | null
          eyebrow_en: string | null
          fog_intensity: number
          hide_cta: boolean
          id: string
          image_url: string
          is_active: boolean
          overlay: string
          primary_href: string | null
          primary_label_ar: string | null
          primary_label_en: string | null
          scheduled_at: string | null
          secondary_href: string | null
          secondary_label_ar: string | null
          secondary_label_en: string | null
          sort_order: number
          sort_order_ar: number | null
          spotlight_intensity: number
          status: string
          subtitle_ar: string | null
          subtitle_en: string | null
          title_ar: string | null
          title_en: string
          updated_at: string
          vignette_intensity: number
        }
        Insert: {
          align?: string
          created_at?: string
          eyebrow_ar?: string | null
          eyebrow_en?: string | null
          fog_intensity?: number
          hide_cta?: boolean
          id?: string
          image_url: string
          is_active?: boolean
          overlay?: string
          primary_href?: string | null
          primary_label_ar?: string | null
          primary_label_en?: string | null
          scheduled_at?: string | null
          secondary_href?: string | null
          secondary_label_ar?: string | null
          secondary_label_en?: string | null
          sort_order?: number
          sort_order_ar?: number | null
          spotlight_intensity?: number
          status?: string
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string | null
          title_en: string
          updated_at?: string
          vignette_intensity?: number
        }
        Update: {
          align?: string
          created_at?: string
          eyebrow_ar?: string | null
          eyebrow_en?: string | null
          fog_intensity?: number
          hide_cta?: boolean
          id?: string
          image_url?: string
          is_active?: boolean
          overlay?: string
          primary_href?: string | null
          primary_label_ar?: string | null
          primary_label_en?: string | null
          scheduled_at?: string | null
          secondary_href?: string | null
          secondary_label_ar?: string | null
          secondary_label_en?: string | null
          sort_order?: number
          sort_order_ar?: number | null
          spotlight_intensity?: number
          status?: string
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string | null
          title_en?: string
          updated_at?: string
          vignette_intensity?: number
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          content: Json
          created_at: string
          id: string
          section_key: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          subtitle_ar: string | null
          subtitle_en: string | null
          title_ar: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          section_key: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          section_key?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      image_versions: {
        Row: {
          created_at: string
          entity_id: string
          entity_table: string
          field: string
          id: string
          note: string | null
          replaced_by_user: string | null
          url: string | null
          variants: Json | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_table: string
          field: string
          id?: string
          note?: string | null
          replaced_by_user?: string | null
          url?: string | null
          variants?: Json | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_table?: string
          field?: string
          id?: string
          note?: string | null
          replaced_by_user?: string | null
          url?: string | null
          variants?: Json | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_name: string
          cover_letter: string | null
          created_at: string
          cv_url: string | null
          email: string
          id: string
          job_id: string | null
          job_title: string | null
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_name: string
          cover_letter?: string | null
          created_at?: string
          cv_url?: string | null
          email: string
          id?: string
          job_id?: string | null
          job_title?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_name?: string
          cover_letter?: string | null
          created_at?: string
          cv_url?: string | null
          email?: string
          id?: string
          job_id?: string | null
          job_title?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_openings: {
        Row: {
          created_at: string
          department_ar: string | null
          department_en: string | null
          description_ar: string | null
          description_en: string | null
          employment_type: string
          id: string
          is_open: boolean
          location_ar: string | null
          location_en: string | null
          requirements_ar: string | null
          requirements_en: string | null
          slug: string
          sort_order: number
          title_ar: string | null
          title_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_ar?: string | null
          department_en?: string | null
          description_ar?: string | null
          description_en?: string | null
          employment_type?: string
          id?: string
          is_open?: boolean
          location_ar?: string | null
          location_en?: string | null
          requirements_ar?: string | null
          requirements_en?: string | null
          slug: string
          sort_order?: number
          title_ar?: string | null
          title_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_ar?: string | null
          department_en?: string | null
          description_ar?: string | null
          description_en?: string | null
          employment_type?: string
          id?: string
          is_open?: boolean
          location_ar?: string | null
          location_en?: string | null
          requirements_ar?: string | null
          requirements_en?: string | null
          slug?: string
          sort_order?: number
          title_ar?: string | null
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          attachment_url: string | null
          budget_range: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          intent: string | null
          internal_notes: string | null
          message: string | null
          name: string
          phone: string | null
          preferred_contact: string | null
          project_area: string | null
          project_type: string | null
          service: string | null
          source: string | null
          sport_type: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["lead_status"]
          type: Database["public"]["Enums"]["lead_type"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachment_url?: string | null
          budget_range?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          intent?: string | null
          internal_notes?: string | null
          message?: string | null
          name: string
          phone?: string | null
          preferred_contact?: string | null
          project_area?: string | null
          project_type?: string | null
          service?: string | null
          source?: string | null
          sport_type?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          type?: Database["public"]["Enums"]["lead_type"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachment_url?: string | null
          budget_range?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          intent?: string | null
          internal_notes?: string | null
          message?: string | null
          name?: string
          phone?: string | null
          preferred_contact?: string | null
          project_area?: string | null
          project_type?: string | null
          service?: string | null
          source?: string | null
          sport_type?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          type?: Database["public"]["Enums"]["lead_type"]
          updated_at?: string
        }
        Relationships: []
      }
      media_files: {
        Row: {
          alt_text: string | null
          category: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploader_id: string | null
        }
        Insert: {
          alt_text?: string | null
          category?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploader_id?: string | null
        }
        Update: {
          alt_text?: string | null
          category?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploader_id?: string | null
        }
        Relationships: []
      }
      menus: {
        Row: {
          created_at: string
          href: string
          id: string
          label_ar: string
          label_en: string
          location: string
          parent_id: string | null
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          href: string
          id?: string
          label_ar: string
          label_en: string
          location: string
          parent_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          label_ar?: string
          label_en?: string
          location?: string
          parent_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          locale: string
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          locale?: string
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          locale?: string
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      page_preview_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_email: string | null
          expires_at: string
          id: string
          label: string | null
          last_viewed_at: string | null
          page_id: string
          revoked_at: string | null
          token: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          expires_at: string
          id?: string
          label?: string | null
          last_viewed_at?: string | null
          page_id: string
          revoked_at?: string | null
          token: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          expires_at?: string
          id?: string
          label?: string | null
          last_viewed_at?: string | null
          page_id?: string
          revoked_at?: string | null
          token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_preview_tokens_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_versions: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          id: string
          page_id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          page_id: string
          snapshot: Json
          version_number: number
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          page_id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content_ar: string | null
          content_en: string | null
          created_at: string
          effective_at: string | null
          featured: boolean
          id: string
          live_notified_at: string | null
          seo_description_ar: string | null
          seo_description_en: string | null
          seo_keywords_ar: string | null
          seo_keywords_en: string | null
          seo_title_ar: string | null
          seo_title_en: string | null
          slug_ar: string | null
          slug_en: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          template: string
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          effective_at?: string | null
          featured?: boolean
          id?: string
          live_notified_at?: string | null
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_keywords_ar?: string | null
          seo_keywords_en?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug_ar?: string | null
          slug_en: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          template?: string
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          effective_at?: string | null
          featured?: boolean
          id?: string
          live_notified_at?: string | null
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_keywords_ar?: string | null
          seo_keywords_en?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug_ar?: string | null
          slug_en?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          template?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          icon: string | null
          id: string
          slug_ar: string | null
          slug_en: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          slug_ar?: string | null
          slug_en: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          slug_ar?: string | null
          slug_en?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          applications_ar: string[]
          applications_en: string[]
          category_id: string | null
          certifications: string[]
          content_ar: string | null
          content_en: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          downloads: Json
          featured: boolean
          features_ar: string[]
          features_en: string[]
          gallery: Json
          id: string
          image_url: string | null
          og_image: string | null
          seo_description_ar: string | null
          seo_description_en: string | null
          seo_keywords: string | null
          seo_title_ar: string | null
          seo_title_en: string | null
          slug_ar: string | null
          slug_en: string
          sort_order: number
          specifications: Json
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at: string
          variants: Json
        }
        Insert: {
          applications_ar?: string[]
          applications_en?: string[]
          category_id?: string | null
          certifications?: string[]
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          downloads?: Json
          featured?: boolean
          features_ar?: string[]
          features_en?: string[]
          gallery?: Json
          id?: string
          image_url?: string | null
          og_image?: string | null
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_keywords?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug_ar?: string | null
          slug_en: string
          sort_order?: number
          specifications?: Json
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at?: string
          variants?: Json
        }
        Update: {
          applications_ar?: string[]
          applications_en?: string[]
          category_id?: string | null
          certifications?: string[]
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          downloads?: Json
          featured?: boolean
          features_ar?: string[]
          features_en?: string[]
          gallery?: Json
          id?: string
          image_url?: string | null
          og_image?: string | null
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_keywords?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug_ar?: string | null
          slug_en?: string
          sort_order?: number
          specifications?: Json
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          title_en?: string
          updated_at?: string
          variants?: Json
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_categories: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          icon: string | null
          id: string
          slug_ar: string | null
          slug_en: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          slug_ar?: string | null
          slug_en: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          slug_ar?: string | null
          slug_en?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          area_sqm: number | null
          city: string | null
          client: string | null
          country: string | null
          cover_image: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          featured: boolean
          gallery: Json | null
          governorate_id: string | null
          id: string
          location: string | null
          overview_ar: string | null
          overview_en: string | null
          seo_description: string | null
          seo_title: string | null
          service_category: string | null
          slug_ar: string | null
          slug_en: string
          sort_order: number
          sport_type: string | null
          status: string
          surface_type: string | null
          title_ar: string | null
          title_en: string
          updated_at: string
          year: number | null
        }
        Insert: {
          area_sqm?: number | null
          city?: string | null
          client?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          gallery?: Json | null
          governorate_id?: string | null
          id?: string
          location?: string | null
          overview_ar?: string | null
          overview_en?: string | null
          seo_description?: string | null
          seo_title?: string | null
          service_category?: string | null
          slug_ar?: string | null
          slug_en: string
          sort_order?: number
          sport_type?: string | null
          status?: string
          surface_type?: string | null
          title_ar?: string | null
          title_en: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          area_sqm?: number | null
          city?: string | null
          client?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          gallery?: Json | null
          governorate_id?: string | null
          id?: string
          location?: string | null
          overview_ar?: string | null
          overview_en?: string | null
          seo_description?: string | null
          seo_title?: string | null
          service_category?: string | null
          slug_ar?: string | null
          slug_en?: string
          sort_order?: number
          sport_type?: string | null
          status?: string
          surface_type?: string | null
          title_ar?: string | null
          title_en?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_governorate_id_fkey"
            columns: ["governorate_id"]
            isOneToOne: false
            referencedRelation: "governorates"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_report_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_url: string
          report_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_url: string
          report_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_url?: string
          report_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_report_media_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "qa_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_reports: {
        Row: {
          branch: string | null
          cls: number | null
          commit_sha: string | null
          created_at: string
          created_by: string | null
          id: string
          lcp_ms: number | null
          metadata: Json | null
          more_opened: boolean | null
          notes: string | null
          page: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          run_at: string
          screenshot_url: string | null
          status: Database["public"]["Enums"]["qa_report_status"]
          submitted_at: string | null
          viewport: string
          wa_overlap: boolean | null
        }
        Insert: {
          branch?: string | null
          cls?: number | null
          commit_sha?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lcp_ms?: number | null
          metadata?: Json | null
          more_opened?: boolean | null
          notes?: string | null
          page: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          run_at?: string
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["qa_report_status"]
          submitted_at?: string | null
          viewport: string
          wa_overlap?: boolean | null
        }
        Update: {
          branch?: string | null
          cls?: number | null
          commit_sha?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lcp_ms?: number | null
          metadata?: Json | null
          more_opened?: boolean | null
          notes?: string | null
          page?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          run_at?: string
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["qa_report_status"]
          submitted_at?: string | null
          viewport?: string
          wa_overlap?: boolean | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_settings: {
        Row: {
          canonical_url: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          keywords: string | null
          meta_description_ar: string | null
          meta_description_en: string | null
          meta_title_ar: string | null
          meta_title_en: string | null
          og_description_ar: string | null
          og_description_en: string | null
          og_image: string | null
          og_title_ar: string | null
          og_title_en: string | null
          robots_follow: boolean
          robots_index: boolean
          route_path: string | null
          schema_type: string
          status: Database["public"]["Enums"]["content_status"]
          twitter_image: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          keywords?: string | null
          meta_description_ar?: string | null
          meta_description_en?: string | null
          meta_title_ar?: string | null
          meta_title_en?: string | null
          og_description_ar?: string | null
          og_description_en?: string | null
          og_image?: string | null
          og_title_ar?: string | null
          og_title_en?: string | null
          robots_follow?: boolean
          robots_index?: boolean
          route_path?: string | null
          schema_type?: string
          status?: Database["public"]["Enums"]["content_status"]
          twitter_image?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          keywords?: string | null
          meta_description_ar?: string | null
          meta_description_en?: string | null
          meta_title_ar?: string | null
          meta_title_en?: string | null
          og_description_ar?: string | null
          og_description_en?: string | null
          og_image?: string | null
          og_title_ar?: string | null
          og_title_en?: string | null
          robots_follow?: boolean
          robots_index?: boolean
          route_path?: string | null
          schema_type?: string
          status?: Database["public"]["Enums"]["content_status"]
          twitter_image?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          icon: string | null
          id: string
          slug_ar: string | null
          slug_en: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          slug_ar?: string | null
          slug_en: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          slug_ar?: string | null
          slug_en?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          alt_ar: string | null
          alt_en: string | null
          category: string | null
          cover_image: string | null
          cover_image_variants: Json | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          faqs: Json
          featured: boolean
          gallery_images: Json
          header_image: string | null
          header_image_variants: Json | null
          icon: string | null
          id: string
          og_image: string | null
          og_image_ar: string | null
          og_image_ar_variants: Json | null
          og_image_variants: Json | null
          seo_description_ar: string | null
          seo_description_en: string | null
          seo_title_ar: string | null
          seo_title_en: string | null
          slug_ar: string | null
          slug_en: string
          sort_order: number
          status: string
          title_ar: string | null
          title_en: string
          updated_at: string
        }
        Insert: {
          alt_ar?: string | null
          alt_en?: string | null
          category?: string | null
          cover_image?: string | null
          cover_image_variants?: Json | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          faqs?: Json
          featured?: boolean
          gallery_images?: Json
          header_image?: string | null
          header_image_variants?: Json | null
          icon?: string | null
          id?: string
          og_image?: string | null
          og_image_ar?: string | null
          og_image_ar_variants?: Json | null
          og_image_variants?: Json | null
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug_ar?: string | null
          slug_en: string
          sort_order?: number
          status?: string
          title_ar?: string | null
          title_en: string
          updated_at?: string
        }
        Update: {
          alt_ar?: string | null
          alt_en?: string | null
          category?: string | null
          cover_image?: string | null
          cover_image_variants?: Json | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          faqs?: Json
          featured?: boolean
          gallery_images?: Json
          header_image?: string | null
          header_image_variants?: Json | null
          icon?: string | null
          id?: string
          og_image?: string | null
          og_image_ar?: string | null
          og_image_ar_variants?: Json | null
          og_image_variants?: Json | null
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug_ar?: string | null
          slug_en?: string
          sort_order?: number
          status?: string
          title_ar?: string | null
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name_ar: string
          name_en: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          company_ar: string | null
          company_en: string | null
          created_at: string
          featured: boolean
          id: string
          name_ar: string
          name_en: string
          quote_ar: string
          quote_en: string
          rating: number
          role_ar: string | null
          role_en: string | null
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_ar?: string | null
          company_en?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          name_ar: string
          name_en: string
          quote_ar: string
          quote_en: string
          rating?: number
          role_ar?: string | null
          role_en?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_ar?: string | null
          company_en?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          name_ar?: string
          name_en?: string
          quote_ar?: string
          quote_en?: string
          rating?: number
          role_ar?: string | null
          role_en?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          ar: string
          created_at: string
          description: string | null
          en: string
          key: string
          namespace: string
          updated_at: string
        }
        Insert: {
          ar?: string
          created_at?: string
          description?: string | null
          en?: string
          key: string
          namespace?: string
          updated_at?: string
        }
        Update: {
          ar?: string
          created_at?: string
          description?: string | null
          en?: string
          key?: string
          namespace?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_permissions: { Args: never; Returns: string[] }
      get_page_by_preview_token: {
        Args: { _token: string }
        Returns: {
          content_ar: string
          content_en: string
          effective_at: string
          id: string
          seo_description_ar: string
          seo_description_en: string
          seo_title_ar: string
          seo_title_en: string
          slug_ar: string
          slug_en: string
          status: string
          title_ar: string
          title_en: string
          updated_at: string
          version_number: number
        }[]
      }
      has_permission: {
        Args: { _perm: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      notify_pages_now_live: { Args: never; Returns: number }
      publish_due_hero_slides: { Args: never; Returns: number }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "editor"
        | "content_manager"
        | "sales_viewer"
      content_status: "draft" | "published" | "archived"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal_sent"
        | "won"
        | "lost"
      lead_type: "quote" | "contact"
      qa_report_status: "draft" | "submitted" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "editor",
        "content_manager",
        "sales_viewer",
      ],
      content_status: ["draft", "published", "archived"],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "proposal_sent",
        "won",
        "lost",
      ],
      lead_type: ["quote", "contact"],
      qa_report_status: ["draft", "submitted", "approved", "rejected"],
    },
  },
} as const
