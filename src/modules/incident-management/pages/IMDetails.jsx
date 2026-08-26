import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import { getIncidentById, approveHeadsUp, submitInitialReport, approveInitialReport, getActionItems, addActionItem, updateActionItem, deleteActionItem, saveInvestigation, reviewInvestigation, closeIncident } from "../../../services/incidentService";
import { showSuccess, showError } from "../../../components/common/Toast/Toast";
import Loader from "../../../components/common/Loader/Loader";
import nneLogo from "../../../assets/images/nne_logo.png";
import novoLogo from "../../../assets/images/Logo.jpeg";
import "../../../styles/module-shared.css";
import "./IMDetails.css";
import { AnalogTimePicker } from "./IMCreate";

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
    return { x: clientX - rect.left, y: clientY - rect.top };
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
          style={{ width: "100%", height: "100%", cursor: "crosshair", display: "block" }}
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

export default function IMDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rawIncident, setRawIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchIncident = async () => {
      try {
        const data = await getIncidentById(id);
        const resData = data?.data || data;
        setRawIncident(resData);
        if (resData?.headsUp?.approvedBy) setHeadsUpApproved(true);

        // Sync Initial Report states
        if (resData?.initialReport?.approvedBy) {
          setInitialReportApproved(true);
          setInitialReportSubmitted(true);
        } else if (resData?.stage === "INVESTIGATION" || resData?.stage === "CLOSED" || resData?.initialReport?.id) {
          setInitialReportSubmitted(true);
        }

        // Sync Investigation states
        if (resData?.investigation?.reviewedBy || resData?.investigation?.approvedBy) {
          setInvestigationApproved(true);
          setInvestigationSubmitted(true);
        } else if (resData?.stage === "CLOSED" || resData?.investigation?.id) {
          setInvestigationSubmitted(true);
        }
      } catch (err) {
        console.error("Failed to load incident details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncident();
  }, [id]);
  const [activeTab, setActiveTab] = useState("headsUp");
  const [headsUpApproved, setHeadsUpApproved] = useState(false);
  const [signature, setSignature] = useState(false);
  const [markedOk, setMarkedOk] = useState(false);
  const [reviewerName, setReviewerName] = useState("");

  const [initialReportSubmitted, setInitialReportSubmitted] = useState(false);
  const [initialReportApproved, setInitialReportApproved] = useState(false);
  const [irSignature, setIrSignature] = useState(false);
  const [irMarkedOk, setIrMarkedOk] = useState(false);
  const [irReviewerName, setIrReviewerName] = useState("");

  // New states for Step 2 interactivity
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photos, setPhotos] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

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

  const [bodyParts, setBodyParts] = useState([]);
  const [manualBodyPart, setManualBodyPart] = useState("");
  const [immActions, setImmActions] = useState([]);
  const [showActionTimePicker, setShowActionTimePicker] = useState(null);
  const [tempActionTime, setTempActionTime] = useState("");

  // Corrective Actions Tab State
  const [actionsList, setActionsList] = useState([]);
  const [showAddAction, setShowAddAction] = useState(false);
  const [editingActionId, setEditingActionId] = useState(null);
  const [newAction, setNewAction] = useState({ action: "", responsible: "", targetDate: "", status: "PENDING" });

  const [loadingActions, setLoadingActions] = useState(false);
  const [actionPage, setActionPage] = useState(1);
  const actionsPerPage = 5;

  const loadActions = async () => {
    if (!id) return;
    setLoadingActions(true);
    try {
      const res = await getActionItems(id);
      setActionsList(Array.isArray(res) ? res : (res.data || []));
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

  const addActionToList = async () => {
    if (!newAction.action || !newAction.responsible) return;
    try {
      const payload = {
        action: newAction.action,
        responsible: newAction.responsible,
        targetDate: newAction.targetDate,
        status: newAction.status
      };
      if (editingActionId) {
        await updateActionItem(id, editingActionId, newAction);
        showSuccess("Action Item Updated Successfully!");
      } else {
        await addActionItem(id, newAction);
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

  // --- Step 3: Investigation State ---
  const [investigationStarted, setInvestigationStarted] = useState(false);
  const [investigationSubmitted, setInvestigationSubmitted] = useState(false);
  const [investigationApproved, setInvestigationApproved] = useState(false);

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
  const SEVERITY_SCALE = [
    { level: 1, label: "Insignificant", color: "#2D9E5A" },
    { level: 2, label: "Minor", color: "#C07D10" },
    { level: 3, label: "Moderate", color: "#D97706" },
    { level: 4, label: "Critical", color: "#E32B50" },
    { level: 5, label: "Catastrophic", color: "#8F1B32" }
  ];

  const [invCorrective, setInvCorrective] = useState([]);
  const [invLessons, setInvLessons] = useState("");
  const [invPrevention, setInvPrevention] = useState("");

  const [invPhotos, setInvPhotos] = useState([]);
  const [isInvCameraActive, setIsInvCameraActive] = useState(false);
  const invVideoRef = useRef(null);
  const invCanvasRef = useRef(null);
  const invFileInputRef = useRef(null);
  const invStreamRef = useRef(null);

  const INV_MANDATORY_ATTACHMENTS = [
    "Witness Statement(s)",
    "Post-Incident Drug & Alcohol test result (if applicable)",
    "Method Statement (RAMS) in use at the time",
    "Pre-task briefing / SPA / TSTI",
    "Permit to Work (if applicable)",
    "Training / Competency records for involved persons",
    "Equipment Inspection / Maintenance records (if applicable)"
  ];
  const [invAttachments, setInvAttachments] = useState(Array(INV_MANDATORY_ATTACHMENTS.length).fill(false));
  const [invMissingExplain, setInvMissingExplain] = useState("");

  const [invInvName, setInvInvName] = useState("");
  const [invInvRole, setInvInvRole] = useState("");
  const [invInvDate, setInvInvDate] = useState("");
  const [invInvSignature, setInvInvSignature] = useState(false);
  const [invInvMarkedOk, setInvInvMarkedOk] = useState(false);
  const [invRevSignature, setInvRevSignature] = useState(false);
  const [invReviewerName, setInvReviewerName] = useState("");
  const [invReviewerRole, setInvReviewerRole] = useState("");
  const [invRevMarkedOk, setInvRevMarkedOk] = useState(false);

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

  const [fishboneInput, setFishboneInput] = useState({ people: "", machine: "", method: "", materials: "", environment: "", measurement: "" });
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
  const ACCIDENT_TYPE_CATEGORIES = ["Slip/Trip/Fall", "Struck by Object", "Caught In/Between", "Manual Handling", "Vehicle/Mobile Plant", "Electrical", "Hazardous Substance", "Fire/Explosion", "Other"];
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

  if (!rawIncident) {
    return (
      <div className="mod-page">
        <div className="mod-card" style={{ padding: "60px 32px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)" }}>Incident <strong>{id}</strong> not found.</p>
          <button className="mod-btn-primary im-btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/incident-management/list")}>← Back to List</button>
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
    const s = [
      { key: "headsUp", num: 1, st: stages.headsUp, state: headsUpApproved ? "done" : "current" },
      { key: "initialReport", num: 2, st: stages.initialReport, state: initialReportApproved ? "done" : headsUpApproved ? "current" : "pending" },
      { key: "investigation", num: 3, st: stages.investigation, state: investigationApproved ? ((incident?.closedBy || incident?.status === 2 || String(incident?.stage).toUpperCase() === "CLOSED") ? "done" : "opened") : initialReportApproved ? "current" : "pending" }
    ];

    return (
      <div style={{ marginBottom: 24 }}>
        <div className="section-title" style={{ marginTop: 8, marginBottom: 16 }}>Investigation Timeline</div>
        <div className="inv-timeline">
          {s.map((stg, i) => (
            <div key={stg.key} className={`inv-stage state-${stg.state}`}>
              <div className="inv-marker">
                <div className={`inv-num ${stg.state}`}>
                  {stg.state === "done" ? <CheckIcon /> : stg.num}
                </div>
                <div className={`inv-connector ${stg.state === "done" ? "done" : ""}`}></div>
              </div>
              <div className={`inv-body body-${stg.state}`}>
                <div className="inv-title-row">
                  <span className="inv-title">{stg.st.label}</span>
                  {stg.state === "opened" ?
                    <span className="inv-chip" style={{ background: "#fef08a", color: "#854d0e", border: "1px solid #fde047" }}>Pending Closure</span> :
                    stg.state === "done" ? <span className="inv-chip chip-done">Completed</span> :
                      stg.state === "current" ? <span className="inv-chip chip-current">In progress</span> :
                        <span className="inv-chip chip-upcoming">Pending</span>}
                  <span className={`inv-prio prio-${String(stg.st.priority || "").toLowerCase()}`}>{stg.st.priority}</span>
                </div>
                <div className="inv-sub">Deadline: {stg.st.dueLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const formatDateTimeObj = (dStr) => {
    if (!dStr) return { date: "—", time: "—" };
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return { date: dStr.split("T")[0] || dStr, time: dStr.split("T")[1] || "—" };
      const date = d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const time = d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return { date, time };
    } catch (e) { return { date: dStr, time: "—" }; }
  };

  const renderAuditCard = (step, index, totalSteps) => {
    const { title, type, user, role, timestamp, signature, iconSvg, color } = step;
    if (!user || !timestamp) return null;
    const { date, time } = formatDateTimeObj(timestamp);
    const isLast = index === totalSteps - 1;
    return (
      <div key={index} style={{ position: "relative", paddingLeft: 40, marginBottom: isLast ? 0 : 24 }}>
        <div style={{ position: "absolute", left: -10, top: 20, width: 20, height: 20, background: color, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg-card, #fff)", zIndex: 2 }}>
          {type === "APPROVED" ? (
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
          ) : (
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          )}
        </div>
        {!isLast && <div style={{ position: "absolute", left: -1, top: 40, bottom: -44, width: 2, background: "var(--border-color)", zIndex: 1 }}></div>}
        <div style={{ position: "relative", background: "var(--bg-card, #fff)", border: "1px solid var(--border-color)", borderRadius: 8, padding: 16, display: "flex", gap: 16, alignItems: "center", boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))" }}>
          <div style={{ position: "absolute", left: -6, top: 24, width: 10, height: 10, background: "var(--bg-card, #fff)", borderLeft: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", transform: "rotate(45deg)", borderRight: "none", borderTop: "none" }}></div>
          <div style={{ width: 64, height: 64, background: color + "1a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {iconSvg}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: color, marginBottom: 4 }}>{title}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: color + "1a", color: color, padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              {type === "APPROVED" ? (<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4, verticalAlign: 'middle', marginTop: '-2px'}}><path d="M5 13l4 4L19 7" /></svg>Marked OK & Signed Off</span>) : "Submitted"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-main)", marginBottom: 8 }}>
              {type === "APPROVED" ? "Signed by" : "Submitted by"} <b>{user}</b> <span style={{ color: "var(--text-muted)" }}>({role})</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> {date}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, borderLeft: "1px solid var(--border-color)", paddingLeft: 16 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="6" x2="12" y2="12" /><line x1="12" y1="12" x2="16" y2="14" /></svg> {time}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 160, borderLeft: "1px solid var(--border-color)", paddingLeft: 16 }}>
            <div style={{ width: 140, height: 60, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, background: "#fff", borderRadius: 6, padding: 4 }}>
              {signature && (signature.startsWith("data:image") || signature.startsWith("http") || signature.startsWith("/")) ? (
                <img src={signature} alt="Signature" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              ) : (
                <svg width="100%" height="100%" viewBox="0 0 500 120" preserveAspectRatio="xMidYMid meet"><path d="M50,80 Q100,20 150,60 T250,80 T350,40 T450,70" fill="none" stroke="#000" strokeWidth="6" strokeLinecap="round" /></svg>
              )}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", textAlign: "center" }}>{user}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>({role})</div>
          </div>
        </div>
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
      user: initialReportData.submittedBy || incident?.reporterName || incident?.reportedBy || "User", role: initialReportData.submitterRole || "Reporter",
      timestamp: initialReportData.submittedTime || initialReportData.createdTime, signature: initialReportData.signature,
      iconSvg: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
      color: "#3b82f6"
    });
  }
  if (initialReportApproved) {
    irAudit.push({
      title: "Initial Incident Report (24hr)", type: "APPROVED",
      user: initialReportData?.approvedBy || "Reviewer", role: initialReportData?.approverRole || "Customer Approver",
      timestamp: initialReportData?.approvedTime || initialReportData?.updatedTime, signature: initialReportData?.approverSignature || initialReportData?.signature,
      iconSvg: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-safe, #10b981)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
      color: "var(--color-safe, #10b981)"
    });
  }

  const invAudit = [];
  if (investigationData) {
    const invSubSig = investigationData.signatures && investigationData.signatures.length > 0 ? investigationData.signatures[0] : null;
    if (investigationSubmitted || invSubSig || investigationData.submittedBy) {
      invAudit.push({
        title: "Incident Investigation Report (7 days)", type: "SUBMITTED",
        user: invSubSig ? invSubSig.name : (investigationData.submittedBy || incident?.investigatorName || "Investigator"), role: invSubSig ? invSubSig.role : (investigationData.submitterRole || "Investigator"),
        timestamp: investigationData.submittedTime || investigationData.completedTime || investigationData.createdTime, signature: invSubSig ? invSubSig.signature : investigationData.signature,
        iconSvg: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
        color: "#3b82f6"
      });
    }
  }
  if (investigationApproved) {
    invAudit.push({
      title: "Incident Investigation Report (7 days)", type: "APPROVED",
      user: investigationData?.reviewedBy || investigationData?.approvedBy || "Reviewer", role: investigationData?.reviewerRole || investigationData?.approverRole || "Reviewer",
      timestamp: investigationData?.reviewedTime || investigationData?.approvedTime || investigationData?.updatedTime, signature: investigationData?.reviewerSignature || investigationData?.approverSignature || investigationData?.signature,
      iconSvg: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-safe, #10b981)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
      color: "var(--color-safe, #10b981)"
    });
  }

  const allAuditSteps = [...huAudit, ...irAudit, ...invAudit];

  return (
    <div className="mod-page">

      {/* ── Print-only Header ── */}
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
          <h2 style={{ fontSize: "18px", margin: "0", color: "#64748b", fontWeight: "normal" }}>{incident.title || "—"}</h2>
        </div>
      </div>
      {/* ── End Print-only Header ── */}

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
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", marginBottom: "12px", letterSpacing: "-0.5px" }}>{incident.categories?.[0] || incident.title || incident.caseNumber}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {incident.buildingName ? `${incident.buildingName}${incident.floorLevel ? ' - ' + incident.floorLevel : ''}` : (incident.location || "—")}
            </span>
            <span style={{ color: "var(--border-color)" }}>|</span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
              {incident.origin || incident.type || "—"}
            </span>
          </div>
        </div>
        <div className="inc-head-actions hide-on-print" style={{ display: "flex", gap: "10px" }}>
          <button className="mod-btn-outline" onClick={() => window.print()} style={{ fontSize: "13px", padding: "8px 16px", borderRadius: "8px", fontWeight: 600 }}>Export PDF</button>
        </div>
      </div>

      {incident.isHipo && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", marginBottom: "20px", borderRadius: "8px", background: "var(--color-risk-bg)", borderLeft: "4px solid var(--color-risk)", color: "var(--color-risk)", fontWeight: 600, fontSize: "13px" }}>
          <span style={{ fontSize: "16px" }}>⚠️</span>
          <span>High-Potential (HiPo) incident {incident.investigationLevel ? `· Investigation Level ${incident.investigationLevel} (L1 = basic, L2 = intermediate, L3 = full / serious)` : ""}</span>
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
            tabBadge: (incident.stage === "HEADS_UP" && !headsUpApproved) ? "IN PROGRESS" : "COMPLETED",
            tabBadgeClass: (incident.stage === "HEADS_UP" && !headsUpApproved) ? "chip-inprogress" : "chip-approved"
          },
          {
            id: "initialReport",
            label: "Step 2: Initial Report (24hr)",
            tabBadge: incident.stage === "HEADS_UP" ? "PENDING" : (initialReportApproved || (incident.stage !== "HEADS_UP" && incident.stage !== "INITIAL_REPORT") ? "COMPLETED" : "IN PROGRESS"),
            tabBadgeClass: incident.stage === "HEADS_UP" ? "chip-upcoming" : (initialReportApproved || (incident.stage !== "HEADS_UP" && incident.stage !== "INITIAL_REPORT") ? "chip-approved" : "chip-inprogress")
          },
          { id: "investigation", label: "Step 3: Investigation Report (7 days)" },
          { id: "actions", label: "Actions" }
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
              <dl className="detail-meta" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div><dt style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "4px" }}>Incident Code</dt><dd style={{ fontWeight: 600 }}>{incident.caseNumber || incident.id || "—"}</dd></div>
                <div><dt style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "4px" }}>Date / Time</dt><dd style={{ fontWeight: 600 }}>{incident.incidentDate || "—"} {incident.incidentTime || ""}</dd></div>
                <div><dt style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "4px" }}>Classification</dt><dd style={{ fontWeight: 600 }}>{incident.categories ? (Array.isArray(incident.categories) ? incident.categories.join(", ") : incident.categories) : incident.category || "—"}</dd></div>
                <div><dt style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "4px" }}>Location</dt><dd style={{ fontWeight: 600 }}>{[incident.buildingName, incident.floorLevel, incident.specificLocation].filter(Boolean).join(" - ") || incident.location || "—"}</dd></div>
                <div><dt style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "4px" }}>Reporter</dt><dd style={{ fontWeight: 600 }}>{incident.reporterName || incident.reportedBy || incident.createdBy || incident.investigatorName || "—"}</dd></div>
                <div><dt style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "4px" }}>Status</dt><dd style={{ fontWeight: 600 }}>{(incident.status === 2 || incident.closedBy || String(incident.stage).toUpperCase() === "CLOSED") ? "Closed" : "Open"}</dd></div>
                <div style={{ gridColumn: "1 / -1" }}><dt style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "4px" }}>Description</dt><dd style={{ fontWeight: 600 }}>{headsUpData?.descriptionWhatHappened || headsUpData?.whatHappened || headsUpData?.descriptionConsequence || incident.description || incident.details || "—"}</dd></div>
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
                  {allAuditSteps.map((step, i) => renderAuditCard(step, i, allAuditSteps.length))}
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
                  if (!dStr) return "—";
                  try {
                    const d = new Date(dStr);
                    if (isNaN(d.getTime())) return dStr.replace("T", " ");
                    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
                  } catch (e) { return dStr; }
                };

                const allEvents = [];
                if (incident?.closedBy || incident?.status === 2 || String(incident?.stage).toUpperCase() === "CLOSED") {
                  allEvents.push({ text: "Incident closed", user: incident?.closedBy || "System", date: formatDateTime(incident?.updatedTime) });
                }
                if (investigationApproved) {
                  allEvents.push({ text: "Investigation Report marked OK & signed off", user: investigationData.reviewedBy || investigationData.approvedBy || "Reviewer", date: formatDateTime(investigationData.updatedTime || investigationData.createdTime) });
                }
                if (investigationSubmitted) {
                  allEvents.push({ text: "Investigation Report submitted", user: incident?.investigatorName || incident?.reportedBy || "Investigator", date: formatDateTime(investigationData.createdTime || incident?.updatedTime) });
                }
                if (initialReportApproved) {
                  allEvents.push({ text: "Initial Incident Report marked OK & signed off", user: initialReportData.approvedBy || "Reviewer", date: formatDateTime(initialReportData.approvedTime || initialReportData.createdTime) });
                }
                if (initialReportSubmitted) {
                  allEvents.push({ text: "Initial Incident Report submitted", user: incident?.reporterName || incident?.reportedBy || "Reporter", date: formatDateTime(initialReportData.createdTime) });
                }
                if (headsUpApproved) {
                  allEvents.push({ text: "Heads-Up Notification marked OK & approved", user: headsUpData.approvedBy || "Reviewer", date: formatDateTime(headsUpData.approvedTime) });
                }
                
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
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                              {ev.user}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
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
            <div className="mod-card mb-4">
              <div className="mod-card-header">
                <span className="mod-card-title">Step 1: Heads-Up Notification (2hr)</span>
                {headsUpApproved ? (
                  <span className="inv-chip chip-approved">Submitted</span>
                ) : (
                  <span className="inv-chip chip-inprogress">Pending Review</span>
                )}
              </div>
              <div className="mod-card-body">
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>Submitted by <b>{incident.reportedBy || incident.gatekeeperName || "User"}</b> on <b>{incident.createdTime ? incident.createdTime.split("T")[0] : (incident.createdAt || incident.date || "—")}</b></div>
                <div className="grid-2">
                  <div className="mod-form-group"><label className="mod-form-label">Incident Type</label><div className="readonly-box">{incident.categories?.[0] || incident.category || "—"}</div></div>
                  <div className="mod-form-group"><label className="mod-form-label">Severity</label><div className="readonly-box" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {(() => {
                      const level = incident.actualSeverity || incident.severity;
                      if (!level) return <span style={{ color: "var(--text-muted)" }}>—</span>;
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
                          {level} {m.label}
                        </span>
                      );
                    })()}
                    {incident.isHipo && <span className="badge" style={{ background: "var(--color-risk)", color: "#fff" }}>HiPo</span>}
                  </div></div>
                  <div className="mod-form-group"><label className="mod-form-label">Location</label><div className="readonly-box">{incident.buildingName ? `${incident.buildingName}${incident.floorLevel ? ' - ' + incident.floorLevel : ''}` : (incident.building || incident.location || "—")}</div></div>
                  <div className="mod-form-group"><label className="mod-form-label">Date / Time</label><div className="readonly-box">{incident.incidentDate || incident.date || "—"} {incident.incidentTime || ""}</div></div>
                </div>
                <div className="mod-form-group" style={{ marginTop: "16px" }}><label className="mod-form-label">Description</label><div className="readonly-box">{headsUpData?.descriptionWhatHappened || headsUpData?.whatHappened || headsUpData?.descriptionConsequence || incident.description || incident.details || "—"}</div></div>
              </div>
            </div>

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
                    {huAudit.map((step, i) => renderAuditCard(step, i, huAudit.length))}
                  </div>
                </div>
              </div>
            )}
            {!headsUpApproved && (
              <div className="mod-card mb-4">
                <div className="mod-card-header"><span className="mod-card-title">Review: Heads-Up Notification {incident.id}</span></div>
                <div className="mod-card-body">
                  <div className="mod-form-group">
                    <label className="mod-form-label">Review Comments</label>
                    <textarea className="mod-form-textarea" placeholder="Add review comments..." rows="3"></textarea>
                  </div>
                  <div className="mod-form-group" style={{ marginTop: 16 }}>
                    <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Reviewer Name</label>
                    <input type="text" className="mod-form-input" placeholder="Type your full name" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} />
                  </div>
                  <div className="mod-form-group" style={{ marginTop: 16 }}>
                    <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Digital Signature</label>
                    <SignaturePad value={signature} onChange={setSignature} onClear={() => setSignature(false)} />
                  </div>
                  <div className="markok" onClick={() => setMarkedOk(!markedOk)} style={{ borderColor: markedOk ? "var(--color-safe)" : "var(--border-color)", opacity: markedOk ? 1 : 0.7 }}>
                    <input type="checkbox" checked={markedOk} onChange={() => {}} />
                    <div>
                      <div className="mk-t">Marked OK</div>
                      <div className="mk-s">I have reviewed this report and confirm it is complete and accurate.</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                    <button className="mod-btn-outline" style={{ color: "var(--color-risk)", borderColor: "var(--color-risk-bg)" }}>Return for Revision</button>
                    <button className="mod-btn-primary im-btn-primary" disabled={!markedOk || !signature || !reviewerName} onClick={async () => {
                      try {
                        await approveHeadsUp(id, { signature, approvedBy: reviewerName });
                        setHeadsUpApproved(true);
                        setActiveTab("initialReport");
                        // Refresh incident
                        const data = await getIncidentById(id);
                        setRawIncident(data?.data || data);
                      } catch (err) {
                        console.error("Failed to approve Heads Up", err);
                      }
                    }}>Approve & Sign Off</button>
                  </div>
                </div>
              </div>
            )}
          </div>

        <div className={`inc-tab-panel ${activeTab === "initialReport" ? "active" : ""}`}>
            {!headsUpApproved ? (
               <div className="mod-card"><div className="mod-card-body"><div className="locked-state">
                 <div className="locked-icon">
                   <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                     <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                   </svg>
                 </div>
                 <div className="locked-title">Initial Incident Report (24hr) Pending</div>
                 <div className="locked-text">The 24-hour Initial Incident Report is due by <b>{stages.initialReport.dueLabel}</b>. This report captures injured person details, incident categories, severity assessment, photos, injury information, accident types, body parts and immediate actions.</div>
                 <div style={{ marginTop: 24, fontSize: "13px", color: "var(--color-caution)" }}>
                   ⚠️ Heads-Up Notification must be reviewed and approved before starting the Initial Report.
                 </div>
               </div></div></div>
            ) : initialReportSubmitted ? (
                <div>
                  {irAudit.length > 0 && (
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
                          {irAudit.map((step, i) => renderAuditCard(step, i, irAudit.length))}
                        </div>
                      </div>
                    </div>
                  )}
                  {!initialReportApproved && (
                <div className="mod-card mb-4">
                  <div className="mod-card-header"><span className="mod-card-title">Review: Initial Incident Report {incident.id}</span></div>
                  <div className="mod-card-body">
                    <div className="mod-form-group">
                      <label className="mod-form-label">Review Comments</label>
                      <textarea className="mod-form-textarea" placeholder="Add review comments..." rows="3"></textarea>
                    </div>
                    <div className="mod-form-group" style={{ marginTop: 16 }}>
                      <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Reviewer Name</label>
                      <input type="text" className="mod-form-input" placeholder="Type your full name" value={irReviewerName} onChange={(e) => setIrReviewerName(e.target.value)} />
                    </div>
                    <div className="mod-form-group" style={{ marginTop: 16 }}>
                      <label className="mod-form-label" style={{ textTransform: "uppercase" }}>Digital Signature</label>
                      <SignaturePad value={irSignature} onChange={setIrSignature} onClear={() => setIrSignature(false)} />
                    </div>
                    <div className="markok" onClick={() => setIrMarkedOk(!irMarkedOk)} style={{ borderColor: irMarkedOk ? "var(--color-safe)" : "var(--border-color)", opacity: irMarkedOk ? 1 : 0.7 }}>
                      <input type="checkbox" checked={irMarkedOk} onChange={() => {}} />
                      <div>
                        <div className="mk-t">Marked OK</div>
                        <div className="mk-s">I have reviewed this report and confirm it is complete and accurate.</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                      <button className="mod-btn-outline" style={{ color: "var(--color-risk)", borderColor: "var(--color-risk-bg)" }}>Return for Revision</button>
                      <button className="mod-btn-primary im-btn-primary" disabled={!irMarkedOk || !irSignature || !irReviewerName} onClick={async () => {
                        try {
                          await approveInitialReport(id, { signature: irSignature, approvedBy: irReviewerName });
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
              </div>
            ) : (
              <div className="mod-card">
                <div className="mod-card-header"><span className="mod-card-title">Initial Incident Report (24hr)</span><span className="inv-chip chip-inprogress">In Progress</span></div>
                <div className="mod-card-body">
                  {/* A. Heads-Up Summary */}
                  <div className="fsec"><div className="fsec-title">A. Heads-Up Summary</div>
                    <div className="readonly-box">
                      <div><b>Type:</b> {incident.categories?.[0] || incident.category || "—"}</div>
                      <div><b>Severity:</b> {incident.actualSeverity || incident.severity || "—"}</div>
                      <div><b>Location:</b> {incident.buildingName ? `${incident.buildingName}${incident.floorLevel ? ' - ' + incident.floorLevel : ''}` : (incident.building || incident.location || "—")}</div>
                      <div><b>Description:</b> {headsUpData?.descriptionWhatHappened || headsUpData?.whatHappened || headsUpData?.descriptionConsequence || incident.description || incident.details || "—"}</div>
                    </div>
                  </div>

                  {/* B. Injured / Ill Person Details */}
                  <div className="fsec"><div className="fsec-title">B. Injured / Ill Person Details</div>
                    <div className="grid-2">
                      <div className="mod-form-group"><label className="mod-form-label">Name of Injured / Ill Person</label><input className="mod-form-input" placeholder="Name..." /></div>
                      <div className="mod-form-group"><label className="mod-form-label">Company</label><input className="mod-form-input" defaultValue={incident.contractor === "c01" ? "Alpha Construction" : incident.contractor === "c02" ? "Zeta Builders" : "NNE"} /></div>
                      <div className="mod-form-group"><label className="mod-form-label">Manager / Supervisor</label><input className="mod-form-input" placeholder="Supervisor Name" /></div>
                      <div className="mod-form-group"><label className="mod-form-label">Job Title</label><input className="mod-form-input" placeholder="e.g. Electrician" /></div>
                      <div className="mod-form-group"><label className="mod-form-label">Length of Service</label><input className="mod-form-input" placeholder="e.g. 2 years" /></div>
                      <div className="mod-form-group"><label className="mod-form-label">Years of Experience in Role</label><input className="mod-form-input" placeholder="e.g. 5 years" /></div>
                    </div>
                    <div className="mod-form-group" style={{ marginTop: 8 }}><label className="mod-form-label">What was the worker doing at the time of the incident?</label><textarea className="mod-form-textarea" placeholder="Describe the task / activity being performed..."></textarea></div>
                  </div>

                  {/* C. Incident Category */}
                  <div className="fsec"><div className="fsec-title">C. Incident Category</div>
                    <div className="fsec-note">Select all that apply. The categorisation may change following the incident investigation.</div>
                    <div className="chk-grid-2">
                      {INCIDENT_CATEGORIES.map(cat => (
                        <label className="chk" key={cat}><input type="checkbox" defaultChecked={cat === incident.category} /><span>{cat}</span></label>
                      ))}
                    </div>
                  </div>

                  {/* D. Severity Assessment */}
                  <div className="fsec"><div className="fsec-title">D. Severity Assessment</div>
                    <div className="grid-2">
                      <div className="mod-form-group">
                        <label className="mod-form-label">Actual Severity Level & Rating</label>
                        <select id="select-actual-severity" className="mod-form-select" defaultValue={incident.actualSeverity || ""}>
                          <option value="">Use the severity table from Risk Matrix...</option>
                          {SEVERITY_RATINGS.map(s => <option key={s} value={s.split(" ")[0]}>{s}</option>)}
                        </select>
                        <div className="fsec-note" style={{ margin: "6px 0 0" }}>N/A for Near Miss.</div>
                      </div>
                      <div className="mod-form-group">
                        <label className="mod-form-label">Potential Severity Level & Rating</label>
                        <select id="select-potential-severity" className="mod-form-select" defaultValue={incident.potentialSeverity || ""}>
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
                      <textarea className="mod-form-textarea" style={{ minHeight: 120 }} defaultValue={incident.description} placeholder="Describe in detail what happened, including the sequence of events..."></textarea>
                    </div>
                  </div>

                  {/* F. Photos */}
                  <div className="fsec"><div className="fsec-title">F. Photos from the incident location</div>
                    <div className="fsec-note">Minimum of 2 photos. For environmental incidents, include one photo before the spill is contained and one after.</div>
                    
                    <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                    
                    {!isCameraActive && (
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
                          <button onClick={() => removePhoto(idx)} style={{ position: "absolute", top: 4, right: 4, background: "var(--color-risk)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* G. Injury / Illness Information */}
                  <div className="fsec">
                    <div className="fsec-title" style={{ justifyContent: "space-between" }}>
                      <span>G. Injury / Illness Information</span>
                      <label className="chk" style={{ fontSize: 12, textTransform: "none", fontWeight: 600 }}><input type="checkbox" /><span>Not Applicable</span></label>
                    </div>
                    <div className="mod-form-group"><label className="mod-form-label">Nature of Injury</label>
                      <textarea className="mod-form-textarea" placeholder="e.g. Laceration to left hand, sprained ankle..."></textarea>
                    </div>
                    <div className="grid-2">
                      <div className="mod-form-group"><label className="mod-form-label">Treatment Provided</label>
                        <select className="mod-form-select">
                          <option value="">Select...</option>
                          {TREATMENT_PROVIDED.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="mod-form-group"><label className="mod-form-label">Anticipated Absence from Work</label>
                        <input className="mod-form-input" placeholder="e.g. 3 days, 2 weeks, None, Unknown..." />
                      </div>
                    </div>
                    <div className="mod-form-group" style={{ marginTop: 8 }}><label className="mod-form-label">Medical Treatment Classification</label>
                      <select className="mod-form-select">
                        <option value="">Select...</option>
                        {["No Treatment", "First Aid", "Medical Treatment", "Restricted Work", "Lost Time"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* H. Type of Accident Categories */}
                  <div className="fsec"><div className="fsec-title">H. Type of Accident Categories</div>
                    <div className="fsec-note">Select all that apply.</div>
                    <div className="chk-grid-3">
                      {ACCIDENT_TYPE_CATEGORIES.map(cat => <label className="chk" key={cat}><input type="checkbox" /><span>{cat}</span></label>)}
                    </div>
                  </div>

                  {/* I. Indicate Type(s) of Injury */}
                  <div className="fsec"><div className="fsec-title">I. Indicate Type(s) of Injury</div>
                    <div className="fsec-note">Select all that apply.</div>
                    <div className="chk-grid-3">
                      {INJURY_TYPES.map(cat => <label className="chk" key={cat}><input type="checkbox" /><span>{cat}</span></label>)}
                    </div>
                  </div>

                  {/* J. Parts of the Body Injured */}
                  <div className="fsec"><div className="fsec-title">J. Indicate Parts of the Body Injured</div>
                    <div className="fsec-note">Click the body map to select injured areas, or add manually. Click a highlighted area again to remove it.</div>
                    <div className="bodyj-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 12 }}>
                      <div className="bodyj-map" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "24px 16px" }}>
                        <div className="body-figs" style={{ display: "flex", justifyContent: "space-around" }}>
                          
                          {/* FRONT VIEW */}
                          <div className="body-fig" style={{ textAlign: "center" }}>
                            <svg width="80" height="220" viewBox="0 0 80 220" style={{ cursor: "pointer" }}>
                              {/* Head */}
                              <circle cx="40" cy="30" r="20" fill={fillFor("Head")} onClick={() => toggleBodyPart("Head")} />
                              {/* Neck */}
                              <rect x="34" y="52" width="12" height="10" rx="2" fill={fillFor("Neck")} onClick={() => toggleBodyPart("Neck")} />
                              {/* Torso */}
                              <rect x="22" y="64" width="36" height="60" rx="6" fill={fillFor("Torso")} onClick={() => toggleBodyPart("Torso")} />
                              {/* Worker's Right Arm (Left on screen for FRONT) */}
                              <rect x="0" y="64" width="16" height="56" rx="6" fill={fillFor("Arm (R)")} onClick={() => toggleBodyPart("Arm (R)")} />
                              {/* Worker's Left Arm (Right on screen for FRONT) */}
                              <rect x="64" y="64" width="16" height="56" rx="6" fill={fillFor("Arm (L)")} onClick={() => toggleBodyPart("Arm (L)")} />
                              {/* Worker's Right Leg (Left on screen for FRONT) */}
                              <rect x="22" y="128" width="14" height="70" rx="6" fill={fillFor("Leg (R)")} onClick={() => toggleBodyPart("Leg (R)")} />
                              {/* Worker's Left Leg (Right on screen for FRONT) */}
                              <rect x="44" y="128" width="14" height="70" rx="6" fill={fillFor("Leg (L)")} onClick={() => toggleBodyPart("Leg (L)")} />
                            </svg>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginTop: 8 }}>FRONT</div>
                          </div>

                          {/* BACK VIEW */}
                          <div className="body-fig" style={{ textAlign: "center" }}>
                            <svg width="80" height="220" viewBox="0 0 80 220" style={{ cursor: "pointer" }}>
                              {/* Head (Back) */}
                              <circle cx="40" cy="30" r="20" fill={fillFor("Head")} onClick={() => toggleBodyPart("Head")} />
                              {/* Neck */}
                              <rect x="34" y="52" width="12" height="10" rx="2" fill={fillFor("Neck")} onClick={() => toggleBodyPart("Neck")} />
                              {/* Back (Torso) */}
                              <rect x="22" y="64" width="36" height="60" rx="6" fill={fillFor("Back")} onClick={() => toggleBodyPart("Back")} />
                              {/* Worker's Left Arm (Left on screen for BACK) */}
                              <rect x="0" y="64" width="16" height="56" rx="6" fill={fillFor("Arm (L)")} onClick={() => toggleBodyPart("Arm (L)")} />
                              {/* Worker's Right Arm (Right on screen for BACK) */}
                              <rect x="64" y="64" width="16" height="56" rx="6" fill={fillFor("Arm (R)")} onClick={() => toggleBodyPart("Arm (R)")} />
                              {/* Worker's Left Leg (Left on screen for BACK) */}
                              <rect x="22" y="128" width="14" height="70" rx="6" fill={fillFor("Leg (L)")} onClick={() => toggleBodyPart("Leg (L)")} />
                              {/* Worker's Right Leg (Right on screen for BACK) */}
                              <rect x="44" y="128" width="14" height="70" rx="6" fill={fillFor("Leg (R)")} onClick={() => toggleBodyPart("Leg (R)")} />
                            </svg>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginTop: 8 }}>BACK</div>
                          </div>

                        </div>
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
                            }}>+ Add</button>
                          </div>
                        </div>
                        <label className="mod-form-label" style={{ marginTop: 24, textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>Selected injured areas</label>
                        <div className="chip-list bodyj-chips" style={{ border: "1px dashed var(--border-color)", padding: 12, borderRadius: 8, minHeight: 80, display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {bodyParts.map(bp => (
                            <div key={bp} style={{ background: "var(--bg-dark)", border: "1px solid var(--border-color)", padding: "4px 8px 4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                              {bp}
                              <button onClick={() => setBodyParts(bodyParts.filter(p => p !== bp))} style={{ background: "var(--color-gray-bg)", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* K. Immediate Actions Taken */}
                  <div className="fsec"><div className="fsec-title" style={{ justifyContent: "space-between" }}>
                    <span>K. Immediate Actions Taken</span>
                    <button className="mod-btn-outline" onClick={() => setImmActions([...immActions, { action: '', responsible: '', time: '' }])} style={{ padding: "4px 12px", fontSize: "12px" }}>+ Add Action</button></div>
                    
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
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: 12 }}>
                              <div className="mod-form-group" style={{ flex: 1 }}>
                                <label className="mod-form-label" style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>Date</label>
                                <input type="date" className="mod-form-input" value={act.date || ""} onChange={e => { const updated = [...immActions]; updated[idx].date = e.target.value; setImmActions(updated); }} />
                              </div>
                              <div className="mod-form-group" style={{ flex: 1 }}>
                                <label className="mod-form-label" style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>Time Implemented</label>
                                <input type="text" readOnly className="mod-form-input" placeholder="Select time" value={act.time || ""} style={{ cursor: "pointer" }} onClick={() => { setTempActionTime(act.time || "12:00"); setShowActionTimePicker(idx); }} />
                              </div>
                              <button style={{ padding: "6px 12px", border: "1px solid var(--color-risk-bg)", background: "var(--bg-card)", color: "var(--color-risk)", borderRadius: 6, fontSize: 12, cursor: "pointer", height: 36 }} onClick={() => setImmActions(immActions.filter((_, i) => i !== idx))}>Remove</button>
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
                      <textarea className="mod-form-textarea" placeholder="Initial view on why the incident occurred..."></textarea>
                    </div>
                    <div className="grid-2">
                      <div className="mod-form-group"><label className="mod-form-label">Environmental Conditions</label>
                        <select className="mod-form-select">
                          <option value="">Select...</option>
                          {['Normal', 'Wet/Slippery', 'Poor Lighting', 'High Noise', 'Confined', 'Extreme Temperature', 'Windy'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="mod-form-group"><label className="mod-form-label">Equipment Involved</label>
                        <select className="mod-form-select">
                          <option value="">Select...</option>
                          {['None', 'Hand Tools', 'Power Tools', 'Crane/Lifting', 'Scaffold', 'MEWP', 'Vehicle/Plant', 'Electrical Equipment'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="fsec">
                    <div className="fsec-note">Distribution: NNE Site HSE, NNE Construction Management</div>
                    <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                      <button className="mod-btn-primary im-btn-primary" onClick={async () => { 
                        try {
                          const formData = new FormData();
                          formData.append("natureOfInjury", "Some injury data"); // In a real app we'd map this from state
                          
                          const actSev = document.getElementById("select-actual-severity")?.value;
                          const potSev = document.getElementById("select-potential-severity")?.value;
                          
                          if (actSev) formData.append("actualSeverity", Number(actSev));
                          if (potSev) formData.append("potentialSeverity", Number(potSev));
                          
                          // If photos exist, add them (assuming base64 data URLs for now, need conversion if backend expects files)
                          // In a real app, we convert Data URL to blob. For now, sending as string if backend accepts or skipping.
                          
                          await submitInitialReport(id, formData);
                          setInitialReportSubmitted(true);
                          window.scrollTo(0,0);
                          const data = await getIncidentById(id);
                          setRawIncident(data?.data || data);
                        } catch (err) {
                          console.error("Failed to submit initial report", err);
                        }
                      }}>Submit Initial Incident Report</button>
                      <button className="mod-btn-outline">Save Draft</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        <div className={`inc-tab-panel ${activeTab === "investigation" ? "active" : ""}`}>
             {!initialReportApproved ? (
               <div className="mod-card"><div className="mod-card-body"><div className="locked-state">
                  <div className="locked-icon"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg></div>
                  <div className="locked-title">Investigation Report Not Yet Available</div>
                  <div className="locked-text">Available after the Initial Incident Report is completed. Due by <b>7d from event</b>.</div>
                </div></div></div>
             ) : !investigationStarted ? (
               <div className="mod-card" style={{ padding: "80px 32px", textAlign: "center", borderTop: "4px solid var(--accent-primary)" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-main)", marginBottom: 12 }}>Incident Investigation Report (7 days)</div>
                  <div style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>The Initial Incident Report is complete. You can now begin the full investigation report.</div>
                  <button className="mod-btn-primary im-btn-primary" style={{ padding: "10px 24px", fontSize: 14 }} onClick={() => { setInvestigationStarted(true); window.scrollTo(0,0); }}>Start Investigation Report</button>
               </div>
             ) : investigationSubmitted ? (
                 <div>
                  {invAudit.length > 0 && (
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
                          {invAudit.map((step, i) => renderAuditCard(step, i, invAudit.length))}
                        </div>
                      </div>
                    </div>
                  )}
                  {investigationApproved && (
                    <div style={{ marginTop: 16 }}>
                      <button className="mod-btn-primary im-btn-primary" style={{ background: "var(--color-risk)", fontWeight: 600 }} onClick={async () => {
                              try {
                                await closeIncident(id, { closedBy: "Site HSE Admin" });
                                showSuccess("Incident Closed Successfully!");
                                const data = await getIncidentById(id);
                                setRawIncident(data?.data || data);
                              } catch (err) {
                                const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to close incident";
                                showError(Array.isArray(msg) ? msg[0] : msg);
                              }
                            }}>Close Incident</button>
                    </div>
                  )}
                  {!investigationApproved && (
                    <div className="mod-card mb-4">
                      <div className="mod-card-header">
                        <span className="mod-card-title">Review & Sign-Off: Investigation Report {incident.id}</span>
                      </div>
                      <div className="mod-card-body">
                          <>
                            <div className="mod-form-group">
                            <label className="mod-form-label">Review Comments</label>
                            <textarea className="mod-form-textarea" placeholder="Add review comments..." rows="3"></textarea>
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
                            <input type="checkbox" checked={invRevMarkedOk} onChange={() => {}} />
                            <div>
                              <div className="mk-t">Marked OK</div>
                              <div className="mk-s">I have reviewed this report and confirm it is complete and accurate.</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                            <button className="mod-btn-outline" style={{ color: "var(--color-risk)", borderColor: "var(--color-risk-bg)" }}>Return for Revision</button>
                            <button className="mod-btn-primary im-btn-primary" disabled={!invRevMarkedOk || !invRevSignature || !invReviewerName || !invReviewerRole} onClick={async () => {
                              try {
                                await reviewInvestigation(id, { 
                                  signature: invRevSignature, 
                                  reviewedBy: invReviewerName,
                                  reviewerRole: invReviewerRole 
                                });
                                setInvestigationApproved(true);
                                window.scrollTo(0, 0);
                                const data = await getIncidentById(id);
                                setRawIncident(data?.data || data);
                              } catch (err) {
                                console.error("Failed to approve investigation", err);
                              }
                            }}>Approve & Sign Off</button>
                          </div>
                        </>
                      </div>
                    </div>
                  )}
               </div>
             ) : (
               <div className="mod-card">
                 <div className="mod-card-header"><span className="mod-card-title">Incident Investigation Report (7 days)</span><span className="inv-chip chip-inprogress">In Progress</span></div>
                 <div className="mod-card-body">
                   
                   {/* 1. Investigation Team */}
                   <div className="fsec"><div className="fsec-title" style={{ justifyContent: "space-between", display: "flex" }}>
                     <span>1. Investigation Team</span>
                     <button className="mod-btn-outline" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={addInvTeamMember}>+ Add Member</button>
                   </div>
                   {invTeam.length === 0 ? <div className="muted-empty" style={{ fontStyle: "italic", fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>No team members added yet.</div> : invTeam.map((m, i) => (
                     <div key={i} className="subcard" style={{ border: "1px solid var(--border-color)", padding: 16, borderRadius: 8, marginBottom: 12 }}>
                       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                         <span style={{ fontWeight: 700, fontSize: 13 }}>Member {i+1}</span>
                         <button className="subcard-remove" style={{ color: "var(--color-risk)", background: "transparent", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }} onClick={() => removeInvTeamMember(i)}>Remove</button>
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
                     <button className="mod-btn-outline" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={addInvWitness}>+ Add Witness</button>
                   </div>
                   <div className="fsec-note">Witness statements are collected as part of the investigation. Attach the signed Witness Statement form under Mandatory Attachments.</div>
                   {invWitnesses.length === 0 ? <div className="muted-empty" style={{ fontStyle: "italic", fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>No witnesses added yet.</div> : invWitnesses.map((w, i) => (
                     <div key={i} className="subcard" style={{ border: "1px solid var(--border-color)", padding: 16, borderRadius: 8, marginBottom: 12 }}>
                       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                         <span style={{ fontWeight: 700, fontSize: 13 }}>Witness {i+1}</span>
                         <button className="subcard-remove" style={{ color: "var(--color-risk)", background: "transparent", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }} onClick={() => removeInvWitness(i)}>Remove</button>
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
                   <div className="fsec"><div className="fsec-title">4. Fishbone Analysis – Cause and Effect</div>
                     <div className="fsec-note">Interactive Ishikawa diagram. Add causes under the six categories – People, Machine / Equipment, Method / Procedure, Materials, Environmental Conditions, Measurement.</div>
                     {renderFishboneSvg()}
                     <div className="fsec-note" style={{ marginTop: 12, padding: "12px", background: "var(--bg-dark)", borderRadius: 8 }}>
                       <b>Tick the box on any cause</b> – in whichever categories you choose – to carry it into the 5 Whys analysis below. Scoring (1 Low – 5 High) is optional.
                     </div>
                     <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
                       {FISHBONE_CATS.map(cat => (
                         <div key={cat.key} style={{ borderTop: `4px solid ${cat.color}`, background: "var(--bg-card, #fff)", border: "1px solid var(--border-color)", borderTopColor: cat.color, padding: 16, borderRadius: 8, overflow: "hidden", boxShadow: "var(--shadow-sm, 0 2px 4px rgba(0,0,0,0.02))" }}>
                           <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)", marginBottom: 2 }}>{cat.label}</div>
                           <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>{cat.hint}</div>
                           <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "stretch" }}>
                             <input 
                               placeholder="Add cause..." 
                               value={fishboneInput[cat.key]} 
                               onChange={e => setFishboneInput({...fishboneInput, [cat.key]: e.target.value})} 
                               onKeyDown={e => e.key === 'Enter' && addFishboneCause(cat.key)}
                               style={{ flex: 1, padding: "10px 12px", fontSize: 13, border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 6, background: "var(--bg-dark, #fff)", outline: "none", color: "var(--text-main)" }}
                             />
                             <button 
                               style={{ background: "var(--accent-primary, #0f172a)", border: "none", color: "#fff", padding: "0 16px", borderRadius: 6, cursor: "pointer", fontSize: 18, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center" }} 
                               onClick={() => addFishboneCause(cat.key)}
                             >+</button>
                           </div>
                           {fishbone[cat.key].map((cause, i) => (
                             <div key={i} style={{ border: "1px solid var(--border-color)", padding: 12, borderRadius: 8, marginBottom: 10, background: cause.probable ? "var(--color-risk-bg, #fff1f2)" : "var(--bg-dark, #fff)", borderColor: cause.probable ? "var(--color-risk, #f43f5e)" : "var(--border-color, #e2e8f0)" }}>
                               <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                 <input type="checkbox" checked={cause.probable} onChange={() => toggleFishboneProbable(cat.key, i)} style={{ marginTop: 2, accentColor: "var(--color-risk, #e11d48)", width: 16, height: 16, cursor: "pointer" }} />
                                 <span style={{ flex: 1, fontSize: 13, color: "var(--text-main)", lineHeight: 1.4 }}>{cause.text}</span>
                                 <button style={{ background: "var(--color-gray-bg, #f1f5f9)", border: "none", color: "var(--text-muted, #64748b)", cursor: "pointer", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }} onClick={() => removeFishboneCause(cat.key, i)}>×</button>
                               </div>
                               <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center" }}>
                                 <span style={{ fontSize: 12, color: "var(--text-muted)", marginRight: 4 }}>Score:</span>
                                 {[1,2,3,4,5].map(s => (
                                   <button 
                                     key={s} 
                                     style={{ 
                                       width: 26, height: 26, padding: 0, 
                                       border: `1px solid ${cause.score===s ? 'var(--accent-primary, #0f172a)' : 'var(--border-color, #e2e8f0)'}`, 
                                       background: cause.score===s ? 'var(--accent-primary, #0f172a)' : 'var(--bg-card, #fff)', 
                                       color: cause.score===s ? '#fff' : 'var(--text-muted, #64748b)', 
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
                         <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>No causes selected yet. Tick any cause above – in any category – to analyse it.</div>
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
                               {[0,1,2,3,4].map(w => (
                                 <div key={w} className="mod-form-group" style={{ marginBottom: 12 }}>
                                   <label className="mod-form-label">Why {w+1}</label>
                                   <input className="mod-form-input" value={whys[w] || ""} onChange={e => {
                                     const newW = [...whys];
                                     newW[w] = e.target.value;
                                     setFiveWhys({...fiveWhys, [c.id]: newW});
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
                     <button className="mod-btn-outline" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={addInvRootCause}>+ Add Root Cause</button>
                   </div>
                   {invRootCauses.length === 0 ? <div className="muted-empty" style={{ fontStyle: "italic", fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>No root causes added yet.</div> : invRootCauses.map((rc, i) => (
                     <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                       <span style={{ fontWeight: 700, color: "var(--accent-primary)", width: 24 }}>{i+1}.</span>
                       <input className="mod-form-input" style={{ flex: 1 }} value={rc} onChange={e => updateInvRootCause(i, e.target.value)} />
                       <button className="subcard-remove" style={{ color: "var(--color-risk)", background: "transparent", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }} onClick={() => removeInvRootCause(i)}>Remove</button>
                     </div>
                   ))}
                   </div>

                   {/* 10. Contributing Factors */}
                   <div className="fsec"><div className="fsec-title" style={{ justifyContent: "space-between", display: "flex" }}>
                     <span>10. Contributing Factors</span>
                     <button className="mod-btn-outline" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={addInvFactor}>+ Add Factor</button>
                   </div>
                   <div className="fsec-note">e.g. Human Factor, Environmental Factor, Procedural Factor</div>
                   {invFactors.length === 0 ? <div className="muted-empty" style={{ fontStyle: "italic", fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>No contributing factors added yet.</div> : invFactors.map((f, i) => (
                     <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                       <span style={{ fontWeight: 700, color: "var(--accent-primary)", width: 24 }}>{i+1}.</span>
                       <input className="mod-form-input" style={{ flex: 1 }} value={f} onChange={e => updateInvFactor(i, e.target.value)} />
                       <button className="subcard-remove" style={{ color: "var(--color-risk)", background: "transparent", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }} onClick={() => removeInvFactor(i)}>Remove</button>
                     </div>
                   ))}
                   </div>

                   {/* 11. Severity Assessment */}
                   <div className="fsec"><div className="fsec-title">11. Severity Assessment</div>
                     <div className="fsec-note">Assess the consequence severity (1 – 5) using the Severity Table. Record the severity before and after the corrective actions.</div>
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
                         Severity Reduction: {invPreSev} ({SEVERITY_SCALE.find(s=>s.level===invPreSev)?.label}) → {invPostSev} ({SEVERITY_SCALE.find(s=>s.level===invPostSev)?.label})
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
                         <span style={{ fontWeight: 700, fontSize: 13 }}>Action #{i+1}</span>
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
                       <button className="mod-btn-outline" style={{ fontSize: 13 }} onClick={() => setIsInvCameraActive(true)}>Take Photo</button>
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
                           <img src={p} alt={`photo ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                           <button style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", border: "none", background: "var(--color-risk)", color: "#fff", cursor: "pointer", fontSize: 12, lineHeight: 1 }} onClick={() => setInvPhotos(invPhotos.filter((_, idx) => idx !== i))}>×</button>
                         </div>
                       ))}
                     </div>
                   </div>

                   {/* 15. Mandatory Attachments */}
                   <div className="fsec"><div className="fsec-title">15. Mandatory Attachments</div>
                     <div className="fsec-note">All items must be attached. If not available, provide an explanation below.</div>
                     <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                       {INV_MANDATORY_ATTACHMENTS.map((item, i) => (
                         <label key={i} className="chk" style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, cursor: "pointer" }}>
                           <input type="checkbox" checked={invAttachments[i]} onChange={e => {
                             const newAtt = [...invAttachments];
                             newAtt[i] = e.target.checked;
                             setInvAttachments(newAtt);
                           }} style={{ marginTop: 2 }} />
                           <span>{item}</span>
                         </label>
                       ))}
                     </div>
                     <div className="mod-form-group"><label className="mod-form-label" style={{ textTransform: "none", letterSpacing: "normal" }}>Explanation for missing attachments</label>
                       <textarea className="mod-form-textarea" placeholder="Explain any missing mandatory attachments..." value={invMissingExplain} onChange={e => setInvMissingExplain(e.target.value)}></textarea>
                     </div>
                   </div>


                   {/* 17. Signature */}
                   <div className="fsec"><div className="fsec-title">17. Signature</div>
                     <div className="fsec-note">The Site HSE Investigator signs the completed report. It then routes to the reviewer (always Site HSE) for sign-off in the next step.</div>
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
                         <input type="checkbox" checked={invInvMarkedOk} onChange={() => {}} />
                         <div>
                           <div className="mk-t">Marked OK</div>
                           <div className="mk-s">Confirmed by investigator.</div>
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Footer */}
                   <div className="fsec">
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

                           const payload = {
                             investigationDetails: invDetails,
                             problemStatement: invProblem,
                             fishboneData: fishboneDataPayload,
                             fiveWhysData: fiveWhysDataPayload,
                             rootCauses: invRootCauses,
                             contributingFactors: invFactors,
                             mandatoryAttachments: {
                               witnessStatement: invAttachments[0] || false,
                               rams: invAttachments[2] || false,
                               trainingRecords: invAttachments[5] || false,
                               permitsToWork: invAttachments[4] || false,
                               safePlanOfAction: invAttachments[3] || false
                             },
                             signatures: [
                               {
                                 role: invInvRole || "Site HSE Investigator",
                                 name: invInvName,
                                 signature: invInvSignature,
                                 date: invInvDate
                               }
                             ]
                           };
                           await saveInvestigation(id, payload);
                           await Swal.fire({ title: "Success!", text: "Investigation Report Submitted!", icon: "success", confirmButtonColor: "#0f172a" });
                           setInvestigationSubmitted(true);
                           window.scrollTo(0,0);
                           const data = await getIncidentById(id);
                           setRawIncident(data?.data || data);
                         } catch (err) {
                           console.error("Failed to submit investigation", err);
                         }
                       }}>Submit Investigation Report</button>
                       <button className="mod-btn-outline">Save Draft</button>
                     </div>
                   </div>

                 </div>
               </div>
             )}
          </div>

        <div className={`inc-tab-panel ${activeTab === "actions" ? "active" : ""}`}>
             <div className="mod-card">
               <div className="mod-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="mod-card-title">Corrective Actions</span>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button className="mod-btn-primary im-btn-primary" style={{ background: "var(--color-risk)", padding: "6px 16px", fontSize: "13px", fontWeight: 600 }} onClick={async () => {
                      try {
                        await closeIncident(id, { closedBy: "Site HSE Admin" });
                        showSuccess("Incident Closed Successfully!");
                        const data = await getIncidentById(id);
                        setRawIncident(data?.data || data);
                      } catch (err) {
                        const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to close incident";
                        showError(Array.isArray(msg) ? msg[0] : msg);
                      }
                    }}>Close Incident</button>
                    <button className="mod-btn-primary im-btn-primary" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={() => {
                      if (showAddAction) {
                        setShowAddAction(false);
                        setEditingActionId(null);
                        setNewAction({ action: "", responsible: "", targetDate: "", status: "PENDING" });
                      } else {
                        setShowAddAction(true);
                      }
                    }}>{showAddAction ? 'Cancel' : '+ Add Action'}</button>
                  </div>
               </div>
               {showAddAction && (
                 <div style={{ padding: "16px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-dark)" }}>
                   <div className="grid-2">
                     <div className="mod-form-group">
                       <label className="mod-form-label">Action Description</label>
                       <input className="mod-form-input" value={newAction.action} onChange={e => setNewAction({...newAction, action: e.target.value})} placeholder="Describe the action..." />
                     </div>
                     <div className="mod-form-group">
                       <label className="mod-form-label">Owner</label>
                       <input className="mod-form-input" value={newAction.responsible} onChange={e => setNewAction({...newAction, responsible: e.target.value})} placeholder="e.g. HSE Team" />
                     </div>
                     <div className="mod-form-group">
                       <label className="mod-form-label">Target Date</label>
                       <input type="date" className="mod-form-input" value={newAction.targetDate} onChange={e => setNewAction({...newAction, targetDate: e.target.value})} />
                     </div>
                     <div className="mod-form-group">
                       <label className="mod-form-label">Status</label>
                       <select className="mod-form-select" value={newAction.status} onChange={e => setNewAction({...newAction, status: e.target.value})}>
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
                 
                 return (
                   <>
                     <div className="mod-table-wrap">
                       <table className="mod-table">
                         <thead><tr><th>Action</th><th>Owner</th><th>Due</th><th>Status</th><th style={{ width: 100, textAlign: "right" }}>Actions</th></tr></thead>
                         <tbody>
                           {loadingActions ? (
                             <tr><td colSpan="5" style={{ textAlign: "center", padding: "48px 0" }}><Loader size="md" text="Loading Actions..." /></td></tr>
                           ) : currentActions.length === 0 ? (
                             <tr><td colSpan="5" style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>No actions found</td></tr>
                           ) : currentActions.map((a, i) => {
                             const statusColor = a.status === 'COMPLETED' ? { bg: '#dcfce7', text: '#16a34a' } : a.status === 'IN_PROGRESS' ? { bg: '#fef08a', text: '#ca8a04' } : { bg: '#f1f5f9', text: '#64748b' };
                             return (
                               <tr key={a.id || i}>
                                 <td>{a.action}</td>
                                 <td>{a.responsible}</td>
                                 <td>{a.targetDate ? new Date(a.targetDate).toLocaleDateString() : '—'}</td>
                                 <td>
                                   <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", background: statusColor.bg, color: statusColor.text }}>{a.status?.replace('_', ' ')}</span>
                                 </td>
                                 <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                   <button onClick={() => editAction(a)} style={{ background: "var(--color-caution-bg)", border: "none", color: "var(--color-caution)", cursor: "pointer", marginRight: 8, padding: "6px", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }} title="Edit">
                                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                   </button>
                                   <button onClick={() => deleteAction(a.id)} style={{ background: "var(--color-risk-bg)", border: "none", color: "var(--color-risk)", cursor: "pointer", padding: "6px", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }} title="Delete">
                                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                   </button>
                                 </td>
                               </tr>
                             );
                           })}
                         </tbody>
                       </table>
                     </div>
                     
                     {!loadingActions && totalPages > 1 && (
                       <div className="beam-pagination">
                         <button className="beam-page-btn" disabled={actionPage === 1} onClick={() => setActionPage(actionPage - 1)}>←</button>
                         {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                           <button key={page} className={`beam-page-number ${actionPage === page ? "beam-page-number--active" : ""}`} onClick={() => setActionPage(page)}>
                             {page}
                           </button>
                         ))}
                         <button className="beam-page-btn" disabled={actionPage === totalPages} onClick={() => setActionPage(actionPage + 1)}>→</button>
                       </div>
                     )}
                   </>
                 );
               })()}
             </div>
        </div>
      </div>
          </div>
          );
}
