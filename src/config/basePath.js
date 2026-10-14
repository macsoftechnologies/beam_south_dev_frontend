/**
 * The base path this app is served from.
 * Must match the `base` in vite.config.js and the `basename` in BrowserRouter.
 * For local dev this resolves to '' (empty), so routes still work at http://localhost:5173/
 */
export const BASE_PATH = (import.meta.env.BASE_URL || '').replace(/\/$/, '');

/**
 * Normalize an app route by stripping domain and portal base prefixes.
 * Ensures the returned path is a clean relative route (e.g. '/incident-management/details/14').
 */
export const normalizeAppRoute = (rawPath) => {
  if (!rawPath || typeof rawPath !== 'string') return '/modules';
  let path = rawPath.trim();

  // If full URL, extract pathname + search + hash
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const u = new URL(path);
      path = u.pathname + u.search + u.hash;
    } catch (e) {}
  }

  // Strip known portal base prefixes
  const basePrefixes = [
    BASE_PATH,
    '/development/m3south',
    '/m3south',
    '/development/m3north',
    '/m3north',
    '/development/m3infrastructure',
    '/m3infrastructure',
  ].filter(Boolean);

  for (const prefix of basePrefixes) {
    if (prefix && path.startsWith(prefix)) {
      path = path.slice(prefix.length) || '/';
      break;
    }
  }

  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  if (path === '/' || path === '/login' || path === '/otp') {
    return '/modules';
  }

  return path;
};

/**
 * Retrieve post-login redirect path without deleting it.
 * Checks URL query param '?redirect=', then sessionStorage, then localStorage.
 */
export const getPostLoginRedirect = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect');
    if (redirectParam) {
      const normalized = normalizeAppRoute(redirectParam);
      if (normalized && normalized !== '/modules') {
        return normalized;
      }
    }
  } catch (e) {}

  try {
    const saved = sessionStorage.getItem('post_login_redirect') || localStorage.getItem('post_login_redirect');
    if (saved) {
      const normalized = normalizeAppRoute(saved);
      if (normalized && normalized !== '/modules') {
        return normalized;
      }
    }
  } catch (e) {}

  return null;
};

/**
 * Persist post-login redirect path into both sessionStorage and localStorage.
 */
export const setPostLoginRedirect = (url) => {
  if (!url) return;
  const normalized = normalizeAppRoute(url);
  if (!normalized || normalized === '/modules' || normalized === '/login' || normalized === '/otp') return;
  try {
    sessionStorage.setItem('post_login_redirect', normalized);
    localStorage.setItem('post_login_redirect', normalized);
  } catch (e) {}
};

/**
 * Clear saved post-login redirect once navigation is dispatched.
 */
export const clearPostLoginRedirect = () => {
  try {
    sessionStorage.removeItem('post_login_redirect');
    localStorage.removeItem('post_login_redirect');
  } catch (e) {}
};

/**
 * Navigate to an app-internal route by safely prepending the base path.
 * Avoids duplicate base paths.
 */
export const navigateTo = (path, replace = false) => {
  let targetUrl = path || '/';
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    if (BASE_PATH && targetUrl.startsWith(BASE_PATH)) {
      // already contains base path prefix
    } else {
      const cleanPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
      targetUrl = BASE_PATH ? `${BASE_PATH}${cleanPath}` : cleanPath;
    }
  }
  if (replace) {
    window.location.replace(targetUrl);
  } else {
    window.location.href = targetUrl;
  }
};

/**
 * Check whether the current page pathname corresponds to an app route.
 */
export const isOnPath = (path) => {
  const appPath = window.location.pathname.replace(BASE_PATH, '') || '/';
  return appPath === path;
};
