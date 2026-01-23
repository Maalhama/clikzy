export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type GameStatus = 'waiting' | 'active' | 'final_phase' | 'ended'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          credits: number
          total_wins: number
          total_clicks: number
          last_credits_reset: string
          has_purchased_credits: boolean
          is_admin: boolean
          shipping_firstname: string | null
          shipping_lastname: string | null
          shipping_address: string | null
          shipping_address2: string | null
          shipping_postal_code: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          credits?: number
          total_wins?: number
          total_clicks?: number
          last_credits_reset?: string
          has_purchased_credits?: boolean
          is_admin?: boolean
          shipping_firstname?: string | null
          shipping_lastname?: string | null
          shipping_address?: string | null
          shipping_address2?: string | null
          shipping_postal_code?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          credits?: number
          total_wins?: number
          total_clicks?: number
          last_credits_reset?: string
          has_purchased_credits?: boolean
          is_admin?: boolean
          shipping_firstname?: string | null
          shipping_lastname?: string | null
          shipping_address?: string | null
          shipping_address2?: string | null
          shipping_postal_code?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string
          retail_value: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url: string
          retail_value?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string
          retail_value?: number | null
          is_active?: boolean
          created_at?: string
        }
      }
      games: {
        Row: {
          id: string
          item_id: string
          status: GameStatus
          start_time: string | null
          end_time: number
          initial_duration: number
          final_phase_duration: number
          last_click_user_id: string | null
          last_click_username: string | null
          last_click_at: string | null
          winner_id: string | null
          total_clicks: number
          created_at: string
          ended_at: string | null
          battle_start_time: string | null
        }
        Insert: {
          id?: string
          item_id: string
          status?: GameStatus
          start_time?: string | null
          end_time?: number
          initial_duration?: number
          final_phase_duration?: number
          last_click_user_id?: string | null
          last_click_username?: string | null
          last_click_at?: string | null
          winner_id?: string | null
          total_clicks?: number
          created_at?: string
          ended_at?: string | null
          battle_start_time?: string | null
        }
        Update: {
          id?: string
          item_id?: string
          status?: GameStatus
          start_time?: string | null
          end_time?: number
          initial_duration?: number
          final_phase_duration?: number
          last_click_user_id?: string | null
          last_click_username?: string | null
          last_click_at?: string | null
          winner_id?: string | null
          total_clicks?: number
          created_at?: string
          ended_at?: string | null
          battle_start_time?: string | null
        }
      }
      clicks: {
        Row: {
          id: string
          game_id: string
          user_id: string | null
          username: string | null
          item_name: string | null
          is_bot: boolean
          clicked_at: string
          credits_spent: number
          sequence_number: number
        }
        Insert: {
          id?: string
          game_id: string
          user_id?: string | null
          username?: string | null
          item_name?: string | null
          is_bot?: boolean
          clicked_at?: string
          credits_spent?: number
          sequence_number: number
        }
        Update: {
          id?: string
          game_id?: string
          user_id?: string | null
          username?: string | null
          item_name?: string | null
          is_bot?: boolean
          clicked_at?: string
          credits_spent?: number
          sequence_number?: number
        }
      }
      winners: {
        Row: {
          id: string
          game_id: string
          user_id: string | null
          username: string | null
          item_id: string
          item_name: string
          item_value: number | null
          total_clicks_in_game: number | null
          is_bot: boolean
          won_at: string
          shipping_status: 'pending' | 'address_needed' | 'processing' | 'shipped' | 'delivered'
          tracking_number: string | null
          shipped_at: string | null
          delivered_at: string | null
        }
        Insert: {
          id?: string
          game_id: string
          user_id?: string | null
          username?: string | null
          item_id: string
          item_name: string
          item_value?: number | null
          total_clicks_in_game?: number | null
          is_bot?: boolean
          won_at?: string
          shipping_status?: 'pending' | 'address_needed' | 'processing' | 'shipped' | 'delivered'
          tracking_number?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
        }
        Update: {
          id?: string
          game_id?: string
          user_id?: string | null
          username?: string | null
          item_id?: string
          item_name?: string
          item_value?: number | null
          total_clicks_in_game?: number | null
          is_bot?: boolean
          won_at?: string
          shipping_status?: 'pending' | 'address_needed' | 'processing' | 'shipped' | 'delivered'
          tracking_number?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_credits: {
        Args: {
          user_id_param: string
          amount: number
        }
        Returns: undefined
      }
      get_next_sequence: {
        Args: {
          game_id_param: string
        }
        Returns: number
      }
    }
    Enums: {
      game_status: GameStatus
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Item = Database['public']['Tables']['items']['Row']
export type Game = Database['public']['Tables']['games']['Row']
export type Click = Database['public']['Tables']['clicks']['Row']
export type Winner = Database['public']['Tables']['winners']['Row']

// Extended types for frontend
export interface GameWithItem extends Game {
  item: Item
}
