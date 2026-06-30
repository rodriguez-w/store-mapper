import React from 'react';
import './RadiusControl.css';

/**
 * RadiusControl Component
 * 
 * This component:
 * 1. Allows users to adjust search radius
 * 2. Supports common preset distances (5m, 50m, 500m, 5km)
 * 3. Shows current radius value
 * 4. Updates map circle in real-time
 */
export default function RadiusControl({ radius, onRadiusChange }) {
  const presets = [
    { label: '5 m', value: 5 },
    { label: '50 m', value: 50 },
    { label: '500 m', value: 500 },
    { label: '5 km', value: 5000 },
  ];

  return (
    <div className="radius-control">
      <h2>Search Radius</h2>
      
      <div className="radius-display">
        <span className="current-value">{radius} m</span>
      </div>

      <input
        type="range"
        min="5"
        max="5000"
        step="5"
        value={radius}
        onChange={(e) => onRadiusChange(Number(e.target.value))}
        className="radius-slider"
      />

      <div className="presets">
        {presets.map(preset => (
          <button
            key={preset.value}
            onClick={() => onRadiusChange(preset.value)}
            className={`preset-btn ${radius === preset.value ? 'active' : ''}`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
