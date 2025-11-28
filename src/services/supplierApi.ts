import { supabase } from '../lib/supabase';

export interface SupplierProfile {
  id?: string;
  user_id?: string;
  fullName: string;
  mobileNumber: string;
  languagePreference: string;
  businessName?: string;
  businessAddress: string;
  city: string;
  pincode: string;
  state: string;
  businessType: string;
  supplyCapabilities: string[];
  preferredDeliveryTime: string;
  latitude?: string;
  longitude?: string;
  gstNumber?: string;
  licenseNumber?: string;
  yearsInBusiness?: string;
  employeeCount?: string;
  primaryEmail?: string;
  whatsappBusiness?: string;
  foodSafetyLicense?: string;
  organicCertification?: string;
  isoCertification?: string;
  exportLicense?: string;
  rating?: number;
  total_reviews?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiError extends Error {
  status?: number;
}

export const supplierApi = {
  getByUserId: async (userId: string): Promise<{ supplier: SupplierProfile }> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      const apiError: ApiError = new Error(error.message);
      apiError.status = error.code === 'PGRST116' ? 404 : 500;
      throw apiError;
    }

    if (!data) {
      const apiError: ApiError = new Error('Supplier profile not found');
      apiError.status = 404;
      throw apiError;
    }

    return { supplier: data as SupplierProfile };
  },

  getById: async (id: string): Promise<{ supplier: SupplierProfile }> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Supplier not found');

    return { supplier: data as SupplierProfile };
  },

  getAll: async (): Promise<{ suppliers: SupplierProfile[] }> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('rating', { ascending: false });

    if (error) throw error;
    return { suppliers: data as SupplierProfile[] };
  },

  update: async (id: string, supplierData: Partial<SupplierProfile>): Promise<{ supplier: SupplierProfile }> => {
    const { data, error } = await supabase
      .from('suppliers')
      .update(supplierData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { supplier: data as SupplierProfile };
  },

  searchByCity: async (city: string): Promise<{ suppliers: SupplierProfile[] }> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .ilike('city', `%${city}%`)
      .order('rating', { ascending: false });

    if (error) throw error;
    return { suppliers: data as SupplierProfile[] };
  }
};
