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
      ads: {
        Row: {
          ad_type: string | null
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          priority: number | null
          profile_id: string | null
          quality_notes: string | null
          quality_score: number | null
          status: string | null
          target_category: string | null
          title: string
        }
        Insert: {
          ad_type?: string | null
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          priority?: number | null
          profile_id?: string | null
          quality_notes?: string | null
          quality_score?: number | null
          status?: string | null
          target_category?: string | null
          title: string
        }
        Update: {
          ad_type?: string | null
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          priority?: number | null
          profile_id?: string | null
          quality_notes?: string | null
          quality_score?: number | null
          status?: string | null
          target_category?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_maintenance_logs: {
        Row: {
          action_type: string
          created_at: string | null
          description: string | null
          id: string
          impact_count: number | null
          status: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          impact_count?: number | null
          status?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          impact_count?: number | null
          status?: string | null
        }
        Relationships: []
      }
      ai_repair_reports: {
        Row: {
          created_at: string | null
          id: string
          issue_description: string | null
          proposed_fix_sql: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_description?: string | null
          proposed_fix_sql?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          issue_description?: string | null
          proposed_fix_sql?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      ballot_votes: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          proposal_id: string
          vote_choice: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          proposal_id: string
          vote_choice: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          proposal_id?: string
          vote_choice?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballot_votes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "civic_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          type: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          type?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          assigned_operator_id: string | null
          assigned_staff_name: string | null
          bridge_item_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_notes: string | null
          customer_phone: string | null
          deposit_amount: number | null
          deposit_paid: boolean | null
          duration_min: number | null
          fully_paid: boolean | null
          id: string
          merchant_notes: string | null
          price: number | null
          rescheduled_from: string | null
          scheduled_at: string
          service_description: string | null
          service_name: string
          setxio_appointment_id: string | null
          status: string
          store_id: string | null
          stripe_payment_intent_id: string | null
          sync_status: string | null
          synced_to_setxio_at: string | null
          tenant_id: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          assigned_operator_id?: string | null
          assigned_staff_name?: string | null
          bridge_item_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          duration_min?: number | null
          fully_paid?: boolean | null
          id?: string
          merchant_notes?: string | null
          price?: number | null
          rescheduled_from?: string | null
          scheduled_at: string
          service_description?: string | null
          service_name: string
          setxio_appointment_id?: string | null
          status?: string
          store_id?: string | null
          stripe_payment_intent_id?: string | null
          sync_status?: string | null
          synced_to_setxio_at?: string | null
          tenant_id?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          assigned_operator_id?: string | null
          assigned_staff_name?: string | null
          bridge_item_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          duration_min?: number | null
          fully_paid?: boolean | null
          id?: string
          merchant_notes?: string | null
          price?: number | null
          rescheduled_from?: string | null
          scheduled_at?: string
          service_description?: string | null
          service_name?: string
          setxio_appointment_id?: string | null
          status?: string
          store_id?: string | null
          stripe_payment_intent_id?: string | null
          sync_status?: string | null
          synced_to_setxio_at?: string | null
          tenant_id?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "partner_csm_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "detailed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bridge_items: {
        Row: {
          ai_metadata: Json | null
          allow_backorder: boolean | null
          created_at: string
          currency: string | null
          description: string | null
          embedding: string | null
          external_id: string | null
          external_source: string | null
          id: string
          image_urls: string[] | null
          is_available: boolean | null
          item_type: string
          low_stock_threshold: number | null
          metadata: Json | null
          moderation_reason: string | null
          moderation_status: string
          name: string
          price: number | null
          stock_quantity: number | null
          stock_reserved: number | null
          store_id: string | null
          tenant_id: string
          track_inventory: boolean | null
          updated_at: string
        }
        Insert: {
          ai_metadata?: Json | null
          allow_backorder?: boolean | null
          created_at?: string
          currency?: string | null
          description?: string | null
          embedding?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          image_urls?: string[] | null
          is_available?: boolean | null
          item_type: string
          low_stock_threshold?: number | null
          metadata?: Json | null
          moderation_reason?: string | null
          moderation_status?: string
          name: string
          price?: number | null
          stock_quantity?: number | null
          stock_reserved?: number | null
          store_id?: string | null
          tenant_id: string
          track_inventory?: boolean | null
          updated_at?: string
        }
        Update: {
          ai_metadata?: Json | null
          allow_backorder?: boolean | null
          created_at?: string
          currency?: string | null
          description?: string | null
          embedding?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          image_urls?: string[] | null
          is_available?: boolean | null
          item_type?: string
          low_stock_threshold?: number | null
          metadata?: Json | null
          moderation_reason?: string | null
          moderation_status?: string
          name?: string
          price?: number | null
          stock_quantity?: number | null
          stock_reserved?: number | null
          store_id?: string | null
          tenant_id?: string
          track_inventory?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bridge_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bridge_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "partner_csm_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      church_members: {
        Row: {
          church_id: string
          created_at: string | null
          id: string
          role: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          church_id: string
          created_at?: string | null
          id?: string
          role?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          church_id?: string
          created_at?: string | null
          id?: string
          role?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_members_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_directory: {
        Row: {
          bio: string | null
          city: string | null
          contact_info: Json | null
          county: string
          created_at: string | null
          id: string
          is_active: boolean | null
          jurisdiction: string
          metadata: Json | null
          name: string
          tenure_end: string | null
          tenure_start: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          contact_info?: Json | null
          county: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction: string
          metadata?: Json | null
          name: string
          tenure_end?: string | null
          tenure_start?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          contact_info?: Json | null
          county?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction?: string
          metadata?: Json | null
          name?: string
          tenure_end?: string | null
          tenure_start?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      civic_incidents: {
        Row: {
          assigned_to: string | null
          community: string | null
          county: string | null
          created_at: string | null
          description: string
          id: string
          location: string
          media_urls: string[] | null
          priority: string | null
          reporter_id: string | null
          resolution_notes: string | null
          state: string | null
          status: string | null
          type: string
          updated_at: string | null
          upvote_count: number | null
        }
        Insert: {
          assigned_to?: string | null
          community?: string | null
          county?: string | null
          created_at?: string | null
          description: string
          id?: string
          location: string
          media_urls?: string[] | null
          priority?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          state?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          upvote_count?: number | null
        }
        Update: {
          assigned_to?: string | null
          community?: string | null
          county?: string | null
          created_at?: string | null
          description?: string
          id?: string
          location?: string
          media_urls?: string[] | null
          priority?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          state?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          upvote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_incidents_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_proposals: {
        Row: {
          created_at: string
          creator_id: string | null
          description: string
          expires_at: string
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          description: string
          expires_at: string
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          description?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "civic_proposals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_services: {
        Row: {
          address: string | null
          category: string
          city: string | null
          county: string
          created_at: string | null
          department: string
          id: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          category: string
          city?: string | null
          county: string
          created_at?: string | null
          department: string
          id?: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          city?: string | null
          county?: string
          created_at?: string | null
          department?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      civic_voter_registry: {
        Row: {
          issued_at: string
          profile_id: string
          sbt_token_id: number
        }
        Insert: {
          issued_at?: string
          profile_id: string
          sbt_token_id: number
        }
        Update: {
          issued_at?: string
          profile_id?: string
          sbt_token_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "civic_voter_registry_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_votes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
          vote_type: number
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
          vote_type: number
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
          vote_type?: number
        }
        Relationships: [
          {
            foreignKeyName: "comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          downvote_count: number | null
          id: string
          parent_id: string | null
          post_id: string | null
          priority: number | null
          profile_id: string | null
          upvote_count: number | null
          views: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          downvote_count?: number | null
          id?: string
          parent_id?: string | null
          post_id?: string | null
          priority?: number | null
          profile_id?: string | null
          upvote_count?: number | null
          views?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          downvote_count?: number | null
          id?: string
          parent_id?: string | null
          post_id?: string | null
          priority?: number | null
          profile_id?: string | null
          upvote_count?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "detailed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_note_ratings: {
        Row: {
          created_at: string | null
          id: string
          note_id: string
          rating: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_id: string
          rating: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note_id?: string
          rating?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_note_ratings_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "community_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_note_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_notes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "detailed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_notes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_notes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_flags: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          post_id: string | null
          reason: string
          reporter_id: string
          status: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          reason: string
          reporter_id: string
          status?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          reason?: string
          reporter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_flags_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "detailed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_domains: {
        Row: {
          created_at: string
          domain_name: string
          id: string
          is_verified: boolean
          tenant_id: string
        }
        Insert: {
          created_at?: string
          domain_name: string
          id?: string
          is_verified?: boolean
          tenant_id: string
        }
        Update: {
          created_at?: string
          domain_name?: string
          id?: string
          is_verified?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_manna: {
        Row: {
          created_at: string | null
          date: string
          id: string
          reflection: string | null
          verse_reference: string
          verse_text: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          reflection?: string | null
          verse_reference: string
          verse_text: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          reflection?: string | null
          verse_reference?: string
          verse_text?: string
        }
        Relationships: []
      }
      delivery_logs: {
        Row: {
          action: string
          created_at: string | null
          driver_id: string | null
          id: string
          metadata: Json | null
          order_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          driver_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          driver_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dlq_messages: {
        Row: {
          created_at: string
          error_details: string | null
          id: string
          payload: Json
          retry_count: number
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_details?: string | null
          id?: string
          payload: Json
          retry_count?: number
          source: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_details?: string | null
          id?: string
          payload?: Json
          retry_count?: number
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_payroll_streams: {
        Row: {
          created_at: string
          driver_id: string
          hourly_rate: number
          id: string
          rate_per_second: number
          status: string
          stream_contract_id: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          hourly_rate: number
          id?: string
          rate_per_second: number
          status?: string
          stream_contract_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          hourly_rate?: number
          id?: string
          rate_per_second?: number
          status?: string
          stream_contract_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_payroll_streams_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      duna_foundational_signers: {
        Row: {
          agreed_to_terms_at: string
          conduct_signature_hash: string
          id: string
          profile_id: string
        }
        Insert: {
          agreed_to_terms_at?: string
          conduct_signature_hash: string
          id?: string
          profile_id: string
        }
        Update: {
          agreed_to_terms_at?: string
          conduct_signature_hash?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duna_foundational_signers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string | null
          post_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "detailed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          city: string | null
          created_at: string | null
          description: string | null
          embedding: string | null
          end_time: string | null
          id: string
          image_url: string | null
          is_public: boolean | null
          location: string | null
          price: number | null
          profile_id: string
          start_time: string
          ticket_url: string | null
          title: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          location?: string | null
          price?: number | null
          profile_id: string
          start_time: string
          ticket_url?: string | null
          title: string
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          location?: string | null
          price?: number | null
          profile_id?: string
          start_time?: string
          ticket_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fintech_kyc: {
        Row: {
          created_at: string | null
          document_type: string | null
          document_url: string | null
          id: string
          notes: string | null
          profile_id: string
          status: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          notes?: string | null
          profile_id: string
          status?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          notes?: string | null
          profile_id?: string
          status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fintech_kyc_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fintech_ledger: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          transaction_group_id: string
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          transaction_group_id: string
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          transaction_group_id?: string
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fintech_ledger_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "fintech_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      fintech_wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          owner_id: string
          status: string | null
          updated_at: string | null
          wallet_type: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          owner_id: string
          status?: string | null
          updated_at?: string | null
          wallet_type?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          owner_id?: string
          status?: string | null
          updated_at?: string | null
          wallet_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fintech_wallets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string | null
          following_id: string | null
          id: string
          interaction_score: number | null
        }
        Insert: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
          interaction_score?: number | null
        }
        Update: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
          interaction_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string | null
          group_id: string
          profile_id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          profile_id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          profile_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          category: string | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          id: string
          name: string
          rules: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          category?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          id?: string
          name: string
          rules?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          category?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          id?: string
          name?: string
          rules?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_id: string
          cover_note: string | null
          created_at: string | null
          id: string
          job_id: string
          resume_snapshot: Json | null
          status: string | null
        }
        Insert: {
          applicant_id: string
          cover_note?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          resume_snapshot?: Json | null
          status?: string | null
        }
        Update: {
          applicant_id?: string
          cover_note?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          resume_snapshot?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company_name: string | null
          created_at: string | null
          description: string | null
          id: string
          job_type: string | null
          location: string | null
          salary_range: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          job_type?: string | null
          location?: string | null
          salary_range?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          job_type?: string | null
          location?: string | null
          salary_range?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_transactions: {
        Row: {
          amount: number
          created_at: string
          csm_tenant_id: string | null
          currency: string | null
          id: string
          metadata: Json | null
          receiver_tag: number
          sender_tag: number | null
          status: string
          transaction_type: string
          updated_at: string
          user_id: string
          xrpl_tx_hash: string | null
          xrpl_wallet_source: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          csm_tenant_id?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          receiver_tag: number
          sender_tag?: number | null
          status?: string
          transaction_type: string
          updated_at?: string
          user_id: string
          xrpl_tx_hash?: string | null
          xrpl_wallet_source?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          csm_tenant_id?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          receiver_tag?: number
          sender_tag?: number | null
          status?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
          xrpl_tx_hash?: string | null
          xrpl_wallet_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_transactions_csm_tenant_id_fkey"
            columns: ["csm_tenant_id"]
            isOneToOne: false
            referencedRelation: "partner_csm_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_access_config: {
        Row: {
          created_at: string | null
          id: string
          trusted_person_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          trusted_person_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          trusted_person_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legacy_access_config_trusted_person_id_fkey"
            columns: ["trusted_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_access_config_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_access_requests: {
        Row: {
          access_pin: string | null
          admin_notes: string | null
          created_at: string | null
          id: string
          requester_id: string | null
          resolved_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          access_pin?: string | null
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          requester_id?: string | null
          resolved_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          access_pin?: string | null
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          requester_id?: string | null
          resolved_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legacy_access_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_access_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_inquiries: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          initial_message: string | null
          partner_site_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          initial_message?: string | null
          partner_site_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          initial_message?: string | null
          partner_site_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_inquiries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_subscriptions: {
        Row: {
          ad_credits_monthly: number | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          last_synced_at: string | null
          max_bridge_items: number | null
          max_monthly_orders: number | null
          max_pos_terminals: number | null
          plan: string
          profile_id: string | null
          status: string
          store_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          sync_source: string | null
          tenant_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          ad_credits_monthly?: number | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_synced_at?: string | null
          max_bridge_items?: number | null
          max_monthly_orders?: number | null
          max_pos_terminals?: number | null
          plan?: string
          profile_id?: string | null
          status?: string
          store_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          sync_source?: string | null
          tenant_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          ad_credits_monthly?: number | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_synced_at?: string | null
          max_bridge_items?: number | null
          max_monthly_orders?: number | null
          max_pos_terminals?: number | null
          plan?: string
          profile_id?: string | null
          status?: string
          store_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          sync_source?: string | null
          tenant_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "partner_csm_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          delivered_at: string | null
          id: string
          is_read: boolean | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          recipient_id: string
          reference_id: string | null
          sender_id: string | null
          type: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id: string
          reference_id?: string | null
          sender_id?: string | null
          type: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          reference_id?: string | null
          sender_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          commission_amount: number
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          store_id: string | null
          unit_price: number
          vendor_earning: number
        }
        Insert: {
          commission_amount?: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          store_id?: string | null
          unit_price: number
          vendor_earning?: number
        }
        Update: {
          commission_amount?: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          store_id?: string | null
          unit_price?: number
          vendor_earning?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_whisper_insights: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          order_id: string
          processing_time_ms: number | null
          raw_transcript: string | null
          structured_data: Json | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          order_id: string
          processing_time_ms?: number | null
          raw_transcript?: string | null
          structured_data?: Json | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          order_id?: string
          processing_time_ms?: number | null
          raw_transcript?: string | null
          structured_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_whisper_insights_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number | null
          created_at: string | null
          curb_pickup_details: string | null
          currency: string | null
          customer_id: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          delivery_status: string | null
          driver_id: string | null
          fan_out_status: string | null
          fulfillment_type: string | null
          id: string
          items: Json | null
          ledger_transaction_group_id: string | null
          payment_method: string | null
          pickup_window_end: string | null
          pickup_window_start: string | null
          platform_fee_amount: number | null
          platform_fee_bps: number | null
          shipping_address: string | null
          shipping_carrier: string | null
          shipping_label_url: string | null
          status: string | null
          store_id: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string | null
          vendor_line_items: Json | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          curb_pickup_details?: string | null
          currency?: string | null
          customer_id?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_status?: string | null
          driver_id?: string | null
          fan_out_status?: string | null
          fulfillment_type?: string | null
          id?: string
          items?: Json | null
          ledger_transaction_group_id?: string | null
          payment_method?: string | null
          pickup_window_end?: string | null
          pickup_window_start?: string | null
          platform_fee_amount?: number | null
          platform_fee_bps?: number | null
          shipping_address?: string | null
          shipping_carrier?: string | null
          shipping_label_url?: string | null
          status?: string | null
          store_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string | null
          vendor_line_items?: Json | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          curb_pickup_details?: string | null
          currency?: string | null
          customer_id?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_status?: string | null
          driver_id?: string | null
          fan_out_status?: string | null
          fulfillment_type?: string | null
          id?: string
          items?: Json | null
          ledger_transaction_group_id?: string | null
          payment_method?: string | null
          pickup_window_end?: string | null
          pickup_window_start?: string | null
          platform_fee_amount?: number | null
          platform_fee_bps?: number | null
          shipping_address?: string | null
          shipping_carrier?: string | null
          shipping_label_url?: string | null
          status?: string | null
          store_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string | null
          vendor_line_items?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_csm_tenants: {
        Row: {
          api_key_hash: string
          base_url: string
          contact_email: string | null
          created_at: string
          display_name: string
          id: string
          platform_fee_bps: number
          platform_slug: string | null
          status: string
          stripe_account_id: string | null
          tenant_slug: string
          updated_at: string
          webhook_endpoint: string | null
        }
        Insert: {
          api_key_hash: string
          base_url: string
          contact_email?: string | null
          created_at?: string
          display_name: string
          id?: string
          platform_fee_bps?: number
          platform_slug?: string | null
          status?: string
          stripe_account_id?: string | null
          tenant_slug: string
          updated_at?: string
          webhook_endpoint?: string | null
        }
        Update: {
          api_key_hash?: string
          base_url?: string
          contact_email?: string | null
          created_at?: string
          display_name?: string
          id?: string
          platform_fee_bps?: number
          platform_slug?: string | null
          status?: string
          stripe_account_id?: string | null
          tenant_slug?: string
          updated_at?: string
          webhook_endpoint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_csm_tenants_platform_slug_fkey"
            columns: ["platform_slug"]
            isOneToOne: false
            referencedRelation: "platform_settings"
            referencedColumns: ["slug"]
          },
        ]
      }
      partner_sites_mirror: {
        Row: {
          created_at: string | null
          custom_domain: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          name: string | null
          subdomain: string | null
        }
        Insert: {
          created_at?: string | null
          custom_domain?: string | null
          id: string
          industry?: string | null
          is_active?: boolean | null
          name?: string | null
          subdomain?: string | null
        }
        Update: {
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          name?: string | null
          subdomain?: string | null
        }
        Relationships: []
      }
      platform_activity: {
        Row: {
          action_type: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_ads: {
        Row: {
          budget: number
          clicks: number | null
          content_id: string
          content_type: string
          created_at: string | null
          end_date: string | null
          id: string
          impressions: number | null
          start_date: string | null
          status: string | null
          store_id: string | null
        }
        Insert: {
          budget: number
          clicks?: number | null
          content_id: string
          content_type: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          start_date?: string | null
          status?: string | null
          store_id?: string | null
        }
        Update: {
          budget?: number
          clicks?: number | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          start_date?: string | null
          status?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_ads_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_announcements: {
        Row: {
          content: string
          created_at: string | null
          id: number
          is_active: boolean | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          auto_approve_hours: number | null
          base_delivery_fee: number | null
          driver_fee_percentage: number | null
          global_commission_rate: number | null
          id: number
          is_auto_approve_enabled: boolean | null
          is_commission_enabled: boolean | null
          is_refunds_enabled: boolean | null
          is_store_seo_enabled: boolean | null
          is_vendor_verification_required: boolean | null
          is_withdrawal_enabled: boolean | null
          platform_name: string | null
          platform_public_key: string | null
          refund_window_days: number | null
          slug: string | null
          stripe_connected: boolean | null
          updated_at: string | null
          vendor_fee_percentage: number | null
        }
        Insert: {
          auto_approve_hours?: number | null
          base_delivery_fee?: number | null
          driver_fee_percentage?: number | null
          global_commission_rate?: number | null
          id?: number
          is_auto_approve_enabled?: boolean | null
          is_commission_enabled?: boolean | null
          is_refunds_enabled?: boolean | null
          is_store_seo_enabled?: boolean | null
          is_vendor_verification_required?: boolean | null
          is_withdrawal_enabled?: boolean | null
          platform_name?: string | null
          platform_public_key?: string | null
          refund_window_days?: number | null
          slug?: string | null
          stripe_connected?: boolean | null
          updated_at?: string | null
          vendor_fee_percentage?: number | null
        }
        Update: {
          auto_approve_hours?: number | null
          base_delivery_fee?: number | null
          driver_fee_percentage?: number | null
          global_commission_rate?: number | null
          id?: number
          is_auto_approve_enabled?: boolean | null
          is_commission_enabled?: boolean | null
          is_refunds_enabled?: boolean | null
          is_store_seo_enabled?: boolean | null
          is_vendor_verification_required?: boolean | null
          is_withdrawal_enabled?: boolean | null
          platform_name?: string | null
          platform_public_key?: string | null
          refund_window_days?: number | null
          slug?: string | null
          stripe_connected?: boolean | null
          updated_at?: string | null
          vendor_fee_percentage?: number | null
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string | null
          id: string
          option_text: string
          post_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_text: string
          post_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_text?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "detailed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_options_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_options_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_content"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          post_id: string | null
          profile_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          post_id?: string | null
          profile_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          post_id?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "detailed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_votes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
          vote_type: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
          vote_type?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
          vote_type?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "detailed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_content"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          ai_category: string | null
          ai_classified_at: string | null
          ai_confidence: number | null
          ai_extracted_keyword: string | null
          alert_scope: string | null
          author_community: string | null
          author_country: string | null
          author_county: string | null
          author_state: string | null
          category: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          downvote_count: number | null
          embedding: string | null
          event_end_time: string | null
          event_location: string | null
          event_start_time: string | null
          group_id: string | null
          hot_score: number | null
          id: string
          is_nsfw: boolean | null
          is_pinned: boolean | null
          lat: number | null
          likes_count: number | null
          lng: number | null
          location: string | null
          media_urls: string[] | null
          metadata: Json | null
          moderation_checked_at: string | null
          moderation_flag: string | null
          moderation_status: string | null
          original_post_id: string | null
          poll_data: Json | null
          priority: number | null
          profile_id: string | null
          reply_count: number | null
          repost_count: number | null
          reposts_count: number | null
          tags: string[] | null
          type: string | null
          upvote_count: number | null
          views: number | null
          visibility_scope:
            | Database["public"]["Enums"]["visibility_scope"]
            | null
        }
        Insert: {
          ai_category?: string | null
          ai_classified_at?: string | null
          ai_confidence?: number | null
          ai_extracted_keyword?: string | null
          alert_scope?: string | null
          author_community?: string | null
          author_country?: string | null
          author_county?: string | null
          author_state?: string | null
          category?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          downvote_count?: number | null
          embedding?: string | null
          event_end_time?: string | null
          event_location?: string | null
          event_start_time?: string | null
          group_id?: string | null
          hot_score?: number | null
          id?: string
          is_nsfw?: boolean | null
          is_pinned?: boolean | null
          lat?: number | null
          likes_count?: number | null
          lng?: number | null
          location?: string | null
          media_urls?: string[] | null
          metadata?: Json | null
          moderation_checked_at?: string | null
          moderation_flag?: string | null
          moderation_status?: string | null
          original_post_id?: string | null
          poll_data?: Json | null
          priority?: number | null
          profile_id?: string | null
          reply_count?: number | null
          repost_count?: number | null
          reposts_count?: number | null
          tags?: string[] | null
          type?: string | null
          upvote_count?: number | null
          views?: number | null
          visibility_scope?:
            | Database["public"]["Enums"]["visibility_scope"]
            | null
        }
        Update: {
          ai_category?: string | null
          ai_classified_at?: string | null
          ai_confidence?: number | null
          ai_extracted_keyword?: string | null
          alert_scope?: string | null
          author_community?: string | null
          author_country?: string | null
          author_county?: string | null
          author_state?: string | null
          category?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          downvote_count?: number | null
          embedding?: string | null
          event_end_time?: string | null
          event_location?: string | null
          event_start_time?: string | null
          group_id?: string | null
          hot_score?: number | null
          id?: string
          is_nsfw?: boolean | null
          is_pinned?: boolean | null
          lat?: number | null
          likes_count?: number | null
          lng?: number | null
          location?: string | null
          media_urls?: string[] | null
          metadata?: Json | null
          moderation_checked_at?: string | null
          moderation_flag?: string | null
          moderation_status?: string | null
          original_post_id?: string | null
          poll_data?: Json | null
          priority?: number | null
          profile_id?: string | null
          reply_count?: number | null
          repost_count?: number | null
          reposts_count?: number | null
          tags?: string[] | null
          type?: string | null
          upvote_count?: number | null
          views?: number | null
          visibility_scope?:
            | Database["public"]["Enums"]["visibility_scope"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "detailed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          images: string[] | null
          is_verified_purchase: boolean | null
          product_id: string | null
          profile_id: string | null
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          is_verified_purchase?: boolean | null
          product_id?: string | null
          profile_id?: string | null
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          is_verified_purchase?: boolean | null
          product_id?: string | null
          profile_id?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          avg_rating: number | null
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          discount_percent: number | null
          external_id: string | null
          external_source: string | null
          id: string
          image_urls: string[] | null
          name: string
          original_price: number | null
          price: number
          review_count: number | null
          status: string | null
          stock_status: string | null
          store_id: string | null
          views: number | null
        }
        Insert: {
          avg_rating?: number | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount_percent?: number | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          image_urls?: string[] | null
          name: string
          original_price?: number | null
          price: number
          review_count?: number | null
          status?: string | null
          stock_status?: string | null
          store_id?: string | null
          views?: number | null
        }
        Update: {
          avg_rating?: number | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount_percent?: number | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          image_urls?: string[] | null
          name?: string
          original_price?: number | null
          price?: number
          review_count?: number | null
          status?: string | null
          stock_status?: string | null
          store_id?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ad_credits: number | null
          allow_dms: boolean | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          birth_day: number | null
          birth_month: number | null
          birth_year: number | null
          blur_nsfw: boolean | null
          business_category: string | null
          community: string | null
          company: string | null
          country: string | null
          county: string | null
          cover_url: string | null
          created_at: string | null
          credentials: string | null
          current_lat: number | null
          current_lng: number | null
          custom_base_fee: number | null
          custom_fee_percentage: number | null
          denomination: string | null
          department: string | null
          did_address: string | null
          dismissed_bubbles: Json | null
          driver_application_data: Json | null
          driver_application_status: string | null
          driver_mode_active: boolean | null
          driver_rating: number | null
          email: string
          enable_typing_indicators: boolean | null
          first_name: string | null
          gender: string | null
          handle: string | null
          id: string
          is_primary: boolean | null
          is_public: boolean | null
          is_verified: boolean | null
          is_verified_resident: boolean
          jurisdiction: string | null
          last_active_at: string | null
          last_free_ad_at: string | null
          last_name: string | null
          last_stream_url: string | null
          live_stream_url: string | null
          location: string | null
          name: string
          occupation: string | null
          official_email: string | null
          on_faith_wall: boolean | null
          owner_id: string | null
          partner_id: string | null
          phone: string | null
          position: string | null
          return_policy: string | null
          role: string | null
          service_times: Json | null
          show_followers: boolean | null
          show_following: boolean | null
          show_online_status: boolean | null
          show_read_receipts: boolean | null
          sso_linked: boolean | null
          state: string | null
          status: string | null
          store_type: string | null
          suspended_until: string | null
          tithe_url: string | null
          tos_accepted_at: string | null
          updated_at: string | null
          vehicle_info: string | null
          verification_requested: boolean | null
          website: string | null
          xrpl_destination_tag: number | null
          zip: string | null
        }
        Insert: {
          ad_credits?: number | null
          allow_dms?: boolean | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          birth_day?: number | null
          birth_month?: number | null
          birth_year?: number | null
          blur_nsfw?: boolean | null
          business_category?: string | null
          community?: string | null
          company?: string | null
          country?: string | null
          county?: string | null
          cover_url?: string | null
          created_at?: string | null
          credentials?: string | null
          current_lat?: number | null
          current_lng?: number | null
          custom_base_fee?: number | null
          custom_fee_percentage?: number | null
          denomination?: string | null
          department?: string | null
          did_address?: string | null
          dismissed_bubbles?: Json | null
          driver_application_data?: Json | null
          driver_application_status?: string | null
          driver_mode_active?: boolean | null
          driver_rating?: number | null
          email: string
          enable_typing_indicators?: boolean | null
          first_name?: string | null
          gender?: string | null
          handle?: string | null
          id: string
          is_primary?: boolean | null
          is_public?: boolean | null
          is_verified?: boolean | null
          is_verified_resident?: boolean
          jurisdiction?: string | null
          last_active_at?: string | null
          last_free_ad_at?: string | null
          last_name?: string | null
          last_stream_url?: string | null
          live_stream_url?: string | null
          location?: string | null
          name: string
          occupation?: string | null
          official_email?: string | null
          on_faith_wall?: boolean | null
          owner_id?: string | null
          partner_id?: string | null
          phone?: string | null
          position?: string | null
          return_policy?: string | null
          role?: string | null
          service_times?: Json | null
          show_followers?: boolean | null
          show_following?: boolean | null
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          sso_linked?: boolean | null
          state?: string | null
          status?: string | null
          store_type?: string | null
          suspended_until?: string | null
          tithe_url?: string | null
          tos_accepted_at?: string | null
          updated_at?: string | null
          vehicle_info?: string | null
          verification_requested?: boolean | null
          website?: string | null
          xrpl_destination_tag?: number | null
          zip?: string | null
        }
        Update: {
          ad_credits?: number | null
          allow_dms?: boolean | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          birth_day?: number | null
          birth_month?: number | null
          birth_year?: number | null
          blur_nsfw?: boolean | null
          business_category?: string | null
          community?: string | null
          company?: string | null
          country?: string | null
          county?: string | null
          cover_url?: string | null
          created_at?: string | null
          credentials?: string | null
          current_lat?: number | null
          current_lng?: number | null
          custom_base_fee?: number | null
          custom_fee_percentage?: number | null
          denomination?: string | null
          department?: string | null
          did_address?: string | null
          dismissed_bubbles?: Json | null
          driver_application_data?: Json | null
          driver_application_status?: string | null
          driver_mode_active?: boolean | null
          driver_rating?: number | null
          email?: string
          enable_typing_indicators?: boolean | null
          first_name?: string | null
          gender?: string | null
          handle?: string | null
          id?: string
          is_primary?: boolean | null
          is_public?: boolean | null
          is_verified?: boolean | null
          is_verified_resident?: boolean
          jurisdiction?: string | null
          last_active_at?: string | null
          last_free_ad_at?: string | null
          last_name?: string | null
          last_stream_url?: string | null
          live_stream_url?: string | null
          location?: string | null
          name?: string
          occupation?: string | null
          official_email?: string | null
          on_faith_wall?: boolean | null
          owner_id?: string | null
          partner_id?: string | null
          phone?: string | null
          position?: string | null
          return_policy?: string | null
          role?: string | null
          service_times?: Json | null
          show_followers?: boolean | null
          show_following?: boolean | null
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          sso_linked?: boolean | null
          state?: string | null
          status?: string | null
          store_type?: string | null
          suspended_until?: string | null
          tithe_url?: string | null
          tos_accepted_at?: string | null
          updated_at?: string | null
          vehicle_info?: string | null
          verification_requested?: boolean | null
          website?: string | null
          xrpl_destination_tag?: number | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      setx_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          method: string | null
          reference_id: string | null
          status: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          method?: string | null
          reference_id?: string | null
          status?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          method?: string | null
          reference_id?: string | null
          status?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "setx_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_city_telemetry_logs: {
        Row: {
          device_id: string
          flare_proof_hash: string
          id: string
          metric_value: number
          verified_at: string
        }
        Insert: {
          device_id: string
          flare_proof_hash: string
          id?: string
          metric_value: number
          verified_at?: string
        }
        Update: {
          device_id?: string
          flare_proof_hash?: string
          id?: string
          metric_value?: number
          verified_at?: string
        }
        Relationships: []
      }
      sovereign_content: {
        Row: {
          content_cid: string
          content_type: Database["public"]["Enums"]["sovereign_content_type"]
          created_at: string
          id: string
          is_encrypted: boolean
          user_did: string
          xrpl_tx_hash: string | null
        }
        Insert: {
          content_cid: string
          content_type: Database["public"]["Enums"]["sovereign_content_type"]
          created_at?: string
          id?: string
          is_encrypted?: boolean
          user_did: string
          xrpl_tx_hash?: string | null
        }
        Update: {
          content_cid?: string
          content_type?: Database["public"]["Enums"]["sovereign_content_type"]
          created_at?: string
          id?: string
          is_encrypted?: boolean
          user_did?: string
          xrpl_tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sovereign_content_user_did_fkey"
            columns: ["user_did"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["did_address"]
          },
        ]
      }
      staff_clearance: {
        Row: {
          clearance_level: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          profile_id: string | null
        }
        Insert: {
          clearance_level?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          profile_id?: string | null
        }
        Update: {
          clearance_level?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_clearance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stan_alerts: {
        Row: {
          affected_counties: string[] | null
          alert_scope: string | null
          alert_type: string | null
          content: string | null
          created_at: string | null
          guid: string
          id: string
          post_id: string | null
          posted_at: string | null
          severity: string | null
          source: string | null
          source_url: string | null
          title: string | null
        }
        Insert: {
          affected_counties?: string[] | null
          alert_scope?: string | null
          alert_type?: string | null
          content?: string | null
          created_at?: string | null
          guid: string
          id?: string
          post_id?: string | null
          posted_at?: string | null
          severity?: string | null
          source?: string | null
          source_url?: string | null
          title?: string | null
        }
        Update: {
          affected_counties?: string[] | null
          alert_scope?: string | null
          alert_type?: string | null
          content?: string | null
          created_at?: string | null
          guid?: string
          id?: string
          post_id?: string | null
          posted_at?: string | null
          severity?: string | null
          source?: string | null
          source_url?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stan_alerts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "detailed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stan_alerts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stan_alerts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_content"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          background_url: string | null
          balance: number | null
          banner_url: string | null
          bio: string | null
          business_hours: Json | null
          category: string | null
          city: string | null
          commission_rate_override: number | null
          county: string | null
          created_at: string | null
          csm_tenant_id: string | null
          custom_theme: Json | null
          description: string | null
          fulfillment_rate: number | null
          id: string
          image_url: string | null
          integration_config: Json | null
          integration_type: string | null
          is_refunds_enabled: boolean | null
          is_vacation_mode: boolean | null
          is_verified: boolean | null
          last_sync_at: string | null
          lat: number | null
          lng: number | null
          location: string | null
          logo_url: string | null
          name: string
          owner_id: string | null
          refund_window_days: number | null
          response_time_hours: number | null
          return_policy: string | null
          shopify_access_token: string | null
          shopify_store_url: string | null
          show_address: boolean | null
          source: string | null
          status: string | null
          stripe_account_id: string | null
          subcategory: string | null
          subscription_tier: string | null
          total_sales: number | null
          trust_score: number | null
          type: string | null
          website_url: string | null
          woo_consumer_key: string | null
          woo_consumer_secret: string | null
          woo_url: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          background_url?: string | null
          balance?: number | null
          banner_url?: string | null
          bio?: string | null
          business_hours?: Json | null
          category?: string | null
          city?: string | null
          commission_rate_override?: number | null
          county?: string | null
          created_at?: string | null
          csm_tenant_id?: string | null
          custom_theme?: Json | null
          description?: string | null
          fulfillment_rate?: number | null
          id?: string
          image_url?: string | null
          integration_config?: Json | null
          integration_type?: string | null
          is_refunds_enabled?: boolean | null
          is_vacation_mode?: boolean | null
          is_verified?: boolean | null
          last_sync_at?: string | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          refund_window_days?: number | null
          response_time_hours?: number | null
          return_policy?: string | null
          shopify_access_token?: string | null
          shopify_store_url?: string | null
          show_address?: boolean | null
          source?: string | null
          status?: string | null
          stripe_account_id?: string | null
          subcategory?: string | null
          subscription_tier?: string | null
          total_sales?: number | null
          trust_score?: number | null
          type?: string | null
          website_url?: string | null
          woo_consumer_key?: string | null
          woo_consumer_secret?: string | null
          woo_url?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          background_url?: string | null
          balance?: number | null
          banner_url?: string | null
          bio?: string | null
          business_hours?: Json | null
          category?: string | null
          city?: string | null
          commission_rate_override?: number | null
          county?: string | null
          created_at?: string | null
          csm_tenant_id?: string | null
          custom_theme?: Json | null
          description?: string | null
          fulfillment_rate?: number | null
          id?: string
          image_url?: string | null
          integration_config?: Json | null
          integration_type?: string | null
          is_refunds_enabled?: boolean | null
          is_vacation_mode?: boolean | null
          is_verified?: boolean | null
          last_sync_at?: string | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          refund_window_days?: number | null
          response_time_hours?: number | null
          return_policy?: string | null
          shopify_access_token?: string | null
          shopify_store_url?: string | null
          show_address?: boolean | null
          source?: string | null
          status?: string | null
          stripe_account_id?: string | null
          subcategory?: string | null
          subscription_tier?: string | null
          total_sales?: number | null
          trust_score?: number | null
          type?: string | null
          website_url?: string | null
          woo_consumer_key?: string | null
          woo_consumer_secret?: string | null
          woo_url?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_csm_tenant_id_fkey"
            columns: ["csm_tenant_id"]
            isOneToOne: false
            referencedRelation: "partner_csm_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          platform: string | null
          products_synced: number | null
          status: string | null
          store_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          platform?: string | null
          products_synced?: number | null
          status?: string | null
          store_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          platform?: string | null
          products_synced?: number | null
          status?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      system_errors: {
        Row: {
          created_at: string | null
          error_type: string
          id: string
          is_healed: boolean | null
          message: string
          metadata: Json | null
          repair_summary: string | null
          stack_trace: string | null
        }
        Insert: {
          created_at?: string | null
          error_type: string
          id?: string
          is_healed?: boolean | null
          message: string
          metadata?: Json | null
          repair_summary?: string | null
          stack_trace?: string | null
        }
        Update: {
          created_at?: string | null
          error_type?: string
          id?: string
          is_healed?: boolean | null
          message?: string
          metadata?: Json | null
          repair_summary?: string | null
          stack_trace?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          business_name: string
          created_at: string
          id: string
          is_active: boolean
          owner_id: string
          slug: string
          stripe_connect_id: string | null
        }
        Insert: {
          business_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id: string
          slug: string
          stripe_connect_id?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id?: string
          slug?: string
          stripe_connect_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treasury_yield_allocations: {
        Row: {
          allocated_amount: number
          asset_type: string
          created_at: string
          daily_yield_generated: number
          estimated_apy: number
          id: string
          status: string
        }
        Insert: {
          allocated_amount: number
          asset_type?: string
          created_at?: string
          daily_yield_generated: number
          estimated_apy: number
          id?: string
          status?: string
        }
        Update: {
          allocated_amount?: number
          asset_type?: string
          created_at?: string
          daily_yield_generated?: number
          estimated_apy?: number
          id?: string
          status?: string
        }
        Relationships: []
      }
      trending_topics: {
        Row: {
          community: string
          county: string | null
          last_updated: string | null
          post_count: number | null
          score: number | null
          state: string | null
          topic: string
        }
        Insert: {
          community: string
          county?: string | null
          last_updated?: string | null
          post_count?: number | null
          score?: number | null
          state?: string | null
          topic: string
        }
        Update: {
          community?: string
          county?: string | null
          last_updated?: string | null
          post_count?: number | null
          score?: number | null
          state?: string | null
          topic?: string
        }
        Relationships: []
      }
      user_strikes: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          post_id: string | null
          reason: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          reason: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_strikes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_strikes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "detailed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_strikes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_strikes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_strikes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_vibe_scores: {
        Row: {
          category: string
          last_updated: string | null
          profile_id: string
          score: number | null
        }
        Insert: {
          category: string
          last_updated?: string | null
          profile_id: string
          score?: number | null
        }
        Update: {
          category?: string
          last_updated?: string | null
          profile_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_vibe_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          profile_id: string | null
          role_requested: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          profile_id?: string | null
          role_requested: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          profile_id?: string | null
          role_requested?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_balances: {
        Row: {
          balance_setx: number
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          balance_setx?: number
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          balance_setx?: number
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_balances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_dlq: {
        Row: {
          attempt_count: number
          created_at: string
          id: string
          last_error: string | null
          max_attempts: number
          next_retry_at: string | null
          order_id: string | null
          payload: Json
          resolution_note: string | null
          resolved_at: string | null
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_retry_at?: string | null
          order_id?: string | null
          payload: Json
          resolution_note?: string | null
          resolved_at?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_retry_at?: string | null
          order_id?: string | null
          payload?: Json
          resolution_note?: string | null
          resolved_at?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_dlq_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_dlq_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "partner_csm_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whisper_insights: {
        Row: {
          action_label: string | null
          action_url: string | null
          body: string
          created_at: string
          id: string
          insight_type: string | null
          is_read: boolean
          read_at: string | null
          severity: string
          tenant_id: string | null
          title: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          body: string
          created_at?: string
          id?: string
          insight_type?: string | null
          is_read?: boolean
          read_at?: string | null
          severity?: string
          tenant_id?: string | null
          title: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          body?: string
          created_at?: string
          id?: string
          insight_type?: string | null
          is_read?: boolean
          read_at?: string | null
          severity?: string
          tenant_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "whisper_insights_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "partner_csm_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string | null
          id: string
          payment_details: Json | null
          payment_method: string | null
          status: string | null
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string | null
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          status?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          status?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      zip_to_city_location_mapping: {
        Row: {
          city_name: string
          county_name: string
          created_at: string | null
          id: number
          is_primary: boolean | null
          state: string | null
          state_abbr: string | null
          zip_code: string
        }
        Insert: {
          city_name: string
          county_name: string
          created_at?: string | null
          id?: number
          is_primary?: boolean | null
          state?: string | null
          state_abbr?: string | null
          zip_code: string
        }
        Update: {
          city_name?: string
          county_name?: string
          created_at?: string | null
          id?: number
          is_primary?: boolean | null
          state?: string | null
          state_abbr?: string | null
          zip_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      detailed_posts: {
        Row: {
          author_avatar: string | null
          author_community: string | null
          author_country: string | null
          author_county: string | null
          author_is_public: boolean | null
          author_name: string | null
          author_role: string | null
          author_state: string | null
          category: string | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          downvote_count: number | null
          group_id: string | null
          hot_score: number | null
          id: string | null
          lat: number | null
          likes_count: number | null
          lng: number | null
          location: string | null
          media_urls: string[] | null
          original_post_id: string | null
          poll_data: Json | null
          profile_id: string | null
          repost_count: number | null
          reposts_count: number | null
          type: string | null
          upvote_count: number | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "detailed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      duna_filing_readiness: {
        Row: {
          is_legally_ready_to_file: boolean | null
          total_foundational_members: number | null
        }
        Relationships: []
      }
      trending_content: {
        Row: {
          author_avatar: string | null
          author_name: string | null
          category: string | null
          community: string | null
          content: string | null
          country: string | null
          county: string | null
          created_at: string | null
          hot_score: number | null
          id: string | null
          location: string | null
          profile_id: string | null
          state: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auto_approve_stale_ads: { Args: never; Returns: undefined }
      cast_poll_vote: {
        Args: { p_option_index: number; p_post_id: string }
        Returns: Json
      }
      categorize_post_ai: {
        Args: { metadata: Json; new_type: string; post_id_val: string }
        Returns: undefined
      }
      create_multivendor_order: {
        Args: {
          p_customer_id: string
          p_platform_fee_bps?: number
          p_total_amount: number
          p_vendor_items: Json
        }
        Returns: string
      }
      decay_hot_scores: { Args: never; Returns: undefined }
      decrement_bridge_item_stock: {
        Args: { p_bridge_item_id: string; p_quantity?: number }
        Returns: Json
      }
      detect_activity_anomalies: { Args: never; Returns: undefined }
      execute_ai_sql: { Args: { sql_query: string }; Returns: undefined }
      get_active_businesses: {
        Args: { limit_count?: number; search_category?: string }
        Returns: {
          address: string
          category: string
          city: string
          description: string
          id: string
          name: string
          subcategory: string
          zip: string
        }[]
      }
      get_active_orders: {
        Args: { user_id: string }
        Returns: {
          amount: number | null
          created_at: string | null
          curb_pickup_details: string | null
          currency: string | null
          customer_id: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          delivery_status: string | null
          driver_id: string | null
          fan_out_status: string | null
          fulfillment_type: string | null
          id: string
          items: Json | null
          ledger_transaction_group_id: string | null
          payment_method: string | null
          pickup_window_end: string | null
          pickup_window_start: string | null
          platform_fee_amount: number | null
          platform_fee_bps: number | null
          shipping_address: string | null
          shipping_carrier: string | null
          shipping_label_url: string | null
          status: string | null
          store_id: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string | null
          vendor_line_items: Json | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_available_booking_slots: {
        Args: { p_bridge_item_id: string; p_date: string; p_timezone?: string }
        Returns: {
          is_available: boolean
          slot_end: string
          slot_start: string
        }[]
      }
      get_csm_api_key: { Args: { p_tenant_slug: string }; Returns: string }
      get_dlq_summary: {
        Args: never
        Returns: {
          abandoned_count: number
          pending_count: number
          resolved_count: number
        }[]
      }
      get_plan_features: {
        Args: { p_plan: string }
        Returns: {
          ad_credits_monthly: number
          max_bridge_items: number
          max_monthly_orders: number
          max_pos_terminals: number
        }[]
      }
      get_trending_community_pulse: {
        Args: { limit_count?: number }
        Returns: {
          comments_count: number
          content: string
          created_at: string
          engagement_score: number
          id: string
          type: string
          upvotes: number
          views: number
        }[]
      }
      global_search:
        | { Args: { search_query: string }; Returns: Json }
        | {
            Args: {
              p_scope_type?: string
              p_scope_value?: string
              search_query: string
            }
            Returns: Json
          }
      increment_post_comments: {
        Args: { post_id_val: string }
        Returns: undefined
      }
      increment_post_views: {
        Args: { post_id_val: string }
        Returns: undefined
      }
      is_blocked: { Args: { user_a: string; user_b: string }; Returns: boolean }
      is_group_admin: { Args: { gid: string }; Returns: boolean }
      log_social_interaction: {
        Args: { actor_id: string; boost_amount?: number; target_id: string }
        Returns: undefined
      }
      log_system_error: {
        Args: { err_type: string; meta: Json; msg: string }
        Returns: string
      }
      mark_all_notifications_as_read: {
        Args: { user_id_val: string }
        Returns: undefined
      }
      nudge_vendors_with_hot_market: { Args: never; Returns: undefined }
      provision_csm_api_key: {
        Args: { p_api_key: string; p_tenant_slug: string }
        Returns: string
      }
      provision_csm_key: {
        Args: {
          p_key_name: string
          p_secret_value: string
          p_tenant_id: string
        }
        Returns: string
      }
      recommend_new_groups: { Args: never; Returns: undefined }
      reengage_quiet_users: { Args: never; Returns: undefined }
      refresh_trending_topics: { Args: never; Returns: undefined }
      rotate_csm_api_key: {
        Args: { p_new_api_key: string; p_tenant_slug: string }
        Returns: string
      }
      search_civic_directory: {
        Args: { limit_count?: number; search_query: string }
        Returns: {
          city: string
          county: string
          is_active: boolean
          jurisdiction: string
          name: string
          tenure_end: string
          tenure_start: string
          title: string
        }[]
      }
      search_civic_services: {
        Args: { limit_count?: number; search_query: string }
        Returns: {
          address: string
          category: string
          city: string
          department: string
          phone: string
        }[]
      }
      search_platform_content: {
        Args: { limit_count?: number; search_query: string }
        Returns: {
          content: string
          created_at: string
          id: string
          location: string
          title: string
          type: string
        }[]
      }
      search_platform_content_vector: {
        Args: {
          limit_count?: number
          query_embedding: string
          search_query: string
        }
        Returns: {
          content: string
          created_at: string
          id: string
          location: string
          similarity: number
          title: string
          type: string
        }[]
      }
      search_platform_content_vector_fallback: {
        Args: {
          limit_count?: number
          query_embedding?: string
          search_query: string
        }
        Returns: {
          content: string
          created_at: string
          id: string
          location: string
          similarity: number
          title: string
          type: string
        }[]
      }
      transfer_funds: {
        Args: {
          receiver_wallet_id: string
          reference?: string
          sender_wallet_id: string
          transfer_amount: number
          transfer_description: string
          transfer_type: string
        }
        Returns: Json
      }
    }
    Enums: {
      sovereign_content_type: "social_post" | "product_listing"
      visibility_scope: "city" | "county" | "state" | "national"
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
      sovereign_content_type: ["social_post", "product_listing"],
      visibility_scope: ["city", "county", "state", "national"],
    },
  },
} as const
