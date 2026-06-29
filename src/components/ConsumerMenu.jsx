import React, { useState } from 'react';
import './ConsumerMenu.css';
import { destroySession } from '../services/authService';

/**
 * ConsumerMenu Component
 * Hamburger menu for consumer app with navigation options
 */
export default function ConsumerMenu({ currentPage, onPageChange, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuClick = (page) => {
    onPageChange(page);
    setIsOpen(false);
  };

  const handleLogout = () => {
    destroySession();
    onLogout();
  };

  return (
    <>
      {/* Hamburger Button */}
      <button className={`menu-toggle ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay */}
      {isOpen && <div className="menu-overlay" onClick={() => setIsOpen(false)}></div>}

      {/* Menu */}
      <nav className={`consumer-menu ${isOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <h3>📍 Store Mapper</h3>
          <button className="menu-close" onClick={() => setIsOpen(false)}>✕</button>
        </div>

        <ul className="menu-items">
          <li>
            <button
              className={`menu-item ${currentPage === 'map' ? 'active' : ''}`}
              onClick={() => handleMenuClick('map')}
            >
              🗺️ Find Stores
            </button>
          </li>
          <li>
            <button
              className={`menu-item ${currentPage === 'request' ? 'active' : ''}`}
              onClick={() => handleMenuClick('request')}
            >
              ➕ Request Store
            </button>
          </li>
        </ul>

        <div className="menu-footer">
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </nav>
    </>
  );
}
