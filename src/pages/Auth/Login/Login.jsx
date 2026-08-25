import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { login } from "../../../services/authService";
import { showSuccess, showError } from "../../../components/common/Toast/Toast";
import { navigateTo } from "../../../config/basePath";
import { isTokenValid } from "../../../components/common/PublicRoute";
import "./Login.css";

export default function Login() {
  if (isTokenValid()) {
    return <Navigate to="/modules" replace />;
  }

  useEffect(() => {
    const handleCheck = () => {
      if (isTokenValid()) {
        navigateTo("/modules", true);
      }
    };

    if (isTokenValid()) {
      navigateTo("/modules", true);
    }

    window.addEventListener("pageshow", handleCheck);
    window.addEventListener("popstate", handleCheck);

    return () => {
      window.removeEventListener("pageshow", handleCheck);
      window.removeEventListener("popstate", handleCheck);
    };
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please fill in all fields.");
      showError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await login({ username, password });

      if (response && (response.statusCode === 200 || response.status === true)) {
        // Save tempUser details in localStorage
        const tempUser = {
          user_id: response.id,
          username: response.username,
          userType: response.userType,
          phonenumber: response.phonenumber,
          maskedPhone: response.maskedPhone || "",
          auth_token: response.auth_token
        };
        localStorage.setItem("tempUser", JSON.stringify(tempUser));

        showSuccess("Login successful. OTP sent.");

        setTimeout(() => {
          setLoading(false);
          navigateTo("/otp", true);
        }, 1500);
      } else {
        setLoading(false);
        const errMsg = response?.message || "Invalid credentials";
        setError(errMsg);
        showError(errMsg);
      }
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || err.message || "An error occurred during login";
      setError(errMsg);
      showError(errMsg);
    }
  };

  const navigate = (url) => {
    navigateTo(url);
  };

  return (
    <>
      {/* Animated Background */}
      <div className="bg-scene">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="grid-overlay"></div>
        <div className="noise-overlay"></div>
      </div>

      {/* Back Link */}
      <Link to="/" className="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to portal selection
      </Link>

      <main>
        <div className="login-container">

          {/* LEFT PANEL */}
          <div className="panel-left">
            <div className="panel-glow"></div>
            <div className="panel-glow-2"></div>
            <div className="panel-compass">S</div>

            <div className="panel-top">
              <div className="ssw-login-brand">
                  <img
                    src="/beam-assets/safesite-cap-only.png?v=300"
                    alt=""
                    aria-hidden="true"
                    className="ssw-login-cap"
                  />
                  <div className="ssw-login-wordmark">
                    <span className="ssw-safe">SafeSite</span>
                    <span className="ssw-works">Works</span>
                  </div>
                </div>
                <div className="beam20-login-badge">BEAM 2.0</div>

                <div className="panel-badge">
                <span className="dot"></span>Division 02
              </div>
              <h2 className="panel-title">
                M3 <span>South</span>
                <br />Operations
              </h2>
              <p className="panel-desc">
                Your secure gateway to the M3 South operations platform — permit management, field coordination and real-time reporting.
              </p>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="panel-right">
            <div className="form-eyebrow">Secure Access</div>
            <h1 className="form-heading">
                  Welcome to
                  <br />
                  <span className="ssw-heading-safe">SafeSite</span>
                  <span className="ssw-heading-works">Works</span>
            </h1>
            <p className="form-subtext">Sign in to your M3 South account to continue</p>

            {error && (
              <div className="error-box show">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form id="loginForm" onSubmit={handleSubmit} noValidate>
              <div className="field-group">
                <label className="field-label" htmlFor="username">
                  Username
                </label>
                <div className="field-wrap">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    id="username"
                    className="form-input"
                    placeholder="Enter your username"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="password">
                  Password
                </label>
                <div className="field-wrap">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="form-input"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{ paddingRight: "46px" }}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Show/hide password"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-meta" style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => navigateTo("/forgot-password")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit", color: "#818cf8", fontSize: "13px" }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className={`login-btn${loading ? " loading" : ""}`}
                id="loginBtn"
                disabled={loading}
              >
                {loading ? (
                  <div className="btn-loader"></div>
                ) : (
                  <>
                    <span className="btn-text">Sign In to Portal</span>
                    <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}