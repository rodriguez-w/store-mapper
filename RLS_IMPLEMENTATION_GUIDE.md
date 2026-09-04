# Supabase RLS (Row-Level Security) Implementation Guide

## 🔐 What is RLS?

Row-Level Security (RLS) is **database-level access control**. It enforces who can see/edit what data, automatically, regardless of how the request is made.

**Without RLS:** Anyone with the Anon Key can potentially access any data  
**With RLS:** Users can only access data they're authorized for (database enforces it)

---

## ⚠️ Current Status

Your app currently has **RLS disabled** on most tables:
```sql
ALTER TABLE store_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_requests DISABLE ROW LEVEL SECURITY;
```

This is a **security gap** - anyone with your Anon Key could theoretically access restricted data.

---

## ✅ How to Implement RLS

### Step 1: Apply the Comprehensive RLS Policies

**File created:** `RLS_POLICIES_COMPREHENSIVE.sql`

This file includes:
- ✅ Enable RLS on all tables
- ✅ Drop overly permissive policies  
- ✅ Create strict access policies for each table
- ✅ Verification queries at the bottom

### Step 2: Run the SQL in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy the entire content of `RLS_POLICIES_COMPREHENSIVE.sql`
6. Paste into the editor
7. Click **Run**
8. Check for errors (should show green checkmarks)

### Step 3: Verify RLS is Working

At the bottom of the SQL file are verification queries. Run them:

```sql
-- Check which tables have RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' ORDER BY tablename;
```

All should show `t` (true) for rowsecurity.

```sql
-- View all policies
SELECT * FROM pg_policies WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

Should list many policies like:
- "Allow public to view stores"
- "Only admins can create employees"
- "Users can view own requests"
- etc.

---

## 📋 What Each Policy Does

### STORES Table
| Action | Who Can Do It | Rule |
|--------|---------------|------|
| SELECT (Read) | Everyone | Public data - anyone can view |
| INSERT (Create) | Admins Only | Check if user is in `admins` table |
| UPDATE (Edit) | Admins Only | Check if user is in `admins` table |
| DELETE | Admins Only | Check if user is in `admins` table |

### EMPLOYEES Table
| Action | Who Can Do It | Rule |
|--------|---------------|------|
| SELECT | Employees + Admins | Employees see own record, Admins see all |
| INSERT | Admins Only | Check if user is in `admins` table |
| UPDATE | Admins Only | Check if user is in `admins` table |
| DELETE | Admins Only | Check if user is in `admins` table |

### STORE_REQUESTS Table
| Action | Who Can Do It | Rule |
|--------|---------------|------|
| SELECT | Requestor + Admins | User sees own, Admins see all |
| INSERT | Employees | User must be in `employees` table |
| UPDATE | Admins Only | Check if user is in `admins` table |
| DELETE | Admins Only | Check if user is in `admins` table |

### AUDIT_LOGS Table
| Action | Who Can Do It | Rule |
|--------|---------------|------|
| SELECT | Admins Only | Logs are admin-only |
| INSERT | Admins Only | Only admins can log |

---

## 🔍 How RLS Works (Behind the Scenes)

When a user tries to query the database with the Anon Key:

```javascript
// Frontend code
const { data } = await supabase
  .from('employees')
  .select('*');
```

Supabase checks **automatically**:
1. Who is making the request? (from JWT token)
2. What are they trying to do? (SELECT)
3. Do they have a policy that allows it?
4. Is the policy conditions met? (Example: Are they in the admins table?)

**If No Policy Matches → Request is Blocked** ✋

---

## 🧪 Testing RLS

### Test 1: Can Employees See Their Own Record?

1. Login as an employee
2. Try to view employee data
3. ✅ Should see ONLY their own record
4. ❌ Should NOT see other employees' data

### Test 2: Can Admins See All Employees?

1. Login as an admin
2. Try to view employee data  
3. ✅ Should see ALL employees

### Test 3: Can Employees Create Stores?

1. Login as an employee
2. Try to insert a new store
3. ❌ Should get "permission denied" error
4. ✅ Only admins can create stores

### Test 4: Can Anyone See Store Requests?

1. Login as an employee
2. Query all store requests
3. ✅ Should see only their own requests
4. ❌ Should NOT see other employees' requests

### Test 5: Can Public View Stores?

1. Without logging in (Anon Key)
2. Try to query stores
3. ✅ Should see all stores (public data)

---

## 🚨 Important Notes

### Authentication Method

The policies use `auth.jwt() ->> 'email'` which gets the email from the JWT token. This works because:

1. Supabase automatically sets the JWT when you authenticate
2. The email is included in the JWT payload
3. RLS policies can access this automatically

### Where to Get User Info in Policies

```sql
-- Current user's email
auth.jwt() ->> 'email'

-- Current user's ID (from auth.users table)
auth.uid()

-- Current user's role (if stored in JWT)
auth.jwt() ->> 'role'
```

### How to Check if User is Admin

The policies do this automatically:
```sql
EXISTS (
  SELECT 1 FROM public.admins 
  WHERE admin_id = auth.jwt() ->> 'email'
)
```

Translation: "Does this email exist in the admins table?"  
If yes → Allow  
If no → Deny

---

## 📊 Security Levels

### BEFORE (Current - Low Security) ❌
```
Anyone with Anon Key → Can potentially read/write any row
RLS: Disabled
```

### AFTER (With RLS - High Security) ✅
```
Employee with Anon Key → Can read only own data + public data
Admin with Anon Key → Can read/manage all data
RLS: Enabled with strict policies
```

---

## ⚡ Performance Note

RLS policies **do not slow down your app**. They:
- Run at database level (very fast)
- Are cached after first execution  
- Only check permissions, don't add extra queries

---

## 🔄 When to Update RLS

Update RLS policies when you:
- Add new tables
- Add new user roles
- Change who should have access to what
- Add new features that access data

---

## 📖 Troubleshooting

### "Permission denied" error

**Cause:** RLS policy doesn't allow this action  
**Solution:** Check if user is in the correct table (admins/employees) or if policy allows their action

### "column auth doesn't exist" error  

**Cause:** Using `auth.jwt()` when you're not authenticated  
**Solution:** Make sure user is logged in before making the request

### Can see all data even though shouldn't

**Cause:** RLS policy is too permissive or not applied  
**Solution:** Run the verification queries to check policies are correctly applied

### RLS not enabled on a table

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Check status
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'table_name';
```

---

## ✅ RLS Implementation Checklist

- [ ] Run `RLS_POLICIES_COMPREHENSIVE.sql` in Supabase SQL Editor
- [ ] Verify all tables have RLS enabled (run verification query)
- [ ] Verify all policies are created (run policy list query)
- [ ] Test as employee - can see own data only
- [ ] Test as admin - can see all data
- [ ] Test public - can see stores
- [ ] Test permissions denied - non-admin can't create stores
- [ ] Check security report shows improved score

---

## Next Steps After RLS

Once RLS is working:
1. ✅ Enable input validation (already implemented in `securityService.js`)
2. ✅ Add audit logging (log all admin actions)
3. ✅ Enable rate limiting (prevent brute force)
4. ✅ Set up session timeouts (auto-logout after 15 min)

---

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Best practices: Always enable RLS in production

