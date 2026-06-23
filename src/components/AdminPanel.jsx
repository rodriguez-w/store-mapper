import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './AdminPanel.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('import'); // 'import' or 'manage'
  const [pastedData, setPastedData] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [stores, setStores] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  useEffect(() => {
    if (isLoggedIn && activeTab === 'manage') {
      fetchStores();
    }
  }, [isLoggedIn, activeTab]);

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setPassword('');
      setMessage('');
    } else {
      setMessage('Invalid password');
      setMessageType('error');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setPastedData('');
    setParsedData([]);
    setPreviewRows([]);
    setMessage('');
  };

  // Parse pasted data (tab-separated)
  const handlePaste = (e) => {
    const text = e.target.value;
    setPastedData(text);

    if (!text.trim()) {
      setParsedData([]);
      setPreviewRows([]);
      return;
    }

    // Parse tab-separated values
    const rows = text.split('\n').filter(row => row.trim());
    const parsed = rows.map(row => {
      const cols = row.split('\t');
      return {
        segmento: cols[0]?.trim() || '',
        account: cols[1]?.trim() || '',
        site_group: cols[2]?.trim() || '',
        name: cols[3]?.trim() || '',
        gscm: cols[4]?.trim() || '',
        latitude: parseFloat(cols[5]) || null,
        longitude: parseFloat(cols[6]) || null,
        country: cols[7]?.trim() || 'Panama',
        address: null,
        phone: null,
      };
    });

    setParsedData(parsed);
    setPreviewRows(parsed.slice(0, 5)); // Show first 5 rows as preview
  };

  // Upload stores to Supabase
  const handleUpload = async () => {
    if (parsedData.length === 0) {
      setMessage('No data to upload');
      setMessageType('error');
      return;
    }

    // Validate data
    const invalid = parsedData.filter(
      store => !store.name || store.latitude === null || store.longitude === null
    );
    if (invalid.length > 0) {
      setMessage(`${invalid.length} rows missing required fields (Name, Latitude, Longitude)`);
      setMessageType('error');
      return;
    }

    setUploading(true);
    try {
      const { data, error } = await supabase.from('stores').insert(parsedData);
      if (error) throw error;
      
      setMessage(`✅ Successfully uploaded ${parsedData.length} stores!`);
      setMessageType('success');
      setPastedData('');
      setParsedData([]);
      setPreviewRows([]);
      
      // Refresh store list
      if (activeTab === 'manage') {
        fetchStores();
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  // Fetch all stores
  const fetchStores = async () => {
    try {
      const { data, error } = await supabase.from('stores').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      setMessage(`Error fetching stores: ${err.message}`);
      setMessageType('error');
    }
  };

  // Delete a store
  const handleDeleteStore = async (id) => {
    if (!confirm('Are you sure?')) return;
    
    try {
      const { error } = await supabase.from('stores').delete().eq('id', id);
      if (error) throw error;
      
      setMessage('Store deleted');
      setMessageType('success');
      fetchStores();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setMessageType('error');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login">
        <div className="login-box">
          <h1>🔐 Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit">Login</button>
          </form>
          {message && <p className={`message ${messageType}`}>{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>📊 Admin Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          📥 Import Stores
        </button>
        <button
          className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          🛠️ Manage Stores
        </button>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
          <button onClick={() => setMessage('')}>✕</button>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="import-section">
          <h2>Paste Store Data</h2>
          <p>Copy from Excel and paste tab-separated rows below:</p>
          
          <textarea
            value={pastedData}
            onChange={handlePaste}
            placeholder="Paste tab-separated data here (SEGMENTO	ACCOUNT	SITE GROUP	MSO NAME	GSCM	LATITUDE	LONGITUDE	COUNTRY)"
            rows="8"
          />

          {previewRows.length > 0 && (
            <div className="preview">
              <h3>Preview ({parsedData.length} rows)</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>GSCM</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Country</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.name}</td>
                      <td>{row.gscm}</td>
                      <td>{row.latitude}</td>
                      <td>{row.longitude}</td>
                      <td>{row.country}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 5 && <p>... and {parsedData.length - 5} more rows</p>}
            </div>
          )}

          {parsedData.length > 0 && (
            <button
              className="upload-btn"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? '⏳ Uploading...' : `✅ Upload ${parsedData.length} Stores`}
            </button>
          )}
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="manage-section">
          <h2>Manage Stores ({stores.length})</h2>
          
          {stores.length === 0 ? (
            <p>No stores found. Use the Import tab to add stores.</p>
          ) : (
            <div className="stores-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>GSCM</th>
                    <th>Location</th>
                    <th>Account</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map(store => (
                    <tr key={store.id}>
                      <td>{store.name}</td>
                      <td>{store.gscm}</td>
                      <td>{store.latitude?.toFixed(4)}, {store.longitude?.toFixed(4)}</td>
                      <td>{store.account}</td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteStore(store.id)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
