import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import { observationService } from "../../../services/observationService";
import { getContractors, getBuildings, getRooms, getFloors } from "../../../services/authService";
import { SAFETY_CATEGORIES } from "../data/observations";
import FloorDrawing from "../../../pages/Request/FloorDrawing/FloorDrawing";
import { FLOOR_PDFS } from "../../../data/pdfMapping";
import { ZONE_MAPPING } from "../../../data/zones";
import { BUILDINGS } from "../../../data/buildings";
import "../../../styles/module-shared.css";

const initialForm = {
  observationType: "NEEDS_ATTENTION", // POSITIVE | NEEDS_ATTENTION
  natureOfFinding: "UNSAFE_CONDITION", // GOOD_PRACTICE | UNSAFE_ACT | UNSAFE_CONDITION
  subject: "",
  safetyCategory: "",
  riskLevel: "MEDIUM",
  projectName: "M3SOUTH", // Default fixed to M3SOUTH
  assignedContractorId: "",
  assignedContractorName: "",
  description: "",
  buildingId: "",
  buildingName: "",
  floorLevel: "",
  specificLocation: "",
  immediateActionTaken: "",
};

function SOCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);

  // Selector data
  const [contractorsList, setContractorsList] = useState([]);
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [isLoadingSelectors, setIsLoadingSelectors] = useState(true);

  // Location drawing state matching Incident Management Heads-Up Form
  const [building, setBuilding] = useState("");
  const [level, setLevel] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = localStorage.getItem("UserType") || "DEPARTMENT";

  useEffect(() => {
    const loadSelectors = async () => {
      try {
        const [contractorsRes, buildingsRes, floorsRes, roomsRes] = await Promise.all([
          getContractors(1, 1000),
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getRooms(1, 20000),
        ]);

        const rawContractors = contractorsRes?.data?.rows || contractorsRes?.data || contractorsRes || [];
        setContractorsList(Array.isArray(rawContractors) ? rawContractors : []);

        const rawBuildings = buildingsRes?.data?.rows || buildingsRes?.data || buildingsRes || [];
        setBuildingsList(Array.isArray(rawBuildings) ? rawBuildings : []);

        const rawFloors = floorsRes?.data?.rows || floorsRes?.data || floorsRes || [];
        setFloorsList(Array.isArray(rawFloors) ? rawFloors : []);

        const rawRooms = roomsRes?.data?.rows || roomsRes?.data || roomsRes || [];
        setRoomsList(Array.isArray(rawRooms) ? rawRooms : []);
      } catch (err) {
        console.error("Failed to load selector data for observation creation", err);
      } finally {
        setIsLoadingSelectors(false);
      }
    };
    loadSelectors();
  }, []);

  // Compute levels based on selected building matching Incident Management
  const levels = building ? floorsList.filter((f) => String(f.build_id) === String(building)).map((f) => f.floor_name) : [];

  // Compute selected PDF drawing matching Incident Management
  const selectedPdf = useMemo(() => {
    if (!building || !level) return "";
    const dbBuilding = buildingsList.find((b) => String(b.build_id || b.id) === String(building));
    const bName = dbBuilding ? dbBuilding.building_name : "";
    if (!bName) return "";
    const staticB = BUILDINGS.find((item) => item.name.toLowerCase().trim() === bName.toLowerCase().trim());
    const staticBuildingId = staticB ? staticB.id : "";
    if (!staticBuildingId) return "";
    const pdfsForBuilding = FLOOR_PDFS[staticBuildingId];
    if (!pdfsForBuilding) return "";
    if (pdfsForBuilding[level]) return pdfsForBuilding[level];
    const levelLower = level.toLowerCase().trim();
    const foundKey = Object.keys(pdfsForBuilding).find(
      (k) => k.toLowerCase().trim().includes(levelLower) || levelLower.includes(k.toLowerCase().trim())
    );
    return foundKey ? pdfsForBuilding[foundKey] : "";
  }, [building, level, buildingsList]);

  // Compute selected zones matching Incident Management
  const selectedZones = useMemo(() => {
    if (!level) return [];
    let zonesForLevel = ZONE_MAPPING[level] || [];
    if (zonesForLevel.length === 0) {
      const levelLower = level.toLowerCase().trim();
      const foundKey = Object.keys(ZONE_MAPPING).find(
        (k) => k.toLowerCase().trim().includes(levelLower) || levelLower.includes(k.toLowerCase().trim())
      );
      if (foundKey) zonesForLevel = ZONE_MAPPING[foundKey];
    }
    return zonesForLevel;
  }, [level]);

  // Format rooms with their corresponding Zone names attached
  const formatRoomsWithZones = (roomsArray) => {
    if (!Array.isArray(roomsArray) || roomsArray.length === 0) return "";
    return roomsArray
      .map((rStr) => {
        const roomClean = String(rStr).trim();
        if (!roomClean) return "";

        // 1. Try to find room in roomsList from database
        const matchedDbRoom = roomsList.find(
          (dbR) =>
            String(dbR.room_name || dbR.room || dbR.name || dbR.id).toLowerCase().trim() === roomClean.toLowerCase() ||
            roomClean.toLowerCase().includes(String(dbR.room_name || dbR.room || "").toLowerCase().trim())
        );

        let zoneName = matchedDbRoom?.zone_name || matchedDbRoom?.zone || "";

        // 2. If not found in database roomsList, search in selectedZones (ZONE_MAPPING)
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

        // Format as "zoneName:roomName" e.g. "ZONE 2.A4:2.005"
        if (zoneName) {
          return `${zoneName}:${roomClean}`;
        }
        return roomClean;
      })
      .filter(Boolean)
      .join(", ");
  };

  // Handle room selection on drawing
  const handleRoomsSelected = (rooms) => {
    setSelectedRooms(rooms);
    const dbBuilding = buildingsList.find((b) => String(b.build_id || b.id) === String(building));
    const bName = dbBuilding ? dbBuilding.building_name || dbBuilding.name : "";

    const formattedLocation = formatRoomsWithZones(rooms);

    setForm((prev) => ({
      ...prev,
      buildingId: building,
      buildingName: bName,
      floorLevel: level,
      specificLocation: formattedLocation,
    }));
    if (errors.specificLocation) setErrors((prev) => ({ ...prev, specificLocation: null }));
  };

  useEffect(() => {
    if (building && level) {
      const dbBuilding = buildingsList.find((b) => String(b.build_id || b.id) === String(building));
      const bName = dbBuilding ? dbBuilding.building_name || dbBuilding.name : "";
      setForm((prev) => ({
        ...prev,
        buildingId: building,
        buildingName: bName,
        floorLevel: level,
      }));
    }
  }, [building, level, buildingsList]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      alert("Camera access denied or unavailable.");
    }
  };

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
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `obs_cam_${Date.now()}.jpg`, { type: "image/jpeg" });
          const previewUrl = URL.createObjectURL(file);
          setPhotoFiles((prev) => [...prev, file]);
          setPhotoPreviews((prev) => [...prev, previewUrl]);
        }
      }, "image/jpeg", 0.85);

      stopCamera();
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

  const validate = () => {
    const errs = {};
    if (!form.subject) errs.subject = "Required";
    if (!form.safetyCategory) errs.safetyCategory = "Required";
    if (!form.description) errs.description = "Required";
    if (!building) errs.building = "Location/Building is required";
    if (!form.specificLocation) errs.specificLocation = "Specific location detail is required";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "assignedContractorId") {
      const selected = contractorsList.find((c) => String(c.id) === String(value));
      const contractorName = selected ? selected.subContractorName || selected.company_name || selected.contractor_name || selected.subcontractor_name || selected.name || "" : "";
      setForm((prev) => ({
        ...prev,
        assignedContractorId: value,
        assignedContractorName: contractorName,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      setSubmitting(true);

      const dbBuilding = buildingsList.find((b) => String(b.build_id || b.id) === String(building));
      const bName = dbBuilding ? dbBuilding.building_name || dbBuilding.name : "";

      const formData = new FormData();
      formData.append("observationType", form.observationType);
      formData.append("natureOfFinding", form.natureOfFinding);
      formData.append("subject", form.subject);
      formData.append("safetyCategory", form.safetyCategory);
      formData.append("riskLevel", form.riskLevel);
      formData.append("description", form.description);
      formData.append("projectName", "M3SOUTH"); // Fixed default M3SOUTH
      if (building) formData.append("buildingId", building);
      if (bName) formData.append("buildingName", bName);
      if (level) formData.append("floorLevel", level);
      formData.append("specificLocation", form.specificLocation);
      if (form.assignedContractorId) formData.append("assignedContractorId", form.assignedContractorId);
      if (form.assignedContractorName) formData.append("assignedContractorName", form.assignedContractorName);
      if (form.immediateActionTaken) formData.append("immediateActionTaken", form.immediateActionTaken);

      formData.append("createdByUserId", currentUser.id || "");
      formData.append("createdByUserName", currentUser.username || currentUser.name || "User");
      formData.append("createdByRole", userRole);

      // Append Multer photo files
      photoFiles.forEach((file) => {
        formData.append("photos", file);
      });

      await observationService.createObservation(formData);
      setSubmitted(true);
      setTimeout(() => navigate("/safety-observations/list"), 1500);
    } catch (err) {
      console.error("Error creating observation:", err);
      alert(err.response?.data?.message || "Failed to create safety observation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mod-page">
        <div className="mod-card" style={{ maxWidth: 480, margin: "60px auto", textAlign: "center", padding: "48px 32px" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--color-safe-bg)",
              color: "var(--color-safe)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="32" height="32">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ margin: "0 0 12px", color: "var(--text-main)" }}>Observation Submitted</h2>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Redirecting to observations list...</p>
        </div>
      </div>
    );
  }

  const isNeedsAttention = form.observationType === "NEEDS_ATTENTION";

  return (
    <div className="mod-page">
      <PageHeader
        title="New Safety Observation"
        breadcrumb={[{ label: "Safety Observations", link: "/safety-observations/list" }, { label: "New Observation" }]}
      />

      <div className="mod-card">
        <form onSubmit={handleSubmit} className="mod-card-body" style={{ padding: 32 }}>
          {/* Observation Type Switcher */}
          <div className="fsec">
            <div className="fsec-title" style={{ fontSize: 13, borderBottom: "none", marginBottom: 12 }}>
              Observation Type <span style={{ color: "#E32B50" }}>*</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setForm({ ...form, observationType: "POSITIVE", natureOfFinding: "GOOD_PRACTICE" })}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: 16,
                border: `2px solid ${form.observationType === "POSITIVE" ? "#7BBE97" : "var(--border-color)"}`,
                borderRadius: 9,
                background: form.observationType === "POSITIVE" ? "rgba(123,190,151,0.12)" : "var(--bg-card)",
                color: form.observationType === "POSITIVE" ? "#2D7A4F" : "var(--text-main)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Positive Observation
            </button>

            <button
              type="button"
              onClick={() => setForm({ ...form, observationType: "NEEDS_ATTENTION", natureOfFinding: "UNSAFE_CONDITION" })}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: 16,
                border: `2px solid ${form.observationType === "NEEDS_ATTENTION" ? "#E32B50" : "var(--border-color)"}`,
                borderRadius: 9,
                background: form.observationType === "NEEDS_ATTENTION" ? "rgba(227,43,80,0.10)" : "var(--bg-card)",
                color: form.observationType === "NEEDS_ATTENTION" ? "#E32B50" : "var(--text-main)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              Needs Attention
            </button>
          </div>

          {isNeedsAttention && (
            <div className="mod-form-group" style={{ marginBottom: 24 }}>
              <label className="mod-form-label">Nature of finding</label>
              <select className="mod-form-select" name="natureOfFinding" value={form.natureOfFinding} onChange={handleChange}>
                <option value="UNSAFE_ACT">Unsafe Act (behaviour)</option>
                <option value="UNSAFE_CONDITION">Unsafe Condition (environment)</option>
              </select>
            </div>
          )}

          <div className="fsec">
            <div className="fsec-title" style={{ fontSize: 13, borderBottom: "none", marginBottom: 12 }}>
              General Information
            </div>
          </div>

          {/* Subject */}
          <div className="mod-form-group">
            <label className="mod-form-label">
              Subject <span style={{ color: "#E32B50" }}>*</span>
            </label>
            <input
              className={`mod-form-input ${errors.subject ? "error" : ""}`}
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Brief title / subject of observation"
            />
            {errors.subject && <div className="mod-form-error">{errors.subject}</div>}
          </div>

          {/* Category & Risk Level */}
          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="mod-form-group">
              <label className="mod-form-label">
                Safety Category <span style={{ color: "#E32B50" }}>*</span>
              </label>
              <select className={`mod-form-select ${errors.safetyCategory ? "error" : ""}`} name="safetyCategory" value={form.safetyCategory} onChange={handleChange}>
                <option value="">-- Select category --</option>
                {SAFETY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.safetyCategory && <div className="mod-form-error">{errors.safetyCategory}</div>}
            </div>

            {isNeedsAttention && (
              <div className="mod-form-group">
                <label className="mod-form-label">Risk level</label>
                <select className="mod-form-select" name="riskLevel" value={form.riskLevel} onChange={handleChange}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            )}
          </div>

          {/* Project Name (Fixed Default M3SOUTH) & Contractor Selection */}
          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="mod-form-group">
              <label className="mod-form-label">Project Name</label>
              <input
                className="mod-form-input"
                name="projectName"
                value="M3SOUTH"
                readOnly
                disabled
                style={{ backgroundColor: "rgba(255,255,255,0.06)", cursor: "not-allowed", opacity: 0.7, fontWeight: 600 }}
              />
            </div>

            <div className="mod-form-group">
              <label className="mod-form-label">Assign to Contractor</label>
              <select className="mod-form-select" name="assignedContractorId" value={form.assignedContractorId} onChange={handleChange}>
                <option value="">-- Select Contractor --</option>
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
          </div>

          {/* Description */}
          <div className="mod-form-group">
            <label className="mod-form-label">
              Description <span style={{ color: "#E32B50" }}>*</span>
            </label>
            <textarea
              className={`mod-form-textarea ${errors.description ? "error" : ""}`}
              rows="4"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Detailed description of what was observed..."
            ></textarea>
            {errors.description && <div className="mod-form-error">{errors.description}</div>}
          </div>

          {/* ---------------- Exact Location Flow matching Incident Management Heads-Up Form ---------------- */}
          <div className="fsec" style={{ marginTop: 24 }}>
            <div className="fsec-title" style={{ fontSize: 13, borderBottom: "none", marginBottom: 12 }}>
              Location Details (Incident Management Flow)
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Location/Building Select */}
            <div className="mod-form-group">
              <label className="mod-form-label">
                Location/Building <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <select
                className="mod-form-select"
                value={building}
                onChange={(e) => {
                  setBuilding(e.target.value);
                  setLevel("");
                  setSelectedRooms([]);
                  setSelectedZone(null);
                  setForm((prev) => ({ ...prev, buildingId: e.target.value, floorLevel: "", specificLocation: "" }));
                  if (errors.building) setErrors((prev) => ({ ...prev, building: null }));
                }}
              >
                <option value="">Select Building</option>
                {buildingsList.map((item) => (
                  <option key={item.build_id || item.id} value={item.build_id || item.id}>
                    {item.building_name || item.name}
                  </option>
                ))}
              </select>
              {errors.building && <span style={{ fontSize: "0.75rem", color: "#DC2626" }}>{errors.building}</span>}
            </div>

            {/* Floor/Level Select */}
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
                  setForm((prev) => ({ ...prev, floorLevel: e.target.value }));
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
          </div>

          {/* Interactive Floor PDF Drawing Canvas */}
          <div className="mod-form-group full-width" style={{ marginTop: 12 }}>
            {selectedPdf && (
              <div style={{ position: "relative", marginTop: "16px", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden", minHeight: "400px" }}>
                <FloorDrawing
                  pdf={selectedPdf}
                  zones={selectedZones}
                  level={level}
                  selectedRooms={selectedRooms}
                  onRoomsSelected={handleRoomsSelected}
                  roomStatusMap={{}}
                />
              </div>
            )}

            <label className="mod-form-label" style={{ marginTop: "16px" }}>
              Specific location / Rooms <span style={{ color: "#E32B50" }}>*</span>
            </label>
            <input
              name="specificLocation"
              type="text"
              className={`mod-form-input ${errors.specificLocation ? "error" : ""}`}
              value={form.specificLocation}
              onChange={handleChange}
              placeholder="e.g. Room 204, Grid B4 (Auto-filled from drawing or enter manually)"
            />
            {errors.specificLocation && <div className="mod-form-error">{errors.specificLocation}</div>}
          </div>

          {/* Attachments & Photo File Uploads via Multer */}
          <div className="fsec" style={{ marginTop: 24 }}>
            <div className="fsec-title" style={{ fontSize: 13, borderBottom: "none", marginBottom: 12 }}>
              Attachments & Photos (Multer Upload)
            </div>
          </div>

          <div className="mod-form-group">
            <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1,
                  padding: 16,
                  border: "1.5px dashed var(--border-color)",
                  borderRadius: 9,
                  background: "var(--bg-card)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <div style={{ fontSize: 13 }}>Click to select photo files</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>JPG, PNG, WEBP, PDF up to 20MB</div>
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
                  border: "1.5px dashed var(--border-color)",
                  borderRadius: 9,
                  background: "var(--bg-card)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--nne-brand-blue)",
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
                <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", maxHeight: 280, background: "#000", borderRadius: 8, display: "block" }}></video>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button type="button" className="mod-btn-primary" style={{ padding: "4px 12px", fontSize: 13 }} onClick={capturePhoto}>
                    Capture
                  </button>
                  <button type="button" className="mod-btn-outline" style={{ padding: "4px 12px", fontSize: 13 }} onClick={stopCamera}>
                    Cancel Camera
                  </button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {photoPreviews.map((src, idx) => (
                <div key={idx} style={{ position: "relative", width: 72, height: 72, borderRadius: 7, overflow: "hidden", border: "1px solid var(--border-color)" }}>
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
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border-color)" }}>
            <button type="button" className="mod-btn-outline" onClick={() => navigate("/safety-observations/list")}>
              Cancel
            </button>
            <button type="submit" className="mod-btn-primary" disabled={submitting} style={{ background: "#131E40", borderColor: "#131E40", color: "#fff" }}>
              {submitting ? "Submitting..." : "Submit Observation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SOCreate;
