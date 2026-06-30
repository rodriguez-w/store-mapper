-- Store Categories and Store Requests RLS Setup

-- Ensure store_categories table exists with proper schema
CREATE TABLE IF NOT EXISTS store_categories (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ensure store_requests table exists with proper schema
CREATE TABLE IF NOT EXISTS store_requests (
  id TEXT PRIMARY KEY,
  store_name TEXT NOT NULL,
  store_category TEXT NOT NULL,
  latitude FLOAT8 NOT NULL,
  longitude FLOAT8 NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_requests_status ON store_requests(status);
CREATE INDEX IF NOT EXISTS idx_store_requests_requested_by ON store_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_store_requests_created_at ON store_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_categories_name ON store_categories(name);

-- Disable RLS on both tables (we're using custom TOTP authentication, not Supabase auth)
ALTER TABLE store_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_requests DISABLE ROW LEVEL SECURITY;

