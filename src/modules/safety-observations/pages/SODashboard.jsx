import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import { observationService } from "../../../services/observationService";
import { OBSERVATIONS, SAFETY_CATEGORIES, SO_RISK_LEVELS, SO_STATUSES } from "../data/observations";
import BodyMap from "../../../components/BodyMap/BodyMap";
import "./SODashboard.css";

// ── Icons ──
const Icons = {
  eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" /><circle cx="12" cy="12" r="3" /></svg>,
  calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>,
  activity: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
  layers: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" /></svg>,
  target: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  up: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 7h6v6" /><path d="m22 7-8.5 8.5-5-5L2 17" /></svg>,
  down: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 17h6v-6" /><path d="m22 17-8.5-8.5-5 5L2 7" /></svg>
};

const SOIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

function SODashboard() {
  const navigate = useNavigate();
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const barRef = useRef(null);
  const doughnutRef = useRef(null);
  const barInst = useRef(null);
  const doughnutInst = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await observationService.getObservations();
        const list = res && res.data && Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
        setObservations(list);
      } catch (err) {
        console.error("Error loading observations dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const total = observations.length;
  const openCount = observations.filter((o) => o.status === "OPEN" || o.status === "ASSIGNED" || o.status === "ACCEPTED").length;
  const closedCount = observations.filter((o) => o.status === "CLOSED").length;
  const escalatedCount = observations.filter((o) => o.status === "ESCALATED").length;
  const highRiskCount = observations.filter((o) => o.riskLevel === "HIGH" || o.riskLevel === "CRITICAL").length;

  useEffect(() => {
    if (!barRef.current || loading) return;
    if (barInst.current) barInst.current.destroy();

    barInst.current = new Chart(barRef.current.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Active / Open", "Closed", "Escalated"],
        datasets: [
          {
            label: "Observations",
            data: [openCount, closedCount, escalatedCount],
            backgroundColor: ["#2563EB", "#059669", "#DC2626"],
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: "#6B7280", precision: 0 }, grid: { color: "rgba(107,114,128,0.12)" } },
          x: { ticks: { color: "#6B7280" }, grid: { display: false } },
        },
      },
    });

    return () => {
      if (barInst.current) barInst.current.destroy();
    };
  }, [loading, openCount, closedCount, escalatedCount]);

  useEffect(() => {
    if (!doughnutRef.current || loading) return;
    if (doughnutInst.current) doughnutInst.current.destroy();

    const critical = observations.filter((o) => o.riskLevel === "CRITICAL").length;
    const high = observations.filter((o) => o.riskLevel === "HIGH").length;
    const medium = observations.filter((o) => o.riskLevel === "MEDIUM").length;
    const low = observations.filter((o) => o.riskLevel === "LOW").length;

    doughnutInst.current = new Chart(doughnutRef.current.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Critical", "High", "Medium", "Low"],
        datasets: [
          {
            data: [critical, high, medium, low],
            backgroundColor: ["#DC2626", "#EF4444", "#F59E0B", "#059669"],
            borderWidth: 0,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "78%",
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 10, padding: 14, color: "#6B7280", font: { size: 11 } } },
        },
      },
    });

    return () => {
      if (doughnutInst.current) doughnutInst.current.destroy();
    };
  }, [loading, observations]);

  const recent = observations.slice(0, 8);

  return (
    <div className="mod-page so-dashboard">
      <PageHeader
        title="Safety Observations Dashboard"
        subtitle="Track and manage safety observations across site"
        icon={<SOIcon />}
        breadcrumbs={[{ label: "Home" }, { label: "Safety Observations" }, { label: "Dashboard" }]}
        actions={
          <button className="mod-btn-primary" id="so-create-btn" onClick={() => navigate("/safety-observations/create")}>
            + New Observation
          </button>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Total Observations</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--text-main)" }}>{total}</div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Active / Open</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#2563EB" }}>{openCount}</div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Escalated</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#DC2626" }}>{escalatedCount}</div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>High / Critical Risk</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#EF4444" }}>{highRiskCount}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div className="mod-card">
          <div className="mod-card-header">
            <span className="mod-card-title">Observations by Status</span>
          </div>
          <div className="mod-card-body" style={{ height: 300, padding: "20px" }}>
            <canvas ref={barRef}></canvas>
          </div>
        </div>

        <div className="mod-card">
          <div className="mod-card-header">
            <span className="mod-card-title">Risk Distribution</span>
          </div>
          <div className="mod-card-body" style={{ height: 300, padding: "20px" }}>
            <canvas ref={doughnutRef}></canvas>
          </div>
        </div>
      </div>

      <div className="mod-card mb-4">
        <div className="mod-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="mod-card-title">Recent Observations</span>
          <button className="mod-btn-outline" onClick={() => navigate("/safety-observations/list")}>
            View All
          </button>
        </div>
        <div className="mod-table-wrap">
          {loading ? (
            <div style={{ padding: 30, textAlign: "center", color: "var(--text-muted)" }}>Loading recent observations...</div>
          ) : recent.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "var(--text-muted)" }}>No observations logged yet.</div>
          ) : (
            <table className="mod-table">
              <thead>
                <tr>
                  <th>Ref #</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((obs) => (
                  <tr key={obs.id}>
                    <td>
                      <b style={{ fontFamily: "monospace" }}>{obs.observationNumber}</b>
                    </td>
                    <td>{obs.observationType}</td>
                    <td>{obs.safetyCategory}</td>
                    <td>{obs.buildingName || obs.specificLocation || "-"}</td>
                    <td>
                      <span className={`badge ${obs.status === "CLOSED" ? "badge-green" : obs.status === "REJECTED" ? "badge-red" : "badge-orange"}`}>
                        {obs.status}
                      </span>
                    </td>
                    <td>
                      <button className="mod-btn-outline" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => navigate(`/safety-observations/details/${obs.id}`)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
