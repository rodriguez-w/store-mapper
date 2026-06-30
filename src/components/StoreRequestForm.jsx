import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './StoreRequestForm.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * StoreRequestForm Component
 * Form for consumers to request new stores
 */
export default function StoreRequestForm({ onNavigate }) {
  const [formData, setFormData] = useState({
    storeName: '',
    storeCategory: '',
    latitude: null,
    longitude: null,
    image: null,
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Initialize map when coordinates are available
  useEffect(() => {
    if (formData.latitude && formData.longitude && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [formData.latitude, formData.longitude]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    // Create map
    const map = L.map(mapRef.current).setView(
      [formData.latitude, formData.longitude],
      15
    );

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add marker
    L.marker([formData.latitude, formData.longitude])
      .addTo(map)
      .bindPopup('Store Location');

    mapInstanceRef.current = map;
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('store_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load store categories');
    }
  };

  const handleGetLocation = async () => {
    setLocationLoading(true);
    setError('');

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          setLocationLoading(false);
        },
        (err) => {
          setError(`Error getting location: ${err.message}`);
          setLocationLoading(false);
        }
      );
    } catch (err) {
      setError(err.message || 'Failed to get location');
      setLocationLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.storeName.trim()) {
        throw new Error('Store name is required');
      }
      if (!formData.storeCategory) {
        throw new Error('Please select a store category');
      }
      if (!formData.latitude || !formData.longitude) {
        throw new Error('Please get your location');
      }

      // Get current user session
      const session = JSON.parse(sessionStorage.getItem('store_mapper_session') || '{}');
      const employeeId = session.employeeId;

      if (!employeeId) {
        throw new Error('User session not found');
      }

      let imageUrl = null;

      // Upload image if provided
      if (formData.image) {
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${formData.image.name}`;
        const { error: uploadError, data } = await supabase.storage
          .from('store-requests')
          .upload(`public/${fileName}`, formData.image, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: publicUrl } = supabase.storage
          .from('store-requests')
          .getPublicUrl(`public/${fileName}`);

        imageUrl = publicUrl.publicUrl;
      }

      // Create store request
      const { error: insertError } = await supabase
        .from('store_requests')
        .insert([
          {
            id: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            store_name: formData.storeName.trim(),
            store_category: formData.storeCategory,
            latitude: formData.latitude,
            longitude: formData.longitude,
            image_url: imageUrl,
            requested_by: employeeId,
            status: 'pending',
          },
        ]);

      if (insertError) throw insertError;

      // Show success screen
      setShowSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to submit store request');
      console.error('Error submitting request:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAnother = () => {
    // Reset form and map
    setFormData({
      storeName: '',
      storeCategory: '',
      latitude: null,
      longitude: null,
      image: null,
    });
    setImagePreview(null);
    setShowSuccess(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  };

  const handleBackToMenu = () => {
    if (onNavigate) {
      onNavigate('map');
    }
  };

  if (showSuccess) {
    return (
      <div className="store-request-container">
        <div className="form-wrapper success-wrapper">
          <div className="success-screen">
            <div className="success-icon">✅</div>
            <div className="success-title">Request Submitted!</div>
            <div className="success-message">
              Thank you for helping us discover new stores. Our team will review your submission shortly.
            </div>
            <div className="success-actions">
              <button className="btn-primary" onClick={handleRequestAnother}>
                📍 Request Another Store
              </button>
              <button className="btn-secondary" onClick={handleBackToMenu}>
                ← Back to Map
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="store-request-container">
      <div className="form-wrapper">
        <h2>📍 Request a New Store</h2>
        <p className="form-subtitle">Help us discover new stores in your area</p>

        <form onSubmit={handleSubmit} className="request-form">
          {/* Store Name */}
          <div className="form-group">
            <label htmlFor="storeName">Store Name *</label>
            <input
              type="text"
              id="storeName"
              value={formData.storeName}
              onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
              placeholder="e.g., Cool Store Name"
              disabled={loading}
              required
            />
          </div>

          {/* Store Category */}
          <div className="form-group">
            <label htmlFor="storeCategory">Store Category *</label>
            <select
              id="storeCategory"
              value={formData.storeCategory}
              onChange={(e) => setFormData(prev => ({ ...prev, storeCategory: e.target.value }))}
              disabled={loading}
              required
            >
              <option value="">Select a category...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="form-group">
            <label>Store Location *</label>
            <button
              type="button"
              className={`btn-location ${formData.latitude ? 'success' : ''}`}
              onClick={handleGetLocation}
              disabled={loading || locationLoading}
            >
              {locationLoading ? '⏳ Getting location...' : '📍 Get My Location'}
            </button>
            {formData.latitude && (
              <>
                <p className="location-display">
                  ✓ Location: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </p>
                <div className="coordinate-preview">
                  <div className="coordinate-preview-header">📍 Location Preview</div>
                  <div className="coordinate-preview-map" ref={mapRef}></div>
                  <div className="coordinate-values">
                    <div className="coordinate-item">
                      <label>Latitude</label>
                      <value>{formData.latitude.toFixed(6)}</value>
                    </div>
                    <div className="coordinate-item">
                      <label>Longitude</label>
                      <value>{formData.longitude.toFixed(6)}</value>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label htmlFor="image">Store Photo (Optional)</label>
            <div className="image-upload">
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
              />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Store preview" />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, image: null }));
                      setImagePreview(null);
                    }}
                    className="btn-remove-image"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && <div className="message error">{error}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? '⏳ Submitting...' : '✓ Submit Store Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
