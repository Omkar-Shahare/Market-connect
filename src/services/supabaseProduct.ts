import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

export interface ProductWithSupplier extends Product {
  supplier: {
    id: string;
    business_name: string;
    city: string;
    rating: number;
  };
}

export const productService = {
  getProductById: async (id: string): Promise<Product | null> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  getProductsBySupplierId: async (supplierId: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  getAllProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('stock_available', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  getProductsWithSupplier: async (): Promise<ProductWithSupplier[]> => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *
      `)
      .eq('stock_available', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data as unknown as ProductWithSupplier[];
  },

  searchProductsByCategory: async (category: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('category', `%${category}%`)
      .eq('stock_available', true)
      .order('price_per_unit', { ascending: true });

    if (error) throw error;
    return data;
  },

  searchProductsByName: async (name: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${name}%`)
      .eq('stock_available', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  createProduct: async (productData: ProductInsert): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateProduct: async (id: string, productData: ProductUpdate): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  updateStockStatus: async (id: string, stockAvailable: boolean): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .update({ stock_available: stockAvailable })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
