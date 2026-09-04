# Store Mapper - Login & Store Status Update Fixes

## Overview
This document explains the fixes for two main issues:
1. **Login Issues**: User ID recognition not working properly
2. **Store Status Updates**: Non-admin users unable to update store status

---

## Issue #1: Login Problems - Root Cause & Fix

### Problem
The employee lookup was not consistently handling employee IDs due to case sensitivity issues in the database queries.

### Solution Applied
The ConsumerLogin component now:
1. Normalizes the employee ID input
2. Tries uppercase first (for employees)
3. Falls back to lowercase (for admins)
4. Stores the correct lookup ID in localStorage for future reference
5. Passes the correct ID to the session creation

### Code Changes
- **File**: `src/components/ConsumerLogin.jsx`
- **Key Logic**: Lines 77-147 handle proper ID normalization and lookup

### Testing the Login Fix
1. Go to http://localhost:5173/login
2. Enter an employee ID (e.g., "EMP001")
3. Should find the employee in the database
4. Proceed with TOTP verification
5. Login should succeed and redirect to map

---

## Issue #2: Store Status Updates - Root Cause & Fix

### Problem
RLS (Row Level Security) policies were blocking non-admin users from updating store status, and there was no audit trail of changes.

### Solution Applied
Created a comprehensive solution with:

#### 1. Database Setup (RLS_AND_AUDIT_SETUP.sql)
- Sets up proper RLS policies for `stores` and `audit_log` tables
- Creates audit trigger to log all store status changes
- Enables both employees and admins to update store status
- Automatically records who changed what status and when

#### 2. Helper Function (UPDATE_STORE_STATUS_FUNCTION.sql)
- Creates `update_store_status()` RPC function
- Validates status input (OPEN/CLOSED only)
- Passes employee context for audit logging
- Returns success/failure with message

#### 3. Frontend Update (StoreList.jsx)
- Now uses the RPC function instead of direct table update
- Calls `update_store_status()` with:
  - Store ID
  - New status
  - Current employee ID from session
- Proper error handling and user feedback

---

## Setup Instructions

### Step 1: Apply Database Changes
Run these SQL scripts in your Supabase SQL Editor:

1. **First**: `RLS_AND_AUDIT_SETUP.sql`
   - Sets up RLS policies
   - Creates audit trigger
   - Enables proper permissions

2. **Second**: `UPDATE_STORE_STATUS_FUNCTION.sql`
   - Creates the RPC function
   - Grants execute permissions

### Step 2: Verify Setup
Run these queries in Supabase to verify:

```sql
-- Check RLS policies
SELECT policyname, tablename FROM pg_policies 
WHERE tablename IN ('stores', 'audit_log');

-- Check functions
SELECT proname FROM pg_proc 
WHERE proname = 'update_store_status';

-- Check trigger
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'stores';
```

### Step 3: Test Store Status Updates
1. Login with an employee ID
2. Go to the map view
3. Find a store in the list
4. Click the status toggle (OPEN/CLOSED button)
5. Should update successfully
6. Check audit_log table - should see the change recorded

---

## Audit Trail Features

When a store status is updated, the following is logged to `audit_log`:
- `employee_id`: Who made the change
- `action`: 'STORE_STATUS_CHANGE'
- `store_id`: Which store was updated
- `old_status`: Previous status
- `new_status`: New status
- `created_at`: Timestamp of change

### Query Audit Logs
```sql
SELECT * FROM audit_log 
WHERE action = 'STORE_STATUS_CHANGE' 
ORDER BY created_at DESC;
```

---

## Expected Behavior After Fix

### Login Flow
1. ✅ User enters employee ID
2. ✅ App normalizes ID and searches database
3. ✅ User found and TOTP setup/verification requested
4. ✅ Session created with correct employee ID
5. ✅ User redirected to map

### Store Status Update Flow
1. ✅ User clicks store status toggle
2. ✅ App calls `update_store_status()` function with employee context
3. ✅ Function validates and updates status
4. ✅ Audit trigger automatically logs the change
5. ✅ Store list updates to show new status
6. ✅ Audit trail shows who changed what and when

---

## Troubleshooting

### Login Not Working
- Check employee exists in `employees` table with correct `employee_id`
- Verify TOTP secret is set or setup flow works
- Check browser console for errors
- Ensure sessionStorage is not being cleared

### Store Status Update Fails
- Verify user is logged in (check session)
- Check audit_log table has correct schema
- Verify `update_store_status()` function exists
- Check browser console for error messages
- Ensure employee_id is being passed correctly

### Audit Log Not Recording
- Check trigger exists: `trigger_log_store_status_change`
- Verify function `log_store_status_change()` exists
- Check audit_log table has INSERT permission
- Review Supabase logs for errors

---

## Files Modified

1. **src/components/StoreList.jsx**
   - Updated handleStatusToggle to use RPC function
   - Added proper error handling
   - Import getSession for employee context

2. **Database SQL Scripts** (new):
   - RLS_AND_AUDIT_SETUP.sql
   - UPDATE_STORE_STATUS_FUNCTION.sql

---

## Next Steps

After applying these fixes:
1. Test login with multiple employee IDs
2. Test store status updates
3. Verify audit logs are recorded
4. Test on production after verification in dev/local
5. Consider adding notification system for status changes (optional future enhancement)

---

## Security Notes

- RLS policies ensure users can only operate within allowed permissions
- Audit trail provides complete history of all changes
- Employee context is passed for accountability
- All updates are logged with timestamps
- DEFINER security context for functions ensures proper access control
