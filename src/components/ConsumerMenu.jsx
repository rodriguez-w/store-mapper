import React, { useState } from 'react';
import './ConsumerMenu.css';
import { destroySession } from '../services/authService';

/**
 * ConsumerMenu Component
 * Professional navigation menu with fixed sidebar layout
 */
export default function ConsumerMenu({ currentPage, onPageChange, isMenuOpen, onMenuToggle, onLogout }) {
  const handleMenuClick = (page) => {
    onPageChange(page);
    onMenuToggle(false);
  };

  const handleLogout = () => {
    destroySession();
    onLogout();
  };

  return (
    <>
      {/* Overlay */}
      {isMenuOpen && <div className="menu-overlay" onClick={() => onMenuToggle(false)}></div>}

      {/* Slide-out Menu Panel */}
      <nav className={`consumer-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <h3>Store Mapper</h3>
          <button className="menu-close" onClick={() => onMenuToggle(false)} title="Close">×</button>
        </div>

        <ul className="menu-items">
          <li>
            <button
              className={`menu-item ${currentPage === 'map' ? 'active' : ''}`}
              onClick={() => handleMenuClick('map')}
            >
              <span className="menu-icon">📍</span>
              <span>Find Stores</span>
            </button>
          </li>
          <li>
            <button
              className={`menu-item ${currentPage === 'request' ? 'active' : ''}`}
              onClick={() => handleMenuClick('request')}
            >
              <span className="menu-icon">⊕</span>
              <span>Request Store</span>
            </button>
          </li>
        </ul>

        <div className="menu-footer">
          <button className="logout-btn" onClick={handleLogout}>
            ↪ Logout
          </button>
        </div>
      </nav>
    </>
  );
}
