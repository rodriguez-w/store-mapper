import React, { useState } from 'react';
import './ConsumerMenu.css';
import { destroySession } from '../services/authService';

/**
 * ConsumerMenu Component
 * Professional navigation menu with fixed sidebar layout
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
      {/* Hamburger Button - Top Left */}
      <button className={`menu-toggle ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)} title="Menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay */}
      {isOpen && <div className="menu-overlay" onClick={() => setIsOpen(false)}></div>}

      {/* Slide-out Menu Panel */}
      <nav className={`consumer-menu ${isOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <h3>Store Mapper</h3>
          <button className="menu-close" onClick={() => setIsOpen(false)} title="Close">×</button>
        </div>

        <ul className="menu-items">
          <li>
            <button
              className={`menu-item ${currentPage === 'map' ? 'active' : ''}`}
              onClick={() => handleMenuClick('map')}
            >
              <span className="menu-icon">◆</span>
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
