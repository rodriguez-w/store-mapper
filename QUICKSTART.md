# ⚡ Quick Start (5 Minutes)

## For People Who Want to See It Running NOW

### Step 1: Install Node.js (2 min)
- Go to **https://nodejs.org** → Download LTS
- Install with default options
- Restart your terminal

### Step 2: Create Supabase Project (2 min)
1. Go to **https://supabase.com** → Sign up (free)
2. Create new project
3. Wait for setup (~1 min)
4. Settings → Database → Copy these URLs:
   - `VITE_SUPABASE_URL` (like `https://xxxxx.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` (long string starting with `eyJ`)

### Step 3: Setup Database (1 min)
In Supabase, go to **SQL Editor** → Click **New Query** → Paste:

```sql
CREATE TABLE stores (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR NOT NULL,
  address VARCHAR NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  phone VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO stores (name, address, latitude, longitude, phone) VALUES
  ('Store 1', '123 Main St', 40.7128, -74.0060, '555-0001'),
  ('Store 2', '456 Park Ave', 40.7260, -74.0100, '555-0002'),
  ('Store 3', '789 5th Ave', 40.7489, -73.9680, '555-0003');
```

Click **Run** ✓

### Step 4: Configure App (30 seconds)
In the `store-mapper` folder:
1. Rename `.env.example` → `.env.local`
2. Paste your Supabase credentials

### Step 5: Start It Up (30 seconds)
```bash
cd store-mapper
npm install
npm run dev
```

Open **http://localhost:5173** in your browser 🎉

---

## How to Use

1. **Get My Location** - Browser asks permission (click Allow)
2. **See Map** - Your blue dot on map
3. **Adjust Radius** - Drag slider or click presets
4. **See Stores** - Red dots appear + list on left

---

## Customize Stores

Edit the Supabase database directly:
1. Go to Supabase → **Table Editor**
2. Click `stores` table
3. Add/edit rows (name, address, latitude, longitude)
4. Changes appear instantly in your app!

---

## Learn the Code

- **App.jsx** - Main logic: fetches stores, calculates distance, renders map
- **LocationFinder.jsx** - Gets user GPS location
- **RadiusControl.jsx** - Slider to adjust search distance
- **StoreList.jsx** - Shows nearby stores in a list

Each file has comments explaining what it does.

---

## Deploy (Free!)

```bash
npm run build
npm install -g vercel
vercel
```

Your app is now live at a URL like `store-mapper-123abc.vercel.app` 🚀

---

**Questions?** Check README.md for full details or common issues.
