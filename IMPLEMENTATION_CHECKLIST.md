# Farm-Connect Database Implementation Checklist

## ✅ Setup Checklist

### Phase 1: Database Schema (30 min)
- [ ] Open Supabase SQL Editor (Project → SQL Editor → New Query)
- [ ] Copy entire contents of `SUPABASE_MIGRATION.sql`
- [ ] Paste into SQL Editor and click **Run**
- [ ] Verify tables exist (SQL Editor → Tables)
- [ ] Check triggers and policies are enabled
- [ ] Test sample insert: `SELECT COUNT(*) FROM categories;` (should return 7)

### Phase 2: Backend Configuration (15 min)
- [ ] Confirm `backend/.env` has Supabase credentials:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Run `npm install` in `backend/` directory
- [ ] Test connection: `npm run dev`
  - Look for: `✓ Supabase connected successfully`

### Phase 3: Frontend Configuration (15 min)
- [ ] Update `my-app/.env.local`:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Run `npm install` in `my-app/` directory
- [ ] Verify imports in `lib/auth-store.ts` work

### Phase 4: Data Migration (30 min - Optional)
- [ ] Create test users via auth signup
- [ ] Insert test products into database
- [ ] Create test orders to verify flow
- [ ] Run `SELECT * FROM orders;` to confirm

### Phase 5: API Endpoint Testing (1 hour)
- [ ] Start backend: `npm run dev` (in `backend/`)
- [ ] Start frontend: `npm start` (in `my-app/`)
- [ ] Test order creation with buyerId
- [ ] Verify payment flow still works
- [ ] Check product listing endpoints
- [ ] Test seller operations

### Phase 6: Frontend Integration (2-4 hours)
- [ ] Update checkout flow to use `buyerId`
- [ ] Add product listing component
- [ ] Build seller dashboard
- [ ] Implement wishlist feature
- [ ] Add user order history view

---

## 🚀 Quick Start Commands

```bash
# Step 1: Backend setup
cd my-app/backend
npm install
npm run dev

# Step 2: Frontend setup (in new terminal)
cd my-app
npm install
npm start

# Step 3: Test with Expo
# Use Expo Go on mobile or web
```

---

## 📊 Database Verification Queries

Run these in Supabase SQL Editor to verify setup:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify categories are loaded
SELECT * FROM categories;

-- Check payment networks
SELECT * FROM payment_networks;

-- Count total data
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM user_profiles
UNION ALL
SELECT 'sellers', COUNT(*) FROM sellers
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'product_reviews', COUNT(*) FROM product_reviews;

-- Test RLS (as authenticated user)
SELECT * FROM user_profiles WHERE id = auth.uid();
```

---

## 🔌 Backend Functions Available

All these are now ready to use in `backend/db.js`:

### User Management
- ✅ `createUserProfile()` - Auto-called on auth signup
- ✅ `getUserProfile()`
- ✅ `updateUserProfile()`

### Seller Management
- ✅ `createSeller()`
- ✅ `getSeller()`
- ✅ `getSellers()`
- ✅ `updateSeller()`

### Products
- ✅ `createProduct()`
- ✅ `getProduct()`
- ✅ `getProducts()` - With search & filters
- ✅ `getFeaturedProducts()`
- ✅ `updateProduct()`
- ✅ `deleteProduct()`

### Orders
- ✅ `createOrder()` - Now requires buyerId
- ✅ `getOrder()`
- ✅ `getOrdersByBuyer()`
- ✅ `getOrdersByStatus()`
- ✅ `updateOrder()`

### Payments
- ✅ `createPayment()`
- ✅ `getPayment()`
- ✅ `getPaymentsByOrder()`
- ✅ `updatePayment()`
- ✅ `getPaymentNetworks()`

### Reviews & Wishlists
- ✅ `createReview()`
- ✅ `getProductReviews()`
- ✅ `addToWishlist()`
- ✅ `removeFromWishlist()`
- ✅ `getWishlist()`

### Analytics
- ✅ `getSalesStats()`
- ✅ `getSellerPerformance()`

---

## 📝 Key Code Changes Required

### 1. Checkout Flow (checkout.tsx)
**Before:**
```typescript
const response = await fetch(`${API_URL}/orders`, {
  method: "POST",
  body: JSON.stringify({
    buyerEmail,
    // ...
  })
});
```

**After:**
```typescript
import { supabase } from '@/lib/auth-store';

const { data: { user } } = await supabase.auth.getUser();

const response = await fetch(`${API_URL}/orders`, {
  method: "POST",
  body: JSON.stringify({
    buyerId: user.id, // ADD THIS
    buyerEmail: user.email, // Use from auth
    // ...
  })
});
```

### 2. Order Creation in Backend (server.js)
**Before:**
```javascript
const orderResult = await createOrder({
  buyerEmail,
  buyerPhone,
  totalAmount,
  // ...
});
```

**After:**
```javascript
const orderResult = await createOrder({
  buyerId, // ADD THIS from request
  buyerEmail,
  buyerPhone,
  totalAmount,
  // ...
});
```

---

## 🐛 Common Issues & Solutions

### Issue: "Supabase credentials missing"
**Solution:**
- Check `backend/.env` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Restart backend server

### Issue: "Table does not exist"
**Solution:**
- Run SUPABASE_MIGRATION.sql in SQL Editor
- Wait for query to complete
- Refresh database in Supabase dashboard

### Issue: "RLS policy violation"
**Solution:**
- Ensure you're using service role key in backend
- Anon key for frontend operations only
- Check user has correct role (buyer/seller/admin)

### Issue: "Foreign key constraint violation"
**Solution:**
- Seller must exist before creating products
- Product must exist before adding to order
- User profile must exist before creating seller account

### Issue: Orders not linked to buyer
**Solution:**
- Update checkout to pass `buyerId` from auth
- Use `await supabase.auth.getUser()` to get user ID
- Verify `buyer_id` is set in orders table

---

## 📖 Documentation Files

After setup, refer to these files:

1. **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Initial Supabase setup
2. **[SUPABASE_MIGRATION.sql](./SUPABASE_MIGRATION.sql)** - Complete database schema
3. **[DATABASE_FUNCTIONS.md](./DATABASE_FUNCTIONS.md)** - All available functions & endpoints

---

## ✨ Next: Build Features

Once database is live, build these features:

1. **Product Browse** - List products with filters
2. **Seller Profiles** - Show farm info and ratings
3. **Product Reviews** - Buy & leave feedback
4. **Order Tracking** - Real-time order status
5. **Wishlist** - Save favorite products
6. **Seller Dashboard** - Manage products & view sales
7. **Admin Dashboard** - View analytics & manage platform
8. **User Profiles** - Edit account information

---

## 🎯 Success Criteria

- [ ] Backend starts without errors
- [ ] Can create auth user
- [ ] User profile auto-created in database
- [ ] Can create order with buyerId
- [ ] Payment flow completes
- [ ] Can query products, sellers, orders
- [ ] RLS policies working (users only see their data)
- [ ] Ratings/reviews updating automatically

---

**Status:** Ready for Implementation ✅

Estimated time to full setup: **4-6 hours** (including all phases)
