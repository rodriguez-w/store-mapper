import React, { useState } from 'react';
import StoreCategoryManager from './StoreCategoryManager';
import StoreRequestsReview from './StoreRequestsReview';
import './StoreReviewSection.css';

/**
 * StoreReviewSection Component
 * Admin section combining category management and store request reviews
 */
export default function StoreReviewSection() {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div className="store-review-section">
      <h2>📋 Store Review Management</h2>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          📁 Manage Categories
        </button>
        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📥 Review Requests
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'categories' && (
          <StoreCategoryManager />
        )}
        {activeTab === 'requests' && (
          <StoreRequestsReview />
        )}
      </div>
    </div>
  );
}
