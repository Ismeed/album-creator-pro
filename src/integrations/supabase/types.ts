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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      album_generations: {
        Row: {
          album_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          participant_count: number
          status: string
          template_id: string
        }
        Insert: {
          album_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          participant_count?: number
          status?: string
          template_id?: string
        }
        Update: {
          album_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          participant_count?: number
          status?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_generations_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      albums: {
        Row: {
          album_type: Database["public"]["Enums"]["album_type"]
          created_at: string
          id: string
          institution_name: string | null
          is_locked: boolean
          organizer_id: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          price_per_participant: number | null
          required_fields: Json | null
          submission_deadline: string | null
          title: string
        }
        Insert: {
          album_type?: Database["public"]["Enums"]["album_type"]
          created_at?: string
          id?: string
          institution_name?: string | null
          is_locked?: boolean
          organizer_id: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          price_per_participant?: number | null
          required_fields?: Json | null
          submission_deadline?: string | null
          title: string
        }
        Update: {
          album_type?: Database["public"]["Enums"]["album_type"]
          created_at?: string
          id?: string
          institution_name?: string | null
          is_locked?: boolean
          organizer_id?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          price_per_participant?: number | null
          required_fields?: Json | null
          submission_deadline?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizers: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          cohort: string | null
          created_at: string
          department_or_class: string | null
          full_name: string
          graduation_year: string | null
          id: string
          identifier: string | null
          quote: string | null
          role: string | null
        }
        Insert: {
          cohort?: string | null
          created_at?: string
          department_or_class?: string | null
          full_name: string
          graduation_year?: string | null
          id?: string
          identifier?: string | null
          quote?: string | null
          role?: string | null
        }
        Update: {
          cohort?: string | null
          created_at?: string
          department_or_class?: string | null
          full_name?: string
          graduation_year?: string | null
          id?: string
          identifier?: string | null
          quote?: string | null
          role?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          album_id: string
          amount: number
          id: string
          paid_at: string | null
          payment_channel: string | null
          payment_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          submission_id: string | null
        }
        Insert: {
          album_id: string
          amount: number
          id?: string
          paid_at?: string | null
          payment_channel?: string | null
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          submission_id?: string | null
        }
        Update: {
          album_id?: string
          amount?: number
          id?: string
          paid_at?: string | null
          payment_channel?: string | null
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          album_id: string
          approval_status: Database["public"]["Enums"]["approval_status"]
          background_color: string | null
          id: string
          participant_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          photo_url: string
          processed_photo_url: string | null
          submitted_at: string
        }
        Insert: {
          album_id: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          background_color?: string | null
          id?: string
          participant_id: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          photo_url: string
          processed_photo_url?: string | null
          submitted_at?: string
        }
        Update: {
          album_id?: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          background_color?: string | null
          id?: string
          participant_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          photo_url?: string
          processed_photo_url?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_album_id_from_submission: {
        Args: { _submission_id: string }
        Returns: string
      }
      get_public_album_info: {
        Args: { _album_id: string }
        Returns: {
          album_type: Database["public"]["Enums"]["album_type"]
          id: string
          institution_name: string
          is_locked: boolean
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          price_per_participant: number
          required_fields: Json
          submission_deadline: string
          title: string
        }[]
      }
      is_album_open_for_submission: {
        Args: { _album_id: string }
        Returns: boolean
      }
      is_album_owner: { Args: { _album_id: string }; Returns: boolean }
      is_payment_owner: { Args: { _payment_id: string }; Returns: boolean }
      is_submission_owner: {
        Args: { _submission_id: string }
        Returns: boolean
      }
      is_valid_album: { Args: { _album_id: string }; Returns: boolean }
    }
    Enums: {
      album_type:
        | "class"
        | "department"
        | "faculty"
        | "training"
        | "bootcamp"
        | "other"
      approval_status: "pending" | "approved" | "rejected"
      payment_mode: "organizer_pays" | "participant_pays"
      payment_status: "pending" | "successful" | "failed"
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
      album_type: [
        "class",
        "department",
        "faculty",
        "training",
        "bootcamp",
        "other",
      ],
      approval_status: ["pending", "approved", "rejected"],
      payment_mode: ["organizer_pays", "participant_pays"],
      payment_status: ["pending", "successful", "failed"],
    },
  },
} as const
