import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import { observationService } from "../../../services/observationService";
import { getContractors } from "../../../services/authService";
import "../../../styles/module-shared.css";

function SODetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null); // { observation, history }
  const [loading, setLoading] = useState(true);
  const [contractorsList, setContractorsList] = useState([]);

  // Modals state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState("ACCEPT"); // ACCEPT or REJECT
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [reviewPhotoFiles, setReviewPhotoFiles] = useState([]);
  const [reviewPhotoPreviews, setReviewPhotoPreviews] = useState([]);

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [newContractorId, setNewContractorId] = useState("");
  const [reassignRemarks, setReassignRemarks] = useState("");

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closureComments, setClosureComments] = useState("");

  const [showEscalate, setShowEscalate] = useState(false);
  const [escForm, setEscForm] = useState({ actual: 1, potential: 4, reason: "" });

  const [actionSubmitting, setActionSubmitting] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = localStorage.getItem("UserType") || "DEPARTMENT";

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await observationService.getObservationDetails(id);
      setData(res);
    } catch (err) {
      console.error("Error loading observation details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    async function loadContractors() {
      try {
        const res = await getContractors();
        if (res && Array.isArray(res.data)) {
          setContractorsList(res.data);
        } else if (Array.isArray(res)) {
          setContractorsList(res);
        }
      } catch (err) {
        console.error("Error loading contractors:", err);
      }
    }
    loadContractors();
  }, [id]);

  if (loading) {
    return <div className="mod-page" style={{ padding: 40, textAlign: "center" }}>Loading observation details...</div>;
  }

  if (!data || !data.observation) {
    return <div className="mod-page" style={{ padding: 40, textAlign: "center" }}>Observation not found.</div>;
  }

  const obs = data.observation;
  const history = data.history || [];
  const isPositive = obs.observationType === "POSITIVE";

  // Action Handlers
  const handleContractorReview = async () => {
    if (!reviewRemarks) {
      alert("Please provide remarks for your action.");
      return;
    }
    try {
      setActionSubmitting(true);

      const formData = new FormData();
      formData.append("action", reviewAction);
      formData.append("remarks", reviewRemarks);
      formData.append("actionByUserName", currentUser.username || currentUser.name || "Contractor User");
      if (currentUser.id) formData.append("actionByUserId", currentUser.id);
      if (currentUser.subcontractor_id || currentUser.contractorId) {
        formData.append("contractorId", currentUser.subcontractor_id || currentUser.contractorId);
      }

      reviewPhotoFiles.forEach((file) => {
        formData.append("photos", file);
      });

      await observationService.contractorReview(id, formData);
      setShowReviewModal(false);
      setReviewRemarks("");
      setReviewPhotoFiles([]);
      setReviewPhotoPreviews([]);
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit contractor review.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReassign = async () => {
    if (!newContractorId || !reassignRemarks) {
      alert("Please select a contractor and provide reassignment remarks.");
      return;
    }
    const selectedContractor = contractorsList.find((c) => String(c.id) === String(newContractorId));
    const contractorName = selectedContractor ? selectedContractor.subContractorName || selectedContractor.company_name || selectedContractor.contractor_name || selectedContractor.name : "Contractor";

    try {
      setActionSubmitting(true);
      await observationService.reassignContractor(id, {
        newContractorId: parseInt(newContractorId, 10),
        newContractorName: contractorName,
        remarks: reassignRemarks,
        reassignedByUserName: currentUser.username || currentUser.name || "Department User",
        reassignedByUserId: currentUser.id,
      });
      setShowReassignModal(false);
      setReassignRemarks("");
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reassign contractor.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionNotes) {
      alert("Please provide resolution notes.");
      return;
    }
    try {
      setActionSubmitting(true);
      const formData = new FormData();
      formData.append("resolutionNotes", resolutionNotes);
      formData.append("resolvedByUserName", currentUser.username || currentUser.name || "Contractor User");
      if (currentUser.id) formData.append("resolvedByUserId", currentUser.id);

      await observationService.resolveObservation(id, formData);
      setShowResolveModal(false);
      setResolutionNotes("");
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resolve observation.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleClose = async () => {
    try {
      setActionSubmitting(true);
      await observationService.closeObservation(id, {
        closedBy: currentUser.username || currentUser.name || "Department Lead",
        closureComments: closureComments || "Observation verified and closed on site.",
      });
      setShowCloseModal(false);
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to close observation.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (!escForm.reason) {
      alert("Please provide a reason for escalation.");
      return;
    }
    try {
      setActionSubmitting(true);
      const res = await observationService.escalateToIncident(id, {
        escalatedBy: currentUser.username || currentUser.name || "HSE Lead",
        actualSeverity: escForm.actual,
        potentialSeverity: escForm.potential,
        remarks: escForm.reason,
      });
      alert(`Observation escalated to Incident ${res.incident?.incident?.caseNumber || ""}`);
      setShowEscalate(false);
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to escalate observation to incident.");
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="mod-page">
      <div className="hide-on-print" style={{ marginBottom: "16px", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => navigate("/safety-observations/list")} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-main)", fontWeight: 600, fontSize: "13px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back to Observations
        </button>
      </div>

      <div className="mod-page-header-row">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: "var(--nne-brand-blue)" }}>
              {obs.observationNumber}
            </span>
            <span
              className={`badge ${
                obs.status === "REJECTED"
                  ? "badge-red"
                  : obs.status === "ACCEPTED" || obs.status === "RESOLVED"
                  ? "badge-orange"
                  : obs.status === "CLOSED"
                  ? "badge-green"
                  : "badge-blue"
              }`}
            >
              {obs.status}
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "8px 0 0", color: "var(--text-main)" }}>{obs.subject}</h1>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="mod-action-toolbar">
          {/* Department Assign / Reassign Contractor */}
          {obs.status !== "CLOSED" && obs.status !== "ESCALATED" && userRole !== "CONTRACTOR" && (
            <button className="mod-btn-primary" style={{ background: "#131E40", borderColor: "#131E40", color: "#fff" }} onClick={() => setShowReassignModal(true)}>
              {obs.assignedContractorId || obs.assignedContractorName ? "Reassign Contractor" : "Assign Contractor"}
            </button>
          )}

          {/* Contractor Accept / Reject */}
          {(obs.status === "ASSIGNED" || obs.status === "OPEN" || obs.status === "REJECTED") && (
            <>
              <button
                className="mod-btn-primary"
                style={{ background: "#2D7A4F", borderColor: "#2D7A4F", color: "#fff" }}
                onClick={() => {
                  setReviewAction("ACCEPT");
                  setShowReviewModal(true);
                }}
              >
                Accept Assignment
              </button>
              <button
                className="mod-btn-primary"
                style={{ background: "#E32B50", borderColor: "#E32B50", color: "#fff" }}
                onClick={() => {
                  setReviewAction("REJECT");
                  setShowReviewModal(true);
                }}
              >
                Reject Assignment
              </button>
            </>
          )}

          {/* Contractor Submit Resolution */}
          {(obs.status === "ACCEPTED" || obs.status === "IN_PROGRESS") && (
            <button className="mod-btn-primary" style={{ background: "#2D7A4F", borderColor: "#2D7A4F", color: "#fff" }} onClick={() => setShowResolveModal(true)}>
              Submit Resolution
            </button>
          )}

          {/* Department Close Observation */}
          {(obs.status === "RESOLVED" || obs.status === "ACCEPTED") && userRole !== "CONTRACTOR" && (
            <button className="mod-btn-primary" style={{ background: "#131E40", borderColor: "#131E40", color: "#fff" }} onClick={() => setShowCloseModal(true)}>
              Sign-Off & Close
            </button>
          )}

          {/* Escalate to Incident */}
          {!isPositive && obs.status !== "ESCALATED" && obs.status !== "CLOSED" && userRole !== "CONTRACTOR" && (
            <button className="mod-btn-primary" style={{ background: "#E32B50", borderColor: "#E32B50", color: "#fff" }} onClick={() => setShowEscalate(true)}>
              Escalate to Incident
            </button>
          )}
        </div>
      </div>

      <div className="mod-two-col-layout">
        <div>
          {/* Observation Main Card */}
          <div className="mod-card mb-4">
            <div className="mod-card-header">
              <span className="mod-card-title">Observation Details</span>
            </div>
            <div className="mod-card-body" style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "12px 16px", fontSize: 13 }}>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Tracking Number</div>
              <div style={{ fontWeight: 700, fontFamily: "monospace" }}>{obs.observationNumber}</div>

              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Observation Type</div>
              <div>{isPositive ? <span className="badge badge-green">Positive</span> : <span className="badge badge-red">Needs Attention</span>}</div>

              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Nature of Finding</div>
              <div>{obs.natureOfFinding}</div>

              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Risk Level</div>
              <div>
                <span
                  style={{
                    fontWeight: 700,
                    color: obs.riskLevel === "HIGH" || obs.riskLevel === "CRITICAL" ? "#E32B50" : obs.riskLevel === "MEDIUM" ? "#C07D10" : "#2D7A4F",
                  }}
                >
                  {obs.riskLevel}
                </span>
              </div>

              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Safety Category</div>
              <div>{obs.safetyCategory}</div>

              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Assigned Contractor</div>
              <div style={{ fontWeight: 600, color: "var(--nne-brand-blue)" }}>{obs.assignedContractorName || "Not Assigned"}</div>

              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Reporter</div>
              <div>{obs.createdByUserName || obs.createdByRole}</div>

              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Created Date</div>
              <div>{obs.createdTime ? new Date(obs.createdTime).toLocaleString() : "-"}</div>
            </div>
          </div>

          <div className="mod-card mb-4">
            <div className="mod-card-header">
              <span className="mod-card-title">Location</span>
            </div>
            <div className="mod-card-body" style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "12px 16px", fontSize: 13 }}>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Project</div>
              <div>{obs.projectName || "-"}</div>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Building</div>
              <div>{obs.buildingName || "-"}</div>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Location Detail</div>
              <div>{obs.specificLocation || "-"}</div>
            </div>
          </div>

          <div className="mod-card mb-4">
            <div className="mod-card-header">
              <span className="mod-card-title">Description</span>
            </div>
            <div className="mod-card-body" style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-main)" }}>
              {obs.description}
            </div>
          </div>

          {/* Observation Photos Gallery */}
          {Array.isArray(obs.photos) && obs.photos.length > 0 && (
            <div className="mod-card mb-4">
              <div className="mod-card-header">
                <span className="mod-card-title">Observation Photos ({obs.photos.length})</span>
              </div>
              <div className="mod-card-body" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {obs.photos.map((photo, idx) => {
                  const filename = String(photo).split("/").pop().split("\\").pop();
                  const src = photo.startsWith("http") ? photo : `https://api.beam.safesiteworks.com/development/m3south/observations/${filename}`;
                  return (
                    <a key={idx} href={src} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                      <img
                        src={src}
                        alt={`Attachment ${idx + 1}`}
                        style={{ width: 130, height: 130, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border-color)", cursor: "pointer" }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/130?text=Photo+Unavailable";
                        }}
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {obs.resolutionNotes && (
            <div className="mod-card mb-4" style={{ border: "1px solid #7BBE97" }}>
              <div className="mod-card-header" style={{ background: "rgba(123,190,151,0.12)" }}>
                <span className="mod-card-title" style={{ color: "#2D7A4F" }}>Contractor Resolution Notes</span>
              </div>
              <div className="mod-card-body" style={{ fontSize: 14, lineHeight: 1.7 }}>
                {obs.resolutionNotes}
              </div>
            </div>
          )}
        </div>

        {/* Audit Trail Timeline */}
        <div>
          <div className="mod-card mb-4">
            <div className="mod-card-header">
              <span className="mod-card-title">Audit Trail & Workflow History</span>
            </div>
            <div className="mod-card-body" style={{ fontSize: 12, paddingLeft: 24, paddingRight: 20 }}>
              {history.length === 0 ? (
                <div style={{ color: "var(--text-muted)" }}>No history records logged.</div>
              ) : (
                history.map((log, idx) => {
                  const dotColor =
                    log.actionType === "CONTRACTOR_REJECTED"
                      ? "#E32B50"
                      : log.actionType === "CONTRACTOR_ACCEPTED"
                      ? "#10B981"
                      : log.actionType === "RESOLVED"
                      ? "#059669"
                      : log.actionType === "CLOSED"
                      ? "#16A34A"
                      : log.actionType === "REASSIGNED"
                      ? "#8B5CF6"
                      : log.actionType === "ASSIGNED"
                      ? "#0EA5E9"
                      : log.actionType === "ESCALATED"
                      ? "#F59E0B"
                      : "#2563EB"; // CREATED or default

                  const isLast = idx === history.length - 1;

                  return (
                    <div
                      key={log.id}
                      style={{
                        position: "relative",
                        paddingLeft: 20,
                        borderLeft: isLast ? "2px solid transparent" : "2px solid var(--border-color)",
                        paddingBottom: isLast ? 0 : 20,
                      }}
                    >
                      {/* Colored Dot centered directly on the vertical line */}
                      <div
                        style={{
                          position: "absolute",
                          left: -6,
                          top: 2,
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: dotColor,
                          border: "2px solid var(--bg-card)",
                          boxShadow: `0 0 0 1px ${dotColor}`,
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 13 }}>{log.actionType}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          By {log.performedByUserName} ({log.performedByUserRole})
                        </div>
                        {log.previousContractor && log.newContractor && (
                          <div style={{ fontSize: 11, color: "#8B5CF6", marginTop: 2, fontWeight: 500 }}>
                            Contractor: {log.previousContractor} → {log.newContractor}
                          </div>
                        )}
                        {log.remarks && <div style={{ fontSize: 12, marginTop: 4, fontStyle: "italic", color: "var(--text-muted)" }}>"{log.remarks}"</div>}

                        {/* Log Photo Attachments */}
                        {Array.isArray(log.photos) && log.photos.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                            {log.photos.map((photo, pIdx) => {
                              const filename = String(photo).split("/").pop().split("\\").pop();
                              const src = photo.startsWith("http") ? photo : `https://api.beam.safesiteworks.com/development/m3south/observations/${filename}`;
                              return (
                                <a key={pIdx} href={src} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={src}
                                    alt={`Log photo ${pIdx + 1}`}
                                    style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border-color)" }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "https://via.placeholder.com/54?text=Img";
                                    }}
                                  />
                                </a>
                              );
                            })}
                          </div>
                        )}

                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contractor Accept / Reject Modal */}
      {showReviewModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: 480, borderRadius: 12, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: reviewAction === "ACCEPT" ? "#2D7A4F" : "#E32B50" }}>
              {reviewAction === "ACCEPT" ? "Accept Observation Assignment" : "Reject Observation Assignment"}
            </h3>
            <div className="mod-form-group">
              <label className="mod-form-label">
                Remarks / Justification <span style={{ color: "#E32B50" }}>*</span>
              </label>
              <textarea
                className="mod-form-textarea"
                rows="3"
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder={reviewAction === "ACCEPT" ? "e.g. Work team dispatched to fix issue." : "e.g. Scope belongs to another contractor."}
              ></textarea>
            </div>

            {/* Photo Attachments for Review */}
            <div className="mod-form-group" style={{ marginTop: 14 }}>
              <label className="mod-form-label">Attach Photos / Supporting Proof (Optional)</label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                style={{ fontSize: 13 }}
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setReviewPhotoFiles((prev) => [...prev, ...files]);
                  const newPreviews = files.map((f) => URL.createObjectURL(f));
                  setReviewPhotoPreviews((prev) => [...prev, ...newPreviews]);
                }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {reviewPhotoPreviews.map((src, idx) => (
                  <div key={idx} style={{ position: "relative", width: 54, height: 54, borderRadius: 6, overflow: "hidden", border: "1px solid var(--border-color)" }}>
                    <img src={src} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => {
                        setReviewPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
                        setReviewPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        fontSize: 10,
                        lineHeight: 1,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button
                className="mod-btn-outline"
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewPhotoFiles([]);
                  setReviewPhotoPreviews([]);
                }}
              >
                Cancel
              </button>
              <button className="mod-btn-primary" disabled={actionSubmitting} onClick={handleContractorReview}>
                {actionSubmitting ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Reassign Modal */}
      {showReassignModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: 480, borderRadius: 12, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: "var(--nne-brand-blue)" }}>Reassign Contractor</h3>
            <div className="mod-form-group">
              <label className="mod-form-label">
                Select Contractor <span style={{ color: "#E32B50" }}>*</span>
              </label>
              <select className="mod-form-select" value={newContractorId} onChange={(e) => setNewContractorId(e.target.value)}>
                <option value="">-- Select contractor --</option>
                {contractorsList.map((c) => {
                  const contractorName = c.subContractorName || c.company_name || c.contractor_name || c.subcontractor_name || c.name || `Contractor #${c.id}`;
                  return (
                    <option key={c.id} value={c.id}>
                      {contractorName}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="mod-form-group" style={{ marginTop: 12 }}>
              <label className="mod-form-label">
                Reassignment Remarks <span style={{ color: "#E32B50" }}>*</span>
              </label>
              <textarea
                className="mod-form-textarea"
                rows="3"
                value={reassignRemarks}
                onChange={(e) => setReassignRemarks(e.target.value)}
                placeholder="Reason for reassigning..."
              ></textarea>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button className="mod-btn-outline" onClick={() => setShowReassignModal(false)}>
                Cancel
              </button>
              <button className="mod-btn-primary" disabled={actionSubmitting} onClick={handleReassign}>
                {actionSubmitting ? "Submitting..." : "Reassign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contractor Resolve Modal */}
      {showResolveModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: 480, borderRadius: 12, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: "#2D7A4F" }}>Submit Observation Resolution</h3>
            <div className="mod-form-group">
              <label className="mod-form-label">
                Resolution Notes <span style={{ color: "#E32B50" }}>*</span>
              </label>
              <textarea
                className="mod-form-textarea"
                rows="3"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Detail what action was taken to resolve the observation..."
              ></textarea>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button className="mod-btn-outline" onClick={() => setShowResolveModal(false)}>
                Cancel
              </button>
              <button className="mod-btn-primary" disabled={actionSubmitting} onClick={handleResolve}>
                {actionSubmitting ? "Submitting..." : "Submit Resolution"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Close Modal */}
      {showCloseModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: 480, borderRadius: 12, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: "var(--nne-brand-blue)" }}>Department Closeout & Sign-Off</h3>
            <div className="mod-form-group">
              <label className="mod-form-label">Closure Comments</label>
              <textarea
                className="mod-form-textarea"
                rows="3"
                value={closureComments}
                onChange={(e) => setClosureComments(e.target.value)}
                placeholder="Verified corrective action on site..."
              ></textarea>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button className="mod-btn-outline" onClick={() => setShowCloseModal(false)}>
                Cancel
              </button>
              <button className="mod-btn-primary" disabled={actionSubmitting} onClick={handleClose}>
                {actionSubmitting ? "Closing..." : "Close Observation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalate && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: 480, borderRadius: 12, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: "#E32B50" }}>Escalate Observation to Incident</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div className="mod-form-group">
                <label className="mod-form-label">Actual Severity</label>
                <select className="mod-form-select" value={escForm.actual} onChange={(e) => setEscForm({ ...escForm, actual: parseInt(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mod-form-group">
                <label className="mod-form-label">Potential Severity</label>
                <select className="mod-form-select" value={escForm.potential} onChange={(e) => setEscForm({ ...escForm, potential: parseInt(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mod-form-group">
              <label className="mod-form-label">
                Escalation Reason <span style={{ color: "#E32B50" }}>*</span>
              </label>
              <textarea className="mod-form-textarea" rows="3" value={escForm.reason} onChange={(e) => setEscForm({ ...escForm, reason: e.target.value })} placeholder="Reason for raising incident..."></textarea>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button className="mod-btn-outline" onClick={() => setShowEscalate(false)}>
                Cancel
              </button>
              <button className="mod-btn-primary" style={{ background: "#E32B50" }} disabled={actionSubmitting} onClick={handleEscalate}>
                {actionSubmitting ? "Escalating..." : "Confirm Escalation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SODetails;
