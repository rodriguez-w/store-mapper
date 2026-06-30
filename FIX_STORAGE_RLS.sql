-- Fix Storage Bucket RLS for store-requests bucket

-- This SQL fixes RLS policies on the storage.objects table for the store-requests bucket

-- Drop existing restrictive policies on the store-requests bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to store-requests" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to store-requests" ON storage.objects;

-- Create a simple policy allowing uploads to the store-requests/public folder
CREATE POLICY "Allow anyone to upload to store-requests"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'store-requests');

-- Create a policy allowing anyone to read from store-requests
CREATE POLICY "Allow anyone to read store-requests"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'store-requests');

-- Create a policy allowing anyone to update/delete in store-requests
CREATE POLICY "Allow anyone to update store-requests"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'store-requests');

CREATE POLICY "Allow anyone to delete from store-requests"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'store-requests');
