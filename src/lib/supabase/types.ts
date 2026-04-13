export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      verticals: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string
          icon: string
          ai_prompt: string
          ai_negative_prompt: string
          target_min_price: number | null
          target_max_price: number | null
          target_min_land_area: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description: string
          icon: string
          ai_prompt: string
          ai_negative_prompt: string
          target_min_price?: number | null
          target_max_price?: number | null
          target_min_land_area?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string
          icon?: string
          ai_prompt?: string
          ai_negative_prompt?: string
          target_min_price?: number | null
          target_max_price?: number | null
          target_min_land_area?: number | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          id: string
          dvf_id: string
          address: string
          city: string
          department: string
          postal_code: string
          latitude: number
          longitude: number
          price: number
          surface_area: number
          land_area: number | null
          property_type: string
          transaction_date: string
          satellite_image_url: string | null
          satellite_fetched_at: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          dvf_id: string
          address: string
          city: string
          department: string
          postal_code: string
          latitude: number
          longitude: number
          price: number
          surface_area: number
          land_area?: number | null
          property_type: string
          transaction_date: string
          satellite_image_url?: string | null
          satellite_fetched_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          dvf_id?: string
          address?: string
          city?: string
          department?: string
          postal_code?: string
          latitude?: number
          longitude?: number
          price?: number
          surface_area?: number
          land_area?: number | null
          property_type?: string
          transaction_date?: string
          satellite_image_url?: string | null
          satellite_fetched_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          vertical_id: string
          name: string
          description: string | null
          status: 'draft' | 'active' | 'paused' | 'completed'
          target_cities: string[] | null
          target_departments: string[] | null
          target_postal_codes: string[] | null
          min_price: number | null
          max_price: number | null
          min_land_area: number | null
          email_template_id: string | null
          total_properties: number
          total_sent: number
          total_opened: number
          total_clicked: number
          total_converted: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vertical_id: string
          name: string
          description?: string | null
          status?: 'draft' | 'active' | 'paused' | 'completed'
          target_cities?: string[] | null
          target_departments?: string[] | null
          target_postal_codes?: string[] | null
          min_price?: number | null
          max_price?: number | null
          min_land_area?: number | null
          email_template_id?: string | null
          total_properties?: number
          total_sent?: number
          total_opened?: number
          total_clicked?: number
          total_converted?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vertical_id?: string
          name?: string
          description?: string | null
          status?: 'draft' | 'active' | 'paused' | 'completed'
          target_cities?: string[] | null
          target_departments?: string[] | null
          target_postal_codes?: string[] | null
          min_price?: number | null
          max_price?: number | null
          min_land_area?: number | null
          email_template_id?: string | null
          total_properties?: number
          total_sent?: number
          total_opened?: number
          total_clicked?: number
          total_converted?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'campaigns_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaigns_vertical_id_fkey'
            columns: ['vertical_id']
            isOneToOne: false
            referencedRelation: 'verticals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaigns_email_template_id_fkey'
            columns: ['email_template_id']
            isOneToOne: false
            referencedRelation: 'email_templates'
            referencedColumns: ['id']
          },
        ]
      }
      leads: {
        Row: {
          id: string
          property_id: string
          campaign_id: string
          vertical_id: string
          email: string
          first_name: string
          last_name: string
          phone: string | null
          status: 'new' | 'image_generated' | 'contacted' | 'opened' | 'clicked' | 'responded' | 'converted' | 'unsubscribed'
          original_image_url: string | null
          generated_image_url: string | null
          email_sent_at: string | null
          email_opened_at: string | null
          email_clicked_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          campaign_id: string
          vertical_id: string
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          status?: 'new' | 'image_generated' | 'contacted' | 'opened' | 'clicked' | 'responded' | 'converted' | 'unsubscribed'
          original_image_url?: string | null
          generated_image_url?: string | null
          email_sent_at?: string | null
          email_opened_at?: string | null
          email_clicked_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          campaign_id?: string
          vertical_id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          status?: 'new' | 'image_generated' | 'contacted' | 'opened' | 'clicked' | 'responded' | 'converted' | 'unsubscribed'
          original_image_url?: string | null
          generated_image_url?: string | null
          email_sent_at?: string | null
          email_opened_at?: string | null
          email_clicked_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'leads_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_vertical_id_fkey'
            columns: ['vertical_id']
            isOneToOne: false
            referencedRelation: 'verticals'
            referencedColumns: ['id']
          },
        ]
      }
      email_templates: {
        Row: {
          id: string
          vertical_id: string
          name: string
          subject: string
          body_html: string
          body_text: string
          variables: Json | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vertical_id: string
          name: string
          subject: string
          body_html: string
          body_text: string
          variables?: Json | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vertical_id?: string
          name?: string
          subject?: string
          body_html?: string
          body_text?: string
          variables?: Json | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'email_templates_vertical_id_fkey'
            columns: ['vertical_id']
            isOneToOne: false
            referencedRelation: 'verticals'
            referencedColumns: ['id']
          },
        ]
      }
      pipeline_jobs: {
        Row: {
          id: string
          campaign_id: string
          type: 'data_collection' | 'satellite_fetch' | 'ai_generation' | 'email_send' | 'follow_up'
          status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          progress: number
          total_items: number
          processed_items: number
          error_message: string | null
          metadata: Json | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          type: 'data_collection' | 'satellite_fetch' | 'ai_generation' | 'email_send' | 'follow_up'
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          progress?: number
          total_items: number
          processed_items?: number
          error_message?: string | null
          metadata?: Json | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          type?: 'data_collection' | 'satellite_fetch' | 'ai_generation' | 'email_send' | 'follow_up'
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          progress?: number
          total_items?: number
          processed_items?: number
          error_message?: string | null
          metadata?: Json | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pipeline_jobs_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
        ]
      }
      follow_up_sequences: {
        Row: {
          id: string
          campaign_id: string
          step_number: number
          delay_days: number
          email_template_id: string
          subject_override: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          step_number: number
          delay_days: number
          email_template_id: string
          subject_override?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          step_number?: number
          delay_days?: number
          email_template_id?: string
          subject_override?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'follow_up_sequences_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'follow_up_sequences_email_template_id_fkey'
            columns: ['email_template_id']
            isOneToOne: false
            referencedRelation: 'email_templates'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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

type PublicSchema = Database['public']

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] & {
      Schema: PublicTableNameOrOptions['schema']
    }
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] & {
        Schema: 'public'
      }
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never
