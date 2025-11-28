import { api } from './api';

// Order-related types
export interface OrderItem {
  name: string;
  quantity: number;
  pricePerKg: number;
  subtotal: number;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface CreateOrderData {
  id: string;
  vendor_id: number;
  supplier_id?: number;
  order_type: 'individual' | 'group';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  delivery_charge: number;
  group_discount: number;
  total_amount: number;
  status?: string;
  payment_status: string;
  payment_method: string;
  payment_id?: string;
  delivery_address?: string;
  delivery_date?: string;
  notes?: string;
  customer_details: CustomerDetails;
}

export interface Order {
  id: string;
  vendor_id: number;
  supplier_id?: number;
  order_type: 'individual' | 'group';
  items: string; // JSON string
  subtotal: number;
  tax: number;
  delivery_charge: number;
  group_discount: number;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  payment_id?: string;
  delivery_address?: string;
  delivery_date?: string;
  notes?: string;
  customer_details?: string; // JSON string
  created_at: string;
  updated_at: string;
  // Vendor information (from JOIN with vendors table)
  vendor_name?: string;
  vendor_phone?: string;
  stall_name?: string;
  vendor_city?: string;
}

export interface OrderResponse {
  message: string;
  orderId: string;
  data: Partial<Order>;
}

export interface OrderListResponse {
  orders: Order[];
}

// Order API functions
export const orderApi = {
  // Create a new order
  create: async (orderData: CreateOrderData): Promise<OrderResponse> => {
    return api.post('/orders', orderData);
  },

  // Get all orders
  getAll: async (): Promise<OrderListResponse> => {
    return api.get('/orders');
  },

  // Get orders by vendor ID
  getByVendorId: async (vendorId: number): Promise<OrderListResponse> => {
    return api.get(`/orders/vendor/${vendorId}`);
  },

  // Get orders by supplier ID
  getBySupplierId: async (supplierId: number): Promise<OrderListResponse> => {
    return api.get(`/orders/supplier/${supplierId}`);
  },

  // Get pending orders (orders without supplier assigned)
  getPendingOrders: async (): Promise<OrderListResponse> => {
    return api.get('/orders/pending');
  },

  // Accept an order by supplier
  acceptOrder: async (orderId: string, supplierId: number): Promise<{ message: string }> => {
    return api.put(`/orders/${orderId}/accept`, { supplier_id: supplierId });
  },

  // Get order by ID
  getById: async (orderId: string): Promise<{ order: Order }> => {
    return api.get(`/orders/${orderId}`);
  },

  // Update order status
  updateStatus: async (orderId: string, status: string, paymentStatus?: string): Promise<{ message: string }> => {
    return api.put(`/orders/${orderId}/status`, { 
      status,
      payment_status: paymentStatus 
    });
  },

  // Delete order
  delete: async (orderId: string): Promise<{ message: string }> => {
    return api.delete(`/orders/${orderId}`);
  }
};
