# Farm-Connect Database Functionality Guide

## Complete Database Schema

The app now has full relational database functionality with the following tables and features:

### 📋 Tables Overview

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `user_profiles` | User accounts & profiles | Auth integration, role-based access |
| `sellers` | Farmer/seller accounts | Farm info, ratings, verification status |
| `categories` | Product categories | Taxonomy for marketplace |
| `products` | Marketplace items | Inventory, pricing, ratings |
| `product_reviews` | Customer reviews | Ratings, verified purchases |
| `orders` | Customer orders | Order tracking, payment status |
| `order_items` | Individual items in orders | Line items with seller tracking |
| `payments` | Payment records | Payment gateway integration |
| `payment_networks` | Mobile money providers | Ghana payment methods (MTN, AirtelTigo, Vodafone) |
| `wishlists` | Saved products | Buyer favorites |
| `admin_access_requests` | Admin approval workflow | Token-based access requests |
| `audit_logs` | System logs | Track all changes for compliance |

### 🔐 Row Level Security (RLS)

All tables have RLS enabled with policies for:
- **Buyers**: View products, create orders, manage wishlists
- **Sellers**: Manage own products, view own orders
- **Admin**: Full access to all tables
- **Public**: View active products and seller profiles

### ⚙️ Triggers & Automatic Functions

**Automatic Fields Updated**:
- `updated_at` - All tables automatically update this timestamp
- `product.rating` - Calculated from review average
- `product.total_reviews` - Count of reviews
- `sellers.rating` - Average of all products ratings
- `sellers.total_reviews` - Count of all seller reviews

**Auto-provisioned**:
- New auth users automatically create `user_profiles` entry
- Order totals calculated from `order_items`

---

## Database Functions

### User Management

```typescript
// Create user profile (called auto on auth signup)
createUserProfile({
  userId: string,
  email: string,
  fullName: string,
  role: 'buyer' | 'seller' | 'admin'
})

// Get user profile
getUserProfile(userId: string)

// Update profile
updateUserProfile(userId, { fullName, phone, address, avatarUrl, ... })
```

### Seller Management

```typescript
// Create seller/farm
createSeller({
  userId: string,
  farmName: string,
  farmLocation: string,
  bio: string
})

// Get seller with profile
getSeller(sellerId: string)

// List sellers (paginated)
getSellers({ limit: 50, offset: 0, verified: true|false })

// Update seller info
updateSeller(sellerId, { farmName, bio, yearsInBusiness, ... })
```

### Product Management

```typescript
// Create product
createProduct({
  sellerId: string,
  categoryId: number,
  name: string,
  description: string,
  price: number,
  unit: string (e.g., '/lb', '/dozen'),
  stock: number,
  imageUrl: string,
  isOrganic: boolean
})

// Get single product
getProduct(productId: string)

// List products (with filters)
getProducts({
  limit: 50,
  offset: 0,
  categoryId: number,
  sellerId: string,
  search: string // Full-text search
})

// Get featured products
getFeaturedProducts(limit: 10)

// Update product
updateProduct(productId, { price, stock, isOrganic, isFeatured, ... })

// Soft-delete product
deleteProduct(productId) // Sets is_active = false
```

### Order Management

```typescript
// Create order (now requires buyerId)
createOrder({
  buyerId: string,
  buyerEmail: string,
  buyerPhone: string,
  totalAmount: number,
  deliveryAddress: string,
  notes: string,
  paymentMethod: 'card' | 'momo'
})

// Get order with items and payments
getOrder(orderId: string)

// Get user's orders
getOrdersByBuyer(buyerId, { limit: 50, offset: 0 })

// Filter by status
getOrdersByStatus('pending' | 'confirmed' | 'shipped' | 'delivered', { ... })

// Update order status
updateOrder(orderId, {
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded',
  deliveryAddress: string,
  estimatedDeliveryDate: date,
  ...
})
```

### Order Items

```typescript
// Add item to order
addOrderItem({
  orderId: string,
  productId: string,
  sellerId: string,
  productName: string,
  price: number,
  quantity: number,
  unit: string
})

// Get order items
getOrderItems(orderId: string)
```

### Reviews & Ratings

```typescript
// Create review
createReview({
  productId: string,
  buyerId: string,
  rating: number, // 1-5
  title: string,
  comment: string
})

// Get product reviews
getProductReviews(productId, { limit: 20, offset: 0 })
```

### Payments

```typescript
// Create payment record
createPayment({
  orderId: string,
  paymentMethod: 'card' | 'momo',
  amount: number,
  status: 'pending' | 'completed' | 'failed',
  referenceId: string
})

// Get payment
getPayment(paymentId: string)

// Get order payments
getPaymentsByOrder(orderId: string)

// Update payment status
updatePayment(paymentId, { status, transactionId, gatewayResponse, ... })

// Update by order + method
updatePaymentByOrder(orderId, paymentMethod, { status, ... })

// Get payment networks
getPaymentNetworks() // Returns active networks
```

### Wishlist Management

```typescript
// Add to wishlist
addToWishlist(buyerId: string, productId: string)

// Remove from wishlist
removeFromWishlist(buyerId: string, productId: string)

// Get buyer's wishlist
getWishlist(buyerId: string)
```

### Analytics

```typescript
// Sales summary (last 30 days by default)
getSalesStats(days: 30)
// Returns: { sale_date, order_count, unique_buyers, total_revenue, delivered_count }

// Seller performance metrics
getSellerPerformance()
// Returns: { farm_name, product_count, rating, completed_orders, total_revenue }
```

### Categories

```typescript
// Get all active categories
getCategories()
// Returns: { id, name, slug, description, icon_url }
```

---

## API Endpoints Updated

### Checkout Flow
```
POST /orders
  - Now creates order linked to buyer_id
  - Returns: { ok, orderId, orderStatus, paymentStatus }

POST /orders/:orderId/pay-card
  - Requires valid buyerId context
  
POST /orders/:orderId/pay-momo
  - Requires valid buyerId context

GET /orders/:orderId
  - Includes nested order_items and payments
```

### New Endpoints (Ready to implement)
```
GET /products
  - Paginated, searchable product listing

GET /products/:id
  - Product details with seller & reviews

GET /sellers
  - List sellers with ratings

GET /sellers/:id
  - Seller profile with farm info

POST /reviews
  - Create product review

GET /products/:id/reviews
  - Get product reviews

GET /user/orders
  - Get current user's orders (requires auth)

GET /categories
  - List all categories

POST /wishlist
  - Add to wishlist

GET /wishlist
  - Get user's wishlist

GET /analytics/sales
  - Sales dashboard data

GET /analytics/sellers
  - Seller performance rankings
```

---

## Migration from Old API

### Old Code → New Code

**Before** (checkout.tsx creating order):
```typescript
const response = await fetch(`${API_URL}/orders`, {
  method: "POST",
  body: JSON.stringify({
    buyerEmail,
    buyerPhone,
    items: cart,
    totalAmount,
    deliveryAddress,
    notes,
  })
});
```

**After** (requires user authentication):
```typescript
import { supabase } from '@/lib/auth-store';

const { data: { user } } = await supabase.auth.getUser();

const response = await fetch(`${API_URL}/orders`, {
  method: "POST",
  body: JSON.stringify({
    buyerId: user.id, // NEW: Link to authenticated user
    buyerEmail: user.email,
    buyerPhone,
    items: cart,
    totalAmount,
    deliveryAddress,
    notes,
  })
});
```

---

## Setup Instructions

### 1. Run Database Migration

Copy & paste the entire `SUPABASE_MIGRATION.sql` into your **Supabase SQL Editor**:

```bash
# In Supabase Dashboard
1. Go to SQL Editor
2. Click "New Query"
3. Paste contents of SUPABASE_MIGRATION.sql
4. Click "Run"
```

### 2. Verify Tables Created

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 3. Test with Sample Data

```sql
-- Create test seller (assumes auth user with this ID exists)
INSERT INTO sellers (id, farm_name, farm_location, bio)
VALUES (
  'your-user-id-here',
  'Green Valley Farm',
  'Accra, Ghana',
  'Organic vegetables and fruits'
);

-- Create test product
INSERT INTO products (seller_id, category_id, name, price, unit, stock)
VALUES (
  'your-user-id-here',
  1,
  'Organic Tomatoes',
  4.99,
  '/lb',
  150
);
```

### 4. Update Backend Code

The backend is already updated in `backend/db.js` with full CRUD functions.

### 5. Update Frontend Auth-Store

The frontend is already updated in `lib/auth-store.ts` to use Supabase Auth.

---

## Testing the Database

### Test User Creation
```bash
curl -X POST http://localhost:5050/orders \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "user-id-from-auth",
    "buyerEmail": "buyer@example.com",
    "buyerPhone": "+233123456789",
    "totalAmount": 45.99,
    "deliveryAddress": "123 Main St, Accra",
    "paymentMethod": "momo"
  }'
```

### Test Product Creation
```typescript
import { createProduct } from '@/api/products';

const product = await createProduct({
  sellerId: user.id,
  categoryId: 1,
  name: 'Fresh Apples',
  description: 'Crisp and sweet',
  price: 3.99,
  unit: '/lb',
  stock: 200,
  imageUrl: 'https://...',
  isOrganic: true
});
```

---

## Important Notes

### 🔐 Security
- All endpoints check RLS policies automatically
- Service role key used only for admin operations in backend
- Anon key used for public operations
- Enable row-level security on production

### ⚡ Performance
- Products indexed by seller, category, and active status
- Orders indexed by buyer and creation date
- Payment networks cached in-memory after first fetch

### 🔄 Data Consistency
- Foreign keys enforce referential integrity
- Triggers prevent orphaned data
- Cascading deletes clean up related records

### 📈 Scalability
- Supabase handles auto-scaling
- RLS optimized for multi-tenant access patterns
- Built-in backup and recovery

---

## Next Steps

1. **Implement Product Listing Page**
   - Use `getProducts()` with pagination
   - Add search and category filters

2. **Build Seller Dashboard**
   - Show seller products with `getProducts(sellerId)`
   - Display analytics with `getSalesStats()` and `getSellerPerformance()`

3. **Add User Order History**
   - Use `getOrdersByBuyer()` with pagination
   - Show order tracking status

4. **Implement Reviews**
   - Add review form on product page
   - Display reviews with ratings

5. **Add Wishlist Feature**
   - Save/remove from wishlist
   - Quick checkout from wishlist

6. **Setup Admin Dashboard**
   - Use `getSalesStats()` for revenue charts
   - Monitor orders by status
   - Track seller performance

---

## Troubleshooting

### "buyer_id is required" Error
- Ensure user is authenticated before creating orders
- Pass `auth.uid()` as buyerId in order creation

### "Violates foreign key constraint"
- Seller must exist before creating products
- Product must exist before creating order items

### "RLS policy violation"
- Check user has correct role for action
- Use service role key for admin operations only

### "Table not found"
- Run SUPABASE_MIGRATION.sql in SQL Editor
- Verify table names in Supabase dashboard

---

For complete API documentation, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
