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
      badges: {
        Row: {
          category: string
          created_at: string | null
          credits_reward: number
          description: string
          icon: string
          id: string
          name: string
          rarity: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category?: string
          created_at?: string | null
          credits_reward?: number
          description: string
          icon: string
          id: string
          name: string
          rarity?: string
          requirement_type: string
          requirement_value?: number
        }
        Update: {
          category?: string
          created_at?: string | null
          credits_reward?: number
          description?: string
          icon?: string
          id?: string
          name?: string
          rarity?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      clicks: {
        Row: {
          clicked_at: string | null
          credits_spent: number | null
          game_id: string
          id: string
          is_bot: boolean | null
          item_name: string | null
          sequence_number: number
          user_id: string | null
          username: string | null
        }
        Insert: {
          clicked_at?: string | null
          credits_spent?: number | null
          game_id: string
          id?: string
          is_bot?: boolean | null
          item_name?: string | null
          sequence_number: number
          user_id?: string | null
          username?: string | null
        }
        Update: {
          clicked_at?: string | null
          credits_spent?: number | null
          game_id?: string
          id?: string
          is_bot?: boolean | null
          item_name?: string | null
          sequence_number?: number
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clicks_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          battle_start_time: string | null
          created_at: string | null
          end_time: number | null
          ended_at: string | null
          final_phase_duration: number | null
          id: string
          initial_duration: number | null
          item_id: string
          last_click_at: string | null
          last_click_user_id: string | null
          last_click_username: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["game_status"] | null
          total_clicks: number | null
          winner_id: string | null
        }
        Insert: {
          battle_start_time?: string | null
          created_at?: string | null
          end_time?: number | null
          ended_at?: string | null
          final_phase_duration?: number | null
          id?: string
          initial_duration?: number | null
          item_id: string
          last_click_at?: string | null
          last_click_user_id?: string | null
          last_click_username?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["game_status"] | null
          total_clicks?: number | null
          winner_id?: string | null
        }
        Update: {
          battle_start_time?: string | null
          created_at?: string | null
          end_time?: number | null
          ended_at?: string | null
          final_phase_duration?: number | null
          id?: string
          initial_duration?: number | null
          item_id?: string
          last_click_at?: string | null
          last_click_user_id?: string | null
          last_click_username?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["game_status"] | null
          total_clicks?: number | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_last_click_user_id_fkey"
            columns: ["last_click_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          is_active: boolean | null
          model_3d_url: string | null
          name: string
          retail_value: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          model_3d_url?: string | null
          name: string
          retail_value?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          model_3d_url?: string | null
          name?: string
          retail_value?: number | null
        }
        Relationships: []
      }
      mini_game_plays: {
        Row: {
          credits_won: number
          game_type: string
          id: string
          is_free_play: boolean
          played_at: string | null
          user_id: string
        }
        Insert: {
          credits_won?: number
          game_type: string
          id?: string
          is_free_play?: boolean
          played_at?: string | null
          user_id: string
        }
        Update: {
          credits_won?: number
          game_type?: string
          id?: string
          is_free_play?: boolean
          played_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mini_game_plays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_data_audit: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_data_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          credits: number | null
          earned_credits: number
          has_purchased_credits: boolean | null
          id: string
          is_admin: boolean | null
          is_vip: boolean | null
          last_credits_reset: string | null
          last_vip_bonus_at: string | null
          referral_code: string | null
          referral_count: number | null
          referral_credits_earned: number | null
          referred_by: string | null
          shipping_address: string | null
          shipping_address2: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_firstname: string | null
          shipping_lastname: string | null
          shipping_phone: string | null
          shipping_postal_code: string | null
          total_clicks: number | null
          total_wins: number | null
          updated_at: string | null
          username: string
          vip_expires_at: string | null
          vip_subscription_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          credits?: number | null
          earned_credits?: number
          has_purchased_credits?: boolean | null
          id: string
          is_admin?: boolean | null
          is_vip?: boolean | null
          last_credits_reset?: string | null
          last_vip_bonus_at?: string | null
          referral_code?: string | null
          referral_count?: number | null
          referral_credits_earned?: number | null
          referred_by?: string | null
          shipping_address?: string | null
          shipping_address2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_firstname?: string | null
          shipping_lastname?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          total_clicks?: number | null
          total_wins?: number | null
          updated_at?: string | null
          username: string
          vip_expires_at?: string | null
          vip_subscription_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          credits?: number | null
          earned_credits?: number
          has_purchased_credits?: boolean | null
          id?: string
          is_admin?: boolean | null
          is_vip?: boolean | null
          last_credits_reset?: string | null
          last_vip_bonus_at?: string | null
          referral_code?: string | null
          referral_count?: number | null
          referral_credits_earned?: number | null
          referred_by?: string | null
          shipping_address?: string | null
          shipping_address2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_firstname?: string | null
          shipping_lastname?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          total_clicks?: number | null
          total_wins?: number | null
          updated_at?: string | null
          username?: string
          vip_expires_at?: string | null
          vip_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["referral_code"]
          },
        ]
      }
      stripe_events: {
        Row: {
          id: string
          processed_at: string
          type: string | null
        }
        Insert: {
          id: string
          processed_at?: string
          type?: string | null
        }
        Update: {
          id?: string
          processed_at?: string
          type?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      winners: {
        Row: {
          delivered_at: string | null
          game_id: string | null
          id: string
          is_bot: boolean | null
          item_id: string
          item_name: string
          item_value: number | null
          shipped_at: string | null
          shipping_status: string | null
          total_clicks_in_game: number | null
          tracking_number: string | null
          user_id: string | null
          username: string | null
          won_at: string | null
        }
        Insert: {
          delivered_at?: string | null
          game_id?: string | null
          id?: string
          is_bot?: boolean | null
          item_id: string
          item_name: string
          item_value?: number | null
          shipped_at?: string | null
          shipping_status?: string | null
          total_clicks_in_game?: number | null
          tracking_number?: string | null
          user_id?: string | null
          username?: string | null
          won_at?: string | null
        }
        Update: {
          delivered_at?: string | null
          game_id?: string | null
          id?: string
          is_bot?: boolean | null
          item_id?: string
          item_name?: string
          item_value?: number | null
          shipped_at?: string | null
          shipping_status?: string | null
          total_clicks_in_game?: number | null
          tracking_number?: string | null
          user_id?: string | null
          username?: string | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "winners_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winners_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_mini_game_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      admin_set_admin: {
        Args: { p_is_admin: boolean; p_user_id: string }
        Returns: boolean
      }
      admin_set_credits: {
        Args: { p_credits: number; p_user_id: string }
        Returns: boolean
      }
      apply_referral_code: {
        Args: { p_code: string }
        Returns: {
          credits_awarded: number
          ok: boolean
          reason: string
        }[]
      }
      can_play_mini_game: {
        Args: { p_game_type: string; p_user_id: string }
        Returns: boolean
      }
      claim_eligible_badges: {
        Args: never
        Returns: {
          badge_id: string
          credits_reward: number
        }[]
      }
      collect_vip_bonus: {
        Args: { p_amount?: number; p_user_id: string }
        Returns: {
          earned: number
          ok: boolean
          reason: string
        }[]
      }
      decrement_credits: {
        Args: { p_amount?: number; p_user_id: string }
        Returns: number
      }
      deduct_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      generate_bot_username: { Args: { seed: string }; Returns: string }
      get_next_sequence: { Args: { p_game_id: string }; Returns: number }
      get_total_credits: { Args: { p_user_id: string }; Returns: number }
      log_player_event: {
        Args: { p_action: string; p_details?: Json; p_user_id: string }
        Returns: undefined
      }
      paris_midnight: { Args: never; Returns: string }
      perform_click: {
        Args: {
          p_game_id: string
          p_item_name: string
          p_user_id: string
          p_username: string
        }
        Returns: {
          new_end_time: number
          new_total: number
          ok: boolean
          reason: string
        }[]
      }
      refund_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      reset_daily_credits: {
        Args: { p_user_id: string }
        Returns: {
          daily_credits: number
          earned: number
          was_reset: boolean
        }[]
      }
      simulate_bot_clicks: { Args: never; Returns: undefined }
    }
    Enums: {
      game_status: "waiting" | "active" | "final_phase" | "ended"
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
      game_status: ["waiting", "active", "final_phase", "ended"],
    },
  },
} as const
