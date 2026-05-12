# FarmConnect Checkout - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Set Up PostgreSQL
```bash
# Ensure PostgreSQL is running on localhost:5432
# Default user: postgres, password: postgres

# Create database (if not exists):
createdb -U postgres farmconnect
```

### Step 3: Configure Payment Keys (Optional for Testing)
Edit `backend/.env`:
```env
# For now, use test/dummy values
PAYSTACK_SECRET_KEY=your_paystack_test_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_demo
```

### Step 4: Start Backend
```bash
npm start
# Should see: ✓ Database initialized successfully
#            [FarmConnect Backend] running on http://localhost:5050
```

### Step 5: Start App
```bash
cd ../my-app
npm start
# Scan QR with Expo Go or press 'w' for web
```

## 📱 Test Checkout Flow

1. **Open App** → Navigate to **Buyers** tab
2. **Add Items** → Tap "Add" on any product
3. **Open Cart** → Tap cart icon (top right)
4. **Checkout** → Tap "Checkout" button
5. **Fill Form** → Enter name, email, phone, address
6. **Select Payment** → Choose Card or Mobile Money
7. **Complete** → Tap "Complete Payment"

### Test Payment Methods

#### Card (Paystack)
- Test Card: `4111111111111111`
- CVV: Any 3 digits
- Expiry: Any future date

#### Mobile Money (Ghana)
- Phone: `0554000000` or `+233554000000`
- Network: MTN, AirtelTigo, or Vodafone
- USSD code displayed after selection

## 📊 Database Schema

### Orders Table
```sql
id (UUID) → Order ID
buyer_email → Email address
buyer_phone → Phone number
total_amount → Total in GHS
payment_method → 'card' or 'momo'
payment_status → 'pending' | 'completed' | 'failed'
order_status → 'pending' | 'confirmed' | 'shipped'
created_at → Timestamp
```

### Order Items Table
```sql
order_id → References orders(id)
product_id → Product ID
product_name → Product name
price → Unit price
quantity → Quantity ordered
subtotal → price × quantity
```

### Payments Table
```sql
order_id → References orders(id)
payment_method → 'card' or 'momo'
amount → Payment amount
status → 'initiated' | 'completed' | 'failed'
reference_id → Paystack reference or MoMo reference
```

## 🔗 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/orders` | Create new order |
| GET | `/orders/:id` | Get order details |
| POST | `/orders/:id/pay-card` | Initiate card payment |
| GET | `/orders/:id/verify-card` | Verify card payment |
| POST | `/orders/:id/pay-momo` | Initiate mobile money |
| GET | `/orders/:id/verify-momo` | Verify mobile money |
| GET | `/payment/networks` | List payment networks |

## 📁 New Files Created

| File | Purpose |
|------|---------|
| `app/checkout.tsx` | 3-step checkout UI (details → payment → confirm) |
| `backend/db.js` | PostgreSQL connection and schema initialization |
| `backend/paystack-payment.js` | Paystack card payment integration |
| `backend/momo-payment.js` | Ghana mobile money integration |
| `CHECKOUT_SETUP.md` | Complete setup documentation |

## ✅ What's Working

✅ Add items to cart  
✅ Remove items from cart  
✅ Adjust quantities  
✅ Checkout navigation  
✅ Buyer details form validation  
✅ Order creation in database  
✅ Card payment (Paystack) - test mode  
✅ Mobile money (Ghana networks) - test mode  
✅ Order status tracking  

## 🔧 Configuration

### For Production

1. **Paystack**: Get live API keys from https://dashboard.paystack.co
2. **Mobile Money**: Contact your provider or use aggregator (Flutterwave, Payfort)
3. **Database**: Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
4. **Backend URL**: Update `EXPO_PUBLIC_ADMIN_APPROVAL_API_URL` in `my-app/.env`

### Test Data

```javascript
// Example test order
{
  buyerEmail: "test@example.com",
  buyerPhone: "0554000000",
  items: [
    { id: 1, name: "Tomato", price: 4.99, qty: 2 }
  ],
  totalAmount: 9.98,
  deliveryAddress: "123 Main St, Accra, Ghana"
}
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL not running - start it first |
| `Database tables don't exist` | Backend not started - run `npm start` in `/backend` |
| `Cart disappears after checkout` | Clear app cache: `npm start -- --clear` |
| `Payment page white screen` | Check browser console for API errors |
| `Invalid phone format` | Use Ghana format: `0554000000` (10 digits) |

## 📞 Support

For complete setup details, see [CHECKOUT_SETUP.md](./CHECKOUT_SETUP.md)

## 🎯 Next Steps

1. ✅ Test basic checkout flow
2. Integrate real Paystack account
3. Get Ghana mobile money provider API access
4. Set up order confirmation emails
5. Deploy to production

---

**Ready?** Start with: `cd backend && npm start`
