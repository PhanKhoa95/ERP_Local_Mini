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
      achievements: {
        Row: {
          badge_reward: string | null
          company_id: string
          condition_type: string
          condition_value: Json
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          rarity: string | null
          updated_at: string
          xp_reward: number | null
        }
        Insert: {
          badge_reward?: string | null
          company_id: string
          condition_type: string
          condition_value?: Json
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rarity?: string | null
          updated_at?: string
          xp_reward?: number | null
        }
        Update: {
          badge_reward?: string | null
          company_id?: string
          condition_type?: string
          condition_value?: Json
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rarity?: string | null
          updated_at?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "achievements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_permissions: {
        Row: {
          agent_name: string
          allowed_actions: string[] | null
          allowed_tables: string[] | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          max_amount_limit: number | null
          requires_human_approval: boolean | null
          updated_at: string
        }
        Insert: {
          agent_name: string
          allowed_actions?: string[] | null
          allowed_tables?: string[] | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_amount_limit?: number | null
          requires_human_approval?: boolean | null
          updated_at?: string
        }
        Update: {
          agent_name?: string
          allowed_actions?: string[] | null
          allowed_tables?: string[] | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_amount_limit?: number | null
          requires_human_approval?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          allowed_domains: string[] | null
          allowed_ips: string[] | null
          api_key_hash: string
          company_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_name: string
          key_prefix: string
          partner_type: string
          scopes: Json | null
          updated_at: string
        }
        Insert: {
          allowed_domains?: string[] | null
          allowed_ips?: string[] | null
          api_key_hash: string
          company_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name: string
          key_prefix: string
          partner_type: string
          scopes?: Json | null
          updated_at?: string
        }
        Update: {
          allowed_domains?: string[] | null
          allowed_ips?: string[] | null
          api_key_hash?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name?: string
          key_prefix?: string
          partner_type?: string
          scopes?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          attachments: Json | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          rejection_reason: string | null
          request_type: string
          requested_by: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          rejection_reason?: string | null
          request_type: string
          requested_by: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          rejection_reason?: string | null
          request_type?: string
          requested_by?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          check_in: string | null
          check_out: string | null
          company_id: string
          created_at: string
          date: string
          employee_id: string
          id: string
          location_data: Json | null
          notes: string | null
          overtime_hours: number | null
          type: string
          work_hours: number | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          company_id: string
          created_at?: string
          date?: string
          employee_id: string
          id?: string
          location_data?: Json | null
          notes?: string | null
          overtime_hours?: number | null
          type?: string
          work_hours?: number | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          company_id?: string
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          location_data?: Json | null
          notes?: string | null
          overtime_hours?: number | null
          type?: string
          work_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_questions: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          expected_answer: string
          expected_document_ids: string[] | null
          id: string
          question: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          expected_answer: string
          expected_document_ids?: string[] | null
          id?: string
          question: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          expected_answer?: string
          expected_document_ids?: string[] | null
          id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_questions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_results: {
        Row: {
          actual_answer: string | null
          audit_question_id: string
          context_recall: number | null
          created_at: string
          faithfulness: number | null
          id: string
          latency_ms: number | null
          retrieved_document_ids: string[] | null
        }
        Insert: {
          actual_answer?: string | null
          audit_question_id: string
          context_recall?: number | null
          created_at?: string
          faithfulness?: number | null
          id?: string
          latency_ms?: number | null
          retrieved_document_ids?: string[] | null
        }
        Update: {
          actual_answer?: string | null
          audit_question_id?: string
          context_recall?: number | null
          created_at?: string
          faithfulness?: number | null
          id?: string
          latency_ms?: number | null
          retrieved_document_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_results_audit_question_id_fkey"
            columns: ["audit_question_id"]
            isOneToOne: false
            referencedRelation: "audit_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          account_number: string | null
          amount: number
          company_id: string
          content: string | null
          created_at: string
          gateway: string
          id: string
          matched_entity_id: string | null
          matched_entity_type: string | null
          notes: string | null
          raw_data: Json | null
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_status: string
          sender_name: string | null
          transaction_id: string
          transaction_time: string
        }
        Insert: {
          account_number?: string | null
          amount?: number
          company_id: string
          content?: string | null
          created_at?: string
          gateway?: string
          id?: string
          matched_entity_id?: string | null
          matched_entity_type?: string | null
          notes?: string | null
          raw_data?: Json | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string
          sender_name?: string | null
          transaction_id: string
          transaction_time?: string
        }
        Update: {
          account_number?: string | null
          amount?: number
          company_id?: string
          content?: string | null
          created_at?: string
          gateway?: string
          id?: string
          matched_entity_id?: string | null
          matched_entity_type?: string | null
          notes?: string | null
          raw_data?: Json | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string
          sender_name?: string | null
          transaction_id?: string
          transaction_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      blockchain_config: {
        Row: {
          chain_id: string | null
          chain_name: string
          company_id: string
          contract_address: string | null
          created_at: string
          gas_limit: number | null
          id: string
          is_active: boolean | null
          rpc_url: string | null
          updated_at: string
        }
        Insert: {
          chain_id?: string | null
          chain_name?: string
          company_id: string
          contract_address?: string | null
          created_at?: string
          gas_limit?: number | null
          id?: string
          is_active?: boolean | null
          rpc_url?: string | null
          updated_at?: string
        }
        Update: {
          chain_id?: string | null
          chain_name?: string
          company_id?: string
          contract_address?: string | null
          created_at?: string
          gas_limit?: number | null
          id?: string
          is_active?: boolean | null
          rpc_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_type: string
          company_id: string
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          end_time: string
          id: string
          industry: string
          notes: string | null
          offline_queued: boolean | null
          resource_id: string | null
          resource_name: string
          resource_type: string
          start_time: string
          status: string
          token_reward_on_complete: number | null
          updated_at: string
          vneid_hash: string | null
          voucher_discount: number | null
          voucher_on_complete: boolean | null
        }
        Insert: {
          booking_type?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          end_time: string
          id?: string
          industry?: string
          notes?: string | null
          offline_queued?: boolean | null
          resource_id?: string | null
          resource_name: string
          resource_type?: string
          start_time: string
          status?: string
          token_reward_on_complete?: number | null
          updated_at?: string
          vneid_hash?: string | null
          voucher_discount?: number | null
          voucher_on_complete?: boolean | null
        }
        Update: {
          booking_type?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          end_time?: string
          id?: string
          industry?: string
          notes?: string | null
          offline_queued?: boolean | null
          resource_id?: string | null
          resource_name?: string
          resource_type?: string
          start_time?: string
          status?: string
          token_reward_on_complete?: number | null
          updated_at?: string
          vneid_hash?: string | null
          voucher_discount?: number | null
          voucher_on_complete?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          answer: string
          citations: Json | null
          company_id: string
          created_at: string
          folder: string | null
          id: string
          is_shared: boolean | null
          message_id: string | null
          notes: string | null
          question: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: string
          citations?: Json | null
          company_id: string
          created_at?: string
          folder?: string | null
          id?: string
          is_shared?: boolean | null
          message_id?: string | null
          notes?: string | null
          question: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string
          citations?: Json | null
          company_id?: string
          created_at?: string
          folder?: string | null
          id?: string
          is_shared?: boolean | null
          message_id?: string | null
          notes?: string | null
          question?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      career_levels: {
        Row: {
          badge_icon: string | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          level_order: number
          min_xp: number
          name: string
          path_id: string
          perks: Json | null
          updated_at: string
        }
        Insert: {
          badge_icon?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level_order?: number
          min_xp?: number
          name: string
          path_id: string
          perks?: Json | null
          updated_at?: string
        }
        Update: {
          badge_icon?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level_order?: number
          min_xp?: number
          name?: string
          path_id?: string
          perks?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_levels_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      career_paths: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_paths_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_type: string
          balance: number | null
          code: string
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_type: string
          balance?: number | null
          code: string
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string
          balance?: number | null
          code?: string
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          citations: Json | null
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          citations?: Json | null
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          citations?: Json | null
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_report_sessions: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          messages: Json
          parsed_tasks: Json
          report_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          messages?: Json
          parsed_tasks?: Json
          report_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          messages?: Json
          parsed_tasks?: Json
          report_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_report_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_report_sessions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "work_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          company_id: string
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_alerts: {
        Row: {
          alert_type: string
          company_id: string
          created_at: string
          due_date: string | null
          employee_id: string | null
          id: string
          message: string | null
          reference_id: string | null
          reference_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          company_id: string
          created_at?: string
          due_date?: string | null
          employee_id?: string | null
          id?: string
          message?: string | null
          reference_id?: string | null
          reference_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          company_id?: string
          created_at?: string
          due_date?: string | null
          employee_id?: string | null
          id?: string
          message?: string | null
          reference_id?: string | null
          reference_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_milestones: {
        Row: {
          amount: number | null
          completed_at: string | null
          contract_id: string
          created_at: string
          due_date: string | null
          id: string
          milestone_name: string
          milestone_order: number
          status: string
          token_issue_amount: number | null
        }
        Insert: {
          amount?: number | null
          completed_at?: string | null
          contract_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          milestone_name: string
          milestone_order?: number
          status?: string
          token_issue_amount?: number | null
        }
        Update: {
          amount?: number | null
          completed_at?: string | null
          contract_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          milestone_name?: string
          milestone_order?: number
          status?: string
          token_issue_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "smart_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_groups: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string
          description: string | null
          discount_percent: number | null
          id: string
          is_active: boolean | null
          min_total_orders: number | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          min_total_orders?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          min_total_orders?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          content: string
          created_at: string
          follow_up_date: string | null
          id: string
          is_resolved: boolean | null
          note_type: string
          partner_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          is_resolved?: boolean | null
          note_type?: string
          partner_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          is_resolved?: boolean | null
          note_type?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      data_mappings: {
        Row: {
          company_id: string
          created_at: string
          entity_type: string
          field_mappings: Json | null
          from_system: string
          id: string
          is_default: boolean | null
          to_system: string
          transformation_rules: Json | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          entity_type: string
          field_mappings?: Json | null
          from_system: string
          id?: string
          is_default?: boolean | null
          to_system: string
          transformation_rules?: Json | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          entity_type?: string
          field_mappings?: Json | null
          from_system?: string
          id?: string
          is_default?: boolean | null
          to_system?: string
          transformation_rules?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_mappings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      data_quality_issues: {
        Row: {
          company_id: string
          created_at: string
          field_name: string | null
          id: string
          issue_type: string
          message: string
          raw_event_id: string | null
          resolved_at: string | null
          severity: string
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string
          field_name?: string | null
          id?: string
          issue_type: string
          message: string
          raw_event_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          field_name?: string | null
          id?: string
          issue_type?: string
          message?: string
          raw_event_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_quality_issues_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_quality_issues_raw_event_id_fkey"
            columns: ["raw_event_id"]
            isOneToOne: false
            referencedRelation: "raw_events"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          channel_id: string | null
          code: string
          company_id: string
          config: Json
          created_at: string
          created_by: string | null
          id: string
          last_error: string | null
          last_ingested_at: string | null
          mapping: Json
          name: string
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          channel_id?: string | null
          code: string
          company_id: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          last_error?: string | null
          last_ingested_at?: string | null
          mapping?: Json
          name: string
          source_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          channel_id?: string | null
          code?: string
          company_id?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          last_error?: string | null
          last_ingested_at?: string | null
          mapping?: Json
          name?: string
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "sales_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_resolution_links: {
        Row: {
          company_id: string
          confidence: number
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          match_strategy: string | null
          matched_table: string
          raw_event_id: string | null
        }
        Insert: {
          company_id: string
          confidence?: number
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          match_strategy?: string | null
          matched_table: string
          raw_event_id?: string | null
        }
        Update: {
          company_id?: string
          confidence?: number
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          match_strategy?: string | null
          matched_table?: string
          raw_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_resolution_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_resolution_links_raw_event_id_fkey"
            columns: ["raw_event_id"]
            isOneToOne: false
            referencedRelation: "raw_events"
            referencedColumns: ["id"]
          },
        ]
      }
      directives: {
        Row: {
          assigned_manager_id: string | null
          company_id: string
          content: string | null
          created_at: string
          deadline: string | null
          escalation_count: number
          id: string
          issued_by: string
          kpi_targets: Json | null
          project_id: string | null
          source_data: Json | null
          source_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_manager_id?: string | null
          company_id: string
          content?: string | null
          created_at?: string
          deadline?: string | null
          escalation_count?: number
          id?: string
          issued_by: string
          kpi_targets?: Json | null
          project_id?: string | null
          source_data?: Json | null
          source_type?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_manager_id?: string | null
          company_id?: string
          content?: string | null
          created_at?: string
          deadline?: string | null
          escalation_count?: number
          id?: string
          issued_by?: string
          kpi_targets?: Json | null
          project_id?: string | null
          source_data?: Json | null
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "directives_assigned_manager_id_fkey"
            columns: ["assigned_manager_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          id: string
          page_number: number | null
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          id?: string
          page_number?: number | null
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          page_number?: number | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_embeddings: {
        Row: {
          chunk_id: string
          created_at: string
          embedding: string | null
          embedding_vector: string | null
          id: string
        }
        Insert: {
          chunk_id: string
          created_at?: string
          embedding?: string | null
          embedding_vector?: string | null
          id?: string
        }
        Update: {
          chunk_id?: string
          created_at?: string
          embedding?: string | null
          embedding_vector?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: true
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      document_history: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          document_id: string
          id: string
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          document_id: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          document_id?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          chunk_count: number | null
          company_id: string
          created_at: string
          error_message: string | null
          expiry_date: string | null
          extracted_metadata: Json | null
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          name: string
          project_id: string | null
          status: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          chunk_count?: number | null
          company_id: string
          created_at?: string
          error_message?: string | null
          expiry_date?: string | null
          extracted_metadata?: Json | null
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          name: string
          project_id?: string | null
          status?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          chunk_count?: number | null
          company_id?: string
          created_at?: string
          error_message?: string | null
          expiry_date?: string | null
          extracted_metadata?: Json | null
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          name?: string
          project_id?: string | null
          status?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          created_at: string
          document_failed: boolean | null
          document_processed: boolean | null
          email_enabled: boolean | null
          frequency: string | null
          id: string
          updated_at: string
          user_id: string
          weekly_trending: boolean | null
        }
        Insert: {
          created_at?: string
          document_failed?: boolean | null
          document_processed?: boolean | null
          email_enabled?: boolean | null
          frequency?: string | null
          id?: string
          updated_at?: string
          user_id: string
          weekly_trending?: boolean | null
        }
        Update: {
          created_at?: string
          document_failed?: boolean | null
          document_processed?: boolean | null
          email_enabled?: boolean | null
          frequency?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          weekly_trending?: boolean | null
        }
        Relationships: []
      }
      embedding_cache: {
        Row: {
          created_at: string | null
          embedding: string
          id: string
          last_used_at: string | null
          text_hash: string
          use_count: number | null
        }
        Insert: {
          created_at?: string | null
          embedding: string
          id?: string
          last_used_at?: string | null
          text_hash: string
          use_count?: number | null
        }
        Update: {
          created_at?: string | null
          embedding?: string
          id?: string
          last_used_at?: string | null
          text_hash?: string
          use_count?: number | null
        }
        Relationships: []
      }
      employee_contracts: {
        Row: {
          company_id: string
          contract_number: string | null
          contract_type: string
          created_at: string
          created_by: string | null
          employee_id: string
          end_date: string | null
          id: string
          notes: string | null
          salary_amount: number | null
          salary_currency: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          contract_number?: string | null
          contract_type?: string
          created_at?: string
          created_by?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          notes?: string | null
          salary_amount?: number | null
          salary_currency?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          contract_number?: string | null
          contract_type?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          salary_amount?: number | null
          salary_currency?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profiles: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          company_id: string
          created_at: string
          current_address: string | null
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string
          gender: string | null
          id: string
          id_issued_date: string | null
          id_issued_place: string | null
          id_number: string | null
          permanent_address: string | null
          personal_email: string | null
          social_insurance_number: string | null
          tax_code: string | null
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          company_id: string
          created_at?: string
          current_address?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id: string
          gender?: string | null
          id?: string
          id_issued_date?: string | null
          id_issued_place?: string | null
          id_number?: string | null
          permanent_address?: string | null
          personal_email?: string | null
          social_insurance_number?: string | null
          tax_code?: string | null
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          company_id?: string
          created_at?: string
          current_address?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string
          gender?: string | null
          id?: string
          id_issued_date?: string | null
          id_issued_place?: string | null
          id_number?: string | null
          permanent_address?: string | null
          personal_email?: string | null
          social_insurance_number?: string | null
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_transfers: {
        Row: {
          approval_request_id: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          effective_date: string
          employee_id: string
          from_org_unit_id: string | null
          from_position_id: string | null
          from_title: string | null
          id: string
          reason: string | null
          status: string
          to_org_unit_id: string | null
          to_position_id: string | null
          to_title: string | null
          transfer_type: string
          updated_at: string
        }
        Insert: {
          approval_request_id?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          effective_date?: string
          employee_id: string
          from_org_unit_id?: string | null
          from_position_id?: string | null
          from_title?: string | null
          id?: string
          reason?: string | null
          status?: string
          to_org_unit_id?: string | null
          to_position_id?: string | null
          to_title?: string | null
          transfer_type?: string
          updated_at?: string
        }
        Update: {
          approval_request_id?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          effective_date?: string
          employee_id?: string
          from_org_unit_id?: string | null
          from_position_id?: string | null
          from_title?: string | null
          id?: string
          reason?: string | null
          status?: string
          to_org_unit_id?: string | null
          to_position_id?: string | null
          to_title?: string | null
          transfer_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_transfers_approval_request_id_fkey"
            columns: ["approval_request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_transfers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_transfers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_transfers_from_org_unit_id_fkey"
            columns: ["from_org_unit_id"]
            isOneToOne: false
            referencedRelation: "perf_org_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_transfers_from_position_id_fkey"
            columns: ["from_position_id"]
            isOneToOne: false
            referencedRelation: "perf_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_transfers_to_org_unit_id_fkey"
            columns: ["to_org_unit_id"]
            isOneToOne: false
            referencedRelation: "perf_org_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_transfers_to_position_id_fkey"
            columns: ["to_position_id"]
            isOneToOne: false
            referencedRelation: "perf_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean | null
          project_id: string | null
          share_to_token: number
          token_to_vnd: number
          vnd_to_token: number
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          share_to_token?: number
          token_to_vnd?: number
          vnd_to_token?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          share_to_token?: number
          token_to_vnd?: number
          vnd_to_token?: number
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_rates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_360: {
        Row: {
          anonymized_content: string | null
          employee_id: string
          id: string
          is_processed: boolean | null
          processed_at: string | null
          raw_content: string | null
          relationship_type: string
          reviewer_id: string | null
          season_id: string
          sentiment: string | null
          submitted_at: string | null
        }
        Insert: {
          anonymized_content?: string | null
          employee_id: string
          id?: string
          is_processed?: boolean | null
          processed_at?: string | null
          raw_content?: string | null
          relationship_type: string
          reviewer_id?: string | null
          season_id: string
          sentiment?: string | null
          submitted_at?: string | null
        }
        Update: {
          anonymized_content?: string | null
          employee_id?: string
          id?: string
          is_processed?: boolean | null
          processed_at?: string | null
          raw_content?: string | null
          relationship_type?: string
          reviewer_id?: string | null
          season_id?: string
          sentiment?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_360_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_360_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "kpi_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry: string
          is_active: boolean | null
          name: string
          template_data: Json
          template_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry: string
          is_active?: boolean | null
          name: string
          template_data?: Json
          template_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string
          is_active?: boolean | null
          name?: string
          template_data?: Json
          template_type?: string
        }
        Relationships: []
      }
      integration_configs: {
        Row: {
          client_id: string | null
          client_secret_hash: string | null
          company_id: string
          created_at: string
          data_mapping: Json | null
          id: string
          is_active: boolean | null
          last_sync: string | null
          partner_name: string
          partner_type: string
          sync_frequency: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          client_id?: string | null
          client_secret_hash?: string | null
          company_id: string
          created_at?: string
          data_mapping?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          partner_name: string
          partner_type: string
          sync_frequency?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          client_id?: string | null
          client_secret_hash?: string | null
          company_id?: string
          created_at?: string
          data_mapping?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          partner_name?: string
          partner_type?: string
          sync_frequency?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_queue: {
        Row: {
          action_type: string
          company_id: string
          created_at: string
          error_message: string | null
          id: string
          partner_type: string
          payload: Json
          processed_at: string | null
          retry_count: number | null
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action_type: string
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          partner_type: string
          payload: Json
          processed_at?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          partner_type?: string
          payload?: Json
          processed_at?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          ai_analysis: Json | null
          ai_score: number | null
          candidate_email: string | null
          candidate_name: string
          candidate_phone: string | null
          company_id: string
          created_at: string
          cv_url: string | null
          id: string
          interview_date: string | null
          notes: string | null
          posting_id: string
          status: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: Json | null
          ai_score?: number | null
          candidate_email?: string | null
          candidate_name: string
          candidate_phone?: string | null
          company_id: string
          created_at?: string
          cv_url?: string | null
          id?: string
          interview_date?: string | null
          notes?: string | null
          posting_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: Json | null
          ai_score?: number | null
          candidate_email?: string | null
          candidate_name?: string
          candidate_phone?: string | null
          company_id?: string
          created_at?: string
          cv_url?: string | null
          id?: string
          interview_date?: string | null
          notes?: string | null
          posting_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_posting_id_fkey"
            columns: ["posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          id: string
          location: string | null
          requirements: Json | null
          salary_range: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          location?: string | null
          requirements?: Json | null
          salary_range?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          location?: string | null
          requirements?: Json | null
          salary_range?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          entry_date: string
          id: string
          posted_by: string | null
          source_id: string | null
          source_type: string | null
          status: string | null
          updated_at: string | null
          vneid_signature: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          posted_by?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          updated_at?: string | null
          vneid_signature?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          posted_by?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          updated_at?: string | null
          vneid_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          asset_type: string | null
          created_at: string | null
          credit: number | null
          debit: number | null
          entry_id: string
          id: string
          memo: string | null
        }
        Insert: {
          account_id: string
          asset_type?: string | null
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          entry_id: string
          id?: string
          memo?: string | null
        }
        Update: {
          account_id?: string
          asset_type?: string | null
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          entry_id?: string
          id?: string
          memo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_metrics: {
        Row: {
          calculation_type: string | null
          category: string
          created_at: string
          description: string | null
          evaluation_type: string
          formula: Json | null
          id: string
          is_required: boolean
          max_value: number | null
          min_value: number | null
          name: string
          org_unit_id: string | null
          rubric: Json | null
          season_id: string
          sort_order: number
          target_value: number | null
          unit: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          calculation_type?: string | null
          category: string
          created_at?: string
          description?: string | null
          evaluation_type?: string
          formula?: Json | null
          id?: string
          is_required?: boolean
          max_value?: number | null
          min_value?: number | null
          name: string
          org_unit_id?: string | null
          rubric?: Json | null
          season_id: string
          sort_order?: number
          target_value?: number | null
          unit?: string | null
          updated_at?: string
          weight?: number
        }
        Update: {
          calculation_type?: string | null
          category?: string
          created_at?: string
          description?: string | null
          evaluation_type?: string
          formula?: Json | null
          id?: string
          is_required?: boolean
          max_value?: number | null
          min_value?: number | null
          name?: string
          org_unit_id?: string | null
          rubric?: Json | null
          season_id?: string
          sort_order?: number
          target_value?: number | null
          unit?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_metrics_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "perf_org_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_metrics_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "kpi_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_seasons: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          is_locked: boolean
          name: string
          review_deadline: string | null
          scoring_deadline: string | null
          start_date: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          is_locked?: boolean
          name: string
          review_deadline?: string | null
          scoring_deadline?: string | null
          start_date: string
          type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          is_locked?: boolean
          name?: string
          review_deadline?: string | null
          scoring_deadline?: string | null
          start_date?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_seasons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_snapshots: {
        Row: {
          company_id: string
          created_at: string
          id: string
          org_unit_id: string | null
          period_end: string
          period_start: string
          period_type: string
          rankings: Json
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          org_unit_id?: string | null
          period_end: string
          period_start: string
          period_type: string
          rankings?: Json
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          org_unit_id?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          rankings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_snapshots_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "perf_org_units"
            referencedColumns: ["id"]
          },
        ]
      }
      level_requirements: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_mandatory: boolean | null
          level_id: string
          requirement_type: string
          requirement_value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          level_id: string
          requirement_type: string
          requirement_value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          level_id?: string
          requirement_type?: string
          requirement_value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "level_requirements_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "career_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          partner_id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          partner_id: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          partner_id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklists: {
        Row: {
          company_id: string
          completed_count: number
          created_at: string
          employee_id: string
          id: string
          is_completed: boolean
          items: Json
          total_count: number
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_count?: number
          created_at?: string
          employee_id: string
          id?: string
          is_completed?: boolean
          items?: Json
          total_count?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_count?: number
          created_at?: string
          employee_id?: string
          id?: string
          is_completed?: boolean
          items?: Json
          total_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          discount: number | null
          id: string
          order_id: string
          product_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount?: number | null
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount?: number | null
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_returns: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_id: string
          platform_source: Database["public"]["Enums"]["platform_source"]
          reason: string | null
          refund_amount: number | null
          return_items: Json | null
          return_type: string
          shipment_id: string | null
          status: Database["public"]["Enums"]["return_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id: string
          platform_source?: Database["public"]["Enums"]["platform_source"]
          reason?: string | null
          refund_amount?: number | null
          return_items?: Json | null
          return_type?: string
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["return_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          platform_source?: Database["public"]["Enums"]["platform_source"]
          reason?: string | null
          refund_amount?: number | null
          return_items?: Json | null
          return_type?: string
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["return_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_returns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_returns_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          cancelled_reason: string | null
          channel_id: string | null
          company_id: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          discount: number | null
          external_created_at: string | null
          id: string
          internal_notes: string | null
          last_synced_at: string | null
          notes: string | null
          order_date: string
          order_number: string
          order_type: Database["public"]["Enums"]["order_type"]
          paid_amount: number | null
          partner_id: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          platform_data: Json | null
          platform_order_id: string | null
          platform_status: string | null
          priority: string
          shipped_at: string | null
          shipping_address: string | null
          shipping_district: string | null
          shipping_fee: number | null
          shipping_province: string | null
          shipping_ward: string | null
          shipping_zone_id: string | null
          source_type: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number | null
          total: number | null
          updated_at: string
          voucher_discount: number | null
          voucher_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          channel_id?: string | null
          company_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          discount?: number | null
          external_created_at?: string | null
          id?: string
          internal_notes?: string | null
          last_synced_at?: string | null
          notes?: string | null
          order_date?: string
          order_number: string
          order_type?: Database["public"]["Enums"]["order_type"]
          paid_amount?: number | null
          partner_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          platform_data?: Json | null
          platform_order_id?: string | null
          platform_status?: string | null
          priority?: string
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_district?: string | null
          shipping_fee?: number | null
          shipping_province?: string | null
          shipping_ward?: string | null
          shipping_zone_id?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          total?: number | null
          updated_at?: string
          voucher_discount?: number | null
          voucher_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          channel_id?: string | null
          company_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          discount?: number | null
          external_created_at?: string | null
          id?: string
          internal_notes?: string | null
          last_synced_at?: string | null
          notes?: string | null
          order_date?: string
          order_number?: string
          order_type?: Database["public"]["Enums"]["order_type"]
          paid_amount?: number | null
          partner_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          platform_data?: Json | null
          platform_order_id?: string | null
          platform_status?: string | null
          priority?: string
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_district?: string | null
          shipping_fee?: number | null
          shipping_province?: string | null
          shipping_ward?: string | null
          shipping_zone_id?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          total?: number | null
          updated_at?: string
          voucher_discount?: number | null
          voucher_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "sales_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_zone_id_fkey"
            columns: ["shipping_zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          code: string
          company_id: string | null
          created_at: string
          debt_amount: number | null
          email: string | null
          group_id: string | null
          id: string
          is_active: boolean | null
          loyalty_points: number | null
          name: string
          notes: string | null
          partner_type: Database["public"]["Enums"]["partner_type"]
          phone: string | null
          tax_id: string | null
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          company_id?: string | null
          created_at?: string
          debt_amount?: number | null
          email?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          name: string
          notes?: string | null
          partner_type?: Database["public"]["Enums"]["partner_type"]
          phone?: string | null
          tax_id?: string | null
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          company_id?: string | null
          created_at?: string
          debt_amount?: number | null
          email?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          partner_type?: Database["public"]["Enums"]["partner_type"]
          phone?: string | null
          tax_id?: string | null
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateway_config: {
        Row: {
          company_id: string
          config: Json
          created_at: string
          gateway_type: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          company_id: string
          config?: Json
          created_at?: string
          gateway_type?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          company_id?: string
          config?: Json
          created_at?: string
          gateway_type?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_gateway_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_id: string | null
          partner_id: string
          payment_method: string | null
          reference_number: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          partner_id: string
          payment_method?: string | null
          reference_number?: string | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          partner_id?: string
          payment_method?: string | null
          reference_number?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          account_holder: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          bank_account: string | null
          bank_name: string | null
          company_id: string
          created_at: string
          ewallet_phone: string | null
          ewallet_type: string | null
          exchange_rate: number | null
          id: string
          notes: string | null
          payout_type: string
          processed_at: string | null
          reference_id: string | null
          rejection_reason: string | null
          status: string
          token_amount: number | null
          updated_at: string
          user_id: string
          vneid_verified: boolean | null
        }
        Insert: {
          account_holder?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          bank_account?: string | null
          bank_name?: string | null
          company_id: string
          created_at?: string
          ewallet_phone?: string | null
          ewallet_type?: string | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          payout_type?: string
          processed_at?: string | null
          reference_id?: string | null
          rejection_reason?: string | null
          status?: string
          token_amount?: number | null
          updated_at?: string
          user_id: string
          vneid_verified?: boolean | null
        }
        Update: {
          account_holder?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_account?: string | null
          bank_name?: string | null
          company_id?: string
          created_at?: string
          ewallet_phone?: string | null
          ewallet_type?: string | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          payout_type?: string
          processed_at?: string | null
          reference_id?: string | null
          rejection_reason?: string | null
          status?: string
          token_amount?: number | null
          updated_at?: string
          user_id?: string
          vneid_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          base_salary: number
          created_at: string
          employee_id: string
          gross_salary: number
          id: string
          insurance_deduction: number | null
          kpi_bonus: number | null
          net_salary: number
          notes: string | null
          other_bonuses: number | null
          other_deductions: number | null
          overtime_hours: number | null
          overtime_pay: number | null
          payroll_run_id: string
          standard_days: number
          tax_deduction: number | null
          worked_days: number
        }
        Insert: {
          base_salary?: number
          created_at?: string
          employee_id: string
          gross_salary?: number
          id?: string
          insurance_deduction?: number | null
          kpi_bonus?: number | null
          net_salary?: number
          notes?: string | null
          other_bonuses?: number | null
          other_deductions?: number | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          payroll_run_id: string
          standard_days?: number
          tax_deduction?: number | null
          worked_days?: number
        }
        Update: {
          base_salary?: number
          created_at?: string
          employee_id?: string
          gross_salary?: number
          id?: string
          insurance_deduction?: number | null
          kpi_bonus?: number | null
          net_salary?: number
          notes?: string | null
          other_bonuses?: number | null
          other_deductions?: number | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          payroll_run_id?: string
          standard_days?: number
          tax_deduction?: number | null
          worked_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          period_month: number
          period_year: number
          status: string
          total_employees: number | null
          total_net_salary: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          status?: string
          total_employees?: number | null
          total_net_salary?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          status?: string
          total_employees?: number | null
          total_net_salary?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      perf_employees: {
        Row: {
          avatar_frame: string | null
          career_path_id: string | null
          company_id: string
          created_at: string
          current_level_id: string | null
          current_streak: number
          hire_date: string | null
          id: string
          is_active: boolean
          longest_streak: number
          org_unit_id: string | null
          position_id: string | null
          title: string | null
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_frame?: string | null
          career_path_id?: string | null
          company_id: string
          created_at?: string
          current_level_id?: string | null
          current_streak?: number
          hire_date?: string | null
          id?: string
          is_active?: boolean
          longest_streak?: number
          org_unit_id?: string | null
          position_id?: string | null
          title?: string | null
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_frame?: string | null
          career_path_id?: string | null
          company_id?: string
          created_at?: string
          current_level_id?: string | null
          current_streak?: number
          hire_date?: string | null
          id?: string
          is_active?: boolean
          longest_streak?: number
          org_unit_id?: string | null
          position_id?: string | null
          title?: string | null
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_perf_employees_position"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "perf_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perf_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perf_employees_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "perf_org_units"
            referencedColumns: ["id"]
          },
        ]
      }
      perf_org_units: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          evaluation_mode: string
          icon: string | null
          id: string
          is_active: boolean
          kbif_weights: Json
          level_order: number
          manager_id: string | null
          name: string
          parent_id: string | null
          qualitative_criteria: Json | null
          report_routing: Json | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          evaluation_mode?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          kbif_weights?: Json
          level_order?: number
          manager_id?: string | null
          name: string
          parent_id?: string | null
          qualitative_criteria?: Json | null
          report_routing?: Json | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          evaluation_mode?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          kbif_weights?: Json
          level_order?: number
          manager_id?: string | null
          name?: string
          parent_id?: string | null
          qualitative_criteria?: Json | null
          report_routing?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "perf_org_units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perf_org_units_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "perf_org_units"
            referencedColumns: ["id"]
          },
        ]
      }
      perf_positions: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          level_order: number
          min_xp: number
          name: string
          org_unit_id: string | null
          requirements: Json | null
          responsibilities: Json | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          level_order?: number
          min_xp?: number
          name: string
          org_unit_id?: string | null
          requirements?: Json | null
          responsibilities?: Json | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          level_order?: number
          min_xp?: number
          name?: string
          org_unit_id?: string | null
          requirements?: Json | null
          responsibilities?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "perf_positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perf_positions_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "perf_org_units"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_onboarding: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          imported_employees: number | null
          is_completed: boolean | null
          kbif_config: Json | null
          org_structure: Json | null
          selected_industry: string | null
          selected_templates: Json | null
          step_completed: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          imported_employees?: number | null
          is_completed?: boolean | null
          kbif_config?: Json | null
          org_structure?: Json | null
          selected_industry?: string | null
          selected_templates?: Json | null
          step_completed?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          imported_employees?: number | null
          is_completed?: boolean | null
          kbif_config?: Json | null
          org_structure?: Json | null
          selected_industry?: string | null
          selected_templates?: Json | null
          step_completed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_onboarding_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_policies: {
        Row: {
          allowed_actions: string[] | null
          company_id: string
          conditions: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          policy_type: string
          requires_step_up: boolean | null
          requires_vneid: boolean | null
          updated_at: string
        }
        Insert: {
          allowed_actions?: string[] | null
          company_id: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          policy_type?: string
          requires_step_up?: boolean | null
          requires_vneid?: boolean | null
          updated_at?: string
        }
        Update: {
          allowed_actions?: string[] | null
          company_id?: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          policy_type?: string
          requires_step_up?: boolean | null
          requires_vneid?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_recommendations: {
        Row: {
          category: string
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          employee_id: string | null
          id: string
          org_unit_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          season_id: string | null
          status: string
          supporting_data: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          org_unit_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          season_id?: string | null
          status?: string
          supporting_data?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          org_unit_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          season_id?: string | null
          status?: string
          supporting_data?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_recommendations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_recommendations_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "perf_org_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_recommendations_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "kpi_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      position_skill_requirements: {
        Row: {
          created_at: string
          id: string
          is_mandatory: boolean | null
          position_id: string
          required_level: number | null
          skill_node_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_mandatory?: boolean | null
          position_id: string
          required_level?: number | null
          skill_node_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_mandatory?: boolean | null
          position_id?: string
          required_level?: number | null
          skill_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_skill_requirements_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "perf_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_skill_requirements_skill_node_id_fkey"
            columns: ["skill_node_id"]
            isOneToOne: false
            referencedRelation: "skill_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bom: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          material_id: string
          notes: string | null
          product_id: string
          quantity: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          material_id: string
          notes?: string | null
          product_id: string
          quantity?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          material_id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_bom_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bom_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_mappings: {
        Row: {
          channel_id: string
          channel_price: number | null
          channel_product_name: string | null
          channel_sku: string
          created_at: string
          id: string
          is_active: boolean | null
          product_id: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          channel_price?: number | null
          channel_product_name?: string | null
          channel_sku: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          channel_price?: number | null
          channel_product_name?: string | null
          channel_sku?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_mappings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "sales_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_mappings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          cost_price: number | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          product_id: string
          selling_price: number | null
          sku: string
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          attributes?: Json
          cost_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          product_id: string
          selling_price?: number | null
          sku: string
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          attributes?: Json
          cost_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          product_id?: string
          selling_price?: number | null
          sku?: string
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_id: string | null
          planned_end: string | null
          planned_start: string | null
          product_id: string
          production_number: string
          quantity: number
          status: string
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          planned_end?: string | null
          planned_start?: string | null
          product_id: string
          production_number: string
          quantity?: number
          status?: string
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          planned_end?: string | null
          planned_start?: string | null
          product_id?: string
          production_number?: string
          quantity?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          avg_daily_sales: number | null
          category: string | null
          company_id: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          has_variants: boolean | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_service: boolean | null
          lead_time_days: number | null
          min_stock: number | null
          name: string
          reorder_point: number | null
          selling_price: number | null
          sku: string
          stock_quantity: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          avg_daily_sales?: number | null
          category?: string | null
          company_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          has_variants?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_service?: boolean | null
          lead_time_days?: number | null
          min_stock?: number | null
          name: string
          reorder_point?: number | null
          selling_price?: number | null
          sku: string
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          avg_daily_sales?: number | null
          category?: string | null
          company_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          has_variants?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_service?: boolean | null
          lead_time_days?: number | null
          min_stock?: number | null
          name?: string
          reorder_point?: number | null
          selling_price?: number | null
          sku?: string
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          allocated_hours: number | null
          employee_id: string
          id: string
          joined_at: string
          permissions: Json | null
          project_id: string
          role: string
        }
        Insert: {
          allocated_hours?: number | null
          employee_id: string
          id?: string
          joined_at?: string
          permissions?: Json | null
          project_id: string
          role?: string
        }
        Update: {
          allocated_hours?: number | null
          employee_id?: string
          id?: string
          joined_at?: string
          permissions?: Json | null
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_shares: {
        Row: {
          company_id: string
          created_at: string
          holder_user_id: string
          id: string
          is_vested: boolean | null
          project_id: string
          share_count: number
          share_type: string
          updated_at: string
          vesting_end: string | null
          vesting_start: string | null
          vneid_hash: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          holder_user_id: string
          id?: string
          is_vested?: boolean | null
          project_id: string
          share_count?: number
          share_type?: string
          updated_at?: string
          vesting_end?: string | null
          vesting_start?: string | null
          vneid_hash?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          holder_user_id?: string
          id?: string
          is_vested?: boolean | null
          project_id?: string
          share_count?: number
          share_type?: string
          updated_at?: string
          vesting_end?: string | null
          vesting_start?: string | null
          vneid_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_shares_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_shares_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          code: string
          company_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          manager_id: string | null
          name: string
          org_unit_id: string | null
          priority: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          code: string
          company_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name: string
          org_unit_id?: string | null
          priority?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          code?: string
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          org_unit_id?: string | null
          priority?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "perf_org_units"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_quests: {
        Row: {
          created_at: string
          id: string
          is_mandatory: boolean | null
          level_id: string
          quest_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_mandatory?: boolean | null
          level_id: string
          quest_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_mandatory?: boolean | null
          level_id?: string
          quest_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_quests_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "career_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          purchase_order_id: string
          quantity?: number
          received_quantity?: number | null
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          discount: number | null
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          status: string
          subtotal: number | null
          supplier_id: string | null
          total: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          discount?: number | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number: string
          status?: string
          subtotal?: number | null
          supplier_id?: string | null
          total?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          discount?: number | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          status?: string
          subtotal?: number | null
          supplier_id?: string | null
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_progress: {
        Row: {
          completed_at: string | null
          completion_count: number | null
          current_progress: Json | null
          employee_id: string
          id: string
          is_completed: boolean | null
          quest_id: string
          started_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completion_count?: number | null
          current_progress?: Json | null
          employee_id: string
          id?: string
          is_completed?: boolean | null
          quest_id: string
          started_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completion_count?: number | null
          current_progress?: Json | null
          employee_id?: string
          id?: string
          is_completed?: boolean | null
          quest_id?: string
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_progress_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          achievement_reward_id: string | null
          company_id: string
          conditions: Json
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          max_completions: number | null
          name: string
          quest_type: string
          start_date: string | null
          updated_at: string
          xp_reward: number | null
        }
        Insert: {
          achievement_reward_id?: string | null
          company_id: string
          conditions?: Json
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_completions?: number | null
          name: string
          quest_type: string
          start_date?: string | null
          updated_at?: string
          xp_reward?: number | null
        }
        Update: {
          achievement_reward_id?: string | null
          company_id?: string
          conditions?: Json
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_completions?: number | null
          name?: string
          quest_type?: string
          start_date?: string | null
          updated_at?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quests_achievement_reward_id_fkey"
            columns: ["achievement_reward_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          created_at: string
          discount: number | null
          id: string
          product_id: string
          quantity: number
          quotation_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount?: number | null
          id?: string
          product_id: string
          quantity?: number
          quotation_id: string
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          discount?: number | null
          id?: string
          product_id?: string
          quantity?: number
          quotation_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          company_id: string
          converted_order_id: string | null
          created_at: string
          created_by: string | null
          discount: number | null
          id: string
          notes: string | null
          partner_id: string | null
          quotation_number: string
          status: string
          subtotal: number | null
          total: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          company_id: string
          converted_order_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          partner_id?: string | null
          quotation_number: string
          status?: string
          subtotal?: number | null
          total?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          company_id?: string
          converted_order_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          partner_id?: string | null
          quotation_number?: string
          status?: string
          subtotal?: number | null
          total?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_converted_order_id_fkey"
            columns: ["converted_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_notifications: {
        Row: {
          company_id: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rag_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      report_metric_values: {
        Row: {
          actual_value: number | null
          created_at: string
          evidence_urls: Json | null
          id: string
          metric_id: string
          notes: string | null
          report_id: string
          target_value: number | null
          unit: string | null
        }
        Insert: {
          actual_value?: number | null
          created_at?: string
          evidence_urls?: Json | null
          id?: string
          metric_id: string
          notes?: string | null
          report_id: string
          target_value?: number | null
          unit?: string | null
        }
        Update: {
          actual_value?: number | null
          created_at?: string
          evidence_urls?: Json | null
          id?: string
          metric_id?: string
          notes?: string | null
          report_id?: string
          target_value?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_metric_values_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "kpi_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_metric_values_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "work_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_events: {
        Row: {
          company_id: string
          created_at: string
          data_source_id: string | null
          dedupe_key: string | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          event_type: string
          external_id: string | null
          id: string
          ingestion_status: string
          normalized_payload: Json
          occurred_at: string
          processed_at: string | null
          quality_score: number
          raw_payload: Json
          received_at: string
          source_code: string | null
          source_type: string
          updated_at: string
          validation_status: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data_source_id?: string | null
          dedupe_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          event_type: string
          external_id?: string | null
          id?: string
          ingestion_status?: string
          normalized_payload?: Json
          occurred_at?: string
          processed_at?: string | null
          quality_score?: number
          raw_payload?: Json
          received_at?: string
          source_code?: string | null
          source_type?: string
          updated_at?: string
          validation_status?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data_source_id?: string | null
          dedupe_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          event_type?: string
          external_id?: string | null
          id?: string
          ingestion_status?: string
          normalized_payload?: Json
          occurred_at?: string
          processed_at?: string | null
          quality_score?: number
          raw_payload?: Json
          received_at?: string
          source_code?: string | null
          source_type?: string
          updated_at?: string
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_events_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_agent_config: {
        Row: {
          agent_name: string
          auto_create_order: boolean
          auto_create_quotation: boolean
          company_id: string
          created_at: string
          enabled_channels: string[] | null
          greeting: string | null
          handoff_keywords: string[] | null
          id: string
          is_active: boolean
          knowledge_doc_ids: string[] | null
          max_order_value: number
          persona: string | null
          updated_at: string
        }
        Insert: {
          agent_name?: string
          auto_create_order?: boolean
          auto_create_quotation?: boolean
          company_id: string
          created_at?: string
          enabled_channels?: string[] | null
          greeting?: string | null
          handoff_keywords?: string[] | null
          id?: string
          is_active?: boolean
          knowledge_doc_ids?: string[] | null
          max_order_value?: number
          persona?: string | null
          updated_at?: string
        }
        Update: {
          agent_name?: string
          auto_create_order?: boolean
          auto_create_quotation?: boolean
          company_id?: string
          created_at?: string
          enabled_channels?: string[] | null
          greeting?: string | null
          handoff_keywords?: string[] | null
          id?: string
          is_active?: boolean
          knowledge_doc_ids?: string[] | null
          max_order_value?: number
          persona?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_channels: {
        Row: {
          access_token: string | null
          api_credentials: Json | null
          code: string
          color: string | null
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string
          platform_type: string | null
          refresh_token: string | null
          sync_enabled: boolean | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          api_credentials?: Json | null
          code: string
          color?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name: string
          platform_type?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          api_credentials?: Json | null
          code?: string
          color?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string
          platform_type?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_channels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_conversations: {
        Row: {
          agent_mode: string
          company_id: string
          created_at: string
          id: string
          lead_id: string | null
          session_token: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_mode?: string
          company_id: string
          created_at?: string
          id?: string
          lead_id?: string | null
          session_token?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_mode?: string
          company_id?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          session_token?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_leads: {
        Row: {
          assigned_to: string | null
          channel: string | null
          company_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          estimated_value: number
          id: string
          notes: string | null
          partner_id: string | null
          score: number
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          channel?: string | null
          company_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          estimated_value?: number
          id?: string
          notes?: string | null
          partner_id?: string | null
          score?: number
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          channel?: string | null
          company_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          estimated_value?: number
          id?: string
          notes?: string | null
          partner_id?: string | null
          score?: number
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          role: string
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "sales_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      score_evidence: {
        Row: {
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          score_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          score_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          score_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_evidence_score_id_fkey"
            columns: ["score_id"]
            isOneToOne: false
            referencedRelation: "staff_scores"
            referencedColumns: ["id"]
          },
        ]
      }
      search_queries: {
        Row: {
          company_id: string
          created_at: string
          id: string
          query: string
          query_embedding: string | null
          result_count: number | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          query: string
          query_embedding?: string | null
          result_count?: number | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          query?: string
          query_embedding?: string | null
          result_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_queries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      season_results: {
        Row: {
          b_score: number | null
          calculated_at: string | null
          created_at: string
          employee_id: string
          f_score: number | null
          i_score: number | null
          id: string
          k_score: number | null
          notes: string | null
          rank_in_company: number | null
          rank_in_org_unit: number | null
          season_id: string
          total_score: number | null
          updated_at: string
          xp_earned: number | null
        }
        Insert: {
          b_score?: number | null
          calculated_at?: string | null
          created_at?: string
          employee_id: string
          f_score?: number | null
          i_score?: number | null
          id?: string
          k_score?: number | null
          notes?: string | null
          rank_in_company?: number | null
          rank_in_org_unit?: number | null
          season_id: string
          total_score?: number | null
          updated_at?: string
          xp_earned?: number | null
        }
        Update: {
          b_score?: number | null
          calculated_at?: string | null
          created_at?: string
          employee_id?: string
          f_score?: number | null
          i_score?: number | null
          id?: string
          k_score?: number | null
          notes?: string | null
          rank_in_company?: number | null
          rank_in_org_unit?: number | null
          season_id?: string
          total_score?: number | null
          updated_at?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "season_results_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_results_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "kpi_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      sensitive_action_logs: {
        Row: {
          action_type: string
          approved: boolean | null
          company_id: string
          created_at: string
          id: string
          metadata: Json | null
          step_up_method: string | null
          user_id: string
          vneid_verified: boolean | null
        }
        Insert: {
          action_type: string
          approved?: boolean | null
          company_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          step_up_method?: string | null
          user_id: string
          vneid_verified?: boolean | null
        }
        Update: {
          action_type?: string
          approved?: boolean | null
          company_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          step_up_method?: string | null
          user_id?: string
          vneid_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sensitive_action_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier_id: string
          carrier_response: Json | null
          carrier_status: string | null
          cod_amount: number | null
          created_at: string
          estimated_delivery: string | null
          id: string
          label_url: string | null
          order_id: string
          pickup_address: string | null
          shipping_fee_actual: number | null
          tracking_code: string | null
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          carrier_id: string
          carrier_response?: Json | null
          carrier_status?: string | null
          cod_amount?: number | null
          created_at?: string
          estimated_delivery?: string | null
          id?: string
          label_url?: string | null
          order_id: string
          pickup_address?: string | null
          shipping_fee_actual?: number | null
          tracking_code?: string | null
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          carrier_id?: string
          carrier_response?: Json | null
          carrier_status?: string | null
          cod_amount?: number | null
          created_at?: string
          estimated_delivery?: string | null
          id?: string
          label_url?: string | null
          order_id?: string
          pickup_address?: string | null
          shipping_fee_actual?: number | null
          tracking_code?: string | null
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "shipping_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_carriers: {
        Row: {
          api_token: string | null
          code: string
          company_id: string
          config: Json | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          shop_id: string | null
          updated_at: string
        }
        Insert: {
          api_token?: string | null
          code: string
          company_id: string
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          shop_id?: string | null
          updated_at?: string
        }
        Update: {
          api_token?: string | null
          code?: string
          company_id?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          shop_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_carriers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          base_fee: number
          company_id: string | null
          created_at: string
          free_shipping_threshold: number | null
          id: string
          is_active: boolean | null
          name: string
          provinces: string[]
          updated_at: string
        }
        Insert: {
          base_fee?: number
          company_id?: string | null
          created_at?: string
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          provinces?: string[]
          updated_at?: string
        }
        Update: {
          base_fee?: number
          company_id?: string | null
          created_at?: string
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          provinces?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_zones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_settings: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "shop_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_categories: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_nodes: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_level: number | null
          name: string
          parent_node_id: string | null
          position_x: number | null
          position_y: number | null
          unlock_conditions: Json | null
          updated_at: string
          xp_per_level: number | null
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_level?: number | null
          name: string
          parent_node_id?: string | null
          position_x?: number | null
          position_y?: number | null
          unlock_conditions?: Json | null
          updated_at?: string
          xp_per_level?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_level?: number | null
          name?: string
          parent_node_id?: string | null
          position_x?: number | null
          position_y?: number | null
          unlock_conditions?: Json | null
          updated_at?: string
          xp_per_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_nodes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_nodes_parent_node_id_fkey"
            columns: ["parent_node_id"]
            isOneToOne: false
            referencedRelation: "skill_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_requirements: {
        Row: {
          created_at: string | null
          id: string
          is_mandatory: boolean | null
          position_id: string
          required_level: number | null
          skill_node_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          position_id: string
          required_level?: number | null
          skill_node_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          position_id?: string
          required_level?: number | null
          skill_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_requirements_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "perf_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_requirements_skill_node_id_fkey"
            columns: ["skill_node_id"]
            isOneToOne: false
            referencedRelation: "skill_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_contracts: {
        Row: {
          company_id: string
          content_template: Json | null
          contract_number: string
          contract_type: string
          created_at: string
          created_by: string | null
          id: string
          industry: string
          offline_hash: string | null
          partner_id: string | null
          project_id: string | null
          signed_at: string | null
          signer_user_id: string | null
          signer_vneid_hash: string | null
          status: string
          title: string
          token_auto_issue: boolean | null
          token_issue_percent: number | null
          total_value: number | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          variables: Json | null
        }
        Insert: {
          company_id: string
          content_template?: Json | null
          contract_number: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string
          offline_hash?: string | null
          partner_id?: string | null
          project_id?: string | null
          signed_at?: string | null
          signer_user_id?: string | null
          signer_vneid_hash?: string | null
          status?: string
          title: string
          token_auto_issue?: boolean | null
          token_issue_percent?: number | null
          total_value?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          variables?: Json | null
        }
        Update: {
          company_id?: string
          content_template?: Json | null
          contract_number?: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string
          offline_hash?: string | null
          partner_id?: string | null
          project_id?: string | null
          signed_at?: string | null
          signer_user_id?: string | null
          signer_vneid_hash?: string | null
          status?: string
          title?: string
          token_auto_issue?: boolean | null
          token_issue_percent?: number | null
          total_value?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_contracts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_scores: {
        Row: {
          actual_value: number | null
          created_at: string
          employee_id: string
          final_score: number | null
          finalized_at: string | null
          finalized_by: string | null
          id: string
          manager_comment: string | null
          manager_score: number | null
          manager_scored_at: string | null
          metric_id: string
          self_comment: string | null
          self_score: number | null
          self_scored_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_value?: number | null
          created_at?: string
          employee_id: string
          final_score?: number | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          manager_comment?: string | null
          manager_score?: number | null
          manager_scored_at?: string | null
          metric_id: string
          self_comment?: string | null
          self_score?: number | null
          self_scored_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_value?: number | null
          created_at?: string
          employee_id?: string
          final_score?: number | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          manager_comment?: string | null
          manager_score?: number | null
          manager_scored_at?: string | null
          metric_id?: string
          self_comment?: string | null
          self_score?: number | null
          self_scored_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_scores_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_scores_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "kpi_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfer_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          transfer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          transfer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          company_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          from_warehouse_id: string
          id: string
          notes: string | null
          status: string
          to_warehouse_id: string
          transfer_number: string
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          from_warehouse_id: string
          id?: string
          notes?: string | null
          status?: string
          to_warehouse_id: string
          transfer_number: string
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          from_warehouse_id?: string
          id?: string
          notes?: string | null
          status?: string
          to_warehouse_id?: string
          transfer_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_reports: {
        Row: {
          barriers: Json | null
          company_id: string
          created_at: string
          employee_id: string | null
          executive_summary: Json | null
          highlight: string | null
          id: string
          key_results: Json | null
          next_steps: Json | null
          project_id: string | null
          project_tasks_summary: Json | null
          report_date: string
          requests: Json | null
          resources_summary: Json | null
          review_comment: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          season_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          barriers?: Json | null
          company_id: string
          created_at?: string
          employee_id?: string | null
          executive_summary?: Json | null
          highlight?: string | null
          id?: string
          key_results?: Json | null
          next_steps?: Json | null
          project_id?: string | null
          project_tasks_summary?: Json | null
          report_date?: string
          requests?: Json | null
          resources_summary?: Json | null
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          season_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          barriers?: Json | null
          company_id?: string
          created_at?: string
          employee_id?: string | null
          executive_summary?: Json | null
          highlight?: string | null
          id?: string
          key_results?: Json | null
          next_steps?: Json | null
          project_id?: string | null
          project_tasks_summary?: Json | null
          report_date?: string
          requests?: Json | null
          resources_summary?: Json | null
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          season_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_reports_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_reports_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "kpi_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          channel_id: string
          company_id: string
          completed_at: string | null
          error_message: string | null
          id: string
          records_failed: number | null
          records_synced: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          channel_id: string
          company_id: string
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_failed?: number | null
          records_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Update: {
          channel_id?: string
          company_id?: string
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_failed?: number | null
          records_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "sales_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          company_id: string
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          description: string | null
          directive_id: string | null
          due_date: string | null
          id: string
          org_unit_id: string | null
          priority: string | null
          progress: number | null
          project_id: string | null
          quality_score: number | null
          source_id: string | null
          source_type: string
          started_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          company_id: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          directive_id?: string | null
          due_date?: string | null
          id?: string
          org_unit_id?: string | null
          priority?: string | null
          progress?: number | null
          project_id?: string | null
          quality_score?: number | null
          source_id?: string | null
          source_type: string
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          directive_id?: string | null
          due_date?: string | null
          id?: string
          org_unit_id?: string | null
          priority?: string | null
          progress?: number | null
          project_id?: string | null
          quality_score?: number | null
          source_id?: string | null
          source_type?: string
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_directive_id_fkey"
            columns: ["directive_id"]
            isOneToOne: false
            referencedRelation: "directives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "perf_org_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      token_balances: {
        Row: {
          balance: number
          company_id: string
          id: string
          last_updated: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          company_id: string
          id?: string
          last_updated?: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          company_id?: string
          id?: string
          last_updated?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_balances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_balances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      token_ledger: {
        Row: {
          amount: number
          balance_after: number
          blockchain_tx_hash: string | null
          company_id: string
          counterparty_user_id: string | null
          created_at: string
          id: string
          project_id: string | null
          reference_id: string | null
          reference_type: string
          token_type: string
          tx_signature: string | null
          user_id: string
          vneid_hash: string | null
        }
        Insert: {
          amount: number
          balance_after?: number
          blockchain_tx_hash?: string | null
          company_id: string
          counterparty_user_id?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          reference_id?: string | null
          reference_type?: string
          token_type?: string
          tx_signature?: string | null
          user_id: string
          vneid_hash?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          blockchain_tx_hash?: string | null
          company_id?: string
          counterparty_user_id?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          reference_id?: string | null
          reference_type?: string
          token_type?: string
          tx_signature?: string | null
          user_id?: string
          vneid_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_ledger_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_ledger_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      training_enrollments: {
        Row: {
          certificate_url: string | null
          completed_at: string | null
          employee_id: string
          enrolled_at: string | null
          id: string
          notes: string | null
          program_id: string
          score: number | null
          status: string
        }
        Insert: {
          certificate_url?: string | null
          completed_at?: string | null
          employee_id: string
          enrolled_at?: string | null
          id?: string
          notes?: string | null
          program_id: string
          score?: number | null
          status?: string
        }
        Update: {
          certificate_url?: string | null
          completed_at?: string | null
          employee_id?: string
          enrolled_at?: string | null
          id?: string
          notes?: string | null
          program_id?: string
          score?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          category: string
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_hours: number | null
          id: string
          instructor: string | null
          is_active: boolean | null
          is_mandatory: boolean | null
          materials_url: string | null
          target_positions: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          instructor?: string | null
          is_active?: boolean | null
          is_mandatory?: boolean | null
          materials_url?: string | null
          target_positions?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          instructor?: string | null
          is_active?: boolean | null
          is_mandatory?: boolean | null
          materials_url?: string | null
          target_positions?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_programs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_questions: {
        Row: {
          cluster_id: string | null
          company_id: string
          count: number | null
          created_at: string
          growth_rate: number | null
          id: string
          last_asked_at: string | null
          question: string
          updated_at: string
        }
        Insert: {
          cluster_id?: string | null
          company_id: string
          count?: number | null
          created_at?: string
          growth_rate?: number | null
          id?: string
          last_asked_at?: string | null
          question: string
          updated_at?: string
        }
        Update: {
          cluster_id?: string | null
          company_id?: string
          count?: number | null
          created_at?: string
          growth_rate?: number | null
          id?: string
          last_asked_at?: string | null
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trending_questions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          employee_id: string
          evidence_data: Json | null
          id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          employee_id: string
          evidence_data?: Json | null
          id?: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          employee_id?: string
          evidence_data?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_skill_progress: {
        Row: {
          current_level: number | null
          employee_id: string
          id: string
          last_updated_at: string | null
          skill_node_id: string
          unlocked_at: string | null
          xp_progress: number | null
        }
        Insert: {
          current_level?: number | null
          employee_id: string
          id?: string
          last_updated_at?: string | null
          skill_node_id: string
          unlocked_at?: string | null
          xp_progress?: number | null
        }
        Update: {
          current_level?: number | null
          employee_id?: string
          id?: string
          last_updated_at?: string | null
          skill_node_id?: string
          unlocked_at?: string | null
          xp_progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skill_progress_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skill_progress_skill_node_id_fkey"
            columns: ["skill_node_id"]
            isOneToOne: false
            referencedRelation: "skill_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_accounts: {
        Row: {
          account_number: string
          account_type: string
          bank_code: string | null
          company_id: string
          created_at: string
          entity_id: string | null
          entity_name: string
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          account_number: string
          account_type?: string
          bank_code?: string | null
          company_id: string
          created_at?: string
          entity_id?: string | null
          entity_name: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          account_number?: string
          account_type?: string
          bank_code?: string | null
          company_id?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vneid_verifications: {
        Row: {
          company_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          verification_data: Json | null
          verification_status: string
          verified_at: string | null
          vneid_hash: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          verification_data?: Json | null
          verification_status?: string
          verified_at?: string | null
          vneid_hash: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          verification_data?: Json | null
          verification_status?: string
          verified_at?: string | null
          vneid_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "vneid_verifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          code: string
          company_id: string | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_order_value: number | null
          name: string
          start_date: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_value?: number | null
          name: string
          start_date?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_value?: number | null
          name?: string
          start_date?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_stock: {
        Row: {
          created_at: string
          id: string
          min_stock: number | null
          product_id: string
          quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_stock?: number | null
          product_id: string
          quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          min_stock?: number | null
          product_id?: string
          quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          code: string
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          manager_name: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          manager_name?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          manager_name?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          api_key_id: string | null
          company_id: string
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          method: string
          request_body: Json | null
          response_body: Json | null
          status_code: number | null
          user_agent: string | null
          vneid_signature: string | null
        }
        Insert: {
          api_key_id?: string | null
          company_id: string
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          method: string
          request_body?: Json | null
          response_body?: Json | null
          status_code?: number | null
          user_agent?: string | null
          vneid_signature?: string | null
        }
        Update: {
          api_key_id?: string | null
          company_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          method?: string
          request_body?: Json | null
          response_body?: Json | null
          status_code?: number | null
          user_agent?: string | null
          vneid_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      work_report_drafts: {
        Row: {
          company_id: string
          created_at: string
          id: string
          report_date: string
          tasks: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          report_date?: string
          tasks?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          report_date?: string
          tasks?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_report_drafts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      work_reports: {
        Row: {
          auto_metrics: Json | null
          blockers: Json | null
          completed_tasks: Json | null
          created_at: string
          employee_id: string
          id: string
          org_unit_id: string | null
          pending_tasks: Json | null
          period_end: string | null
          period_start: string | null
          project_id: string | null
          report_date: string
          report_type: string
          review_comment: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          auto_metrics?: Json | null
          blockers?: Json | null
          completed_tasks?: Json | null
          created_at?: string
          employee_id: string
          id?: string
          org_unit_id?: string | null
          pending_tasks?: Json | null
          period_end?: string | null
          period_start?: string | null
          project_id?: string | null
          report_date: string
          report_type: string
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          auto_metrics?: Json | null
          blockers?: Json | null
          completed_tasks?: Json | null
          created_at?: string
          employee_id?: string
          id?: string
          org_unit_id?: string | null
          pending_tasks?: Json | null
          period_end?: string | null
          period_start?: string | null
          project_id?: string | null
          report_date?: string
          report_type?: string
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_reports_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "perf_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_reports_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "perf_org_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_logs: {
        Row: {
          approval_request_id: string | null
          execution_log: Json | null
          finished_at: string | null
          id: string
          node_executions: Json | null
          started_at: string
          status: string
          trigger_data: Json | null
          waiting_for_approval: boolean | null
          workflow_id: string
        }
        Insert: {
          approval_request_id?: string | null
          execution_log?: Json | null
          finished_at?: string | null
          id?: string
          node_executions?: Json | null
          started_at?: string
          status?: string
          trigger_data?: Json | null
          waiting_for_approval?: boolean | null
          workflow_id: string
        }
        Update: {
          approval_request_id?: string | null
          execution_log?: Json | null
          finished_at?: string | null
          id?: string
          node_executions?: Json | null
          started_at?: string
          status?: string
          trigger_data?: Json | null
          waiting_for_approval?: boolean | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_logs_approval_request_id_fkey"
            columns: ["approval_request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_logs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          flow_data: Json
          id: string
          is_active: boolean
          name: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          flow_data?: Json
          id?: string
          is_active?: boolean
          name: string
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          flow_data?: Json
          id?: string
          is_active?: boolean
          name?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_sensitive_action: {
        Args: { _action_type: string; _user_id: string }
        Returns: Json
      }
      get_cached_embedding: { Args: { text_input: string }; Returns: string }
      get_dashboard_stats: { Args: { p_company_id: string }; Returns: Json }
      get_user_company_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_account_balance: {
        Args: { p_account_id: string; p_amount: number }
        Returns: undefined
      }
      increment_stock_quantity: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_perf_admin_or_manager: { Args: never; Returns: boolean }
      match_documents: {
        Args: {
          match_company_id: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_id: string
          content: string
          document_id: string
          document_name: string
          page_number: number
          similarity: number
        }[]
      }
      save_cached_embedding: {
        Args: { embedding_val: string; text_input: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "staff" | "viewer"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipping"
        | "delivered"
        | "cancelled"
        | "returned"
      order_type: "b2b" | "b2c"
      partner_type: "customer" | "supplier" | "both"
      platform_source: "shopee" | "lazada" | "tiktok" | "manual"
      return_status:
        | "requested"
        | "approved"
        | "receiving"
        | "received"
        | "refunded"
        | "rejected"
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
      app_role: ["admin", "manager", "staff", "viewer"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipping",
        "delivered",
        "cancelled",
        "returned",
      ],
      order_type: ["b2b", "b2c"],
      partner_type: ["customer", "supplier", "both"],
      platform_source: ["shopee", "lazada", "tiktok", "manual"],
      return_status: [
        "requested",
        "approved",
        "receiving",
        "received",
        "refunded",
        "rejected",
      ],
    },
  },
} as const
