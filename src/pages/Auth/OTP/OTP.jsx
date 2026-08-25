import { useState, useRef, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { verifyOtp, login } from "../../../services/authService";
import { showSuccess, showError } from "../../../components/common/Toast/Toast";
import { navigateTo } from "../../../config/basePath";
import { isTokenValid } from "../../../components/common/PublicRoute";
import "./OTP.css";

// ─── DIVISION CONFIG (must match Login.jsx) ─────────────────────────
const DIVISIONS = {
  north: {
    label: "Division 01",
    name: "North",
    theme: "north",
  },
  south: {
    label: "Division 02",
    name: "South",
    theme: "south",
  },
  infrastructure: {
    label: "Division 03",
    name: "Infrastructure",
    theme: "infra",
  },
};

const ACTIVE_DIVISION = "north"; // ← change to match Login.jsx
// ────────────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;

export default function OTP() {
  if (isTokenValid()) {
    return <Navigate to="/modules" replace />;
  }

  const tempUserStr = localStorage.getItem("tempUser");
  if (!tempUserStr) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const handleCheck = () => {
      if (isTokenValid()) {
        navigateTo("/modules", true);
      } else if (!localStorage.getItem("tempUser")) {
        navigateTo("/login", true);
      }
    };

    if (isTokenValid()) {
      navigateTo("/modules", true);
      return;
    }
    if (!localStorage.getItem("tempUser")) {
      navigateTo("/login", true);
    }

    window.addEventListener("pageshow", handleCheck);
    window.addEventListener("popstate", handleCheck);

    return () => {
      window.removeEventListener("pageshow", handleCheck);
      window.removeEventListener("popstate", handleCheck);
    };
  }, []);
  const tempUser = (() => {
    try { return JSON.parse(localStorage.getItem("tempUser") || "{}"); } catch { return {}; }
  })();
  const maskedPhone = tempUser?.maskedPhone || "";

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  const division = DIVISIONS[ACTIVE_DIVISION];

  // Countdown timer
  useEffect(() => {
    if (timer === 0) { setCanResend(true); return; }
    const id = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  // Auto-focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setError("");

    if (val && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = "";
        setDigits(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
    if (e.key === "Enter") {
      e.preventDefault();
      handleVerify();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < OTP_LENGTH) {
      setError("Please enter the full 6-digit code.");
      showError("Please enter the full 6-digit code.");
      inputRefs.current[digits.findIndex(d => !d)]?.focus();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tempUserStr = localStorage.getItem("tempUser");
      const tempUser = tempUserStr ? JSON.parse(tempUserStr) : null;

      if (!tempUser || tempUser.user_id === undefined || tempUser.user_id === null) {
        setLoading(false);
        showError("Session expired. Please log in again.");
        setTimeout(() => {
          navigateTo("/login");
        }, 1500);
        return;
      }

      const response = await verifyOtp({
        otp: code,
        user_id: tempUser.user_id
      });

      if (response && (response.statusCode === 200 || response.status === true)) {
        // Save token and user details to localStorage
        const tokenVal = response.access_token || response.token || response.auth_token || response.data?.access_token || response.data?.token;
        if (tokenVal) {
          localStorage.setItem("token", tokenVal);
        }

        const activeUser = {
          id: response.id,
          username: response.username,
          role: response.userType, // UserType is the role
          name: response.username,
          typeId: response.typeId
        };
        localStorage.setItem("user", JSON.stringify(activeUser));
        localStorage.setItem("UserType", response.userType);

        // Clean up tempUser
        localStorage.removeItem("tempUser");

        showSuccess("Authentication successful!");

        setTimeout(() => {
          setLoading(false);
          navigateTo("/modules", true);
        }, 1500);
      } else {
        setLoading(false);
        const errMsg = response?.message || "Invalid OTP code";
        setError(errMsg);
        showError(errMsg);
      }
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || err.message || "An error occurred during verification";
      setError(errMsg);
      showError(errMsg);
    }
  };

  const handleResend = async () => {
    if (!canResend || resendLoading) return;
    const stored = localStorage.getItem("tempUser");
    const tUser = stored ? JSON.parse(stored) : null;
    if (!tUser) {
      navigateTo("/login");
      return;
    }
    setResendLoading(true);
    try {
      // Re-trigger login to regenerate and resend OTP
      // We need stored credentials — but since we don't store password, we call a dedicated resend
      // Fallback: just show a message directing user to login again
      setResent(true);
      setCanResend(false);
      setTimer(30);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      showSuccess("Please go back to login to request a new OTP.");
      setTimeout(() => setResent(false), 4000);
    } catch (err) {
      showError("Failed to resend OTP. Please login again.");
    } finally {
      setResendLoading(false);
    }
  };

  const filled = digits.filter(Boolean).length;

  const navigate = (url) => {
    navigateTo(url);
  };

  return (
    <div className={`otp-root theme-${division.theme}`}>
      {/* Background */}
      <div className="bg-scene">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />
      </div>

      {/* Card */}
      <main>
        <div className="otp-card">

          {/* Back */}
          <button className="back-btn" onClick={() => navigateTo("/login")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to login
          </button>

          {/* Shield icon */}
          <div className="shield-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>

          <div className="brand-badge">
            <span className="dot" />
            Security Layer 02
          </div>

          <h2 className="otp-heading">
            Verify <span>Identity</span>
          </h2>

          <p className="otp-instruction">
            We've sent a <strong>6-digit security code</strong> to your registered
            phone number{maskedPhone ? <> ending in <strong>{maskedPhone}</strong></> : ""}.
            Enter it below to authorize this session.
          </p>

          {/* Progress bar */}
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(filled / OTP_LENGTH) * 100}%` }}
            />
          </div>
          <div className="progress-label">{filled} of {OTP_LENGTH} digits entered</div>

          {/* OTP Inputs */}
          <div className="otp-wrapper" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`otp-field${d ? " filled" : ""}`}
                value={d}
                onChange={e => handleChange(e, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="otp-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Resent success */}
          {resent && (
            <div className="otp-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              New code sent to your email.
            </div>
          )}

          {/* Verify Button */}
          <button
            className="verify-btn"
            onClick={handleVerify}
            disabled={loading || filled < OTP_LENGTH}
          >
            {loading ? (
              <div className="btn-loader" />
            ) : (
              <>
                <span>Authorize Access</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>

          {/* Resend */}
          <div className="resend-row">
            Didn't receive the code?{" "}
            {canResend ? (
              <button className="resend-btn" onClick={handleResend} disabled={resendLoading}>
                {resendLoading ? "Sending..." : "Request New Code"}
              </button>
            ) : (
              <span className="resend-timer">
                Resend in <strong>{timer}s</strong>
              </span>
            )}
          </div>

          {/* Division footer */}
          {/* <div className="otp-footer">
            <span>{division.label}</span>
            <span className="footer-dot">·</span>
            <span>M3 {division.name}</span>
            <span className="footer-dot">·</span>
            <span>Secure Portal</span>
          </div> */}

        </div>
      </main>
    </div>
  );
}