import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * SimpleMap Component
 * 
 * Uses vanilla Leaflet instead of react-leaflet
 * to avoid rendering issues with chunked tiles
 */
export default function SimpleMap({ center, zoom, stores, userLocation, radius, onMapReady }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);

  // Debug logging
  useEffect(() => {
    console.log('SimpleMap received stores:', stores);
    console.log('Number of stores:', stores ? stores.length : 0);
  }, [stores]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current).setView(
      [center.latitude, center.longitude],
      zoom
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map.current);

    if (onMapReady) {
      onMapReady(map.current);
    }

    // Force size recalculation
    setTimeout(() => {
      map.current.invalidateSize();
    }, 100);

    return () => {
      // Don't destroy map on unmount to keep state
    };
  }, []);

  // Update map center and zoom
  useEffect(() => {
    if (map.current) {
      map.current.setView([center.latitude, center.longitude], zoom, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    markersRef.current.forEach(marker => map.current.removeLayer(marker));
    markersRef.current = [];

    // Clear old circle
    if (circleRef.current) {
      map.current.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    // User location marker
    if (userLocation) {
      const userMarker = L.marker(
        [userLocation.latitude, userLocation.longitude],
        {
          icon: L.icon({
            iconUrl:
              'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          }),
        }
      )
        .addTo(map.current)
        .bindPopup('Your Location');

      markersRef.current.push(userMarker);

      // Add NEW proximity circle
      circleRef.current = L.circle([userLocation.latitude, userLocation.longitude], {
        color: 'blue',
        fillColor: 'lightblue',
        fillOpacity: 0.2,
        radius: radius,
      }).addTo(map.current);
    }

    // Store markers
    if (stores && stores.length > 0) {
      stores.forEach(store => {
        const storeMarker = L.marker(
          [store.latitude, store.longitude],
          {
            icon: L.icon({
              iconUrl:
                'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              shadowUrl:
                'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            }),
          }
        )
          .addTo(map.current)
          .bindPopup(`<strong>${store.name}</strong><p>${store.address}</p>`);

        markersRef.current.push(storeMarker);
      });
    }
  }, [stores, userLocation, radius]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (map.current) {
        map.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />;
}
