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
      tickets: {
        Row: {
          id: string
          created_at: string
          user_id: string
          subject: string
          category: 'General' | 'Order Dispute' | 'Technical' | 'Web Site Issue'
          description: string
          order_id: string | null
          status: 'Open' | 'Resolved'
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          subject: string
          category: 'General' | 'Order Dispute' | 'Technical' | 'Web Site Issue'
          description: string
          order_id?: string | null
          status?: 'Open' | 'Resolved'
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          subject?: string
          category?: 'General' | 'Order Dispute' | 'Technical'
          description?: string
          order_id?: string | null
          status?: 'Open' | 'Resolved'
        }
      }
    }
  }
}

