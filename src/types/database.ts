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
      accounts: {
        Row: {
          closing_day: number | null
          color: string | null
          couple_id: string
          created_at: string
          deleted_at: string | null
          due_day: number | null
          icon: string | null
          id: string
          initial_balance: number
          limit_amount: number | null
          min_balance_alert: number | null
          name: string
          notes: string | null
          sort_order: number | null
          type: string
          user_id: string
        }
        Insert: {
          closing_day?: number | null
          color?: string | null
          couple_id: string
          created_at?: string
          deleted_at?: string | null
          due_day?: number | null
          icon?: string | null
          id?: string
          initial_balance?: number
          limit_amount?: number | null
          min_balance_alert?: number | null
          name: string
          notes?: string | null
          sort_order?: number | null
          type: string
          user_id: string
        }
        Update: {
          closing_day?: number | null
          color?: string | null
          couple_id?: string
          created_at?: string
          deleted_at?: string | null
          due_day?: number | null
          icon?: string | null
          id?: string
          initial_balance?: number
          limit_amount?: number | null
          min_balance_alert?: number | null
          name?: string
          notes?: string | null
          sort_order?: number | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          alert_threshold: number | null
          amount: number
          category_id: string
          couple_id: string
          id: string
          month: string
          rollover_amount: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          alert_threshold?: number | null
          amount: number
          category_id: string
          couple_id: string
          id?: string
          month: string
          rollover_amount?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          alert_threshold?: number | null
          amount?: number
          category_id?: string
          couple_id?: string
          id?: string
          month?: string
          rollover_amount?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_invoice_payments: {
        Row: {
          account_id: string
          amount: number
          couple_id: string
          created_at: string | null
          id: string
          note: string | null
          paid_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          couple_id: string
          created_at?: string | null
          id?: string
          note?: string | null
          paid_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          couple_id?: string
          created_at?: string | null
          id?: string
          note?: string | null
          paid_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_invoice_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_invoice_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_invoice_payments_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_invoice_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          couple_id: string | null
          id: string
          is_system: boolean
          name: string
          sort_order: number | null
          type: string
        }
        Insert: {
          color?: string | null
          couple_id?: string | null
          id?: string
          is_system?: boolean
          name: string
          sort_order?: number | null
          type: string
        }
        Update: {
          color?: string | null
          couple_id?: string | null
          id?: string
          is_system?: boolean
          name?: string
          sort_order?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      category_rules: {
        Row: {
          category_id: string
          couple_id: string
          created_at: string | null
          id: string
          match_type: string
          pattern: string
        }
        Insert: {
          category_id: string
          couple_id: string
          created_at?: string | null
          id?: string
          match_type?: string
          pattern: string
        }
        Update: {
          category_id?: string
          couple_id?: string
          created_at?: string | null
          id?: string
          match_type?: string
          pattern?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_rules_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_members: {
        Row: {
          couple_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          couple_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          couple_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_members_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          created_at: string
          currency: string
          daily_limit: number | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          daily_limit?: number | null
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          daily_limit?: number | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      financial_reminders: {
        Row: {
          couple_id: string
          created_at: string | null
          description: string | null
          done: boolean | null
          due_date: string | null
          id: string
          recurrence: string | null
          title: string
          user_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string | null
          description?: string | null
          done?: boolean | null
          due_date?: string | null
          id?: string
          recurrence?: string | null
          title: string
          user_id: string
        }
        Update: {
          couple_id?: string
          created_at?: string | null
          description?: string | null
          done?: boolean | null
          due_date?: string | null
          id?: string
          recurrence?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_reminders_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_contributions: {
        Row: {
          amount: number
          contributed_at: string
          contributed_by: string | null
          couple_id: string
          goal_id: string
          id: string
          note: string | null
        }
        Insert: {
          amount: number
          contributed_at?: string
          contributed_by?: string | null
          couple_id: string
          goal_id: string
          id?: string
          note?: string | null
        }
        Update: {
          amount?: number
          contributed_at?: string
          contributed_by?: string | null
          couple_id?: string
          goal_id?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_contributed_by_fkey"
            columns: ["contributed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_contributions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_history: {
        Row: {
          amount: number
          created_at: string
          goal_id: string
          id: string
          note: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          goal_id: string
          id?: string
          note?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          goal_id?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_history_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          account_id: string | null
          couple_id: string
          created_at: string
          current_amount: number
          deadline: string | null
          id: string
          name: string
          status: string
          target_amount: number
        }
        Insert: {
          account_id?: string | null
          couple_id: string
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          name: string
          status?: string
          target_amount: number
        }
        Update: {
          account_id?: string | null
          couple_id?: string
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          name?: string
          status?: string
          target_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_items: {
        Row: {
          amount: number
          canceled: boolean
          due_date: string
          id: string
          installment_id: string
          paid: boolean
          paid_at: string | null
          part_number: number
        }
        Insert: {
          amount: number
          canceled?: boolean
          due_date: string
          id?: string
          installment_id: string
          paid?: boolean
          paid_at?: string | null
          part_number: number
        }
        Update: {
          amount?: number
          canceled?: boolean
          due_date?: string
          id?: string
          installment_id?: string
          paid?: boolean
          paid_at?: string | null
          part_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "installment_items_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          account_id: string | null
          category_id: string | null
          couple_id: string
          created_at: string
          description: string
          id: string
          interest_rate: number
          start_date: string
          status: string
          total_amount: number
          total_parts: number
          user_id: string
        }
        Insert: {
          account_id?: string | null
          category_id?: string | null
          couple_id: string
          created_at?: string
          description: string
          id?: string
          interest_rate?: number
          start_date: string
          status?: string
          total_amount: number
          total_parts: number
          user_id: string
        }
        Update: {
          account_id?: string | null
          category_id?: string | null
          couple_id?: string
          created_at?: string
          description?: string
          id?: string
          interest_rate?: number
          start_date?: string
          status?: string
          total_amount?: number
          total_parts?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          active: boolean
          couple_id: string
          created_at: string
          created_by: string | null
          current_value: number | null
          goal_id: string | null
          id: string
          institution: string | null
          invested_amount: number
          last_updated_at: string | null
          liquidity: string | null
          maturity_date: string | null
          name: string
          notes: string | null
          rate_type: string | null
          rate_value: number | null
          start_date: string
          type: string
        }
        Insert: {
          active?: boolean
          couple_id: string
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          goal_id?: string | null
          id?: string
          institution?: string | null
          invested_amount?: number
          last_updated_at?: string | null
          liquidity?: string | null
          maturity_date?: string | null
          name: string
          notes?: string | null
          rate_type?: string | null
          rate_value?: number | null
          start_date?: string
          type?: string
        }
        Update: {
          active?: boolean
          couple_id?: string
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          goal_id?: string | null
          id?: string
          institution?: string | null
          invested_amount?: number
          last_updated_at?: string | null
          liquidity?: string | null
          maturity_date?: string | null
          name?: string
          notes?: string | null
          rate_type?: string | null
          rate_value?: number | null
          start_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          couple_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          status: string
          token: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          status?: string
          token?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_plans: {
        Row: {
          category_id: string | null
          couple_id: string
          created_at: string | null
          id: string
          label: string
          month: string
          planned_amount: number
        }
        Insert: {
          category_id?: string | null
          couple_id: string
          created_at?: string | null
          id?: string
          label: string
          month: string
          planned_amount?: number
        }
        Update: {
          category_id?: string | null
          couple_id?: string
          created_at?: string | null
          id?: string
          label?: string
          month?: string
          planned_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_plans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_plans_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      networth_snapshots: {
        Row: {
          assets: number
          couple_id: string
          created_at: string | null
          id: string
          liabilities: number
          month: string
          net_worth: number
        }
        Insert: {
          assets?: number
          couple_id: string
          created_at?: string | null
          id?: string
          liabilities?: number
          month: string
          net_worth?: number
        }
        Update: {
          assets?: number
          couple_id?: string
          created_at?: string | null
          id?: string
          liabilities?: number
          month?: string
          net_worth?: number
        }
        Relationships: [
          {
            foreignKeyName: "networth_snapshots_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          couple_id: string
          created_at: string
          href: string | null
          id: string
          read: boolean
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          couple_id: string
          created_at?: string
          href?: string | null
          id?: string
          read?: boolean
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          couple_id?: string
          created_at?: string
          href?: string | null
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          category: string | null
          couple_id: string
          created_at: string
          created_by: string | null
          id: string
          item_name: string
          notes: string | null
          price: number
          quantity: number
          recorded_at: string
          store: string | null
          unit: string | null
        }
        Insert: {
          category?: string | null
          couple_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_name: string
          notes?: string | null
          price: number
          quantity?: number
          recorded_at?: string
          store?: string | null
          unit?: string | null
        }
        Update: {
          category?: string | null
          couple_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_name?: string
          notes?: string | null
          price?: number
          quantity?: number
          recorded_at?: string
          store?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          active: boolean
          address: string | null
          area_m2: number | null
          condo_fee: number | null
          couple_id: string
          created_at: string
          created_by: string | null
          current_value: number | null
          id: string
          iptu_annual: number | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_value: number | null
          type: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          area_m2?: number | null
          condo_fee?: number | null
          couple_id: string
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          id?: string
          iptu_annual?: number | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          type?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          area_m2?: number | null
          condo_fee?: number | null
          couple_id?: string
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          id?: string
          iptu_annual?: number | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_maintenances: {
        Row: {
          contractor: string | null
          cost: number | null
          couple_id: string
          created_at: string
          date: string
          description: string | null
          id: string
          next_date: string | null
          notes: string | null
          priority: string
          property_id: string
          status: string
          type: string
          warranty_until: string | null
        }
        Insert: {
          contractor?: string | null
          cost?: number | null
          couple_id: string
          created_at?: string
          date: string
          description?: string | null
          id?: string
          next_date?: string | null
          notes?: string | null
          priority?: string
          property_id: string
          status?: string
          type: string
          warranty_until?: string | null
        }
        Update: {
          contractor?: string | null
          cost?: number | null
          couple_id?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          next_date?: string | null
          notes?: string | null
          priority?: string
          property_id?: string
          status?: string
          type?: string
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_maintenances_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_maintenances_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_accounts: {
        Row: {
          active: boolean
          amount: number | null
          category_id: string | null
          couple_id: string
          created_at: string
          day_due: number
          end_date: string | null
          id: string
          name: string
          paused: boolean
          user_id: string
        }
        Insert: {
          active?: boolean
          amount?: number | null
          category_id?: string | null
          couple_id: string
          created_at?: string
          day_due: number
          end_date?: string | null
          id?: string
          name: string
          paused?: boolean
          user_id: string
        }
        Update: {
          active?: boolean
          amount?: number | null
          category_id?: string | null
          couple_id?: string
          created_at?: string
          day_due?: number
          end_date?: string | null
          id?: string
          name?: string
          paused?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_accounts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_accounts_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_records: {
        Row: {
          amount: number
          id: string
          paid: boolean
          paid_at: string | null
          recurring_id: string
          reference_month: string
        }
        Insert: {
          amount: number
          id?: string
          paid?: boolean
          paid_at?: string | null
          recurring_id: string
          reference_month: string
        }
        Update: {
          amount?: number
          id?: string
          paid?: boolean
          paid_at?: string | null
          recurring_id?: string
          reference_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_records_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_items: {
        Row: {
          actual_price: number | null
          added_by: string | null
          category: string | null
          checked: boolean
          created_at: string
          estimated_price: number | null
          id: string
          list_id: string
          name: string
          notes: string | null
          quantity: number
          unit: string | null
        }
        Insert: {
          actual_price?: number | null
          added_by?: string | null
          category?: string | null
          checked?: boolean
          created_at?: string
          estimated_price?: number | null
          id?: string
          list_id: string
          name: string
          notes?: string | null
          quantity?: number
          unit?: string | null
        }
        Update: {
          actual_price?: number | null
          added_by?: string | null
          category?: string | null
          checked?: boolean
          created_at?: string
          estimated_price?: number | null
          id?: string
          list_id?: string
          name?: string
          notes?: string | null
          quantity?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          budget: number | null
          budget_category_id: string | null
          completed: boolean
          couple_id: string
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          budget?: number | null
          budget_category_id?: string | null
          completed?: boolean
          couple_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Update: {
          budget?: number | null
          budget_category_id?: string | null
          completed?: boolean
          couple_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_budget_category_id_fkey"
            columns: ["budget_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_templates: {
        Row: {
          account_id: string | null
          amount: number | null
          category_id: string | null
          couple_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          tags: string[] | null
          type: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number | null
          category_id?: string | null
          couple_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          tags?: string[] | null
          type: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number | null
          category_id?: string | null
          couple_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          tags?: string[] | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_templates_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_templates_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_templates_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          comment: string | null
          competence_date: string
          couple_id: string
          created_at: string
          date: string
          deleted_at: string | null
          description: string | null
          id: string
          installment_item_id: string | null
          is_private: boolean
          receipt_url: string | null
          reconciled: boolean | null
          split_id: string | null
          tags: string[] | null
          to_account_id: string | null
          trip_id: string | null
          type: string
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          comment?: string | null
          competence_date?: string
          couple_id: string
          created_at?: string
          date?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          installment_item_id?: string | null
          is_private?: boolean
          receipt_url?: string | null
          reconciled?: boolean | null
          split_id?: string | null
          tags?: string[] | null
          to_account_id?: string | null
          trip_id?: string | null
          type: string
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          comment?: string | null
          competence_date?: string
          couple_id?: string
          created_at?: string
          date?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          installment_item_id?: string | null
          is_private?: boolean
          receipt_url?: string | null
          reconciled?: boolean | null
          split_id?: string | null
          tags?: string[] | null
          to_account_id?: string | null
          trip_id?: string | null
          type?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_installment_item_id_fkey"
            columns: ["installment_item_id"]
            isOneToOne: false
            referencedRelation: "installment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_attachments: {
        Row: {
          created_at: string
          id: string
          name: string
          size_bytes: number | null
          trip_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          size_bytes?: number | null
          trip_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          size_bytes?: number | null
          trip_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_attachments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_checklists: {
        Row: {
          checked: boolean
          created_at: string
          id: string
          label: string
          sort_order: number
          trip_id: string
        }
        Insert: {
          checked?: boolean
          created_at?: string
          id?: string
          label: string
          sort_order?: number
          trip_id: string
        }
        Update: {
          checked?: boolean
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_checklists_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_companions: {
        Row: {
          created_at: string
          id: string
          name: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_companions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_diary: {
        Row: {
          content: string
          day_date: string
          id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          content?: string
          day_date: string
          id?: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          day_date?: string
          id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_diary_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expenses: {
        Row: {
          actual: number | null
          booking_ref: string | null
          category: string
          created_at: string
          description: string
          estimated: number
          exchange_rate: number
          foreign_amount: number | null
          foreign_currency: string | null
          id: string
          notes: string | null
          paid: boolean
          trip_id: string
        }
        Insert: {
          actual?: number | null
          booking_ref?: string | null
          category?: string
          created_at?: string
          description: string
          estimated?: number
          exchange_rate?: number
          foreign_amount?: number | null
          foreign_currency?: string | null
          id?: string
          notes?: string | null
          paid?: boolean
          trip_id: string
        }
        Update: {
          actual?: number | null
          booking_ref?: string | null
          category?: string
          created_at?: string
          description?: string
          estimated?: number
          exchange_rate?: number
          foreign_amount?: number | null
          foreign_currency?: string | null
          id?: string
          notes?: string | null
          paid?: boolean
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_itinerary: {
        Row: {
          created_at: string
          day_date: string
          description: string | null
          id: string
          place_id: string | null
          sort_order: number
          time_slot: string | null
          title: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          day_date: string
          description?: string | null
          id?: string
          place_id?: string | null
          sort_order?: number
          time_slot?: string | null
          title: string
          trip_id: string
        }
        Update: {
          created_at?: string
          day_date?: string
          description?: string | null
          id?: string
          place_id?: string | null
          sort_order?: number
          time_slot?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_itinerary_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "trip_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_itinerary_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_places: {
        Row: {
          address: string | null
          created_at: string
          id: string
          maps_url: string | null
          name: string
          notes: string | null
          sort_order: number
          status: string
          trip_id: string
          type: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          maps_url?: string | null
          name: string
          notes?: string | null
          sort_order?: number
          status?: string
          trip_id: string
          type?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          maps_url?: string | null
          name?: string
          notes?: string | null
          sort_order?: number
          status?: string
          trip_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_places_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_quotes: {
        Row: {
          amount: number
          category: string
          chosen: boolean
          created_at: string
          currency: string
          description: string
          exchange_rate: number
          id: string
          notes: string | null
          provider: string | null
          trip_id: string
        }
        Insert: {
          amount?: number
          category?: string
          chosen?: boolean
          created_at?: string
          currency?: string
          description: string
          exchange_rate?: number
          id?: string
          notes?: string | null
          provider?: string | null
          trip_id: string
        }
        Update: {
          amount?: number
          category?: string
          chosen?: boolean
          created_at?: string
          currency?: string
          description?: string
          exchange_rate?: number
          id?: string
          notes?: string | null
          provider?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_quotes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_share_tokens: {
        Row: {
          created_at: string
          id: string
          token: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          token?: string
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          token?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_share_tokens_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          archived: boolean
          budget: number
          budget_limits: Json
          couple_id: string
          created_at: string
          currency: string
          destination: string
          end_date: string | null
          goal_id: string | null
          id: string
          name: string
          notes: string | null
          sort_order: number
          start_date: string | null
          status: string
          tags: string[]
        }
        Insert: {
          archived?: boolean
          budget?: number
          budget_limits?: Json
          couple_id: string
          created_at?: string
          currency?: string
          destination: string
          end_date?: string | null
          goal_id?: string | null
          id?: string
          name: string
          notes?: string | null
          sort_order?: number
          start_date?: string | null
          status?: string
          tags?: string[]
        }
        Update: {
          archived?: boolean
          budget?: number
          budget_limits?: Json
          couple_id?: string
          created_at?: string
          currency?: string
          destination?: string
          end_date?: string | null
          goal_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          sort_order?: number
          start_date?: string | null
          status?: string
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "trips_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenances: {
        Row: {
          cost: number | null
          couple_id: string
          created_at: string
          date: string
          description: string | null
          id: string
          km_at_service: number | null
          next_date: string | null
          next_km: number | null
          notes: string | null
          shop: string | null
          type: string
          vehicle_id: string
        }
        Insert: {
          cost?: number | null
          couple_id: string
          created_at?: string
          date: string
          description?: string | null
          id?: string
          km_at_service?: number | null
          next_date?: string | null
          next_km?: number | null
          notes?: string | null
          shop?: string | null
          type: string
          vehicle_id: string
        }
        Update: {
          cost?: number | null
          couple_id?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          km_at_service?: number | null
          next_date?: string | null
          next_km?: number | null
          notes?: string | null
          shop?: string | null
          type?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenances_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_maintenances_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          active: boolean
          color: string | null
          couple_id: string
          created_at: string
          created_by: string | null
          current_km: number
          fuel_type: string
          id: string
          make: string | null
          model: string | null
          name: string
          notes: string | null
          plate: string | null
          year: number | null
        }
        Insert: {
          active?: boolean
          color?: string | null
          couple_id: string
          created_at?: string
          created_by?: string | null
          current_km?: number
          fuel_type?: string
          id?: string
          make?: string | null
          model?: string | null
          name: string
          notes?: string | null
          plate?: string | null
          year?: number | null
        }
        Update: {
          active?: boolean
          color?: string | null
          couple_id?: string
          created_at?: string
          created_by?: string | null
          current_km?: number
          fuel_type?: string
          id?: string
          make?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          plate?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          couple_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          price: number | null
          priority: number | null
          purchased: boolean | null
          purchased_at: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price?: number | null
          priority?: number | null
          purchased?: boolean | null
          purchased_at?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          couple_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          priority?: number | null
          purchased?: boolean | null
          purchased_at?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_votes: {
        Row: {
          approved: boolean
          couple_id: string
          created_at: string | null
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          couple_id: string
          created_at?: string | null
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          approved?: boolean
          couple_id?: string
          created_at?: string | null
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_votes_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_votes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "wishlist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      account_balances: {
        Row: {
          balance: number | null
          couple_id: string | null
          id: string | null
          name: string | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
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

// Convenience aliases
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
export type Goal = Tables<'goals'>
export type GoalContribution = Tables<'goal_contributions'>
export type WishlistItem = Tables<'wishlist_items'>
export type WishlistVote = Tables<'wishlist_votes'>
export type Investment = Tables<'investments'>
export type Vehicle = Tables<'vehicles'>
export type Trip = Tables<'trips'>
export type TransactionTemplate = Tables<'transaction_templates'>
export type CategoryRule = Tables<'category_rules'>
export type ShoppingList = Tables<'shopping_lists'>
export type ShoppingItem = Tables<'shopping_items'>
export type FinancialReminder = Tables<'financial_reminders'>
export type AccountBalance = Tables<'account_balances'>
