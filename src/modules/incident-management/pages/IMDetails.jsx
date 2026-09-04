import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import { getIncidentById, updateHeadsUp, approveHeadsUp, submitInitialReport, approveInitialReport, getActionItems, addActionItem, updateActionItem, deleteActionItem, saveInvestigation, reviewInvestigation, closeIncident, exportIncidentPdf, uploadIncidentAttachment, returnForRevision } from "../../../services/incidentService";
import { getBuildings, getFloors, getContractors } from "../../../services/authService";
import { showSuccess, showError } from "../../../components/common/Toast/Toast";
import Loader from "../../../components/common/Loader/Loader";
import nneLogo from "../../../assets/images/nne_logo.png";
import novoLogo from "../../../assets/images/Logo.jpeg";
import { IncidentPdfExporter } from "../components/IncidentPdfExporter";
import "../../../styles/module-shared.css";
import "./IMDetails.css";
import { AnalogTimePicker } from "./IMCreate";

const getAttachmentUrl = (url) => {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  const clean = url.replace(/^\/+/, "");
  return `${baseUrl}/${clean}`;
};

const severityMeta = (level) => {
  const meta = {
    1: { level: 1, label: "Low", color: "#FBBF24" },
    2: { level: 2, label: "Minor", color: "#C07D10" },
    3: { level: 3, label: "Moderate", color: "#D97706" },
    4: { level: 4, label: "Critical", color: "#E32B50" },
    5: { level: 5, label: "Catastrophic", color: "#8F1B32" }
  };
  return meta[level] || { level: level || 1, label: "", color: "#A1A5B3" };
};

const SevPill = ({ level }) => {
  const m = severityMeta(level);
  return (
    <span className="badge" style={{ background: `${m.color}22`, color: m.color, fontWeight: 700 }}>
      {m.level} {m.label ? `┬╖ ${m.label}` : ""}
    </span>
  );
};

const getLogoUrl = (logoVal) => {
  if (!logoVal) return null;
  if (logoVal.startsWith("data:") || logoVal.startsWith("http://") || logoVal.startsWith("https://")) return logoVal;
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  return `${baseUrl}/subcontractors/${logoVal}`;
};

const findContractorLogo = (contractorName, contractorsList = []) => {
  if (!contractorName || contractorName === 'Unassigned' || contractorName === 'ΓÇö') return null;
  const match = (contractorsList || []).find(c => {
    const cName = c.company_name || c.companyName || c.subContractorName || c.subcontractor_name || c.name || '';
    return cName.toLowerCase().trim() === String(contractorName).toLowerCase().trim() ||
           cName.toLowerCase().includes(String(contractorName).toLowerCase().trim()) ||
           String(contractorName).toLowerCase().includes(cName.toLowerCase().trim());
  });
  return match?.logo || match?.logo_url || match?.company_logo || match?.logoFile || null;
};

const ContractorLogo = ({ logoVal, name, size = 22 }) => {
  const [hasError, setHasError] = useState(false);

  const getInitials = (n) => {
    if (!n) return "??";
    let cleanName = String(n).replace(/&\w+;/g, "").replace(/#\s*\w+;/g, "");
    cleanName = cleanName.replace(/[^a-zA-Z0-9\s]/g, "").trim();
    const words = cleanName.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return "??";
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : "")).toUpperCase();
  };

  const getColor = (n) => {
    if (!n) return "#3B82F6";
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#6366F1", "#06B6D4", "#14B8A6"];
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const logoUrl = getLogoUrl(logoVal);

  if (logoUrl && !hasError) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: "contain",
          borderRadius: "50%",
          flexShrink: 0,
          background: "#ffffff",
          border: "1px solid var(--border-color, #E5E7EB)",
          padding: "1px"
        }}
        onError={() => setHasError(true)}
      />
    );
  }

  const bgCol = getColor(name);
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundColor: bgCol,
        color: "#FFFFFF",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        fontSize: `${Math.max(9, Math.floor(size * 0.42))}px`,
        flexShrink: 0,
        letterSpacing: "0.5px"
      }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};

const DetailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 13 4 4L19 7" />
  </svg>
);

const SignaturePad = ({ value, onChange, onClear }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { 
      x: (clientX - rect.left) * scaleX, 
      y: (clientY - rect.top) * scaleY 
    };
  };

  const startDrawing = (e) => {
    // e.preventDefault(); // Don't prevent default on start to allow scrolling if needed, unless we are drawing
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent scrolling while actively drawing
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      setIsDrawing(false);
      if (onChange && canvasRef.current) {
        onChange(canvasRef.current.toDataURL("image/png"));
      }
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onClear) onClear();
    if (onChange) onChange(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          position: "relative",
          border: "1px dashed var(--border-color)",
          borderRadius: 6,
          height: 120,
          background: "#f8fafc",
          touchAction: "none",
          overflow: "hidden"
        }}
      >
        {!value && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "var(--text-muted)", pointerEvents: "none", fontSize: 14 }}>Draw your signature here</div>}
        <canvas
          ref={canvasRef}
          width={800}
          height={120}
          style={{ width: "100%", height: "100%", cursor: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='black'%3E%3Cpath d='M7.127 22.562l-7.127 1.438 1.438-7.128 5.689 5.69zm1.414-1.414l11.228-11.225-5.69-5.692-11.227 11.227 5.689 5.69zm9.768-21.148l-2.816 2.817 5.691 5.691 2.816-2.819-5.691-5.689z'/%3E%3C/svg%3E\") 0 20, pointer", display: "block" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
      <button
        type="button"
        style={{ alignSelf: "flex-start", color: "#e11d48", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: 0 }}
        onClick={handleClear}
      >
        Clear signature
      </button>
    </div>
  );
};

const getLoggedInUser = () => {
  try {
    const u = localStorage.getItem("user");
    if (!u) return "";
    const parsed = JSON.parse(u);
    return parsed.name || parsed.username || parsed.email || parsed.userName || parsed.firstName || u;
  } catch (e) {
    return localStorage.getItem("user") || "";
  }
};

const isContractorUser = () => {
  try {
    const u = localStorage.getItem("user");
    const userType = localStorage.getItem("UserType") || "";
    if (!u && !userType) return false;
    const parsed = typeof u === "string" && u.startsWith("{") ? JSON.parse(u) : {};
    const role = String(userType || parsed.role || parsed.userType || parsed.user_type || "").toLowerCase();
    const username = String(parsed.username || parsed.name || "").toLowerCase();
    return role.includes("contractor") || role.includes("subcontractor") || Boolean(parsed.subcontractor_id) || Boolean(parsed.contractorId) || Boolean(parsed.typeId && role.includes("subcontractor")) || username.includes("contractor");
  } catch (e) {
    return false;
  }
};

const isNneUser = () => {
  if (isContractorUser()) return false;
  try {
    const u = localStorage.getItem("user");
    if (!u) return true;
    const parsed = typeof u === "string" && u.startsWith("{") ? JSON.parse(u) : {};
    const role = String(parsed.role || parsed.userType || parsed.user_type || "").toLowerCase();
    const dept = String(parsed.department || parsed.departmentName || parsed.dept || "").toLowerCase();
    const company = String(parsed.company || parsed.companyName || "").toLowerCase();
    const username = String(parsed.username || parsed.name || u).toLowerCase();

    if (
      role.includes("superadmin") ||
      role.includes("admin") ||
      role.includes("department") ||
      role.includes("department1") ||
      role.includes("dept") ||
      role.includes("nne") ||
      role.includes("hse") ||
      role.includes("manager") ||
      role.includes("safety") ||
      role.includes("employee")
    ) return true;

    if (
      dept.includes("nne") ||
      dept.includes("hse") ||
      dept.includes("safety") ||
      dept.includes("department") ||
      dept.includes("department1") ||
      dept.includes("dept")
    ) return true;

    if (company.includes("nne") || company.includes("client")) return true;
    if (
      username.includes("superadmin") ||
      username.includes("admin") ||
      username.includes("department") ||
      username.includes("department1") ||
      username.includes("nne")
    ) return true;

    return !isContractorUser();
  } catch (e) {
    return true;
  }
};

const dataURLtoBlob = (dataurl) => {
  if (!dataurl || typeof dataurl !== "string" || !dataurl.startsWith("data:")) return null;
  try {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    return null;
  }
};

const extractSevNum = (val) => {
  if (val === undefined || val === null || val === "") return "";
  const m = String(val).trim().match(/^[1-5]/);
  return m ? m[0] : String(val);
};

const parseEnvOptions = (val) => {
  if (!val) return { arr: [], other: "" };
  let arr = [];
  let other = "";
  const rawList = Array.isArray(val) ? val : typeof val === "string" ? val.split(",").map(s => s.trim()).filter(Boolean) : [];
  rawList.forEach(item => {
    if (typeof item === "string" && (item.startsWith("Other: ") || item.startsWith("Other:"))) {
      arr.push("Other");
      other = item.replace(/^Other:\s*/, "");
    } else if (item === "Other") {
      arr.push("Other");
    } else if (item) {
      arr.push(item);
    }
  });
  return { arr, other };
};

export default function IMDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rawIncident, setRawIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contractorsList, setContractorsList] = useState([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingForm, setDownloadingForm] = useState(null);
  const [showPdfExport, setShowPdfExport] = useState(false);
  const [pdfTargetForm, setPdfTargetForm] = useState("all");

  const [isEditingHeadsUp, setIsEditingHeadsUp] = useState(false);
  const [isEditingInitialReport, setIsEditingInitialReport] = useState(false);
  const [isEditingInvestigation, setIsEditingInvestigation] = useState(false);

  const handleExportPdf = async () => {
    const incObj = rawIncident?.incident || rawIncident || {};
    const incId = incObj?.id || id;
    if (!incId) return;

    const result = await Swal.fire({
      title: "Include Witness Section?",
      text: "Do you want to include the Witness Statements section in the exported PDF report?",
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Yes, Include",
      denyButtonText: "No, Exclude",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#0f172a",
      denyButtonColor: "#64748b"
    });

    if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
      return;
    }

    const includeWitnesses = result.isConfirmed;

    try {
      setDownloadingPdf(true);
      showSuccess("Downloading incident PDF report from backend...");
      const blobData = await exportIncidentPdf(incId, "all", includeWitnesses);

      const blob = new Blob([blobData], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const caseNo = incObj?.caseNumber || incObj?.id || id;
      link.setAttribute("download", `Incident_Report_${caseNo}_All_Forms.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF from backend:", err);
      showError("Could not download PDF from backend API directly. Opening exporter preview...");
      setPdfTargetForm("all");
      setShowPdfExport(true);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleExportSingleForm = async (formKey, formTitle) => {
    const incObj = rawIncident?.incident || rawIncident || {};
    const incId = incObj?.id || id;
    if (!incId) return;

    let includeWitnesses = false;
    if (formKey === "investigation") {
      const result = await Swal.fire({
        title: "Include Witness Section?",
        text: "Do you want to include the Witness Statements section in the Investigation Report PDF?",
        icon: "question",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Yes, Include",
        denyButtonText: "No, Exclude",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#0f172a",
        denyButtonColor: "#64748b"
      });

      if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
        return;
      }

      includeWitnesses = result.isConfirmed;
    }

    try {
      setDownloadingForm(formKey);
      showSuccess(`Downloading ${formTitle} PDF...`);
      const blobData = await exportIncidentPdf(incId, formKey, includeWitnesses);

      const blob = new Blob([blobData], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const caseNo = incObj?.caseNumber || incObj?.id || id;
      const suffix = formKey === "headsUp" ? "Form1_HeadsUp" : formKey === "initialReport" ? "Form2_InitialReport" : "Form3_Investigation";
      link.setAttribute("download", `Incident_Report_${caseNo}_${suffix}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to download ${formKey} PDF from backend:`, err);
      setPdfTargetForm(formKey);
      setShowPdfExport(true);
    } finally {
      setDownloadingForm(null);
    }
  };

  const [activeTab, setActiveTab] = useState("headsUp");
  const [headsUpApproved, setHeadsUpApproved] = useState(false);
  const [signature, setSignature] = useState(false);
  const [markedOk, setMarkedOk] = useState(false);
  const [reviewerName, setReviewerName] = useState(() => getLoggedInUser());
  const [reviewerRole, setReviewerRole] = useState("NNE Peer Reviewer");

  // Selectors
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);

  // Heads-Up Form Specific States
  const [huProject, setHuProject] = useState("M3 South");
  const [huTitle, setHuTitle] = useState("");
  const [huDate, setHuDate] = useState("");
  const [huTime, setHuTime] = useState("");
  const [huBuildingId, setHuBuildingId] = useState("");
  const [huBuildingName, setHuBuildingName] = useState("");
  const [huFloorLevel, setHuFloorLevel] = useState("");
  const [huSpecificLocation, setHuSpecificLocation] = useState("");
  const [huContractor, setHuContractor] = useState("");
  const [huCategories, setHuCategories] = useState([]);
  const [huActualSeverity, setHuActualSeverity] = useState("");
  const [huPotentialSeverity, setHuPotentialSeverity] = useState("");
  const [huDescription, setHuDescription] = useState("");
  const [huConsequence, setHuConsequence] = useState("");
  const [huEnvSpillType, setHuEnvSpillType] = useState([]);
  const [huEnvSpillOther, setHuEnvSpillOther] = useState("");
  const [huEnvSpilledWhat, setHuEnvSpilledWhat] = useState("");
  const [huEnvCause, setHuEnvCause] = useState("");
  const [huEnvQuantity, setHuEnvQuantity] = useState("");
  const [huEnvSpecify, setHuEnvSpecify] = useState([]);
  const [huEnvSpecifyOther, setHuEnvSpecifyOther] = useState("");
  const [huImmActions, setHuImmActions] = useState([]);
  const [huGatekeeperInformed, setHuGatekeeperInformed] = useState(null);
  const [huGatekeeperName, setHuGatekeeperName] = useState("");
  const [huSubmitterName, setHuSubmitterName] = useState(() => getLoggedInUser());
  const [huSignature, setHuSignature] = useState(false);
  const [huSubmittedTime, setHuSubmittedTime] = useState("");

  // Edit Revision for Heads-Up
  const [huEditorName, setHuEditorName] = useState(() => getLoggedInUser());
  const [huEditorRole, setHuEditorRole] = useState("HSE Editor");
  const [huEditReason, setHuEditReason] = useState("");
  const [huEditorSignature, setHuEditorSignature] = useState(false);

  const [showHuTimePicker, setShowHuTimePicker] = useState(false);
  const [tempHuTime, setTempHuTime] = useState("");
  const [showHuActionTimePicker, setShowHuActionTimePicker] = useState(null);
  const [tempHuActionTime, setTempHuActionTime] = useState("");

  const [initialReportSubmitted, setInitialReportSubmitted] = useState(false);
  const [initialReportApproved, setInitialReportApproved] = useState(false);
  const [irSignature, setIrSignature] = useState(false);
  const [irMarkedOk, setIrMarkedOk] = useState(false);
  const [irReviewerName, setIrReviewerName] = useState(() => getLoggedInUser());

  // Step 2 Initial Report States
  const [irInjuredName, setIrInjuredName] = useState("");
  const [irInjuredCompany, setIrInjuredCompany] = useState("");
  const [irInjuredSupervisor, setIrInjuredSupervisor] = useState("");
  const [irInjuredJobTitle, setIrInjuredJobTitle] = useState("");
  const [irLengthOfService, setIrLengthOfService] = useState("");
  const [irExperienceInRole, setIrExperienceInRole] = useState("");
  const [irWorkerActivity, setIrWorkerActivity] = useState("");

  const [irCategories, setIrCategories] = useState([]);
  const [irActualSeverity, setIrActualSeverity] = useState("");
  const [irPotentialSeverity, setIrPotentialSeverity] = useState("");
  const [irDescription, setIrDescription] = useState("");

  // Environmental States
  const [irEnvSpillType, setIrEnvSpillType] = useState([]);
  const [irEnvSpillOther, setIrEnvSpillOther] = useState("");
  const [irEnvSpillSubstance, setIrEnvSpillSubstance] = useState("");
  const [irEnvSpillCause, setIrEnvSpillCause] = useState("");
  const [irEnvSpillQuantity, setIrEnvSpillQuantity] = useState("");
  const [irEnvSystemEntered, setIrEnvSystemEntered] = useState([]);
  const [irEnvSystemOther, setIrEnvSystemOther] = useState("");
  const [irEnvContainment, setIrEnvContainment] = useState("");

  // Property Damage States
  const [irPropDamaged, setIrPropDamaged] = useState("");
  const [irPropEquipmentInvolved, setIrPropEquipmentInvolved] = useState("");
  const [irPropEstimatedCost, setIrPropEstimatedCost] = useState("");
  const [irPropDamageDesc, setIrPropDamageDesc] = useState("");
  const [irPropImmediateAction, setIrPropImmediateAction] = useState("");

  const [irInjuryNotApplicable, setIrInjuryNotApplicable] = useState(false);
  const [irNatureOfInjury, setIrNatureOfInjury] = useState("");
  const [irTreatmentProvided, setIrTreatmentProvided] = useState("");
  const [irAnticipatedAbsence, setIrAnticipatedAbsence] = useState("");
  const [irMedicalTreatmentClass, setIrMedicalTreatmentClass] = useState("");

  const [irAccidentCategories, setIrAccidentCategories] = useState([]);
  const [irInjuryTypes, setIrInjuryTypes] = useState([]);

  const [irInitialRootCause, setIrInitialRootCause] = useState("");
  const [irEnvironmentalConditions, setIrEnvironmentalConditions] = useState("");
  const [irEquipmentInvolved, setIrEquipmentInvolved] = useState("");

  const [irSubmittedBy, setIrSubmittedBy] = useState(() => getLoggedInUser());
  const [irSubSignature, setIrSubSignature] = useState(false);

  // Edit / Revision state for Initial Report
  const [irEditorName, setIrEditorName] = useState(() => getLoggedInUser());
  const [irEditorRole, setIrEditorRole] = useState("Contractor / HSE Editor");
  const [irEditReason, setIrEditReason] = useState("");
  const [irEditorSignature, setIrEditorSignature] = useState(false);

  // Body parts & Immediate Actions
  const [bodyParts, setBodyParts] = useState([]);
  const [manualBodyPart, setManualBodyPart] = useState("");
  const [immActions, setImmActions] = useState([]);
  const [showActionTimePicker, setShowActionTimePicker] = useState(null);
  const [tempActionTime, setTempActionTime] = useState("");

  // Camera & Photos for Step 2
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photos, setPhotos] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // --- Step 3: Investigation State ---
  const [investigationStarted, setInvestigationStarted] = useState(false);
  const [investigationSubmitted, setInvestigationSubmitted] = useState(false);
  const [investigationApproved, setInvestigationApproved] = useState(false);

  // Edit / Revision state for Investigation Report
  const [invEditorName, setInvEditorName] = useState(() => getLoggedInUser());
  const [invEditorRole, setInvEditorRole] = useState("HSE Investigator / Editor");
  const [invEditReason, setInvEditReason] = useState("");
  const [invEditorSignature, setInvEditorSignature] = useState(false);

  const [invTeam, setInvTeam] = useState([]);
  const [invDetails, setInvDetails] = useState("");
  const [invWitnesses, setInvWitnesses] = useState([]);

  const FISHBONE_CATS = [
    { key: "people", label: "People", color: "#131E40", hint: "e.g. complacency, behaviour, training, etc." },
    { key: "machine", label: "Machine / Equipment", color: "#594274", hint: "" },
    { key: "method", label: "Method / Procedure", color: "#B88E1B", hint: "e.g. RAMS / PTW / SPA, etc" },
    { key: "materials", label: "Materials", color: "#64748B", hint: "e.g. debris, timber, steel etc..." },
    { key: "environment", label: "Environmental Conditions", color: "#4F866A", hint: "e.g. weather conditions, space, density of workforce" },
    { key: "measurement", label: "Measurement", color: "#8F1B32", hint: "e.g. monitoring / site supervision" }
  ];

  const [fishbone, setFishbone] = useState({
    people: [], machine: [], method: [], materials: [], environment: [], measurement: []
  });

  const [invEffect, setInvEffect] = useState("");
  const [invProblem, setInvProblem] = useState("");
  const [fiveWhys, setFiveWhys] = useState({});
  const [invRootCauses, setInvRootCauses] = useState([]);
  const [invFactors, setInvFactors] = useState([]);

  const [invPreSev, setInvPreSev] = useState(null);
  const [invPostSev, setInvPostSev] = useState(null);

  // --- Return for Revision Inline State & Handler ---
  const [huReviewComments, setHuReviewComments] = useState("");
  const [irReviewComments, setIrReviewComments] = useState("");
  const [irReviewerRole, setIrReviewerRole] = useState("Customer Approver");
  const [invReviewComments, setInvReviewComments] = useState("");
  const [isReturningRevision, setIsReturningRevision] = useState(false);

  const handleReturnForRevision = async (stage) => {
    let reviewer = "";
    let role = "";
    let reason = "";
    let sig = false;

    if (stage === "HEADS_UP") {
      reviewer = reviewerName || getLoggedInUser();
      role = reviewerRole || "NNE Peer Reviewer";
      reason = huReviewComments;
      sig = signature;
    } else if (stage === "INITIAL_REPORT") {
      reviewer = irReviewerName || getLoggedInUser();
      role = irReviewerRole || "Customer Approver";
      reason = irReviewComments;
      sig = irSignature;
    } else if (stage === "INVESTIGATION") {
      reviewer = invReviewerName || getLoggedInUser();
      role = invReviewerRole || "Site HSE Lead";
      reason = invReviewComments;
      sig = invRevSignature;
    }

    if (!reviewer || !reviewer.trim()) {
      showError("Please enter reviewer name in the review section.");
      return;
    }
    if (!reason || !reason.trim()) {
      showError("Please enter review comments / reason for revision in the review section.");
      return;
    }

    try {
      setIsReturningRevision(true);
      await returnForRevision(id, {
        stage,
        returnedBy: reviewer.trim(),
        role: role.trim(),
        reason: reason.trim(),
        signature: sig || undefined
      });

      const stageLabel = stage === "HEADS_UP" ? "Heads-Up Notification" : stage === "INITIAL_REPORT" ? "Initial Incident Report" : "Investigation Report";
      showSuccess(`${stageLabel} Returned for Revision!`);

      if (stage === "HEADS_UP") {
        setHeadsUpApproved(false);
        setIsEditingHeadsUp(true);
        setActiveTab("headsUp");
      } else if (stage === "INITIAL_REPORT") {
        setInitialReportApproved(false);
        setIsEditingInitialReport(true);
        setActiveTab("initialReport");
      } else if (stage === "INVESTIGATION") {
        setInvestigationApproved(false);
        setIsEditingInvestigation(true);
        setActiveTab("investigation");
      }

      // Refresh incident from API
      const data = await getIncidentById(id);
      setRawIncident(data?.data || data);
    } catch (err) {
      console.error("Failed to return for revision", err);
      const msg = err.response?.data?.message || err.message || "Failed to return for revision";
      showError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsReturningRevision(false);
    }
  };
  const SEVERITY_SCALE = [
    { level: 1, label: "Insignificant", color: "#2D9E5A" },
    { level: 2, label: "Minor", color: "#C07D10" },
    { level: 3, label: "Moderate", color: "#D97706" },
    { level: 4, label: "Critical", color: "#E32B50" },
    { level: 5, label: "Catastrophic", color: "#8F1B32" }
  ];

  const incidentCategories = [
    "Near Miss", "No Treatment Injury", "First Aid Injury", "Medical Treatment Injury",
    "Restricted Work Injury", "Loss Time Injury", "Permanent Disability", "Fatality",
    "Occupational Illness", "Environmental Incident", "Property Damage", "Electrical Hazards"
  ];

  const severityOptions = [
    { level: 1, label: "1 - Insignificant", desc: "Small injury/bruises or no local damage" },
    { level: 2, label: "2 - Minor", desc: "Minor injury or small spill cleaned up immediately" },
    { level: 3, label: "3 - Moderate", desc: "Serious injury (no absence) or serious damage/major spills" },
    { level: 4, label: "4 - Critical", desc: "One or more injuries (permanent) or damage hard to reverse" },
    { level: 5, label: "5 - Catastrophic", desc: "One or more deaths or irreversible damage" }
  ];

  const [invCorrective, setInvCorrective] = useState([]);
  const [invLessons, setInvLessons] = useState("");
  const [invPrevention, setInvPrevention] = useState("");

  const [huNoFurtherInvestigation, setHuNoFurtherInvestigation] = useState(false);
  const [irNoFurtherInvestigation, setIrNoFurtherInvestigation] = useState(false);

  const [invPhotos, setInvPhotos] = useState([]);
  const [isInvCameraActive, setIsInvCameraActive] = useState(false);
  const invVideoRef = useRef(null);
  const invCanvasRef = useRef(null);
  const invFileInputRef = useRef(null);
  const invStreamRef = useRef(null);

  const INV_MANDATORY_ATTACHMENTS = [
    { key: "contractorsIncidentReport", label: "Contractor's Incident Report" },
    { key: "witnessStatement", label: "Witness Statement Form" },
    { key: "rams", label: "Risk Assessment & Method Statement (RAMS)" },
    { key: "trainingRecords", label: "Training Records" },
    { key: "permitsToWork", label: "Permit to Work (PTW)" },
    { key: "safePlanOfAction", label: "Safe Plan of Action (SPA)" },
    { key: "photos", label: "Photos from Incident Location", isPhotos: true },
    { key: "evidenceForActionsTaken", label: "Evidence for Actions Taken" },
    { key: "wasteDisposalInvoice", label: "Waste Disposal Invoice (if applicable)" }
  ];
  const [invAttachments, setInvAttachments] = useState(() =>
    INV_MANDATORY_ATTACHMENTS.map(item => ({
      key: item.key,
      label: item.label,
      checked: false,
      fileName: "",
      fileUrl: "",
      fileType: "",
      fileSize: 0,
      uploading: false,
      isPhotos: item.isPhotos || false
    }))
  );
  const [invMissingExplain, setInvMissingExplain] = useState("");

  const [invInvName, setInvInvName] = useState(() => getLoggedInUser());
  const [invInvRole, setInvInvRole] = useState("");
  const [invInvDate, setInvInvDate] = useState("");
  const [invInvSignature, setInvInvSignature] = useState(false);
  const [invInvMarkedOk, setInvInvMarkedOk] = useState(false);
  const [invRevSignature, setInvRevSignature] = useState(false);
  const [invReviewerName, setInvReviewerName] = useState(() => getLoggedInUser());
  const [invReviewerRole, setInvReviewerRole] = useState("");
  const [invRevMarkedOk, setInvRevMarkedOk] = useState(false);

  // Investigation Additional States
  const [invEnvRemediation, setInvEnvRemediation] = useState("");
  const [invEnvWasteDisposal, setInvEnvWasteDisposal] = useState("");
  const [invEnvRegNotification, setInvEnvRegNotification] = useState("");
  const [invPropLossAssessment, setInvPropLossAssessment] = useState("");
  const [invPropInsuranceClaim, setInvPropInsuranceClaim] = useState("");
  const [invPropPreventiveSafeguards, setInvPropPreventiveSafeguards] = useState("");
  const [fishboneInput, setFishboneInput] = useState({ people: "", machine: "", method: "", materials: "", environment: "", measurement: "" });

  // Corrective Actions Tab State
  const [actionsList, setActionsList] = useState([]);
  const [showAddAction, setShowAddAction] = useState(false);
  const [editingActionId, setEditingActionId] = useState(null);
  const [newAction, setNewAction] = useState({ action: "", responsible: "", targetDate: "", status: "PENDING" });
  const [expandedActionIds, setExpandedActionIds] = useState({});
  const [loadingActions, setLoadingActions] = useState(false);
  const [actionPage, setActionPage] = useState(1);
  const actionsPerPage = 5;

  const handleHuCategoryToggle = (cat) => {
    setHuCategories([cat]);
  };

  const handleHuEnvToggle = (field, val) => {
    if (field === "envSpillType") {
      setHuEnvSpillType(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    } else if (field === "envSpecify") {
      setHuEnvSpecify(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    }
  };

  const addHuAction = () => {
    setHuImmActions(prev => [...prev, { action: "", responsible: "", date: huDate || "", time: "", implemented: false }]);
  };

  const updateHuAction = (idx, field, val) => {
    setHuImmActions(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const removeHuAction = (idx) => {
    setHuImmActions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveHeadsUp = async () => {
    try {
      const selectedB = buildingsList.find(b => String(b.build_id || b.id) === String(huBuildingId));
      const payload = {
        title: huTitle,
        projectName: huProject,
        incidentDate: huDate,
        incidentTime: huTime,
        buildingId: huBuildingId ? Number(huBuildingId) : undefined,
        buildingName: selectedB?.building_name || huBuildingName || "",
        floorLevel: huFloorLevel,
        specificLocation: huSpecificLocation,
        contractorsInvolved: huContractor,
        categories: huCategories,
        actualSeverity: huActualSeverity ? Number(huActualSeverity) : undefined,
        potentialSeverity: huPotentialSeverity ? Number(huPotentialSeverity) : undefined,
        isHipo: Number(huActualSeverity) >= 4 || Number(huPotentialSeverity) >= 4,
        descriptionWhatHappened: huDescription,
        descriptionConsequence: huConsequence,
        isEnvironmental: huCategories.some(c => c && c.toLowerCase().includes("environment")),
        spillType: huEnvSpillType.includes("Other") && huEnvSpillOther ? [...huEnvSpillType.filter(t => t !== "Other"), `Other: ${huEnvSpillOther}`] : huEnvSpillType,
        spillSubstance: huEnvSpilledWhat,
        spillCause: huEnvCause,
        spillQuantity: huEnvQuantity,
        spillSystemEntered: huEnvSpecify.includes("Other") && huEnvSpecifyOther ? [...huEnvSpecify.filter(s => s !== "Other"), `Other: ${huEnvSpecifyOther}`] : huEnvSpecify,
        immediateActions: huImmActions.map(a => ({
          action: a.action,
          responsible: a.responsible,
          timeImplemented: a.timeImplemented || a.time,
          targetDate: a.targetDate || a.date || huDate
        })),
        gatekeeperInformed: huGatekeeperInformed,
        gatekeeperName: huGatekeeperName,
        editedBy: huEditorName || getLoggedInUser(),
        editorRole: huEditorRole || "HSE Editor",
        editReason: huEditReason || "Updated Heads-Up Notification",
        editorSignature: huEditorSignature
      };

      await updateHeadsUp(id, payload);
      await Swal.fire({
        title: "Success!",
        text: "Heads-Up Notification Updated Successfully!",
        icon: "success",
        confirmButtonColor: "#0f172a"
      });
      setIsEditingHeadsUp(false);
      window.scrollTo(0, 0);
      const data = await getIncidentById(id);
      setRawIncident(data?.data || data);
    } catch (err) {
      console.error("Failed to update Heads-Up notification", err);
      const msg = err.response?.data?.message || err.message || "Failed to update Heads-Up Notification";
      showError(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  useEffect(() => {
    const fetchSelectors = async () => {
      try {
        const [cRes, bRes, fRes] = await Promise.all([
          getContractors(1, 1000),
          getBuildings(1, 1000),
          getFloors(1, 1000)
        ]);
        const rawC = cRes?.data?.rows || cRes?.data || cRes?.subContractors || cRes || [];
        setContractorsList(Array.isArray(rawC) ? rawC : []);
        setBuildingsList(bRes?.data || []);
        setFloorsList(fRes?.data || []);
      } catch (err) {
        console.error("Failed to load selectors for IM Details:", err);
      }
    };
    fetchSelectors();
  }, []);

  React.useEffect(() => {
    const fetchIncident = async () => {
      try {
        const data = await getIncidentById(id);
        const resData = data?.data || data;
        setRawIncident(resData);

        const incObj = resData?.incident || resData || {};
        const stage = String(incObj?.stage || resData?.stage || "").toUpperCase();
        const isClosedInc = Boolean(
          incObj?.closedBy ||
          incObj?.status === 2 ||
          stage === "CLOSED" ||
          resData?.closedBy ||
          resData?.status === 2
        );

        const isNoFurther = Boolean(
          incObj?.noFurtherInvestigation ||
          resData?.headsUp?.noFurtherInvestigation ||
          resData?.initialReport?.noFurtherInvestigation ||
          resData?.noFurtherInvestigation
        );

        // Sync Heads-Up states
        const isHuApproved = Boolean(resData?.headsUp?.approvedBy || resData?.headsup?.approvedBy || isClosedInc);
        setHeadsUpApproved(isHuApproved);

        // Sync Initial Report states (ONLY true if actual data exists)
        const hasIrData = Boolean(
          resData?.initialReport && (
            (resData.initialReport.submittedBy && resData.initialReport.submittedBy !== "User") ||
            resData.initialReport.signature ||
            resData.initialReport.submittedTime ||
            resData.initialReport.injuredPersonName
          )
        );
        const isIrSubmitted = Boolean(hasIrData);
        setInitialReportSubmitted(isIrSubmitted);

        const isIrApproved = Boolean(resData?.initialReport?.approvedBy || (hasIrData && isClosedInc));
        setInitialReportApproved(isIrApproved);

        // Sync Investigation states (ONLY true if actual data exists)
        const hasInvData = Boolean(
          (resData?.investigation?.signatures && Array.isArray(resData.investigation.signatures) && resData.investigation.signatures.length > 0) ||
          (resData?.investigation?.problemStatement && resData.investigation.problemStatement.trim().length > 0) ||
          (resData?.investigation?.investigationDetails && resData.investigation.investigationDetails.trim().length > 0) ||
          (resData?.investigation?.submittedBy && resData.investigation.submittedBy !== "User" && resData.investigation.submittedBy !== "Investigator")
        );
        const isInvStarted = Boolean(hasInvData || (!isNoFurther && (isIrApproved || stage === "INVESTIGATION")));
        setInvestigationStarted(isInvStarted);

        const isInvSubmitted = Boolean(hasInvData);
        setInvestigationSubmitted(isInvSubmitted);

        const isInvApproved = Boolean(resData?.investigation?.reviewedBy || resData?.investigation?.approvedBy || (hasInvData && isClosedInc));
        setInvestigationApproved(isInvApproved);
      } catch (err) {
        console.error("Failed to load incident details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncident();
  }, [id]);

  React.useEffect(() => {
    if (rawIncident) {
      const inc = rawIncident.incident || rawIncident;
      const hu = rawIncident.headsUp || rawIncident.headsup || {};
      const ir = rawIncident.initialReport || rawIncident.initial_report || {};
      const stage = String(inc?.stage || rawIncident?.stage || "").toUpperCase();
      const isClosedInc = Boolean(inc?.closedBy || inc?.status === 2 || stage === "CLOSED" || rawIncident?.closedBy || rawIncident?.status === 2);

      // Hydrate Heads-Up specific states
      setHuTitle(hu.title || inc.title || "");
      setHuProject(hu.projectName || inc.projectName || "M3 South");
      setHuDate(inc.incidentDate || inc.date || "");
      setHuTime(inc.incidentTime || inc.time || "");
      setHuBuildingId(inc.buildingId || "");
      setHuBuildingName(inc.buildingName || inc.building || "");
      setHuFloorLevel(inc.floorLevel || "");
      setHuSpecificLocation(inc.specificLocation || "");
      setHuContractor(inc.contractorsInvolved || hu.contractorsInvolved || "");
      const huCatList = hu.categories && Array.isArray(hu.categories) && hu.categories.length > 0 ? hu.categories : (inc.categories || []);
      setHuCategories(huCatList);
      setHuActualSeverity(extractSevNum(hu.actualSeverity || inc.actualSeverity || ""));
      setHuPotentialSeverity(extractSevNum(hu.potentialSeverity || inc.potentialSeverity || ""));
      setHuDescription(hu.descriptionWhatHappened || hu.whatHappened || inc.description || "");
      setHuConsequence(hu.descriptionConsequence || "");

      if (hu.spillType || hu.envSpillType) {
        const { arr, other } = parseEnvOptions(hu.spillType || hu.envSpillType);
        setHuEnvSpillType(arr);
        if (other || hu.envSpillOther) setHuEnvSpillOther(other || hu.envSpillOther || "");
      }
      if (hu.spillSubstance || hu.envSpilledWhat) setHuEnvSpilledWhat(hu.spillSubstance || hu.envSpilledWhat);
      if (hu.spillCause || hu.envCause) setHuEnvCause(hu.spillCause || hu.envCause);
      if (hu.spillQuantity || hu.envQuantity) setHuEnvQuantity(hu.spillQuantity || hu.envQuantity);
      if (hu.spillSystemEntered || hu.envSpecify) {
        const { arr, other } = parseEnvOptions(hu.spillSystemEntered || hu.envSpecify);
        setHuEnvSpecify(arr);
        if (other || hu.envSpecifyOther) setHuEnvSpecifyOther(other || hu.envSpecifyOther || "");
      }
      let huActs = hu.immediateActions;
      if (typeof huActs === "string") {
        try { huActs = JSON.parse(huActs); } catch (e) {}
      }
      if (huActs && Array.isArray(huActs)) {
        setHuImmActions(huActs.map(a => ({
          action: a.action || a.description || "",
          responsible: a.responsible || a.assignedTo || "",
          date: a.targetDate || a.date || "",
          time: a.timeImplemented || a.time || ""
        })));
      }
      setHuGatekeeperInformed(hu.gatekeeperInformed !== undefined ? hu.gatekeeperInformed : inc.gatekeeperInformed);
      setHuGatekeeperName(hu.gatekeeperName || inc.gatekeeperName || "");
      setHuSubmitterName(hu.submittedBy || inc.reportedBy || "");
      setHuSignature(hu.signature || false);
      setHuSubmittedTime(hu.submittedTime || inc.createdTime || "");
      const noFurther = Boolean(rawIncident?.incident?.noFurtherInvestigation || rawIncident?.noFurtherInvestigation || inc?.noFurtherInvestigation || hu?.noFurtherInvestigation || ir?.noFurtherInvestigation);
      setHuNoFurtherInvestigation(Boolean(hu.noFurtherInvestigation || noFurther));
      setIrNoFurtherInvestigation(Boolean(ir.noFurtherInvestigation || noFurther));

      // 1. Prefill Contractor / Company
      const contractor = hu.contractorsInvolved || hu.contractor || inc.contractorsInvolved || inc.contractor;
      if (contractor) {
        if (contractor === "c01") setIrInjuredCompany("Alpha Construction");
        else if (contractor === "c02") setIrInjuredCompany("Zeta Builders");
        else setIrInjuredCompany(contractor);
      }

      // 2. Prefill Actual & Potential Severity Assessment
      const rawActSev = hu.actualSeverity || hu.severity || inc.actualSeverity || inc.severity;
      if (rawActSev) {
        setIrActualSeverity(extractSevNum(rawActSev));
      }

      const rawPotSev = hu.potentialSeverity || inc.potentialSeverity;
      if (rawPotSev) {
        setIrPotentialSeverity(extractSevNum(rawPotSev));
      }

      // 3. Prefill Incident Categories
      let initialCats = [];
      if (hu.categories && Array.isArray(hu.categories) && hu.categories.length > 0) {
        initialCats = [...hu.categories];
      } else if (inc.categories && Array.isArray(inc.categories) && inc.categories.length > 0) {
        initialCats = [...inc.categories];
      } else if (inc.category) {
        initialCats = [inc.category];
      } else if (hu.category) {
        initialCats = [hu.category];
      }

      if (ir && typeof ir === "object") {
        if (ir.categories && Array.isArray(ir.categories) && ir.categories.length > 0) {
          initialCats = [...ir.categories];
        } else if (ir.treatmentProvided && Array.isArray(ir.treatmentProvided) && ir.treatmentProvided.length > 0) {
          ir.treatmentProvided.forEach(t => {
            if (t === "Medical Treatment" && !initialCats.includes("Medical Treatment Injury")) initialCats.push("Medical Treatment Injury");
            if (t === "First Aid" && !initialCats.includes("First Aid Injury")) initialCats.push("First Aid Injury");
            if (t === "Hospitalization" && !initialCats.includes("Lost Time Injury")) initialCats.push("Lost Time Injury");
          });
        }
      }

      setIrCategories(initialCats);

      // 4. Prefill Incident Description (only description of what happened)
      const primaryDesc = hu.descriptionWhatHappened || hu.whatHappened || inc.description || inc.details || "";
      if (primaryDesc) {
        setIrDescription(primaryDesc);
      }

      // 5. Prefill Immediate Actions from Heads-Up
      if (huActs && Array.isArray(huActs) && huActs.length > 0) {
        setImmActions(huActs.map(a => ({
          action: a.action || a.description || "",
          responsible: a.responsible || a.assignedTo || "",
          date: a.targetDate || a.date || "",
          time: a.timeImplemented || a.time || ""
        })));
      }

      // 6. Prefill Environmental Details from Heads-Up (only for environmental incidents)
      const isEnvHu = (hu.categories || []).concat(inc.categories || []).concat(inc.category || []).some(c => c && String(c).toLowerCase().includes("environment")) || hu.isEnvironmental;
      if (isEnvHu) {
        const huSpillType = hu.spillType || hu.envSpillType;
        if (huSpillType) {
          const { arr, other } = parseEnvOptions(huSpillType);
          setIrEnvSpillType(arr);
          if (other || hu.envSpillOther) setIrEnvSpillOther(other || hu.envSpillOther || "");
        }
        const huSubstance = hu.spillSubstance || hu.envSpilledWhat;
        if (huSubstance) {
          setIrEnvSpillSubstance(huSubstance);
        }
        const huQuantity = hu.spillQuantity || hu.envQuantity;
        if (huQuantity) {
          setIrEnvSpillQuantity(huQuantity);
        }
        const huCause = hu.spillCause || hu.envCause;
        if (huCause) {
          setIrEnvSpillCause(huCause);
          setIrInitialRootCause(`Environmental spill cause: ${huCause}`);
        }
        const huSystemEntered = hu.spillSystemEntered || hu.envSpecify;
        if (huSystemEntered) {
          const { arr, other } = parseEnvOptions(huSystemEntered);
          setIrEnvSystemEntered(arr);
          if (other || hu.envSpecifyOther) setIrEnvSystemOther(other || hu.envSpecifyOther || "");
        }
        if (hu.immediateActions && Array.isArray(hu.immediateActions) && hu.immediateActions.length > 0) {
          const actionDescs = hu.immediateActions.map(a => a.action || a.description).filter(Boolean).join("; ");
          if (actionDescs) setIrEnvContainment(actionDescs);
        } else if (hu.immediateActionTaken || hu.containmentCleanup) {
          setIrEnvContainment(hu.immediateActionTaken || hu.containmentCleanup);
        }
      }

      // Prefill Property Damage Details from Heads-Up (only for property damage incidents)
      const isPropHu = (hu.categories || []).concat(inc.categories || []).concat(inc.category || []).some(c => c && String(c).toLowerCase().includes("property")) || hu.isPropertyDamage;
      if (isPropHu) {
        if (hu.propertyDamaged || hu.damagedProperty || inc.propertyDamaged) {
          setIrPropDamaged(hu.propertyDamaged || hu.damagedProperty || inc.propertyDamaged);
        }
        if (hu.equipmentInvolved || hu.plantInvolved || inc.equipmentInvolved) {
          setIrPropEquipmentInvolved(hu.equipmentInvolved || hu.plantInvolved || inc.equipmentInvolved);
        }
        if (hu.estimatedCost || hu.repairCost || inc.estimatedCost) {
          setIrPropEstimatedCost(hu.estimatedCost || hu.repairCost || inc.estimatedCost);
        }
        if (hu.damageDescription || hu.damageDesc || inc.damageDescription) {
          setIrPropDamageDesc(hu.damageDescription || hu.damageDesc || inc.damageDescription);
        }
        if (hu.immediateActionTaken || inc.immediateActionTaken) {
          setIrPropImmediateAction(hu.immediateActionTaken || inc.immediateActionTaken);
        }
      }

      // 7. Override with saved Initial Report data if present
      if (ir && typeof ir === "object" && Object.keys(ir).length > 0) {
        if (ir.environmentalDetails) {
          if (ir.environmentalDetails.spillType) {
            const { arr, other } = parseEnvOptions(ir.environmentalDetails.spillType);
            setIrEnvSpillType(arr);
            if (other) setIrEnvSpillOther(other);
          }
          if (ir.environmentalDetails.spillSubstance) setIrEnvSpillSubstance(ir.environmentalDetails.spillSubstance);
          if (ir.environmentalDetails.spillQuantity) setIrEnvSpillQuantity(ir.environmentalDetails.spillQuantity);
          if (ir.environmentalDetails.spillCause) setIrEnvSpillCause(ir.environmentalDetails.spillCause);
          if (ir.environmentalDetails.spillSystemEntered) {
            const { arr, other } = parseEnvOptions(ir.environmentalDetails.spillSystemEntered);
            setIrEnvSystemEntered(arr);
            if (other) setIrEnvSystemOther(other);
          }
          if (ir.environmentalDetails.containmentCleanup) setIrEnvContainment(ir.environmentalDetails.containmentCleanup);
        }

        if (ir.propertyDamageDetails) {
          if (ir.propertyDamageDetails.propertyDamaged) setIrPropDamaged(ir.propertyDamageDetails.propertyDamaged);
          if (ir.propertyDamageDetails.damageDescription) setIrPropDamageDesc(ir.propertyDamageDetails.damageDescription);
          if (ir.propertyDamageDetails.equipmentInvolved) setIrPropEquipmentInvolved(ir.propertyDamageDetails.equipmentInvolved);
          if (ir.propertyDamageDetails.estimatedCost) setIrPropEstimatedCost(ir.propertyDamageDetails.estimatedCost);
          if (ir.propertyDamageDetails.immediateActionTaken) setIrPropImmediateAction(ir.propertyDamageDetails.immediateActionTaken);
        }

        if (ir.injuredPersonName) setIrInjuredName(ir.injuredPersonName);
        if (ir.injuredPersonCompany) setIrInjuredCompany(ir.injuredPersonCompany);
        if (ir.injuredPersonSupervisor) setIrInjuredSupervisor(ir.injuredPersonSupervisor);
        if (ir.injuredPersonJobTitle) setIrInjuredJobTitle(ir.injuredPersonJobTitle);
        if (ir.lengthOfService) setIrLengthOfService(ir.lengthOfService);
        if (ir.experienceInRole) setIrExperienceInRole(ir.experienceInRole);
        if (ir.workerActivity) setIrWorkerActivity(ir.workerActivity);
        if (ir.natureOfInjury) setIrNatureOfInjury(ir.natureOfInjury);
        if (ir.treatmentProvided) setIrTreatmentProvided(ir.treatmentProvided);
        if (ir.anticipatedAbsence) setIrAnticipatedAbsence(ir.anticipatedAbsence);
        if (ir.medicalTreatmentClass) setIrMedicalTreatmentClass(ir.medicalTreatmentClass);
        if (ir.initialRootCause) setIrInitialRootCause(ir.initialRootCause);
        if (ir.environmentalConditions) setIrEnvironmentalConditions(ir.environmentalConditions);
        if (ir.equipmentInvolved) setIrEquipmentInvolved(ir.equipmentInvolved);
        if (ir.injuryNotApplicable !== undefined) setIrInjuryNotApplicable(Boolean(ir.injuryNotApplicable));
        if (ir.bodyPartsInjured) {
          let bArr = [];
          if (ir.bodyPartsInjured.selections && Array.isArray(ir.bodyPartsInjured.selections)) {
            bArr = ir.bodyPartsInjured.selections.map(s => s.side ? `${s.part} (${s.side})` : s.part);
          } else if (Array.isArray(ir.bodyPartsInjured)) {
            bArr = ir.bodyPartsInjured;
          }
          if (bArr.length > 0) setBodyParts(bArr);
        } else if (ir.bodyParts && Array.isArray(ir.bodyParts) && ir.bodyParts.length > 0) {
          setBodyParts(ir.bodyParts);
        }
        let irActs = ir.immediateActions;
        if (typeof irActs === "string") {
          try { irActs = JSON.parse(irActs); } catch (e) {}
        }
        if (irActs && Array.isArray(irActs) && irActs.length > 0) {
          setImmActions(irActs.map(a => ({
            action: a.action || a.description || "",
            responsible: a.responsible || a.assignedTo || "",
            date: a.targetDate || a.date || "",
            time: a.timeImplemented || a.time || ""
          })));
        }
        if (ir.categories && Array.isArray(ir.categories) && ir.categories.length > 0) setIrCategories(ir.categories);
        if (ir.accidentCategories && Array.isArray(ir.accidentCategories)) setIrAccidentCategories(ir.accidentCategories);
        if (ir.injuryTypes && Array.isArray(ir.injuryTypes)) setIrInjuryTypes(ir.injuryTypes);
        if (ir.actualSeverity) setIrActualSeverity(extractSevNum(ir.actualSeverity));
        if (ir.potentialSeverity) setIrPotentialSeverity(extractSevNum(ir.potentialSeverity));
        if (ir.description) setIrDescription(ir.description);
        if (ir.submittedBy) setIrSubmittedBy(ir.submittedBy);
        if (ir.signature) setIrSubSignature(ir.signature);
      }

      // 8. Load saved Investigation data if present
      const inv = rawIncident.investigation || rawIncident.incident_investigation || {};
      if (inv && typeof inv === "object" && Object.keys(inv).length > 0) {
        if (inv.investigationDetails) setInvDetails(inv.investigationDetails);
        else if (inv.details) setInvDetails(inv.details);

        if (inv.problemStatement) setInvProblem(inv.problemStatement);
        else if (inv.problem) setInvProblem(inv.problem);

        if (inv.effectDescription) setInvEffect(inv.effectDescription);
        else if (inv.effect) setInvEffect(inv.effect);

        if (inv.lessonsLearned) setInvLessons(inv.lessonsLearned);
        if (inv.preventativeMeasures) setInvPrevention(inv.preventativeMeasures);

        if (inv.preSeverity || inv.pre_severity || inv.severityBefore || inv.severity_before) {
          setInvPreSev(Number(inv.preSeverity || inv.pre_severity || inv.severityBefore || inv.severity_before));
        } else if (inc.actualSeverity) {
          setInvPreSev(Number(inc.actualSeverity));
        }

        if (inv.postSeverity || inv.post_severity || inv.severityAfter || inv.severity_after) {
          setInvPostSev(Number(inv.postSeverity || inv.post_severity || inv.severityAfter || inv.severity_after));
        }

        if (inv.team && Array.isArray(inv.team) && inv.team.length > 0) {
          setInvTeam(inv.team);
        } else if (inv.investigationTeam && Array.isArray(inv.investigationTeam) && inv.investigationTeam.length > 0) {
          setInvTeam(inv.investigationTeam);
        }

        if (inv.witnesses && Array.isArray(inv.witnesses) && inv.witnesses.length > 0) {
          setInvWitnesses(inv.witnesses);
        }

        if (inv.fishboneData && typeof inv.fishboneData === "object") {
          let fbObj = { people: [], machine: [], method: [], materials: [], environment: [], measurement: [] };
          if (Array.isArray(inv.fishboneData)) {
            inv.fishboneData.forEach(item => {
              if (item.category && fbObj[item.category]) {
                fbObj[item.category] = (item.causes || []).map(c => ({
                  text: c.causeText || c.text || "",
                  score: c.score || null,
                  probable: Boolean(c.isSelectedForFiveWhys || c.probable)
                }));
              }
            });
          } else {
            fbObj = { ...fbObj, ...inv.fishboneData };
          }
          setFishbone(fbObj);

          if (inv.fiveWhysData) {
            const fwObj = {};
            const rawWhys = Array.isArray(inv.fiveWhysData) ? inv.fiveWhysData : [];
            
            const probList = [];
            FISHBONE_CATS.forEach(cat => {
              (fbObj[cat.key] || []).forEach((c, i) => {
                if (c.probable) probList.push({ id: `${cat.key}-${i}`, cat: cat.key, text: c.text });
              });
            });

            probList.forEach((pc, pIdx) => {
              const match = rawWhys.find(w => w.fishboneCauseText && w.fishboneCauseText.trim().toLowerCase() === (pc.text || '').trim().toLowerCase()) || rawWhys[pIdx];
              if (match) {
                const whysArr = [match.why1 || "", match.why2 || "", match.why3 || "", match.why4 || "", match.why5 || ""];
                fwObj[pc.id] = whysArr;
                if (pc.text) fwObj[pc.text] = whysArr;
              }
            });

            rawWhys.forEach((item, idx) => {
              const whysArr = [item.why1 || "", item.why2 || "", item.why3 || "", item.why4 || "", item.why5 || ""];
              fwObj[`cause-${idx}`] = whysArr;
              if (item.fishboneCauseText) fwObj[item.fishboneCauseText] = whysArr;
            });

            setFiveWhys(fwObj);
          }
        } else if (inv.fishbone && typeof inv.fishbone === "object") {
          setFishbone(inv.fishbone);
          if (inv.fiveWhys && typeof inv.fiveWhys === "object") {
            setFiveWhys(inv.fiveWhys);
          }
        }

        if (inv.rootCauses && Array.isArray(inv.rootCauses) && inv.rootCauses.length > 0) {
          setInvRootCauses(inv.rootCauses);
        }
        if (inv.contributingFactors && Array.isArray(inv.contributingFactors) && inv.contributingFactors.length > 0) {
          setInvFactors(inv.contributingFactors);
        }

        if (inv.environmentalDetails) {
          if (inv.environmentalDetails.remediationPlan) setInvEnvRemediation(inv.environmentalDetails.remediationPlan);
          if (inv.environmentalDetails.wasteDisposal) setInvEnvWasteDisposal(inv.environmentalDetails.wasteDisposal);
          if (inv.environmentalDetails.regulatoryNotification) setInvEnvRegNotification(inv.environmentalDetails.regulatoryNotification);
        }
        if (inv.propertyDamageDetails) {
          if (inv.propertyDamageDetails.lossAssessment) setInvPropLossAssessment(inv.propertyDamageDetails.lossAssessment);
          if (inv.propertyDamageDetails.insuranceClaim) setInvPropInsuranceClaim(inv.propertyDamageDetails.insuranceClaim);
          if (inv.propertyDamageDetails.preventiveSafeguards) setInvPropPreventiveSafeguards(inv.propertyDamageDetails.preventiveSafeguards);
        }
        if (inv.signatures && Array.isArray(inv.signatures) && inv.signatures.length > 0) {
          const firstSig = inv.signatures[0];
          if (firstSig.name) setInvInvName(firstSig.name);
          if (firstSig.role) setInvInvRole(firstSig.role);
          if (firstSig.date) setInvInvDate(firstSig.date);
          if (firstSig.signature) setInvInvSignature(firstSig.signature);
        }
        if (inv.mandatoryAttachments) {
          const mAtt = typeof inv.mandatoryAttachments === "string" ? JSON.parse(inv.mandatoryAttachments) : inv.mandatoryAttachments;
          const itemsFromDb = Array.isArray(mAtt.items) ? mAtt.items : [];

          setInvAttachments(INV_MANDATORY_ATTACHMENTS.map((defItem) => {
            const aliasMap = {
              contractorsIncidentReport: ["contractorsIncidentReport", "contractorReport", "contractorIncidentReport"],
              witnessStatement: ["witnessStatement", "witnessStatements", "witnessStatementForm"],
              rams: ["rams", "methodStatementRAMS", "riskAssessment"],
              trainingRecords: ["trainingRecords", "training", "competencyRecords"],
              permitsToWork: ["permitsToWork", "permitToWork", "ptw", "permit"],
              safePlanOfAction: ["safePlanOfAction", "spa", "tsti", "preTaskBriefing"],
              photos: ["photos", "incidentPhotos", "locationPhotos"],
              evidenceForActionsTaken: ["evidenceForActionsTaken", "evidenceActions"],
              wasteDisposalInvoice: ["wasteDisposalInvoice", "wasteDisposal", "wasteInvoice"]
            };
            const aliases = aliasMap[defItem.key] || [defItem.key];

            let dbMatch = itemsFromDb.find(it => 
              aliases.includes(it.key) || 
              (it.label && defItem.label && it.label.toLowerCase().includes(defItem.key.toLowerCase()))
            );

            if (!dbMatch) {
              for (const a of aliases) {
                if (mAtt[a] && typeof mAtt[a] === "object") {
                  dbMatch = mAtt[a];
                  break;
                }
              }
            }

            let isCheckedBool = false;
            for (const a of aliases) {
              if (typeof mAtt[a] === "boolean" && mAtt[a]) {
                isCheckedBool = true;
                break;
              }
            }

            if (dbMatch) {
              return {
                key: defItem.key,
                label: defItem.label,
                checked: dbMatch.checked !== undefined ? Boolean(dbMatch.checked) : Boolean(dbMatch.fileUrl || isCheckedBool),
                fileName: dbMatch.fileName || (dbMatch.fileUrl ? dbMatch.fileUrl.split("/").pop() : ""),
                fileUrl: dbMatch.fileUrl || "",
                fileType: dbMatch.fileType || "",
                fileSize: dbMatch.fileSize || 0,
                uploading: false,
                isPhotos: defItem.isPhotos || false
              };
            }
            return {
              key: defItem.key,
              label: defItem.label,
              checked: isCheckedBool,
              fileName: "",
              fileUrl: "",
              fileType: "",
              fileSize: 0,
              uploading: false,
              isPhotos: defItem.isPhotos || false
            };
          }));

          if (mAtt.missingExplanation || mAtt.missingAttachmentsExplanation) {
            setInvMissingExplain(mAtt.missingExplanation || mAtt.missingAttachmentsExplanation || "");
          }
        }

        // Hydrate Corrective Actions from action items or investigation record
        const savedCorrective = (rawIncident.actionItems || []).filter(a => a.actionType === 'CORRECTIVE');
        if (savedCorrective.length > 0) {
          setInvCorrective(savedCorrective.map(c => ({
            desc: c.action || c.description || "",
            resp: c.responsible || c.owner || "",
            deadline: c.targetDate || c.date || "",
            priority: c.priority || "Medium",
            status: c.status || "PENDING"
          })));
        } else if (inv.correctiveActions && Array.isArray(inv.correctiveActions) && inv.correctiveActions.length > 0) {
          setInvCorrective(inv.correctiveActions.map(c => ({
            desc: c.action || c.desc || c.description || "",
            resp: c.responsible || c.resp || "",
            deadline: c.targetDate || c.deadline || c.date || "",
            priority: c.priority || "Medium",
            status: c.status || "PENDING"
          })));
        }
      }
    }
  }, [rawIncident]);

  const handleEnvToggle = (field, opt) => {
    if (field === "irEnvSpillType") {
      setIrEnvSpillType(prev => {
        const arr = Array.isArray(prev) ? prev : prev ? [prev] : [];
        return arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt];
      });
    } else if (field === "irEnvSystemEntered") {
      setIrEnvSystemEntered(prev => {
        const arr = Array.isArray(prev) ? prev : prev ? [prev] : [];
        return arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt];
      });
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setPhotos([...photos, dataUrl]);
    }
  };

  const startInvCamera = async () => {
    setIsInvCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      invStreamRef.current = stream;
      if (invVideoRef.current) {
        invVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera.");
      setIsInvCameraActive(false);
    }
  };

  const stopInvCamera = () => {
    if (invStreamRef.current) {
      invStreamRef.current.getTracks().forEach(track => track.stop());
      invStreamRef.current = null;
    }
    setIsInvCameraActive(false);
  };

  const captureInvPhoto = () => {
    if (invVideoRef.current && invCanvasRef.current) {
      const video = invVideoRef.current;
      const canvas = invCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      if (invPhotos.length < 20) {
        setInvPhotos([...invPhotos, dataUrl]);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos([...photos, reader.result]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const removePhoto = (idx) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const loadActions = async () => {
    if (!id) return;
    setLoadingActions(true);
    try {
      const res = await getActionItems(id);
      const all = Array.isArray(res) ? res : (res.data || []);
      // Only show investigation corrective actions in Corrective & Preventive Actions tab
      const correctiveOnly = all.filter(a => a.actionType === 'CORRECTIVE' || a.actionType === 'INVESTIGATION' || (!a.actionType && !a.timeImplemented));
      setActionsList(correctiveOnly);
    } catch (err) {
      console.error("Failed to fetch actions", err);
    } finally {
      setLoadingActions(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadActions();
    }
  }, [id]);

  const toggleActionExpand = (actionId) => {
    setExpandedActionIds(prev => ({
      ...prev,
      [actionId]: !prev[actionId]
    }));
  };

  const addActionToList = async () => {
    if (!newAction.action || !newAction.responsible) return;
    try {
      const payload = {
        action: newAction.action,
        responsible: newAction.responsible,
        targetDate: newAction.targetDate,
        status: newAction.status,
        actionType: "CORRECTIVE"
      };
      if (editingActionId) {
        await updateActionItem(id, editingActionId, payload);
        showSuccess("Action Item Updated Successfully!");
      } else {
        await addActionItem(id, payload);
        showSuccess("Action Item Added Successfully!");
      }
      setShowAddAction(false);
      setEditingActionId(null);
      setNewAction({ action: "", responsible: "", targetDate: "", status: "PENDING" });
      loadActions();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save action";
      showError(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const deleteAction = async (itemId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action item will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#8f1e1e",
      cancelButtonColor: "#6c757d",
    });
    if (!result.isConfirmed) return;

    try {
      await deleteActionItem(id, itemId);
      showSuccess("Action Item Deleted Successfully!");
      loadActions();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to delete action";
      showError(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const editAction = (action) => {
    setNewAction({
      action: action.action || "",
      responsible: action.responsible || "",
      targetDate: action.targetDate ? action.targetDate.substring(0, 10) : "",
      status: action.status || "PENDING"
    });
    setEditingActionId(action.id);
    setShowAddAction(true);
    window.scrollTo(0, document.body.scrollHeight);
  };

  const toggleBodyPart = (part) => {
    if (bodyParts.includes(part)) setBodyParts(bodyParts.filter(p => p !== part));
    else setBodyParts([...bodyParts, part]);
  };
  const fillFor = (svgPart) => {
    if (bodyParts.includes(svgPart)) return "var(--color-risk)";
    const mapping = {
      "Head": ["Head", "Cranium", "Facial area", "Eye", "Eye (L)", "Eye (R)", "Ear", "Ear (L)", "Ear (R)", "Teeth", "Entire body", "Multiple locations"],
      "Neck": ["Neck", "Entire body", "Multiple locations"],
      "Torso": ["Chest", "Ribcage and Ribs", "Pelvis or abdomen", "Hip", "Hip (L)", "Hip (R)", "Shoulder", "Entire body", "Multiple locations"],
      "Back": ["Back incl. spine", "Entire body", "Multiple locations"],
      "Arm (L)": ["Shoulder (L)", "Arm, Elbow (L)", "Hand (L)", "Finger(s) (L)", "Wrist (L)", "Arm, Elbow", "Hand", "Entire body", "Multiple locations"],
      "Arm (R)": ["Shoulder (R)", "Arm, Elbow (R)", "Hand (R)", "Finger(s) (R)", "Wrist (R)", "Entire body", "Multiple locations"],
      "Leg (L)": ["Legs, Knee (L)", "Foot (L)", "Toe(s) (L)", "Ankle (L)", "Legs, Knee", "Foot", "Entire body", "Multiple locations"],
      "Leg (R)": ["Legs, Knee (R)", "Foot (R)", "Toe(s) (R)", "Ankle (R)", "Entire body", "Multiple locations"]
    };
    const relevantOptions = mapping[svgPart] || [];
    if (bodyParts.some(bp => relevantOptions.includes(bp))) return "var(--color-risk)";
    return "#e2e8f0";
  };

  // Helper functions for Investigation arrays
  const addInvTeamMember = () => setInvTeam([...invTeam, { name: "", role: "", company: "" }]);
  const updateInvTeamMember = (idx, field, val) => {
    const newTeam = [...invTeam];
    newTeam[idx][field] = val;
    setInvTeam(newTeam);
  };
  const removeInvTeamMember = (idx) => setInvTeam(invTeam.filter((_, i) => i !== idx));

  const addInvWitness = () => setInvWitnesses([...invWitnesses, { name: "", badge: "", employer: "", occupation: "", desc: "" }]);
  const updateInvWitness = (idx, field, val) => {
    const newW = [...invWitnesses];
    newW[idx][field] = val;
    setInvWitnesses(newW);
  };
  const removeInvWitness = (idx) => setInvWitnesses(invWitnesses.filter((_, i) => i !== idx));

  const addFishboneCause = (cat) => {
    const text = fishboneInput[cat];
    if (!text) return;
    setFishbone({ ...fishbone, [cat]: [...fishbone[cat], { text, score: null, probable: false }] });
    setFishboneInput({ ...fishboneInput, [cat]: "" });
  };
  const removeFishboneCause = (cat, idx) => {
    const newFb = { ...fishbone };
    newFb[cat] = newFb[cat].filter((_, i) => i !== idx);
    setFishbone(newFb);
  };
  const toggleFishboneProbable = (cat, idx) => {
    const newFb = { ...fishbone };
    newFb[cat][idx].probable = !newFb[cat][idx].probable;
    setFishbone(newFb);
  };
  const setFishboneScore = (cat, idx, score) => {
    const newFb = { ...fishbone };
    newFb[cat][idx].score = score;
    setFishbone(newFb);
  };

  const addInvRootCause = () => setInvRootCauses([...invRootCauses, ""]);
  const updateInvRootCause = (idx, val) => {
    const newRC = [...invRootCauses];
    newRC[idx] = val;
    setInvRootCauses(newRC);
  };
  const removeInvRootCause = (idx) => setInvRootCauses(invRootCauses.filter((_, i) => i !== idx));

  const addInvFactor = () => setInvFactors([...invFactors, ""]);
  const updateInvFactor = (idx, val) => {
    const newF = [...invFactors];
    newF[idx] = val;
    setInvFactors(newF);
  };
  const removeInvFactor = (idx) => setInvFactors(invFactors.filter((_, i) => i !== idx));

  const addInvCorrective = () => setInvCorrective([...invCorrective, { desc: "", resp: "", deadline: "", priority: "" }]);
  const updateInvCorrective = (idx, field, val) => {
    const newC = [...invCorrective];
    newC[idx][field] = val;
    setInvCorrective(newC);
  };
  const removeInvCorrective = (idx) => setInvCorrective(invCorrective.filter((_, i) => i !== idx));

  // Form arrays from the mockup
  const SEVERITY_RATINGS = ["1 - Insignificant", "2 - Minor", "3 - Moderate", "4 - Critical", "5 - Catastrophic"];
  const TREATMENT_PROVIDED = ["None", "First Aid", "Medical Treatment", "Hospitalization"];
  const INCIDENT_CATEGORIES = ["Near Miss", "First Aid Injury", "Medical Treatment Injury", "Restricted Work Injury", "Lost Time Injury", "Property Damage", "Environmental Incident", "Personal Injury"];
  const ACCIDENT_TYPE_CATEGORIES = [
    "Contact with object/equipment",
    "Electrocution ΓÇô electrical injury",
    "Defective tools/equipment",
    "Manual Handling",
    "Hazardous Substance",
    "Slip / Trip / Fall",
    "Tool accidents",
    "Scaffolding / Height accidents",
    "Asphyxiation ΓÇô Confined space",
    "Cuts / Lacerations",
    "Accidents involving machinery/vehicle",
    "Near Miss Event"
  ];
  const INJURY_TYPES = ["Laceration/Cut", "Contusion/Bruise", "Sprain/Strain", "Fracture", "Burn", "Eye Injury", "Concussion", "Other"];
  const BODY_PARTS_SSW = [
    "Shoulder", "Shoulder (L)", "Shoulder (R)",
    "Arm, Elbow", "Arm, Elbow (L)", "Arm, Elbow (R)",
    "Hand", "Hand (L)", "Hand (R)",
    "Finger(s)", "Finger(s) (L)", "Finger(s) (R)",
    "Wrist", "Wrist (L)", "Wrist (R)",
    "Eye", "Eye (L)", "Eye (R)",
    "Chest",
    "Hip", "Hip (L)", "Hip (R)",
    "Legs, Knee", "Legs, Knee (L)", "Legs, Knee (R)",
    "Foot", "Foot (L)", "Foot (R)",
    "Toe(s)", "Toe(s) (L)", "Toe(s) (R)",
    "Ankle", "Ankle (L)", "Ankle (R)",
    "Ear", "Ear (L)", "Ear (R)",
    "Ribcage and Ribs",
    "Cranium",
    "Neck",
    "Facial area",
    "Head",
    "Pelvis or abdomen",
    "Back incl. spine",
    "Psychological",
    "Entire body",
    "Multiple locations",
    "Teeth",
    "Other"
  ];

  // In a real application, these stages would be part of the incident object from API.
  const [stages] = useState({
    headsUp: { label: "Heads-Up Notification (2hr)", priority: "CRITICAL", dueLabel: "23/06/2026 15:58" },
    initialReport: { label: "Initial Incident Report (24hr)", priority: "HIGH", dueLabel: "24/06/2026 14:58" },
    investigation: { label: "Incident Investigation Report (7 days)", priority: "STANDARD", dueLabel: "30/06/2026 14:58" }
  });

  if (loading) {
    return (
      <div className="mod-page">
        <div style={{ padding: "60px 32px", textAlign: "center", color: "var(--text-muted)" }}>
          Loading incident details...
        </div>
      </div>
    );
  }

  const incident = rawIncident?.incident || rawIncident;
  const headsUpData = rawIncident?.headsUp || {};
  const initialReportData = rawIncident?.initialReport || {};
  const investigationData = rawIncident?.investigation || {};

  const isNoFurtherInvestigation = Boolean(
    incident?.noFurtherInvestigation ||
    huNoFurtherInvestigation ||
    irNoFurtherInvestigation ||
    headsUpData?.noFurtherInvestigation ||
    initialReportData?.noFurtherInvestigation ||
    rawIncident?.incident?.noFurtherInvestigation ||
    rawIncident?.noFurtherInvestigation
  );

  const isClosed = Boolean(
    incident?.closedBy ||
    incident?.status === 2 ||
    String(incident?.stage).toUpperCase() === "CLOSED" ||
    rawIncident?.incident?.closedBy ||
    rawIncident?.closedBy ||
    rawIncident?.incident?.status === 2 ||
    rawIncident?.status === 2 ||
    String(rawIncident?.incident?.stage || rawIncident?.stage).toUpperCase() === "CLOSED"
  );

  const hasInitialReportData = Boolean(
    initialReportSubmitted ||
    (initialReportData && (
      (initialReportData.submittedBy && initialReportData.submittedBy !== "User") ||
      initialReportData.signature ||
      initialReportData.submittedTime ||
      initialReportData.injuredPersonName
    ))
  );

  const hasInvestigationData = Boolean(
    (investigationData?.signatures && Array.isArray(investigationData.signatures) && investigationData.signatures.length > 0) ||
    (investigationData?.problemStatement && investigationData.problemStatement.trim().length > 0) ||
    (investigationData?.investigationDetails && investigationData.investigationDetails.trim().length > 0) ||
    (investigationData?.submittedBy && investigationData.submittedBy !== "User" && investigationData.submittedBy !== "Investigator")
  );

  if (!rawIncident) {
    return (
      <div className="mod-page">
        <div className="mod-card" style={{ padding: "60px 32px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)" }}>Incident <strong>{id}</strong> not found.</p>
          <button className="mod-btn-primary im-btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/incident-management/list")}>ΓåÉ Back to List</button>
        </div>
      </div>
    );
  }

  const renderFishboneSvg = () => {
    const W = 1000, H = 450, spineY = 225, spineX1 = 120, spineX2 = 780;
    const topXs = [260, 480, 700];
    const botXs = [260, 480, 700];
    const effectStr = invEffect || "Incident Event";
    const effectLabel = "INCIDENT / EFFECT";

    return (
      <div className="fishbone-wrap" style={{ border: "1px solid var(--border-color)", borderRadius: 12, background: "#f8fafc", padding: "20px", overflowX: "auto", marginTop: 12 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", minWidth: 800, width: "100%", height: "auto" }}>
          <defs>
            <marker id="fbArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#0f172a" />
            </marker>
          </defs>

          {/* Fish Tail */}
          <path d={`M ${spineX1},${spineY} C ${spineX1 - 90},${spineY - 90} ${spineX1 - 110},${spineY - 70} ${spineX1 - 100},${spineY} C ${spineX1 - 110},${spineY + 70} ${spineX1 - 90},${spineY + 90} ${spineX1},${spineY} Z`} fill="#0f172a" />

          {/* Spine */}
          <line x1={spineX1} y1={spineY} x2={spineX2} y2={spineY} stroke="#0f172a" strokeWidth="8" />

          {/* Fish Head */}
          <path d={`M ${spineX2},${spineY} C ${spineX2 + 20},${spineY - 100} ${spineX2 + 120},${spineY - 80} ${spineX2 + 160},${spineY} C ${spineX2 + 120},${spineY + 80} ${spineX2 + 20},${spineY + 100} ${spineX2},${spineY} Z`} fill="#0f172a" />

          {/* Fish Eye */}
          <circle cx={spineX2 + 100} cy={spineY - 30} r="8" fill="#fff" />
          <circle cx={spineX2 + 102} cy={spineY - 30} r="4" fill="#0f172a" />

          {/* Fish Mouth */}
          <path d={`M ${spineX2 + 160},${spineY} Q ${spineX2 + 140},${spineY + 10} ${spineX2 + 150},${spineY + 30} Z`} fill="#f8fafc" />

          {/* Effect Box inside/near Head */}
          <rect x={spineX2 + 30} y={spineY - 45} width="180" height="90" rx="8" fill="#fff" stroke="#dc2626" strokeWidth="4" />
          <text x={spineX2 + 120} y={spineY - 15} fill="#dc2626" fontSize="15" fontWeight="800" textAnchor="middle">{effectLabel}</text>
          <text x={spineX2 + 120} y={spineY + 15} fill="#0f172a" fontSize="14" fontWeight="700" textAnchor="middle">
            {effectStr.length > 22 ? effectStr.substring(0, 20) + '...' : effectStr}
          </text>

          {FISHBONE_CATS.map((cat, c) => {
            const isTop = c < 3;
            const baseX = isTop ? topXs[c] : botXs[c - 3];
            const endX = baseX - 110;
            const endY = isTop ? (spineY - 150) : (spineY + 150);

            // Category Box at the end of bone
            const boxW = 190;
            const boxH = 40;
            const boxX = endX - boxW / 2;
            const boxY = isTop ? endY - boxH : endY;

            const arr = fishbone[cat.key] || [];

            return (
              <g key={cat.key}>
                {/* Diagonal Bone pointing to spine */}
                <line x1={endX} y1={endY} x2={baseX} y2={spineY} stroke="#0f172a" strokeWidth="4" markerEnd="url(#fbArrow)" />

                {/* Category Box */}
                <rect x={boxX} y={boxY} width={boxW} height={boxH} rx="8" fill="#0f172a" />
                <text x={endX} y={boxY + 24} fill="#fff" fontSize="14" fontWeight="800" textAnchor="middle" letterSpacing="0.5px">{cat.label}</text>

                {/* Causes along the bone */}
                {arr.slice(0, 5).map((cause, i) => {
                  const t = (i + 1) / 6; // evenly space up to 5 causes
                  const tx = endX + (baseX - endX) * t;
                  const ty = endY + (spineY - endY) * t;
                  const txt = cause.text + (cause.score ? ` [${cause.score}]` : '');

                  // Tick mark (horizontal line pointing to the cause)
                  const tickLen = 70;
                  const tickX1 = tx;
                  const tickX2 = tx - tickLen; // pointing left

                  return (
                    <g key={i}>
                      <line x1={tx} y1={ty} x2={tickX2} y2={ty} stroke="#0f172a" strokeWidth="2.5" />
                      <text x={tickX2 - 6} y={ty + 4} fill="#1e293b" fontSize="12" fontWeight="600" textAnchor="end">{txt.substring(0, 24)}</text>
                      {cause.probable && <circle cx={tx} cy={ty} r="8" fill="#fee2e2" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="4,2" />}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const getProbableCauses = () => {
    const probable = [];
    FISHBONE_CATS.forEach(cat => {
      (fishbone[cat.key] || []).forEach((c, i) => {
        if (c.probable) probable.push({ id: `${cat.key}-${i}`, cat: cat.key, ...c });
      });
    });
    return probable;
  };

  const renderTimeline = () => {
    const isNoFurtherInvestigation = Boolean(
      incident?.noFurtherInvestigation ||
      huNoFurtherInvestigation ||
      irNoFurtherInvestigation ||
      headsUpData?.noFurtherInvestigation ||
      initialReportData?.noFurtherInvestigation ||
      rawIncident?.incident?.noFurtherInvestigation ||
      rawIncident?.noFurtherInvestigation
    );

    const isClosed = Boolean(
      incident?.closedBy ||
      incident?.status === 2 ||
      String(incident?.stage).toUpperCase() === "CLOSED" ||
      rawIncident?.incident?.closedBy ||
      rawIncident?.closedBy ||
      rawIncident?.incident?.status === 2 ||
      rawIncident?.status === 2 ||
      String(rawIncident?.incident?.stage || rawIncident?.stage).toUpperCase() === "CLOSED"
    );

    const hasInitialReport = Boolean(
      initialReportSubmitted ||
      initialReportApproved ||
      (initialReportData && (initialReportData.submittedBy || initialReportData.signature || initialReportData.submittedTime))
    );

    const isStep3ApprovedOrFilled = Boolean(
      investigationApproved ||
      (investigationData && (
        investigationData.reviewedBy ||
        investigationData.approvedBy ||
        (Array.isArray(investigationData.signatures) && investigationData.signatures.length > 0)
      ))
    );

    const isStep3PendingClosure = !isClosed && (isStep3ApprovedOrFilled || (isNoFurtherInvestigation && hasInitialReportData));

    const s = [
      { key: "headsUp", num: 1, st: stages.headsUp, state: headsUpApproved ? "done" : "current" },
      { key: "initialReport", num: 2, st: stages.initialReport, state: isNoFurtherInvestigation && !hasInitialReportData ? "waived" : initialReportApproved ? "done" : (hasInitialReportData || headsUpApproved) ? "current" : "pending" },
      { key: "investigation", num: 3, st: stages.investigation, state: isClosed ? "done" : isStep3PendingClosure ? "pending_closure" : hasInvestigationData ? (investigationApproved ? "pending_closure" : "current") : isNoFurtherInvestigation ? "waived" : initialReportApproved ? "current" : "pending" }
    ];

    return (
      <div style={{ marginBottom: 28 }}>
        <div className="section-title" style={{ marginTop: 8, marginBottom: 16, fontSize: "16px", fontWeight: 700 }}>Investigation Timeline</div>
        <div className="inv-timeline">
          {s.map((stg, i) => {
            const isCompleted = stg.state === "done";
            const isPendingClosure = stg.state === "pending_closure";
            const isWaived = stg.state === "waived";
            const isInProgress = stg.state === "current";
            const isPending = stg.state === "pending";

            return (
              <div 
                key={stg.key} 
                className={`inv-stage state-${stg.state}`}
                style={{
                  display: "flex",
                  gap: "18px",
                  paddingBottom: i === s.length - 1 ? "0" : "20px",
                  position: "relative"
                }}
              >
                {/* Left Step Indicator */}
                <div className="inv-marker" style={{ position: "relative", flexShrink: 0, width: "36px", display: "flex", justifyContent: "center" }}>
                  <div 
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: 800,
                      zIndex: 2,
                      background: isCompleted ? "#10b981" : isWaived ? "#10b981" : isPendingClosure ? "#ea580c" : isInProgress ? "#e11d48" : "#ffffff",
                      color: isCompleted || isWaived || isPendingClosure || isInProgress ? "#ffffff" : "#94a3b8",
                      border: isPending ? "2px dashed #cbd5e1" : "none",
                      boxShadow: isPendingClosure ? "0 0 0 5px rgba(234, 88, 12, 0.2)" : isInProgress ? "0 0 0 5px rgba(225, 29, 72, 0.2)" : isCompleted || isWaived ? "0 2px 6px rgba(16, 185, 129, 0.25)" : "none"
                    }}
                  >
                    {isCompleted || isWaived || isPendingClosure ? <CheckIcon /> : stg.num}
                  </div>
                  {i < s.length - 1 && (
                    <div 
                      style={{
                        position: "absolute",
                        top: "36px",
                        bottom: "-20px",
                        left: "50%",
                        width: "3px",
                        marginLeft: "-1.5px",
                        background: isCompleted || isWaived ? "#10b981" : isPendingClosure ? "#ea580c" : "#e2e8f0",
                        zIndex: 1
                      }}
                    />
                  )}
                </div>

                {/* Card Body */}
                <div 
                  style={{
                    flex: 1,
                    background: isCompleted ? "#eefbf4" : isWaived ? "#f0fdf4" : isPendingClosure ? "#fff7ed" : isInProgress ? "#fef2f2" : "#ffffff",
                    border: `1px solid ${isCompleted ? "#d1fae5" : isWaived ? "#bbf7d0" : isPendingClosure ? "#fed7aa" : isInProgress ? "#fee2e2" : "#e2e8f0"}`,
                    borderLeft: `4px solid ${isCompleted || isWaived ? "#10b981" : isPendingClosure ? "#ea580c" : isInProgress ? "#ef4444" : "#cbd5e1"}`,
                    borderRadius: "8px",
                    padding: "16px 20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#0f172a" }}>{stg.st.label}</span>
                        
                        {/* Status Chip */}
                        {isCompleted ? (
                          <span style={{ background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: "999px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            COMPLETED
                          </span>
                        ) : isPendingClosure ? (
                          <span style={{ background: "#ffedd5", color: "#c2410c", border: "1px solid #fdba74", padding: "2px 8px", borderRadius: "999px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            PENDING CLOSURE
                          </span>
                        ) : isWaived ? (
                          <span style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", padding: "2px 8px", borderRadius: "999px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            WAIVED / NOT REQUIRED
                          </span>
                        ) : isInProgress ? (
                          <span style={{ background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: "999px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            IN PROGRESS
                          </span>
                        ) : (
                          <span style={{ background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: "999px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            PENDING
                          </span>
                        )}

                        {/* Priority */}
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          color: String(stg.st.priority || "").toUpperCase() === "CRITICAL" ? "#ef4444" : String(stg.st.priority || "").toUpperCase() === "HIGH" ? "#f97316" : "#64748b"
                        }}>
                          {stg.st.priority}
                        </span>
                      </div>

                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>
                        Deadline: {stg.st.dueLabel}
                      </div>
                    </div>

                    {/* Action Buttons: View Form, Edit, Download - ONLY when form is filled */}
                    {(() => {
                      const isFormFilled = (() => {
                        if (stg.key === "headsUp") {
                          return Boolean(headsUpData && (headsUpData.submittedBy || headsUpData.createdTime || headsUpData.signature || headsUpApproved));
                        }
                        if (stg.key === "initialReport") {
                          return Boolean(hasInitialReportData && (initialReportSubmitted || initialReportApproved || (initialReportData && (initialReportData.submittedBy || initialReportData.signature))));
                        }
                        if (stg.key === "investigation") {
                          return Boolean(hasInvestigationData && (investigationSubmitted || investigationApproved || (investigationData && (Array.isArray(investigationData.signatures) && investigationData.signatures.length > 0))));
                        }
                        return false;
                      })();

                      const isFormApproved = (() => {
                        if (stg.key === "headsUp") return headsUpApproved;
                        if (stg.key === "initialReport") return initialReportApproved;
                        if (stg.key === "investigation") return investigationApproved;
                        return false;
                      })();

                      // Non-filled form: do not give any options
                      if (!isFormFilled) return null;

                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          {/* 1. View Form Button (Icon only) */}
                          <button
                            type="button"
                            style={{
                              background: "#ffffff",
                              color: "#1e293b",
                              border: "1px solid #cbd5e1",
                              width: "32px",
                              height: "32px",
                              padding: 0,
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                              transition: "all 0.15s ease"
                            }}
                            title={`View ${stg.st.label} Form`}
                            onClick={() => {
                              setPdfTargetForm(stg.key);
                              setShowPdfExport(true);
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>

                          {/* 2. Edit Button - ONLY when filled but NOT approved (Icon only) */}
                          {!isFormApproved && (
                            <button
                              type="button"
                              style={{
                                background: "#ffffff",
                                color: "#1e293b",
                                border: "1px solid #cbd5e1",
                                width: "32px",
                                height: "32px",
                                padding: 0,
                                borderRadius: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                transition: "all 0.15s ease"
                              }}
                              title={`Edit ${stg.st.label}`}
                              onClick={() => {
                                if (stg.key === "headsUp") setIsEditingHeadsUp(true);
                                if (stg.key === "initialReport") setIsEditingInitialReport(true);
                                if (stg.key === "investigation") {
                                  setInvestigationStarted(true);
                                  setIsEditingInvestigation(true);
                                }
                                setActiveTab(stg.key);
                                setTimeout(() => {
                                  document.getElementById('inc-panels')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 100);
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                          )}

                          {/* 3. Download Button (Icon only) */}
                          <button
                            type="button"
                            style={{
                              background: "#0f172a",
                              color: "#ffffff",
                              border: "1px solid #0f172a",
                              width: "32px",
                              height: "32px",
                              padding: 0,
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: downloadingForm === stg.key ? "wait" : "pointer",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                              transition: "all 0.15s ease"
                            }}
                            disabled={downloadingForm === stg.key}
                            title={`Download ${stg.st.label} PDF`}
                            onClick={() => handleExportSingleForm(stg.key, stg.st.label)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const formatDateTimeObj = (dStr) => {
    if (!dStr) return { date: "ΓÇö", time: "ΓÇö" };
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return { date: dStr.split("T")[0] || dStr, time: dStr.split("T")[1] || "ΓÇö" };
      const date = d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const time = d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return { date, time };
    } catch (e) { return { date: dStr, time: "ΓÇö" }; }
  };


  const getSignatureUrl = (sig) => {
    if (!sig) return null;
    if (sig.startsWith("data:image") || sig.startsWith("blob:")) return sig;
    if (sig.startsWith("http://") || sig.startsWith("https://")) return sig;

    let filename = sig.trim();
    if (filename.includes("/signatures/")) {
      filename = filename.split("/signatures/").pop();
    } else if (filename.includes("/uploads/")) {
      filename = filename.split("/uploads/").pop();
    }
    filename = filename.replace(/^\/+/, "");

    return `https://api.beam.safesiteworks.com/development/m3south/signatures/${filename}`;
  };

  const renderSignatureCard = (step, index) => {
    const { user, role, signature, color } = step;
    if (!user) return null;

    const getInitials = (name) => {
      const parts = name.split(" ");
      if (parts.length >= 2) return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
      return name.substring(0, 2).toUpperCase();
    };
    const initials = getInitials(user);
    const sigUrl = getSignatureUrl(signature);

    return (
      <div key={`sig-${index}`} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: "var(--bg-card, #fff)", borderRadius: 8, border: "1px solid var(--border-color)", marginBottom: 0, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", width: "280px", flexShrink: 0, height: "auto" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: (color || "#3b82f6") + "1a", color: color || "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, borderLeft: "1px solid var(--border-color)", paddingLeft: 16, display: "flex", flexDirection: "column" }}>
          <div style={{ height: 50, display: "flex", alignItems: "center", marginBottom: 4 }}>
            {sigUrl ? (
              <img
                className="signature-img"
                src={sigUrl}
                alt="Signature"
                style={{ maxHeight: "100%", maxWidth: "200px", objectFit: "contain" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div style={{ fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: 18, color: "var(--text-main)", fontWeight: 700 }}>
                {user}
              </div>
            )}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{user}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>({role})</div>
        </div>
      </div>
    );
  };

  const renderAuditCard = (step, index, totalSteps) => {
    const { title, type, user, role, timestamp, color } = step;
    if (!user || !timestamp) return null;
    const { date, time } = formatDateTimeObj(timestamp);
    const isLast = index === totalSteps - 1;
    const stepNumber = String(index + 1).padStart(2, '0');

    return (
      <div key={index} style={{ display: "flex", alignItems: "stretch", gap: 16, position: "relative", paddingBottom: isLast ? 0 : 24 }}>
        {/* Connector Line */}
        {!isLast && <div style={{ position: "absolute", left: 24, top: 48, bottom: -8, width: 2, background: "var(--border-color)", zIndex: 1 }}></div>}

        {/* Icon Circle */}
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, flexShrink: 0, marginTop: 4, alignSelf: "center" }}>
          {type === "APPROVED" ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          ) : type === "EDITED" ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          ) : type === "SUBMITTED" && title.includes("Investigation") ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          ) : title.includes("Initial") ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", flex: 1, padding: "8px 16px", background: "var(--bg-card, #fff)", borderRadius: 8, border: "1px solid var(--border-color)", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", height: "auto" }}>
          {/* Number */}
          <div style={{ fontSize: 24, fontWeight: 800, color: color, marginRight: 24 }}>{stepNumber}</div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: color }}>{title}</span>
              <span style={{ background: color + "1a", color: color, padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, border: `1px solid ${color}33` }}>
                {type === "APPROVED" ? "Marked OK & Signed Off" : type === "EDITED" ? "Updated & Re-submitted" : type === "RETURNED_FOR_REVISION" ? "Returned for Revision" : "Submitted"}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-main)", marginBottom: 4 }}>
              {type === "APPROVED" ? "Signed by" : type === "EDITED" ? "Updated by" : type === "RETURNED_FOR_REVISION" ? "Returned by" : "Submitted by"} <b>{user}</b> <span style={{ color: "var(--text-muted)" }}>({role})</span>
            </div>
            {step.reason && (
              <div style={{ fontSize: 12, color: type === "RETURNED_FOR_REVISION" ? "#991b1b" : "#92400e", marginBottom: 6, background: type === "RETURNED_FOR_REVISION" ? "#fef2f2" : "#fffbeb", padding: "4px 8px", borderRadius: 4, display: "inline-block", border: type === "RETURNED_FOR_REVISION" ? "1px solid #fecaca" : "1px solid #fef3c7" }}>
                <strong>{type === "RETURNED_FOR_REVISION" ? "Reason for Revision:" : "Changes / Notes:"}</strong> {step.reason}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> {date}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="6" x2="12" y2="12" /><line x1="12" y1="12" x2="16" y2="14" /></svg> {time}</span>
            </div>
          </div>

          {/* Arrow */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>

        {renderSignatureCard(step, index)}
      </div>
    );
  };

  const huAudit = [];
  if (headsUpData && (headsUpData.submittedBy || headsUpData.signature)) {
    huAudit.push({
      title: "Heads-Up Notification (2hr)", type: "SUBMITTED",
      user: headsUpData.submittedBy || incident?.reportedBy || "User", role: headsUpData.submitterRole || "Submitter",
      timestamp: headsUpData.submittedTime || headsUpData.createdTime || incident?.createdTime, signature: headsUpData.signature,
      iconSvg: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
      color: "#3b82f6"
    });
  }
  if (headsUpData?.editHistory && Array.isArray(headsUpData.editHistory)) {
    headsUpData.editHistory.forEach(ed => {
      const isReturned = ed.status === "RETURNED_FOR_REVISION" || (ed.action && String(ed.action).toLowerCase().includes("return"));
      huAudit.push({
        title: "Heads-Up Notification (2hr)",
        type: isReturned ? "RETURNED_FOR_REVISION" : "EDITED",
        user: ed.returnedBy || ed.editedBy || "User",
        role: ed.role || (isReturned ? "NNE Peer Reviewer" : "Submitter / Editor"),
        reason: ed.reason || ed.editReason || ed.changes,
        timestamp: ed.returnedTime || ed.editedTime || ed.timestamp,
        signature: ed.signature,
        iconSvg: isReturned ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
        ) : undefined,
        color: isReturned ? "#ef4444" : "#f59e0b"
      });
    });
  }
  if (headsUpApproved) {
    huAudit.push({
      title: "Heads-Up Notification (2hr)", type: "APPROVED",
      user: headsUpData?.approvedBy || "Reviewer", role: headsUpData?.approverRole || "NNE Peer Reviewer",
      timestamp: headsUpData?.approvedTime || headsUpData?.updatedTime, signature: headsUpData?.approverSignature || headsUpData?.signature,
      iconSvg: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-safe, #10b981)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
      color: "var(--color-safe, #10b981)"
    });
  }

  const irAudit = [];
  if (initialReportData && (initialReportData.submittedBy || initialReportData.signature || initialReportSubmitted)) {
    irAudit.push({
      title: "Initial Incident Report (24hr)", type: "SUBMITTED",
      user: initialReportData.submittedBy || irSubmittedBy || incident?.reporterName || incident?.reportedBy || "User", role: initialReportData.submitterRole || "Reporter",
      timestamp: initialReportData.submittedTime || initialReportData.createdTime || initialReportData.createdAt || initialReportData.updatedTime || incident?.updatedTime, signature: initialReportData.signature || irSubSignature,
      iconSvg: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
      color: "#eab308"
    });
  }
  if (initialReportData?.editHistory && Array.isArray(initialReportData.editHistory)) {
    initialReportData.editHistory.forEach(ed => {
      const isReturned = ed.status === "RETURNED_FOR_REVISION" || (ed.action && String(ed.action).toLowerCase().includes("return"));
      irAudit.push({
        title: "Initial Incident Report (24hr)",
        type: isReturned ? "RETURNED_FOR_REVISION" : "EDITED",
        user: ed.returnedBy || ed.editedBy || "User",
        role: ed.role || (isReturned ? "Customer Approver" : "Reporter / Editor"),
        reason: ed.reason || ed.editReason || ed.changes,
        timestamp: ed.returnedTime || ed.editedTime || ed.timestamp,
        signature: ed.signature,
        iconSvg: isReturned ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
        ) : undefined,
        color: isReturned ? "#ef4444" : "#f59e0b"
      });
    });
  }
  if (initialReportApproved) {
    irAudit.push({
      title: "Initial Incident Report (24hr)", type: "APPROVED",
      user: initialReportData?.approvedBy || "Reviewer", role: initialReportData?.approverRole || "Customer Approver",
      timestamp: initialReportData?.approvedTime || initialReportData?.updatedTime, signature: initialReportData?.approverSignature || initialReportData?.signature,
      iconSvg: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
      color: "#8b5cf6"
    });
  }

  const invAudit = [];
  if (investigationData && investigationData.signatures && Array.isArray(investigationData.signatures) && investigationData.signatures.length > 0) {
    investigationData.signatures.forEach((sigObj, idx) => {
      if (sigObj && (sigObj.name || sigObj.signature)) {
        invAudit.push({
          title: `Incident Investigation Report ${investigationData.signatures.length > 1 ? `Signature #${idx + 1}` : "(7 days)"}`,
          type: "SUBMITTED",
          user: sigObj.name || invInvName || incident?.investigatorName || "User",
          role: sigObj.role || "Site HSE Investigator",
          timestamp: sigObj.date || investigationData.submittedTime || investigationData.completedTime || investigationData.updatedTime || incident?.updatedTime,
          signature: sigObj.signature,
          iconSvg: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
          color: "#ec4899"
        });
      }
    });
  } else if (investigationData && (investigationSubmitted || investigationData.submittedBy || invInvSignature)) {
    invAudit.push({
      title: "Incident Investigation Report (7 days)", type: "SUBMITTED",
      user: invInvName || investigationData.submittedBy || incident?.investigatorName || "User",
      role: invInvRole || "HSE Investigator",
      timestamp: invInvDate || investigationData.submittedTime || investigationData.createdTime || incident?.updatedTime,
      signature: invInvSignature || investigationData.signature,
      iconSvg: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
      color: "#ec4899"
    });
  }
  if (investigationData?.editHistory && Array.isArray(investigationData.editHistory)) {
    investigationData.editHistory.forEach(ed => {
      const isReturned = ed.status === "RETURNED_FOR_REVISION" || (ed.action && String(ed.action).toLowerCase().includes("return"));
      invAudit.push({
        title: "Incident Investigation Report (7 days)",
        type: isReturned ? "RETURNED_FOR_REVISION" : "EDITED",
        user: ed.returnedBy || ed.editedBy || "User",
        role: ed.role || (isReturned ? "Site HSE Lead Reviewer" : "Investigator / Editor"),
        reason: ed.reason || ed.editReason || ed.changes,
        timestamp: ed.returnedTime || ed.editedTime || ed.timestamp,
        signature: ed.signature,
        iconSvg: isReturned ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
        ) : undefined,
        color: isReturned ? "#ef4444" : "#f59e0b"
      });
    });
  }
  if (investigationApproved) {
    invAudit.push({
      title: "Incident Investigation Report (7 days)", type: "APPROVED",
      user: investigationData?.reviewedBy || "Reviewer", role: investigationData?.reviewerRole || "Leader",
      timestamp: investigationData?.reviewedTime || investigationData?.updatedTime, signature: investigationData?.reviewerSignature || investigationData?.signature,
      iconSvg: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>,
      color: "#14b8a6"
    });
  }

  const allAuditSteps = [...huAudit, ...irAudit, ...invAudit];

  return (
    <div className="mod-page">

      {/* ΓöÇΓöÇ Print-only Header ΓöÇΓöÇ */}
      <div className="print-only-header">
        {(incident.stage === "CLOSED" || incident.status === "Closed" || incident.pipeline === "Closed" || incident.stage === "Closed") && (
          <div style={{ textAlign: "right", fontSize: "14px", fontWeight: "bold", marginBottom: "16px", color: "#333" }}>
            Completed Date: {incident.updatedTime ? new Date(incident.updatedTime).toLocaleString() : new Date().toLocaleString()}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "24px", marginBottom: "32px" }}>
          <img src={novoLogo} alt="Novo Nordisk" style={{ height: "60px", objectFit: "contain" }} />
          <img src={nneLogo} alt="NNE" style={{ height: "40px", objectFit: "contain" }} />
        </div>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", margin: "0 0 12px 0", color: "#1e293b" }}>Incident Report {incident.caseNumber || incident.id}</h1>
          <h2 style={{ fontSize: "18px", margin: "0", color: "#64748b", fontWeight: "normal" }}>{incident.title || "ΓÇö"}</h2>
        </div>
      </div>
      {/* ΓöÇΓöÇ End Print-only Header ΓöÇΓöÇ */}

      <div className="hide-on-print" style={{ marginBottom: "16px", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => navigate("/incident-management/list")} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-main)", fontWeight: 600, fontSize: "13px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back to Incidents List
        </button>
      </div>      <div className="inc-head" style={{ background: "var(--bg-card, #fff)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", background: "var(--bg-dark)", padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>{incident.caseNumber || incident.id}</span>

            {(() => {
              const level = incident.actualSeverity || incident.severity;
              if (!level) return null;
              const meta = {
                1: { label: "Insignificant", color: "#2D9E5A" },
                2: { label: "Minor", color: "#C07D10" },
                3: { label: "Moderate", color: "#D97706" },
                4: { label: "Critical", color: "#E32B50" },
                5: { label: "Catastrophic", color: "#8F1B32" }
              };
              const m = meta[level] || { label: "", color: "#A1A5B3" };
              return (
                <span className="inc-pill" style={{ background: m.color, color: "#fff", borderRadius: "6px", fontWeight: 700, padding: "4px 10px", fontSize: "11px" }}>
                  {m.label.toUpperCase()}
                </span>
              );
            })()}

            {incident.stage && (
              <span className="inc-pill" style={{ background: "rgba(227, 43, 80, 0.1)", color: "#E32B50", borderRadius: "6px", fontWeight: 700, padding: "4px 10px", fontSize: "11px", border: "1px solid rgba(227, 43, 80, 0.3)" }}>
                {incident.stage === "INVESTIGATION" ? "INVESTIGATING" : incident.stage.replace("_", " ")}
              </span>
            )}

            {incident.isHipo && <span className="inc-pill" style={{ background: "#dc2626", color: "#fff", borderRadius: "6px", fontWeight: 700, padding: "4px 10px", fontSize: "11px" }}>HIPO</span>}

            {incident.investigationLevel && (
              <span className="inc-pill" title="Investigation required" style={{ background: "rgba(192, 125, 16, 0.14)", color: "#d97706", borderRadius: "6px", fontWeight: 700, padding: "4px 10px", fontSize: "11px", border: "1px solid rgba(192, 125, 16, 0.3)" }}>
                INVESTIGATION {incident.investigationLevel.toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", marginBottom: "12px", letterSpacing: "-0.5px" }}>{incident.title || incident.categories?.[0] || incident.caseNumber}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {incident.buildingName ? `${incident.buildingName}${incident.floorLevel ? ' - ' + incident.floorLevel : ''}` : (incident.location || "ΓÇö")}
            </span>
            <span style={{ color: "var(--border-color)" }}>|</span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
              {incident.origin || incident.type || "ΓÇö"}
            </span>
          </div>
        </div>
        <div className="inc-head-actions hide-on-print" style={{ display: "flex", gap: "10px" }}>
          <button
            className="mod-btn-outline"
            onClick={handleExportPdf}
            disabled={downloadingPdf}
            style={{ fontSize: "13px", padding: "8px 16px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            {downloadingPdf ? "Downloading..." : "Export PDF"}
          </button>
        </div>
      </div>

      {incident.isHipo && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", marginBottom: "20px", borderRadius: "8px", background: "var(--color-risk-bg)", borderLeft: "4px solid var(--color-risk)", color: "var(--color-risk)", fontWeight: 600, fontSize: "13px" }}>
          <span style={{ fontSize: "16px" }}>ΓÜá∩╕Å</span>
          <span>High-Potential (HiPo) incident {incident.investigationLevel ? `┬╖ Investigation Level ${incident.investigationLevel} (L1 = basic, L2 = intermediate, L3 = full / serious)` : ""}</span>
        </div>
      )}

      {/* Banner above Timeline: No Further Investigation Required */}
      {(incident.noFurtherInvestigation || huNoFurtherInvestigation || irNoFurtherInvestigation || headsUpData?.noFurtherInvestigation || initialReportData?.noFurtherInvestigation) && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "14px 20px",
          marginBottom: "20px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.06) 100%)",
          border: "1.5px solid rgba(16, 185, 129, 0.35)",
          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, flexShrink: 0 }}>
              Γ£ô
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#065f46" }}>
                No Further Investigation Required: YES
              </div>
              <div style={{ fontSize: "12.5px", color: "#047857", marginTop: "2px" }}>
                This incident is marked as not requiring Stage 3 detailed investigation. It can be closed directly after stage sign-off & approval.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ background: "#059669", color: "#ffffff", padding: "4px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.03em" }}>
              INVESTIGATION WAIVED
            </span>
          </div>
        </div>
      )}

      {renderTimeline()}

      {/* Tabs */}
      <div className="inc-tabs">
        {[
          { id: "overview", label: "Overview" },
          {
            id: "headsUp",
            label: "Step 1: Heads-Up (2hr)",
            tabBadge: (() => {
              const hist = headsUpData?.editHistory || [];
              const lastHist = hist.length > 0 ? hist[hist.length - 1] : null;
              if (lastHist && (lastHist.status === "RETURNED_FOR_REVISION" || String(lastHist.action).toLowerCase().includes("return")) && !headsUpApproved) {
                return "REVISION REQUIRED";
              }
              return (incident.stage === "HEADS_UP" && !headsUpApproved) ? "IN PROGRESS" : "COMPLETED";
            })(),
            tabBadgeClass: (() => {
              const hist = headsUpData?.editHistory || [];
              const lastHist = hist.length > 0 ? hist[hist.length - 1] : null;
              if (lastHist && (lastHist.status === "RETURNED_FOR_REVISION" || String(lastHist.action).toLowerCase().includes("return")) && !headsUpApproved) {
                return "chip-inprogress";
              }
              return (incident.stage === "HEADS_UP" && !headsUpApproved) ? "chip-inprogress" : "chip-approved";
            })()
          },
          {
            id: "initialReport",
            label: "Step 2: Initial Report (24hr)",
            tabBadge: (() => {
              const hist = initialReportData?.editHistory || [];
              const lastHist = hist.length > 0 ? hist[hist.length - 1] : null;
              if (lastHist && (lastHist.status === "RETURNED_FOR_REVISION" || String(lastHist.action).toLowerCase().includes("return")) && !initialReportApproved) {
                return "REVISION REQUIRED";
              }
              return (isNoFurtherInvestigation && !hasInitialReportData) ? "WAIVED" : incident.stage === "HEADS_UP" ? "PENDING" : (initialReportApproved || (incident.stage !== "HEADS_UP" && incident.stage !== "INITIAL_REPORT") ? "COMPLETED" : "IN PROGRESS");
            })(),
            tabBadgeClass: (() => {
              const hist = initialReportData?.editHistory || [];
              const lastHist = hist.length > 0 ? hist[hist.length - 1] : null;
              if (lastHist && (lastHist.status === "RETURNED_FOR_REVISION" || String(lastHist.action).toLowerCase().includes("return")) && !initialReportApproved) {
                return "chip-inprogress";
              }
              return (isNoFurtherInvestigation && !hasInitialReportData) ? "chip-approved" : incident.stage === "HEADS_UP" ? "chip-upcoming" : (initialReportApproved || (incident.stage !== "HEADS_UP" && incident.stage !== "INITIAL_REPORT") ? "chip-approved" : "chip-inprogress");
            })()
          },
          {
            id: "investigation",
            label: "Step 3: Investigation Report (7 days)",
            tabBadge: (() => {
              const hist = investigationData?.editHistory || [];
              const lastHist = hist.length > 0 ? hist[hist.length - 1] : null;
              if (lastHist && (lastHist.status === "RETURNED_FOR_REVISION" || String(lastHist.action).toLowerCase().includes("return")) && !investigationApproved) {
                return "REVISION REQUIRED";
              }
              return (isNoFurtherInvestigation && !hasInvestigationData) ? "WAIVED" : (investigationApproved ? "COMPLETED" : (investigationSubmitted ? "IN REVIEW" : "IN PROGRESS"));
            })(),
            tabBadgeClass: (() => {
              const hist = investigationData?.editHistory || [];
              const lastHist = hist.length > 0 ? hist[hist.length - 1] : null;
              if (lastHist && (lastHist.status === "RETURNED_FOR_REVISION" || String(lastHist.action).toLowerCase().includes("return")) && !investigationApproved) {
                return "chip-inprogress";
              }
              return (isNoFurtherInvestigation && !hasInvestigationData) ? "chip-approved" : (investigationApproved ? "chip-approved" : (investigationSubmitted ? "chip-current" : "chip-inprogress"));
            })()
          },
          {
            id: "immediateActions",
            label: "Immediate Actions",
            tabBadge: (() => {
              const list = [];
              (huImmActions || []).forEach(a => {
                if (a.action || a.responsible || a.time) list.push(a);
              });
              if (hasInitialReportData) {
                let irActs = rawIncident?.initialReport?.immediateActions || rawIncident?.initial_report?.immediateActions;
                if (typeof irActs === "string") {
                  try { irActs = JSON.parse(irActs); } catch (e) { irActs = []; }
                }
                const irList = Array.isArray(irActs) && irActs.length > 0 ? irActs : (initialReportSubmitted ? immActions : []);
                (irList || []).forEach(a => {
                  const actText = (a.action || a.description || "").trim();
                  if (actText) {
                    const isDup = list.some(ex => (ex.action || ex.description || "").trim().toLowerCase() === actText.toLowerCase() && (ex.time || ex.timeImplemented || "") === (a.time || a.timeImplemented || ""));
                    if (!isDup) list.push(a);
                  }
                });
              }
              return list.length > 0 ? `${list.length}` : undefined;
            })(),
            tabBadgeClass: "chip-approved"
          },
          { id: "actions", label: "Corrective Actions" }
        ].map(t => (
          <button key={t.id} className={`inc-tab ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
            {t.tabBadge && <span className={`inv-chip ${t.tabBadgeClass}`} style={{ marginLeft: "8px" }}>{t.tabBadge}</span>}
          </button>
        ))}
      </div>

      <div id="inc-panels">
        <div className={`inc-tab-panel ${activeTab === "overview" ? "active" : ""}`}>
          <div className="mod-card">
            <div className="mod-card-header"><span className="mod-card-title">Incident Details</span></div>
            <div className="mod-card-body">
              <dl className="detail-meta" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 16px" }}>
                {/* Left Column Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Incident Code</dt>
                    <dd style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>{incident.caseNumber || incident.id || "ΓÇö"}</dd>
                  </div>
                  {incident.title && (
                    <div>
                      <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Incident Title</dt>
                      <dd style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>{incident.title}</dd>
                    </div>
                  )}
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Classification</dt>
                    <dd style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-main)" }}>{incident.categories ? (Array.isArray(incident.categories) ? incident.categories.join(", ") : incident.categories) : incident.category || "ΓÇö"}</dd>
                  </div>
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Contractor</dt>
                    <dd style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                      {(incident.contractorsInvolved || incident.contractor) ? (
                        <>
                          <ContractorLogo
                            logoVal={findContractorLogo(incident.contractorsInvolved || incident.contractor, contractorsList)}
                            name={incident.contractorsInvolved || incident.contractor}
                            size={22}
                          />
                          <span>{incident.contractorsInvolved || incident.contractor}</span>
                        </>
                      ) : "ΓÇö"}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Status</dt>
                    <dd style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-main)" }}>
                      <span style={{ display: "inline-block", padding: "2px 8px", background: "var(--bg-card-hover)", borderRadius: "12px", fontSize: "12px" }}>
                        {(incident.status === 2 || incident.closedBy || String(incident.stage).toUpperCase() === "CLOSED") ? "Closed" : "Open"}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Potential Severity</dt>
                    <dd style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-main)" }}><SevPill level={incident.potentialSeverity} /></dd>
                  </div>
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Investigation Level</dt>
                    <dd style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                      {incident.investigationLevel ? (
                        <><span style={{ display: "inline-block", padding: "2px 8px", background: "#fef3c7", color: "#d97706", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>{incident.investigationLevel}</span> <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>{incident.investigationLevel === "L2" ? "(Fishbone + 5 Whys)" : incident.investigationLevel === "L3" ? "(Root Cause Analysis)" : "(Standard)"}</span></>
                      ) : "ΓÇö"}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Required Approval</dt>
                    <dd style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-main)" }}>Site HSE Lead + Overall PM</dd>
                  </div>
                </div>

                {/* Right Column Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Date / Time</dt>
                    <dd style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-main)" }}>
                      {incident.incidentDate ? new Date(incident.incidentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "ΓÇö"} {incident.incidentTime || ""}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Location</dt>
                    <dd style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-main)" }}>{[incident.buildingName, incident.floorLevel, incident.specificLocation].filter(Boolean).join(" - ") || incident.location || "ΓÇö"}</dd>
                  </div>
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Reporter</dt>
                    <dd style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-main)" }}>{headsUpData?.submittedBy || incident.reporterName || incident.reportedBy || incident.createdBy || incident.investigatorName || "Site HSE"}</dd>
                  </div>
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Actual Severity</dt>
                    <dd style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-main)" }}><SevPill level={incident.actualSeverity} /></dd>
                  </div>
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>High-Potential</dt>
                    <dd style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-main)" }}>{incident.isHipo ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Investigation Team</dt>
                    <dd style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-main)" }}>Site HSE, contractor rep, AMO (if injury)</dd>
                  </div>
                  <div>
                    <dt style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Description</dt>
                    <dd style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-main)" }}>{headsUpData?.descriptionWhatHappened || headsUpData?.whatHappened || headsUpData?.descriptionConsequence || incident.description || incident.details || "ΓÇö"}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>

          {/* Audit Trail & Sign-Off Log */}
          <div className="mod-card" style={{ marginTop: 24 }}>
            <div className="mod-card-header" style={{ paddingBottom: 4, display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="mod-card-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", color: "var(--text-main)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
                </svg>
                Audit Trail & Sign-Off Log
              </span>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 32 }}>Track all sign-offs and approvals in the incident management process.</div>
            </div>
            <div className="mod-card-body" style={{ padding: "24px 16px" }}>
              {allAuditSteps.length > 0 ? (
                <div style={{ position: "relative", paddingLeft: 16 }}>
                  <div style={{ position: "relative", paddingLeft: 16 }}>
                    {allAuditSteps.map((step, i) => renderAuditCard(step, i, allAuditSteps.length))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 14, color: "var(--text-muted)", fontStyle: "italic", padding: "16px", background: "var(--bg-dark, #f8fafc)", borderRadius: 8, border: "1px dashed var(--border-color)", textAlign: "center" }}>No audit events yet.</div>
              )}
            </div>
          </div>

          {/* Event Log */}
          <div className="mod-card" style={{ marginTop: 24 }}>
            <div className="mod-card-header" style={{ paddingBottom: 16 }}>
              <span className="mod-card-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", color: "var(--text-main)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M9 14h6" /><path d="M9 10h6" /><path d="M9 18h6" />
                </svg>
                Event Log
              </span>
            </div>
            <div className="mod-card-body" style={{ padding: 0 }}>
              {(() => {
                const formatDateTime = (dStr) => {
                  if (!dStr) return "ΓÇö";
                  try {
                    const d = new Date(dStr);
                    if (isNaN(d.getTime())) return dStr.replace("T", " ");
                    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
                  } catch (e) { return dStr; }
                };

                const allEvents = [];
                if (incident?.closedBy || incident?.status === 2 || String(incident?.stage).toUpperCase() === "CLOSED") {
                  allEvents.push({
                    text: "Incident closed",
                    user: incident?.closedBy || "System",
                    rawDate: incident?.updatedTime,
                    date: formatDateTime(incident?.updatedTime)
                  });
                }

                // Stage 3 Investigation events
                if (investigationApproved) {
                  allEvents.push({
                    text: "Incident Investigation Report marked OK & signed off",
                    user: investigationData.reviewedBy || investigationData.approvedBy || "Reviewer",
                    rawDate: investigationData.reviewedTime || investigationData.approvedTime || investigationData.updatedTime,
                    date: formatDateTime(investigationData.reviewedTime || investigationData.approvedTime || investigationData.updatedTime)
                  });
                }
                if (investigationData?.editHistory && Array.isArray(investigationData.editHistory)) {
                  investigationData.editHistory.forEach(ed => {
                    const isReturned = ed.status === "RETURNED_FOR_REVISION" || (ed.action && String(ed.action).toLowerCase().includes("return"));
                    allEvents.push({
                      text: isReturned
                        ? `Incident Investigation Report returned for revision${ed.reason ? ` ΓÇö "${ed.reason}"` : ''}`
                        : `Incident Investigation Report edited & re-submitted${ed.reason ? ` ΓÇö "${ed.reason}"` : ''}`,
                      user: ed.returnedBy || ed.editedBy || "User",
                      rawDate: ed.returnedTime || ed.editedTime,
                      date: formatDateTime(ed.returnedTime || ed.editedTime)
                    });
                  });
                }
                if (investigationSubmitted || (investigationData && (investigationData.signatures?.length > 0 || investigationData.submittedBy))) {
                  const invSigUser = (investigationData?.signatures && investigationData.signatures[0]?.name) || investigationData?.submittedBy || invInvName || incident?.investigatorName || "Investigator";
                  const invSigRaw = (investigationData?.signatures && investigationData.signatures[0]?.date) || investigationData?.submittedTime || investigationData?.completedTime || investigationData?.updatedTime || incident?.updatedTime;
                  allEvents.push({
                    text: "Incident Investigation Report submitted",
                    user: invSigUser,
                    rawDate: invSigRaw,
                    date: formatDateTime(invSigRaw)
                  });
                }

                // Stage 2 Initial Report events
                if (initialReportApproved) {
                  allEvents.push({
                    text: "Initial Incident Report marked OK & signed off",
                    user: initialReportData.approvedBy || "Reviewer",
                    rawDate: initialReportData.approvedTime || initialReportData.updatedTime,
                    date: formatDateTime(initialReportData.approvedTime || initialReportData.updatedTime)
                  });
                }
                if (initialReportData?.editHistory && Array.isArray(initialReportData.editHistory)) {
                  initialReportData.editHistory.forEach(ed => {
                    const isReturned = ed.status === "RETURNED_FOR_REVISION" || (ed.action && String(ed.action).toLowerCase().includes("return"));
                    allEvents.push({
                      text: isReturned
                        ? `Initial Incident Report returned for revision${ed.reason ? ` ΓÇö "${ed.reason}"` : ''}`
                        : `Initial Incident Report edited & re-submitted${ed.reason ? ` ΓÇö "${ed.reason}"` : ''}`,
                      user: ed.returnedBy || ed.editedBy || "User",
                      rawDate: ed.returnedTime || ed.editedTime,
                      date: formatDateTime(ed.returnedTime || ed.editedTime)
                    });
                  });
                }
                if (initialReportSubmitted) {
                  const irRawDate = initialReportData.submittedTime || initialReportData.createdTime || initialReportData.createdAt || initialReportData.updatedTime || incident?.updatedTime;
                  allEvents.push({
                    text: "Initial Incident Report submitted",
                    user: initialReportData.submittedBy || irSubmittedBy || incident?.reporterName || incident?.reportedBy || "User",
                    rawDate: irRawDate,
                    date: formatDateTime(irRawDate)
                  });
                }

                // Stage 1 Heads-Up events
                if (headsUpApproved) {
                  allEvents.push({
                    text: "Heads-Up Notification marked OK & approved",
                    user: headsUpData.approvedBy || reviewerName || "Reviewer",
                    rawDate: headsUpData.approvedTime || headsUpData.updatedTime,
                    date: formatDateTime(headsUpData.approvedTime || headsUpData.updatedTime)
                  });
                }
                if (headsUpData?.editHistory && Array.isArray(headsUpData.editHistory)) {
                  headsUpData.editHistory.forEach(ed => {
                    const isReturned = ed.status === "RETURNED_FOR_REVISION" || (ed.action && String(ed.action).toLowerCase().includes("return"));
                    allEvents.push({
                      text: isReturned
                        ? `Heads-Up Notification returned for revision${ed.reason ? ` ΓÇö "${ed.reason}"` : ''}`
                        : `Heads-Up Notification edited & re-submitted${ed.reason ? ` ΓÇö "${ed.reason}"` : ''}`,
                      user: ed.returnedBy || ed.editedBy || "User",
                      rawDate: ed.returnedTime || ed.editedTime,
                      date: formatDateTime(ed.returnedTime || ed.editedTime)
                    });
                  });
                }
                if (headsUpData && (headsUpData.submittedBy || headsUpData.createdTime || incident?.id)) {
                  const huRawDate = headsUpData.submittedTime || headsUpData.createdTime || headsUpData.createdAt || incident?.createdTime;
                  allEvents.push({
                    text: "Heads-Up Notification submitted",
                    user: headsUpData.submittedBy || incident?.reporterName || incident?.reportedBy || "User",
                    rawDate: huRawDate,
                    date: formatDateTime(huRawDate)
                  });
                }

                // Sort by date descending (newest first)
                allEvents.sort((a, b) => {
                  const tA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
                  const tB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
                  return tB - tA;
                });

                if (allEvents.length === 0) {
                  return <div style={{ padding: 16, color: "var(--text-muted)", fontStyle: "italic", textAlign: "center" }}>No events found.</div>;
                }

                return (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "var(--bg-dark, #f4f6f8)", borderBottom: "1px solid var(--border-color)", color: "var(--text-main)" }}>
                        <th style={{ padding: "12px 16px", width: 60, fontWeight: 700 }}>#</th>
                        <th style={{ padding: "12px 16px", fontWeight: 700 }}>EVENT</th>
                        <th style={{ padding: "12px 16px", fontWeight: 700 }}>BY</th>
                        <th style={{ padding: "12px 16px", fontWeight: 700 }}>DATE & TIME</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allEvents.map((ev, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", borderRadius: 4, fontWeight: 700 }}>{i + 1}</span>
                          </td>
                          <td style={{ padding: "12px 16px", color: "var(--text-main)", fontWeight: 500 }}>{ev.text}</td>
                          <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                              {ev.user}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                              {ev.date}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
        <div className={`inc-tab-panel ${activeTab === "headsUp" ? "active" : ""}`}>
          {isEditingHeadsUp && !headsUpApproved ? (
            /* ================= EDIT HEADS-UP NOTIFICATION FORM ================= */
            <div className="mod-card mb-4">
              <div className="mod-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="mod-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary, #3b82f6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit: Heads-Up Notification (2hr)
                  </span>
                  <span className="inv-chip chip-draft" style={{ background: "rgba(59, 130, 246, 0.1)", color: "var(--accent-primary, #3b82f6)", borderColor: "rgba(59, 130, 246, 0.3)" }}>
                    Editing Active
                  </span>
                </div>
                <button
                  type="button"
                  className="mod-btn-outline"
                  style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
                  onClick={() => setIsEditingHeadsUp(false)}
                >
                  Cancel Edit
                </button>
              </div>
              <div className="mod-card-body" style={{ padding: "24px" }}>
                {/* 1. Project & Location Details */}
                <div className="form-section-title" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "16px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", fontSize: "12px", fontWeight: 700 }}>1</span>
                  Project Details & Location
                </div>
                <div className="grid-2">
                  <div className="mod-form-group">
                    <label className="mod-form-label">Project Name</label>
                    <input type="text" className="mod-form-input readonly-box" value={huProject} readOnly />
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Incident Title / Short Summary</label>
                    <input type="text" className="mod-form-input" placeholder="e.g. Scaffolding pipe drop during dismantling" value={huTitle} onChange={(e) => setHuTitle(e.target.value)} />
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Incident Date *</label>
                    <input type="date" className="mod-form-input" value={huDate} onChange={(e) => setHuDate(e.target.value)} />
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Incident Time *</label>
                    <input
                      type="text"
                      className="mod-form-input"
                      placeholder="HH:MM (24-hour)"
                      value={huTime}
                      readOnly
                      onClick={() => {
                        setTempHuTime(huTime || "12:00");
                        setShowHuTimePicker(true);
                      }}
                      style={{ cursor: "pointer", background: "var(--input-bg, #fff)" }}
                    />
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Location / Building *</label>
                    <select
                      className="mod-form-select"
                      value={huBuildingId}
                      onChange={(e) => {
                        const bId = e.target.value;
                        setHuBuildingId(bId);
                        const bObj = buildingsList.find(b => String(b.build_id || b.id) === String(bId));
                        if (bObj) setHuBuildingName(bObj.building_name);
                        setHuFloorLevel("");
                      }}
                    >
                      <option value="">Select Building / Area</option>
                      {buildingsList.map((b) => (
                        <option key={b.build_id || b.id} value={b.build_id || b.id}>
                          {b.building_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Floor / Level</label>
                    <select
                      className="mod-form-select"
                      value={huFloorLevel}
                      onChange={(e) => setHuFloorLevel(e.target.value)}
                      disabled={!huBuildingId && floorsList.length === 0}
                    >
                      <option value="">Select Floor / Level</option>
                      {floorsList
                        .filter(f => !huBuildingId || String(f.build_id || f.buildingId) === String(huBuildingId))
                        .map(f => (
                          <option key={f.floor_id || f.id} value={f.floor_name || f.name}>
                            {f.floor_name || f.name}
                          </option>
                        ))}
                      {huFloorLevel && !floorsList.some(f => (f.floor_name || f.name) === huFloorLevel) && (
                        <option value={huFloorLevel}>{huFloorLevel}</option>
                      )}
                    </select>
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Specific Location / Grid / Room</label>
                    <input type="text" className="mod-form-input" placeholder="e.g. Room 102, Grid B-4" value={huSpecificLocation} onChange={(e) => setHuSpecificLocation(e.target.value)} />
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Contractor(s) Involved *</label>
                    <select className="mod-form-select" value={huContractor} onChange={(e) => setHuContractor(e.target.value)}>
                      <option value="">Select Contractor</option>
                      {contractorsList.map((c) => (
                        <option key={c.subcontractor_id || c.id || c.name} value={c.subcontractor_name || c.name}>
                          {c.subcontractor_name || c.name}
                        </option>
                      ))}
                      {huContractor && !contractorsList.some(c => (c.subcontractor_name || c.name) === huContractor) && (
                        <option value={huContractor}>{huContractor}</option>
                      )}
                    </select>
                  </div>
                </div>

                <hr style={{ margin: "24px 0", borderColor: "var(--border-color)", borderStyle: "dashed" }} />

                {/* 2. Incident Records */}
                <div className="form-section-title" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "16px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", fontSize: "12px", fontWeight: 700 }}>2</span>
                  Incident Records & Classification
                </div>
                <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Incident Category *</label>
                    <select className="mod-form-select" value={huCategories[0] || ""} onChange={(e) => handleHuCategoryToggle(e.target.value)}>
                      <option value="">Select Category</option>
                      {incidentCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Actual Severity Assessment *</label>
                    <select className="mod-form-select" value={huActualSeverity} onChange={(e) => setHuActualSeverity(e.target.value)}>
                      <option value="">Select Actual Severity</option>
                      {severityOptions.map(s => (
                        <option key={s.level} value={s.level}>{s.label} ({s.desc})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Potential Severity Assessment *</label>
                    <select className="mod-form-select" value={huPotentialSeverity} onChange={(e) => setHuPotentialSeverity(e.target.value)}>
                      <option value="">Select Potential Severity</option>
                      {severityOptions.map(s => (
                        <option key={s.level} value={s.level}>{s.label} ({s.desc})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {(Number(huActualSeverity) >= 4 || Number(huPotentialSeverity) >= 4) && (
                  <div style={{ marginTop: "12px", padding: "10px 14px", background: "rgba(227, 43, 80, 0.1)", border: "1px solid rgba(227, 43, 80, 0.3)", borderRadius: "6px", color: "#E32B50", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    High Potential (HiPo) Incident ΓÇö Level 3 / Escalated Investigation Protocol Applies.
                  </div>
                )}

                <hr style={{ margin: "24px 0", borderColor: "var(--border-color)", borderStyle: "dashed" }} />

                {/* 3. Incident Description */}
                <div className="form-section-title" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "16px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", fontSize: "12px", fontWeight: 700 }}>3</span>
                  Incident Description & Consequences
                </div>
                <div className="mod-form-group">
                  <label className="mod-form-label">Brief Description: What Happened? *</label>
                  <textarea className="mod-form-textarea" rows="3" placeholder="Provide a concise and objective description of the event..." value={huDescription} onChange={(e) => setHuDescription(e.target.value)}></textarea>
                </div>
                <div className="mod-form-group" style={{ marginTop: "16px" }}>
                  <label className="mod-form-label">What is the consequence of this incident?</label>
                  <textarea className="mod-form-textarea" rows="2" placeholder="e.g. Temporary work stoppage, minor abrasion treated with first aid, no structural damage..." value={huConsequence} onChange={(e) => setHuConsequence(e.target.value)}></textarea>
                </div>

                {/* 4. Environmental Incident Details if applicable */}
                {huCategories.some(c => c && c.toLowerCase().includes("environment")) && (
                  <>
                    <hr style={{ margin: "24px 0", borderColor: "var(--border-color)", borderStyle: "dashed" }} />
                    <div className="form-section-title" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "16px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "rgba(45, 158, 90, 0.15)", color: "#2D9E5A", fontSize: "12px", fontWeight: 700 }}>4</span>
                      Environmental Incident Details
                    </div>
                    <div className="mod-form-group" style={{ marginBottom: "16px" }}>
                      <label className="mod-form-label">Type of Spillage</label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px", marginTop: "6px" }}>
                        {[
                          "Chemical / hazardous material",
                          "Fuel / Oil / Diesel / Hydraulic",
                          "Paints / solvents",
                          "Concrete / slurry / silt / muddy water",
                          "Sewage / blackwater",
                          "Other"
                        ].map(opt => (
                          <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                            <input type="checkbox" checked={huEnvSpillType.includes(opt)} onChange={() => handleHuEnvToggle("envSpillType", opt)} />
                            {opt}
                          </label>
                        ))}
                      </div>
                      {huEnvSpillType.includes("Other") && (
                        <input type="text" className="mod-form-input" style={{ marginTop: "8px" }} placeholder="Specify other spill type..." value={huEnvSpillOther} onChange={(e) => setHuEnvSpillOther(e.target.value)} />
                      )}
                    </div>
                    <div className="grid-2">
                      <div className="mod-form-group">
                        <label className="mod-form-label">What has been spilled?</label>
                        <input type="text" className="mod-form-input" placeholder="e.g. Hydraulic oil ISO 46" value={huEnvSpilledWhat} onChange={(e) => setHuEnvSpilledWhat(e.target.value)} />
                      </div>
                      <div className="mod-form-group">
                        <label className="mod-form-label">Cause of spillage</label>
                        <input type="text" className="mod-form-input" placeholder="e.g. Ruptured hose on excavator" value={huEnvCause} onChange={(e) => setHuEnvCause(e.target.value)} />
                      </div>
                      <div className="mod-form-group">
                        <label className="mod-form-label">Approx quantity of spillage</label>
                        <input type="text" className="mod-form-input" placeholder="e.g. ~15 Litres" value={huEnvQuantity} onChange={(e) => setHuEnvQuantity(e.target.value)} />
                      </div>
                    </div>
                    <div className="mod-form-group" style={{ marginTop: "16px" }}>
                      <label className="mod-form-label">Where the spillage entered?</label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px", marginTop: "6px" }}>
                        {[
                          "Ground / soil",
                          "Watercourse / storm drain / surface water",
                          "Foul sewer",
                          "Hardstanding / containment / drip tray / bund",
                          "Atmosphere (vapour/gas)",
                          "Other"
                        ].map(opt => (
                          <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                            <input type="checkbox" checked={huEnvSpecify.includes(opt)} onChange={() => handleHuEnvToggle("envSpecify", opt)} />
                            {opt}
                          </label>
                        ))}
                      </div>
                      {huEnvSpecify.includes("Other") && (
                        <input type="text" className="mod-form-input" style={{ marginTop: "8px" }} placeholder="Specify other media/location entered..." value={huEnvSpecifyOther} onChange={(e) => setHuEnvSpecifyOther(e.target.value)} />
                      )}
                    </div>
                  </>
                )}

                <hr style={{ margin: "24px 0", borderColor: "var(--border-color)", borderStyle: "dashed" }} />

                {/* 5. Immediate Actions Taken */}
                <div className="form-section-title" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "16px", color: "var(--text-main)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", fontSize: "12px", fontWeight: 700 }}>5</span>
                    Immediate Actions Taken
                  </span>
                  <button type="button" className="mod-btn-outline" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={addHuAction}>
                    + Add Action
                  </button>
                </div>
                {huImmActions.length === 0 ? (
                  <div style={{ padding: "12px", background: "var(--bg-dark, #f8fafc)", borderRadius: "6px", fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center" }}>
                    No immediate actions added yet. Click "+ Add Action" to record immediate corrective measures.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {huImmActions.map((act, idx) => (
                      <div key={idx} style={{ padding: "12px", background: "var(--bg-dark, #f8fafc)", border: "1px solid var(--border-color)", borderRadius: "6px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "10px", alignItems: "center" }}>
                        <div>
                          <label className="mod-form-label" style={{ fontSize: "11px" }}>Action Description</label>
                          <input type="text" className="mod-form-input" placeholder="What action was taken?" value={act.action} onChange={(e) => updateHuAction(idx, "action", e.target.value)} />
                        </div>
                        <div>
                          <label className="mod-form-label" style={{ fontSize: "11px" }}>Responsible</label>
                          <input type="text" className="mod-form-input" placeholder="Person / Team" value={act.responsible} onChange={(e) => updateHuAction(idx, "responsible", e.target.value)} />
                        </div>
                        <div>
                          <label className="mod-form-label" style={{ fontSize: "11px" }}>Date</label>
                          <input type="date" className="mod-form-input" value={act.date || huDate} onChange={(e) => updateHuAction(idx, "date", e.target.value)} />
                        </div>
                        <div>
                          <label className="mod-form-label" style={{ fontSize: "11px" }}>Time</label>
                          <input
                            type="text"
                            className="mod-form-input"
                            placeholder="HH:MM"
                            value={act.time}
                            readOnly
                            onClick={() => {
                              setTempHuActionTime(act.time || "12:00");
                              setShowHuActionTimePicker(idx);
                            }}
                            style={{ cursor: "pointer", background: "var(--input-bg, #fff)" }}
                          />
                        </div>
                        <div style={{ paddingTop: "18px" }}>
                          <button type="button" className="mod-btn-outline" style={{ padding: "6px 8px", color: "var(--color-risk)", borderColor: "rgba(227, 43, 80, 0.3)" }} onClick={() => removeHuAction(idx)} title="Remove action">
                            Γ£ò
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: "16px", padding: "14px", background: "var(--bg-dark, #f8fafc)", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <label className="mod-form-label" style={{ fontWeight: 600, marginBottom: "8px" }}>Has the Gatekeeper been informed?</label>
                  <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                      <input type="radio" name="huGatekeeperInformed" checked={huGatekeeperInformed === true} onChange={() => setHuGatekeeperInformed(true)} />
                      Yes
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                      <input type="radio" name="huGatekeeperInformed" checked={huGatekeeperInformed === false} onChange={() => setHuGatekeeperInformed(false)} />
                      No
                    </label>
                  </div>
                  {huGatekeeperInformed && (
                    <div style={{ marginTop: "10px" }}>
                      <label className="mod-form-label" style={{ fontSize: "12px" }}>Gatekeeper Contact Person Name</label>
                      <input type="text" className="mod-form-input" placeholder="Type contact person name..." value={huGatekeeperName} onChange={(e) => setHuGatekeeperName(e.target.value)} />
                    </div>
                  )}
                </div>

                <hr style={{ margin: "24px 0", borderColor: "var(--border-color)", borderStyle: "dashed" }} />

                {/* 6. Submitter & Revision Signatures */}
                <div className="form-section-title" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "16px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", fontSize: "12px", fontWeight: 700 }}>6</span>
                  Editor Details & Revision Sign-Off
                </div>
                <div className="grid-2">
                  <div className="mod-form-group">
                    <label className="mod-form-label">Editor Name *</label>
                    <input type="text" className="mod-form-input" value={huEditorName} onChange={(e) => setHuEditorName(e.target.value)} placeholder="Full Name" />
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Editor Role</label>
                    <input type="text" className="mod-form-input" value={huEditorRole} onChange={(e) => setHuEditorRole(e.target.value)} placeholder="e.g. HSE Manager / Editor" />
                  </div>
                </div>
                <div className="mod-form-group" style={{ marginTop: "14px" }}>
                  <label className="mod-form-label">Reason for Revision / Change Summary *</label>
                  <textarea className="mod-form-textarea" rows="2" placeholder="Describe the corrections or updates made to this Heads-Up report..." value={huEditReason} onChange={(e) => setHuEditReason(e.target.value)}></textarea>
                </div>
                <div className="mod-form-group" style={{ marginTop: "14px" }}>
                  <label className="mod-form-label">Editor Digital Signature</label>
                  <SignaturePad value={huEditorSignature} onChange={setHuEditorSignature} onClear={() => setHuEditorSignature(false)} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  <button type="button" className="mod-btn-outline" onClick={() => setIsEditingHeadsUp(false)}>
                    Cancel
                  </button>
                  <button type="button" className="mod-btn-primary im-btn-primary" onClick={handleSaveHeadsUp}>
                    Update Heads-Up Notification
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================= READ-ONLY FULL VIEW MODE ================= */
            <div className="mod-card mb-4">
              <div className="mod-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="mod-card-title">Step 1: Heads-Up Notification (2hr)</span>
                  {headsUpApproved ? (
                    <span className="inv-chip chip-approved">Reviewed & Approved</span>
                  ) : (
                    <span className="inv-chip chip-inprogress">Pending NNE Review</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {!headsUpApproved && (
                    <button
                      type="button"
                      className="mod-btn-outline"
                      style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent-primary, #3b82f6)", borderColor: "var(--accent-primary, #3b82f6)" }}
                      onClick={() => setIsEditingHeadsUp(true)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edit Heads-Up Form
                    </button>
                  )}
                  {headsUpApproved && (
                    <>
                      <button
                        type="button"
                        className="mod-btn-outline"
                        style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-main)", borderColor: "var(--border-color)" }}
                        onClick={() => {
                          setPdfTargetForm("headsUp");
                          setShowPdfExport(true);
                        }}
                        title="View full clean Heads-Up form in modal"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View in Modal
                      </button>
                      <button
                        type="button"
                        className="mod-btn-primary"
                        style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
                        onClick={() => handleExportSingleForm("headsUp", "Heads-Up Notification")}
                        disabled={downloadingForm === "headsUp"}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        {downloadingForm === "headsUp" ? "Downloading..." : "Download Form 1 PDF"}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="mod-card-body" style={{ padding: "24px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
                  Submitted by <b>{huSubmitterName || incident.reportedBy || incident.gatekeeperName || "User"}</b> on <b>{huSubmittedTime ? huSubmittedTime.split("T")[0] : (incident.createdTime ? incident.createdTime.split("T")[0] : incident.incidentDate || "ΓÇö")}</b>
                </div>

                {/* 1. Location & Identification / Project Details */}
                <div className="form-section-title" style={{ fontWeight: 700, fontSize: "14px", marginBottom: "14px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", fontSize: "11px", fontWeight: 700 }}>1</span>
                  Project Details & Location
                </div>
                <div className="grid-2" style={{ rowGap: "14px" }}>
                  <div className="mod-form-group"><label className="mod-form-label">Project Name</label><div className="readonly-box">{huProject || incident.projectName || "M3 South"}</div></div>
                  <div className="mod-form-group"><label className="mod-form-label">Incident Title</label><div className="readonly-box">{huTitle || incident.title || "ΓÇö"}</div></div>
                  <div className="mod-form-group"><label className="mod-form-label">Date / Time</label><div className="readonly-box">{huDate || incident.incidentDate || "ΓÇö"} {huTime || incident.incidentTime || ""}</div></div>
                  <div className="mod-form-group"><label className="mod-form-label">Location / Building</label><div className="readonly-box">{huBuildingName || incident.buildingName || incident.building || "ΓÇö"}</div></div>
                  <div className="mod-form-group"><label className="mod-form-label">Floor / Level</label><div className="readonly-box">{huFloorLevel || incident.floorLevel || "ΓÇö"}</div></div>
                  <div className="mod-form-group"><label className="mod-form-label">Specific Location</label><div className="readonly-box">{huSpecificLocation || incident.specificLocation || "ΓÇö"}</div></div>
                  <div className="mod-form-group"><label className="mod-form-label">Contractor(s) Involved</label><div className="readonly-box">{huContractor || incident.contractorsInvolved || "ΓÇö"}</div></div>
                </div>

                <hr style={{ margin: "20px 0", borderColor: "var(--border-color)", borderStyle: "dashed" }} />

                {/* 2. Incident Records */}
                <div className="form-section-title" style={{ fontWeight: 700, fontSize: "14px", marginBottom: "14px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", fontSize: "11px", fontWeight: 700 }}>2</span>
                  Incident Records & Severity
                </div>
                <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Category</label>
                    <div className="readonly-box">
                      <span className="badge" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", fontWeight: 700 }}>
                        {huCategories[0] || incident.categories?.[0] || incident.category || "ΓÇö"}
                      </span>
                    </div>
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Actual Severity</label>
                    <div className="readonly-box" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {(() => {
                        const level = huActualSeverity || incident.actualSeverity || incident.severity;
                        if (!level) return <span style={{ color: "var(--text-muted)" }}>ΓÇö</span>;
                        const meta = {
                          1: { label: "Insignificant", color: "#2D9E5A" },
                          2: { label: "Minor", color: "#C07D10" },
                          3: { label: "Moderate", color: "#D97706" },
                          4: { label: "Critical", color: "#E32B50" },
                          5: { label: "Catastrophic", color: "#8F1B32" }
                        };
                        const m = meta[level] || { label: "", color: "#A1A5B3" };
                        return (
                          <span className="badge" style={{ background: `${m.color}22`, color: m.color, fontWeight: 700 }}>
                            {level} - {m.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Potential Severity</label>
                    <div className="readonly-box" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {(() => {
                        const level = huPotentialSeverity || incident.potentialSeverity;
                        if (!level) return <span style={{ color: "var(--text-muted)" }}>ΓÇö</span>;
                        const meta = {
                          1: { label: "Insignificant", color: "#2D9E5A" },
                          2: { label: "Minor", color: "#C07D10" },
                          3: { label: "Moderate", color: "#D97706" },
                          4: { label: "Critical", color: "#E32B50" },
                          5: { label: "Catastrophic", color: "#8F1B32" }
                        };
                        const m = meta[level] || { label: "", color: "#A1A5B3" };
                        return (
                          <span className="badge" style={{ background: `${m.color}22`, color: m.color, fontWeight: 700 }}>
                            {level} - {m.label}
                          </span>
                        );
                      })()}
                      {(incident.isHipo || Number(huActualSeverity) >= 4 || Number(huPotentialSeverity) >= 4) && (
                        <span className="badge" style={{ background: "var(--color-risk)", color: "#fff" }}>HiPo</span>
                      )}
                    </div>
                  </div>
                </div>

                <hr style={{ margin: "20px 0", borderColor: "var(--border-color)", borderStyle: "dashed" }} />

                {/* 3. Description */}
                <div className="form-section-title" style={{ fontWeight: 700, fontSize: "14px", marginBottom: "14px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", fontSize: "11px", fontWeight: 700 }}>3</span>
                  Incident Description & Consequences
                </div>
                <div className="mod-form-group">
                  <label className="mod-form-label">What Happened?</label>
                  <div className="readonly-box" style={{ minHeight: "60px", whiteSpace: "pre-wrap" }}>
                    {huDescription || headsUpData?.descriptionWhatHappened || headsUpData?.whatHappened || incident.description || "ΓÇö"}
                  </div>
                </div>
                <div className="mod-form-group" style={{ marginTop: "14px" }}>
                  <label className="mod-form-label">Consequence</label>
                  <div className="readonly-box" style={{ minHeight: "45px", whiteSpace: "pre-wrap" }}>
                    {huConsequence || headsUpData?.descriptionConsequence || "ΓÇö"}
                  </div>
                </div>

                {/* 4. Environmental Details if applicable */}
                {(huCategories.some(c => c && c.toLowerCase().includes("environment")) || headsUpData?.isEnvironmental) && (
                  <>
                    <hr style={{ margin: "20px 0", borderColor: "var(--border-color)", borderStyle: "dashed" }} />
                    <div className="form-section-title" style={{ fontWeight: 700, fontSize: "14px", marginBottom: "14px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: "rgba(45, 158, 90, 0.15)", color: "#2D9E5A", fontSize: "11px", fontWeight: 700 }}>4</span>
                      Environmental Incident Details
                    </div>
                    <div className="grid-2" style={{ rowGap: "14px" }}>
                      <div className="mod-form-group"><label className="mod-form-label">Type of Spillage</label><div className="readonly-box">{Array.isArray(huEnvSpillType) ? huEnvSpillType.join(", ") : (huEnvSpillType || headsUpData?.spillType || "ΓÇö")}</div></div>
                      <div className="mod-form-group"><label className="mod-form-label">Substance Spilled</label><div className="readonly-box">{huEnvSpilledWhat || headsUpData?.spillSubstance || "ΓÇö"}</div></div>
                      <div className="mod-form-group"><label className="mod-form-label">Cause of Spillage</label><div className="readonly-box">{huEnvCause || headsUpData?.spillCause || "ΓÇö"}</div></div>
                      <div className="mod-form-group"><label className="mod-form-label">Approx Quantity</label><div className="readonly-box">{huEnvQuantity || headsUpData?.spillQuantity || "ΓÇö"}</div></div>
                      <div className="mod-form-group" style={{ gridColumn: "span 2" }}><label className="mod-form-label">System / Media Entered</label><div className="readonly-box">{Array.isArray(huEnvSpecify) ? huEnvSpecify.join(", ") : (huEnvSpecify || headsUpData?.spillSystemEntered || "ΓÇö")}</div></div>
                    </div>
                  </>
                )}

                <hr style={{ margin: "20px 0", borderColor: "var(--border-color)", borderStyle: "dashed" }} />

                {/* 5. Immediate Actions Taken */}
                <div className="form-section-title" style={{ fontWeight: 700, fontSize: "14px", marginBottom: "14px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", fontSize: "11px", fontWeight: 700 }}>5</span>
                  Immediate Actions Taken & Gatekeeper Info
                </div>
                {huImmActions && huImmActions.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "14px" }}>
                    <thead>
                      <tr style={{ background: "var(--bg-dark, #f8fafc)", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                        <th style={{ padding: "8px 12px", width: "40px" }}>#</th>
                        <th style={{ padding: "8px 12px" }}>Action Description</th>
                        <th style={{ padding: "8px 12px" }}>Responsible</th>
                        <th style={{ padding: "8px 12px" }}>Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {huImmActions.map((act, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "8px 12px", fontWeight: 700 }}>{idx + 1}</td>
                          <td style={{ padding: "8px 12px" }}>{act.action || act.description || "ΓÇö"}</td>
                          <td style={{ padding: "8px 12px" }}>{act.responsible || act.assignedTo || "ΓÇö"}</td>
                          <td style={{ padding: "8px 12px" }}>{act.date || act.targetDate || "ΓÇö"} {act.time || act.timeImplemented || ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: "10px", background: "var(--bg-dark, #f8fafc)", borderRadius: "6px", fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "14px" }}>
                    No immediate actions recorded.
                  </div>
                )}
                <div className="grid-2">
                  <div className="mod-form-group"><label className="mod-form-label">Gatekeeper Informed?</label><div className="readonly-box">{huGatekeeperInformed ? "Yes" : "No"}</div></div>
                  {huGatekeeperInformed && (
                    <div className="mod-form-group"><label className="mod-form-label">Gatekeeper Contact Person</label><div className="readonly-box">{huGatekeeperName || "ΓÇö"}</div></div>
                  )}
                </div>

                <hr style={{ margin: "20px 0", borderColor: "var(--border-color)", borderStyle: "dashed" }} />

                {/* 6. Submitter & Signatures */}
                <div className="form-section-title" style={{ fontWeight: 700, fontSize: "14px", marginBottom: "14px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", fontSize: "11px", fontWeight: 700 }}>6</span>
                  Submitter Information & Signature
                </div>
                <div className="grid-2">
                  <div className="mod-form-group"><label className="mod-form-label">Submitted By</label><div className="readonly-box">{huSubmitterName || incident.reportedBy || "User"}</div></div>
                  <div className="mod-form-group"><label className="mod-form-label">Digital Signature</label>
                    <div className="readonly-box" style={{ display: "flex", alignItems: "center", minHeight: "45px" }}>
                      {huSignature ? (
                        typeof huSignature === "string" && (huSignature.startsWith("http") || huSignature.startsWith("data:") || huSignature.startsWith("/")) ? (
                          <img src={getAttachmentUrl(huSignature)} alt="Submitter Signature" style={{ maxHeight: "35px", maxWidth: "150px" }} />
                        ) : (
                          <span style={{ fontStyle: "italic", fontFamily: "cursive", color: "var(--accent-primary, #3b82f6)" }}>Γ£ô Signed Digitally ({huSubmitterName})</span>
                        )
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>ΓÇö</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Time Picker Modal for huTime */}
          {showHuTimePicker && (
            <AnalogTimePicker
              initialTime={tempHuTime}
              onSave={(newT) => {
                setHuTime(newT);
                setShowHuTimePicker(false);
              }}
              onClose={() => setShowHuTimePicker(false)}
            />
          )}

          {/* Time Picker Modal for Immediate Actions */}
          {showHuActionTimePicker !== null && (
            <AnalogTimePicker
              initialTime={tempHuActionTime}
              onSave={(newT) => {
                updateHuAction(showHuActionTimePicker, "time", newT);
                setShowHuActionTimePicker(null);
              }}
              onClose={() => setShowHuActionTimePicker(null)}
            />
          )}

          {/* Review Section */}
          {huAudit.length > 0 && (
            <div className="mod-card mb-4" style={{ marginTop: 24 }}>
              <div className="mod-card-header">
                <span className="mod-card-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", color: "var(--text-main)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
                  </svg>
                  Audit Trail & Sign-Off Log
                </span>
              </div>
              <div className="mod-card-body" style={{ padding: "24px 16px" }}>
                <div style={{ position: "relative", paddingLeft: 16 }}>
                  <div style={{ position: "relative", paddingLeft: 16 }}>
                    {huAudit.map((step, i) => renderAuditCard(step, i, huAudit.length))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Direct Close Section if Heads-Up is Approved and No Further Investigation Required */}
          {headsUpApproved && (huNoFurtherInvestigation || incident.noFurtherInvestigation) && !isClosed && !isContractorUser() && (
            <div className="mod-card mb-4" style={{ marginTop: 24, borderTop: "3px solid #10b981", background: "rgba(16, 185, 129, 0.04)" }}>
              <div className="mod-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <span className="mod-card-title" style={{ color: "#059669", display: "flex", alignItems: "center", gap: 8, fontSize: 16 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    No Further Investigation Required
                  </span>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                    Heads-Up Notification is approved with no further investigation required. This incident can now be officially closed.
                  </div>
                </div>
                <button
                  className="mod-btn-primary im-btn-primary"
                  style={{ background: "var(--color-risk, #dc2626)", padding: "8px 20px", fontSize: "13px", fontWeight: 700 }}
                  onClick={async () => {
                    try {
                      const userName = getLoggedInUser() || "Site HSE Admin";
                      await closeIncident(id, { closedBy: userName });
                      showSuccess("Incident Closed Successfully!");
                      const data = await getIncidentById(id);
                      setRawIncident(data?.data || data);
                    } catch (err) {
                      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to close incident";
                      showError(Array.isArray(msg) ? msg[0] : msg);
                    }
                  }}
                >
                  Close Incident
                </button>
              </div>
            </div>
          )}

          {!headsUpApproved && !isContractorUser() && (
            <div className="mod-card mb-4">
              <div className="mod-card-header"><span className="mod-card-title">Review: Heads-Up Notification {incident.id}</span></div>
              <div className="mod-card-body">
                <div className="mod-form-group">
                  <label className="mod-form-label">Review Comments / Revision Reason</label>
                  <textarea
                    className="mod-form-textarea"
                    placeholder="Add review comments or specify reasons for revision..."
                    rows="3"
                    value={huReviewComments}
                    onChange={(e) => setHuReviewComments(e.target.value)}
                  />
                </div>
                <div className="mod-form-group" style={{ marginTop: 16 }}>
                  <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Reviewer Name</label>
                  <input type="text" className="mod-form-input" placeholder="Type your full name" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} />
                </div>
                <div className="mod-form-group" style={{ marginTop: 16 }}>
                  <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Approver Role</label>
                  <input type="text" className="mod-form-input" placeholder="e.g. NNE Peer Reviewer" value={reviewerRole} onChange={(e) => setReviewerRole(e.target.value)} />
                </div>
                <div className="mod-form-group" style={{ marginTop: 16 }}>
                  <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Digital Signature</label>
                  <SignaturePad value={signature} onChange={setSignature} onClear={() => setSignature(false)} />
                </div>
                <div className="markok" onClick={() => setMarkedOk(!markedOk)} style={{ borderColor: markedOk ? "var(--color-safe)" : "var(--border-color)", opacity: markedOk ? 1 : 0.7 }}>
                  <input type="checkbox" checked={markedOk} onChange={() => { }} />
                  <div>
                    <div className="mk-t">Marked OK</div>
                    <div className="mk-s">I have reviewed this report and confirm it is complete and accurate.</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                  <button
                    type="button"
                    className="mod-btn-outline"
                    style={{ color: "var(--color-risk)", borderColor: "var(--color-risk-bg)" }}
                    disabled={isReturningRevision}
                    onClick={() => handleReturnForRevision("HEADS_UP")}
                  >
                    {isReturningRevision ? "Returning..." : "Return for Revision"}
                  </button>
                  <button className="mod-btn-primary im-btn-primary" disabled={!markedOk || !signature || !reviewerName} onClick={async () => {
                    try {
                      const userName = reviewerName || getLoggedInUser();
                      await approveHeadsUp(id, {
                        approvedBy: userName,
                        approverRole: reviewerRole || "NNE Peer Reviewer",
                        signature: signature
                      });
                      showSuccess("Heads-Up Notification Approved!");
                      setHeadsUpApproved(true);
                      if (huNoFurtherInvestigation || incident.noFurtherInvestigation) {
                        setActiveTab("headsUp");
                      } else {
                        setActiveTab("initialReport");
                      }
                      // Refresh incident
                      const data = await getIncidentById(id);
                      setRawIncident(data?.data || data);
                    } catch (err) {
                      console.error("Failed to approve Heads Up", err);
                      const msg = err.response?.data?.message || err.message || "Failed to approve Heads Up";
                      showError(Array.isArray(msg) ? msg[0] : msg);
                    }
                  }}>Approve & Sign Off</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`inc-tab-panel ${activeTab === "initialReport" ? "active" : ""}`}>
          {(huNoFurtherInvestigation || (incident.noFurtherInvestigation && !initialReportSubmitted && !initialReportData?.submittedBy)) ? (
            <div className="mod-card">
              <div className="mod-card-body" style={{ padding: "40px 24px", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, border: "2px solid #a7f3d0" }}>
                  Γ£ô
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#065f46", margin: "0 0 8px 0" }}>Stage 2 Initial Incident Report Waived</h3>
                <p style={{ color: "#047857", fontSize: "14px", maxWidth: "600px", margin: "0 auto 24px", lineHeight: "1.5" }}>
                  This incident was marked as <strong>"No further investigation required"</strong> at the Heads-Up Notification stage. No 24-hour Initial Incident Report or Stage 3 Investigation is required for this incident.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    className="mod-btn-outline"
                    style={{ padding: "8px 20px", fontSize: "13px", fontWeight: 600 }}
                    onClick={() => setActiveTab("headsUp")}
                  >
                    ΓåÉ View Filled Heads-Up Form
                  </button>
                  {headsUpApproved && !isClosed && (
                    <button
                      className="mod-btn-primary im-btn-primary"
                      style={{ background: "var(--color-risk, #dc2626)", padding: "8px 20px", fontSize: "13px", fontWeight: 700 }}
                      onClick={async () => {
                        try {
                          const userName = getLoggedInUser() || "Site HSE Admin";
                          await closeIncident(id, { closedBy: userName });
                          showSuccess("Incident Closed Successfully!");
                          const updated = await getIncidentById(id);
                          setRawIncident(updated?.data || updated);
                        } catch (err) {
                          const msg = err.response?.data?.message || err.message || "Failed to close incident";
                          showError(Array.isArray(msg) ? msg[0] : msg);
                        }
                      }}
                    >
                      Close Incident
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : !headsUpApproved && !isClosed ? (
            <div className="mod-card"><div className="mod-card-body"><div className="locked-state">
              <div className="locked-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="locked-title">Initial Incident Report (24hr) Pending</div>
              <div className="locked-text">The 24-hour Initial Incident Report is due by <b>{stages.initialReport.dueLabel}</b>. This report captures injured person details, incident categories, severity assessment, photos, injury information, accident types, body parts and immediate actions.</div>
              <div style={{ marginTop: 24, fontSize: "13px", color: "var(--color-caution)" }}>
                ΓÜá∩╕Å Heads-Up Notification must be reviewed and approved before starting the Initial Report.
              </div>
            </div></div></div>
          ) : (
            <div className="mod-card">
              <div className="mod-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="mod-card-title">Initial Incident Report (24hr)</span>
                  {initialReportApproved ? (
                    <span className="inv-chip chip-done">Completed</span>
                  ) : (isEditingInitialReport && initialReportSubmitted) ? (
                    <span className="inv-chip chip-inprogress">Editing</span>
                  ) : initialReportSubmitted ? (
                    <span className="inv-chip chip-current">In Review</span>
                  ) : (
                    <span className="inv-chip chip-upcoming">In Progress</span>
                  )}
                </div>
                {(initialReportApproved || initialReportSubmitted) && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="mod-btn-outline"
                      style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-main)", borderColor: "var(--border-color)" }}
                      onClick={() => {
                        setPdfTargetForm("initialReport");
                        setShowPdfExport(true);
                      }}
                      title="View full clean Initial Report in modal"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      View in Modal
                    </button>
                    {!isClosed && !initialReportApproved && !isEditingInitialReport && initialReportSubmitted && (
                      <button
                        type="button"
                        className="mod-btn-outline"
                        style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent-primary, #3b82f6)", borderColor: "var(--accent-primary, #3b82f6)" }}
                        onClick={() => setIsEditingInitialReport(true)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit Report Form
                      </button>
                    )}
                    {isEditingInitialReport && initialReportSubmitted && (
                      <button
                        type="button"
                        className="mod-btn-outline"
                        style={{ padding: "6px 12px", fontSize: "12px", fontWeight: 600 }}
                        onClick={() => setIsEditingInitialReport(false)}
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className="mod-btn-primary"
                      style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
                      onClick={() => handleExportSingleForm("initialReport", "Initial Incident Report")}
                      disabled={downloadingForm === "initialReport"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      {downloadingForm === "initialReport" ? "Downloading..." : "Download Form 2 PDF"}
                    </button>
                  </div>
                )}
              </div>
              <div className="mod-card-body">
                <fieldset disabled={!isEditingInitialReport && initialReportSubmitted} style={{ border: "none", padding: 0, margin: 0, opacity: (!isEditingInitialReport && initialReportSubmitted) ? 0.95 : 1 }}>
                {/* A. Heads-Up Summary */}
                <div className="fsec"><div className="fsec-title">A. Heads-Up Summary</div>
                  <div className="readonly-box">
                    <div><b>Type:</b> {incident.categories?.[0] || incident.category || "ΓÇö"}</div>
                    <div><b>Severity:</b> {incident.actualSeverity || incident.severity || "ΓÇö"}</div>
                    <div><b>Location:</b> {incident.buildingName ? `${incident.buildingName}${incident.floorLevel ? ' - ' + incident.floorLevel : ''}` : (incident.building || incident.location || "ΓÇö")}</div>
                    <div><b>Description:</b> {headsUpData?.descriptionWhatHappened || headsUpData?.whatHappened || headsUpData?.descriptionConsequence || incident.description || incident.details || "ΓÇö"}</div>
                  </div>
                </div>

                {/* B. Incident Category */}
                <div className="fsec"><div className="fsec-title">B. Incident Category</div>
                  <div className="fsec-note">Select all that apply. The categorisation may change following the incident investigation.</div>
                  <div className="chk-grid-2">
                    {INCIDENT_CATEGORIES.map(cat => {
                      const isChecked = (() => {
                        if (irCategories.includes(cat)) return true;
                        const normCat = cat.toLowerCase().replace(/[^a-z0-9]/g, "");
                        const allCandidateCategories = [
                          ...(Array.isArray(irCategories) ? irCategories : []),
                          ...(Array.isArray(incident?.categories) ? incident.categories : []),
                          ...(Array.isArray(headsUpData?.categories) ? headsUpData.categories : []),
                          ...(Array.isArray(initialReportData?.categories) ? initialReportData.categories : []),
                          ...(Array.isArray(initialReportData?.treatmentProvided) ? initialReportData.treatmentProvided : []),
                          incident?.category || "",
                          headsUpData?.category || "",
                          initialReportData?.medicalTreatmentClass || "",
                          initialReportData?.treatmentPrescribed || ""
                        ].filter(Boolean);

                        return allCandidateCategories.some(c => {
                          const norm = String(c).toLowerCase().replace(/[^a-z0-9]/g, "");
                          if (!norm) return false;
                          if (norm === normCat) return true;
                          if (normCat === "medicaltreatmentinjury" && (norm.includes("medicaltreatment") || norm === "medical")) return true;
                          if (normCat === "firstaidinjury" && (norm.includes("firstaid") || norm === "firstaidtreatment")) return true;
                          if (normCat === "restrictedworkinjury" && (norm.includes("restrictedwork") || norm === "rwi")) return true;
                          if (normCat === "losttimeinjury" && (norm.includes("losttime") || norm.includes("losstime") || norm === "lti")) return true;
                          if (normCat === "nearmiss" && norm.includes("nearmiss")) return true;
                          if (normCat === "propertydamage" && norm.includes("property")) return true;
                          if (normCat === "environmentalincident" && norm.includes("environ")) return true;
                          if (normCat === "personalinjury" && (norm.includes("personalinjury") || (norm.includes("injury") && !norm.includes("firstaid") && !norm.includes("medical") && !norm.includes("restricted") && !norm.includes("lost")))) return true;
                          return false;
                        });
                      })();

                      return (
                        <label className="chk" key={cat}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                if (!irCategories.includes(cat)) setIrCategories([...irCategories, cat]);
                              } else {
                                setIrCategories(irCategories.filter(c => c !== cat && c.toLowerCase().replace(/[^a-z0-9]/g, "") !== cat.toLowerCase().replace(/[^a-z0-9]/g, "")));
                              }
                            }}
                          />
                          <span>{cat}</span>
                        </label>
                      );
                    })}
                  </div>
                  {(() => {
                    const extraCats = [
                      ...(Array.isArray(incident?.categories) ? incident.categories : []),
                      ...(Array.isArray(headsUpData?.categories) ? headsUpData.categories : []),
                      ...(Array.isArray(irCategories) ? irCategories : [])
                    ].filter(c => c && !INCIDENT_CATEGORIES.some(std => {
                      const stdNorm = std.toLowerCase().replace(/[^a-z0-9]/g, "");
                      const cNorm = String(c).toLowerCase().replace(/[^a-z0-9]/g, "");
                      return stdNorm === cNorm || (stdNorm.includes("medical") && cNorm.includes("medical")) || (stdNorm.includes("firstaid") && cNorm.includes("firstaid")) || (stdNorm.includes("environ") && cNorm.includes("environ")) || (stdNorm.includes("property") && cNorm.includes("property"));
                    }));
                    
                    const uniqueExtra = [...new Set(extraCats)];
                    if (uniqueExtra.length === 0) return null;

                    return (
                      <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--bg-dark, #f8fafc)", borderRadius: 6, border: "1px solid var(--border-color, #e2e8f0)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Active Categories from Initial Notice:</span>
                        {uniqueExtra.map(c => (
                          <span key={c} style={{ background: "var(--accent-primary, #0f172a)", color: "#fff", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {(() => {
                  const allIncidentCats = [
                    ...(incident?.categories || []),
                    ...(headsUpData?.categories || []),
                    ...(irCategories || []),
                    incident?.category || ""
                  ].map(c => String(c).toLowerCase());

                  const isEnvIncident = allIncidentCats.some(c => c.includes("environment"));
                  const isPropDamageIncident = allIncidentCats.some(c => c.includes("property"));

                  if (isEnvIncident) {
                    return (
                      <div className="fsec">
                        <div className="fsec-title" style={{ color: "var(--color-caution)" }}>C. Environmental Incident Details</div>
                        <div style={{ background: "var(--color-caution-bg)", border: "1px solid rgba(217,119,6,0.3)", borderRadius: "8px", padding: "16px" }}>
                          <div className="mod-form-group" style={{ marginBottom: "16px" }}>
                            <label className="mod-form-label">Type of Spillage <span style={{ color: "#DC2626" }}>*</span></label>
                            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "8px" }}>
                              {["Oil and hydrocarbon spills", "Chemical Spill", "Paint Spill", "Other"].map(opt => (
                                <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                                  <input type="checkbox" checked={irEnvSpillType.includes(opt)} onChange={() => handleEnvToggle("irEnvSpillType", opt)} /> {opt}
                                </label>
                              ))}
                            </div>
                            {irEnvSpillType.includes("Other") && (
                              <input type="text" className="mod-form-input" placeholder="Specify other type of spillage..." value={irEnvSpillOther} onChange={e => setIrEnvSpillOther(e.target.value)} />
                            )}
                          </div>
                          <div className="mod-form-group full-width" style={{ marginBottom: "16px" }}>
                            <label className="mod-form-label">What has been spilled: <span style={{ color: "#DC2626" }}>*</span></label>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Include the chemical name from the SDS, if available at the time of reporting</div>
                            <textarea className="mod-form-textarea" value={irEnvSpillSubstance} onChange={e => setIrEnvSpillSubstance(e.target.value)} rows={2} placeholder="What was spilled?"></textarea>
                          </div>
                          <div className="grid-2" style={{ gap: "16px", marginBottom: "16px" }}>
                            <div className="mod-form-group">
                              <label className="mod-form-label">Cause of Spillage: <span style={{ color: "#DC2626" }}>*</span></label>
                              <input type="text" className="mod-form-input" value={irEnvSpillCause} onChange={e => setIrEnvSpillCause(e.target.value)} placeholder="Enter cause of spillage" />
                            </div>
                            <div className="mod-form-group">
                              <label className="mod-form-label">Approximate quantity of spillage (Liter /Kg): <span style={{ color: "#DC2626" }}>*</span></label>
                              <input type="text" className="mod-form-input" value={irEnvSpillQuantity} onChange={e => setIrEnvSpillQuantity(e.target.value)} placeholder="e.g. 50 Liters" />
                            </div>
                          </div>
                          <div className="mod-form-group" style={{ marginBottom: "16px" }}>
                            <label className="mod-form-label">Specify if the spillage enter the rainwater system, process wastewater system, soil, asphalt etc. <span style={{ color: "#DC2626" }}>*</span></label>
                            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "8px", marginBottom: "8px" }}>
                              {["Rainwater", "Process", "Soil", "Other"].map(opt => (
                                <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                                  <input type="checkbox" checked={irEnvSystemEntered.includes(opt)} onChange={() => handleEnvToggle("irEnvSystemEntered", opt)} /> {opt}
                                </label>
                              ))}
                            </div>
                            {irEnvSystemEntered.includes("Other") && (
                              <input type="text" className="mod-form-input" placeholder="Specify other entry location..." value={irEnvSystemOther} onChange={e => setIrEnvSystemOther(e.target.value)} style={{ marginTop: "8px" }} />
                            )}
                          </div>
                          <div className="mod-form-group">
                            <label className="mod-form-label">Containment & Cleanup Actions Taken</label>
                            <textarea className="mod-form-textarea" placeholder="Describe deployment of spill kits, absorbents, and disposal..." value={irEnvContainment} onChange={e => setIrEnvContainment(e.target.value)} rows={3}></textarea>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (isPropDamageIncident) {
                    return (
                      <div className="fsec">
                        <div className="fsec-title">C. Property Damage & Asset Details</div>
                        <div className="grid-2">
                          <div className="mod-form-group">
                            <label className="mod-form-label">Damaged Asset / Equipment / Structure</label>
                            <input className="mod-form-input" placeholder="e.g. Site boundary wall / Scaffolding" value={irPropDamaged} onChange={e => setIrPropDamaged(e.target.value)} />
                          </div>
                          <div className="mod-form-group">
                            <label className="mod-form-label">Plant / Vehicle Involved</label>
                            <input className="mod-form-input" placeholder="e.g. Forklift FL-04" value={irPropEquipmentInvolved} onChange={e => setIrPropEquipmentInvolved(e.target.value)} />
                          </div>
                          <div className="mod-form-group">
                            <label className="mod-form-label">Estimated Repair / Replacement Cost</label>
                            <input className="mod-form-input" placeholder="e.g. $5,000 / 35,000 DKK" value={irPropEstimatedCost} onChange={e => setIrPropEstimatedCost(e.target.value)} />
                          </div>
                        </div>
                        <div className="mod-form-group" style={{ marginTop: 12 }}>
                          <label className="mod-form-label">Description & Extent of Damage</label>
                          <textarea className="mod-form-textarea" placeholder="Describe the severity and damage sustained..." value={irPropDamageDesc} onChange={e => setIrPropDamageDesc(e.target.value)}></textarea>
                        </div>
                        <div className="mod-form-group" style={{ marginTop: 12 }}>
                          <label className="mod-form-label">Immediate Containment / Isolation Action Taken</label>
                          <textarea className="mod-form-textarea" placeholder="Describe lock-out, tag-out, or area isolation..." value={irPropImmediateAction} onChange={e => setIrPropImmediateAction(e.target.value)}></textarea>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="fsec"><div className="fsec-title">C. Injured / Ill Person Details</div>
                      <div className="grid-2">
                        <div className="mod-form-group"><label className="mod-form-label">Name of Injured / Ill Person</label><input className="mod-form-input" placeholder="Name..." value={irInjuredName} onChange={e => setIrInjuredName(e.target.value)} /></div>
                        <div className="mod-form-group"><label className="mod-form-label">Company</label><input className="mod-form-input" value={irInjuredCompany} onChange={e => setIrInjuredCompany(e.target.value)} /></div>
                        <div className="mod-form-group"><label className="mod-form-label">Manager / Supervisor</label><input className="mod-form-input" placeholder="Supervisor Name" value={irInjuredSupervisor} onChange={e => setIrInjuredSupervisor(e.target.value)} /></div>
                        <div className="mod-form-group"><label className="mod-form-label">Job Title</label><input className="mod-form-input" placeholder="e.g. Electrician" value={irInjuredJobTitle} onChange={e => setIrInjuredJobTitle(e.target.value)} /></div>
                        <div className="mod-form-group"><label className="mod-form-label">Length of Service</label><input className="mod-form-input" placeholder="e.g. 2 years" value={irLengthOfService} onChange={e => setIrLengthOfService(e.target.value)} /></div>
                        <div className="mod-form-group"><label className="mod-form-label">Years of Experience in Role</label><input className="mod-form-input" placeholder="e.g. 5 years" value={irExperienceInRole} onChange={e => setIrExperienceInRole(e.target.value)} /></div>
                      </div>
                      <div className="mod-form-group" style={{ marginTop: 8 }}><label className="mod-form-label">What was the worker doing at the time of the incident?</label><textarea className="mod-form-textarea" placeholder="Describe the task / activity being performed..." value={irWorkerActivity} onChange={e => setIrWorkerActivity(e.target.value)}></textarea></div>
                    </div>
                  );
                })()}

                {/* D. Severity Assessment */}
                <div className="fsec"><div className="fsec-title">D. Severity Assessment</div>
                  <div className="grid-2">
                    <div className="mod-form-group">
                      <label className="mod-form-label">Actual Severity Level & Rating</label>
                      <select id="select-actual-severity" className="mod-form-select" value={irActualSeverity} onChange={e => setIrActualSeverity(e.target.value)}>
                        <option value="">Use the severity table from Risk Matrix...</option>
                        {SEVERITY_RATINGS.map(s => <option key={s} value={s.split(" ")[0]}>{s}</option>)}
                      </select>
                      <div className="fsec-note" style={{ margin: "6px 0 0" }}>N/A for Near Miss.</div>
                    </div>
                    <div className="mod-form-group">
                      <label className="mod-form-label">Potential Severity Level & Rating</label>
                      <select id="select-potential-severity" className="mod-form-select" value={irPotentialSeverity} onChange={e => setIrPotentialSeverity(e.target.value)}>
                        <option value="">What could realistically have happened...</option>
                        {SEVERITY_RATINGS.map(s => <option key={s} value={s.split(" ")[0]}>{s}</option>)}
                      </select>
                      <div className="fsec-note" style={{ margin: "6px 0 0" }}>Ask what could realistically have happened if conditions were slightly different?</div>
                    </div>
                  </div>
                </div>

                {/* E. Incident Description */}
                <div className="fsec"><div className="fsec-title">E. Incident Description</div>
                  <div className="mod-form-group">
                    <textarea className="mod-form-textarea" style={{ minHeight: 120 }} value={irDescription} onChange={e => setIrDescription(e.target.value)} placeholder="Describe in detail what happened, including the sequence of events..."></textarea>
                  </div>
                </div>

                {/* F. Photos */}
                <div className="fsec"><div className="fsec-title">F. Photos from the incident location</div>
                  <div className="fsec-note">Minimum of 2 photos. For environmental incidents, include one photo before the spill is contained and one after.</div>

                  <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />

                  {!isCameraActive && (!initialReportSubmitted || isEditingInitialReport) && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="mod-btn-outline" onClick={startCamera} style={{ padding: "4px 12px", fontSize: "12px" }}>Take Photo</button>
                      <button className="mod-btn-outline" onClick={() => fileInputRef.current.click()} style={{ padding: "4px 12px", fontSize: "12px" }}>Upload File</button>
                    </div>
                  )}

                  {isCameraActive && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ width: "100%", maxWidth: 480, height: 320, background: "#ccc", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-main)", overflow: "hidden", position: "relative" }}>
                        <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }}></video>
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
                        <button onClick={capturePhoto} style={{ background: "var(--accent-primary)", color: "#fff", border: "none", borderRadius: 6, padding: "6px 16px", fontWeight: 700, cursor: "pointer" }}>Capture</button>
                        <button className="mod-btn-outline" onClick={stopCamera} style={{ padding: "6px 16px" }}>Stop Camera</button>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>{photos.length}/20 photos</div>
                    </div>
                  )}

                  <div className="photo-grid" style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {photos.length === 0 && !isCameraActive && (
                      <div className="photo-thumb" style={{ width: 100, height: 100, background: "var(--bg-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "11px", border: "1px solid var(--border-color)", borderRadius: 8 }}>No photos</div>
                    )}
                    {photos.map((p, idx) => (
                      <div key={idx} style={{ position: "relative", width: 120, height: 120, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-color)" }}>
                        <img src={p} alt={`Captured ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {(!initialReportSubmitted || isEditingInitialReport) && (
                          <button onClick={() => removePhoto(idx)} style={{ position: "absolute", top: 4, right: 4, background: "var(--color-risk)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>├ù</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* G, I, J Conditional on Not Environmental / Property Damage */}
                {(() => {
                  const allIncidentCats = [
                    ...(incident?.categories || []),
                    ...(headsUpData?.categories || []),
                    ...(irCategories || []),
                    incident?.category || ""
                  ].map(c => String(c).toLowerCase());

                  const isEnvIncident = allIncidentCats.some(c => c.includes("environment"));
                  const isPropDamageIncident = allIncidentCats.some(c => c.includes("property"));

                  if (isEnvIncident || isPropDamageIncident) return null;

                  return (
                    <>
                      {/* G. Injury / Illness Information */}
                      <div className="fsec">
                        <div className="fsec-title" style={{ justifyContent: "space-between" }}>
                          <span>G. Injury / Illness Information</span>
                        </div>
                        <div className="mod-form-group"><label className="mod-form-label">Nature of Injury</label>
                          <textarea className="mod-form-textarea" placeholder="e.g. Laceration to left hand, sprained ankle..." value={irNatureOfInjury} onChange={e => setIrNatureOfInjury(e.target.value)}></textarea>
                        </div>
                        <div className="grid-2">
                          <div className="mod-form-group"><label className="mod-form-label">Treatment Provided</label>
                            <select className="mod-form-select" value={irTreatmentProvided} onChange={e => setIrTreatmentProvided(e.target.value)}>
                              <option value="">Select...</option>
                              {TREATMENT_PROVIDED.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="mod-form-group"><label className="mod-form-label">Anticipated Absence from Work</label>
                            <input className="mod-form-input" placeholder="e.g. 3 days, 2 weeks, None, Unknown..." value={irAnticipatedAbsence} onChange={e => setIrAnticipatedAbsence(e.target.value)} />
                          </div>
                        </div>
                        <div className="mod-form-group" style={{ marginTop: 8 }}><label className="mod-form-label">Medical Treatment Classification</label>
                          <select className="mod-form-select" value={irMedicalTreatmentClass} onChange={e => setIrMedicalTreatmentClass(e.target.value)}>
                            <option value="">Select...</option>
                            {["No Treatment", "First Aid", "Medical Treatment", "Restricted Work", "Lost Time"].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* H. Type of Accident Categories */}
                      <div className="fsec"><div className="fsec-title">H. Type of Accident Categories</div>
                        <div className="fsec-note">Select all accident categories that apply.</div>
                        <div className="chk-grid-3">
                          {ACCIDENT_TYPE_CATEGORIES.map(cat => (
                            <label className="chk" key={cat}>
                              <input
                                type="checkbox"
                                checked={irAccidentCategories.includes(cat)}
                                onChange={e => {
                                  if (e.target.checked) setIrAccidentCategories([...irAccidentCategories, cat]);
                                  else setIrAccidentCategories(irAccidentCategories.filter(c => c !== cat));
                                }}
                              />
                              <span>{cat}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* I. Indicate Type(s) of Injury */}
                      <div className="fsec"><div className="fsec-title">I. Indicate Type(s) of Injury</div>
                        <div className="fsec-note">Select all that apply.</div>
                        <div className="chk-grid-3">
                          {INJURY_TYPES.map(cat => (
                            <label className="chk" key={cat}>
                              <input
                                type="checkbox"
                                checked={irInjuryTypes.includes(cat)}
                                onChange={e => {
                                  if (e.target.checked) setIrInjuryTypes([...irInjuryTypes, cat]);
                                  else setIrInjuryTypes(irInjuryTypes.filter(c => c !== cat));
                                }}
                              />
                              <span>{cat}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* J. Parts of the Body Injured */}
                      <div className="fsec"><div className="fsec-title">J. Indicate Parts of the Body Injured</div>
                        <div className="fsec-note">Click the body map to select injured areas, or add manually. Click a highlighted area again to remove it.</div>
                        <div className="bodyj-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 12 }}>
                          <div className="bodyj-map" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "24px 16px" }}>
                            {(() => {
                              const isPartSelected = (partName, side) => {
                                if (!bodyParts || bodyParts.length === 0) return false;
                                return bodyParts.some(item => {
                                  const lowerItem = String(item).toLowerCase();
                                  if (lowerItem.includes('entire body') || lowerItem.includes('multiple locations')) return true;

                                  const lowerPart = String(partName).toLowerCase();
                                  let matchesPart = lowerItem.includes(lowerPart);

                                  if (lowerPart === 'eye' && lowerItem.includes('eye')) matchesPart = true;
                                  if (lowerPart === 'ear' && lowerItem.includes('ear')) matchesPart = true;
                                  if (lowerPart === 'facial' && (lowerItem.includes('facial') || lowerItem.includes('teeth'))) matchesPart = true;

                                  if (lowerPart === 'chest' && (lowerItem.includes('ribs') || lowerItem.includes('torso') || lowerItem.includes('chest'))) matchesPart = true;
                                  if (lowerPart === 'pelvis' && (lowerItem.includes('abdomen') || lowerItem.includes('pelvis'))) matchesPart = true;
                                  if (lowerPart === 'back' && (lowerItem.includes('spine') || lowerItem.includes('back'))) matchesPart = true;
                                  if (lowerPart === 'head' && (lowerItem.includes('cranium') || lowerItem.includes('head'))) matchesPart = true;
                                  if ((lowerPart === 'foot' || lowerPart === 'toe' || lowerPart === 'toe(s)') && (lowerItem.includes('foot') || lowerItem.includes('toe'))) matchesPart = true;
                                  if ((lowerPart === 'hand' || lowerPart === 'finger' || lowerPart === 'finger(s)') && (lowerItem.includes('hand') || lowerItem.includes('finger'))) matchesPart = true;

                                  if (!side) return matchesPart;
                                  const sideLower = side.toLowerCase();
                                  const hasSide = lowerItem.includes(`(${sideLower})`) || lowerItem.includes(` ${sideLower}`) || lowerItem.includes(`_${sideLower}`);
                                  const itemHasNoSide = !lowerItem.includes('(l)') && !lowerItem.includes('(r)') && !lowerItem.includes(' left') && !lowerItem.includes(' right');

                                  return matchesPart && (hasSide || itemHasNoSide);
                                });
                              };

                              const fillFor = (partName, side) => {
                                return isPartSelected(partName, side) ? "#ef4444" : "#b4c6e7";
                              };

                              const toggleBodyPart = (partName, side) => {
                                const targetLabel = side ? `${partName} (${side})` : partName;
                                if (bodyParts.includes(targetLabel)) {
                                  setBodyParts(bodyParts.filter(p => p !== targetLabel));
                                } else {
                                  setBodyParts([...bodyParts, targetLabel]);
                                }
                              };

                              return (
                                <div className="body-figs" style={{ display: "flex", justifyContent: "space-around" }}>
                                  {/* FRONT VIEW */}
                                  <div className="body-fig" style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>FRONT VIEW</div>
                                    <svg width="150" height="300" viewBox="0 0 140 280" style={{ cursor: "pointer" }}>
                                      <circle cx="70" cy="24" r="16" fill={fillFor("Head")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Head")} />
                                      <circle cx="70" cy="24" r="9" fill={isPartSelected("Facial area") || isPartSelected("Teeth") || isPartSelected("Eye") ? "#ef4444" : "#ffffff"} stroke="#ffffff" strokeWidth="1" onClick={(e) => { e.stopPropagation(); toggleBodyPart("Facial area"); }} />
                                      <rect x="61" y="42" width="18" height="9" rx="3" fill={fillFor("Neck")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Neck")} />
                                      <circle cx="42" cy="59" r="8" fill={fillFor("Shoulder", "R")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Shoulder", "R")} />
                                      <circle cx="98" cy="59" r="8" fill={fillFor("Shoulder", "L")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Shoulder", "L")} />
                                      <rect x="52" y="53" width="36" height="26" rx="4" fill={fillFor("Chest")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Chest")} />
                                      <rect x="54" y="81" width="32" height="18" rx="3" fill={fillFor("Pelvis or abdomen")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Pelvis or abdomen")} />
                                      <rect x="52" y="101" width="36" height="24" rx="4" fill={fillFor("Pelvis or abdomen")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Pelvis or abdomen")} />
                                      <rect x="36" y="69" width="12" height="38" rx="5" fill={fillFor("Arm, Elbow", "R")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Arm, Elbow", "R")} />
                                      <rect x="92" y="69" width="12" height="38" rx="5" fill={fillFor("Arm, Elbow", "L")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Arm, Elbow", "L")} />
                                      <circle cx="36" cy="112" r="5" fill={isPartSelected("Wrist", "R") || isPartSelected("Hand", "R") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Wrist", "R")} />
                                      <circle cx="104" cy="112" r="5" fill={isPartSelected("Wrist", "L") || isPartSelected("Hand", "L") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Wrist", "L")} />
                                      <rect x="30" y="119" width="12" height="18" rx="6" fill={isPartSelected("Hand", "R") || isPartSelected("Finger(s)", "R") || isPartSelected("Finger", "R") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Hand", "R")} />
                                      <rect x="98" y="119" width="12" height="18" rx="6" fill={isPartSelected("Hand", "L") || isPartSelected("Finger(s)", "L") || isPartSelected("Finger", "L") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Hand", "L")} />
                                      <rect x="52" y="127" width="14" height="48" rx="6" fill={fillFor("Legs, Knee", "R")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Legs, Knee", "R")} />
                                      <rect x="74" y="127" width="14" height="48" rx="6" fill={fillFor("Legs, Knee", "L")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Legs, Knee", "L")} />
                                      <circle cx="59" cy="179" r="5" fill={fillFor("Legs, Knee", "R")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Legs, Knee", "R")} />
                                      <circle cx="81" cy="179" r="5" fill={fillFor("Legs, Knee", "L")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Legs, Knee", "L")} />
                                      <rect x="53" y="186" width="12" height="44" rx="5" fill={fillFor("Legs, Knee", "R")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Legs, Knee", "R")} />
                                      <rect x="75" y="186" width="12" height="44" rx="5" fill={fillFor("Legs, Knee", "L")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Legs, Knee", "L")} />
                                      <circle cx="59" cy="234" r="4" fill={isPartSelected("Ankle", "R") || isPartSelected("Foot", "R") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Ankle", "R")} />
                                      <circle cx="81" cy="234" r="4" fill={isPartSelected("Ankle", "L") || isPartSelected("Foot", "L") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Ankle", "L")} />
                                      <ellipse cx="53" cy="244" rx="10" ry="5" fill={isPartSelected("Foot", "R") || isPartSelected("Toe(s)", "R") || isPartSelected("Toe", "R") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Foot", "R")} />
                                      <ellipse cx="87" cy="244" rx="10" ry="5" fill={isPartSelected("Foot", "L") || isPartSelected("Toe(s)", "L") || isPartSelected("Toe", "L") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Foot", "L")} />
                                    </svg>
                                  </div>

                                  {/* BACK VIEW */}
                                  <div className="body-fig" style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>BACK VIEW</div>
                                    <svg width="150" height="300" viewBox="0 0 140 280" style={{ cursor: "pointer" }}>
                                      <circle cx="70" cy="24" r="16" fill={fillFor("Head")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Head")} />
                                      <circle cx="52" cy="24" r="4" fill={fillFor("Ear", "L")} stroke="#ffffff" strokeWidth="1.5" onClick={(e) => { e.stopPropagation(); toggleBodyPart("Ear", "L"); }} />
                                      <circle cx="88" cy="24" r="4" fill={fillFor("Ear", "R")} stroke="#ffffff" strokeWidth="1.5" onClick={(e) => { e.stopPropagation(); toggleBodyPart("Ear", "R"); }} />
                                      <rect x="61" y="42" width="18" height="9" rx="3" fill={fillFor("Neck")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Neck")} />
                                      <circle cx="42" cy="59" r="8" fill={fillFor("Shoulder", "L")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Shoulder", "L")} />
                                      <circle cx="98" cy="59" r="8" fill={fillFor("Shoulder", "R")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Shoulder", "R")} />
                                      <rect x="52" y="53" width="36" height="46" rx="4" fill={isPartSelected("Back incl. spine") || isPartSelected("Back") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Back incl. spine")} />
                                      <rect x="52" y="101" width="36" height="24" rx="4" fill={isPartSelected("Back incl. spine") || isPartSelected("Back") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Back incl. spine")} />
                                      <rect x="36" y="69" width="12" height="38" rx="5" fill={fillFor("Arm, Elbow", "L")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Arm, Elbow", "L")} />
                                      <rect x="92" y="69" width="12" height="38" rx="5" fill={fillFor("Arm, Elbow", "R")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Arm, Elbow", "R")} />
                                      <circle cx="36" cy="112" r="5" fill={isPartSelected("Wrist", "L") || isPartSelected("Hand", "L") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Wrist", "L")} />
                                      <circle cx="104" cy="112" r="5" fill={isPartSelected("Wrist", "R") || isPartSelected("Hand", "R") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Wrist", "R")} />
                                      <circle cx="30" cy="125" r="9" fill={isPartSelected("Hand", "L") || isPartSelected("Finger(s)", "L") || isPartSelected("Finger", "L") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Hand", "L")} />
                                      <circle cx="110" cy="125" r="9" fill={isPartSelected("Hand", "R") || isPartSelected("Finger(s)", "R") || isPartSelected("Finger", "R") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Hand", "R")} />
                                      <rect x="52" y="127" width="14" height="48" rx="6" fill={fillFor("Legs, Knee", "L")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Legs, Knee", "L")} />
                                      <rect x="74" y="127" width="14" height="48" rx="6" fill={fillFor("Legs, Knee", "R")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Legs, Knee", "R")} />
                                      <circle cx="59" cy="179" r="5" fill={fillFor("Legs, Knee", "L")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Legs, Knee", "L")} />
                                      <circle cx="81" cy="179" r="5" fill={fillFor("Legs, Knee", "R")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Legs, Knee", "R")} />
                                      <rect x="53" y="186" width="12" height="44" rx="5" fill={fillFor("Legs, Knee", "L")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Legs, Knee", "L")} />
                                      <rect x="75" y="186" width="12" height="44" rx="5" fill={fillFor("Legs, Knee", "R")} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Legs, Knee", "R")} />
                                      <circle cx="59" cy="234" r="4" fill={isPartSelected("Ankle", "L") || isPartSelected("Foot", "L") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Ankle", "L")} />
                                      <circle cx="81" cy="234" r="4" fill={isPartSelected("Ankle", "R") || isPartSelected("Foot", "R") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Ankle", "R")} />
                                      <ellipse cx="53" cy="244" rx="10" ry="5" fill={isPartSelected("Foot", "L") || isPartSelected("Toe(s)", "L") || isPartSelected("Toe", "L") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Foot", "L")} />
                                      <ellipse cx="87" cy="244" rx="10" ry="5" fill={isPartSelected("Foot", "R") || isPartSelected("Toe(s)", "R") || isPartSelected("Toe", "R") ? "#ef4444" : "#b4c6e7"} stroke="#ffffff" strokeWidth="2" onClick={() => toggleBodyPart("Foot", "R")} />
                                    </svg>
                                  </div>
                                </div>
                              );
                            })()}
                            <div className="bmap-hint" style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>Tip: (L) / (R) are the worker's left / right.</div>
                          </div>
                          <div className="bodyj-select">
                            <div className="mod-form-group">
                              <label className="mod-form-label" style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>Add a body part (manual)</label>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <select className="mod-form-select" style={{ flex: 1 }} value={manualBodyPart} onChange={e => setManualBodyPart(e.target.value)}>
                                  <option value="">Select...</option>
                                  {BODY_PARTS_SSW.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button className="mod-btn-outline" style={{ padding: "0 12px" }} onClick={() => {
                                  if (manualBodyPart && !bodyParts.includes(manualBodyPart)) {
                                    setBodyParts([...bodyParts, manualBodyPart]);
                                    setManualBodyPart("");
                                  }
                                }}>Add</button>
                              </div>
                            </div>
                            <label className="mod-form-label" style={{ marginTop: 24, textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>Selected injured areas</label>
                            <div className="chip-list bodyj-chips" style={{ border: "1px dashed var(--border-color)", padding: 12, borderRadius: 8, minHeight: 80, display: "flex", flexWrap: "wrap", gap: 8 }}>
                              {bodyParts.map(bp => (
                                <div key={bp} style={{ background: "var(--bg-dark)", border: "1px solid var(--border-color)", padding: "4px 8px 4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                                  {bp}
                                  <button onClick={() => setBodyParts(bodyParts.filter(p => p !== bp))} style={{ background: "var(--color-gray-bg)", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>├ù</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* K. Immediate Actions Taken */}
                <div className="fsec"><div className="fsec-title" style={{ justifyContent: "space-between" }}>
                  <span>K. Immediate Actions Taken</span>
                  {(!initialReportSubmitted || isEditingInitialReport) && (
                    <button className="mod-btn-outline" onClick={() => setImmActions([...immActions, { action: '', responsible: '', time: '' }])} style={{ padding: "4px 12px", fontSize: "12px" }}>+ Add Action</button>
                  )}
                </div>

                  {immActions.length === 0 ? (
                    <div className="readonly-box" style={{ marginTop: 8, fontStyle: "italic", color: "var(--text-muted)" }}>No immediate actions recorded yet.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
                      {immActions.map((act, idx) => (
                        <div key={idx} style={{ border: "1px solid var(--border-color)", borderRadius: 8, padding: 16 }}>
                          <div className="grid-2">
                            <div className="mod-form-group">
                              <label className="mod-form-label" style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>Action</label>
                              <input className="mod-form-input" value={act.action} onChange={e => { const updated = [...immActions]; updated[idx].action = e.target.value; setImmActions(updated); }} />
                            </div>
                            <div className="mod-form-group">
                              <label className="mod-form-label" style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>Responsible</label>
                              <input className="mod-form-input" value={act.responsible} onChange={e => { const updated = [...immActions]; updated[idx].responsible = e.target.value; setImmActions(updated); }} />
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                            <div className="mod-form-group" style={{ flex: "1 1 120px" }}>
                              <label className="mod-form-label" style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>Date</label>
                              <input type="date" className="mod-form-input" value={act.date || ""} onChange={e => { const updated = [...immActions]; updated[idx].date = e.target.value; setImmActions(updated); }} />
                            </div>
                            <div className="mod-form-group" style={{ flex: "1 1 120px" }}>
                              <label className="mod-form-label" style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>Time Implemented</label>
                              <input type="text" readOnly className="mod-form-input" placeholder="Select time" value={act.time || ""} style={{ cursor: (!initialReportSubmitted || isEditingInitialReport) ? "pointer" : "default" }} onClick={() => { if (!initialReportSubmitted || isEditingInitialReport) { setTempActionTime(act.time || "12:00"); setShowActionTimePicker(idx); } }} />
                            </div>
                            {(!initialReportSubmitted || isEditingInitialReport) && (
                              <button style={{ padding: "6px 12px", border: "1px solid var(--color-risk-bg)", background: "var(--bg-card)", color: "var(--color-risk)", borderRadius: 6, fontSize: 12, cursor: "pointer", height: 36 }} onClick={() => setImmActions(immActions.filter((_, i) => i !== idx))}>Remove</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showActionTimePicker !== null && (
                    <AnalogTimePicker
                      initialTime={tempActionTime}
                      onSave={(val) => {
                        const updated = [...immActions];
                        updated[showActionTimePicker].time = val;
                        setImmActions(updated);
                        setShowActionTimePicker(null);
                      }}
                      onCancel={() => setShowActionTimePicker(null)}
                    />
                  )}
                </div>

                {/* L. Initial Root Cause Assessment */}
                <div className="fsec"><div className="fsec-title">L. Initial Root Cause Assessment</div>
                  <div className="mod-form-group">
                    <textarea className="mod-form-textarea" placeholder="Initial view on why the incident occurred..." value={irInitialRootCause} onChange={e => setIrInitialRootCause(e.target.value)}></textarea>
                  </div>
                  <div className="grid-2">
                    <div className="mod-form-group"><label className="mod-form-label">Environmental Conditions</label>
                      <select className="mod-form-select" value={irEnvironmentalConditions} onChange={e => setIrEnvironmentalConditions(e.target.value)}>
                        <option value="">Select...</option>
                        {['Normal', 'Wet/Slippery', 'Poor Lighting', 'High Noise', 'Confined', 'Extreme Temperature', 'Windy'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="mod-form-group"><label className="mod-form-label">Equipment Involved</label>
                      <select className="mod-form-select" value={irEquipmentInvolved} onChange={e => setIrEquipmentInvolved(e.target.value)}>
                        <option value="">Select...</option>
                        {['None', 'Hand Tools', 'Power Tools', 'Crane/Lifting', 'Scaffold', 'MEWP', 'Vehicle/Plant', 'Electrical Equipment'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* M. Report Submitter / Editor & Revision Signature */}
                {(isEditingInitialReport && initialReportSubmitted) ? (
                  <div className="fsec" style={{ marginTop: 16, borderTop: "2px solid #f59e0b", paddingTop: 16 }}>
                    <div className="fsec-title" style={{ color: "#d97706", display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      M. Editor Information & Revision Signature
                    </div>
                    <div className="mod-form-group">
                      <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Edited By (Name) <span style={{ color: "#DC2626" }}>*</span></label>
                      <input
                        type="text"
                        className="mod-form-input"
                        placeholder="Type your full name..."
                        value={irEditorName}
                        onChange={e => setIrEditorName(e.target.value)}
                      />
                    </div>
                    <div className="mod-form-group" style={{ marginTop: 16 }}>
                      <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Reason for Revision / What was edited <span style={{ color: "#DC2626" }}>*</span></label>
                      <textarea
                        className="mod-form-textarea"
                        rows="2"
                        placeholder="Briefly state what details were modified or updated in this revision..."
                        value={irEditReason}
                        onChange={e => setIrEditReason(e.target.value)}
                      />
                    </div>
                    <div className="mod-form-group" style={{ marginTop: 16 }}>
                      <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Editor Digital Signature <span style={{ color: "#DC2626" }}>*</span></label>
                      <SignaturePad
                        value={irEditorSignature}
                        onChange={setIrEditorSignature}
                        onClear={() => setIrEditorSignature(false)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="fsec">
                    <div className="fsec-title">M. Report Submitter & Digital Signature</div>
                    <div className="grid-2">
                      <div className="mod-form-group">
                        <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Submitted By (Name) <span style={{ color: "#DC2626" }}>*</span></label>
                        <input
                          type="text"
                          className="mod-form-input"
                          placeholder="Type your full name..."
                          value={irSubmittedBy}
                          onChange={e => setIrSubmittedBy(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mod-form-group" style={{ marginTop: 16 }}>
                      <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Digital Signature <span style={{ color: "#DC2626" }}>*</span></label>
                      <SignaturePad
                        value={irSubSignature}
                        onChange={setIrSubSignature}
                        onClear={() => setIrSubSignature(false)}
                      />
                    </div>

                    {/* No Further Investigation Checkbox */}
                    <div style={{ marginTop: 20, padding: "14px 16px", background: "var(--bg-dark, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="checkbox"
                        id="irNoFurtherInvestigation"
                        checked={irNoFurtherInvestigation}
                        onChange={e => setIrNoFurtherInvestigation(e.target.checked)}
                        style={{ width: 18, height: 18, cursor: "pointer" }}
                      />
                      <label htmlFor="irNoFurtherInvestigation" style={{ fontWeight: 600, fontSize: 13.5, cursor: "pointer", color: "var(--text-main)" }}>
                        No further investigation required (Incident can be closed after approval)
                      </label>
                    </div>
                  </div>
                )}

                <div className="fsec">
                  <div className="fsec-note">Distribution: NNE Site HSE, NNE Construction Management</div>
                  {!headsUpApproved && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderLeft: "4px solid #f59e0b", padding: "12px 16px", borderRadius: "6px", marginTop: "16px", display: "flex", alignItems: "center", gap: "10px", color: "#92400e", fontSize: "13px" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <div>
                        <strong>Stage Gate Prerequisite:</strong> Stage 1 Heads-Up Notification must be reviewed & approved by NNE before the Initial Incident Report can be submitted.
                      </div>
                    </div>
                  )}
                  {(!initialReportSubmitted || isEditingInitialReport) && !isClosed && (
                    <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                    <button className="mod-btn-primary im-btn-primary" disabled={!headsUpApproved} title={!headsUpApproved ? "Stage 1 Heads-Up Notification must be approved first" : ""} onClick={async () => {
                      try {
                        const allIncidentCats = [
                          ...(incident?.categories || []),
                          ...(headsUpData?.categories || []),
                          ...(irCategories || []),
                          incident?.category || ""
                        ].map(c => String(c).toLowerCase());

                        const isEnvIncident = allIncidentCats.some(c => c.includes("environment"));
                        const isPropDamageIncident = allIncidentCats.some(c => c.includes("property"));

                        const formData = new FormData();
                        const userName = irSubmittedBy || getLoggedInUser() || incident.reporterName || incident.reportedBy || "User";

                        // 1. Photos
                        photos.forEach((p, idx) => {
                          if (typeof p === "string" && p.startsWith("data:")) {
                            const blob = dataURLtoBlob(p);
                            if (blob) {
                              formData.append("photos", blob, `photo_${idx + 1}.png`);
                            }
                          } else if (p instanceof File || p instanceof Blob) {
                            formData.append("photos", p);
                          }
                        });

                        // 2. Severities & Flags
                        if (irActualSeverity) formData.append("actualSeverity", irActualSeverity);
                        if (irPotentialSeverity) formData.append("potentialSeverity", irPotentialSeverity);

                        const isHipo = Number(irPotentialSeverity) >= 4 || Number(irActualSeverity) >= 4;
                        formData.append("isHipo", String(isHipo));
                        formData.append("hasInjuryIllness", String(!irInjuryNotApplicable));

                        // 3. Injured Person Details
                        if (irInjuredName) formData.append("injuredPersonName", irInjuredName);
                        if (irInjuredCompany) formData.append("injuredPersonCompany", irInjuredCompany);
                        if (irInjuredSupervisor) formData.append("injuredPersonSupervisor", irInjuredSupervisor);
                        if (irInjuredJobTitle) formData.append("injuredPersonJobTitle", irInjuredJobTitle);
                        if (irLengthOfService) formData.append("lengthOfService", irLengthOfService);
                        if (irExperienceInRole) formData.append("experienceInRole", irExperienceInRole);
                        if (irWorkerActivity) formData.append("workerActivity", irWorkerActivity);

                        // 4. Injury & Treatment Details
                        formData.append("natureOfInjury", irNatureOfInjury || "None reported");
                        formData.append("treatmentPrescribed", irTreatmentProvided || "First aid");
                        formData.append("anticipatedAbsence", irAnticipatedAbsence || "0 days");
                        formData.append("treatmentProvided", JSON.stringify(irTreatmentProvided ? [irTreatmentProvided] : []));
                        if (irMedicalTreatmentClass) formData.append("medicalTreatmentClass", irMedicalTreatmentClass);

                        // 5. Initial Assessment & Root Cause
                        if (irInitialRootCause) formData.append("initialRootCause", irInitialRootCause);
                        if (irEnvironmentalConditions) formData.append("environmentalConditions", irEnvironmentalConditions);
                        if (irEquipmentInvolved) formData.append("equipmentInvolved", irEquipmentInvolved);

                        // 6. Categories & Body Parts
                        formData.append("categories", JSON.stringify(irCategories));
                        formData.append("accidentCategories", JSON.stringify(irAccidentCategories));
                        formData.append("injuryTypes", JSON.stringify(irInjuryTypes));
                        formData.append("immediateActions", JSON.stringify(immActions.map(a => ({
                          action: a.action || "",
                          responsible: a.responsible || "",
                          targetDate: a.date || a.targetDate || "",
                          timeImplemented: a.time || a.timeImplemented || ""
                        }))));
                        formData.append("noFurtherInvestigation", String(irNoFurtherInvestigation));

                        const bodyPartsSelection = bodyParts.map(bp => {
                          if (bp.endsWith(" (R)")) return { part: bp.replace(" (R)", ""), side: "R" };
                          if (bp.endsWith(" (L)")) return { part: bp.replace(" (L)", ""), side: "L" };
                          return { part: bp, side: "L" };
                        });
                        formData.append("bodyPartsInjured", JSON.stringify({ selections: bodyPartsSelection }));

                        // Environmental / Property damage payloads
                        if (isEnvIncident) {
                          const finalSpillType = Array.isArray(irEnvSpillType) && irEnvSpillType.includes("Other") && irEnvSpillOther
                            ? [...irEnvSpillType.filter(t => t !== "Other"), `Other: ${irEnvSpillOther}`]
                            : irEnvSpillType;
                          const finalSystemEntered = Array.isArray(irEnvSystemEntered) && irEnvSystemEntered.includes("Other") && irEnvSystemOther
                            ? [...irEnvSystemEntered.filter(s => s !== "Other"), `Other: ${irEnvSystemOther}`]
                            : irEnvSystemEntered;

                          formData.append("environmentalDetails", JSON.stringify({
                            spillType: finalSpillType,
                            spillSubstance: irEnvSpillSubstance,
                            spillQuantity: irEnvSpillQuantity,
                            spillCause: irEnvSpillCause,
                            spillSystemEntered: finalSystemEntered,
                            containmentCleanup: irEnvContainment
                          }));
                        }
                        if (isPropDamageIncident) {
                          formData.append("propertyDamageDetails", JSON.stringify({
                            propertyDamaged: irPropDamaged,
                            damageDescription: irPropDamageDesc,
                            equipmentInvolved: irPropEquipmentInvolved,
                            estimatedCost: irPropEstimatedCost,
                            immediateActionTaken: irPropImmediateAction
                          }));
                        }

                        // 7. User Metadata & Signature
                        if (isEditingInitialReport) {
                          formData.append("editedBy", irEditorName || getLoggedInUser());
                          formData.append("editorRole", irEditorRole || "Contractor / HSE Editor");
                          formData.append("editReason", irEditReason || "Updated Initial Incident Report");
                          if (irEditorSignature && typeof irEditorSignature === "string") {
                            formData.append("editorSignature", irEditorSignature);
                            formData.append("signature", irEditorSignature);
                          }
                        } else {
                          formData.append("submittedBy", userName);
                          if (irSubSignature && typeof irSubSignature === "string") {
                            formData.append("signature", irSubSignature);
                          }
                        }

                        await submitInitialReport(id, formData);
                        showSuccess(isEditingInitialReport ? "Initial Incident Report Updated Successfully!" : "Initial Incident Report Submitted Successfully!");
                        setIsEditingInitialReport(false);
                        setInitialReportSubmitted(true);
                        window.scrollTo(0, 0);
                        const data = await getIncidentById(id);
                        setRawIncident(data?.data || data);
                      } catch (err) {
                        console.error("Failed to submit initial report", err);
                        const msg = err.response?.data?.message || err.message || "Failed to submit initial report";
                        showError(Array.isArray(msg) ? msg[0] : msg);
                      }
                    }}>{isEditingInitialReport ? "Update Initial Incident Report" : "Submit Initial Incident Report"}</button>
                    {isEditingInitialReport && (
                      <button type="button" className="mod-btn-outline" onClick={() => setIsEditingInitialReport(false)}>Cancel Edit</button>
                    )}
                  </div>
                )}
                </div>
                </fieldset>

                {/* Review & Sign-Off Section if submitted and pending approval */}
                {initialReportSubmitted && !initialReportApproved && !isClosed && !isContractorUser() && (
                  <div className="mod-card mb-4" style={{ marginTop: 24, borderTop: "3px solid var(--accent-primary, #3b82f6)" }}>
                    <div className="mod-card-header"><span className="mod-card-title">Review & Sign-Off: Initial Incident Report {incident.id}</span></div>
                    <div className="mod-card-body">
                      <div className="mod-form-group">
                        <label className="mod-form-label">Review Comments / Revision Reason</label>
                        <textarea
                          className="mod-form-textarea"
                          placeholder="Add review comments or specify reasons for revision..."
                          rows="3"
                          value={irReviewComments}
                          onChange={(e) => setIrReviewComments(e.target.value)}
                        />
                      </div>
                      <div className="mod-form-group" style={{ marginTop: 16 }}>
                        <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Reviewer Name</label>
                        <input type="text" className="mod-form-input" placeholder="Type your full name" value={irReviewerName} onChange={(e) => setIrReviewerName(e.target.value)} />
                      </div>
                      <div className="mod-form-group" style={{ marginTop: 16 }}>
                        <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Reviewer Role</label>
                        <input type="text" className="mod-form-input" placeholder="e.g. Customer Approver" value={irReviewerRole} onChange={(e) => setIrReviewerRole(e.target.value)} />
                      </div>
                      <div className="mod-form-group" style={{ marginTop: 16 }}>
                        <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Digital Signature</label>
                        <SignaturePad value={irSignature} onChange={setIrSignature} onClear={() => setIrSignature(false)} />
                      </div>
                      <div className="markok" onClick={() => setIrMarkedOk(!irMarkedOk)} style={{ borderColor: irMarkedOk ? "var(--color-safe)" : "var(--border-color)", opacity: irMarkedOk ? 1 : 0.7 }}>
                        <input type="checkbox" checked={irMarkedOk} onChange={() => { }} />
                        <div>
                          <div className="mk-t">Marked OK</div>
                          <div className="mk-s">I have reviewed this report and confirm it is complete and accurate.</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                        <button
                          type="button"
                          className="mod-btn-outline"
                          style={{ color: "var(--color-risk)", borderColor: "var(--color-risk-bg)" }}
                          disabled={isReturningRevision}
                          onClick={() => handleReturnForRevision("INITIAL_REPORT")}
                        >
                          {isReturningRevision ? "Returning..." : "Return for Revision"}
                        </button>
                        <button className="mod-btn-primary im-btn-primary" disabled={!irMarkedOk || !irSignature || !irReviewerName} onClick={async () => {
                          try {
                            const userName = irReviewerName || getLoggedInUser();
                            await approveInitialReport(id, { signature: irSignature, approvedBy: userName });
                            showSuccess("Initial Report Approved!");
                            setInitialReportApproved(true);
                            setActiveTab("investigation");
                            window.scrollTo(0, 0);
                            const data = await getIncidentById(id);
                            setRawIncident(data?.data || data);
                          } catch (err) {
                            const msg = err.response?.data?.message || err.message || "Failed to approve initial report";
                            showError(Array.isArray(msg) ? msg[0] : msg);
                          }
                        }}>Approve & Sign Off</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Trail & Sign-off Log */}
                {initialReportSubmitted && irAudit.length > 0 && (
                  <div className="mod-card mb-4" style={{ marginTop: 24 }}>
                    <div className="mod-card-header">
                      <span className="mod-card-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", color: "var(--text-main)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
                        </svg>
                        Audit Trail & Sign-Off Log
                      </span>
                    </div>
                    <div className="mod-card-body" style={{ padding: "24px 16px" }}>
                      <div style={{ position: "relative", paddingLeft: 16 }}>
                        <div style={{ position: "relative", paddingLeft: 16 }}>
                          {irAudit.map((step, i) => renderAuditCard(step, i, irAudit.length))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct Close Section if Initial Report is Approved and No Further Investigation Required */}
                {initialReportApproved && (irNoFurtherInvestigation || huNoFurtherInvestigation || incident.noFurtherInvestigation) && !isClosed && !isContractorUser() && (
                  <div className="mod-card mb-4" style={{ marginTop: 24, borderTop: "3px solid #10b981", background: "rgba(16, 185, 129, 0.04)" }}>
                    <div className="mod-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <span className="mod-card-title" style={{ color: "#059669", display: "flex", alignItems: "center", gap: 8, fontSize: 16 }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          No Further Investigation Required
                        </span>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                          Initial Incident Report is approved with no further investigation required. This incident can now be officially closed.
                        </div>
                      </div>
                      <button
                        className="mod-btn-primary im-btn-primary"
                        style={{ background: "var(--color-risk, #dc2626)", padding: "8px 20px", fontSize: "13px", fontWeight: 700 }}
                        onClick={async () => {
                          try {
                            const userName = getLoggedInUser() || "Site HSE Admin";
                            await closeIncident(id, { closedBy: userName });
                            showSuccess("Incident Closed Successfully!");
                            const data = await getIncidentById(id);
                            setRawIncident(data?.data || data);
                          } catch (err) {
                            const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to close incident";
                            showError(Array.isArray(msg) ? msg[0] : msg);
                          }
                        }}
                      >
                        Close Incident
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

        <div className={`inc-tab-panel ${activeTab === "investigation" ? "active" : ""}`}>
          {(isNoFurtherInvestigation || huNoFurtherInvestigation || irNoFurtherInvestigation || incident?.noFurtherInvestigation) && !hasInvestigationData ? (
            <div className="mod-card">
              <div className="mod-card-body" style={{ padding: "40px 24px", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, border: "2px solid #a7f3d0" }}>
                  Γ£ô
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#065f46", margin: "0 0 8px 0" }}>Stage 3 Investigation Report Waived</h3>
                <p style={{ color: "#047857", fontSize: "14px", maxWidth: "600px", margin: "0 auto 24px", lineHeight: "1.5" }}>
                  This incident was marked as <strong>"No further investigation required"</strong>. Detailed 7-day Stage 3 Investigation (5-Whys, Fishbone, RCA) is waived and not required.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    className="mod-btn-outline"
                    style={{ padding: "8px 20px", fontSize: "13px", fontWeight: 600 }}
                    onClick={() => setActiveTab(hasInitialReportData ? "initialReport" : "headsUp")}
                  >
                    ΓåÉ View Filled {hasInitialReportData ? "Initial Report" : "Heads-Up Form"}
                  </button>
                  {(headsUpApproved || initialReportApproved) && !isClosed && (
                    <button
                      className="mod-btn-primary im-btn-primary"
                      style={{ background: "var(--color-risk, #dc2626)", padding: "8px 20px", fontSize: "13px", fontWeight: 700 }}
                      onClick={async () => {
                        try {
                          const userName = getLoggedInUser() || "Site HSE Admin";
                          await closeIncident(id, { closedBy: userName });
                          showSuccess("Incident Closed Successfully!");
                          const updated = await getIncidentById(id);
                          setRawIncident(updated?.data || updated);
                        } catch (err) {
                          const msg = err.response?.data?.message || err.message || "Failed to close incident";
                          showError(Array.isArray(msg) ? msg[0] : msg);
                        }
                      }}
                    >
                      Close Incident
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : !initialReportApproved && !isClosed ? (
            <div className="mod-card"><div className="mod-card-body"><div className="locked-state">
              <div className="locked-icon"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg></div>
              <div className="locked-title">Investigation Report Not Yet Available</div>
              <div className="locked-text">Available after the Initial Incident Report is completed. Due by <b>7d from event</b>.</div>
            </div></div></div>
          ) : (!investigationStarted && !investigationSubmitted && !isClosed) ? (
            <div className="mod-card" style={{ padding: "80px 32px", textAlign: "center", borderTop: "4px solid var(--accent-primary)" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-main)", marginBottom: 12 }}>Incident Investigation Report (7 days)</div>
              <div style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>The Initial Incident Report is complete. You can now begin the full investigation report.</div>
              <button className="mod-btn-primary im-btn-primary" style={{ padding: "10px 24px", fontSize: 14 }} onClick={() => { setInvestigationStarted(true); setIsEditingInvestigation(false); window.scrollTo(0, 0); }}>Start Investigation Report</button>
            </div>
          ) : (
            <div className="mod-card">
              <div className="mod-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="mod-card-title">Incident Investigation Report (7 days)</span>
                  {investigationApproved ? (
                    <span className="inv-chip chip-done">Completed</span>
                  ) : (isEditingInvestigation && investigationSubmitted) ? (
                    <span className="inv-chip chip-inprogress">Editing</span>
                  ) : investigationSubmitted ? (
                    <span className="inv-chip chip-current">In Review</span>
                  ) : (
                    <span className="inv-chip chip-upcoming">In Progress</span>
                  )}
                </div>
                {(investigationApproved || investigationSubmitted || isClosed) && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="mod-btn-outline"
                      style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-main)", borderColor: "var(--border-color)" }}
                      onClick={() => {
                        setPdfTargetForm("investigation");
                        setShowPdfExport(true);
                      }}
                      title="View full clean Investigation Report in modal"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      View in Modal
                    </button>
                    {!isClosed && !investigationApproved && !isEditingInvestigation && investigationSubmitted && (
                      <button
                        type="button"
                        className="mod-btn-outline"
                        style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent-primary, #3b82f6)", borderColor: "var(--accent-primary, #3b82f6)" }}
                        onClick={() => {
                          setInvestigationStarted(true);
                          setIsEditingInvestigation(true);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit Investigation Form
                      </button>
                    )}
                    {isEditingInvestigation && investigationSubmitted && (
                      <button
                        type="button"
                        className="mod-btn-outline"
                        style={{ padding: "6px 12px", fontSize: "12px", fontWeight: 600 }}
                        onClick={() => setIsEditingInvestigation(false)}
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className="mod-btn-primary"
                      style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
                      onClick={() => handleExportSingleForm("investigation", "Incident Investigation Report")}
                      disabled={downloadingForm === "investigation"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      {downloadingForm === "investigation" ? "Downloading..." : "Download Form 3 PDF"}
                    </button>
                  </div>
                )}
              </div>
              <div className="mod-card-body">
                <fieldset disabled={!isEditingInvestigation && investigationSubmitted} style={{ border: "none", padding: 0, margin: 0, opacity: (!isEditingInvestigation && investigationSubmitted) ? 0.95 : 1 }}>

                {/* 1. Investigation Team */}
                <div className="fsec"><div className="fsec-title" style={{ justifyContent: "space-between", display: "flex" }}>
                  <span>1. Investigation Team</span>
                  {(!investigationSubmitted || isEditingInvestigation) && (
                    <button className="mod-btn-outline" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={addInvTeamMember}>+ Add Member</button>
                  )}
                </div>
                  {invTeam.length === 0 ? <div className="muted-empty" style={{ fontStyle: "italic", fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>No team members added yet.</div> : invTeam.map((m, i) => (
                    <div key={i} className="subcard" style={{ border: "1px solid var(--border-color)", padding: 16, borderRadius: 8, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>Member {i + 1}</span>
                        {(!investigationSubmitted || isEditingInvestigation) && (
                          <button className="subcard-remove" style={{ color: "var(--color-risk)", background: "transparent", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }} onClick={() => removeInvTeamMember(i)}>Remove</button>
                        )}
                      </div>
                      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div className="mod-form-group"><label className="mod-form-label">Name</label><input className="mod-form-input" value={m.name} onChange={e => updateInvTeamMember(i, 'name', e.target.value)} /></div>
                        <div className="mod-form-group"><label className="mod-form-label">Position / Role</label><input className="mod-form-input" value={m.role} onChange={e => updateInvTeamMember(i, 'role', e.target.value)} /></div>
                      </div>
                      <div className="mod-form-group" style={{ marginTop: 12 }}><label className="mod-form-label">Company</label><input className="mod-form-input" value={m.company} onChange={e => updateInvTeamMember(i, 'company', e.target.value)} /></div>
                    </div>
                  ))}
                </div>

                {/* 2. Investigation Details */}
                <div className="fsec"><div className="fsec-title">2. Investigation Details</div>
                  <div className="mod-form-group">
                    <label className="mod-form-label" style={{ textTransform: "none", letterSpacing: "normal" }}>Description of process, timelines, tools, participants, parties involved, systems reviewed, equipment and findings.</label>
                    <textarea className="mod-form-textarea" style={{ minHeight: 120 }} placeholder="Describe the investigation process..." value={invDetails} onChange={e => setInvDetails(e.target.value)}></textarea>
                  </div>
                </div>

                {/* 3. Witness Statements */}
                <div className="fsec"><div className="fsec-title" style={{ justifyContent: "space-between", display: "flex" }}>
                  <span>3. Witness Statements</span>
                  {(!investigationSubmitted || isEditingInvestigation) && (
                    <button className="mod-btn-outline" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={addInvWitness}>+ Add Witness</button>
                  )}
                </div>
                  <div className="fsec-note">Witness statements are collected as part of the investigation. Attach the signed Witness Statement form under Mandatory Attachments.</div>
                  {invWitnesses.length === 0 ? <div className="muted-empty" style={{ fontStyle: "italic", fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>No witnesses added yet.</div> : invWitnesses.map((w, i) => (
                    <div key={i} className="subcard" style={{ border: "1px solid var(--border-color)", padding: 16, borderRadius: 8, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>Witness {i + 1}</span>
                        {(!investigationSubmitted || isEditingInvestigation) && (
                          <button className="subcard-remove" style={{ color: "var(--color-risk)", background: "transparent", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }} onClick={() => removeInvWitness(i)}>Remove</button>
                        )}
                      </div>
                      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div className="mod-form-group"><label className="mod-form-label">Name</label><input className="mod-form-input" value={w.name} onChange={e => updateInvWitness(i, 'name', e.target.value)} /></div>
                        <div className="mod-form-group"><label className="mod-form-label">Badge No.</label><input className="mod-form-input" value={w.badge} onChange={e => updateInvWitness(i, 'badge', e.target.value)} /></div>
                        <div className="mod-form-group"><label className="mod-form-label">Employer</label><input className="mod-form-input" value={w.employer} onChange={e => updateInvWitness(i, 'employer', e.target.value)} /></div>
                        <div className="mod-form-group"><label className="mod-form-label">Occupation</label><input className="mod-form-input" value={w.occupation} onChange={e => updateInvWitness(i, 'occupation', e.target.value)} /></div>
                      </div>
                      <div className="mod-form-group" style={{ marginTop: 12 }}><label className="mod-form-label">Brief description of the incident</label><textarea className="mod-form-textarea" value={w.desc} onChange={e => updateInvWitness(i, 'desc', e.target.value)}></textarea></div>
                    </div>
                  ))}
                </div>

                {/* 4. Fishbone Analysis */}
                <div className="fsec"><div className="fsec-title">4. Fishbone Analysis ΓÇô Cause and Effect</div>
                  <div className="fsec-note">Interactive Ishikawa diagram. Add causes under the six categories ΓÇô People, Machine / Equipment, Method / Procedure, Materials, Environmental Conditions, Measurement.</div>
                  {renderFishboneSvg()}
                  <div className="fsec-note" style={{ marginTop: 12, padding: "12px", background: "var(--bg-dark)", borderRadius: 8 }}>
                    <b>Tick the box on any cause</b> ΓÇô in whichever categories you choose ΓÇô to carry it into the 5 Whys analysis below. Scoring (1 Low ΓÇô 5 High) is optional.
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
                    {FISHBONE_CATS.map(cat => (
                      <div key={cat.key} style={{ borderTop: `4px solid ${cat.color}`, background: "var(--bg-card, #fff)", border: "1px solid var(--border-color)", borderTopColor: cat.color, padding: 16, borderRadius: 8, overflow: "hidden", boxShadow: "var(--shadow-sm, 0 2px 4px rgba(0,0,0,0.02))" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)", marginBottom: 2 }}>{cat.label}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>{cat.hint}</div>
                        {(!investigationSubmitted || isEditingInvestigation) && (
                          <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "stretch" }}>
                            <input
                              placeholder="Add cause..."
                              value={fishboneInput[cat.key]}
                              onChange={e => setFishboneInput({ ...fishboneInput, [cat.key]: e.target.value })}
                              onKeyDown={e => e.key === 'Enter' && addFishboneCause(cat.key)}
                              style={{ flex: 1, padding: "10px 12px", fontSize: 13, border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 6, background: "var(--bg-dark, #fff)", outline: "none", color: "var(--text-main)" }}
                            />
                            <button
                              style={{ background: "var(--accent-primary, #0f172a)", border: "none", color: "#fff", padding: "0 16px", borderRadius: 6, cursor: "pointer", fontSize: 18, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center" }}
                              onClick={() => addFishboneCause(cat.key)}
                            >+</button>
                          </div>
                        )}
                        {fishbone[cat.key].map((cause, i) => (
                          <div key={i} style={{ border: "1px solid var(--border-color)", padding: 12, borderRadius: 8, marginBottom: 10, background: cause.probable ? "var(--color-risk-bg, #fff1f2)" : "var(--bg-dark, #fff)", borderColor: cause.probable ? "var(--color-risk, #f43f5e)" : "var(--border-color, #e2e8f0)" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <input type="checkbox" checked={cause.probable} onChange={() => toggleFishboneProbable(cat.key, i)} style={{ marginTop: 2, accentColor: "var(--color-risk, #e11d48)", width: 16, height: 16, cursor: "pointer" }} />
                              <span style={{ flex: 1, fontSize: 13, color: "var(--text-main)", lineHeight: 1.4 }}>{cause.text}</span>
                              {(!investigationSubmitted || isEditingInvestigation) && (
                                <button style={{ background: "var(--color-gray-bg, #f1f5f9)", border: "none", color: "var(--text-muted, #64748b)", cursor: "pointer", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }} onClick={() => removeFishboneCause(cat.key, i)}>├ù</button>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center" }}>
                              <span style={{ fontSize: 12, color: "var(--text-muted)", marginRight: 4 }}>Score:</span>
                              {[1, 2, 3, 4, 5].map(s => (
                                <button
                                  key={s}
                                  style={{
                                    width: 26, height: 26, padding: 0,
                                    border: `1px solid ${cause.score === s ? 'var(--accent-primary, #0f172a)' : 'var(--border-color, #e2e8f0)'}`,
                                    background: cause.score === s ? 'var(--accent-primary, #0f172a)' : 'var(--bg-card, #fff)',
                                    color: cause.score === s ? '#fff' : 'var(--text-muted, #64748b)',
                                    borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600
                                  }}
                                  onClick={() => setFishboneScore(cat.key, i, s)}
                                >{s}</button>
                              ))}
                            </div>
                            {cause.probable && (
                              <div style={{ marginTop: 12 }}>
                                <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "var(--color-risk, #e11d48)", padding: "4px 10px", borderRadius: 12, letterSpacing: "0.5px" }}>SELECTED FOR 5 WHYS</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Effect Description */}
                <div className="fsec"><div className="fsec-title">5. Effect Description</div>
                  <div className="mod-form-group">
                    <label className="mod-form-label" style={{ textTransform: "none", letterSpacing: "normal" }}>Describe the effect/outcome of the incident for the fishbone diagram</label>
                    <textarea className="mod-form-textarea" placeholder="Describe the effect / incident event..." value={invEffect} onChange={e => setInvEffect(e.target.value)}></textarea>
                  </div>
                </div>

                {/* 6. Problem Statement */}
                <div className="fsec"><div className="fsec-title">6. Problem Statement</div>
                  <div className="mod-form-group">
                    <label className="mod-form-label" style={{ textTransform: "none", letterSpacing: "normal" }}>Clearly state the problem being investigated</label>
                    <textarea className="mod-form-textarea" placeholder="State the problem..." value={invProblem} onChange={e => setInvProblem(e.target.value)}></textarea>
                  </div>
                </div>

                {/* 7. Probable Causes Banner */}
                <div className="fsec">
                  <div style={{ background: "rgba(227,43,80,0.06)", border: "1px solid rgba(227,43,80,0.35)", padding: 16, borderRadius: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-risk)" }}>Causes Selected for 5 Whys ({getProbableCauses().length})</div>
                    {getProbableCauses().length === 0 ? (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>No causes selected yet. Tick any cause above ΓÇô in any category ΓÇô to analyse it.</div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                        {getProbableCauses().map(c => (
                          <span key={c.id} style={{ display: "inline-flex", background: "var(--bg-card)", border: "1px solid var(--color-risk)", color: "var(--color-risk)", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{c.text} (Score: {c.score || '-'})</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 8. 5-Whys Analysis */}
                <div className="fsec"><div className="fsec-title">8. 5-Whys Root Cause Analysis</div>
                  {getProbableCauses().length === 0 ? (
                    <div className="muted-empty" style={{ fontStyle: "italic", fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>Tick the causes you want to analyse in the fishbone above to begin the 5-Whys analysis.</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {getProbableCauses().map(c => {
                        const whys = fiveWhys[c.id] || [];
                        return (
                          <div key={c.id} style={{ border: "1px solid var(--border-color)", padding: 16, borderRadius: 8, background: "var(--bg-card)" }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)", paddingBottom: 8, marginBottom: 12 }}>CAUSE: {c.text}</div>
                            {[0, 1, 2, 3, 4].map(w => (
                              <div key={w} className="mod-form-group" style={{ marginBottom: 12 }}>
                                <label className="mod-form-label">Why {w + 1}</label>
                                <input className="mod-form-input" value={whys[w] || ""} onChange={e => {
                                  const newW = [...whys];
                                  newW[w] = e.target.value;
                                  setFiveWhys({ ...fiveWhys, [c.id]: newW });
                                }} />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 9. Root Causes */}
                <div className="fsec"><div className="fsec-title" style={{ justifyContent: "space-between", display: "flex" }}>
                  <span>9. Identified Root Causes</span>
                  {(!investigationSubmitted || isEditingInvestigation) && (
                    <button className="mod-btn-outline" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={addInvRootCause}>+ Add Root Cause</button>
                  )}
                </div>
                  {invRootCauses.length === 0 ? <div className="muted-empty" style={{ fontStyle: "italic", fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>No root causes added yet.</div> : invRootCauses.map((rc, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <span style={{ fontWeight: 700, color: "var(--accent-primary)", width: 24 }}>{i + 1}.</span>
                      <input className="mod-form-input" style={{ flex: 1 }} value={rc} onChange={e => updateInvRootCause(i, e.target.value)} />
                      {(!investigationSubmitted || isEditingInvestigation) && (
                        <button className="subcard-remove" style={{ color: "var(--color-risk)", background: "transparent", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }} onClick={() => removeInvRootCause(i)}>Remove</button>
                      )}
                    </div>
                  ))}
                </div>

                {/* 10. Contributing Factors */}
                <div className="fsec"><div className="fsec-title" style={{ justifyContent: "space-between", display: "flex" }}>
                  <span>10. Contributing Factors</span>
                  {(!investigationSubmitted || isEditingInvestigation) && (
                    <button className="mod-btn-outline" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={addInvFactor}>+ Add Factor</button>
                  )}
                </div>
                  <div className="fsec-note">e.g. Human Factor, Environmental Factor, Procedural Factor</div>
                  {invFactors.length === 0 ? <div className="muted-empty" style={{ fontStyle: "italic", fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>No contributing factors added yet.</div> : invFactors.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <span style={{ fontWeight: 700, color: "var(--accent-primary)", width: 24 }}>{i + 1}.</span>
                      <input className="mod-form-input" style={{ flex: 1 }} value={f} onChange={e => updateInvFactor(i, e.target.value)} />
                      {(!investigationSubmitted || isEditingInvestigation) && (
                        <button className="subcard-remove" style={{ color: "var(--color-risk)", background: "transparent", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }} onClick={() => removeInvFactor(i)}>Remove</button>
                      )}
                    </div>
                  ))}
                </div>

                {/* 11. Severity Assessment */}
                <div className="fsec"><div className="fsec-title">11. Severity Assessment</div>
                  <div className="fsec-note">Assess the consequence severity (1 ΓÇô 5) using the Severity Table. Record the severity before and after the corrective actions.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Severity Before Corrective Actions</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {SEVERITY_SCALE.map(s => (
                          <button key={s.level} style={{ flex: 1, padding: "12px 0", background: s.color, color: "#fff", border: `2px solid ${invPreSev === s.level ? '#131E40' : 'transparent'}`, borderRadius: 8, opacity: invPreSev && invPreSev !== s.level ? 0.5 : 1, cursor: "pointer", boxShadow: invPreSev === s.level ? "0 0 0 2px rgba(19,30,64,0.55)" : "none" }} onClick={() => setInvPreSev(s.level)}>
                            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{s.level}</div>
                            <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 4 }}>{s.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Severity After Corrective Actions</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {SEVERITY_SCALE.map(s => (
                          <button key={s.level} style={{ flex: 1, padding: "12px 0", background: s.color, color: "#fff", border: `2px solid ${invPostSev === s.level ? '#131E40' : 'transparent'}`, borderRadius: 8, opacity: invPostSev && invPostSev !== s.level ? 0.5 : 1, cursor: "pointer", boxShadow: invPostSev === s.level ? "0 0 0 2px rgba(19,30,64,0.55)" : "none" }} onClick={() => setInvPostSev(s.level)}>
                            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{s.level}</div>
                            <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 4 }}>{s.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {invPreSev && invPostSev && (
                    <div style={{ marginTop: 16, background: "var(--color-safe-bg, rgba(123,190,151,0.1))", border: "1px solid var(--color-safe, rgba(123,190,151,0.5))", padding: 12, borderRadius: 8, color: "var(--color-safe, #2D7A4F)", fontWeight: 700 }}>
                      Severity Reduction: {invPreSev} ({SEVERITY_SCALE.find(s => s.level === invPreSev)?.label}) ΓåÆ {invPostSev} ({SEVERITY_SCALE.find(s => s.level === invPostSev)?.label})
                    </div>
                  )}
                </div>

                {/* 12. Corrective Actions */}
                <div className="fsec"><div className="fsec-title" style={{ justifyContent: "space-between", display: "flex" }}>
                  <span>12. Corrective Actions</span>
                  <button className="mod-btn-outline" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={addInvCorrective}>+ Add Corrective Action</button>
                </div>
                  {invCorrective.length === 0 ? <div className="muted-empty" style={{ fontStyle: "italic", fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>No corrective actions added yet.</div> : invCorrective.map((c, i) => (
                    <div key={i} className="subcard" style={{ border: "1px solid var(--border-color)", padding: 16, borderRadius: 8, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>Action #{i + 1}</span>
                        <button className="subcard-remove" style={{ color: "var(--color-risk)", background: "transparent", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }} onClick={() => removeInvCorrective(i)}>Remove</button>
                      </div>
                      <div className="mod-form-group"><label className="mod-form-label">Description</label><textarea className="mod-form-textarea" value={c.desc} onChange={e => updateInvCorrective(i, 'desc', e.target.value)}></textarea></div>
                      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                        <div className="mod-form-group"><label className="mod-form-label">Responsible Person</label><input className="mod-form-input" value={c.resp} onChange={e => updateInvCorrective(i, 'resp', e.target.value)} /></div>
                        <div className="mod-form-group"><label className="mod-form-label">Deadline</label><input type="date" className="mod-form-input" value={c.deadline} onChange={e => updateInvCorrective(i, 'deadline', e.target.value)} /></div>
                      </div>
                      <div className="mod-form-group" style={{ marginTop: 12 }}><label className="mod-form-label">Priority</label>
                        <select className="mod-form-select" value={c.priority} onChange={e => updateInvCorrective(i, 'priority', e.target.value)}>
                          <option value="">Select...</option>
                          <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Investigation Env / Property Damage Section */}
                {(() => {
                  const allIncidentCats = [
                    ...(incident?.categories || []),
                    ...(headsUpData?.categories || []),
                    ...(irCategories || []),
                    incident?.category || ""
                  ].map(c => String(c).toLowerCase());

                  const isEnvIncident = allIncidentCats.some(c => c.includes("environment"));
                  const isPropDamageIncident = allIncidentCats.some(c => c.includes("property"));

                  if (isEnvIncident) {
                    return (
                      <div className="fsec">
                        <div className="fsec-title">Environmental Remediation & Waste Management</div>
                        <div className="mod-form-group" style={{ marginBottom: 12 }}>
                          <label className="mod-form-label">Remediation & Site Cleanup Plan</label>
                          <textarea className="mod-form-textarea" placeholder="Detail environmental remediation, soil testing, ground clearance..." value={invEnvRemediation} onChange={e => setInvEnvRemediation(e.target.value)}></textarea>
                        </div>
                        <div className="grid-2">
                          <div className="mod-form-group">
                            <label className="mod-form-label">Waste Disposal Contractor / Invoice Ref</label>
                            <input className="mod-form-input" placeholder="e.g. Hazardous Waste Contractor ref / manifest #" value={invEnvWasteDisposal} onChange={e => setInvEnvWasteDisposal(e.target.value)} />
                          </div>
                          <div className="mod-form-group">
                            <label className="mod-form-label">Environmental Regulatory Notification</label>
                            <input className="mod-form-input" placeholder="e.g. Logged internally / EPA notifiable status" value={invEnvRegNotification} onChange={e => setInvEnvRegNotification(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (isPropDamageIncident) {
                    return (
                      <div className="fsec">
                        <div className="fsec-title">Property Damage Loss Assessment & Safeguards</div>
                        <div className="mod-form-group" style={{ marginBottom: 12 }}>
                          <label className="mod-form-label">Root Damage & Loss Assessment</label>
                          <textarea className="mod-form-textarea" placeholder="Detail inspection report and technical root assessment of property..." value={invPropLossAssessment} onChange={e => setInvPropLossAssessment(e.target.value)}></textarea>
                        </div>
                        <div className="grid-2">
                          <div className="mod-form-group">
                            <label className="mod-form-label">Insurance Claim & Recovery Status</label>
                            <input className="mod-form-input" placeholder="e.g. Claim # filed / quotation approved" value={invPropInsuranceClaim} onChange={e => setInvPropInsuranceClaim(e.target.value)} />
                          </div>
                          <div className="mod-form-group">
                            <label className="mod-form-label">Preventive Machinery & Plant Controls</label>
                            <input className="mod-form-input" placeholder="e.g. Added physical bollards / updated inspection" value={invPropPreventiveSafeguards} onChange={e => setInvPropPreventiveSafeguards(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* 13. Lessons Learned & Prevention */}
                <div className="fsec"><div className="fsec-title">13. Lessons Learned & Prevention</div>
                  <div className="mod-form-group" style={{ marginBottom: 16 }}><label className="mod-form-label" style={{ textTransform: "none", letterSpacing: "normal" }}>What was learned from this incident...</label>
                    <textarea className="mod-form-textarea" value={invLessons} onChange={e => setInvLessons(e.target.value)}></textarea>
                  </div>
                  <div className="mod-form-group"><label className="mod-form-label" style={{ textTransform: "none", letterSpacing: "normal" }}>Measures to prevent recurrence...</label>
                    <textarea className="mod-form-textarea" value={invPrevention} onChange={e => setInvPrevention(e.target.value)}></textarea>
                  </div>
                </div>

                {/* 14. Photos */}
                <div className="fsec"><div className="fsec-title">14. Photos from the incident location</div>
                  <div className="fsec-note">Minimum of 2 photos. For environmental incidents, include one photo before the spill is contained/treated and one after.</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <button className="mod-btn-outline" style={{ fontSize: 13 }} onClick={startInvCamera}>Take Photo</button>
                    <button className="mod-btn-outline" style={{ fontSize: 13 }} onClick={() => invFileInputRef.current?.click()}>Upload File</button>
                    <input type="file" ref={invFileInputRef} accept="image/*" multiple style={{ display: "none" }} onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      Array.from(files).forEach(f => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (invPhotos.length < 20) setInvPhotos(prev => [...prev, ev.target.result]);
                        };
                        reader.readAsDataURL(f);
                      });
                      e.target.value = '';
                    }} />
                  </div>
                  {isInvCameraActive && (
                    <div className="cam-wrap" style={{ marginTop: 12 }}>
                      <video ref={invVideoRef} autoPlay playsInline style={{ width: "100%", maxWidth: 420, borderRadius: 8, background: "#000" }}></video>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button className="mod-btn-primary im-btn-primary" style={{ padding: "4px 12px", fontSize: 13 }} onClick={() => {
                          const v = invVideoRef.current;
                          const c = invCanvasRef.current;
                          if (!v || !c) return;
                          const w = v.videoWidth || 640, h = v.videoHeight || 480;
                          c.width = w; c.height = h;
                          c.getContext('2d').drawImage(v, 0, 0, w, h);
                          const data = c.toDataURL('image/jpeg', 0.8);
                          if (invPhotos.length < 20) setInvPhotos([...invPhotos, data]);
                        }}>Capture</button>
                        <button className="mod-btn-outline" style={{ padding: "4px 12px", fontSize: 13 }} onClick={() => {
                          setIsInvCameraActive(false);
                          if (invStreamRef.current) {
                            invStreamRef.current.getTracks().forEach(t => t.stop());
                            invStreamRef.current = null;
                          }
                        }}>Stop Camera</button>
                      </div>
                      <canvas ref={invCanvasRef} style={{ display: "none" }}></canvas>
                    </div>
                  )}
                  <div className="photo-count" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>{invPhotos.length}/20 photos</div>
                  <div className="photo-grid" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                    {invPhotos.map((p, i) => (
                      <div key={i} className="photo-thumb" style={{ position: "relative", width: 96, height: 96, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-color)", background: "var(--bg-dark)" }}>
                        <img src={p} alt={`photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", border: "none", background: "var(--color-risk)", color: "#fff", cursor: "pointer", fontSize: 12, lineHeight: 1 }} onClick={() => setInvPhotos(invPhotos.filter((_, idx) => idx !== i))}>├ù</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 15. Mandatory Attachments */}
                <div className="fsec">
                  <div className="fsec-title">15. Mandatory Attachments</div>
                  <div className="fsec-note">Check required attachments and select documents or photos to attach. Attached files will be automatically appended to the official export PDF.</div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                    {invAttachments.map((item, i) => {
                      const isEditable = !investigationSubmitted || isEditingInvestigation;
                      const fileExt = item.fileName ? item.fileName.split('.').pop()?.toUpperCase() : '';

                      return (
                        <div key={item.key} style={{ border: `1px solid ${item.checked ? '#93c5fd' : 'var(--border-color)'}`, borderRadius: 8, padding: '12px 16px', background: item.checked ? 'rgba(59, 130, 246, 0.03)' : 'var(--bg-card, #fff)', transition: 'all 0.15s ease' }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                            <label className="chk" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: item.checked ? 600 : 500, color: "var(--text-main)", cursor: isEditable ? "pointer" : "default" }}>
                              <input
                                type="checkbox"
                                checked={item.checked}
                                disabled={!isEditable}
                                onChange={e => {
                                  const updated = [...invAttachments];
                                  updated[i] = {
                                    ...updated[i],
                                    checked: e.target.checked
                                  };
                                  setInvAttachments(updated);
                                }}
                              />
                              <span>{item.label}</span>
                            </label>

                            {/* Uploaded File Chip / Link */}
                            {item.fileUrl && (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f1f5f9", padding: "4px 10px", borderRadius: 6, border: "1px solid #cbd5e1" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: fileExt === 'PDF' ? '#ef4444' : '#3b82f6', color: '#fff' }}>
                                  {fileExt || 'FILE'}
                                </span>
                                <a
                                  href={getAttachmentUrl(item.fileUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", textDecoration: "none", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                  title={`Open ${item.fileName}`}
                                >
                                  {item.fileName || "Attached File"}
                                </a>
                                {isEditable && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...invAttachments];
                                      updated[i] = {
                                        ...updated[i],
                                        fileName: "",
                                        fileUrl: "",
                                        fileSize: 0,
                                        fileType: ""
                                      };
                                      setInvAttachments(updated);
                                    }}
                                    style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 2px" }}
                                    title="Remove attached file"
                                  >
                                    Γ£ò
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* File Selection / Upload Box when Checked and Editable */}
                          {item.checked && isEditable && (
                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #e2e8f0", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                              <label style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                background: item.fileUrl ? "#f8fafc" : "#2563eb",
                                color: item.fileUrl ? "#334155" : "#ffffff",
                                border: item.fileUrl ? "1px solid #cbd5e1" : "none",
                                padding: "6px 14px",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: item.uploading ? "wait" : "pointer",
                                boxShadow: item.fileUrl ? "none" : "0 1px 3px rgba(0,0,0,0.15)"
                              }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="17 8 12 3 7 8"></polyline>
                                  <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                                {item.uploading ? "Uploading..." : item.fileUrl ? "Replace File" : "Select Document / Photo"}
                                <input
                                  type="file"
                                  style={{ display: "none" }}
                                  disabled={item.uploading}
                                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xlsx"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      const updatedUploading = [...invAttachments];
                                      updatedUploading[i] = { ...updatedUploading[i], uploading: true };
                                      setInvAttachments(updatedUploading);
                                      
                                      const res = await uploadIncidentAttachment(file);
                                      const fileUrl = res.url || res.data?.url;
                                      const fileName = res.fileName || file.name;
                                      const fileSize = res.fileSize || file.size;
                                      const mimeType = res.mimeType || file.type;

                                      setInvAttachments(prev => {
                                        const next = [...prev];
                                        next[i] = {
                                          ...next[i],
                                          uploading: false,
                                          checked: true,
                                          fileName,
                                          fileUrl,
                                          fileSize,
                                          fileType: mimeType
                                        };
                                        return next;
                                      });
                                      showSuccess(`Attached ${fileName} successfully!`);
                                    } catch (err) {
                                      console.error("Failed to upload attachment file:", err);
                                      showError("Failed to upload attachment. Please try again.");
                                      setInvAttachments(prev => {
                                        const next = [...prev];
                                        next[i] = { ...next[i], uploading: false };
                                        return next;
                                      });
                                    }
                                  }}
                                />
                              </label>
                              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                {item.fileUrl ? `Attached: ${item.fileName} (${item.fileSize ? Math.round(item.fileSize / 1024) + ' KB' : 'Saved'})` : "Supports PDF, JPG, PNG, WEBP, DOCX"}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mod-form-group"><label className="mod-form-label" style={{ textTransform: "none", letterSpacing: "normal" }}>Explanation for missing attachments</label>
                    <textarea className="mod-form-textarea" placeholder="Explain any missing mandatory attachments..." value={invMissingExplain} onChange={e => setInvMissingExplain(e.target.value)}></textarea>
                  </div>
                </div>


                {/* 17. Signature */}
                <div className="fsec"><div className="fsec-title">17. Signatures & Sign-Off</div>
                  <div className="fsec-note">The Site HSE Investigator signs the completed report. It then routes to the reviewer (always Site HSE) for sign-off in the next step.</div>

                  {investigationData?.signatures && Array.isArray(investigationData.signatures) && investigationData.signatures.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-main)", marginBottom: 12 }}>Submitted Investigation Signatures ({investigationData.signatures.length})</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                        {investigationData.signatures.map((sig, idx) => {
                          const sigUrl = getSignatureUrl(sig.signature);
                          return (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: "var(--bg-card, #fff)", borderRadius: 8, border: "1px solid var(--border-color)", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", width: "320px", flexShrink: 0 }}>
                              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#ec48991a", color: "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                                {sig.name ? sig.name.substring(0, 2).toUpperCase() : "SIG"}
                              </div>
                              <div style={{ flex: 1, borderLeft: "1px solid var(--border-color)", paddingLeft: 16, display: "flex", flexDirection: "column" }}>
                                <div style={{ height: 50, display: "flex", alignItems: "center", marginBottom: 4 }}>
                                  {sigUrl ? (
                                    <img
                                      className="signature-img"
                                      src={sigUrl}
                                      alt="Signature"
                                      style={{ maxHeight: "100%", maxWidth: "220px", objectFit: "contain" }}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div style={{ fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: 18, color: "var(--text-main)", fontWeight: 700 }}>
                                      {sig.name || "Signed"}
                                    </div>
                                  )}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{sig.name}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sig.role} {sig.date ? `ΓÇó ${sig.date}` : ""}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(isEditingInvestigation && investigationSubmitted) ? (
                    <div style={{ border: "1px dashed #f59e0b", borderRadius: 8, padding: "16px", background: "var(--bg-dark)", maxWidth: 540, marginTop: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: "#d97706", display: "flex", alignItems: "center", gap: 8 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Editor Information & Revision Signature
                      </div>
                      <div className="mod-form-group" style={{ marginBottom: 12 }}>
                        <label className="mod-form-label">Edited By (Name) *</label>
                        <input className="mod-form-input" value={invEditorName} onChange={e => setInvEditorName(e.target.value)} />
                      </div>
                      <div className="mod-form-group" style={{ marginBottom: 12 }}>
                        <label className="mod-form-label">Reason for Revision / What was edited *</label>
                        <textarea className="mod-form-textarea" rows="2" placeholder="Briefly state what details were modified in this revision..." value={invEditReason} onChange={e => setInvEditReason(e.target.value)} />
                      </div>
                      <div className="mod-form-group">
                        <label className="mod-form-label">Editor Digital Signature *</label>
                        <SignaturePad value={invEditorSignature} onChange={setInvEditorSignature} onClear={() => setInvEditorSignature(false)} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: "1px dashed var(--border-color)", borderRadius: 8, padding: "16px", background: "var(--bg-dark)", maxWidth: 520 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Site HSE Investigator</div>
                      <div className="mod-form-group" style={{ marginBottom: 12 }}><label className="mod-form-label">Name</label><input className="mod-form-input" value={invInvName} onChange={e => setInvInvName(e.target.value)} /></div>
                      <div className="mod-form-group" style={{ marginBottom: 12 }}><label className="mod-form-label">Role</label><input className="mod-form-input" value={invInvRole} onChange={e => setInvInvRole(e.target.value)} /></div>
                      <div className="mod-form-group" style={{ marginBottom: 12 }}><label className="mod-form-label">Date</label><input type="date" className="mod-form-input" value={invInvDate} onChange={e => setInvInvDate(e.target.value)} /></div>
                      <div className="mod-form-group">
                        <label className="mod-form-label">Investigator Signature</label>
                        <SignaturePad value={invInvSignature} onChange={setInvInvSignature} onClear={() => setInvInvSignature(false)} />
                      </div>
                      <div className="markok" onClick={() => setInvInvMarkedOk(!invInvMarkedOk)} style={{ borderColor: invInvMarkedOk ? "var(--color-safe)" : "var(--border-color)", opacity: invInvMarkedOk ? 1 : 0.7, marginTop: 16 }}>
                        <input type="checkbox" checked={invInvMarkedOk} onChange={() => { }} />
                        <div>
                          <div className="mk-t">Marked OK</div>
                          <div className="mk-s">Confirmed by investigator.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="fsec">
                  {(!investigationSubmitted || isEditingInvestigation) && !isClosed && (
                    <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                    <button className="mod-btn-primary im-btn-primary" onClick={async () => {
                      try {
                        const fishboneDataPayload = Object.keys(fishbone).map(catKey => ({
                          category: catKey,
                          causes: (fishbone[catKey] || []).map(c => ({
                            causeText: c.text || "",
                            score: c.score ? Number(c.score) : 0,
                            isSelectedForFiveWhys: c.probable || false
                          }))
                        }));

                        const fiveWhysDataPayload = getProbableCauses().map(c => {
                          const whys = fiveWhys[c.id] || [];
                          return {
                            fishboneCauseText: c.text || "",
                            why1: whys[0] || "",
                            why2: whys[1] || "",
                            why3: whys[2] || "",
                            why4: whys[3] || "",
                            why5: whys[4] || "",
                            rootCauseSummary: ""
                          };
                        });

                        const userName = invInvName || getLoggedInUser() || "Investigator";
                        const payload = {
                          investigationDetails: invDetails,
                          problemStatement: invProblem,
                          effectDescription: invEffect,
                          effect: invEffect,
                          lessonsLearned: invLessons,
                          preventativeMeasures: invPrevention,
                          preSeverity: invPreSev,
                          postSeverity: invPostSev,
                          severityBefore: invPreSev,
                          severityAfter: invPostSev,
                          team: invTeam,
                          witnesses: invWitnesses,
                          fishboneData: fishboneDataPayload,
                          fiveWhysData: fiveWhysDataPayload,
                          rootCauses: invRootCauses,
                          contributingFactors: invFactors,
                          mandatoryAttachments: {
                            contractorsIncidentReport: invAttachments.find(a => a.key === "contractorsIncidentReport") || { checked: false },
                            witnessStatement: invAttachments.find(a => a.key === "witnessStatement") || { checked: false },
                            rams: invAttachments.find(a => a.key === "rams") || { checked: false },
                            trainingRecords: invAttachments.find(a => a.key === "trainingRecords") || { checked: false },
                            permitsToWork: invAttachments.find(a => a.key === "permitsToWork") || { checked: false },
                            permitToWork: invAttachments.find(a => a.key === "permitsToWork") || { checked: false },
                            ptw: invAttachments.find(a => a.key === "permitsToWork") || { checked: false },
                            safePlanOfAction: invAttachments.find(a => a.key === "safePlanOfAction") || { checked: false },
                            photos: invAttachments.find(a => a.key === "photos") || { checked: false },
                            evidenceForActionsTaken: invAttachments.find(a => a.key === "evidenceForActionsTaken") || { checked: false },
                            wasteDisposalInvoice: invAttachments.find(a => a.key === "wasteDisposalInvoice") || { checked: false },
                            items: invAttachments.filter(a => a.checked || a.fileUrl),
                            missingExplanation: invMissingExplain
                          },
                          ...((isEditingInvestigation && investigationSubmitted) ? {
                            editedBy: invEditorName || getLoggedInUser(),
                            editorRole: invEditorRole || "HSE Investigator / Editor",
                            editReason: invEditReason || "Updated Investigation Report",
                            editorSignature: invEditorSignature,
                          } : {
                            signatures: [
                              {
                                role: invInvRole || "Site HSE Investigator",
                                name: invInvName || userName,
                                signature: invInvSignature,
                                date: invInvDate || new Date().toISOString().split('T')[0]
                              }
                            ]
                          }),
                          environmentalDetails: {
                            remediationPlan: invEnvRemediation,
                            wasteDisposal: invEnvWasteDisposal,
                            regulatoryNotification: invEnvRegNotification
                          },
                          propertyDamageDetails: {
                            lossAssessment: invPropLossAssessment,
                            insuranceClaim: invPropInsuranceClaim,
                            preventiveSafeguards: invPropPreventiveSafeguards
                          },
                          correctiveActions: invCorrective.map(c => ({
                            action: c.desc || c.action || c.description || "",
                            responsible: c.resp || c.responsible || "",
                            targetDate: c.deadline || c.targetDate || c.date || "",
                            priority: c.priority || "Medium",
                            status: c.status || "PENDING",
                            actionType: "CORRECTIVE"
                          })),
                          actionItems: invCorrective.map(c => ({
                            action: c.desc || c.action || c.description || "",
                            responsible: c.resp || c.responsible || "",
                            targetDate: c.deadline || c.targetDate || c.date || "",
                            priority: c.priority || "Medium",
                            status: c.status || "PENDING",
                            actionType: "CORRECTIVE"
                          }))
                        };
                        await saveInvestigation(id, payload);
                        await Swal.fire({ title: "Success!", text: (isEditingInvestigation && investigationSubmitted) ? "Investigation Report Updated Successfully!" : "Investigation Report Submitted!", icon: "success", confirmButtonColor: "#0f172a" });
                        setIsEditingInvestigation(false);
                        setInvestigationSubmitted(true);
                        window.scrollTo(0, 0);
                        const data = await getIncidentById(id);
                        setRawIncident(data?.data || data);
                        await loadActions();
                      } catch (err) {
                        console.error("Failed to submit investigation", err);
                      }
                    }}>{(isEditingInvestigation && investigationSubmitted) ? "Update Investigation Report" : "Submit Investigation Report"}</button>
                    {(isEditingInvestigation && investigationSubmitted) && (
                      <button type="button" className="mod-btn-outline" onClick={() => setIsEditingInvestigation(false)}>Cancel Edit</button>
                    )}
                  </div>
                )}
                </div>
                </fieldset>

                {/* Review & Sign-Off Section if submitted and pending approval */}
                {investigationSubmitted && !investigationApproved && !isClosed && !isContractorUser() && (
                  <div className="mod-card mb-4" style={{ marginTop: 24, borderTop: "3px solid var(--accent-primary, #3b82f6)" }}>
                    <div className="mod-card-header">
                      <span className="mod-card-title">Review & Sign-Off: Investigation Report {incident.id}</span>
                    </div>
                    <div className="mod-card-body">
                      <div className="mod-form-group">
                        <label className="mod-form-label">Review Comments / Revision Reason</label>
                        <textarea
                          className="mod-form-textarea"
                          placeholder="Add review comments or specify reasons for revision..."
                          rows="3"
                          value={invReviewComments}
                          onChange={(e) => setInvReviewComments(e.target.value)}
                        />
                      </div>
                      <div className="mod-form-group" style={{ marginTop: 16 }}>
                        <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Reviewer Name</label>
                        <input type="text" className="mod-form-input" placeholder="Type your full name" value={invReviewerName} onChange={(e) => setInvReviewerName(e.target.value)} />
                      </div>
                      <div className="mod-form-group" style={{ marginTop: 16 }}>
                        <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Reviewer Role</label>
                        <input type="text" className="mod-form-input" placeholder="e.g. Lead Reviewer" value={invReviewerRole} onChange={(e) => setInvReviewerRole(e.target.value)} />
                      </div>
                      <div className="mod-form-group" style={{ marginTop: 16 }}>
                        <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Digital Signature</label>
                        <SignaturePad value={invRevSignature} onChange={setInvRevSignature} onClear={() => setInvRevSignature(false)} />
                      </div>
                      <div className="markok" onClick={() => setInvRevMarkedOk(!invRevMarkedOk)} style={{ borderColor: invRevMarkedOk ? "var(--color-safe)" : "var(--border-color)", opacity: invRevMarkedOk ? 1 : 0.7 }}>
                        <input type="checkbox" checked={invRevMarkedOk} onChange={() => { }} />
                        <div>
                          <div className="mk-t">Marked OK</div>
                          <div className="mk-s">I have reviewed this report and confirm it is complete and accurate.</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                        <button
                          type="button"
                          className="mod-btn-outline"
                          style={{ color: "var(--color-risk)", borderColor: "var(--color-risk-bg)" }}
                          disabled={isReturningRevision}
                          onClick={() => handleReturnForRevision("INVESTIGATION")}
                        >
                          {isReturningRevision ? "Returning..." : "Return for Revision"}
                        </button>
                        <button className="mod-btn-primary im-btn-primary" disabled={!invRevMarkedOk || !invRevSignature || !invReviewerName || !invReviewerRole} onClick={async () => {
                          try {
                            const userName = invReviewerName || getLoggedInUser();
                            await reviewInvestigation(id, {
                              approvedBy: userName,
                              approverRole: invReviewerRole || "Project HSE Lead",
                              signature: invRevSignature
                            });
                            showSuccess("Investigation Report Signed Off!");
                            setInvestigationApproved(true);
                            setActiveTab("actions");
                            const data = await getIncidentById(id);
                            setRawIncident(data?.data || data);
                          } catch (err) {
                            console.error("Failed to sign off investigation", err);
                            const msg = err.response?.data?.message || err.message || "Failed to sign off investigation";
                            showError(Array.isArray(msg) ? msg[0] : msg);
                          }
                        }}>Approve & Sign Off</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Trail & Sign-off Log */}
                {investigationSubmitted && invAudit.length > 0 && (
                  <div className="mod-card mb-4" style={{ marginTop: 24 }}>
                    <div className="mod-card-header">
                      <span className="mod-card-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", color: "var(--text-main)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
                        </svg>
                        Audit Trail & Sign-Off Log
                      </span>
                    </div>
                    <div className="mod-card-body" style={{ padding: "24px 16px" }}>
                      <div style={{ position: "relative", paddingLeft: 16 }}>
                        <div style={{ position: "relative", paddingLeft: 16 }}>
                          {invAudit.map((step, i) => renderAuditCard(step, i, invAudit.length))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

        <div className={`inc-tab-panel ${activeTab === "immediateActions" ? "active" : ""}`}>
          {(() => {
            const list = [];
            // 1. Stage 1 (Heads-Up)
            (huImmActions || []).forEach(a => {
              if (a.action || a.responsible || a.time) {
                list.push({
                  action: a.action || a.description || "",
                  responsible: a.responsible || a.assignedTo || "",
                  date: a.date || huDate || "",
                  time: a.time || a.timeImplemented || "",
                  stage: "Stage 1 (Heads-Up)",
                  stageBadgeClass: "chip-inprogress"
                });
              }
            });

            // 2. Stage 2 (Initial Report)
            if (hasInitialReportData) {
              let irActs = rawIncident?.initialReport?.immediateActions || rawIncident?.initial_report?.immediateActions;
              if (typeof irActs === "string") {
                try { irActs = JSON.parse(irActs); } catch (e) { irActs = []; }
              }
              const irList = Array.isArray(irActs) && irActs.length > 0 ? irActs : (initialReportSubmitted ? immActions : []);
              (irList || []).forEach(a => {
                const actText = (a.action || a.description || "").trim();
                if (actText) {
                  const isDup = list.some(ex => ex.action.trim().toLowerCase() === actText.toLowerCase() && ex.time === (a.time || a.timeImplemented || ""));
                  if (!isDup) {
                    list.push({
                      action: actText,
                      responsible: a.responsible || a.assignedTo || "",
                      date: a.date || a.targetDate || "",
                      time: a.time || a.timeImplemented || "",
                      stage: "Stage 2 (Initial Report)",
                      stageBadgeClass: "chip-approved"
                    });
                  }
                }
              });
            }

            return (
              <div className="mod-card">
                <div className="mod-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <span className="mod-card-title">Immediate Actions</span>
                    <div style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Immediate containment and mitigation measures implemented for this incident.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "999px", background: "rgba(16, 185, 129, 0.12)", color: "#059669", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                      {list.length} {list.length === 1 ? "Action" : "Actions"}
                    </span>
                  </div>
                </div>

                <div className="mod-card-body">
                  {list.length === 0 ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", background: "var(--bg-dark, #f8fafc)", borderRadius: "8px", color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic" }}>
                      No immediate actions recorded yet for this incident.
                    </div>
                  ) : (
                    <div className="mod-table-wrap">
                      <table className="mod-table">
                        <thead>
                          <tr>
                            <th style={{ width: "40px" }}>#</th>
                            <th>Immediate Action</th>
                            <th>Stage Added</th>
                            <th>Responsible Person</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((a, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 700, color: "var(--text-muted)" }}>{idx + 1}</td>
                              <td>
                                <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                                  {a.action || "ΓÇö"}
                                </div>
                              </td>
                              <td>
                                <span className={`inv-chip ${a.stageBadgeClass}`} style={{ fontSize: "11px", fontWeight: 700 }}>
                                  {a.stage}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                                    {(a.responsible || "U").substring(0, 2).toUpperCase()}
                                  </div>
                                  <span style={{ fontSize: "13px" }}>{a.responsible || "ΓÇö"}</span>
                                </div>
                              </td>
                              <td style={{ fontSize: "13px" }}>{a.date || "ΓÇö"}</td>
                              <td style={{ fontSize: "13px" }}>
                                {a.time ? (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "var(--bg-dark, #f1f5f9)", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    {a.time}
                                  </span>
                                ) : "ΓÇö"}
                              </td>
                              <td>
                                <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: "#dcfce7", color: "#16a34a" }}>
                                  IMPLEMENTED
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}


                  {/* Specific Environmental & Property Damage Containment (only for Environmental or Property Damage incidents) */}
                  {(() => {
                    const allIncidentCats = (huCategories || [])
                      .concat(Array.isArray(incident?.categories) ? incident.categories : [incident?.category])
                      .concat(Array.isArray(headsUpData?.categories) ? headsUpData.categories : [headsUpData?.category])
                      .filter(Boolean)
                      .map(c => String(c).toLowerCase());
                    const isEnvIncident = allIncidentCats.some(c => c.includes("environment")) || Boolean(headsUpData?.isEnvironmental);
                    const isPropIncident = allIncidentCats.some(c => c.includes("property")) || Boolean(headsUpData?.isPropertyDamage);

                    const showEnv = isEnvIncident && Boolean(irEnvContainment);
                    const showProp = isPropIncident && Boolean(irPropImmediateAction);

                    if (!showEnv && !showProp) return null;

                    return (
                      <div style={{ marginTop: "20px", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px", background: "var(--bg-card, #fff)" }}>
                        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          Specific Containment Measures
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                          {showEnv && (
                            <div style={{ padding: "10px 14px", background: "#fef3c722", border: "1px solid #fde68a", borderRadius: "8px" }}>
                              <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#b45309", marginBottom: "4px" }}>
                                Environmental Spill Containment & Cleanup
                              </div>
                              <div style={{ fontSize: "13px", color: "var(--text-main)", lineHeight: 1.5 }}>
                                {irEnvContainment}
                              </div>
                            </div>
                          )}
                          {showProp && (
                            <div style={{ padding: "10px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px" }}>
                              <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                                Property & Asset Immediate Safeguards
                              </div>
                              <div style={{ fontSize: "13px", color: "var(--text-main)", lineHeight: 1.5 }}>
                                {irPropImmediateAction}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}
        </div>

        <div className={`inc-tab-panel ${activeTab === "actions" ? "active" : ""}`}>
          <div className="mod-card">
            <div className="mod-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="mod-card-title">Corrective &amp; Preventive Actions</span>
                {!isNneUser() && (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", background: "var(--bg-dark)", padding: "3px 8px", borderRadius: "4px", border: "1px solid var(--border-color)", fontWeight: 600 }}>
                    NNE Department Access Only (Read-Only)
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {!isContractorUser() && (
                  <button className="mod-btn-primary im-btn-primary" disabled={incident?.closedBy || incident?.status === 2 || String(incident?.stage).toUpperCase() === "CLOSED"} style={{ background: "var(--color-risk)", padding: "6px 16px", fontSize: "13px", fontWeight: 600, opacity: (incident?.closedBy || incident?.status === 2 || String(incident?.stage).toUpperCase() === "CLOSED") ? 0.5 : 1, cursor: (incident?.closedBy || incident?.status === 2 || String(incident?.stage).toUpperCase() === "CLOSED") ? "not-allowed" : "pointer" }} onClick={async () => {
                    try {
                      const userName = getLoggedInUser() || "Site HSE Admin";
                      await closeIncident(id, { closedBy: userName });
                      showSuccess("Incident Closed Successfully!");
                      const data = await getIncidentById(id);
                      setRawIncident(data?.data || data);
                    } catch (err) {
                      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to close incident";
                      showError(Array.isArray(msg) ? msg[0] : msg);
                    }
                  }}>Close Incident</button>
                )}
                {isNneUser() && (
                  <button className="mod-btn-primary im-btn-primary" disabled={incident?.closedBy || incident?.status === 2 || String(incident?.stage).toUpperCase() === "CLOSED"} style={{ padding: "4px 12px", fontSize: "12px", opacity: (incident?.closedBy || incident?.status === 2 || String(incident?.stage).toUpperCase() === "CLOSED") ? 0.5 : 1, cursor: (incident?.closedBy || incident?.status === 2 || String(incident?.stage).toUpperCase() === "CLOSED") ? "not-allowed" : "pointer" }} onClick={() => {
                    if (showAddAction) {
                      setShowAddAction(false);
                      setEditingActionId(null);
                      setNewAction({ action: "", responsible: "", targetDate: "", status: "PENDING" });
                    } else {
                      setShowAddAction(true);
                    }
                  }}>{showAddAction ? 'Cancel' : '+ Add Action'}</button>
                )}
              </div>
            </div>
            {isNneUser() && showAddAction && (
              <div style={{ padding: "16px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-dark)" }}>
                <div className="grid-2">
                  <div className="mod-form-group">
                    <label className="mod-form-label">Action Description</label>
                    <input className="mod-form-input" value={newAction.action} onChange={e => setNewAction({ ...newAction, action: e.target.value })} placeholder="Describe the action..." />
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Owner</label>
                    <input className="mod-form-input" value={newAction.responsible} onChange={e => setNewAction({ ...newAction, responsible: e.target.value })} placeholder="e.g. HSE Team" />
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Target Date</label>
                    <input type="date" className="mod-form-input" value={newAction.targetDate} onChange={e => setNewAction({ ...newAction, targetDate: e.target.value })} />
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Status</label>
                    <select className="mod-form-select" value={newAction.status} onChange={e => setNewAction({ ...newAction, status: e.target.value })}>
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                  <div className="mod-form-group" style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                    <button type="button" className="mod-btn-primary im-btn-primary" style={{ padding: "0 24px", height: "36px", width: "max-content", flexShrink: 0 }} onClick={addActionToList}>Save Action</button>
                  </div>
                </div>
              </div>
            )}

            {(() => {
              const totalPages = Math.ceil(actionsList.length / actionsPerPage);
              const currentActions = actionsList.slice((actionPage - 1) * actionsPerPage, actionPage * actionsPerPage);
              const colCount = isNneUser() ? 5 : 4;

              return (
                <>
                  <div className="mod-table-wrap">
                    <table className="mod-table">
                      <thead>
                        <tr>
                          <th>Action</th>
                          <th>Owner</th>
                          <th>Due</th>
                          <th>Status</th>
                          {isNneUser() && <th style={{ width: 100, textAlign: "right" }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {loadingActions ? (
                          <tr><td colSpan={colCount} style={{ textAlign: "center", padding: "48px 0" }}><Loader size="md" text="Loading Actions..." /></td></tr>
                        ) : currentActions.length === 0 ? (
                          <tr><td colSpan={colCount} style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>No corrective actions found</td></tr>
                        ) : currentActions.map((a, i) => {
                          const statusColor = a.status === 'COMPLETED' ? { bg: '#dcfce7', text: '#16a34a' } : a.status === 'IN_PROGRESS' ? { bg: '#fef08a', text: '#ca8a04' } : { bg: '#f1f5f9', text: '#64748b' };
                          const isExpanded = Boolean(expandedActionIds[a.id || i]);
                          return (
                            <React.Fragment key={a.id || i}>
                              <tr
                                onClick={() => toggleActionExpand(a.id || i)}
                                style={{ cursor: "pointer", background: isExpanded ? "var(--bg-dark, #f8fafc)" : "transparent" }}
                              >
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); toggleActionExpand(a.id || i); }}
                                      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                    >
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
                                      >
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                      </svg>
                                    </button>
                                    <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{a.action}</span>
                                    {a.actionType && (
                                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "var(--bg-dark, #f1f5f9)", color: "var(--text-muted)", border: "1px solid var(--border-color)", fontWeight: 700 }}>
                                        {a.actionType}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>{a.responsible || "ΓÇö"}</td>
                                <td>{a.targetDate ? new Date(a.targetDate).toLocaleDateString() : 'ΓÇö'}</td>
                                <td>
                                  <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", background: statusColor.bg, color: statusColor.text }}>{a.status?.replace('_', ' ')}</span>
                                </td>
                                {isNneUser() && (
                                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                                    <button onClick={() => editAction(a)} style={{ background: "var(--color-caution-bg)", border: "none", color: "var(--color-caution)", cursor: "pointer", marginRight: 8, padding: "6px", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }} title="Edit">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                    </button>
                                    <button onClick={() => deleteAction(a.id)} style={{ background: "var(--color-risk-bg)", border: "none", color: "var(--color-risk)", cursor: "pointer", padding: "6px", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }} title="Delete">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                  </td>
                                )}
                              </tr>

                              {isExpanded && (
                                <tr style={{ background: "#f8fafc" }}>
                                  <td colSpan={colCount} style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-color)" }}>
                                    <div style={{ padding: "16px", background: "var(--bg-card, #fff)", borderRadius: "8px", border: "1px solid var(--border-color)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        Status Change History
                                      </div>

                                      {a.statusHistory && Array.isArray(a.statusHistory) && a.statusHistory.length > 0 ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                          {a.statusHistory.map((hist, hIdx) => {
                                            const hStatusColor = hist.status === 'COMPLETED' ? { bg: '#dcfce7', text: '#16a34a' } : hist.status === 'IN_PROGRESS' ? { bg: '#fef08a', text: '#ca8a04' } : { bg: '#f1f5f9', text: '#64748b' };
                                            const formattedTime = hist.timestamp ? new Date(hist.timestamp).toLocaleString() : "ΓÇö";
                                            return (
                                              <div key={hIdx} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 14px", borderRadius: "6px", background: "var(--bg-dark, #f1f5f9)", border: "1px solid var(--border-color)" }}>
                                                <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", background: hStatusColor.bg, color: hStatusColor.text, marginTop: "2px" }}>
                                                  {hist.status?.replace('_', ' ')}
                                                </span>
                                                <div style={{ flex: 1, fontSize: "12px" }}>
                                                  <div style={{ color: "var(--text-main)", fontWeight: 600 }}>
                                                    Updated by <span style={{ color: "#3b82f6" }}>{hist.updatedBy || "System"}</span> on <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{formattedTime}</span>
                                                  </div>
                                                  {hist.remarks && (
                                                    <div style={{ color: "var(--text-muted)", marginTop: "4px", fontStyle: "italic", fontSize: "12px" }}>
                                                      "{hist.remarks}"
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                                          No status history recorded yet. Current status is <strong>{a.status || "PENDING"}</strong> (updated by {a.updatedBy || "System"}).
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {!loadingActions && totalPages > 1 && (
                    <div className="beam-pagination">
                      <button className="beam-page-btn" disabled={actionPage === 1} onClick={() => setActionPage(actionPage - 1)}>ΓåÉ</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button key={page} className={`beam-page-number ${actionPage === page ? "beam-page-number--active" : ""}`} onClick={() => setActionPage(page)}>
                          {page}
                        </button>
                      ))}
                      <button className="beam-page-btn" disabled={actionPage === totalPages} onClick={() => setActionPage(actionPage + 1)}>ΓåÆ</button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Incident Form Viewer & PDF Export Modal */}
      {showPdfExport && (
        <IncidentPdfExporter
          incident={{
            id: rawIncident?.incident?.id || rawIncident?.id || id,
            ...(rawIncident?.incident || rawIncident || {}),
            headsUp: {
              ...(rawIncident?.headsUp || {}),
              submittedBy: rawIncident?.headsUp?.submittedBy || rawIncident?.incident?.reportedBy || "HSE Lead",
              immediateActions: rawIncident?.headsUp?.immediateActions || rawIncident?.incident?.immediateActions || []
            },
            initialReport: {
              ...(rawIncident?.initialReport || {}),
              injuredPersonName: irInjuredName || rawIncident?.initialReport?.injuredPersonName,
              injuredPersonCompany: irInjuredCompany || rawIncident?.initialReport?.injuredPersonCompany,
              injuredPersonSupervisor: irInjuredSupervisor || rawIncident?.initialReport?.injuredPersonSupervisor,
              injuredPersonJobTitle: irInjuredJobTitle || rawIncident?.initialReport?.injuredPersonJobTitle,
              natureOfInjury: irNatureOfInjury || rawIncident?.initialReport?.natureOfInjury,
              treatmentProvided: irTreatmentProvided || rawIncident?.initialReport?.treatmentProvided,
              actualSeverity: irActualSeverity || rawIncident?.initialReport?.actualSeverity,
              potentialSeverity: irPotentialSeverity || rawIncident?.initialReport?.potentialSeverity,
              bodyPartsInjured: bodyParts?.length ? bodyParts : rawIncident?.initialReport?.bodyPartsInjured,
              immediateActions: immActions?.length ? immActions : (rawIncident?.initialReport?.immediateActions || []),
              environmentalDetails: {
                spillType: irEnvSpillType || rawIncident?.initialReport?.environmentalDetails?.spillType,
                spillSubstance: irEnvSpillSubstance || rawIncident?.initialReport?.environmentalDetails?.spillSubstance,
                spillQuantity: irEnvSpillQuantity || rawIncident?.initialReport?.environmentalDetails?.spillQuantity,
                spillCause: irEnvSpillCause || rawIncident?.initialReport?.environmentalDetails?.spillCause,
                spillSystemEntered: irEnvSystemEntered || rawIncident?.initialReport?.environmentalDetails?.spillSystemEntered,
                containmentCleanup: irEnvContainment || rawIncident?.initialReport?.environmentalDetails?.containmentCleanup
              },
              propertyDamageDetails: {
                propertyDamaged: irPropDamaged || rawIncident?.initialReport?.propertyDamageDetails?.propertyDamaged,
                equipmentInvolved: irPropEquipmentInvolved || rawIncident?.initialReport?.propertyDamageDetails?.equipmentInvolved,
                estimatedCost: irPropEstimatedCost || rawIncident?.initialReport?.propertyDamageDetails?.estimatedCost,
                damageDescription: irPropDamageDesc || rawIncident?.initialReport?.propertyDamageDetails?.damageDescription,
                immediateActionTaken: irPropImmediateAction || rawIncident?.initialReport?.propertyDamageDetails?.immediateActionTaken
              }
            },
            investigation: {
              ...(rawIncident?.investigation || {}),
              team: invTeam?.length ? invTeam : rawIncident?.investigation?.team,
              problemStatement: invProblem || rawIncident?.investigation?.problemStatement,
              investigationDetails: invDetails || rawIncident?.investigation?.investigationDetails,
              fishboneData: fishbone || rawIncident?.investigation?.fishboneData,
              fiveWhysData: fiveWhys || rawIncident?.investigation?.fiveWhysData,
              rootCauses: invRootCauses?.length ? invRootCauses : rawIncident?.investigation?.rootCauses,
              contributingFactors: invFactors?.length ? invFactors : rawIncident?.investigation?.contributingFactors,
              witnesses: invWitnesses?.length ? invWitnesses : rawIncident?.investigation?.witnesses,
              signatures: [{
                role: invInvRole || "Site HSE Investigator",
                name: invInvName || rawIncident?.investigation?.submittedBy || rawIncident?.incident?.reportedBy || "HSE Lead",
                date: invInvDate || rawIncident?.incident?.date || new Date().toISOString().split('T')[0]
              }]
            },
            categories: rawIncident?.incident?.categories || rawIncident?.categories || [],
            environmentalDetails: rawIncident?.incident?.environmentalDetails || rawIncident?.environmentalDetails || {},
            propertyDamageDetails: rawIncident?.incident?.propertyDamageDetails || rawIncident?.propertyDamageDetails || {}
          }}
          onClose={() => setShowPdfExport(false)}
          targetForm={pdfTargetForm}
        />
      )}
    </div>
  );
}
