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
      downloads: {
        Row: {
          category: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          featured: boolean
          file_url: string | null
          id: string
          preview_image: string | null
          requires_lead_capture: boolean
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
          id?: string
          preview_image?: string | null
          requires_lead_capture?: boolean
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
          id?: string
          preview_image?: string | null
          requires_lead_capture?: boolean
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
          internal_notes: string | null
          message: string | null
          name: string
          phone: string | null
          preferred_contact: string | null
          project_area: string | null
          project_type: string | null
          service: string | null
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
          internal_notes?: string | null
          message?: string | null
          name: string
          phone?: string | null
          preferred_contact?: string | null
          project_area?: string | null
          project_type?: string | null
          service?: string | null
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
          internal_notes?: string | null
          message?: string | null
          name?: string
          phone?: string | null
          preferred_contact?: string | null
          project_area?: string | null
          project_type?: string | null
          service?: string | null
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
      pages: {
        Row: {
          content_ar: string | null
          content_en: string | null
          created_at: string
          featured: boolean
          id: string
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
          featured?: boolean
          id?: string
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
          featured?: boolean
          id?: string
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
      qa_reports: {
        Row: {
          branch: string | null
          cls: number | null
          commit_sha: string | null
          created_at: string
          id: string
          lcp_ms: number | null
          metadata: Json | null
          more_opened: boolean | null
          notes: string | null
          page: string
          run_at: string
          screenshot_url: string | null
          viewport: string
          wa_overlap: boolean | null
        }
        Insert: {
          branch?: string | null
          cls?: number | null
          commit_sha?: string | null
          created_at?: string
          id?: string
          lcp_ms?: number | null
          metadata?: Json | null
          more_opened?: boolean | null
          notes?: string | null
          page: string
          run_at?: string
          screenshot_url?: string | null
          viewport: string
          wa_overlap?: boolean | null
        }
        Update: {
          branch?: string | null
          cls?: number | null
          commit_sha?: string | null
          created_at?: string
          id?: string
          lcp_ms?: number | null
          metadata?: Json | null
          more_opened?: boolean | null
          notes?: string | null
          page?: string
          run_at?: string
          screenshot_url?: string | null
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
          category: string | null
          cover_image: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          featured: boolean
          icon: string | null
          id: string
          slug_ar: string | null
          slug_en: string
          sort_order: number
          status: string
          title_ar: string | null
          title_en: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_image?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          icon?: string | null
          id?: string
          slug_ar?: string | null
          slug_en: string
          sort_order?: number
          status?: string
          title_ar?: string | null
          title_en: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_image?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          icon?: string | null
          id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
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
    },
  },
} as const
