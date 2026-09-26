import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { safetyInspectionService } from "../../../services/safetyInspectionService";
import { observationService } from "../../../services/observationService";
import { getBuildings, getFloors, getRooms } from "../../../services/authService";
import "./SIDashboard.css"; // Reusing dashboard CSS

export default function SIList() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [filter, setFilter] = useState({
    q: '',
    contractor: '',
    status: '',
    building: '',
    floor: '',
    room: ''
  });
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Track per-observation status (key -> 'CLOSED'|'OPEN'|...) fetched from API
  const [obsStatusMap, setObsStatusMap] = useState({});

  // Selector data
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const roleUpper = String(currentUser?.role || '').toUpperCase();
  const isAdmin = roleUpper.includes('ADMIN') || roleUpper.includes('SUPERADMIN');

  useEffect(() => {
    const loadSelectors = async () => {
      try {
        const [bRes, fRes, rRes] = await Promise.all([
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getRooms(1, 20000),
        ]);
        setBuildingsList(bRes?.data ?? []);
        setFloorsList(fRes?.data ?? []);
        setRoomsList(rRes?.data?.rows ?? rRes?.data ?? rRes ?? []);
      } catch (err) {
        console.error("Failed to load location filters data", err);
      }
    };
    loadSelectors();
  }, []);

  // Cascading floor options based on selected building
  const availableFloors = useMemo(() => {
    if (!filter.building) {
      return floorsList;
    }
    return floorsList.filter(f => String(f.build_id) === String(filter.building));
  }, [filter.building, floorsList]);

  // Cascading room options based on selected building & floor
  const availableRooms = useMemo(() => {
    let rooms = roomsList;

    if (filter.building) {
      const buildingFloorIds = new Set(
        floorsList
          .filter(f => String(f.build_id) === String(filter.building))
          .map(f => String(f.fl_id))
      );
      rooms = rooms.filter(r => 
        (r.building_id && String(r.building_id) === String(filter.building)) ||
        (r.fl_id && buildingFloorIds.has(String(r.fl_id)))
      );
    }

    if (filter.floor) {
      const matchedFloor = floorsList.find(f => f.floor_name === filter.floor);
      if (matchedFloor) {
        rooms = rooms.filter(r => String(r.fl_id) === String(matchedFloor.fl_id));
      } else {
        rooms = rooms.filter(r => 
          String(r.floor_name || r.level || "").toLowerCase() === filter.floor.toLowerCase()
        );
      }
    }

    const seen = new Set();
    const uniqueRooms = [];
    rooms.forEach(r => {
      const rName = r.room_name || r.name || r.room;
      if (rName && !seen.has(rName.trim())) {
        seen.add(rName.trim());
        uniqueRooms.push({ ...r, displayName: rName.trim() });
      }
    });

    return uniqueRooms.sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true }));
  }, [filter.building, filter.floor, roomsList, floorsList]);

  const handleBuildingChange = (e) => {
    const val = e.target.value;
    setFilter(prev => ({
      ...prev,
      building: val,
      floor: '',
      room: ''
    }));
    setPage(1);
  };

  const handleFloorChange = (e) => {
    const val = e.target.value;
    setFilter(prev => ({
      ...prev,
      floor: val,
      room: ''
    }));
    setPage(1);
  };

  const handleRoomChange = (e) => {
    const val = e.target.value;
    setFilter(prev => ({
      ...prev,
      room: val
    }));
    setPage(1);
  };

  const fetchInspections = useCallback(async () => {
    setIsLoading(true);
    try {
      const selectedBuildingObj = buildingsList.find(b => String(b.build_id || b.id) === String(filter.building));
      const data = await safetyInspectionService.getInspections({
        page,
        limit,
        search: filter.q,
        contractor: filter.contractor,
        status: filter.status,
        building: selectedBuildingObj?.building_name || filter.building || undefined,
        floor: filter.floor || undefined,
        room: filter.room || undefined,
      });

      setInspections(data.inspections || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.total || 0);
    } catch (err) {
      console.error("Failed to load inspections list", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filter, buildingsList]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  // After inspections load, check statuses of attached observations for non-closed inspections
  useEffect(() => {
    if (!inspections || inspections.length === 0) return;

    const keysToFetch = [];
    inspections.forEach((insp) => {
      const isCl = insp.status === 'CLOSED' || insp.status === 'COMPLETED' || insp.isCompleted;
      if (!isCl && Array.isArray(insp.items)) {
        insp.items.forEach((item) => {
          let issues = [];
          if (Array.isArray(item.issues)) issues = item.issues;
          else if (typeof item.issues === 'string') {
            try { issues = JSON.parse(item.issues) || []; } catch {}
          }
          if (Array.isArray(issues)) {
            issues.forEach((iss) => {
              const k = iss.observationId || iss.id;
              if (k && !obsStatusMap[String(k)]) {
                keysToFetch.push(k);
              }
            });
          }
        });
      }
    });

    const uniqueKeys = [...new Set(keysToFetch)];
    if (uniqueKeys.length === 0) return;

    let isMounted = true;
    Promise.all(uniqueKeys.map(async (key) => {
      try {
        const data = await observationService.getObservationDetails(key);
        const obs = data?.observation || data;
        return { key: String(key), status: obs?.status };
      } catch {
        return null;
      }
    })).then((results) => {
      if (!isMounted) return;
      const newMap = {};
      results.forEach((res) => {
        if (res && res.status) newMap[res.key] = res.status;
      });
      if (Object.keys(newMap).length > 0) {
        setObsStatusMap((prev) => ({ ...prev, ...newMap }));
      }
    });

    return () => { isMounted = false; };
  }, [inspections]);

  // If all attached observations of an inspection are closed, auto-sync backend DB record
  useEffect(() => {
    if (!inspections || inspections.length === 0) return;
    inspections.forEach((insp) => {
      const isClDirect = insp.status === 'CLOSED' || insp.status === 'COMPLETED' || insp.isCompleted;
      if (isClDirect) return;
      const allIssues = (insp.items || []).flatMap((item) => {
        if (Array.isArray(item.issues)) return item.issues;
        if (typeof item.issues === 'string') {
          try { return JSON.parse(item.issues) || []; } catch { return []; }
        }
        return [];
      });
      const issuesWithKnownStatus = allIssues.filter((iss) => {
        const key = String(iss.observationId || iss.id || '');
        return key && obsStatusMap[key];
      });
      const allClosed = issuesWithKnownStatus.length > 0 &&
        issuesWithKnownStatus.every((iss) =>
          obsStatusMap[String(iss.observationId || iss.id || '')] === 'CLOSED'
        );
      if (allClosed) {
        safetyInspectionService.updateInspection(insp.id, {
          status: 'CLOSED',
          isCompleted: true,
          actionType: 'CLOSED',
          remarks: 'Inspection automatically closed (all attached observations resolved & closed)',
          modifiedByUserId: currentUser?.id,
          modifiedByUserName: currentUser?.name || currentUser?.username || 'System Auto-sync',
          modifiedByUserRole: currentUser?.role || 'SYSTEM'
        }).catch(() => {});
      }
    });
  }, [obsStatusMap, inspections]);

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

  const handleDownloadPdf = async (e, inspection) => {
    e.stopPropagation();
    if (!inspection) return;
    setDownloadingId(inspection.id);
    try {
      const refName = inspection.inspectionNumber || `SI-${inspection.id}`;
      const fileName = `${refName}_Safety_Inspection.pdf`;
      await safetyInspectionService.downloadInspectionPdf(inspection.id, fileName);
    } catch (err) {
      console.error("Failed to download inspection PDF:", err);
      const pdfUrl = safetyInspectionService.getPdfUrl(inspection.id);
      window.open(pdfUrl, '_blank');
    } finally {
      setDownloadingId(null);
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

  const rawRole = (localStorage.getItem("UserType") || currentUser?.role || currentUser?.userType || currentUser?.user_type || "").toUpperCase();
  const userRolesArr = Array.isArray(currentUser?.userTypes) ? currentUser.userTypes.map((t) => String(t).toUpperCase()) : [];
  const allRoles = [rawRole, ...userRolesArr].join(" ");
  const isContractor = allRoles.includes("CONTRACTOR") || allRoles.includes("SUBCONTRACTOR") || Boolean(currentUser?.subcontractor_id) || Boolean(currentUser?.contractorId) || Boolean(currentUser?.typeId && allRoles.includes("SUBCONTRACTOR"));
  const isObserver = allRoles.includes("OBSERVER");
  const isReadOnly = isContractor || isObserver;

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
          {!isReadOnly && (
            <button className="mod-btn-primary" onClick={() => navigate("/safety-inspection/create")}>+ New Inspection</button>
          )}
        </div>
      </div>

      <div className="panel dash-tablecard">
        <div className="dd-filters" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input 
            className="df-input" 
            style={{ flex: '1 1 200px', minWidth: '180px' }} 
            placeholder="Search Reference, Building, Location, Inspector..." 
            value={filter.q} 
            onChange={e => {
              setFilter({ ...filter, q: e.target.value });
              setPage(1);
            }} 
          />
          <select 
            className="df-input" 
            style={{ minWidth: '130px' }}
            value={filter.building} 
            onChange={handleBuildingChange}
          >
            <option value="">All Buildings</option>
            {buildingsList.map(b => (
              <option key={b.build_id || b.id} value={b.build_id || b.id}>
                {b.building_name}
              </option>
            ))}
          </select>
          <select 
            className="df-input" 
            style={{ minWidth: '130px' }}
            value={filter.floor} 
            onChange={handleFloorChange}
          >
            <option value="">All Floors</option>
            {availableFloors.map((f, idx) => (
              <option key={f.fl_id || idx} value={f.floor_name}>
                {f.floor_name}
              </option>
            ))}
          </select>
          <select 
            className="df-input" 
            style={{ minWidth: '130px' }}
            value={filter.room} 
            onChange={handleRoomChange}
          >
            <option value="">All Rooms</option>
            {availableRooms.map((r, idx) => (
              <option key={r.id || idx} value={r.displayName}>
                {r.displayName}
              </option>
            ))}
          </select>
          <select 
            className="df-input" 
            style={{ minWidth: '120px' }}
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
          {(filter.q || filter.status || filter.building || filter.floor || filter.room) && (
            <button
              type="button"
              className="mod-btn-outline"
              style={{ height: '30px', padding: '0 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => {
                setFilter({ q: '', status: '', building: '', floor: '', room: '', contractor: '' });
                setPage(1);
              }}
              title="Reset all filters"
            >
              <i className="ti ti-x"></i> Clear
            </button>
          )}
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
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    <i className="ti ti-loader ti-spin" style={{ marginRight: 8 }}></i> Loading inspections...
                  </td>
                </tr>
              ) : inspections.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    No safety inspections found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                inspections.map((r) => {
                  const isClosedDirect = r.status === 'CLOSED' || r.status === 'COMPLETED' || r.isCompleted;
                  const allIssues = (r.items || []).flatMap((item) => {
                    if (Array.isArray(item.issues)) return item.issues;
                    if (typeof item.issues === 'string') {
                      try { return JSON.parse(item.issues) || []; } catch { return []; }
                    }
                    return [];
                  });
                  const issuesWithKnownStatus = allIssues.filter((iss) => {
                    const key = String(iss.observationId || iss.id || '');
                    return key && obsStatusMap[key];
                  });
                  const allObsClosed = issuesWithKnownStatus.length > 0 &&
                    issuesWithKnownStatus.every((iss) =>
                      obsStatusMap[String(iss.observationId || iss.id || '')] === 'CLOSED'
                    );
                  const isClosed = isClosedDirect || allObsClosed;
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
                      <td style={{ textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                          {/* View Button */}
                          <button
                            type="button"
                            style={{
                              border: "1px solid rgba(148, 163, 184, 0.5)",
                              color: "#475569",
                              background: "rgba(241, 245, 249, 0.4)",
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
                              e.currentTarget.style.background = "#e2e8f0";
                              e.currentTarget.style.color = "#1e293b";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(241, 245, 249, 0.4)";
                              e.currentTarget.style.color = "#475569";
                            }}
                            title="View Details"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/safety-inspection/${r.id}`);
                            }}
                          >
                            <i className="ti ti-eye"></i>
                          </button>

                          {/* Edit / Reopen Button */}
                          {!isReadOnly && (
                            <button
                              type="button"
                              style={{
                                border: "1px solid rgba(2, 132, 199, 0.3)",
                                color: "#0284c7",
                                background: "rgba(2, 132, 199, 0.06)",
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
                                e.currentTarget.style.background = "#0284c7";
                                e.currentTarget.style.color = "#ffffff";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(2, 132, 199, 0.06)";
                                e.currentTarget.style.color = "#0284c7";
                              }}
                              title={r.status === 'CLOSED' || r.isCompleted ? "Reopen / Edit Inspection" : "Edit Inspection"}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/safety-inspection/edit/${r.id}`);
                              }}
                            >
                              <i className={r.status === 'CLOSED' || r.isCompleted ? "ti ti-rotate-clockwise" : "ti ti-pencil"}></i>
                            </button>
                          )}

                          {/* Download Button */}
                          <button
                            type="button"
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
                              transition: "all 0.15s ease-in-out"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#0ea5e9";
                              e.currentTarget.style.color = "#ffffff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(14, 165, 233, 0.06)";
                              e.currentTarget.style.color = "#0ea5e9";
                            }}
                            title="Download PDF"
                            onClick={(e) => handleDownloadPdf(e, r)}
                            disabled={downloadingId === r.id}
                          >
                            <i className={downloadingId === r.id ? "ti ti-loader ti-spin" : "ti ti-download"}></i>
                          </button>

                          {/* Delete Button */}
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
                              title="Delete inspection"
                              onClick={(e) => handleDelete(e, r.id)}
                              disabled={isDeleting}
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          )}
                        </div>
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
