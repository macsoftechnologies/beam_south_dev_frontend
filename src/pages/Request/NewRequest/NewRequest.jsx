import { useMemo, useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { FaSearch } from "react-icons/fa";
import "../../styles/pages.css";
import "../../../forms/styles/forms.css";
import "./NewRequest.css";
import Modal from "../../../components/common/Modal/Modal";

const AnalogTimePicker = ({ initialTime, onSave, onCancel }) => {
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [mode, setMode] = useState("hour"); // "hour" or "minute"

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
    // Outer circle (1 to 12)
    for (let h = 1; h <= 12; h++) {
      const angle = ((h * 30 - 90) * Math.PI) / 180;
      const r = radius - 25;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      const isSelected = hour === h;
      items.push(
        <div
          key={`out-${h}`}
          onClick={(e) => {
            e.stopPropagation();
            setHour(h);
            setMode("minute");
          }}
          className={`time-dial-number ${isSelected ? "selected" : ""}`}
          style={{ left: `${x}px`, top: `${y}px` }}
        >
          {h}
        </div>
      );
    }
    // Inner circle (13 to 24/00)
    for (let h = 13; h <= 24; h++) {
      const displayH = h === 24 ? 0 : h;
      const angle = (((h - 12) * 30 - 90) * Math.PI) / 180;
      const r = radius - 55;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      const isSelected = hour === displayH;
      items.push(
        <div
          key={`in-${h}`}
          onClick={(e) => {
            e.stopPropagation();
            setHour(displayH);
            setMode("minute");
          }}
          className={`time-dial-number inner ${isSelected ? "selected" : ""}`}
          style={{ left: `${x}px`, top: `${y}px` }}
        >
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
        <div
          key={m}
          onClick={(e) => {
            e.stopPropagation();
            setMinute(m);
          }}
          className={`time-dial-number ${isSelected ? "selected" : ""}`}
          style={{ left: `${x}px`, top: `${y}px` }}
        >
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
    <div
      className="timekeeper-modal-overlay"
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div className="timekeeper-modal-container custom-picker" onClick={(e) => e.stopPropagation()}>
        <div className="timekeeper-header">
          <div className="timekeeper-time-display">
            <span
              className={`timekeeper-time-unit ${mode === "hour" ? "active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setMode("hour"); }}
            >
              {String(hour).padStart(2, "0")}
            </span>
            <span className="timekeeper-time-colon">:</span>
            <span
              className={`timekeeper-time-unit ${mode === "minute" ? "active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setMode("minute"); }}
            >
              {String(minute).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="timekeeper-dial-wrapper">
          <div className="timekeeper-dial" style={{ width: `${size}px`, height: `${size}px` }}>
            <svg className="timekeeper-hand-svg" width={size} height={size}>
              <line
                x1={center}
                y1={center}
                x2={handX}
                y2={handY}
                stroke="#0ea5e9"
                strokeWidth="2"
              />
              <circle cx={center} cy={center} r="4" fill="#0ea5e9" />
              <circle cx={handX} cy={handY} r="14" fill="rgba(14, 165, 233, 0.3)" />
              <circle cx={handX} cy={handY} r="4" fill="#0ea5e9" />
            </svg>
            {mode === "hour" ? renderHourNumbers() : renderMinuteNumbers()}
          </div>
        </div>

        <div className="timekeeper-modal-actions">
          <button type="button" className="timekeeper-modal-btn" onClick={(e) => { e.stopPropagation(); onCancel(); }}>
            Cancel
          </button>
          <button type="button" className="timekeeper-modal-btn" onClick={handleSave}>
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const SearchableSingleSelect = ({ options = [], value, onChange, placeholder, disabled, className, valueKey = "id", labelKey = "subContractorName" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o[valueKey] ?? o.value ?? o.id) === String(value));
  const displayText = selectedOption ? (selectedOption[labelKey] || selectedOption.label || selectedOption.name) : placeholder;

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(o => {
      const label = o[labelKey] || o.label || o.name || "";
      return String(label).toLowerCase().includes(q);
    });
  }, [options, search, labelKey]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div
        className={`df-input ${className || ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          userSelect: "none",
          opacity: disabled ? 0.6 : 1,
          color: selectedOption ? "var(--text-main, #f9fafb)" : "var(--text-muted, #9ca3af)"
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayText}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ target: { value: "" } });
              }}
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                padding: "2px",
                fontSize: "12px"
              }}
            >
              ✕
            </button>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            width: "100%",
            maxHeight: "260px",
            backgroundColor: "var(--bg-card, #111827)",
            border: "1.5px solid var(--border-color, #374151)",
            borderRadius: "8px",
            zIndex: 99999,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          <div style={{ padding: "8px", borderBottom: "1px solid var(--border-color, #374151)", display: "flex", gap: "6px" }}>
            <input
              type="text"
              placeholder="Search contractor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{
                flex: 1,
                padding: "6px 10px",
                fontSize: "13px",
                borderRadius: "6px",
                border: "1px solid var(--border-color, #374151)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--text-main, #f9fafb)",
                outline: "none"
              }}
            />
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: "6px 10px",
                backgroundColor: "var(--primary-color, #3b82f6)",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <FaSearch size={12} />
            </button>
          </div>

          <div style={{ overflowY: "auto", maxHeight: "200px", padding: "4px 0" }}>
            <div
              onClick={() => {
                onChange({ target: { value: "" } });
                setIsOpen(false);
                setSearch("");
              }}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: "13px",
                color: "var(--text-muted, #9ca3af)",
                backgroundColor: !value ? "rgba(255,255,255,0.05)" : "transparent"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !value ? "rgba(255,255,255,0.05)" : "transparent"}
            >
              {placeholder}
            </div>

            {filteredOptions.map((o) => {
              const val = String(o[valueKey] ?? o.value ?? o.id);
              const label = o[labelKey] || o.label || o.name;
              const isSelected = String(value) === val;

              return (
                <div
                  key={val}
                  onClick={() => {
                    onChange({ target: { value: val } });
                    setIsOpen(false);
                    setSearch("");
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: isSelected ? "#00e5a0" : "var(--text-main, #f9fafb)",
                    backgroundColor: isSelected ? "rgba(0, 229, 160, 0.1)" : "transparent",
                    fontWeight: isSelected ? "600" : "normal"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isSelected ? "rgba(0, 229, 160, 0.15)" : "rgba(255, 255, 255, 0.08)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? "rgba(0, 229, 160, 0.1)" : "transparent"}
                >
                  {label}
                </div>
              );
            })}

            {filteredOptions.length === 0 && (
              <div style={{ padding: "12px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                No contractors found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import FloorDrawing from "../FloorDrawing/FloorDrawing";

import { FLOOR_PDFS } from "../../../data/pdfMapping";
import { ZONE_MAPPING } from "../../../data/zones";
import { BUILDINGS } from "../../../data/buildings";
import { getContractors, getActivities, getElectricalWorks, getMechanicalWorks, getBuildings, getFloors, getZones, getRooms, getUser, getPrecautions } from "../../../services/authService";
import { createRequest, updateRequest, addRamsFiles, deleteRamsFile, addListReqstNote, deleteListReqstNote } from "../../../services/requestService";
import { API_BASE_URL } from "../../../services/api";
import { showSuccess, showError } from "../../../components/common/Toast/Toast";
import { useNavigate, useLocation } from "react-router-dom";
import { HotWorks, ElectricalSystems, substanceChemical, WorkingAtHight, ConfinedSpace, ExcavationWorks, Craneslifting, electrical_works, mechanical1, testingequipment } from "../../../config/logos";
import { HardHat, SpecificGloves, Safetyshoes, HighVisibility, Longpants, Eyeprotection, Fallprotection, Hearingprotection, Respiratoryprotection } from "../../../config/safetyIcons";

const ELECTRICAL_WORKS_SELECT = [
  { id: "1", ElectricalWorksval: "Yes" },
  { id: "0", ElectricalWorksval: "No" }
];

const ENERGISING_EQUIPMENT_SELECT = [
  { id: "1", EnergisingEquipmentval: "Yes" },
  { id: "0", EnergisingEquipmentval: "No" }
];

const ISOLATING_LIVE_SELECT = [
  { id: "1", IsolatingLiveval: "Yes" },
  { id: "0", IsolatingLiveval: "No" }
];

const WORKING_NEAR_LIVE_SELECT = [
  { id: "1", WorkingNearLiveval: "Yes" },
  { id: "0", WorkingNearLiveval: "No" }
];

const MECHANICAL_WORKS_SELECT = [
  { id: "1", MechanicalWorksval: "Yes" },
  { id: "0", MechanicalWorksval: "No" }
];

const TESTINGS_SELECT = [
  { id: "1", TESTINGsval: "Yes" },
  { id: "0", TESTINGsval: "No" }
];

const formatDbValue = (val) => {
  if (val === undefined || val === null) return "";
  return String(val);
};

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getNextDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "";
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const dateObj = new Date(y, m, d);
  dateObj.setDate(dateObj.getDate() + 1);

  const nextY = dateObj.getFullYear();
  const nextM = String(dateObj.getMonth() + 1).padStart(2, "0");
  const nextD = String(dateObj.getDate()).padStart(2, "0");
  return `${nextY}-${nextM}-${nextD}`;
};

const mapFileItem = (f) => {
  if (!f) return null;
  if (typeof f === 'string') {
    const fileName = f.split('/').pop().split('\\').pop();
    return { id: undefined, name: fileName, file: f };
  }
  const fileId = f.id !== undefined ? f.id : (f.ramsFileId !== undefined ? f.ramsFileId : f.rams_file_id);
  const filePath = f.file || f.ramsFile || f.rams_file || f.file_name || f.name || '';
  const rawName = f.file_name || f.name || (typeof filePath === 'string' ? filePath : '') || '';
  const fileName = typeof rawName === 'string' && rawName.trim()
    ? rawName.split('/').pop().split('\\').pop()
    : 'Attachment';
  return { id: fileId, name: fileName, file: filePath };
};

const getFileUrl = (file) => {
  if (!file) return "#";
  const filePath = file.file || file.ramsFile || file.rams_file || "";
  if (typeof filePath === "string" && (filePath.startsWith("http://") || filePath.startsWith("https://"))) {
    return filePath;
  }
  const filename = file.name || (typeof filePath === "string" ? filePath.split("/").pop().split("\\").pop() : "");
  return `${API_BASE_URL}/requests/${filename}`;
};

const parseRoomToken = (token, defaultLevel = "", defaultZone = "") => {
  if (!token) return { level: defaultLevel, zone: defaultZone, roomName: "", roomId: null };
  if (typeof token === "object") {
    return {
      level: token.level || defaultLevel,
      zone: token.zone || defaultZone,
      roomName: token.name || token.room_name || token.room_nos || "",
      roomId: token.id || token.room_id || null
    };
  }
  const str = String(token);
  const parts = str.split(":::");
  if (parts.length === 3) {
    return { level: parts[0], zone: parts[1], roomName: parts[2], roomId: null };
  } else if (parts.length === 2) {
    return { level: defaultLevel, zone: parts[0], roomName: parts[1], roomId: null };
  }
  return { level: defaultLevel, zone: defaultZone, roomName: str, roomId: null };
};

function NewRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const editRequest = location.state?.editRequest;

  const [isEditMode, setIsEditMode] = useState(false);
  const [existingFiles, setExistingFiles] = useState([]);
  const [notesHistory, setNotesHistory] = useState([]);

  // Dynamic selector lists
  const [contractors, setContractors] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);
  const [electricalWorksList, setElectricalWorksList] = useState([]);
  const [mechanicalWorksList, setMechanicalWorksList] = useState([]);
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [zonesList, setZonesList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [precautionsList, setPrecautionsList] = useState([]);
  const [isLoadingSelectors, setIsLoadingSelectors] = useState(true);

  const shouldShowElectricianCert = () => {
    return formData.permit_type !== "Commissioning";
  };

  const [building, setBuilding] = useState("");
  const [level, setLevel] = useState("");
  const currentUser = useMemo(() => getUser(), []);
  const userRoles = useMemo(() => {
    const roleVal = currentUser?.role || currentUser?.userType || "";
    if (typeof roleVal === "string") {
      return roleVal.split(",").map(r => r.trim().toLowerCase());
    }
    if (Array.isArray(roleVal)) {
      return roleVal.map(r => String(r).trim().toLowerCase());
    }
    return [String(roleVal).trim().toLowerCase()];
  }, [currentUser]);
  const isSubcontractor = userRoles.includes("subcontractor");
  const isAdmin = userRoles.some(r => ["admin", "superadmin"].includes(r));
  const isDept = userRoles.includes("department");
  const isDept1 = userRoles.includes("department1");
  const isMultiDept = isDept && isDept1;
  const isDepartmentAccess = isDept || isDept1 || isMultiDept;
  const canEditOpenedPermit = isAdmin || isDepartmentAccess;
  const isReadOnly = isEditMode && (editRequest?.Request_status === "Opened" || editRequest?.request_status === "Opened") && !canEditOpenedPermit;
  const canDeleteNotes = userRoles.some(r => ["admin", "superadmin", "department", "department1"].includes(r));
  const [isnewrequestcreated, setIsnewrequestcreated] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isElectricalDropdownOpen, setIsElectricalDropdownOpen] = useState(false);
  const [isMechanicalDropdownOpen, setIsMechanicalDropdownOpen] = useState(false);
  const [isPrecautionsDropdownOpen, setIsPrecautionsDropdownOpen] = useState(false);
  const [eleSearch, setEleSearch] = useState("");
  const [mechSearch, setMechSearch] = useState("");
  const [electricalCategory, setElectricalCategory] = useState("");
  const [isFetchingEle, setIsFetchingEle] = useState(false);
  const [isFetchingMech, setIsFetchingMech] = useState(false);
  const electricalWorksNamesCache = useRef({});
  const mechanicalWorksNamesCache = useRef({});

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showNewEndPicker, setShowNewEndPicker] = useState(false);
  const [showRamsHoldModal, setShowRamsHoldModal] = useState(false);
  const [isSubmittingPermit, setIsSubmittingPermit] = useState(false);
  const [tempStartTime, setTempStartTime] = useState("");
  const [tempEndTime, setTempEndTime] = useState("");
  const [tempNewEndTime, setTempNewEndTime] = useState("");
  const fileInputRef = useRef(null);
  const roomsDropdownRef = useRef(null);
  const electricalDropdownRef = useRef(null);
  const mechanicalDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (roomsDropdownRef.current && !roomsDropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (electricalDropdownRef.current && !electricalDropdownRef.current.contains(event.target)) {
        setIsElectricalDropdownOpen(false);
      }
      if (mechanicalDropdownRef.current && !mechanicalDropdownRef.current.contains(event.target)) {
        setIsMechanicalDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const precautionsDropdownRef = useRef(null);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (isEditMode) {
        // Upload immediately in edit mode
        const fd = new FormData();
        fd.append("id", editRequest.id);
        const currentUser = getUser();
        fd.append("userId", currentUser?.id || 1);
        newFiles.forEach((file) => {
          fd.append("rams_file[]", file);
        });

        try {
          const res = await addRamsFiles(fd);
          showSuccess("RAMS File uploaded successfully");
          if (res?.files) {
            setExistingFiles(res.files.map(mapFileItem).filter(Boolean));
          }
        } catch (err) {
          showError("Failed to upload file attachment.");
        }
      } else {
        // In creation mode, store locally
        setUploadedFiles((prev) => [...prev, ...newFiles]);
      }
    }
  };

  const handleRemoveFile = async (index, fileId) => {
    if (isEditMode && fileId) {
      try {
        await deleteRamsFile(fileId);
        showSuccess("RAMS File deleted successfully");
        setExistingFiles((prev) => prev.filter((_, idx) => idx !== index));
      } catch (err) {
        showError("Failed to delete file attachment.");
      }
    } else {
      setUploadedFiles((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const [formData, setFormData] = useState({
    Request_Date: new Date().toLocaleDateString("en-GB"),
    Company_Name: "M3 South",
    Sub_Contractor_Id: "",
    new_sub_contractor: "",
    Foreman: "",
    Foreman_Phone_Number: "",
    Activity: "",
    Type_Of_Activity_Id: "",
    rams_number: "",
    permit_type: "",
    description_of_activity: "",
    Working_Date: "",
    Start_Time: "",
    End_Time: "",
    night_shift: false,
    new_date: "none",
    new_end_time: "none",
    Site_Id: "5",
    Tools: "",
    Machinery: "",
    work_type: "",
    electrical_works: [],
    mechanical_works: [],
    Safety_Precautions: [],
    // General Safety Questions (Yes=1, No=0, N/A=2)
    floatLabel11: "",
    floatLabel12: "",
    other_conditions_input: "",
    floatLabel13: "",
    floatLabel14: "",
    floatLabel15: "",
    floatLabel16: "",
    // Hot Work Section
    Hot_work: "0",
    low_risk_hotwork: "",
    high_risk_hotwork: "",
    hot_work_checklist_filled: "",
    fire_guard_present: "",
    h_heat_source: "",
    h_workplace_check: "",
    h_fire_detectors: "",
    h_start_time: "",
    h_end_time: "",
    floatLabel1: "",
    floatLabel3: "",
    floatLabel4: "",
    floatLabel5: "",
    floatLabel6: "",
    floatLabel7: "",
    floatLabel8: "",
    floatLabel9: "",
    floatLabel10: "",
    NEWHOTWORK: "0",
    NEWHOTWORK1: "",
    NEWHOTWORK2: "",
    // Temporary Electrical Systems
    working_on_electrical_system: "0",
    floatLabel17: "",
    floatLabel18: "",
    floatLabel19: "",
    floatLabel20: "",
    floatLabel22: "",
    // Hazardous Substances
    working_hazardious_substen: "0",
    floatLabel24: "",
    floatLabel25: "",
    floatLabel26: "",
    floatLabel27: "",
    floatLabel28: "",
    floatLabel29: "",
    floatLabel30: "",
    floatLabel31: "",
    // Working at Height
    working_at_height: "0",
    segragated_demarkated: "",
    floatLabel39: "",
    floatLabel40: "",
    floatLabel41: "",
    floatLabel42: "",
    floatLabel43: "",
    floatLabel44: "",
    floatLabel45: "",
    floatLabel46: "",
    floatLabel47: "",
    floatLabel48: "",
    floatLabel49: "",
    floatLabel50: "",
    // Working in Confined Spaces
    working_confined_spaces: "0",
    floatLabel51: "",
    floatLabel52: "",
    floatLabel53: "",
    floatLabel54: "",
    floatLabel55: "",
    floatLabel56: "",
    floatLabel57: "",
    floatLabel58: "",
    // Excavation Works
    excavation_works: "0",
    floatLabel71: "",
    floatLabel72: "",
    excavation_shoring: "",
    floatLabel74: "",
    floatLabel75: "",
    floatLabel76: "",
    floatLabel77: "",
    floatLabel78: "",
    floatLabel79: "",
    // Using Crane or Lifting
    using_cranes_or_lifting: "0",
    floatLabel80: "",
    floatLabel81: "",
    floatLabel82: "",
    floatLabel83: "",
    floatLabel84: "",
    floatLabel85: "",
    floatLabel86: "",
    floatLabel87: "",
    // pressurization Power On fields
    power_on: "0",
    EnergisingEquipment: "0",
    IsolatingLive: "0",
    WorkingNearLive: "0",
    floatLabel88: "",
    floatLabel89: "",
    floatLabel90: "",
    floatLabel110: "",
    floatLabel91: "",
    floatLabel92: "",
    floatLabel93: "",
    floatLabel94: "",
    floatLabel111: "",
    floatLabel112: "",
    floatLabel113: "",
    floatLabel114: "",
    floatLabel115: "",
    floatLabel116: "",
    floatLabel117: "",
    floatLabel118: "",
    floatLabel119: "",
    floatLabel120: "",
    floatLabel121: "",
    floatLabel122: "",
    floatLabel123: "",
    floatLabel124: "",
    floatLabel125: "",
    floatLabel126: "",
    floatLabel127: "",
    // pressurization fields
    pressurization: "0",
    floatLabel95: "",
    floatLabel96: "",
    floatLabel97: "",
    mc_number_text: "",
    floatLabel98: "",
    floatLabel99: "",
    floatLabel100: "",
    floatLabel101: "",
    // Pressure Testing
    pressure_testing_of_equipment: "0",
    floatLabel102: "",
    floatLabel103: "",
    floatLabel104: "",
    floatLabel105: "",
    floatLabel106: "",
    floatLabel107: "",
    pressure_pneumatic: "",
    floatLabel108: "",
    pressure_hydrostatic: "",
    floatLabel109: "",
    // Task Specific PPE
    eye_protection: "",
    fall_protection: "",
    hearing_protection: "",
    respiratory_protection: "",
    other_ppe: "",
    Number_Of_Workers: "",
    notes: "",
  });

  // Fetch all select lists and location data from backend
  useEffect(() => {
    const loadSelectors = async () => {
      try {
        const [
          contractorsRes,
          activitiesRes,
          electricalRes,
          mechanicalRes,
          buildingsRes,
          floorsRes,
          zonesRes,
          roomsRes,
          precautionsRes
        ] = await Promise.all([
          getContractors(1, 1000),
          getActivities(1, 1000),
          getElectricalWorks(1, 1000),
          getMechanicalWorks(1, 1000),
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getZones(1, 1000),
          getRooms(1, 20000),
          getPrecautions(1, 1000)
        ]);

        const rawContractors = contractorsRes?.data?.rows ?? contractorsRes?.data ?? contractorsRes ?? [];
        const loadedContractors = rawContractors
          .slice()
          .sort((a, b) => (a.subContractorName || "").localeCompare(b.subContractorName || "", undefined, { sensitivity: "base" }));
        setContractors(loadedContractors);
        if (isSubcontractor && loadedContractors.length > 0) {
          setFormData(prev => ({
            ...prev,
            Sub_Contractor_Id: String(loadedContractors[0].id)
          }));
        }
        setActivitiesList(activitiesRes?.data?.rows ?? activitiesRes?.data ?? activitiesRes ?? []);
        setElectricalWorksList(electricalRes?.data ?? []);
        setMechanicalWorksList(mechanicalRes?.data ?? []);
        setBuildingsList(buildingsRes?.data ?? []);
        setFloorsList(floorsRes?.data ?? []);
        setZonesList(zonesRes?.data ?? []);
        setRoomsList(roomsRes?.data?.rows ?? roomsRes?.data ?? roomsRes ?? []);
        setPrecautionsList(precautionsRes?.data?.rows ?? precautionsRes?.data ?? precautionsRes ?? []);
      } catch (err) {
        console.error("Failed to load request form selector data", err);
        showError("Failed to load selector databases.");
      } finally {
        setIsLoadingSelectors(false);
      }
    };
    loadSelectors();
  }, []);

  // Cache electrical and mechanical works names to persist them during filtering
  useEffect(() => {
    electricalWorksList.forEach(x => {
      if (x.id) {
        electricalWorksNamesCache.current[String(x.id)] = x.electrical_works;
      }
    });
  }, [electricalWorksList]);

  useEffect(() => {
    mechanicalWorksList.forEach(x => {
      if (x.id) {
        mechanicalWorksNamesCache.current[String(x.id)] = x.mechanical_works || x.name;
      }
    });
  }, [mechanicalWorksList]);

  // Fetch electrical works dynamically on search or category select
  useEffect(() => {
    if (formData.work_type !== "Electrical Works") return;
    const delayDebounce = setTimeout(async () => {
      setIsFetchingEle(true);
      try {
        const res = await getElectricalWorks(1, 1000, eleSearch, electricalCategory);
        setElectricalWorksList(res?.data ?? []);
      } catch (err) {
        console.error("Error fetching electrical works:", err);
      } finally {
        setIsFetchingEle(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [electricalCategory, eleSearch, formData.work_type]);

  // Fetch mechanical works dynamically on search
  useEffect(() => {
    if (formData.work_type !== "Mechanical Works") return;
    const delayDebounce = setTimeout(async () => {
      setIsFetchingMech(true);
      try {
        const res = await getMechanicalWorks(1, 1000, mechSearch);
        setMechanicalWorksList(res?.data ?? []);
      } catch (err) {
        console.error("Error fetching mechanical works:", err);
      } finally {
        setIsFetchingMech(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [mechSearch, formData.work_type]);

  // Handle click outside for precautions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (precautionsDropdownRef.current && !precautionsDropdownRef.current.contains(event.target)) {
        setIsPrecautionsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Default subcontractor id if current user is a contractor
  useEffect(() => {
    if (isSubcontractor && currentUser?.typeId) {
      setFormData(prev => ({
        ...prev,
        Sub_Contractor_Id: String(currentUser.typeId)
      }));
    }
  }, [isSubcontractor, currentUser]);

  // Bind edit request data once selectors have finished loading
  useEffect(() => {
    if (!isLoadingSelectors && editRequest) {
      setIsEditMode(true);
      setBuilding(String(editRequest.Building_Id || ""));
      setLevel(editRequest.Room_Type || "");

      // Match room IDs to room names to render correctly in FloorDrawing.
      // Also normalise casing: DB may store "ZONE 1" but ZONE_MAPPING uses "Zone 1".
      if (editRequest.Room_Nos) {
        const editRoomParts = String(editRequest.Room_Nos).split(",").map(x => x.trim()).filter(Boolean);
        let matchedTokens = [];
        const editBuildingId = editRequest.Building_Id || editRequest.building_id;
        const editLevelStr = editRequest.Room_Type || "";

        const rawZoneIds = String(editRequest.Zone_Id || editRequest.zone_id || "").split(",").map(x => x.trim()).filter(Boolean);
        const rawZoneNames = String(editRequest.zone_name || editRequest.zone || "").split(",").map(x => x.trim()).filter(Boolean);

        editRoomParts.forEach(rStr => {
          if (rStr.includes(":::")) {
            matchedTokens.push(rStr);
            return;
          }
          const cleanName = rStr.toLowerCase().trim();

          const candidateRooms = roomsList.filter(r => {
            const isMatch = String(r.room_id ?? r.id) === rStr || (r.room_name || r.name || r.room_nos || "").toLowerCase().trim() === cleanName;
            if (!isMatch) return false;
            if (editBuildingId && String(r.building_id) !== String(editBuildingId)) return false;
            return true;
          });

          let foundRoom = candidateRooms.find(r => {
            if (rawZoneIds.length > 0 && rawZoneIds.includes(String(r.zone_id))) return true;
            const zObj = zonesList.find(z => String(z.id ?? z.zoneStatusId) === String(r.zone_id));
            if (zObj && rawZoneNames.length > 0) {
              const zName = (zObj.zone || zObj.zone_name || zObj.name || "").toLowerCase().trim();
              return rawZoneNames.some(pName => pName.toLowerCase().trim() === zName);
            }
            return false;
          }) || candidateRooms[0];

          if (foundRoom) {
            const dbFloor = floorsList.find(f => String(f.fl_id ?? f.id ?? f.floor_id) === String(foundRoom.fl_id || foundRoom.floor_id));
            const floorName = dbFloor ? (dbFloor.floor_name || dbFloor.name) : "";

            const dbZone = zonesList.find(z => String(z.id ?? z.zoneStatusId) === String(foundRoom.zone_id));
            const zoneName = dbZone ? (dbZone.zone || dbZone.zone_name) : "";

            const roomName = foundRoom.room_name || foundRoom.name || foundRoom.room_nos || rStr;

            if (floorName && zoneName) {
              matchedTokens.push(`${floorName}:::${zoneName}:::${roomName}`);
              return;
            }
          }

          let matchedFloorName = "";
          let matchedZoneName = "";

          for (const zObj of zonesList) {
            const zName = zObj.zone || zObj.zone_name || zObj.name || "";
            const fId = zObj.floor_id || zObj.fl_id || zObj.floorId;
            const dbFloor = floorsList.find(f => String(f.fl_id ?? f.id ?? f.floor_id) === String(fId));
            const fName = dbFloor ? (dbFloor.floor_name || dbFloor.name) : "";

            if (zName && cleanName.includes(zName.toLowerCase().trim())) {
              matchedFloorName = fName;
              matchedZoneName = zName;
              break;
            }
          }

          if (!matchedFloorName) {
            const matchedFloor = floorsList.find(f => {
              const fName = String(f.floor_name || f.name || f.floor || "").toLowerCase().trim();
              return fName && (cleanName.startsWith(fName) || cleanName.includes(fName));
            });
            if (matchedFloor) {
              matchedFloorName = String(matchedFloor.floor_name || matchedFloor.name || matchedFloor.floor).trim();
            }
          }

          const finalLevel = matchedFloorName || (editLevelStr ? editLevelStr.split(",")[0].trim() : level);
          const finalZone = matchedZoneName || (editRequest.zone_name || editRequest.zone || "Zone 1").split(",")[0].trim();

          matchedTokens.push(`${finalLevel}:::${finalZone}:::${rStr}`);
        });

        setSelectedRooms(Array.from(new Set(matchedTokens)));

        if (editLevelStr) {
          setLevel(editLevelStr);
        }

        // Auto-set selectedZone by matching zone_name from the fetched request
        // against the zone entries for the selected level in ZONE_MAPPING
        const levelKey = editRequest.Room_Type || "";
        let zonesForLevel = ZONE_MAPPING[levelKey] || [];
        if (zonesForLevel.length === 0) {
          // Try case-insensitive level key match
          const levelLower = levelKey.toLowerCase().trim();
          const foundKey = Object.keys(ZONE_MAPPING).find(k =>
            k.toLowerCase().trim().includes(levelLower) || levelLower.includes(k.toLowerCase().trim())
          );
          if (foundKey) zonesForLevel = ZONE_MAPPING[foundKey];
        }

        if (zonesForLevel.length > 0) {
          // Resolve zone_name from the fetched request
          const dbZoneName =
            editRequest.zone_name ||
            (editRequest.zone && typeof editRequest.zone === "object"
              ? editRequest.zone.zone
              : editRequest.zone) ||
            "";

          if (dbZoneName) {
            // Search across zone groups for a matching zone object
            let matchedZoneObj = null;
            outer: for (const zoneGroup of zonesForLevel) {
              for (const room of zoneGroup.rooms) {
                const roomName = typeof room === "object" ? room.name : room;
                if (
                  roomName.toLowerCase().trim() === dbZoneName.toLowerCase().trim()
                ) {
                  matchedZoneObj = zoneGroup;
                  break outer;
                }
              }
              // Also check if the zone group name itself matches
              if (
                zoneGroup.name &&
                zoneGroup.name.toLowerCase().trim() === dbZoneName.toLowerCase().trim()
              ) {
                matchedZoneObj = zoneGroup;
                break;
              }
            }
            if (matchedZoneObj) setSelectedZone(matchedZoneObj);
          } else if (matchedNames.length > 0) {
            // Fallback: find zone group that contains any of the matched rooms
            const matchedNamesLower = matchedNames.map(n => n.toLowerCase().trim());
            const fallbackZone = zonesForLevel.find(zg =>
              zg.rooms.some(r => {
                const rName = typeof r === "object" ? r.name : r;
                return matchedNamesLower.includes(rName.toLowerCase().trim());
              })
            );
            if (fallbackZone) setSelectedZone(fallbackZone);
          }
        }
      } // end if (editRequest.Room_Nos)

      // Display existing file attachments
      const rawFilesList = editRequest.files || editRequest.ramsFiles || editRequest.rams_files || editRequest.rams_file;
      if (rawFilesList && Array.isArray(rawFilesList)) {
        setExistingFiles(rawFilesList.map(mapFileItem).filter(Boolean));
      }

      // Load notes history
      if (editRequest.note) {
        setNotesHistory(editRequest.note.map(n => ({ id: n.id, Note: n.note, Username: n.username })));
      } else if (editRequest.notes) {
        setNotesHistory(Array.isArray(editRequest.notes) ? editRequest.notes : []);
      }

      setIsnewrequestcreated(true);
      // Bind all fields into formData
      setFormData({
        Request_Date: editRequest.Request_Date || new Date().toLocaleDateString("en-GB"),
        Company_Name: editRequest.Company_Name || "M3 South",
        Sub_Contractor_Id: editRequest.Sub_Contractor_Id || "",
        new_sub_contractor: editRequest.new_sub_contractor || "",
        Foreman: editRequest.Foreman || "",
        Foreman_Phone_Number: editRequest.Foreman_Phone_Number || "",
        Activity: editRequest.Activity || "",
        Type_Of_Activity_Id: editRequest.Type_Of_Activity_Id || "",
        rams_number: editRequest.rams_number || "",
        permit_type: editRequest.permit_type || "",
        description_of_activity: editRequest.description_of_activity || "",
        Working_Date: editRequest.Working_Date || "",
        Start_Time: editRequest.Start_Time ? editRequest.Start_Time.slice(0, 5) : "",
        End_Time: editRequest.End_Time ? editRequest.End_Time.slice(0, 5) : "",
        night_shift: editRequest.night_shift === 1 || editRequest.night_shift === true || editRequest.night_shift === "1",
        new_date: (editRequest.night_shift === 1 || editRequest.night_shift === true || editRequest.night_shift === "1")
          ? (editRequest.new_date && editRequest.new_date !== "none" ? editRequest.new_date : "")
          : "none",
        new_end_time: (editRequest.night_shift === 1 || editRequest.night_shift === true || editRequest.night_shift === "1")
          ? (editRequest.new_end_time && editRequest.new_end_time !== "none" ? editRequest.new_end_time.slice(0, 5) : "")
          : "none",
        Site_Id: editRequest.Site_Id || "5",
        Tools: editRequest.Tools || "",
        Machinery: editRequest.Machinery || "",
        work_type: editRequest.work_type || "",
        electrical_works: editRequest.electrical_works ? String(editRequest.electrical_works).split(",").map(x => x.trim()) : [],
        mechanical_works: editRequest.mechanical_works ? String(editRequest.mechanical_works).split(",").map(x => x.trim()) : [],
        Safety_Precautions: (editRequest.Safety_Precautions || editRequest.safetyPrecautions)
          ? String(editRequest.Safety_Precautions || editRequest.safetyPrecautions).split(",").map(x => x.trim())
          : [],

        // General Safety Questions
        floatLabel11: formatDbValue(editRequest.affecting_other_contractors),
        floatLabel12: formatDbValue(editRequest.other_conditions),
        other_conditions_input: editRequest.other_conditions_input || "",
        floatLabel13: formatDbValue(editRequest.lighting_begin_work),
        floatLabel14: formatDbValue(editRequest.specific_risks),
        floatLabel15: formatDbValue(editRequest.environment_ensured),
        floatLabel16: formatDbValue(editRequest.course_of_action),

        // Hot Work
        Hot_work: formatDbValue(editRequest.Hot_work ?? "0"),
        low_risk_hotwork: formatDbValue(editRequest.low_risk_hotwork ?? editRequest.lowRiskHotwork ?? editRequest.fireHotwork?.low_risk_hotwork ?? editRequest.fireHotwork?.lowRiskHotwork),
        high_risk_hotwork: formatDbValue(editRequest.high_risk_hotwork ?? editRequest.highRiskHotwork ?? editRequest.fireHotwork?.high_risk_hotwork ?? editRequest.fireHotwork?.highRiskHotwork),
        hot_work_checklist_filled: formatDbValue(editRequest.hot_work_checklist_filled ?? editRequest.hotWorkChecklistFilled ?? editRequest.fireHotwork?.hot_work_checklist_filled ?? editRequest.fireHotwork?.hotWorkChecklistFilled),
        fire_guard_present: formatDbValue(editRequest.fire_guard_present ?? editRequest.fireGuardPresent ?? editRequest.fireHotwork?.fire_guard_present ?? editRequest.fireHotwork?.fireGuardPresent),
        h_heat_source: formatDbValue(editRequest.h_heat_source ?? editRequest.hHeatSource ?? editRequest.fireHotwork?.h_heat_source ?? editRequest.fireHotwork?.hHeatSource),
        h_workplace_check: formatDbValue(editRequest.h_workplace_check ?? editRequest.hWorkplaceCheck ?? editRequest.fireHotwork?.h_workplace_check ?? editRequest.fireHotwork?.hWorkplaceCheck),
        h_fire_detectors: formatDbValue(editRequest.h_fire_detectors ?? editRequest.hFireDetectors ?? editRequest.fireHotwork?.h_fire_detectors ?? editRequest.fireHotwork?.hFireDetectors),
        h_start_time: editRequest.h_start_time ?? editRequest.hStartTime ?? editRequest.fireHotwork?.h_start_time ?? editRequest.fireHotwork?.hStartTime ?? "",
        h_end_time: editRequest.h_end_time ?? editRequest.hEndTime ?? editRequest.fireHotwork?.h_end_time ?? editRequest.fireHotwork?.hEndTime ?? "",
        floatLabel1: formatDbValue(editRequest.tasks_in_progress_in_the_area),
        floatLabel3: formatDbValue(editRequest.lighting_sufficiently),
        floatLabel4: formatDbValue(editRequest.specific_risks_based_on_task),
        floatLabel5: formatDbValue(editRequest.work_environment_safety_ensured),
        floatLabel6: formatDbValue(editRequest.course_of_action_in_emergencies),
        floatLabel7: formatDbValue(editRequest.fire_watch_establish),
        floatLabel8: formatDbValue(editRequest.combustible_material),
        floatLabel9: formatDbValue(editRequest.safety_measures),
        floatLabel10: formatDbValue(editRequest.extinguishers_and_fire_blanket),
        NEWHOTWORK: formatDbValue(editRequest.welding_activity ?? editRequest.welding_activitiy ?? "0"),
        NEWHOTWORK1: formatDbValue(editRequest.heat_treatment),
        NEWHOTWORK2: formatDbValue(editRequest.air_extraction_be_established),

        // Temporary Electrical Systems
        working_on_electrical_system: formatDbValue(editRequest.working_on_electrical_system ?? "0"),
        floatLabel17: formatDbValue(editRequest.responsible_for_the_informed),
        floatLabel18: formatDbValue(editRequest.de_energized),
        floatLabel19: formatDbValue(editRequest.if_not_loto ?? editRequest.if_no_loto),
        floatLabel20: formatDbValue(editRequest.do_risk_assessment),
        floatLabel22: formatDbValue(editRequest.electricity_have_isulation),

        // Hazardous Substances
        working_hazardious_substen: formatDbValue(editRequest.working_hazardious_substen ?? "0"),
        floatLabel24: formatDbValue(editRequest.relevant_mal),
        floatLabel25: formatDbValue(editRequest.msds),
        floatLabel26: formatDbValue(editRequest.equipment_taken_account),
        floatLabel27: formatDbValue(editRequest.ventilation),
        floatLabel28: formatDbValue(editRequest.hazardous_substances ?? editRequest.hazardaus_substances),
        floatLabel29: formatDbValue(editRequest.storage_and_disposal),
        floatLabel30: formatDbValue(editRequest.reachable_case),
        floatLabel31: formatDbValue(editRequest.checical_risk_assessment),

        // Working at Height
        working_at_height: formatDbValue(editRequest.working_at_height ?? "0"),
        segragated_demarkated: formatDbValue(editRequest.segragated_demarkated),
        floatLabel39: formatDbValue(editRequest.lanyard_attachments),
        floatLabel40: formatDbValue(editRequest.rescue_plan),
        floatLabel41: formatDbValue(editRequest.avoid_hazards),
        floatLabel42: formatDbValue(editRequest.height_training ?? "0"),
        floatLabel43: formatDbValue(editRequest.supervision),
        floatLabel44: formatDbValue(editRequest.shock_absorbing),
        floatLabel45: formatDbValue(editRequest.height_equipments),
        floatLabel46: formatDbValue(editRequest.vertical_life),
        floatLabel47: formatDbValue(editRequest.secured_falling),
        floatLabel48: formatDbValue(editRequest.dropped_objects),
        floatLabel49: formatDbValue(editRequest.safe_acces),
        floatLabel50: formatDbValue(editRequest.weather_acceptable),

        // Working in Confined Spaces
        working_confined_spaces: formatDbValue(editRequest.working_confined_spaces ?? "0"),
        floatLabel51: formatDbValue(editRequest.vapours_gases),
        floatLabel52: formatDbValue(editRequest.lel_measurement),
        floatLabel53: formatDbValue(editRequest.all_equipment),
        floatLabel54: formatDbValue(editRequest.exit_conditions),
        floatLabel55: formatDbValue(editRequest.communication_emergency),
        floatLabel56: formatDbValue(editRequest.rescue_equipments),
        floatLabel57: formatDbValue(editRequest.space_ventilation),
        floatLabel58: formatDbValue(editRequest.oxygen_meter),

        // Excavation Works
        excavation_works: formatDbValue(editRequest.excavation_works ?? "0"),
        floatLabel71: formatDbValue(editRequest.excavation_segregated),
        floatLabel72: formatDbValue(editRequest.nn_standards),
        excavation_shoring: formatDbValue(editRequest.excavation_shoring),
        floatLabel74: formatDbValue(editRequest.danish_regulation),
        floatLabel75: formatDbValue(editRequest.safe_access_and_egress),
        floatLabel76: formatDbValue(editRequest.correctly_sloped),
        floatLabel77: formatDbValue(editRequest.inspection_dates),
        floatLabel78: formatDbValue(editRequest.marked_drawings),
        floatLabel79: formatDbValue(editRequest.underground_areas_cleared),

        // Using Crane or Lifting
        using_cranes_or_lifting: formatDbValue(editRequest.using_cranes_or_lifting ?? "0"),
        floatLabel80: formatDbValue(editRequest.appointed_person),
        floatLabel81: formatDbValue(editRequest.vendor_supplies ?? editRequest.vendor_supplier ?? "0"),
        floatLabel82: formatDbValue(editRequest.lift_plan),
        floatLabel83: formatDbValue(editRequest.supplied_and_inspected),
        floatLabel84: formatDbValue(editRequest.legal_required_certificates),
        floatLabel85: formatDbValue(editRequest.prapared_lifting),
        floatLabel86: formatDbValue(editRequest.lifting_task_fenced),
        floatLabel87: formatDbValue(editRequest.overhead_risks),

        // pressurization Power On fields
        power_on: formatDbValue(editRequest.power_on ?? "0"),
        EnergisingEquipment: formatDbValue(editRequest.energising_equipment ?? "0"),
        IsolatingLive: formatDbValue(editRequest.isolating_live ?? "0"),
        WorkingNearLive: formatDbValue(editRequest.working_near_live ?? "0"),
        floatLabel88: formatDbValue(editRequest.responsible_for_the_area),
        floatLabel89: formatDbValue(editRequest.risk_assessment_done),
        floatLabel90: formatDbValue(editRequest.barriers_signage),
        floatLabel110: formatDbValue(editRequest.arc_flash ?? "0"),
        floatLabel91: formatDbValue(editRequest.energized_been_tested),
        floatLabel92: formatDbValue(editRequest.punches_been_closed),
        floatLabel93: formatDbValue(editRequest.toct_checklist),
        floatLabel94: formatDbValue(editRequest.informed_aligned),
        floatLabel111: formatDbValue(editRequest.isolating_resposible),
        floatLabel112: formatDbValue(editRequest.isolating_risk_assessment),
        floatLabel113: formatDbValue(editRequest.cq_informed),
        floatLabel114: formatDbValue(editRequest.cq_provided),
        floatLabel115: formatDbValue(editRequest.de_energisation_request),
        floatLabel116: formatDbValue(editRequest.ppe_prepared),
        floatLabel117: formatDbValue(editRequest.absence_of_voltage),
        floatLabel118: formatDbValue(editRequest.stored_energy),
        floatLabel119: formatDbValue(editRequest.backup_power),
        floatLabel120: formatDbValue(editRequest.unavoidable),
        floatLabel121: formatDbValue(editRequest.reasonably_practicable),
        floatLabel122: formatDbValue(editRequest.work_authorised),
        floatLabel123: formatDbValue(editRequest.working_risk_assessment),
        floatLabel124: formatDbValue(editRequest.working_arc_boundary),
        floatLabel125: formatDbValue(editRequest.working_barriers),
        floatLabel126: formatDbValue(editRequest.insulated_tools),
        floatLabel127: formatDbValue(editRequest.event_of_emergency),

        // pressurization fields
        pressurization: formatDbValue(editRequest.pressurization ?? "0"),
        floatLabel95: formatDbValue(editRequest.performed_approved),
        floatLabel96: formatDbValue(editRequest.flushing_approved),
        floatLabel97: formatDbValue(editRequest.mc_approved),
        mc_number_text: editRequest.mc_number_text || "",
        floatLabel98: formatDbValue(editRequest.visual_inspection),
        floatLabel99: formatDbValue(editRequest.loto_plan_approved),
        floatLabel100: formatDbValue(editRequest.follow_media_code),
        floatLabel101: formatDbValue(editRequest.cq_safety_signs),

        // Pressure Testing
        pressure_testing_of_equipment: formatDbValue(editRequest.pressure_testing_of_equipment ?? "0"),
        floatLabel102: formatDbValue(editRequest.line_walk),
        floatLabel103: formatDbValue(editRequest.pressure_test_coordinated),
        floatLabel104: formatDbValue(editRequest.pipework_mic),
        floatLabel105: formatDbValue(editRequest.loto_plan_attached),
        floatLabel106: formatDbValue(editRequest.exclusion_zone_calculated),
        floatLabel107: formatDbValue(editRequest.pneumatic_hydrostatic ?? editRequest.pnematic_hydrostatic ?? "0"),
        pressure_pneumatic: editRequest.pressure_pneumatic || "",
        floatLabel108: formatDbValue(editRequest.pressure_of_the_test),
        pressure_hydrostatic: editRequest.pressure_hydrostatic || "",
        floatLabel109: formatDbValue(editRequest.safety_valves_calibrated),

        // Task Specific PPE
        eye_protection: formatDbValue(editRequest.eye_protection),
        fall_protection: formatDbValue(editRequest.fall_protection),
        hearing_protection: formatDbValue(editRequest.hearing_protection),
        respiratory_protection: formatDbValue(editRequest.respiratory_protection),
        other_ppe: editRequest.other_ppe || "",
        Number_Of_Workers: editRequest.Number_Of_Workers || "",
        notes: "",
      });

      setIsnewrequestcreated(true);
    }
  }, [isLoadingSelectors, editRequest, roomsList.length, zonesList.length, floorsList.length]);

  const levels = useMemo(() => {
    return building ? floorsList.filter(f => String(f.build_id) === String(building)).map(f => f.floor_name).slice().reverse() : [];
  }, [building, floorsList]);

  const selectedBuildingName = useMemo(() => {
    const b = buildingsList.find((x) => String(x.build_id) === String(building));
    return b ? b.building_name : "";
  }, [building, buildingsList]);

  const selectedPdf = useMemo(() => {
    if (!building) return "";
    if (!building || !level) return "";
    // Find the building name from buildingList using building (which is database build_id)
    const dbBuilding = buildingsList.find(b => String(b.build_id || b.id) === String(building));
    const bName = dbBuilding ? dbBuilding.building_name : "";
    if (!bName) return "";

    // Map building_name to static building ID
    const staticB = BUILDINGS.find(item => item.name.toLowerCase().trim() === bName.toLowerCase().trim());
    const staticBuildingId = staticB ? staticB.id : "";
    if (!staticBuildingId) return "";

    const pdfsForBuilding = FLOOR_PDFS[staticBuildingId];
    if (!pdfsForBuilding) return "";

    // 1. Try exact match
    if (pdfsForBuilding[level]) return pdfsForBuilding[level];

    // 2. Try case-insensitive substring match
    const levelLower = level.toLowerCase().trim();
    const foundKey = Object.keys(pdfsForBuilding).find(key => {
      const keyLower = key.toLowerCase().trim();
      return keyLower.includes(levelLower) || levelLower.includes(keyLower);
    });
    if (foundKey) return pdfsForBuilding[foundKey];

    // 3. Fallback to first available PDF for that building
    return Object.values(pdfsForBuilding)[0] || "";
  }, [building, level, buildingsList]);

  const getZonesForLevel = (lName) => {
    if (!lName) return [];
    const bName = (selectedBuildingName || "").trim();
    const lClean = lName.trim();
    const lLower = lClean.toLowerCase();
    const bLower = bName.toLowerCase();

    if (ZONE_MAPPING[lClean]) return ZONE_MAPPING[lClean];
    if (bName && ZONE_MAPPING[`${bName} ${lClean}`]) return ZONE_MAPPING[`${bName} ${lClean}`];
    if (bName && ZONE_MAPPING[`${bName}.${lClean}`]) return ZONE_MAPPING[`${bName}.${lClean}`];

    const allKeys = Object.keys(ZONE_MAPPING);
    if (bName) {
      const buildingKeys = allKeys.filter(k => {
        const kLower = k.toLowerCase();
        return kLower.startsWith(bLower) || kLower.includes(bLower);
      });

      if (buildingKeys.length > 0) {
        const levelMatch = buildingKeys.find(k => {
          const rest = k.toLowerCase().replace(bLower, "").trim();
          return rest === lLower || rest.includes(lLower) || lLower.includes(rest);
        });
        if (levelMatch) return ZONE_MAPPING[levelMatch];

        const lNum = lLower.replace(/[^0-9r]/g, "");
        if (lNum) {
          const numMatch = buildingKeys.find(k => {
            const rest = k.toLowerCase().replace(bLower, "").trim();
            const kNum = rest.replace(/[^0-9r]/g, "");
            return kNum === lNum;
          });
          if (numMatch) return ZONE_MAPPING[numMatch];
        }
        return ZONE_MAPPING[buildingKeys[0]];
      }
    }

    const foundKey = allKeys.find(key => {
      const keyLower = key.toLowerCase().trim();
      return keyLower === lLower || keyLower.includes(lLower) || lLower.includes(keyLower);
    });
    if (foundKey) return ZONE_MAPPING[foundKey];
    return [];
  };

  const selectedZones = useMemo(() => {
    return getZonesForLevel(level);
  }, [level, selectedBuildingName]);

  const allMultiLevelZones = useMemo(() => {
    const selectedLevelNames = Array.from(new Set(selectedRooms.map(r => parseRoomToken(r, level).level))).filter(Boolean);
    const targetLevels = selectedLevelNames.length > 0 ? selectedLevelNames : (levels.length > 0 ? levels : (level ? [level] : []));

    const activeZones = [];
    const allZones = [];

    targetLevels.forEach(lvl => {
      const zones = getZonesForLevel(lvl);
      zones.forEach(z => {
        const zoneObj = {
          levelName: lvl,
          zoneName: z.name,
          rooms: z.rooms || []
        };

        const hasSelectedRoom = z.rooms && z.rooms.some(room => {
          const roomName = typeof room === "object" ? room.name : room;
          return selectedRooms.some(token => {
            const parsed = parseRoomToken(token, lvl);
            return (
              parsed.level.toLowerCase().trim() === lvl.toLowerCase().trim() &&
              parsed.zone.toLowerCase().trim() === z.name.toLowerCase().trim() &&
              parsed.roomName.toLowerCase().trim() === String(roomName).toLowerCase().trim()
            );
          });
        });

        if (hasSelectedRoom) {
          activeZones.push(zoneObj);
        }
        allZones.push(zoneObj);
      });
    });

    return activeZones.length > 0 ? activeZones : allZones;
  }, [levels, selectedRooms, level, selectedBuildingName]);

  const toggleRoomSelection = (roomName, zoneName, levelName) => {
    const targetLevel = levelName || level;
    if (!targetLevel || !zoneName || !roomName) return;

    const activeStatus = getActiveStatus(selectedRooms);
    const newRoomStatus = (roomStatusMap && roomStatusMap[roomName.toLowerCase().trim()]) || null;

    setSelectedRooms(prev => {
      const isCurrentlySelected = prev.some(token => {
        const parsed = parseRoomToken(token, targetLevel);
        return (
          parsed.level.toLowerCase().trim() === targetLevel.toLowerCase().trim() &&
          parsed.zone.toLowerCase().trim() === zoneName.toLowerCase().trim() &&
          parsed.roomName.toLowerCase().trim() === roomName.toLowerCase().trim()
        );
      });

      if (!isCurrentlySelected && activeStatus && newRoomStatus && activeStatus !== newRoomStatus) {
        const statusLabelMap = { UC: "Construction", C: "Commissioning", HO: "Hand Over" };
        const activeLabel = statusLabelMap[activeStatus] || activeStatus;
        const newLabel = statusLabelMap[newRoomStatus] || newRoomStatus;
        showError(`Cannot select a room in a ${newLabel} zone when a room in a ${activeLabel} zone is already selected.`);
        return prev;
      }

      if (isCurrentlySelected) {
        return prev.filter(token => {
          const parsed = parseRoomToken(token, targetLevel);
          const same = (
            parsed.level.toLowerCase().trim() === targetLevel.toLowerCase().trim() &&
            parsed.zone.toLowerCase().trim() === zoneName.toLowerCase().trim() &&
            parsed.roomName.toLowerCase().trim() === roomName.toLowerCase().trim()
          );
          return !same;
        });
      } else {
        const newToken = `${targetLevel.trim()}:::${zoneName.trim()}:::${roomName.trim()}`;
        return Array.from(new Set([...prev, newToken]));
      }
    });
  };

  const zonesToDisplay = useMemo(() => {
    const active = selectedZones.filter(zone =>
      zone.rooms.some(room => {
        const roomName = typeof room === "object" ? room.name : room;
        const roomKey = `${zone.name}:::${roomName}`;
        return selectedRooms.includes(roomKey) || selectedRooms.includes(roomName);
      })
    );
    if (active.length === 0) {
      if (selectedZone) {
        const current = selectedZones.find(z => z.id === selectedZone.id || z.name === selectedZone.name);
        return current ? [current] : [selectedZone];
      }
      return selectedZones;
    }
    return active;
  }, [selectedZones, selectedRooms, selectedZone]);

  const handleFieldChange = (field, value) => {
    // Clear inline error for this field as user types
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];

      // Clear work type errors when switching work types
      if (field === "work_type") {
        delete next.work_type;
        delete next.electrical_works;
        delete next.mechanical_works;
      }

      // Real-time time validations
      const updatedFormData = { ...formData, [field]: value };
      const start = updatedFormData.Start_Time;
      const end = updatedFormData.End_Time;
      const shift = updatedFormData.night_shift;
      const newEnd = updatedFormData.new_end_time;

      if (field === "Start_Time" || field === "End_Time" || field === "night_shift" || field === "new_end_time") {
        delete next.Start_Time;
        delete next.End_Time;
        delete next.new_end_time;
      }

      if (start) {
        if (shift) {
          if (newEnd && newEnd >= start) {
            next.new_end_time = "For working after midnight, new end time must be earlier than start time.";
          }
        } else {
          if (end && start >= end) {
            next.End_Time = "Start time must be earlier than End time.";
          }
        }
      }

      return next;
    });
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "work_type") {
        updated.electrical_works = [];
        updated.mechanical_works = [];
        setEleSearch("");
        setMechSearch("");
        setElectricalCategory("");
      }

      if (field === "night_shift") {
        const isNight = value === true || value === 1 || value === "1";
        if (isNight) {
          if (prev.Working_Date) {
            updated.new_date = getNextDate(prev.Working_Date);
          } else {
            updated.new_date = "";
          }
          updated.End_Time = "23:59";
          if (updated.new_end_time === "none") {
            updated.new_end_time = "";
          }
        } else {
          updated.new_date = "none";
          updated.new_end_time = "none";
        }
      }

      if (field === "Working_Date") {
        const todayStr = getTodayDateString();
        if (value && value < todayStr) {
          setFieldErrors((prevErr) => ({
            ...prevErr,
            Working_Date: "Working date cannot be in the past.",
          }));
        } else {
          setFieldErrors((prevErr) => {
            const nextErr = { ...prevErr };
            delete nextErr.Working_Date;
            return nextErr;
          });
        }
        const isNight = prev.night_shift === true || prev.night_shift === 1 || prev.night_shift === "1";
        if (isNight) {
          updated.new_date = getNextDate(value);
        } else {
          updated.new_date = "none";
          updated.new_end_time = "none";
        }
      }

      return updated;
    });
  };

  const roomStatusMap = useMemo(() => {
    const mapping = {};
    roomsList.forEach(r => {
      const zoneObj = zonesList.find(z => String(z.id) === String(r.zone_id));
      if (zoneObj && r.room_name) {
        mapping[r.room_name.toLowerCase().trim()] = zoneObj.status;
      }
    });
    return mapping;
  }, [roomsList, zonesList]);

  const getActiveStatus = (roomsArray) => {
    if (!roomsArray || roomsArray.length === 0) return null;
    for (const item of roomsArray) {
      const parsed = parseRoomToken(item);
      const rName = parsed.roomName || String(item);
      const st = roomStatusMap ? roomStatusMap[rName.toLowerCase().trim()] : null;
      if (st) return st;
    }
    return null;
  };

  const handleRoomsSelected = (rooms, zone) => {
    if (!level || !zone) return;
    const currentLevelClean = level.trim();
    const currentZoneClean = zone.name.trim();

    if (rooms && rooms.length > 0) {
      const activeStatus = getActiveStatus(selectedRooms);
      const newZoneStatus = zone.status || (roomStatusMap ? roomStatusMap[String(typeof rooms[0] === "object" ? rooms[0].name : rooms[0]).toLowerCase().trim()] : null);

      if (activeStatus && newZoneStatus && activeStatus !== newZoneStatus) {
        const statusLabelMap = { UC: "Construction", C: "Commissioning", HO: "Hand Over" };
        const activeLabel = statusLabelMap[activeStatus] || activeStatus;
        const newLabel = statusLabelMap[newZoneStatus] || newZoneStatus;
        showError(`Cannot select rooms in a ${newLabel} zone when rooms in a ${activeLabel} zone are already selected.`);
        return;
      }
    }

    setSelectedRooms(prev => {
      const filtered = prev.filter(token => {
        const parsed = parseRoomToken(token, currentLevelClean, currentZoneClean);
        const sameLevel = parsed.level.toLowerCase().trim() === currentLevelClean.toLowerCase().trim();
        const sameZone = parsed.zone.toLowerCase().trim() === currentZoneClean.toLowerCase().trim();
        return !(sameLevel && sameZone);
      });

      const newTokens = rooms.map(r => {
        const rName = typeof r === "object" ? r.name : (r.includes(":::") ? r.split(":::").pop() : r);
        return `${currentLevelClean}:::${currentZoneClean}:::${rName}`;
      });

      return Array.from(new Set([...filtered, ...newTokens]));
    });
    if (zone) {
      setSelectedZone(zone);
    }
  };


  // Group dynamic electrical works list by module name
  const groupedElectrical = useMemo(() => {
    const groups = {};
    electricalWorksList.forEach((item) => {
      const mod = item.module || "General";
      if (!groups[mod]) {
        groups[mod] = [];
      }
      groups[mod].push({ id: String(item.id), name: item.electrical_works });
    });
    return Object.keys(groups).map((key) => ({
      module: key,
      items: groups[key],
    }));
  }, [electricalWorksList]);

  // Map mechanical works list for display selection
  const mechanicalWorksOptions = useMemo(() => {
    return mechanicalWorksList.map((m) => ({
      id: String(m.id),
      name: m.mechanical_works,
    }));
  }, [mechanicalWorksList]);

  // Validate all mandatory fields; show inline errors below each field
  const validateHoldFields = () => {
    const errors = {};
    if (!formData.permit_type) errors.permit_type = "Please select Permit Type.";
    if (!formData.Sub_Contractor_Id) errors.Sub_Contractor_Id = "Please select a Contractor.";
    if (!formData.new_sub_contractor?.trim()) errors.new_sub_contractor = "Please enter Sub Contractor name.";
    if (!formData.Foreman?.trim()) errors.Foreman = "Please enter Foreman-Supervisor name.";
    if (!formData.Foreman_Phone_Number?.trim()) errors.Foreman_Phone_Number = "Please enter Foreman Phone.";
    if (!formData.Activity?.trim()) errors.Activity = "Please enter Activity.";
    if (!formData.Type_Of_Activity_Id) errors.Type_Of_Activity_Id = "Please select Type of Activity.";
    if (!formData.rams_number?.trim()) errors.rams_number = "Please enter RAMS Number.";
    if (!formData.description_of_activity?.trim()) errors.description_of_activity = "Please enter Description of Activity.";
    const todayStr = getTodayDateString();
    if (!formData.Working_Date) {
      errors.Working_Date = "Please select a working Date.";
    } else if (formData.Working_Date < todayStr) {
      errors.Working_Date = "Working date cannot be in the past.";
    }
    if (!formData.Start_Time) errors.Start_Time = "Please enter Start Time.";
    if (!formData.End_Time) errors.End_Time = "Please enter End Time.";
    if (formData.night_shift) {
      if (!formData.new_date || formData.new_date === "none" || !formData.new_date.trim()) {
        errors.new_date = "Please select New Date.";
      } else if (formData.new_date < todayStr) {
        errors.new_date = "New date cannot be in the past.";
      }
      if (!formData.new_end_time || formData.new_end_time === "none" || !formData.new_end_time.trim()) {
        errors.new_end_time = "Please enter New End Time.";
      }
    }

    // Commissioning permit type validation
    if (formData.permit_type === "Commissioning") {
      if (!formData.work_type) {
        errors.work_type = "Please select Type of Work.";
      } else if (formData.work_type === "Electrical Works") {
        if (!formData.electrical_works || formData.electrical_works.length === 0) {
          errors.electrical_works = "Please select at least one electrical work.";
        }
      } else if (formData.work_type === "Mechanical Works") {
        if (!formData.mechanical_works || formData.mechanical_works.length === 0) {
          errors.mechanical_works = "Please select at least one mechanical work.";
        }
      }
    }

    // Tools & Machinery
    if (!formData.Tools?.trim()) errors.Tools = "Please enter tools used.";
    if (!formData.Machinery?.trim()) errors.Machinery = "Please enter machinery used.";

    // General Safety Checklist
    if (!formData.floatLabel11) errors.floatLabel11 = "Please Select";
    if (!formData.floatLabel12) errors.floatLabel12 = "Please Select";
    if (!formData.floatLabel13) errors.floatLabel13 = "Please Select";
    if (!formData.floatLabel14) errors.floatLabel14 = "Please Select";
    if (!formData.floatLabel15) errors.floatLabel15 = "Please Select";
    if (!formData.floatLabel16) errors.floatLabel16 = "Please Select";

    // Safety Precautions & Tasks
    if (formData.Hot_work === "1") {
      if (!formData.floatLabel1) errors.floatLabel1 = "Please Select";
      if (!formData.floatLabel3) errors.floatLabel3 = "Please Select";
      if (!formData.floatLabel4) errors.floatLabel4 = "Please Select";
      if (!formData.floatLabel5) errors.floatLabel5 = "Please Select";
      if (!formData.floatLabel6) errors.floatLabel6 = "Please Select";
      if (!formData.floatLabel7) errors.floatLabel7 = "Please Select";
      if (!formData.floatLabel8) errors.floatLabel8 = "Please Select";
      if (!formData.floatLabel9) errors.floatLabel9 = "Please Select";
      if (!formData.floatLabel10) errors.floatLabel10 = "Please Select";
      if (formData.NEWHOTWORK === "1") {
        if (!formData.NEWHOTWORK1) errors.NEWHOTWORK1 = "Please Select";
        if (!formData.NEWHOTWORK2) errors.NEWHOTWORK2 = "Please Select";
      }
    }
    if (formData.working_on_electrical_system === "1") {
      if (!formData.floatLabel17) errors.floatLabel17 = "Please Select";
      if (!formData.floatLabel18) errors.floatLabel18 = "Please Select";
      if (!formData.floatLabel19) errors.floatLabel19 = "Please Select";
      if (!formData.floatLabel20) errors.floatLabel20 = "Please Select";
      if (!formData.floatLabel22) errors.floatLabel22 = "Please Select";
    }
    if (formData.working_hazardious_substen === "1") {
      if (!formData.floatLabel24) errors.floatLabel24 = "Please Select";
      if (!formData.floatLabel25) errors.floatLabel25 = "Please Select";
      if (!formData.floatLabel26) errors.floatLabel26 = "Please Select";
      if (!formData.floatLabel27) errors.floatLabel27 = "Please Select";
      if (!formData.floatLabel28) errors.floatLabel28 = "Please Select";
      if (!formData.floatLabel29) errors.floatLabel29 = "Please Select";
      if (!formData.floatLabel30) errors.floatLabel30 = "Please Select";
      if (!formData.floatLabel31) errors.floatLabel31 = "Please Select";
    }
    if (formData.working_at_height === "1") {
      if (!formData.segragated_demarkated) errors.segragated_demarkated = "Please Select";
      if (!formData.floatLabel39) errors.floatLabel39 = "Please Select";
      if (!formData.floatLabel40) errors.floatLabel40 = "Please Select";
      if (!formData.floatLabel41) errors.floatLabel41 = "Please Select";
      if (!formData.floatLabel42) errors.floatLabel42 = "Please Select";
      if (!formData.floatLabel43) errors.floatLabel43 = "Please Select";
      if (!formData.floatLabel44) errors.floatLabel44 = "Please Select";
      if (!formData.floatLabel45) errors.floatLabel45 = "Please Select";
      if (!formData.floatLabel46) errors.floatLabel46 = "Please Select";
      if (!formData.floatLabel47) errors.floatLabel47 = "Please Select";
      if (!formData.floatLabel48) errors.floatLabel48 = "Please Select";
      if (!formData.floatLabel49) errors.floatLabel49 = "Please Select";
      if (!formData.floatLabel50) errors.floatLabel50 = "Please Select";
    }
    if (formData.working_confined_spaces === "1") {
      if (!formData.floatLabel51) errors.floatLabel51 = "Please Select";
      if (!formData.floatLabel52) errors.floatLabel52 = "Please Select";
      if (!formData.floatLabel53) errors.floatLabel53 = "Please Select";
      if (!formData.floatLabel54) errors.floatLabel54 = "Please Select";
      if (!formData.floatLabel55) errors.floatLabel55 = "Please Select";
      if (!formData.floatLabel56) errors.floatLabel56 = "Please Select";
      if (!formData.floatLabel57) errors.floatLabel57 = "Please Select";
      if (!formData.floatLabel58) errors.floatLabel58 = "Please Select";
    }
    if (formData.excavation_works === "1") {
      if (!formData.floatLabel71) errors.floatLabel71 = "Please Select";
      if (!formData.floatLabel72) errors.floatLabel72 = "Please Select";
      if (!formData.excavation_shoring) errors.excavation_shoring = "Please Select";
      if (!formData.floatLabel74) errors.floatLabel74 = "Please Select";
      if (!formData.floatLabel75) errors.floatLabel75 = "Please Select";
      if (!formData.floatLabel76) errors.floatLabel76 = "Please Select";
      if (!formData.floatLabel77) errors.floatLabel77 = "Please Select";
      if (!formData.floatLabel78) errors.floatLabel78 = "Please Select";
      if (!formData.floatLabel79) errors.floatLabel79 = "Please Select";
    }
    if (formData.using_cranes_or_lifting === "1") {
      if (!formData.floatLabel80) errors.floatLabel80 = "Please Select";
      if (!formData.floatLabel81) errors.floatLabel81 = "Please Select";
      if (!formData.floatLabel82) errors.floatLabel82 = "Please Select";
      if (!formData.floatLabel83) errors.floatLabel83 = "Please Select";
      if (!formData.floatLabel84) errors.floatLabel84 = "Please Select";
      if (!formData.floatLabel85) errors.floatLabel85 = "Please Select";
      if (!formData.floatLabel86) errors.floatLabel86 = "Please Select";
      if (!formData.floatLabel87) errors.floatLabel87 = "Please Select";
    }
    if (formData.permit_type === "Commissioning" && !shouldShowElectricianCert()) {
      if (formData.power_on === "1") {
        if (formData.EnergisingEquipment === "1") {
          if (!formData.floatLabel88) errors.floatLabel88 = "Please Select";
          if (!formData.floatLabel89) errors.floatLabel89 = "Please Select";
          if (!formData.floatLabel90) errors.floatLabel90 = "Please Select";
          if (!formData.floatLabel110) errors.floatLabel110 = "Please Select";
          if (!formData.floatLabel91) errors.floatLabel91 = "Please Select";
          if (!formData.floatLabel92) errors.floatLabel92 = "Please Select";
          if (!formData.floatLabel93) errors.floatLabel93 = "Please Select";
          if (!formData.floatLabel94) errors.floatLabel94 = "Please Select";
        }
        if (formData.IsolatingLive === "1") {
          if (!formData.floatLabel111) errors.floatLabel111 = "Please Select";
          if (!formData.floatLabel112) errors.floatLabel112 = "Please Select";
          if (!formData.floatLabel113) errors.floatLabel113 = "Please Select";
          if (!formData.floatLabel114) errors.floatLabel114 = "Please Select";
          if (!formData.floatLabel115) errors.floatLabel115 = "Please Select";
          if (!formData.floatLabel116) errors.floatLabel116 = "Please Select";
          if (!formData.floatLabel117) errors.floatLabel117 = "Please Select";
          if (!formData.floatLabel118) errors.floatLabel118 = "Please Select";
          if (!formData.floatLabel119) errors.floatLabel119 = "Please Select";
        }
        if (formData.WorkingNearLive === "1") {
          if (!formData.floatLabel120) errors.floatLabel120 = "Please Select";
          if (!formData.floatLabel121) errors.floatLabel121 = "Please Select";
          if (!formData.floatLabel122) errors.floatLabel122 = "Please Select";
          if (!formData.floatLabel123) errors.floatLabel123 = "Please Select";
          if (!formData.floatLabel124) errors.floatLabel124 = "Please Select";
          if (!formData.floatLabel125) errors.floatLabel125 = "Please Select";
          if (!formData.floatLabel126) errors.floatLabel126 = "Please Select";
          if (!formData.floatLabel127) errors.floatLabel127 = "Please Select";
        }
      }
      if (formData.pressurization === "1") {
        if (!formData.floatLabel95) errors.floatLabel95 = "Please Select";
        if (!formData.floatLabel96) errors.floatLabel96 = "Please Select";
        if (!formData.floatLabel97) errors.floatLabel97 = "Please Select";
        if (formData.floatLabel97 === "1" && !formData.mc_number_text?.trim()) {
          errors.mc_number_text = "MC Number Required";
        }
        if (!formData.floatLabel98) errors.floatLabel98 = "Please Select";
        if (!formData.floatLabel99) errors.floatLabel99 = "Please Select";
        if (!formData.floatLabel100) errors.floatLabel100 = "Please Select";
        if (!formData.floatLabel101) errors.floatLabel101 = "Please Select";
      }
      if (formData.pressure_testing_of_equipment === "1") {
        if (!formData.floatLabel102) errors.floatLabel102 = "Please Select";
        if (!formData.floatLabel103) errors.floatLabel103 = "Please Select";
        if (!formData.floatLabel104) errors.floatLabel104 = "Please Select";
        if (!formData.floatLabel105) errors.floatLabel105 = "Please Select";
        if (!formData.floatLabel106) errors.floatLabel106 = "Please Select";
        if (!formData.floatLabel107) errors.floatLabel107 = "Please Select";
        if (formData.floatLabel107 === "1" && !formData.pressure_pneumatic?.trim()) {
          errors.pressure_pneumatic = "Provide the pressure value";
        }
        if (!formData.floatLabel108) errors.floatLabel108 = "Please Select";
        if (formData.floatLabel108 === "1" && !formData.pressure_hydrostatic?.trim()) {
          errors.pressure_hydrostatic = "Provide the pressure value";
        }
        if (!formData.floatLabel109) errors.floatLabel109 = "Please Select";
      }
    }

    // PPE and workers
    if (!formData.eye_protection) errors.eye_protection = "Please Select";
    if (!formData.fall_protection) errors.fall_protection = "Please Select";
    if (!formData.hearing_protection) errors.hearing_protection = "Please Select";
    if (!formData.respiratory_protection) errors.respiratory_protection = "Please Select";
    if (!formData.other_ppe?.trim()) errors.other_ppe = "Please enter other PPE details.";
    if (!formData.Number_Of_Workers?.trim()) errors.Number_Of_Workers = "Please enter number of workers.";

    // Start/End Time validations
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (formData.Start_Time && !timeRegex.test(formData.Start_Time)) {
      errors.Start_Time = "Start time must be in 24-hour format (HH:MM).";
    }
    if (formData.End_Time && !timeRegex.test(formData.End_Time)) {
      errors.End_Time = "End time must be in 24-hour format (HH:MM).";
    }
    if (formData.night_shift && formData.new_end_time && !timeRegex.test(formData.new_end_time)) {
      errors.new_end_time = "New End time must be in 24-hour format (HH:MM).";
    }

    if (formData.Start_Time) {
      if (formData.night_shift) {
        if (formData.new_end_time) {
          if (formData.new_end_time >= formData.Start_Time) {
            errors.new_end_time = "For working after midnight, new end time must be earlier than start time.";
          }
        }
      } else {
        if (formData.End_Time) {
          if (formData.Start_Time >= formData.End_Time) {
            errors.End_Time = "Start time must be earlier than End time.";
          }
        }
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Scroll to the first error field
      setTimeout(() => {
        const firstErr = document.querySelector(".field-error");
        if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e, status) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!building) {
      showError("Please select a building.");
      return;
    }
    if (!level) {
      showError("Please select a level.");
      return;
    }

    if (!formData.permit_type) {
      setFieldErrors(prev => ({ ...prev, permit_type: "Please select Permit Type." }));
      setTimeout(() => {
        const firstErr = document.querySelector(".field-error");
        if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    // Check that all selected rooms belong to zones with the exact same status
    const statusesFound = new Set();
    selectedRooms.forEach(token => {
      const parsed = parseRoomToken(token, level);
      const st = roomStatusMap ? roomStatusMap[(parsed.roomName || "").toLowerCase().trim()] : null;
      if (st) statusesFound.add(st);
    });
    if (statusesFound.size > 1) {
      const statusArray = Array.from(statusesFound);
      const statusLabelMap = { UC: "Construction", C: "Commissioning", HO: "Hand Over" };
      const labels = statusArray.map(s => statusLabelMap[s] || s).join(" and ");
      showError(`All selected rooms must belong to zones with the same status. Currently selected rooms mix ${labels}.`);
      return;
    }

    // 1. Tally selected location items across multiple levels to resolve database IDs
    const Building_Id = building ? Number(building) : null;

    const allSelectedLevelNames = new Set();

    selectedRooms.forEach(token => {
      let lName = null;
      const str = String(token);
      const parts = str.split(":::");

      if (parts.length === 3 && parts[0]) {
        lName = parts[0].trim();
      } else {
        const zName = (parts.length === 2 ? parts[0] : "").toLowerCase().trim();
        const rName = (parts.length === 2 ? parts[1] : str).toLowerCase().trim();

        let foundZone = zonesList.find(z => (z.zone || z.zone_name || z.name || "").toLowerCase().trim() === zName);
        if (!foundZone && rName) {
          const foundRoomObj = roomsList.find(r => (r.room_name || r.name || "").toLowerCase().trim() === rName);
          if (foundRoomObj && foundRoomObj.zone_id) {
            foundZone = zonesList.find(z => String(z.id || z.zone_id) === String(foundRoomObj.zone_id));
          }
        }

        if (foundZone) {
          const fId = foundZone.floor_id || foundZone.fl_id || foundZone.floorId;
          if (fId) {
            const foundFloor = floorsList.find(f => String(f.fl_id ?? f.id ?? f.floor_id) === String(fId));
            if (foundFloor) {
              lName = String(foundFloor.floor_name || foundFloor.name || foundFloor.floor || "").trim();
            }
          }
        }

        if (!lName && zName) {
          const matchedFloor = floorsList.find(f => {
            const fName = String(f.floor_name || f.name || f.floor || "").toLowerCase().trim();
            return fName && (zName.startsWith(fName) || fName.startsWith(zName));
          });
          if (matchedFloor) {
            lName = String(matchedFloor.floor_name || matchedFloor.name || matchedFloor.floor || "").trim();
          }
        }
      }

      if (lName) {
        allSelectedLevelNames.add(lName);
      }
    });

    if (allSelectedLevelNames.size === 0 && level) {
      allSelectedLevelNames.add(level.trim());
    }

    const selectedLevelNames = Array.from(allSelectedLevelNames);
    const Room_Type = selectedLevelNames.join(", ");

    // Resolve Floor IDs across selected levels
    const matchedFloorIds = selectedLevelNames.map(lName => {
      const lClean = lName.toLowerCase().trim();
      const lNum = lClean.replace(/[^0-9r]/g, "");
      const f = floorsList.find(floor => {
        const isBuildingMatch = String(floor.build_id) === String(building) || String(floor.building_id) === String(building);
        if (!isBuildingMatch) return false;
        const fName = String(floor.floor_name || floor.name || floor.floor || "").toLowerCase().trim();
        if (fName === lClean) return true;
        if (lNum && fName.replace(/[^0-9r]/g, "") === lNum) return true;
        return fName.includes(lClean) || lClean.includes(fName);
      });
      return f ? String(f.fl_id ?? f.id ?? f.floor_id) : null;
    }).filter(Boolean);

    const uniqueFloorIds = Array.from(new Set(matchedFloorIds));
    const Floor_Id = uniqueFloorIds.join(",");

    // Resolve Zone names & Zone IDs across selected levels
    const allSelectedZoneNames = new Set();
    selectedRooms.forEach(token => {
      const parsed = parseRoomToken(token, level);
      if (parsed.zone) allSelectedZoneNames.add(parsed.zone);
    });
    if (allSelectedZoneNames.size === 0 && isEditMode && editRequest?.zone) {
      const dbZ = typeof editRequest.zone === "object" ? (editRequest.zone.zone || "") : String(editRequest.zone);
      if (dbZ) allSelectedZoneNames.add(dbZ);
    } else if (allSelectedZoneNames.size === 0 && isEditMode && editRequest?.zone_name) {
      allSelectedZoneNames.add(String(editRequest.zone_name));
    }

    const uniqueZoneNames = Array.from(allSelectedZoneNames);
    const zoneVal = uniqueZoneNames.join(",");

    const selectedZoneNamesLower = uniqueZoneNames.map(z => z.toLowerCase().trim());
    let matchedZoneIds = zonesList
      .filter(z => {
        const isBuildingMatch = String(z.building_id || z.build_id || "") === String(building);
        const zName = (z.zone || z.zone_name || "").toLowerCase().trim();
        return selectedZoneNamesLower.length > 0 ? selectedZoneNamesLower.includes(zName) : true;
      })
      .map(z => String(z.id ?? z.zoneStatusId));

    if (matchedZoneIds.length === 0 && isEditMode && editRequest?.Zone_Id) {
      matchedZoneIds = String(editRequest.Zone_Id).split(",").map(s => s.trim()).filter(Boolean);
    }

    const Zone_Id = Array.from(new Set(matchedZoneIds)).join(",");

    // Resolve Room IDs across selected levels
    let Room_Nos = "";
    if (selectedRooms.length > 0) {
      const getRoomNameStr = (r) => String(r.room_name || r.room_nos || r.room_number || r.roomName || r.name || "").toLowerCase().trim();

      const resolvedTokens = selectedRooms.map(roomItem => {
        if (!roomItem) return null;
        const parsed = parseRoomToken(roomItem, level);
        const roomStr = String(parsed.roomName).trim();
        const targetLevel = parsed.level;

        const matchedFloor = floorsList.find(f => {
          const isBuildingMatch = String(f.build_id) === String(building) || String(f.building_id) === String(building);
          if (!isBuildingMatch) return false;
          const fName = String(f.floor_name || f.name || f.floor || "").toLowerCase().trim();
          return fName === targetLevel.toLowerCase().trim() || fName.includes(targetLevel.toLowerCase().trim());
        });
        const targetFloorId = matchedFloor ? String(matchedFloor.fl_id ?? matchedFloor.id ?? matchedFloor.floor_id) : null;

        if (/^\d+$/.test(roomStr)) {
          const exactIdMatch = roomsList.find(r =>
            String(r.room_id ?? r.id) === roomStr &&
            (Building_Id ? String(r.building_id) === String(Building_Id) : true) &&
            (targetFloorId ? String(r.fl_id || r.floor_id) === String(targetFloorId) : true)
          );
          if (exactIdMatch) return String(exactIdMatch.room_id ?? exactIdMatch.id);
        }

        const roomNameLower = roomStr.toLowerCase();

        let matched = roomsList.find(r =>
          getRoomNameStr(r) === roomNameLower &&
          (Building_Id ? String(r.building_id) === String(Building_Id) : true) &&
          (targetFloorId ? String(r.fl_id || r.floor_id) === String(targetFloorId) : true)
        );

        if (!matched) {
          matched = roomsList.find(r =>
            getRoomNameStr(r) === roomNameLower &&
            (Building_Id ? String(r.building_id) === String(Building_Id) : true)
          );
        }

        if (!matched) {
          matched = roomsList.find(r => getRoomNameStr(r) === roomNameLower);
        }

        return matched ? String(matched.room_id ?? matched.id) : roomStr;
      }).filter(Boolean);

      Room_Nos = Array.from(new Set(resolvedTokens)).join(",");
    }

    if (!Room_Nos && isEditMode && editRequest?.Room_Nos) {
      Room_Nos = String(editRequest.Room_Nos);
    }

    if (!Room_Nos && isEditMode && editRequest?.Room_Nos) {
      Room_Nos = String(editRequest.Room_Nos);
    }

    // Frontend validations
    if (formData.Working_Date) {
      const todayStr = getTodayDateString();
      if (formData.Working_Date < todayStr) {
        showError("Working date cannot be a past date.");
        return;
      }
    }

    const timeErrors = {};
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (formData.Start_Time && !timeRegex.test(formData.Start_Time)) {
      timeErrors.Start_Time = "Start time must be in 24-hour format (HH:MM).";
    }
    if (formData.End_Time && !timeRegex.test(formData.End_Time)) {
      timeErrors.End_Time = "End time must be in 24-hour format (HH:MM).";
    }
    if (formData.night_shift && formData.new_end_time && !timeRegex.test(formData.new_end_time)) {
      timeErrors.new_end_time = "New End time must be in 24-hour format (HH:MM).";
    }
    if (formData.night_shift) {
      if (!formData.new_date || formData.new_date === "none" || !String(formData.new_date).trim()) {
        timeErrors.new_date = "Please select New Date.";
      }
      if (!formData.new_end_time || formData.new_end_time === "none" || !String(formData.new_end_time).trim()) {
        timeErrors.new_end_time = "Please enter New End Time.";
      }
    }

    if (formData.Start_Time) {
      if (formData.night_shift) {
        if (formData.new_end_time) {
          if (formData.new_end_time >= formData.Start_Time) {
            timeErrors.new_end_time = "For working after midnight, new end time must be earlier than start time.";
          }
        }
      } else {
        if (formData.End_Time) {
          if (formData.Start_Time >= formData.End_Time) {
            timeErrors.End_Time = "Start time must be earlier than End time.";
          }
        }
      }
    }

    if (Object.keys(timeErrors).length > 0) {
      setFieldErrors(prev => ({ ...prev, ...timeErrors }));
      setTimeout(() => {
        const firstErr = document.querySelector(".field-error");
        if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    // Commissioning permit type validation
    const commErrors = {};
    if (formData.permit_type === "Commissioning") {
      if (!formData.work_type) {
        commErrors.work_type = "Please select Type of Work.";
      } else if (formData.work_type === "Electrical Works") {
        if (!formData.electrical_works || formData.electrical_works.length === 0) {
          commErrors.electrical_works = "Please select at least one electrical work.";
        }
      } else if (formData.work_type === "Mechanical Works") {
        if (!formData.mechanical_works || formData.mechanical_works.length === 0) {
          commErrors.mechanical_works = "Please select at least one mechanical work.";
        }
      }
    }

    if (Object.keys(commErrors).length > 0) {
      setFieldErrors(prev => ({ ...prev, ...commErrors }));
      setTimeout(() => {
        const firstErr = document.querySelector(".field-error");
        if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    if (!Zone_Id) {
      showError("Please select at least one zone or room on the floor layout.");
      return;
    }
    if (formData.floatLabel97 === "1" && (!formData.mc_number_text || !formData.mc_number_text.trim())) {
      showError("MC Number is required when MC Approved is Yes.");
      return;
    }
    if (formData.pressure_testing_of_equipment === "1" && formData.floatLabel107 === "1" && (!formData.pressure_pneumatic || !formData.pressure_pneumatic.trim())) {
      showError("Pressure of Pneumatic Test is required when Pneumatic Test is Yes.");
      return;
    }
    if (formData.pressure_testing_of_equipment === "1" && formData.floatLabel108 === "1" && (!formData.pressure_hydrostatic || !formData.pressure_hydrostatic.trim())) {
      showError("Pressure of Hydrostatic Test is required when Hydrostatic Test is Yes.");
      return;
    }
    if (formData.floatLabel16 === undefined || formData.floatLabel16 === null || formData.floatLabel16 === "") {
      showError("Please answer the 'course of action in any emergency situation' question in the General Safety Checklist.");
      return;
    }

    console.log("[Room_Nos Debug]", {
      selectedRooms,
      Floor_Id,
      matchedZoneIds,
      roomsList: roomsList.slice(0, 5),
      Room_Nos,
    });

    // Current User
    const currentUser = getUser();
    const currentUserId = currentUser?.id || 1;

    const isNightShift = formData.night_shift === true || formData.night_shift === 1 || formData.night_shift === "1";

    const newDateVal = isNightShift
      ? (formData.new_date && formData.new_date !== "none" ? formData.new_date : (formData.Working_Date ? getNextDate(formData.Working_Date) : "none"))
      : "none";

    let newEndTimeVal = "none";
    if (isNightShift) {
      if (formData.new_end_time && formData.new_end_time !== "none") {
        newEndTimeVal = formData.new_end_time.includes(":") && formData.new_end_time.split(":").length === 2
          ? `${formData.new_end_time}:00`
          : formData.new_end_time;
      }
    }

    // 2. Prepare payload
    const payload = {
      ...formData,
      Building_Id,
      Floor_Id,
      Zone_Id,
      zone: zoneVal,
      Room_Nos,
      // RoomNos: Room_Nos,
      Room_Type: Room_Type || level,
      Request_status: status || (isEditMode && (editRequest?.Request_status || editRequest?.request_status) ? (editRequest?.Request_status || editRequest?.request_status) : "Draft"),
      userId: currentUserId,
      Request_Date: isEditMode ? editRequest.Request_Date : getTodayDateString(),
      Working_Date: formData.Working_Date,
      Start_Time: formData.Start_Time ? (formData.Start_Time.includes(":") && formData.Start_Time.split(":").length === 2 ? `${formData.Start_Time}:00` : formData.Start_Time) : "",
      End_Time: formData.End_Time ? (formData.End_Time.includes(":") && formData.End_Time.split(":").length === 2 ? `${formData.End_Time}:00` : formData.End_Time) : "",
      night_shift: isNightShift ? 1 : 0,
      new_date: newDateVal,
      new_end_time: newEndTimeVal,
      Assign_Start_Time: formData.Start_Time ? `${formData.Start_Time}:00` : "",
      Assign_End_Time: formData.End_Time ? `${formData.End_Time}:00` : "",
      Assign_Start_Date: formData.Working_Date,
      Assign_End_Date: formData.Working_Date,
      Sub_Contractor_Id: formData.Sub_Contractor_Id ? Number(formData.Sub_Contractor_Id) : null,
      Type_Of_Activity_Id: formData.Type_Of_Activity_Id ? Number(formData.Type_Of_Activity_Id) : null,
      Activity: formData.Activity || "",
      new_sub_contractor: formData.new_sub_contractor || "",
      Foreman_Phone_Number: formData.Foreman_Phone_Number || "",
      rams_number: formData.rams_number || "",
      description_of_activity: formData.description_of_activity || "",
      Site_Id: 5, // M3 South
      Company_Name: formData.Company_Name || "M3 South",
      Hot_work: formData.Hot_work === "1" ? 1 : 0,
      working_on_electrical_system: formData.working_on_electrical_system === "1" ? 1 : 0,
      working_hazardious_substen: formData.working_hazardious_substen === "1" ? 1 : 0,
      working_at_height: formData.working_at_height === "1" ? 1 : 0,
      working_confined_spaces: formData.working_confined_spaces === "1" ? 1 : 0,
      excavation_works: formData.excavation_works === "1" ? 1 : 0,
      using_cranes_or_lifting: formData.using_cranes_or_lifting === "1" ? 1 : 0,
      power_on: formData.power_on === "1" ? 1 : 0,
      pressurization: formData.pressurization === "1" ? 1 : 0,
      pressure_testing_of_equipment: formData.pressure_testing_of_equipment === "1" ? 1 : 0,
      Number_Of_Workers: formData.Number_Of_Workers,
      electrical_works: (Array.isArray(formData.electrical_works) && formData.electrical_works.filter(x => x && x !== "N/A").length > 0)
        ? formData.electrical_works.filter(x => x && x !== "N/A").join(",")
        : "N/A",
      mechanical_works: (Array.isArray(formData.mechanical_works) && formData.mechanical_works.filter(x => x && x !== "N/A").length > 0)
        ? formData.mechanical_works.filter(x => x && x !== "N/A").join(",")
        : "N/A",
      Safety_Precautions: Array.isArray(formData.Safety_Precautions) ? formData.Safety_Precautions.join(",") : "",

      // General Safety Checklist
      affecting_other_contractors: formData.floatLabel11 || 0,
      other_conditions: formData.floatLabel12 || 0,
      other_conditions_input: formData.other_conditions_input || "",
      lighting_begin_work: formData.floatLabel13 || 0,
      specific_risks: formData.floatLabel14 || 0,
      environment_ensured: formData.floatLabel15 || 0,
      course_of_action: (formData.floatLabel16 !== undefined && formData.floatLabel16 !== null && formData.floatLabel16 !== "") ? Number(formData.floatLabel16) : null,

      // Hot Work
      tasks_in_progress_in_the_area: formData.floatLabel1 || 0,
      lighting_sufficiently: formData.floatLabel3 || 0,
      specific_risks_based_on_task: formData.floatLabel4 || 0,
      work_environment_safety_ensured: formData.floatLabel5 || 0,
      course_of_action_in_emergencies: formData.floatLabel6 || 0,
      fire_watch_establish: formData.floatLabel7 || 0,
      combustible_material: formData.floatLabel8 || 0,
      safety_measures: formData.floatLabel9 || 0,
      extinguishers_and_fire_blanket: formData.floatLabel10 || 0,
      welding_activity: formData.NEWHOTWORK || 0,
      welding_activitiy: formData.NEWHOTWORK || 0,
      heat_treatment: formData.NEWHOTWORK1 || 0,
      air_extraction_be_established: formData.NEWHOTWORK2 || 0,

      // Temporary Electrical Systems
      responsible_for_the_informed: formData.floatLabel17 || 0,
      de_energized: formData.floatLabel18 || 0,
      if_no_loto: formData.floatLabel19 || 0,
      if_not_loto: formData.floatLabel19 || 0,
      do_risk_assessment: formData.floatLabel20 || 0,
      electricity_have_isulation: formData.floatLabel22 || 0,
      // electrician_certification: formData.floatLabel23 || 0,

      // Hazardous Substances
      relevant_mal: formData.floatLabel24 || 0,
      msds: formData.floatLabel25 || 0,
      equipment_taken_account: formData.floatLabel26 || 0,
      ventilation: formData.floatLabel27 || 0,
      hazardaus_substances: formData.floatLabel28 || 0,
      hazardous_substances: formData.floatLabel28 || 0,
      storage_and_disposal: formData.floatLabel29 || 0,
      reachable_case: formData.floatLabel30 || 0,
      checical_risk_assessment: formData.floatLabel31 || 0,

      // Testing Section
      // transfer_of_palnt: formData.floatLabel32 || 0,
      // area_drained: formData.floatLabel33 || 0,
      // area_depressurised: formData.floatLabel34 || 0,
      // area_flused: formData.floatLabel35 || 0,
      // tank_area_container: formData.floatLabel36 || 0,
      // system_free_for_dust: formData.floatLabel37 || 0,
      // loto_plan_submitted: formData.floatLabel38 || 0,

      // Working at Height
      lanyard_attachments: formData.floatLabel39 || 0,
      rescue_plan: formData.floatLabel40 || 0,
      avoid_hazards: formData.floatLabel41 || 0,
      height_training: formData.floatLabel42 || 0,
      supervision: formData.floatLabel43 || 0,
      shock_absorbing: formData.floatLabel44 || 0,
      height_equipments: formData.floatLabel45 || 0,
      vertical_life: formData.floatLabel46 || 0,
      secured_falling: formData.floatLabel47 || 0,
      dropped_objects: formData.floatLabel48 || 0,
      safe_acces: formData.floatLabel49 || 0,
      weather_acceptable: formData.floatLabel50 || 0,

      // Working in Confined Spaces
      vapours_gases: formData.floatLabel51 || 0,
      lel_measurement: formData.floatLabel52 || 0,
      all_equipment: formData.floatLabel53 || 0,
      exit_conditions: formData.floatLabel54 || 0,
      communication_emergency: formData.floatLabel55 || 0,
      rescue_equipments: formData.floatLabel56 || 0,
      space_ventilation: formData.floatLabel57 || 0,
      oxygen_meter: formData.floatLabel58 || 0,

      // Work in Atex Area
      // ex_area_downgraded: formData.floatLabel59 || 0,
      // atmospheric_tester: formData.floatLabel60 || 0,
      // flammable_materials: formData.floatLabel61 || 0,
      // potential_explosive: formData.floatLabel62 || 0,
      // oxygen_meter_confined_spaces: formData.floatLabel63 || 0,

      // Excavation Works
      excavation_segregated: formData.floatLabel71 || 0,
      nn_standards: formData.floatLabel72 || 0,
      danish_regulation: formData.floatLabel74 || 0,
      safe_access_and_egress: formData.floatLabel75 || 0,
      correctly_sloped: formData.floatLabel76 || 0,
      inspection_dates: formData.floatLabel77 || 0,
      marked_drawings: formData.floatLabel78 || 0,
      underground_areas_cleared: formData.floatLabel79 || 0,

      // Using Cranes or Lifting
      appointed_person: formData.floatLabel80 || 0,
      vendor_supplies: formData.floatLabel81 || 0,
      vendor_supplier: formData.floatLabel81 || 0,
      lift_plan: formData.floatLabel82 || 0,
      supplied_and_inspected: formData.floatLabel83 || 0,
      legal_required_certificates: formData.floatLabel84 || 0,
      prapared_lifting: formData.floatLabel85 || 0,
      lifting_task_fenced: formData.floatLabel86 || 0,
      overhead_risks: formData.floatLabel87 || 0,

      // Pressurization Power On fields
      energising_equipment: formData.EnergisingEquipment === "1" ? 1 : 0,
      isolating_live: formData.IsolatingLive === "1" ? 1 : 0,
      working_near_live: formData.WorkingNearLive === "1" ? 1 : 0,
      responsible_for_the_area: formData.floatLabel88 || 0,
      risk_assessment_done: formData.floatLabel89 || 0,
      barriers_signage: formData.floatLabel90 || 0,
      arc_flash: formData.floatLabel110 || 0,
      energized_been_tested: formData.floatLabel91 || 0,
      punches_been_closed: formData.floatLabel92 || 0,
      toct_checklist: formData.floatLabel93 || 0,
      informed_aligned: formData.floatLabel94 || 0,

      // Pressurization Isolating Live fields
      isolating_resposible: formData.floatLabel111 || 0,
      isolating_risk_assessment: formData.floatLabel112 || 0,
      cq_informed: formData.floatLabel113 || 0,
      cq_provided: formData.floatLabel114 || 0,
      de_energisation_request: formData.floatLabel115 || 0,
      ppe_prepared: formData.floatLabel116 || 0,
      absence_of_voltage: formData.floatLabel117 || 0,
      stored_energy: formData.floatLabel118 || 0,
      backup_power: formData.floatLabel119 || 0,

      // Pressurization Working Near Live fields
      unavoidable: formData.floatLabel120 || 0,
      reasonably_practicable: formData.floatLabel121 || 0,
      work_authorised: formData.floatLabel122 || 0,
      working_risk_assessment: formData.floatLabel123 || 0,
      working_arc_boundary: formData.floatLabel124 || 0,
      working_barriers: formData.floatLabel125 || 0,
      insulated_tools: formData.floatLabel126 || 0,
      event_of_emergency: formData.floatLabel127 || 0,

      // Pressurization general fields
      performed_approved: formData.floatLabel95 || 0,
      flushing_approved: formData.floatLabel96 || 0,
      mc_approved: formData.floatLabel97 || 0,
      visual_inspection: formData.floatLabel98 || 0,
      loto_plan_approved: formData.floatLabel99 || 0,
      follow_media_code: formData.floatLabel100 || 0,
      cq_safety_signs: formData.floatLabel101 || 0,

      // Commission fields of electrical systems (Pressure testing of equipment)
      line_walk: formData.floatLabel102 || 0,
      pressure_test_coordinated: formData.floatLabel103 || 0,
      pipework_mic: formData.floatLabel104 || 0,
      loto_plan_attached: formData.floatLabel105 || 0,
      exclusion_zone_calculated: formData.floatLabel106 || 0,
      pneumatic_hydrostatic: formData.floatLabel107 || 0,
      pnematic_hydrostatic: formData.floatLabel107 || 0,
      pressure_of_the_test: formData.floatLabel108 || 0,
      safety_valves_calibrated: formData.floatLabel109 || 0,
    };

    // Remove internal React floatLabel keys and temporary properties from payload
    const keysToDelete = [
      "floatLabel1", "floatLabel3", "floatLabel4", "floatLabel5", "floatLabel6", "floatLabel7", "floatLabel8", "floatLabel9", "floatLabel10",
      "floatLabel11", "floatLabel12", "floatLabel13", "floatLabel14", "floatLabel15", "floatLabel16", "floatLabel17", "floatLabel18", "floatLabel19", "floatLabel20", "floatLabel22",
      "floatLabel24", "floatLabel25", "floatLabel26", "floatLabel27", "floatLabel28", "floatLabel29", "floatLabel30", "floatLabel31",
      "floatLabel39", "floatLabel40", "floatLabel41", "floatLabel42", "floatLabel43", "floatLabel44", "floatLabel45", "floatLabel46", "floatLabel47", "floatLabel48", "floatLabel49", "floatLabel50",
      "floatLabel51", "floatLabel52", "floatLabel53", "floatLabel54", "floatLabel55", "floatLabel56", "floatLabel57", "floatLabel58",
      "floatLabel71", "floatLabel72", "floatLabel74", "floatLabel75", "floatLabel76", "floatLabel77", "floatLabel78", "floatLabel79", "floatLabel80", "floatLabel81", "floatLabel82", "floatLabel83", "floatLabel84", "floatLabel85", "floatLabel86", "floatLabel87", "floatLabel88", "floatLabel89", "floatLabel90", "floatLabel91", "floatLabel92", "floatLabel93", "floatLabel94", "floatLabel95", "floatLabel96", "floatLabel97", "floatLabel98", "floatLabel99", "floatLabel100", "floatLabel101", "floatLabel102", "floatLabel103", "floatLabel104", "floatLabel105", "floatLabel106", "floatLabel107", "floatLabel108", "floatLabel109", "floatLabel110", "floatLabel111", "floatLabel112", "floatLabel113", "floatLabel114", "floatLabel115", "floatLabel116", "floatLabel117", "floatLabel118", "floatLabel119", "floatLabel120", "floatLabel121", "floatLabel122", "floatLabel123", "floatLabel124", "floatLabel125", "floatLabel126", "floatLabel127",
      "NEWHOTWORK", "NEWHOTWORK1", "NEWHOTWORK2",
      "EnergisingEquipment", "IsolatingLive", "WorkingNearLive"
    ];
    keysToDelete.forEach(k => delete payload[k]);

    // Clean up conditional text values if their corresponding switches are not Yes (1)
    if (formData.floatLabel97 !== "1") {
      payload.mc_number_text = "N/A";
    }
    if (formData.pressure_testing_of_equipment !== "1" || formData.floatLabel107 !== "1") {
      payload.pressure_pneumatic = "N/A";
    }
    if (formData.pressure_testing_of_equipment !== "1" || formData.floatLabel108 !== "1") {
      payload.pressure_hydrostatic = "N/A";
    }

    // Construct FormData object
    const fd = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value !== null && value !== undefined) {
        fd.append(key, String(value));
      }
    }

    // Append files (only new files accumulated in creation mode)
    if (!isEditMode && uploadedFiles.length > 0) {
      uploadedFiles.forEach((file) => {
        fd.append("rams_file[]", file);
      });
    }

    setIsSubmittingPermit(true);
    try {
      if (isEditMode) {
        // Submit update request
        const res = await updateRequest(editRequest.id, fd);
        if (res && (res.status === 500 || res.status === 400 || res.statusCode === 500 || res.statusCode === 400)) {
          showError(res.message || "Operation failed. Please try again.");
          return;
        }

        // Submit notes if typed
        if (formData.notes && formData.notes.trim()) {
          const notePayload = {
            request_id: String(editRequest.id),
            permit_no: editRequest.PermitNo,
            user_id: currentUserId,
            username: currentUser?.displayName || currentUser?.username || "Supervisor",
            note: formData.notes.trim(),
          };
          await addListReqstNote(notePayload);
        }
        showSuccess("Work Permit Request updated successfully");
      } else {
        const res = await createRequest(fd);
        if (res && (res.status === 500 || res.status === 400 || res.statusCode === 500 || res.statusCode === 400)) {
          showError(res.message || "Operation failed. Please try again.");
          return;
        }
        showSuccess("Work Permit Request created successfully");
      }

      setIsnewrequestcreated(false);
      setBuilding("");
      setLevel("");
      setSelectedRooms([]);
      setSelectedZone(null);
      setUploadedFiles([]);
      navigate("/list-request");
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || "Operation failed. Please try again.";
      showError(errMsg);
    } finally {
      setIsSubmittingPermit(false);
    }
  };

  if (isnewrequestcreated) {

    return (
      <div className="dept-page">
        <div className="dept-page-header">
          <div className="dept-page-header__left">
            <h1 className="dept-page-title">New Work Permit Request Form</h1>
          </div>
          <div className="butns-grp-back">
            <button
              type="button"
              className="nr-btn nr-btn--ghost"
              onClick={() => setIsnewrequestcreated(false)}
            >
              Back to Drawing
            </button>
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="df-form premium-form-container">
          {/* Main Form Section */}
          <div className="form-card">
            <h2 className="form-card-title">General Information</h2>
            <div className="df-grid">
              <div className="df-field">
                <label className="df-label">Request Date</label>
                <input
                  type="text"
                  className="df-input df-readonly"
                  value={formData.Request_Date}
                  readOnly
                />
              </div>
              <div className="df-field">
                <label className="df-label">Project Name</label>
                <input
                  type="text"
                  className="df-input df-readonly"
                  value={formData.Company_Name}
                  readOnly
                />
              </div>
            </div>

            <div className="df-grid" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Contractor <span className="req-star">*</span></label>
                {isSubcontractor ? (
                  <input
                    type="text"
                    className="df-input df-readonly"
                    value={contractors.length > 0 ? (contractors.find(c => String(c.id) === String(formData.Sub_Contractor_Id))?.subContractorName || contractors[0]?.subContractorName) : "Loading..."}
                    readOnly
                  />
                ) : (
                  <SearchableSingleSelect
                    options={contractors}
                    value={formData.Sub_Contractor_Id}
                    onChange={(e) => handleFieldChange("Sub_Contractor_Id", e.target.value)}
                    placeholder="Select Contractor"
                    disabled={isSubcontractor}
                    className={fieldErrors.Sub_Contractor_Id ? "field-input-error" : ""}
                  />
                )}
                {fieldErrors.Sub_Contractor_Id && <span className="field-error">{fieldErrors.Sub_Contractor_Id}</span>}
              </div>

              <div className="df-field">
                <label className="df-label">Sub Contractor <span className="req-star">*</span></label>
                <input
                  type="text"
                  className={`df-input${fieldErrors.new_sub_contractor ? " field-input-error" : ""}`}
                  placeholder="Enter Sub Contractor Name"
                  value={formData.new_sub_contractor}
                  onChange={(e) => handleFieldChange("new_sub_contractor", e.target.value)}
                />
                {fieldErrors.new_sub_contractor && <span className="field-error">{fieldErrors.new_sub_contractor}</span>}
              </div>
            </div>

            <div className="df-grid" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Permit Type <span className="req-star">*</span></label>
                <select
                  className={`df-select${fieldErrors.permit_type ? " field-input-error" : ""}`}
                  value={formData.permit_type}
                  onChange={(e) => handleFieldChange("permit_type", e.target.value)}
                >
                  <option value="">Select Permit Type</option>
                  <option value="Construction">Construction</option>
                  <option value="Commissioning">Commissioning</option>
                </select>
                {fieldErrors.permit_type && <span className="field-error">{fieldErrors.permit_type}</span>}
              </div>
              <div className="df-field">
                <label className="df-label">Foreman-Supervisor <span className="req-star">*</span></label>
                <input
                  type="text"
                  className={`df-input${fieldErrors.Foreman ? " field-input-error" : ""}`}
                  placeholder="Enter Foreman Supervisor Name"
                  value={formData.Foreman}
                  onChange={(e) => handleFieldChange("Foreman", e.target.value)}
                />
                {fieldErrors.Foreman && <span className="field-error">{fieldErrors.Foreman}</span>}
              </div>
            </div>

            <div className="df-grid" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Foreman Phone <span className="req-star">*</span></label>
                <input
                  type="text"
                  className={`df-input${fieldErrors.Foreman_Phone_Number ? " field-input-error" : ""}`}
                  placeholder="Enter Foreman Phone"
                  value={formData.Foreman_Phone_Number}
                  onChange={(e) => handleFieldChange("Foreman_Phone_Number", e.target.value)}
                />
                {fieldErrors.Foreman_Phone_Number && <span className="field-error">{fieldErrors.Foreman_Phone_Number}</span>}
              </div>
              <div className="df-field">
                <label className="df-label">Activity <span className="req-star">*</span></label>
                <input
                  type="text"
                  className={`df-input${fieldErrors.Activity ? " field-input-error" : ""}`}
                  placeholder="Enter Activity"
                  value={formData.Activity}
                  onChange={(e) => handleFieldChange("Activity", e.target.value)}
                />
                {fieldErrors.Activity && <span className="field-error">{fieldErrors.Activity}</span>}
              </div>
            </div>

            <div className="df-grid" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Type of Activity <span className="req-star">*</span></label>
                <select
                  className={`df-select${fieldErrors.Type_Of_Activity_Id ? " field-input-error" : ""}`}
                  value={formData.Type_Of_Activity_Id}
                  onChange={(e) => handleFieldChange("Type_Of_Activity_Id", e.target.value)}
                >
                  <option value="">Select Activity Type</option>
                  {activitiesList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.activityName}
                    </option>
                  ))}
                </select>
                {fieldErrors.Type_Of_Activity_Id && <span className="field-error">{fieldErrors.Type_Of_Activity_Id}</span>}
              </div>
              <div className="df-field">
                <label className="df-label">RAMS Number <span className="req-star">*</span></label>
                <input
                  type="text"
                  className={`df-input${fieldErrors.rams_number ? " field-input-error" : ""}`}
                  placeholder="Enter RAMS Number"
                  value={formData.rams_number}
                  onChange={(e) => handleFieldChange("rams_number", e.target.value)}
                />
                {fieldErrors.rams_number && <span className="field-error">{fieldErrors.rams_number}</span>}
              </div>
            </div>

            <div className="df-field" style={{ marginTop: "16px" }}>
              <label className="df-label">Description of Activity <span className="req-star">*</span></label>
              <textarea
                className={`df-textarea${fieldErrors.description_of_activity ? " field-input-error" : ""}`}
                rows={3}
                placeholder="Enter Description of Activity"
                value={formData.description_of_activity}
                onChange={(e) => handleFieldChange("description_of_activity", e.target.value)}
              />
              {fieldErrors.description_of_activity && <span className="field-error">{fieldErrors.description_of_activity}</span>}
            </div>
          </div>

          {/* Attachments Section */}
          <div className="form-card">
            <h2 className="form-card-title">Attachments</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "start" }}>
              <div>
                <button
                  type="button"
                  className="logo-btn-sty"
                  onClick={triggerFileInput}
                >
                  Add Files
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  multiple
                />
              </div>
              <div className="file-list-container">
                {isEditMode ? (
                  existingFiles.map((file, idx) => (
                    <div key={file.id || idx} className="file-item">
                      <a
                        href={getFileUrl(file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#3b82f6", textDecoration: "underline", cursor: "pointer", fontWeight: 500 }}
                      >
                        {file.name || "Attachment"}
                      </a>
                      <button
                        type="button"
                        className="file-remove-btn"
                        onClick={() => handleRemoveFile(idx, file.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  uploadedFiles.map((file, idx) => (
                    <div key={idx} className="file-item">
                      <a
                        href={file instanceof File ? URL.createObjectURL(file) : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#3b82f6", textDecoration: "underline", cursor: "pointer", fontWeight: 500 }}
                      >
                        {file.name}
                      </a>
                      <button
                        type="button"
                        className="file-remove-btn"
                        onClick={() => handleRemoveFile(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
                {isEditMode && existingFiles.length === 0 && (
                  <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "13px" }}>No files uploaded yet.</span>
                )}
                {!isEditMode && uploadedFiles.length === 0 && (
                  <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "13px" }}>No files uploaded yet.</span>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="form-card">
            <h2 className="form-card-title">Schedule & Location</h2>
            <div className="df-grid">
              <div className="df-field">
                <label className="df-label">Date <span className="req-star">*</span></label>
                <input
                  type="date"
                  className={`df-input${fieldErrors.Working_Date ? " field-input-error" : ""}`}
                  value={formData.Working_Date}
                  min={getTodayDateString()}
                  onChange={(e) => {
                    const val = e.target.value;
                    const todayStr = getTodayDateString();
                    if (val && val < todayStr) {
                      setFieldErrors((prev) => ({ ...prev, Working_Date: "Working date cannot be in the past." }));
                      handleFieldChange("Working_Date", "");
                      return;
                    }
                    handleFieldChange("Working_Date", val);
                  }}
                  onClick={(e) => { try { e.target.showPicker(); } catch (err) { void err; } }}
                />
                {fieldErrors.Working_Date && <span className="field-error">{fieldErrors.Working_Date}</span>}
              </div>
              <div className="df-field">
                <label className="df-label">Start Time <span className="req-star">*</span></label>
                <input
                  type="text"
                  placeholder="00:00"
                  readOnly
                  className={`df-input${fieldErrors.Start_Time ? " field-input-error" : ""}`}
                  value={formData.Start_Time}
                  onClick={() => {
                    setTempStartTime(formData.Start_Time || "12:00");
                    setShowStartPicker(true);
                  }}
                  style={{ cursor: 'pointer' }}
                />
                {fieldErrors.Start_Time && <span className="field-error">{fieldErrors.Start_Time}</span>}

                {showStartPicker && (
                  <div className="timekeeper-modal-overlay" onClick={() => setShowStartPicker(false)}>
                    <AnalogTimePicker
                      initialTime={formData.Start_Time || "12:00"}
                      onSave={(newTime) => {
                        handleFieldChange("Start_Time", newTime);
                        setShowStartPicker(false);
                      }}
                      onCancel={() => setShowStartPicker(false)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="df-grid" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">End Time <span className="req-star">*</span></label>
                <input
                  type="text"
                  placeholder="00:00"
                  readOnly
                  className={`df-input${fieldErrors.End_Time ? " field-input-error" : ""}${formData.night_shift ? " df-readonly" : ""}`}
                  value={formData.End_Time}
                  disabled={formData.night_shift}
                  onClick={() => {
                    if (!formData.night_shift) {
                      setTempEndTime(formData.End_Time || "12:00");
                      setShowEndPicker(true);
                    }
                  }}
                  style={{ cursor: formData.night_shift ? 'not-allowed' : 'pointer' }}
                />
                {fieldErrors.End_Time && <span className="field-error">{fieldErrors.End_Time}</span>}

                {showEndPicker && (
                  <div className="timekeeper-modal-overlay" onClick={() => setShowEndPicker(false)}>
                    <AnalogTimePicker
                      initialTime={formData.End_Time || "12:00"}
                      onSave={(newTime) => {
                        handleFieldChange("End_Time", newTime);
                        setShowEndPicker(false);
                      }}
                      onCancel={() => setShowEndPicker(false)}
                    />
                  </div>
                )}
              </div>
              <div className="df-field night-shift-field" style={{ display: "flex", alignItems: "center" }}>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.night_shift}
                    onChange={(e) => handleFieldChange("night_shift", e.target.checked)}
                  />
                  <span className="checkbox-label">Is this working after midnight?</span>
                </label>
              </div>
            </div>

            {formData.night_shift && (
              <div className="df-grid night-shift-subform" style={{ marginTop: "16px" }}>
                <div className="df-field">
                  <label className="df-label">New Date (Working After Midnight) <span className="req-star">*</span></label>
                  <input
                    type="date"
                    className={`df-input${fieldErrors.new_date ? " field-input-error" : ""}${formData.night_shift ? " df-readonly" : ""}`}
                    value={formData.new_date}
                    min={formData.Working_Date || getTodayDateString()}
                    disabled={formData.night_shift}
                    onChange={(e) => {
                      const val = e.target.value;
                      const minDate = formData.Working_Date || getTodayDateString();
                      if (val && val < minDate) {
                        setFieldErrors((prev) => ({ ...prev, new_date: "New date cannot be in the past." }));
                        handleFieldChange("new_date", "");
                        return;
                      }
                      handleFieldChange("new_date", val);
                    }}
                    style={{ cursor: formData.night_shift ? 'not-allowed' : 'default' }}
                  />
                  {fieldErrors.new_date && <span className="field-error">{fieldErrors.new_date}</span>}
                </div>
                <div className="df-field">
                  <label className="df-label">New End Time (Working After Midnight) <span className="req-star">*</span></label>
                  <input
                    type="text"
                    placeholder="00:00"
                    readOnly
                    className={`df-input${fieldErrors.new_end_time ? " field-input-error" : ""}`}
                    value={formData.new_end_time}
                    onClick={() => {
                      setTempNewEndTime(formData.new_end_time || "12:00");
                      setShowNewEndPicker(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  {fieldErrors.new_end_time && <span className="field-error">{fieldErrors.new_end_time}</span>}

                  {showNewEndPicker && (
                    <div className="timekeeper-modal-overlay" onClick={() => setShowNewEndPicker(false)}>
                      <AnalogTimePicker
                        initialTime={formData.new_end_time || "12:00"}
                        onSave={(newTime) => {
                          handleFieldChange("new_end_time", newTime);
                          setShowNewEndPicker(false);
                        }}
                        onCancel={() => setShowNewEndPicker(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="df-grid" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Site</label>
                <input
                  type="text"
                  className="df-input df-readonly"
                  value="M3 South"
                  readOnly
                />
              </div>
              <div className="df-field">
                <label className="df-label">Building</label>
                <input
                  type="text"
                  className="df-input df-readonly"
                  value={selectedBuildingName}
                  readOnly
                />
              </div>
            </div>

            <div className="df-grid" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Level</label>
                <input
                  type="text"
                  className="df-input df-readonly"
                  value={(() => {
                    const selectedLevelNames = Array.from(new Set(selectedRooms.map(r => parseRoomToken(r, level).level))).filter(Boolean);
                    return selectedLevelNames.length > 0 ? selectedLevelNames.join(", ") : (level || "—");
                  })()}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Selected Area / Rooms Card */}
          <div className="form-card" style={{ position: "relative" }}>
            <h2 className="form-card-title">Selected Area / Rooms</h2>

            <div className="df-field" ref={roomsDropdownRef} style={{ position: "relative" }}>
              <label className="df-label">Rooms Selection</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="df-input"
                  style={{ cursor: "pointer", background: "rgba(255, 255, 255, 0.02)" }}
                  placeholder="Click to select rooms..."
                  value={(() => {
                    if (!selectedRooms || selectedRooms.length === 0) return "";
                    return selectedRooms.map(token => {
                      const parsed = parseRoomToken(token, level);
                      if (parsed.level && parsed.zone) {
                        return `${parsed.level}: ${parsed.zone} - ${parsed.roomName}`;
                      } else if (parsed.zone) {
                        return `${parsed.zone} - ${parsed.roomName}`;
                      }
                      return parsed.roomName;
                    }).join(", ");
                  })()}
                  readOnly
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                />
                <i className="ti ti-chevron-down" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", fontSize: "16px" }} />
              </div>

              {isDropdownOpen && allMultiLevelZones.length > 0 && (
                <div className="zone-rooms-dropdown" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px", marginTop: "8px", boxShadow: "var(--shadow-md)", position: "absolute", top: "100%", left: 0, width: "100%", zIndex: 100, maxHeight: "280px", overflowY: "auto" }}>
                  {allMultiLevelZones.map((zGroup) => (
                    <div key={`${zGroup.levelName}:::${zGroup.zoneName}`} style={{ marginBottom: "16px" }}>
                      <div style={{ fontWeight: "bold", color: "var(--color-safe, #00e5a0)", marginBottom: "8px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span>Level {zGroup.levelName} — Zone {zGroup.zoneName}</span>
                        <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "normal" }}>
                          {zGroup.rooms.length} Room{zGroup.rooms.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "8px" }}>
                        {zGroup.rooms.map((room) => {
                          const roomName = typeof room === "object" ? room.name : room;
                          const isChecked = selectedRooms.some(token => {
                            const parsed = parseRoomToken(token, level);
                            return (
                              parsed.level.toLowerCase().trim() === zGroup.levelName.toLowerCase().trim() &&
                              parsed.zone.toLowerCase().trim() === zGroup.zoneName.toLowerCase().trim() &&
                              parsed.roomName.toLowerCase().trim() === roomName.toLowerCase().trim()
                            );
                          });

                          return (
                            <label key={roomName} className="custom-checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                className="custom-checkbox-input"
                                checked={isChecked}
                                onChange={() => toggleRoomSelection(roomName, zGroup.zoneName, zGroup.levelName)}
                              />
                              <span style={{ fontSize: "13px", color: isChecked ? "#60a5fa" : "#d1d5db" }}>
                                {roomName}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tools & Equipment */}
          <div className="form-card">
            <h2 className="form-card-title">Tools & Machinery</h2>
            <div className="df-grid">
              <div className="df-field">
                <label className="df-label">Tools Used <span className="req-star">*</span></label>
                <textarea
                  className={`df-textarea${fieldErrors.Tools ? " field-input-error" : ""}`}
                  rows={2}
                  placeholder="Enter tools to be used..."
                  value={formData.Tools}
                  onChange={(e) => handleFieldChange("Tools", e.target.value)}
                />
                {fieldErrors.Tools && <span className="field-error">{fieldErrors.Tools}</span>}
              </div>
              <div className="df-field">
                <label className="df-label">Machinery Used <span className="req-star">*</span></label>
                <textarea
                  className={`df-textarea${fieldErrors.Machinery ? " field-input-error" : ""}`}
                  rows={2}
                  placeholder="Enter machinery to be used..."
                  value={formData.Machinery}
                  onChange={(e) => handleFieldChange("Machinery", e.target.value)}
                />
                {fieldErrors.Machinery && <span className="field-error">{fieldErrors.Machinery}</span>}
              </div>
            </div>
          </div>

          {/* Type of Work - ONLY shown if permit_type is Commissioning */}
          {formData.permit_type === "Commissioning" && (
            <div className="form-card">
              <h2 className="form-card-title">Type of Work</h2>
              <div className="df-grid">
                <div className="df-field">
                  <label className="df-label">Type of Work <span className="req-star">*</span></label>
                  <select
                    className={`df-select${fieldErrors.work_type ? " field-input-error" : ""}`}
                    value={formData.work_type}
                    onChange={(e) => handleFieldChange("work_type", e.target.value)}
                  >
                    <option value="">Select Type of Work</option>
                    <option value="Electrical Works">Electrical Works</option>
                    <option value="Mechanical Works">Mechanical Works</option>
                  </select>
                  {fieldErrors.work_type && <span className="field-error">{fieldErrors.work_type}</span>}
                </div>

                {formData.work_type === "Electrical Works" && (
                  <>
                    <div className="df-field">
                      <label className="df-label">Electrical Category</label>
                      <select
                        className="df-select"
                        value={electricalCategory}
                        onChange={(e) => {
                          setElectricalCategory(e.target.value);
                          setEleSearch(""); // Reset search query on category switch
                        }}
                      >
                        <option value="">All Categories</option>
                        <option value="Panel Numbers">Panel Numbers</option>
                        <option value="System Numbers">System Numbers</option>
                      </select>
                    </div>

                    <div className="df-field" ref={electricalDropdownRef} style={{ position: "relative" }}>
                      <label className="df-label">Electrical Works <span className="req-star">*</span></label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          className={`df-input${fieldErrors.electrical_works ? " field-input-error" : ""}`}
                          style={{ cursor: "pointer", background: "rgba(255, 255, 255, 0.02)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                          placeholder="Click to select electrical works..."
                          value={
                            formData.electrical_works?.length > 0
                              ? formData.electrical_works.map(id => electricalWorksNamesCache.current[String(id)] || id).join(", ")
                              : ""
                          }
                          readOnly
                          onClick={() => setIsElectricalDropdownOpen(prev => !prev)}
                        />
                        <i className="ti ti-chevron-down" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", fontSize: "16px" }} />
                      </div>
                      {fieldErrors.electrical_works && <span className="field-error">{fieldErrors.electrical_works}</span>}

                      {isElectricalDropdownOpen && (
                        <div className="zone-rooms-dropdown" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px", marginTop: "8px", boxShadow: "var(--shadow-md)", position: "absolute", top: "100%", left: 0, width: "100%", zIndex: 100, maxHeight: "300px", overflowY: "auto" }}>
                          <div style={{ marginBottom: "12px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg-card)" }}>
                            <input
                              type="text"
                              className="df-input"
                              placeholder="Search..."
                              value={eleSearch}
                              onChange={(e) => setEleSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ width: "100%", padding: "8px 12px", fontSize: "13px" }}
                            />
                            {isFetchingEle && (
                              <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
                                <span className="spinner-mini" />
                              </div>
                            )}
                          </div>
                          {groupedElectrical.length > 0 ? (
                            groupedElectrical.map((g) => (
                              <div key={g.module} style={{ marginBottom: "20px" }}>
                                <div style={{ fontWeight: "bold", color: "var(--color-safe, #00e5a0)", marginBottom: "12px", fontSize: "14px", textTransform: "uppercase" }}>
                                  {g.module}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "8px" }}>
                                  {g.items.map((i) => {
                                    const isChecked = (formData.electrical_works || []).includes(String(i.id));
                                    return (
                                      <label key={i.id} className="custom-checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <input
                                          type="checkbox"
                                          className="custom-checkbox-input"
                                          checked={isChecked}
                                          onChange={() => {
                                            const current = formData.electrical_works || [];
                                            const newValues = isChecked
                                              ? current.filter(val => val !== String(i.id))
                                              : [...current, String(i.id)];
                                            handleFieldChange("electrical_works", newValues);
                                          }}
                                        />
                                        <span>{i.name}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: "12px 0", color: "#9ca3af", fontSize: "13px", textAlign: "center" }}>
                              No electrical works found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {formData.work_type === "Mechanical Works" && (
                  <div className="df-field" ref={mechanicalDropdownRef} style={{ position: "relative" }}>
                    <label className="df-label">Mechanical Works <span className="req-star">*</span></label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className={`df-input${fieldErrors.mechanical_works ? " field-input-error" : ""}`}
                        style={{ cursor: "pointer", background: "rgba(255, 255, 255, 0.02)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                        placeholder="Click to select mechanical works..."
                        value={
                          formData.mechanical_works?.length > 0
                            ? formData.mechanical_works.map(id => mechanicalWorksNamesCache.current[String(id)] || id).join(", ")
                            : ""
                        }
                        readOnly
                        onClick={() => setIsMechanicalDropdownOpen(prev => !prev)}
                      />
                      <i className="ti ti-chevron-down" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", fontSize: "16px" }} />
                    </div>
                    {fieldErrors.mechanical_works && <span className="field-error">{fieldErrors.mechanical_works}</span>}

                    {isMechanicalDropdownOpen && (
                      <div className="zone-rooms-dropdown" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px", marginTop: "8px", boxShadow: "var(--shadow-md)", position: "absolute", top: "100%", left: 0, width: "100%", zIndex: 100, maxHeight: "300px", overflowY: "auto" }}>
                        <div style={{ marginBottom: "12px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg-card)" }}>
                          <input
                            type="text"
                            className="df-input"
                            placeholder="Search..."
                            value={mechSearch}
                            onChange={(e) => setMechSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: "100%", padding: "8px 12px", fontSize: "13px" }}
                          />
                          {isFetchingMech && (
                            <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
                              <span className="spinner-mini" />
                            </div>
                          )}
                        </div>
                        {mechanicalWorksOptions.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {mechanicalWorksOptions.map((m) => {
                              const isChecked = (formData.mechanical_works || []).includes(String(m.id));
                              return (
                                <label key={m.id} className="custom-checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <input
                                    type="checkbox"
                                    className="custom-checkbox-input"
                                    checked={isChecked}
                                    onChange={() => {
                                      const current = formData.mechanical_works || [];
                                      const newValues = isChecked
                                        ? current.filter(val => val !== String(m.id))
                                        : [...current, String(m.id)];
                                      handleFieldChange("mechanical_works", newValues);
                                    }}
                                  />
                                  <span>{m.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ padding: "12px 0", color: "#9ca3af", fontSize: "13px", textAlign: "center" }}>
                            No mechanical works found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* General Safety Checklist */}
          <div className="form-card">
            <h2 className="form-card-title">General Safety Checklist</h2>

            <div className="checklist-item">
              <p className="checklist-question">
                1. Can you confirm that your work not affecting with other contractors working in this area before starting the work? <span className="req-star">*</span>
              </p>
              <div className="radio-group">
                <label><input type="radio" name="floatLabel11" value="1" checked={formData.floatLabel11 === "1"} onChange={(e) => handleFieldChange("floatLabel11", e.target.value)} /> Yes</label>
                <label><input type="radio" name="floatLabel11" value="0" checked={formData.floatLabel11 === "0"} onChange={(e) => handleFieldChange("floatLabel11", e.target.value)} /> No</label>
                <label><input type="radio" name="floatLabel11" value="2" checked={formData.floatLabel11 === "2"} onChange={(e) => handleFieldChange("floatLabel11", e.target.value)} /> N/A</label>
              </div>
              {fieldErrors.floatLabel11 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
            </div>

            <div className="checklist-item">
              <p className="checklist-question">
                2. Are there other conditions that must be taken into account during the work? If Yes, note in 'Other conditions' <span className="req-star">*</span>
              </p>
              <div className="radio-group">
                <label><input type="radio" name="floatLabel12" value="1" checked={formData.floatLabel12 === "1"} onChange={(e) => handleFieldChange("floatLabel12", e.target.value)} /> Yes</label>
                <label><input type="radio" name="floatLabel12" value="0" checked={formData.floatLabel12 === "0"} onChange={(e) => handleFieldChange("floatLabel12", e.target.value)} /> No</label>
                <label><input type="radio" name="floatLabel12" value="2" checked={formData.floatLabel12 === "2"} onChange={(e) => handleFieldChange("floatLabel12", e.target.value)} /> N/A</label>
              </div>
              {fieldErrors.floatLabel12 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
              {formData.floatLabel12 === "1" && (
                <div className="df-field" style={{ marginTop: "8px" }}>
                  <label className="df-label">Note the Other Condition</label>
                  <input
                    type="text"
                    className="df-input"
                    placeholder="Enter other conditions..."
                    value={formData.other_conditions_input}
                    onChange={(e) => handleFieldChange("other_conditions_input", e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="checklist-item">
              <p className="checklist-question">
                3. Can you confirm that there will be enough work lighting to begin the work? <span className="req-star">*</span>
              </p>
              <div className="radio-group">
                <label><input type="radio" name="floatLabel13" value="1" checked={formData.floatLabel13 === "1"} onChange={(e) => handleFieldChange("floatLabel13", e.target.value)} /> Yes</label>
                <label><input type="radio" name="floatLabel13" value="0" checked={formData.floatLabel13 === "0"} onChange={(e) => handleFieldChange("floatLabel13", e.target.value)} /> No</label>
                <label><input type="radio" name="floatLabel13" value="2" checked={formData.floatLabel13 === "2"} onChange={(e) => handleFieldChange("floatLabel13", e.target.value)} /> N/A</label>
              </div>
              {fieldErrors.floatLabel13 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
            </div>

            <div className="checklist-item">
              <p className="checklist-question">
                4. Have the team been informed about the specific risks based on task? (RAMS/Toolbox talk etc.) <span className="req-star">*</span>
              </p>
              <div className="radio-group">
                <label><input type="radio" name="floatLabel14" value="1" checked={formData.floatLabel14 === "1"} onChange={(e) => handleFieldChange("floatLabel14", e.target.value)} /> Yes</label>
                <label><input type="radio" name="floatLabel14" value="0" checked={formData.floatLabel14 === "0"} onChange={(e) => handleFieldChange("floatLabel14", e.target.value)} /> No</label>
                <label><input type="radio" name="floatLabel14" value="2" checked={formData.floatLabel14 === "2"} onChange={(e) => handleFieldChange("floatLabel14", e.target.value)} /> N/A</label>
              </div>
              {fieldErrors.floatLabel14 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
            </div>

            <div className="checklist-item">
              <p className="checklist-question">
                5. Is the work environment safety ensured? Have the necessary warning signs been placed? <span className="req-star">*</span>
              </p>
              <div className="radio-group">
                <label><input type="radio" name="floatLabel15" value="1" checked={formData.floatLabel15 === "1"} onChange={(e) => handleFieldChange("floatLabel15", e.target.value)} /> Yes</label>
                <label><input type="radio" name="floatLabel15" value="0" checked={formData.floatLabel15 === "0"} onChange={(e) => handleFieldChange("floatLabel15", e.target.value)} /> No</label>
                <label><input type="radio" name="floatLabel15" value="2" checked={formData.floatLabel15 === "2"} onChange={(e) => handleFieldChange("floatLabel15", e.target.value)} /> N/A</label>
              </div>
              {fieldErrors.floatLabel15 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
            </div>

            <div className="checklist-item">
              <p className="checklist-question">
                6. Have the team been informed about the course of action in any emergency situation? <span className="req-star">*</span>
              </p>
              <div className="radio-group">
                <label><input type="radio" name="floatLabel16" value="1" checked={formData.floatLabel16 === "1"} onChange={(e) => handleFieldChange("floatLabel16", e.target.value)} /> Yes</label>
                <label><input type="radio" name="floatLabel16" value="0" checked={formData.floatLabel16 === "0"} onChange={(e) => handleFieldChange("floatLabel16", e.target.value)} /> No</label>
                <label><input type="radio" name="floatLabel16" value="2" checked={formData.floatLabel16 === "2"} onChange={(e) => handleFieldChange("floatLabel16", e.target.value)} /> N/A</label>
              </div>
              {fieldErrors.floatLabel16 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
            </div>
          </div>

          {/* Safety Options dropdowns with logos on the left */}
          <div className="form-card">
            <h2 className="form-card-title">Safety Precautions & Tasks</h2>

            {/* Hotwork dropdown */}
            <div className="precaution-row">
              <img src={HotWorks} alt="HotWorks" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
              <div className="df-field" style={{ flex: 1 }}>
                <label className="df-label">Is Hotwork Required?</label>
                <select
                  className="df-select"
                  value={formData.Hot_work}
                  onChange={(e) => handleFieldChange("Hot_work", e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
                {fieldErrors.Hot_work && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
              </div>
            </div>

            {formData.Hot_work === "1" && (
              <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                <div className="checklist-item">
                  <p className="checklist-question">
                    Are there other tasks in progress in the area? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel1" value="1" checked={formData.floatLabel1 === "1"} onChange={(e) => handleFieldChange("floatLabel1", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel1" value="0" checked={formData.floatLabel1 === "0"} onChange={(e) => handleFieldChange("floatLabel1", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel1" value="2" checked={formData.floatLabel1 === "2"} onChange={(e) => handleFieldChange("floatLabel1", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel1 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Have you considered any alternative methods to the hot work method? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel3" value="1" checked={formData.floatLabel3 === "1"} onChange={(e) => handleFieldChange("floatLabel3", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel3" value="0" checked={formData.floatLabel3 === "0"} onChange={(e) => handleFieldChange("floatLabel3", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel3" value="2" checked={formData.floatLabel3 === "2"} onChange={(e) => handleFieldChange("floatLabel3", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel3 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Have the team been informed about the specific risks based on task? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel4" value="1" checked={formData.floatLabel4 === "1"} onChange={(e) => handleFieldChange("floatLabel4", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel4" value="0" checked={formData.floatLabel4 === "0"} onChange={(e) => handleFieldChange("floatLabel4", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel4" value="2" checked={formData.floatLabel4 === "2"} onChange={(e) => handleFieldChange("floatLabel4", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel4 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Is the work environment safety ensured? Have the necessary warning signs been placed? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel5" value="1" checked={formData.floatLabel5 === "1"} onChange={(e) => handleFieldChange("floatLabel5", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel5" value="0" checked={formData.floatLabel5 === "0"} onChange={(e) => handleFieldChange("floatLabel5", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel5" value="2" checked={formData.floatLabel5 === "2"} onChange={(e) => handleFieldChange("floatLabel5", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel5 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Have the team been informed about the course of action in emergencies? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel6" value="1" checked={formData.floatLabel6 === "1"} onChange={(e) => handleFieldChange("floatLabel6", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel6" value="0" checked={formData.floatLabel6 === "0"} onChange={(e) => handleFieldChange("floatLabel6", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel6" value="2" checked={formData.floatLabel6 === "2"} onChange={(e) => handleFieldChange("floatLabel6", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel6 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Should a fire watch be established? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel7" value="1" checked={formData.floatLabel7 === "1"} onChange={(e) => handleFieldChange("floatLabel7", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel7" value="0" checked={formData.floatLabel7 === "0"} onChange={(e) => handleFieldChange("floatLabel7", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel7" value="2" checked={formData.floatLabel7 === "2"} onChange={(e) => handleFieldChange("floatLabel7", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel7 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Can you confirm that the flammable material are removed from the work area? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel8" value="1" checked={formData.floatLabel8 === "1"} onChange={(e) => handleFieldChange("floatLabel8", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel8" value="0" checked={formData.floatLabel8 === "0"} onChange={(e) => handleFieldChange("floatLabel8", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel8" value="2" checked={formData.floatLabel8 === "2"} onChange={(e) => handleFieldChange("floatLabel8", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel8 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Should safety measures implemented to stop sparks from splattering on a flooring or other surfaces? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel9" value="1" checked={formData.floatLabel9 === "1"} onChange={(e) => handleFieldChange("floatLabel9", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel9" value="0" checked={formData.floatLabel9 === "0"} onChange={(e) => handleFieldChange("floatLabel9", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel9" value="2" checked={formData.floatLabel9 === "2"} onChange={(e) => handleFieldChange("floatLabel9", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel9 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are fire extinguishers and fire blanket ready for use in the area? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel10" value="1" checked={formData.floatLabel10 === "1"} onChange={(e) => handleFieldChange("floatLabel10", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel10" value="0" checked={formData.floatLabel10 === "0"} onChange={(e) => handleFieldChange("floatLabel10", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel10" value="2" checked={formData.floatLabel10 === "2"} onChange={(e) => handleFieldChange("floatLabel10", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel10 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="df-field" style={{ marginTop: "16px" }}>
                  <label className="df-label">Is there any welding activity?</label>
                  <select
                    className="df-select"
                    value={formData.NEWHOTWORK}
                    onChange={(e) => handleFieldChange("NEWHOTWORK", e.target.value)}
                  >
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                  {fieldErrors.NEWHOTWORK && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                {formData.NEWHOTWORK === "1" && (
                  <div className="welding-subform" style={{ marginTop: "12px", paddingLeft: "16px", borderLeft: "3px solid #2563eb" }}>
                    <div className="checklist-item">
                      <p className="checklist-question">
                        The people who will do heat treatment, had welder certificates? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="NEWHOTWORK1" value="1" checked={formData.NEWHOTWORK1 === "1"} onChange={(e) => handleFieldChange("NEWHOTWORK1", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="NEWHOTWORK1" value="0" checked={formData.NEWHOTWORK1 === "0"} onChange={(e) => handleFieldChange("NEWHOTWORK1", e.target.value)} /> No</label>
                        <label><input type="radio" name="NEWHOTWORK1" value="2" checked={formData.NEWHOTWORK1 === "2"} onChange={(e) => handleFieldChange("NEWHOTWORK1", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.NEWHOTWORK1 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>
                    <div className="checklist-item">
                      <p className="checklist-question">
                        Should air extraction be established? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="NEWHOTWORK2" value="1" checked={formData.NEWHOTWORK2 === "1"} onChange={(e) => handleFieldChange("NEWHOTWORK2", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="NEWHOTWORK2" value="0" checked={formData.NEWHOTWORK2 === "0"} onChange={(e) => handleFieldChange("NEWHOTWORK2", e.target.value)} /> No</label>
                        <label><input type="radio" name="NEWHOTWORK2" value="2" checked={formData.NEWHOTWORK2 === "2"} onChange={(e) => handleFieldChange("NEWHOTWORK2", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.NEWHOTWORK2 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>
                  </div>
                )}

                {/* Hot Work Opening Checklist Display (Visible when viewing opened or closed permit) */}
                {(formData.low_risk_hotwork !== "" || formData.high_risk_hotwork !== "" || (isEditMode && editRequest && (editRequest.Request_status === "Opened" || editRequest.Request_status === "Closed" || editRequest.request_status === "Opened" || editRequest.request_status === "Closed"))) && (
                  <div style={{ border: "1px solid rgba(0, 229, 160, 0.3)", borderRadius: "10px", padding: "16px", background: "rgba(0, 229, 160, 0.04)", marginTop: "20px", marginBottom: "16px" }}>
                    <h3 style={{ color: "#00e5a0", fontSize: "13px", margin: "0 0 14px 0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Hot Work Opening Checklist</h3>

                    <div className="checklist-item" style={{ marginBottom: "12px" }}>
                      <p className="checklist-question">Is it Low Risk Hot Work?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="low_risk_hotwork" value="1" checked={String(formData.low_risk_hotwork) === "1"} disabled={isReadOnly} onChange={(e) => handleFieldChange("low_risk_hotwork", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="low_risk_hotwork" value="0" checked={String(formData.low_risk_hotwork) === "0"} disabled={isReadOnly} onChange={(e) => handleFieldChange("low_risk_hotwork", e.target.value)} /> No</label>
                      </div>
                    </div>

                    <div className="checklist-item" style={{ marginBottom: "12px" }}>
                      <p className="checklist-question">Is it High Risk Hot Work?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="high_risk_hotwork" value="1" checked={String(formData.high_risk_hotwork) === "1"} disabled={isReadOnly} onChange={(e) => handleFieldChange("high_risk_hotwork", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="high_risk_hotwork" value="0" checked={String(formData.high_risk_hotwork) === "0"} disabled={isReadOnly} onChange={(e) => handleFieldChange("high_risk_hotwork", e.target.value)} /> No</label>
                      </div>
                    </div>

                    {String(formData.high_risk_hotwork) === "1" && (
                      <>
                        <div className="checklist-item" style={{ marginBottom: "12px" }}>
                          <p className="checklist-question">Hot Work Checklist Filled?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="hot_work_checklist_filled" value="1" checked={String(formData.hot_work_checklist_filled) === "1"} disabled={isReadOnly} onChange={(e) => handleFieldChange("hot_work_checklist_filled", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="hot_work_checklist_filled" value="0" checked={String(formData.hot_work_checklist_filled) === "0"} disabled={isReadOnly} onChange={(e) => handleFieldChange("hot_work_checklist_filled", e.target.value)} /> No</label>
                          </div>
                        </div>

                        <div className="checklist-item" style={{ marginBottom: "12px" }}>
                          <p className="checklist-question">Fire Guard Present?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="fire_guard_present" value="1" checked={String(formData.fire_guard_present) === "1"} disabled={isReadOnly} onChange={(e) => handleFieldChange("fire_guard_present", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="fire_guard_present" value="0" checked={String(formData.fire_guard_present) === "0"} disabled={isReadOnly} onChange={(e) => handleFieldChange("fire_guard_present", e.target.value)} /> No</label>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Hot Work Closing Workplace Check Display (Visible when viewing closed permit or when closing fields exist) */}
                {(formData.h_heat_source !== "" || formData.h_workplace_check !== "" || formData.h_fire_detectors !== "" || formData.h_start_time || formData.h_end_time || (isEditMode && editRequest && (editRequest.Request_status === "Closed" || editRequest.request_status === "Closed"))) && (
                  <div style={{ border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "10px", padding: "16px", background: "rgba(59, 130, 246, 0.04)", marginTop: "16px", marginBottom: "16px" }}>
                    <h3 style={{ color: "#3b82f6", fontSize: "13px", margin: "0 0 14px 0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Hot Work Closing Workplace Check</h3>

                    <div className="checklist-item" style={{ marginBottom: "12px" }}>
                      <p className="checklist-question">Has the work area been inspected for smoldering materials or residual heat?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="h_heat_source" value="1" checked={String(formData.h_heat_source) === "1"} disabled={isReadOnly} onChange={(e) => handleFieldChange("h_heat_source", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="h_heat_source" value="0" checked={String(formData.h_heat_source) === "0"} disabled={isReadOnly} onChange={(e) => handleFieldChange("h_heat_source", e.target.value)} /> No</label>
                        <label><input type="radio" name="h_heat_source" value="2" checked={String(formData.h_heat_source) === "2"} disabled={isReadOnly} onChange={(e) => handleFieldChange("h_heat_source", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    <div className="checklist-item" style={{ marginBottom: "12px" }}>
                      <p className="checklist-question">Have all tools and hot work equipment been safely removed from the work area?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="h_workplace_check" value="1" checked={String(formData.h_workplace_check) === "1"} disabled={isReadOnly} onChange={(e) => handleFieldChange("h_workplace_check", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="h_workplace_check" value="0" checked={String(formData.h_workplace_check) === "0"} disabled={isReadOnly} onChange={(e) => handleFieldChange("h_workplace_check", e.target.value)} /> No</label>
                        <label><input type="radio" name="h_workplace_check" value="2" checked={String(formData.h_workplace_check) === "2"} disabled={isReadOnly} onChange={(e) => handleFieldChange("h_workplace_check", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    <div className="checklist-item" style={{ marginBottom: "12px" }}>
                      <p className="checklist-question">Has the area been cleaned and restored to its original safe condition?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="h_fire_detectors" value="1" checked={String(formData.h_fire_detectors) === "1"} disabled={isReadOnly} onChange={(e) => handleFieldChange("h_fire_detectors", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="h_fire_detectors" value="0" checked={String(formData.h_fire_detectors) === "0"} disabled={isReadOnly} onChange={(e) => handleFieldChange("h_fire_detectors", e.target.value)} /> No</label>
                        <label><input type="radio" name="h_fire_detectors" value="2" checked={String(formData.h_fire_detectors) === "2"} disabled={isReadOnly} onChange={(e) => handleFieldChange("h_fire_detectors", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    {(formData.h_start_time || formData.h_end_time) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
                        <div>
                          <label className="df-label" style={{ fontSize: "12px", color: "var(--text-muted, #9ca3af)" }}>1hr time check:</label>
                          <input type="text" className="df-input df-readonly" value={formData.h_start_time || "—"} readOnly />
                        </div>
                        <div>
                          <label className="df-label" style={{ fontSize: "12px", color: "var(--text-muted, #9ca3af)" }}>3hrs time check:</label>
                          <input type="text" className="df-input df-readonly" value={formData.h_end_time || "—"} readOnly />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Temporary Electrical Systems dropdown */}
            <div className="precaution-row">
              <img src={ElectricalSystems} alt="ElectricalSystems" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
              <div className="df-field" style={{ flex: 1 }}>
                <label className="df-label">Working on Site Temporary Electrical Systems?</label>
                <select
                  className="df-select"
                  value={formData.working_on_electrical_system}
                  onChange={(e) => handleFieldChange("working_on_electrical_system", e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
                {fieldErrors.working_on_electrical_system && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
              </div>
            </div>

            {formData.working_on_electrical_system === "1" && (
              <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                <div className="checklist-item">
                  <p className="checklist-question">
                    Is the responsible for the area informed? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel17" value="1" checked={formData.floatLabel17 === "1"} onChange={(e) => handleFieldChange("floatLabel17", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel17" value="0" checked={formData.floatLabel17 === "0"} onChange={(e) => handleFieldChange("floatLabel17", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel17" value="2" checked={formData.floatLabel17 === "2"} onChange={(e) => handleFieldChange("floatLabel17", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel17 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Check if the board is de-energized - is it de-energized? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel18" value="1" checked={formData.floatLabel18 === "1"} onChange={(e) => handleFieldChange("floatLabel18", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel18" value="0" checked={formData.floatLabel18 === "0"} onChange={(e) => handleFieldChange("floatLabel18", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel18" value="2" checked={formData.floatLabel18 === "2"} onChange={(e) => handleFieldChange("floatLabel18", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel18 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Secure the area against reconnection using LOTO (Lock-out/Tag-out) with at least a padlock. <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel19" value="1" checked={formData.floatLabel19 === "1"} onChange={(e) => handleFieldChange("floatLabel19", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel19" value="0" checked={formData.floatLabel19 === "0"} onChange={(e) => handleFieldChange("floatLabel19", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel19" value="2" checked={formData.floatLabel19 === "2"} onChange={(e) => handleFieldChange("floatLabel19", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel19 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Do you have risk assessment done (RAMS)? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel20" value="1" checked={formData.floatLabel20 === "1"} onChange={(e) => handleFieldChange("floatLabel20", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel20" value="0" checked={formData.floatLabel20 === "0"} onChange={(e) => handleFieldChange("floatLabel20", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel20" value="2" checked={formData.floatLabel20 === "2"} onChange={(e) => handleFieldChange("floatLabel20", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel20 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Do appliances/devices that run on electricity have insulation? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel22" value="1" checked={formData.floatLabel22 === "1"} onChange={(e) => handleFieldChange("floatLabel22", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel22" value="0" checked={formData.floatLabel22 === "0"} onChange={(e) => handleFieldChange("floatLabel22", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel22" value="2" checked={formData.floatLabel22 === "2"} onChange={(e) => handleFieldChange("floatLabel22", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel22 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>
              </div>
            )}

            {/* Hazardous Substances dropdown */}
            <div className="precaution-row">
              <img src={substanceChemical} alt="Chemicals" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
              <div className="df-field" style={{ flex: 1 }}>
                <label className="df-label">Working with Hazardous Substances/Chemicals?</label>
                <select
                  className="df-select"
                  value={formData.working_hazardious_substen}
                  onChange={(e) => handleFieldChange("working_hazardious_substen", e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>

            {formData.working_hazardious_substen === "1" && (
              <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                <div className="checklist-item">
                  <p className="checklist-question">
                    Relevant MAL-codes and safety datasheets for hazardous medias have been presented? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel24" value="1" checked={formData.floatLabel24 === "1"} onChange={(e) => handleFieldChange("floatLabel24", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel24" value="0" checked={formData.floatLabel24 === "0"} onChange={(e) => handleFieldChange("floatLabel24", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel24" value="2" checked={formData.floatLabel24 === "2"} onChange={(e) => handleFieldChange("floatLabel24", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel24 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Is MSDS (Material Safety Data Sheet) submitted? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel25" value="1" checked={formData.floatLabel25 === "1"} onChange={(e) => handleFieldChange("floatLabel25", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel25" value="0" checked={formData.floatLabel25 === "0"} onChange={(e) => handleFieldChange("floatLabel25", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel25" value="2" checked={formData.floatLabel25 === "2"} onChange={(e) => handleFieldChange("floatLabel25", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel25 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Has the use of protective equipment been taken into account - and are they present? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel26" value="1" checked={formData.floatLabel26 === "1"} onChange={(e) => handleFieldChange("floatLabel26", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel26" value="0" checked={formData.floatLabel26 === "0"} onChange={(e) => handleFieldChange("floatLabel26", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel26" value="2" checked={formData.floatLabel26 === "2"} onChange={(e) => handleFieldChange("floatLabel26", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel26 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Has the use of ventilation been taken into account? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel27" value="1" checked={formData.floatLabel27 === "1"} onChange={(e) => handleFieldChange("floatLabel27", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel27" value="0" checked={formData.floatLabel27 === "0"} onChange={(e) => handleFieldChange("floatLabel27", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel27" value="2" checked={formData.floatLabel27 === "2"} onChange={(e) => handleFieldChange("floatLabel27", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel27 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Will the hazardous substances affect people outside the working area? (fumes) <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel28" value="1" checked={formData.floatLabel28 === "1"} onChange={(e) => handleFieldChange("floatLabel28", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel28" value="0" checked={formData.floatLabel28 === "0"} onChange={(e) => handleFieldChange("floatLabel28", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel28" value="2" checked={formData.floatLabel28 === "2"} onChange={(e) => handleFieldChange("floatLabel28", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel28 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are there means for safe storage and disposal? Is it mapped on the site plan? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel29" value="1" checked={formData.floatLabel29 === "1"} onChange={(e) => handleFieldChange("floatLabel29", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel29" value="0" checked={formData.floatLabel29 === "0"} onChange={(e) => handleFieldChange("floatLabel29", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel29" value="2" checked={formData.floatLabel29 === "2"} onChange={(e) => handleFieldChange("floatLabel29", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel29 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are the spill kits in place and reachable in case of a leak or spill? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel30" value="1" checked={formData.floatLabel30 === "1"} onChange={(e) => handleFieldChange("floatLabel30", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel30" value="0" checked={formData.floatLabel30 === "0"} onChange={(e) => handleFieldChange("floatLabel30", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel30" value="2" checked={formData.floatLabel30 === "2"} onChange={(e) => handleFieldChange("floatLabel30", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel30 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Is RAMS covering chemicals risk assessment for working with the substance? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel31" value="1" checked={formData.floatLabel31 === "1"} onChange={(e) => handleFieldChange("floatLabel31", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel31" value="0" checked={formData.floatLabel31 === "0"} onChange={(e) => handleFieldChange("floatLabel31", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel31" value="2" checked={formData.floatLabel31 === "2"} onChange={(e) => handleFieldChange("floatLabel31", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel31 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>
              </div>
            )}

            {/* Working at Height dropdown */}
            <div className="precaution-row">
              <img src={WorkingAtHight} alt="Working at Height" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
              <div className="df-field" style={{ flex: 1 }}>
                <label className="df-label">WORKING AT HEIGHT?</label>
                <select
                  className="df-select"
                  value={formData.working_at_height}
                  onChange={(e) => handleFieldChange("working_at_height", e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
                {fieldErrors.working_at_height && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
              </div>
            </div>

            {formData.working_at_height === "1" && (
              <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                <div className="checklist-item">
                  <p className="checklist-question">
                    Has the working area been segregated or demarkated with hand barriers? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="segragated_demarkated" value="1" checked={formData.segragated_demarkated === "1"} onChange={(e) => handleFieldChange("segragated_demarkated", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="segragated_demarkated" value="0" checked={formData.segragated_demarkated === "0"} onChange={(e) => handleFieldChange("segragated_demarkated", e.target.value)} /> No</label>
                    <label><input type="radio" name="segragated_demarkated" value="2" checked={formData.segragated_demarkated === "2"} onChange={(e) => handleFieldChange("segragated_demarkated", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.segragated_demarkated && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are suitable anchor points in place for lanyard attachments? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel39" value="1" checked={formData.floatLabel39 === "1"} onChange={(e) => handleFieldChange("floatLabel39", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel39" value="0" checked={formData.floatLabel39 === "0"} onChange={(e) => handleFieldChange("floatLabel39", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel39" value="2" checked={formData.floatLabel39 === "2"} onChange={(e) => handleFieldChange("floatLabel39", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel39 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    In case of emergency is there a rescue plan in place? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel40" value="1" checked={formData.floatLabel40 === "1"} onChange={(e) => handleFieldChange("floatLabel40", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel40" value="0" checked={formData.floatLabel40 === "0"} onChange={(e) => handleFieldChange("floatLabel40", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel40" value="2" checked={formData.floatLabel40 === "2"} onChange={(e) => handleFieldChange("floatLabel40", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel40 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Have the work been planned and coordinated to avoid hazards like (falling objects/materials onto other workers, interference between the machines etc.)? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel41" value="1" checked={formData.floatLabel41 === "1"} onChange={(e) => handleFieldChange("floatLabel41", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel41" value="0" checked={formData.floatLabel41 === "0"} onChange={(e) => handleFieldChange("floatLabel41", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel41" value="2" checked={formData.floatLabel41 === "2"} onChange={(e) => handleFieldChange("floatLabel41", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel41 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Have the team had certified working at height training? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel42" value="1" checked={formData.floatLabel42 === "1"} onChange={(e) => handleFieldChange("floatLabel42", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel42" value="0" checked={formData.floatLabel42 === "0"} onChange={(e) => handleFieldChange("floatLabel42", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel42" value="2" checked={formData.floatLabel42 === "2"} onChange={(e) => handleFieldChange("floatLabel42", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel42 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Will this work be carried out by, and under the supervision of personnel who have received 'Working at Height' training? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel43" value="1" checked={formData.floatLabel43 === "1"} onChange={(e) => handleFieldChange("floatLabel43", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel43" value="0" checked={formData.floatLabel43 === "0"} onChange={(e) => handleFieldChange("floatLabel43", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel43" value="2" checked={formData.floatLabel43 === "2"} onChange={(e) => handleFieldChange("floatLabel43", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel43 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Full body harness with fall-preventing system deployed & twin lanyard provided? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel44" value="1" checked={formData.floatLabel44 === "1"} onChange={(e) => handleFieldChange("floatLabel44", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel44" value="0" checked={formData.floatLabel44 === "0"} onChange={(e) => handleFieldChange("floatLabel44", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel44" value="2" checked={formData.floatLabel44 === "2"} onChange={(e) => handleFieldChange("floatLabel44", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel44 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are the working at height equipments (Safety harness and lanyard) inspected and suitable to carry out the task? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel45" value="1" checked={formData.floatLabel45 === "1"} onChange={(e) => handleFieldChange("floatLabel45", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel45" value="0" checked={formData.floatLabel45 === "0"} onChange={(e) => handleFieldChange("floatLabel45", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel45" value="2" checked={formData.floatLabel45 === "2"} onChange={(e) => handleFieldChange("floatLabel45", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel45 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Horizontal or vertical life line systems in place? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel46" value="1" checked={formData.floatLabel46 === "1"} onChange={(e) => handleFieldChange("floatLabel46", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel46" value="0" checked={formData.floatLabel46 === "0"} onChange={(e) => handleFieldChange("floatLabel46", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel46" value="2" checked={formData.floatLabel46 === "2"} onChange={(e) => handleFieldChange("floatLabel46", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel46 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are all tools secured from falling from height? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel47" value="1" checked={formData.floatLabel47 === "1"} onChange={(e) => handleFieldChange("floatLabel47", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel47" value="0" checked={formData.floatLabel47 === "0"} onChange={(e) => handleFieldChange("floatLabel47", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel47" value="2" checked={formData.floatLabel47 === "2"} onChange={(e) => handleFieldChange("floatLabel47", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel47 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Have protective measures for dropped objects been established (e.g. lanyards, demarcated working area, nets)? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel48" value="1" checked={formData.floatLabel48 === "1"} onChange={(e) => handleFieldChange("floatLabel48", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel48" value="0" checked={formData.floatLabel48 === "0"} onChange={(e) => handleFieldChange("floatLabel48", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel48" value="2" checked={formData.floatLabel48 === "2"} onChange={(e) => handleFieldChange("floatLabel48", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel48 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Has proper and safe access and egress been ensured? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel49" value="1" checked={formData.floatLabel49 === "1"} onChange={(e) => handleFieldChange("floatLabel49", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel49" value="0" checked={formData.floatLabel49 === "0"} onChange={(e) => handleFieldChange("floatLabel49", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel49" value="2" checked={formData.floatLabel49 === "2"} onChange={(e) => handleFieldChange("floatLabel49", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel49 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are the weather conditions acceptable? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel50" value="1" checked={formData.floatLabel50 === "1"} onChange={(e) => handleFieldChange("floatLabel50", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel50" value="0" checked={formData.floatLabel50 === "0"} onChange={(e) => handleFieldChange("floatLabel50", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel50" value="2" checked={formData.floatLabel50 === "2"} onChange={(e) => handleFieldChange("floatLabel50", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel50 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>
              </div>
            )}

            {/* Working in Confined Spaces dropdown */}
            <div className="precaution-row">
              <img src={ConfinedSpace} alt="Confined Spaces" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
              <div className="df-field" style={{ flex: 1 }}>
                <label className="df-label">WORKING IN CONFINED SPACES?</label>
                <select
                  className="df-select"
                  value={formData.working_confined_spaces}
                  onChange={(e) => handleFieldChange("working_confined_spaces", e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>

            {formData.working_confined_spaces === "1" && (
              <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                <div className="checklist-item">
                  <p className="checklist-question">
                    Is the tank/container cleaned so that the task can take place without risk from vapours, gases etc.? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel51" value="1" checked={formData.floatLabel51 === "1"} onChange={(e) => handleFieldChange("floatLabel51", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel51" value="0" checked={formData.floatLabel51 === "0"} onChange={(e) => handleFieldChange("floatLabel51", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel51" value="2" checked={formData.floatLabel51 === "2"} onChange={(e) => handleFieldChange("floatLabel51", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel51 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are oxygen measurement and LEL measurement done before starting the work? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel52" value="1" checked={formData.floatLabel52 === "1"} onChange={(e) => handleFieldChange("floatLabel52", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel52" value="0" checked={formData.floatLabel52 === "0"} onChange={(e) => handleFieldChange("floatLabel52", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel52" value="2" checked={formData.floatLabel52 === "2"} onChange={(e) => handleFieldChange("floatLabel52", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel52 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are the container and all equipment on the container, including agitator properly secured? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel53" value="1" checked={formData.floatLabel53 === "1"} onChange={(e) => handleFieldChange("floatLabel53", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel53" value="0" checked={formData.floatLabel53 === "0"} onChange={(e) => handleFieldChange("floatLabel53", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel53" value="2" checked={formData.floatLabel53 === "2"} onChange={(e) => handleFieldChange("floatLabel53", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel53 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are there safe entry and exit conditions? (e.g. ladder) <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel54" value="1" checked={formData.floatLabel54 === "1"} onChange={(e) => handleFieldChange("floatLabel54", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel54" value="0" checked={formData.floatLabel54 === "0"} onChange={(e) => handleFieldChange("floatLabel54", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel54" value="2" checked={formData.floatLabel54 === "2"} onChange={(e) => handleFieldChange("floatLabel54", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel54 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are means of communication for emergency rescue determined? (Siren, radio or telephone options for emergency rescue?) <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel55" value="1" checked={formData.floatLabel55 === "1"} onChange={(e) => handleFieldChange("floatLabel55", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel55" value="0" checked={formData.floatLabel55 === "0"} onChange={(e) => handleFieldChange("floatLabel55", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel55" value="2" checked={formData.floatLabel55 === "2"} onChange={(e) => handleFieldChange("floatLabel55", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel55 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are rescue equipments in place and ready for use? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel56" value="1" checked={formData.floatLabel56 === "1"} onChange={(e) => handleFieldChange("floatLabel56", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel56" value="0" checked={formData.floatLabel56 === "0"} onChange={(e) => handleFieldChange("floatLabel56", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel56" value="2" checked={formData.floatLabel56 === "2"} onChange={(e) => handleFieldChange("floatLabel56", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel56 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are space and ventilation adequate? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel57" value="1" checked={formData.floatLabel57 === "1"} onChange={(e) => handleFieldChange("floatLabel57", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel57" value="0" checked={formData.floatLabel57 === "0"} onChange={(e) => handleFieldChange("floatLabel57", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel57" value="2" checked={formData.floatLabel57 === "2"} onChange={(e) => handleFieldChange("floatLabel57", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel57 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Is an oxygen meter provided for the work? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel58" value="1" checked={formData.floatLabel58 === "1"} onChange={(e) => handleFieldChange("floatLabel58", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel58" value="0" checked={formData.floatLabel58 === "0"} onChange={(e) => handleFieldChange("floatLabel58", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel58" value="2" checked={formData.floatLabel58 === "2"} onChange={(e) => handleFieldChange("floatLabel58", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel58 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>
              </div>
            )}

            {/* Excavation Works dropdown */}
            <div className="precaution-row">
              <img src={ExcavationWorks} alt="Excavation Works" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
              <div className="df-field" style={{ flex: 1 }}>
                <label className="df-label">EXCAVATION WORKS?</label>
                <select
                  className="df-select"
                  value={formData.excavation_works}
                  onChange={(e) => handleFieldChange("excavation_works", e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
                {fieldErrors.excavation_works && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
              </div>
            </div>

            {formData.excavation_works === "1" && (
              <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                <div className="checklist-item">
                  <p className="checklist-question">
                    Is the excavation area segregated (1 meter from edge with hard barriers or 2 meters with soft barriers) before the work begins? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel71" value="1" checked={formData.floatLabel71 === "1"} onChange={(e) => handleFieldChange("floatLabel71", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel71" value="0" checked={formData.floatLabel71 === "0"} onChange={(e) => handleFieldChange("floatLabel71", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel71" value="2" checked={formData.floatLabel71 === "2"} onChange={(e) => handleFieldChange("floatLabel71", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel71 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Has the digging permit been obtained in accordance with Danish regulations and NN standards? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel72" value="1" checked={formData.floatLabel72 === "1"} onChange={(e) => handleFieldChange("floatLabel72", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel72" value="0" checked={formData.floatLabel72 === "0"} onChange={(e) => handleFieldChange("floatLabel72", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel72" value="2" checked={formData.floatLabel72 === "2"} onChange={(e) => handleFieldChange("floatLabel72", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel72 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Does excavation require shoring? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="excavation_shoring" value="1" checked={formData.excavation_shoring === "1"} onChange={(e) => handleFieldChange("excavation_shoring", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="excavation_shoring" value="0" checked={formData.excavation_shoring === "0"} onChange={(e) => handleFieldChange("excavation_shoring", e.target.value)} /> No</label>
                    <label><input type="radio" name="excavation_shoring" value="2" checked={formData.excavation_shoring === "2"} onChange={(e) => handleFieldChange("excavation_shoring", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.excavation_shoring && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Is the sloping correct in relation to the depth of the dig as per Danish regulations? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel74" value="1" checked={formData.floatLabel74 === "1"} onChange={(e) => handleFieldChange("floatLabel74", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel74" value="0" checked={formData.floatLabel74 === "0"} onChange={(e) => handleFieldChange("floatLabel74", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel74" value="2" checked={formData.floatLabel74 === "2"} onChange={(e) => handleFieldChange("floatLabel74", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel74 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Have proper and safe access and egress been provided? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel75" value="1" checked={formData.floatLabel75 === "1"} onChange={(e) => handleFieldChange("floatLabel75", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel75" value="0" checked={formData.floatLabel75 === "0"} onChange={(e) => handleFieldChange("floatLabel75", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel75" value="2" checked={formData.floatLabel75 === "2"} onChange={(e) => handleFieldChange("floatLabel75", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel75 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are correctly positioned ladders or correctly sloped stairways accessible? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel76" value="1" checked={formData.floatLabel76 === "1"} onChange={(e) => handleFieldChange("floatLabel76", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel76" value="0" checked={formData.floatLabel76 === "0"} onChange={(e) => handleFieldChange("floatLabel76", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel76" value="2" checked={formData.floatLabel76 === "2"} onChange={(e) => handleFieldChange("floatLabel76", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel76 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Do all machines have valid inspection dates? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel77" value="1" checked={formData.floatLabel77 === "1"} onChange={(e) => handleFieldChange("floatLabel77", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel77" value="0" checked={formData.floatLabel77 === "0"} onChange={(e) => handleFieldChange("floatLabel77", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel77" value="2" checked={formData.floatLabel77 === "2"} onChange={(e) => handleFieldChange("floatLabel77", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel77 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Have clearly marked drawings been submitted? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel78" value="1" checked={formData.floatLabel78 === "1"} onChange={(e) => handleFieldChange("floatLabel78", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel78" value="0" checked={formData.floatLabel78 === "0"} onChange={(e) => handleFieldChange("floatLabel78", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel78" value="2" checked={formData.floatLabel78 === "2"} onChange={(e) => handleFieldChange("floatLabel78", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel78 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are the underground areas cleared from all electrical, piping and other services? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel79" value="1" checked={formData.floatLabel79 === "1"} onChange={(e) => handleFieldChange("floatLabel79", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel79" value="0" checked={formData.floatLabel79 === "0"} onChange={(e) => handleFieldChange("floatLabel79", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel79" value="2" checked={formData.floatLabel79 === "2"} onChange={(e) => handleFieldChange("floatLabel79", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel79 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>
              </div>
            )}

            {/* Using Crane or Lifting dropdown */}
            <div className="precaution-row">
              <img src={Craneslifting} alt="Crane Lifting" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
              <div className="df-field" style={{ flex: 1 }}>
                <label className="df-label">USING CRANE OR LIFTING?</label>
                <select
                  className="df-select"
                  value={formData.using_cranes_or_lifting}
                  onChange={(e) => handleFieldChange("using_cranes_or_lifting", e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>

            {formData.using_cranes_or_lifting === "1" && (
              <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                <div className="checklist-item">
                  <p className="checklist-question">
                    Is there an appointed person in charge of the lifting/crane operation? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel80" value="1" checked={formData.floatLabel80 === "1"} onChange={(e) => handleFieldChange("floatLabel80", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel80" value="0" checked={formData.floatLabel80 === "0"} onChange={(e) => handleFieldChange("floatLabel80", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel80" value="2" checked={formData.floatLabel80 === "2"} onChange={(e) => handleFieldChange("floatLabel80", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel80 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Are the details of load (dimensions, SWL) and the loading/unloading requirements provided from vendor or supplier? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel81" value="1" checked={formData.floatLabel81 === "1"} onChange={(e) => handleFieldChange("floatLabel81", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel81" value="0" checked={formData.floatLabel81 === "0"} onChange={(e) => handleFieldChange("floatLabel81", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel81" value="2" checked={formData.floatLabel81 === "2"} onChange={(e) => handleFieldChange("floatLabel81", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel81 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Is lift plan submitted? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel82" value="1" checked={formData.floatLabel82 === "1"} onChange={(e) => handleFieldChange("floatLabel82", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel82" value="0" checked={formData.floatLabel82 === "0"} onChange={(e) => handleFieldChange("floatLabel82", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel82" value="2" checked={formData.floatLabel82 === "2"} onChange={(e) => handleFieldChange("floatLabel82", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel82 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Has the correct crane/lifting equipment as stated in the lift plan been supplied and inspected? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel83" value="1" checked={formData.floatLabel83 === "1"} onChange={(e) => handleFieldChange("floatLabel83", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel83" value="0" checked={formData.floatLabel83 === "0"} onChange={(e) => handleFieldChange("floatLabel83", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel83" value="2" checked={formData.floatLabel83 === "2"} onChange={(e) => handleFieldChange("floatLabel83", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel83 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Do the crane operators have the legal required certificates? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel84" value="1" checked={formData.floatLabel84 === "1"} onChange={(e) => handleFieldChange("floatLabel84", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel84" value="0" checked={formData.floatLabel84 === "0"} onChange={(e) => handleFieldChange("floatLabel84", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel84" value="2" checked={formData.floatLabel84 === "2"} onChange={(e) => handleFieldChange("floatLabel84", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel84 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Is laydown area suitable and prepared for lifting? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel85" value="1" checked={formData.floatLabel85 === "1"} onChange={(e) => handleFieldChange("floatLabel85", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel85" value="0" checked={formData.floatLabel85 === "0"} onChange={(e) => handleFieldChange("floatLabel85", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel85" value="2" checked={formData.floatLabel85 === "2"} onChange={(e) => handleFieldChange("floatLabel85", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel85 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Is the entire area of the lifting task fenced off? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel86" value="1" checked={formData.floatLabel86 === "1"} onChange={(e) => handleFieldChange("floatLabel86", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel86" value="0" checked={formData.floatLabel86 === "0"} onChange={(e) => handleFieldChange("floatLabel86", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel86" value="2" checked={formData.floatLabel86 === "2"} onChange={(e) => handleFieldChange("floatLabel86", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel86 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">
                    Have all overhead risks (cables, adjacent structures etc.) been identified and suitable precautions implemented? <span className="req-star">*</span>
                  </p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel87" value="1" checked={formData.floatLabel87 === "1"} onChange={(e) => handleFieldChange("floatLabel87", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel87" value="0" checked={formData.floatLabel87 === "0"} onChange={(e) => handleFieldChange("floatLabel87", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel87" value="2" checked={formData.floatLabel87 === "2"} onChange={(e) => handleFieldChange("floatLabel87", e.target.value)} /> N/A</label>
                  </div>
                  {fieldErrors.floatLabel87 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>
              </div>
            )}

            {/* pressurization power on dropdown */}
            {formData.permit_type === "Commissioning" && !shouldShowElectricianCert() && (
              <>
                <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center", marginTop: "20px" }}>
                  <img src={electrical_works} alt="electrical_works" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
                  <div className="df-field" style={{ flex: 1 }}>
                    <label className="df-label">Energising, Isolating and Working on Live Electrical Systems</label>
                    <select
                      className="df-select"
                      value={formData.power_on}
                      onChange={(e) => handleFieldChange("power_on", e.target.value)}
                    >
                      <option value="">Select Option</option>
                      {ELECTRICAL_WORKS_SELECT.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.ElectricalWorksval}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.power_on === "1" && (
                  <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                    {/* Energising Electrical Equipment */}
                    <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center" }}>
                      <img src={electrical_works} alt="electrical_works" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
                      <div className="df-field" style={{ flex: 1 }}>
                        <label className="df-label">Energising Electrical Equipment</label>
                        <select
                          className="df-select"
                          value={formData.EnergisingEquipment}
                          onChange={(e) => handleFieldChange("EnergisingEquipment", e.target.value)}
                        >
                          <option value="">Select Option</option>
                          {ENERGISING_EQUIPMENT_SELECT.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.EnergisingEquipmentval}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {formData.EnergisingEquipment === "1" && (
                      <div className="conditional-fields-block" style={{ marginBottom: "20px", paddingLeft: "16px", borderLeft: "3px solid #10b981" }}>
                        <div className="checklist-item">
                          <p className="checklist-question">
                            Is the responsible for the area informed? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel88" value="1" checked={formData.floatLabel88 === "1"} onChange={(e) => handleFieldChange("floatLabel88", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel88" value="0" checked={formData.floatLabel88 === "0"} onChange={(e) => handleFieldChange("floatLabel88", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel88" value="2" checked={formData.floatLabel88 === "2"} onChange={(e) => handleFieldChange("floatLabel88", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel88 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Have you completed a risk assessment? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel89" value="1" checked={formData.floatLabel89 === "1"} onChange={(e) => handleFieldChange("floatLabel89", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel89" value="0" checked={formData.floatLabel89 === "0"} onChange={(e) => handleFieldChange("floatLabel89", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel89" value="2" checked={formData.floatLabel89 === "2"} onChange={(e) => handleFieldChange("floatLabel89", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel89 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Barriers & Signage in place? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel90" value="1" checked={formData.floatLabel90 === "1"} onChange={(e) => handleFieldChange("floatLabel90", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel90" value="0" checked={formData.floatLabel90 === "0"} onChange={(e) => handleFieldChange("floatLabel90", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel90" value="2" checked={formData.floatLabel90 === "2"} onChange={(e) => handleFieldChange("floatLabel90", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel90 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Arc flash boundary and PPE evaluated? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel110" value="1" checked={formData.floatLabel110 === "1"} onChange={(e) => handleFieldChange("floatLabel110", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel110" value="0" checked={formData.floatLabel110 === "0"} onChange={(e) => handleFieldChange("floatLabel110", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel110" value="2" checked={formData.floatLabel110 === "2"} onChange={(e) => handleFieldChange("floatLabel110", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel110 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Have all the cables that need to be energized been tested? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel91" value="1" checked={formData.floatLabel91 === "1"} onChange={(e) => handleFieldChange("floatLabel91", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel91" value="0" checked={formData.floatLabel91 === "0"} onChange={(e) => handleFieldChange("floatLabel91", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel91" value="2" checked={formData.floatLabel91 === "2"} onChange={(e) => handleFieldChange("floatLabel91", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel91 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Have all punches been closed? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel92" value="1" checked={formData.floatLabel92 === "1"} onChange={(e) => handleFieldChange("floatLabel92", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel92" value="0" checked={formData.floatLabel92 === "0"} onChange={(e) => handleFieldChange("floatLabel92", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel92" value="2" checked={formData.floatLabel92 === "2"} onChange={(e) => handleFieldChange("floatLabel92", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel92 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Has the EIC line walk taken place? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel93" value="1" checked={formData.floatLabel93 === "1"} onChange={(e) => handleFieldChange("floatLabel93", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel93" value="0" checked={formData.floatLabel93 === "0"} onChange={(e) => handleFieldChange("floatLabel93", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel93" value="2" checked={formData.floatLabel93 === "2"} onChange={(e) => handleFieldChange("floatLabel93", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel93 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Have you Informed and Aligned with EL LOTO Team and provided them with an energisation request form? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel94" value="1" checked={formData.floatLabel94 === "1"} onChange={(e) => handleFieldChange("floatLabel94", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel94" value="0" checked={formData.floatLabel94 === "0"} onChange={(e) => handleFieldChange("floatLabel94", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel94" value="2" checked={formData.floatLabel94 === "2"} onChange={(e) => handleFieldChange("floatLabel94", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel94 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>
                      </div>
                    )}

                    {/* Isolating Live Electrical Systems */}
                    <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center", marginTop: "20px" }}>
                      <img src={electrical_works} alt="electrical_works" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
                      <div className="df-field" style={{ flex: 1 }}>
                        <label className="df-label">Isolating Live Electrical Systems for Maintenance or Modification</label>
                        <select
                          className="df-select"
                          value={formData.IsolatingLive}
                          onChange={(e) => handleFieldChange("IsolatingLive", e.target.value)}
                        >
                          <option value="">Select Option</option>
                          {ISOLATING_LIVE_SELECT.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.IsolatingLiveval}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {formData.IsolatingLive === "1" && (
                      <div className="conditional-fields-block" style={{ marginBottom: "20px", paddingLeft: "16px", borderLeft: "3px solid #10b981" }}>
                        <div className="checklist-item">
                          <p className="checklist-question">
                            Is the responsible for the area informed? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel111" value="1" checked={formData.floatLabel111 === "1"} onChange={(e) => handleFieldChange("floatLabel111", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel111" value="0" checked={formData.floatLabel111 === "0"} onChange={(e) => handleFieldChange("floatLabel111", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel111" value="2" checked={formData.floatLabel111 === "2"} onChange={(e) => handleFieldChange("floatLabel111", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel111 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Has a Risk Assessment been completed? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel112" value="1" checked={formData.floatLabel112 === "1"} onChange={(e) => handleFieldChange("floatLabel112", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel112" value="0" checked={formData.floatLabel112 === "0"} onChange={(e) => handleFieldChange("floatLabel112", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel112" value="2" checked={formData.floatLabel112 === "2"} onChange={(e) => handleFieldChange("floatLabel112", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel112 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Have C&Q LOTO been informed and tasks co-ordinated for shutdown work? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel113" value="1" checked={formData.floatLabel113 === "1"} onChange={(e) => handleFieldChange("floatLabel113", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel113" value="0" checked={formData.floatLabel113 === "0"} onChange={(e) => handleFieldChange("floatLabel113", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel113" value="2" checked={formData.floatLabel113 === "2"} onChange={(e) => handleFieldChange("floatLabel113", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel113 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Have C&Q LOTO been provided marked up single line diagrams/electrical drawings? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel114" value="1" checked={formData.floatLabel114 === "1"} onChange={(e) => handleFieldChange("floatLabel114", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel114" value="0" checked={formData.floatLabel114 === "0"} onChange={(e) => handleFieldChange("floatLabel114", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel114" value="2" checked={formData.floatLabel114 === "2"} onChange={(e) => handleFieldChange("floatLabel114", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel114 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Has a De-Energisation Request form and supporting documentation been provided to C&Q LOTO? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel115" value="1" checked={formData.floatLabel115 === "1"} onChange={(e) => handleFieldChange("floatLabel115", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel115" value="0" checked={formData.floatLabel115 === "0"} onChange={(e) => handleFieldChange("floatLabel115", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel115" value="2" checked={formData.floatLabel115 === "2"} onChange={(e) => handleFieldChange("floatLabel115", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel115 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Are all barriers, signage and PPE prepared for the task? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel116" value="1" checked={formData.floatLabel116 === "1"} onChange={(e) => handleFieldChange("floatLabel116", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel116" value="0" checked={formData.floatLabel116 === "0"} onChange={(e) => handleFieldChange("floatLabel116", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel116" value="2" checked={formData.floatLabel116 === "2"} onChange={(e) => handleFieldChange("floatLabel116", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel116 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Has absence of voltage been verified and proven dead? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel117" value="1" checked={formData.floatLabel117 === "1"} onChange={(e) => handleFieldChange("floatLabel117", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel117" value="0" checked={formData.floatLabel117 === "0"} onChange={(e) => handleFieldChange("floatLabel117", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel117" value="2" checked={formData.floatLabel117 === "2"} onChange={(e) => handleFieldChange("floatLabel117", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel117 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Has stored energy been discharged? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel118" value="1" checked={formData.floatLabel118 === "1"} onChange={(e) => handleFieldChange("floatLabel118", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel118" value="0" checked={formData.floatLabel118 === "0"} onChange={(e) => handleFieldChange("floatLabel118", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel118" value="2" checked={formData.floatLabel118 === "2"} onChange={(e) => handleFieldChange("floatLabel118", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel118 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Have any secondary or back up power supplies been confirmed and accounted for? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel119" value="1" checked={formData.floatLabel119 === "1"} onChange={(e) => handleFieldChange("floatLabel119", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel119" value="0" checked={formData.floatLabel119 === "0"} onChange={(e) => handleFieldChange("floatLabel119", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel119" value="2" checked={formData.floatLabel119 === "2"} onChange={(e) => handleFieldChange("floatLabel119", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel119 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>
                      </div>
                    )}

                    {/* Working on OR near live electrical systems */}
                    <div className="precaution-row" style={{ marginTop: "20px" }}>
                      <img src={electrical_works} alt="electrical_works" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
                      <div className="df-field" style={{ flex: 1 }}>
                        <label className="df-label">Working on OR near live electrical systems (Live testing, commissioning, fault finding, working inside live enclosures)</label>
                        <select
                          className="df-select"
                          value={formData.WorkingNearLive}
                          onChange={(e) => handleFieldChange("WorkingNearLive", e.target.value)}
                        >
                          <option value="">Select Option</option>
                          {WORKING_NEAR_LIVE_SELECT.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.WorkingNearLiveval}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {formData.WorkingNearLive === "1" && (
                      <div className="conditional-fields-block" style={{ marginBottom: "20px", paddingLeft: "16px", borderLeft: "3px solid #10b981" }}>
                        <div className="checklist-item">
                          <p className="checklist-question">
                            Live work is unavoidable and justified? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel120" value="1" checked={formData.floatLabel120 === "1"} onChange={(e) => handleFieldChange("floatLabel120", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel120" value="0" checked={formData.floatLabel120 === "0"} onChange={(e) => handleFieldChange("floatLabel120", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel120" value="2" checked={formData.floatLabel120 === "2"} onChange={(e) => handleFieldChange("floatLabel120", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel120 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            De-energisation is not reasonably practicable? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel121" value="1" checked={formData.floatLabel121 === "1"} onChange={(e) => handleFieldChange("floatLabel121", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel121" value="0" checked={formData.floatLabel121 === "0"} onChange={(e) => handleFieldChange("floatLabel121", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel121" value="2" checked={formData.floatLabel121 === "2"} onChange={(e) => handleFieldChange("floatLabel121", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel121 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Live work authorised by electrical responsible person? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel122" value="1" checked={formData.floatLabel122 === "1"} onChange={(e) => handleFieldChange("floatLabel122", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel122" value="0" checked={formData.floatLabel122 === "0"} onChange={(e) => handleFieldChange("floatLabel122", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel122" value="2" checked={formData.floatLabel122 === "2"} onChange={(e) => handleFieldChange("floatLabel122", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel122 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Risk assessment has been completed? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel123" value="1" checked={formData.floatLabel123 === "1"} onChange={(e) => handleFieldChange("floatLabel123", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel123" value="0" checked={formData.floatLabel123 === "0"} onChange={(e) => handleFieldChange("floatLabel123", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel123" value="2" checked={formData.floatLabel123 === "2"} onChange={(e) => handleFieldChange("floatLabel123", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel123 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Arc flash boundary and PPE evaluated? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel124" value="1" checked={formData.floatLabel124 === "1"} onChange={(e) => handleFieldChange("floatLabel124", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel124" value="0" checked={formData.floatLabel124 === "0"} onChange={(e) => handleFieldChange("floatLabel124", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel124" value="2" checked={formData.floatLabel124 === "2"} onChange={(e) => handleFieldChange("floatLabel124", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel124 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Barriers and Signage in place? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel125" value="1" checked={formData.floatLabel125 === "1"} onChange={(e) => handleFieldChange("floatLabel125", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel125" value="0" checked={formData.floatLabel125 === "0"} onChange={(e) => handleFieldChange("floatLabel125", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel125" value="2" checked={formData.floatLabel125 === "2"} onChange={(e) => handleFieldChange("floatLabel125", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel125 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Insulated tools and approved test equipment to be used? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel126" value="1" checked={formData.floatLabel126 === "1"} onChange={(e) => handleFieldChange("floatLabel126", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel126" value="0" checked={formData.floatLabel126 === "0"} onChange={(e) => handleFieldChange("floatLabel126", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel126" value="2" checked={formData.floatLabel126 === "2"} onChange={(e) => handleFieldChange("floatLabel126", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel126 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">
                            Work will always be carried out with a second person to assist in the event of an emergency? <span className="req-star">*</span>
                          </p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel127" value="1" checked={formData.floatLabel127 === "1"} onChange={(e) => handleFieldChange("floatLabel127", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel127" value="0" checked={formData.floatLabel127 === "0"} onChange={(e) => handleFieldChange("floatLabel127", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel127" value="2" checked={formData.floatLabel127 === "2"} onChange={(e) => handleFieldChange("floatLabel127", e.target.value)} /> N/A</label>
                          </div>
                          {fieldErrors.floatLabel127 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* pressurization starts */}
            {formData.permit_type === "Commissioning" && !shouldShowElectricianCert() && (
              <>
                <div className="precaution-row" style={{ marginTop: "20px" }}>
                  <img src={mechanical1} alt="mechanical1" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
                  <div className="df-field" style={{ flex: 1 }}>
                    <label className="df-label">Energization of Mechanical equipment</label>
                    <select
                      className="df-select"
                      value={formData.pressurization}
                      onChange={(e) => handleFieldChange("pressurization", e.target.value)}
                    >
                      <option value="">Select Option</option>
                      {MECHANICAL_WORKS_SELECT.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.MechanicalWorksval}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.pressurization === "1" && (
                  <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                    <div className="checklist-item">
                      <p className="checklist-question">
                        Pressure test performed and approved? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel95" value="1" checked={formData.floatLabel95 === "1"} onChange={(e) => handleFieldChange("floatLabel95", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel95" value="0" checked={formData.floatLabel95 === "0"} onChange={(e) => handleFieldChange("floatLabel95", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel95" value="2" checked={formData.floatLabel95 === "2"} onChange={(e) => handleFieldChange("floatLabel95", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel95 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">
                        Flushing approved? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel96" value="1" checked={formData.floatLabel96 === "1"} onChange={(e) => handleFieldChange("floatLabel96", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel96" value="0" checked={formData.floatLabel96 === "0"} onChange={(e) => handleFieldChange("floatLabel96", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel96" value="2" checked={formData.floatLabel96 === "2"} onChange={(e) => handleFieldChange("floatLabel96", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel96 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">
                        MC approved? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel97" value="1" checked={formData.floatLabel97 === "1"} onChange={(e) => handleFieldChange("floatLabel97", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel97" value="0" checked={formData.floatLabel97 === "0"} onChange={(e) => handleFieldChange("floatLabel97", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel97" value="2" checked={formData.floatLabel97 === "2"} onChange={(e) => handleFieldChange("floatLabel97", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel97 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>

                    {formData.floatLabel97 === "1" && (
                      <div className="df-field" style={{ marginTop: "12px", marginBottom: "16px", paddingLeft: "16px" }}>
                        <label className="df-label">MC Number <span className="df-required">*</span></label>
                        <input
                          type="text"
                          className="df-input"
                          placeholder="MC number Required"
                          value={formData.mc_number_text}
                          onChange={(e) => handleFieldChange("mc_number_text", e.target.value)}
                        />
                      </div>
                    )}

                    <div className="checklist-item">
                      <p className="checklist-question">
                        Walkdown with Visual inspection performed? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel98" value="1" checked={formData.floatLabel98 === "1"} onChange={(e) => handleFieldChange("floatLabel98", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel98" value="0" checked={formData.floatLabel98 === "0"} onChange={(e) => handleFieldChange("floatLabel98", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel98" value="2" checked={formData.floatLabel98 === "2"} onChange={(e) => handleFieldChange("floatLabel98", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel98 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">
                        LOTO plan approved and installed by LOTO officer? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel99" value="1" checked={formData.floatLabel99 === "1"} onChange={(e) => handleFieldChange("floatLabel99", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel99" value="0" checked={formData.floatLabel99 === "0"} onChange={(e) => handleFieldChange("floatLabel99", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel99" value="2" checked={formData.floatLabel99 === "2"} onChange={(e) => handleFieldChange("floatLabel99", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel99 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">
                        Ensure Safety Valves follow Media Code? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel100" value="1" checked={formData.floatLabel100 === "1"} onChange={(e) => handleFieldChange("floatLabel100", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel100" value="0" checked={formData.floatLabel100 === "0"} onChange={(e) => handleFieldChange("floatLabel100", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel100" value="2" checked={formData.floatLabel100 === "2"} onChange={(e) => handleFieldChange("floatLabel100", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel100 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">
                        C&Q Safety signs are in place? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel101" value="1" checked={formData.floatLabel101 === "1"} onChange={(e) => handleFieldChange("floatLabel101", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel101" value="0" checked={formData.floatLabel101 === "0"} onChange={(e) => handleFieldChange("floatLabel101", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel101" value="2" checked={formData.floatLabel101 === "2"} onChange={(e) => handleFieldChange("floatLabel101", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel101 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Pressure Testing dropdown */}
            {formData.permit_type === "Commissioning" && !shouldShowElectricianCert() && (
              <>
                <div className="precaution-row" style={{ marginTop: "20px" }}>
                  <img src={testingequipment} alt="testingequipment" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
                  <div className="df-field" style={{ flex: 1 }}>
                    <label className="df-label">PRESSURE TESTING OF EQUIPMENT REQUIRED?</label>
                    <select
                      className="df-select"
                      value={formData.pressure_testing_of_equipment}
                      onChange={(e) => handleFieldChange("pressure_testing_of_equipment", e.target.value)}
                    >
                      <option value="">Select Option</option>
                      {TESTINGS_SELECT.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.TESTINGsval}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.pressure_testing_of_equipment === "1" && (
                  <div className="conditional-fields-block" style={{ marginBottom: "20px", marginTop: "20px" }}>
                    <div className="checklist-item">
                      <p className="checklist-question">
                        Linewalk of the pipework/equipment done? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel102" value="1" checked={formData.floatLabel102 === "1"} onChange={(e) => handleFieldChange("floatLabel102", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel102" value="0" checked={formData.floatLabel102 === "0"} onChange={(e) => handleFieldChange("floatLabel102", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel102" value="2" checked={formData.floatLabel102 === "2"} onChange={(e) => handleFieldChange("floatLabel102", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel102 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">
                        Pressure test is coordinated with NNE C&Q? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel103" value="1" checked={formData.floatLabel103 === "1"} onChange={(e) => handleFieldChange("floatLabel103", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel103" value="0" checked={formData.floatLabel103 === "0"} onChange={(e) => handleFieldChange("floatLabel103", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel103" value="2" checked={formData.floatLabel103 === "2"} onChange={(e) => handleFieldChange("floatLabel103", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel103 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">
                        Is the pipework/equipment MIC? (Mechanical Installation Complete)? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel104" value="1" checked={formData.floatLabel104 === "1"} onChange={(e) => handleFieldChange("floatLabel104", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel104" value="0" checked={formData.floatLabel104 === "0"} onChange={(e) => handleFieldChange("floatLabel104", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel104" value="2" checked={formData.floatLabel104 === "2"} onChange={(e) => handleFieldChange("floatLabel104", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel104 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">
                        LOTO plan attached to the work permit? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel105" value="1" checked={formData.floatLabel105 === "1"} onChange={(e) => handleFieldChange("floatLabel105", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel105" value="0" checked={formData.floatLabel105 === "0"} onChange={(e) => handleFieldChange("floatLabel105", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel105" value="2" checked={formData.floatLabel105 === "2"} onChange={(e) => handleFieldChange("floatLabel105", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel105 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">
                        Is the exclusion zone calculated and layout attached to work permit? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel106" value="1" checked={formData.floatLabel106 === "1"} onChange={(e) => handleFieldChange("floatLabel106", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel106" value="0" checked={formData.floatLabel106 === "0"} onChange={(e) => handleFieldChange("floatLabel106", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel106" value="2" checked={formData.floatLabel106 === "2"} onChange={(e) => handleFieldChange("floatLabel106", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel106 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">
                        Pneumatic Test? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel107" disabled={formData.floatLabel108 === "1"} value="1" checked={formData.floatLabel107 === "1"} onChange={(e) => handleFieldChange("floatLabel107", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel107" value="0" checked={formData.floatLabel107 === "0"} onChange={(e) => handleFieldChange("floatLabel107", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel107" value="2" checked={formData.floatLabel107 === "2"} onChange={(e) => handleFieldChange("floatLabel107", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel107 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>

                    {formData.floatLabel107 === "1" && (
                      <div className="df-field" style={{ marginTop: "8px", marginBottom: "16px" }}>
                        <label className="df-label">Pressure of Pneumatic Test (in BarG)</label>
                        <input
                          type="text"
                          className="df-input"
                          placeholder="Provide the pressure value"
                          value={formData.pressure_pneumatic}
                          onChange={(e) => handleFieldChange("pressure_pneumatic", e.target.value)}
                        />
                      </div>
                    )}

                    <div className="checklist-item">
                      <p className="checklist-question">
                        Hydrostatic test? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel108" disabled={formData.floatLabel107 === "1"} value="1" checked={formData.floatLabel108 === "1"} onChange={(e) => handleFieldChange("floatLabel108", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel108" value="0" checked={formData.floatLabel108 === "0"} onChange={(e) => handleFieldChange("floatLabel108", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel108" value="2" checked={formData.floatLabel108 === "2"} onChange={(e) => handleFieldChange("floatLabel108", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel108 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>

                    {formData.floatLabel108 === "1" && (
                      <div className="df-field" style={{ marginTop: "8px", marginBottom: "16px" }}>
                        <label className="df-label">Pressure of Hydrostatic Test (in BarG)</label>
                        <input
                          type="text"
                          className="df-input"
                          placeholder="Provide the pressure value"
                          value={formData.pressure_hydrostatic}
                          onChange={(e) => handleFieldChange("pressure_hydrostatic", e.target.value)}
                        />
                      </div>
                    )}

                    <div className="checklist-item">
                      <p className="checklist-question">
                        Safety Valves are calibrated and attached to the Pressure testing rig? <span className="req-star">*</span>
                      </p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel109" value="1" checked={formData.floatLabel109 === "1"} onChange={(e) => handleFieldChange("floatLabel109", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel109" value="0" checked={formData.floatLabel109 === "0"} onChange={(e) => handleFieldChange("floatLabel109", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel109" value="2" checked={formData.floatLabel109 === "2"} onChange={(e) => handleFieldChange("floatLabel109", e.target.value)} /> N/A</label>
                      </div>
                      {fieldErrors.floatLabel109 && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* PPE Section */}
          <div className="form-card">
            <h2 className="form-card-title">PPE Requirements</h2>

            <div style={{ marginBottom: "20px" }}>
              <label className="df-label" style={{ marginBottom: "12px" }}>Mandatory PPE Required:</label>
              <div className="ppe-mandatory-row">
                <img src={HardHat} alt="HardHat" className="ppe-mandatory-icon" />
                <img src={SpecificGloves} alt="SpecificGloves" className="ppe-mandatory-icon" />
                <img src={Safetyshoes} alt="Safety Shoes" className="ppe-mandatory-icon" />
                <img src={HighVisibility} alt="High Visibility" className="ppe-mandatory-icon" />
                <img src={Longpants} alt="Long Pants" className="ppe-mandatory-icon" />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label className="df-label" style={{ marginBottom: "16px" }}>Task Specific PPE Required: <span className="req-star">*</span></label>
              <div className="ppe-grid">

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <img src={Eyeprotection} alt="Eye Protection" style={{ width: "64px", height: "64px", marginBottom: "8px" }} />
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>Eye Protection</span>
                  <div className="radio-group">
                    <label><input type="radio" name="eye_protection" value="1" checked={formData.eye_protection === "1"} onChange={(e) => handleFieldChange("eye_protection", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="eye_protection" value="0" checked={formData.eye_protection === "0"} onChange={(e) => handleFieldChange("eye_protection", e.target.value)} /> No</label>
                  </div>
                  {fieldErrors.eye_protection && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <img src={Fallprotection} alt="Fall Protection" style={{ width: "64px", height: "64px", marginBottom: "8px" }} />
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>Fall Protection</span>
                  <div className="radio-group">
                    <label><input type="radio" name="fall_protection" value="1" checked={formData.fall_protection === "1"} onChange={(e) => handleFieldChange("fall_protection", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="fall_protection" value="0" checked={formData.fall_protection === "0"} onChange={(e) => handleFieldChange("fall_protection", e.target.value)} /> No</label>
                  </div>
                  {fieldErrors.fall_protection && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <img src={Hearingprotection} alt="Hearing Protection" style={{ width: "64px", height: "64px", marginBottom: "8px" }} />
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>Hearing Protection</span>
                  <div className="radio-group">
                    <label><input type="radio" name="hearing_protection" value="1" checked={formData.hearing_protection === "1"} onChange={(e) => handleFieldChange("hearing_protection", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="hearing_protection" value="0" checked={formData.hearing_protection === "0"} onChange={(e) => handleFieldChange("hearing_protection", e.target.value)} /> No</label>
                  </div>
                  {fieldErrors.hearing_protection && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <img src={Respiratoryprotection} alt="Respiratory Protection" style={{ width: "64px", height: "64px", marginBottom: "8px" }} />
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>Respiratory Protection</span>
                  <div className="radio-group">
                    <label><input type="radio" name="respiratory_protection" value="1" checked={formData.respiratory_protection === "1"} onChange={(e) => handleFieldChange("respiratory_protection", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="respiratory_protection" value="0" checked={formData.respiratory_protection === "0"} onChange={(e) => handleFieldChange("respiratory_protection", e.target.value)} /> No</label>
                  </div>
                  {fieldErrors.respiratory_protection && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>Please Select</span>}
                </div>

              </div>
            </div>

            <div className="df-field" style={{ marginTop: "16px" }}>
              <label className="df-label">Other PPE <span className="req-star">*</span></label>
              <textarea
                className={`df-textarea${fieldErrors.other_ppe ? " field-input-error" : ""}`}
                rows={2}
                placeholder="Enter other PPE details..."
                value={formData.other_ppe}
                onChange={(e) => handleFieldChange("other_ppe", e.target.value)}
              />
              {fieldErrors.other_ppe && <span className="field-error">{fieldErrors.other_ppe}</span>}
            </div>

            <div className="df-field" style={{ marginTop: "16px" }}>
              <label className="df-label">Number of workers involved <span className="req-star">*</span></label>
              <input
                type="text"
                className={`df-input${fieldErrors.Number_Of_Workers ? " field-input-error" : ""}`}
                placeholder="Enter number of workers"
                value={formData.Number_Of_Workers}
                onChange={(e) => handleFieldChange("Number_Of_Workers", e.target.value)}
              />
              {fieldErrors.Number_Of_Workers && <span className="field-error">{fieldErrors.Number_Of_Workers}</span>}
            </div>

            {isEditMode && notesHistory.length > 0 && (
              <div className="notes-history-section" style={{ marginTop: "16px", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <h4 style={{ color: "#fff", marginBottom: "8px", fontSize: "14px" }}>Notes History</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                  {notesHistory.map((n, idx) => (
                    <div key={idx} style={{ padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: "4px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ color: "#3b82f6", fontSize: "12px" }}>{n.Username}:</strong>
                        <p style={{ color: "#d1d5db", fontSize: "13px", margin: "2px 0 0 0", wordBreak: "break-word" }}>{n.Note}</p>
                      </div>
                      {canDeleteNotes && n.id && (
                        <button
                          type="button"
                          title="Delete note"
                          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", color: "#ef4444", cursor: "pointer", padding: "2px 8px", fontSize: "13px", lineHeight: 1.5, flexShrink: 0, transition: "background 0.15s" }}
                          onMouseOver={e => e.currentTarget.style.background = "rgba(239,68,68,0.25)"}
                          onMouseOut={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
                          onClick={async () => {
                            try {
                              await deleteListReqstNote(n.id);
                              setNotesHistory(prev => prev.filter((_, i) => i !== idx));
                            } catch (err) {
                              console.error("Failed to delete note", err);
                            }
                          }}
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isEditMode && String(editRequest?.Request_status || editRequest?.request_status || "").trim().toLowerCase() !== "draft" && (
              <div ref={precautionsDropdownRef} className="df-field" style={{ position: "relative", marginTop: "16px" }}>
                <label className="df-label">Safety Precautions</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="df-input"
                    style={{ cursor: "pointer", background: "rgba(255, 255, 255, 0.02)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    placeholder="Click to select safety precautions..."
                    value={
                      formData.Safety_Precautions?.length > 0
                        ? formData.Safety_Precautions.map(id => precautionsList.find(x => String(x.id) === String(id))?.precaution || id).join(", ")
                        : ""
                    }
                    readOnly
                    onClick={() => setIsPrecautionsDropdownOpen(prev => !prev)}
                  />
                  <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", fontSize: "10px" }}>
                    ▼
                  </span>
                </div>

                {isPrecautionsDropdownOpen && precautionsList.length > 0 && (
                  <div className="zone-rooms-dropdown" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px", marginTop: "8px", boxShadow: "var(--shadow-md)", position: "absolute", top: "100%", left: 0, width: "100%", zIndex: 100, maxHeight: "250px", overflowY: "auto" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {precautionsList.map((p) => {
                        const isChecked = (formData.Safety_Precautions || []).includes(String(p.id));
                        return (
                          <label key={p.id} className="custom-checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                              type="checkbox"
                              className="custom-checkbox-input"
                              checked={isChecked}
                              onChange={() => {
                                const current = formData.Safety_Precautions || [];
                                const newValues = isChecked
                                  ? current.filter(val => val !== String(p.id))
                                  : [...current, String(p.id)];
                                handleFieldChange("Safety_Precautions", newValues);
                              }}
                            />
                            <span>{p.precaution}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="df-field" style={{ marginTop: "16px" }}>
              <label className="df-label">{isEditMode ? "Add New Note" : "Note"}</label>
              <textarea
                className={`df-textarea${fieldErrors.notes ? " field-input-error" : ""}`}
                rows={3}
                placeholder="Notes...."
                value={formData.notes}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
              />
              {fieldErrors.notes && <span className="field-error">{fieldErrors.notes}</span>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="df-footer" style={{ marginTop: "24px" }}>
            {isEditMode ? (
              editRequest?.Request_status === "Draft" ? (
                <>
                  <button
                    type="button"
                    className="nr-btn nr-btn--ghost"
                    onClick={() => navigate("/list-request")}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="nr-btn nr-btn--ghost"
                    style={{ background: "#2563eb", color: "#fff", borderColor: "#2563eb", boxShadow: "0 0 18px rgba(37, 99, 235, 0.2)" }}
                    onClick={(e) => { if (validateHoldFields()) handleSubmit(e, "Hold"); }}
                  >
                    Change to Hold
                  </button>
                  <button
                    type="button"
                    className="nr-btn nr-btn--primary"
                    onClick={(e) => handleSubmit(e, "Draft")}
                  >
                    Save as Draft
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="nr-btn nr-btn--ghost"
                    onClick={() => navigate("/list-request")}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="nr-btn nr-btn--primary"
                    onClick={(e) => handleSubmit(e, editRequest?.Request_status || "Draft")}
                  >
                    Update
                  </button>
                </>
              )
            ) : (
              <>
                <button
                  type="button"
                  className="nr-btn nr-btn--ghost"
                  onClick={() => setIsnewrequestcreated(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="nr-btn nr-btn--ghost"
                  style={{ background: "#2563eb", color: "#fff", borderColor: "#2563eb", boxShadow: "0 0 18px rgba(37, 99, 235, 0.2)" }}
                  onClick={(e) => {
                    if (validateHoldFields()) {
                      setShowRamsHoldModal(true);
                    }
                  }}
                >
                  Change to Hold
                </button>
                <button
                  type="button"
                  className="nr-btn nr-btn--primary"
                  onClick={(e) => handleSubmit(e, "Draft")}
                >
                  Save
                </button>
              </>
            )}
          </div>
        </form>

        <Modal
          open={showRamsHoldModal}
          onClose={() => setShowRamsHoldModal(false)}
          title="RAMS Confirmation"
          size="sm"
          centered={true}
        >
          <div className="df-form" style={{ padding: "8px 0" }}>
            <p style={{ color: "var(--text-main, inherit)", fontSize: "15px", marginBottom: "24px", lineHeight: "1.5" }}>
              Can you confirm the RAMS for this work is approved by ConM/HSE?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                className="nr-btn nr-btn--primary"
                style={{ padding: "8px 24px" }}
                onClick={(e) => {
                  setShowRamsHoldModal(false);
                  handleSubmit(e, "Hold");
                }}
              >
                Yes
              </button>
              <button
                type="button"
                className="nr-btn nr-btn--ghost"
                style={{ padding: "8px 24px" }}
                onClick={(e) => {
                  setShowRamsHoldModal(false);
                  handleSubmit(e, "Draft");
                }}
              >
                No
              </button>
            </div>
          </div>
        </Modal>

        {/* Fullscreen Overlay Loader when submitting permit */}
        {isSubmittingPermit && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
            color: "#ffffff"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              border: "4px solid rgba(0, 229, 160, 0.2)",
              borderTop: "4px solid #00e5a0",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              marginBottom: "20px"
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px", color: "#f9fafb" }}>
              {isEditMode ? "Updating Work Permit Request..." : "Creating Work Permit Request..."}
            </h3>
            <p style={{ fontSize: "14px", color: "#9ca3af" }}>
              Please wait while the permit request is being processed...
            </p>
          </div>
        )}
      </div>

    );
  }

  return (
    <div className="dept-page">
      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">New Work Permit Request</h1>
        </div>
        {selectedRooms.length > 0 && (
          <div className="butns-grp-back">
            <button
              className="nr-btn nr-btn--primary"
              onClick={() => setIsnewrequestcreated(true)}
            >
              Continue to Form →
            </button>
          </div>
        )}
      </div>

      <div className="dept-table-card">
        <div className="df-form">
          <div className="df-grid">
            <div className="df-field">
              <label className="df-label">Building</label>
              <select
                className="df-select"
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

            <div className="df-field">
              <label className="df-label">Level</label>
              <select
                className="df-select"
                value={level}
                disabled={!building}
                onChange={(e) => {
                  setLevel(e.target.value);
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
        </div>
      </div>

      {/* Multi-Level Chips Navigation */}
      {building && levels.length > 0 && (
        <div style={{ margin: "16px 0", padding: "14px 20px", background: "rgba(30, 41, 59, 0.7)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(6px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              🏢 Select Level to View Floor Plan
            </span>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>
              {selectedRooms.length} room{selectedRooms.length !== 1 ? "s" : ""} selected across {
                Array.from(new Set(selectedRooms.map(r => parseRoomToken(r, level).level))).filter(Boolean).length
              } level{Array.from(new Set(selectedRooms.map(r => parseRoomToken(r, level).level))).filter(Boolean).length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {levels.map((item) => {
              const isActive = level === item;
              const countOnLevel = selectedRooms.filter(r => {
                const parsed = parseRoomToken(r, level);
                return parsed.level.toLowerCase().trim() === item.toLowerCase().trim();
              }).length;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setLevel(item);
                    setSelectedZone(null);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: isActive ? "1px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.12)",
                    background: isActive ? "rgba(59, 130, 246, 0.25)" : "rgba(255, 255, 255, 0.04)",
                    color: isActive ? "#60a5fa" : "#d1d5db"
                  }}
                >
                  <span>{item}</span>
                  {countOnLevel > 0 && (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: isActive ? "#2563eb" : "#10b981",
                      color: "#ffffff"
                    }}>
                      {countOnLevel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Level Selected Rooms Breakdown Panel */}
      {selectedRooms.length > 0 && (
        <div style={{ marginBottom: "16px", padding: "16px 20px", background: "rgba(17, 24, 39, 0.85)", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "10px" }}>
            <h4 style={{ margin: 0, color: "#fff", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Selected Locations Breakdown</span>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                {selectedRooms.length} Total Room{selectedRooms.length !== 1 ? "s" : ""}
              </span>
            </h4>
            <button
              type="button"
              onClick={() => setSelectedRooms([])}
              style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
            >
              Clear All Selections
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Object.entries(
              selectedRooms.reduce((acc, token) => {
                const parsed = parseRoomToken(token, level);
                const lName = parsed.level || "Unspecified Level";
                if (!acc[lName]) acc[lName] = [];
                acc[lName].push(token);
                return acc;
              }, {})
            ).map(([lvlName, tokens]) => (
              <div key={lvlName} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", padding: "8px 12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#60a5fa", minWidth: "90px" }}>
                  {lvlName}:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", flex: 1 }}>
                  {tokens.map((tok) => {
                    const parsed = parseRoomToken(tok, lvlName);
                    return (
                      <span
                        key={tok}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          background: "rgba(59, 130, 246, 0.15)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          color: "#e0f2fe",
                          fontSize: "12px"
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{parsed.zone}:</span> {parsed.roomName}
                        <button
                          type="button"
                          onClick={() => setSelectedRooms(prev => prev.filter(t => t !== tok))}
                          style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: 0 }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRooms(prev => prev.filter(t => parseRoomToken(t, level).level.toLowerCase().trim() !== lvlName.toLowerCase().trim()))}
                  style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "11px", cursor: "pointer" }}
                >
                  Remove Level
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPdf && (
        <div style={{ position: "relative" }}>
          <FloorDrawing
            pdf={selectedPdf}
            zones={selectedZones}
            level={level}
            selectedRooms={selectedRooms}
            onRoomsSelected={handleRoomsSelected}
            roomStatusMap={roomStatusMap}
          />
          {selectedRooms.length > 0 && (
            <div className="drawing-floating-action" style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
              <button
                className="nr-btn nr-btn--primary"
                style={{ height: "46px", padding: "0 32px", fontSize: "15px" }}
                onClick={() => setIsnewrequestcreated(true)}
              >
                Continue with {selectedRooms.length} Room{selectedRooms.length > 1 ? "s" : ""} selected across {
                  Array.from(new Set(selectedRooms.map(r => parseRoomToken(r, level).level))).filter(Boolean).length
                } Level{Array.from(new Set(selectedRooms.map(r => parseRoomToken(r, level).level))).filter(Boolean).length !== 1 ? "s" : ""} →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Overlay Loader when submitting permit */}
      {isSubmittingPermit && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(8px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999999,
          color: "#ffffff"
        }}>
          <div style={{
            width: "56px",
            height: "56px",
            border: "4px solid rgba(0, 229, 160, 0.2)",
            borderTop: "4px solid #00e5a0",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: "20px"
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px", color: "#f9fafb" }}>
            {isEditMode ? "Updating Work Permit Request..." : "Creating Work Permit Request..."}
          </h3>
          <p style={{ fontSize: "14px", color: "#9ca3af" }}>
            Please wait while the permit request is being processed...
          </p>
        </div>
      )}
    </div>
  );
}

export default NewRequest;