import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SafetyIssueModal from "../../../components/common/SafetyIssueModal/SafetyIssueModal";
import FloorDrawing from "../../../pages/Request/FloorDrawing/FloorDrawing";
import { FLOOR_PDFS } from "../../../data/pdfMapping";
import { ZONE_MAPPING } from "../../../data/zones";
import { BUILDINGS } from "../../../data/buildings";
import { getBuildings, getRooms, getFloors } from "../../../services/authService";
import "./SICreate.css";

// The 21 standard safety inspection items
const CHECKLIST_ITEMS = [
  "1. Access/Exit/Walkway",
  "2. Barriers/Signage/Shielding",
  "3. Housekeeping/Waste",
  "4. Noise/Dust/fumes/and health hazards",
  "5. Traffic Management",
  "6. PPE",
  "7. Fire arrangements",
  "8. First aid/Emergency arrangements",
  "9. Training/Competence",
  "10. Communication/Co-ordination",
  "11. RAMS/Permits",
  "12. Hand tools",
  "13. Power tools (110v/battery/other)",
  "14. Work equipment",
  "15. Hazardous substances",
  "16. Manual handling",
  "17. Lifting equipment/accessories",
  "18. Work at height equipment (harness/lanyards/steps)",
  "19. Scaffolding",
  "20. Excavations",
  "21. Services"
];

export default function SICreate() {
  const navigate = useNavigate();
  const [selections, setSelections] = useState({});
  const [completed, setCompleted] = useState(false);
  const [openWrenchIdx, setOpenWrenchIdx] = useState(null);
  const [openPaperclipIdx, setOpenPaperclipIdx] = useState(null);
  const [activeComments, setActiveComments] = useState({});
  const [safetyIssueModalData, setSafetyIssueModalData] = useState(null);
  const fileInputRef = useRef(null);

  const [building, setBuilding] = useState("");
  const [level, setLevel] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [isLoadingSelectors, setIsLoadingSelectors] = useState(true);
  const [roomStatusMap, setRoomStatusMap] = useState({});
  const [specificLocation, setSpecificLocation] = useState("");

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

  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setOpenPaperclipIdx(null);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.si-tooltip-wrap') && !e.target.closest('.beam-modal-dialog')) {
        setOpenWrenchIdx(null);
        setOpenPaperclipIdx(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (idx, color) => {
    setSelections(prev => ({ ...prev, [idx]: color }));
    if (color === 'yellow' || color === 'red') {
      setSafetyIssueModalData({ subject: CHECKLIST_ITEMS[idx], color });
    }
  };

  const toggleComment = (idx) => {
    setActiveComments(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="si-create-container">
      <div className="si-create-header">
        <h1>Safety inspection</h1>
        <button className="si-btn-back" onClick={() => navigate("/safety-inspection/list")}>
          <i className="ti ti-arrow-left"></i> Back
        </button>
      </div>

      <div className="si-form-card">
        <div className="si-form-grid-2">
          {/* Location/Building */}
          <div className="si-form-group">
            <label className="si-form-label">Location/Building <span className="si-req">*</span></label>
            <div className="si-input-wrap">
              <select
                className="si-form-select"
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
          <div className="si-form-group">
            <label className="si-form-label">Floor/Level</label>
            <div className="si-input-wrap">
              <select
                className="si-form-select"
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
          <div className="si-form-group" style={{ gridColumn: "1 / -1" }}>
            {selectedPdf && (
              <div style={{ position: "relative", marginBottom: "16px", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "8px", overflow: "hidden", minHeight: "400px" }}>
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
            <label className="si-form-label">Specific location / Rooms (Auto-filled from drawing)</label>
            <div className="si-input-wrap">
              <input className="si-form-input" type="text" value={specificLocation} readOnly style={{ backgroundColor: "rgba(0,0,0,0.02)", cursor: "not-allowed" }} />
            </div>
          </div>

          {/* Date */}
          <div className="si-form-group">
            <label className="si-form-label">Date</label>
            <div className="si-input-wrap">
              <input type="date" className="si-form-input" />
            </div>
          </div>

          {/* Performed by */}
          <div className="si-form-group">
            <label className="si-form-label">Performed by <span className="si-req">*</span></label>
            <div className="si-input-wrap">
              <select className="si-form-select">
                <option value="">Choose...</option>
                <option value="user1">Alex Mercer</option>
                <option value="user2">John Doe</option>
              </select>
            </div>
          </div>

          {/* Participants */}
          <div className="si-form-group">
            <label className="si-form-label">Participants <span className="si-req">*</span></label>
            <div className="si-input-wrap">
              <select className="si-form-select">
                <option value="">Choose...</option>
                <option value="user1">Jane Smith</option>
                <option value="user2">Mike Johnson</option>
              </select>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="si-checklist">
          {CHECKLIST_ITEMS.map((item, idx) => {
            const selectedColor = selections[idx];

            return (
              <React.Fragment key={idx}>
                <div className="si-check-item">
                  <p className="si-check-label">{item}</p>
                  <div className="si-check-right">
                    <div className="si-check-icons">
                      <div className="si-hidden-icons">
                        <div className="si-tooltip-wrap">
                          <span className="si-icon-btn" onClick={() => toggleComment(idx)}>
                            <i className="ti ti-message-2"></i>
                          </span>
                          <div className="si-tooltip">Comment</div>
                        </div>
                        
                        <div className="si-tooltip-wrap">
                          <span className="si-icon-btn"><i className="ti ti-medal"></i></span>
                          <div className="si-tooltip">Good practice</div>
                        </div>
                        
                        <div className="si-tooltip-wrap">
                          <span className="si-icon-btn" onClick={() => { setOpenWrenchIdx(openWrenchIdx === idx ? null : idx); setOpenPaperclipIdx(null); }}>
                            <i className="ti ti-tool"></i>
                          </span>
                          {openWrenchIdx === idx && (
                            <div className="si-popover-menu" style={{ minWidth: '180px' }}>
                              <div className="si-dropdown-item" onClick={() => {
                                setSafetyIssueModalData({ subject: CHECKLIST_ITEMS[idx], color: 'red' });
                                setOpenWrenchIdx(null);
                              }}>
                                <i className="ti ti-alert-triangle"></i> Safety Issue
                              </div>
                              <div className="si-dropdown-item"><i className="ti ti-link"></i> Link to existing task</div>
                            </div>
                          )}
                        </div>
                        
                        <div className="si-tooltip-wrap">
                          <span className="si-icon-btn" onClick={() => { setOpenPaperclipIdx(openPaperclipIdx === idx ? null : idx); setOpenWrenchIdx(null); }}>
                            <i className="ti ti-paperclip"></i>
                          </span>
                          {openPaperclipIdx === idx && (
                            <div className="si-popover-menu si-paperclip-menu" style={{ minWidth: '220px' }}>
                              <div className="si-dropdown-item" onClick={handleFileUploadClick}><i className="ti ti-upload"></i> Upload from computer</div>
                              <div className="si-dropdown-item"><i className="ti ti-folder"></i> Box</div>
                              <div className="si-dropdown-item"><i className="ti ti-clipboard"></i> Paste from clipboard</div>
                              <div className="si-dropdown-item"><i className="ti ti-border-all"></i> Annotate drawing</div>
                              <div className="si-dropdown-item"><i className="ti ti-photo"></i> Photo album</div>
                              <div className="si-dropdown-item"><i className="ti ti-360"></i> 360° photo</div>
                              <div className="si-dropdown-item"><i className="ti ti-map-pin"></i> SiteWalk</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="si-icon-btn"><i className="ti ti-info-circle"></i></span>
                    </div>
                    
                    <div className="si-radio-group">
                      <button 
                        className={`si-radio-btn ${selectedColor === 'red' ? 'active red-btn' : ''}`}
                        onClick={() => handleSelect(idx, 'red')}
                        type="button"
                      >
                        <span className={`si-dot ${selectedColor === 'red' ? 'red' : 'red'}`}></span>
                      </button>
                      <button 
                        className={`si-radio-btn ${selectedColor === 'yellow' ? 'active yellow-btn' : ''}`}
                        onClick={() => handleSelect(idx, 'yellow')}
                        type="button"
                      >
                        <span className={`si-dot ${selectedColor === 'yellow' ? 'yellow' : 'yellow'}`}></span>
                      </button>
                      <button 
                        className={`si-radio-btn ${selectedColor === 'green' ? 'active green-btn' : ''}`}
                        onClick={() => handleSelect(idx, 'green')}
                        type="button"
                      >
                        <span className={`si-dot ${selectedColor === 'green' ? 'green' : 'green'}`}></span>
                      </button>
                    </div>
                  </div>
                </div>
                {activeComments[idx] && (
                  <textarea className="si-comment-box" placeholder="Comment" autoFocus></textarea>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer */}
        <div className="si-footer">
          <div className="si-footer-left">
            <input 
              type="checkbox" 
              id="completedCheck" 
              checked={completed} 
              onChange={(e) => setCompleted(e.target.checked)} 
            />
            <label htmlFor="completedCheck">Completed (safety report will be available for everyone)</label>
          </div>
          <div className="si-footer-right">
            <button className="si-btn-cancel" onClick={() => navigate("/safety-inspection/list")}>Cancel</button>
            <button className="si-btn-save" onClick={() => navigate("/safety-inspection/list")}>Save</button>
          </div>
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} />

      <SafetyIssueModal 
        open={!!safetyIssueModalData} 
        subject={safetyIssueModalData?.subject} 
        color={safetyIssueModalData?.color}
        initialLocation={{ building, level, specificLocation, selectedRooms, selectedZone }}
        onClose={() => setSafetyIssueModalData(null)} 
      />
    </div>
  );
}
