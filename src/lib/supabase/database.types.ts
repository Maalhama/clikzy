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
          is_hidden: boolean
          name: string
          rarity: string
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string | null
          credits_reward?: number
          description: string
          icon: string
          id: string
          is_hidden?: boolean
          name: string
          rarity?: string
          requirement_type: string
          requirement_value?: number
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string | null
          credits_reward?: number
          description?: string
          icon?: string
          id?: string
          is_hidden?: boolean
          name?: string
          rarity?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      battle_passes: {
        Row: {
          month: string
          purchased_at: string
          stripe_session: string | null
          user_id: string
        }
        Insert: {
          month: string
          purchased_at?: string
          stripe_session?: string | null
          user_id: string
        }
        Update: {
          month?: string
          purchased_at?: string
          stripe_session?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_passes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buy_it_now_purchases: {
        Row: {
          created_at: string
          delivered_at: string | null
          game_id: string
          id: string
          item_id: string
          item_name: string
          price_paid: number
          shipped_at: string | null
          shipping_status: string
          stripe_session: string | null
          tracking_number: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          game_id: string
          id?: string
          item_id: string
          item_name: string
          price_paid: number
          shipped_at?: string | null
          shipping_status?: string
          stripe_session?: string | null
          tracking_number?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          game_id?: string
          id?: string
          item_id?: string
          item_name?: string
          price_paid?: number
          shipped_at?: string | null
          shipping_status?: string
          stripe_session?: string | null
          tracking_number?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buy_it_now_purchases_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buy_it_now_purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buy_it_now_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_claims: {
        Row: {
          claimed_at: string
          day: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          day: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          day?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_members: {
        Row: {
          clan_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          clan_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string | null
          tag: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          tag: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "clans_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      comments: {
        Row: {
          content: string
          created_at: string
          game_id: string
          id: string
          user_id: string
          username: string
        }
        Insert: {
          content: string
          created_at?: string
          game_id: string
          id?: string
          user_id: string
          username: string
        }
        Update: {
          content?: string
          created_at?: string
          game_id?: string
          id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetics_catalog: {
        Row: {
          id: string
          is_premium: boolean
          name: string
          rarity: string
          sort_order: number
          type: string
          unlock_level: number
        }
        Insert: {
          id: string
          is_premium?: boolean
          name: string
          rarity: string
          sort_order?: number
          type: string
          unlock_level?: number
        }
        Update: {
          id?: string
          is_premium?: boolean
          name?: string
          rarity?: string
          sort_order?: number
          type?: string
          unlock_level?: number
        }
        Relationships: []
      }
      credit_grant_sessions: {
        Row: {
          created_at: string
          credits_granted: number
          pack_id: string
          stripe_session: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_granted?: number
          pack_id: string
          stripe_session: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_granted?: number
          pack_id?: string
          stripe_session?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_quests: {
        Row: {
          active: boolean
          credits_reward: number
          description: string | null
          key: string
          metric: string
          sort_order: number
          target: number
          title: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          credits_reward?: number
          description?: string | null
          key: string
          metric: string
          sort_order?: number
          target: number
          title: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          credits_reward?: number
          description?: string | null
          key?: string
          metric?: string
          sort_order?: number
          target?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
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
      gift_codes: {
        Row: {
          amount_paid: number
          code: string
          created_at: string
          credits: number
          expires_at: string
          gifter_id: string | null
          gifter_username: string | null
          kind: string
          pack_id: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          stripe_session: string | null
          vip_days: number
        }
        Insert: {
          amount_paid?: number
          code: string
          created_at?: string
          credits?: number
          expires_at?: string
          gifter_id?: string | null
          gifter_username?: string | null
          kind: string
          pack_id?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          stripe_session?: string | null
          vip_days?: number
        }
        Update: {
          amount_paid?: number
          code?: string
          created_at?: string
          credits?: number
          expires_at?: string
          gifter_id?: string | null
          gifter_username?: string | null
          kind?: string
          pack_id?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          stripe_session?: string | null
          vip_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "gift_codes_gifter_id_fkey"
            columns: ["gifter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_codes_redeemed_by_fkey"
            columns: ["redeemed_by"]
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
      items_catalog: {
        Row: {
          bonus_kind: string
          bonus_value: number
          credit_bonus_pct: number
          emoji: string
          id: string
          name: string
          rarity: string
          slot: string
          sort_order: number
          xp_bonus_pct: number
        }
        Insert: {
          bonus_kind: string
          bonus_value?: number
          credit_bonus_pct?: number
          emoji?: string
          id: string
          name: string
          rarity: string
          slot: string
          sort_order?: number
          xp_bonus_pct?: number
        }
        Update: {
          bonus_kind?: string
          bonus_value?: number
          credit_bonus_pct?: number
          emoji?: string
          id?: string
          name?: string
          rarity?: string
          slot?: string
          sort_order?: number
          xp_bonus_pct?: number
        }
        Relationships: []
      }
      jackpot: {
        Row: {
          amount: number
          id: number
          last_distributed_month: string | null
          last_winner_amount: number | null
          last_winner_username: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          id?: number
          last_distributed_month?: string | null
          last_winner_amount?: number | null
          last_winner_username?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          id?: number
          last_distributed_month?: string | null
          last_winner_amount?: number | null
          last_winner_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mini_game_plays: {
        Row: {
          credits_won: number
          fair_nonce: number | null
          game_type: string
          id: string
          is_free_play: boolean
          play_day: string | null
          played_at: string | null
          user_id: string
        }
        Insert: {
          credits_won?: number
          fair_nonce?: number | null
          game_type: string
          id?: string
          is_free_play?: boolean
          play_day?: string | null
          played_at?: string | null
          user_id: string
        }
        Update: {
          credits_won?: number
          fair_nonce?: number | null
          game_type?: string
          id?: string
          is_free_play?: boolean
          play_day?: string | null
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
      pack_purchases: {
        Row: {
          created_at: string
          credits_granted: number
          doubled: boolean
          month: string
          pack_id: string
          stripe_session: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_granted?: number
          doubled?: boolean
          month: string
          pack_id: string
          stripe_session?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credits_granted?: number
          doubled?: boolean
          month?: string
          pack_id?: string
          stripe_session?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pass_tier_claims: {
        Row: {
          claimed_at: string
          month: string
          tier: number
          user_id: string
        }
        Insert: {
          claimed_at?: string
          month: string
          tier: number
          user_id: string
        }
        Update: {
          claimed_at?: string
          month?: string
          tier?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pass_tier_claims_user_id_fkey"
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
          chest_last_claim_day: string | null
          cosmetic_cursor: string
          cosmetic_frame: string
          cosmetic_trail: string
          created_at: string | null
          credits: number | null
          earned_credits: number
          equip_bonus_pct: number
          equip_chest_luck: number
          equip_credit_bonus_pct: number
          equip_daily_clicks: number
          fair_client_seed: string | null
          fair_nonce: number
          fair_server_seed_hash: string | null
          has_purchased_credits: boolean | null
          id: string
          is_admin: boolean | null
          is_vip: boolean | null
          last_credits_reset: string | null
          last_vip_bonus_at: string | null
          level: number
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
          streak_count: number
          streak_last_day: string | null
          total_clicks: number | null
          total_wins: number | null
          updated_at: string | null
          username: string
          vip_expires_at: string | null
          vip_subscription_id: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          chest_last_claim_day?: string | null
          cosmetic_cursor?: string
          cosmetic_frame?: string
          cosmetic_trail?: string
          created_at?: string | null
          credits?: number | null
          earned_credits?: number
          equip_bonus_pct?: number
          equip_chest_luck?: number
          equip_credit_bonus_pct?: number
          equip_daily_clicks?: number
          fair_client_seed?: string | null
          fair_nonce?: number
          fair_server_seed_hash?: string | null
          has_purchased_credits?: boolean | null
          id: string
          is_admin?: boolean | null
          is_vip?: boolean | null
          last_credits_reset?: string | null
          last_vip_bonus_at?: string | null
          level?: number
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
          streak_count?: number
          streak_last_day?: string | null
          total_clicks?: number | null
          total_wins?: number | null
          updated_at?: string | null
          username: string
          vip_expires_at?: string | null
          vip_subscription_id?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          chest_last_claim_day?: string | null
          cosmetic_cursor?: string
          cosmetic_frame?: string
          cosmetic_trail?: string
          created_at?: string | null
          credits?: number | null
          earned_credits?: number
          equip_bonus_pct?: number
          equip_chest_luck?: number
          equip_credit_bonus_pct?: number
          equip_daily_clicks?: number
          fair_client_seed?: string | null
          fair_nonce?: number
          fair_server_seed_hash?: string | null
          has_purchased_credits?: boolean | null
          id?: string
          is_admin?: boolean | null
          is_vip?: boolean | null
          last_credits_reset?: string | null
          last_vip_bonus_at?: string | null
          level?: number
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
          streak_count?: number
          streak_last_day?: string | null
          total_clicks?: number | null
          total_wins?: number | null
          updated_at?: string | null
          username?: string
          vip_expires_at?: string | null
          vip_subscription_id?: string | null
          xp?: number
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
      user_chests: {
        Row: {
          created_at: string
          dropped_credits: number | null
          dropped_item_id: string | null
          id: string
          opened: boolean
          opened_at: string | null
          rarity: string
          source: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dropped_credits?: number | null
          dropped_item_id?: string | null
          id?: string
          opened?: boolean
          opened_at?: string | null
          rarity: string
          source?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dropped_credits?: number | null
          dropped_item_id?: string | null
          id?: string
          opened?: boolean
          opened_at?: string | null
          rarity?: string
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_chests_dropped_item_id_fkey"
            columns: ["dropped_item_id"]
            isOneToOne: false
            referencedRelation: "items_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_chests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cosmetics: {
        Row: {
          acquired_at: string
          cosmetic_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          cosmetic_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          cosmetic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cosmetics_cosmetic_id_fkey"
            columns: ["cosmetic_id"]
            isOneToOne: false
            referencedRelation: "cosmetics_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cosmetics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_equipment: {
        Row: {
          equipped_at: string
          inventory_id: string
          item_id: string
          slot: string
          user_id: string
        }
        Insert: {
          equipped_at?: string
          inventory_id: string
          item_id: string
          slot: string
          user_id: string
        }
        Update: {
          equipped_at?: string
          inventory_id?: string
          item_id?: string
          slot?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_equipment_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "user_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_equipment_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_equipment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_fairness: {
        Row: {
          server_seed: string
          updated_at: string
          user_id: string
        }
        Insert: {
          server_seed: string
          updated_at?: string
          user_id: string
        }
        Update: {
          server_seed?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_fairness_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          acquired_at: string
          id: string
          item_id: string
          source: string | null
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          item_id: string
          source?: string | null
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          item_id?: string
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quest_claims: {
        Row: {
          claimed_at: string
          quest_day: string
          quest_key: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          quest_day: string
          quest_key: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          quest_day?: string
          quest_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quest_claims_quest_key_fkey"
            columns: ["quest_key"]
            isOneToOne: false
            referencedRelation: "daily_quests"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "user_quest_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_self_exclusion: {
        Row: {
          created_at: string
          excluded_until: string
          user_id: string
        }
        Insert: {
          created_at?: string
          excluded_until: string
          user_id: string
        }
        Update: {
          created_at?: string
          excluded_until?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_self_exclusion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_user_id_fkey"
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
      add_purchased_credits: {
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
      award_xp: {
        Args: { p_amount: number; p_user_id: string }
        Returns: {
          leveled_up: boolean
          new_level: number
          new_xp: number
        }[]
      }
      calendar_reward: {
        Args: { p_day: string }
        Returns: {
          amount: number
          kind: string
          rarity: string
        }[]
      }
      can_comment: { Args: { p_game_id: string }; Returns: boolean }
      can_play_mini_game: {
        Args: { p_game_type: string; p_user_id: string }
        Returns: boolean
      }
      claim_calendar_day: {
        Args: { p_user_id: string }
        Returns: {
          already: boolean
          amount: number
          chest_id: string
          kind: string
          ok: boolean
          rarity: string
        }[]
      }
      claim_daily_chest: {
        Args: { p_user_id: string }
        Returns: {
          already: boolean
          granted: number
          ok: boolean
          rarities: string[]
        }[]
      }
      claim_daily_login: {
        Args: { p_user_id: string }
        Returns: {
          already: boolean
          credits_gained: number
          streak: number
          xp_gained: number
        }[]
      }
      claim_eligible_badges: {
        Args: never
        Returns: {
          badge_id: string
          credits_reward: number
        }[]
      }
      claim_pass_tier: {
        Args: { p_tier: number; p_user_id: string }
        Returns: {
          reward_amount: number
          reward_item_id: string
          reward_item_name: string
          reward_kind: string
          reward_rarity: string
        }[]
      }
      claim_quest: {
        Args: { p_quest_key: string }
        Returns: {
          credits_reward: number
          ok: boolean
          reason: string
          xp_reward: number
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
      consume_fairness: {
        Args: { p_user: string }
        Returns: {
          client_seed: string
          nonce: number
          server_seed: string
        }[]
      }
      count_game_contenders: { Args: { p_game_id: string }; Returns: number }
      create_clan: {
        Args: { p_desc?: string; p_name: string; p_tag: string }
        Returns: {
          clan_id: string
          ok: boolean
          reason: string
        }[]
      }
      daily_quests_status: {
        Args: never
        Returns: {
          claimed: boolean
          credits_reward: number
          description: string
          key: string
          progress: number
          sort_order: number
          target: number
          title: string
          xp_reward: number
        }[]
      }
      deduct_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      distribute_jackpot: {
        Args: never
        Returns: {
          distributed: boolean
          winner: string
          won: number
        }[]
      }
      end_game: {
        Args: { p_game_id: string }
        Returns: {
          closed: boolean
          out_is_bot: boolean
          out_item_id: string
          out_total_clicks: number
          out_winner_id: string
          out_winner_username: string
        }[]
      }
      ensure_fairness: { Args: { p_user: string }; Returns: undefined }
      equip_cosmetic: {
        Args: { p_id: string }
        Returns: {
          ok: boolean
          reason: string
        }[]
      }
      equip_item: {
        Args: { p_inventory_id: string }
        Returns: {
          ok: boolean
          reason: string
          slot: string
        }[]
      }
      get_buy_it_now_offers: {
        Args: { p_user_id: string }
        Returns: {
          credits_spent: number
          expires_at: string
          game_id: string
          item_id: string
          item_image: string
          item_name: string
          price: number
          retail_value: number
        }[]
      }
      get_calendar_month: {
        Args: { p_user_id: string }
        Returns: {
          amount: number
          claimable: boolean
          claimed: boolean
          day: string
          kind: string
          rarity: string
        }[]
      }
      get_clan_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          clan_id: string
          member_count: number
          name: string
          rank: number
          tag: string
          total_xp: number
        }[]
      }
      get_gift_code: { Args: { p_code: string }; Returns: Json }
      get_leaderboard: {
        Args: { p_limit?: number; p_period?: string }
        Returns: {
          avatar_url: string
          level: number
          rank: number
          total_wins: number
          user_id: string
          username: string
          xp: number
        }[]
      }
      get_my_rank: {
        Args: { p_period?: string }
        Returns: {
          my_rank: number
          total_players: number
        }[]
      }
      get_pack_month_state: {
        Args: { p_user_id: string }
        Returns: {
          doubled: boolean
          pack_id: string
        }[]
      }
      get_pass_state: {
        Args: { p_user_id: string }
        Returns: {
          claimed_tiers: number[]
          days_claimed: number
          purchased: boolean
        }[]
      }
      get_recent_comments: {
        Args: { p_limit?: number }
        Returns: {
          content: string
          created_at: string
          game_id: string
          id: string
          item_image: string
          item_name: string
          username: string
        }[]
      }
      grant_battle_pass: {
        Args: { p_session: string; p_user_id: string }
        Returns: undefined
      }
      grant_pack_credits: {
        Args: {
          p_base_credits: number
          p_monthly_limit?: boolean
          p_pack_id: string
          p_session: string
          p_user_id: string
        }
        Returns: Json
      }
      grow_jackpot: { Args: { p_amount?: number }; Returns: undefined }
      increment_total_wins: { Args: { p_user_id: string }; Returns: number }
      join_clan: {
        Args: { p_clan_id: string }
        Returns: {
          ok: boolean
          reason: string
        }[]
      }
      leave_clan: {
        Args: never
        Returns: {
          ok: boolean
          reason: string
        }[]
      }
      log_player_event: {
        Args: { p_action: string; p_details?: Json; p_user_id: string }
        Returns: undefined
      }
      open_chest: {
        Args: { p_chest_id: string }
        Returns: {
          bonus_kind: string
          bonus_value: number
          credit_bonus_pct: number
          credits: number
          emoji: string
          item_id: string
          item_name: string
          item_rarity: string
          ok: boolean
          reason: string
          reward_kind: string
          slot: string
          xp: number
          xp_bonus_pct: number
        }[]
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
      post_comment: {
        Args: { p_content: string; p_game_id: string }
        Returns: Json
      }
      quote_buy_it_now: {
        Args: { p_game_id: string; p_user_id: string }
        Returns: {
          item_id: string
          item_name: string
          price: number
        }[]
      }
      recompute_equip_bonus: { Args: { p_user_id: string }; Returns: undefined }
      record_buy_it_now: {
        Args: {
          p_game_id: string
          p_price: number
          p_session: string
          p_user_id: string
        }
        Returns: Json
      }
      redeem_gift_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      reset_daily_credits: {
        Args: { p_user_id: string }
        Returns: {
          daily_credits: number
          earned: number
          was_reset: boolean
        }[]
      }
      rotate_fairness: {
        Args: { p_client_seed: string }
        Returns: {
          new_hash: string
          old_hash: string
          old_server_seed: string
        }[]
      }
      set_self_exclusion: { Args: { p_days: number }; Returns: string }
      unequip_slot: {
        Args: { p_slot: string }
        Returns: {
          ok: boolean
        }[]
      }
      xp_to_level: { Args: { p_xp: number }; Returns: number }
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
