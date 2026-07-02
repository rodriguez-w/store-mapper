import React, { useState } from 'react';
import './ConsumerMenu.css';
import { destroySession } from '../services/authService';

/**
 * ConsumerMenu Component
 * Navigation ribbon with expandable menu
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
      {/* Navigation Ribbon - Always visible */}
      <div className="nav-ribbon">
        {/* Menu Toggle Button inside ribbon */}
        <button 
          className={`ribbon-toggle ${isOpen ? 'open' : ''}`} 
          onClick={() => setIsOpen(!isOpen)} 
          title="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Expandable Menu Panel */}
      <nav className={`ribbon-menu ${isOpen ? 'open' : ''}`}>
        <ul className="menu-items">
          <li>
            <button
              className={`menu-item ${currentPage === 'map' ? 'active' : ''}`}
              onClick={() => handleMenuClick('map')}
            >
              <span className="menu-icon">📍</span>
              <span className="menu-label">Find Stores</span>
            </button>
          </li>
          <li>
            <button
              className={`menu-item ${currentPage === 'request' ? 'active' : ''}`}
              onClick={() => handleMenuClick('request')}
            >
              <span className="menu-icon">⊕</span>
              <span className="menu-label">Request Store</span>
            </button>
          </li>
        </ul>

        <div className="menu-footer">
          <button className="logout-btn" onClick={handleLogout}>
            ↪ Logout
          </button>
        </div>
      </nav>

      {/* Overlay - closes menu when clicked */}
      {isOpen && <div className="menu-overlay" onClick={() => setIsOpen(false)}></div>}
    </>
  );
}
