import { api } from './api';

// Vendor-related types
export interface VendorProfile {
  id?: number;
  firebaseUserId?: string;
  fullName: string;
  mobileNumber: string;
  languagePreference: string;
  stallName?: string;
  stallAddress: string;
  city: string;
  pincode: string;
  state: string;
  stallType: string;
  rawMaterialNeeds: string[];
  preferredDeliveryTime: string;
  latitude?: string;
  longitude?: string;
}

export interface VendorResponse {
  message: string;
  vendorId: number;
  data: VendorProfile;
}

export interface VendorListResponse {
  vendors: VendorProfile[];
  total: number;
}

// Vendor API functions
export const vendorApi = {
  // Create a new vendor profile
  create: async (vendorData: Omit<VendorProfile, 'id'>): Promise<VendorResponse> => {
    return api.post('/vendors', vendorData);
  },

  // Get all vendors
  getAll: async (): Promise<VendorListResponse> => {
    return api.get('/vendors');
  },

  // Get vendor by ID
  getById: async (id: number): Promise<{ vendor: VendorProfile }> => {
    return api.get(`/vendors/${id}`);
  },

  // Get vendor by Firebase user ID
    // Get vendor by user ID (robust: try dedicated endpoint, then fall back to list+filter)
  getByUserId: async (userId: string): Promise<{ vendor: VendorProfile }> => {
    // Try the backend dedicated endpoint first (if implemented)
    try {
      return await api.get(`/vendors/by-user/${userId}`);
    } catch (err) {
      // If the backend doesn't provide that endpoint (404) — fallback to fetching vendor list and filter client-side.
      // This handles mismatched or missing backend route safely.
      console.warn('vendors/by-user endpoint failed, falling back to /vendors list filter', err);

      const listResponse = await api.get<{ vendors: VendorProfile[] }>('/vendors');
      const found = (listResponse.vendors || []).find(v =>
        // backend vendor model might store user id in different field names; check both common ones
        (v as any).user_id === userId || (v as any).firebaseUserId === userId || (v as any).userId === userId
      );

      if (!found) {
        // Keep behavior similar to before: throw an error so caller can show the "profile missing" toast
        throw new Error('Vendor profile not found for user');
      }

      return { vendor: found };
    }
  },


  // Update vendor profile
  update: async (id: number, vendorData: Partial<VendorProfile>): Promise<VendorResponse> => {
    return api.put(`/vendors/${id}`, vendorData);
  },

  // Delete vendor
  delete: async (id: number): Promise<{ message: string }> => {
    return api.delete(`/vendors/${id}`);
  },

  // Search vendors by location or other criteria
  search: async (params: {
    city?: string;
    state?: string;
    stallType?: string;
    rawMaterial?: string;
  }): Promise<VendorListResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/vendors/search?${queryString}` : '/vendors';
    
    return api.get(endpoint);
  }
};
