export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          role: 'student' | 'teacher' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role: 'student' | 'teacher' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'teacher' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      institutions: {
        Row: {
          id: string
          name: string
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      user_institutions: {
        Row: {
          id: string
          user_id: string
          institution_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          institution_id: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          institution_id?: string
          role?: string
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          user_id: string
          student_number: string
          enrollment_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          student_number: string
          enrollment_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          student_number?: string
          enrollment_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          credits: number
          institution_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          credits: number
          institution_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          credits?: number
          institution_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          student_id: string
          course_id: string
          status: 'active' | 'completed' | 'dropped'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          status?: 'active' | 'completed' | 'dropped'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          status?: 'active' | 'completed' | 'dropped'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'student' | 'teacher' | 'admin'
      enrollment_status: 'active' | 'completed' | 'dropped'
    }
  }
}
