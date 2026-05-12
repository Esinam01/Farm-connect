# Hidden Admin Access - Quick Start Guide

## What's New

A hidden admin access system has been implemented in FarmConnect. Regular users only see Buyer and Seller options, but by tapping the leaf icon 5 times, they can trigger an admin approval flow.

## How to Use

### For End Users

1. **Open the login screen** - You see the normal Buyer/Seller login
2. **Tap the leaf icon** (in the green header with FarmConnect logo) **5 times rapidly**
3. **Watch the counter** - You'll see "1/5", "2/5", etc. appear below the logo
4. **Counter resets** - If you stop tapping for 3 seconds, counter resets
5. **After 5th tap** - An "Admin Access" modal appears
6. **Click "Send Approval Request"** - An email is sent to the admin
7. **Wait for approval** - Modal shows "Waiting for approval..." 
8. **Admin approves** - They click the link in the email
9. **Automatic redirect** - You're logged in and taken to admin dashboard

### For Administrators

1. **Receive email** - You get a "FarmConnect Admin Approval Request" email
2. **Click "Approve Admin Access"** - The link in the email
3. **See confirmation** - Browser shows "Admin access approved"
4. **User is logged in** - They see the admin dashboard

## Setup Instructions

### 1. Environment Variables

Ensure your `.env` files are configured:

**Frontend** (`my-app/.env`):
```
EXPO_PUBLIC_ADMIN_APPROVAL_API_URL=http://localhost:5050
```

**Backend** (`my-app/backend/.env`):
```
PORT=5050
PUBLIC_BASE_URL=http://localhost:5050

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=marydoo211@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=FarmConnect Admin <marydoo211@gmail.com>
```

### 2. Start Backend Server

```bash
cd my-app/backend
npm install  # If not already installed
node server.js
```

You should see:
```
Server running on http://localhost:5050
```

### 3. Start Frontend App

```bash
cd my-app
npm start
# For Expo app, scan QR code with your phone
```

### 4. Test the Hidden Admin Trigger

1. Open login screen
2. Tap the leaf icon 5 times
3. Watch the counter appear
4. Approval modal should open

## Testing Modes

### SMTP Configured (Production)
- Email is sent to `marydoo211@gmail.com`
- Admin receives email and clicks the link
- No manual approval URL

### SMTP Not Configured (Development)
- Backend logs the approval URL to terminal:
  ```
  [Admin Approval] SMTP not configured.
  [Admin Approval] Request ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  [Admin Approval] Approve URL: http://localhost:5050/admin-access/approve?token=xxxxxxxx...
  ```
- Copy the URL and open in browser
- This simulates the admin clicking the email link
- User app will detect approval and redirect to dashboard

## Rate Limiting

- **Limit**: 3 approval requests per hour per device/IP
- **Error**: "Too many requests. Please try again in XXX seconds."
- **Reset**: Automatically resets after 1 hour
- **For Testing**: Restart backend to reset in-memory counter

## Key Features Implemented

✅ **Hidden Trigger** - 5 rapid taps on leaf icon  
✅ **Visual Counter** - Shows progress (1/5, 2/5, etc.)  
✅ **Auto-Reset** - Counter resets after 3 seconds of inactivity  
✅ **Email Verification** - Sends approval request to admin  
✅ **Real-time Polling** - Checks approval status every 3 seconds  
✅ **Automatic Login** - Logs in as admin on approval  
✅ **Rate Limiting** - Max 3 requests per hour per device  
✅ **Token Validation** - Secure UUID tokens for each request  
✅ **Comprehensive Logging** - All access attempts are logged  
✅ **Error Handling** - Graceful error messages and fallbacks  

## Customization

### Change Admin Email
Edit `my-app/lib/admin-approval-store.ts`:
```typescript
const APPROVER_EMAIL = "your-email@example.com";
```

### Change Tap Requirement
Edit `my-app/app/Login.jsx`:
```javascript
if (newCount === 5) {  // Change 5 to your desired number
```

### Change Rate Limit
Edit `my-app/backend/server.js`:
```javascript
const MAX_REQUESTS_PER_HOUR = 3;  // Change this number
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Leaf icon not responding | Make sure you're tapping directly on the leaf icon, not the logo text |
| Counter resets too quickly | Tap must happen within 3 seconds between each tap |
| Email not received | Check spam folder, verify SMTP credentials in .env |
| "Rate limited" error | Wait 1 hour or restart backend |
| Approval modal doesn't appear on tap | Check browser console for errors, verify API URL in .env |
| Getting "Waiting for approval..." forever | Check backend is running and accessible |

## Files Changed

### New Files
- `components/AdminAccessModal.tsx`
- `ADMIN_ACCESS_DOCS.md`

### Modified Files  
- `app/Login.jsx` - Added tap counter logic
- `lib/auth-store.ts` - Added admin support and `loginAsAdmin()`
- `backend/server.js` - Added rate limiting and logging

## Next Steps

1. ✅ Implementation complete
2. Test the flow end-to-end
3. Configure SMTP for production emails
4. Monitor admin access logs
5. Customize settings as needed

## Support

For detailed technical documentation, see `ADMIN_ACCESS_DOCS.md`

For issues or questions:
1. Check the logs in backend terminal
2. Verify environment variables are set
3. Check browser console for client-side errors
4. Ensure backend is running and accessible
