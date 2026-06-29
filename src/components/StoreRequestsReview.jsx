import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import L from 'leaflet';
import './StoreRequestsReview.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * StoreRequestsReview Component
 * Admin section for reviewing store requests with map preview
 */
export default function StoreRequestsReview() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const mapsRef = useRef({});

  // Fetch requests on mount
  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const query = supabase
        .from('store_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Filter by status
      const filtered = filterStatus === 'all' 
        ? data 
        : data.filter(r => r.status === filterStatus);

      setRequests(filtered || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load store requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRequest = async (request) => {
    setSelectedRequest(request);
    setNotes(request.notes || '');

    // Initialize map in next frame to ensure DOM is ready
    setTimeout(() => {
      initializeMap(request);
    }, 100);
  };

  const initializeMap = (request) => {
    const mapId = `map_${request.id}`;
    const container = document.getElementById(mapId);

    if (!container) return;

    // Remove existing map if it exists
    if (mapsRef.current[mapId]) {
      mapsRef.current[mapId].remove();
    }

    // Create new map
    const map = L.map(mapId).setView(
      [request.latitude, request.longitude],
      16
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add marker for the store location
    L.circleMarker([request.latitude, request.longitude], {
      radius: 15,
      fillColor: '#667eea',
      color: '#667eea',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    })
      .addTo(map)
      .bindPopup(`
        <div class="popup-content">
          <p><strong>${request.store_name}</strong></p>
          <p>${request.store_category}</p>
          <p><small>${request.latitude.toFixed(6)}, ${request.longitude.toFixed(6)}</small></p>
        </div>
      `)
      .openPopup();

    mapsRef.current[mapId] = map;
  };

  const handleMarkAsDone = async (request) => {
    if (!window.confirm('Mark this store request as done?')) return;

    setLoading(true);
    try {
      const session = JSON.parse(sessionStorage.getItem('store_mapper_session') || '{}');
      const adminId = session.employeeId;

      const { error: updateError } = await supabase
        .from('store_requests')
        .update({
          status: 'completed',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          notes: notes,
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      setSuccess('Store request marked as completed');
      setSelectedRequest(null);
      setNotes('');
      await fetchRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error updating request');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (request) => {
    if (!window.confirm('Reject this store request?')) return;

    setLoading(true);
    try {
      const session = JSON.parse(sessionStorage.getItem('store_mapper_session') || '{}');
      const adminId = session.employeeId;

      const { error: updateError } = await supabase
        .from('store_requests')
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          notes: notes,
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      setSuccess('Store request rejected');
      setSelectedRequest(null);
      setNotes('');
      await fetchRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error rejecting request');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="store-requests-review">
      <h3>🔍 Store Requests Review</h3>

      {/* Filter */}
      <div className="filter-section">
        <label>Filter by Status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          disabled={loading}
        >
          <option value="pending">⏳ Pending</option>
          <option value="completed">✓ Completed</option>
          <option value="rejected">✕ Rejected</option>
          <option value="all">📋 All</option>
        </select>
      </div>

      {/* Messages */}
      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <div className="requests-content">
        {/* Requests List */}
        <div className="requests-list">
          <h4>Requests ({requests.length})</h4>
          {loading && <p className="loading">Loading requests...</p>}
          {!loading && requests.length === 0 && (
            <p className="no-requests">No {filterStatus} requests</p>
          )}
          {!loading && requests.length > 0 && (
            <ul>
              {requests.map(request => (
                <li
                  key={request.id}
                  className={`request-item ${selectedRequest?.id === request.id ? 'selected' : ''} ${request.status}`}
                  onClick={() => handleSelectRequest(request)}
                >
                  <div className="request-header">
                    <h5>{request.store_name}</h5>
                    <span className={`status-badge ${request.status}`}>
                      {request.status === 'pending' && '⏳ Pending'}
                      {request.status === 'completed' && '✓ Done'}
                      {request.status === 'rejected' && '✕ Rejected'}
                    </span>
                  </div>
                  <p className="request-category">📍 {request.store_category}</p>
                  <p className="request-date">
                    {formatDate(request.requested_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Request Details */}
        {selectedRequest && (
          <div className="request-details">
            <h4>Request Details</h4>

            {/* Map */}
            <div className="map-container">
              <div id={`map_${selectedRequest.id}`} className="mini-map"></div>
            </div>

            {/* Store Info */}
            <div className="info-section">
              <div className="info-row">
                <label>Store Name:</label>
                <span>{selectedRequest.store_name}</span>
              </div>
              <div className="info-row">
                <label>Category:</label>
                <span>{selectedRequest.store_category}</span>
              </div>
              <div className="info-row">
                <label>Coordinates:</label>
                <span>{selectedRequest.latitude.toFixed(6)}, {selectedRequest.longitude.toFixed(6)}</span>
              </div>
              <div className="info-row">
                <label>Requested By:</label>
                <span>{selectedRequest.requested_by}</span>
              </div>
              <div className="info-row">
                <label>Requested At:</label>
                <span>{formatDate(selectedRequest.requested_at)}</span>
              </div>
              {selectedRequest.image_url && (
                <div className="image-section">
                  <label>Store Photo:</label>
                  <img src={selectedRequest.image_url} alt="Store" className="store-image" />
                </div>
              )}
            </div>

            {/* Status-specific actions */}
            {selectedRequest.status === 'pending' && (
              <>
                <div className="notes-section">
                  <label>Notes (Optional):</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this request..."
                    disabled={loading}
                  ></textarea>
                </div>

                <div className="action-buttons">
                  <button
                    className="btn-done"
                    onClick={() => handleMarkAsDone(selectedRequest)}
                    disabled={loading}
                  >
                    {loading ? '⏳ Saving...' : '✓ Mark as Done'}
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleRejectRequest(selectedRequest)}
                    disabled={loading}
                  >
                    {loading ? '⏳ Saving...' : '✕ Reject'}
                  </button>
                </div>
              </>
            )}

            {selectedRequest.status !== 'pending' && (
              <div className="status-info">
                <p>
                  <strong>Status:</strong> {selectedRequest.status === 'completed' ? '✓ Completed' : '✕ Rejected'}
                </p>
                {selectedRequest.reviewed_by && (
                  <p>
                    <strong>Reviewed By:</strong> {selectedRequest.reviewed_by}
                  </p>
                )}
                {selectedRequest.reviewed_at && (
                  <p>
                    <strong>Reviewed At:</strong> {formatDate(selectedRequest.reviewed_at)}
                  </p>
                )}
                {selectedRequest.notes && (
                  <p>
                    <strong>Notes:</strong> {selectedRequest.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
