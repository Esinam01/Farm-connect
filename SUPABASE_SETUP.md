# Supabase Integration Setup Guide

## Overview
The Farm-Connect app has been migrated from local auth + PostgreSQL to **Supabase Auth + Supabase PostgreSQL**.

## What Changed

### Backend Changes
- **Database Layer**: Replaced `pg` pool with Supabase client (`@supabase/supabase-js`)
- **Auth**: Supabase Auth replaces in-memory account storage
- **Credentials**: Update `.env` with Supabase project credentials

### Frontend Changes
- **Auth Store**: `lib/auth-store.ts` now uses Supabase Auth instead of local state
- **Dependencies**: Added `@supabase/supabase-js` and `expo-secure-store`
- **Environment**: Update `.env.local` with Supabase credentials

## Required Setup Steps

### 1. Create a Supabase Project
Go to [supabase.com](https://supabase.com) and:
1. Sign up / Log in
2. Create a new project
3. Set a strong database password
4. Wait for project to initialize

### 2. Get Your Credentials
From your Supabase dashboard:
- **Project URL**: Settings → General → Project URL
- **Anon Key**: Settings → API → Project API keys → `anon` (public)
- **Service Role Key**: Settings → API → Project API keys → `service_role` (secret - for backend only)
- **DB Password**: Settings → Database → Password (used for direct connections)

### 3. Backend Configuration
Update `my-app/backend/.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DB_PASSWORD=your_postgres_password
```

### 4. Frontend Configuration
Update `my-app/.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_ADMIN_APPROVAL_API_URL=http://localhost:5050
```

### 5. Create Database Tables
Run these SQL queries in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email VARCHAR(255) NOT NULL,
  buyer_phone VARCHAR(20),
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS',
  payment_method VARCHAR(20) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  order_status VARCHAR(50) DEFAULT 'pending',
  delivery_address TEXT,
  notes TEXT,
  reference_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS',
  status VARCHAR(50) DEFAULT 'pending',
  reference_id VARCHAR(255),
  gateway_response JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment networks table
CREATE TABLE IF NOT EXISTS payment_networks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  code VARCHAR(10),
  country VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default payment networks
INSERT INTO payment_networks (name, code, country) VALUES
  ('MTN Mobile Money', 'MTN', 'Ghana'),
  ('AirtelTigo Money', 'AIRTELTIGO', 'Ghana'),
  ('Vodafone Cash', 'VODAFONE', 'Ghana')
ON CONFLICT (name) DO NOTHING;
```

### 6. Configure Authentication
In your Supabase dashboard:
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure email templates if needed

### 7. Set Row Level Security (Optional but Recommended)
For production, enable RLS on tables:
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_networks ENABLE ROW LEVEL SECURITY;
```

### 8. Install Dependencies
```bash
# Backend
cd my-app/backend
npm install

# Frontend
cd ../
npm install
```

### 9. Start the App
```bash
# Terminal 1: Backend
cd my-app/backend
npm run dev

# Terminal 2: Frontend
cd my-app
npm start
```

## Key Differences from Previous Implementation

| Feature | Before | After |
|---------|--------|-------|
| **Auth** | In-memory accounts, plaintext passwords | Supabase Auth with secure hashing |
| **Database** | Local PostgreSQL or in-memory | Supabase PostgreSQL (cloud) |
| **User Sessions** | None, state-based | Supabase JWT tokens + refresh tokens |
| **Password Reset** | Not implemented | Built into Supabase Auth |
| **Email Verification** | Not implemented | Built into Supabase Auth |
| **Multi-device** | Not supported | Supported via tokens |

## API Changes

### Auth Functions (Frontend)
All auth functions are now **async**:
```typescript
// Before
const user = loginUser(email, password, role);

// After
const user = await loginUser(email, password, role);
```

### New Hook
```typescript
const loading = useAuthLoading(); // Check auth state loading
```

## Testing

### Test User Creation
```typescript
import { registerUser } from '@/lib/auth-store';

const user = await registerUser(
  'test@example.com',
  'Test User',
  'password123',
  'buyer'
);
```

### Test Login
```typescript
import { loginUser } from '@/lib/auth-store';

const user = await loginUser('test@example.com', 'password123', 'buyer');
```

## Troubleshooting

### "Supabase credentials missing"
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in backend `.env`
- Verify they match your Supabase project

### "Connection refused"
- Ensure backend is running on port 5050
- Check `EXPO_PUBLIC_ADMIN_APPROVAL_API_URL` in frontend `.env.local`

### "Table does not exist"
- Run the SQL schema creation queries in Supabase SQL Editor
- Verify tables exist in **Database** → **Tables**

### Auth not working in Expo Go
- Use real Supabase credentials (not placeholders)
- Check network connection to Supabase servers
- Verify CORS is enabled on Supabase (default: enabled)

## Next Steps

1. **Test Authentication**: Create and login test users
2. **Test Orders**: Place an order and verify it's in Supabase
3. **Enable RLS**: Implement Row Level Security for production
4. **Add Email Verification**: Configure email settings in Supabase
5. **Setup Backups**: Enable automated backups in Supabase settings
