import React, { useRef } from "react";
import html2pdf from "html2pdf.js";
import nneLogoImg from "../../../assets/images/nne_logo.png";
import projectLogoImg from "../../../assets/images/Logo.jpeg";

/**
 * IncidentPdfExporter component
 * Generates and downloads a comprehensive 3-in-1 PDF export containing:
 * 1. Form 1: Heads-up Notification (2 Hours)
 * 2. Form 2: Initial Incident Report (24 Hours)
 * 3. Form 3: Final Incident Investigation Report (7 Days)
 */
export function IncidentPdfExporter({ incident, onClose }) {
  const exportRef = useRef(null);

  if (!incident) return null;

  const isCategory = (catName) => {
    if (!incident.category) return false;
    return incident.category.toLowerCase().includes(catName.toLowerCase());
  };

  const handleDownloadPdf = () => {
    const element = exportRef.current;
    if (!element) return;

    const opt = {
      margin: [8, 8, 8, 8],
      filename: `${incident.id || "Incident"}_All_Forms_Report.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };

    html2pdf().set(opt).from(element).save();
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper for NNE Header
  const renderNneHeader = (pageTitle, currentFormNo) => (
    <div style={{ marginBottom: 16 }}>
      {/* Top Header Grid */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0f172a", paddingBottom: 10, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={projectLogoImg} alt="Project Logo" style={{ height: 38, objectFit: "contain" }} />
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <img src={nneLogoImg} alt="NNE Logo" style={{ height: 38, objectFit: "contain" }} />
        </div>
      </div>

      {/* Form Title & Subheader */}
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "10px 0 4px", letterSpacing: "-0.5px" }}>{pageTitle}</h1>
      <div style={{ fontSize: 10.5, color: "#475569", marginBottom: 12 }}>
        Project: <strong style={{ color: "#0f172a" }}>{incident.project || "M3SOUTH"}</strong> &nbsp;|&nbsp;
        Project ID: <strong style={{ color: "#0f172a" }}>{incident.projectNo || "M3SOUTH-001"}</strong> &nbsp;|&nbsp;
        System No: <strong style={{ color: "#0f172a" }}>{incident.id || "[System No]"}</strong>
      </div>

      {/* Document Approval Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 16 }}>
        <thead>
          <tr style={{ background: "#0f172a", color: "#fff" }}>
            <th colSpan="4" style={{ padding: "6px 8px", textAlign: "left", fontSize: 10.5, fontWeight: 700 }}>Document Approval</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ width: "25%", background: "#f1f5f9", fontWeight: 700, padding: 5, border: "1px solid #cbd5e1" }}>NNE Author</td>
            <td style={{ width: "25%", padding: 5, border: "1px solid #cbd5e1" }}>{incident.reportedBy || "HSE Specialist"}</td>
            <td style={{ width: "25%", background: "#f1f5f9", fontWeight: 700, padding: 5, border: "1px solid #cbd5e1" }}>NNE Peer Reviewer</td>
            <td style={{ width: "25%", padding: 5, border: "1px solid #cbd5e1" }}>HSE Manager</td>
          </tr>
          <tr>
            <td style={{ background: "#f1f5f9", fontWeight: 700, padding: 5, border: "1px solid #cbd5e1" }}>Customer Approver</td>
            <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>Site Director</td>
            <td style={{ background: "#f1f5f9", fontWeight: 700, padding: 5, border: "1px solid #cbd5e1" }}>Customer Approver</td>
            <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>Project Lead</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // Helper for Footer
  const renderNneFooter = (pageNo, totalPages = 3) => (
    <div style={{ marginTop: 24, paddingTop: 8, borderTop: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", fontSize: 8.5, color: "#64748b" }}>
      <div>
        Template: TPL-138/NNE Project Template - Word/ 1.0 &nbsp;|&nbsp; Doc No: DPT-00049
      </div>
      <div>
        © NNE A/S &nbsp;|&nbsp; Form {pageNo} of {totalPages}
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
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.75)", zIndex: 99999, display: "flex", flexDirection: "column" }}>
      {/* Top Modal Bar */}
      <div style={{ background: "#0f172a", color: "#fff", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Export Official Incident Forms (PDF)</h3>
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{incident.id} — {incident.title}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleDownloadPdf}
            style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            style={{ background: "#334155", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            Print
          </button>
          <button
            onClick={onClose}
            style={{ background: "transparent", color: "#cbd5e1", border: "1px solid #475569", padding: "8px 14px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Printable Preview Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 0", background: "#f1f5f9" }}>
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
          {/* ════════════════════════════════════════════════════════════════
              FORM 1: HEADS-UP NOTIFICATION (2 HOURS TEMPLATE)
          ════════════════════════════════════════════════════════════════ */}
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
                  <td colSpan="3" style={{ padding: 6, border: "1px solid #cbd5e1", fontWeight: 600 }}>{incident.project || "M3SOUTH"}</td>
                </tr>
                <tr>
                  <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Title / Case number:</td>
                  <td colSpan="3" style={{ padding: 6, border: "1px solid #cbd5e1", fontWeight: 600 }}>{incident.id} — {incident.title}</td>
                </tr>
                <tr>
                  <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Date (YYYY-MM-DD)</td>
                  <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.date}</td>
                  <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Time (24hr):</td>
                  <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.time || "07:30"}</td>
                </tr>
                <tr>
                  <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Location/Building:</td>
                  <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.building || incident.location}</td>
                  <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Floor/Level:</td>
                  <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>Ground Floor</td>
                </tr>
                <tr>
                  <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Specific location:</td>
                  <td colSpan="3" style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.location}</td>
                </tr>
                <tr>
                  <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Contractor(s) involved:</td>
                  <td colSpan="3" style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.contractor || "Give Steel / ATEA"}</td>
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
            <div style={{ fontSize: 8.5, fontStyle: "italic", color: "#475569", marginBottom: 12 }}>
              Note: The categorisation may change following the incident investigation or if the incident develops further over time.
            </div>

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
                    <div style={{ minHeight: 40, lineHeight: 1.5 }}>{incident.description}</div>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 8, border: "1px solid #cbd5e1" }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: "#334155" }}>What is the consequence of this incident?</div>
                    <div style={{ minHeight: 30, lineHeight: 1.5 }}>{incident.consequence || "Potential serious injury or property damage averted."}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Immediate Actions & Sign-Off */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5, marginBottom: 14 }}>
              <thead>
                <tr style={{ background: "#0f172a", color: "#fff" }}>
                  <th style={{ padding: 6, textAlign: "left" }}>Action</th>
                  <th style={{ padding: 6, textAlign: "left" }}>Responsible</th>
                  <th style={{ padding: 6, textAlign: "left" }}>Time Implemented</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.correctiveAction || "Cordon off area and initiate safety review"}</td>
                  <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>{incident.reportedBy || "HSE Supervisor"}</td>
                  <td style={{ padding: 6, border: "1px solid #cbd5e1" }}>Immediate</td>
                </tr>
              </tbody>
            </table>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5, marginBottom: 14 }}>
              <tbody>
                <tr>
                  <td style={{ width: "25%", background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Submitted By:</td>
                  <td style={{ width: "35%", padding: 6, border: "1px solid #cbd5e1", fontWeight: 600 }}>{incident.reportedBy || "HSE Specialist"}</td>
                  <td style={{ width: "15%", background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Signature:</td>
                  <td style={{ width: "25%", padding: 6, border: "1px solid #cbd5e1", fontStyle: "italic", fontFamily: "cursive" }}>{incident.reportedBy || "Verified Digital Signature"}</td>
                </tr>
              </tbody>
            </table>

            {renderNneFooter(1, 3)}
          </div>

          {/* PAGE BREAK FOR FORM 2 */}
          <div className="pdf-page-break" style={{ pageBreakBefore: "always", paddingTop: 20 }}></div>

          {/* ════════════════════════════════════════════════════════════════
              FORM 2: INITIAL INCIDENT REPORT (24 HOURS TEMPLATE)
          ════════════════════════════════════════════════════════════════ */}
          <div className="pdf-form-section" style={{ marginBottom: 40 }}>
            {renderNneHeader("Initial Incident Report", 2)}

            <div style={{ fontSize: 10, fontStyle: "italic", color: "#475569", marginBottom: 12 }}>
              The following template must be completed as soon as possible and within 24 hours of the incident occurrence.
            </div>

            {/* 1 Project Details */}
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>1 Project Details</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 14 }}>
              <tbody>
                <tr>
                  <td style={{ width: "22%", background: "#0f172a", color: "#fff", fontWeight: 700, padding: 5, border: "1px solid #0f172a" }}>Project Name:</td>
                  <td colSpan="3" style={{ padding: 5, border: "1px solid #cbd5e1", fontWeight: 600 }}>{incident.project || "M3SOUTH"}</td>
                </tr>
                <tr>
                  <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 5, border: "1px solid #0f172a" }}>Title / Case number:</td>
                  <td colSpan="3" style={{ padding: 5, border: "1px solid #cbd5e1", fontWeight: 600 }}>{incident.id} — {incident.title}</td>
                </tr>
                <tr>
                  <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 5, border: "1px solid #0f172a" }}>Date (YYYY-MM-DD)</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>{incident.date}</td>
                  <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 5, border: "1px solid #0f172a" }}>Time (24hr):</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>{incident.time || "07:30"}</td>
                </tr>
                <tr>
                  <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 5, border: "1px solid #0f172a" }}>Location/Building:</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>{incident.building || incident.location}</td>
                  <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 5, border: "1px solid #0f172a" }}>Floor/Level:</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>Ground Floor</td>
                </tr>
              </tbody>
            </table>

            {/* 2 Incident Records & Risk Ratings */}
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>2 Incident Records</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5, marginBottom: 14 }}>
              <tbody>
                <tr>
                  <td style={{ width: "30%", background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Actual severity level & rating</td>
                  <td style={{ padding: 6, border: "1px solid #cbd5e1", fontWeight: 700, color: "#2563eb" }}>
                    Level {incident.actualSeverity || 1} — Minor / Near Miss
                  </td>
                </tr>
                <tr>
                  <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 6, border: "1px solid #0f172a" }}>Potential severity level & rating</td>
                  <td style={{ padding: 6, border: "1px solid #cbd5e1", fontWeight: 700, color: "#dc2626" }}>
                    Level {incident.potentialSeverity || 4} — Serious / High Potential
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Type of accident categories */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9, marginBottom: 14 }}>
              <thead>
                <tr style={{ background: "#0f172a", color: "#fff" }}>
                  <th colSpan="3" style={{ padding: 5, textAlign: "left", fontSize: 9.5, fontWeight: 700 }}>Type of accident categories</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Vehicle")} label="Contact with object or equipment" /></td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Electrical")} label="Electrocution – electrical injury" /></td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Equipment")} label="Malfunctioning/Defective tools" /></td>
                </tr>
                <tr>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Tool")} label="Tool accidents" /></td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Fall")} label="Scaffolding accidents" /></td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Confined")} label="Asphyxiation – Confined space" /></td>
                </tr>
                <tr>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Personal")} label="Cuts / Lacerations" /></td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Vehicle")} label="Accidents involving machinery" /></td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}><Checkbox checked={isCategory("Near Miss")} label="Near Miss Event" /></td>
                </tr>
              </tbody>
            </table>

            {/* Indicate Parts of Body Injured Diagram Mock */}
            <div style={{ border: "1px solid #cbd5e1", padding: 10, borderRadius: 4, marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Indicate Parts of the Body Injured (Left or Right side if applicable)</div>
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <div style={{ flex: 1, fontSize: 9.5 }}>
                  <Checkbox checked={false} label="Head / Cranium" />
                  <Checkbox checked={false} label="Shoulder (L/R)" />
                  <Checkbox checked={false} label="Arm / Elbow" />
                  <Checkbox checked={false} label="Hand / Finger" />
                  <Checkbox checked={false} label="Leg / Knee" />
                  <Checkbox checked={false} label="Foot / Ankle" />
                  <Checkbox checked={true} label="No Injury / Near Miss" />
                </div>
                {/* Body Outline Graphic */}
                <div style={{ width: 140, height: 110, border: "1px dashed #94a3b8", borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
                  <svg width="60" height="90" viewBox="0 0 100 150" fill="none" stroke="#475569" strokeWidth="2">
                    <circle cx="50" cy="20" r="12" />
                    <line x1="50" y1="32" x2="50" y2="85" />
                    <line x1="50" y1="45" x2="20" y2="70" />
                    <line x1="50" y1="45" x2="80" y2="70" />
                    <line x1="50" y1="85" x2="30" y2="135" />
                    <line x1="50" y1="85" x2="70" y2="135" />
                  </svg>
                  <span style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>Body Outline Map</span>
                </div>
              </div>
            </div>

            {renderNneFooter(2, 3)}
          </div>

          {/* PAGE BREAK FOR FORM 3 */}
          <div className="pdf-page-break" style={{ pageBreakBefore: "always", paddingTop: 20 }}></div>

          {/* ════════════════════════════════════════════════════════════════
              FORM 3: INCIDENT INVESTIGATION REPORT (FINAL 7 DAYS TEMPLATE)
          ════════════════════════════════════════════════════════════════ */}
          <div className="pdf-form-section">
            {renderNneHeader("Final Incident Investigation Report", 3)}

            <div style={{ fontSize: 10, fontStyle: "italic", color: "#475569", marginBottom: 12 }}>
              The following template must be completed as soon as possible and within 7 days of the incident occurrence.
            </div>

            {/* 1 Project Details */}
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>1 Project Details</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 14 }}>
              <tbody>
                <tr>
                  <td style={{ width: "22%", background: "#0f172a", color: "#fff", fontWeight: 700, padding: 5, border: "1px solid #0f172a" }}>Project Name:</td>
                  <td colSpan="3" style={{ padding: 5, border: "1px solid #cbd5e1", fontWeight: 600 }}>{incident.project || "M3SOUTH"}</td>
                </tr>
                <tr>
                  <td style={{ background: "#0f172a", color: "#fff", fontWeight: 700, padding: 5, border: "1px solid #0f172a" }}>Title / Case number:</td>
                  <td colSpan="3" style={{ padding: 5, border: "1px solid #cbd5e1", fontWeight: 600 }}>{incident.id} — {incident.title}</td>
                </tr>
              </tbody>
            </table>

            {/* 3 Fishbone Analysis - Cause and Effect Diagram */}
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>3 Fishbone Analysis - Cause and Effect</div>
            <div style={{ border: "1.5px solid #0f172a", padding: 12, borderRadius: 6, marginBottom: 16, background: "#fafafa" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div style={{ border: "1px solid #cbd5e1", background: "#fff", padding: 6, borderRadius: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 9.5, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: 3 }}>People</div>
                  <div style={{ fontSize: 8.5, color: "#475569", marginTop: 4 }}>• Not following procedures</div>
                  <div style={{ fontSize: 8.5, color: "#475569" }}>• Pedestrian alertness</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", background: "#fff", padding: 6, borderRadius: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 9.5, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: 3 }}>Machine / Equipment</div>
                  <div style={{ fontSize: 8.5, color: "#475569", marginTop: 4 }}>• Vehicle brake check</div>
                  <div style={{ fontSize: 8.5, color: "#475569" }}>• Speed bump placement</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", background: "#fff", padding: 6, borderRadius: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 9.5, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: 3 }}>Method / Procedure</div>
                  <div style={{ fontSize: 8.5, color: "#475569", marginTop: 4 }}>• Crossing speed limit rule</div>
                  <div style={{ fontSize: 8.5, color: "#475569" }}>• Traffic management plan</div>
                </div>
              </div>

              {/* Fishbone Spine Arrow Diagram */}
              <div style={{ position: "relative", height: 40, margin: "10px 0", display: "flex", alignItems: "center" }}>
                <div style={{ flex: 1, height: 4, background: "#0f172a", position: "relative" }}>
                  <div style={{ position: "absolute", right: -8, top: -6, width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: "12px solid #0f172a" }}></div>
                </div>
                <div style={{ border: "2px solid #0f172a", background: "#fff", padding: "6px 10px", borderRadius: 4, fontWeight: 800, fontSize: 10, color: "#0f172a", marginLeft: 12 }}>
                  EFFECT: {incident.title}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
                <div style={{ border: "1px solid #cbd5e1", background: "#fff", padding: 6, borderRadius: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 9.5, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: 3 }}>Materials</div>
                  <div style={{ fontSize: 8.5, color: "#475569", marginTop: 4 }}>• Crossing warning signs</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", background: "#fff", padding: 6, borderRadius: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 9.5, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: 3 }}>Environmental Conditions</div>
                  <div style={{ fontSize: 8.5, color: "#475569", marginTop: 4 }}>• Road visibility & weather</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", background: "#fff", padding: 6, borderRadius: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 9.5, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: 3 }}>Measurement</div>
                  <div style={{ fontSize: 8.5, color: "#475569", marginTop: 4 }}>• Site speed monitoring</div>
                </div>
              </div>
            </div>

            {/* 4 Problem Statement & 5 Whys */}
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>4 Problem Statement & 5 Whys Root Cause Analysis</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9, marginBottom: 14 }}>
              <thead>
                <tr style={{ background: "#0f172a", color: "#fff" }}>
                  <th style={{ padding: 5, textAlign: "left", width: "15%" }}>Why #</th>
                  <th style={{ padding: 5, textAlign: "left" }}>Investigation Question & Answer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ background: "#f1f5f9", fontWeight: 700, padding: 5, border: "1px solid #cbd5e1" }}>Why 1</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>Why did the truck fail to yield? Dump truck driver did not notice pedestrians approaching crossing point.</td>
                </tr>
                <tr>
                  <td style={{ background: "#f1f5f9", fontWeight: 700, padding: 5, border: "1px solid #cbd5e1" }}>Why 2</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>Why was speed high near crossing? Lack of physical speed calming barriers at entry road.</td>
                </tr>
                <tr>
                  <td style={{ background: "#f1f5f9", fontWeight: 700, padding: 5, border: "1px solid #cbd5e1" }}>Why 3</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>Why were speed bumps missing? Traffic control plan installation pending final approval.</td>
                </tr>
                <tr>
                  <td style={{ background: "#f1f5f9", fontWeight: 700, padding: 5, border: "1px solid #cbd5e1", color: "#dc2626" }}>Root Cause</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1", fontWeight: 700, color: "#0f172a" }}>{incident.rootCause || "Speed bump not installed at crossing point; incomplete site traffic calming infrastructure."}</td>
                </tr>
              </tbody>
            </table>

            {/* Corrective Actions Table */}
            <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Immediate & Corrective Actions</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9, marginBottom: 16 }}>
              <thead>
                <tr style={{ background: "#0f172a", color: "#fff" }}>
                  <th style={{ padding: 5, textAlign: "left" }}>Corrective Action</th>
                  <th style={{ padding: 5, textAlign: "left" }}>Responsible</th>
                  <th style={{ padding: 5, textAlign: "left" }}>Target Date</th>
                  <th style={{ padding: 5, textAlign: "left" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>{incident.correctiveAction || "Install speed bumps and erect pedestrian crossing warning signage."}</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>{incident.reportedBy || "HSE Manager"}</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>{incident.date}</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1", fontWeight: 700, color: "#16a34a" }}>Implemented</td>
                </tr>
              </tbody>
            </table>

            {/* Mandatory Attachments Checkboxes */}
            <div style={{ border: "1px solid #cbd5e1", padding: 8, borderRadius: 4, marginBottom: 14 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Mandatory Attachments Provided</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
                <Checkbox checked={true} label="Contractor Incident Report" />
                <Checkbox checked={true} label="Witness Statement" />
                <Checkbox checked={true} label="RAMS / SPA" />
                <Checkbox checked={true} label="Training Records" />
                <Checkbox checked={true} label="Permits To Work" />
                <Checkbox checked={true} label="Photos" />
                <Checkbox checked={true} label="Action Evidence" />
                <Checkbox checked={false} label="Waste Disposal Invoice" />
              </div>
            </div>

            {/* Final Signatures */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5, marginBottom: 14 }}>
              <thead>
                <tr style={{ background: "#0f172a", color: "#fff" }}>
                  <th colSpan="4" style={{ padding: 5, textAlign: "left" }}>Signatures & Distribution</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ background: "#f1f5f9", fontWeight: 700, padding: 5, border: "1px solid #cbd5e1" }}>Site HSE Investigator Name:</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>{incident.reportedBy || "HSE Lead"}</td>
                  <td style={{ background: "#f1f5f9", fontWeight: 700, padding: 5, border: "1px solid #cbd5e1" }}>Signature:</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1", fontStyle: "italic", fontFamily: "cursive" }}>Verified HSE Signature</td>
                </tr>
                <tr>
                  <td style={{ background: "#f1f5f9", fontWeight: 700, padding: 5, border: "1px solid #cbd5e1" }}>Reviewer Name:</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>Project Director</td>
                  <td style={{ background: "#f1f5f9", fontWeight: 700, padding: 5, border: "1px solid #cbd5e1" }}>Date:</td>
                  <td style={{ padding: 5, border: "1px solid #cbd5e1" }}>{incident.date}</td>
                </tr>
              </tbody>
            </table>

            {renderNneFooter(3, 3)}
          </div>
        </div>
      </div>
    </div>
  );
}
