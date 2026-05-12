# Hidden Admin Access System - Documentation

## Overview

A secure, hidden admin access trigger system for FarmConnect that allows authorized administrators to gain access to the admin dashboard without exposing admin login options to regular users.

## How It Works

### User Flow

1. **Hidden Trigger**: User taps the leaf icon (in the FarmConnect logo) in the green header of the login screen **5 times rapidly**
2. **Visual Feedback**: A counter displays (1/5, 2/5, etc.) under the logo showing progress
3. **Counter Reset**: Counter resets automatically after 3 seconds of inactivity
4. **Approval Modal**: On the 5th tap, an approval request modal appears
5. **Email Verification**: System sends an email to `marydoo211@gmail.com` with an approval link
6. **Admin Approval**: Admin clicks the approval link in the email
7. **Dashboard Access**: User is granted admin access and redirected to the admin dashboard

### Security Features

- **Rate Limiting**: Maximum 3 admin access requests per hour per device/IP
- **Token Verification**: Unique tokens for each approval request (UUID v4)
- **Token Expiration**: Tokens expire after 24 hours
- **Request Logging**: All admin access attempts are logged with:
  - IP address
  - Request ID
  - Status (INITIATED, EMAIL_SENT, APPROVED, REJECTED, ERROR)
  - Timestamp
- **No Account Creation**: Admin access doesn't require username/password
- **One-Time Access**: Each approval is tied to a specific request

## Technical Architecture

### Frontend Components

#### 1. **Login.jsx** (`app/Login.jsx`)
- Implements the leaf icon tap counter
- Tracks tap timing (resets after 3 seconds)
- Shows visual counter (1/5, 2/5, etc.)
- Triggers AdminAccessModal on 5th tap

#### 2. **AdminAccessModal.tsx** (`components/AdminAccessModal.tsx`)
- Modal showing approval request UI
- States: idle, requesting, pending, approved, denied, error
- Shows approval URL for manual testing
- Polls for approval status every 3 seconds
- Automatically logs user in and navigates to admin dashboard on approval

#### 3. **Auth Store** (`lib/auth-store.ts`)
- Added admin role support ("admin" | "buyer" | "seller")
- New function: `loginAsAdmin()` - grants admin access without authentication

### Backend Components

#### 1. **Admin Approval Store** (`lib/admin-approval-store.ts`)
- Manages admin approval state using React context
- `requestAdminApproval()` - sends approval request to backend
- `useAdminApprovalState()` - hook for reading approval status
- Polls backend every 3 seconds for approval status

#### 2. **Backend Server** (`backend/server.js`)
- **Endpoints**:
  - `POST /admin-access/request` - Creates approval request and sends email
  - `GET /admin-access/status` - Checks approval status
  - `GET /admin-access/approve` - Admin clicks this link to approve
  - `GET /health` - Health check

- **Rate Limiting**:
  ```
  - 3 requests per hour per IP address
  - Returns 429 (Too Many Requests) if exceeded
  - Tracks requests in memory
  ```

- **Email System**:
  - Uses Nodemailer with SMTP
  - Configured via `.env` variables
  - Fallback mode for local development (logs approval URL to console)

- **Request Structure**:
  ```javascript
  {
    requestId: "uuid",
    token: "uuid",
    approverEmail: "marydoo211@gmail.com",
    status: "pending|approved|denied|error",
    createdAt: "ISO-8601",
    approvedAt: "ISO-8601 or null",
    clientIp: "192.168.x.x"
  }
  ```

## Configuration

### Environment Variables

**Frontend** (`my-app/.env`):
```
EXPO_PUBLIC_ADMIN_APPROVAL_API_URL=http://localhost:5050
```

**Backend** (`my-app/backend/.env`):
```
PORT=5050
PUBLIC_BASE_URL=http://localhost:5050

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=marydoo211@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=FarmConnect Admin <marydoo211@gmail.com>
```

### Customization

To change the admin email or request limits, modify:

1. **Email Address**: Update in `lib/admin-approval-store.ts`:
   ```typescript
   const APPROVER_EMAIL = "your-email@example.com";
   ```

2. **Rate Limit**: Update in `backend/server.js`:
   ```javascript
   const MAX_REQUESTS_PER_HOUR = 3; // Change this value
   ```

3. **Tap Counter**: Update in `app/Login.jsx`:
   ```javascript
   const REQUIRED_TAPS = 5; // Change this value (currently hardcoded as 5)
   ```

## Testing

### Local Testing (SMTP Fallback)

When SMTP is not configured, the system logs the approval URL to the backend terminal:

```
[Admin Approval] SMTP not configured.
[Admin Approval] Request ID: <request-id>
[Admin Approval] Approve URL: http://localhost:5050/admin-access/approve?token=<token>
```

**Steps**:
1. Tap leaf icon 5 times on login screen
2. Click "Send Approval Request"
3. Check backend terminal for approval URL
4. Open the URL in a browser to approve
5. Return to app - it should show approval confirmation

### Production Testing

1. Configure SMTP credentials
2. Tap leaf icon 5 times
3. Check email at `marydoo211@gmail.com`
4. Click the approval link in the email
5. Return to app for automatic dashboard redirect

## Security Best Practices

1. **Change Admin Email**: Update to a secure email address
2. **Use Strong SMTP Password**: Store safely in environment variables
3. **Monitor Logs**: Check backend logs for suspicious activity
4. **Rotate Tokens**: Consider implementing token rotation for long-term security
5. **Audit Trail**: Maintain logs of all admin access attempts
6. **Rate Limiting**: Current limit is 3/hour; adjust based on your needs

## Troubleshooting

### Approval Modal Doesn't Appear
- Check that you're tapping the leaf icon (not somewhere else)
- Ensure you tap exactly 5 times within 3-second windows
- Check browser console for errors

### Email Not Received
- Verify SMTP credentials are correct
- Check SMTP_HOST, SMTP_USER, SMTP_PASS in `.env`
- Check spam/junk folders
- If SMTP not configured, approval URL appears in backend terminal

### Rate Limited Error
- Wait 1 hour before trying again
- Or restart backend (clears in-memory rate limit log)

### Approval Status Not Updating
- Check network connectivity
- Verify `EXPO_PUBLIC_ADMIN_APPROVAL_API_URL` is correct
- Check backend `/admin-access/status` endpoint responds with correct requestId

## API Reference

### POST /admin-access/request
Request admin access approval.

**Request**:
```json
{
  "approverEmail": "marydoo211@gmail.com"
}
```

**Response (Success)**:
```json
{
  "requestId": "uuid",
  "status": "pending",
  "emailed": true,
  "fallback": false,
  "message": "Approval email sent."
}
```

**Response (Rate Limited - 429)**:
```json
{
  "status": "rate_limited",
  "message": "Too many requests. Please try again in XXX seconds.",
  "retryAfter": 3600
}
```

### GET /admin-access/status?requestId=<id>
Check approval status of a request.

**Response**:
```json
{
  "requestId": "uuid",
  "status": "pending|approved|denied|error",
  "createdAt": "2025-04-29T10:00:00Z",
  "approvedAt": "2025-04-29T10:05:00Z or null"
}
```

### GET /admin-access/approve?token=<token>
Approve an admin access request. Returns HTML confirmation page.

## Monitoring & Logging

All admin access attempts are logged to console with format:
```
[Admin Access] IP: 192.168.x.x, RequestID: uuid, Status: INITIATED, Time: 2025-04-29T10:00:00Z
```

Status values:
- `INITIATED` - Request created
- `EMAIL_SENT` - Approval email sent
- `APPROVED` - Admin approved via email link
- `REJECTED` - Rate limited or invalid token
- `ERROR` - Backend error

View logs in backend terminal or integrate with logging service (e.g., Winston, Sentry).

## Files Modified/Created

### Created Files
- `components/AdminAccessModal.tsx` - Approval modal UI
- `ADMIN_ACCESS_DOCS.md` - This documentation

### Modified Files
- `app/Login.jsx` - Added leaf tap counter
- `lib/auth-store.ts` - Added admin role and `loginAsAdmin()` function
- `lib/admin-approval-store.ts` - Already existed, no changes needed
- `backend/server.js` - Added rate limiting and logging

### Existing Files (No Changes)
- `app/(tabs)/admin.jsx` - Admin dashboard (already exists)
- `.env` files - Already configured

## Future Enhancements

1. **Database Persistence**: Store requests in database instead of memory
2. **Deny Functionality**: Allow admin to deny requests
3. **Request History**: Show user history of access attempts
4. **Multi-Admin Support**: Allow multiple admins to approve
5. **2FA**: Add additional security with two-factor authentication
6. **Webhook Notifications**: Real-time notifications instead of polling
7. **Audit Dashboard**: Admin view of all access requests and attempts
8. **Custom Token Expiration**: Configurable token lifetime
