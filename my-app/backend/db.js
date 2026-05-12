const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
let databaseMode = 'supabase';

const initDatabase = async () => {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase credentials missing. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Test connection
    const { error: pingError } = await supabase.from('orders').select('id').limit(1);
    if (pingError && pingError.code !== 'PGRST116') {
      throw pingError;
    }

    databaseMode = 'supabase';
    console.log('✓ Supabase connected successfully');
    return { ok: true, mode: databaseMode };
  } catch (error) {
    console.error('✗ Supabase initialization error:', error?.message || error);
    return { ok: false, mode: databaseMode, error: error?.message || String(error) };
  }
};

// ============================================================================
// USERS / PROFILES
// ============================================================================

const createUserProfile = async ({ userId, email, fullName, role = 'buyer' }) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{ id: userId, email, full_name: fullName, role }])
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating user profile:', error?.message);
    throw error;
  }
};

const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching user profile:', error?.message);
    throw error;
  }
};

const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating user profile:', error?.message);
    throw error;
  }
};

// ============================================================================
// SELLERS / FARMS
// ============================================================================

const createSeller = async ({ userId, farmName, farmLocation, bio }) => {
  try {
    const { data, error } = await supabase
      .from('sellers')
      .insert([{ id: userId, farm_name: farmName, farm_location: farmLocation, bio }])
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating seller:', error?.message);
    throw error;
  }
};

const getSeller = async (sellerId) => {
  try {
    const { data, error } = await supabase
      .from('sellers')
      .select(`*,user_profiles(email,full_name,avatar_url,phone,address)`)
      .eq('id', sellerId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching seller:', error?.message);
    throw error;
  }
};

const getSellers = async ({ limit = 50, offset = 0, verified = null } = {}) => {
  try {
    let query = supabase
      .from('sellers')
      .select(`*,user_profiles(email,full_name,avatar_url)`, { count: 'exact' })
      .eq('is_active', true);

    if (verified !== null) {
      query = query.eq('is_verified', verified);
    }

    const { data, error, count } = await query
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { sellers: data || [], total: count };
  } catch (error) {
    console.error('Error fetching sellers:', error?.message);
    throw error;
  }
};

const updateSeller = async (sellerId, updates) => {
  try {
    const { data, error } = await supabase
      .from('sellers')
      .update(updates)
      .eq('id', sellerId)
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating seller:', error?.message);
    throw error;
  }
};

// ============================================================================
// CATEGORIES
// ============================================================================

const getCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error?.message);
    throw error;
  }
};

// ============================================================================
// PRODUCTS
// ============================================================================

const createProduct = async ({
  sellerId,
  categoryId,
  name,
  description,
  price,
  unit,
  stock,
  imageUrl,
  isOrganic = false,
}) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        seller_id: sellerId,
        category_id: categoryId,
        name,
        description,
        price,
        unit,
        stock,
        image_url: imageUrl,
        is_organic: isOrganic,
      }])
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating product:', error?.message);
    throw error;
  }
};

const getProduct = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`*,sellers(farm_name,rating),categories(name)`)
      .eq('id', productId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching product:', error?.message);
    throw error;
  }
};

const getProducts = async ({ limit = 50, offset = 0, categoryId = null, sellerId = null, search = null } = {}) => {
  try {
    let query = supabase
      .from('products')
      .select(`*,sellers(farm_name,rating),categories(name)`, { count: 'exact' })
      .eq('is_active', true);

    if (categoryId) query = query.eq('category_id', categoryId);
    if (sellerId) query = query.eq('seller_id', sellerId);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { products: data || [], total: count };
  } catch (error) {
    console.error('Error fetching products:', error?.message);
    throw error;
  }
};

const getFeaturedProducts = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`*,sellers(farm_name,rating),categories(name)`)
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('rating', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching featured products:', error?.message);
    throw error;
  }
};

const updateProduct = async (productId, updates) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating product:', error?.message);
    throw error;
  }
};

const deleteProduct = async (productId) => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting product:', error?.message);
    throw error;
  }
};

// ============================================================================
// PRODUCT REVIEWS
// ============================================================================

const createReview = async ({ productId, buyerId, rating, title, comment }) => {
  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .insert([{
        product_id: productId,
        buyer_id: buyerId,
        rating,
        title,
        comment,
        is_verified_purchase: true,
      }])
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating review:', error?.message);
    throw error;
  }
};

const getProductReviews = async (productId, { limit = 20, offset = 0 } = {}) => {
  try {
    const { data, error, count } = await supabase
      .from('product_reviews')
      .select(`*,user_profiles(full_name,avatar_url)`, { count: 'exact' })
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return { reviews: data || [], total: count };
  } catch (error) {
    console.error('Error fetching reviews:', error?.message);
    throw error;
  }
};

// ============================================================================
// ORDERS
// ============================================================================

const createOrder = async ({
  buyerId,
  buyerEmail,
  buyerPhone,
  totalAmount,
  deliveryAddress,
  notes,
  paymentMethod,
}) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        buyer_id: buyerId,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone || null,
        total_amount: totalAmount,
        currency: 'GHS',
        payment_method: paymentMethod,
        delivery_address: deliveryAddress,
        notes: notes || null,
      }])
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating order:', error?.message);
    throw error;
  }
};

const getOrder = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`*,order_items(id,product_id,seller_id,product_name,price,quantity,unit,subtotal),payments(*)`)
      .eq('id', orderId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching order:', error?.message);
    throw error;
  }
};

const getOrdersByBuyer = async (buyerId, { limit = 50, offset = 0 } = {}) => {
  try {
    const { data, error, count } = await supabase
      .from('orders')
      .select(`*,order_items(id,product_name,price,quantity),payments(status)`, { count: 'exact' })
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return { orders: data || [], total: count };
  } catch (error) {
    console.error('Error fetching buyer orders:', error?.message);
    throw error;
  }
};

const getOrdersByStatus = async (status, { limit = 50, offset = 0 } = {}) => {
  try {
    const { data, error, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('order_status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return { orders: data || [], total: count };
  } catch (error) {
    console.error('Error fetching orders by status:', error?.message);
    throw error;
  }
};

const updateOrder = async (orderId, updates) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating order:', error?.message);
    throw error;
  }
};

// ============================================================================
// ORDER ITEMS
// ============================================================================

const addOrderItem = async ({
  orderId,
  productId,
  sellerId,
  productName,
  price,
  quantity,
  unit,
}) => {
  try {
    const subtotal = parseFloat(price) * parseInt(quantity);
    const { data, error } = await supabase
      .from('order_items')
      .insert([{
        order_id: orderId,
        product_id: productId,
        seller_id: sellerId,
        product_name: productName,
        price,
        quantity,
        unit,
        subtotal,
      }])
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error adding order item:', error?.message);
    throw error;
  }
};

const getOrderItems = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching order items:', error?.message);
    throw error;
  }
};

// Legacy: compatibility function (maps to new function)
const getOrderItemsByOrderId = async (orderId) => {
  return getOrderItems(orderId);
};

// ============================================================================
// PAYMENTS
// ============================================================================

const createPayment = async ({
  orderId,
  paymentMethod,
  amount,
  status = 'pending',
  referenceId,
}) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([{
        order_id: orderId,
        payment_method: paymentMethod,
        amount,
        currency: 'GHS',
        status,
        reference_id: referenceId,
      }])
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating payment:', error?.message);
    throw error;
  }
};

const getPayment = async (paymentId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching payment:', error?.message);
    throw error;
  }
};

const getPaymentsByOrder = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payments:', error?.message);
    throw error;
  }
};

// Legacy: compatibility function
const getPaymentsByOrderId = async (orderId) => {
  return getPaymentsByOrder(orderId);
};

const updatePayment = async (paymentId, updates) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', paymentId)
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating payment:', error?.message);
    throw error;
  }
};

const updatePaymentByOrder = async (orderId, paymentMethod, updates) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('order_id', orderId)
      .eq('payment_method', paymentMethod)
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating payment by order:', error?.message);
    throw error;
  }
};

// Legacy: compatibility function
const updatePaymentStatus = async ({ orderId, paymentMethod, status }) => {
  return updatePaymentByOrder(orderId, paymentMethod, { status });
};

// ============================================================================
// PAYMENT NETWORKS
// ============================================================================

const getPaymentNetworks = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_networks')
      .select('code, name, country')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payment networks:', error?.message);
    return [
      { code: 'MTN', name: 'MTN Mobile Money', country: 'Ghana' },
      { code: 'AIRTELTIGO', name: 'AirtelTigo Money', country: 'Ghana' },
      { code: 'VODAFONE', name: 'Vodafone Cash', country: 'Ghana' },
    ];
  }
};

// Legacy: compatibility function
const getSupportedPaymentNetworks = async () => {
  return getPaymentNetworks();
};

// ============================================================================
// WISHLISTS
// ============================================================================

const addToWishlist = async (buyerId, productId) => {
  try {
    const { data, error } = await supabase
      .from('wishlists')
      .insert([{ buyer_id: buyerId, product_id: productId }])
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error adding to wishlist:', error?.message);
    throw error;
  }
};

const removeFromWishlist = async (buyerId, productId) => {
  try {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('buyer_id', buyerId)
      .eq('product_id', productId);
    if (error) throw error;
  } catch (error) {
    console.error('Error removing from wishlist:', error?.message);
    throw error;
  }
};

const getWishlist = async (buyerId) => {
  try {
    const { data, error } = await supabase
      .from('wishlists')
      .select(`product_id,products(id,name,price,image_url,rating,sellers(farm_name))`)
      .eq('buyer_id', buyerId);
    if (error) throw error;
    return (data || []).map(item => item.products).filter(Boolean);
  } catch (error) {
    console.error('Error fetching wishlist:', error?.message);
    throw error;
  }
};

// ============================================================================
// ANALYTICS
// ============================================================================

const getSalesStats = async (days = 30) => {
  try {
    const { data, error } = await supabase
      .from('daily_sales_summary')
      .select('*')
      .gte('sale_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('sale_date', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching sales stats:', error?.message);
    throw error;
  }
};

const getSellerPerformance = async () => {
  try {
    const { data, error } = await supabase
      .from('seller_performance')
      .select('*')
      .order('total_revenue', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching seller performance:', error?.message);
    throw error;
  }
};

// Legacy: compatibility function
const getOrderById = async (orderId) => {
  return getOrder(orderId);
};

// Legacy: compatibility function for old API
const updateOrderStatus = async ({ orderId, paymentStatus, orderStatus, paymentMethod }) => {
  const updates = {};
  if (paymentStatus) updates.payment_status = paymentStatus;
  if (orderStatus) updates.order_status = orderStatus;
  if (paymentMethod) updates.payment_method = paymentMethod;
  return updateOrder(orderId, updates);
};

module.exports = {
  supabase,
  initDatabase,
  getDatabaseMode: () => databaseMode,
  // Users
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  // Sellers
  createSeller,
  getSeller,
  getSellers,
  updateSeller,
  // Categories
  getCategories,
  // Products
  createProduct,
  getProduct,
  getProducts,
  getFeaturedProducts,
  updateProduct,
  deleteProduct,
  // Reviews
  createReview,
  getProductReviews,
  // Orders
  createOrder,
  getOrder,
  getOrderById, // Legacy
  getOrdersByBuyer,
  getOrdersByStatus,
  updateOrder,
  updateOrderStatus, // Legacy
  // Order Items
  addOrderItem,
  getOrderItems,
  getOrderItemsByOrderId, // Legacy
  // Payments
  createPayment,
  getPayment,
  getPaymentsByOrder,
  getPaymentsByOrderId, // Legacy
  updatePayment,
  updatePaymentByOrder,
  updatePaymentStatus, // Legacy
  getPaymentNetworks,
  getSupportedPaymentNetworks, // Legacy
  // Wishlists
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  // Analytics
  getSalesStats,
  getSellerPerformance,
};
