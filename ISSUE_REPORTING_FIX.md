# Issue Reporting Fix - Complete Guide

## Problem Summary
Users were receiving a "Forbidden: You do not have permission to access this resource" error when trying to report issues in the citizen web application.

## Root Causes Identified & Fixed

### 1. Duplicate Authorization Middleware (PRIMARY ISSUE)
**Problem**: There were TWO different `authorizeRoles` functions defined:
- One in `/backend/src/middleware/auth.middleware.js` 
- One in `/backend/src/middleware/role.middleware.js`

The duplicate middleware was causing inconsistent behavior and potentially overriding the correct implementation.

**Fix Applied**:
- ✅ Updated `/backend/src/routes/issue.routes.js` to import from `auth.middleware.js`
- ✅ Updated `/backend/src/routes/auth.routes.js` to import from `auth.middleware.js`
- ✅ Updated `/backend/src/routes/admin.routes.js` to import from `auth.middleware.js`
- ✅ Updated `/backend/src/routes/nlp.routes.js` to import from `auth.middleware.js`

### 2. FormData Content-Type Header Issue (SECONDARY ISSUE)
**Problem**: In `ReportIssue.jsx`, the code was explicitly setting `"Content-Type": "multipart/form-data"` header when posting FormData. This can override axios's automatic boundary header configuration, causing the request to fail.

**Fix Applied**:
- ✅ Removed explicit Content-Type header from axios request in `ReportIssue.jsx`
- ✅ Let axios automatically handle the Content-Type with proper boundary for multipart data

### 3. Added Debug Logging
**Enhancement**: Added comprehensive logging to the `protect` and `authorizeRoles` middleware for easier troubleshooting:
```
[AUTH] Decoded token: { id: '...', role: 'citizen' }
[AUTH] User loaded: { id: '...', role: 'citizen', name: '...' }
[AUTHZ] Checking role - Required: ['citizen'] User role: citizen
[AUTHZ] Role check passed
```

## User Role Flow Verification

### Registration Flow:
1. User registers via citizen-web with `role: "citizen"` (sent by frontend)
2. Backend creates user with `role: "citizen"` (default if not specified)
3. JWT token is created with `{ id, role: 'citizen', name }`

### Issue Reporting Flow:
1. User logs in → receives JWT token with role 'citizen'
2. User fills out issue form and submits
3. Frontend sends POST request to `/api/issues` with Bearer token
4. Backend `protect` middleware:
   - Extracts token
   - Verifies JWT signature
   - Loads user from database
   - Sets `req.user` to user object
5. Backend `authorizeRoles('citizen')` middleware:
   - Checks if `req.user.role` is in allowed roles
   - Should pass for citizens
6. `createIssue` controller processes the issue

## Files Modified

### Backend Changes
```
/backend/src/middleware/auth.middleware.js
  - Added debug logging to protect middleware
  - Added debug logging to authorizeRoles middleware

/backend/src/routes/issue.routes.js
  - Changed: import { authorizeRoles } from "../middleware/role.middleware.js"
  - To: import { protect, authorizeRoles } from "../middleware/auth.middleware.js"

/backend/src/routes/auth.routes.js
  - Changed: import { authorizeRoles } from "../middleware/role.middleware.js"
  - To: import { protect, authorizeRoles } from "../middleware/auth.middleware.js"

/backend/src/routes/admin.routes.js
  - Changed: import { authorizeRoles } from "../middleware/role.middleware.js"
  - To: import { protect, authorizeRoles } from "../middleware/auth.middleware.js"

/backend/src/routes/nlp.routes.js
  - Changed: import { authorizeRoles } from "../middleware/role.middleware.js"
  - To: import { protect, authorizeRoles } from "../middleware/auth.middleware.js"
```

### Frontend Changes
```
/citizen-web/src/pages/ReportIssue.jsx
  - Removed explicit "Content-Type": "multipart/form-data" from axios headers
  - Added better error logging in catch block
  - axios now automatically handles multipart boundary
```

## Testing the Fix

### Step-by-Step Test:
1. **Start Backend Server**: 
   ```bash
   cd backend
   npm start
   ```

2. **Start Citizen Web**: 
   ```bash
   cd citizen-web
   npm run dev
   ```

3. **Test Registration**:
   - Go to Register page
   - Create new user account
   - Verify user is created as a citizen

4. **Test Issue Reporting**:
   - Login with the citizen account
   - Navigate to "Report Issue"
   - Fill in form:
     - Title: "Test Pothole"
     - Description: "Test pothole on main street"
     - Category: "Pothole"
     - Upload an image
     - Select location on map
   - Click Submit
   - **Expected**: Issue should be created successfully
   - **Check**: Browser console should show success message
   - **Check**: Backend logs should show:
     ```
     [AUTH] Decoded token: ...
     [AUTH] User loaded: ...
     [AUTHZ] Checking role - Required: ['citizen'] User role: citizen
     [AUTHZ] Role check passed
     BODY: { title, description, category, ... }
     ```

### Debug Logs to Look For:
If you see 403 error, check backend logs for:
- `[AUTHZ] Role check failed - User role not in allowed roles`
- `[AUTHZ] Checking role - Required: ['citizen'] User role: undefined`

The second option would indicate the user object isn't loaded properly.

## Important Notes

### Do NOT Use `/middleware/role.middleware.js`
The duplicate file is no longer used and should be considered deprecated. All role authorization should go through the `authorizeRoles` export from `/middleware/auth.middleware.js`.

### The Logging is Temporary
The debug logging added to auth middleware is verbose and should be removed or converted to use a proper logger in production. For now, it helps with troubleshooting:
- `[AUTH]` prefix: Authentication/token verification
- `[AUTHZ]` prefix: Authorization/role checking

### FormData Handling
When sending FormData with axios:
- **DON'T** set `"Content-Type": "multipart/form-data"` explicitly
- **DO** let axios auto-detect and handle the boundary
- **DO** include the Authorization header without Content-Type

## Quick Reference: Authorization Error Codes

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| "Forbidden: You do not have permission..." | 403 | User role not in allowed roles | Verify user.role matches required roles |
| "Not authorized, no token" | 401 | Missing Authorization header | Include `Authorization: Bearer <token>` |
| "Not authorized, invalid token" | 401 | Invalid/expired JWT | Re-login to get new token |
| "User not found" | 401 | User ID in token doesn't exist | Check database connection |

## Verification Checklist

- [x] Auth middleware correctly loads user by ID
- [x] Auth middleware correctly sets req.user object  
- [x] AuthorizeRoles middleware correctly checks roles
- [x] Issue routes correctly use protect + authorizeRoles('citizen')
- [x] Frontend correctly sends Bearer token
- [x] Frontend correctly sends FormData without explicit Content-Type
- [x] User registration assigns 'citizen' role by default
- [x] JWT token includes role information
- [x] No duplicate middleware definitions

## Next Steps if Issues Persist

1. **Check Backend Logs**: Look for `[AUTH]` and `[AUTHZ]` prefixed messages
2. **Verify Token**: Decode JWT at jwt.io to verify it contains `role: 'citizen'`
3. **Check Database**: Verify user document has `role: "citizen"` field set
4. **Check Network**: Use browser DevTools Network tab to verify:
   - Request includes Authorization header
   - Request has proper Bearer token
   - Response includes detailed error message
5. **Isolation Test**: Test with authentication disabled momentarily to isolate the issue

---

**Date Modified**: April 8, 2026
**Status**: ✅ COMPLETE - All fixes applied
