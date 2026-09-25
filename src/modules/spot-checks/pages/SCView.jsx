import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { spotCheckService } from "../../../services/spotCheckService";
import { showSuccess, showError } from "../../../components/common/Toast/Toast";
import Swal from "sweetalert2";
import "./SCView.css";

export default function SCView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [spotCheck, setSpotCheck] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

  const handleDownloadPdf = async () => {
    if (!spotCheck) return;

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

    setIsDownloadingPdf(true);
    try {
      const fileName = `${spotCheck.spotCheckRef || `SC-${spotCheck.id}`}_HSE_Spot_Check.pdf`;
      await spotCheckService.downloadSpotCheckPdf(spotCheck.id, fileName, includeAttachments);
      showSuccess("PDF export downloaded successfully");
    } catch (err) {
      console.error('Failed to download spot check PDF:', err);
      showError("Failed to export PDF directly. Opening browser preview...");
      const pdfUrl = spotCheckService.getPdfUrl(spotCheck.id, includeAttachments);
      window.open(pdfUrl, '_blank');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await spotCheckService.getSpotCheckById(id);
        setSpotCheck(data);
      } catch (err) {
        console.error("Failed to load spot check details", err);
        setError("Failed to load spot check record.");
        showError("Failed to load spot check details.");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

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

  const handleStatusToggle = async () => {
    if (!spotCheck || isReadOnly) return;
    const isClosed = spotCheck.status === 'CLOSED' || spotCheck.status === 'COMPLETED';
    const nextStatus = isClosed ? 'IN_PROGRESS' : 'CLOSED';

    const result = await Swal.fire({
      title: isClosed ? 'Reopen Spot Check?' : 'Close Spot Check?',
      text: isClosed
        ? 'Are you sure you want to reopen this spot check as In Progress?'
        : 'Are you sure you want to mark this spot check as Closed?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isClosed ? 'Yes, Reopen' : 'Yes, Mark Closed',
      cancelButtonText: 'Cancel',
      confirmButtonColor: isClosed ? '#0284c7' : '#16a34a',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    setIsUpdatingStatus(true);
    try {
      await spotCheckService.updateSpotCheck(spotCheck.id, {
        status: nextStatus
      });
      setSpotCheck(prev => ({
        ...prev,
        status: nextStatus
      }));
      showSuccess(isClosed ? "Spot check reopened successfully" : "Spot check marked as closed");
    } catch (err) {
      console.error('Failed to update spot check status:', err);
      showError(err?.response?.data?.message || 'Failed to update spot check status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="scview-page" style={{ textAlign: "center", padding: "80px 20px" }}>
        <i className="ti ti-loader ti-spin" style={{ fontSize: "30px", color: "#0284c7" }}></i>
        <p style={{ marginTop: "12px", color: "var(--text-muted, #64748b)", fontSize: "14px" }}>
          Loading Spot Check Report #{id}...
        </p>
      </div>
    );
  }

  if (error || !spotCheck) {
    return (
      <div className="scview-page" style={{ textAlign: "center", padding: "80px 20px" }}>
        <i className="ti ti-alert-triangle" style={{ fontSize: "36px", color: "#ef4444" }}></i>
        <h3 style={{ marginTop: "12px", color: "var(--text-main, #0f172a)" }}>Spot Check Not Found</h3>
        <p style={{ color: "var(--text-muted, #64748b)", fontSize: "13.5px" }}>{error || "Could not retrieve the requested record."}</p>
        <button className="scview-btn-back" style={{ margin: "16px auto 0 auto" }} onClick={() => navigate('/spot-checks/list')}>
          <i className="ti ti-arrow-left"></i> Back to List
        </button>
      </div>
    );
  }

  const isCompliant = spotCheck.chk3_2 === "Yes";
  const displayId = spotCheck.spotCheckRef || `SC-${spotCheck.id}`;
  const isClosed = spotCheck.status === 'CLOSED' || spotCheck.status === 'COMPLETED';

  const highRiskList = Array.isArray(spotCheck.highRiskActivities)
    ? spotCheck.highRiskActivities
    : (typeof spotCheck.highRiskActivities === 'string'
      ? JSON.parse(spotCheck.highRiskActivities || '[]')
      : []);

  const keyTopicsList = Array.isArray(spotCheck.keyTopics)
    ? spotCheck.keyTopics
    : (typeof spotCheck.keyTopics === 'string'
      ? JSON.parse(spotCheck.keyTopics || '[]')
      : []);

  const correctiveActionsList = Array.isArray(spotCheck.correctiveActions)
    ? spotCheck.correctiveActions
    : (typeof spotCheck.correctiveActions === 'string'
      ? JSON.parse(spotCheck.correctiveActions || '[]')
      : []);

  const attachmentsList = Array.isArray(spotCheck.attachments)
    ? spotCheck.attachments
    : (typeof spotCheck.attachments === 'string'
      ? JSON.parse(spotCheck.attachments || '[]')
      : []);

  const renderBadge = (val) => {
    if (!val) return <span className="sc-badge sc-badge-neutral">-</span>;
    if (val === "Yes") return <span className="sc-badge sc-badge-success"><i className="ti ti-check"></i> Yes</span>;
    if (val === "No") return <span className="sc-badge sc-badge-danger"><i className="ti ti-x"></i> No</span>;
    return <span className="sc-badge sc-badge-neutral">{val}</span>;
  };

  return (
    <div className="scview-page">
      {/* ── Top Navigation Bar ── */}
      <div className="scview-top-nav">
        <button className="scview-btn-back-link" onClick={() => navigate('/spot-checks/list')}>
          <i className="ti ti-arrow-left"></i> Back to Spot Checks
        </button>
      </div>

      {/* ── Compact Sleek Header ── */}
      <div className="scview-hero-card">
        <div className="scview-hero-content">
          <div className="scview-hero-icon">
            <i className="ti ti-clipboard-check"></i>
          </div>
          <div className="scview-hero-text">
            <div className="scview-title-row">
              <h1 className="scview-hero-title">
                Record <span className="record-id">{displayId}</span>
              </h1>
              <span className={`sc-badge ${isCompliant ? 'sc-badge-success' : (spotCheck.chk3_2 === 'No' ? 'sc-badge-danger' : 'sc-badge-warning')}`}>
                <i className={`ti ${isCompliant ? 'ti-check' : 'ti-alert-circle'}`}></i>
                {isCompliant ? 'Compliant' : (spotCheck.chk3_2 === 'No' ? 'Non-Compliant' : 'Pending')}
              </span>
            </div>

            <div className="scview-hero-meta-bar">
              <span className={`sc-badge ${isClosed ? 'sc-badge-success' : 'sc-badge-info'}`}>
                <i className={`ti ${isClosed ? 'ti-lock-check' : 'ti-clock'}`} style={{ marginRight: 3 }}></i>
                {isClosed ? 'Closed' : 'In Progress'}
              </span>
              {spotCheck.activityName && (
                <span className="scview-meta-chip">
                  <i className="ti ti-activity"></i>
                  <span>{spotCheck.activityName}</span>
                </span>
              )}
              {spotCheck.companyInvolved && (
                <span className="scview-meta-chip">
                  <i className="ti ti-building-community"></i>
                  <span>{spotCheck.companyInvolved}</span>
                </span>
              )}
              {(spotCheck.date || spotCheck.time) && (
                <span className="scview-meta-chip">
                  <i className="ti ti-calendar"></i>
                  <span>{formatDate(spotCheck.date)} {spotCheck.time || ""}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="scview-hero-actions">
          {!isReadOnly && (
            <button
              className="scview-btn-status"
              onClick={handleStatusToggle}
              disabled={isUpdatingStatus}
              style={{
                borderColor: isClosed ? '#10b981' : '#0284c7',
                color: isClosed ? '#059669' : '#0284c7'
              }}
            >
              <i className={`ti ${isClosed ? 'ti-refresh' : 'ti-circle-check'}`}></i>
              {isUpdatingStatus ? 'Updating...' : (isClosed ? 'Reopen' : 'Mark Closed')}
            </button>
          )}

          <button
            className="scview-btn-download"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
          >
            <i className={`ti ${isDownloadingPdf ? 'ti-loader ti-spin' : 'ti-download'}`}></i>
            {isDownloadingPdf ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      <div className="scview-content">
        {/* ── Metadata Grid ── */}
        <div className="scview-metadata-grid">
          {/* Card 1: Location & Activity */}
          <div className="scview-card">
            <div className="sc-card-header">
              <div className="sc-card-header-left">
                <i className="ti ti-map-pin"></i>
                <span>General & Location Info</span>
              </div>
            </div>
            <div className="sc-card-body">
              <div className="sc-meta-item">
                <span className="sc-meta-label">Project Name:</span>
                <span className="sc-meta-value">{spotCheck.projectName || spotCheck.workPackage || "M3SOUTH"}</span>
              </div>
              <div className="sc-meta-item">
                <span className="sc-meta-label">Building & Level:</span>
                <span className="sc-meta-value">{spotCheck.buildingName || "JS"} - {spotCheck.floorLevel || "Zone JS"}</span>
              </div>
              <div className="sc-meta-item">
                <span className="sc-meta-label">Location / Room:</span>
                <span className="sc-meta-value" style={{ maxWidth: '60%', textAlign: 'right' }}>
                  {spotCheck.location || (Array.isArray(spotCheck.selectedRooms) ? spotCheck.selectedRooms.join(", ") : "-")}
                </span>
              </div>
              <div className="sc-meta-item">
                <span className="sc-meta-label">Weather:</span>
                <span className="sc-meta-value">{spotCheck.weather || "-"}</span>
              </div>
              <div className="sc-meta-item">
                <span className="sc-meta-label">Contractor Involved:</span>
                <span className="sc-meta-value" style={{ color: "#0284c7" }}>{spotCheck.companyInvolved || "-"}</span>
              </div>
              <div className="sc-meta-item">
                <span className="sc-meta-label">Permit ID (PTW):</span>
                <span className="sc-meta-value">{spotCheck.permitId || "N/A"}</span>
              </div>
              <div className="sc-meta-item">
                <span className="sc-meta-label">RAMS ID:</span>
                <span className="sc-meta-value">{spotCheck.ramsId || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Status & Compliance */}
          <div className="scview-card">
            <div className="sc-card-header">
              <div className="sc-card-header-left">
                <i className="ti ti-shield-check"></i>
                <span>Compliance & Audit Status</span>
              </div>
            </div>
            <div className="sc-card-body">
              <div className="sc-meta-item">
                <span className="sc-meta-label">Overall Compliance:</span>
                <span className="sc-meta-value">
                  <span className={`sc-badge ${isCompliant ? 'sc-badge-success' : (spotCheck.chk3_2 === 'No' ? 'sc-badge-danger' : 'sc-badge-warning')}`}>
                    <i className={`ti ${isCompliant ? 'ti-check' : 'ti-alert-circle'}`}></i>
                    {isCompliant ? 'Compliant' : (spotCheck.chk3_2 === 'No' ? 'Non-Compliant' : 'Pending')}
                  </span>
                </span>
              </div>
              <div className="sc-meta-item">
                <span className="sc-meta-label">Audit Lifecycle:</span>
                <span className="sc-meta-value">
                  <span className={`sc-badge ${isClosed ? 'sc-badge-success' : 'sc-badge-info'}`}>
                    {spotCheck.status || "COMPLETED"}
                  </span>
                </span>
              </div>
              <div className="sc-meta-item">
                <span className="sc-meta-label">Safety Issue Created:</span>
                <span className="sc-meta-value">
                  {spotCheck.safetyIssueCreated === 'Yes' ? (
                    <span className="sc-badge sc-badge-danger">Yes ({spotCheck.safetyIssueRef || "Logged"})</span>
                  ) : (
                    <span className="sc-badge sc-badge-neutral">No</span>
                  )}
                </span>
              </div>
              <div className="sc-meta-item">
                <span className="sc-meta-label">Audited By:</span>
                <span className="sc-meta-value">{spotCheck.inspectorName || spotCheck.createdByUserName || "Superadmin"} ({spotCheck.inspectorCompany || "NNE"})</span>
              </div>
              <div className="sc-meta-item">
                <span className="sc-meta-label">Audit Date:</span>
                <span className="sc-meta-value">{formatDate(spotCheck.date || spotCheck.createdTime)}</span>
              </div>
              <div className="sc-meta-item">
                <span className="sc-meta-label">Created At:</span>
                <span className="sc-meta-value">{formatDate(spotCheck.createdTime)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 1: Permit To Work (PTW) & Controls ── */}
        <div className="scview-card">
          <div className="sc-card-header">
            <div className="sc-card-header-left">
              <i className="ti ti-file-certificate"></i>
              <span>Permit to Work (PTW) & Risk Controls</span>
            </div>
          </div>
          <div className="sc-card-body">
            <div>
              <span className="sc-meta-label" style={{ display: "block", marginBottom: 6 }}>High Risk Activities:</span>
              <div>
                {highRiskList && highRiskList.length > 0 ? (
                  highRiskList.map((act, i) => (
                    <span key={i} className="sc-tag-pill" style={{ borderColor: act === 'Hot work' ? '#ef4444' : undefined, color: act === 'Hot work' ? '#dc2626' : undefined }}>
                      {act === 'Hot work' && <i className="ti ti-flame" style={{ marginRight: 4 }}></i>}
                      {act}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: 12.5 }}>None listed</span>
                )}
              </div>
            </div>

            {spotCheck.ifHotWork && (
              <div style={{ padding: "10px 14px", background: "rgba(239, 68, 68, 0.08)", borderRadius: "6px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                <span style={{ fontWeight: 600, color: "#dc2626", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-flame"></i> Hot Work Classification:
                </span>
                <div style={{ marginTop: 2, fontWeight: 700, fontSize: 13.5, color: "#991b1b" }}>
                  {spotCheck.ifHotWork}
                </div>
              </div>
            )}

            <div className="sc-table-container">
              <table className="sc-table">
                <thead>
                  <tr>
                    
                    <th></th>
                    <th style={{ width: "100px", textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    
                    <td><b>a.</b> Work stopped if RAMS / PTW requirements are not valid or not followed?</td>
                    <td style={{ textAlign: "center" }}>{renderBadge(spotCheck.chk1_2)}</td>
                  </tr>
                  <tr>
                    
                    <td><b>b.</b> Controls specified on the Permit to Work implemented effectively?</td>
                    <td style={{ textAlign: "center" }}>{renderBadge(spotCheck.chk1_3)}</td>
                  </tr>
                  <tr>
                    
                    <td><b>c.</b> Work area is clean and free of combustible materials?</td>
                    <td style={{ textAlign: "center" }}>{renderBadge(spotCheck.chk1_4)}</td>
                  </tr>
                  <tr>
                    
                    <td><b>d.</b> Combustible materials properly shielded / fire blanket used?</td>
                    <td style={{ textAlign: "center" }}>{renderBadge(spotCheck.chk1_5)}</td>
                  </tr>
                  <tr>
                    
                    <td><b>e.</b> Continuous fire watch required and present at all times?</td>
                    <td style={{ textAlign: "center" }}>{renderBadge(spotCheck.chk1_6)}</td>
                  </tr>
                  <tr>
                    
                    <td><b>f.</b> Appropriate fire extinguisher available immediately at the work point?</td>
                    <td style={{ textAlign: "center" }}>{renderBadge(spotCheck.chk1_7)}</td>
                  </tr>
                  <tr>
                    
                    <td><b>g.</b> 60-minute post-work fire check arranged and documented?</td>
                    <td style={{ textAlign: "center" }}>{renderBadge(spotCheck.chk1_8)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Section 2: Communication / Toolbox Talk ── */}
        <div className="scview-card">
          <div className="sc-card-header">
            <div className="sc-card-header-left">
              <i className="ti ti-messages"></i>
              <span>Communication / Toolbox Talk / Pre-Start Briefing</span>
            </div>
            <div>
              {renderBadge(spotCheck.chk2_1)}
            </div>
          </div>
          <div className="sc-card-body">
            <div className="sc-meta-item">
              <span className="sc-meta-label"><b>a.</b> Daily pre-start briefing / toolbox talk conducted?</span>
              <span className="sc-meta-value">{renderBadge(spotCheck.chk2_1)}</span>
            </div>

            {spotCheck.chk2_1 === 'Yes' ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="grid-2-col">
                  <div className="sc-meta-item">
                    <span className="sc-meta-label"><b>b.</b> Briefing Date & Time:</span>
                    <span className="sc-meta-value">{formatDate(spotCheck.briefingDate)} {spotCheck.briefingTime || ""}</span>
                  </div>
                  <div className="sc-meta-item">
                    <span className="sc-meta-label"><b>c.</b> Conducted By:</span>
                    <span className="sc-meta-value">{spotCheck.conductedBy || "-"}</span>
                  </div>
                  <div className="sc-meta-item">
                    <span className="sc-meta-label"><b>d.</b> Total Participants:</span>
                    <span className="sc-meta-value">{spotCheck.participants || "0"}</span>
                  </div>
                  <div className="sc-meta-item">
                    <span className="sc-meta-label"><b>f.</b> Workers understand hazards:</span>
                    <span className="sc-meta-value">{renderBadge(spotCheck.chk2_1_5)}</span>
                  </div>
                </div>

                <div>
                  <span className="sc-meta-label" style={{ display: "block", marginBottom: 6 }}><b>e.</b> Key Topics Discussed:</span>
                  <div>
                    {keyTopicsList && keyTopicsList.length > 0 ? (
                      keyTopicsList.map((t, i) => (
                        <span key={i} className="sc-tag-pill">{t}</span>
                      ))
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: 12.5 }}>None selected</span>
                    )}
                    {spotCheck.otherTopic && (
                      <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--text-main)", background: "var(--bg-card-hover)", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)" }}>
                        <b>Note:</b> {spotCheck.otherTopic}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "12px 14px", background: "rgba(245, 158, 11, 0.08)", borderRadius: "6px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                <span style={{ fontWeight: 600, color: "#b45309", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-info-circle"></i> g. Reason / Explanation why no briefing conducted:
                </span>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--text-main)" }}>
                  {spotCheck.explainNoBriefing || "No explanation recorded."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 3: Summary, Findings & Corrective Actions ── */}
        <div className="scview-card">
          <div className="sc-card-header">
            <div className="sc-card-header-left">
              <i className="ti ti-notes"></i>
              <span>Findings & Corrective Actions</span>
            </div>
          </div>
          <div className="sc-card-body">
            <div style={{ padding: "12px 14px", background: isCompliant ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)", borderRadius: "6px", border: `1px solid ${isCompliant ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}` }}>
              <span style={{ fontWeight: 600, color: isCompliant ? '#059669' : '#b91c1c', fontSize: 12.5 }}>
                <b>a.</b> Was the activity in compliance?
              </span>
              <div style={{ marginTop: 2, fontWeight: 700, fontSize: 14, color: isCompliant ? '#047857' : '#991b1b', display: "flex", alignItems: "center", gap: 6 }}>
                <i className={`ti ${isCompliant ? 'ti-check' : 'ti-x'}`}></i>
                {isCompliant ? 'YES - COMPLIANT' : 'NO - NON-COMPLIANT'}
              </div>
            </div>

            {spotCheck.chk3_2 === 'No' && (
              <div style={{ padding: "12px 14px", background: "var(--bg-card-hover, #f8fafc)", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span className="sc-meta-label" style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#b91c1c" }}>
                  Attached Safety Observation (Non-compliant activity):
                </span>
                <div className="grid-2-col">
                  <div className="sc-meta-item" style={{ gridColumn: "span 2" }}>
                    <span className="sc-meta-label">Safety issue / SPOT ref:</span>
                    <span className="sc-meta-value">
                      {spotCheck.safetyIssueRef ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span
                            className="sc-badge sc-badge-danger"
                            style={{
                              fontWeight: 600,
                              cursor: spotCheck.safetyIssueRef.startsWith("SO") ? "pointer" : "default",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4
                            }}
                            title={spotCheck.safetyIssueRef.startsWith("SO") ? "View in Safety Observations" : ""}
                            onClick={() => {
                              if (spotCheck.safetyIssueRef.startsWith("SO")) {
                                navigate(`/safety-observations/list?search=${spotCheck.safetyIssueRef}`);
                              }
                            }}
                          >
                            {spotCheck.safetyIssueRef}
                            {spotCheck.safetyIssueRef.startsWith("SO") && (
                              <i className="ti ti-external-link" style={{ fontSize: 11 }}></i>
                            )}
                          </span>
                          <span style={{ fontSize: 11, color: "#b91c1c", fontWeight: 600, background: "rgba(239, 68, 68, 0.08)", padding: "2px 6px", borderRadius: "4px" }}>
                            Needs Attention
                          </span>
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <span className="sc-meta-label" style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Findings & Observations:</span>
              <div style={{ padding: "10px 14px", background: "var(--bg-card-hover, #f8fafc)", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)", fontSize: 13, minHeight: 48, whiteSpace: "pre-wrap" }}>
                {spotCheck.findings || "No findings or comments entered."}
              </div>
            </div>

            <div>
              <span className="sc-meta-label" style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Corrective Actions Agreed:</span>
              {correctiveActionsList && correctiveActionsList.length > 0 ? (
                <div className="sc-table-container">
                  <table className="sc-table">
                    <thead>
                      <tr>
                        <th style={{ width: "36px" }}>#</th>
                        <th>Action Item</th>
                        <th>Responsible Person</th>
                        <th style={{ width: "120px" }}>Due Date</th>
                        <th style={{ width: "90px", textAlign: "center" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {correctiveActionsList.map((ca, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td><b>{ca.action || "-"}</b></td>
                          <td>{ca.responsible || "-"}</td>
                          <td>{formatDate(ca.dueDate)}</td>
                          <td style={{ textAlign: "center" }}>
                            <span className={`sc-badge ${ca.closed ? 'sc-badge-success' : 'sc-badge-warning'}`}>
                              {ca.closed ? 'Closed' : 'Open'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ color: "var(--text-muted)", fontSize: 12.5, fontStyle: "italic" }}>
                  No corrective action items logged.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 4: Photographs & Attachments ── */}
        <div className="scview-card">
          <div className="sc-card-header">
            <div className="sc-card-header-left">
              <i className="ti ti-photo"></i>
              <span>4 | Photographs & Evidence Attachments</span>
            </div>
          </div>
          <div className="sc-card-body">
            {attachmentsList && attachmentsList.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {attachmentsList.map((att, idx) => {
                  const isImg = att.fileType?.startsWith("image/") || att.previewUrl?.startsWith("data:image");
                  const isPdf = att.fileType === "application/pdf" || att.previewUrl?.startsWith("data:application/pdf") || att.fileName?.toLowerCase().endsWith(".pdf");

                  return (
                    <div key={idx} className="sc-attachment-card">
                      <div
                        className="sc-attachment-preview"
                        style={{ cursor: isImg ? "pointer" : "default" }}
                        onClick={() => isImg && setSelectedPreviewImage(att.previewUrl)}
                      >
                        {isImg && att.previewUrl ? (
                          <img src={att.previewUrl} alt={att.desc || "Attachment"} />
                        ) : isPdf ? (
                          <i className="ti ti-file-type-pdf" style={{ fontSize: 26, color: "#ef4444" }}></i>
                        ) : (
                          <i className="ti ti-file-description" style={{ fontSize: 24, color: "#0284c7" }}></i>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={att.fileName || att.desc}>
                          {att.fileName || `Attachment ${idx + 1}`}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 1 }}>
                          {att.desc || "Spot Check Evidence"}
                        </div>
                        {att.fileSize && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                            {att.fileSize}
                          </div>
                        )}
                        {att.previewUrl && (
                          <div style={{ marginTop: 4 }}>
                            <a
                              href={att.previewUrl}
                              download={att.fileName || `spot_check_evidence_${idx + 1}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: 11.5, color: "#0284c7", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
                              <i className="ti ti-download"></i> Download
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: 12.5, fontStyle: "italic" }}>
                No photographs or file attachments recorded.
              </div>
            )}
          </div>
        </div>

        {/* ── Section 5: Signatures & Verification ── */}
        <div className="scview-card">
          <div className="sc-card-header">
            <div className="sc-card-header-left">
              <i className="ti ti-signature"></i>
              <span>5 | Signatures & Verification</span>
            </div>
          </div>
          <div className="sc-card-body">
            <div className="grid-2-col">
              {/* Foreman Signature */}
              <div className="sc-sig-card">
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-user" style={{ color: "#0284c7" }}></i> Foreman / Contractor Lead
                </div>
                <div className="sc-meta-item">
                  <span className="sc-meta-label">Name:</span>
                  <span className="sc-meta-value">{spotCheck.foremanName || "-"}</span>
                </div>
                <div className="sc-meta-item">
                  <span className="sc-meta-label">Company:</span>
                  <span className="sc-meta-value">{spotCheck.foremanCompany || "-"}</span>
                </div>
                <div className="sc-meta-item">
                  <span className="sc-meta-label">Date:</span>
                  <span className="sc-meta-value">{formatDate(spotCheck.foremanDate)}</span>
                </div>
                <div className="sc-sig-canvas-box">
                  {spotCheck.foremanSignature ? (
                    <img src={spotCheck.foremanSignature} alt="Foreman Signature" />
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No signature provided</span>
                  )}
                </div>
              </div>

              {/* Inspector Signature */}
              <div className="sc-sig-card">
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-shield-check" style={{ color: "#059669" }}></i> Safety Inspector
                </div>
                <div className="sc-meta-item">
                  <span className="sc-meta-label">Name:</span>
                  <span className="sc-meta-value">{spotCheck.inspectorName || spotCheck.createdByUserName || "-"}</span>
                </div>
                <div className="sc-meta-item">
                  <span className="sc-meta-label">Company:</span>
                  <span className="sc-meta-value">{spotCheck.inspectorCompany || "NNE"}</span>
                </div>
                <div className="sc-meta-item">
                  <span className="sc-meta-label">Date:</span>
                  <span className="sc-meta-value">{formatDate(spotCheck.inspectorDate || spotCheck.createdTime)}</span>
                </div>
                <div className="sc-sig-canvas-box">
                  {spotCheck.inspectorSignature ? (
                    <img src={spotCheck.inspectorSignature} alt="Inspector Signature" />
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No signature provided</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Image Modal Preview ── */}
      {selectedPreviewImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
            padding: 20
          }}
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }} onClick={e => e.stopPropagation()}>
            <img
              src={selectedPreviewImage}
              alt="Preview"
              style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
            />
            <button
              style={{
                position: "absolute",
                top: -10,
                right: -10,
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 28,
                height: 28,
                cursor: "pointer",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onClick={() => setSelectedPreviewImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
