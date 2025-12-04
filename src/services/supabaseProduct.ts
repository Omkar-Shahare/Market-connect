import { supabase as supabaseClient } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

// Cast supabase to any to avoid 'never' type inference issues with the products table
const supabase = supabaseClient as any;

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

    // Check if product is soft deleted
    if (data && data.description) {
      try {
        const desc = JSON.parse(data.description);
        if (desc.deleted) return null;
      } catch (e) {
        // Ignore parsing error
      }
    }

    return data;
  },

  getProductsBySupplierId: async (supplierId: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('name', { ascending: true });

    if (error) throw error;

    // Filter out soft-deleted products
    return (data || []).filter((product: Product) => {
      if (!product.description) return true;
      try {
        const desc = JSON.parse(product.description);
        return !desc.deleted;
      } catch (e) {
        return true;
      }
    });
  },

  getAllProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('stock_available', true)
      .order('name', { ascending: true });

    if (error) throw error;

    // Filter out soft-deleted products
    return (data || []).filter((product: Product) => {
      if (!product.description) return true;
      try {
        const desc = JSON.parse(product.description);
        return !desc.deleted;
      } catch (e) {
        return true;
      }
    });
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

    // Filter out soft-deleted products
    const products = data as unknown as ProductWithSupplier[];
    return products.filter(product => {
      if (!product.description) return true;
      try {
        const desc = JSON.parse(product.description);
        return !desc.deleted;
      } catch (e) {
        return true;
      }
    });
  },

  searchProductsByCategory: async (category: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('category', `%${category}%`)
      .eq('stock_available', true)
      .order('price_per_unit', { ascending: true });

    if (error) throw error;

    // Filter out soft-deleted products
    return (data || []).filter((product: Product) => {
      if (!product.description) return true;
      try {
        const desc = JSON.parse(product.description);
        return !desc.deleted;
      } catch (e) {
        return true;
      }
    });
  },

  searchProductsByName: async (name: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${name}%`)
      .eq('stock_available', true)
      .order('name', { ascending: true });

    if (error) throw error;

    // Filter out soft-deleted products
    return (data || []).filter((product: Product) => {
      if (!product.description) return true;
      try {
        const desc = JSON.parse(product.description);
        return !desc.deleted;
      } catch (e) {
        return true;
      }
    });
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
    // Soft delete implementation
    // 1. Get current product to preserve existing description data
    const { data: currentProduct, error: fetchError } = await supabase
      .from('products')
      .select('description')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!currentProduct) throw new Error('Product not found');

    let newDescription = {};
    try {
      if (currentProduct.description) {
        newDescription = JSON.parse(currentProduct.description);
      }
    } catch (e) {
      console.error('Error parsing description for soft delete', e);
    }

    // Add deleted flag
    const updatedDescription = JSON.stringify({
      ...newDescription,
      deleted: true,
      deletedAt: new Date().toISOString()
    });

    // 2. Update product with deleted flag and set stock to false
    const { error } = await supabase
      .from('products')
      .update({
        description: updatedDescription,
        stock_available: false
      })
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
