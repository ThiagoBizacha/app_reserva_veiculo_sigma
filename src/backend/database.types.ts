export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_name: string | null;
          actor_user_id: string | null;
          created_at: string;
          details: Json;
          entity_id: string;
          entity_type: string;
          id: string;
          occurred_at: string;
          origin: string;
        };
        Insert: {
          action: string;
          actor_name?: string | null;
          actor_user_id?: string | null;
          created_at?: string;
          details?: Json;
          entity_id: string;
          entity_type: string;
          id: string;
          occurred_at?: string;
          origin?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]>;
        Relationships: [];
      };
      reservation_history: {
        Row: {
          actor: string;
          created_at: string;
          id: string;
          label: string;
          note: string | null;
          reservation_id: string;
          timestamp: string;
        };
        Insert: {
          actor: string;
          created_at?: string;
          id: string;
          label: string;
          note?: string | null;
          reservation_id: string;
          timestamp: string;
        };
        Update: Partial<Database["public"]["Tables"]["reservation_history"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reservation_history_reservation_id_fkey";
            columns: ["reservation_id"];
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      reservations: {
        Row: {
          approver: string | null;
          base: string;
          check_in_at: string | null;
          check_in_checklist: Json | null;
          check_in_data: Json | null;
          check_in_fuel_level: string | null;
          check_in_notes: string | null;
          check_out_at: string | null;
          check_out_checklist: Json | null;
          check_out_data: Json | null;
          check_out_fuel_level: string | null;
          check_out_notes: string | null;
          code: string;
          created_at: string;
          end_date: string;
          end_mileage: string | null;
          id: string;
          notes: string | null;
          planned_duration_hours: number | null;
          purpose: string;
          resource_id: string;
          start_date: string;
          start_mileage: string | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          approver?: string | null;
          base: string;
          check_in_at?: string | null;
          check_in_checklist?: Json | null;
          check_in_data?: Json | null;
          check_in_fuel_level?: string | null;
          check_in_notes?: string | null;
          check_out_at?: string | null;
          check_out_checklist?: Json | null;
          check_out_data?: Json | null;
          check_out_fuel_level?: string | null;
          check_out_notes?: string | null;
          code: string;
          created_at?: string;
          end_date: string;
          end_mileage?: string | null;
          id: string;
          notes?: string | null;
          planned_duration_hours?: number | null;
          purpose: string;
          resource_id: string;
          start_date: string;
          start_mileage?: string | null;
          status: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["reservations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reservations_resource_id_fkey";
            columns: ["resource_id"];
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      resource_unavailability: {
        Row: {
          created_at: string;
          created_by_user_id: string | null;
          end_at: string | null;
          ended_by_user_id: string | null;
          expected_end_at: string | null;
          id: string;
          note: string | null;
          reason: string;
          resource_id: string;
          start_at: string;
          status: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by_user_id?: string | null;
          end_at?: string | null;
          ended_by_user_id?: string | null;
          expected_end_at?: string | null;
          id: string;
          note?: string | null;
          reason: string;
          resource_id: string;
          start_at: string;
          status: string;
          type: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["resource_unavailability"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "resource_unavailability_created_by_user_id_fkey";
            columns: ["created_by_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resource_unavailability_ended_by_user_id_fkey";
            columns: ["ended_by_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resource_unavailability_resource_id_fkey";
            columns: ["resource_id"];
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
        ];
      };
      resources: {
        Row: {
          brand: string | null;
          capacity: string | null;
          category: string;
          code: string;
          created_at: string;
          current_mileage: string | null;
          description: string;
          id: string;
          image_hint: string;
          last_inspection_date: string | null;
          last_maintenance_date: string | null;
          last_maintenance_mileage: string | null;
          model: string | null;
          name: string;
          next_available_at: string | null;
          next_maintenance_date: string | null;
          next_maintenance_mileage: string | null;
          observation: string | null;
          plate: string | null;
          rental_company: string | null;
          status: string;
          tags: Json;
          updated_at: string;
          vehicle_category: string | null;
          vehicle_document_attachment: string | null;
          vehicle_id: string | null;
          vehicle_photo_attachments: Json;
          year: string | null;
        };
        Insert: {
          brand?: string | null;
          capacity?: string | null;
          category: string;
          code: string;
          created_at?: string;
          current_mileage?: string | null;
          description: string;
          id: string;
          image_hint: string;
          last_inspection_date?: string | null;
          last_maintenance_date?: string | null;
          last_maintenance_mileage?: string | null;
          model?: string | null;
          name: string;
          next_available_at?: string | null;
          next_maintenance_date?: string | null;
          next_maintenance_mileage?: string | null;
          observation?: string | null;
          plate?: string | null;
          rental_company?: string | null;
          status: string;
          tags?: Json;
          updated_at?: string;
          vehicle_category?: string | null;
          vehicle_document_attachment?: string | null;
          vehicle_id?: string | null;
          vehicle_photo_attachments?: Json;
          year?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["resources"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          auth_user_id: string | null;
          area_departamento: string;
          centro_custo: string;
          cnh_anexo: string;
          cnh_categoria: string;
          cnh_data_ultima_validacao: string;
          cnh_numero: string | null;
          cnh_status: string;
          cpf: string | null;
          created_at: string;
          email: string;
          full_name: string;
          gestor_nome: string | null;
          gestor_veiculo: boolean;
          id: string;
          matricula: string;
          matriz: string;
          observacao: string | null;
          role: string;
          telefone: string;
          termos_paytrack: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auth_user_id?: string | null;
          area_departamento: string;
          centro_custo: string;
          cnh_anexo?: string;
          cnh_categoria: string;
          cnh_data_ultima_validacao?: string;
          cnh_numero?: string | null;
          cnh_status: string;
          cpf?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          gestor_nome?: string | null;
          gestor_veiculo?: boolean;
          id: string;
          matricula: string;
          matriz: string;
          observacao?: string | null;
          role: string;
          telefone: string;
          termos_paytrack?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_app_user_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      current_app_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      current_auth_email: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      cancel_own_reservation: {
        Args: {
          p_reservation_id: string;
        };
        Returns: Database["public"]["Tables"]["reservations"]["Row"];
      };
      current_user_has_role: {
        Args: {
          allowed_roles: string[];
        };
        Returns: boolean;
      };
      link_current_user_auth: {
        Args: {
          p_user_id: string;
        };
        Returns: Database["public"]["Tables"]["users"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type AuditLogInsert = Database["public"]["Tables"]["audit_log"]["Insert"];
export type ReservationHistoryInsert = Database["public"]["Tables"]["reservation_history"]["Insert"];
export type ReservationHistoryRow = Database["public"]["Tables"]["reservation_history"]["Row"];
export type ReservationInsert = Database["public"]["Tables"]["reservations"]["Insert"];
export type ReservationRow = Database["public"]["Tables"]["reservations"]["Row"];
export type ResourceInsert = Database["public"]["Tables"]["resources"]["Insert"];
export type ResourceRow = Database["public"]["Tables"]["resources"]["Row"];
export type ResourceUnavailabilityInsert =
  Database["public"]["Tables"]["resource_unavailability"]["Insert"];
export type ResourceUnavailabilityRow =
  Database["public"]["Tables"]["resource_unavailability"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
