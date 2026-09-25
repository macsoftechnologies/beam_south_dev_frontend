import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import { AnalogTimePicker } from "../../incident-management/pages/IMCreate";
import FloorDrawing from "../../../pages/Request/FloorDrawing/FloorDrawing";
import { FLOOR_PDFS } from "../../../data/pdfMapping";
import { ZONE_MAPPING } from "../../../data/zones";
import { BUILDINGS } from "../../../data/buildings";
import { getBuildings, getRooms, getFloors, getContractors, getEmployees } from "../../../services/authService";
import { spotCheckService } from "../../../services/spotCheckService";
import { observationService } from "../../../services/observationService";
import SafetyIssueModal from "../../../components/common/SafetyIssueModal/SafetyIssueModal";
import { showSuccess, showError } from "../../../components/common/Toast/Toast";
import "../../../styles/module-shared.css";
import "./SCDashboard.css";
import "./SCCreate.css";

const CreateIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
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
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');

    // Dynamically get the current text color based on the theme
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim();
    ctx.strokeStyle = themeColor || '#0f172a';

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
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
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
          height: 280,
          background: "#f8fafc",
          touchAction: "none",
          overflow: "hidden"
        }}
      >
        {!value && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "var(--text-muted)", pointerEvents: "none", fontSize: 14 }}>Draw your signature here</div>}
        <canvas
          ref={canvasRef}
          width={800}
          height={280}
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

export default function SCCreate() {
  const navigate = useNavigate();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState("");
  const [showBriefingTimePicker, setShowBriefingTimePicker] = useState(false);
  const [tempBriefingTime, setTempBriefingTime] = useState("");
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserName = currentUser.name || currentUser.username || (currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ""}`.trim() : "") || "";

  const getDenmarkTodayDate = () => {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Copenhagen',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch {
      const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' }));
      const pad = (num) => String(num).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
  };

  const todayDenmark = getDenmarkTodayDate();

  // Location Selector States
  const [building, setBuilding] = useState("");
  const [level, setLevel] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [contractorsList, setContractorsList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [roomStatusMap, setRoomStatusMap] = useState({});

  const [form, setForm] = useState({
    projectName: "M3SOUTH",
    date: todayDenmark,
    time: "",
    buildingName: "",
    floorLevel: "",
    location: "",
    activityName: "",
    companyInvolved: "",
    permitId: "",
    ramsId: "",

    // PTW
    highRiskActivities: [],
    ifHotWork: "High Risk - Open Flame",
    chk1_2: "", chk1_3: "", chk1_4: "", chk1_5: "", chk1_6: "", chk1_7: "", chk1_8: "",

    // Communication
    chk2_1: "",
    briefingDate: "", briefingTime: "", conductedBy: "", participants: "",
    keyTopics: [], otherTopic: "",
    chk2_1_5: "",
    explainNoBriefing: "",

    // Summary
    chk3_2: "",
    safetyIssueCreated: "",
    safetyIssueRef: "",
    findings: "",
    correctiveActions: [{ action: "", responsible: "", dueDate: "", closed: false }],

    // Signatures
    foremanName: "",
    foremanCompany: "",
    foremanDate: "",
    foremanSignature: "",
    attachments: [{ desc: "", attached: "N/A" }],
    inspectorName: currentUserName,
    inspectorCompany: "NNE",
    inspectorDate: todayDenmark,
    inspectorSignature: ""
  });

  // Load Master Selectors (Buildings, Floors, Rooms, Contractors, Employees)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [bRes, fRes, rRes, cRes, eRes] = await Promise.all([
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getRooms(1, 20000),
          getContractors(1, 1000),
          getEmployees(1, 1000).catch(() => ({ data: [] }))
        ]);

        const rawB = bRes?.data?.rows || bRes?.data || bRes || [];
        setBuildingsList(Array.isArray(rawB) ? rawB : []);

        const rawF = fRes?.data?.rows || fRes?.data || fRes || [];
        setFloorsList(Array.isArray(rawF) ? rawF : []);

        const rawR = rRes?.data?.rows || rRes?.data || rRes || [];
        setRoomsList(Array.isArray(rawR) ? rawR : []);

        const rawC = cRes?.data?.rows || cRes?.data || cRes?.subContractors || cRes || [];
        let cList = Array.isArray(rawC) ? [...rawC] : [];
        const hasNne = cList.some((c) => {
          const cName = String(c.subContractorName || c.company_name || c.contractor_name || c.name || "").toUpperCase().trim();
          return cName === "NNE" || cName.includes("NNE");
        });
        if (!hasNne) {
          cList.push({ id: "NNE", subContractorName: "NNE", company_name: "NNE", name: "NNE" });
        }
        setContractorsList(cList);

        const rawE = eRes?.data?.rows || eRes?.data || eRes || [];
        setEmployeesList(Array.isArray(rawE) ? rawE : []);
      } catch (err) {
        console.error("Failed to load spot check form selector data", err);
      }
    };
    loadData();
  }, []);

  const levels = useMemo(() => {
    if (!building) return [];
    return floorsList.filter(f => String(f.build_id) === String(building)).map(f => f.floor_name);
  }, [building, floorsList]);

  const selectedPdf = useMemo(() => {
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

  const selectedZones = useMemo(() => {
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
      return zoneName ? `${zoneName}: ${roomClean}` : roomClean;
    }).filter(Boolean).join(", ");

    setForm(prev => ({
      ...prev,
      location: formattedRooms
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayToggle = (field, val) => {
    setForm(prev => {
      const arr = prev[field] || [];
      if (arr.includes(val)) return { ...prev, [field]: arr.filter(v => v !== val) };
      return { ...prev, [field]: [...arr, val] };
    });
  };

  const handleActionChange = (index, field, value) => {
    const actions = [...form.correctiveActions];
    actions[index][field] = value;
    setForm({ ...form, correctiveActions: actions });
  };

  const handleAttachmentChange = (index, field, value) => {
    const atts = [...form.attachments];
    atts[index][field] = value;
    setForm({ ...form, attachments: atts });
  };

  const handleAttachmentFileChange = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Url = uploadEvent.target?.result;
      const atts = [...form.attachments];
      atts[index] = {
        ...atts[index],
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        fileType: file.type,
        previewUrl: base64Url,
        attached: "Yes"
      };
      setForm(prev => ({ ...prev, attachments: atts }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachmentFile = (index, e) => {
    e.stopPropagation();
    const atts = [...form.attachments];
    atts[index] = {
      ...atts[index],
      fileName: "",
      fileSize: "",
      fileType: "",
      previewUrl: "",
      attached: "N/A"
    };
    setForm(prev => ({ ...prev, attachments: atts }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.companyInvolved) {
      showError("Please select the Company / Contractor involved.");
      return;
    }

    try {
      setIsSubmitting(true);
      let currentUser = {};
      try {
        currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        currentUser = {};
      }

      const sanitizeDateVal = (d) => (!d || typeof d !== 'string' || d.trim() === '' ? null : d.trim());

      let finalSafetyIssueRef = form.safetyIssueRef;
      if (form.chk3_2 === "No" && form.safetyIssueCreated === "No" && !finalSafetyIssueRef) {
        try {
          const bName = form.buildingName || (buildingsList.find(b => String(b.build_id || b.id) === String(building))?.building_name || "");
          const contractorObj = contractorsList.find(c => 
            c.name === form.companyInvolved || 
            c.company_name === form.companyInvolved || 
            c.subContractorName === form.companyInvolved || 
            c.contractor_name === form.companyInvolved
          );
          const obsRes = await observationService.createObservation({
            observationType: "NEEDS_ATTENTION",
            natureOfFinding: "UNSAFE_CONDITION",
            subject: form.activityName ? `Spot Check Non-Compliance: ${form.activityName}` : (form.spotCheckRef ? `Spot Check Non-Compliance (${form.spotCheckRef})` : "Spot Check Non-Compliance"),
            safetyCategory: "General Safety",
            description: form.findings || `Non-compliant activity identified during Spot Check ${form.spotCheckRef ? `(${form.spotCheckRef})` : ''} - Activity: ${form.activityName || 'General inspection'}.`,
            projectName: form.projectName || "M3SOUTH",
            buildingId: building ? Number(building) : undefined,
            buildingName: bName,
            floorLevel: level || form.floorLevel,
            specificLocation: form.location,
            assignedContractorName: form.companyInvolved,
            assignedContractorId: contractorObj?.id ? Number(contractorObj.id) : undefined,
            date: sanitizeDateVal(form.date) || todayDenmark,
            time: form.time || undefined,
            createdByUserId: currentUser?.id,
            createdByUserName: currentUser?.name || currentUser?.username || 'Safety Inspector',
            createdByRole: currentUser?.role || 'Admin',
          });
          const createdObs = obsRes?.observation || obsRes;
          finalSafetyIssueRef = createdObs?.observationNumber || (createdObs?.id ? `SO-${createdObs.id}` : "");
        } catch (obsErr) {
          console.error("Auto-creating safety observation failed:", obsErr);
        }
      }

      const payload = {
        ...form,
        safetyIssueRef: finalSafetyIssueRef || form.safetyIssueRef,
        date: sanitizeDateVal(form.date) || todayDenmark,
        briefingDate: sanitizeDateVal(form.briefingDate),
        foremanDate: sanitizeDateVal(form.foremanDate),
        inspectorDate: sanitizeDateVal(form.inspectorDate) || todayDenmark,
        buildingId: building ? Number(building) : undefined,
        buildingName: form.buildingName || (buildingsList.find(b => String(b.build_id || b.id) === String(building))?.building_name || ""),
        floorLevel: level || form.floorLevel,
        selectedRooms,
        selectedZones,
        createdByUserId: currentUser?.id,
        createdByUserName: currentUser?.name || currentUser?.username || 'Superadmin',
        createdByRole: currentUser?.role || 'Admin',
      };

      await spotCheckService.createSpotCheck(payload);
      if (finalSafetyIssueRef && form.safetyIssueCreated === "No") {
        showSuccess(`Spot Check saved and linked to Safety Observation ${finalSafetyIssueRef}!`);
      } else {
        showSuccess("Spot Check record saved successfully!");
      }
      navigate("/spot-checks/list");
    } catch (err) {
      console.error("Failed to submit spot check:", err);
      showError(err?.response?.data?.message || err?.message || "Failed to submit spot check.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const highRiskOptions = [
    "Hot work", "Working on electrical systems", "Hazardous substances / chemicals",
    "Pressure testing of equipment", "Working at height", "Working in confined spaces",
    "Working in ATEX area", "Securing facilities (LOTO)", "Excavation works",
    "Using crane or lifting equipment", "N/A"
  ];

  const topicOptions = [
    "PPE", "Site hazards", "Task-specific risks", "Recent accidents",
    "Emergency procedures", "Permit To Work content", "Risk Assessment Method Statement content"
  ];

  const renderRadioGroup = (name) => (
    <div style={{ display: "flex", gap: "16px", justifyContent: "center", alignItems: "center" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.88rem" }}>
        <input type="radio" name={name} value="Yes" onChange={handleChange} checked={form[name] === "Yes"} /> Yes
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.88rem" }}>
        <input type="radio" name={name} value="No" onChange={handleChange} checked={form[name] === "No"} /> No
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.88rem" }}>
        <input type="radio" name={name} value="N/A" onChange={handleChange} checked={form[name] === "N/A"} /> N/A
      </label>
    </div>
  );

  const renderYesNo = (name) => (
    <div style={{ display: "flex", gap: "16px", justifyContent: "center", alignItems: "center" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.88rem" }}>
        <input type="radio" name={name} value="Yes" onChange={handleChange} checked={form[name] === "Yes"} /> Yes
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.88rem" }}>
        <input
          type="radio"
          name={name}
          value="No"
          onChange={(e) => {
            handleChange(e);
            if (name === "chk3_2") {
              setShowSafetyModal(true);
            }
          }}
          checked={form[name] === "No"}
        /> No
      </label>
    </div>
  );

  return (
    <div className="mod-page">
      <PageHeader
        title="Site HSE Spot Check"
        subtitle="Permit, controls and toolbox talk verification"
        icon={<CreateIcon />}
        breadcrumbs={[{ label: "Home" }, { label: "Spot Checks" }, { label: "New Spot Check" }]}
        actions={
          <button className="mod-btn-outline" onClick={() => navigate("/spot-checks/list")}>
            ← Back to List
          </button>
        }
      />

      <div className="mod-card" style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {/* GENERAL INFORMATION */}
        <div className="mod-card-header" style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-color)", borderLeft: "4px solid var(--primary-color, #F97316)" }}>
          <h3 className="mod-card-title" style={{ margin: 0, color: "var(--text-main)", fontSize: "1.1rem", fontWeight: "700" }}>GENERAL INFORMATION</h3>
        </div>
        <div className="mod-card-body" style={{ padding: "0" }}>
          <table className="sc-table">
            <tbody>
              <tr>
                <td className="sc-td-label">Project Name</td>
                <td colSpan="3"><input className="mod-form-input" name="projectName" value={form.projectName} onChange={handleChange} placeholder="Enter Project Name" /></td>
              </tr>
              <tr>
                <td className="sc-td-label">Date</td>
                <td><input type="date" className="mod-form-input" name="date" value={form.date} onChange={handleChange} /></td>
                <td className="sc-td-label">Time</td>
                <td>
                  <input
                    type="text"
                    readOnly
                    className="mod-form-input"
                    name="time"
                    value={form.time}
                    onClick={() => { setTempTime(form.time || "12:00"); setShowTimePicker(true); }}
                    placeholder="--:-- --"
                    style={{ cursor: "pointer" }}
                  />
                </td>
              </tr>
              <tr>
                <td className="sc-td-label">Activity / Task name</td>
                <td><input className="mod-form-input" name="activityName" value={form.activityName} onChange={handleChange} placeholder="Enter Activity / Task Name" /></td>
                <td className="sc-td-label">Company involved</td>
                <td>
                  <select
                    className="mod-form-input"
                    name="companyInvolved"
                    value={form.companyInvolved}
                    onChange={handleChange}
                  >
                    <option value="">Select Contractor / Company</option>
                    {contractorsList.map((c, i) => {
                      const cName = c.subContractorName || c.company_name || c.contractor_name || c.name || `Contractor ${c.id || i}`;
                      return (
                        <option key={c.id || i} value={cName}>{cName}</option>
                      );
                    })}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="sc-td-label">Permit ID</td>
                <td><input className="mod-form-input" name="permitId" value={form.permitId} onChange={handleChange} placeholder="Enter Permit ID" /></td>
                <td className="sc-td-label">RAMS / SPA ID</td>
                <td><input className="mod-form-input" name="ramsId" value={form.ramsId} onChange={handleChange} placeholder="Enter RAMS / SPA ID" /></td>
              </tr>
            </tbody>
          </table>

          {/* Location — Building / Floor / Map Selector */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-color)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Building */}
              <div className="mod-form-group">
                <label className="mod-form-label">Location / Building</label>
                <select
                  className="mod-form-input"
                  value={building}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBuilding(val);
                    setLevel("");
                    setSelectedRooms([]);
                    setSelectedZone(null);
                    const dbB = buildingsList.find(b => String(b.build_id || b.id) === String(val));
                    setForm(prev => ({ ...prev, buildingName: dbB?.building_name || "", floorLevel: "", location: "" }));
                  }}
                >
                  <option value="">Select Building</option>
                  {buildingsList.map(item => (
                    <option key={item.build_id} value={item.build_id}>{item.building_name}</option>
                  ))}
                </select>
              </div>
              {/* Floor / Level */}
              <div className="mod-form-group">
                <label className="mod-form-label">Floor / Level</label>
                <select
                  className="mod-form-input"
                  value={level}
                  disabled={!building}
                  onChange={(e) => {
                    setLevel(e.target.value);
                    setSelectedRooms([]);
                    setSelectedZone(null);
                    setForm(prev => ({ ...prev, floorLevel: e.target.value, location: "" }));
                  }}
                >
                  <option value="">Select Level</option>
                  {levels.map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Floor PDF Drawing */}
            {selectedPdf && (
              <div style={{ position: "relative", border: "1px solid var(--border-color)", borderRadius: 8, overflow: "hidden", minHeight: 400, marginBottom: 16 }}>
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

            {/* Specific Location / Rooms */}
            <div className="mod-form-group">
              <label className="mod-form-label">Specific Location / Rooms <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 12 }}>(Auto-filled from map or enter manually)</span></label>
              <input
                type="text"
                className="mod-form-input"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Zone A: Room 204, Grid B4"
              />
            </div>
          </div>
          <div style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)", backgroundColor: "var(--bg-card-hover)" }}>
            <b>Instructions:</b> Tick one response for each checkpoint. Use N/A only when the checkpoint does not apply. Record relevant facts in the comments field.
          </div>
        </div>

        {/* PERMIT TO WORK (PTW) */}
        <div className="sc-section-card">
          <div className="sc-section-header">
            <h3 className="sc-section-title">
              <i className="ti ti-file-certificate" style={{ color: "var(--primary-color, #F97316)" }}></i>
              PERMIT TO WORK (PTW)
            </h3>
          </div>

          <div className="sc-section-subhead">
            High-risk activities included
          </div>
          <div className="sc-chip-grid">
            {highRiskOptions.map(opt => (
              <label key={opt} className={`sc-chip-label ${form.highRiskActivities.includes(opt) ? 'active' : ''}`}>
                <input type="checkbox" checked={form.highRiskActivities.includes(opt)} onChange={() => handleArrayToggle("highRiskActivities", opt)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>

          {/* If Hot Work: Only displayed when Hot work is checked in 1.1 */}
          {form.highRiskActivities.includes("Hot work") && (
            <div style={{ padding: "14px 20px", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap", borderBottom: "1px solid var(--border-color)", backgroundColor: "rgba(249, 115, 22, 0.05)" }}>
              <span style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.88rem" }}>If Hot Work:</span>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.88rem" }}>
                <input
                  type="radio"
                  name="ifHotWork"
                  value="High Risk - Open Flame"
                  onChange={handleChange}
                  checked={form.ifHotWork === "High Risk - Open Flame" || form.ifHotWork === "High Risk"}
                />
                High Risk - Open Flame
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.88rem" }}>
                <input
                  type="radio"
                  name="ifHotWork"
                  value="Low Risk - Spark Spreading"
                  onChange={handleChange}
                  checked={form.ifHotWork === "Low Risk - Spark Spreading" || form.ifHotWork === "Low Risk"}
                />
                Low Risk - Spark Spreading
              </label>
            </div>
          )}

          <table className="sc-table">
            <thead>
              <tr style={{ backgroundColor: "var(--bg-dark)" }}>
                
                <th></th>
                <th style={{ width: "150px", textAlign: "center", color: "var(--text-main)" }}>Yes / No / N/A</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                
                <td><b>a.</b> Does the description of work, including scope, location and times, match the work performed?</td>
                <td>{renderRadioGroup("chk1_2")}</td>
              </tr>
              <tr>
                
                <td><b>b.</b> Are the PTW and RAMS valid for the work performed?</td>
                <td>{renderRadioGroup("chk1_3")}</td>
              </tr>
              <tr>
                
                <td><b>c.</b> Are key risks controlled? Consider barriers, signage and whether controls are working as planned and coordinated.</td>
                <td>{renderRadioGroup("chk1_4")}</td>
              </tr>
              <tr>
                
                <td><b>d.</b> Do workers know the emergency plan? Consider contact information, medical centre, alarm / muster arrangements and rescue / emergency arrangements.</td>
                <td>{renderRadioGroup("chk1_5")}</td>
              </tr>
              <tr>
                
                <td><b>e.</b> Is correct task-specific PPE in use, in proper condition and worn properly?</td>
                <td>{renderRadioGroup("chk1_6")}</td>
              </tr>
              <tr>
                
                <td><b>f.</b> Is supervision present? Is the responsible person named on the PTW overseeing the work?</td>
                <td>{renderRadioGroup("chk1_7")}</td>
              </tr>
              <tr>
                
                <td><b>g.</b> Is the area orderly and safe? Consider clear access / egress, housekeeping and unblocked exits.</td>
                <td>{renderRadioGroup("chk1_8")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* COMMUNICATION / TOOLBOX TALK */}
        <div className="mod-card-header" style={{ backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", marginTop: "32px", borderLeft: "4px solid var(--primary-color, #F97316)" }}>
          <h3 className="mod-card-title" style={{ margin: 0, color: "var(--text-main)", fontSize: "1.1rem", fontWeight: "700" }}>COMMUNICATION / TOOLBOX TALK</h3>
        </div>
        <div className="mod-card-body" style={{ padding: "0" }}>
          <table className="sc-table">
            <thead>
              <tr style={{ backgroundColor: "var(--bg-dark)" }}>
                
                <th></th>
                <th style={{ width: "150px", textAlign: "center", color: "var(--text-main)" }}>YES / NO / N/A</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                
                <td><b>a.</b> Has a Toolbox Talk / pre-start briefing been held?</td>
                <td>{renderRadioGroup("chk2_1")}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)", backgroundColor: "var(--bg-card-hover)" }}>
            If YES, complete items b to f. If NO, complete the explanation box below.
          </div>
          <table className="sc-table">
            <tbody>
              <tr>
                <td className="sc-td-label"><b>b.</b> Date of briefing <span style={{ color: "#DC2626" }}>*</span></td>
                {form.chk2_1 === "Yes" ? (
                  <td colSpan="3"><input type="date" className="mod-form-input" name="briefingDate" value={form.briefingDate} onChange={handleChange} /></td>
                ) : (
                  <>
                    <td><input type="date" className="mod-form-input" name="briefingDate" value={form.briefingDate} onChange={handleChange} /></td>
                    <td className="sc-td-label">Time</td>
                    <td>
                      <input
                        type="text"
                        readOnly
                        className="mod-form-input"
                        name="briefingTime"
                        value={form.briefingTime}
                        onClick={() => { setTempBriefingTime(form.briefingTime || "12:00"); setShowBriefingTimePicker(true); }}
                        placeholder="--:-- --"
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                  </>
                )}
              </tr>
              {form.chk2_1 === "Yes" && (
                <tr>
                  <td className="sc-td-label"><b>c.</b> Conducted by</td>
                  <td><input className="mod-form-input" name="conductedBy" value={form.conductedBy} onChange={handleChange} placeholder="Enter Name" /></td>
                  <td className="sc-td-label"><b>d.</b> Number of participants</td>
                  <td><input type="number" className="mod-form-input" name="participants" value={form.participants} onChange={handleChange} placeholder="Enter Number" /></td>
                </tr>
              )}
            </tbody>
          </table>

          {form.chk2_1 === "Yes" ? (
            <>
              <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-card-hover)", color: "var(--text-main)", fontWeight: "600", fontSize: "0.9rem", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
                <b>e.</b> Key topics covered
              </div>
              <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderBottom: "1px solid var(--border-color)" }}>
                {topicOptions.map(opt => (
                  <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.keyTopics.includes(opt)} onChange={() => handleArrayToggle("keyTopics", opt)} />
                    {opt}
                  </label>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", gridColumn: "1 / -1" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.keyTopics.includes("Other")} onChange={() => handleArrayToggle("keyTopics", "Other")} />
                    Other topics:
                  </label>
                  {form.keyTopics.includes("Other") && (
                    <input className="mod-form-input" style={{ flex: 1 }} name="otherTopic" value={form.otherTopic} onChange={handleChange} placeholder="Specify other topic..." />
                  )}
                </div>
              </div>
              <table className="sc-table">
                <thead>
                  <tr style={{ backgroundColor: "#0f172a", color: "#fff" }}>
                    
                    <th></th>
                    <th style={{ width: "120px", textAlign: "center" }}>Yes / No</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    
                    <td><b>f.</b> Have all workers confirmed understanding of the PTW and RAMS requirements?</td>
                    <td>{renderYesNo("chk2_1_5")}</td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            <>
              <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-card-hover)", color: "var(--text-main)", fontWeight: "600", fontSize: "0.9rem", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
                <b>g.</b> If NO, explain why the Toolbox Talk / pre-start briefing was not held
              </div>
              <div style={{ padding: "16px", backgroundColor: "var(--bg-card)" }}>
                <textarea className="mod-form-textarea" rows="4" name="explainNoBriefing" value={form.explainNoBriefing} onChange={handleChange} placeholder="Provide explanation..."></textarea>
              </div>
            </>
          )}
        </div>

        {/* SUMMARY */}
        <div className="sc-section-card">
          <div className="sc-section-header">
            <h3 className="sc-section-title">
              <i className="ti ti-clipboard-check" style={{ color: "var(--primary-color, #F97316)" }}></i>
              SUMMARY
            </h3>
          </div>

          <div className="sc-checkpoints-list">
            <div className="sc-checkpoint-row">
              <div className="sc-checkpoint-left">
                
                <p className="sc-checkpoint-text"><b>a.</b> Was the activity in compliance?</p>
              </div>
              {renderYesNo("chk3_2")}
            </div>


          </div>

          {form.chk3_2 === "No" && (
            <div className="sc-section-body" style={{ paddingTop: "14px", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)" }}>
              <div>
                {form.safetyIssueRef ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <i className="ti ti-circle-check" style={{ color: "#059669", fontSize: "20px" }}></i>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>Attached Safety Observation:</span>
                          <span className="sc-badge sc-badge-danger" style={{ fontWeight: 700, fontSize: "12px" }}>{form.safetyIssueRef}</span>
                          <span style={{ fontSize: "11px", color: "#b91c1c", background: "rgba(239, 68, 68, 0.1)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>Needs Attention</span>
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                          A Safety Observation has been linked to this non-compliant spot check.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mod-btn-outline"
                      style={{ padding: "4px 10px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      onClick={() => setShowSafetyModal(true)}
                    >
                      <i className="ti ti-edit"></i> Edit Observation
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(239, 68, 68, 0.06)", border: "1px dashed rgba(239, 68, 68, 0.4)", borderRadius: "6px" }}>
                    <div>
                      <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#b91c1c", display: "flex", alignItems: "center", gap: "6px" }}>
                        <i className="ti ti-alert-triangle"></i> Safety Observation Required (Needs Attention)
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Activity is non-compliant. A Safety Observation with "Needs Attention" will be created and its SO number attached to this spot check.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mod-btn-primary"
                      style={{ padding: "6px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}
                      onClick={() => setShowSafetyModal(true)}
                    >
                      <i className="ti ti-plus"></i> Create & Attach SO
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="sc-section-subhead">
            Findings / comments
          </div>
          <div className="sc-section-body">
            <textarea className="sc-form-textarea" rows="3" name="findings" value={form.findings} onChange={handleChange} placeholder="Enter findings, remarks, or observations..."></textarea>
          </div>
        </div>

        {/* SUMMARY - SIGNATURES AND EVIDENCE */}
        <div className="mod-card-header" style={{ backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", marginTop: "32px", borderLeft: "4px solid var(--primary-color, #F97316)" }}>
          <h3 className="mod-card-title" style={{ margin: 0, color: "var(--text-main)", fontSize: "1.1rem", fontWeight: "700" }}>SUMMARY - SIGNATURES AND EVIDENCE</h3>
        </div>
        <div className="mod-card-body" style={{ padding: "0" }}>
          <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-card-hover)", color: "var(--text-main)", fontWeight: "600", fontSize: "0.9rem", borderBottom: "1px solid var(--border-color)" }}>
            Foreman/Supervisor Details
          </div>
          <table className="sc-table">
            <tbody>
              <tr>
                <td className="sc-td-label" style={{ width: "150px" }}>Name</td>
                <td><input className="mod-form-input" name="foremanName" value={form.foremanName} onChange={handleChange} /></td>
                <td className="sc-td-label" style={{ width: "150px" }}>Company</td>
                <td>
                  <select
                    className="mod-form-input"
                    name="foremanCompany"
                    value={form.foremanCompany}
                    onChange={handleChange}
                  >
                    <option value="">Select Contractor</option>
                    {contractorsList.map((c, i) => {
                      const cName = c.subContractorName || c.company_name || c.contractor_name || c.name || `Contractor ${c.id || i}`;
                      return (
                        <option key={c.id || i} value={cName}>{cName}</option>
                      );
                    })}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="sc-td-label">Date</td>
                <td colSpan="3"><input type="date" className="mod-form-input" style={{ maxWidth: "200px" }} name="foremanDate" value={form.foremanDate} onChange={handleChange} /></td>
              </tr>
              <tr>
                <td className="sc-td-label" style={{ verticalAlign: "top", paddingTop: "16px" }}>Signature <span style={{ color: "#DC2626" }}>*</span></td>
                <td colSpan="3">
                  <SignaturePad
                    value={form.foremanSignature}
                    onChange={val => setForm(prev => ({ ...prev, foremanSignature: val }))}
                    onClear={() => setForm(prev => ({ ...prev, foremanSignature: false }))}
                  />
                </td>
              </tr>
            </tbody>
          </table>



          <div className="sc-section-subhead">
            Photographs and attachments <span style={{ color: "var(--text-muted)", fontWeight: "normal", fontSize: "0.82rem" }}>(optional)</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {form.attachments.map((att, idx) => (
              <div key={idx} className="sc-attachment-item">
                <div className="sc-attachment-grid">
                  <div className="sc-form-group">
                    <label className="sc-form-label" style={{ fontSize: "0.78rem" }}>Description / Reference</label>
                    <textarea
                      className="sc-form-textarea"
                      rows="2"
                      placeholder="e.g. Scaffolding tag photo, Permit copy"
                      value={att.desc || ""}
                      onChange={(e) => handleAttachmentChange(idx, "desc", e.target.value)}
                    ></textarea>
                  </div>

                  <div className="sc-attachment-controls">
                    <div className="sc-form-group">
                      <label className="sc-form-label" style={{ fontSize: "0.78rem" }}>Photograph / File</label>
                      {!att.previewUrl ? (
                        <label className="sc-upload-btn">
                          <i className="ti ti-upload"></i> Choose File / Photo
                          <input
                            type="file"
                            accept="image/*,.pdf,.doc,.docx"
                            style={{ display: "none" }}
                            onChange={(e) => handleAttachmentFileChange(idx, e)}
                          />
                        </label>
                      ) : (
                        <div className="sc-file-preview-pill">
                          {att.fileType?.startsWith("image/") ? (
                            <img src={att.previewUrl} alt="preview" style={{ width: "24px", height: "24px", objectFit: "cover", borderRadius: "4px" }} />
                          ) : (
                            <i className="ti ti-file-text" style={{ fontSize: "18px", color: "var(--primary-color, #F97316)" }}></i>
                          )}
                          <div style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px" }} title={att.fileName}>
                            <b style={{ color: "var(--text-main)" }}>{att.fileName}</b>
                            <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>{att.fileSize}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveAttachmentFile(idx, e)}
                            style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "2px 4px", fontSize: "14px" }}
                            title="Remove file"
                          >
                            <i className="ti ti-x"></i>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="sc-form-group" style={{ alignItems: "center" }}>
                      <label className="sc-form-label" style={{ fontSize: "0.78rem" }}>Attached</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", height: "36px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontSize: "12px" }}>
                          <input type="radio" name={`att_${idx}`} value="Yes" onChange={() => handleAttachmentChange(idx, "attached", "Yes")} checked={att.attached === "Yes"} /> Yes
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontSize: "12px" }}>
                          <input type="radio" name={`att_${idx}`} value="N/A" onChange={() => handleAttachmentChange(idx, "attached", "N/A")} checked={att.attached === "N/A"} /> N/A
                        </label>
                      </div>
                    </div>

                    {form.attachments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const atts = form.attachments.filter((_, i) => i !== idx);
                          setForm(prev => ({ ...prev, attachments: atts }));
                        }}
                        style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px", padding: "6px" }}
                        title="Remove row"
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ padding: "12px 20px", background: "var(--bg-card-hover)", display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                className="mod-btn-outline"
                style={{ fontSize: "12px", padding: "6px 16px" }}
                onClick={() => {
                  setForm(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, { desc: "", attached: "N/A", fileName: "", fileSize: "", previewUrl: "", fileType: "" }]
                  }));
                }}
              >
                + Add Another Attachment / Photo
              </button>
            </div>
          </div>

          <div className="sc-section-subhead">
            Spot check performed by
          </div>
          <table className="sc-table">
            <tbody>
              <tr>
                <td className="sc-td-label" style={{ width: "150px" }}>Name</td>
                <td><input className="mod-form-input" name="inspectorName" value={form.inspectorName} onChange={handleChange} disabled /></td>
                <td className="sc-td-label" style={{ width: "150px" }}>Company</td>
                <td><input className="mod-form-input" name="inspectorCompany" value={form.inspectorCompany} onChange={handleChange} disabled /></td>
              </tr>
              <tr>
                <td className="sc-td-label">Date</td>
                <td colSpan="3"><input type="date" className="mod-form-input" style={{ maxWidth: "200px" }} name="inspectorDate" value={form.inspectorDate} onChange={handleChange} disabled /></td>
              </tr>
              <tr>
                <td className="sc-td-label" style={{ verticalAlign: "top", paddingTop: "16px" }}>Signature <span style={{ color: "#DC2626" }}>*</span></td>
                <td colSpan="3">
                  <SignaturePad
                    value={form.inspectorSignature}
                    onChange={val => setForm(prev => ({ ...prev, inspectorSignature: val }))}
                    onClear={() => setForm(prev => ({ ...prev, inspectorSignature: false }))}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="sc-instructions-box" style={{ textAlign: "center" }}>
          Retain the completed paper form and associated evidence in accordance with the applicable project filing process.
        </div>

        <div className="sc-form-footer">
          <button type="button" className="mod-btn-outline" onClick={() => navigate("/spot-checks/list")} disabled={isSubmitting}>Cancel</button>
          <button type="button" className="mod-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <i className="ti ti-loader ti-spin" style={{ marginRight: "6px" }}></i> Submitting...
              </>
            ) : (
              "Submit Spot Check"
            )}
          </button>
        </div>
      </div>

      {showTimePicker && (
        <AnalogTimePicker
          initialTime={tempTime}
          onSave={(timeVal) => {
            setForm(prev => ({ ...prev, time: timeVal }));
            setShowTimePicker(false);
          }}
          onCancel={() => setShowTimePicker(false)}
        />
      )}

      {showBriefingTimePicker && (
        <AnalogTimePicker
          initialTime={tempBriefingTime}
          onSave={(timeVal) => {
            setForm(prev => ({ ...prev, briefingTime: timeVal }));
            setShowBriefingTimePicker(false);
          }}
          onCancel={() => setShowBriefingTimePicker(false)}
        />
      )}

      {showSafetyModal && (
        <SafetyIssueModal
          open={showSafetyModal}
          onClose={() => setShowSafetyModal(false)}
          subject={form.activityName ? `Spot Check Non-Compliance: ${form.activityName}` : "Spot Check Non-Compliance"}
          color="red"
          initialContractor={form.companyInvolved}
          initialLocation={{
            building,
            level,
            selectedRooms,
            selectedZone,
            specificLocation: form.location
          }}
          onObservationCreated={(createdObs) => {
            const obsNum = createdObs?.observationNumber || (createdObs?.id ? `SO-${createdObs.id}` : 'SO');
            setForm(prev => ({
              ...prev,
              safetyIssueCreated: "No",
              safetyIssueRef: obsNum
            }));
            setShowSafetyModal(false);
            showSuccess(`Safety Observation ${obsNum} created and linked to this Spot Check!`);
          }}
        />
      )}
    </div>
  );
}
