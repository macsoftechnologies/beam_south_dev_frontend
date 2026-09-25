import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { spotCheckService } from "../../../services/spotCheckService";
import { getBuildings, getContractors } from "../../../services/authService";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../../components/common/Toast/Toast";
import Swal from "sweetalert2";
import "./SCDashboard.css";

// ── Contractor Logo Helpers ──
const getLogoUrl = (logoVal) => {
  if (!logoVal) return null;
  if (logoVal.startsWith("data:") || logoVal.startsWith("http://") || logoVal.startsWith("https://")) return logoVal;
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  return `${baseUrl}/subcontractors/${logoVal}`;
};

const findContractorLogo = (contractorName, contractorsList = []) => {
  if (!contractorName || contractorName === "Unassigned" || contractorName === "—") return null;
  const match = (contractorsList || []).find((c) => {
    const cName = c.company_name || c.companyName || c.subContractorName || c.subcontractor_name || c.name || "";
    return (
      cName.toLowerCase().trim() === String(contractorName).toLowerCase().trim() ||
      cName.toLowerCase().includes(String(contractorName).toLowerCase().trim()) ||
      String(contractorName).toLowerCase().includes(cName.toLowerCase().trim())
    );
  });
  return match?.logo || match?.logo_url || match?.company_logo || match?.logoFile || null;
};

const getInitials = (n) => {
  if (!n) return "??";
  let clean = String(n).replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const words = clean.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + (words[1] ? words[1][0] : "")).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = ["#0284C7", "#0D9488", "#D97706", "#7C3AED", "#DB2777", "#4F46E5"];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const ContractorBadge = ({ name, contractorsList, size = 24 }) => {
  const [imgError, setImgError] = useState(false);
  if (!name || name === "-") return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const rawLogo = findContractorLogo(name, contractorsList);
  const logoUrl = getLogoUrl(rawLogo);
  const color = getAvatarColor(name);
  const initials = getInitials(name);
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, maxWidth: 180 }}>
      {logoUrl && !imgError ? (
        <div style={{
          width: size, height: size, borderRadius: 5, flexShrink: 0,
          background: "#ffffff", border: "1px solid var(--border-color)",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 2
        }}>
          <img
            src={logoUrl}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div style={{
          width: size, height: size, borderRadius: 5, flexShrink: 0,
          background: `${color}22`, color: color, border: `1px solid ${color}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: Math.max(9, Math.floor(size * 0.42)), fontWeight: 700, letterSpacing: "0.3px"
        }}>
          {initials}
        </div>
      )}
      <span style={{
        fontWeight: 500, color: "var(--text-main)", whiteSpace: "nowrap",
        overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.78rem"
      }} title={name}>{name}</span>
    </div>
  );
};

export default function SCList() {
  const navigate = useNavigate();
  const [spotChecks, setSpotChecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [filter, setFilter] = useState({ q: '', compliance: '', building: '', company: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Dropdown option lists
  const [buildingsList, setBuildingsList] = useState([]);
  const [contractorsList, setContractorsList] = useState([]);

  // Load dropdown data once on mount
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          getBuildings(1, 1000),
          getContractors(1, 1000).catch(() => ({ data: [] }))
        ]);
        const rawB = bRes?.data?.rows || bRes?.data || bRes || [];
        setBuildingsList(Array.isArray(rawB) ? rawB : []);
        const rawC = cRes?.data?.rows || cRes?.data || cRes?.subContractors || cRes || [];
        let cList = Array.isArray(rawC) ? [...rawC] : [];
        const hasNne = cList.some(c => String(c.subContractorName || c.company_name || c.name || '').toUpperCase().includes('NNE'));
        if (!hasNne) cList.push({ id: 'NNE', subContractorName: 'NNE', name: 'NNE' });
        setContractorsList(cList);
      } catch (err) {
        console.error('Failed to load filter dropdowns', err);
      }
    };
    loadDropdowns();
  }, []);

  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const rawRoleAdmin = (localStorage.getItem("UserType") || currentUser?.role || currentUser?.userType || currentUser?.user_type || "").toUpperCase();
  const userRolesArrAdmin = Array.isArray(currentUser?.userTypes) ? currentUser.userTypes.map((t) => String(t).toUpperCase()) : [];
  const allRolesAdmin = [rawRoleAdmin, ...userRolesArrAdmin].join(" ");
  const isAdmin = (allRolesAdmin.includes("ADMIN") || allRolesAdmin.includes("SUPERADMIN") || Boolean(currentUser?.isSuperAdmin));

  const fetchSpotChecks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await spotCheckService.getSpotChecks({
        page,
        limit,
        q: filter.q || undefined,
        compliance: filter.compliance || undefined,
        contractor: filter.company || undefined,
        building: filter.building || undefined,
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

  const handleDownloadPdf = async (r, e) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Include Attached Files?",
      text: "Do you want to combine attached document files into the exported PDF? (Selecting 'No' will still display all attachment details on the form without appending the document files).",
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Yes, Combine Files",
      denyButtonText: "No, Form Only",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#F97316",
      denyButtonColor: "#64748b"
    });

    if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
      return;
    }

    const includeAttachments = result.isConfirmed;
    try {
      await spotCheckService.downloadSpotCheckPdf(r.id, `${r.spotCheckRef || `SC-${r.id}`}_HSE_Spot_Check.pdf`, includeAttachments);
      showSuccess("PDF export downloaded successfully");
    } catch (err) {
      console.error('Failed to download spot check PDF:', err);
      showError("Failed to export PDF directly. Opening browser preview...");
      const pdfUrl = spotCheckService.getPdfUrl(r.id, includeAttachments);
      window.open(pdfUrl, '_blank');
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

  const rawRole = (localStorage.getItem("UserType") || currentUser?.role || currentUser?.userType || currentUser?.user_type || "").toUpperCase();
  const userRolesArr = Array.isArray(currentUser?.userTypes) ? currentUser.userTypes.map((t) => String(t).toUpperCase()) : [];
  const allRoles = [rawRole, ...userRolesArr].join(" ");
  const isContractor = allRoles.includes("CONTRACTOR") || allRoles.includes("SUBCONTRACTOR") || Boolean(currentUser?.subcontractor_id) || Boolean(currentUser?.contractorId) || Boolean(currentUser?.typeId && allRoles.includes("SUBCONTRACTOR"));
  const isObserver = allRoles.includes("OBSERVER");
  const isReadOnly = isContractor || isObserver;

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
          {!isReadOnly && (
            <button className="mod-btn-primary" onClick={() => navigate('/spot-checks/create')}>+ New Spot Check</button>
          )}
        </div>
      </div>

      <div className="panel dash-tablecard">
        <div className="dd-filters" style={{ flexWrap: 'wrap', gap: '8px' }}>
          {/* Text search */}
          <input
            className="df-input"
            style={{ flex: '1 1 260px', minWidth: 200 }}
            placeholder="Search Reference, Activity, Inspector..."
            value={filter.q}
            onChange={e => {
              setFilter({ ...filter, q: e.target.value });
              setPage(1);
            }}
          />

          {/* Building dropdown */}
          <select
            className="df-input"
            style={{ flex: '0 1 200px', minWidth: 160 }}
            value={filter.building}
            onChange={e => {
              setFilter({ ...filter, building: e.target.value });
              setPage(1);
            }}
          >
            <option value="">All Buildings</option>
            {buildingsList.map(b => (
              <option key={b.build_id || b.id} value={b.building_name || b.name}>
                {b.building_name || b.name}
              </option>
            ))}
          </select>

          {/* Company / Contractor dropdown */}
          <select
            className="df-input"
            style={{ flex: '0 1 200px', minWidth: 160 }}
            value={filter.company}
            onChange={e => {
              setFilter({ ...filter, company: e.target.value });
              setPage(1);
            }}
          >
            <option value="">All Companies</option>
            {contractorsList.map((c, i) => {
              const name = c.subContractorName || c.company_name || c.contractor_name || c.name || `Contractor ${c.id || i}`;
              return <option key={c.id || i} value={name}>{name}</option>;
            })}
          </select>

          {/* Compliance dropdown */}
          <select
            className="df-input"
            style={{ flex: '0 1 180px', minWidth: 150 }}
            value={filter.compliance}
            onChange={e => {
              setFilter({ ...filter, compliance: e.target.value });
              setPage(1);
            }}
          >
            <option value="">All Compliance</option>
            <option value="Yes">Compliant (PASS)</option>
            <option value="No">Non-Compliant (FAIL)</option>
          </select>

          {/* Clear all filters */}
          {(filter.q || filter.building || filter.company || filter.compliance) && (
            <button
              type="button"
              style={{
                flex: '0 0 auto',
                padding: '0 14px',
                height: '36px',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '6px',
                background: 'transparent',
                color: 'var(--text-muted, #64748b)',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap'
              }}
              onClick={() => { setFilter({ q: '', compliance: '', building: '', company: '' }); setPage(1); }}
            >
              <i className="ti ti-x" style={{ fontSize: 13 }}></i> Clear
            </button>
          )}
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
                      <td style={{ maxWidth: 200 }}>
                        <ContractorBadge name={r.companyInvolved || "-"} contractorsList={contractorsList} size={24} />
                      </td>
                      <td>{r.inspectorName || r.createdByUserName || "-"}</td>
                      <td>{formatDate(r.date || r.createdTime)}</td>
                      <td style={{ textAlign: "center", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                        {/* View Button */}
                        <button
                          type="button"
                          style={{
                            border: "1px solid rgba(99, 102, 241, 0.3)",
                            color: "#6366f1",
                            background: "rgba(99, 102, 241, 0.06)",
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "15px",
                            marginRight: "6px",
                            transition: "all 0.15s ease-in-out"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#6366f1";
                            e.currentTarget.style.color = "#ffffff";
                            e.currentTarget.style.borderColor = "#6366f1";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(99, 102, 241, 0.06)";
                            e.currentTarget.style.color = "#6366f1";
                            e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                          }}
                          title="View Spot Check"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/spot-checks/${r.id}`);
                          }}
                        >
                          <i className="ti ti-eye"></i>
                        </button>
                        {/* Download PDF Button */}
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
                            marginRight: isAdmin && !isReadOnly ? "6px" : "0",
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
                          onClick={(e) => handleDownloadPdf(r, e)}
                        >
                          <i className="ti ti-download"></i>
                        </button>
                        {isAdmin && !isReadOnly && (
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
