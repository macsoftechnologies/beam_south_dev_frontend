import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import StatusBadge from "../../../components/common/StatusBadge/StatusBadge";
import { observationService } from "../../../services/observationService";
import "../../../styles/module-shared.css";

const CAIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

function SOCorrectiveActions() {
  const navigate = useNavigate();
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await observationService.getObservations({ type: "NEEDS_ATTENTION" });
        const list = res && res.data && Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
        setObservations(list);
      } catch (err) {
        console.error("Error loading corrective actions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = observations.filter((o) => {
    const text = (o.observationNumber + o.subject + o.assignedContractorName + o.safetyCategory).toLowerCase();
    const matchSearch = text.includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCount = observations.filter((o) => o.status === "ASSIGNED" || o.status === "ACCEPTED" || o.status === "OPEN").length;
  const resolvedCount = observations.filter((o) => o.status === "RESOLVED").length;
  const closedCount = observations.filter((o) => o.status === "CLOSED").length;

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
        <div className="mod-card" style={{ padding: "18px 20px", display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(37,99,235,0.10)", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 700 }}>
            {observations.length}
          </div>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)" }}>Total Action Items</span>
        </div>

        <div className="mod-card" style={{ padding: "18px 20px", display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(217,119,6,0.10)", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 700 }}>
            {openCount}
          </div>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)" }}>Active / Assigned</span>
        </div>

        <div className="mod-card" style={{ padding: "18px 20px", display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(5,150,105,0.10)", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 700 }}>
            {closedCount + resolvedCount}
          </div>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)" }}>Resolved / Closed</span>
        </div>
      </div>

      <div className="mod-card">
        <div className="mod-toolbar">
          <div className="mod-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input id="ca-search" type="text" placeholder="Search actions, contractors..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select id="ca-status-filter" className="mod-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="mod-table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading corrective actions...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No corrective actions found</div>
          ) : (
            <table className="mod-table">
              <thead>
                <tr>
                  <th>Obs Ref #</th>
                  <th>Subject</th>
                  <th>Contractor</th>
                  <th>Category</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ca) => (
                  <tr key={ca.id}>
                    <td className="id-cell" style={{ fontWeight: 700, fontFamily: "monospace" }}>
                      {ca.observationNumber}
                    </td>
                    <td className="title-cell" style={{ maxWidth: 260 }}>
                      {ca.subject}
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--nne-brand-blue)" }}>{ca.assignedContractorName || "-"}</td>
                    <td>{ca.safetyCategory}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: ca.riskLevel === "HIGH" || ca.riskLevel === "CRITICAL" ? "#E32B50" : ca.riskLevel === "MEDIUM" ? "#C07D10" : "#2D7A4F",
                        }}
                      >
                        {ca.riskLevel}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${ca.status === "CLOSED" ? "badge-green" : ca.status === "REJECTED" ? "badge-red" : "badge-orange"}`}>
                        {ca.status}
                      </span>
                    </td>
                    <td>{ca.createdTime ? new Date(ca.createdTime).toISOString().split("T")[0] : "-"}</td>
                    <td>
                      <button className="mod-btn-outline" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => navigate(`/safety-observations/details/${ca.id}`)}>
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

export default SOCorrectiveActions;
