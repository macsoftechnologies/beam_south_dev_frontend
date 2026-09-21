import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { spotCheckService } from "../../../services/spotCheckService";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../../components/common/Toast/Toast";
import "./SCDashboard.css";

export default function SCList() {
  const navigate = useNavigate();
  const [spotChecks, setSpotChecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [filter, setFilter] = useState({ q: '', compliance: '', contractor: '' });
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

  const fetchSpotChecks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await spotCheckService.getSpotChecks({
        page,
        limit,
        q: filter.q || undefined,
        compliance: filter.compliance || undefined,
        contractor: filter.contractor || undefined,
      });

      setSpotChecks(data.spotChecks || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.total || 0);
    } catch (err) {
      console.error("Failed to load spot checks list", err);
      showError("Failed to load spot checks list");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filter]);

  useEffect(() => {
    fetchSpotChecks();
  }, [fetchSpotChecks]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!isAdmin) {
      showError("Only Admins and Superadmins have permission to delete spot checks.");
      return;
    }

    const confirmRes = await showDeleteConfirm(`Are you sure you want to delete Spot Check #${id}? This action cannot be undone.`);
    if (confirmRes && confirmRes.isConfirmed) {
      try {
        setIsDeleting(true);
        await spotCheckService.deleteSpotCheck(id);
        showDeleteSuccess("Spot check deleted successfully");
        await fetchSpotChecks();
      } catch (err) {
        console.error("Failed to delete spot check:", err);
        showError(err?.response?.data?.message || "Failed to delete spot check.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="sc-dashboard-container">
      <div className="dash-hero">
        <div className="dash-hero-l">
          <div>
            <h1>Spot Checks List</h1>
            <p>View all spot checks, compliance results, and PTW verifications</p>
          </div>
        </div>
        <div>
          <button className="mod-btn-primary" onClick={() => navigate('/spot-checks/create')}>+ New Spot Check</button>
        </div>
      </div>

      <div className="panel dash-tablecard">
        <div className="dd-filters">
          <input 
            className="df-input" 
            style={{ flex: 1 }} 
            placeholder="Search Reference, Activity, Building, Location, Contractor, Inspector..." 
            value={filter.q} 
            onChange={e => {
              setFilter({ ...filter, q: e.target.value });
              setPage(1);
            }} 
          />
          <select 
            className="df-input" 
            value={filter.compliance} 
            onChange={e => {
              setFilter({ ...filter, compliance: e.target.value });
              setPage(1);
            }}
          >
            <option value="">All Compliance Statuses</option>
            <option value="Yes">Compliant (PASS)</option>
            <option value="No">Non-Compliant (FAIL)</option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Compliance</th>
                <th>Activity / Task</th>
                <th>Building / Level</th>
                <th>Location</th>
                <th>Company Involved</th>
                <th>Inspector</th>
                <th>Date</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    <i className="ti ti-loader ti-spin" style={{ marginRight: 8 }}></i> Loading spot checks...
                  </td>
                </tr>
              ) : spotChecks.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    No spot checks found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                spotChecks.map((r) => {
                  const isCompliant = r.chk3_2 === 'Yes';
                  const displayId = r.spotCheckRef || `SC-${r.id}`;
                  const locationText = r.location || "-";

                  return (
                    <tr key={r.id} onClick={() => navigate(`/spot-checks/${r.id}`)} style={{ cursor: 'pointer' }}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <span style={{ 
                            background: isCompliant ? '#22c55e' : (r.chk3_2 === 'No' ? '#ef4444' : '#f59e0b'), 
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
                        <span className={`badge ${isCompliant ? 'badge-success' : 'badge-danger'}`} style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: isCompliant ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isCompliant ? '#16a34a' : '#ef4444'
                        }}>
                          {isCompliant ? 'Compliant' : (r.chk3_2 === 'No' ? 'Non-Compliant' : 'Pending')}
                        </span>
                        {r.safetyIssueRef && (
                          <div style={{ marginTop: '3px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#b91c1c',
                                background: 'rgba(239, 68, 68, 0.08)',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Linked Safety Observation"
                            >
                              <i className="ti ti-eye" style={{ fontSize: '10px' }}></i> {r.safetyIssueRef}
                            </span>
                          </div>
                        )}
                      </td>
                      <td><b>{r.activityName || "HSE Inspection"}</b></td>
                      <td>{r.buildingName ? `${r.buildingName} ${r.floorLevel ? `(${r.floorLevel})` : ''}` : (r.floorLevel || "-")}</td>
                      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={locationText}>
                        {locationText}
                      </td>
                      <td>{r.companyInvolved || "-"}</td>
                      <td>{r.inspectorName || r.createdByUserName || "-"}</td>
                      <td>{formatDate(r.date || r.createdTime)}</td>
                      <td style={{ textAlign: "center", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          className="mod-btn-icon"
                          style={{
                            border: "1px solid rgba(14, 165, 233, 0.3)",
                            color: "#0ea5e9",
                            background: "rgba(14, 165, 233, 0.06)",
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "15px",
                            marginRight: isAdmin ? "6px" : "0",
                            transition: "all 0.15s ease-in-out"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#0ea5e9";
                            e.currentTarget.style.color = "#ffffff";
                            e.currentTarget.style.borderColor = "#0ea5e9";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(14, 165, 233, 0.06)";
                            e.currentTarget.style.color = "#0ea5e9";
                            e.currentTarget.style.borderColor = "rgba(14, 165, 233, 0.3)";
                          }}
                          title="Download PDF"
                          onClick={(e) => {
                            e.stopPropagation();
                            spotCheckService.downloadSpotCheckPdf(r.id, `${r.spotCheckRef || `SC-${r.id}`}_HSE_Spot_Check.pdf`);
                          }}
                        >
                          <i className="ti ti-download"></i>
                        </button>
                        {isAdmin && (
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
                            title="Delete spot check"
                            onClick={(e) => handleDelete(e, r.id)}
                            disabled={isDeleting}
                          >
                            <i className="ti ti-trash"></i>
                          </button>
                        )}
                      </td>
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
              Showing {Math.min((page - 1) * limit + 1, totalRecords)} to {Math.min(page * limit, totalRecords)} of {totalRecords} spot checks
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
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                ← Prev
              </button>

              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-main, #334155)" }}>
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                className="mod-btn-outline"
                style={{ padding: "4px 12px", fontSize: "13px", height: "32px" }}
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
