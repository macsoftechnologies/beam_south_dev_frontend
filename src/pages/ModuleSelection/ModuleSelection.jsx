import React from "react";
import { useNavigate } from "react-router-dom";
import "./ModuleSelection.css";

const modules = [
  {
    id: "permit-to-work",
    title: "Permit to Work",
    description: "Create, approve and manage work permits efficiently.",
    color: "#10B981",
    bgGradient: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.02) 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
    features: [
      "Create & Manage Permits",
      "Approval Workflows",
      "Permit History",
      "Expiry & Renewal Alerts"
    ],
    path: "/dashboard",
  },
  {
    id: "incident-management",
    title: "Incident Management",
    description: "Report, track and manage incidents to reduce risks and improve safety.",
    color: "#F97316",
    bgGradient: "linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0.02) 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    features: [
      "Report Incidents",
      "Track & Investigate",
      "Root Cause Analysis",
      "Incident Reports & Analytics"
    ],
    path: "/incident-management/dashboard",
  },
  {
    id: "safety-observations",
    title: "Safety Observations",
    description: "Log and track safety observations to promote a safer work environment.",
    color: "#3B82F6",
    bgGradient: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.02) 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    features: [
      "Log Observations",
      "Assign Corrective Actions",
      "Track Progress",
      "Observation Reports"
    ],
    path: "/safety-observations/dashboard",
  },
];

const CheckCircleIcon = ({ color }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={color} stroke="none" style={{ flexShrink: 0, marginTop: "2px" }}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);


function ModuleSelection() {
  const navigate = useNavigate();

  return (
    <div className="ms-root">
      {/* Background decorations */}
      <div className="ms-bg-pattern" aria-hidden="true" />
      <div className="ms-bg-top-left" />
      <div className="ms-bg-bottom-right" />

      <div className="ms-container">
        {/* Header */}
        <div className="ms-header">
          <div className="ms-header-top">
            <div className="ms-logo-icon">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Shield background */}
                <path d="M50 5L10 20V45C10 70 30 90 50 95C70 90 90 70 90 45V20L50 5Z" fill="#F8FAFC" stroke="#0f172a" strokeWidth="6" strokeLinejoin="round"/>
                {/* Inner lighter blue */}
                <path d="M50 12L18 24V46C18 67 35 83 50 87C65 83 82 67 82 46V24L50 12Z" fill="#1E3A8A" />
                {/* Hard hat */}
                <path d="M30 65C30 50 40 45 50 45C60 45 70 50 70 65" fill="#F8FAFC" />
                <path d="M25 65H75C78 65 80 67 80 70C80 72 78 75 75 75H25C22 75 20 72 20 70C20 67 22 65 25 65Z" fill="#F8FAFC" />
                <path d="M40 45V40C40 37 42 35 50 35C58 35 60 37 60 40V45" stroke="#F8FAFC" strokeWidth="4" />
                {/* Checkmark circle */}
                <circle cx="78" cy="78" r="16" fill="#14b8a6" stroke="#fff" strokeWidth="3" />
                <path d="M71 78L76 83L85 73" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="ms-header-text">
              <h1 className="ms-title">Safety Tracker</h1>
              <span className="ms-badge">ENTERPRISE HSE PLATFORM</span>
            </div>
          </div>
          <p className="ms-desc">
            Site HSE Safety, Incident Management &amp; Permit to Work <br />
            Platform for construction site compliance and worker safety.
          </p>
        </div>

        {/* Module Cards */}
        <div className="ms-cards">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="ms-card"
              role="button"
              tabIndex={0}
              onClick={() => {
                localStorage.setItem("activeModule", mod.id);
                navigate(mod.path);
              }}
              style={{
                "--theme-color": mod.color,
                "--theme-bg": mod.bgGradient,
              }}
            >
              {/* Top shape curve decoration */}
              <div className="ms-card-curve" style={{ background: mod.bgGradient }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="curve-svg">
                  <path d="M0,100 C30,40 70,120 100,60 L100,0 L0,0 Z" fill={mod.color} opacity="0.06" />
                  <path d="M0,100 C40,70 60,110 100,40 L100,0 L0,0 Z" fill={mod.color} opacity="0.04" />
                </svg>
              </div>

              <div className="ms-card-content">
                {/* Icon */}
                <div className="ms-card-icon-wrap" style={{ background: mod.color }}>
                  {mod.icon}
                </div>

                {/* Title & Description */}
                <h3 className="ms-card-title" style={{ color: mod.color }}>{mod.title}</h3>
                <div className="ms-card-line" style={{ background: mod.color }} />
                <p className="ms-card-desc">{mod.description}</p>

                {/* Features List */}
                <ul className="ms-card-features">
                  {mod.features.map((feat, i) => (
                    <li key={i}>
                      <CheckCircleIcon color={mod.color} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Watermark Icon */}
                <div className="ms-card-watermark" style={{ color: mod.color }}>
                  {mod.icon}
                </div>
              </div>

              {/* Bottom Button */}
              <button
                className="ms-card-btn"
                style={{ background: mod.color }}
              >
                Access {mod.title}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ModuleSelection;
