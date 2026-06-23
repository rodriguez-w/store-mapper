# Supabase Schema Update Guide

Your admin panel expects these columns in the `stores` table:

## Current Schema → New Schema

### Columns to Add:
```sql
-- Add these columns if they don't exist
ALTER TABLE stores ADD COLUMN segmento VARCHAR(255);
ALTER TABLE stores ADD COLUMN account VARCHAR(255);
ALTER TABLE stores ADD COLUMN site_group VARCHAR(255);
ALTER TABLE stores ADD COLUMN gscm VARCHAR(255);
```

### Full Expected Schema:
```sql
CREATE TABLE stores (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  latitude FLOAT8 NOT NULL,
  longitude FLOAT8 NOT NULL,
  phone VARCHAR(20),
  country VARCHAR(100),
  segmento VARCHAR(255),
  account VARCHAR(255),
  site_group VARCHAR(255),
  gscm VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## How to Update Supabase:

1. Go to https://app.supabase.com
2. Select your project: `store-mapper`
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Paste the ALTER TABLE commands above
6. Click **Run**
7. Done!

## Alternative: If Starting Fresh

If you want to recreate the table from scratch:

1. Go to **Table Editor** → Select `stores` table
2. Click the dropdown menu → **Delete table**
3. Click **Create a new table**
4. Name it `stores`
5. Add columns:
   - `id` (bigint, primary key, auto-increment)
   - `name` (text, required)
   - `latitude` (float8, required)
   - `longitude` (float8, required)
   - `address` (text)
   - `phone` (text)
   - `country` (text)
   - `segmento` (text)
   - `account` (text)
   - `site_group` (text)
   - `gscm` (text)
   - `created_at` (timestamp, default now())

6. Click **Save**
7. Go to **Authentication** → **Policies** → Make sure RLS is **OFF** for now (we configured this before)
