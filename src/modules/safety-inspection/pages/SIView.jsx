import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { safetyInspectionService } from '../../../services/safetyInspectionService';
import { observationService } from '../../../services/observationService';
import { showSuccess, showError } from '../../../components/common/Toast/Toast';
import Swal from 'sweetalert2';
import { parseUTCToDate } from '../../../utils/dateUtils';
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
  // Track per-observation status and full details fetched from API
  const [obsStatusMap, setObsStatusMap] = useState({});
  const [obsDetailsMap, setObsDetailsMap] = useState({});
  // Lightbox / Image zoom state
  const [previewImage, setPreviewImage] = useState(null);

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
      const statusMap = {};
      const detailsMap = {};
      await Promise.all(uniqueKeys.map(async (key) => {
        try {
          const data = await observationService.getObservationDetails(key);
          const obs = data?.observation || data;
          if (obs?.status) statusMap[String(key)] = obs.status;
          if (obs) detailsMap[String(key)] = obs;
        } catch {
          // silently ignore — individual observation may not be accessible
        }
      }));
      setObsStatusMap(statusMap);
      setObsDetailsMap(detailsMap);
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
      isCompleted: true,
      actionType: 'CLOSED',
      remarks: 'Inspection automatically closed (all attached observations resolved/closed)',
      modifiedByUserId: currentUser?.id,
      modifiedByUserName: currentUser?.name || currentUser?.username || 'System Auto-sync',
      modifiedByUserRole: currentUser?.role || rawRole || 'SYSTEM'
    }).then(async () => {
      const refreshed = await safetyInspectionService.getInspectionDetails(inspection.id);
      setInspection(refreshed);
    }).catch(err => {
      console.warn("Auto-sync inspection closed status note:", err?.message || err);
    });
  }, [allObsClosed, isClosed, inspection?.id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = parseUTCToDate(dateStr) || new Date(dateStr);
      if (!d || isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleString("en-GB", {
        timeZone: "Europe/Copenhagen",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
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
        isCompleted: nextStatus === 'CLOSED',
        actionType: nextStatus === 'CLOSED' ? 'CLOSED' : 'REOPENED',
        remarks: nextStatus === 'CLOSED' ? 'Safety inspection marked as closed' : 'Safety inspection reopened',
        modifiedByUserId: currentUser?.id,
        modifiedByUserName: currentUser?.name || currentUser?.username || 'Safety Inspector',
        modifiedByUserRole: currentUser?.role || rawRole || 'DEPARTMENT'
      });
      const refreshed = await safetyInspectionService.getInspectionDetails(inspection.id);
      setInspection(refreshed);
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

  const parsePhotosList = (rawPhotos) => {
    if (!rawPhotos) return [];
    if (Array.isArray(rawPhotos)) return rawPhotos.filter(Boolean);
    if (typeof rawPhotos === 'string' && rawPhotos.trim()) {
      try {
        const parsed = JSON.parse(rawPhotos);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [rawPhotos];
      } catch {
        return rawPhotos.includes(',')
          ? rawPhotos.split(',').map(s => s.trim()).filter(Boolean)
          : [rawPhotos];
      }
    }
    return [];
  };

  const getFullImageUrl = (rawInput, defaultFolder = 'safety-inspections') => {
    if (!rawInput) return '';
    const raw = typeof rawInput === 'object' && rawInput !== null
      ? (rawInput.serverUrl || rawInput.previewUrl || rawInput.url || '')
      : String(rawInput || '');

    if (!raw) return '';
    if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

    const envBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://api.beam.safesiteworks.com/development/m3south').replace(/\/+$/, '');
    const cleanRaw = raw.replace(/\\/g, '/').trim();
    const filename = cleanRaw.split('/').pop()?.split('\\').pop()?.split('?')[0] || cleanRaw;

    // If observation photo, target observation route which is served directly by Nginx
    if (defaultFolder === 'observations' || cleanRaw.includes('/observations/')) {
      return `${envBase}/observations/${filename}`;
    }

    // For safety inspection photos, route to the backend controller endpoint `photo-preview?file=...`
    // This query-based route completely bypasses aaPanel Nginx's static image intercept rule
    return `${envBase}/safety-inspections/photo-preview?file=${encodeURIComponent(filename)}`;
  };

  const handleImageError = (e, defaultFolder = 'safety-inspections') => {
    const current = e.currentTarget.src || '';
    const filename = current.split('/').pop()?.split('\\').pop()?.split('?')[0] || '';
    const envBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://api.beam.safesiteworks.com/development/m3south').replace(/\/+$/, '');

    // Avoid infinite loop if placeholder fails
    if (current.includes('placeholder') || current.includes('placehold.co')) return;

    if (current.includes('/photo-preview')) {
      // 1. If photo-preview endpoint is still deploying or failed, try the observations directory
      e.currentTarget.src = `${envBase}/observations/${filename}`;
    } else if (current.includes('/observations/')) {
      // 2. Try the direct photo/:filename route
      e.currentTarget.src = `${envBase}/safety-inspections/photo/${filename}`;
    } else if (current.includes('/safety-inspections/photo/')) {
      // 3. Try standard uploads
      e.currentTarget.src = `${envBase}/uploads/safety-inspections/${filename}`;
    } else if (current.includes('/uploads/safety-inspections/')) {
      // 4. Try safety-inspections folder
      e.currentTarget.src = `${envBase}/safety-inspections/${filename}`;
    } else {
      e.currentTarget.onerror = null;
      e.currentTarget.src = 'https://placehold.co/400x300?text=Photo+Unavailable';
    }
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
  const history = Array.isArray(inspection.history) ? inspection.history : [];
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
          {!isReadOnly && !effectiveClosed && (
            <button
              type="button"
              className="siview-btn-edit"
              onClick={() => navigate(`/safety-inspection/edit/${inspection?.id || id}`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 16px',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid #0284c7',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
              title="Edit inspection"
            >
              <i className="ti ti-pencil"></i> Edit
            </button>
          )}
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
                <span className="meta-value">{inspection.projectName || ((import.meta.env.VITE_API_BASE_URL || '').toLowerCase().includes('north') ? 'M3NORTH' : (import.meta.env.VITE_API_BASE_URL || '').toLowerCase().includes('infra') ? 'M3INFRASTRUCTURE' : 'M3SOUTH')}</span>
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
                  {!isReadOnly && effectiveClosed && (
                    <button
                      type="button"
                      onClick={() => navigate(`/safety-inspection/edit/${inspection?.id || id}`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: '1px solid #0284c7',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                      title="Reopen inspection in edit form"
                    >
                      <i className="ti ti-rotate-clockwise"></i>
                      Reopen
                    </button>
                  )}
                  {!isReadOnly && !effectiveClosed && (
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
                        border: '1px solid #16a34a',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                      title="Close inspection"
                    >
                      <i className="ti ti-circle-check"></i>
                      {isUpdatingStatus ? 'Updating...' : 'Close'}
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
              {(() => {
                const reopenLog = [...history].reverse().find(l => l.actionType === 'REOPENED');
                if (!reopenLog) return null;
                return (
                  <>
                    <div className="meta-item">
                      <span className="meta-label">Last Reopened By</span>
                      <span className="meta-value" style={{ color: '#0284c7', fontWeight: 600 }}>
                        {reopenLog.performedByUserName || 'Safety Officer'}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Reopened Date</span>
                      <span className="meta-value">{formatDate(reopenLog.timestamp)}</span>
                    </div>
                  </>
                );
              })()}
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
            const photosList = parsePhotosList(item.photos);

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

                    {/* Inspection Checklist Item Photos (Visual Evidence) */}
                    {photosList.length > 0 && (
                      <div className="siview-cl-images">
                        {photosList.map((img, i) => (
                          <div
                            key={i}
                            className="siview-img-thumbnail"
                            onClick={() => setPreviewImage({
                              url: getFullImageUrl(img, 'safety-inspections'),
                              title: `${item.categoryName || 'Item'} - Photo ${i + 1}`
                            })}
                            title="Click to zoom / view full photo"
                          >
                            <img
                              src={getFullImageUrl(img, 'safety-inspections')}
                              alt={`attachment-${i + 1}`}
                              onError={(e) => handleImageError(e, 'safety-inspections')}
                            />
                            <div className="siview-img-overlay">
                              <i className="ti ti-zoom-in"></i>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Attached Observation Photos if present */}
                    {issuesList.map((iss, i) => {
                      const obsKey = String(iss.observationId || iss.id || '');
                      const obsDetails = obsDetailsMap[obsKey];
                      const obsPhotos = parsePhotosList(obsDetails?.photos);
                      if (obsPhotos.length === 0) return null;

                      return (
                        <div key={`obs-photos-${i}`} className="siview-cl-obs-photos-wrap">
                          <div className="siview-cl-obs-photos-label">
                            <i className="ti ti-photo" style={{ marginRight: 5, color: '#0284c7' }}></i>
                            Observation Evidence ({iss.observationNumber || iss.id || `SO-${i + 1}`}):
                          </div>
                          <div className="siview-cl-images">
                            {obsPhotos.map((p, pIdx) => (
                              <div
                                key={pIdx}
                                className="siview-img-thumbnail"
                                onClick={() => setPreviewImage({
                                  url: getFullImageUrl(p, 'observations'),
                                  title: `${iss.observationNumber || iss.id || 'Observation'} - Photo ${pIdx + 1}`
                                })}
                                title="Click to zoom observation photo"
                              >
                                <img
                                  src={getFullImageUrl(p, 'observations')}
                                  alt={`obs-${iss.id || i}-photo-${pIdx + 1}`}
                                  onError={(e) => handleImageError(e, 'observations')}
                                />
                                <div className="siview-img-overlay">
                                  <i className="ti ti-zoom-in"></i>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Audit Trail & Workflow History Section */}
        <div className="siview-section-title" style={{ marginTop: '36px', marginBottom: '14px' }}>
          <h2>Audit Trail & Workflow History</h2>
        </div>

        <div className="siview-card" style={{ padding: '24px 28px', marginBottom: '28px', background: 'var(--bg-card, #ffffff)' }}>
          <div style={{ fontSize: 13 }}>
            {history.length === 0 ? (
              <div style={{ color: "var(--text-muted, #64748b)", fontStyle: "italic", padding: "12px 0" }}>
                No history records logged.
              </div>
            ) : (
              history.map((log, idx) => {
                const dotColor =
                  log.actionType === "CLOSED"
                    ? "#16a34a"
                    : log.actionType === "REOPENED"
                      ? "#0284c7"
                      : log.actionType === "UPDATED"
                        ? "#f59e0b"
                        : "#2563eb"; // CREATED or default

                const isLast = idx === history.length - 1;

                return (
                  <div
                    key={log.id || idx}
                    style={{
                      position: "relative",
                      paddingLeft: 24,
                      borderLeft: isLast ? "2px solid transparent" : "2px solid var(--border-color, #e2e8f0)",
                      paddingBottom: isLast ? 0 : 22,
                    }}
                  >
                    {/* Colored Dot centered directly on the vertical line */}
                    <div
                      style={{
                        position: "absolute",
                        left: -6,
                        top: 4,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: dotColor,
                        border: "2px solid var(--bg-card, #ffffff)",
                        boxShadow: `0 0 0 1px ${dotColor}`,
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: "var(--text-main, #1e293b)", fontSize: 13 }}>
                          {log.actionType}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            background: `${dotColor}18`,
                            color: dotColor,
                          }}
                        >
                          {log.actionType === 'REOPENED'
                            ? 'Reopened'
                            : log.actionType === 'CLOSED'
                              ? 'Closed'
                              : log.actionType === 'CREATED'
                                ? 'Created'
                                : 'Updated'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted, #64748b)", marginTop: 4 }}>
                        By <strong style={{ color: "var(--text-main, #334155)" }}>{log.performedByUserName || 'Safety Officer'}</strong> ({log.performedByUserRole || 'DEPARTMENT'})
                      </div>
                      {log.remarks && (
                        <div style={{ fontSize: 12, marginTop: 4, fontStyle: "italic", color: "var(--text-muted, #475569)" }}>
                          "{log.remarks}"
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)", marginTop: 4 }}>
                        <i className="ti ti-clock" style={{ marginRight: 4 }}></i>
                        {formatDate(log.timestamp)} (Denmark Time)
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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

                  {(() => {
                    const obsPhotos = parsePhotosList(selectedObs?.photos);
                    if (obsPhotos.length === 0) return null;

                    return (
                      <div className="obs-modal-item">
                        <span className="obs-modal-label">Observation Photos ({obsPhotos.length})</span>
                        <div className="obs-modal-photos-grid">
                          {obsPhotos.map((p, idx) => (
                            <div
                              key={idx}
                              className="obs-modal-photo-thumb"
                              onClick={() => setPreviewImage({
                                url: getFullImageUrl(p, 'observations'),
                                title: `${selectedObs.observationNumber || 'Observation'} - Photo ${idx + 1}`
                              })}
                              title="Click to zoom photo"
                              style={{ cursor: 'pointer' }}
                            >
                              <img
                                src={getFullImageUrl(p, 'observations')}
                                alt={`obs-photo-${idx + 1}`}
                                onError={(e) => handleImageError(e, 'observations')}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {(() => {
                    const resPhotos = parsePhotosList(selectedObs?.resolutionPhotos || selectedObs?.resolution_photos);
                    if (resPhotos.length === 0) return null;

                    return (
                      <div className="obs-modal-item">
                        <span className="obs-modal-label">Resolution Proof Photos ({resPhotos.length})</span>
                        <div className="obs-modal-photos-grid">
                          {resPhotos.map((p, idx) => (
                            <div
                              key={idx}
                              className="obs-modal-photo-thumb"
                              onClick={() => setPreviewImage({
                                url: getFullImageUrl(p, 'observations'),
                                title: `${selectedObs.observationNumber || 'Observation'} - Resolution Photo ${idx + 1}`
                              })}
                              title="Click to zoom resolution photo"
                              style={{ cursor: 'pointer' }}
                            >
                              <img
                                src={getFullImageUrl(p, 'observations')}
                                alt={`res-photo-${idx + 1}`}
                                onError={(e) => handleImageError(e, 'observations')}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
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

      {/* Lightbox / Full-size photo viewer */}
      {previewImage && (
        <div className="siview-lightbox-overlay" onClick={() => setPreviewImage(null)}>
          <div className="siview-lightbox-container" onClick={(e) => e.stopPropagation()}>
            <div className="siview-lightbox-header">
              <span>{previewImage.title || 'Photo Evidence'}</span>
              <div className="siview-lightbox-actions">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="siview-lightbox-btn"
                  title="Open photo in a separate tab"
                >
                  <i className="ti ti-external-link"></i> Open Tab
                </a>
                <button
                  type="button"
                  className="siview-lightbox-close"
                  onClick={() => setPreviewImage(null)}
                  title="Close (or click outside)"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
            </div>
            <img
              src={previewImage.url}
              alt="Enlarged view"
              className="siview-lightbox-img"
              onError={(e) => handleImageError(e)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
