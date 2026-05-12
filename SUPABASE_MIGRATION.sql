-- ============================================================================
-- FARM-CONNECT COMPLETE DATABASE SCHEMA & RLS POLICIES
-- ============================================================================
-- Run this in your Supabase SQL Editor to set up the complete database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS & PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  avatar_url TEXT,
  phone VARCHAR(20),
  address TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
  ('Vegetables', 'vegetables', 'Fresh and organic vegetables'),
  ('Fruits', 'fruits', 'Seasonal and exotic fruits'),
  ('Dairy', 'dairy', 'Milk, cheese, and dairy products'),
  ('Grains', 'grains', 'Cereals, flour, and grain products'),
  ('Poultry', 'poultry', 'Chicken, eggs, and poultry products'),
  ('Herbs', 'herbs', 'Fresh and dried herbs'),
  ('Honey', 'honey', 'Raw and processed honey')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. SELLERS & FARMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  farm_name VARCHAR(255) NOT NULL,
  farm_location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  bio TEXT,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  years_in_business INT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. PRODUCTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  unit VARCHAR(50) NOT NULL,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  is_organic BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_unique UNIQUE (seller_id, name)
);

CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);

-- ============================================================================
-- 5. PRODUCT REVIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT one_review_per_product UNIQUE (product_id, buyer_id)
);

CREATE INDEX idx_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_reviews_buyer ON product_reviews(buyer_id);

-- ============================================================================
-- 6. ORDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  buyer_email VARCHAR(255) NOT NULL,
  buyer_phone VARCHAR(20),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  currency VARCHAR(3) DEFAULT 'GHS',
  payment_method VARCHAR(20) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  order_status VARCHAR(50) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  delivery_address TEXT,
  delivery_notes TEXT,
  notes TEXT,
  reference_id VARCHAR(255),
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================================================
-- 7. ORDER ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit VARCHAR(50) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_seller ON order_items(seller_id);

-- ============================================================================
-- 8. PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) DEFAULT 'GHS',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference_id VARCHAR(255),
  transaction_id VARCHAR(255),
  gateway_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_reference ON payments(reference_id);

-- ============================================================================
-- 9. PAYMENT NETWORKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_networks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,
  country VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO payment_networks (name, code, country) VALUES
  ('MTN Mobile Money', 'MTN', 'Ghana'),
  ('AirtelTigo Money', 'AIRTELTIGO', 'Ghana'),
  ('Vodafone Cash', 'VODAFONE', 'Ghana')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 10. WISHLISTS / FAVORITES
-- ============================================================================

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wishlist_unique UNIQUE (buyer_id, product_id)
);

CREATE INDEX idx_wishlists_buyer ON wishlists(buyer_id);
CREATE INDEX idx_wishlists_product ON wishlists(product_id);

-- ============================================================================
-- 11. ADMIN ACCESS REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approver_email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  client_ip VARCHAR(45),
  approved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_requests_status ON admin_access_requests(status);
CREATE INDEX idx_admin_requests_token ON admin_access_requests(token);
CREATE INDEX idx_admin_requests_expires ON admin_access_requests(expires_at);

-- ============================================================================
-- 12. AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles RLS
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable" ON user_profiles
  FOR SELECT USING (true);

-- Sellers RLS
CREATE POLICY "Sellers can view their own profile" ON sellers
  FOR SELECT USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "Sellers can update their own profile" ON sellers
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public seller profiles are viewable" ON sellers
  FOR SELECT USING (is_active = true);

-- Products RLS
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true OR auth.uid() IN (SELECT id FROM sellers WHERE id = seller_id));

CREATE POLICY "Sellers can manage their own products" ON products
  FOR ALL USING (auth.uid() = seller_id OR (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Product Reviews RLS
CREATE POLICY "Anyone can view reviews" ON product_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own reviews" ON product_reviews
  FOR UPDATE USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

-- Orders RLS
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = buyer_id OR (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (auth.uid() = buyer_id OR (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK (auth.uid() = buyer_id OR (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Order Items RLS
CREATE POLICY "Users can view their own order items" ON order_items
  FOR SELECT USING (auth.uid() IN (SELECT buyer_id FROM orders WHERE id = order_id) OR (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Payments RLS
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() IN (SELECT buyer_id FROM orders WHERE id = order_id) OR (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "System can create payments" ON payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payments" ON payments
  FOR UPDATE WITH CHECK (true);

-- Wishlists RLS
CREATE POLICY "Users can manage their own wishlist" ON wishlists
  FOR ALL USING (auth.uid() = buyer_id);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to update user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'buyer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update product ratings from reviews
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET
    rating = (SELECT AVG(rating)::numeric(3,2) FROM product_reviews WHERE product_id = NEW.product_id),
    total_reviews = (SELECT COUNT(*) FROM product_reviews WHERE product_id = NEW.product_id),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for product rating updates
DROP TRIGGER IF EXISTS on_review_changed ON product_reviews;
CREATE TRIGGER on_review_changed
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- Function to update seller ratings
CREATE OR REPLACE FUNCTION public.update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sellers SET
    rating = (
      SELECT AVG(pr.rating)::numeric(3,2)
      FROM product_reviews pr
      JOIN products p ON p.id = pr.product_id
      WHERE p.seller_id = NEW.seller_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM product_reviews pr
      JOIN products p ON p.id = pr.product_id
      WHERE p.seller_id = NEW.seller_id
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.seller_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for seller rating updates
DROP TRIGGER IF EXISTS on_seller_review_changed ON product_reviews;
CREATE TRIGGER on_seller_review_changed
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_seller_rating();

-- Function to automatically update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sellers_updated_at ON sellers;
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- USEFUL QUERIES / VIEWS
-- ============================================================================

-- View: Top rated products
CREATE OR REPLACE VIEW top_rated_products AS
SELECT
  p.id,
  p.name,
  p.price,
  p.rating,
  p.total_reviews,
  s.farm_name,
  c.name as category
FROM products p
JOIN sellers s ON p.seller_id = s.id
JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
ORDER BY p.rating DESC, p.total_reviews DESC
LIMIT 20;

-- View: Seller performance
CREATE OR REPLACE VIEW seller_performance AS
SELECT
  s.id,
  s.farm_name,
  COUNT(DISTINCT p.id) as product_count,
  s.rating,
  s.total_reviews,
  COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.id END) as completed_orders,
  COALESCE(SUM(CASE WHEN o.order_status = 'delivered' THEN oi.subtotal END), 0) as total_revenue
FROM sellers s
LEFT JOIN products p ON s.id = p.seller_id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE s.is_active = true
GROUP BY s.id, s.farm_name, s.rating, s.total_reviews;

-- View: Daily sales summary
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT
  DATE(o.created_at) as sale_date,
  COUNT(DISTINCT o.id) as order_count,
  COUNT(DISTINCT o.buyer_id) as unique_buyers,
  SUM(o.total_amount) as total_revenue,
  COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.id END) as delivered_count
FROM orders o
GROUP BY DATE(o.created_at)
ORDER BY sale_date DESC;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
