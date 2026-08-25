import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OBSERVATIONS } from "../data/observations";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import StatusBadge from "../../../components/common/StatusBadge/StatusBadge";
import "../../../styles/module-shared.css";

const CAIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

/* Build corrective actions list from observations that have a corrective action + due date */
const correctiveActions = OBSERVATIONS
  .filter(o => o.correctiveAction && o.dueDate)
  .map((o, i) => ({
    no: i + 1,
    obsId: o.id,
    title: o.correctiveAction.slice(0, 70) + (o.correctiveAction.length > 70 ? "…" : ""),
    location: o.location,
    riskLevel: o.riskLevel,
    status: o.status,
    dueDate: o.dueDate,
    observer: o.observer,
    category: o.category,
  }));

function SOCorrectiveActions() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = correctiveActions.filter(ca => {
    const matchSearch =
      ca.obsId.toLowerCase().includes(search.toLowerCase()) ||
      ca.title.toLowerCase().includes(search.toLowerCase()) ||
      ca.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || ca.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const overdue = correctiveActions.filter(ca => ca.status !== "Completed" && ca.dueDate < new Date().toISOString().split("T")[0]).length;
  const pending = correctiveActions.filter(ca => ["Open", "In Review"].includes(ca.status)).length;
  const completed = correctiveActions.filter(ca => ca.status === "Completed").length;

  return (
    <div className="mod-page">
      <PageHeader
        title="Corrective Actions"
        subtitle="Track and manage corrective actions from safety observations"
        icon={<CAIcon />}
        breadcrumbs={[{ label: "Home" }, { label: "Safety Observations" }, { label: "Corrective Actions" }]}
      />

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Actions", value: correctiveActions.length, color: "#2563EB", bg: "rgba(37,99,235,0.10)" },
          { label: "Pending / Open", value: pending, color: "#D97706", bg: "rgba(217,119,6,0.10)" },
          { label: "Completed", value: completed, color: "#059669", bg: "rgba(5,150,105,0.10)" },
        ].map(c => (
          <div key={c.label} className="mod-card" style={{ padding: "18px 20px", display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: c.bg, color: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 700 }}>
              {c.value}
            </div>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)" }}>{c.label}</span>
          </div>
        ))}
      </div>

      <div className="mod-card">
        <div className="mod-toolbar">
          <div className="mod-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="ca-search"
              type="text"
              placeholder="Search actions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select id="ca-status-filter" className="mod-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option>Open</option>
            <option>In Review</option>
            <option>Completed</option>
          </select>
        </div>

        <div className="mod-table-wrap">
          <table className="mod-table">
            <thead>
              <tr>
                <th>#</th><th>Obs. ID</th><th>Corrective Action</th><th>Category</th>
                <th>Risk</th><th>Status</th><th>Due Date</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No corrective actions found</td></tr>
              ) : filtered.map(ca => (
                <tr key={ca.obsId}>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{ca.no}</td>
                  <td className="id-cell">{ca.obsId}</td>
                  <td className="title-cell" style={{ maxWidth: 260 }}>{ca.title}</td>
                  <td>{ca.category}</td>
                  <td><StatusBadge status={ca.riskLevel.toLowerCase()} /></td>
                  <td><StatusBadge status={ca.status.toLowerCase()} /></td>
                  <td style={{ color: ca.dueDate < new Date().toISOString().split("T")[0] && ca.status !== "Completed" ? "#DC2626" : "inherit", fontWeight: 500 }}>
                    {ca.dueDate}
                  </td>
                  <td>
                    <button className="mod-table action-btn" onClick={() => navigate(`/safety-observations/details/${ca.obsId}`)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mod-pagination">
          <span>Showing {filtered.length} of {correctiveActions.length} actions</span>
          {overdue > 0 && (
            <span style={{ color: "#DC2626", fontSize: "0.8rem", fontWeight: 600 }}>⚠ {overdue} overdue action{overdue > 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SOCorrectiveActions;
