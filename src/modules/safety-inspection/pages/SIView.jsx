import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { safetyInspectionService } from '../../../services/safetyInspectionService';
import { observationService } from '../../../services/observationService';
import { showSuccess, showError } from '../../../components/common/Toast/Toast';
import Swal from 'sweetalert2';
import "./SIView.css";

const STANDARD_CATEGORIES = [
  "1. Access / Exit",
  "2. Barriers / Signage / Shielding",
  "3. Housekeeping / Waste",
  "4. Noise / Dust / Fumes / Health Hazards",
  "5. Storage & Handling",
  "6. Electrical Hazards",
  "7. Working at Heights",
  "8. Lifting / Rigging",
  "9. Hot Works",
  "10. Mobile Elevating Work Equipment",
  "11. Lighting",
  "12. Documentation & Procedures",
  "13. Scaffold / Alloy Towers",
  "14. Slip / Trip Hazards",
  "15. PPE",
  "16. Tools & Machinery",
  "17. Environmental Hazards",
  "18. Emergency Equipment",
  "19. Excavation / Trenches",
  "20. Other"
];

export default function SIView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Observation preview modal state
  const [selectedObs, setSelectedObs] = useState(null);
  const [isLoadingObs, setIsLoadingObs] = useState(false);
  const [showObsModal, setShowObsModal] = useState(false);
  // Track per-observation status (key -> 'CLOSED'|'OPEN'|...) fetched from API
  const [obsStatusMap, setObsStatusMap] = useState({});

  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const rawRole = (localStorage.getItem("UserType") || currentUser?.role || currentUser?.userType || currentUser?.user_type || "").toUpperCase();
  const userRolesArr = Array.isArray(currentUser?.userTypes) ? currentUser.userTypes.map((t) => String(t).toUpperCase()) : [];
  const allRoles = [rawRole, ...userRolesArr].join(" ");
  const isContractor = allRoles.includes("CONTRACTOR") || allRoles.includes("SUBCONTRACTOR") || Boolean(currentUser?.subcontractor_id) || Boolean(currentUser?.contractorId) || Boolean(currentUser?.typeId && allRoles.includes("SUBCONTRACTOR"));
  const isObserver = allRoles.includes("OBSERVER");
  const isReadOnly = isContractor || isObserver;

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await safetyInspectionService.getInspectionDetails(id);
        setInspection(data);
      } catch (err) {
        console.error("Failed to load inspection details", err);
        setError("Failed to load safety inspection report.");
        showError("Failed to load safety inspection report.");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  // After inspection loads, fetch the status of every attached observation in parallel
  useEffect(() => {
    if (!inspection) return;
    const allIssues = (inspection.items || []).flatMap(item => {
      if (Array.isArray(item.issues)) return item.issues;
      if (typeof item.issues === 'string') {
        try { return JSON.parse(item.issues) || []; } catch { return []; }
      }
      return [];
    });
    if (allIssues.length === 0) return;

    const uniqueKeys = [...new Set(
      allIssues.map(iss => iss.observationId || iss.id).filter(Boolean)
    )];

    const fetchStatuses = async () => {
      const map = {};
      await Promise.all(uniqueKeys.map(async (key) => {
        try {
          const data = await observationService.getObservationDetails(key);
          const obs = data?.observation || data;
          if (obs?.status) map[String(key)] = obs.status;
        } catch {
          // silently ignore — individual observation may not be accessible
        }
      }));
      setObsStatusMap(map);
    };
    fetchStatuses();
  }, [inspection]);

  const isClosed = Boolean(inspection?.status === 'CLOSED' || inspection?.status === 'COMPLETED' || inspection?.isCompleted);

  // Derive: all observations with a known status are CLOSED
  const allIssues = (inspection?.items || []).flatMap(item => {
    if (Array.isArray(item.issues)) return item.issues;
    if (typeof item.issues === 'string') {
      try { return JSON.parse(item.issues) || []; } catch { return []; }
    }
    return [];
  });
  const issuesWithKnownStatus = allIssues.filter(iss => {
    const key = String(iss.observationId || iss.id || '');
    return key && obsStatusMap[key];
  });
  const allObsClosed = issuesWithKnownStatus.length > 0 &&
    issuesWithKnownStatus.every(iss =>
      obsStatusMap[String(iss.observationId || iss.id || '')] === 'CLOSED'
    );
  // effectiveClosed drives all status display and toggle behavior
  const effectiveClosed = isClosed || allObsClosed;

  // Auto-sync status to backend database if all attached observations are closed but DB is still IN_PROGRESS
  useEffect(() => {
    if (!inspection || isClosed || !allObsClosed) return;
    safetyInspectionService.updateInspection(inspection.id, {
      status: 'CLOSED',
      isCompleted: true
    }).then(() => {
      setInspection(prev => ({
        ...prev,
        status: 'CLOSED',
        isCompleted: true
      }));
    }).catch(err => {
      console.warn("Auto-sync inspection closed status note:", err?.message || err);
    });
  }, [allObsClosed, isClosed, inspection?.id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const handleDownloadPdf = async () => {
    if (!inspection) return;
    setIsDownloadingPdf(true);
    try {
      const refName = inspection.inspectionNumber || `SI-${inspection.id}`;
      const fileName = `${refName}_Safety_Inspection.pdf`;
      await safetyInspectionService.downloadInspectionPdf(inspection.id, fileName);
      showSuccess("Inspection PDF downloaded successfully");
    } catch (err) {
      console.error("Failed to download inspection PDF:", err);
      showError("Failed to export PDF directly. Opening browser preview...");
      const pdfUrl = safetyInspectionService.getPdfUrl(inspection.id);
      window.open(pdfUrl, '_blank');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!inspection || isReadOnly) return;
    const isCl = effectiveClosed;
    const nextStatus = isCl ? 'IN_PROGRESS' : 'CLOSED';
    
    const result = await Swal.fire({
      title: isCl ? 'Reopen Inspection?' : 'Close Inspection?',
      text: isCl
        ? 'Are you sure you want to reopen this inspection as In Progress?'
        : 'Are you sure you want to mark this inspection as Closed?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: isCl ? '#0284c7' : '#16a34a',
      cancelButtonColor: '#64748b',
      confirmButtonText: isCl ? 'Yes, Reopen' : 'Yes, Close'
    });

    if (!result.isConfirmed) return;

    setIsUpdatingStatus(true);
    try {
      await safetyInspectionService.updateInspection(inspection.id, {
        status: nextStatus,
        isCompleted: nextStatus === 'CLOSED'
      });
      setInspection(prev => ({
        ...prev,
        status: nextStatus,
        isCompleted: nextStatus === 'CLOSED'
      }));
      showSuccess(`Inspection marked as ${nextStatus === 'CLOSED' ? 'Closed' : 'In Progress'}`);
    } catch (err) {
      console.error('Failed to update inspection status:', err);
      showError(err?.response?.data?.message || 'Failed to update inspection status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleViewObservation = async (iss) => {
    const lookupKey = iss.observationId || iss.id || iss.observationNumber;
    if (!lookupKey) return;

    setShowObsModal(true);
    setIsLoadingObs(true);
    setSelectedObs(null);

    try {
      const data = await observationService.getObservationDetails(lookupKey);
      const obsData = data?.observation || data;
      setSelectedObs(obsData);
    } catch (err) {
      console.error("Failed to fetch observation details:", err);
      // Fallback with what we have in the issue tag
      setSelectedObs({
        observationNumber: iss.id || iss.observationNumber || "SO-Record",
        findingDescription: iss.text || iss.subject || "No detailed description available.",
        observationType: iss.type ? iss.type.toUpperCase() : "GENERAL"
      });
    } finally {
      setIsLoadingObs(false);
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;

    const envBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

    // If it's already an absolute URL (e.g. http:// or https://)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // If pointing to remote production while testing on localhost, map to localhost
      if (envBase.includes('localhost') && url.includes('api.beam.safesiteworks.com')) {
        return url.replace(/^https?:\/\/api\.beam\.safesiteworks\.com(\/development\/m3south)?/, envBase);
      }
      return url;
    }

    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    if (envBase) {
      return `${envBase}${cleanUrl}`;
    }

    return cleanUrl;
  };

  if (isLoading) {
    return (
      <div className="siview-page" style={{ textAlign: "center", padding: "80px 20px" }}>
        <i className="ti ti-loader ti-spin" style={{ fontSize: "32px", color: "var(--primary-color, #0ea5e9)" }}></i>
        <p style={{ marginTop: "16px", color: "var(--text-muted, #64748b)" }}>Loading Safety Inspection Report #{id}...</p>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="siview-page" style={{ textAlign: "center", padding: "80px 20px" }}>
        <i className="ti ti-alert-triangle" style={{ fontSize: "36px", color: "#ef4444" }}></i>
        <h2 style={{ marginTop: "16px" }}>Inspection Not Found</h2>
        <p style={{ color: "var(--text-muted, #64748b)" }}>{error || "Could not retrieve the requested safety inspection."}</p>
        <button className="mod-btn-primary" style={{ marginTop: "20px" }} onClick={() => navigate('/safety-inspection/list')}>
          Back to List
        </button>
      </div>
    );
  }


  const displayId = inspection.inspectionNumber || `SI${inspection.id}`;
  const performedByList = Array.isArray(inspection.performedBy) ? inspection.performedBy : (inspection.performedBy ? [inspection.performedBy] : []);
  const participantsList = Array.isArray(inspection.participants) ? inspection.participants : (inspection.participants ? [inspection.participants] : []);
  const itemsList = inspection.items && inspection.items.length > 0 
    ? inspection.items 
    : STANDARD_CATEGORIES.map((cat, i) => ({
        id: i + 1,
        itemIndex: i + 1,
        categoryName: cat,
        status: 'na'
      }));

  return (
    <div className="siview-page">
      {/* Premium Hero Header Card */}
      <div className="siview-hero-card">
        <div className="siview-hero-content">
          <div className="siview-hero-icon">
            <i className="ti ti-shield-check"></i>
          </div>
          <div className="siview-hero-text">
            <div className="siview-hero-subtitle">SAFETY INSPECTION</div>
            <h1>Record <span>{displayId}</span></h1>
            <p>Detailed compliance view of the safety inspection audit.</p>
          </div>
        </div>
        <div className="siview-hero-actions">
          <button className="siview-btn-back" onClick={() => navigate('/safety-inspection/list')}>
            <i className="ti ti-arrow-left"></i> Back to List
          </button>
          <button className="siview-btn-download" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>
            <i className={`ti ${isDownloadingPdf ? 'ti-loader ti-spin' : 'ti-download'}`}></i>
            {isDownloadingPdf ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>
      
      <div className="siview-content">
        {/* Modern Card-based Metadata Layout */}
        <div className="siview-metadata-grid">
          
          <div className="siview-card meta-card">
            <div className="meta-card-header">
              <i className="ti ti-briefcase"></i> Project Details
            </div>
            <div className="meta-card-body">
              <div className="meta-item">
                <span className="meta-label">Project</span>
                <span className="meta-value">{inspection.projectName || "M3SOUTH"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Project No.</span>
                <span className="meta-value">{inspection.projectNo || "063205-010"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Building / Location</span>
                <span className="meta-value">{inspection.buildingName || "Main Building"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Floor / Level</span>
                <span className="meta-value">{inspection.floorLevel || "-"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Inspection Date</span>
                <span className="meta-value">{inspection.inspectionDate || "-"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Status</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    className="siview-badge"
                    style={{
                      background: effectiveClosed ? '#dcfce7' : '#eff6ff',
                      color: effectiveClosed ? '#166534' : '#1e40af',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: effectiveClosed ? '#16a34a' : '#3b82f6',
                      display: 'inline-block', flexShrink: 0
                    }} />
                    {effectiveClosed ? 'Closed' : 'In Progress'}
                  </span>
                  {allObsClosed && !isClosed && (
                    <span style={{ fontSize: '11px', color: '#16a34a', fontStyle: 'italic' }}>
                      (all observations closed)
                    </span>
                  )}
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleStatusToggle}
                      disabled={isUpdatingStatus}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: '1px solid var(--border-color, #cbd5e1)',
                        backgroundColor: effectiveClosed ? 'var(--card-bg, #ffffff)' : '#22c55e',
                        color: effectiveClosed ? '#475569' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <i className={`ti ${effectiveClosed ? 'ti-rotate-clockwise' : 'ti-circle-check'}`}></i>
                      {isUpdatingStatus ? 'Updating...' : effectiveClosed ? 'Reopen' : 'Close Inspection'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="siview-card meta-card">
            <div className="meta-card-header">
              <i className="ti ti-clock"></i> Timeline
            </div>
            <div className="meta-card-body">
              <div className="meta-item">
                <span className="meta-label">Created By</span>
                <span className="meta-value">{inspection.createdByUserName || "-"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Created Date</span>
                <span className="meta-value">{formatDate(inspection.createdTime)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Last Modified By</span>
                <span className="meta-value">{inspection.modifiedByUserName || inspection.createdByUserName || "-"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Modified Date</span>
                <span className="meta-value">{formatDate(inspection.updatedTime || inspection.createdTime)}</span>
              </div>

            </div>
          </div>

          <div className="siview-card meta-card span-full">
            <div className="meta-card-header">
              <i className="ti ti-users"></i> Personnel & Participants
            </div>
            <div className="meta-card-body grid-2-col">
              <div className="meta-list-group">
                <span className="meta-label">Performed By</span>
                <ul className="meta-ul">
                  {performedByList.length > 0 ? (
                    performedByList.map((p, i) => <li key={i}><i className="ti ti-user-check"></i> {p}</li>)
                  ) : (
                    <li><i className="ti ti-user-check"></i> {inspection.createdByUserName || "Safety Inspector"}</li>
                  )}
                </ul>
              </div>
              <div className="meta-list-group">
                <span className="meta-label">Participants</span>
                <ul className="meta-ul">
                  {participantsList.length > 0 ? (
                    participantsList.map((p, i) => <li key={i}><i className="ti ti-user"></i> {p}</li>)
                  ) : (
                    <li style={{ color: "var(--text-muted)" }}>None specified</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Modern Elevated Checklist Rows */}
        <div className="siview-section-title">
          <h2>Inspection Checklist Details (20 Categories)</h2>
        </div>

        <div className="siview-checklist-wrapper">
          {itemsList.map(item => {
            const rawStatus = (item.status || 'na').toLowerCase();
            let photosList = [];
            if (Array.isArray(item.photos)) {
              photosList = item.photos;
            } else if (typeof item.photos === 'string') {
              try {
                const parsed = JSON.parse(item.photos);
                photosList = Array.isArray(parsed) ? parsed : [item.photos];
              } catch {
                photosList = item.photos ? [item.photos] : [];
              }
            }

            let issuesList = [];
            if (Array.isArray(item.issues)) {
              issuesList = item.issues;
            } else if (typeof item.issues === 'string') {
              try {
                const parsed = JSON.parse(item.issues);
                issuesList = Array.isArray(parsed) ? parsed : [item.issues];
              } catch {
                issuesList = [];
              }
            }

            return (
              <div key={item.id || item.itemIndex} className="siview-cl-card">
                <div className="siview-cl-header">
                  <div className="siview-cl-title-wrap">
                    <div className="siview-cl-title">{item.categoryName || STANDARD_CATEGORIES[(item.itemIndex || 1) - 1]}</div>
                    {item.comment && <div className="siview-cl-comment">{item.comment}</div>}
                    {item.commentAuthor && (
                      <div className="siview-cl-author">
                        Changed by {item.commentAuthor}{item.commentDate ? `, ${formatDate(item.commentDate)}` : ''}
                      </div>
                    )}
                  </div>
                  <div className="siview-cl-status-wrap">
                    <span className={`siview-badge badge-${rawStatus}`}>
                      {rawStatus === 'na' ? 'Not Applicable' : 
                       rawStatus === 'green' ? (item.isGoodPractice || issuesList.some(iss => iss.type === 'green' || iss.isGoodPractice) ? 'Passed • Good Practice' : 'Passed') : 
                       rawStatus === 'yellow' ? 'Warning / Issue' : 
                       rawStatus === 'red' ? 'Critical Action Needed' : rawStatus}
                    </span>
                  </div>
                </div>

                {(issuesList.length > 0 || photosList.length > 0) && (
                  <div className="siview-cl-details">
                    {issuesList.length > 0 && (
                      <div className="siview-cl-issues">
                        {issuesList.map((iss, i) => {
                          const isGreen = iss.type === 'green' || iss.isGoodPractice || iss.observationType === 'POSITIVE';
                          const obsKey = String(iss.observationId || iss.id || '');
                          const obsStatus = obsStatusMap[obsKey];
                          const isObsClosed = obsStatus === 'CLOSED';
                          // Dot: green when SO is closed or good-practice, otherwise type color
                          const dotClass = (isObsClosed || isGreen) ? 'issue-green' : `issue-${iss.type || 'orange'}`;
                          return (
                            <div
                              key={i}
                              className="siview-issue-tag clickable"
                              onClick={() => handleViewObservation(iss)}
                              title="Click to view full Safety Observation details"
                              style={isObsClosed
                                ? { borderColor: 'rgba(34,197,94,0.5)', background: 'rgba(34,197,94,0.06)' }
                                : isGreen ? { borderColor: 'rgba(34, 197, 94, 0.4)', background: 'rgba(34, 197, 94, 0.05)' } : {}}
                            >
                              <span className={`issue-dot ${dotClass}`}></span>
                              <span className="issue-id">{iss.id || iss.observationNumber || `SO-${i}`}</span>
                              <span className="issue-text">{iss.text || iss.subject || (isGreen ? 'Good Practice' : 'Safety Observation')}</span>
                              {isObsClosed && (
                                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '1px 5px', borderRadius: 4 }}>CLOSED</span>
                              )}
                              <i className="ti ti-external-link" style={{ marginLeft: "6px", fontSize: "12px", opacity: 0.7 }}></i>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {photosList.length > 0 && (
                      <div className="siview-cl-images">
                        {photosList.map((img, i) => (
                          <div key={i} className="siview-img-thumbnail">
                            <a href={getFullImageUrl(img)} target="_blank" rel="noopener noreferrer">
                              <img
                                src={getFullImageUrl(img)}
                                alt={`attachment-${i}`}
                                onError={(e) => {
                                  const src = e.currentTarget.src;
                                  if (src.includes('/development/m3south/uploads/')) {
                                    e.currentTarget.src = src.replace('/development/m3south/uploads/', '/uploads/');
                                  }
                                }}
                              />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Observation Details Modal */}
      {showObsModal && (
        <div className="obs-modal-overlay" onClick={() => setShowObsModal(false)}>
          <div className="obs-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="obs-modal-header">
              <div className="obs-modal-title-wrap">
                <i className="ti ti-eye" style={{ color: "var(--primary-color, #0284c7)", fontSize: "20px" }}></i>
                <h3 className="obs-modal-title">
                  {selectedObs ? (selectedObs.observationNumber || `Observation #${selectedObs.id}`) : "Observation Details"}
                </h3>
                {selectedObs?.status && (
                  <span className={`siview-badge badge-${selectedObs.status === 'CLOSED' ? 'green' : 'yellow'}`} style={{ fontSize: "11px", padding: "2px 8px" }}>
                    {selectedObs.status}
                  </span>
                )}
              </div>
              <button className="obs-modal-close-btn" onClick={() => setShowObsModal(false)}>
                <i className="ti ti-x"></i>
              </button>
            </div>

            <div className="obs-modal-body">
              {isLoadingObs ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <i className="ti ti-loader ti-spin" style={{ fontSize: "28px", color: "var(--primary-color, #0284c7)" }}></i>
                  <p style={{ marginTop: "10px", color: "var(--text-muted, #64748b)" }}>Loading observation details...</p>
                </div>
              ) : selectedObs ? (
                <>
                  <div className="obs-modal-grid">
                    <div className="obs-modal-item">
                      <span className="obs-modal-label">Category</span>
                      <span className="obs-modal-value">{selectedObs.category || selectedObs.mainCategory || "-"}</span>
                    </div>
                    <div className="obs-modal-item">
                      <span className="obs-modal-label">Subcategory / Subject</span>
                      <span className="obs-modal-value">{selectedObs.subcategory || selectedObs.subject || "-"}</span>
                    </div>
                    <div className="obs-modal-item">
                      <span className="obs-modal-label">Assigned Contractor</span>
                      <span className="obs-modal-value">{selectedObs.subcontractorName || selectedObs.contractorName || selectedObs.subcontractor || "-"}</span>
                    </div>
                    <div className="obs-modal-item">
                      <span className="obs-modal-label">Risk Level / Severity</span>
                      <span className="obs-modal-value" style={{ textTransform: "capitalize", fontWeight: 700, color: selectedObs.riskLevel === 'HIGH' || selectedObs.riskLevel === 'CRITICAL' ? '#dc2626' : '#2563eb' }}>
                        {selectedObs.riskLevel || selectedObs.observationType || "-"}
                      </span>
                    </div>
                    <div className="obs-modal-item">
                      <span className="obs-modal-label">Location / Building</span>
                      <span className="obs-modal-value">{selectedObs.buildingName || selectedObs.location || "-"}</span>
                    </div>
                    <div className="obs-modal-item">
                      <span className="obs-modal-label">Reported By</span>
                      <span className="obs-modal-value">{selectedObs.reportedByUserName || selectedObs.createdByUserName || "-"}</span>
                    </div>
                  </div>

                  <div className="obs-modal-item">
                    <span className="obs-modal-label">Finding / Observation Description</span>
                    <div className="obs-modal-desc-box">
                      {selectedObs.findingDescription || selectedObs.description || "No description provided."}
                    </div>
                  </div>

                  {selectedObs.immediateActionTaken && (
                    <div className="obs-modal-item">
                      <span className="obs-modal-label">Immediate Action Taken</span>
                      <div className="obs-modal-desc-box" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                        {selectedObs.immediateActionTaken}
                      </div>
                    </div>
                  )}

                  {selectedObs.photos && Array.isArray(selectedObs.photos) && selectedObs.photos.length > 0 && (
                    <div className="obs-modal-item">
                      <span className="obs-modal-label">Observation Photos ({selectedObs.photos.length})</span>
                      <div className="obs-modal-photos-grid">
                        {selectedObs.photos.map((p, idx) => (
                          <div key={idx} className="obs-modal-photo-thumb">
                            <a href={getFullImageUrl(p)} target="_blank" rel="noopener noreferrer">
                              <img
                                src={getFullImageUrl(p)}
                                alt={`obs-photo-${idx}`}
                                onError={(e) => {
                                  const src = e.currentTarget.src;
                                  if (src.includes('/development/m3south/uploads/')) {
                                    e.currentTarget.src = src.replace('/development/m3south/uploads/', '/uploads/');
                                  }
                                }}
                              />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
                  Observation data could not be loaded.
                </div>
              )}
            </div>

            <div className="obs-modal-footer">
              {selectedObs?.id && (
                <button
                  type="button"
                  className="siview-btn-back"
                  style={{ fontSize: "13px", padding: "8px 14px" }}
                  onClick={() => {
                    setShowObsModal(false);
                    navigate(`/safety-observations/details/${selectedObs.id}`);
                  }}
                >
                  <i className="ti ti-external-link"></i> Go to Full Observation Page
                </button>
              )}
              <button 
                type="button"
                className="siview-btn-download" 
                style={{ fontSize: "13px", padding: "8px 16px" }}
                onClick={() => setShowObsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
