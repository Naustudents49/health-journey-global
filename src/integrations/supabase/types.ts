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
      appointments: {
        Row: {
          appointment_type: string
          commission_cents: number | null
          consultation_fee_cents: number | null
          created_at: string
          doctor_id: string
          duration_minutes: number
          fee: number
          id: string
          invoice_id: string | null
          notes: string | null
          patient_consent_accepted: boolean
          patient_id: string
          payment_status: string
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_type?: string
          commission_cents?: number | null
          consultation_fee_cents?: number | null
          created_at?: string
          doctor_id: string
          duration_minutes?: number
          fee?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
          patient_consent_accepted?: boolean
          patient_id: string
          payment_status?: string
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_type?: string
          commission_cents?: number | null
          consultation_fee_cents?: number | null
          created_at?: string
          doctor_id?: string
          duration_minutes?: number
          fee?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
          patient_consent_accepted?: boolean
          patient_id?: string
          payment_status?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clinic_schedules: {
        Row: {
          clinic_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          slot_duration_minutes: number
          start_time: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          slot_duration_minutes?: number
          start_time: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          slot_duration_minutes?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_schedules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          city: string | null
          consultation_fee: number | null
          country: string | null
          created_at: string
          currency: string | null
          doctor_id: string
          id: string
          is_primary: boolean | null
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          consultation_fee?: number | null
          country?: string | null
          created_at?: string
          currency?: string | null
          doctor_id: string
          id?: string
          is_primary?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          consultation_fee?: number | null
          country?: string | null
          created_at?: string
          currency?: string | null
          doctor_id?: string
          id?: string
          is_primary?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      doctor_consent: {
        Row: {
          created_at: string
          data_protection_law_accepted: boolean
          data_protection_law_signed_at: string | null
          doctor_id: string
          electronic_billing_accepted: boolean
          electronic_billing_signed_at: string | null
          id: string
          ip_address: string | null
          telemedicine_2023_accepted: boolean
          telemedicine_2023_signed_at: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          data_protection_law_accepted?: boolean
          data_protection_law_signed_at?: string | null
          doctor_id: string
          electronic_billing_accepted?: boolean
          electronic_billing_signed_at?: string | null
          id?: string
          ip_address?: string | null
          telemedicine_2023_accepted?: boolean
          telemedicine_2023_signed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          data_protection_law_accepted?: boolean
          data_protection_law_signed_at?: string | null
          doctor_id?: string
          electronic_billing_accepted?: boolean
          electronic_billing_signed_at?: string | null
          id?: string
          ip_address?: string | null
          telemedicine_2023_accepted?: boolean
          telemedicine_2023_signed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      doctor_credentials: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          license_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          license_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          license_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_credentials_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: true
            referencedRelation: "doctor_details"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_details: {
        Row: {
          about_ar: string | null
          about_en: string | null
          bio: string | null
          certifications: string[] | null
          clinic_address: string | null
          clinic_name: string | null
          consultation_fee: number | null
          created_at: string
          currency: string | null
          education: string | null
          id: string
          is_pro: boolean
          is_verified: boolean | null
          languages: string[] | null
          national_id_last4: string | null
          pro_plus_active: boolean
          profile_id: string
          rating: number | null
          specialty: string | null
          syndicate_number: string | null
          telemedicine_enabled: boolean
          updated_at: string
          verification_status: string | null
          years_experience: number | null
        }
        Insert: {
          about_ar?: string | null
          about_en?: string | null
          bio?: string | null
          certifications?: string[] | null
          clinic_address?: string | null
          clinic_name?: string | null
          consultation_fee?: number | null
          created_at?: string
          currency?: string | null
          education?: string | null
          id?: string
          is_pro?: boolean
          is_verified?: boolean | null
          languages?: string[] | null
          national_id_last4?: string | null
          pro_plus_active?: boolean
          profile_id: string
          rating?: number | null
          specialty?: string | null
          syndicate_number?: string | null
          telemedicine_enabled?: boolean
          updated_at?: string
          verification_status?: string | null
          years_experience?: number | null
        }
        Update: {
          about_ar?: string | null
          about_en?: string | null
          bio?: string | null
          certifications?: string[] | null
          clinic_address?: string | null
          clinic_name?: string | null
          consultation_fee?: number | null
          created_at?: string
          currency?: string | null
          education?: string | null
          id?: string
          is_pro?: boolean
          is_verified?: boolean | null
          languages?: string[] | null
          national_id_last4?: string | null
          pro_plus_active?: boolean
          profile_id?: string
          rating?: number | null
          specialty?: string | null
          syndicate_number?: string | null
          telemedicine_enabled?: boolean
          updated_at?: string
          verification_status?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_details_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          currency_code: string
          name_ar: string | null
          name_en: string | null
          rate_to_usd: number
          symbol: string | null
          updated_at: string
        }
        Insert: {
          currency_code: string
          name_ar?: string | null
          name_en?: string | null
          rate_to_usd: number
          symbol?: string | null
          updated_at?: string
        }
        Update: {
          currency_code?: string
          name_ar?: string | null
          name_en?: string | null
          rate_to_usd?: number
          symbol?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_cents: number
          appointment_id: string | null
          commission_cents: number
          created_at: string
          currency: string
          customer_name: string | null
          customer_tax_id: string | null
          description: string | null
          doctor_profile_id: string | null
          environment: string
          eta_payload: Json | null
          eta_status: string | null
          eta_submission_uuid: string | null
          id: string
          issued_at: string | null
          net_cents: number
          number: number
          paid_at: string | null
          pdf_url: string | null
          seller_name: string | null
          seller_tax_id: string | null
          status: string
          subscription_id: string | null
          tax_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          appointment_id?: string | null
          commission_cents?: number
          created_at?: string
          currency?: string
          customer_name?: string | null
          customer_tax_id?: string | null
          description?: string | null
          doctor_profile_id?: string | null
          environment?: string
          eta_payload?: Json | null
          eta_status?: string | null
          eta_submission_uuid?: string | null
          id?: string
          issued_at?: string | null
          net_cents?: number
          number?: number
          paid_at?: string | null
          pdf_url?: string | null
          seller_name?: string | null
          seller_tax_id?: string | null
          status?: string
          subscription_id?: string | null
          tax_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          appointment_id?: string | null
          commission_cents?: number
          created_at?: string
          currency?: string
          customer_name?: string | null
          customer_tax_id?: string | null
          description?: string | null
          doctor_profile_id?: string | null
          environment?: string
          eta_payload?: Json | null
          eta_status?: string | null
          eta_submission_uuid?: string | null
          id?: string
          issued_at?: string | null
          net_cents?: number
          number?: number
          paid_at?: string | null
          pdf_url?: string | null
          seller_name?: string | null
          seller_tax_id?: string | null
          status?: string
          subscription_id?: string | null
          tax_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_details: {
        Row: {
          allergies: string[] | null
          blood_type: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact: string | null
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_details_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          environment: string
          id: string
          invoice_id: string | null
          paid_at: string | null
          provider: string
          provider_payment_id: string | null
          provider_session_id: string | null
          raw_payload: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          provider?: string
          provider_payment_id?: string | null
          provider_session_id?: string | null
          raw_payload?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          provider?: string
          provider_payment_id?: string | null
          provider_session_id?: string | null
          raw_payload?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_branches: {
        Row: {
          address: string | null
          chain_id: string
          city: string | null
          country: string | null
          created_at: string
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          updated_at: string
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          chain_id: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          updated_at?: string
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          chain_id?: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          updated_at?: string
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_branches_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_chains: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          is_verified: boolean
          license_number: string | null
          logo_url: string | null
          name: string
          name_ar: string | null
          owner_user_id: string
          slug: string
          updated_at: string
          verification_status: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_verified?: boolean
          license_number?: string | null
          logo_url?: string | null
          name: string
          name_ar?: string | null
          owner_user_id: string
          slug: string
          updated_at?: string
          verification_status?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_verified?: boolean
          license_number?: string | null
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          owner_user_id?: string
          slug?: string
          updated_at?: string
          verification_status?: string
          website?: string | null
        }
        Relationships: []
      }
      pharmacy_drug_listings: {
        Row: {
          alternative_name: string | null
          branch_id: string | null
          chain_id: string
          created_at: string
          currency: string | null
          dosage: string | null
          drug_name: string
          expires_at: string | null
          id: string
          is_active: boolean
          linked_post_id: string | null
          notes: string | null
          price: number | null
          stock_status: string
          updated_at: string
        }
        Insert: {
          alternative_name?: string | null
          branch_id?: string | null
          chain_id: string
          created_at?: string
          currency?: string | null
          dosage?: string | null
          drug_name: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          linked_post_id?: string | null
          notes?: string | null
          price?: number | null
          stock_status?: string
          updated_at?: string
        }
        Update: {
          alternative_name?: string | null
          branch_id?: string | null
          chain_id?: string
          created_at?: string
          currency?: string | null
          dosage?: string | null
          drug_name?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          linked_post_id?: string | null
          notes?: string | null
          price?: number | null
          stock_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_drug_listings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_drug_listings_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_drug_listings_linked_post_id_fkey"
            columns: ["linked_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_drug_info: {
        Row: {
          alternative_suggested: string | null
          created_at: string
          dosage: string | null
          drug_name: string
          id: string
          post_id: string
          updated_at: string
        }
        Insert: {
          alternative_suggested?: string | null
          created_at?: string
          dosage?: string | null
          drug_name: string
          id?: string
          post_id: string
          updated_at?: string
        }
        Update: {
          alternative_suggested?: string | null
          created_at?: string
          dosage?: string | null
          drug_name?: string
          id?: string
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_drug_info_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_replies: {
        Row: {
          author_profile_id: string
          author_role: string
          body: string
          created_at: string
          id: string
          is_doctor_verified: boolean | null
          parent_reply_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_profile_id: string
          author_role: string
          body: string
          created_at?: string
          id?: string
          is_doctor_verified?: boolean | null
          parent_reply_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_profile_id?: string
          author_role?: string
          body?: string
          created_at?: string
          id?: string
          is_doctor_verified?: boolean | null
          parent_reply_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_replies_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "post_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          reason: string
          reply_id: string | null
          reporter_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          reason: string
          reply_id?: string | null
          reporter_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string
          reply_id?: string | null
          reporter_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reports_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "post_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_profile_id: string
          author_role: string
          body: string
          city: string | null
          country: string | null
          created_at: string
          id: string
          is_pinned: boolean | null
          is_resolved: boolean | null
          media_urls: string[] | null
          post_type: string
          reactions_count: number | null
          replies_count: number | null
          specialty_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_profile_id: string
          author_role: string
          body: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          media_urls?: string[] | null
          post_type: string
          reactions_count?: number | null
          replies_count?: number | null
          specialty_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_profile_id?: string
          author_role?: string
          body?: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          media_urls?: string[] | null
          post_type?: string
          reactions_count?: number | null
          replies_count?: number | null
          specialty_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
          rating: number
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
          rating: number
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
          rating?: number
        }
        Relationships: []
      }
      specialties: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name_ar: string
          name_en: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name_ar: string
          name_en: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          code: string
          created_at: string
          currency: string
          description_ar: string | null
          description_en: string | null
          features: Json
          id: string
          interval: string
          is_active: boolean
          name_ar: string
          name_en: string
          price_cents: number
          sort_order: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          description_ar?: string | null
          description_en?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          price_cents: number
          sort_order?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          description_ar?: string | null
          description_en?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          price_cents?: number
          sort_order?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          plan_code: string | null
          price_id: string
          product_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          plan_code?: string | null
          price_id: string
          product_id?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          plan_code?: string | null
          price_id?: string
          product_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_contacts: {
        Row: {
          created_at: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
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
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_plan: {
        Args: { check_env?: string; plan: string; user_uuid: string }
        Returns: boolean
      }
      is_verified_doctor_profile: {
        Args: { _profile_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "patient" | "pharmacy"
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
      app_role: ["admin", "doctor", "patient", "pharmacy"],
    },
  },
} as const
