import React from 'react';

/**
 * DevGuard
 *
 * Hard gate used to wrap every development-only route element.
 *
 * Why this is not a security backdoor:
 * - `import.meta.env.DEV` is Vite's own build-time flag. It is statically
 *   inlined as `false` by Vite during `vite build` (production builds),
 *   which means the `if (!isDev)` branch below is the ONLY branch that
 *   can ever execute in a production bundle - the dev branch, along with
 *   everything it renders, is dead code that bundlers can (and typically
 *   do) strip entirely.
 * - There is no runtime toggle, query string, header, or cookie that can
 *   flip this flag on in a deployed/production build. It is not read from
 *   `window.location`, localStorage, or any user-controlled input.
 * - This guard never changes authentication or authorization state; it
 *   only decides whether a route renders its (already-authenticated-in-
 *   dev-only-sense) preview content or a 404-style fallback.
 * - Pages rendered under this guard reuse the real, existing components -
 *   they do not duplicate or fork production logic.
 */
export const isDevEnvironment = import.meta.env.DEV === true;

export default function DevGuard({ children }) {
  if (!isDevEnvironment) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>404 - Not Found</h1>
        <p>This route only exists in development builds.</p>
      </div>
    );
  }

  return children;
}
