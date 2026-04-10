export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          created_at?: string
        }
      }
      couples: {
        Row: {
          id: string
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          currency?: string
          created_at?: string
        }
        Update: {
          id?: string
          currency?: string
          created_at?: string
        }
      }
      couple_members: {
        Row: {
          id: string
          user_id: string
          couple_id: string
          role: 'owner' | 'member'
        }
        Insert: {
          id?: string
          user_id: string
          couple_id: string
          role?: 'owner' | 'member'
        }
        Update: {
          id?: string
          user_id?: string
          couple_id?: string
          role?: 'owner' | 'member'
        }
      }
      invitations: {
        Row: {
          id: string
          couple_id: string
          email: string
          token: string
          status: 'pending' | 'accepted' | 'expired'
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          email: string
          token?: string
          status?: 'pending' | 'accepted' | 'expired'
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          email?: string
          token?: string
          status?: 'pending' | 'accepted' | 'expired'
          expires_at?: string
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          name: string
          type: 'cash' | 'bank' | 'credit_card'
          initial_balance: number
          limit_amount: number | null
          closing_day: number | null
          due_day: number | null
          user_id: string
          couple_id: string
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'cash' | 'bank' | 'credit_card'
          initial_balance?: number
          limit_amount?: number | null
          closing_day?: number | null
          due_day?: number | null
          user_id: string
          couple_id: string
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'cash' | 'bank' | 'credit_card'
          initial_balance?: number
          limit_amount?: number | null
          closing_day?: number | null
          due_day?: number | null
          user_id?: string
          couple_id?: string
          deleted_at?: string | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          type: 'income' | 'expense'
          is_system: boolean
          couple_id: string | null
        }
        Insert: {
          id?: string
          name: string
          type: 'income' | 'expense'
          is_system?: boolean
          couple_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: 'income' | 'expense'
          is_system?: boolean
          couple_id?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          type: 'income' | 'expense' | 'transfer'
          amount: number
          description: string | null
          category_id: string | null
          account_id: string
          to_account_id: string | null
          installment_item_id: string | null
          date: string
          competence_date: string
          is_private: boolean
          user_id: string
          couple_id: string
          deleted_at: string | null
          created_at: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          type: 'income' | 'expense' | 'transfer'
          amount: number
          description?: string | null
          category_id?: string | null
          account_id: string
          to_account_id?: string | null
          installment_item_id?: string | null
          date: string
          competence_date?: string
          is_private?: boolean
          user_id: string
          couple_id: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          type?: 'income' | 'expense' | 'transfer'
          amount?: number
          description?: string | null
          category_id?: string | null
          account_id?: string
          to_account_id?: string | null
          installment_item_id?: string | null
          date?: string
          competence_date?: string
          is_private?: boolean
          user_id?: string
          couple_id?: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string | null
          updated_by?: string | null
        }
      }
      installments: {
        Row: {
          id: string
          description: string
          total_amount: number
          total_parts: number
          interest_rate: number
          start_date: string
          status: 'active' | 'paid' | 'canceled'
          user_id: string
          couple_id: string
        }
        Insert: {
          id?: string
          description: string
          total_amount: number
          total_parts: number
          interest_rate?: number
          start_date: string
          status?: 'active' | 'paid' | 'canceled'
          user_id: string
          couple_id: string
        }
        Update: {
          id?: string
          description?: string
          total_amount?: number
          total_parts?: number
          interest_rate?: number
          start_date?: string
          status?: 'active' | 'paid' | 'canceled'
          user_id?: string
          couple_id?: string
        }
      }
      installment_items: {
        Row: {
          id: string
          installment_id: string
          part_number: number
          amount: number
          due_date: string
          paid: boolean
          paid_at: string | null
          canceled: boolean
        }
        Insert: {
          id?: string
          installment_id: string
          part_number: number
          amount: number
          due_date: string
          paid?: boolean
          paid_at?: string | null
          canceled?: boolean
        }
        Update: {
          id?: string
          installment_id?: string
          part_number?: number
          amount?: number
          due_date?: string
          paid?: boolean
          paid_at?: string | null
          canceled?: boolean
        }
      }
      recurring_accounts: {
        Row: {
          id: string
          name: string
          day_due: number
          user_id: string
          couple_id: string
          active: boolean
        }
        Insert: {
          id?: string
          name: string
          day_due: number
          user_id: string
          couple_id: string
          active?: boolean
        }
        Update: {
          id?: string
          name?: string
          day_due?: number
          user_id?: string
          couple_id?: string
          active?: boolean
        }
      }
      recurring_records: {
        Row: {
          id: string
          recurring_id: string
          reference_month: string
          amount: number
          paid: boolean
          paid_at: string | null
        }
        Insert: {
          id?: string
          recurring_id: string
          reference_month: string
          amount: number
          paid?: boolean
          paid_at?: string | null
        }
        Update: {
          id?: string
          recurring_id?: string
          reference_month?: string
          amount?: number
          paid?: boolean
          paid_at?: string | null
        }
      }
      budgets: {
        Row: {
          id: string
          category_id: string
          couple_id: string
          amount: number
          month: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          category_id: string
          couple_id: string
          amount: number
          month: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          category_id?: string
          couple_id?: string
          amount?: number
          month?: string
          updated_at?: string | null
          updated_by?: string | null
        }
      }
    }
    Views: {
      account_balances: {
        Row: {
          id: string
          name: string
          balance: number
        }
      }
    }
    Functions: {}
    Enums: {}
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Profile = Tables<'profiles'>
export type Couple = Tables<'couples'>
export type CoupleMember = Tables<'couple_members'>
export type Invitation = Tables<'invitations'>
export type Account = Tables<'accounts'>
export type Category = Tables<'categories'>
export type Transaction = Tables<'transactions'>
export type Installment = Tables<'installments'>
export type InstallmentItem = Tables<'installment_items'>
export type RecurringAccount = Tables<'recurring_accounts'>
export type RecurringRecord = Tables<'recurring_records'>
export type Budget = Tables<'budgets'>
export type AccountBalance = Database['public']['Views']['account_balances']['Row']
