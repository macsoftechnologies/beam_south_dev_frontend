import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import { INCIDENTS, IM_STATS } from "../data/incidents";
import StatCard from "../../../components/common/StatCard/StatCard";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import StatusBadge from "../../../components/common/StatusBadge/StatusBadge";
import "../../incident-management/pages/IMDashboard.css";
import "../../../styles/module-shared.css";

Chart.register(...registerables);

/* ── Icons ── */
const Icons = {
  Total: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Open: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Closed: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  High: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Chart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  IMIcon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

/* ── Recent table (5 latest) ── */
const recent = [...INCIDENTS].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

/* ── Category distribution ── */
const categoryCounts = INCIDENTS.reduce((acc, inc) => {
  acc[inc.category] = (acc[inc.category] || 0) + 1;
  return acc;
}, {});

const topCategories = Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6);

function IMDashboard() {
  const navigate = useNavigate();
  const barRef = useRef(null);
  const doughnutRef = useRef(null);
  const barInst = useRef(null);
  const doughnutInst = useRef(null);

  // ── Bar Chart: status breakdown ──
  useEffect(() => {
    if (!barRef.current) return;
    if (barInst.current) { barInst.current.destroy(); }

    barInst.current = new Chart(barRef.current.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Open", "In Progress", "Investigating", "Closed"],
        datasets: [{
          label: "Incidents",
          data: [
            INCIDENTS.filter(i => i.status === "Open").length,
            INCIDENTS.filter(i => i.status === "In Progress").length,
            INCIDENTS.filter(i => i.status === "Investigating").length,
            INCIDENTS.filter(i => i.status === "Closed").length,
          ],
          backgroundColor: ["#2563EB", "#D97706", "#7C3AED", "#059669"],
          borderRadius: 6,
          borderSkipped: false,
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

  // ── Doughnut Chart: severity ──
  useEffect(() => {
    if (!doughnutRef.current) return;
    if (doughnutInst.current) { doughnutInst.current.destroy(); }

    doughnutInst.current = new Chart(doughnutRef.current.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Critical", "High", "Medium", "Low"],
        datasets: [{
          data: [
            INCIDENTS.filter(i => i.severity === "Critical").length,
            INCIDENTS.filter(i => i.severity === "High").length,
            INCIDENTS.filter(i => i.severity === "Medium").length,
            INCIDENTS.filter(i => i.severity === "Low").length,
          ],
          backgroundColor: ["#DC2626", "#EF4444", "#F59E0B", "#059669"],
          borderWidth: 0, hoverOffset: 10,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: "78%",
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 10, padding: 14, color: "#6B7280", font: { size: 11 } } },
        },
      },
    });
    return () => { if (doughnutInst.current) doughnutInst.current.destroy(); };
  }, []);

  return (
    <div className="mod-page im-dashboard">
      <PageHeader
        title="Incident Management"
        subtitle="Monitor and manage all site incidents"
        icon={<Icons.IMIcon />}
        breadcrumbs={[{ label: "Home" }, { label: "Incident Management" }, { label: "Dashboard" }]}
        actions={
          <button className="mod-btn-primary" id="im-create-btn" onClick={() => navigate("/incident-management/create")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Report Incident
          </button>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="mod-stats-row">
        <StatCard icon={<Icons.Total />} label="Total Incidents" value={IM_STATS.total} colorClass="purple" />
        <StatCard icon={<Icons.Open />}  label="Open / Active"  value={IM_STATS.open}  colorClass="caution" />
        <StatCard icon={<Icons.Closed />} label="Closed"        value={IM_STATS.closed} colorClass="safe" />
        <StatCard icon={<Icons.High />}  label="High Severity"  value={IM_STATS.highSeverity} colorClass="risk" />
      </div>

      {/* ── Charts ── */}
      <div className="mod-charts-row">
        <div className="mod-card">
          <div className="mod-card-header">
            <h3 className="mod-card-title"><Icons.Chart />Incidents by Status</h3>
          </div>
          <div className="mod-card-body">
            <div className="mod-chart-wrap"><canvas ref={barRef} /></div>
          </div>
        </div>

        <div className="mod-card">
          <div className="mod-card-header">
            <h3 className="mod-card-title"><Icons.Chart />Severity Distribution</h3>
          </div>
          <div className="mod-card-body">
            <div className="mod-chart-wrap"><canvas ref={doughnutRef} /></div>
          </div>
        </div>
      </div>

      {/* ── Top Categories ── */}
      <div className="mod-card" style={{ marginBottom: 24 }}>
        <div className="mod-card-header">
          <h3 className="mod-card-title"><Icons.Chart />Incidents by Category</h3>
        </div>
        <div className="mod-card-body">
          <div className="im-category-bars">
            {topCategories.map(([cat, count]) => (
              <div key={cat} className="im-cat-row">
                <span className="im-cat-name">{cat}</span>
                <div className="im-cat-bar-wrap">
                  <div className="im-cat-bar" style={{ width: `${(count / INCIDENTS.length) * 100}%` }} />
                </div>
                <span className="im-cat-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Incidents Table ── */}
      <div className="mod-card">
        <div className="mod-card-header">
          <h3 className="mod-card-title"><Icons.List />Recent Incidents</h3>
          <button className="mod-btn-outline" onClick={() => navigate("/incident-management/list")}>View All</button>
        </div>
        <div className="mod-table-wrap">
          <table className="mod-table">
            <thead>
              <tr>
                <th>ID</th><th>Title</th><th>Category</th>
                <th>Severity</th><th>Status</th><th>Date</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(inc => (
                <tr key={inc.id}>
                  <td className="id-cell">{inc.id}</td>
                  <td className="title-cell">{inc.title}</td>
                  <td>{inc.category}</td>
                  <td><StatusBadge status={inc.severity.toLowerCase()} /></td>
                  <td><StatusBadge status={inc.status.toLowerCase()} /></td>
                  <td>{inc.date}</td>
                  <td>
                    <button className="mod-table action-btn" onClick={() => navigate(`/incident-management/details/${inc.id}`)}>
                      View
                    </button>
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

export default IMDashboard;
