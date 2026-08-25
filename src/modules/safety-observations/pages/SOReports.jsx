import React, { useRef, useEffect } from "react";
import { Chart, registerables } from "chart.js";
import { OBSERVATIONS, SO_STATS } from "../data/observations";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import StatCard from "../../../components/common/StatCard/StatCard";
import "../../../styles/module-shared.css";

Chart.register(...registerables);

const ReportIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const MONTHLY = [
  { month: "Mar", total: 2 }, { month: "Apr", total: 4 },
  { month: "May", total: 3 }, { month: "Jun", total: 5 },
  { month: "Jul", total: 4 }, { month: "Aug", total: 7 },
];

function SOReports() {
  const trendRef = useRef(null);
  const catRef = useRef(null);
  const trendInst = useRef(null);
  const catInst = useRef(null);

  const catData = Object.entries(
    OBSERVATIONS.reduce((acc, o) => { acc[o.category] = (acc[o.category] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6);

  useEffect(() => {
    if (!trendRef.current) return;
    if (trendInst.current) trendInst.current.destroy();
    trendInst.current = new Chart(trendRef.current.getContext("2d"), {
      type: "line",
      data: {
        labels: MONTHLY.map(m => m.month),
        datasets: [{
          label: "Observations",
          data: MONTHLY.map(m => m.total),
          borderColor: "#059669",
          backgroundColor: "rgba(5,150,105,0.08)",
          tension: 0.4, fill: true,
          pointBackgroundColor: "#059669", pointRadius: 5,
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
          backgroundColor: ["#059669", "#2563EB", "#7C3AED", "#D97706", "#DC2626", "#0891B2"],
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
        title="Observation Reports"
        subtitle="Analytics and summary for all safety observations"
        icon={<ReportIcon />}
        breadcrumbs={[{ label: "Home" }, { label: "Safety Observations" }, { label: "Reports" }]}
        actions={
          <button className="mod-btn-outline" id="so-export-btn" onClick={() => alert("Export ready for API integration")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        }
      />

      <div className="mod-stats-row">
        <StatCard icon={<ReportIcon />}
          label="Total Observations" value={SO_STATS.total} colorClass="info" />
        <StatCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          label="Open / In Review" value={SO_STATS.open} colorClass="caution" />
        <StatCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          label="Completed" value={SO_STATS.closed} colorClass="safe" />
        <StatCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
          label="High Risk" value={SO_STATS.highRisk} colorClass="risk" />
      </div>

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

      {/* Risk Level Table */}
      <div className="mod-card" style={{ marginBottom: 20 }}>
        <div className="mod-card-header"><h3 className="mod-card-title">Risk Level Breakdown</h3></div>
        <div className="mod-table-wrap">
          <table className="mod-table">
            <thead><tr><th>Risk Level</th><th>Count</th><th>% of Total</th></tr></thead>
            <tbody>
              {["Critical", "High", "Medium", "Low"].map(rl => {
                const count = OBSERVATIONS.filter(o => o.riskLevel === rl).length;
                return (
                  <tr key={rl}>
                    <td><span className={`hse-badge badge-${rl.toLowerCase()}`}><span className="badge-dot"/>{rl}</span></td>
                    <td style={{ fontWeight: 600 }}>{count}</td>
                    <td>{((count / OBSERVATIONS.length) * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Table */}
      <div className="mod-card">
        <div className="mod-card-header"><h3 className="mod-card-title">Status Breakdown</h3></div>
        <div className="mod-table-wrap">
          <table className="mod-table">
            <thead><tr><th>Status</th><th>Count</th><th>% of Total</th></tr></thead>
            <tbody>
              {["Open", "In Review", "Completed"].map(status => {
                const count = OBSERVATIONS.filter(o => o.status === status).length;
                return (
                  <tr key={status}>
                    <td><span className={`hse-badge badge-${status.toLowerCase().replace(" ", "")}`}><span className="badge-dot"/>{status}</span></td>
                    <td style={{ fontWeight: 600 }}>{count}</td>
                    <td>{((count / OBSERVATIONS.length) * 100).toFixed(1)}%</td>
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

export default SOReports;
