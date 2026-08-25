import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import { INCIDENTS, IM_STATS } from "../data/incidents";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import StatCard from "../../../components/common/StatCard/StatCard";
import "../../../styles/module-shared.css";

Chart.register(...registerables);

const ReportIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

/* Monthly data (static) */
const MONTHLY = [
  { month: "Mar", total: 2 }, { month: "Apr", total: 3 },
  { month: "May", total: 4 }, { month: "Jun", total: 3 },
  { month: "Jul", total: 5 }, { month: "Aug", total: 6 },
];

function IMReports() {
  const navigate = useNavigate();
  const trendRef = useRef(null);
  const catRef = useRef(null);
  const trendInst = useRef(null);
  const catInst = useRef(null);

  const catData = Object.entries(
    INCIDENTS.reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6);

  useEffect(() => {
    if (!trendRef.current) return;
    if (trendInst.current) trendInst.current.destroy();
    trendInst.current = new Chart(trendRef.current.getContext("2d"), {
      type: "line",
      data: {
        labels: MONTHLY.map(m => m.month),
        datasets: [{
          label: "Total Incidents",
          data: MONTHLY.map(m => m.total),
          borderColor: "#2563EB",
          backgroundColor: "rgba(37,99,235,0.08)",
          tension: 0.4, fill: true,
          pointBackgroundColor: "#2563EB", pointRadius: 5,
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
    return () => { if (trendInst.current) trendInst.current.destroy(); };
  }, []);

  useEffect(() => {
    if (!catRef.current) return;
    if (catInst.current) catInst.current.destroy();
    catInst.current = new Chart(catRef.current.getContext("2d"), {
      type: "bar",
      data: {
        labels: catData.map(([c]) => c),
        datasets: [{
          label: "Count",
          data: catData.map(([, v]) => v),
          backgroundColor: ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2"],
          borderRadius: 6, borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: "#6B7280", precision: 0 }, grid: { color: "rgba(107,114,128,0.12)" } },
          x: { ticks: { color: "#6B7280", maxRotation: 20 }, grid: { display: false } },
        },
      },
    });
    return () => { if (catInst.current) catInst.current.destroy(); };
  }, []);

  return (
    <div className="mod-page">
      <PageHeader
        title="Incident Reports"
        subtitle="Analytics and summary of all recorded incidents"
        icon={<ReportIcon />}
        breadcrumbs={[{ label: "Home" }, { label: "Incident Management" }, { label: "Reports" }]}
        actions={
          <button className="mod-btn-outline" id="im-export-btn" onClick={() => alert("Export feature ready for API integration")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export Report
          </button>
        }
      />

      {/* ── Summary Stats ── */}
      <div className="mod-stats-row">
        <StatCard icon={<ReportIcon />}        label="Total Incidents"  value={IM_STATS.total}        colorClass="purple" />
        <StatCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          label="Active Incidents" value={IM_STATS.open} colorClass="caution" />
        <StatCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          label="Closed" value={IM_STATS.closed} colorClass="safe" />
        <StatCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
          label="High Severity" value={IM_STATS.highSeverity} colorClass="risk" />
      </div>

      {/* ── Charts ── */}
      <div className="mod-report-charts">
        <div className="mod-card">
          <div className="mod-card-header"><h3 className="mod-card-title"><ReportIcon />Monthly Trend</h3></div>
          <div className="mod-card-body"><div className="mod-chart-wrap"><canvas ref={trendRef} /></div></div>
        </div>
        <div className="mod-card">
          <div className="mod-card-header"><h3 className="mod-card-title"><ReportIcon />Top Categories</h3></div>
          <div className="mod-card-body"><div className="mod-chart-wrap"><canvas ref={catRef} /></div></div>
        </div>
      </div>

      {/* ── Severity Table ── */}
      <div className="mod-card" style={{ marginBottom: 20 }}>
        <div className="mod-card-header">
          <h3 className="mod-card-title">Severity Breakdown</h3>
        </div>
        <div className="mod-table-wrap">
          <table className="mod-table">
            <thead><tr><th>Severity</th><th>Count</th><th>% of Total</th></tr></thead>
            <tbody>
              {["Critical", "High", "Medium", "Low"].map(sev => {
                const count = INCIDENTS.filter(i => i.severity === sev).length;
                return (
                  <tr key={sev}>
                    <td><span className={`hse-badge badge-${sev.toLowerCase()}`}><span className="badge-dot"/>{sev}</span></td>
                    <td style={{ fontWeight: 600 }}>{count}</td>
                    <td>{((count / INCIDENTS.length) * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Status Table ── */}
      <div className="mod-card">
        <div className="mod-card-header"><h3 className="mod-card-title">Status Breakdown</h3></div>
        <div className="mod-table-wrap">
          <table className="mod-table">
            <thead><tr><th>Status</th><th>Count</th><th>% of Total</th></tr></thead>
            <tbody>
              {["Open", "In Progress", "Investigating", "Closed"].map(status => {
                const count = INCIDENTS.filter(i => i.status === status).length;
                return (
                  <tr key={status}>
                    <td><span className={`hse-badge badge-${status.toLowerCase().replace(" ", "")}`}><span className="badge-dot"/>{status}</span></td>
                    <td style={{ fontWeight: 600 }}>{count}</td>
                    <td>{((count / INCIDENTS.length) * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default IMReports;
