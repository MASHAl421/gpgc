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
      key_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          order_index: number | null
          title: string
          topic_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          title: string
          topic_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          title?: string
          topic_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_notes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      past_papers: {
        Row: {
          created_at: string | null
          file_url: string
          id: string
          paper_type: string | null
          subject_id: string
          title: string
          year: number | null
        }
        Insert: {
          created_at?: string | null
          file_url: string
          id?: string
          paper_type?: string | null
          subject_id: string
          title: string
          year?: number | null
        }
        Update: {
          created_at?: string | null
          file_url?: string
          id?: string
          paper_type?: string | null
          subject_id?: string
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "past_papers_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          coins_earned: number | null
          created_at: string | null
          email: string | null
          id: string
          is_bs_student: boolean | null
          semester: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          coins_earned?: number | null
          created_at?: string | null
          email?: string | null
          id: string
          is_bs_student?: boolean | null
          semester?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          coins_earned?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_bs_student?: boolean | null
          semester?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_option: string
          created_at: string | null
          explanation: string | null
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index: number | null
          question_text: string
          quiz_id: string
        }
        Insert: {
          correct_option: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index?: number | null
          question_text: string
          quiz_id: string
        }
        Update: {
          correct_option?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          order_index?: number | null
          question_text?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          coins_earned: number | null
          completed_at: string | null
          id: string
          quiz_id: string
          score: number
          time_taken_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          coins_earned?: number | null
          completed_at?: string | null
          id?: string
          quiz_id: string
          score?: number
          time_taken_seconds?: number | null
          total_questions?: number
          user_id: string
        }
        Update: {
          coins_earned?: number | null
          completed_at?: string | null
          id?: string
          quiz_id?: string
          score?: number
          time_taken_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          difficulty: string | null
          id: string
          time_limit_minutes: number | null
          title: string
          topic_id: string
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          time_limit_minutes?: number | null
          title: string
          topic_id: string
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          time_limit_minutes?: number | null
          title?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string | null
          description: string | null
          grade: string
          icon: string | null
          id: string
          name: string
          semester: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          grade?: string
          icon?: string | null
          id?: string
          name: string
          semester?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          grade?: string
          icon?: string | null
          id?: string
          name?: string
          semester?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      topics: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_index: number | null
          unit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order_index?: number | null
          unit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_index: number | null
          subject_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order_index?: number | null
          subject_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          attempts: number | null
          completed: boolean | null
          created_at: string | null
          id: string
          last_attempted_at: string | null
          score: number | null
          topic_id: string
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed?: boolean | null
          created_at?: string | null
          id?: string
          last_attempted_at?: string | null
          score?: number | null
          topic_id: string
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed?: boolean | null
          created_at?: string | null
          id?: string
          last_attempted_at?: string | null
          score?: number | null
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
