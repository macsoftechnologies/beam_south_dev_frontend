import React, { useEffect, useRef, useState, useMemo } from "react";
import Modal from "../Modal/Modal";
import FloorDrawing from "../../../pages/Request/FloorDrawing/FloorDrawing";
import { FLOOR_PDFS } from "../../../data/pdfMapping";
import { ZONE_MAPPING } from "../../../data/zones";
import { BUILDINGS } from "../../../data/buildings";
import { getBuildings, getRooms, getFloors, getContractors } from "../../../services/authService";
import { observationService } from "../../../services/observationService";
import "./SafetyIssueModal.css";

export const SAFETY_SUBCATEGORIES = {
  "1. Access / Exit": [
    "1.1 Blocked access – pedestrian",
    "1.2 Missing pedestrian walkways",
    "1.3 Unsafe accessways",
    "1.4 Narrow accessways",
    "1.5 No escape route",
    "1.6 Unorganized parking",
    "1.7 Blocked roads"
  ],
  "2. Barriers / Signage / Shielding": [
    "2.1 Inadequate barriers",
    "2.2 No barriers",
    "2.3 Missing signage",
    "2.4 Damaged barriers",
    "2.5 Floor opening ≥7 cm"
  ],
  "3. Housekeeping / Waste": [
    "3.1 Poor housekeeping",
    "3.2 Dust build‑up",
    "3.3 Waste"
  ],
  "4. Noise / Dust / Fumes / Health Hazards": [
    "4.1 Exposure to unnecessary noise",
    "4.2 Exposure to dust",
    "4.3 Exposure to fumes",
    "4.4 Hazardous substances exposure",
    "4.5 Poor body positioning",
    "4.6 Unsafe manual handling"
  ],
  "5. Storage & Handling": [
    "5.1 Unorganized storage",
    "5.2 Unsafe material handling",
    "5.3 Unsafe chemical storage",
    "5.4 Unlabeled chemical containers"
  ],
  "6. Electrical Hazards": [
    "6.1 Poor cable management",
    "6.2 Unsafe electrical equipment",
    "6.3 Exposed cable ends",
    "6.4 Incorrect junction box setup / inspection"
  ],
  "7. Working at Heights": [
    "7.1 Lack of fall protection",
    "7.2 No rescue/evacuation plan",
    "7.3 Unsafe work positions",
    "7.4 Unsafe ladder use",
    "7.5 Unsafe scaffolding work",
    "7.6 Dropped object"
  ],
  "8. Lifting / Rigging": [
    "8.1 Unsafe lifting methods",
    "8.2 No flagman / barriers",
    "8.3 Lifting over personnel",
    "8.4 Missing 12‑month inspection"
  ],
  "9. Hot Works": [
    "9.1 Sparks",
    "9.2 Missing firefighting equipment",
    "9.3 Missing extraction",
    "9.4 Missing shielding",
    "9.5 Fire watchers",
    "9.6 ATEX – Flashback arrestors"
  ],
  "10. Mobile Elevating Work Equipment": [
    "10.1 Unsafe use",
    "10.2 Missing flagman/barricades",
    "10.3 Missing 12‑month inspection"
  ],
  "11. Lighting": [
    "11.1 Missing lighting",
    "11.2 Insufficient lighting",
    "11.3 Orientation lighting missing (25 lux)",
    "11.4 Work lighting missing (100 lux)"
  ],
  "12. Documentation & Procedures": [
    "12.1 Missing Permit to Work",
    "12.2 Missing Toolbox Talk",
    "12.3 RAMS not followed",
    "12.4 Missing RAMS",
    "12.5 Lack of RAMS instructions",
    "12.6 Missing SDS",
    "12.7 SDS not followed",
    "12.8 Missing chemical risk assessment",
    "12.9 Chemical risk assessment not followed",
    "12.10 Alcohol & drugs"
  ],
  "13. Scaffold / Alloy Towers": [
    "13.1 Green sign missing",
    "13.2 Unsafe construction",
    "13.3 Unauthorized reconstruction",
    "13.4 Access blocked",
    "13.5 Poor housekeeping on scaffold",
    "13.6 Outdated inspection"
  ],
  "14. Slip / Trip Hazards": [
    "14.1 Materials in walkways",
    "14.2 Uneven surfaces",
    "14.3 Slippery accessway",
    "14.4 Cables in accessways"
  ],
  "15. PPE": [
    "15.1 Missing mandatory PPE",
    "15.2 Missing task‑specific PPE",
    "15.3 Incorrect PPE use",
    "15.4 PPE inspections missing"
  ],
  "16. Tools & Machinery": [
    "16.1 Wrong tool use",
    "16.2 Defective tools",
    "16.3 Missing 12‑month inspection"
  ],
  "17. Environmental Hazards": [
    "17.1 Chemical spills",
    "17.2 Waste management issues",
    "17.3 Oil / hydraulic spill",
    "17.4 Missing spill precautions"
  ],
  "18. Emergency Equipment": [
    "18.1 Missing first‑aid equipment",
    "18.2 Missing first‑aid stations",
    "18.3 Missing firefighting equipment",
    "18.4 Missing inspections"
  ],
  "19. Excavation / Trenches": [
    "19.1 Unsafe excavation",
    "19.2 Incorrect angle",
    "19.3 Missing escape routes",
    "19.4 Insufficient barriers"
  ],
  "20. Other": [
    "20.1 Please Fill"
  ]
};

export function getSubcategoriesForCategory(categoryName) {
  if (!categoryName) return ["Please Fill"];
  const clean = String(categoryName).trim();
  
  if (SAFETY_SUBCATEGORIES[clean]) return SAFETY_SUBCATEGORIES[clean];
  
  const numMatch = clean.match(/^(\d+)\./);
  if (numMatch) {
    const num = numMatch[1];
    const key = Object.keys(SAFETY_SUBCATEGORIES).find(k => k.startsWith(`${num}.`));
    if (key) return SAFETY_SUBCATEGORIES[key];
  }

  const lower = clean.toLowerCase();
  const foundKey = Object.keys(SAFETY_SUBCATEGORIES).find(k => {
    const kLower = k.toLowerCase().replace(/^\d+\.\s*/, '');
    return lower.includes(kLower) || kLower.includes(lower);
  });
  if (foundKey) return SAFETY_SUBCATEGORIES[foundKey];

  return ["20.1 Please Fill"];
}

export default function SafetyIssueModal({ open, onClose, subject, color, itemIndex, initialLocation, initialContractor, initialObservationType, onObservationCreated }) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [subjectInput, setSubjectInput] = useState("");
  const [deadline, setDeadline] = useState("");
  const [building, setBuilding] = useState("");
  const [level, setLevel] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [specificLocation, setSpecificLocation] = useState("");
  const [safetySubcategory, setSafetySubcategory] = useState("");
  const [customOtherText, setCustomOtherText] = useState("");
  const [contractorInvolved, setContractorInvolved] = useState(initialContractor || "");
  const [occurrenceDate, setOccurrenceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [occurrenceTime, setOccurrenceTime] = useState(() => new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [observationType, setObservationType] = useState(initialObservationType || "");
  const [natureOfFinding, setNatureOfFinding] = useState("UNSAFE_CONDITION");
  const [riskLevel, setRiskLevel] = useState("MEDIUM");
  const [description, setDescription] = useState("");

  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [contractorsList, setContractorsList] = useState([]);
  const [roomStatusMap, setRoomStatusMap] = useState({});

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const availableSubcategories = useMemo(() => {
    return getSubcategoriesForCategory(subject);
  }, [subject]);

  const isOtherCategory = useMemo(() => {
    const cleanSubject = String(subject || "").toLowerCase().trim();
    return cleanSubject.includes("other") || (availableSubcategories.length === 1 && availableSubcategories[0]?.includes("Please Fill"));
  }, [subject, availableSubcategories]);

  useEffect(() => {
    if (open) {
      setSubjectInput(subject || "");
      setSafetySubcategory(isOtherCategory ? "" : (availableSubcategories[0] || ""));
      setCustomOtherText("");
      setObservationType(initialObservationType || "");
      setNatureOfFinding(initialObservationType === "POSITIVE" ? "GOOD_PRACTICE" : "UNSAFE_CONDITION");
      setRiskLevel("MEDIUM");
      setDescription("");
      setDeadline("");
      setContractorInvolved(initialContractor || "");
      if (initialLocation) {
        setBuilding(initialLocation.building || "");
        setLevel(initialLocation.level || "");
        setSelectedRooms(initialLocation.selectedRooms || []);
        setSelectedZone(initialLocation.selectedZone || null);
        setSpecificLocation(initialLocation.specificLocation || "");
      } else {
        setBuilding("");
        setLevel("");
        setSelectedRooms([]);
        setSelectedZone(null);
        setSpecificLocation("");
      }
    }
  }, [open, subject, initialLocation, initialContractor, initialObservationType, availableSubcategories, isOtherCategory]);

  useEffect(() => {
    const loadSelectors = async () => {
      try {
        const [buildingsRes, floorsRes, roomsRes, contRes] = await Promise.all([
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getRooms(1, 20000),
          getContractors(1, 1000).catch(() => ({ data: [] }))
        ]);
        setBuildingsList(buildingsRes?.data ?? []);
        setFloorsList(floorsRes?.data ?? []);
        setRoomsList(roomsRes?.data?.rows ?? roomsRes?.data ?? roomsRes ?? []);
        const rawCont = contRes?.data?.rows ?? contRes?.data ?? contRes ?? [];
        let cList = Array.isArray(rawCont) ? [...rawCont] : [];
        const hasNne = cList.some(c => {
          const cName = String(c.subContractorName || c.company_name || c.contractor_name || c.name || "").toUpperCase().trim();
          return cName === "NNE" || cName.includes("NNE");
        });
        if (!hasNne) {
          cList.push({ id: "NNE", subContractorName: "NNE", company_name: "NNE", name: "NNE" });
        }
        setContractorsList(cList);
      } catch (err) {
        console.error("Failed to load selectors", err);
      }
    };
    if (open) {
      loadSelectors();
    }
  }, [open]);

  useEffect(() => {
    if (initialContractor && contractorsList.length > 0) {
      const matched = contractorsList.find(c => {
        const cName = c.subContractorName || c.company_name || c.contractor_name || c.name;
        return (
          String(c.id || c.contractor_id) === String(initialContractor) ||
          (cName && cName.toLowerCase().trim() === String(initialContractor).toLowerCase().trim())
        );
      });
      if (matched) {
        setContractorInvolved(String(matched.id || matched.subContractorName || matched.company_name || matched.name || initialContractor));
      }
    }
  }, [initialContractor, contractorsList]);

  const currentContractorValue = useMemo(() => {
    if (!contractorInvolved) return "";
    const matched = contractorsList.find(c => {
      const cName = c.subContractorName || c.company_name || c.contractor_name || c.name;
      return (
        String(c.id || c.contractor_id) === String(contractorInvolved) ||
        (cName && cName.toLowerCase().trim() === String(contractorInvolved).toLowerCase().trim())
      );
    });
    if (matched) {
      return matched.id || matched.subContractorName || matched.company_name || matched.name;
    }
    return contractorInvolved;
  }, [contractorInvolved, contractorsList]);

  const levels = building ? floorsList.filter(f => String(f.build_id) === String(building)).map(f => f.floor_name) : [];
  
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
      return zoneName ? `${zoneName}:${roomClean}` : roomClean;
    }).filter(Boolean).join(", ");
    setSpecificLocation(formattedRooms);
  };

  const dataURLtoBlob = (dataurl) => {
    if (!dataurl || typeof dataurl !== 'string') return null;
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
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

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/png");
      const blob = dataURLtoBlob(dataUrl);
      if (blob) {
        const file = new File([blob], `obs_photo_${Date.now()}.png`, { type: "image/png" });
        setPhotoFiles((prev) => [...prev, file]);
      }
      setPhotoPreviews((prev) => [...prev, dataUrl]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      setPhotoFiles((prev) => [...prev, file]);
      setPhotoPreviews((prev) => [...prev, URL.createObjectURL(file)]);
    });
  };

  const removePhoto = (idx) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };
  
  useEffect(() => {
    if (open) {
      document.body.classList.add('si-right-modal-open');
    } else {
      document.body.classList.remove('si-right-modal-open');
    }
    return () => document.body.classList.remove('si-right-modal-open');
  }, [open]);

  const handleSubmit = async () => {
    if (!observationType) {
      alert("Please select an Observation Type (Positive Observation or Needs Attention).");
      return;
    }

    if (observationType === "NEEDS_ATTENTION" && !description && !safetySubcategory) {
      alert("Please provide a description or select a subcategory for this safety observation.");
      return;
    }

    if (observationType === "POSITIVE" && !description) {
      alert("Please provide a description for this positive observation.");
      return;
    }

    setIsSubmitting(true);
    try {
      const dbBuilding = buildingsList.find(b => String(b.build_id || b.id) === String(building));
      const bName = dbBuilding ? dbBuilding.building_name : "";

      const selectedCont = contractorsList.find(c => 
        String(c.id || c.contractor_id) === String(contractorInvolved) || 
        c.subContractorName === contractorInvolved || 
        c.company_name === contractorInvolved || 
        c.name === contractorInvolved
      );
      const contractorName = selectedCont 
        ? (selectedCont.subContractorName || selectedCont.company_name || selectedCont.contractor_name || selectedCont.name || contractorInvolved) 
        : contractorInvolved;
      const contractorId = selectedCont ? (selectedCont.id || selectedCont.contractor_id) : undefined;

      const isOtherSelection = safetySubcategory?.includes("Please Fill") || safetySubcategory?.toLowerCase().includes("other") || (subject || "").toLowerCase().includes("other");
      const effectiveSubcategory = isOtherSelection && customOtherText.trim()
        ? `20.1 ${customOtherText.trim()}`
        : safetySubcategory;

      const formData = new FormData();
      formData.append("observationType", observationType);
      formData.append("natureOfFinding", natureOfFinding);
      formData.append("subject", subjectInput || subject || "Safety Observation");
      formData.append("safetyCategory", subject || "General");
      formData.append("subcategory", effectiveSubcategory || "");
      formData.append("riskLevel", riskLevel);
      formData.append("description", description || `${subject}: ${effectiveSubcategory || 'Unsafe condition identified'}`);
      
      if (building) formData.append("buildingId", building);
      if (bName) formData.append("buildingName", bName);
      if (level) formData.append("floorLevel", level);
      if (specificLocation) formData.append("specificLocation", specificLocation);
      if (contractorId) formData.append("assignedContractorId", contractorId);
      if (contractorName) formData.append("assignedContractorName", contractorName);
      if (occurrenceDate) formData.append("observationDate", occurrenceDate);
      if (occurrenceTime) formData.append("observationTime", occurrenceTime);
      if (deadline) formData.append("deadline", deadline);

      if (currentUser?.id) formData.append("createdByUserId", currentUser.id);
      formData.append("createdByUserName", currentUser?.name || currentUser?.username || "Safety Inspector");
      formData.append("createdByRole", currentUser?.role || "DEPARTMENT");

      photoFiles.forEach(file => {
        formData.append("photos", file);
      });

      const res = await observationService.createObservation(formData);
      const createdObs = res?.observation || res;

      if (onObservationCreated) {
        onObservationCreated(createdObs, itemIndex);
      }

      onClose();
    } catch (err) {
      console.error("Failed to submit safety issue:", err);
      alert(err?.response?.data?.message || "Failed to create safety observation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  let dotColor = '#1e293b';
  if (color === 'red') dotColor = '#ef4444';
  if (color === 'yellow') dotColor = '#eab308';
  if (color === 'green') dotColor = '#22c55e';

  const titleNode = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor }}></span>
      Safety Observation
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titleNode}
      size="lg"
      scrollable={true}
    >
      <div className="sim-container">

        {/* ── Observation Type Toggle ── */}
        <div className="sim-row">
          <label className="sim-label">Observation Type <span className="sim-req">*</span></label>
          <div className="sim-input-wrap">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                type="button"
                onClick={() => { setObservationType("POSITIVE"); setNatureOfFinding("GOOD_PRACTICE"); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "10px 16px",
                  border: `2px solid ${observationType === "POSITIVE" ? "#7BBE97" : "var(--border-light, #cbd5e1)"}`,
                  borderRadius: 8,
                  background: observationType === "POSITIVE" ? "rgba(123,190,151,0.12)" : "transparent",
                  color: observationType === "POSITIVE" ? "#2D7A4F" : "var(--text-muted, #64748b)",
                  cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}
              >
                <i className="ti ti-shield-check" style={{ fontSize: 16 }}></i>
                Positive Observation
              </button>
              <button
                type="button"
                onClick={() => { setObservationType("NEEDS_ATTENTION"); setNatureOfFinding("UNSAFE_CONDITION"); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "10px 16px",
                  border: `2px solid ${observationType === "NEEDS_ATTENTION" ? "#E32B50" : "var(--border-light, #cbd5e1)"}`,
                  borderRadius: 8,
                  background: observationType === "NEEDS_ATTENTION" ? "rgba(227,43,80,0.10)" : "transparent",
                  color: observationType === "NEEDS_ATTENTION" ? "#E32B50" : "var(--text-muted, #64748b)",
                  cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}
              >
                <i className="ti ti-alert-triangle" style={{ fontSize: 16 }}></i>
                Needs Attention
              </button>
            </div>
          </div>
        </div>

        {/* Nature of Finding (only for Needs Attention) */}
        {observationType === "NEEDS_ATTENTION" && (
          <div className="sim-row">
            <label className="sim-label">Nature of Finding</label>
            <div className="sim-input-wrap">
              <select
                className="sim-input"
                value={natureOfFinding}
                onChange={(e) => setNatureOfFinding(e.target.value)}
              >
                <option value="UNSAFE_ACT">Unsafe Act (behaviour)</option>
                <option value="UNSAFE_CONDITION">Unsafe Condition (environment)</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Date & Time of Occurrence ── */}
        <div className="sim-row">
          <label className="sim-label">Observation Date &amp; Time <span className="sim-req">*</span></label>
          <div className="sim-date-time-group">
            <div className="sim-input-icon-left flex-1">
              <input
                type="date"
                className="sim-input grey-bg"
                value={occurrenceDate}
                onChange={(e) => setOccurrenceDate(e.target.value)}
              />
            </div>
            <input
              type="time"
              className="sim-input time-input grey-bg"
              value={occurrenceTime}
              onChange={(e) => setOccurrenceTime(e.target.value)}
            />
          </div>
        </div>

        {/* ── Subject ── */}
        <div className="sim-row">
          <label className="sim-label">Subject <span className="sim-req">*</span></label>
          <div className="sim-input-icon-wrap" style={{ flex: 1 }}>
            <input
              type="text"
              className="sim-input"
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              placeholder="Brief title / subject of observation"
            />
            {subjectInput && (
              <i className="ti ti-x sim-inner-icon clickable" onClick={() => setSubjectInput("")}></i>
            )}
          </div>
        </div>

        {/* ── Safety Category ── */}
        <div className="sim-row">
          <label className="sim-label">Safety Category <span className="sim-req">*</span></label>
          <div className="sim-input-wrap">
            <input
              type="text"
              className="sim-input"
              readOnly
              disabled
              value={subject || ""}
              style={{ backgroundColor: "rgba(0,0,0,0.04)", cursor: "not-allowed", fontWeight: 500 }}
            />
          </div>
        </div>

        {/* ── Subcategory ── */}
        {observationType === "NEEDS_ATTENTION" && (
          <div className="sim-row">
            <label className="sim-label">Observation Subcategory <span className="sim-req">*</span></label>
            <div className="sim-input-wrap">
              {isOtherCategory ? (
                <input
                  type="text"
                  className="sim-input"
                  placeholder="Enter custom subcategory text (e.g. 20.1 Loose scaffolding clips)..."
                  value={safetySubcategory}
                  onChange={(e) => setSafetySubcategory(e.target.value)}
                  autoFocus
                />
              ) : (
                <select
                  className="sim-input"
                  value={safetySubcategory}
                  onChange={(e) => setSafetySubcategory(e.target.value)}
                >
                  <option value="">-- Select subcategory --</option>
                  {availableSubcategories.map((subcat, idx) => (
                    <option key={idx} value={subcat}>{subcat}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* ── Risk Level ── */}
        <div className="sim-row">
          <label className="sim-label">Risk Level</label>
          <div className="sim-input-wrap">
            <select
              className="sim-input"
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* ── Assign to Contractor ── */}
        <div className="sim-row">
          <label className="sim-label">Assign to Contractor</label>
          <div className="sim-input-wrap">
            <select
              className="sim-input"
              value={currentContractorValue}
              onChange={(e) => setContractorInvolved(e.target.value)}
            >
              <option value="">-- Select Contractor --</option>
              {contractorsList.map((c, i) => {
                const cName = c.subContractorName || c.company_name || c.contractor_name || c.name || `Contractor ${c.id || i}`;
                return (
                  <option key={c.id || i} value={c.id || cName}>{cName}</option>
                );
              })}
            </select>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="sim-row">
          <label className="sim-label">Description <span className="sim-req">*</span></label>
          <div className="sim-input-wrap">
            <textarea
              className="sim-textarea"
              placeholder="Detailed description of what was observed..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
        </div>

        {/* ── Location / Building ── */}
        <div className="sim-row">
          <label className="sim-label">Location / Building</label>
          <div className="sim-input-wrap">
            <select
              className="sim-input"
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
                <option key={item.build_id} value={item.build_id}>{item.building_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Floor / Level ── */}
        <div className="sim-row">
          <label className="sim-label">Floor / Level</label>
          <div className="sim-input-wrap">
            <select
              className="sim-input"
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
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Floor Drawing + Specific Location ── */}
        <div className="sim-row sim-row-col">
          {selectedPdf && (
            <div style={{ position: "relative", marginBottom: "16px", border: "1px solid var(--border-light, #cbd5e1)", borderRadius: "8px", overflow: "hidden", minHeight: "300px", width: "100%" }}>
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
          <label className="sim-label" style={{ marginBottom: "8px" }}>Specific Location / Rooms (Auto-filled from drawing)</label>
          <div className="sim-input-wrap" style={{ width: "100%" }}>
            <input
              type="text"
              className="sim-input"
              value={specificLocation}
              onChange={(e) => setSpecificLocation(e.target.value)}
              placeholder="e.g. Room 204, Grid B4 (Auto-filled from drawing or enter manually)"
            />
          </div>
        </div>

        {/* ── Deadline ── */}
        <div className="sim-row">
          <label className="sim-label">Deadline</label>
          <div className="sim-input-wrap sim-w-50">
            <input
              type="date"
              className="sim-input grey-bg"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>

        {/* ── Attachments ── */}
        <div className="sim-row">
          <label className="sim-label">Attachments</label>
          <div className="sim-input-wrap">
            <div style={{ display: "flex", gap: 10, alignItems: "stretch", marginTop: 8 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1,
                  padding: 16,
                  border: "1.5px dashed var(--border-light, #cbd5e1)",
                  borderRadius: 9,
                  background: "var(--main-bg, #ffffff)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted, #94a3b8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <div style={{ fontSize: 13, color: "var(--text-main, #334155)" }}>Click to select photo files</div>
                <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>JPG, PNG, WEBP, PDF up to 20MB</div>
              </div>

              <button
                type="button"
                onClick={startCamera}
                style={{
                  flex: "0 0 auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "0 22px",
                  border: "1.5px dashed var(--border-light, #cbd5e1)",
                  borderRadius: 9,
                  background: "var(--main-bg, #ffffff)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#1e3a8a",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                Take Photo
              </button>
            </div>

            <input type="file" ref={fileInputRef} multiple accept="image/*,.pdf" style={{ display: "none" }} onChange={handleFileSelect} />

            {isCameraActive && (
              <div style={{ marginTop: 12 }}>
                <div style={{ width: "100%", maxWidth: 480, height: 280, background: "#000", borderRadius: 8, overflow: "hidden", position: "relative" }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }}></video>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button type="button" className="sim-btn-submit" style={{ padding: "4px 12px", fontSize: 13 }} onClick={capturePhoto}>
                    Capture
                  </button>
                  <button type="button" className="sim-btn-cancel" style={{ padding: "4px 12px", fontSize: 13 }} onClick={stopCamera}>
                    Stop Camera
                  </button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

            {photoPreviews.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {photoPreviews.map((src, idx) => (
                  <div key={idx} style={{ position: "relative", width: 72, height: 72, borderRadius: 7, overflow: "hidden", border: "1px solid var(--border-light, #cbd5e1)" }}>
                    <img src={src} alt="thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        fontSize: 12,
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
            )}
          </div>
        </div>
      </div>

      <div className="sim-footer">
        <div className="sim-footer-actions">
          <button className="sim-btn-cancel" disabled={isSubmitting} onClick={onClose}>Cancel</button>
          <button className="sim-btn-submit" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Creating Safety Observation..." : "Submit"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
