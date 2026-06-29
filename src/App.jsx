import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { createClient } from '@supabase/supabase-js';
import LocationFinder from './components/LocationFinder';
import StoreList from './components/StoreList';
import RadiusControl from './components/RadiusControl';
import SimpleMap from './components/SimpleMap';
import AdminPanel from './components/AdminPanel';
import ConsumerLogin from './components/ConsumerLogin';
import AdminLogin from './components/AdminLogin';
import ConsumerMenu from './components/ConsumerMenu';
import StoreRequestForm from './components/StoreRequestForm';
import { getSession, isLoggedIn, destroySession } from './services/authService';
import './App.css';

// Initialize Supabase client (you'll fill in these credentials later)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function Consumer() {
  // Default map center (Panama City)
  const DEFAULT_CENTER = { latitude: 8.9824, longitude: -79.5199 };
  const navigate = useNavigate();
  
  const [currentPage, setCurrentPage] = useState('map');
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [radius, setRadius] = useState(500); // Default 500 meters
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all stores from Supabase
  const fetchStores = async () => {
    try {
      setLoading(true);
      console.log('Fetching stores from:', supabaseUrl);
      const { data, error } = await supabase.from('stores').select('*');
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      console.log('Stores fetched successfully:', data);
      setStores(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two points (in meters)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter stores based on proximity
  useEffect(() => {
    if (userLocation && stores.length > 0) {
      const nearby = stores.filter(store => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          store.latitude,
          store.longitude
        );
        return distance <= radius;
      });
      setFilteredStores(nearby);
    }
  }, [userLocation, stores, radius]);

  // Load stores on component mount
  useEffect(() => {
    fetchStores();
  }, []);

  // Handle map initialization and fix rendering
  const handleMapCreated = (map) => {
    mapRef.current = map;
    // Force map to recalculate size multiple times to ensure proper rendering
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 500);
    setTimeout(() => map.invalidateSize(), 1000);
  };

  // Invalidate size when stores load
  useEffect(() => {
    if (mapRef.current && stores.length > 0) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 300);
    }
  }, [stores]);

  // Also invalidate size when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app">
      <ConsumerMenu 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        onLogout={() => {
          destroySession();
          navigate('/login');
        }}
      />

      {currentPage === 'map' ? (
        <>
          <header className="header">
            <h1>📍 Store Mapper</h1>
            <p>Find nearby stores</p>
          </header>

          <div className="container">
            <aside className="sidebar">
              <LocationFinder onLocationFound={(loc) => {
                setUserLocation(loc);
                setMapCenter(loc);
              }} />
              {userLocation && (
                <RadiusControl radius={radius} onRadiusChange={setRadius} />
              )}
              <StoreList stores={filteredStores} loading={loading} error={error} onStoresUpdate={fetchStores} />
            </aside>

            <main className="map-container">
              <SimpleMap
                center={mapCenter}
                zoom={userLocation ? 15 : 12}
                stores={userLocation ? filteredStores : stores}
                userLocation={userLocation}
                radius={radius}
              />
            </main>
          </div>
        </>
      ) : (
        <StoreRequestForm />
      )}
    </div>
  );
}

function ProtectedRoute({ element, requiredType }) {
  const [authState, setAuthState] = useState({ loading: true, isLoggedIn: false, isAdmin: false });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const session = getSession();
        const isLoggedInNow = isLoggedIn();
        const isAdmin = session?.isAdmin || false;
        
        console.log('[ProtectedRoute] Checking auth:', { session: !!session, isLoggedInNow, isAdmin, requiredType });
        
        // Check if logged in
        if (!session || !isLoggedInNow) {
          console.log('[ProtectedRoute] User not logged in, redirecting');
          setAuthState({ loading: false, isLoggedIn: false, isAdmin: false });
          return;
        }

        // Check if has required access
        if (requiredType === 'admin' && !isAdmin) {
          console.log('[ProtectedRoute] User not admin, redirecting to login');
          setAuthState({ loading: false, isLoggedIn: true, isAdmin: false });
          return;
        }

        console.log('[ProtectedRoute] Auth check passed, rendering element');
        setAuthState({ loading: false, isLoggedIn: true, isAdmin });
      } catch (err) {
        console.error('[ProtectedRoute] Auth check error:', err);
        setAuthState({ loading: false, isLoggedIn: false, isAdmin: false });
      }
    };

    checkAuth();
  }, [requiredType]);

  if (authState.loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!authState.isLoggedIn) {
    // Redirect to appropriate login page
    if (requiredType === 'admin') {
      navigate('/admin/login', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
    return null;
  }

  if (requiredType === 'admin' && !authState.isAdmin) {
    navigate('/login', { replace: true });
    return null;
  }

  return element;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<ConsumerLogin onLoginSuccess={() => window.location.href = '/'} />} />
        <Route path="/admin/login" element={<AdminLogin onLoginSuccess={() => window.location.href = '/admin'} />} />
        <Route path="/" element={<ProtectedRoute element={<Consumer />} requiredType="consumer" />} />
        <Route path="/admin" element={<ProtectedRoute element={<AdminPanel />} requiredType="admin" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
