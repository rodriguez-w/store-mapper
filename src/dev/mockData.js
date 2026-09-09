/**
 * Mock data fixtures for the development Page Playground.
 *
 * These are only ever imported from files under src/dev/, which are
 * themselves excluded from the app when running in production
 * (see src/dev/DevGuard.jsx). Nothing here is reachable from
 * production code paths.
 */

export const MOCK_USER_LOCATION = {
  latitude: 8.9824,
  longitude: -79.5199,
};

export const MOCK_STORES = [
  {
    id: 'mock-1',
    name: 'SELA - Panama Este',
    site_group: 'Grupo A',
    segmento: 'Segmento Premium',
    address: 'Av. Balboa, Calle 50, Edificio Torre Global, Piso 3, Panama City',
    phone: '+507 123-4567',
    latitude: 8.9824,
    longitude: -79.5199,
    status: 'open',
  },
  {
    id: 'mock-2',
    name: 'SELA - Store 2',
    site_group: 'Grupo B',
    segmento: 'Segmento Estandar',
    address: 'Calle Corta, Panama',
    phone: '+507 987-6543',
    latitude: 8.99,
    longitude: -79.53,
    status: 'closed',
  },
  {
    id: 'mock-3',
    name: 'SELA - Costa del Este',
    site_group: 'Grupo A',
    segmento: 'Segmento Premium',
    address: 'Costa del Este, Panama',
    phone: '+507 555-0100',
    latitude: 9.0,
    longitude: -79.49,
    status: 'open',
  },
];

/**
 * Predefined data states usable by dev page previews.
 * Each preview page decides which of these keys it supports.
 */
export const DATA_STATES = {
  normal: {
    key: 'normal',
    label: 'Normal',
    description: 'Populated data, no loading or error.',
  },
  loading: {
    key: 'loading',
    label: 'Loading',
    description: 'Simulates the loading state before data arrives.',
  },
  empty: {
    key: 'empty',
    label: 'Empty data',
    description: 'Simulates a successful response with zero results.',
  },
  error: {
    key: 'error',
    label: 'Error',
    description: 'Simulates a failed data fetch.',
  },
};

export const DATA_STATE_KEYS = Object.keys(DATA_STATES);
