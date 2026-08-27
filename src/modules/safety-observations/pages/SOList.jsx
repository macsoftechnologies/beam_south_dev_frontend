import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import { observationService } from "../../../services/observationService";
import { SAFETY_CATEGORIES } from "../data/observations";
import "../../../styles/module-shared.css";

const BarChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#131E40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="20" y2="10" />
    <line x1="18" x2="18" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="16" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D7A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E32B50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);
const CalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C07D10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

function SOList() {
  const navigate = useNavigate();
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterContractor, setFilterContractor] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = localStorage.getItem("UserType") || "DEPARTMENT";
  const contractorId = user?.subcontractor_id || user?.contractorId;

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchObservations = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
      };
      if (userRole === "CONTRACTOR" && contractorId) {
        params.userRole = "CONTRACTOR";
        params.contractorId = contractorId;
      }
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      if (filterCategory) params.category = filterCategory;
      if (filterContractor) params.contractor = filterContractor;
      if (filterLocation) params.building = filterLocation;
      if (searchTerm) params.search = searchTerm;

      const res = await observationService.getObservations(params);
      if (res && res.data && Array.isArray(res.data)) {
        setObservations(res.data);
        setTotalCount(res.total || res.data.length);
        setTotalPages(res.totalPages || 1);
      } else if (Array.isArray(res)) {
        setObservations(res);
        setTotalCount(res.length);
        setTotalPages(1);
      } else {
        setObservations([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to load observations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservations();
  }, [currentPage, pageSize, filterStatus, filterType, filterCategory, filterContractor, filterLocation, searchTerm]);

  const uniqueContractors = useMemo(
    () => [...new Set(observations.map((o) => o.assignedContractorName).filter(Boolean))],
    [observations]
  );
  const uniqueLocations = useMemo(
    () => [...new Set(observations.map((o) => o.buildingName).filter(Boolean))],
    [observations]
  );

  const positive = observations.filter((o) => o.observationType === "POSITIVE").length;
  const needsAttn = observations.filter((o) => o.observationType === "NEEDS_ATTENTION").length;
  const posRatio = Math.round((positive / (observations.length || 1)) * 100) || 0;

  return (
    <div className="mod-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--nne-brand-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M12 11h4" />
              <path d="M12 16h4" />
              <path d="M8 11h.01" />
              <path d="M8 16h.01" />
            </svg>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--nne-brand-blue)", margin: 0 }}>
              Safety Observations
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>
            Track and manage safety observations across the site
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="mod-btn-outline" onClick={() => window.print()}>
            Print
          </button>
          <button className="mod-btn-primary" onClick={() => navigate("/safety-observations/create")}>
            + New Observation
          </button>
        </div>
      </div>

      {/* Live Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 20 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "15px 16px", position: "relative" }}>
          <div style={{ position: "absolute", top: 14, right: 14, opacity: 0.85 }}>
            <BarChartIcon />
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Total</div>
          <div style={{ fontSize: 27, fontWeight: 700, marginTop: 6, color: "#131E40" }}>{observations.length}</div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "15px 16px", position: "relative" }}>
          <div style={{ position: "absolute", top: 14, right: 14, opacity: 0.85 }}>
            <ShieldIcon />
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Positive</div>
          <div style={{ fontSize: 27, fontWeight: 700, marginTop: 6, color: "#2D7A4F" }}>{positive}</div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid #E32B50", boxShadow: "0 0 0 1px rgba(227,43,80,0.35)", borderRadius: 10, padding: "15px 16px", position: "relative" }}>
          <div style={{ position: "absolute", top: 14, right: 14, opacity: 0.85 }}>
            <AlertIcon />
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Needs Attention</div>
          <div style={{ fontSize: 27, fontWeight: 700, marginTop: 6, color: "#E32B50" }}>{needsAttn}</div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "15px 16px", position: "relative" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Positive Ratio</div>
          <div style={{ fontSize: 27, fontWeight: 700, marginTop: 6, color: "#C07D10" }}>{posRatio}%</div>
          <div style={{ height: 7, background: "#eef0f3", borderRadius: 5, marginTop: 9 }}>
            <div style={{ height: "100%", background: "#C07D10", borderRadius: 5, width: `${posRatio}%` }}></div>
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "15px 16px", position: "relative" }}>
          <div style={{ position: "absolute", top: 14, right: 14, opacity: 0.85 }}>
            <CalIcon />
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Active Assigned</div>
          <div style={{ fontSize: 27, fontWeight: 700, marginTop: 6, color: "#C07D10" }}>
            {observations.filter((o) => o.status === "ASSIGNED" || o.status === "ACCEPTED").length}
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          type="text"
          className="mod-form-input"
          placeholder="Search number, subject, category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />

        <select className="mod-form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: 150 }}>
          <option value="">All Types</option>
          <option value="POSITIVE">Positive</option>
          <option value="NEEDS_ATTENTION">Needs Attention</option>
        </select>

        <select className="mod-form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 150 }}>
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="ESCALATED">Escalated</option>
        </select>

        <select className="mod-form-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ width: 180 }}>
          <option value="">All Categories</option>
          {SAFETY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select className="mod-form-select" value={filterContractor} onChange={(e) => setFilterContractor(e.target.value)} style={{ width: 150 }}>
          <option value="">All Contractors</option>
          {uniqueContractors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select className="mod-form-select" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} style={{ width: 150 }}>
          <option value="">All Locations</option>
          {uniqueLocations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Observations Table */}
      <div className="mod-card">
        <div className="mod-table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading safety observations...</div>
          ) : observations.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No observations found.</div>
          ) : (
            <table className="mod-table">
              <thead>
                <tr>
                  <th>Ref #</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Contractor</th>
                  <th>Category</th>
                  <th>Risk</th>
                  <th>Location</th>
                  <th>Subject</th>
                  <th>Reporter</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {observations.map((o) => (
                  <tr key={o.id} onClick={() => navigate(`/safety-observations/details/${o.id}`)} style={{ cursor: "pointer" }}>
                    <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{o.observationNumber}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {o.createdTime ? new Date(o.createdTime).toISOString().split("T")[0] : "-"}
                    </td>
                    <td>
                      {String(o.observationType || o.type || "").toUpperCase() === "POSITIVE" ? (
                        <span className="badge badge-green">Positive</span>
                      ) : (
                        <span className="badge badge-red">Needs Attention</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          (o.status || "").toUpperCase() === "REJECTED"
                            ? "badge-red"
                            : (o.status || "").toUpperCase() === "ACCEPTED" || (o.status || "").toUpperCase() === "RESOLVED" || (o.status || "").toUpperCase() === "IN_PROGRESS"
                            ? "badge-orange"
                            : (o.status || "").toUpperCase() === "CLOSED"
                            ? "badge-green"
                            : "badge-blue"
                        }`}
                      >
                        {o.status || "OPEN"}
                      </span>
                    </td>
                    <td>{o.assignedContractorName || "-"}</td>
                    <td>{o.safetyCategory}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            o.riskLevel === "HIGH" || o.riskLevel === "CRITICAL"
                              ? "#E32B50"
                              : o.riskLevel === "MEDIUM"
                              ? "#C07D10"
                              : "#2D7A4F",
                        }}
                      >
                        {o.riskLevel}
                      </span>
                    </td>
                    <td>{o.buildingName || o.specificLocation || "-"}</td>
                    <td style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={o.description}>
                      {o.subject}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{o.createdByUserName || o.createdByRole}</td>
                    <td>
                      <button className="mod-btn-outline" style={{ padding: "4px 8px", fontSize: 12 }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer Controls */}
        <div className="mod-pagination">
          <div>
            Showing {observations.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} observations
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>Per page:</span>
              <select
                className="mod-filter-select"
                style={{ padding: "4px 8px", fontSize: 13 }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="mod-pagination-btns">
              <button
                className="mod-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`mod-page-btn ${p === currentPage ? "active" : ""}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                className="mod-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SOList;
