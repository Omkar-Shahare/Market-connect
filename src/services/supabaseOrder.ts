import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderUpdate = Database['public']['Tables']['orders']['Update'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];

export interface OrderWithDetails extends Order {
  vendor: {
    business_name: string;
    phone: string;
  };
  supplier: {
    business_name: string;
    phone: string;
  };
  items: Array<OrderItem & {
    product: {
      name: string;
      unit: string;
    };
  }>;
}

export interface CreateOrderData {
  order: OrderInsert;
  items: Omit<OrderItemInsert, 'order_id'>[];
}

export const orderService = {
  createOrder: async ({ order, items }: CreateOrderData): Promise<Order> => {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (orderError) throw orderError;

    const itemsWithOrderId = items.map(item => ({
      ...item,
      order_id: orderData.id,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) throw itemsError;

    return orderData;
  },

  getOrderById: async (id: string): Promise<OrderWithDetails | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        vendor:vendors(business_name, phone),
        supplier:suppliers(business_name, phone),
        items:order_items(
          *,
          product:products(name, unit)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as OrderWithDetails;
  },

  getOrdersByVendorId: async (vendorId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          *
        )
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getOrdersBySupplierId: async (supplierId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          *
        )
      `)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  updateOrderStatus: async (
    id: string,
    status: 'pending' | 'confirmed' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled'
  ): Promise<Order> => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateOrder: async (id: string, orderData: OrderUpdate): Promise<Order> => {
    const { data, error } = await supabase
      .from('orders')
      .update(orderData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteOrder: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  generateOrderNumber: (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  },

  getOrderStats: async (vendorId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('status, total_amount')
      .eq('vendor_id', vendorId);

    if (error) throw error;

    const stats = {
      total: data.length,
      pending: data.filter(o => o.status === 'pending').length,
      confirmed: data.filter(o => o.status === 'confirmed').length,
      delivered: data.filter(o => o.status === 'delivered').length,
      cancelled: data.filter(o => o.status === 'cancelled').length,
      totalSpent: data.reduce((sum, o) => sum + Number(o.total_amount), 0),
    };

    return stats;
  },
};
