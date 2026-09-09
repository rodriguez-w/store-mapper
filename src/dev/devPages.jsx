import React, { useState } from 'react';
import RadiusControl from '../components/RadiusControl';
import StoreList from '../components/StoreList';
import SimpleMap from '../components/SimpleMap';
import ConsumerLogin from '../components/ConsumerLogin';
import AdminLogin from '../components/AdminLogin';
import StoreRequestForm from '../components/StoreRequestForm';
import ConsumerMenu from '../components/ConsumerMenu';
import AdminPanel from '../components/AdminPanel';
import { MOCK_STORES, MOCK_USER_LOCATION } from './mockData';

/**
 * Preview wrappers for the Page Playground.
 *
 * Each entry reuses the actual production component (no forked/duplicated
 * page logic). Where a page depends on data normally fetched from the API
 * (Supabase), the wrapper feeds it mock data selected by the chosen
 * "state" (normal / loading / empty / error) instead of hitting the network.
 * Pages that manage their own data fetching internally (e.g. ConsumerLogin,
 * AdminLogin, AdminPanel) are rendered as-is since they already handle
 * their own loading/error UI, and no mock data is injected into them.
 */

function stateToStoreListProps(state) {
  switch (state) {
    case 'loading':
      return { stores: [], loading: true, error: null };
    case 'empty':
      return { stores: [], loading: false, error: null };
    case 'error':
      return { stores: [], loading: false, error: 'Failed to load stores (mock error).' };
    case 'normal':
    default:
      return { stores: MOCK_STORES, loading: false, error: null };
  }
}

function StoreListPreview({ state }) {
  const props = stateToStoreListProps(state);
  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <StoreList {...props} onStoresUpdate={() => {}} />
    </div>
  );
}

function SimpleMapPreview({ state }) {
  const stores = state === 'empty' || state === 'loading' ? [] : MOCK_STORES;
  return (
    <div style={{ height: 480 }}>
      <SimpleMap
        center={MOCK_USER_LOCATION}
        zoom={14}
        stores={stores}
        userLocation={MOCK_USER_LOCATION}
        radius={500}
      />
    </div>
  );
}

function RadiusControlPreview() {
  const [radius, setRadius] = useState(500);
  return <RadiusControl radius={radius} onRadiusChange={setRadius} />;
}

function ConsumerMenuPreview() {
  const [page, setPage] = useState('map');
  return (
    <ConsumerMenu currentPage={page} onPageChange={setPage} onLogout={() => {}} />
  );
}

function ConsumerLoginPreview() {
  return <ConsumerLogin onLoginSuccess={() => {}} />;
}

function AdminLoginPreview() {
  return <AdminLogin onLoginSuccess={() => {}} />;
}

function StoreRequestFormPreview() {
  return <StoreRequestForm onNavigate={() => {}} />;
}

/**
 * Registry of pages available in the Page Playground.
 *
 * `supportsStates`: which of the predefined data states (see mockData.js)
 * are meaningful for this page. Pages without data-dependent rendering
 * (e.g. login forms) only support "normal".
 */
export const DEV_PAGES = [
  {
    id: 'store-list',
    label: 'Store List',
    description: 'Consumer-facing nearby store list with status toggle.',
    supportsStates: ['normal', 'loading', 'empty', 'error'],
    render: (state) => <StoreListPreview state={state} />,
  },
  {
    id: 'simple-map',
    label: 'Store Map',
    description: 'Leaflet map showing nearby stores.',
    supportsStates: ['normal', 'loading', 'empty'],
    render: (state) => <SimpleMapPreview state={state} />,
  },
  {
    id: 'radius-control',
    label: 'Radius Control',
    description: 'Search radius slider shown once a location is found.',
    supportsStates: ['normal'],
    render: () => <RadiusControlPreview />,
  },
  {
    id: 'consumer-menu',
    label: 'Consumer Menu',
    description: 'Top navigation for the consumer-facing app.',
    supportsStates: ['normal'],
    render: () => <ConsumerMenuPreview />,
  },
  {
    id: 'consumer-login',
    label: 'Consumer / Employee Login',
    description: 'Employee login page.',
    supportsStates: ['normal'],
    render: () => <ConsumerLoginPreview />,
  },
  {
    id: 'admin-login',
    label: 'Admin Login',
    description: 'Admin login page.',
    supportsStates: ['normal'],
    render: () => <AdminLoginPreview />,
  },
  {
    id: 'store-request-form',
    label: 'Store Request Form',
    description: 'Consumer form to request a new store be added.',
    supportsStates: ['normal'],
    render: () => <StoreRequestFormPreview />,
  },
  {
    id: 'admin-panel',
    label: 'Admin Panel',
    description:
      'Admin dashboard. Still requires the real admin password prompt built into the component.',
    supportsStates: ['normal'],
    render: () => <AdminPanel />,
  },
];

export function getDevPage(id) {
  return DEV_PAGES.find((p) => p.id === id);
}
