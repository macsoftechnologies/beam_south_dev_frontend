import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SafetyIssueModal from "../../../components/common/SafetyIssueModal/SafetyIssueModal";
import FloorDrawing from "../../../pages/Request/FloorDrawing/FloorDrawing";
import { FLOOR_PDFS } from "../../../data/pdfMapping";
import { ZONE_MAPPING } from "../../../data/zones";
import { BUILDINGS } from "../../../data/buildings";
import { getBuildings, getRooms, getFloors, getEmployees } from "../../../services/authService";
import { safetyInspectionService } from "../../../services/safetyInspectionService";
import "./SICreate.css";

// The 20 standard safety inspection items
const CHECKLIST_ITEMS = [
  "1. Access / Exit",
  "2. Barriers / Signage / Shielding",
  "3. Housekeeping / Waste",
  "4. Noise / Dust / Fumes / Health Hazards",
  "5. Storage & Handling",
  "6. Electrical Hazards",
  "7. Working at Heights",
  "8. Lifting / Rigging",
  "9. Hot Works",
  "10. Mobile Elevating Work Equipment",
  "11. Lighting",
  "12. Documentation & Procedures",
  "13. Scaffold / Alloy Towers",
  "14. Slip / Trip Hazards",
  "15. PPE",
  "16. Tools & Machinery",
  "17. Environmental Hazards",
  "18. Emergency Equipment",
  "19. Excavation / Trenches",
  "20. Other"
];

export default function SICreate() {
  const navigate = useNavigate();
  const [selections, setSelections] = useState({});
  const [completed, setCompleted] = useState(false);
  const [openInfoIdx, setOpenInfoIdx] = useState(null);
  const [openWrenchIdx, setOpenWrenchIdx] = useState(null);
  const [openPaperclipIdx, setOpenPaperclipIdx] = useState(null);
  const [activeComments, setActiveComments] = useState({});
  const [comments, setComments] = useState({});
  const [itemPhotos, setItemPhotos] = useState({});
  const [itemIssues, setItemIssues] = useState({});
  const [otherCustomTexts, setOtherCustomTexts] = useState({});
  const [activeUploadIdx, setActiveUploadIdx] = useState(null);
  const [safetyIssueModalData, setSafetyIssueModalData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const [building, setBuilding] = useState("");
  const [level, setLevel] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [inspectionDate, setInspectionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [performedBy, setPerformedBy] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const participantsRef = useRef(null);

  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [isLoadingSelectors, setIsLoadingSelectors] = useState(true);
  const [roomStatusMap, setRoomStatusMap] = useState({});
  const [specificLocation, setSpecificLocation] = useState("");

  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const loggedInUserName = React.useMemo(() => {
    const name = currentUser.name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username || "Superadmin";
    const deptOrComp = currentUser.department || currentUser.company || currentUser.role || "";
    return deptOrComp ? `${name} (${deptOrComp})` : name;
  }, [currentUser]);

  const formattedParticipantsList = React.useMemo(() => {
    if (employeesList.length > 0) {
      return employeesList.map((emp, i) => {
        const empName = emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.username || `User ${emp.id || i}`;
        const label = emp.company || emp.department ? `${empName} (${emp.company || emp.department})` : empName;
        return label;
      });
    }
    return [
      "Oliver O'Neill (STS)",
      "Albert Glowniak (Multi-Tech)",
      "Tor Busch Nielsen (Zeta)",
      "Charles Luedtke (NNE A/S)",
      "Ramiro Sancheira Borges (NNE A/S)",
      "Kenneth Weigand (SKEL.DK LANDINSPEKTØRER P/S)"
    ];
  }, [employeesList]);

  const filteredParticipants = React.useMemo(() => {
    if (!participantSearch) return formattedParticipantsList;
    return formattedParticipantsList.filter(p => p.toLowerCase().includes(participantSearch.toLowerCase()));
  }, [formattedParticipantsList, participantSearch]);

  const toggleParticipant = (person) => {
    if (participants.includes(person)) {
      setParticipants(participants.filter(p => p !== person));
    } else {
      setParticipants([...participants, person]);
    }
  };

  const removeParticipant = (e, person) => {
    e.stopPropagation();
    setParticipants(participants.filter(p => p !== person));
  };

  useEffect(() => {
    const loadSelectors = async () => {
      try {
        const [buildingsRes, floorsRes, roomsRes, empRes] = await Promise.all([
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getRooms(1, 20000),
          getEmployees(1, 1000).catch(() => ({ data: [] }))
        ]);
        setBuildingsList(buildingsRes?.data ?? []);
        setFloorsList(floorsRes?.data ?? []);
        setRoomsList(roomsRes?.data?.rows ?? roomsRes?.data ?? roomsRes ?? []);
        const rawEmps = empRes?.data?.rows ?? empRes?.data ?? empRes ?? [];
        setEmployeesList(Array.isArray(rawEmps) ? rawEmps : []);
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

  const handleFileUploadClick = (idx) => {
    setActiveUploadIdx(idx);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setOpenPaperclipIdx(null);
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || activeUploadIdx === null) return;
    try {
      const res = await safetyInspectionService.uploadPhotos(Array.from(files));
      if (res?.urls && res.urls.length > 0) {
        setItemPhotos(prev => ({
          ...prev,
          [activeUploadIdx]: [...(prev[activeUploadIdx] || []), ...res.urls]
        }));
      }
    } catch (err) {
      console.error("Failed to upload photos", err);
      alert("Failed to upload attachment photo");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.si-check-icons') && !e.target.closest('.beam-modal-dialog')) {
        setOpenInfoIdx(null);
        setOpenWrenchIdx(null);
        setOpenPaperclipIdx(null);
      }
      if (participantsRef.current && !participantsRef.current.contains(e.target)) {
        setIsParticipantsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (idx, color) => {
    setSelections(prev => ({ ...prev, [idx]: color }));
    if (color === 'yellow' || color === 'red') {
      const isOther = CHECKLIST_ITEMS[idx].toLowerCase().includes('other');
      const effectiveSubject = isOther && otherCustomTexts[idx]?.trim()
        ? `20. Other - ${otherCustomTexts[idx].trim()}`
        : CHECKLIST_ITEMS[idx];
      setSafetyIssueModalData({ subject: effectiveSubject, color, itemIndex: idx });
    }
  };

  const handleObservationCreated = (createdObs, itemIdx) => {
    if (itemIdx === undefined || itemIdx === null) return;
    const obsNum = createdObs?.observationNumber || (createdObs?.id ? `SO${createdObs.id}` : 'SO');
    const subcatText = createdObs?.subcategory || createdObs?.subject || 'Safety Issue';
    const issueTag = {
      id: obsNum,
      type: safetyIssueModalData?.color === 'red' ? 'red' : 'orange',
      text: `${obsNum}: ${subcatText}`,
      observationId: createdObs?.id,
      observationNumber: obsNum
    };
    setItemIssues(prev => ({
      ...prev,
      [itemIdx]: [...(prev[itemIdx] || []), issueTag]
    }));
    setSelections(prev => ({
      ...prev,
      [itemIdx]: safetyIssueModalData?.color || 'yellow'
    }));
  };

  const toggleComment = (idx) => {
    setActiveComments(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSave = async () => {
    if (!building) {
      alert("Please select a Location/Building.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedBuildingObj = buildingsList.find(b => String(b.build_id || b.id) === String(building));
      const bName = selectedBuildingObj?.building_name || "";

      const checklistItems = CHECKLIST_ITEMS.map((item, idx) => {
        const isOther = item.toLowerCase().includes('other');
        const effectiveName = isOther && otherCustomTexts[idx]?.trim()
          ? `20. Other - ${otherCustomTexts[idx].trim()}`
          : item;
        return {
          itemIndex: idx + 1,
          categoryName: effectiveName,
          status: selections[idx] || 'na',
          comment: comments[idx] || '',
          commentAuthor: currentUser?.name || currentUser?.username || 'Safety Inspector',
          photos: itemPhotos[idx] || [],
          issues: itemIssues[idx] || []
        };
      });

      const payload = {
        projectName: 'M3SOUTH',
        projectNo: '063205-010',
        buildingId: building ? Number(building) : undefined,
        buildingName: bName,
        floorLevel: level,
        specificLocation,
        selectedRooms,
        selectedZones,
        inspectionDate,
        performedBy: [loggedInUserName],
        participants,
        status: completed ? 'CLOSED' : 'IN_PROGRESS',
        isCompleted: completed,
        createdByUserId: currentUser?.id,
        createdByUserName: currentUser?.name || currentUser?.username || 'Safety Inspector',
        createdByRole: currentUser?.role || 'DEPARTMENT',
        checklistItems
      };

      const result = await safetyInspectionService.createInspection(payload);
      navigate("/safety-inspection/list");
    } catch (err) {
      console.error("Failed to create safety inspection:", err);
      alert(err?.response?.data?.message || "Failed to save safety inspection.");
    } finally {
      setIsSubmitting(false);
    }
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
              <input 
                type="date" 
                className="si-form-input" 
                value={inspectionDate} 
                onChange={(e) => setInspectionDate(e.target.value)} 
              />
            </div>
          </div>

          {/* Performed by */}
          <div className="si-form-group">
            <label className="si-form-label">Performed by <span className="si-req">*</span></label>
            <div className="si-input-wrap">
              <input 
                type="text" 
                className="si-form-input" 
                value={loggedInUserName} 
                readOnly 
                disabled 
                style={{ 
                  backgroundColor: "rgba(0,0,0,0.04)", 
                  cursor: "not-allowed", 
                  color: "var(--text-main, #1e293b)", 
                  fontWeight: 500 
                }} 
              />
            </div>
          </div>

          {/* Participants (Multi-Select) */}
          <div className="si-form-group">
            <label className="si-form-label">Participants <span className="si-req">*</span></label>
            <div className="si-multiselect-wrap" ref={participantsRef}>
              <div 
                className={`si-multiselect-trigger ${isParticipantsOpen ? 'active' : ''}`}
                onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
              >
                {participants.length === 0 ? (
                  <span className="si-multiselect-placeholder">Choose participants...</span>
                ) : (
                  <div className="si-multiselect-pills">
                    {participants.map((person, i) => (
                      <span key={i} className="si-pill">
                        {person}
                        <span className="si-pill-remove" onClick={(e) => removeParticipant(e, person)}>&times;</span>
                      </span>
                    ))}
                  </div>
                )}
                <i className={`ti ti-chevron-${isParticipantsOpen ? 'up' : 'down'}`} style={{ color: 'var(--text-muted, #64748b)', fontSize: '14px', flexShrink: 0 }}></i>
              </div>

              {isParticipantsOpen && (
                <div className="si-multiselect-dropdown">
                  <div className="si-multiselect-search">
                    <input 
                      type="text" 
                      placeholder="Search participant name, department..." 
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  <div className="si-multiselect-options">
                    {filteredParticipants.length === 0 ? (
                      <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No participants found
                      </div>
                    ) : (
                      filteredParticipants.map((person, i) => {
                        const isSelected = participants.includes(person);
                        return (
                          <div 
                            key={i} 
                            className={`si-multiselect-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleParticipant(person)}
                          >
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => {}} 
                            />
                            <span>{person}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="si-checklist">
          {CHECKLIST_ITEMS.map((item, idx) => {
            const selectedColor = selections[idx];
            const photosCount = itemPhotos[idx]?.length || 0;

            return (
              <React.Fragment key={idx}>
                <div className="si-check-item">
                  <div className="si-check-left">
                    {item.toLowerCase().includes('other') ? (
                      <div className="si-other-wrap">
                        <p className="si-check-label" style={{ margin: 0 }}>{item}:</p>
                        <input 
                          type="text"
                          className="si-form-input"
                          placeholder="Please fill / specify custom topic..."
                          value={otherCustomTexts[idx] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOtherCustomTexts(prev => ({ ...prev, [idx]: val }));
                          }}
                          style={{ maxWidth: '300px', height: '32px', fontSize: '13px', padding: '4px 10px' }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <p className="si-check-label">{item}</p>
                    )}

                    {itemIssues[idx] && itemIssues[idx].length > 0 && (
                      <div className="si-issues-list">
                        {itemIssues[idx].map((iss, issIdx) => (
                          <span 
                            key={issIdx} 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              backgroundColor: iss.type === 'red' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)', 
                              color: iss.type === 'red' ? '#dc2626' : '#d97706', 
                              border: `1px solid ${iss.type === 'red' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            <i className="ti ti-alert-triangle" style={{ fontSize: '13px' }}></i>
                            {iss.text || iss.id}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="si-check-right">
                    <div className="si-check-icons">
                      <div 
                        className="si-info-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenInfoIdx(openInfoIdx === idx ? null : idx);
                        }}
                      >
                        <span className={`si-icon-btn ${openInfoIdx === idx || comments[idx] || photosCount > 0 ? 'active-icon' : ''}`}>
                          <i className="ti ti-info-circle"></i>
                          {(photosCount > 0 || comments[idx]) && <span className="si-badge-dot"></span>}
                        </span>
                      </div>

                      <div className={`si-hidden-icons ${openInfoIdx === idx ? 'open' : ''}`}>
                        <div className="si-tooltip-wrap">
                          <span 
                            className={`si-icon-btn ${comments[idx] ? 'active-icon' : ''}`} 
                            onClick={(e) => { e.stopPropagation(); toggleComment(idx); }} 
                            title="Comment"
                          >
                            <i className="ti ti-message-2"></i>
                          </span>
                          <div className="si-tooltip">{comments[idx] ? 'Edit comment' : 'Comment'}</div>
                        </div>
                        
                        <div className="si-tooltip-wrap">
                          <span className="si-icon-btn" title="Good Practice" onClick={(e) => e.stopPropagation()}>
                            <i className="ti ti-medal"></i>
                          </span>
                          <div className="si-tooltip">Good practice</div>
                        </div>
                        
                        <div className="si-tooltip-wrap">
                          <span 
                            className={`si-icon-btn ${openWrenchIdx === idx ? 'active-icon' : ''}`} 
                            title="Safety Issue" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenWrenchIdx(openWrenchIdx === idx ? null : idx); 
                              setOpenPaperclipIdx(null); 
                            }}
                          >
                            <i className="ti ti-tool"></i>
                          </span>
                          <div className="si-tooltip">Safety Issue</div>
                          {openWrenchIdx === idx && (
                            <div className="si-popover-menu" style={{ minWidth: '180px' }} onClick={(e) => e.stopPropagation()}>
                              <div className="si-dropdown-item" onClick={() => {
                                const isOther = CHECKLIST_ITEMS[idx].toLowerCase().includes('other');
                                const effectiveSubject = isOther && otherCustomTexts[idx]?.trim()
                                  ? `20. Other - ${otherCustomTexts[idx].trim()}`
                                  : CHECKLIST_ITEMS[idx];
                                setSafetyIssueModalData({ subject: effectiveSubject, color: 'red', itemIndex: idx });
                                setOpenWrenchIdx(null);
                                setOpenInfoIdx(null);
                              }}>
                                <i className="ti ti-alert-triangle"></i> Safety Issue
                              </div>
                              <div className="si-dropdown-item"><i className="ti ti-link"></i> Link to existing task</div>
                            </div>
                          )}
                        </div>
                        
                        <div className="si-tooltip-wrap">
                          <span 
                            className={`si-icon-btn ${photosCount > 0 || openPaperclipIdx === idx ? 'active-icon' : ''}`} 
                            title="Attachments" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenPaperclipIdx(openPaperclipIdx === idx ? null : idx); 
                              setOpenWrenchIdx(null); 
                            }}
                          >
                            <i className="ti ti-paperclip"></i>
                            {photosCount > 0 && <span className="si-badge-count">{photosCount}</span>}
                          </span>
                          <div className="si-tooltip">Attachments</div>
                          {openPaperclipIdx === idx && (
                            <div className="si-popover-menu si-paperclip-menu" style={{ minWidth: '220px' }} onClick={(e) => e.stopPropagation()}>
                              <div className="si-dropdown-item" onClick={() => { handleFileUploadClick(idx); setOpenInfoIdx(null); }}><i className="ti ti-upload"></i> Upload from computer</div>
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
                    </div>

                    <div className="si-radio-group">
                      <button 
                        className={`si-radio-btn ${selectedColor === 'red' ? 'active red-btn' : ''}`}
                        onClick={() => handleSelect(idx, 'red')}
                        type="button"
                        title="Needs Attention / Unsafe"
                      >
                        <span className="si-dot red"></span>
                      </button>
                      <button 
                        className={`si-radio-btn ${selectedColor === 'yellow' ? 'active yellow-btn' : ''}`}
                        onClick={() => handleSelect(idx, 'yellow')}
                        type="button"
                        title="Warning / Observation"
                      >
                        <span className="si-dot yellow"></span>
                      </button>
                      <button 
                        className={`si-radio-btn ${selectedColor === 'green' ? 'active green-btn' : ''}`}
                        onClick={() => handleSelect(idx, 'green')}
                        type="button"
                        title="Good / Safe"
                      >
                        <span className="si-dot green"></span>
                      </button>
                    </div>
                  </div>
                </div>
                {activeComments[idx] && (
                  <textarea 
                    className="si-comment-box" 
                    placeholder="Write a comment or observation notes..." 
                    value={comments[idx] || ""}
                    onChange={(e) => setComments({ ...comments, [idx]: e.target.value })}
                    autoFocus
                  ></textarea>
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
            <label htmlFor="completedCheck">Closed (safety report will be available for everyone)</label>
          </div>
          <div className="si-footer-right">
            <button className="si-btn-cancel" disabled={isSubmitting} onClick={() => navigate("/safety-inspection/list")}>Cancel</button>
            <button className="si-btn-save" disabled={isSubmitting} onClick={handleSave}>
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*,.pdf" style={{ display: 'none' }} />

      <SafetyIssueModal 
        open={!!safetyIssueModalData} 
        subject={safetyIssueModalData?.subject} 
        color={safetyIssueModalData?.color}
        itemIndex={safetyIssueModalData?.itemIndex}
        initialLocation={{ building, level, specificLocation, selectedRooms, selectedZone }}
        onObservationCreated={handleObservationCreated}
        onClose={() => setSafetyIssueModalData(null)} 
      />
    </div>
  );
}
