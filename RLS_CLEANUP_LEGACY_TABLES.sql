-- Enable RLS on Legacy/Remaining Tables

-- Enable RLS on legacy tables that still exist
ALTER TABLE IF EXISTS public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trusted_devices ENABLE ROW LEVEL SECURITY;

-- Add restrictive policies to legacy tables (block all access by default)

-- ============================================================================
-- ADMINS TABLE - Legacy, restrict all access
-- ============================================================================

DROP POLICY IF EXISTS "Block all admins access" ON public.admins;

CREATE POLICY "Block all access - use admin_access table instead"
  ON public.admins
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- AUDIT_LOG TABLE - Legacy, admins only
-- ============================================================================

DROP POLICY IF EXISTS "Block all audit_log access" ON public.audit_log;

CREATE POLICY "Admins only - use audit_logs table instead"
  ON public.audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      INNER JOIN public.employees e ON aa.employee_id = e.employee_id
      WHERE aa.active = true
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- ============================================================================
-- OTP_CODES TABLE - Legacy, block all
-- ============================================================================

DROP POLICY IF EXISTS "Block all otp_codes access" ON public.otp_codes;

CREATE POLICY "Block all access - deprecated table"
  ON public.otp_codes
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- TRUSTED_DEVICES TABLE - Legacy, block all
-- ============================================================================

DROP POLICY IF EXISTS "Block all trusted_devices access" ON public.trusted_devices;

CREATE POLICY "Block all access - deprecated table"
  ON public.trusted_devices
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all tables now have RLS enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- All should show 't' (true) now
