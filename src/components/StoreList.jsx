import React, { useState, useEffect } from 'react';
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
 * 7. Subscribes to real-time database changes
 */
export default function StoreList({ stores, loading, error, onStoresUpdate }) {
  const [updatingStoreId, setUpdatingStoreId] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [localStores, setLocalStores] = useState(stores);

  // Update local stores when parent stores change
  useEffect(() => {
    setLocalStores(stores);
  }, [stores]);

  // Subscribe to real-time changes from database
  useEffect(() => {
    const subscription = supabase
      .channel('stores:updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stores'
        },
        (payload) => {
          // Update the specific store in local state
          setLocalStores(prevStores =>
            prevStores.map(store =>
              store.id === payload.new.id ? payload.new : store
            )
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

      // Trigger parent component to refresh stores if callback provided
      if (onStoresUpdate) {
        onStoresUpdate();
      }

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
      <h2>Nearby Stores</h2>
      
      <div className="store-count">
        <span>{localStores.length} store(s) found</span>
      </div>

      {statusError && <p className="error">{statusError}</p>}
      {loading && <p className="loading">Loading stores...</p>}
      {error && <p className="error">{error}</p>}

      {localStores.length === 0 && !loading ? (
        <p className="no-stores">No stores nearby</p>
      ) : (
        <ul className="stores">
          {localStores.map(store => (
            <li key={store.id} className="store-item">
              <div className="store-content">
                <div className="store-info">
                  <h3>{store.name}</h3>
                  {store.site_group && <p className="site-group">{store.site_group}</p>}
                  {store.segmento && <p className="segmento">{store.segmento}</p>}
                  {store.address && <p className="address">{store.address}</p>}
                  {store.phone && <p className="phone">{store.phone}</p>}
                </div>

                <div className="store-toggle-section">
                  <div className="status-label">
                    {store.status === 'open' ? 'OPEN' : 'CLOSED'}
                  </div>
                  <button
                    className={`toggle-switch ${store.status === 'open' ? 'open' : 'closed'}`}
                    onClick={() => handleStatusToggle(store)}
                    disabled={updatingStoreId === store.id}
                    title={`Click to mark as ${store.status === 'open' ? 'closed' : 'open'}`}
                    aria-label={`Toggle store status: ${store.status}`}
                  >
                    <span className={`toggle-part open-part ${store.status === 'open' ? 'active' : ''}`}>
                      ✓
                    </span>
                    <span className={`toggle-part closed-part ${store.status === 'closed' ? 'active' : ''}`}>
                      ✕
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
