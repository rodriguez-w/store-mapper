import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './ConsumerManager.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * ConsumerManager Component
 * Admin section for managing consumer users with registration tokens
 */
export default function ConsumerManager() {
  const [consumers, setConsumers] = useState([]);
  const [formData, setFormData] = useState({ 
    email: '', 
    name: '',
    country: 'PA',
    employeeId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bulkData, setBulkData] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [countries, setCountries] = useState(['PA', 'VE']);
  const [newCountry, setNewCountry] = useState('');
  const [showRegistrationLink, setShowRegistrationLink] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);

  // Fetch consumers on mount
  useEffect(() => {
    fetchConsumers();
  }, []);

  const fetchConsumers = async () => {
    try {
      const { data, error } = await supabase
        .from('consumers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsumers(data || []);
    } catch (err) {
      console.error('Error fetching consumers:', err);
      setError('Failed to load consumers');
    }
  };

  // Generate registration token
  const generateRegistrationToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  // Get registration link
  const getRegistrationLink = (token) => {
    return `${window.location.origin}/register?token=${token}`;
  };

  // Copy to clipboard
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Filter consumers based on status and search
  const getFilteredConsumers = () => {
    return consumers.filter(consumer => {
      const matchesStatus = filterStatus === 'all' || consumer.registration_status === filterStatus;
      const matchesSearch = 
        consumer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (consumer.name && consumer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (consumer.employee_id && consumer.employee_id.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesStatus && matchesSearch;
    });
  };

  // Add single consumer
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }
      if (!formData.country) {
        throw new Error('Country is required');
      }
      if (!formData.employeeId.trim()) {
        throw new Error('Employee ID is required');
      }

      // Check if email already exists
      const { data: existing } = await supabase
        .from('consumers')
        .select('id')
        .eq('email', formData.email.trim())
        .single();

      if (existing) {
        throw new Error('This email already exists');
      }

      // Generate registration token
      const registrationToken = generateRegistrationToken();
      const tokenExpiry = new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 7); // 7 days expiry

      // Create new consumer
      const newConsumer = {
        id: `con_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email: formData.email.trim(),
        name: formData.name.trim() || formData.email.trim().split('@')[0],
        country: formData.country,
        employee_id: formData.employeeId.trim(),
        registration_token: registrationToken,
        token_expiry: tokenExpiry.toISOString(),
        registration_status: 'invited',
        status: 'active',
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('consumers')
        .insert([newConsumer]);

      if (insertError) throw insertError;

      setSuccess('Consumer added successfully');
      setShowRegistrationLink(newConsumer);

      // Reset form
      setFormData({ email: '', name: '', country: 'PA', employeeId: '' });

      // Refresh consumers
      await fetchConsumers();

      // Clear success after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Error adding consumer');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Resend registration link
  const handleResendLink = async (consumer) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const registrationToken = generateRegistrationToken();
      const tokenExpiry = new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 7);

      const { error: updateError } = await supabase
        .from('consumers')
        .update({
          registration_token: registrationToken,
          token_expiry: tokenExpiry.toISOString(),
        })
        .eq('id', consumer.id);

      if (updateError) throw updateError;

      setSuccess('Registration link updated');
      const updatedConsumer = { ...consumer, registration_token: registrationToken };
      setShowRegistrationLink(updatedConsumer);
      await fetchConsumers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error resending link');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk add paste data
  const handleBulkPaste = (e) => {
    setBulkData(e.target.value);
  };

  // Handle CSV upload
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target.result;
      setBulkData(csv);
    };
    reader.readAsText(file);
  };

  // Process and add bulk consumers
  const handleBulkAdd = async () => {
    if (!bulkData.trim()) {
      setError('No data to add');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Parse bulk data - one consumer per line (email | name | country | employeeId)
      const lines = bulkData.split('\n').filter(line => line.trim());
      const newConsumers = lines.map(line => {
        const parts = line.split('|').map(p => p.trim());
        const registrationToken = generateRegistrationToken();
        const tokenExpiry = new Date();
        tokenExpiry.setDate(tokenExpiry.getDate() + 7);

        return {
          id: `con_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          email: parts[0] || '',
          name: parts[1] || parts[0]?.split('@')[0] || '',
          country: parts[2] || 'PA',
          employee_id: parts[3] || '',
          registration_token: registrationToken,
          token_expiry: tokenExpiry.toISOString(),
          registration_status: 'invited',
          status: 'active',
          created_at: new Date().toISOString(),
        };
      }).filter(con => con.email && con.employee_id);

      if (newConsumers.length === 0) {
        throw new Error('No valid entries found. Format: email | name | country | employeeId');
      }

      // Check for duplicates with existing consumers
      const { data: existing } = await supabase
        .from('consumers')
        .select('email')
        .in('email', newConsumers.map(c => c.email));

      if (existing && existing.length > 0) {
        const existingEmails = existing.map(e => e.email).join(', ');
        throw new Error(`These emails already exist: ${existingEmails}`);
      }

      // Insert consumers
      const { error: insertError } = await supabase
        .from('consumers')
        .insert(newConsumers);

      if (insertError) throw insertError;

      setSuccess(`✅ Successfully added ${newConsumers.length} consumers!`);
      setBulkData('');
      setShowBulkAdd(false);
      await fetchConsumers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error adding consumers');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new country
  const handleAddCountry = () => {
    if (!newCountry.trim()) {
      setError('Country code is required');
      return;
    }
    
    if (countries.includes(newCountry.toUpperCase())) {
      setError('Country already exists');
      return;
    }

    setCountries([...countries, newCountry.toUpperCase()]);
    setNewCountry('');
    setSuccess('Country added successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Toggle consumer status (active/inactive)
  const handleToggleStatus = async (consumer) => {
    const newStatus = consumer.status === 'active' ? 'inactive' : 'active';
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('consumers')
        .update({ status: newStatus })
        .eq('id', consumer.id);

      if (updateError) throw updateError;

      setSuccess(`Consumer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      await fetchConsumers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error updating consumer status');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete a consumer
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this consumer?')) {
      return;
    }

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('consumers')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSuccess('Consumer deleted successfully');
      await fetchConsumers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error deleting consumer');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConsumers = getFilteredConsumers();

  return (
    <div className="consumer-manager">
      <h3>👥 Manage Consumers</h3>

      {/* Messages */}
      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      {/* Registration Link Modal */}
      {showRegistrationLink && (
        <div className="registration-link-modal">
          <div className="modal-content">
            <h4>📧 Share Registration Link</h4>
            <p className="modal-subtitle">Send this link to the new consumer to complete registration:</p>
            
            <div className="link-display">
              <input
                type="text"
                value={getRegistrationLink(showRegistrationLink.registration_token)}
                readOnly
                className="registration-link-input"
              />
              <button
                onClick={() => copyToClipboard(getRegistrationLink(showRegistrationLink.registration_token), 'main')}
                className="btn-copy"
              >
                {copiedToken === 'main' ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>

            <p className="link-info">
              <strong>Sent to:</strong> {showRegistrationLink.email}<br/>
              <strong>Expires in:</strong> 7 days<br/>
              <strong>User will:</strong> Set password + Enable Google Authenticator
            </p>

            <button
              onClick={() => setShowRegistrationLink(null)}
              className="btn-close-modal"
            >
              ✓ Done
            </button>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="manager-layout">
        {/* Left Column - Form */}
        <div className="form-column">
          <h4>Add Consumer</h4>

          {/* Toggle Bulk Add */}
          <div className="bulk-add-toggle">
            <button 
              className="btn-toggle-bulk"
              onClick={() => setShowBulkAdd(!showBulkAdd)}
            >
              {showBulkAdd ? '✕ Single Entry' : '➕ Add Multiple'}
            </button>
          </div>

          {/* Bulk Add Section */}
          {showBulkAdd && (
            <div className="bulk-add-section">
              <h5>Add Multiple Consumers</h5>
              <p className="format-hint">Format: email | name | country | employeeId (one per line)</p>
              <textarea
                value={bulkData}
                onChange={handleBulkPaste}
                placeholder="user1@example.com | John Doe | PA | EMP001&#10;user2@example.com | Jane Smith | VE | EMP002"
                rows="6"
                disabled={loading}
              />
              <div className="bulk-actions">
                <button
                  className="btn-upload-csv"
                  disabled={loading}
                >
                  <label htmlFor="csv-upload-con" style={{ cursor: 'pointer', margin: 0 }}>
                    📁 Upload CSV
                  </label>
                  <input
                    id="csv-upload-con"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCSVUpload}
                    style={{ display: 'none' }}
                    disabled={loading}
                  />
                </button>
                <button
                  className="btn-bulk-add"
                  onClick={handleBulkAdd}
                  disabled={loading || !bulkData.trim()}
                >
                  {loading ? '⏳ Adding...' : '✓ Add'}
                </button>
              </div>
            </div>
          )}

          {/* Single Add Form */}
          {!showBulkAdd && (
            <form onSubmit={handleSubmit} className="consumer-form">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Name (Optional)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Country *</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  disabled={loading}
                  required
                >
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Employee ID *</label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                  placeholder="e.g., EMP001"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? '⏳ Adding...' : '✓ Add Consumer'}
                </button>
              </div>
            </form>
          )}

          {/* Add Country Section */}
          <div className="add-country-section">
            <h5>Add New Country</h5>
            <div className="country-input-group">
              <input
                type="text"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value.toUpperCase())}
                placeholder="Country code (e.g., CO, CR)"
                disabled={loading}
                maxLength="2"
              />
              <button
                onClick={handleAddCountry}
                disabled={loading || !newCountry.trim()}
                className="btn-add-country"
              >
                ➕ Add
              </button>
            </div>
            <div className="countries-list">
              {countries.map(country => (
                <span key={country} className="country-badge">{country}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - List */}
        <div className="list-column">
          <h4>Consumers List</h4>

          {/* Filter Section */}
          <div className="filter-section">
            <div className="filter-group">
              <label>Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                disabled={loading}
              >
                <option value="all">📋 All</option>
                <option value="invited">📧 Invited</option>
                <option value="registered">✓ Registered</option>
                <option value="active">🟢 Active</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Search:</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Email, name, or ID..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Consumers List */}
          <div className="consumers-list">
            {filteredConsumers.length === 0 ? (
              <p className="no-consumers">
                {consumers.length === 0 
                  ? 'No consumers yet. Create one to get started!' 
                  : 'No consumers match your filters.'}
              </p>
            ) : (
              <div className="consumers-table">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Country</th>
                      <th>Emp. ID</th>
                      <th>Reg. Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConsumers.map(consumer => (
                      <tr key={consumer.id}>
                        <td>{consumer.email}</td>
                        <td>{consumer.name || '-'}</td>
                        <td>{consumer.country || '-'}</td>
                        <td>{consumer.employee_id || '-'}</td>
                        <td>
                          <span className={`status-badge ${consumer.registration_status}`}>
                            {consumer.registration_status === 'invited' && '📧 Invited'}
                            {consumer.registration_status === 'registered' && '✓ Registered'}
                            {consumer.registration_status === 'active' && '🟢 Active'}
                          </span>
                        </td>
                        <td>
                          <div className="consumer-actions">
                            {consumer.registration_status === 'invited' && (
                              <button
                                className="btn-resend"
                                onClick={() => handleResendLink(consumer)}
                                disabled={loading}
                                title="Resend registration link"
                              >
                                🔗
                              </button>
                            )}
                            <button
                              className={`btn-status ${consumer.status === 'active' ? 'btn-deactivate' : 'btn-activate'}`}
                              onClick={() => handleToggleStatus(consumer)}
                              disabled={loading}
                              title={consumer.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {consumer.status === 'active' ? '🔒' : '🔓'}
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDelete(consumer.id)}
                              disabled={loading}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="list-count">Showing {filteredConsumers.length} of {consumers.length} consumers</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Link Modal */}
      {showRegistrationLink && (
        <div className="registration-link-modal" onClick={() => setShowRegistrationLink(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>✓ Consumer Created Successfully!</h4>
            <p className="modal-subtitle">Share this registration link with {showRegistrationLink.email}:</p>
             
            <div className="link-display">
              <input 
                type="text" 
                className="registration-link-input"
                readOnly
                value={getRegistrationLink(showRegistrationLink.registration_token)}
              />
              <button 
                className="btn-copy"
                onClick={() => copyToClipboard(getRegistrationLink(showRegistrationLink.registration_token), showRegistrationLink.id)}
              >
                {copiedToken === showRegistrationLink.id ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>

            <div className="link-info">
              <strong>🔔 Registration Details:</strong><br/>
              • Email: <strong>{showRegistrationLink.email}</strong><br/>
              • Country: <strong>{showRegistrationLink.country}</strong><br/>
              • Employee ID: <strong>{showRegistrationLink.employee_id}</strong><br/>
              • Link expires in: <strong>7 days</strong><br/>
              • Once registered, user will set up 2FA and their password.
            </div>

            <button 
              className="btn-close-modal"
              onClick={() => setShowRegistrationLink(null)}
            >
              ✓ Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
