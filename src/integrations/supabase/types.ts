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
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_system: boolean
          sender_id: string | null
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_system?: boolean
          sender_id?: string | null
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_system?: boolean
          sender_id?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      mode_entitlements: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          is_active: boolean
          is_trial: boolean
          mode: Database["public"]["Enums"]["app_mode"]
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          is_active?: boolean
          is_trial?: boolean
          mode: Database["public"]["Enums"]["app_mode"]
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          is_active?: boolean
          is_trial?: boolean
          mode?: Database["public"]["Enums"]["app_mode"]
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          id: string
          label: string
          position: number
          post_id: string
        }
        Insert: {
          id?: string
          label: string
          position?: number
          post_id: string
        }
        Update: {
          id?: string
          label?: string
          position?: number
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
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
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          caption: string
          created_at: string
          event_at: string | null
          event_location: string | null
          id: string
          image_path: string | null
          mode: Database["public"]["Enums"]["app_mode"]
          post_type: string
        }
        Insert: {
          author_id: string
          caption?: string
          created_at?: string
          event_at?: string | null
          event_location?: string | null
          id?: string
          image_path?: string | null
          mode: Database["public"]["Enums"]["app_mode"]
          post_type?: string
        }
        Update: {
          author_id?: string
          caption?: string
          created_at?: string
          event_at?: string | null
          event_location?: string | null
          id?: string
          image_path?: string | null
          mode?: Database["public"]["Enums"]["app_mode"]
          post_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string | null
          blur_photos: boolean
          city: string | null
          country: string | null
          cover_path: string | null
          created_at: string
          display_name: string | null
          has_kids: boolean
          id: string
          is_verified: boolean
          kids_age_groups: string[] | null
          latitude: number | null
          liveness_video_path: string | null
          longitude: number | null
          marital_status: Database["public"]["Enums"]["marital_status"] | null
          primary_mode: Database["public"]["Enums"]["app_mode"] | null
          stripe_customer_id: string | null
          updated_at: string
          verified_gender: Database["public"]["Enums"]["gender"] | null
          wali_contact: string | null
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          blur_photos?: boolean
          city?: string | null
          country?: string | null
          cover_path?: string | null
          created_at?: string
          display_name?: string | null
          has_kids?: boolean
          id: string
          is_verified?: boolean
          kids_age_groups?: string[] | null
          latitude?: number | null
          liveness_video_path?: string | null
          longitude?: number | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          primary_mode?: Database["public"]["Enums"]["app_mode"] | null
          stripe_customer_id?: string | null
          updated_at?: string
          verified_gender?: Database["public"]["Enums"]["gender"] | null
          wali_contact?: string | null
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          blur_photos?: boolean
          city?: string | null
          country?: string | null
          cover_path?: string | null
          created_at?: string
          display_name?: string | null
          has_kids?: boolean
          id?: string
          is_verified?: boolean
          kids_age_groups?: string[] | null
          latitude?: number | null
          liveness_video_path?: string | null
          longitude?: number | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          primary_mode?: Database["public"]["Enums"]["app_mode"] | null
          stripe_customer_id?: string | null
          updated_at?: string
          verified_gender?: Database["public"]["Enums"]["gender"] | null
          wali_contact?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_members: {
        Row: {
          created_at: string
          id: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_members_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          allow_cross_gender: boolean
          created_at: string
          creator_id: string | null
          has_wali: boolean
          id: string
          kind: string
          mode: Database["public"]["Enums"]["app_mode"]
          title: string | null
          updated_at: string
        }
        Insert: {
          allow_cross_gender?: boolean
          created_at?: string
          creator_id?: string | null
          has_wali?: boolean
          id?: string
          kind?: string
          mode: Database["public"]["Enums"]["app_mode"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          allow_cross_gender?: boolean
          created_at?: string
          creator_id?: string | null
          has_wali?: boolean
          id?: string
          kind?: string
          mode?: Database["public"]["Enums"]["app_mode"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      wali_invites: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          inviter_id: string
          redeemed_at: string | null
          redeemed_by: string | null
          thread_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          inviter_id: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          thread_id: string
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          inviter_id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          thread_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "wali_invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wali_invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wali_invites_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wali_invites_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wali_invites_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      discoverable_profiles: {
        Row: {
          avatar_path: string | null
          bio: string | null
          blur_photos: boolean | null
          city: string | null
          country: string | null
          cover_path: string | null
          created_at: string | null
          display_name: string | null
          has_kids: boolean | null
          id: string | null
          is_verified: boolean | null
          kids_age_groups: string[] | null
          marital_status: Database["public"]["Enums"]["marital_status"] | null
          primary_mode: Database["public"]["Enums"]["app_mode"] | null
          verified_gender: Database["public"]["Enums"]["gender"] | null
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          blur_photos?: boolean | null
          city?: string | null
          country?: string | null
          cover_path?: string | null
          created_at?: string | null
          display_name?: string | null
          has_kids?: boolean | null
          id?: string | null
          is_verified?: boolean | null
          kids_age_groups?: string[] | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          primary_mode?: Database["public"]["Enums"]["app_mode"] | null
          verified_gender?: Database["public"]["Enums"]["gender"] | null
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          blur_photos?: boolean | null
          city?: string | null
          country?: string | null
          cover_path?: string | null
          created_at?: string | null
          display_name?: string | null
          has_kids?: boolean | null
          id?: string | null
          is_verified?: boolean | null
          kids_age_groups?: string[] | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          primary_mode?: Database["public"]["Enums"]["app_mode"] | null
          verified_gender?: Database["public"]["Enums"]["gender"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_wali_to_thread: {
        Args: { _thread_id: string; _wali_email: string }
        Returns: undefined
      }
      can_view_mode: {
        Args: {
          _mode: Database["public"]["Enums"]["app_mode"]
          _user_id: string
        }
        Returns: boolean
      }
      create_group: {
        Args: { _mode: Database["public"]["Enums"]["app_mode"]; _title: string }
        Returns: string
      }
      create_post: {
        Args: {
          _caption?: string
          _event_at?: string
          _event_location?: string
          _image_path?: string
          _mode: Database["public"]["Enums"]["app_mode"]
          _poll_options?: string[]
          _post_type: string
        }
        Returns: string
      }
      create_wali_invite: { Args: { _thread_id: string }; Returns: string }
      get_connections: {
        Args: { _mode: Database["public"]["Enums"]["app_mode"] }
        Returns: {
          avatar_path: string | null
          bio: string | null
          blur_photos: boolean | null
          city: string | null
          country: string | null
          cover_path: string | null
          created_at: string | null
          display_name: string | null
          has_kids: boolean | null
          id: string | null
          is_verified: boolean | null
          kids_age_groups: string[] | null
          marital_status: Database["public"]["Enums"]["marital_status"] | null
          primary_mode: Database["public"]["Enums"]["app_mode"] | null
          verified_gender: Database["public"]["Enums"]["gender"] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "discoverable_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_wali_invite_info: {
        Args: { _token: string }
        Returns: {
          expired: boolean
          inviter_name: string
          mode: Database["public"]["Enums"]["app_mode"]
          redeemed: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invite_to_group: {
        Args: { _invitee_id: string; _thread_id: string }
        Returns: undefined
      }
      is_thread_member: {
        Args: { _thread_id: string; _user_id: string }
        Returns: boolean
      }
      redeem_wali_invite: { Args: { _token: string }; Returns: string }
      send_message: {
        Args: { _body: string; _thread_id: string }
        Returns: {
          body: string
          created_at: string
          id: string
          is_system: boolean
          sender_id: string | null
          thread_id: string
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_dm_thread: {
        Args: {
          _mode: Database["public"]["Enums"]["app_mode"]
          _other_user_id: string
        }
        Returns: string
      }
      vote_on_poll: {
        Args: { _option_id: string; _post_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_mode: "matrimonial" | "sisterhood" | "brotherhood"
      app_role: "admin" | "user" | "wali"
      gender: "male" | "female"
      marital_status: "single" | "divorced" | "separated" | "widowed"
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
      app_mode: ["matrimonial", "sisterhood", "brotherhood"],
      app_role: ["admin", "user", "wali"],
      gender: ["male", "female"],
      marital_status: ["single", "divorced", "separated", "widowed"],
    },
  },
} as const
