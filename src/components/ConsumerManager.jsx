import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './ConsumerManager.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * ConsumerManager Component
 * Admin section for managing consumer users with activate/deactivate
 */
export default function ConsumerManager() {
  const [consumers, setConsumers] = useState([]);
  const [formData, setFormData] = useState({ email: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bulkData, setBulkData] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

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

      // Check if email already exists
      const { data: existing } = await supabase
        .from('consumers')
        .select('id')
        .eq('email', formData.email.trim())
        .single();

      if (existing) {
        throw new Error('This email already exists');
      }

      // Create new consumer
      const { error: insertError } = await supabase
        .from('consumers')
        .insert([
          {
            id: `con_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            email: formData.email.trim(),
            name: formData.name.trim() || formData.email.trim().split('@')[0],
            status: 'active',
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;
      setSuccess('Consumer added successfully');

      // Reset form
      setFormData({ email: '', name: '' });

      // Refresh consumers
      await fetchConsumers();

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error adding consumer');
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
      // Parse bulk data - one consumer per line (email | name)
      const lines = bulkData.split('\n').filter(line => line.trim());
      const newConsumers = lines.map(line => {
        const parts = line.split('|').map(p => p.trim());
        return {
          id: `con_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          email: parts[0] || '',
          name: parts[1] || parts[0]?.split('@')[0] || '',
          status: 'active',
          created_at: new Date().toISOString(),
        };
      }).filter(con => con.email); // Only include if email is not empty

      if (newConsumers.length === 0) {
        throw new Error('No valid emails found. Format: email | name');
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

  return (
    <div className="consumer-manager">
      <h3>👥 Manage Consumers</h3>

      {/* Toggle Bulk Add */}
      <div className="bulk-add-toggle">
        <button 
          className="btn-toggle-bulk"
          onClick={() => setShowBulkAdd(!showBulkAdd)}
        >
          {showBulkAdd ? '✕ Cancel Bulk Add' : '➕ Add Multiple Consumers'}
        </button>
      </div>

      {/* Bulk Add Section */}
      {showBulkAdd && (
        <div className="bulk-add-section">
          <h4>Add Multiple Consumers</h4>
          <p className="format-hint">Format: email | name (one per line)</p>
          <textarea
            value={bulkData}
            onChange={handleBulkPaste}
            placeholder="user1@example.com | John Doe&#10;user2@example.com | Jane Smith&#10;user3@example.com | Bob Johnson"
            rows="6"
            disabled={loading}
          />
          <div className="bulk-actions">
            <button
              className="btn-upload-csv"
              disabled={loading}
            >
              <label htmlFor="csv-upload-con" style={{ cursor: 'pointer', margin: 0 }}>
                📁 Or upload CSV
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
              {loading ? '⏳ Adding...' : '✓ Add Consumers'}
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="consumer-form">
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="e.g., user@example.com"
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

        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}

        <div className="form-actions">
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? '⏳ Adding...' : '✓ Add Consumer'}
          </button>
        </div>
      </form>

      {/* Consumers List */}
      <div className="consumers-list">
        <h4>Consumers ({consumers.length})</h4>
        {consumers.length === 0 ? (
          <p className="no-consumers">No consumers yet. Create one to get started!</p>
        ) : (
          <div className="consumers-table">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {consumers.map(consumer => (
                  <tr key={consumer.id}>
                    <td>{consumer.email}</td>
                    <td>{consumer.name || '-'}</td>
                    <td>
                      <span className={`status-badge ${consumer.status}`}>
                        {consumer.status === 'active' ? '✓ Active' : '✕ Inactive'}
                      </span>
                    </td>
                    <td>{new Date(consumer.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="consumer-actions">
                        <button
                          className={`btn-status ${consumer.status === 'active' ? 'btn-deactivate' : 'btn-activate'}`}
                          onClick={() => handleToggleStatus(consumer)}
                          disabled={loading}
                        >
                          {consumer.status === 'active' ? '🔒 Deactivate' : '🔓 Activate'}
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(consumer.id)}
                          disabled={loading}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
