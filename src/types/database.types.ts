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
      about_content: {
        Row: {
          content: string | null
          id: string
          image_url: string | null
          order_index: number | null
          section_key: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          id?: string
          image_url?: string | null
          order_index?: number | null
          section_key: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          id?: string
          image_url?: string | null
          order_index?: number | null
          section_key?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          password_hash: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          password_hash: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          password_hash?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      booked_slots_public: {
        Row: {
          day: string
          id: string
          ts: unknown
        }
        Insert: {
          day: string
          id?: string
          ts: unknown
        }
        Update: {
          day?: string
          id?: string
          ts?: unknown
        }
        Relationships: []
      }
      booking_items: {
        Row: {
          booking_id: string | null
          created_at: string | null
          duration_minutes: number
          id: string
          service_item_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          duration_minutes: number
          id?: string
          service_item_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          service_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_service_item_id_fkey"
            columns: ["service_item_id"]
            isOneToOne: false
            referencedRelation: "service_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_service_item_id_fkey"
            columns: ["service_item_id"]
            isOneToOne: false
            referencedRelation: "service_items_with_minutes"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          canceled_at: string | null
          cancellation_token: string | null
          client_email: string
          client_name: string
          client_phone: string
          created_at: string | null
          duration_minutes: number
          end_at: string | null
          id: string
          message: string | null
          period: unknown
          preferred_date: string
          preferred_time: string
          reminder_sent: boolean | null
          service_id: string | null
          service_name: string
          slot: unknown
          start_at: string | null
          status: string
          ts: unknown
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          canceled_at?: string | null
          cancellation_token?: string | null
          client_email: string
          client_name: string
          client_phone: string
          created_at?: string | null
          duration_minutes?: number
          end_at?: string | null
          id?: string
          message?: string | null
          period?: unknown
          preferred_date: string
          preferred_time: string
          reminder_sent?: boolean | null
          service_id?: string | null
          service_name: string
          slot?: unknown
          start_at?: string | null
          status?: string
          ts?: unknown
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          canceled_at?: string | null
          cancellation_token?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string
          created_at?: string | null
          duration_minutes?: number
          end_at?: string | null
          id?: string
          message?: string | null
          period?: unknown
          preferred_date?: string
          preferred_time?: string
          reminder_sent?: boolean | null
          service_id?: string | null
          service_name?: string
          slot?: unknown
          start_at?: string | null
          status?: string
          ts?: unknown
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      business_hours: {
        Row: {
          close_time: string | null
          created_at: string
          day_of_week: number
          id: string
          is_closed: boolean
          open_time: string | null
          updated_at: string
        }
        Insert: {
          close_time?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Update: {
          close_time?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cancellation_tokens: {
        Row: {
          booking_id: string
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      closures: {
        Row: {
          created_at: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          booking_id: string | null
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          sent_at: string | null
          status: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      obs_index_usage_snapshots: {
        Row: {
          id: number
          idx_scan: number | null
          idx_tup_fetch: number | null
          idx_tup_read: number | null
          index_name: string | null
          schemaname: string | null
          snapped_at: string
          table_name: string | null
        }
        Insert: {
          id?: number
          idx_scan?: number | null
          idx_tup_fetch?: number | null
          idx_tup_read?: number | null
          index_name?: string | null
          schemaname?: string | null
          snapped_at?: string
          table_name?: string | null
        }
        Update: {
          id?: number
          idx_scan?: number | null
          idx_tup_fetch?: number | null
          idx_tup_read?: number | null
          index_name?: string | null
          schemaname?: string | null
          snapped_at?: string
          table_name?: string | null
        }
        Relationships: []
      }
      portfolio_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_index: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order_index?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          alt: string
          category: string
          created_at: string | null
          description: string
          detailed_description: string | null
          id: string
          order_index: number | null
          show_on_home: boolean | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          alt: string
          category?: string
          created_at?: string | null
          description: string
          detailed_description?: string | null
          id?: string
          order_index?: number | null
          show_on_home?: boolean | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          alt?: string
          category?: string
          created_at?: string | null
          description?: string
          detailed_description?: string | null
          id?: string
          order_index?: number | null
          show_on_home?: boolean | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          is_admin: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_admin?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_admin?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          badge: string | null
          created_at: string | null
          description: string
          icon: string | null
          id: string
          order_index: number | null
          original_price: string | null
          price: string
          service_item_ids: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          badge?: string | null
          created_at?: string | null
          description: string
          icon?: string | null
          id?: string
          order_index?: number | null
          original_price?: string | null
          price: string
          service_item_ids?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          badge?: string | null
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: string
          order_index?: number | null
          original_price?: string | null
          price?: string
          service_item_ids?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          client_name: string
          comment: string
          created_at: string | null
          id: string
          is_published: boolean
          order_index: number
          rating: number
          service_type: string
          updated_at: string | null
        }
        Insert: {
          client_name: string
          comment: string
          created_at?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          rating: number
          service_type?: string
          updated_at?: string | null
        }
        Update: {
          client_name?: string
          comment?: string
          created_at?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          rating?: number
          service_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_item_members: {
        Row: {
          inserted_at: string
          role: string
          service_item_id: string
          user_id: string
        }
        Insert: {
          inserted_at?: string
          role?: string
          service_item_id: string
          user_id: string
        }
        Update: {
          inserted_at?: string
          role?: string
          service_item_id?: string
          user_id?: string
        }
        Relationships: []
      }
      service_items: {
        Row: {
          benefits: string[] | null
          created_at: string | null
          description: string | null
          duration: string | null
          duration_minutes: number | null
          id: string
          label: string
          order_index: number | null
          price: string
          service_id: string
          updated_at: string | null
        }
        Insert: {
          benefits?: string[] | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          duration_minutes?: number | null
          id?: string
          label: string
          order_index?: number | null
          price: string
          service_id: string
          updated_at?: string | null
        }
        Update: {
          benefits?: string[] | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          duration_minutes?: number | null
          id?: string
          label?: string
          order_index?: number | null
          price?: string
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string | null
          icon: string
          id: string
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon: string
          id?: string
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string
          id?: string
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          is_public: boolean
          setting_key: string
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          is_public?: boolean
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          is_public?: boolean
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      bookings_public_busy: {
        Row: {
          day: string | null
          ts: unknown
        }
        Insert: {
          day?: string | null
          ts?: unknown
        }
        Update: {
          day?: string | null
          ts?: unknown
        }
        Relationships: []
      }
      obs_index_usage: {
        Row: {
          idx_scan: number | null
          idx_tup_fetch: number | null
          idx_tup_read: number | null
          index_name: unknown
          schemaname: unknown
          table_name: unknown
        }
        Relationships: []
      }
      obs_rls_audit: {
        Row: {
          rls_enabled: boolean | null
          schema: unknown
          table: unknown
        }
        Relationships: []
      }
      obs_top_queries: {
        Row: {
          calls: number | null
          local_blks_hit: number | null
          local_blks_read: number | null
          mean_exec_time: number | null
          query: string | null
          queryid: number | null
          rows: number | null
          shared_blks_hit: number | null
          shared_blks_read: number | null
          total_exec_time: number | null
        }
        Relationships: []
      }
      service_items_with_minutes: {
        Row: {
          benefits: string[] | null
          created_at: string | null
          description: string | null
          duration: string | null
          duration_minutes_norm: number | null
          id: string | null
          label: string | null
          order_index: number | null
          price: string | null
          service_id: string | null
          updated_at: string | null
        }
        Insert: {
          benefits?: string[] | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          duration_minutes_norm?: never
          id?: string | null
          label?: string | null
          order_index?: number | null
          price?: string | null
          service_id?: string | null
          updated_at?: string | null
        }
        Update: {
          benefits?: string[] | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          duration_minutes_norm?: never
          id?: string | null
          label?: string | null
          order_index?: number | null
          price?: string | null
          service_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      booking_period: {
        Args: { p_end: string; p_start: string }
        Returns: unknown
      }
      bookings_compute_times: {
        Args: { p_date: string; p_duration: number; p_time: string }
        Returns: {
          end_at: string
          slot: unknown
          start_at: string
        }[]
      }
      cancel_booking: { Args: { p_token: string }; Returns: Json }
      cancel_booking_tx: { Args: { p_booking_id: string }; Returns: Json }
      cancel_booking_with_log: { Args: { p_token: string }; Returns: Json }
      ceil_to_slot_minutes: {
        Args: { slot?: number; total_minutes: number }
        Returns: number
      }
      confirm_booking: {
        Args: { p_end: string; p_service_item: string; p_start: string }
        Returns: boolean
      }
      create_booking: {
        Args: {
          p_client_email: string
          p_client_name: string
          p_client_phone: string
          p_duration_minutes: number
          p_service_name: string
          p_start_at: string
          p_user_id?: string
        }
        Returns: {
          canceled_at: string | null
          cancellation_token: string | null
          client_email: string
          client_name: string
          client_phone: string
          created_at: string | null
          duration_minutes: number
          end_at: string | null
          id: string
          message: string | null
          period: unknown
          preferred_date: string
          preferred_time: string
          reminder_sent: boolean | null
          service_id: string | null
          service_name: string
          slot: unknown
          start_at: string | null
          status: string
          ts: unknown
          updated_at: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_booking_by_service: {
        Args: {
          p_client_email: string
          p_client_name: string
          p_client_phone: string
          p_service_item_id: string
          p_start_at: string
          p_user_id?: string
        }
        Returns: {
          canceled_at: string | null
          cancellation_token: string | null
          client_email: string
          client_name: string
          client_phone: string
          created_at: string | null
          duration_minutes: number
          end_at: string | null
          id: string
          message: string | null
          period: unknown
          preferred_date: string
          preferred_time: string
          reminder_sent: boolean | null
          service_id: string | null
          service_name: string
          slot: unknown
          start_at: string | null
          status: string
          ts: unknown
          updated_at: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_booking_multi: {
        Args: {
          p_client_email: string
          p_client_name: string
          p_client_phone: string
          p_search_days?: number
          p_search_start_date?: string
          p_service_item_ids: string[]
          p_status?: string
        }
        Returns: {
          duration_minutes: number
          end_at: string
          id: string
          start_at: string
          status: string
        }[]
      }
      delete_promotion: { Args: { p_id: string }; Returns: undefined }
      generate_cancellation_token: {
        Args: { p_booking_id: string; p_expires_at: string }
        Returns: string
      }
      get_availability_overview: {
        Args: {
          p_buffer_minutes?: number
          p_duration_minutes: number
          p_end_date: string
          p_slot_step_minutes?: number
          p_start_date: string
        }
        Returns: {
          has_availability: boolean
          the_date: string
        }[]
      }
      get_available_slots:
        | {
            Args: {
              p_buffer_minutes?: number
              p_date: string
              p_duration_minutes: number
              p_slot_step_minutes?: number
            }
            Returns: {
              slot_end: string
              slot_start: string
            }[]
          }
        | {
            Args: { date_from: string; date_to: string; slot_minutes?: number }
            Returns: {
              day: string
              end_at: string
              start_at: string
            }[]
          }
      get_available_slots_by_service: {
        Args: { date_from: string; date_to: string; service_item_id: string }
        Returns: {
          day: string
          duration_minutes: number
          end_at: string
          start_at: string
        }[]
      }
      get_booked_slots: { Args: { p_date: string }; Returns: unknown[] }
      is_admin: { Args: never; Returns: boolean }
      list_available_slots: {
        Args: { p_day: string; p_duration_minutes: number }
        Returns: {
          end_at: string
          start_at: string
        }[]
      }
      list_available_slots_by_service: {
        Args: { p_day: string; p_service_item_id: string }
        Returns: {
          end_at: string
          start_at: string
        }[]
      }
      parse_duration_to_minutes: { Args: { p_text: string }; Returns: number }
      promote_admin: { Args: { p_email: string }; Returns: undefined }
      take_index_usage_snapshot: { Args: never; Returns: undefined }
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
    Enums: {},
  },
} as const
