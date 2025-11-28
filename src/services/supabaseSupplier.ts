import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];

export const supplierService = {
  getSupplierByUserId: async (userId: string): Promise<Supplier | null> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  getSupplierById: async (id: string): Promise<Supplier | null> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  createSupplier: async (supplierData: SupplierInsert): Promise<Supplier> => {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateSupplier: async (id: string, supplierData: SupplierUpdate): Promise<Supplier> => {
    const { data, error } = await supabase
      .from('suppliers')
      .update(supplierData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteSupplier: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  getAllSuppliers: async (): Promise<Supplier[]> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('rating', { ascending: false });

    if (error) throw error;
    return data;
  },

  searchSuppliersByCity: async (city: string): Promise<Supplier[]> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .ilike('city', `%${city}%`)
      .order('rating', { ascending: false });

    if (error) throw error;
    return data;
  },

  getTopRatedSuppliers: async (limit: number = 10): Promise<Supplier[]> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },
};
