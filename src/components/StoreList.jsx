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
 * 3. Lists store name and address
 * 4. Shows count of nearby stores
 * 5. Displays store status toggle (OPEN/CLOSED)
 * 6. Updates store status in database
 */
export default function StoreList({ stores, loading, error }) {
  const [updatingStoreId, setUpdatingStoreId] = useState(null);
  const [statusError, setStatusError] = useState('');

  const handleStatusToggle = async (store) => {
    setUpdatingStoreId(store.id);
    setStatusError('');

    try {
      const newStatus = store.status === 'open' ? 'closed' : 'open';

      // Update store status in database
      const { error: updateError } = await supabase
        .from('stores')
        .update({ status: newStatus })
        .eq('id', store.id);

      if (updateError) throw updateError;

      // Update local state by refreshing the stores
      // This will be handled by the parent component through re-render
      console.log(`Store ${store.id} status updated to ${newStatus}`);
    } catch (err) {
      setStatusError(err.message || 'Error updating store status');
      console.error('Error toggling store status:', err);
    } finally {
      setUpdatingStoreId(null);
    }
  };

  return (
    <div className="store-list">
      <h2>🏪 Nearby Stores</h2>
      
      <div className="store-count">
        <span>{stores.length} store(s) found</span>
      </div>

      {statusError && <p className="error">{statusError}</p>}
      {loading && <p className="loading">Loading stores...</p>}
      {error && <p className="error">{error}</p>}

      {stores.length === 0 && !loading ? (
        <p className="no-stores">No stores nearby</p>
      ) : (
        <ul className="stores">
          {stores.map(store => (
            <li key={store.id} className="store-item">
              <div className="store-content">
                <div className="store-info">
                  <h3>{store.name}</h3>
                  {store.site_group && <p className="site-group">📍 {store.site_group}</p>}
                  {store.segmento && <p className="segmento">🏷️ {store.segmento}</p>}
                  {store.address && <p className="address">{store.address}</p>}
                  {store.phone && <p className="phone">📞 {store.phone}</p>}
                </div>

                <div className="store-toggle-section">
                  <div className="status-label">
                    {updatingStoreId === store.id ? '⏳' : (store.status === 'open' ? '🟢 OPEN' : '🔴 CLOSED')}
                  </div>
                  <button
                    className={`ios-toggle ${store.status === 'open' ? 'open' : 'closed'}`}
                    onClick={() => handleStatusToggle(store)}
                    disabled={updatingStoreId === store.id}
                    title={`Click to mark as ${store.status === 'open' ? 'closed' : 'open'}`}
                    aria-label={`Toggle store status: ${store.status}`}
                  >
                    <span className="toggle-circle"></span>
                    <span className="toggle-symbol">
                      {store.status === 'open' ? '✓' : '✕'}
                    </span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
