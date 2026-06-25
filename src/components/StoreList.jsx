import React from 'react';
import './StoreList.css';

/**
 * StoreList Component
 * 
 * This component:
 * 1. Displays nearby stores in a scrollable list
 * 2. Shows loading/error states
 * 3. Lists store name and address
 * 4. Shows count of nearby stores
 */
export default function StoreList({ stores, loading, error }) {
  return (
    <div className="store-list">
      <h2>🏪 Nearby Stores</h2>
      
      <div className="store-count">
        <span>{stores.length} store(s) found</span>
      </div>

      {loading && <p className="loading">Loading stores...</p>}
      {error && <p className="error">{error}</p>}

      {stores.length === 0 && !loading ? (
        <p className="no-stores">No stores nearby</p>
      ) : (
        <ul className="stores">
          {stores.map(store => (
            <li key={store.id} className="store-item">
              <h3>{store.name}</h3>
              {store.site_group && <p className="site-group">📍 {store.site_group}</p>}
              {store.segmento && <p className="segmento">🏷️ {store.segmento}</p>}
              {store.address && <p className="address">{store.address}</p>}
              {store.phone && <p className="phone">📞 {store.phone}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
