import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { INCIDENTS } from "../data/incidents";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import StatusBadge from "../../../components/common/StatusBadge/StatusBadge";
import "../../../styles/module-shared.css";

const InvIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const INVESTIGATION_STEPS = [
  { step: 1, title: "Incident Reported",     desc: "Incident logged in HSE system by site supervisor.",         done: true },
  { step: 2, title: "Initial Assessment",    desc: "HSE officer conducted on-site assessment and documented findings.", done: true },
  { step: 3, title: "Root Cause Analysis",   desc: "Team reviewed contributing factors and identified root cause.", done: true },
  { step: 4, title: "Corrective Action Plan", desc: "Action plan drafted and submitted for management approval.", done: false },
  { step: 5, title: "Implementation",        desc: "Corrective actions implemented by responsible team.",        done: false },
  { step: 6, title: "Close Out",             desc: "Investigation closed after verification of corrective actions.", done: false },
];

function IMInvestigation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const incident = INCIDENTS.find(i => i.id === id);

  if (!incident) {
    return (
      <div className="mod-page">
        <div className="mod-card" style={{ padding: "60px 32px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)" }}>Incident not found.</p>
          <button className="mod-btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/incident-management/list")}>← Back to List</button>
        </div>
      </div>
    );
  }

  const completedSteps = incident.status === "Closed" ? INVESTIGATION_STEPS.length
    : incident.status === "Investigating" ? 3
    : incident.status === "In Progress" ? 2
    : 1;

  return (
    <div className="mod-page">
      <PageHeader
        title="Investigation Details"
        subtitle={`${incident.id} — ${incident.title}`}
        icon={<InvIcon />}
        breadcrumbs={[{ label: "Home" }, { label: "Incident Management" }, { label: "Investigation" }]}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button className="mod-btn-outline" onClick={() => navigate(`/incident-management/details/${incident.id}`)}>← Incident Details</button>
          </div>
        }
      />

      {/* ── Summary banner ── */}
      <div className="mod-card" style={{ marginBottom: 20 }}>
        <div className="mod-card-body">
          <div className="mod-detail-grid">
            <div className="mod-detail-item">
              <div className="mod-detail-label">Incident ID</div>
              <div className="mod-detail-value" style={{ fontFamily: "monospace" }}>{incident.id}</div>
            </div>
            <div className="mod-detail-item">
              <div className="mod-detail-label">Status</div>
              <div className="mod-detail-value"><StatusBadge status={incident.status.toLowerCase()} /></div>
            </div>
            <div className="mod-detail-item">
              <div className="mod-detail-label">Severity</div>
              <div className="mod-detail-value"><StatusBadge status={incident.severity.toLowerCase()} /></div>
            </div>
            <div className="mod-detail-item">
              <div className="mod-detail-label">Category</div>
              <div className="mod-detail-value">{incident.category}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Investigation Timeline ── */}
      <div className="mod-card" style={{ marginBottom: 20 }}>
        <div className="mod-card-header">
          <h3 className="mod-card-title">Investigation Progress</h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {completedSteps} / {INVESTIGATION_STEPS.length} steps complete
          </span>
        </div>
        <div className="mod-card-body">
          {/* Progress bar */}
          <div style={{ background: "var(--bg-dark)", borderRadius: 6, height: 8, marginBottom: 24, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(completedSteps / INVESTIGATION_STEPS.length) * 100}%`,
              background: "linear-gradient(90deg, #2563EB, #7C3AED)",
              borderRadius: 6,
              transition: "width 0.4s ease",
            }} />
          </div>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {INVESTIGATION_STEPS.map((s, i) => {
              const done = i < completedSteps;
              const current = i === completedSteps;
              return (
                <div key={s.step} style={{ display: "flex", gap: 16, paddingBottom: i < INVESTIGATION_STEPS.length - 1 ? 24 : 0, position: "relative" }}>
                  {/* Connector line */}
                  {i < INVESTIGATION_STEPS.length - 1 && (
                    <div style={{
                      position: "absolute", left: 15, top: 30, bottom: 0, width: 2,
                      background: done ? "#2563EB" : "var(--border-color)",
                    }} />
                  )}
                  {/* Circle */}
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0, zIndex: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: done ? "#2563EB" : current ? "rgba(37,99,235,0.12)" : "var(--bg-dark)",
                    border: `2px solid ${done ? "#2563EB" : current ? "#2563EB" : "var(--border-color)"}`,
                  }}>
                    {done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: current ? "#2563EB" : "var(--text-muted)" }}>{s.step}</span>
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: done ? "var(--text-main)" : current ? "var(--accent-primary)" : "var(--text-muted)" }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Root Cause & Corrective Action ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          { title: "Root Cause", content: incident.rootCause },
          { title: "Corrective Action", content: incident.correctiveAction },
        ].map(({ title, content }) => (
          <div className="mod-card" key={title}>
            <div className="mod-card-header"><h3 className="mod-card-title">{title}</h3></div>
            <div className="mod-card-body">
              <div className="mod-description-box">{content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IMInvestigation;
