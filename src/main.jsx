import "./config/scopedStorage";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/global.css';
import './themes.css';

function renderApp() {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Synchronous Pre-mount SSO Handler with comprehensive endpoint attempts
(async function handleSSOBeforeMount() {
  const urlParams = new URLSearchParams(window.location.search);
  const ssoToken = urlParams.get('sso_token');

  if (ssoToken) {
    try {
      // Render immediate loading state in DOM before React loads
      const rootEl = document.getElementById("root");
      if (rootEl) {
        rootEl.innerHTML = `
          <div style="display:flex;height:100vh;width:100vw;align-items:center;justify-content:center;background-color:#0f172a;color:#38bdf8;font-family:system-ui,sans-serif;">
            <div style="text-align:center;">
              <div style="width:44px;height:44px;border:4px solid #38bdf8;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px auto;"></div>
              <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
              <h2 style="color:#f8fafc;margin:0 0 8px 0;font-size:20px;">Authenticating via Superadmin SSO...</h2>
              <p style="color:#94a3b8;margin:0;font-size:14px;">Setting up portal session credentials...</p>
            </div>
          </div>
        `;
      }

      // Try candidates both with /auth/sso-login and /api/auth/sso-login
      const envBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://api.beam.safesiteworks.com/development/m3south').replace(/\/$/, '');
      const candidateEndpoints = [
        `${envBaseUrl}/auth/sso-login`,
        `${envBaseUrl}/api/auth/sso-login`,
        'https://api.beam.safesiteworks.com/development/m3south/auth/sso-login',
        'https://api.beam.safesiteworks.com/development/m3south/api/auth/sso-login',
      ];

      if (envBaseUrl.includes('localhost')) {
        candidateEndpoints.push('http://localhost:3001/auth/sso-login');
        candidateEndpoints.push('http://localhost:3001/api/auth/sso-login');
      }

      let success = false;
      let data = null;

      for (const endpoint of candidateEndpoints) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sso_token: ssoToken }),
          });

          if (res.ok) {
            data = await res.json();
            if (data && (data.token || data.access_token)) {
              success = true;
              break;
            }
          }
        } catch (e) {
          console.warn(`SSO endpoint attempt failed for ${endpoint}:`, e.message);
        }
      }

      if (success && data) {
        const validToken = data.token || data.access_token;

        const userObj = {
          id: data.id || 1,
          username: data.username || 'Superadmin',
          role: data.role || 'Admin',
          userType: data.userType || 'Admin',
          name: data.name || data.username || 'Superadmin',
          typeId: data.typeId || 1,
          empId: data.empId || 1,
        };
        const userObjStr = JSON.stringify(userObj);

        // Standard keys (scopedStorage will dynamically prefix with m3south_)
        localStorage.setItem('token', validToken);
        localStorage.setItem('access_token', validToken);
        localStorage.setItem('UserType', data.userType || 'Admin');
        localStorage.setItem('app-theme', 'default-dark');
        localStorage.setItem('loglevel', 'ERROR');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', userObjStr);

        // Superadmin user_info object
        const userInfoObj = data.user_info || {
          adminId: data.id || 1,
          name: data.name || 'Admin',
          email: 'superadmin@gmail.com',
          mobileNumber: '9966996699',
          address: 'Vizag',
          role: 'superadmin',
        };
        localStorage.setItem('user_info', JSON.stringify(userInfoObj));

        // Direct raw keys for absolute scope compatibility
        const setDirect = window.localStorage.setItem.bind(window.localStorage);
        ['m3south_', 'm3_south_'].forEach((p) => {
          setDirect(`${p}token`, validToken);
          setDirect(`${p}access_token`, validToken);
          setDirect(`${p}UserType`, data.userType || 'Admin');
          setDirect(`${p}isLoggedIn`, 'true');
          setDirect(`${p}user`, userObjStr);
        });

        // Clean SSO token from URL and navigate to dashboard
        const currentOrigin = window.location.origin;
        const currentPath = window.location.pathname.replace(/\/$/, '');
        const targetDashboard = currentPath.includes('/dashboard') ? currentPath : `${currentPath}/dashboard`;

        window.location.href = `${currentOrigin}${targetDashboard}`;
        return;
      }
    } catch (err) {
      console.error('Pre-mount SSO Error:', err);
    }
  }

  // Normal app rendering when no sso_token or SSO finished
  renderApp();
})();