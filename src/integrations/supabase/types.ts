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
      affiliate_commissions: {
        Row: { amount: number | null; conversion_id: string | null; currency: string | null; id: string; recorded_at: string; source: string; status: string }
        Insert: { amount?: number | null; conversion_id?: string | null; currency?: string | null; id?: string; recorded_at?: string; source: string; status: string }
        Update: { amount?: number | null; conversion_id?: string | null; currency?: string | null; id?: string; recorded_at?: string; source?: string; status?: string }
        Relationships: []
      }
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
        Relationships: []
      }
      external_product_snapshots: {
        Row: { availability_status: string; created_at: string; currency: string | null; error_details: string | null; external_price: number | null; freshness_status: string; id: string; last_synced_at: string | null; product_id: string; provider_name: string; provider_product_id: string | null; source_type: string; source_url: string | null; sync_result: string | null; updated_at: string }
        Insert: { availability_status?: string; created_at?: string; currency?: string | null; error_details?: string | null; external_price?: number | null; freshness_status?: string; id?: string; last_synced_at?: string | null; product_id: string; provider_name: string; provider_product_id?: string | null; source_type: string; source_url?: string | null; sync_result?: string | null; updated_at?: string }
        Update: { availability_status?: string; created_at?: string; currency?: string | null; error_details?: string | null; external_price?: number | null; freshness_status?: string; id?: string; last_synced_at?: string | null; product_id?: string; provider_name?: string; provider_product_id?: string | null; source_type?: string; source_url?: string | null; sync_result?: string | null; updated_at?: string }
        Relationships: []
      }
      orders: {
        Row: { business_model: string; created_at: string; currency: string | null; fulfillment_status: string; id: string; internal_order_number: string; payment_status: string; supplier_id: string | null; total_amount: number | null; updated_at: string }
        Insert: { business_model?: string; created_at?: string; currency?: string | null; fulfillment_status?: string; id?: string; internal_order_number: string; payment_status?: string; supplier_id?: string | null; total_amount?: number | null; updated_at?: string }
        Update: { business_model?: string; created_at?: string; currency?: string | null; fulfillment_status?: string; id?: string; internal_order_number?: string; payment_status?: string; supplier_id?: string | null; total_amount?: number | null; updated_at?: string }
        Relationships: []
      }
      sync_jobs: {
        Row: { completed_at: string | null; correlation_id: string; created_at: string; error_details: string | null; id: string; job_type: string; started_at: string | null; status: string }
        Insert: { completed_at?: string | null; correlation_id?: string; created_at?: string; error_details?: string | null; id?: string; job_type: string; started_at?: string | null; status?: string }
        Update: { completed_at?: string | null; correlation_id?: string; created_at?: string; error_details?: string | null; id?: string; job_type?: string; started_at?: string | null; status?: string }
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
