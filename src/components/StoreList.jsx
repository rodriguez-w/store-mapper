import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import './StoreList.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * StoreList Component
 * 
 * This component:
 * 1. Displays nearby stores in a scrollable list
 * 2. Shows loading/error states
 * 3. Lists store name, location, and status toggle
 * 4. Allows inline status updates with optimistic UI
 */
export default function StoreList({ stores, loading, error }) {
  const [localStores, setLocalStores] = useState(stores);
  const [updating, setUpdating] = useState(null);

  // Update local stores when props change
  React.useEffect(() => {
    console.log('StoreList received stores:', stores);
    stores.forEach(store => console.log(`Store: ${store.name}, Status: ${store.status}`));
    setLocalStores(stores);
  }, [stores]);

  const handleStatusToggle = async (storeId, currentStatus) => {
    const newStatus = (currentStatus || 'OPEN') === 'OPEN' ? 'CLOSED' : 'OPEN';
    
    // Optimistically update UI
    setLocalStores(localStores.map(store =>
      store.id === storeId ? { ...store, status: newStatus } : store
    ));
    
    setUpdating(storeId);
    try {
      const { error: err } = await supabase
        .from('stores')
        .update({ status: newStatus })
        .eq('id', storeId);
      
      if (err) throw err;
      console.log(`Store ${storeId} status toggled to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      // Revert on error
      setLocalStores(stores);
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="store-list">
      <h2>🏪 Nearby Stores</h2>
      
      <div className="store-count">
        <span>{localStores.length} store(s) found</span>
      </div>

      {loading && <p className="loading">Loading stores...</p>}
      {error && <p className="error">{error}</p>}

      {localStores.length === 0 && !loading ? (
        <p className="no-stores">No stores nearby</p>
      ) : (
        <ul className="stores">
          {localStores.map(store => {
            const isOpen = (store.status || 'OPEN') === 'OPEN';
            return (
              <li key={store.id} className="store-item">
                <div className="store-content">
                  <div className="store-main">
                    <div className="store-header">
                      <h3>{store.name}</h3>
                    </div>
                    <div className="store-info">
                      {store.site_group && <p className="site-group">📍 {store.site_group}</p>}
                      {store.segmento && <p className="segmento">🏷️ {store.segmento}</p>}
                      {store.address && <p className="address">{store.address}</p>}
                      {store.phone && <p className="phone">📞 {store.phone}</p>}
                    </div>
                  </div>
                  <div className="status-container">
                    <label className="status-label">{isOpen ? 'OPEN' : 'CLOSED'}</label>
                    <button
                      className={`status-switch ${isOpen ? 'open' : 'closed'}`}
                      onClick={() => handleStatusToggle(store.id, store.status)}
                      disabled={updating === store.id}
                      title={`Click to toggle status (currently ${isOpen ? 'OPEN' : 'CLOSED'})`}
                    >
                      <span className="switch-slider"></span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
