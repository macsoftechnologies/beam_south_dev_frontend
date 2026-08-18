import React, { useEffect, useState } from 'react';

export function SSOHandler({ children }) {
  const initialSsoToken = new URLSearchParams(window.location.search).get('sso_token');
  const [verifying, setVerifying] = useState(Boolean(initialSsoToken));

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ssoToken = urlParams.get('sso_token');

    if (!ssoToken) {
      setVerifying(false);
      return;
    }

    const performSsoLogin = async () => {
      const baseApiUrl = (import.meta.env.VITE_API_BASE_URL || 'https://api.beam.safesiteworks.com/development/m3south').replace(/\/$/, '');
      const endpoints = [
        `${baseApiUrl}/auth/sso-login`,
        `${baseApiUrl}/api/auth/sso-login`,
        'https://api.beam.safesiteworks.com/development/m3south/auth/sso-login',
        'https://api.beam.safesiteworks.com/development/m3south/api/auth/sso-login',
      ];

      if (baseApiUrl.includes('localhost')) {
        endpoints.push('http://localhost:3001/auth/sso-login');
        endpoints.push('http://localhost:3001/api/auth/sso-login');
      }

      let success = false;
      let data = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sso_token: ssoToken }),
          });

          if (response.ok) {
            data = await response.json();
            if (data && (data.token || data.access_token)) {
              success = true;
              break;
            }
          }
        } catch (err) {
          console.warn(`SSO attempt failed for ${endpoint}:`, err.message);
        }
      }

      if (success && data) {
        const validToken = data.token || data.access_token;
        const userData = {
          id: data.id || (data.user_info && data.user_info.adminId) || 1,
          username: data.username || (data.user_info && data.user_info.name) || 'superadmin',
          userType: 'SuperAdmin',
          role: 'SuperAdmin',
          empId: data.empId || 1,
        };
        const userDataStr = JSON.stringify(userData);

        // Standard keys (scopedStorage will dynamically attach m3south_ prefix)
        localStorage.setItem('token', validToken);
        localStorage.setItem('access_token', validToken);
        localStorage.setItem('UserType', 'SuperAdmin');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', userDataStr);

        // Explicit raw keys for complete scope compatibility
        const setDirect = window.localStorage.setItem.bind(window.localStorage);
        ['m3south_', 'm3_south_'].forEach((p) => {
          setDirect(`${p}token`, validToken);
          setDirect(`${p}access_token`, validToken);
          setDirect(`${p}UserType`, 'SuperAdmin');
          setDirect(`${p}isLoggedIn`, 'true');
          setDirect(`${p}user`, userDataStr);
        });

        // Clean SSO token from URL query string
        const urlWithoutToken = new URL(window.location.href);
        urlWithoutToken.searchParams.delete('sso_token');
        window.history.replaceState({}, document.title, urlWithoutToken.pathname + urlWithoutToken.search);

        // Allow render of children now that localStorage is populated
        setVerifying(false);
      } else {
        console.error('SSO Authentication could not be completed with available backends.');
        setVerifying(false);
      }
    };

    performSsoLogin();
  }, []);

  if (verifying) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        color: '#38bdf8',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '44px',
            height: '44px',
            border: '4px solid #38bdf8',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#f8fafc' }}>Authenticating via Superadmin SSO...</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Verifying security credentials & populating session.</p>
        </div>
      </div>
    );
  }

  return children;
}
