import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import { createHeadsUp } from "../../../services/incidentService";
import "../../../styles/module-shared.css";
import "./IMList.css";
import FloorDrawing from "../../../pages/Request/FloorDrawing/FloorDrawing";
import { FLOOR_PDFS } from "../../../data/pdfMapping";
import { ZONE_MAPPING } from "../../../data/zones";
import { BUILDINGS } from "../../../data/buildings";
import { getBuildings, getRooms, getFloors, getContractors } from "../../../services/authService";

export const AnalogTimePicker = ({ initialTime, onSave, onCancel }) => {
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [mode, setMode] = useState("hour"); 

  useEffect(() => {
    if (initialTime) {
      const [h, m] = initialTime.split(":").map(Number);
      if (!isNaN(h)) setHour(h);
      if (!isNaN(m)) setMinute(m);
    }
  }, [initialTime]);

  const handleSave = (e) => {
    e.stopPropagation();
    const formattedHour = String(hour).padStart(2, "0");
    const formattedMinute = String(minute).padStart(2, "0");
    onSave(`${formattedHour}:${formattedMinute}`);
  };

  const size = 220;
  const radius = size / 2;
  const center = radius;

  const renderHourNumbers = () => {
    const items = [];
    for (let h = 1; h <= 12; h++) {
      const angle = ((h * 30 - 90) * Math.PI) / 180;
      const r = radius - 25;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      const isSelected = hour === h;
      items.push(
        <div key={`out-${h}`} onClick={(e) => { e.stopPropagation(); setHour(h); setMode("minute"); }} className={`time-dial-number ${isSelected ? "selected" : ""}`} style={{ left: `${x}px`, top: `${y}px` }}>
          {h}
        </div>
      );
    }
    for (let h = 13; h <= 24; h++) {
      const displayH = h === 24 ? 0 : h;
      const angle = (((h - 12) * 30 - 90) * Math.PI) / 180;
      const r = radius - 55;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      const isSelected = hour === displayH;
      items.push(
        <div key={`in-${h}`} onClick={(e) => { e.stopPropagation(); setHour(displayH); setMode("minute"); }} className={`time-dial-number inner ${isSelected ? "selected" : ""}`} style={{ left: `${x}px`, top: `${y}px` }}>
          {displayH === 0 ? "00" : displayH}
        </div>
      );
    }
    return items;
  };

  const renderMinuteNumbers = () => {
    const items = [];
    for (let m = 0; m < 60; m += 5) {
      const angle = ((m * 6 - 90) * Math.PI) / 180;
      const r = radius - 25;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      const isSelected = Math.round(minute / 5) * 5 === m;
      items.push(
        <div key={m} onClick={(e) => { e.stopPropagation(); setMinute(m); }} className={`time-dial-number ${isSelected ? "selected" : ""}`} style={{ left: `${x}px`, top: `${y}px` }}>
          {String(m).padStart(2, "0")}
        </div>
      );
    }
    return items;
  };

  let handAngle = 0;
  let handLength = radius - 25;
  if (mode === "hour") {
    const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    handAngle = h * 30 - 90;
    if (hour === 0 || hour > 12) {
      handLength = radius - 55;
    }
  } else {
    handAngle = minute * 6 - 90;
  }
  const handRad = (handAngle * Math.PI) / 180;
  const handX = center + handLength * Math.cos(handRad);
  const handY = center + handLength * Math.sin(handRad);

  return ReactDOM.createPortal(
    <div className="timekeeper-modal-overlay" onClick={(e) => { e.stopPropagation(); onCancel(); }}>
      <div className="timekeeper-modal-container custom-picker" onClick={(e) => e.stopPropagation()}>
        <div className="timekeeper-header">
          <div className="timekeeper-time-display">
            <span className={`timekeeper-time-unit ${mode === "hour" ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); setMode("hour"); }}>
              {String(hour).padStart(2, "0")}
            </span>
            <span className="timekeeper-time-colon">:</span>
            <span className={`timekeeper-time-unit ${mode === "minute" ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); setMode("minute"); }}>
              {String(minute).padStart(2, "0")}
            </span>
          </div>
        </div>
        <div className="timekeeper-dial-wrapper">
          <div className="timekeeper-dial" style={{ width: `${size}px`, height: `${size}px` }}>
            <svg className="timekeeper-hand-svg" width={size} height={size}>
              <line x1={center} y1={center} x2={handX} y2={handY} stroke="#0ea5e9" strokeWidth="2" />
              <circle cx={center} cy={center} r="4" fill="#0ea5e9" />
              <circle cx={handX} cy={handY} r="14" fill="rgba(14, 165, 233, 0.3)" />
              <circle cx={handX} cy={handY} r="4" fill="#0ea5e9" />
            </svg>
            {mode === "hour" ? renderHourNumbers() : renderMinuteNumbers()}
          </div>
        </div>
        <div className="timekeeper-modal-actions">
          <button type="button" className="timekeeper-modal-btn" onClick={(e) => { e.stopPropagation(); onCancel(); }}>Cancel</button>
          <button type="button" className="timekeeper-modal-btn" onClick={handleSave}>OK</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const CreateIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
);

const SignaturePad = ({ value, onChange, onClear }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
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
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault(); 
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

const severityOptions = [
  { level: 1, label: "1 - Insignificant", desc: "Small injury/bruises or no local damage" },
  { level: 2, label: "2 - Minor", desc: "Minor injury or small spill cleaned up immediately" },
  { level: 3, label: "3 - Moderate", desc: "Serious injury (no absence) or serious damage/major spills" },
  { level: 4, label: "4 - Critical", desc: "One or more injuries (permanent) or damage hard to reverse" },
  { level: 5, label: "5 - Catastrophic", desc: "One or more deaths or irreversible damage" }
];

const projects = [
  { id: "m3-south", name: "M3 South", buildings: ["Block A", "Block B", "Block C", "Level 3", "Block E"] },
  { id: "m3-north", name: "M3 North", buildings: ["Zone C", "South Yard", "Logistics Area", "Tank Farm", "Zone D"] },
  { id: "m3-infra", name: "M3 Infrastructure", buildings: ["Basement", "Workshop", "Block D", "Zone A", "Block F"] }
];


const incidentCategories = [
  "Near Miss", "No Treatment Injury", "First Aid Injury", "Medical Treatment Injury",
  "Restricted Work Injury", "Loss Time Injury", "Permanent Disability", "Fatality",
  "Occupational Illness", "Environmental Incident", "Property Damage"
];

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

const initialForm = {
  project: "M3 South", title: "", date: "", time: "", location: "", floor: "", specificLocation: "", contractor: "",
  categories: [], actual: "", potential: "", description: "", consequence: "",
  envSpillType: [], envSpillOther: "", envSpilledWhat: "", envCause: "", envQuantity: "", envSpecify: [], envSpecifyOther: "",
  immActions: [{ action: "", responsible: "", date: "", time: "", implemented: false }],
  gatekeeperInformed: null, gatekeeperName: "",
  submitterName: getLoggedInUser(), signature: false
};

function IMCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState("");
  const [showActionTimePicker, setShowActionTimePicker] = useState(null);
  const [tempActionTime, setTempActionTime] = useState("");

  // Location Selection States
  const [building, setBuilding] = useState("");
  const [level, setLevel] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [contractorsList, setContractorsList] = useState([]);
  const [isLoadingSelectors, setIsLoadingSelectors] = useState(true);
  const [roomStatusMap, setRoomStatusMap] = useState({});

  useEffect(() => {
    const loadSelectors = async () => {
      try {
        const [buildingsRes, floorsRes, roomsRes, contractorsRes] = await Promise.all([
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getRooms(1, 20000),
          getContractors(1, 1000)
        ]);
        setBuildingsList(buildingsRes?.data ?? []);
        setFloorsList(floorsRes?.data ?? []);
        setRoomsList(roomsRes?.data?.rows ?? roomsRes?.data ?? roomsRes ?? []);
        setContractorsList(contractorsRes?.data?.rows ?? contractorsRes?.data ?? contractorsRes ?? []);
      } catch (err) {
        console.error("Failed to load request form selector data", err);
      } finally {
        setIsLoadingSelectors(false);
      }
    };
    loadSelectors();
  }, []);

  const levels = building ? floorsList.filter(f => String(f.build_id) === String(building)).map(f => f.floor_name) : [];
  
  const selectedPdf = React.useMemo(() => {
    if (!building || !level) return "";
    const dbBuilding = buildingsList.find(b => String(b.build_id || b.id) === String(building));
    const bName = dbBuilding ? dbBuilding.building_name : "";
    if (!bName) return "";
    const staticB = BUILDINGS.find(item => item.name.toLowerCase().trim() === bName.toLowerCase().trim());
    const staticBuildingId = staticB ? staticB.id : "";
    if (!staticBuildingId) return "";
    const pdfsForBuilding = FLOOR_PDFS[staticBuildingId];
    if (!pdfsForBuilding) return "";
    if (pdfsForBuilding[level]) return pdfsForBuilding[level];
    const levelLower = level.toLowerCase().trim();
    const foundKey = Object.keys(pdfsForBuilding).find(k => 
      k.toLowerCase().trim().includes(levelLower) || levelLower.includes(k.toLowerCase().trim())
    );
    return foundKey ? pdfsForBuilding[foundKey] : "";
  }, [building, level, buildingsList]);

  const selectedZones = React.useMemo(() => {
    if (!level) return [];
    let zonesForLevel = ZONE_MAPPING[level] || [];
    if (zonesForLevel.length === 0) {
      const levelLower = level.toLowerCase().trim();
      const foundKey = Object.keys(ZONE_MAPPING).find(k =>
        k.toLowerCase().trim().includes(levelLower) || levelLower.includes(k.toLowerCase().trim())
      );
      if (foundKey) zonesForLevel = ZONE_MAPPING[foundKey];
    }
    return zonesForLevel;
  }, [level]);

  const handleRoomsSelected = (rooms) => {
    setSelectedRooms(rooms);
    const formattedRooms = (rooms || []).map((rStr) => {
      const roomClean = String(rStr).trim();
      if (!roomClean) return "";
      const matchedDbRoom = roomsList.find(
        (dbR) =>
          String(dbR.room_name || dbR.room || dbR.name || dbR.id).toLowerCase().trim() === roomClean.toLowerCase() ||
          roomClean.toLowerCase().includes(String(dbR.room_name || dbR.room || "").toLowerCase().trim())
      );
      let zoneName = matchedDbRoom?.zone_name || matchedDbRoom?.zone || "";
      if (!zoneName && selectedZones && selectedZones.length > 0) {
        const foundZoneObj = selectedZones.find((zObj) => {
          const roomListInZone = zObj.rooms || zObj.roomList || [];
          return roomListInZone.some(
            (zr) => String(zr).toLowerCase().trim() === roomClean.toLowerCase()
          );
        });
        if (foundZoneObj) {
          zoneName = foundZoneObj.zone || foundZoneObj.zone_name || foundZoneObj.name || "";
        }
      }
      return zoneName ? `${zoneName}:${roomClean}` : roomClean;
    }).filter(Boolean).join(", ");

    // Sync with form state for validation
    setForm(prev => ({
      ...prev,
      location: building,
      floor: level,
      specificLocation: formattedRooms
    }));
    if (errors.location) setErrors(prev => ({ ...prev, location: null }));
  };

  useEffect(() => {
    if (building && level) {
      setForm(prev => ({ ...prev, location: building, floor: level }));
      if (errors.location) setErrors(prev => ({ ...prev, location: null }));
    }
  }, [building, level]);

  const required = ["project", "title", "date", "time", "location"];

  const validate = () => {
    const errs = {};
    required.forEach(f => { if (!form[f]) errs[f] = "This field is required"; });
    if (form.categories.length === 0) errs.categories = "Select at least one category";
    if (!form.actual && !form.categories.includes("Near Miss")) errs.actual = "Actual severity is required";
    if (!form.potential) errs.potential = "Potential severity is required";
    if (!form.signature) errs.signature = "Signature is required";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      return next;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleCategoryToggle = (cat) => {
    setForm(prev => {
      const newCats = prev.categories.includes(cat) 
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories: newCats };
    });
    if (errors.categories) setErrors(prev => ({ ...prev, categories: null }));
  };

  const handleEnvToggle = (field, val) => {
    setForm(prev => {
      const arr = prev[field];
      const newArr = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
      return { ...prev, [field]: newArr };
    });
  };

  const addAction = () => setForm(prev => ({ ...prev, immActions: [...prev.immActions, { action: "", responsible: "", time: "", implemented: false }] }));
  const updateAction = (idx, field, val) => {
    setForm(prev => {
      const newActions = [...prev.immActions];
      newActions[idx][field] = val;
      return { ...prev, immActions: newActions };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setIsLoadingSelectors(true); // Reusing for loading indicator
    try {
      const payload = {
        projectName: form.project,
        projectId: 1, // Dynamic if list exists
        incidentDate: form.date,
        incidentTime: form.time,
        buildingId: Number(building),
        buildingName: buildingsList.find(b => String(b.build_id) === String(building))?.building_name || "",
        origin: "Direct",
        floorLevel: level,
        specificLocation: form.specificLocation,
        contractorsInvolved: form.contractor,
        categories: form.categories,
        actualSeverity: form.actual ? Number(form.actual) : undefined,
        potentialSeverity: form.potential ? Number(form.potential) : undefined,
        isHipo: Number(form.potential) >= 4 || Number(form.actual) >= 4,
        descriptionWhatHappened: form.description,
        descriptionConsequence: form.consequence,
        isEnvironmental: form.categories.includes("Environmental Incident"),
        spillType: form.envSpillType,
        spillSubstance: form.envSpilledWhat,
        spillCause: form.envCause,
        spillQuantity: form.envQuantity,
        spillSystemEntered: form.envSpecify,
        immediateActions: form.immActions.map(a => ({
          action: a.action,
          responsible: a.responsible,
          timeImplemented: a.time,
          targetDate: form.date
        })),
        gatekeeperInformed: form.gatekeeperInformed,
        gatekeeperName: form.gatekeeperName,
        submittedBy: form.submitterName || getLoggedInUser() || "User",
        signature: form.signature
      };

      await createHeadsUp(payload);
      setSubmitted(true);
      setTimeout(() => navigate("/incident-management/list"), 2000);
    } catch (err) {
      console.error("Failed to submit Heads-Up Notification", err);
      setErrors({ api: "Failed to submit. Please try again." });
    } finally {
      setIsLoadingSelectors(false);
    }
  };

  const isEnv = form.categories.includes("Environmental Incident");

  if (submitted) {
    return (
      <div className="mod-page">
        <div className="mod-card" style={{ maxWidth: 480, margin: "60px auto", textAlign: "center", padding: "48px 32px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-safe-bg)", color: "var(--color-safe)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h3 style={{ color: "var(--text-main)", margin: "0 0 8px 0" }}>Heads-Up Notification Submitted</h3>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>
            The incident has been reported. Redirecting to list�
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mod-page">
      <PageHeader
        title="Report New Incident"
        subtitle="Heads-Up Notification"
        icon={<CreateIcon />}
        breadcrumbs={[{ label: "Home" }, { label: "Incident Management" }, { label: "Report Incident" }]}
        actions={
          <button className="mod-btn-outline" onClick={() => navigate("/incident-management/list")}>
            ← Back to List
          </button>
        }
      />

      <div className="mod-card">
        <div className="mod-card-header">
          <h3 className="mod-card-title">1. Location & Identification</h3>
          {errors.api && <div style={{ color: "#DC2626", marginTop: "8px", fontSize: "0.875rem" }}>{errors.api}</div>}
          <div style={{ fontSize: "13px", color: "#b45309", background: "#fef3c7", border: "1px solid #fde68a", padding: "10px 16px", borderRadius: "8px", fontWeight: "600", display: "flex", overflow: "hidden", whiteSpace: "nowrap", marginTop: "8px" }}>
            <marquee scrollamount="5">⚠️ Must be completed within 2 hours of the incident occurrence.</marquee>
          </div>
        </div>
        <div className="mod-card-body">
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* 1. Project Details */}
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "16px" }}>
                  1. Project Details
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Project Name <span style={{ color: "#DC2626" }}>*</span></label>
                    <input name="project" type="text" className="mod-form-input" value={form.project} readOnly style={{ backgroundColor: "var(--bg-dark)", cursor: "not-allowed", color: "var(--text-muted)", opacity: 0.8 }} />
                    {errors.project && <span style={{ fontSize: "0.75rem", color: "#DC2626" }}>{errors.project}</span>}
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Title / Case number <span style={{ color: "#DC2626" }}>*</span></label>
                    <input name="title" type="text" className="mod-form-input" value={form.title} onChange={handleChange} placeholder="Enter title or case number" />
                    {errors.title && <span style={{ fontSize: "0.75rem", color: "#DC2626" }}>{errors.title}</span>}
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Date (YYYY-MM-DD) <span style={{ color: "#DC2626" }}>*</span></label>
                    <input name="date" type="date" className="mod-form-input" value={form.date} onChange={handleChange} placeholder="Select date" />
                    {errors.date && <span style={{ fontSize: "0.75rem", color: "#DC2626" }}>{errors.date}</span>}
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Time (24hr) <span style={{ color: "#DC2626" }}>*</span></label>
                    <input name="time" type="text" readOnly className="mod-form-input" value={form.time} onClick={() => { setTempTime(form.time || "12:00"); setShowTimePicker(true); }} placeholder="Select time" style={{ cursor: "pointer" }} />
                    {errors.time && <span style={{ fontSize: "0.75rem", color: "#DC2626" }}>{errors.time}</span>}
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Location/Building <span style={{ color: "#DC2626" }}>*</span></label>
                    <select
                      className="mod-form-select"
                      value={building}
                      onChange={(e) => {
                        setBuilding(e.target.value);
                        setLevel("");
                        setSelectedRooms([]);
                        setSelectedZone(null);
                      }}
                    >
                      <option value="">Select Building</option>
                      {buildingsList.map((item) => (
                        <option key={item.build_id} value={item.build_id}>
                          {item.building_name}
                        </option>
                      ))}
                    </select>
                    {errors.location && <span style={{ fontSize: "0.75rem", color: "#DC2626" }}>{errors.location}</span>}
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Floor/Level</label>
                    <select
                      className="mod-form-select"
                      value={level}
                      disabled={!building}
                      onChange={(e) => {
                        setLevel(e.target.value);
                        setSelectedRooms([]);
                        setSelectedZone(null);
                      }}
                    >
                      <option value="">Select Level</option>
                      {levels.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mod-form-group full-width">
                    {selectedPdf && (
                      <div style={{ position: "relative", marginTop: "16px", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden", minHeight: "400px" }}>
                        <FloorDrawing
                          pdf={selectedPdf}
                          zones={selectedZones}
                          level={level}
                          selectedRooms={selectedRooms}
                          onRoomsSelected={handleRoomsSelected}
                          roomStatusMap={roomStatusMap}
                        />
                      </div>
                    )}
                    <label className="mod-form-label" style={{ marginTop: "16px" }}>Specific location / Rooms (Auto-filled from drawing)</label>
                    <input name="specificLocation" type="text" className="mod-form-input" value={form.specificLocation} readOnly style={{ backgroundColor: "rgba(255,255,255,0.05)", cursor: "not-allowed", opacity: 0.7 }} />
                  </div>
                  <div className="mod-form-group full-width">
                    <label className="mod-form-label">Contractor(s) involved</label>
                    <select name="contractor" className="mod-form-select" value={form.contractor} onChange={handleChange}>
                      <option value="">Select...</option>
                      {contractorsList.map(c => <option key={c.id || c.subcontractor_id || c._id} value={c.subContractorName || c.name}>{c.subContractorName || c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Incident Records */}
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "16px" }}>
                  2. Incident Records
                </div>
                <div className="mod-form-group">
                  <label className="mod-form-label">Incident Category <span style={{ color: "#DC2626" }}>*</span></label>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>The categorisation may change following the incident investigation or if the incident develops further over time.</div>
                  <select 
                    className="mod-form-select" 
                    value={form.categories[0] || ""} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(prev => ({ ...prev, categories: val ? [val] : [] }));
                    }}
                  >
                    <option value="">Select Incident Category...</option>
                    {incidentCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.categories && <span style={{ fontSize: "0.75rem", color: "#DC2626", marginTop: "4px" }}>{errors.categories}</span>}
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Actual severity level & rating <span style={{ color: "#DC2626" }}>*</span></label>
                    <select name="actual" className="mod-form-select" value={form.actual} onChange={handleChange} disabled={form.categories.includes("Near Miss")}>
                      <option value="">Use the severity table from Risk Matrix...</option>
                      {severityOptions.map(s => <option key={s.level} value={s.level}>{s.label}</option>)}
                    </select>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>N/A for Near Miss</div>
                    {errors.actual && <span style={{ fontSize: "0.75rem", color: "#DC2626" }}>{errors.actual}</span>}
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Potential severity level & rating <span style={{ color: "#DC2626" }}>*</span></label>
                    <select name="potential" className="mod-form-select" value={form.potential} onChange={handleChange}>
                      <option value="">What could realistically have happened...</option>
                      {severityOptions.map(s => <option key={s.level} value={s.level}>{s.label}</option>)}
                    </select>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Ask what could realistically have happened if conditions were slightly different?</div>
                    {errors.potential && <span style={{ fontSize: "0.75rem", color: "#DC2626" }}>{errors.potential}</span>}
                  </div>
                </div>
              </div>

              {/* 3. Incident Description */}
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "16px" }}>
                  3. Incident Description
                </div>
                <div className="mod-form-group full-width" style={{ marginBottom: "16px" }}>
                  <label className="mod-form-label">Description of what happened?</label>
                  <textarea name="description" className="mod-form-textarea" value={form.description} onChange={handleChange} rows={4} placeholder="Describe the incident in detail"></textarea>
                </div>
                <div className="mod-form-group full-width">
                  <label className="mod-form-label">What is the consequence of this incident?</label>
                  <textarea name="consequence" className="mod-form-textarea" value={form.consequence} onChange={handleChange} rows={3} placeholder="What was the consequence?"></textarea>
                </div>
              </div>

              {/* 4. Environmental Incident Details */}
              {isEnv && (
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-caution)", borderBottom: "1px solid var(--color-caution-bg)", paddingBottom: "8px", marginBottom: "16px" }}>
                    4. Environmental Incident Details
                  </div>
                  <div style={{ background: "var(--color-caution-bg)", border: "1px solid rgba(217,119,6,0.3)", borderRadius: "8px", padding: "16px" }}>
                    <div className="mod-form-group" style={{ marginBottom: "16px" }}>
                      <label className="mod-form-label">Type of Spillage</label>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "8px" }}>
                        {["Oil and hydrocarbon spills", "Chemical Spill", "Paint Spill", "Other"].map(opt => (
                          <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                            <input type="checkbox" checked={form.envSpillType.includes(opt)} onChange={() => handleEnvToggle("envSpillType", opt)} /> {opt}
                          </label>
                        ))}
                      </div>
                      {form.envSpillType.includes("Other") && (
                        <input name="envSpillOther" type="text" className="mod-form-input" placeholder="Specify other..." value={form.envSpillOther} onChange={handleChange} />
                      )}
                    </div>
                    <div className="mod-form-group full-width" style={{ marginBottom: "16px" }}>
                      <label className="mod-form-label">What has been spilled:</label>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Include the chemical name from the SDS, if available at the time of reporting</div>
                      <textarea name="envSpilledWhat" className="mod-form-textarea" value={form.envSpilledWhat} onChange={handleChange} rows={2} placeholder="What was spilled?"></textarea>
                    </div>
                    <div className="grid-2" style={{ gap: "16px", marginBottom: "16px" }}>
                      <div className="mod-form-group">
                        <label className="mod-form-label">Cause of Spillage:</label>
                        <input name="envCause" type="text" className="mod-form-input" value={form.envCause} onChange={handleChange} placeholder="Enter cause of spillage" />
                      </div>
                      <div className="mod-form-group">
                        <label className="mod-form-label">Approximate quantity of spillage (Liter /Kg):</label>
                        <input name="envQuantity" type="text" className="mod-form-input" value={form.envQuantity} onChange={handleChange} placeholder="e.g. 50 Liters" />
                      </div>
                    </div>
                    <div className="mod-form-group">
                      <label className="mod-form-label">Specify if the spillage enter the rainwater system, process wastewater system, soil, asphalt etc.</label>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "8px" }}>
                        {["Rainwater", "Process", "Soil", "Other"].map(opt => (
                          <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                            <input type="checkbox" checked={form.envSpecify.includes(opt)} onChange={() => handleEnvToggle("envSpecify", opt)} /> {opt}
                          </label>
                        ))}
                      </div>
                      {form.envSpecify.includes("Other") && (
                        <input name="envSpecifyOther" type="text" className="mod-form-input" placeholder="Specify other..." value={form.envSpecifyOther} onChange={handleChange} style={{ marginTop: "8px" }} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Immediate Actions Taken */}
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{isEnv ? "5" : "4"}. Immediate Actions Taken</span>
                  <button type="button" className="mod-btn-outline" onClick={addAction} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: 600 }}>+ Add Action</button>
                </div>
                
                {form.immActions.length === 0 ? (
                  <div style={{ fontStyle: "italic", color: "var(--text-muted)", padding: "12px", background: "#f8fafc", borderRadius: "6px" }}>No immediate actions added.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {form.immActions.map((act, i) => (
                      <div key={i} style={{ border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px", background: "var(--bg-card)" }}>
                        <div className="grid-2" style={{ gap: "16px", marginBottom: "12px" }}>
                          <div className="mod-form-group">
                            <label className="mod-form-label" style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: 700 }}>Action</label>
                            <input type="text" className="mod-form-input" value={act.action} onChange={e => updateAction(i, "action", e.target.value)} placeholder="Describe action" />
                          </div>
                          <div className="mod-form-group">
                            <label className="mod-form-label" style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: 700 }}>Responsible</label>
                            <input type="text" className="mod-form-input" value={act.responsible} onChange={e => updateAction(i, "responsible", e.target.value)} placeholder="Person responsible" />
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
                          <div className="mod-form-group" style={{ flex: "1 1 120px" }}>
                            <label className="mod-form-label" style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: 700 }}>Date</label>
                            <input type="date" className="mod-form-input" value={act.date || ""} onChange={e => updateAction(i, "date", e.target.value)} placeholder="Select date" />
                          </div>
                          <div className="mod-form-group" style={{ flex: "1 1 120px" }}>
                            <label className="mod-form-label" style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: 700 }}>Time Implemented</label>
                            <input type="text" readOnly className="mod-form-input" value={act.time} onClick={() => { setTempActionTime(act.time || "12:00"); setShowActionTimePicker(i); }} placeholder="Select time" style={{ cursor: "pointer" }} />
                          </div>
                          <button type="button" style={{ padding: "6px 12px", border: "1px solid #fca5a5", background: "var(--bg-card)", color: "#dc2626", borderRadius: "6px", fontSize: "12px", cursor: "pointer", height: "36px" }} onClick={() => setForm(prev => ({...prev, immActions: prev.immActions.filter((_, idx) => idx !== i)}))}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid-2" style={{ gap: "16px", marginTop: "24px" }}>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Has the gatekeeper been informed?</label>
                    <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                        <input type="radio" name="gatekeeperInformed" checked={form.gatekeeperInformed === true} onChange={() => setForm(prev => ({...prev, gatekeeperInformed: true}))} /> Yes
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                        <input type="radio" name="gatekeeperInformed" checked={form.gatekeeperInformed === false} onChange={() => setForm(prev => ({...prev, gatekeeperInformed: false}))} /> No
                      </label>
                    </div>
                  </div>
                  <div className="mod-form-group">
                    <label className="mod-form-label">Name of person contacted gatekeeper:</label>
                    <input name="gatekeeperName" type="text" className="mod-form-input" value={form.gatekeeperName} onChange={handleChange} placeholder="Enter name" />
                  </div>
                </div>
              </div>

              {/* 6. Signatures */}
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "16px" }}>
                  {isEnv ? "6" : "5"}. Signatures
                </div>
                <div className="mod-form-group full-width" style={{ marginBottom: "16px" }}>
                  <label className="mod-form-label">Submitted By (Name) <span style={{ color: "#DC2626" }}>*</span></label>
                  <input name="submitterName" type="text" className="mod-form-input" value={form.submitterName} onChange={handleChange} placeholder="Enter your full name" />
                </div>
                <div className="mod-form-group full-width">
                  <label className="mod-form-label">Signature <span style={{ color: "#DC2626" }}>*</span></label>
                  <SignaturePad value={form.signature} onChange={val => setForm(prev => ({...prev, signature: val}))} onClear={() => setForm(prev => ({...prev, signature: false}))} />
                  {errors.signature && <span style={{ fontSize: "0.75rem", color: "#DC2626", marginTop: "4px", display: "block" }}>{errors.signature}</span>}
                </div>
              </div>

              <div className="mod-form-actions" style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" className="mod-btn-outline" onClick={() => navigate("/incident-management/list")}>Cancel</button>
                <button type="submit" className="mod-btn-primary im-btn-primary" style={{ background: "#1e293b" }}>Submit Heads-Up Notification</button>
              </div>
            </div>
          </form>
          {showTimePicker && (
            <AnalogTimePicker 
              initialTime={tempTime} 
              onSave={(val) => { 
                handleChange({ target: { name: "time", value: val } }); 
                setShowTimePicker(false); 
              }} 
              onCancel={() => setShowTimePicker(false)} 
            />
          )}
          {showActionTimePicker !== null && (
            <AnalogTimePicker 
              initialTime={tempActionTime} 
              onSave={(val) => { 
                updateAction(showActionTimePicker, "time", val);
                setShowActionTimePicker(null); 
              }} 
              onCancel={() => setShowActionTimePicker(null)} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default IMCreate;
