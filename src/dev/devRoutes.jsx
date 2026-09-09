import React from 'react';
import { Route } from 'react-router-dom';
import DevGuard from './DevGuard';
import { DevHome, DevPagesIndex, DevPageDetail } from './PagePlayground';

/**
 * Development-only routes (Page Playground).
 *
 * Returns an array of <Route> elements to splice into the main <Routes>
 * tree in App.jsx. Every element is wrapped in <DevGuard>, which renders
 * a 404-style fallback instead of the real content whenever the app is
 * not running in a Vite development build (see DevGuard.jsx for why this
 * cannot be bypassed in production).
 *
 * This file is only ever imported by App.jsx; it does not touch existing
 * routes, auth, or app state in any way.
 */
export function getDevRoutes() {
  return [
    <Route key="dev-home" path="/dev" element={<DevGuard><DevHome /></DevGuard>} />,
    <Route key="dev-pages" path="/dev/pages" element={<DevGuard><DevPagesIndex /></DevGuard>} />,
    <Route
      key="dev-page-detail"
      path="/dev/pages/:pageId"
      element={<DevGuard><DevPageDetail /></DevGuard>}
    />,
  ];
}
