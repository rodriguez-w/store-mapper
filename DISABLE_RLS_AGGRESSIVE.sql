-- AGGRESSIVE FIX: Completely disable RLS and remove all policies

-- Step 1: Drop ALL policies on store_requests
DROP POLICY IF EXISTS "Allow authenticated users to insert store requests" ON store_requests;
DROP POLICY IF EXISTS "Allow users to read their own requests" ON store_requests;
DROP POLICY IF EXISTS "Allow authenticated users to read requests" ON store_requests;
DROP POLICY IF EXISTS "Allow authenticated users to update requests" ON store_requests;
DROP POLICY IF EXISTS "Allow authenticated users to delete requests" ON store_requests;
DROP POLICY IF EXISTS "Allow all authenticated users to read categories" ON store_categories;

-- Step 2: Drop ALL policies on store_categories
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON store_categories;
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON store_categories;
DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON store_categories;
DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON store_categories;

-- Step 3: Disable RLS completely on both tables
ALTER TABLE IF EXISTS store_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS store_categories DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify RLS is disabled
-- (You can check this in Supabase Table Editor - the lock icon should NOT appear next to table names)
