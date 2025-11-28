/*
  # MarketConnect Database Schema

  Complete database schema for the MarketConnect application.
  This file contains all table definitions, relationships, and security policies.

  ## Tables
  1. vendors - Street food vendor profiles
  2. suppliers - Raw material supplier profiles
  3. products - Products/raw materials offered by suppliers
  4. orders - Orders placed by vendors to suppliers
  5. order_items - Individual items in each order
  6. delivery_partners - Delivery partner profiles

  ## Security
  - RLS enabled on all tables
  - Policies restrict access based on user authentication and ownership
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- VENDORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  business_type TEXT NOT NULL,
  gst_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendors
CREATE POLICY "Users can view own vendor profile"
  ON vendors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendor profile"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendor profile"
  ON vendors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendor profile"
  ON vendors FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_city ON vendors(city);

-- =====================================================
-- SUPPLIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  gst_number TEXT,
  fssai_license TEXT,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Anyone can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own supplier profile"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supplier profile"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own supplier profile"
  ON suppliers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_city ON suppliers(city);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON suppliers(rating DESC);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  price_per_unit NUMERIC(10,2) NOT NULL CHECK (price_per_unit >= 0),
  min_order_quantity INTEGER NOT NULL DEFAULT 1 CHECK (min_order_quantity > 0),
  stock_available BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Anyone can view available products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Suppliers can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

CREATE POLICY "Suppliers can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_id
      AND suppliers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

CREATE POLICY "Suppliers can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_available);

-- =====================================================
-- DELIVERY PARTNERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS delivery_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  license_number TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_partners
CREATE POLICY "Delivery partners can view own profile"
  ON delivery_partners FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own delivery partner profile"
  ON delivery_partners FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Delivery partners can update own profile"
  ON delivery_partners FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_delivery_partners_user_id ON delivery_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_city ON delivery_partners(city);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_active ON delivery_partners(is_active);

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  delivery_partner_id UUID REFERENCES delivery_partners(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled')),
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  delivery_address TEXT NOT NULL,
  delivery_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Vendors can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Suppliers can view orders for them"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

CREATE POLICY "Delivery partners can view assigned orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_partners
      WHERE delivery_partners.id = delivery_partner_id
      AND delivery_partners.user_id = auth.uid()
    )
  );

CREATE POLICY "Delivery partners can view unassigned ready orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    status = 'ready_for_pickup'
    AND delivery_partner_id IS NULL
    AND EXISTS (
      SELECT 1 FROM delivery_partners
      WHERE delivery_partners.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update own pending orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_id
      AND vendors.user_id = auth.uid()
    )
    AND status = 'pending'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Suppliers can update order status"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_id
      AND suppliers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

CREATE POLICY "Delivery partners can update assigned orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_partners
      WHERE delivery_partners.id = delivery_partner_id
      AND delivery_partners.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_partners
      WHERE delivery_partners.id = delivery_partner_id
      AND delivery_partners.user_id = auth.uid()
    )
  );

CREATE POLICY "Delivery partners can assign themselves to ready orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    status = 'ready_for_pickup'
    AND delivery_partner_id IS NULL
    AND EXISTS (
      SELECT 1 FROM delivery_partners
      WHERE delivery_partners.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_partners
      WHERE delivery_partners.user_id = auth.uid()
      AND delivery_partners.id = delivery_partner_id
    )
  );

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_id ON orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner_id ON orders(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_items
CREATE POLICY "Users can view order items for accessible orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
      AND (
        EXISTS (
          SELECT 1 FROM vendors
          WHERE vendors.id = orders.vendor_id
          AND vendors.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM suppliers
          WHERE suppliers.id = orders.supplier_id
          AND suppliers.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM delivery_partners
          WHERE delivery_partners.id = orders.delivery_partner_id
          AND delivery_partners.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Order creators can insert order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      JOIN vendors ON vendors.id = orders.vendor_id
      WHERE orders.id = order_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for each table
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_partners_updated_at
  BEFORE UPDATE ON delivery_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPFUL VIEWS (Optional)
-- =====================================================

-- View for orders with full details
CREATE OR REPLACE VIEW order_details AS
SELECT
  o.id,
  o.order_number,
  o.status,
  o.total_amount,
  o.delivery_address,
  o.created_at,
  v.business_name as vendor_business_name,
  v.owner_name as vendor_owner_name,
  v.phone as vendor_phone,
  s.business_name as supplier_business_name,
  s.owner_name as supplier_owner_name,
  s.phone as supplier_phone,
  dp.full_name as delivery_partner_name,
  dp.phone as delivery_partner_phone
FROM orders o
LEFT JOIN vendors v ON o.vendor_id = v.id
LEFT JOIN suppliers s ON o.supplier_id = s.id
LEFT JOIN delivery_partners dp ON o.delivery_partner_id = dp.id;
