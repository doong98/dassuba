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
      members: {
        Row: {
          id: string;
          email: string;
          password?: string;
          name: string;
          phone: string | null;
          role: 'user' | 'admin';
          points: number;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          email: string;
          password: string;
          name: string;
          phone?: string | null;
          role?: 'user' | 'admin';
          points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password?: string;
          name?: string;
          phone?: string | null;
          role?: 'user' | 'admin';
          points?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string | null;
          phone: string | null;
          role: 'user' | 'admin';
          points: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          phone?: string | null;
          role?: 'user' | 'admin';
          points?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          phone?: string | null;
          role?: 'user' | 'admin';
          points?: number;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          title: string;
          price: number;
          original_price: number | null;
          category: string;
          is_bundle_1plus1: boolean;
          images: string[];
          status: 'active' | 'soldout' | 'hidden';
          rating: number;
          review_count: number;
          badge: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          price: number;
          original_price?: number | null;
          category?: string;
          is_bundle_1plus1?: boolean;
          images?: string[];
          status?: 'active' | 'soldout' | 'hidden';
          rating?: number;
          review_count?: number;
          badge?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          price?: number;
          original_price?: number | null;
          category?: string;
          is_bundle_1plus1?: boolean;
          images?: string[];
          status?: 'active' | 'soldout' | 'hidden';
          rating?: number;
          review_count?: number;
          badge?: string | null;
          description?: string | null;
          created_at?: string;
        };
      };
      product_options: {
        Row: {
          id: string;
          product_id: string;
          color: string;
          size: string;
          stock_quantity: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          color: string;
          size: string;
          stock_quantity?: number;
        };
        Update: {
          id?: string;
          product_id?: string;
          color?: string;
          size?: string;
          stock_quantity?: number;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          total_amount: number;
          status: 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'refunded';
          address: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_number: string;
          total_amount: number;
          status?: 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'refunded';
          address: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_number?: string;
          total_amount?: number;
          status?: 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'refunded';
          address?: Json;
          created_at?: string;
        };
      };
      materials: {
        Row: {
          id: string;
          name: string;
          code: string;
          unit: string;
          current_stock: number;
          safety_stock: number;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          unit?: string;
          current_stock?: number;
          safety_stock?: number;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          unit?: string;
          current_stock?: number;
          safety_stock?: number;
        };
      };
      purchase_orders: {
        Row: {
          id: string;
          supplier_name: string;
          material_id: string;
          quantity: number;
          status: 'ordered' | 'received' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          supplier_name: string;
          material_id: string;
          quantity: number;
          status?: 'ordered' | 'received' | 'cancelled';
          created_at?: string;
        };
        Update: {
          id?: string;
          supplier_name?: string;
          material_id?: string;
          quantity?: number;
          status?: 'ordered' | 'received' | 'cancelled';
          created_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          board_type: 'qna' | 'free' | 'reservation';
          is_secret: boolean;
          user_id: string;
          title: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_type: 'qna' | 'free' | 'reservation';
          is_secret?: boolean;
          user_id: string;
          title: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          board_type?: 'qna' | 'free' | 'reservation';
          is_secret?: boolean;
          user_id?: string;
          title?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
