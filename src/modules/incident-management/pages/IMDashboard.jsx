import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import { getIncidents } from "../../../services/incidentService";
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

const severityMeta = (level) => {
  const meta = {
    1: { level: 1, label: "Insignificant", color: "#2D9E5A" },
    2: { level: 2, label: "Minor", color: "#C07D10" },
    3: { level: 3, label: "Moderate", color: "#D97706" },
    4: { level: 4, label: "Critical", color: "#E32B50" },
    5: { level: 5, label: "Catastrophic", color: "#8F1B32" }
  };
  return meta[level] || { level: level || 1, label: "", color: "#A1A5B3" };
};

const SevPill = ({ level }) => {
  const m = severityMeta(level);
  return (
    <span className="badge" style={{ background: `${m.color}22`, color: m.color, fontWeight: 700 }}>
      {m.level} {m.label}
    </span>
  );
};

function IMDashboard() {
  const navigate = useNavigate();
  const barRef = useRef(null);
  const doughnutRef = useRef(null);
  const barInst = useRef(null);
  const doughnutInst = useRef(null);
  
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await getIncidents();
        setIncidents(Array.isArray(res) ? res : (res.data || []));
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = {
    total: incidents.length,
    open: incidents.filter(i => i.stage !== "CLOSED" && i.status !== "Closed").length,
    closed: incidents.filter(i => i.stage === "CLOSED" || i.status === "Closed").length,
    highSeverity: incidents.filter(i => String(i.potentialSeverity) === "4" || String(i.potentialSeverity) === "5").length
  };

  const recent = [...incidents].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).slice(0, 8);

  const categoryCounts = incidents.reduce((acc, inc) => {
    const cat = inc.category || inc.classification || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // ── Bar Chart: status breakdown ──
  useEffect(() => {
    if (!barRef.current || loading) return;
    if (barInst.current) { barInst.current.destroy(); }

    barInst.current = new Chart(barRef.current.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Heads-Up", "Initial Report", "Investigation", "Closed"],
        datasets: [{
          label: "Incidents",
          data: [
            incidents.filter(i => i.stage === "HEADS_UP" || i.pipeline === "Heads-Up").length,
            incidents.filter(i => i.stage === "INITIAL_REPORT" || i.pipeline === "Initial").length,
            incidents.filter(i => i.stage === "INVESTIGATION" || i.pipeline === "Investigation").length,
            incidents.filter(i => i.stage === "CLOSED" || i.pipeline === "Closed").length,
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
  }, [incidents, loading]);

  // ── Doughnut Chart: severity ──
  useEffect(() => {
    if (!doughnutRef.current || loading) return;
    if (doughnutInst.current) { doughnutInst.current.destroy(); }

    doughnutInst.current = new Chart(doughnutRef.current.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Critical (4-5)", "Moderate (3)", "Minor (2)", "Insignificant (1)"],
        datasets: [{
          data: [
            incidents.filter(i => String(i.actualSeverity) === "4" || String(i.actualSeverity) === "5").length,
            incidents.filter(i => String(i.actualSeverity) === "3").length,
            incidents.filter(i => String(i.actualSeverity) === "2").length,
            incidents.filter(i => String(i.actualSeverity) === "1").length,
          ],
          backgroundColor: ["#DC2626", "#F59E0B", "#3B82F6", "#059669"],
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
  }, [incidents, loading]);

  return (
    <div className="mod-page im-dashboard">
      <PageHeader
        title="Incident Management"
        subtitle="Monitor and manage all site incidents"
        icon={<Icons.IMIcon />}
        breadcrumbs={[{ label: "Home" }, { label: "Incident Management" }, { label: "Dashboard" }]}
        actions={
          <button className="mod-btn-primary im-btn-primary" id="im-create-btn" onClick={() => navigate("/incident-management/create")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Report Incident
          </button>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="mod-stats-row">
        <StatCard icon={<Icons.Total />} label="Total Incidents" value={stats.total} colorClass="purple" />
        <StatCard icon={<Icons.Open />}  label="Open / Active"  value={stats.open}  colorClass="caution" />
        <StatCard icon={<Icons.Closed />} label="Closed"        value={stats.closed} colorClass="safe" />
        <StatCard icon={<Icons.High />}  label="High Severity"  value={stats.highSeverity} colorClass="risk" />
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
                  <div className="im-cat-bar" style={{ width: `${Math.max((count / Math.max(incidents.length, 1)) * 100, 2)}%` }} />
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
                  <td className="title-cell" style={{ maxWidth: "180px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inc.caseNumber || inc.title || "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{inc.categories?.[0] || inc.category || "—"}</td>
                  <td><SevPill level={inc.actualSeverity} /></td>
                  <td><StatusBadge status={String(inc.stage || inc.pipeline || inc.status || "Closed")} /></td>
                  <td style={{ whiteSpace: "nowrap" }}>{inc.incidentDate || (inc.createdAt ? inc.createdAt.split('T')[0] : inc.date) || "—"}</td>
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
