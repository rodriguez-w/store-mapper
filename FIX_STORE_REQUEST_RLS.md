# Fix Store Request RLS Policy Error

## Problem
When trying to save a store request or add store categories, you were getting:
```
new row violates row-level security policy
```

This happened because RLS policies weren't compatible with your custom TOTP authentication system (which doesn't use Supabase's native authentication).

## Solution

### Step 1: Run the Updated SQL Migration

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your `store-mapper` project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of `STORE_REQUEST_RLS.sql` (found in the project root)
6. Click **Run**

**What Changed**: The updated SQL now:
- ✅ Disables RLS on `store_categories` and `store_requests` tables
- ✅ Creates proper table schemas with all required columns
- ✅ Adds performance indexes
- ✅ Works with your custom TOTP authentication system

**Why**: Your app uses custom TOTP-based authentication stored in the `employees` and `admins` tables, not Supabase's native auth. So RLS policies based on Supabase auth don't apply here.

### What This SQL Does:
- Creates or updates the `store_categories` table with proper schema
- Creates or updates the `store_requests` table with proper schema and indexes
- Enables RLS on both tables
- Removes any old policies that might be conflicting
- Creates new policies that:
  - Allow authenticated users to **read** categories
  - Allow authenticated users to **insert** store requests
  - Allow authenticated users to **read, update, and delete** requests

## Step 2: Verify the Tables

Go to **Table Editor** in Supabase and verify:

### `store_categories` table should have:
- `id` (BIGINT, Primary Key)
- `name` (TEXT, Unique)
- `description` (TEXT)
- `created_at` (TIMESTAMP)

### `store_requests` table should have:
- `id` (TEXT, Primary Key)
- `store_name` (TEXT)
- `store_category` (TEXT)
- `latitude` (FLOAT8)
- `longitude` (FLOAT8)
- `image_url` (TEXT)
- `status` (TEXT) - should be one of: 'pending', 'approved', 'rejected'
- `requested_by` (TEXT)
- `requested_at` (TIMESTAMP)
- `reviewed_by` (TEXT)
- `reviewed_at` (TIMESTAMP)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)

## Step 3: Test the Store Request Feature

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Login to the consumer app with your employee credentials

3. Click the hamburger menu (☰) and select **"➕ Request Store"**

4. Fill out the form:
   - **Store Name**: Enter any store name
   - **Store Category**: Select a category (if none exist, add some in the Admin Panel first)
   - **Get My Location**: Click to get your current location
   - **Location Preview**: You should see a small map showing your exact location with coordinates
   - **Store Photo**: (Optional) Upload a photo

5. Click **"✓ Submit Store Request"**

6. You should see a success screen with:
   - ✅ Icon and confirmation message
   - **📍 Request Another Store** button - to submit another request
   - **← Back to Menu** button - to return to the store finder

## Step 4: Verify in Admin Panel

1. Go to the admin panel at `http://localhost:5173/admin`
2. Login with your admin credentials
3. Go to the **"Store Review"** tab
4. Under **"Store Requests"** section, you should see your submitted request with:
   - Store name and category
   - A small map showing the coordinates
   - Timestamp of when it was submitted
   - Status (should be "pending")
   - Option to mark as "approved" or "rejected"

## Features Added

### Consumer Store Request Form:
✅ **Scrollable Form** - Form now scrolls properly on mobile and web versions
✅ **Coordinate Preview** - Shows a mini Leaflet map with your selected location
✅ **Coordinate Display** - Shows exact latitude and longitude values
✅ **Success Screen** - After submission, shows a confirmation with two options
✅ **Request Another** - Allows users to quickly submit another store request
✅ **Back to Menu** - Navigate back to the store finder

### Form Validation:
- Store name is required
- Store category must be selected
- Location coordinates are required
- Image must be less than 5MB
- Clear error messages for each validation

## Troubleshooting

### Error: "User session not found"
- Make sure you're logged in to the consumer app
- Clear browser cache/cookies and login again

### Error: "Failed to load store categories"
- Go to admin panel and add categories in the **"Store Review"** → **"Categories"** section

### Error: "Store request submitted but I don't see it in Admin"
- Refresh the admin panel
- Make sure you're logged in as an admin
- Check the "Store Requests" subsection, not the "Categories" one

### Map is not showing in location preview
- Make sure Leaflet CSS is imported (it should be automatically)
- Try refreshing the page
- Check browser console for any errors

## Next Steps

1. Test the form on mobile devices
2. Add more store categories via the admin panel
3. Test the admin review workflow
4. Customize the form fields as needed
