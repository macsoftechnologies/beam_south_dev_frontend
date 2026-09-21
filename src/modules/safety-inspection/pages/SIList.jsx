import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { safetyInspectionService } from "../../../services/safetyInspectionService";
import "./SIDashboard.css"; // Reusing dashboard CSS

export default function SIList() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [filter, setFilter] = useState({ q: '', contractor: '', status: '' });
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const roleUpper = String(currentUser?.role || '').toUpperCase();
  const isAdmin = roleUpper.includes('ADMIN') || roleUpper.includes('SUPERADMIN');

  const fetchInspections = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await safetyInspectionService.getInspections({
        page,
        limit,
        search: filter.q,
        contractor: filter.contractor,
        status: filter.status,
      });

      setInspections(data.inspections || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.total || 0);
    } catch (err) {
      console.error("Failed to load inspections list", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filter]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!isAdmin) {
      alert("Only Admins and Superadmins have permission to delete inspections.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete Safety Inspection #${id}? This action cannot be undone.`)) {
      try {
        setIsDeleting(true);
        await safetyInspectionService.deleteInspection(id, {
          userId: currentUser?.id,
          userRole: currentUser?.role || 'ADMIN',
        });
        await fetchInspections();
      } catch (err) {
        console.error("Failed to delete inspection:", err);
        alert(err?.response?.data?.message || "Failed to delete inspection.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="si-dashboard-container">
      <div className="dash-hero">
        <div className="dash-hero-l">
          <div>
            <h1>Safety Inspections List</h1>
            <p>View all safety inspections, audit trails, and current compliance statuses</p>
          </div>
        </div>
        <div>
          <button className="mod-btn-primary" onClick={() => navigate("/safety-inspection/create")}>+ New Inspection</button>
        </div>
      </div>

      <div className="panel dash-tablecard">
        <div className="dd-filters">
          <input 
            className="df-input" 
            style={{ flex: 1 }} 
            placeholder="Search Reference, Building, Location, Inspector..." 
            value={filter.q} 
            onChange={e => {
              setFilter({ ...filter, q: e.target.value });
              setPage(1);
            }} 
          />
          <select 
            className="df-input" 
            value={filter.status} 
            onChange={e => {
              setFilter({ ...filter, status: e.target.value });
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="CLOSED">Closed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Status</th>
                <th>Building / Location</th>
                <th>Floor / Level</th>
                <th>Room(s)</th>
                <th>Inspector</th>
                <th>Date Modified</th>
                {isAdmin && <th style={{ textAlign: "center" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    <i className="ti ti-loader ti-spin" style={{ marginRight: 8 }}></i> Loading inspections...
                  </td>
                </tr>
              ) : inspections.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    No safety inspections found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                inspections.map((r) => {
                  const isClosed = r.status === 'CLOSED' || r.status === 'COMPLETED' || r.isCompleted;
                  const displayId = r.inspectionNumber || `SI${r.id}`;
                  const roomsText = Array.isArray(r.selectedRooms) ? r.selectedRooms.join(", ") : (r.selectedRooms || r.specificLocation || "-");
                  const inspectorName = Array.isArray(r.performedBy) && r.performedBy.length > 0 ? r.performedBy[0] : (r.modifiedByUserName || r.createdByUserName || "-");

                  return (
                    <tr key={r.id} onClick={() => navigate(`/safety-inspection/${r.id}`)} style={{ cursor: 'pointer' }}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <span style={{ 
                            background: isClosed ? '#22c55e' : '#f59e0b', 
                            width: '10px', 
                            height: '10px', 
                            minWidth: '10px',
                            minHeight: '10px',
                            maxWidth: '10px',
                            maxHeight: '10px',
                            flexShrink: 0,
                            borderRadius: '50%', 
                            marginRight: '8px',
                            display: 'inline-block'
                          }}></span>
                          <span style={{ color: '#0ea5e9', fontWeight: 600, whiteSpace: 'nowrap' }}>{displayId}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isClosed ? 'badge-success' : 'badge-warning'}`} style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: isClosed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isClosed ? '#16a34a' : '#d97706'
                        }}>
                          {isClosed ? 'Closed' : (r.status === 'DRAFT' ? 'Draft' : 'In Progress')}
                        </span>
                      </td>
                      <td>{r.buildingName || "Main Building"}</td>
                      <td>{r.floorLevel || "-"}</td>
                      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={roomsText}>
                        {roomsText}
                      </td>
                      <td>{inspectorName}</td>
                      <td>{formatDate(r.updatedTime || r.createdTime)}</td>
                      {isAdmin && (
                        <td style={{ textAlign: "center" }} onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            className="mod-btn-icon-danger"
                            style={{
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              color: "#ef4444",
                              background: "rgba(239, 68, 68, 0.06)",
                              width: "32px",
                              height: "32px",
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              padding: 0,
                              fontSize: "15px",
                              transition: "all 0.15s ease-in-out"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#ef4444";
                              e.currentTarget.style.color = "#ffffff";
                              e.currentTarget.style.borderColor = "#ef4444";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(239, 68, 68, 0.06)";
                              e.currentTarget.style.color = "#ef4444";
                              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                            }}
                            title="Delete inspection"
                            onClick={(e) => handleDelete(e, r.id)}
                            disabled={isDeleting}
                          >
                            <i className="ti ti-trash"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Bar ── */}
        {!isLoading && totalRecords > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderTop: "1px solid var(--border-color, #e2e8f0)",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
              Showing {Math.min((page - 1) * limit + 1, totalRecords)} to {Math.min(page * limit, totalRecords)} of {totalRecords} inspections
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <select
                className="df-input"
                style={{ width: "auto", padding: "4px 8px", fontSize: "13px" }}
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>

              <button
                type="button"
                className="mod-btn-outline"
                style={{ padding: "4px 12px", fontSize: "13px", height: "32px" }}
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
              >
                &larr; Prev
              </button>

              <span style={{ fontSize: "13px", fontWeight: 500, padding: "0 6px" }}>
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                className="mod-btn-outline"
                style={{ padding: "4px 12px", fontSize: "13px", height: "32px" }}
                disabled={page >= totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
