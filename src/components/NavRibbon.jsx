import React from 'react';
import './NavRibbon.css';

/**
 * NavRibbon Component
 * Permanent left sidebar ribbon with menu button and navigation icons
 * Hides when menu is open to let menu expand
 */
export default function NavRibbon({ isMenuOpen, onMenuToggle, currentPage, onPageChange }) {
  const handlePageClick = (page) => {
    onPageChange(page);
    onMenuToggle(false);
  };

  return (
    <div className={`nav-ribbon ${isMenuOpen ? 'hidden' : ''}`}>
      {/* Menu Button */}
      <button
        className={`ribbon-menu-button ${isMenuOpen ? 'open' : ''}`}
        onClick={() => onMenuToggle(!isMenuOpen)}
        title="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Navigation Items */}
      <div className="ribbon-nav-items">
        <button
          className={`ribbon-item ${currentPage === 'map' ? 'active' : ''}`}
          onClick={() => handlePageClick('map')}
          title="Find Stores"
          aria-label="Find Stores"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </button>

        <button
          className={`ribbon-item ${currentPage === 'request' ? 'active' : ''}`}
          onClick={() => handlePageClick('request')}
          title="Request Store"
          aria-label="Request Store"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
