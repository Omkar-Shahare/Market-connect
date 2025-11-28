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
            vendors: {
                Row: {
                    id: string
                    user_id: string
                    business_name: string
                    owner_name: string
                    phone: string
                    address: string
                    city: string
                    state: string
                    pincode: string
                    business_type: string
                    gst_number: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    business_name: string
                    owner_name: string
                    phone: string
                    address: string
                    city: string
                    state: string
                    pincode: string
                    business_type: string
                    gst_number?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    business_name?: string
                    owner_name?: string
                    phone?: string
                    address?: string
                    city?: string
                    state?: string
                    pincode?: string
                    business_type?: string
                    gst_number?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            suppliers: {
                Row: {
                    id: string
                    user_id: string
                    business_name: string
                    owner_name: string
                    phone: string
                    email: string
                    address: string
                    city: string
                    state: string
                    pincode: string
                    gst_number: string | null
                    fssai_license: string | null
                    rating: number
                    total_reviews: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    business_name: string
                    owner_name: string
                    phone: string
                    email: string
                    address: string
                    city: string
                    state: string
                    pincode: string
                    gst_number?: string | null
                    fssai_license?: string | null
                    rating?: number
                    total_reviews?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    business_name?: string
                    owner_name?: string
                    phone?: string
                    email?: string
                    address?: string
                    city?: string
                    state?: string
                    pincode?: string
                    gst_number?: string | null
                    fssai_license?: string | null
                    rating?: number
                    total_reviews?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    supplier_id: string
                    name: string
                    category: string
                    unit: string
                    price_per_unit: number
                    min_order_quantity: number
                    stock_available: boolean
                    description: string | null
                    image_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    supplier_id: string
                    name: string
                    category: string
                    unit: string
                    price_per_unit: number
                    min_order_quantity?: number
                    stock_available?: boolean
                    description?: string | null
                    image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    supplier_id?: string
                    name?: string
                    category?: string
                    unit?: string
                    price_per_unit?: number
                    min_order_quantity?: number
                    stock_available?: boolean
                    description?: string | null
                    image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    vendor_id: string
                    supplier_id: string
                    delivery_partner_id: string | null
                    order_number: string
                    status: 'pending' | 'confirmed' | 'delivered' | 'cancelled' | 'ready_for_pickup' | 'out_for_delivery'
                    total_amount: number
                    delivery_address: string
                    delivery_date: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    vendor_id: string
                    supplier_id: string
                    delivery_partner_id?: string | null
                    order_number: string
                    status?: 'pending' | 'confirmed' | 'delivered' | 'cancelled' | 'ready_for_pickup' | 'out_for_delivery'
                    total_amount: number
                    delivery_address: string
                    delivery_date?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    vendor_id?: string
                    supplier_id?: string
                    delivery_partner_id?: string | null
                    order_number?: string
                    status?: 'pending' | 'confirmed' | 'delivered' | 'cancelled' | 'ready_for_pickup' | 'out_for_delivery'
                    total_amount?: number
                    delivery_address?: string
                    delivery_date?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string
                    quantity: number
                    unit_price: number
                    total_price: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id: string
                    quantity: number
                    unit_price: number
                    total_price: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string
                    quantity?: number
                    unit_price?: number
                    total_price?: number
                    created_at?: string
                }
            }
            delivery_partners: {
                Row: {
                    id: string
                    user_id: string
                    full_name: string
                    phone: string
                    city: string
                    pincode: string
                    vehicle_type: string
                    vehicle_number: string
                    license_number: string
                    is_active: boolean
                    rating: number
                    total_reviews: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    full_name: string
                    phone: string
                    city: string
                    pincode: string
                    vehicle_type: string
                    vehicle_number: string
                    license_number: string
                    is_active?: boolean
                    rating?: number
                    total_reviews?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    full_name?: string
                    phone?: string
                    city?: string
                    pincode?: string
                    vehicle_type?: string
                    vehicle_number?: string
                    license_number?: string
                    is_active?: boolean
                    rating?: number
                    total_reviews?: number
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
            [_ in never]: never
        }
    }
}
