/*
  # Add Reviews System
  
  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `vendor_id` (uuid, references vendors)
      - `supplier_id` (uuid, references suppliers)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on `reviews` table
    - Add policies for vendors to create reviews
    - Add policies for everyone to read reviews
    
  3. Triggers
    - Update supplier's average rating and total reviews when a new review is added
*/

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id) -- One review per order
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can read reviews (needed for displaying on dashboards)
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

-- Vendors can create reviews for their own orders
CREATE POLICY "Vendors can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Function to update supplier rating
CREATE OR REPLACE FUNCTION update_supplier_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE suppliers
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE supplier_id = NEW.supplier_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE supplier_id = NEW.supplier_id
    )
  WHERE id = NEW.supplier_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update supplier rating on new review
DROP TRIGGER IF EXISTS update_supplier_rating_trigger ON reviews;
CREATE TRIGGER update_supplier_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_rating();

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_supplier_id ON reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
