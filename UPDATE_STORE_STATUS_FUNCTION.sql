-- ============================================================================
-- HELPER FUNCTION: Update Store Status with Audit
-- ============================================================================
-- This function allows the app to update store status while passing
-- the employee ID for proper audit logging
-- ============================================================================

DROP FUNCTION IF EXISTS update_store_status(bigint, VARCHAR, VARCHAR) CASCADE;

CREATE OR REPLACE FUNCTION update_store_status(
  p_store_id BIGINT,
  p_new_status VARCHAR,
  p_employee_id VARCHAR
)
RETURNS TABLE (success BOOLEAN, message VARCHAR, store_id BIGINT) AS $$
DECLARE
  v_old_status VARCHAR;
  v_valid_status VARCHAR;
BEGIN
  -- Validate status input
  v_valid_status := LOWER(p_new_status);
  IF v_valid_status NOT IN ('open', 'closed') THEN
    RETURN QUERY SELECT false, 'Invalid status. Must be OPEN or CLOSED'::VARCHAR, p_store_id::BIGINT;
    RETURN;
  END IF;

  -- Get current status
  SELECT status INTO v_old_status FROM public.stores WHERE id = p_store_id;
  
  IF v_old_status IS NULL THEN
    RETURN QUERY SELECT false, 'Store not found'::VARCHAR, p_store_id::BIGINT;
    RETURN;
  END IF;

  -- Set employee ID in session for trigger to use
  PERFORM set_config('app.current_user_id', p_employee_id, false);

  -- Update the store status
  UPDATE public.stores
  SET status = v_valid_status
  WHERE id = p_store_id;

  -- Log to audit trail
  INSERT INTO public.audit_log (
    employee_id,
    action,
    store_id,
    old_status,
    new_status,
    details,
    created_at
  ) VALUES (
    p_employee_id,
    'STORE_STATUS_CHANGE',
    p_store_id,
    v_old_status,
    v_valid_status,
    'Store status changed via update_store_status function',
    NOW()
  );

  RETURN QUERY SELECT true, 'Store status updated successfully'::VARCHAR, p_store_id::BIGINT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, ('Error: ' || SQLERRM)::VARCHAR, p_store_id::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_store_status(BIGINT, VARCHAR, VARCHAR) TO authenticated;

-- ============================================================================
-- USAGE FROM CLIENT:
-- ============================================================================
-- const { data, error } = await supabase.rpc('update_store_status', {
--   p_store_id: storeId,
--   p_new_status: newStatus,
--   p_employee_id: session.employeeId
-- });
-- ============================================================================
