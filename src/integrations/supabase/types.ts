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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affiliate_click_events: {
        Row: {
          affiliate_link_id: string | null
          campaign: string | null
          click_identifier: string
          id: string
          internal_product_id: string | null
          redirected_at: string
          source: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_link_id?: string | null
          campaign?: string | null
          click_identifier: string
          id?: string
          internal_product_id?: string | null
          redirected_at?: string
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_link_id?: string | null
          campaign?: string | null
          click_identifier?: string
          id?: string
          internal_product_id?: string | null
          redirected_at?: string
          source?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_click_events_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          amount: number | null
          conversion_id: string | null
          currency: string | null
          id: string
          recorded_at: string
          source: string
          status: string
        }
        Insert: {
          amount?: number | null
          conversion_id?: string | null
          currency?: string | null
          id?: string
          recorded_at?: string
          source: string
          status: string
        }
        Update: {
          amount?: number | null
          conversion_id?: string | null
          currency?: string | null
          id?: string
          recorded_at?: string
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_conversion_id_fkey"
            columns: ["conversion_id"]
            isOneToOne: false
            referencedRelation: "affiliate_conversions"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          click_identifier: string | null
          conversion_value: number | null
          currency: string | null
          external_conversion_id: string | null
          id: string
          recorded_at: string
          source: string
          status: string
        }
        Insert: {
          click_identifier?: string | null
          conversion_value?: number | null
          currency?: string | null
          external_conversion_id?: string | null
          id?: string
          recorded_at?: string
          source: string
          status?: string
        }
        Update: {
          click_identifier?: string | null
          conversion_value?: number | null
          currency?: string | null
          external_conversion_id?: string | null
          id?: string
          recorded_at?: string
          source?: string
          status?: string
        }
        Relationships: []
      }
      affiliate_links: {
        Row: {
          affiliate_product_id: string
          campaign: string | null
          click_identifier: string
          created_at: string
          destination_url: string
          id: string
        }
        Insert: {
          affiliate_product_id: string
          campaign?: string | null
          click_identifier: string
          created_at?: string
          destination_url: string
          id?: string
        }
        Update: {
          affiliate_product_id?: string
          campaign?: string | null
          click_identifier?: string
          created_at?: string
          destination_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_affiliate_product_id_fkey"
            columns: ["affiliate_product_id"]
            isOneToOne: false
            referencedRelation: "affiliate_products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_merchants: {
        Row: {
          created_at: string
          id: string
          name: string
          program_id: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          program_id?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          program_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_merchants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_products: {
        Row: {
          affiliate_url: string
          created_at: string
          external_offer_id: string | null
          id: string
          internal_product_id: string | null
          last_synced_at: string | null
          merchant_id: string
        }
        Insert: {
          affiliate_url: string
          created_at?: string
          external_offer_id?: string | null
          id?: string
          internal_product_id?: string | null
          last_synced_at?: string | null
          merchant_id: string
        }
        Update: {
          affiliate_url?: string
          created_at?: string
          external_offer_id?: string | null
          id?: string
          internal_product_id?: string | null
          last_synced_at?: string | null
          merchant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "affiliate_merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_programs: {
        Row: {
          created_at: string
          id: string
          name: string
          network_name: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          network_name?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          network_name?: string | null
          status?: string
        }
        Relationships: []
      }
      agent_action_proposals: {
        Row: {
          action_type: string
          agent_name: string
          approval_id: string | null
          confidence: string | null
          created_at: string
          decided_at: string | null
          evidence: Json
          id: string
          proposed_value: Json
          rejection_reason: string | null
          reviewed_by: string | null
          status: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          agent_name: string
          approval_id?: string | null
          confidence?: string | null
          created_at?: string
          decided_at?: string | null
          evidence?: Json
          id?: string
          proposed_value: Json
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          agent_name?: string
          approval_id?: string | null
          confidence?: string | null
          created_at?: string
          decided_at?: string | null
          evidence?: Json
          id?: string
          proposed_value?: Json
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_action_proposals_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          action_type: string
          approved_by: string | null
          created_at: string
          decided_at: string | null
          id: string
          previous_value: Json | null
          proposed_value: Json
          reason: string | null
          requested_by: string
          status: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action_type: string
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          previous_value?: Json | null
          proposed_value: Json
          reason?: string | null
          requested_by: string
          status?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action_type?: string
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          previous_value?: Json | null
          proposed_value?: Json
          reason?: string | null
          requested_by?: string
          status?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          correlation_id: string | null
          created_at: string
          id: string
          new_value: Json | null
          previous_value: Json | null
          reason: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          correlation_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          correlation_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      external_product_snapshots: {
        Row: {
          availability_status: Database["public"]["Enums"]["availability_status_type"]
          created_at: string
          currency: string | null
          error_details: string | null
          external_price: number | null
          freshness_status: Database["public"]["Enums"]["sync_status_type"]
          id: string
          last_synced_at: string | null
          product_id: string
          provider_name: string
          provider_product_id: string | null
          source_type: Database["public"]["Enums"]["business_model_type"]
          source_url: string | null
          sync_result: string | null
          updated_at: string
        }
        Insert: {
          availability_status?: Database["public"]["Enums"]["availability_status_type"]
          created_at?: string
          currency?: string | null
          error_details?: string | null
          external_price?: number | null
          freshness_status?: Database["public"]["Enums"]["sync_status_type"]
          id?: string
          last_synced_at?: string | null
          product_id: string
          provider_name: string
          provider_product_id?: string | null
          source_type: Database["public"]["Enums"]["business_model_type"]
          source_url?: string | null
          sync_result?: string | null
          updated_at?: string
        }
        Update: {
          availability_status?: Database["public"]["Enums"]["availability_status_type"]
          created_at?: string
          currency?: string | null
          error_details?: string | null
          external_price?: number | null
          freshness_status?: Database["public"]["Enums"]["sync_status_type"]
          id?: string
          last_synced_at?: string | null
          product_id?: string
          provider_name?: string
          provider_product_id?: string | null
          source_type?: Database["public"]["Enums"]["business_model_type"]
          source_url?: string | null
          sync_result?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hero_banner_configs: {
        Row: {
          badge_text: string | null
          body_color: string
          created_at: string
          cta_link: string
          cta_text_ar: string
          cta_text_en: string | null
          headline_ar: string
          headline_color: string
          headline_en: string | null
          height_preset: string
          has_animation: boolean
          id: string
          image_url: string
          is_active: boolean
          overlay_color: string
          overlay_opacity: number
          placement: string
          product_overlay_url: string | null
          secondary_cta_link: string | null
          secondary_cta_text_ar: string | null
          sort_order: number
          subheadline_ar: string | null
          subheadline_en: string | null
          text_align: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          badge_text?: string | null
          body_color?: string
          created_at?: string
          cta_link: string
          cta_text_ar: string
          cta_text_en?: string | null
          headline_ar: string
          headline_color?: string
          headline_en?: string | null
          height_preset?: string
          has_animation?: boolean
          id?: string
          image_url: string
          is_active?: boolean
          overlay_color?: string
          overlay_opacity: number
          placement?: string
          product_overlay_url?: string | null
          secondary_cta_link?: string | null
          secondary_cta_text_ar?: string | null
          sort_order?: number
          subheadline_ar?: string | null
          subheadline_en?: string | null
          text_align?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          badge_text?: string | null
          body_color?: string
          created_at?: string
          cta_link?: string
          cta_text_ar?: string
          cta_text_en?: string | null
          headline_ar?: string
          headline_color?: string
          headline_en?: string | null
          height_preset?: string
          has_animation?: boolean
          id?: string
          image_url?: string
          is_active?: boolean
          overlay_color?: string
          overlay_opacity?: number
          placement?: string
          product_overlay_url?: string | null
          secondary_cta_link?: string | null
          secondary_cta_text_ar?: string | null
          sort_order?: number
          subheadline_ar?: string | null
          subheadline_en?: string | null
          text_align?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      integration_events: {
        Row: {
          correlation_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json
          provider: string
          status: string
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          provider: string
          status: string
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          provider?: string
          status?: string
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          consented_at: string
          created_at: string
          email: string
          id: string
          source: string
          unsubscribed_at: string | null
        }
        Insert: {
          consented_at?: string
          created_at?: string
          email: string
          id?: string
          source?: string
          unsubscribed_at?: string | null
        }
        Update: {
          consented_at?: string
          created_at?: string
          email?: string
          id?: string
          source?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          internal_product_id: string
          order_id: string
          quantity: number
          supplier_product_id: string | null
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          id?: string
          internal_product_id: string
          order_id: string
          quantity: number
          supplier_product_id?: string | null
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          id?: string
          internal_product_id?: string
          order_id?: string
          quantity?: number
          supplier_product_id?: string | null
          unit_price?: number
          variant_id?: string | null
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
            foreignKeyName: "order_items_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          business_model: Database["public"]["Enums"]["business_model_type"]
          created_at: string
          currency: string | null
          fulfillment_status: string
          id: string
          internal_order_number: string
          payment_status: string
          supplier_id: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          business_model?: Database["public"]["Enums"]["business_model_type"]
          created_at?: string
          currency?: string | null
          fulfillment_status?: string
          id?: string
          internal_order_number: string
          payment_status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          business_model?: Database["public"]["Enums"]["business_model_type"]
          created_at?: string
          currency?: string | null
          fulfillment_status?: string
          id?: string
          internal_order_number?: string
          payment_status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          external_transaction_id: string | null
          id: string
          idempotency_key: string
          order_id: string
          provider: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          external_transaction_id?: string | null
          id?: string
          idempotency_key: string
          order_id: string
          provider: string
          status: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          external_transaction_id?: string | null
          id?: string
          idempotency_key?: string
          order_id?: string
          provider?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          external_event_id: string | null
          id: string
          payload: Json
          processed: boolean
          provider: string
          received_at: string
          signature_valid: boolean | null
        }
        Insert: {
          external_event_id?: string | null
          id?: string
          payload: Json
          processed?: boolean
          provider: string
          received_at?: string
          signature_valid?: boolean | null
        }
        Update: {
          external_event_id?: string | null
          id?: string
          payload?: Json
          processed?: boolean
          provider?: string
          received_at?: string
          signature_valid?: boolean | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: Database["public"]["Enums"]["governance_role_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: Database["public"]["Enums"]["governance_role_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: Database["public"]["Enums"]["governance_role_type"]
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          service_type: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          service_type: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          service_type?: string
          status?: string
        }
        Relationships: []
      }
      shipment_tracking: {
        Row: {
          carrier: string | null
          created_at: string
          id: string
          last_updated_at: string | null
          payload: Json
          status: string | null
          supplier_order_id: string
          tracking_number: string | null
          tracking_url: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          id?: string
          last_updated_at?: string | null
          payload?: Json
          status?: string | null
          supplier_order_id: string
          tracking_number?: string | null
          tracking_url?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string
          id?: string
          last_updated_at?: string | null
          payload?: Json
          status?: string | null
          supplier_order_id?: string
          tracking_number?: string | null
          tracking_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_tracking_supplier_order_id_fkey"
            columns: ["supplier_order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          ad_copy: Json
          affiliate_url: string | null
          business_model: Database["public"]["Enums"]["business_model_type"]
          category: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          metadata: Json
          price: number | null
          status: string
          supplier_cost: number | null
          supplier_sku: string | null
          affiliate_network: string | null
          supplier_source: string | null
          tags: Json
          title: string
          title_ar: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          ad_copy?: Json
          affiliate_url?: string | null
          business_model: Database["public"]["Enums"]["business_model_type"]
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json
          price?: number | null
          status?: string
          supplier_cost?: number | null
          supplier_sku?: string | null
          affiliate_network?: string | null
          supplier_source?: string | null
          tags?: Json
          title: string
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          ad_copy?: Json
          affiliate_url?: string | null
          business_model?: Database["public"]["Enums"]["business_model_type"]
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json
          price?: number | null
          status?: string
          supplier_cost?: number | null
          supplier_sku?: string | null
          affiliate_network?: string | null
          supplier_source?: string | null
          tags?: Json
          title?: string
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      supplier_order_events: {
        Row: {
          external_status: string | null
          id: string
          payload: Json
          recorded_at: string
          status: string
          supplier_order_id: string
        }
        Insert: {
          external_status?: string | null
          id?: string
          payload?: Json
          recorded_at?: string
          status: string
          supplier_order_id: string
        }
        Update: {
          external_status?: string | null
          id?: string
          payload?: Json
          recorded_at?: string
          status?: string
          supplier_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_order_events_supplier_order_id_fkey"
            columns: ["supplier_order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_orders: {
        Row: {
          accepted_at: string | null
          created_at: string
          error_details: string | null
          external_order_id: string | null
          id: string
          idempotency_key: string
          internal_order_id: string
          payload: Json
          status: string
          submitted_at: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          error_details?: string | null
          external_order_id?: string | null
          id?: string
          idempotency_key: string
          internal_order_id: string
          payload?: Json
          status?: string
          submitted_at?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          error_details?: string | null
          external_order_id?: string | null
          id?: string
          idempotency_key?: string
          internal_order_id?: string
          payload?: Json
          status?: string
          submitted_at?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          availability_status: Database["public"]["Enums"]["availability_status_type"]
          created_at: string
          currency: string | null
          external_price: number | null
          external_product_id: string
          external_variant_id: string | null
          id: string
          internal_product_id: string | null
          last_synced_at: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          availability_status?: Database["public"]["Enums"]["availability_status_type"]
          created_at?: string
          currency?: string | null
          external_price?: number | null
          external_product_id: string
          external_variant_id?: string | null
          id?: string
          internal_product_id?: string | null
          last_synced_at?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          availability_status?: Database["public"]["Enums"]["availability_status_type"]
          created_at?: string
          currency?: string | null
          external_price?: number | null
          external_product_id?: string
          external_variant_id?: string | null
          id?: string
          internal_product_id?: string | null
          last_synced_at?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          connector_type: string
          created_at: string
          id: string
          name: string
          status: string
        }
        Insert: {
          connector_type: string
          created_at?: string
          id?: string
          name: string
          status?: string
        }
        Update: {
          connector_type?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      sync_jobs: {
        Row: {
          completed_at: string | null
          correlation_id: string
          created_at: string
          error_details: string | null
          id: string
          job_type: string
          started_at: string | null
          status: Database["public"]["Enums"]["sync_status_type"]
        }
        Insert: {
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          error_details?: string | null
          id?: string
          job_type: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["sync_status_type"]
        }
        Update: {
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          error_details?: string | null
          id?: string
          job_type?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["sync_status_type"]
        }
        Relationships: []
      }
      transactional_outbox: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          available_at: string
          created_at: string
          error_details: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          retry_count: number
          status: Database["public"]["Enums"]["sync_status_type"]
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          available_at?: string
          created_at?: string
          error_details?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          status?: Database["public"]["Enums"]["sync_status_type"]
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          available_at?: string
          created_at?: string
          error_details?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          status?: Database["public"]["Enums"]["sync_status_type"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      availability_status_type:
        | "AVAILABLE"
        | "UNAVAILABLE"
        | "OUT_OF_STOCK"
        | "UNKNOWN"
        | "STALE"
      business_model_type: "DROPSHIPPING" | "AFFILIATE"
      governance_role_type:
        | "OWNER"
        | "STORE_MANAGER"
        | "MARKETING_SPECIALIST"
        | "ANALYST"
        | "AI_AGENT"
      sync_status_type: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "STALE"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      availability_status_type: [
        "AVAILABLE",
        "UNAVAILABLE",
        "OUT_OF_STOCK",
        "UNKNOWN",
        "STALE",
      ],
      business_model_type: ["DROPSHIPPING", "AFFILIATE"],
      governance_role_type: [
        "OWNER",
        "STORE_MANAGER",
        "MARKETING_SPECIALIST",
        "ANALYST",
        "AI_AGENT",
      ],
      sync_status_type: ["PENDING", "RUNNING", "SUCCEEDED", "FAILED", "STALE"],
    },
  },
} as const
