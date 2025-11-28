import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Vendor = Database['public']['Tables']['vendors']['Row'];
type VendorInsert = Database['public']['Tables']['vendors']['Insert'];
type VendorUpdate = Database['public']['Tables']['vendors']['Update'];

export const vendorService = {
  getVendorByUserId: async (userId: string): Promise<Vendor | null> => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  createVendor: async (vendorData: VendorInsert): Promise<Vendor> => {
    const { data, error } = await supabase
      .from('vendors')
      .insert(vendorData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateVendor: async (id: string, vendorData: VendorUpdate): Promise<Vendor> => {
    const { data, error } = await supabase
      .from('vendors')
      .update(vendorData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteVendor: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  getAllVendors: async (): Promise<Vendor[]> => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  searchVendorsByCity: async (city: string): Promise<Vendor[]> => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .ilike('city', `%${city}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
