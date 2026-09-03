# Security Audit - Store Mapper Application

**Date:** September 3, 2026  
**Status:** ⚠️ CRITICAL ISSUES FOUND

---

## 🚨 CRITICAL ISSUES (Fix Immediately)

### 1. **Exposed API Keys in Git History** ⚠️ CRITICAL
**Severity:** CRITICAL  
**Issue:** `.env.local` is committed to git, exposing:
- Supabase URL and Anon Key
- Resend API Key
- Admin Password (hardcoded as "admin123")

**Evidence:** Commits since June 25, 2026 contain `.env.local`

**Fix Required:**
1. Rotate ALL exposed API keys in Supabase and Resend
2. Change admin password immediately
3. Remove `.env.local` from git history (BFG Repo-Cleaner)
4. Add `.env.local` to `.gitignore`

---

### 2. **Hardcoded Admin Password** ⚠️ CRITICAL
**Severity:** CRITICAL  
**Issue:** Admin password stored in `VITE_ADMIN_PASSWORD` environment variable
- Weak default: "admin123"
- Exposed in .env.local
- No password hashing

**Fix Required:**
- Move admin auth to Supabase Admin table with proper authentication
- Use TOTP-based admin login (you already have this!)
- Remove password-based /admin access

---

## ⚠️ HIGH PRIORITY ISSUES

### 3. **Missing HTTPS Enforcement**
**Severity:** HIGH  
**Issue:** No HTTPS redirect or security headers  
**Impact:** Man-in-the-middle attacks, session hijacking

**Fix:**
- Add security headers via vercel.json
- Enforce HTTPS redirects
- Add HSTS header

---

### 4. **Missing CORS Configuration**
**Severity:** HIGH  
**Issue:** No explicit CORS policy configured  
**Impact:** Vulnerable to CSRF attacks, unauthorized API calls

**Fix:**
- Configure strict CORS in Supabase RLS policies
- Add CORS headers validation

---

### 5. **No Rate Limiting**
**Severity:** HIGH  
**Issue:** No protection against brute force attacks on login  
**Impact:** Account takeover via password guessing

**Fix:**
- Implement rate limiting on auth endpoints (Supabase Edge Functions or middleware)
- Lock accounts after N failed attempts
- Add exponential backoff

---

### 6. **Client-Side Admin Password Validation** ⚠️ HIGH
**Severity:** HIGH  
**Issue:** Admin access checked in frontend JavaScript  
**Location:** Components checking `VITE_ADMIN_PASSWORD`  
**Impact:** Easy to bypass by editing localStorage or network requests

**Fix:**
- Move ALL admin checks to backend/Supabase
- Use Supabase RLS policies to restrict admin access
- Validate permissions server-side

---

## 📋 MEDIUM PRIORITY ISSUES

### 7. **No Input Validation/Sanitization**
**Severity:** MEDIUM  
**Issue:** User inputs not validated before sending to database  
**Impact:** SQL Injection, XSS attacks

**Fix:**
- Validate all form inputs (email format, length limits, etc.)
- Sanitize data before display
- Use Supabase with RLS policies

---

### 8. **Exposed Sensitive Data in Network Requests**
**Severity:** MEDIUM  
**Issue:** Employee IDs, emails, TOTP secrets sent without encryption  
**Impact:** Data interception, privacy violations

**Fix:**
- Ensure all requests use HTTPS
- Add encryption for sensitive fields
- Minimize PII in API responses

---

### 9. **No Audit Logging for Sensitive Operations**
**Severity:** MEDIUM  
**Issue:** No detailed logging of who created/modified users  
**Impact:** Can't trace unauthorized changes

**Fix:**
- Log all admin actions with timestamp and user ID
- Log failed login attempts
- Log data access patterns

---

### 10. **Missing SQL Injection Protection**
**Severity:** MEDIUM  
**Issue:** Using Supabase correctly (good!), but need RLS enforcement  
**Impact:** Unauthorized data access

**Fix:**
- Ensure all Supabase tables have strict RLS policies
- Verify policies block unauthorized access
- Test row-level security

---

## 🔍 LOW PRIORITY ISSUES

### 11. **No Content Security Policy (CSP)**
**Severity:** LOW  
**Issue:** No CSP headers defined  
**Impact:** Increased XSS attack surface

**Fix:**
- Add CSP headers to Vercel config

---

### 12. **No Password Requirements Enforcement**
**Severity:** LOW  
**Issue:** When users set passwords, no strength requirements  
**Impact:** Weak passwords easier to crack

**Fix:**
- Add password strength validation
- Require minimum 12 characters, uppercase, numbers, symbols

---

### 13. **Browser Cache Enabled for Sensitive Pages**
**Severity:** LOW  
**Issue:** Pages containing auth/personal data can be cached  
**Impact:** Information disclosure on shared computers

**Fix:**
- Add no-cache headers to sensitive pages

---

---

## 📊 Quick Priority Action List

| Priority | Issue | Estimated Time |
|----------|-------|-----------------|
| 🔴 NOW | Rotate all API keys | 5 min |
| 🔴 NOW | Change admin password | 2 min |
| 🔴 TODAY | Remove .env.local from git history | 10 min |
| 🔴 TODAY | Configure admin auth via Supabase | 30 min |
| 🟠 THIS WEEK | Add HTTPS & security headers | 15 min |
| 🟠 THIS WEEK | Implement rate limiting | 30 min |
| 🟠 THIS WEEK | Verify RLS policies | 30 min |
| 🟡 THIS MONTH | Add input validation | 1 hour |
| 🟡 THIS MONTH | Implement audit logging | 2 hours |

---

## Testing Checklist

After fixes are implemented:
- [ ] HTTPS forced on all pages
- [ ] Admin password changed
- [ ] Rate limiting blocks brute force attempts
- [ ] RLS policies prevent unauthorized data access
- [ ] All form inputs validated
- [ ] Security headers present (check with https://securityheaders.com)
- [ ] No exposed API keys in git
- [ ] TOTP requirement enforced for admin access

