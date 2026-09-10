import React, { useEffect, useRef } from "react";
import Modal from "../Modal/Modal";
import FloorDrawing from "../../../pages/Request/FloorDrawing/FloorDrawing";
import { FLOOR_PDFS } from "../../../data/pdfMapping";
import { ZONE_MAPPING } from "../../../data/zones";
import { BUILDINGS } from "../../../data/buildings";
import { getBuildings, getRooms, getFloors } from "../../../services/authService";
import "./SafetyIssueModal.css";

export default function SafetyIssueModal({ open, onClose, subject, color, initialLocation }) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [photoFiles, setPhotoFiles] = React.useState([]);
  const [photoPreviews, setPhotoPreviews] = React.useState([]);
  const [isCameraActive, setIsCameraActive] = React.useState(false);

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

  const [building, setBuilding] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [selectedRooms, setSelectedRooms] = React.useState([]);
  const [selectedZone, setSelectedZone] = React.useState(null);
  const [buildingsList, setBuildingsList] = React.useState([]);
  const [floorsList, setFloorsList] = React.useState([]);
  const [roomsList, setRoomsList] = React.useState([]);
  const [isLoadingSelectors, setIsLoadingSelectors] = React.useState(true);
  const [roomStatusMap, setRoomStatusMap] = React.useState({});
  const [specificLocation, setSpecificLocation] = React.useState("");

  useEffect(() => {
    if (open && initialLocation) {
      setBuilding(initialLocation.building || "");
      setLevel(initialLocation.level || "");
      setSelectedRooms(initialLocation.selectedRooms || []);
      setSelectedZone(initialLocation.selectedZone || null);
      setSpecificLocation(initialLocation.specificLocation || "");
    }
  }, [open, initialLocation]);

  useEffect(() => {
    const loadSelectors = async () => {
      try {
        const [buildingsRes, floorsRes, roomsRes] = await Promise.all([
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getRooms(1, 20000)
        ]);
        setBuildingsList(buildingsRes?.data ?? []);
        setFloorsList(floorsRes?.data ?? []);
        setRoomsList(roomsRes?.data?.rows ?? roomsRes?.data ?? roomsRes ?? []);
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
    setSpecificLocation(formattedRooms);
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
  
  // Make this specific modal act as a right-side drawer
  useEffect(() => {
    if (open) {
      document.body.classList.add('si-right-modal-open');
    } else {
      document.body.classList.remove('si-right-modal-open');
    }
    return () => document.body.classList.remove('si-right-modal-open');
  }, [open]);

  // Determine dot color
  let dotColor = '#1e293b'; // dark default
  if (color === 'red') dotColor = '#ef4444';
  if (color === 'yellow') dotColor = '#eab308';
  if (color === 'green') dotColor = '#22c55e';

  const titleNode = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor }}></span>
      Safety Issue (SI)
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
        {/* Type */}
        <div className="sim-row">
          <label className="sim-label">Type</label>
          <div className="sim-input-wrap">
            <select className="sim-input" disabled defaultValue="Safety Issue (SI)">
              <option>Safety Issue (SI)</option>
            </select>
          </div>
        </div>

        {/* Responsible */}
        <div className="sim-row">
          <label className="sim-label">Responsible <span className="sim-req">*</span></label>
          <div className="sim-input-wrap">
            <select className="sim-input">
              <option value=""></option>
            </select>
          </div>
        </div>

        {/* Subject */}
        <div className="sim-row">
          <label className="sim-label">Subject <span className="sim-req">*</span></label>
          <div className="sim-input-group">
            <div className="sim-input-icon-wrap">
              <input type="text" className="sim-input" defaultValue={subject || ""} />
              <i className="ti ti-x sim-inner-icon clickable"></i>
            </div>
            <button className="sim-btn-icon"><i className="ti ti-plus"></i></button>
          </div>
        </div>

        {/* Deadline */}
        <div className="sim-row">
          <label className="sim-label">Deadline</label>
          <div className="sim-input-wrap sim-w-50">
            <input type="date" className="sim-input grey-bg" />
          </div>
        </div>

        {/* Location/Building */}
        <div className="sim-row">
          <label className="sim-label">Location/Building</label>
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
                <option key={item.build_id} value={item.build_id}>
                  {item.building_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Floor/Level */}
        <div className="sim-row">
          <label className="sim-label">Floor/Level</label>
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
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Specific Location */}
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
          <label className="sim-label" style={{ marginBottom: "8px" }}>Specific location / Rooms (Auto-filled from drawing)</label>
          <div className="sim-input-wrap" style={{ width: "100%" }}>
            <input type="text" className="sim-input grey-bg" value={specificLocation} readOnly />
          </div>
        </div>

        {/* Risk Matrix Result */}
        <div className="sim-row">
          <label className="sim-label">Risk Matrix Result <span className="sim-req">*</span></label>
          <div className="sim-input-group">
            <div className="sim-input-icon-wrap">
              <select className="sim-input">
                <option value="">{color === 'red' ? '🔴' : color === 'yellow' ? '🟡' : '⚫'}</option>
              </select>
            </div>
            <button className="sim-btn-icon pdf-btn"><i className="ti ti-file-type-pdf"></i></button>
          </div>
        </div>

        {/* Safety category [24H] */}
        <div className="sim-row">
          <label className="sim-label">Safety category <br/><small>[24H]</small> <span className="sim-req">*</span></label>
          <div className="sim-input-wrap">
            <select className="sim-input" disabled defaultValue={subject || ""}>
              <option>{subject || "Choose..."}</option>
            </select>
          </div>
        </div>

        {/* Safety subcategory */}
        <div className="sim-row">
          <label className="sim-label">Safety subcategory</label>
          <div className="sim-input-wrap">
            <select className="sim-input">
              <option value="">Choose...</option>
            </select>
          </div>
        </div>

        {/* Contractor involved */}
        <div className="sim-row">
          <label className="sim-label">Contractor involved <span className="sim-req">*</span></label>
          <div className="sim-input-wrap">
            <select className="sim-input">
              <option value="">Choose...</option>
            </select>
          </div>
        </div>

        {/* Date and time of occurrence */}
        <div className="sim-row">
          <label className="sim-label">Date and time of<br/>occurrence <span className="sim-req">*</span></label>
          <div className="sim-date-time-group">
            <div className="sim-input-icon-left flex-1">
              <input type="date" className="sim-input grey-bg" />
            </div>
            <input type="time" className="sim-input time-input grey-bg" />
          </div>
        </div>

        {/* HSE Typology */}
        <div className="sim-row">
          <label className="sim-label">HSE Typology <span className="sim-req">*</span></label>
          <div className="sim-input-group">
            <div className="sim-input-icon-wrap">
              <select className="sim-input">
                <option value="">Choose...</option>
              </select>
            </div>
            <button className="sim-btn-icon pdf-btn"><i className="ti ti-file-type-pdf"></i></button>
          </div>
        </div>

        {/* Description */}
        <div className="sim-row">
          <label className="sim-label">Description <span className="sim-req">*</span></label>
          <div className="sim-input-wrap">
            <textarea className="sim-textarea"></textarea>
          </div>
        </div>

        {/* Attachments */}
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
          <button className="sim-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="sim-btn-submit">Submit</button>
        </div>
      </div>
    </Modal>
  );
}
