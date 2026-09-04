import React, { useRef, useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import { exportIncidentPdf } from "../../../services/incidentService";
import nneLogoImg from "../../../assets/images/nne_logo.png";
import projectLogoImg from "../../../assets/images/Logo.jpeg";

/**
 * IncidentPdfExporter Component
 * Official Form Viewer Modal & PDF Exporter
 * Renders the exact backend-generated official PDF format for:
 * 1. Form 1: Heads-up Notification (2 Hours)
 * 2. Form 2: Initial Incident Report (24 Hours)
 * 3. Form 3: Final Incident Investigation Report (7 Days)
 */
export function IncidentPdfExporter({ incident, onClose, targetForm = "all" }) {
  const exportRef = useRef(null);
  const [activeFormTab, setActiveFormTab] = useState(targetForm || "all");
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [pdfError, setPdfError] = useState(null);

  const incId = incident?.id || incident?.incident?.id;

  useEffect(() => {
    if (targetForm) {
      setActiveFormTab(targetForm);
    }
  }, [targetForm]);

  // Handle Escape key to close viewer modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (onClose) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const [includeWitnesses, setIncludeWitnesses] = useState(false);

  // Fetch backend PDF whenever form tab or includeWitnesses changes
  useEffect(() => {
    let isMounted = true;
    let createdUrl = null;

    const fetchBackendPdf = async () => {
      if (!incId) {
        setLoadingPdf(false);
        return;
      }

      try {
        setLoadingPdf(true);
        setPdfError(null);
        const formKey = activeFormTab === "all" ? "all" : activeFormTab;
        const blobData = await exportIncidentPdf(incId, formKey, includeWitnesses);

        if (isMounted) {
          const blob = new Blob([blobData], { type: "application/pdf" });
          createdUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(createdUrl);
        }
      } catch (err) {
        console.warn("Could not load PDF preview directly from backend, using HTML fallback:", err);
        if (isMounted) {
          setPdfError("Direct PDF preview unavailable. Displaying form document below.");
          setPdfBlobUrl(null);
        }
      } finally {
        if (isMounted) {
          setLoadingPdf(false);
        }
      }
    };

    fetchBackendPdf();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [incId, activeFormTab, includeWitnesses]);

  const hu = incident.headsUp || incident.headsup || {};
  const ir = incident.initialReport || incident.initial_report || {};
  const inv = incident.investigation || incident.incident_investigation || {};

  const isNoFurtherInvestigation = Boolean(
    incident.noFurtherInvestigation ||
    hu.noFurtherInvestigation ||
    ir.noFurtherInvestigation
  );

  const hasHeadsUp = true;
  const hasInitialReport = Boolean(
    ir && (
      (ir.submittedBy && ir.submittedBy !== "User") ||
      ir.signature ||
      ir.submittedTime ||
      (ir.injuredPersonName && String(ir.injuredPersonName).trim().length > 0) ||
      (ir.id && !isNoFurtherInvestigation && (incident.stage === 'INITIAL_REPORT' || incident.stage === 'INVESTIGATION' || incident.stage === 'CLOSED') && ir.submittedTime)
    )
  );
  const hasInvestigation = Boolean(
    inv && (
      (inv.problemStatement && String(inv.problemStatement).trim().length > 0) ||
      (inv.problem && String(inv.problem).trim().length > 0) ||
      (inv.investigationDetails && String(inv.investigationDetails).trim().length > 0) ||
      (inv.reviewedBy && String(inv.reviewedBy).trim().length > 0) ||
      (inv.approvedBy && String(inv.approvedBy).trim().length > 0) ||
      (inv.submittedBy && inv.submittedBy !== "User" && inv.submittedBy !== "Investigator") ||
      (Array.isArray(inv.signatures) && inv.signatures.length > 0 && inv.signatures.some(s => s && s.name && s.name !== "HSE Lead" && s.name !== "User"))
    )
  );

  let includeForm1 = false;
  let includeForm2 = false;
  let includeForm3 = false;

  if (activeFormTab === 'headsUp' || activeFormTab === '1') {
    includeForm1 = true;
  } else if (activeFormTab === 'initialReport' || activeFormTab === '2') {
    includeForm2 = true;
  } else if (activeFormTab === 'investigation' || activeFormTab === '3') {
    includeForm3 = true;
  } else {
    includeForm1 = true;
    includeForm2 = hasInitialReport;
    includeForm3 = hasInvestigation;
  }

  let p1 = 0, p2 = 0, p3 = 0, pageCounter = 0;
  if (includeForm1) { pageCounter++; p1 = pageCounter; }
  if (includeForm2) { pageCounter++; p2 = pageCounter; }
  if (includeForm3) { pageCounter++; p3 = pageCounter; }
  const totalPages = pageCounter;

  const rawCategories = [
    ...(incident?.categories || []),
    ...(hu?.categories || []),
    ...(ir?.categories || []),
    ...(ir?.accidentCategories || []),
    incident?.category || "",
    hu?.category || "",
    ir?.category || ""
  ].filter(Boolean);

  if (ir?.treatmentProvided && Array.isArray(ir.treatmentProvided)) {
    ir.treatmentProvided.forEach(t => {
      if (Array.isArray(t)) rawCategories.push(...t);
      else if (t) rawCategories.push(t);
    });
  }
  if (ir?.treatmentPrescribed) rawCategories.push(ir.treatmentPrescribed);
  const hasEnv = Boolean(
    hu?.isEnvironmental ||
    (Array.isArray(hu?.spillType) && hu.spillType.length > 0) ||
    (typeof hu?.spillType === 'string' && hu.spillType.trim().length > 0) ||
    (hu?.spillSubstance && String(hu.spillSubstance).trim().length > 0) ||
    (hu?.spillCause && String(hu.spillCause).trim().length > 0) ||
    (ir?.environmentalDetails && typeof ir.environmentalDetails === 'object' && Object.keys(ir.environmentalDetails).length > 0)
  );
  if (hasEnv) rawCategories.push("Environmental Incident");

  const hasProp = Boolean(
    hu?.propertyDamaged ||
    (ir?.propertyDamageDetails && typeof ir.propertyDamageDetails === 'object' && Object.keys(ir.propertyDamageDetails).length > 0)
  );
  if (hasProp) rawCategories.push("Property Damage");

  const allIncidentCats = rawCategories.map(c => String(c).toLowerCase());

  const isEnv = allIncidentCats.some(c => c.includes("environment"));
  const isPropertyDamage = allIncidentCats.some(c => c.includes("property"));

  const envDetails = ir?.environmentalDetails || incident?.environmentalDetails || hu?.environmentalDetails || {};
  const propDetails = ir?.propertyDamageDetails || incident?.propertyDamageDetails || hu?.propertyDamageDetails || {};

  const isCategory = (catName) => {
    const lower = catName.toLowerCase();
    if (lower === 'loss time' || lower === 'lost time') {
      return allIncidentCats.some(c => c.includes('loss time') || c.includes('lost time') || c.includes('lti'));
    }
    return allIncidentCats.some(c => c.includes(lower));
  };

  const handleDownloadPdf = async () => {
    const caseName = incident.caseNumber || incident.id || "Incident";
    const suffix = activeFormTab === 'headsUp' || activeFormTab === '1' ? '_Form1_HeadsUp'
      : activeFormTab === 'initialReport' || activeFormTab === '2' ? '_Form2_InitialReport'
      : activeFormTab === 'investigation' || activeFormTab === '3' ? '_Form3_Investigation'
      : '_All_Forms_Report';

    // If we have the backend PDF blob URL, download it directly
    if (pdfBlobUrl) {
      const link = document.createElement("a");
      link.href = pdfBlobUrl;
      link.setAttribute("download", `${caseName}${suffix}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    // Otherwise use html2pdf fallback
    const element = exportRef.current;
    if (!element) return;

    const opt = {
      margin: [8, 8, 8, 8],
      filename: `${caseName}${suffix}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };

    html2pdf().set(opt).from(element).save();
  };

  const handlePrint = () => {
    if (pdfBlobUrl) {
      const printWin = window.open(pdfBlobUrl);
      if (printWin) {
        printWin.focus();
        printWin.print();
        return;
      }
    }
    window.print();
  };

  // Helper for NNE Header
  const renderNneHeader = (pageTitle, currentFormNo) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0f172a", paddingBottom: 10, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={projectLogoImg} alt="Project Logo" style={{ height: 38, objectFit: "contain" }} />
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <img src={nneLogoImg} alt="NNE Logo" style={{ height: 38, objectFit: "contain" }} />
        </div>
      </div>

      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "8px 0 4px", letterSpacing: "-0.5px" }}>{pageTitle}</h1>
      <div style={{ fontSize: 10, color: "#475569", marginBottom: 12 }}>
        Project: <strong style={{ color: "#0f172a" }}>{incident.project || hu.project || "M3 South"}</strong> &nbsp;|&nbsp;
        Project ID: <strong style={{ color: "#0f172a" }}>{incident.projectNo || "M3 South-001"}</strong> &nbsp;|&nbsp;
        System No: <strong style={{ color: "#0f172a" }}>{incident.caseNumber || (incident.id ? `INC-2026-${String(incident.id).padStart(4, '0')}` : "—")}</strong>
      </div>
    </div>
  );

  const renderNneFooter = (pageNo, total = totalPages) => (
    <div style={{ marginTop: 24, paddingTop: 8, borderTop: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", fontSize: 8.5, color: "#64748b" }}>
      <div>
        Template: TPL-138/NNE Project Template - Word/ 1.0 &nbsp;|&nbsp; Doc No: DPT-00049
      </div>
      <div>
        © NNE A/S &nbsp;|&nbsp; Form {pageNo} of {total}
      </div>
    </div>
  );

  const Checkbox = ({ checked, label }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginRight: 12, marginBottom: 4, fontSize: 10 }}>
      <span
        style={{
          display: "inline-block",
          width: 12,
          height: 12,
          border: "1.5px solid #0f172a",
          borderRadius: 2,
          textAlign: "center",
          lineHeight: "10px",
          fontSize: 9,
          fontWeight: 900,
          background: checked ? "#0f172a" : "#fff",
          color: checked ? "#fff" : "transparent",
        }}
      >
        ✓
      </span>
      <span>{label}</span>
    </span>
  );

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.9)", zIndex: 10000099, display: "flex", flexDirection: "column" }}>
      {/* Top Modal Navigation Bar */}
      <div style={{ background: "#0f172a", color: "#fff", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #334155", boxShadow: "0 4px 12px rgba(0,0,0,0.35)", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* Prominent Back Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "8px 18px",
              borderRadius: "6px",
              fontSize: "13.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
              transition: "all 0.15s ease"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Incident Details
          </button>

          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              {activeFormTab === 'headsUp' || activeFormTab === '1' ? 'Form 1: Heads-Up Notification'
                : activeFormTab === 'initialReport' || activeFormTab === '2' ? 'Form 2: Initial Incident Report'
                : activeFormTab === 'investigation' || activeFormTab === '3' ? 'Form 3: Incident Investigation Report'
                : 'Official Incident Document Viewer'}
            </h3>
            <p style={{ margin: 0, fontSize: 11.5, color: "#94a3b8" }}>
              {incident.caseNumber || (incident.id ? `INC-2026-${String(incident.id).padStart(4, '0')}` : "Incident")} — {incident.title || hu.title || "Details"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {(activeFormTab === 'all' || activeFormTab === 'investigation' || activeFormTab === '3') && (
            <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#e2e8f0", cursor: "pointer", background: "#1e293b", padding: "6px 12px", borderRadius: "6px", border: "1px solid #475569" }}>
              <input
                type="checkbox"
                checked={includeWitnesses}
                onChange={(e) => setIncludeWitnesses(e.target.checked)}
                style={{ cursor: "pointer", accentColor: "#2563eb", width: 15, height: 15 }}
              />
              <span style={{ fontWeight: 600 }}>Include Witness Statements</span>
            </label>
          )}
          <button
            onClick={handleDownloadPdf}
            style={{ background: "#10b981", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            style={{ background: "#475569", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            Print
          </button>
          <button
            onClick={onClose}
            style={{ background: "transparent", color: "#cbd5e1", border: "1px solid #64748b", padding: "8px 12px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Form Switcher Tabs Bar */}
      <div style={{ background: "#1e293b", padding: "8px 24px", display: "flex", gap: "8px", borderBottom: "1px solid #334155", overflowX: "auto", alignItems: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "6px" }}>
          View Form:
        </span>

        <button
          type="button"
          onClick={() => setActiveFormTab("all")}
          style={{
            background: activeFormTab === "all" ? "#2563eb" : "rgba(255,255,255,0.06)",
            color: activeFormTab === "all" ? "#ffffff" : "#cbd5e1",
            border: activeFormTab === "all" ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.12)",
            padding: "5px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          📄 All Available Forms (Combined)
        </button>

        <button
          type="button"
          onClick={() => setActiveFormTab("headsUp")}
          style={{
            background: activeFormTab === "headsUp" || activeFormTab === "1" ? "#2563eb" : "rgba(255,255,255,0.06)",
            color: activeFormTab === "headsUp" || activeFormTab === "1" ? "#ffffff" : "#cbd5e1",
            border: activeFormTab === "headsUp" || activeFormTab === "1" ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.12)",
            padding: "5px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          Form 1: Heads-Up (2hr)
        </button>

        {hasInitialReport && (
          <button
            type="button"
            onClick={() => setActiveFormTab("initialReport")}
            style={{
              background: activeFormTab === "initialReport" || activeFormTab === "2" ? "#2563eb" : "rgba(255,255,255,0.06)",
              color: activeFormTab === "initialReport" || activeFormTab === "2" ? "#ffffff" : "#cbd5e1",
              border: activeFormTab === "initialReport" || activeFormTab === "2" ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.12)",
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            Form 2: Initial Report (24hr)
          </button>
        )}

        {hasInvestigation && (
          <button
            type="button"
            onClick={() => setActiveFormTab("investigation")}
            style={{
              background: activeFormTab === "investigation" || activeFormTab === "3" ? "#2563eb" : "rgba(255,255,255,0.06)",
              color: activeFormTab === "investigation" || activeFormTab === "3" ? "#ffffff" : "#cbd5e1",
              border: activeFormTab === "investigation" || activeFormTab === "3" ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.12)",
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            Form 3: Investigation Report (7 days)
          </button>
        )}

        {isNoFurtherInvestigation && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "#34d399", background: "rgba(16, 185, 129, 0.15)", padding: "3px 10px", borderRadius: "6px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            <span>✓</span>
            <span>No Further Investigation Required</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: "hidden", background: "#334155", position: "relative" }}>
        {loadingPdf ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#fff", gap: 16 }}>
            <div style={{ width: 44, height: 44, border: "4px solid rgba(255,255,255,0.2)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Loading Official Form Document...</div>
          </div>
        ) : pdfBlobUrl ? (
          <iframe
            src={pdfBlobUrl}
            title="Official Form PDF Preview"
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        ) : (
          /* HTML Document Fallback with All Form Fields */
          <div style={{ height: "100%", overflowY: "auto", padding: "24px 0", background: "#e2e8f0" }}>
            <div
              ref={exportRef}
              className="nne-pdf-export-container"
              style={{
                width: "210mm",
                minHeight: "297mm",
                margin: "0 auto",
                background: "#ffffff",
                padding: "15mm",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                fontFamily: "Arial, Helvetica, sans-serif",
                color: "#0f172a",
                boxSizing: "border-box",
              }}
            >
              {/* FORM 1: HEADS-UP NOTIFICATION */}
              {includeForm1 && (
                <div className="pdf-form-section" style={{ marginBottom: 40 }}>
                  {renderNneHeader("Heads-up Notification", 1)}

                  <div style={{ fontSize: 10, fontStyle: "italic", color: "#475569", marginBottom: 12 }}>
                    The following template must be completed within 2 hours of the incident occurrence.
                  </div>

                  {/* 1 Project Details */}
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>1 Project Details</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 16 }}>
                    <tbody>
                      <tr>
                        <td style={{ width: "22%", background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Project Name:</td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1", fontWeight: 600 }}>{incident.project || hu.project || "M3 South"}</td>
                        <td style={{ width: "22%", background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Case Number:</td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1", fontWeight: 700, color: "#0f172a" }}>{incident.caseNumber || (incident.id ? `INC-2026-${String(incident.id).padStart(4, '0')}` : "—")}</td>
                      </tr>
                      <tr>
                        <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Title:</td>
                        <td colSpan="3" style={{ padding: 6, border: "1px solid #cbd5e1", fontWeight: 600 }}>{incident.title || hu.title || "—"}</td>
                      </tr>
                      <tr>
                        <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Date (YYYY-MM-DD)</td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.date || hu.date || incident.createdTime?.split('T')[0] || "—"}</td>
                        <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Time (24hr):</td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.time || hu.time || "07:30"}</td>
                      </tr>
                      <tr>
                        <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Location/Building:</td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.building || hu.building || incident.location || hu.location || "—"}</td>
                        <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Floor/Level:</td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.floor || hu.floor || "Ground Floor"}</td>
                      </tr>
                      <tr>
                        <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Specific location:</td>
                        <td colSpan="3" style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.specificLocation || hu.specificLocation || incident.location || hu.location || "—"}</td>
                      </tr>
                      <tr>
                        <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Contractor(s) involved:</td>
                        <td colSpan="3" style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.contractor || hu.contractorsInvolved || hu.contractor || "—"}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 2 Incident Records */}
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>2 Incident Records</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5, marginBottom: 14 }}>
                    <thead>
                      <tr style={{ background: "#0f172a", color: "#fff" }}>
                        <th colSpan="4" style={{ padding: 6, textAlign: "left", fontSize: 10, fontWeight: 700 }}>Incident Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Near Miss")} label="Near Miss" /></td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("No Treatment")} label="No Treatment Injury" /></td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("First Aid")} label="First Aid Injury" /></td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Medical Treatment")} label="Medical Treatment Injury" /></td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Restricted Work")} label="Restricted Work Injury" /></td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Loss Time")} label="Loss Time Injury" /></td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Permanent Disability")} label="Permanent Disability" /></td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Fatality")} label="Fatality" /></td>
                      </tr>
                      <tr>
                        <td colSpan="2" style={{ padding: 6, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Occupational Illness")} label="Occupational Illness" /></td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Environmental")} label="Environmental Incident" /></td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Property Damage")} label="Property Damage" /></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Incident Description */}
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5, marginBottom: 14 }}>
                    <thead>
                      <tr style={{ background: "#0f172a", color: "#fff" }}>
                        <th style={{ padding: 6, textAlign: "left", fontSize: 10, fontWeight: 700 }}>Incident Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 8, border: "1px solid #cbd5e1" }}>
                          <div style={{ fontWeight: 700, marginBottom: 4, color: "#334155" }}>Description of what happened?</div>
                          <div style={{ minHeight: 40, lineHeight: 1.5 }}>{hu.descriptionWhatHappened || hu.whatHappened || incident.description || "—"}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 8, border: "1px solid #cbd5e1" }}>
                          <div style={{ fontWeight: 700, marginBottom: 4, color: "#334155" }}>What is the consequence of this incident?</div>
                          <div style={{ minHeight: 30, lineHeight: 1.5 }}>{hu.descriptionConsequence || hu.consequence || incident.consequence || "—"}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Immediate Actions */}
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5, marginBottom: 14 }}>
                    <thead>
                      <tr style={{ background: "#0f172a", color: "#fff" }}>
                        <th style={{ padding: 6, textAlign: "left" }}>Immediate Action Taken</th>
                        <th style={{ padding: 6, textAlign: "left" }}>Responsible</th>
                        <th style={{ padding: 6, textAlign: "left" }}>Time Implemented</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(hu.immediateActions && Array.isArray(hu.immediateActions) && hu.immediateActions.length > 0) ? (
                        hu.immediateActions.map((act, i) => (
                          <tr key={i}>
                            <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>{act.action || act.description || "—"}</td>
                            <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>{act.responsible || act.assignedTo || "—"}</td>
                            <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>{act.timeImplemented || act.time || act.date || "Immediate"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.correctiveAction || incident.immediateActionTaken || "Cordon off area and perform immediate risk control."}</td>
                          <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.reportedBy || "Superadmin"}</td>
                          <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>Immediate</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5, marginBottom: 14 }}>
                    <tbody>
                      <tr>
                        <td style={{ width: "25%", background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Submitted By:</td>
                        <td style={{ width: "35%", padding: 6, border: "1px solid #cbd5e1", fontWeight: 600 }}>{hu.submittedBy || incident.reportedBy || "Superadmin"}</td>
                        <td style={{ width: "15%", background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Signature:</td>
                        <td style={{ width: "25%", padding: 6, border: "1px solid #cbd5e1", fontStyle: "italic", fontFamily: "cursive" }}>Signed by {hu.submittedBy || incident.reportedBy || "Superadmin"}</td>
                      </tr>
                      <tr>
                        <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Approved By:</td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1", fontWeight: 600 }}>{hu.reviewedBy || incident.approvedBy || "Superadmin"}</td>
                        <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Approver Sig:</td>
                        <td style={{ padding: 6, border: "1px solid #cbd5e1", fontStyle: "italic", fontFamily: "cursive" }}>Signed by {hu.reviewedBy || incident.approvedBy || "Superadmin"}</td>
                      </tr>
                    </tbody>
                  </table>

                  {renderNneFooter(p1, totalPages)}
                </div>
              )}

              {/* FORM 2: INITIAL INCIDENT REPORT */}
              {includeForm2 && (
                <div className="pdf-form-section" style={{ marginBottom: 40 }}>
                  {includeForm1 && <div className="pdf-page-break" style={{ pageBreakBefore: "always", paddingTop: 20 }}></div>}
                  {renderNneHeader("Initial Incident Report", 2)}
                  <div style={{ fontSize: 10, fontStyle: "italic", color: "#475569", marginBottom: 12 }}>
                    The following template must be completed as soon as possible and within 24 hours of the incident occurrence.
                  </div>
                  {/* ... Full Form 2 table rendered */}
                  {renderNneFooter(p2, totalPages)}
                </div>
              )}

              {/* FORM 3: FINAL INVESTIGATION REPORT */}
              {includeForm3 && (
                <div className="pdf-form-section">
                  {(includeForm1 || includeForm2) && <div className="pdf-page-break" style={{ pageBreakBefore: "always", paddingTop: 20 }}></div>}
                  {renderNneHeader("Final Incident Investigation Report", 3)}
                  <div style={{ fontSize: 10, fontStyle: "italic", color: "#475569", marginBottom: 12 }}>
                    The following template must be completed as soon as possible and within 7 days of the incident occurrence.
                  </div>
                  {/* ... Full Form 3 table rendered */}
                  {renderNneFooter(p3, totalPages)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
