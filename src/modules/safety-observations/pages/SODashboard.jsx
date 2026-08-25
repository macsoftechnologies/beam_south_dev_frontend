import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import { OBSERVATIONS, SO_STATS } from "../data/observations";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import "./SODashboard.css";
import "../../../styles/module-shared.css";

Chart.register(...registerables);

const SOIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);

const recent = [...OBSERVATIONS].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

function SODashboard() {
  const navigate = useNavigate();
  const barRef = useRef(null);
  const doughnutRef = useRef(null);
  const barInst = useRef(null);
  const doughnutInst = useRef(null);

  useEffect(() => {
    if (!barRef.current) return;
    if (barInst.current) barInst.current.destroy();
    barInst.current = new Chart(barRef.current.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Open", "Closed", "Escalated"],
        datasets: [{
          label: "Observations",
          data: [
            OBSERVATIONS.filter(o => o.status === "open").length,
            OBSERVATIONS.filter(o => o.status === "closed").length,
            OBSERVATIONS.filter(o => o.status === "escalated").length,
          ],
          backgroundColor: ["#2563EB", "#059669", "#DC2626"],
          borderRadius: 6, borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: "#6B7280", precision: 0 }, grid: { color: "rgba(107,114,128,0.12)" } },
          x: { ticks: { color: "#6B7280" }, grid: { display: false } },
        },
      },
    });
    return () => { if (barInst.current) barInst.current.destroy(); };
  }, []);

  useEffect(() => {
    if (!doughnutRef.current) return;
    if (doughnutInst.current) doughnutInst.current.destroy();
    doughnutInst.current = new Chart(doughnutRef.current.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Very high", "High", "Moderate", "Low"],
        datasets: [{
          data: [
            OBSERVATIONS.filter(o => o.risk === "Very high").length,
            OBSERVATIONS.filter(o => o.risk === "High").length,
            OBSERVATIONS.filter(o => o.risk === "Medium" || o.risk === "Moderate").length,
            OBSERVATIONS.filter(o => o.risk === "Low" || o.risk === "Very low" || o.risk === "-").length,
          ],
          backgroundColor: ["#DC2626", "#EF4444", "#F59E0B", "#059669"],
          borderWidth: 0, hoverOffset: 10,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "78%",
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 10, padding: 14, color: "#6B7280", font: { size: 11 } } },
        },
      },
    });
    return () => { if (doughnutInst.current) doughnutInst.current.destroy(); };
  }, []);

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
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--text-main)" }}>{SO_STATS.total}</div>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Open</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#2563EB" }}>{SO_STATS.open}</div>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Escalated</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#DC2626" }}>{SO_STATS.escalated}</div>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>High Risk</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#EF4444" }}>{SO_STATS.highRisk}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div className="mod-card">
          <div className="mod-card-header"><span className="mod-card-title">Observations by Status</span></div>
          <div className="mod-card-body" style={{ height: 300, padding: "20px" }}>
            <canvas ref={barRef}></canvas>
          </div>
        </div>
        <div className="mod-card">
          <div className="mod-card-header"><span className="mod-card-title">Risk Distribution</span></div>
          <div className="mod-card-body" style={{ height: 300, padding: "20px" }}>
            <canvas ref={doughnutRef}></canvas>
          </div>
        </div>
      </div>

      <div className="mod-card mb-4">
        <div className="mod-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="mod-card-title">Recent Observations</span>
          <button className="mod-btn-outline" onClick={() => navigate("/safety-observations/list")}>View All</button>
        </div>
        <div className="mod-table-wrap">
          <table className="mod-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Type</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(obs => (
                <tr key={obs.id}>
                  <td><b>{obs.id}</b></td>
                  <td>{obs.obsType}</td>
                  <td>{obs.category}</td>
                  <td>{obs.location}</td>
                  <td>
                    <span className={`badge ${obs.status === 'open' ? 'badge-orange' : obs.status === 'closed' ? 'badge-green' : 'badge-blue'}`}>
                      {obs.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button className="mod-btn-outline" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => navigate(`/safety-observations/details/${obs.id}`)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SODashboard;
