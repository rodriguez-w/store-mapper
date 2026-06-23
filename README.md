# 🗺️ Store Mapper - Complete Project Guide

## Project Overview

**Store Mapper** is a responsive web app that helps users find nearby stores using their device location. Here's how it works:

```
User arrives → Click "Get Location" → Browser asks permission → 
Shows map with user & nearby stores → Adjustable radius filter → 
See list + map view
```

## 📁 Project Structure

```
store-mapper/
├── src/
│   ├── components/
│   │   ├── LocationFinder.jsx      # Gets user location via GPS
│   │   ├── LocationFinder.css      
│   │   ├── RadiusControl.jsx       # Lets user adjust search distance
│   │   ├── RadiusControl.css       
│   │   ├── StoreList.jsx           # Shows nearby stores in a list
│   │   └── StoreList.css           
│   ├── App.jsx                      # Main app logic & map
│   ├── App.css                      # Responsive layout
│   └── main.jsx                     # Entry point
├── index.html                       # HTML template
├── package.json                     # Dependencies
├── vite.config.js                   # Build config
├── .env.example                     # Environment variables template
└── README.md                        # This file
```

## 🔧 Setup Instructions

### Step 1: Install Node.js & npm
If you don't have them:
1. Go to https://nodejs.org/ 
2. Download the LTS version
3. Install with default options
4. Restart your terminal/PowerShell

Verify installation:
```bash
node --version    # Should show v18.x or higher
npm --version     # Should show 9.x or higher
```

### Step 2: Install Project Dependencies
```bash
cd store-mapper
npm install
```

This installs all required packages from `package.json`:
- **React** - UI framework
- **Leaflet** - Map library
- **react-leaflet** - React bindings for Leaflet
- **Supabase** - Database/backend
- **Vite** - Build tool (faster than Create React App)

### Step 3: Create Supabase Account
1. Go to https://supabase.com
2. Sign up (free)
3. Create a new project (any region is fine)
4. Go to **Settings → Database** to find:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Step 4: Create Stores Database Table
In Supabase:
1. Go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Paste this code:
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

-- Sample data (replace with your stores)
INSERT INTO stores (name, address, latitude, longitude, phone) VALUES
  ('Downtown Store', '123 Main St', 40.7128, -74.0060, '555-0001'),
  ('Mall Location', '456 Plaza Ave', 40.7260, -74.0100, '555-0002'),
  ('Uptown Hub', '789 Park Blvd', 40.7489, -73.9680, '555-0003'),
  ('Riverside', '321 River Rd', 40.7505, -73.9972, '555-0004'),
  ('Midtown', '654 5th Ave', 40.7580, -73.9855, '555-0005');
```
4. Click **Run**
5. Go to **Authentication → Policies** and enable anonymous access (for public access)

### Step 5: Set Environment Variables
1. Copy `.env.example` → `.env.local`
2. Fill in your Supabase credentials:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Step 6: Run Development Server
```bash
npm run dev
```

Output:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Open http://localhost:5173/ in your browser 🎉

## 🧠 How It Works - Technical Deep Dive

### 1️⃣ LocationFinder Component
```javascript
navigator.geolocation.getCurrentPosition(position => {
  const { latitude, longitude } = position.coords;
  // Browser asks user permission, returns coordinates
})
```
**How it works on mobile:** Browser accesses GPS/WiFi triangulation automatically.

### 2️⃣ Distance Calculation (Haversine Formula)
```javascript
const R = 6371000; // Earth's radius in meters
// Math to calculate great-circle distance between 2 points
// Returns: 450 meters, 2.3 km, etc.
```

### 3️⃣ Store Filtering
```javascript
// In App.jsx useEffect:
stores.filter(store => {
  distance = calculateDistance(userLat, userLon, storeLat, storeLon);
  return distance <= radius;  // Only show within radius
})
```

### 4️⃣ Real-time Map Updates
```javascript
// When user moves or changes radius:
// Leaflet automatically re-renders markers & circle
// No page refresh needed
```

### 5️⃣ Responsive Design
- **Desktop** (>768px): Sidebar on left, map on right
- **Tablet** (481-768px): Sidebar on top, map below
- **Mobile** (<480px): Stacked layout, optimized touch

## 🎨 Customization

### Change Default Radius
In `App.jsx`:
```javascript
const [radius, setRadius] = useState(500); // Change 500 to your preference
```

### Add More Presets
In `RadiusControl.jsx`:
```javascript
const presets = [
  { label: '1 km', value: 1000 },  // Add this
  { label: '5 km', value: 5000 },
  // ...
];
```

### Change Map Provider
In `App.jsx`, replace TileLayer:
```javascript
// Instead of OpenStreetMap:
url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"

// Use Mapbox (requires API key):
url="https://api.mapbox.com/styles/v1/mapbox/streets-v11..."

// Use Stamen (artistic):
url="https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png"
```

### Store Data
Add to Supabase `stores` table via SQL or admin panel:
- **name**: Store name
- **address**: Street address
- **latitude/longitude**: Use Google Maps or GPS
- **phone**: Optional contact number

## 📦 Build for Production
```bash
npm run build
```
Creates optimized `dist/` folder (~200KB gzipped).

Deploy to Vercel:
```bash
npm install -g vercel
vercel
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Supabase key not found" | Check `.env.local` has correct VITE_SUPABASE_URL |
| Location permission denied | User clicked "Block" - must clear browser permissions |
| Map not showing | Check internet connection, Leaflet CDN working |
| Stores not loading | Check Supabase table exists & has data |
| Mobile not responsive | Clear browser cache (Ctrl+Shift+Delete) |

## 🚀 Next Steps to Extend

1. **Admin Panel** - Add/edit stores without SQL
2. **Store Details** - Click store to see hours, website, reviews
3. **Navigation** - "Get Directions" button using Google Maps
4. **Search** - Filter stores by name or category
5. **Favorites** - Save/bookmark favorite stores
6. **Real-time Updates** - Supabase real-time subscriptions
7. **Offline Support** - Service Workers + IndexedDB

## 📚 Resources

- [React Docs](https://react.dev)
- [Leaflet.js](https://leafletjs.com)
- [Supabase Guide](https://supabase.com/docs)
- [Vite Guide](https://vitejs.dev)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

Happy mapping! 🗺️✨
