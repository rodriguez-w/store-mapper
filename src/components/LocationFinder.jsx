import React, { useState } from 'react';
import './LocationFinder.css';

/**
 * LocationFinder Component
 * 
 * This component:
 * 1. Requests user's location using Browser Geolocation API
 * 2. Shows loading/error states
 * 3. Displays current location to user
 * 4. Handles permissions and errors
 */
export default function LocationFinder({ onLocationFound }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);

  const handleGetLocation = () => {
    setLoading(true);
    setError(null);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationData = { latitude, longitude };
          
          setLocation(locationData);
          onLocationFound(locationData);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation not supported by your browser');
      setLoading(false);
    }
  };

  return (
    <div className="location-finder">
      <h2>Location</h2>
      
      <button
        onClick={handleGetLocation}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Getting location...' : 'Get My Location'}
      </button>

      {error && <div className="error">{error}</div>}

      {location && (
        <div className="location-info">
          <p>
            <strong>Latitude:</strong> {location.latitude.toFixed(4)}
          </p>
          <p>
            <strong>Longitude:</strong> {location.longitude.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
}
