# Security Implementation Guide

## Phase 1: IMMEDIATE (Do First - Today)

### 1.1 Rotate All Exposed API Keys ⚠️ CRITICAL

**Supabase:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to Settings → API
4. Click "Rotate" on the Anon Key
5. Copy the new key
6. Update `.env.local` with new key

**Resend:**
1. Go to https://resend.com/api-keys
2. Click "Create API Key" or regenerate existing
3. Copy the new key
4. Update `.env.local` with new key

**New .env.local:**
```
VITE_SUPABASE_URL=https://fyjosnsixabzcdcrkmbh.supabase.co
VITE_SUPABASE_ANON_KEY=[PASTE NEW KEY HERE]
VITE_RESEND_API_KEY=[PASTE NEW KEY HERE]
```

### 1.2 Remove Admin Password from Environment Variables

Edit `.env.local`:
```
# Remove or comment out this line:
# VITE_ADMIN_PASSWORD=admin123
```

Admin authentication will now be managed via Supabase!

### 1.3 Verify .gitignore is Set

✅ Already created `./.gitignore` with proper entries

---

## Phase 2: UPDATE APPLICATION CODE

### 2.1 Update AdminPanel.jsx - Remove Client-Side Password Check

**File:** `src/components/AdminPanel.jsx`

Look for this code:
```javascript
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
if (inputPassword !== adminPassword) {
  setError('Invalid password');
}
```

**Replace with:**
```javascript
// Admin authentication now handled via Supabase
// Only users in the 'admins' table with TOTP enabled can access
const { data: admin, error } = await supabase
  .from('admins')
  .select('*')
  .eq('admin_id', userEmail)
  .single();

if (error || !admin) {
  setError('Not authorized - contact system administrator');
  return;
}
```

### 2.2 Add Input Validation to All Forms

**Example - ConsumerManager.jsx:**
```javascript
import { 
  validateEmail, 
  validateName, 
  validateEmployeeId, 
  validateCountryCode,
  validateBulkImportData 
} from '../services/securityService';

// In handleSubmit():
if (!validateEmail(formData.email)) {
  setError('Invalid email format');
  return;
}

if (!validateName(formData.name)) {
  setError('Invalid name format');
  return;
}

if (!validateEmployeeId(formData.employeeId)) {
  setError('Invalid employee ID format');
  return;
}

if (!validateCountryCode(formData.country)) {
  setError('Invalid country selection');
  return;
}
```

### 2.3 Update All Auth Components

Add validation to:
- ConsumerLogin.jsx
- AdminLogin.jsx
- TOTPSetup.jsx
- Any registration forms

---

## Phase 3: DATABASE SECURITY (Supabase)

### 3.1 Verify Row-Level Security (RLS) Policies

**Check that RLS is ENABLED on all tables:**

```sql
-- Check which tables have RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All should show `true` for rowsecurity.

### 3.2 Review Existing RLS Policies

**View current policies:**
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### 3.3 Ensure Strict Access Control

**Example RLS policy for employees (employees can only see their own record):**
```sql
CREATE POLICY "Employees can view own record" 
ON public.employees
FOR SELECT
USING (
  auth.uid() = (
    SELECT id FROM auth.users WHERE email = auth.jwt() ->> 'email'
  )
);
```

**Example RLS policy for admins (only admins can manage consumers):**
```sql
CREATE POLICY "Only admins can create employees" 
ON public.employees
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admin_id = auth.jwt() ->> 'email'
  )
);
```

---

## Phase 4: ENABLE ADDITIONAL SECURITY FEATURES

### 4.1 Enable 2FA for All Admin Accounts

**In Supabase Dashboard:**
1. Go to Authentication → Users
2. For each admin, enforce TOTP requirement
3. Existing admins must set up Google Authenticator

### 4.2 Configure Session Timeouts

**In authService.js, add:**
```javascript
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export const setupSessionTimeout = (onTimeout) => {
  let timeoutId = null;

  const resetTimeout = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      onTimeout();
    }, SESSION_TIMEOUT_MS);
  };

  // Reset on user activity
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetTimeout);
  });

  resetTimeout();
};
```

### 4.3 Add Audit Logging

**Create audit_logs table:**
```sql
CREATE TABLE public.audit_logs (
  id bigint generated always as identity primary key,
  user_email varchar(255),
  action varchar(255),
  resource_type varchar(100),
  resource_id bigint,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp default now()
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_email);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
```

---

## Phase 5: DEPLOYMENT & TESTING

### 5.1 Test Security Headers

After deploying to Vercel, run:
```bash
curl -I https://your-domain.vercel.app
```

Should see:
- ✅ Strict-Transport-Security
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection

### 5.2 Test HTTPS

All traffic should redirect to HTTPS.

### 5.3 Test Input Validation

Try invalid inputs in forms:
- Invalid email format
- Weak passwords
- SQL injection attempts (should be rejected)
- XSS attempts (should be sanitized)

### 5.4 Test RLS Policies

Try accessing data via Supabase that you shouldn't have access to - should fail.

### 5.5 Security Headers Check

Visit: https://securityheaders.com  
Enter your domain  
Should get A+ rating

---

## Phase 6: ONGOING SECURITY

### 6.1 Dependencies Updates

```bash
npm audit
npm audit fix
npm update
```

Run monthly.

### 6.2 Log Review

- Check Supabase logs for failed logins
- Review audit logs for suspicious activity
- Check for unusual data access patterns

### 6.3 Penetration Testing

After each major feature, test for:
- [ ] SQL Injection
- [ ] XSS (Cross-Site Scripting)
- [ ] CSRF (Cross-Site Request Forgery)
- [ ] Broken Authentication
- [ ] Sensitive Data Exposure

---

## QUICK CHECKLIST - Do Now

- [ ] Rotate Supabase Anon Key
- [ ] Rotate Resend API Key
- [ ] Update `.env.local` with new keys
- [ ] Commit `.gitignore` to prevent future exposure
- [ ] Remove old `.env.local` from git history (optional but recommended)
- [ ] Add input validation to forms
- [ ] Remove client-side password check from AdminPanel
- [ ] Test build: `npm run build`
- [ ] Deploy to Vercel: `git push`
- [ ] Verify security headers are present
- [ ] Test HTTPS redirect
- [ ] Enable RLS on all database tables

---

## Important Notes

⚠️ **Do NOT commit `.env.local` again**  
✅ Keep `.gitignore` in version control  
✅ Store production secrets in Vercel Environment Variables (not in code)  
✅ Use Supabase for all authentication and authorization  
✅ Never trust client-side validation - always validate on server  
✅ Always use HTTPS for production  

