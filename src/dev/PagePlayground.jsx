import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { DEV_PAGES, getDevPage } from './devPages';
import { DATA_STATES } from './mockData';

const wrapperStyle = {
  fontFamily: 'sans-serif',
  minHeight: '100vh',
  background: '#f2f2f2',
};

const barStyle = {
  background: '#091140',
  color: 'white',
  padding: '0.75rem 1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  flexWrap: 'wrap',
};

const badgeStyle = {
  background: '#EF4444',
  color: 'white',
  fontSize: '0.7rem',
  fontWeight: 700,
  padding: '0.15rem 0.5rem',
  borderRadius: 4,
  letterSpacing: '0.05em',
};

function DevBar({ children }) {
  return (
    <div style={barStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={badgeStyle}>DEV ONLY</span>
        <Link to="/dev" style={{ color: 'white', textDecoration: 'none', fontWeight: 600 }}>
          Page Playground
        </Link>
      </div>
      {children}
    </div>
  );
}

/**
 * /dev - landing page for the development playground.
 */
export function DevHome() {
  return (
    <div style={wrapperStyle}>
      <DevBar />
      <div style={{ padding: '1.5rem' }}>
        <h1>Page Playground</h1>
        <p>Inspect application pages directly, without going through login or navigation.</p>
        <ul>
          <li>
            <Link to="/dev/pages">/dev/pages</Link> - browse and preview individual pages/components
          </li>
        </ul>
        <p style={{ color: '#666', fontSize: '0.85rem' }}>
          This area only exists in development builds (<code>import.meta.env.DEV</code>) and is
          stripped from production bundles.
        </p>
      </div>
    </div>
  );
}

/**
 * /dev/pages - list of previewable pages.
 */
export function DevPagesIndex() {
  return (
    <div style={wrapperStyle}>
      <DevBar />
      <div style={{ padding: '1.5rem' }}>
        <h1>Pages</h1>
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 640 }}>
          {DEV_PAGES.map((page) => (
            <Link
              key={page.id}
              to={`/dev/pages/${page.id}`}
              style={{
                display: 'block',
                background: 'white',
                border: '1px solid #E0E0E0',
                borderRadius: 8,
                padding: '1rem',
                textDecoration: 'none',
                color: '#091140',
              }}
            >
              <strong>{page.label}</strong>
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                {page.description}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * /dev/pages/:pageId - preview a single page with a selectable data state.
 */
export function DevPageDetail() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const page = getDevPage(pageId);
  const [state, setState] = useState(page?.supportsStates?.[0] || 'normal');

  if (!page) {
    return (
      <div style={wrapperStyle}>
        <DevBar />
        <div style={{ padding: '1.5rem' }}>
          <p>Unknown dev page: {pageId}</p>
          <Link to="/dev/pages">Back to page list</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <DevBar>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => navigate('/dev/pages')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.4)',
              color: 'white',
              borderRadius: 4,
              padding: '0.25rem 0.6rem',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        </div>
      </DevBar>

      <div style={{ padding: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>{page.label}</h1>
        <p style={{ color: '#666', marginTop: 0 }}>{page.description}</p>

        {page.supportsStates.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', flexWrap: 'wrap' }}>
            {page.supportsStates.map((key) => (
              <button
                key={key}
                onClick={() => setState(key)}
                title={DATA_STATES[key]?.description}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 999,
                  border: state === key ? '2px solid #173BA6' : '1px solid #E0E0E0',
                  background: state === key ? '#173BA6' : 'white',
                  color: state === key ? 'white' : '#091140',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {DATA_STATES[key]?.label || key}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            background: 'white',
            border: '1px solid #E0E0E0',
            borderRadius: 8,
            padding: '1.5rem',
          }}
        >
          {page.render(state)}
        </div>
      </div>
    </div>
  );
}
