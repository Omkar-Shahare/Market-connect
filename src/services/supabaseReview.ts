import { supabase } from "@/lib/supabase";

export interface Review {
    id: string;
    order_id: string;
    vendor_id: string;
    supplier_id: string;
    rating: number;
    comment: string;
    created_at: string;
    vendor?: {
        business_name: string;
        owner_name: string;
    };
}

export const reviewService = {
    // Create a new review
    async createReview(reviewData: {
        order_id: string;
        vendor_id: string;
        supplier_id: string;
        rating: number;
        comment: string;
    }) {
        const { data, error } = await supabase
            .from('reviews')
            .insert([reviewData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get reviews for a specific supplier
    async getReviewsBySupplierId(supplierId: string) {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
        *,
        vendor:vendors(business_name, owner_name)
      `)
            .eq('supplier_id', supplierId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get review for a specific order (to check if already rated)
    async getReviewByOrderId(orderId: string) {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('order_id', orderId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }
};
