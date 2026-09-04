-- Supabase RLS (Row-Level Security) Policies Implementation - CORRECTED
-- Uses actual table structure: admin_access with employee_id (VARCHAR)

-- ============================================================================
-- CREATE MISSING TABLES
-- ============================================================================

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_email VARCHAR(255),
  action VARCHAR(255),
  resource_type VARCHAR(100),
  resource_id BIGINT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Enable RLS on public tables (using IF EXISTS to avoid errors)
ALTER TABLE IF EXISTS public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.totp_backup_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER: Check if current user is admin
-- ============================================================================
-- This helper function checks if the current authenticated user is an admin

-- ============================================================================
-- STORES TABLE - Public Read, Admin Write
-- ============================================================================

-- DROP existing policies first
DROP POLICY IF EXISTS "Allow public to view stores" ON public.stores;
DROP POLICY IF EXISTS "Allow admins to manage stores" ON public.stores;
DROP POLICY IF EXISTS "Only admins can insert stores" ON public.stores;
DROP POLICY IF EXISTS "Only admins can update stores" ON public.stores;
DROP POLICY IF EXISTS "Only admins can delete stores" ON public.stores;

-- Everyone can view stores (public data)
CREATE POLICY "Allow public to view stores"
  ON public.stores
  FOR SELECT
  TO public
  USING (true);

-- Only admins can insert stores
CREATE POLICY "Only admins can insert stores"
  ON public.stores
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- Only admins can update stores
CREATE POLICY "Only admins can update stores"
  ON public.stores
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- Only admins can delete stores
CREATE POLICY "Only admins can delete stores"
  ON public.stores
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- ============================================================================
-- EMPLOYEES TABLE - Self Read, Admin Write
-- ============================================================================

DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;
DROP POLICY IF EXISTS "Only admins can create employees" ON public.employees;
DROP POLICY IF EXISTS "Only admins can update employees" ON public.employees;
DROP POLICY IF EXISTS "Only admins can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;

-- Employees can view their own record
CREATE POLICY "Employees can view own record"
  ON public.employees
  FOR SELECT
  USING (
    email = auth.jwt() ->> 'email'
  );

-- Admins can view all employees
CREATE POLICY "Admins can view all employees"
  ON public.employees
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- Only admins can insert new employees
CREATE POLICY "Only admins can create employees"
  ON public.employees
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- Only admins can update employees
CREATE POLICY "Only admins can update employees"
  ON public.employees
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- Only admins can delete employees
CREATE POLICY "Only admins can delete employees"
  ON public.employees
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- ============================================================================
-- ADMIN_ACCESS TABLE - Read-Only for admins
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view admin table" ON public.admin_access;
DROP POLICY IF EXISTS "Admins can view own record" ON public.admin_access;
DROP POLICY IF EXISTS "Admins can view admin access" ON public.admin_access;

-- Admins can view the admin access table
CREATE POLICY "Admins can view admin access"
  ON public.admin_access
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- No INSERT/UPDATE/DELETE allowed via RLS - admins created by database owner only

-- ============================================================================
-- STORE_CATEGORIES TABLE - Public Read, Admin Write
-- ============================================================================

DROP POLICY IF EXISTS "Allow public to view categories" ON public.store_categories;
DROP POLICY IF EXISTS "Allow admins to manage categories" ON public.store_categories;
DROP POLICY IF EXISTS "Only admins can create categories" ON public.store_categories;
DROP POLICY IF EXISTS "Only admins can update categories" ON public.store_categories;
DROP POLICY IF EXISTS "Only admins can delete categories" ON public.store_categories;

-- Everyone can view categories
CREATE POLICY "Allow public to view categories"
  ON public.store_categories
  FOR SELECT
  TO public
  USING (true);

-- Only admins can insert categories
CREATE POLICY "Only admins can create categories"
  ON public.store_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- Only admins can update categories
CREATE POLICY "Only admins can update categories"
  ON public.store_categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- Only admins can delete categories
CREATE POLICY "Only admins can delete categories"
  ON public.store_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- ============================================================================
-- STORE_REQUESTS TABLE - Users Submit, Admins Review
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own requests" ON public.store_requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.store_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.store_requests;
DROP POLICY IF EXISTS "Admins can review requests" ON public.store_requests;
DROP POLICY IF EXISTS "Only admins can update requests" ON public.store_requests;
DROP POLICY IF EXISTS "Only admins can delete requests" ON public.store_requests;

-- Employees can view their own store requests
CREATE POLICY "Users can view own requests"
  ON public.store_requests
  FOR SELECT
  USING (
    requested_by = auth.jwt() ->> 'email'
  );

-- Admins can view all store requests
CREATE POLICY "Admins can view all requests"
  ON public.store_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- Employees can create store requests
CREATE POLICY "Users can create requests"
  ON public.store_requests
  FOR INSERT
  WITH CHECK (
    requested_by = auth.jwt() ->> 'email'
    AND EXISTS (
      SELECT 1 FROM public.employees 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Only admins can update/review store requests
CREATE POLICY "Only admins can update requests"
  ON public.store_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- Only admins can delete store requests
CREATE POLICY "Only admins can delete requests"
  ON public.store_requests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- ============================================================================
-- AUDIT_LOGS TABLE - Admins Only
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only admins can insert logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only admins can view logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert logs" ON public.audit_logs;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- LOGIN_ATTEMPTS TABLE - For Rate Limiting
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow insert login attempts" ON public.login_attempts;

-- Users can view their own login attempts
CREATE POLICY "Users can view own attempts"
  ON public.login_attempts
  FOR SELECT
  USING (user_id = auth.jwt() ->> 'email');

-- System can insert login attempts
CREATE POLICY "Allow insert login attempts"
  ON public.login_attempts
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- ACCOUNT_LOCKOUTS TABLE - For Security
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own lockouts" ON public.account_lockouts;
DROP POLICY IF EXISTS "Allow insert lockouts" ON public.account_lockouts;

-- Users can view their own lockout status
CREATE POLICY "Users can view own lockouts"
  ON public.account_lockouts
  FOR SELECT
  USING (user_id = auth.jwt() ->> 'email');

-- System can insert lockout records
CREATE POLICY "Allow insert lockouts"
  ON public.account_lockouts
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TOTP_BACKUP_CODES TABLE - For Account Recovery
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own backup codes" ON public.totp_backup_codes;
DROP POLICY IF EXISTS "Allow backup code operations" ON public.totp_backup_codes;
DROP POLICY IF EXISTS "Allow backup code updates" ON public.totp_backup_codes;

-- Users can view their own backup codes
CREATE POLICY "Users can view own backup codes"
  ON public.totp_backup_codes
  FOR SELECT
  USING (user_id = auth.jwt() ->> 'email');

-- System can insert backup codes
CREATE POLICY "Allow backup code operations"
  ON public.totp_backup_codes
  FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'email');

-- System can update backup codes
CREATE POLICY "Allow backup code updates"
  ON public.totp_backup_codes
  FOR UPDATE
  USING (user_id = auth.jwt() ->> 'email');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify RLS is properly configured:

-- Check which tables have RLS enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- View all policies
-- SELECT * FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- Check policies on a specific table
-- SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stores';
