# FarmConnect Checkout System - Setup Guide

## Overview

This document provides a complete setup guide for the checkout system with **Paystack** (card payments) and **Ghana Mobile Money** (MTN, AirtelTigo, Vodafone) integration.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ Buyer Screen │→ │ Checkout UI  │→ │ Payment Processing │ │
│  │ (Add to cart)│  │(Steps 1-3)   │  │(Card or Mobile $)  │ │
│  └──────────────┘  └──────────────┘  └────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP REST API
                         ↓
┌──────────────────────────────────────────────────────────────┐
│              Backend Server (Express.js)                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  POST   /orders                  - Create new order    │ │
│  │  GET    /orders/:id              - Get order details   │ │
│  │  POST   /orders/:id/pay-card     - Initiate Paystack   │ │
│  │  GET    /orders/:id/verify-card  - Verify payment      │ │
│  │  POST   /orders/:id/pay-momo     - Initiate mobile $   │ │
│  │  GET    /orders/:id/verify-momo  - Verify mobile $     │ │
│  │  GET    /payment/networks        - List networks       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                         ↓↑                                    │
│         ┌───────────────┴───────────────┬────────────────┐    │
│         ↓                               ↓                ↓    │
│   ┌──────────────┐            ┌──────────────────┐  ┌──────┐ │
│   │ PostgreSQL   │            │ Paystack API     │  │MoMo  │ │
│   │ Database     │            │ Payment Gateway  │  │API   │ │
│   └──────────────┘            └──────────────────┘  └──────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Required
- **Node.js** (v14+)
- **PostgreSQL** (v12+) - For order storage
- **npm** or **yarn**

### Optional
- **Paystack Account** (free) - For card payments
- **Mobile Money API Access** - For Ghana Mobile Money
- **Git** - For version control

## Step 1: Database Setup

### 1.1 Install PostgreSQL

#### Windows
```bash
# Download from: https://www.postgresql.org/download/windows/
# During installation, set password for postgres user
# Default port: 5432
```

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

#### Linux
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 1.2 Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE farmconnect;

# Create user (optional, or use default postgres user)
CREATE USER farmconnect WITH PASSWORD 'your_password';
ALTER ROLE farmconnect CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE farmconnect TO farmconnect;

# Exit
\q
```

### 1.3 Update .env

```bash
cd backend

# Copy example to actual .env file
cp .env.example .env

# Edit .env with your PostgreSQL credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=farmconnect
DB_USER=postgres
DB_PASSWORD=postgres
```

## Step 2: Payment Gateway Setup

### 2.1 Paystack (Card Payments)

1. **Create Free Account**
   - Go to: https://paystack.com
   - Sign up and verify email
   - Complete business information

2. **Get API Keys**
   - Navigate to: Settings → API Keys & Webhooks
   - Copy **Secret Key** (Test Mode)
   - Copy **Public Key** (Test Mode)

3. **Update .env**
   ```
   PAYSTACK_SECRET_KEY=your_paystack_test_secret_key
   PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 2.2 Ghana Mobile Money Setup

For Ghana, the checkout system supports:
- **MTN Mobile Money**
- **AirtelTigo Money**
- **Vodafone Cash**

#### Option A: Use Mobile Money Aggregator (Recommended)
Examples: **Payfort**, **Flutterwave**, **Omnibasis**

1. Sign up at chosen aggregator
2. Get API credentials for each network
3. Update `.env` with provided keys

#### Option B: Direct API Integration
Contact each network directly:
- **MTN Mobile Money**: https://mtngroup.io
- **AirtelTigo**: https://airteltigo.com.gh
- **Vodafone**: https://vodafone.com.gh

### 2.3 Test Mode vs Live Mode

**For Development:**
```
Use Test/Sandbox keys
Test phone numbers: Check provider docs
Test amounts: Usually any amount works
```

**For Production:**
```
Replace test keys with live keys
Update PUBLIC_BASE_URL to your domain
Configure CORS properly
Add SSL/HTTPS
```

## Step 3: Backend Installation

### 3.1 Install Dependencies

```bash
cd backend
npm install
```

This installs:
- `pg` - PostgreSQL driver
- `paystack` - Paystack SDK (via axios)
- `axios` - HTTP requests
- `express` - Web framework
- `cors` - Cross-origin support
- `nodemailer` - Email (for admin approvals)
- `uuid` - Unique IDs
- `dotenv` - Environment variables

### 3.2 Initialize Database

```bash
# Start backend (this will auto-create tables)
npm start

# You should see:
# ✓ Database initialized successfully
# [FarmConnect Backend] running on http://localhost:5050
```

### 3.3 Verify Backend Health

```bash
curl http://localhost:5050/health
# Response: {"ok":true,"service":"admin-approval-backend"}
```

## Step 4: Frontend Setup

### 4.1 App Environment Variable

```bash
cd my-app

# The backend API URL is already configured:
# EXPO_PUBLIC_ADMIN_APPROVAL_API_URL=http://localhost:5050
# (Set in .env at app root)
```

### 4.2 Start Development Server

```bash
npm start
# or
expo start
```

## Step 5: Testing the Checkout Flow

### 5.1 Test Flow: Add Items → Checkout

1. **Open App**
   ```bash
   npm start
   # Scan QR code with Expo Go
   ```

2. **Navigate to Buyer Tab**
   - Tap "Buyers" in home navigation
   - Or navigate to `/buyer`

3. **Add Items to Cart**
   - Browse products
   - Tap "Add" on any product
   - Adjust quantity in cart modal
   - Tap "Checkout"

### 5.2 Test Card Payment (Paystack)

1. **Fill Buyer Details**
   - Name: Any name
   - Email: test@example.com
   - Phone: 0554000000
   - Address: Test address

2. **Select Payment Method**
   - Choose "Credit/Debit Card"
   - Click "Continue to Payment"

3. **Complete Payment**
   - Click "Complete Payment"
   - In test mode, you'll see a popup with reference

4. **Test Paystack Keys**
   - Use test card numbers:
     - Visa: `4111111111111111` (CVV: any 3 digits)
     - Mastercard: `5531886652142950` (CVV: any 3 digits)
   - Use any future expiry date

### 5.3 Test Mobile Money (Ghana Networks)

1. **Fill Buyer Details**
   - (Same as card payment)

2. **Select Payment Method**
   - Choose "Mobile Money"
   - Select Network: MTN, AirtelTigo, or Vodafone

3. **Enter Phone Number**
   - Ghana format: `0554000000` or `+233554000000`

4. **Complete Payment**
   - Click "Complete Payment"
   - In test mode, user receives payment instructions
   - USSD codes displayed for dialing

## API Endpoints Reference

### Create Order
```bash
POST /orders
Content-Type: application/json

{
  "buyerEmail": "buyer@example.com",
  "buyerPhone": "0554000000",
  "items": [
    {"id": 1, "name": "Tomato", "price": 5.99, "qty": 2}
  ],
  "totalAmount": 11.98,
  "deliveryAddress": "123 Main St, Accra",
  "notes": "Please ring doorbell"
}

Response:
{
  "ok": true,
  "orderId": "uuid",
  "paymentStatus": "pending",
  "orderStatus": "pending"
}
```

### Get Order
```bash
GET /orders/:orderId

Response:
{
  "ok": true,
  "order": {
    "id": "uuid",
    "buyer_email": "...",
    "total_amount": 11.98,
    "payment_status": "pending|completed|failed",
    "order_status": "pending|confirmed|shipped|delivered",
    "items": [...],
    "payments": [...]
  }
}
```

### Initiate Card Payment
```bash
POST /orders/:orderId/pay-card

Response:
{
  "ok": true,
  "orderId": "uuid",
  "authorizationUrl": "https://checkout.paystack.com/...",
  "reference": "ORDER_..."
}
```

### Verify Card Payment
```bash
GET /orders/:orderId/verify-card?reference=ORDER_...

Response:
{
  "ok": true,
  "verified": true,
  "orderId": "uuid",
  "paymentStatus": "completed"
}
```

### Initiate Mobile Money
```bash
POST /orders/:orderId/pay-momo
Content-Type: application/json

{
  "phoneNumber": "0554000000",
  "network": "MTN"
}

Response:
{
  "ok": true,
  "orderId": "uuid",
  "network": "MTN Mobile Money",
  "message": "Payment request sent...",
  "ussdCode": "*170#",
  "pollUrl": "/orders/:id/verify-momo?reference=..."
}
```

## File Structure

```
Farm-connect/my-app/
├── app/
│   ├── buyer.jsx              # Buyer marketplace
│   ├── checkout.tsx           # NEW: Checkout flow (3 steps)
│   ├── (tabs)/
│   │   ├── index.tsx          # Home screen
│   │   └── admin.jsx          # Admin dashboard
│   └── ...other screens
├── backend/
│   ├── server.js              # Express server + routes
│   ├── db.js                  # PostgreSQL connection
│   ├── paystack-payment.js    # Paystack integration
│   ├── momo-payment.js        # Mobile Money integration
│   ├── .env                   # Credentials (DO NOT COMMIT)
│   ├── .env.example           # Template
│   └── package.json
├── lib/
│   ├── market-store.ts        # Product state management
│   └── admin-approval-store.ts
├── .env                       # App env: EXPO_PUBLIC_ADMIN_APPROVAL_API_URL
└── package.json
```

## Security Best Practices

### Do's ✅
- Keep `.env` files secret (add to `.gitignore`)
- Use HTTPS in production
- Validate all inputs server-side
- Store payment references, not sensitive data
- Use webhooks for payment verification
- Implement rate limiting on API endpoints
- Log transaction attempts for auditing

### Don'ts ❌
- Never expose secret keys in client-side code
- Don't commit `.env` to version control
- Never store credit card numbers
- Don't log sensitive payment data
- Don't use HTTP in production
- Don't trust client-side validation alone

## Troubleshooting

### PostgreSQL Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432

Solution:
1. Ensure PostgreSQL is running: sudo systemctl status postgresql
2. Check DB credentials in .env
3. Verify database exists: psql -l
```

### Paystack Error: "Invalid Public Key"
```
Error: PAYSTACK_PUBLIC_KEY not configured

Solution:
1. Get test keys from https://dashboard.paystack.co
2. Update PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY in .env
3. Restart backend: npm start
```

### Mobile Money: "Invalid Phone Number"
```
Error: Invalid Ghana phone number format

Solutions:
- Use format: 0554000000 (10 digits, starting with 0)
- Or: 233554000000 (11 digits, starting with 233)
- Leading zero is optional, not both
```

### Orders Not Persisting
```
Error: Orders table doesn't exist

Solution:
1. Delete backend/node_modules
2. Run: npm install
3. Start backend: npm start (auto-creates tables)
4. Check PostgreSQL logs if still failing
```

## Production Deployment Checklist

- [ ] Replace Paystack test keys with live keys
- [ ] Configure mobile money production credentials
- [ ] Set `PUBLIC_BASE_URL` to your domain
- [ ] Enable HTTPS/SSL
- [ ] Update CORS to allow only your app domain
- [ ] Set up database backups
- [ ] Configure payment webhooks
- [ ] Implement order confirmation emails
- [ ] Set up monitoring and logging
- [ ] Test full checkout flow end-to-end
- [ ] Add fraud detection measures
- [ ] Document API for future maintainers

## Support Resources

- **Paystack Docs**: https://paystack.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Express.js Docs**: https://expressjs.com/
- **React Native Docs**: https://reactnative.dev/
- **Expo Docs**: https://docs.expo.dev/

## Next Steps

1. Set up PostgreSQL locally
2. Get Paystack test API keys
3. Update backend `.env` file
4. Run `npm install && npm start` in backend
5. Verify database tables created
6. Test checkout flow in app
7. Integrate real mobile money provider API
8. Deploy to production with live credentials

---

**Created**: April 28, 2026
**Last Updated**: April 28, 2026
**Version**: 1.0.0
