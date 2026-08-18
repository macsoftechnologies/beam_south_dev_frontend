import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { LOGO_MAP } from "../../../config/logos";
import { FaEdit, FaEye, FaCopy, FaTrash, FaPlus, FaFilter, FaHistory, FaCheck, FaTimes, FaEllipsisV, FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";

const AnalogTimePicker = ({ initialTime, onSave, onCancel }) => {
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
import {
  getContractors,
  getActivities,
  getBuildings,
  getFloors,
  getZones,
  getRooms,
  getUser,
  getPrecautions
} from "../../../services/authService";
import {
  searchRequests,
  deleteRequest,
  deleteSelectedRequests,
  updateListStatusRequest,
  updateListReqstSafety,
  updateListReqstTime,
  addListReqstNote,
  getRequestsLogs,
  createByCount,
  getRequestById,
  updateRequest
} from "../../../services/requestService";
import { API_BASE_URL } from "../../../services/api";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../../components/common/Toast/Toast";
import Table from "../../../components/common/Table/Table";
import Modal from "../../../components/common/Modal/Modal";
import "./ListRequest.css";
import "../../styles/pages.css";
import "../../../forms/styles/forms.css";
import { ZONE_MAPPING } from "../../../data/zones";
import { getDenmarkTimeISOString, formatToDenmarkDateTime } from "../../../utils/dateUtils";

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to convert yyyy-mm-dd date to dd-mm-yyyy format
const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr || dateStr === "—") return "—";
  const dateOnly = String(dateStr).split(/[ T]/)[0];
  const match = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return dateStr;
};

// Helper to pass long string values directly to Table component (where CSS handles ellipsis)
const trimLongValue = (value) => {
  if (!value || value === "—") return "—";
  return String(value);
};

// Helper to resolve zone name from building, floor/level, and rooms data
const resolveZoneNameFromRooms = (row) => {
  // 1. If the request already has a valid zone name from the database, use it
  let dbZoneName = "";
  if (typeof row.zone_name === "string" && row.zone_name.trim().length > 0 && row.zone_name !== "—") {
    dbZoneName = row.zone_name.trim();
  } else if (typeof row.zone === "string" && row.zone.trim().length > 0 && row.zone !== "—") {
    dbZoneName = row.zone.trim();
  } else if (row.zone && typeof row.zone === "object" && typeof row.zone.zone === "string") {
    dbZoneName = row.zone.zone;
  }
  if (dbZoneName && dbZoneName !== "—") {
    return dbZoneName;
  }

  // 2. Otherwise, look up from ZONE_MAPPING by matching room names or room IDs
  const roomStr = row.room_names || row.Room_Nos;
  if (!roomStr) return "—";

  const roomsToMatch = String(roomStr).split(",").map(r => r.trim().toLowerCase());

  const levelKey = row.Room_Type || "";
  let zonesToSearch = [];

  if (levelKey) {
    const levelLower = levelKey.toLowerCase().trim();
    const foundKey = Object.keys(ZONE_MAPPING).find(k =>
      k.toLowerCase().trim().includes(levelLower) || levelLower.includes(k.toLowerCase().trim())
    );
    if (foundKey) {
      zonesToSearch = ZONE_MAPPING[foundKey] || [];
    }
  }

  if (zonesToSearch.length === 0) {
    zonesToSearch = Object.values(ZONE_MAPPING).flat();
  }

  // Find a zoneGroup that contains a room with matching name or ID
  for (const zoneGroup of zonesToSearch) {
    if (zoneGroup.rooms) {
      for (const room of zoneGroup.rooms) {
        const roomName = (typeof room === "object" ? room.name : room) || "";
        const roomId = (typeof room === "object" ? room.id : "") || "";
        if (
          roomsToMatch.includes(roomName.toLowerCase().trim()) ||
          (roomId && roomsToMatch.includes(String(roomId).toLowerCase().trim()))
        ) {
          return zoneGroup.name || "—";
        }
      }
    }
  }

  return "—";
};

// Helper to resolve zone objects array [{ Zone_Id: number, zone: string }] from DB zonesList/roomsList & ZONE_MAPPING for copy request
const resolveZoneObjectsFromRequest = (row, zonesList = [], roomsList = []) => {
  if (!row) return [];

  const matchedZoneMap = new Map();

  // 1. PRIORITISE database Zone_Id / zone object / zone_name already on row
  const rowZoneIds = [];
  if (row.Zone_Id) {
    String(row.Zone_Id).split(',').forEach(idStr => {
      const num = Number(idStr.trim());
      if (!isNaN(num) && num > 0) rowZoneIds.push(num);
    });
  } else if (Array.isArray(row.zone)) {
    row.zone.forEach(zItem => {
      const zId = Number(typeof zItem === 'object' ? (zItem.Zone_Id ?? zItem.zone_id ?? zItem.id) : zItem);
      if (!isNaN(zId) && zId > 0) rowZoneIds.push(zId);
    });
  } else if (row.zone && typeof row.zone === 'object') {
    const zId = Number(row.zone.id ?? row.zone.Zone_Id ?? row.zone.zone_id);
    if (!isNaN(zId) && zId > 0) rowZoneIds.push(zId);
  }

  rowZoneIds.forEach(zId => {
    const dbZone = zonesList.find(z => String(z.id ?? z.zoneStatusId) === String(zId));
    const zName = dbZone ? (dbZone.zone || dbZone.zone_name) : null;
    if (zName) {
      matchedZoneMap.set(zName.toLowerCase().trim(), { Zone_Id: zId, zone: String(zName) });
    }
  });

  const explicitZoneName = typeof row.zone_name === "string" && row.zone_name.trim().length > 0 && row.zone_name !== "—"
    ? row.zone_name.trim()
    : (typeof row.zone === "string" && row.zone.trim().length > 0 && row.zone !== "—" ? row.zone.trim() : "");

  if (explicitZoneName) {
    explicitZoneName.split(',').forEach(zStr => {
      const nameClean = zStr.trim();
      if (nameClean && !matchedZoneMap.has(nameClean.toLowerCase())) {
        const dbZone = zonesList.find(z => (z.zone || z.zone_name || "").toLowerCase().trim() === nameClean.toLowerCase());
        const zId = dbZone ? Number(dbZone.id ?? dbZone.zoneStatusId) : null;
        if (zId) {
          matchedZoneMap.set(nameClean.toLowerCase(), { Zone_Id: zId, zone: nameClean });
        }
      }
    });
  }

  // 2. If no zone resolved yet from row.Zone_Id, match room IDs / names in DB roomsList (strictly filtered by Building & Floor)
  if (matchedZoneMap.size === 0) {
    const roomStr = row.room_names || row.Room_Nos || row.Room_Name || "";
    const roomsToMatch = String(roomStr)
      .split(",")
      .map(r => r.trim().toLowerCase())
      .filter(Boolean);

    const targetBuildingId = row.Building_Id || row.building_id;
    const targetFloorId = row.Floor_Id || row.fl_id || row.floor_id;

    if (roomsToMatch.length > 0 && roomsList.length > 0) {
      roomsToMatch.forEach(rToken => {
        // Try matching room_id first filtered by Building & Floor
        let matchedRoom = roomsList.find(r =>
          String(r.room_id ?? r.id) === rToken &&
          (targetFloorId ? String(r.fl_id || r.floor_id) === String(targetFloorId) : true) &&
          (targetBuildingId ? String(r.building_id) === String(targetBuildingId) : true)
        );
        // Try matching room_name filtered by Building & Floor
        if (!matchedRoom) {
          matchedRoom = roomsList.find(r =>
            (r.room_name || "").toLowerCase().trim() === rToken &&
            (targetFloorId ? String(r.fl_id || r.floor_id) === String(targetFloorId) : true) &&
            (targetBuildingId ? String(r.building_id) === String(targetBuildingId) : true)
          );
        }
        // Fallback with building filter only
        if (!matchedRoom && targetBuildingId) {
          matchedRoom = roomsList.find(r =>
            ((r.room_name || "").toLowerCase().trim() === rToken || String(r.room_id ?? r.id) === rToken) &&
            String(r.building_id) === String(targetBuildingId)
          );
        }
        // General fallback
        if (!matchedRoom) {
          matchedRoom = roomsList.find(r =>
            (r.room_name || "").toLowerCase().trim() === rToken || String(r.room_id ?? r.id) === rToken
          );
        }

        if (matchedRoom && matchedRoom.zone_id) {
          const zId = Number(matchedRoom.zone_id);
          const dbZone = zonesList.find(z => String(z.id ?? z.zoneStatusId) === String(zId));
          const zName = dbZone ? (dbZone.zone || dbZone.zone_name) : (matchedRoom.zone_name || "");
          if (zName) {
            matchedZoneMap.set(zName.toLowerCase().trim(), { Zone_Id: zId, zone: String(zName) });
          }
        }
      });
    }
  }

  // 3. Resolve canonical zone names from ZONE_MAPPING using room names
  if (matchedZoneMap.size === 0) {
    const roomStr = row.room_names || row.Room_Nos || row.Room_Name || "";
    const roomsToMatch = String(roomStr)
      .split(",")
      .map(r => r.trim().toLowerCase())
      .filter(Boolean);

    const levelKey = row.Room_Type || "";
    let zonesToSearch = [];

    if (levelKey) {
      const levelLower = String(levelKey).toLowerCase().trim();
      const foundKey = Object.keys(ZONE_MAPPING).find(k =>
        k.toLowerCase().trim().includes(levelLower) || levelLower.includes(k.toLowerCase().trim())
      );
      if (foundKey) {
        zonesToSearch = ZONE_MAPPING[foundKey] || [];
      }
    }

    if (zonesToSearch.length === 0) {
      zonesToSearch = Object.values(ZONE_MAPPING).flat();
    }

    const mappingZoneNames = [];
    if (roomsToMatch.length > 0) {
      for (const zoneGroup of zonesToSearch) {
        if (zoneGroup.rooms) {
          for (const room of zoneGroup.rooms) {
            const roomName = (typeof room === "object" ? room.name : room) || "";
            const roomId = (typeof room === "object" ? room.id : "") || "";
            if (
              roomsToMatch.includes(roomName.toLowerCase().trim()) ||
              (roomId && roomsToMatch.includes(String(roomId).toLowerCase().trim()))
            ) {
              if (zoneGroup.name && !mappingZoneNames.includes(zoneGroup.name)) {
                mappingZoneNames.push(zoneGroup.name);
              }
            }
          }
        }
      }
    }

    mappingZoneNames.forEach(mappingName => {
      const key = mappingName.toLowerCase().trim();
      if (!matchedZoneMap.has(key)) {
        const dbZone = zonesList.find(z => (z.zone || z.zone_name || "").toLowerCase().trim() === key);
        if (dbZone) {
          const zId = Number(dbZone.id ?? dbZone.zoneStatusId);
          matchedZoneMap.set(key, { Zone_Id: zId, zone: dbZone.zone || dbZone.zone_name || mappingName });
        }
      }
    });
  }

  // 4. Final fallback
  if (matchedZoneMap.size === 0 && zonesList.length > 0) {
    const bId = row.Building_Id ? Number(row.Building_Id) : null;
    const fId = row.Floor_Id ? Number(row.Floor_Id) : null;
    const matchedDbZone = zonesList.find(z =>
      (fId ? Number(z.floor_id) === fId : true) &&
      (bId ? Number(z.build_id || z.building_id) === bId : true)
    ) || zonesList[0];

    if (matchedDbZone) {
      const zId = Number(matchedDbZone.id ?? matchedDbZone.zoneStatusId);
      const zName = matchedDbZone.zone || matchedDbZone.zone_name || "Zone";
      matchedZoneMap.set(zName.toLowerCase().trim(), { Zone_Id: zId, zone: String(zName) });
    }
  }

  const primaryZoneId = row.Zone_Id
    ? Number(row.Zone_Id)
    : (row.zone?.id ? Number(row.zone.id) : 0);

  const zoneObjects = Array.from(matchedZoneMap.values());

  if (zoneObjects.length === 0) {
    zoneObjects.push({
      Zone_Id: typeof primaryZoneId === "number" && !isNaN(primaryZoneId) ? primaryZoneId : 0,
      zone: String(row.zone_name || row.zone || "Zone")
    });
  }

  return zoneObjects;
};

const STATUS_OPTIONS = [
  "Draft",
  "Hold",
  "Pre-Approved",
  "Approved",
  "Rejected",
  "Opened",
  "Cancelled",
  "Closed",
  "Auto-Cancelled"
];

const HRA_LIST = [
  { key: "Hot_work", label: "Hot Work", icon: "HotWorks.png", image: LOGO_MAP["HotWorks.png"] },
  { key: "working_on_electrical_system", label: "Electrical Systems", icon: "ElectricalSystems.png", image: LOGO_MAP["ElectricalSystems.png"] },
  { key: "working_hazardious_substen", label: "Hazardous Substances", icon: "substanceChemical.png", image: LOGO_MAP["substanceChemical.png"] },
  { key: "pressure_testing_of_equipment", label: "Testing Equipment", icon: "testingequipment.png", image: LOGO_MAP["testingequipment.png"] },
  { key: "working_at_height", label: "Working at Height", icon: "WorkingAtHight.png", image: LOGO_MAP["WorkingAtHight.png"] },
  { key: "working_confined_spaces", label: "Confined Space", icon: "ConfinedSpace.png", image: LOGO_MAP["ConfinedSpace.png"] },
  { key: "excavation_works", label: "Excavation Works", icon: "ExcavationWorks.png", image: LOGO_MAP["ExcavationWorks.png"] },
  { key: "using_cranes_or_lifting", label: "Cranes & Lifting", icon: "Craneslifting.png", image: LOGO_MAP["Craneslifting.png"] },
  { key: "power_on", label: "Electrical Works", icon: "electrical_works.png", image: LOGO_MAP["electrical_works.png"] },
  { key: "pressurization", label: "Mechanical Works", icon: "mechanical1.png", image: LOGO_MAP["mechanical1.png"] }
];

const MultiSelectDropdown = ({ options, selectedValues, onChange, placeholder, disabled, hasNone = false, searchPlaceholder = "Search contractor..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleCheckboxChange = (val, checked) => {
    if (val === "none") {
      onChange(checked ? ["none"] : []);
      return;
    }

    let newSelected = selectedValues.filter(v => v !== "none");
    if (checked) {
      newSelected.push(val);
    } else {
      newSelected = newSelected.filter(v => v !== val);
    }
    onChange(newSelected);
  };

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(opt => {
      if (opt.zones) {
        return opt.zones.some(z => {
          const l = typeof z === "object" ? (z.name ?? z.label ?? z) : z;
          return String(l).toLowerCase().includes(q);
        });
      }
      const label = opt.subContractorName || opt.building_name || opt.floor_name || opt.zone || opt.label || opt.name || opt;
      return String(label).toLowerCase().includes(q);
    });
  }, [options, searchQuery]);

  let displayText = placeholder;
  if (selectedValues.length > 0) {
    if (selectedValues.includes("none")) {
      displayText = "None";
    } else if (selectedValues.length === 1) {
      const allOpts = [];
      options.forEach(opt => {
        if (opt.zones) {
          opt.zones.forEach(z => {
            if (typeof z === "object") {
              allOpts.push({ value: String(z.id ?? z.value ?? z), label: z.name ?? z.label ?? z });
            } else {
              allOpts.push({ value: z, label: z });
            }
          });
        } else {
          allOpts.push(opt);
        }
      });

      const opt = allOpts.find(o => {
        const oVal = String(o?.value ?? o?.key ?? o?.id ?? o?.build_id ?? o);
        return oVal === String(selectedValues[0]);
      });
      if (opt) {
        displayText = opt.label || opt.building_name || opt.floor_name || opt.subContractorName || opt.zone || opt.value || opt.key || opt;
      }
    } else {
      const selectedLabels = [];
      const allOpts = [];
      options.forEach(opt => {
        if (opt.zones) {
          opt.zones.forEach(z => {
            if (typeof z === "object") {
              allOpts.push({ value: String(z.id ?? z.value ?? z), label: z.name ?? z.label ?? z });
            } else {
              allOpts.push({ value: z, label: z });
            }
          });
        } else {
          allOpts.push(opt);
        }
      });

      selectedValues.forEach(val => {
        const opt = allOpts.find(o => {
          const oVal = String(o?.value ?? o?.key ?? o?.id ?? o?.build_id ?? o);
          return oVal === String(val);
        });
        if (opt) {
          selectedLabels.push(opt.label || opt.building_name || opt.floor_name || opt.subContractorName || opt.zone || opt.value || opt.key || opt);
        }
      });

      if (selectedLabels.length > 0) {
        displayText = selectedLabels.join(", ");
      }
    }
  }

  return (
    <div ref={containerRef} className="custom-multiselect-container" style={{ position: "relative", width: "100%" }}>
      <div
        className="df-input"
        onClick={handleToggle}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          userSelect: "none",
          paddingRight: "14px",
          opacity: disabled ? 0.6 : 1,
          color: displayText === placeholder ? "var(--text-muted, #9ca3af)" : "var(--text-main, #f9fafb)"
        }}
      >
        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "calc(100% - 24px)"
        }}>
          {displayText}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease"
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {isOpen && (
        <div
          className="custom-multiselect-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "100%",
            maxHeight: "260px",
            overflowY: "auto",
            backgroundColor: "var(--bg-card, #111827)",
            border: "1.5px solid var(--border-color, #374151)",
            borderRadius: "12px",
            zIndex: 9999,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
            padding: "6px 0"
          }}
        >
          {/* Search bar inside dropdown */}
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-color, #374151)", position: "sticky", top: 0, backgroundColor: "var(--bg-card, #111827)", zIndex: 10, display: "flex", gap: "6px" }}>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
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
          {hasNone && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 16px",
                cursor: "pointer",
                transition: "background-color 0.2s",
                color: "var(--text-main, #f9fafb)",
                backgroundColor: selectedValues.includes("none") ? "rgba(255, 255, 255, 0.05)" : "transparent",
                fontSize: "14px",
                userSelect: "none"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedValues.includes("none") ? "rgba(255, 255, 255, 0.05)" : "transparent"}
            >
              <input
                type="checkbox"
                checked={selectedValues.includes("none")}
                onChange={(e) => handleCheckboxChange("none", e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent, #00e5a0)" }}
              />
              <span>None</span>
            </label>
          )}

          {filteredOptions.map((opt, idx) => {
            // Support grouped zones/rooms
            if (opt.zones) {
              return (
                <div key={idx}>
                  <div style={{
                    padding: "8px 16px 4px 16px",
                    color: "var(--text-muted, #9ca3af)",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    borderTop: idx > 0 ? "1px solid var(--border-color, #374151)" : "none"
                  }}>
                    {opt.floorName}
                  </div>
                  {opt.zones.map((z, zIdx) => {
                    const zVal = String(typeof z === "object" ? (z.id ?? z.value ?? z) : z);
                    const zLabel = typeof z === "object" ? (z.name ?? z.label ?? z) : z;
                    const isChecked = selectedValues.includes(zVal);

                    return (
                      <label
                        key={zIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 24px",
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                          color: "var(--text-main, #f9fafb)",
                          backgroundColor: isChecked ? "rgba(255, 255, 255, 0.05)" : "transparent",
                          fontSize: "14px",
                          userSelect: "none"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isChecked ? "rgba(255, 255, 255, 0.05)" : "transparent"}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleCheckboxChange(zVal, e.target.checked)}
                          style={{
                            width: "16px",
                            height: "16px",
                            cursor: "pointer",
                            accentColor: "var(--accent, #00e5a0)",
                            borderRadius: "4px"
                          }}
                        />
                        <span>{zLabel}</span>
                      </label>
                    );
                  })}
                </div>
              );
            }

            const val = String(opt.value ?? opt.key ?? opt.id ?? opt.build_id ?? opt);
            const displayLabel = opt.label || opt.building_name || opt.floor_name || opt.subContractorName || opt;
            const isChecked = selectedValues.includes(val);
            const imgUrl = opt.image || (opt.icon ? LOGO_MAP[opt.icon] : null);

            return (
              <label
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 16px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  color: "var(--text-main, #f9fafb)",
                  backgroundColor: isChecked ? "rgba(255, 255, 255, 0.05)" : "transparent",
                  fontSize: "14px",
                  userSelect: "none"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isChecked ? "rgba(255, 255, 255, 0.05)" : "transparent"}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleCheckboxChange(val, e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    cursor: "pointer",
                    accentColor: "var(--accent, #00e5a0)",
                    borderRadius: "4px"
                  }}
                />
                {imgUrl && (
                  <img
                    src={imgUrl}
                    alt={displayLabel}
                    style={{
                      width: "22px",
                      height: "22px",
                      objectFit: "contain",
                      borderRadius: "4px",
                      flexShrink: 0
                    }}
                  />
                )}
                <span>{displayLabel}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

const isTodayDate = (dateVal) => {
  if (!dateVal) return false;

  let year, month, day;
  const str = String(dateVal).trim();

  if (str.includes("T")) {
    const part = str.split("T")[0];
    const parts = part.split("-");
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }
  } else if (str.includes("-")) {
    const parts = str.split("-");
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (parts[2] && parts[2].length === 4) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  } else if (str.includes("/")) {
    const parts = str.split("/");
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (parts[2] && parts[2].length === 4) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  }

  if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      year = d.getFullYear();
      month = d.getMonth() + 1;
      day = d.getDate();
    } else {
      return false;
    }
  }

  const today = new Date();
  return (
    today.getFullYear() === year &&
    today.getMonth() + 1 === month &&
    today.getDate() === day
  );
};

const ListRequest = () => {
  const navigate = useNavigate();
  const currentUser = useMemo(() => getUser(), []);
  const userContractorId = currentUser?.typeId || currentUser?.subContId || currentUser?.subContractorId;
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const qPermitNo = queryParams.get("permitNo") || queryParams.get("permit_no") || queryParams.get("search");

    if (location.state || qPermitNo) {
      const stateObj = location.state || {};
      const { status, fromDate, toDate, permitNo, permit_no, search, keyword } = stateObj;
      const targetPermit = permitNo || permit_no || search || keyword || qPermitNo;

      setSearchFilters(prev => {
        const updated = { ...prev };
        if (status) {
          updated.statuses = Array.isArray(status) ? status : [status];
        }
        if (fromDate !== undefined) {
          updated.fromDate = fromDate;
        }
        if (toDate !== undefined) {
          updated.toDate = toDate;
        }
        if (targetPermit !== undefined && targetPermit !== null && targetPermit !== "") {
          updated.permitNo = String(targetPermit).trim();
        }
        return updated;
      });
      // Clear location state so they don't persist on page reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state, location.search]);

const STORAGE_KEY_FILTERS = "beam_list_request_filters";
const STORAGE_KEY_PAGE = "beam_list_request_page";

const getInitialSearchFilters = () => {
  const saved = sessionStorage.getItem(STORAGE_KEY_FILTERS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        return {
          keyword: "",
          permitNo: "",
          contractors: [],
          statuses: [],
          buildings: [],
          levels: [],
          areas: [],
          zones: [],
          hras: [],
          permitType: "",
          permitUnder: "",
          fromDate: "",
          toDate: "",
          startTime: "",
          endTime: "",
          nightShift: "",
          newDate: "",
          newEndTime: "",
          typeOfActivityId: "",
          ...parsed,
        };
      }
    } catch (e) {
      console.error("Failed to parse saved search filters", e);
    }
  }
  return {
    keyword: "",
    permitNo: "",
    contractors: [],
    statuses: [],
    buildings: [],
    levels: [],
    areas: [],
    zones: [],
    hras: [],
    permitType: "",
    permitUnder: "",
    fromDate: "",
    toDate: "",
    startTime: "",
    endTime: "",
    nightShift: "",
    newDate: "",
    newEndTime: "",
    typeOfActivityId: ""
  };
};

const getInitialPage = () => {
  const savedPage = sessionStorage.getItem(STORAGE_KEY_PAGE);
  if (savedPage) {
    const p = parseInt(savedPage, 10);
    if (!isNaN(p) && p > 0) return p;
  }
  return 1;
};

  // ─── Component States ──────────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [limit, setLimit] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingEditId, setLoadingEditId] = useState(null);

  // Dropdown options (from dynamic databases)
  const [contractors, setContractors] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [zonesList, setZonesList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);

  // Collapsible filters card
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Search Filter form state
  const [searchFilters, setSearchFilters] = useState(getInitialSearchFilters);

  // Modal Control States
  const [activeModal, setActiveModal] = useState(null); // 'status', 'time', 'safety', 'notes', 'logs', 'copy'
  const [modalTarget, setModalTarget] = useState(null); // Single request object or array of requests
  const [modalStatus, setModalStatus] = useState(""); // Open, Close, Rejected, Approved etc

  // Status Change Dialog Form inputs
  const [initials, setInitials] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [submitStatusOverride, setSubmitStatusOverride] = useState(null);
  const [closingImageFiles, setClosingImageFiles] = useState([]);

  // Hotwork status change states
  const [openActionType, setOpenActionType] = useState("Open");
  const [approveActionType, setApproveActionType] = useState("Approve");
  const [lowRiskHotwork, setLowRiskHotwork] = useState(0);
  const [highRiskHotwork, setHighRiskHotwork] = useState(0);
  const [hotWorkChecklistFilled, setHotWorkChecklistFilled] = useState(0);
  const [fireGuardPresent, setFireGuardPresent] = useState(0);
  const [hHeatSource, setHHeatSource] = useState("");
  const [hWorkplaceCheck, setHWorkplaceCheck] = useState("");
  const [hFireDetectors, setHFireDetectors] = useState("");
  const [hStartTime, setHStartTime] = useState("");
  const [hEndTime, setHEndTime] = useState("");

  // Bulk operation form inputs
  const [bulkTime, setBulkTime] = useState({ startTime: "", endTime: "", nightShift: false, newEndTime: "" });
  const [bulkSafety, setBulkSafety] = useState([]);
  const [precautionsList, setPrecautionsList] = useState([]);
  const [isPrecautionsDropdownOpen, setIsPrecautionsDropdownOpen] = useState(false);
  const precautionsDropdownRef = useRef(null);
  const [bulkDropdownOpen, setBulkDropdownOpen] = useState(false);
  const bulkDropdownRef = useRef(null);
  const [bulkNote, setBulkNote] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showSearchNewEndPicker, setShowSearchNewEndPicker] = useState(false);
  const [showBulkStartPicker, setShowBulkStartPicker] = useState(false);
  const [showBulkEndPicker, setShowBulkEndPicker] = useState(false);
  const [showBulkNewEndPicker, setShowBulkNewEndPicker] = useState(false);
  const [showHStartPicker, setShowHStartPicker] = useState(false);
  const [showHEndPicker, setShowHEndPicker] = useState(false);
  const [showCopyStartPicker, setShowCopyStartPicker] = useState(false);
  const [showCopyEndPicker, setShowCopyEndPicker] = useState(false);
  const [showCopyNewEndPicker, setShowCopyNewEndPicker] = useState(false);
  const [logsData, setLogsData] = useState([]);
  const [copyDates, setCopyDates] = useState({ from: "", to: "", startTime: "", endTime: "", nightShift: false, newEndTime: "" });

  // Check operator credentials (with multi-role support)
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

  const isAdmin = userRoles.some(r => ["admin", "superadmin"].includes(r));
  const isDept = userRoles.includes("department");
  const isDept1 = userRoles.includes("department1");
  const isSubcontractor = userRoles.includes("subcontractor") ||
    userRoles.includes("contractor") ||
    userRoles.includes("sub_contractor") ||
    userRoles.includes("sub-contractor");;
  const isObserver = userRoles.includes("observer");
  const canBulkAction = isAdmin || isDept || isDept1;
  const isMultiDept = isDept && isDept1;

  const checkIfHideCheckbox = useCallback((row) => {
    if (isObserver || isSubcontractor) return true;
    if (isAdmin || isMultiDept) return false;
    if (isDept) {
      const eitherIsConstruction = String(row.permit_under).toLowerCase() === "construction" ||
        String(row.permit_type).toLowerCase() === "construction";
      return !eitherIsConstruction;
    }
    if (isDept1) {
      const bothAreConstruction = String(row.permit_under).toLowerCase() === "construction" &&
        String(row.permit_type).toLowerCase() === "construction";
      return bothAreConstruction;
    }
    return false;
  }, [isAdmin, isDept, isDept1, isMultiDept, isObserver, isSubcontractor]);

  // ─── Fetch Selector Lists ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchSelectors = async () => {
      try {
        const [subRes, actRes, buildRes, floorRes, zoneRes, roomRes, precautionsRes] = await Promise.all([
          getContractors(1, 1000),
          getActivities(1, 1000),
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getZones(1, 10000),
          getRooms(1, 10000),
          getPrecautions(1, 1000)
        ]);
        const rawContractors = subRes?.data?.rows ?? subRes?.data ?? subRes ?? [];
        const loadedContractors = rawContractors
          .slice()
          .sort((a, b) => (a.subContractorName || "").localeCompare(b.subContractorName || "", undefined, { sensitivity: "base" }));
        setContractors(loadedContractors);
        if (isSubcontractor) {
          const defaultSubId = userContractorId ? String(userContractorId) : (loadedContractors.length > 0 ? String(loadedContractors[0].id) : "");
          if (defaultSubId) {
            setSearchFilters(prev => {
              if (prev.contractors.length === 1 && prev.contractors[0] === defaultSubId) return prev;
              return { ...prev, contractors: [defaultSubId] };
            });
          }
        }
        setActivitiesList(actRes?.data?.rows ?? actRes?.data ?? actRes ?? []);
        setBuildingsList(buildRes?.data ?? []);
        setFloorsList(floorRes?.data ?? []);
        setZonesList(zoneRes?.data ?? []);
        setRoomsList(roomRes?.data?.rows ?? roomRes?.data ?? roomRes ?? []);
        setPrecautionsList(precautionsRes?.data?.rows ?? precautionsRes?.data ?? precautionsRes ?? []);
      } catch (err) {
        console.error("Failed to load selectors lists", err);
      }
    };
    fetchSelectors();
  }, []);

  // Default subcontractor filter if current user is a contractor
  useEffect(() => {
    if (isSubcontractor && userContractorId) {
      const subIdStr = String(userContractorId);
      setSearchFilters(prev => {
        if (prev.contractors.length === 1 && prev.contractors[0] === subIdStr) return prev;
        return {
          ...prev,
          contractors: [subIdStr]
        };
      });
    }
  }, [isSubcontractor, userContractorId]);

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

  // Handle click outside for bulk edit dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(event.target)) {
        setBulkDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter levels based on selected buildings
  const filteredLevels = useMemo(() => {
    if (searchFilters.buildings.length === 0) return floorsList;
    return floorsList.filter(f => searchFilters.buildings.includes(String(f.build_id)));
  }, [searchFilters.buildings, floorsList]);

  // Filter zones based on selected levels/floors (and buildings)
  const filteredZones = useMemo(() => {
    let zonesToFilter = zonesList;

    if (searchFilters.buildings && searchFilters.buildings.length > 0) {
      const selectedBuildingIds = searchFilters.buildings.map(Number);
      zonesToFilter = zonesToFilter.filter(z =>
        z.building_id !== undefined && z.building_id !== null && selectedBuildingIds.includes(Number(z.building_id))
      );
    }

    if (searchFilters.levels && searchFilters.levels.length > 0) {
      const isLevelMatch = (filterLevel, targetName) => {
        if (!filterLevel || !targetName) return false;
        const fl = String(filterLevel).trim().toLowerCase();
        const tn = String(targetName).trim().toLowerCase();
        if (fl === tn || fl.endsWith(tn) || tn.endsWith(fl)) return true;
        const baseFl = fl.replace(/^(?:[a-z0-9]+\s*[-:]?\s*)/i, '').trim();
        const baseTn = tn.replace(/^(?:[a-z0-9]+\s*[-:]?\s*)/i, '').trim();
        return baseFl.length > 0 && baseFl === baseTn;
      };

      const matchedFloorIds = floorsList
        .filter(f => searchFilters.levels.some(l => isLevelMatch(l, f.floor_name)))
        .map(f => Number(f.fl_id));

      const zoneIdsFromRooms = roomsList
        .filter(r => matchedFloorIds.includes(Number(r.fl_id)))
        .map(r => Number(r.zone_id))
        .filter(Boolean);

      zonesToFilter = zonesToFilter.filter(z => {
        const matchDirectFloorId = z.floor_id !== undefined && z.floor_id !== null && matchedFloorIds.includes(Number(z.floor_id));
        const matchDirectLevelName = z.level !== undefined && z.level !== null && searchFilters.levels.some(l => isLevelMatch(l, z.level));
        const matchViaRooms = zoneIdsFromRooms.includes(Number(z.id));
        return matchDirectFloorId || matchDirectLevelName || matchViaRooms;
      });
    }

    const seenNames = new Set();
    const result = [];
    zonesToFilter.forEach(z => {
      if (z.zone && !seenNames.has(z.zone)) {
        seenNames.add(z.zone);
        result.push(z);
      }
    });

    return result;
  }, [zonesList, floorsList, roomsList, searchFilters.buildings, searchFilters.levels]);

  // Filter rooms based on selected levels/floors and zones, and group them by zone names
  const filteredRooms = useMemo(() => {
    let roomsToGroup = roomsList;

    if (searchFilters.buildings && searchFilters.buildings.length > 0) {
      roomsToGroup = roomsToGroup.filter(r => searchFilters.buildings.includes(String(r.building_id)));
    }

    if (searchFilters.levels && searchFilters.levels.length > 0) {
      const isLevelMatch = (filterLevel, targetName) => {
        if (!filterLevel || !targetName) return false;
        const fl = String(filterLevel).trim().toLowerCase();
        const tn = String(targetName).trim().toLowerCase();
        if (fl === tn || fl.endsWith(tn) || tn.endsWith(fl)) return true;
        const baseFl = fl.replace(/^(?:[a-z0-9]+\s*[-:]?\s*)/i, '').trim();
        const baseTn = tn.replace(/^(?:[a-z0-9]+\s*[-:]?\s*)/i, '').trim();
        return baseFl.length > 0 && baseFl === baseTn;
      };

      const matchedFloorIds = floorsList
        .filter(f => searchFilters.levels.some(l => isLevelMatch(l, f.floor_name)))
        .map(f => f.fl_id);
      roomsToGroup = roomsToGroup.filter(r => matchedFloorIds.includes(r.fl_id));
    }

    if (searchFilters.zones && searchFilters.zones.length > 0) {
      const selectedZoneNamesOrIds = searchFilters.zones.map(z => String(z).trim().toLowerCase());
      const matchedZoneIds = zonesList
        .filter(z =>
          selectedZoneNamesOrIds.includes(String(z.id).trim().toLowerCase()) ||
          selectedZoneNamesOrIds.includes(String(z.zone).trim().toLowerCase())
        )
        .map(z => String(z.id));

      roomsToGroup = roomsToGroup.filter(r => {
        const roomZoneId = String(r.zone_id || '').trim().toLowerCase();
        const roomZoneName = String(r.zone_name || r.zone || '').trim().toLowerCase();
        return (
          (r.zone_id && matchedZoneIds.includes(String(r.zone_id))) ||
          selectedZoneNamesOrIds.includes(roomZoneId) ||
          (roomZoneName && selectedZoneNamesOrIds.includes(roomZoneName))
        );
      });
    }

    const groupMap = {};

    roomsToGroup.forEach(r => {
      const zoneObj = zonesList.find(z => String(z.id) === String(r.zone_id));
      const zoneName = zoneObj ? zoneObj.zone : "Other Areas";
      if (!groupMap[zoneName]) {
        groupMap[zoneName] = [];
      }
      groupMap[zoneName].push({
        id: r.room_id,
        name: r.room_name
      });
    });

    return Object.keys(groupMap).map(zoneName => ({
      floorName: zoneName,
      zones: groupMap[zoneName]
    }));
  }, [roomsList, zonesList, floorsList, searchFilters.buildings, searchFilters.levels, searchFilters.zones]);

  // ─── Fetch List Data ──────────────────────────────────────────────────────
  const fetchRequests = useCallback(async (page = 1) => {
    if (searchFilters.fromDate && searchFilters.toDate) {
      const fromVal = new Date(searchFilters.fromDate);
      const toVal = new Date(searchFilters.toDate);
      if (toVal < fromVal) {
        showError("To Date cannot be earlier than From Date.");
        return;
      }
      if (searchFilters.fromDate === searchFilters.toDate && searchFilters.startTime && searchFilters.endTime) {
        if (searchFilters.endTime < searchFilters.startTime) {
          showError("End Time cannot be earlier than Start Time for the same day.");
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        Activity: searchFilters.keyword || null,
        PermitNo: searchFilters.permitNo || null,
        Sub_Contractor_Id: searchFilters.contractors.length > 0 ? searchFilters.contractors.join(",") : null,
        Request_status: searchFilters.statuses.length > 0 ? searchFilters.statuses.join(",") : null,
        Building_Id: searchFilters.buildings.length > 0 ? searchFilters.buildings.join(",") : null,
        Room_Type: searchFilters.levels.length > 0 ? searchFilters.levels.join(",") : null,
        Room_Nos: searchFilters.areas.length > 0 ? searchFilters.areas.join(",") : null,
        zoneIds: zonesList.filter(z => searchFilters.zones && searchFilters.zones.includes(z.zone)).map(z => z.id).length > 0
          ? zonesList.filter(z => searchFilters.zones && searchFilters.zones.includes(z.zone)).map(z => z.id)
          : null,
        zone: searchFilters.zones && searchFilters.zones.length > 0 ? searchFilters.zones.join(",") : null,
        permit_type: searchFilters.permitType || "",
        permit_under: searchFilters.permitUnder || "",
        night_shift: searchFilters.nightShift || "",
        new_date: searchFilters.newDate || "",
        new_end_time: searchFilters.newEndTime ? (searchFilters.newEndTime.length === 5 ? `${searchFilters.newEndTime}:00` : searchFilters.newEndTime) : "",
        fromDate: searchFilters.fromDate || "",
        toDate: searchFilters.toDate || "",
        Start_Time: searchFilters.startTime ? `${searchFilters.startTime}:00` : "",
        End_Time: searchFilters.endTime ? `${searchFilters.endTime}:00` : "",
        Type_Of_Activity_Id: searchFilters.typeOfActivityId || null,
        Site_Id: 5,
        Page: page,
        End: limit
      };

      const hrasList = searchFilters.hras || [];
      if (hrasList.includes("none")) {
        payload.hras = 0;
      } else if (hrasList.length > 0) {
        payload.hras = 1;
        hrasList.forEach(key => {
          payload[key] = 1;
        });
      }

      const res = await searchRequests(payload);
      let rows = [];
      let count = 0;
      if (res && res.data) {
        if (Array.isArray(res.data) && res.data.length > 0 && res.data[0] && Array.isArray(res.data[0].data)) {
          rows = res.data[0].data;
        } else if (Array.isArray(res.data)) {
          rows = res.data;
        } else if (res.data.rows) {
          rows = res.data.rows;
        }
        count = res.data[1]?.count ?? res.total ?? rows.length;
      } else if (Array.isArray(res)) {
        if (res.length > 0 && res[0] && Array.isArray(res[0].data)) {
          rows = res[0].data;
        } else {
          rows = res;
        }
        count = res[1]?.count ?? res.total ?? rows.length;
      }

      setRequests(rows);
      setTotalCount(Number(count));
      setSelectedIds([]); // reset selection
    } catch (err) {
      showError("Failed to fetch permit requests.");
    } finally {
      setIsLoading(false);
    }
  }, [searchFilters, limit]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(searchFilters));
  }, [searchFilters]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_PAGE, String(currentPage));
  }, [currentPage]);

  const isFirstFilterRender = useRef(true);
  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchFilters]);

  useEffect(() => {
    fetchRequests(currentPage);
  }, [currentPage, fetchRequests]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRequests(1);
  };

  const handleResetFilters = () => {
    sessionStorage.removeItem(STORAGE_KEY_FILTERS);
    sessionStorage.removeItem(STORAGE_KEY_PAGE);
    setSearchFilters({
      keyword: "",
      permitNo: "",
      contractors: isSubcontractor && currentUser?.typeId ? [String(currentUser.typeId)] : [],
      statuses: [],
      buildings: [],
      levels: [],
      areas: [],
      zones: [],
      hras: [],
      permitType: "",
      permitUnder: "",
      fromDate: "",
      toDate: "",
      startTime: "",
      endTime: "",
      nightShift: "",
      newDate: "",
      newEndTime: "",
      typeOfActivityId: ""
    });
    setCurrentPage(1);
  };

  // ─── Select Handling ───────────────────────────────────────────────────────
  const handleSelectAll = (checked) => {
    if (checked) {
      const selectableRequests = requests.filter(r => !checkIfHideCheckbox(r));
      setSelectedIds(selectableRequests.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (checked, id) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  // Fetch full request details then navigate to edit form
  const handleEditClick = async (row) => {
    setLoadingEditId(row.id);
    try {
      const res = await getRequestById(row.id);
      const fullRequest = res?.data ?? res;
      navigate("/new-request", { state: { editRequest: fullRequest } });
    } catch (err) {
      showError("Failed to load request details for editing.");
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleRowDelete = async (row) => {
    const confirm = await showDeleteConfirm();
    if (!confirm.isConfirmed) return;
    try {
      await deleteRequest(row.id);
      showDeleteSuccess();
      fetchRequests(currentPage);
    } catch {
      showError("Delete failed");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirm = await showDeleteConfirm();
    if (!confirm.isConfirmed) return;
    try {
      await deleteSelectedRequests({ ids: selectedIds });
      showSuccess("Selected requests deleted successfully");
      fetchRequests(currentPage);
    } catch {
      showError("Delete failed");
    }
  };

  // View Logs Modal
  const handleViewLogs = async (row) => {
    try {
      const res = await getRequestsLogs(row.id);
      setLogsData(res?.data || []);
      setModalTarget(row);
      setActiveModal("logs");
    } catch {
      showError("Failed to fetch request history logs.");
    }
  };

  // Status transitions triggering dialogs
  const getSigningRoleDescription = (row, status) => {
    if (!row) return "";
    const permitType = row.permit_type || "";
    const permitUnder = row.permit_under || "";

    if (status === "Opened") {
      return "Supervisor/CONM (Open Permit)";
    }

    if (status === "Pre-Approved") {
      if (permitType === "Construction" && permitUnder === "Commissioning") {
        return "CONM (Pre-Approval)";
      }
      if (permitType === "Commissioning" && permitUnder === "Construction") {
        return "COMM (Pre-Approval)";
      }
    }

    if (status === "Approved") {
      if (permitType === "Commissioning" && permitUnder === "Commissioning") {
        return "COMM (Approval)";
      }
      if (permitType === "Construction" && permitUnder === "Construction") {
        return "CONM (Approval)";
      }
      if (permitType === "Construction" && permitUnder === "Commissioning") {
        return "COMM (Final Approval)";
      }
      if (permitType === "Commissioning" && permitUnder === "Construction") {
        return "CONM (Final Approval)";
      }
    }

    return currentUser?.role || "";
  };

  const proceedWithStatusChange = (row, status) => {
    const currentStatus = row?.Request_status || row?.request_status || "";
    const workingDateVal = row?.Working_Date || row?.workingDate || row?.working_date || "";

    const isWorkingDateToday = isTodayDate(workingDateVal);

    setModalTarget(row);
    setModalStatus(status);
    setSubmitStatusOverride(null);
    setInitials("");
    setRejectReason("");
    setCancelReason("");
    setCloseNote("");
    setClosingImageFiles([]);
    setOpenActionType(isWorkingDateToday ? "Open" : "Cancel");
    setApproveActionType("Approve");
    setLowRiskHotwork(0);
    setHighRiskHotwork(0);
    setHotWorkChecklistFilled(0);
    setFireGuardPresent(0);
    setHHeatSource("");
    setHWorkplaceCheck("");
    setHFireDetectors("");
    setHStartTime("");
    setHEndTime("");
    setShowHStartPicker(false);
    setShowHEndPicker(false);
    setActiveModal("status");
  };

  // Status transitions triggering dialogs
  const handleStatusTransition = async (row, status) => {
    const currentStatus = row?.Request_status || row?.request_status || "";
    const workingDateVal = row?.Working_Date || row?.workingDate || row?.working_date || "";

    const permitType = row.permit_type || "";
    const permitUnder = row.permit_under || "";

    // Role based validations for Pre-Approved and Approved transitions
    if (!isAdmin) {
      if (status === "Pre-Approved") {
        // Pre-Approve: Construction permit under Commissioning -> CONM (isDept) pre-approves
        if (permitType === "Construction" && permitUnder === "Commissioning") {
          if (!isDept) {
            return showError("Only CONM role can pre-approve Construction permits under Commissioning.");
          }
        }
        // Pre-Approve: Commissioning permit under Construction -> COMM (isDept1) pre-approves
        else if (permitType === "Commissioning" && permitUnder === "Construction") {
          if (!isDept1) {
            return showError("Only COMM role can pre-approve Commissioning permits under Construction.");
          }
        } else {
          return showError("This permit configuration does not support the Pre-Approved status.");
        }
      }

      if (status === "Approved") {
        // Approve: Commissioning + Commissioning -> COMM (isDept1) approves
        if (permitType === "Commissioning" && permitUnder === "Commissioning") {
          if (!isDept1) {
            return showError("Only COMM role can approve Commissioning permits under Commissioning.");
          }
        }
        // Approve: Construction + Construction -> CONM (isDept) approves
        else if (permitType === "Construction" && permitUnder === "Construction") {
          if (!isDept) {
            return showError("Only CONM role can approve Construction permits under Construction.");
          }
        }
        // Approve: Construction + Commissioning (from Pre-Approved) -> COMM (isDept1) approves
        else if (permitType === "Construction" && permitUnder === "Commissioning") {
          if (!isDept1) {
            return showError("Only COMM role can approve Construction permits under Commissioning.");
          }
        }
        // Approve: Commissioning + Construction (from Pre-Approved) -> CONM (isDept) approves
        else if (permitType === "Commissioning" && permitUnder === "Construction") {
          if (!isDept) {
            return showError("Only CONM role can approve Commissioning permits under Construction.");
          }
        }
      }
    }

    // Check if there are existing permits with the same room/area and working date
    const roomNosStr = row.Room_Nos || row.room_nos || "";
    const splitingAreas = roomNosStr ? String(roomNosStr).split(",") : [];
    const formattedArea = splitingAreas
      .filter(val => val !== null && val !== undefined && val !== "")
      .map(val => `${val}`.trim())
      .join("|");

    const workingDateStr = row.Working_Date || row.workingDate || "";
    const formattedDate = workingDateStr ? String(workingDateStr).split("T")[0] : "";

    const buildingIdClean = row.Building_Id || row.building_id;
    const subconIdClean = row.Sub_Contractor_Id || row.sub_contractor_id;
    const activityIdClean = row.Type_Of_Activity_Id || row.type_of_activity_id;
    const roomTypeClean = (row.Room_Type || row.room_type || "").replace(/'/g, "").trim();

    const searchCheckRequest = {
      Room_Type: roomTypeClean,
      fromDate: formattedDate,
      toDate: formattedDate,
      Page: 1,
      End: 5,
      Site_Id: 5,
      Request_status: "Hold,Pre-Approved,Approved,Opened",
      area: formattedArea || roomNosStr,
      Room_Nos: roomNosStr
    };

    if (buildingIdClean && !isNaN(Number(String(buildingIdClean).replace(/'/g, "").trim()))) {
      searchCheckRequest.Building_Id = Number(String(buildingIdClean).replace(/'/g, "").trim());
    }
    if (subconIdClean && !isNaN(Number(String(subconIdClean).replace(/'/g, "").trim()))) {
      searchCheckRequest.Sub_Contractor_Id = Number(String(subconIdClean).replace(/'/g, "").trim());
    }
    if (activityIdClean && !isNaN(Number(String(activityIdClean).replace(/'/g, "").trim()))) {
      searchCheckRequest.Type_Of_Activity_Id = Number(String(activityIdClean).replace(/'/g, "").trim());
    }

    try {
      const res = await searchRequests(searchCheckRequest);
      let responseData = res?.data ?? res;
      let foundList = [];
      if (Array.isArray(responseData)) {
        if (responseData[0] && Array.isArray(responseData[0].data)) {
          foundList = responseData[0].data;
        } else {
          foundList = responseData;
        }
      } else if (responseData?.rows) {
        foundList = responseData.rows;
      }

      // Filter out current request
      const duplicatePermits = foundList.filter(item => String(item.id) !== String(row.id));

      if (duplicatePermits.length > 0) {
        const result = await Swal.fire({
          title: "Duplicate Permit Found",
          text: "A permit already exists for this room and working date. Do you want to continue?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Continue",
          cancelButtonText: "Cancel",
          confirmButtonColor: "#3b82f6",
          cancelButtonColor: "#6b7280"
        });

        if (result.isConfirmed) {
          proceedWithStatusChange(row, status);
        }
      } else {
        proceedWithStatusChange(row, status);
      }
    } catch (err) {
      console.error("Error checking duplicate permit", err);
      proceedWithStatusChange(row, status);
    }
  };

  const promptApprovedAction = async (row) => {
    const result = await Swal.fire({
      title: "Approved Permit Action",
      text: `Select an action to perform on Permit ${row.PermitNo ? '#' + row.PermitNo : '#' + row.id}`,
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Open Permit",
      confirmButtonColor: "#10b981",
      denyButtonText: "Reject Permit",
      denyButtonColor: "#ef4444",
      cancelButtonText: "Cancel",
      cancelButtonColor: "#6b7280"
    });

    if (result.isConfirmed) {
      handleStatusTransition(row, "Opened");
    } else if (result.isDenied) {
      const permitType = row.permit_type || "";
      const permitUnder = row.permit_under || "";
      const isBothConstruction = (permitUnder === "Construction" && permitType === "Construction");
      const isBothCommissioning = (permitUnder === "Commissioning" && permitType === "Commissioning");
      const isUnderConstTypeComm = (permitUnder === "Construction" && permitType === "Commissioning");
      const isUnderCommTypeConst = (permitUnder === "Commissioning" && permitType === "Construction");

      if (!isAdmin) {
        if (isBothConstruction && !isDept) {
          return showError("Only CONM role can reject Construction-only permits.");
        }
        if (isBothCommissioning && !isDept1) {
          return showError("Only COMM role can reject Commissioning-only permits.");
        }
        if (isUnderConstTypeComm && !isDept) {
          return showError("Only CONM role can reject Construction permits under Commissioning.");
        }
        if (isUnderCommTypeConst && !isDept1) {
          return showError("Only COMM role can reject Commissioning permits under Construction.");
        }
      }
      handleStatusTransition(row, "Rejected");
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!modalTarget) return;

    let nextStatus = submitStatusOverride || modalStatus;
    if (modalStatus === "Pre-Approved" && approveActionType === "Reject") {
      nextStatus = "Rejected";
    }
    if (modalStatus === "Opened" && openActionType === "Cancel") {
      nextStatus = "Cancelled";
    }

    const payload = {
      userId: currentUser?.id || 1,
      Request_status: nextStatus,
      createdTime: getDenmarkTimeISOString()
    };

    if (nextStatus === "Rejected") {
      if (!rejectReason.trim()) return showError("Please specify rejection reason.");
      payload.reject_reason = rejectReason.trim();

      if (!isAdmin) {
        const permitType = modalTarget.permit_type || "";
        const permitUnder = modalTarget.permit_under || "";
        const isBothConstruction = (permitUnder === "Construction" && permitType === "Construction");
        const isBothCommissioning = (permitUnder === "Commissioning" && permitType === "Commissioning");
        const isUnderConstTypeComm = (permitUnder === "Construction" && permitType === "Commissioning");
        const isUnderCommTypeConst = (permitUnder === "Commissioning" && permitType === "Construction");

        const curStatus = modalTarget?.Request_status || modalTarget?.request_status || "";
        if (curStatus === "Approved" || curStatus === "Pre-Approved") {
          if (isBothConstruction && !isDept) {
            return showError("Only CONM role can reject Construction-only permits.");
          }
          if (isBothCommissioning && !isDept1) {
            return showError("Only COMM role can reject Commissioning-only permits.");
          }
          if (isUnderConstTypeComm && !isDept) {
            return showError("Only CONM role can reject Construction permits under Commissioning.");
          }
          if (isUnderCommTypeConst && !isDept1) {
            return showError("Only COMM role can reject Commissioning permits under Construction.");
          }
        }
      }
    } else if (nextStatus === "Cancelled") {
      if (!cancelReason.trim()) return showError("Please specify cancel reason.");
      payload.cancel_reason = cancelReason.trim();
    } else if (nextStatus === "Opened") {
      if (modalStatus === "Opened") {
        const workingDateVal = modalTarget?.Working_Date || modalTarget?.workingDate || modalTarget?.working_date || "";
        if (!isTodayDate(workingDateVal)) {
          return showError("Permits can only be opened on their active Working Date. You can only cancel this permit.");
        }
        if (!initials.trim()) return showError("Supervisor Full Name / Phone Number is required.");
        payload.ConM_initials1 = initials.trim();
        if (modalTarget.Hot_work === 1) {
          if (Number(lowRiskHotwork) !== 1 && Number(highRiskHotwork) !== 1) {
            return showError("Please select either Low Risk or High Risk for the Hot Work permit.");
          }
          if (Number(highRiskHotwork) === 1) {
            if (Number(hotWorkChecklistFilled) !== 1 || Number(fireGuardPresent) !== 1) {
              return showError("High Risk Hot Work permits require both checklist to be filled and fire guard to be present.");
            }
          }
          payload.low_risk_hotwork = Number(lowRiskHotwork);
          payload.high_risk_hotwork = Number(highRiskHotwork);
          payload.hot_work_checklist_filled = Number(hotWorkChecklistFilled);
          payload.fire_guard_present = Number(fireGuardPresent);
        }
      } else {
        payload.ConM_initials1 = modalTarget.ConM_initials1 || "";
      }
    } else if (nextStatus === "Closed") {
      if (!closeNote.trim()) return showError("Please enter closing notes / remarks.");
      payload.close_note = closeNote.trim();
      if (modalTarget.Hot_work === 1) {
        if (hHeatSource === "" || hHeatSource === null || hHeatSource === undefined) {
          return showError("Please inspect the work area for smoldering materials or residual heat.");
        }
        if (hWorkplaceCheck === "" || hWorkplaceCheck === null || hWorkplaceCheck === undefined) {
          return showError("Please confirm if all tools and equipment have been removed.");
        }
        if (hFireDetectors === "" || hFireDetectors === null || hFireDetectors === undefined) {
          return showError("Please confirm if the area has been cleaned and restored.");
        }
        if (!hStartTime || !hEndTime) {
          return showError("Please specify check start and end times.");
        }
        payload.h_heat_source = String(hHeatSource);
        payload.h_workplace_check = String(hWorkplaceCheck);
        payload.h_fire_detectors = String(hFireDetectors);
        payload.h_start_time = hStartTime;
        payload.h_end_time = hEndTime;
      }
    } else if (nextStatus === "Pre-Approved" || nextStatus === "Approved") {
      if (!initials.trim()) return showError("Initials signature is required.");
      const permitType = modalTarget.permit_type || "";
      const permitUnder = modalTarget.permit_under || "";

      if (nextStatus === "Pre-Approved") {
        if (permitType === "Construction" && permitUnder === "Commissioning") {
          payload.ConM_initials = initials.trim();
        } else if (permitType === "Commissioning" && permitUnder === "Construction") {
          payload.CoMM_initials = initials.trim();
        }
      } else if (nextStatus === "Approved") {
        if (permitType === "Commissioning" && permitUnder === "Commissioning") {
          payload.CoMM_initials = initials.trim();
        } else if (permitType === "Construction" && permitUnder === "Construction") {
          payload.ConM_initials = initials.trim();
        } else if (permitType === "Construction" && permitUnder === "Commissioning") {
          payload.CoMM_initials = initials.trim();
          payload.ConM_initials = modalTarget.ConM_initials || "";
        } else if (permitType === "Commissioning" && permitUnder === "Construction") {
          payload.ConM_initials = initials.trim();
          payload.CoMM_initials = modalTarget.CoMM_initials || "";
        }
      }
    }

    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(payload)) {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      }
      if (closingImageFiles && closingImageFiles.length > 0) {
        closingImageFiles.forEach((imgObj) => {
          formData.append("images[]", imgObj.file);
        });
      }
      await updateRequest(modalTarget.id, formData);
      showSuccess(`Status changed to ${nextStatus} successfully`);
      setActiveModal(null);
      fetchRequests(currentPage);
    } catch (err) {
      const backendMsg = err?.response?.data?.message;
      const errMsg = Array.isArray(backendMsg)
        ? backendMsg.join(", ")
        : (typeof backendMsg === "string" ? backendMsg : null) || err?.message || "Status update failed";
      showError(errMsg);
    }
  };

  // Bulk Actions
  const validateBulkAction = () => {
    if (selectedIds.length === 0) return false;
    const restrictedStatuses = ["cancelled", "auto-cancelled", "auto cancelled", "closed", "rejected"];
    const hasRestricted = requests
      .filter((r) => selectedIds.includes(r.id))
      .some((r) => {
        const status = (r.Request_status || r.requestStatus || "").toLowerCase();
        return restrictedStatuses.includes(status);
      });

    if (hasRestricted) {
      showError("Bulk operations are not allowed on Cancelled, Auto-Cancelled, Closed, or Rejected permits.");
      return false;
    }
    return true;
  };

  const handleBulkStatusChange = (status) => {
    if (!validateBulkAction()) return;
    const targetRequests = requests.filter(r => selectedIds.includes(r.id));

    if (status === "Opened") {
      const invalidApproved = targetRequests.find(
        r => (r.Request_status === "Approved" || r.request_status === "Approved") &&
          !isTodayDate(r.Working_Date || r.workingDate || r.working_date)
      );

      if (invalidApproved) {
        return showError("Status change to Opened is restricted for Approved permits when working date is not today.");
      }
    }

    if (status === "Rejected" && !isAdmin) {
      for (const r of targetRequests) {
        const curStatus = (r.Request_status || r.request_status || "");
        if (curStatus === "Approved" || curStatus === "Pre-Approved") {
          const pType = r.permit_type || "";
          const pUnder = r.permit_under || "";
          const isBothConst = (pUnder === "Construction" && pType === "Construction");
          const isBothComm = (pUnder === "Commissioning" && pType === "Commissioning");
          const isConstUnderComm = (pUnder === "Construction" && pType === "Commissioning");
          const isCommUnderConst = (pUnder === "Commissioning" && pType === "Construction");

          if (isBothConst && !isDept) {
            return showError(`Permit #${r.PermitNo || r.id}: Only CONM role can reject Construction-only permits.`);
          }
          if (isBothComm && !isDept1) {
            return showError(`Permit #${r.PermitNo || r.id}: Only COMM role can reject Commissioning-only permits.`);
          }
          if (isConstUnderComm && !isDept) {
            return showError(`Permit #${r.PermitNo || r.id}: Only CONM role can reject Construction permits under Commissioning.`);
          }
          if (isCommUnderConst && !isDept1) {
            return showError(`Permit #${r.PermitNo || r.id}: Only COMM role can reject Commissioning permits under Construction.`);
          }
        }
      }
    }

    setModalTarget(targetRequests);
    setModalStatus(status);
    setInitials("");
    setRejectReason("");
    setActiveModal("status-bulk");
  };

  const handleBulkStatusSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      id: selectedIds.join(","),
      Request_status: modalStatus,
      userId: currentUser?.id || 1
    };

    if (modalStatus === "Rejected") {
      payload.reject_reason = rejectReason.trim();
    } else {
      if (initials.trim()) {
        payload.initials = initials.trim();
        payload.ConM_initials = initials.trim();
        payload.CoMM_initials = initials.trim();
        payload.ConM_initials1 = initials.trim();
      }
    }

    try {
      const result = await updateListStatusRequest(payload);
      if (result && result.failed && result.failed.length > 0) {
        Swal.fire({
          title: "Bulk Status Update Results",
          html: `<div style="text-align: left;">
            <p style="color: #22c55e; font-weight: bold; margin-bottom: 4px;">Successfully updated: ${result.successfulIds?.length || 0} permits</p>
            <p style="color: #ef4444; font-weight: bold; margin-top: 0;">Failed/Skipped: ${result.failed.length} permits</p>
            <hr style="border: 0; border-top: 1.5px solid #374151; margin: 12px 0;" />
            <div style="max-height: 200px; overflow-y: auto; font-size: 13px; color: #d1d5db; line-height: 1.5;">
              ${result.failed.map(f => `<p style="margin: 6px 0;"><strong>ID ${f.id}:</strong> ${f.error}</p>`).join("")}
            </div>
          </div>`,
          icon: "warning",
          confirmButtonText: "OK",
          confirmButtonColor: "#ca8a04",
          background: "#111827",
          color: "#ffffff"
        });
      } else {
        showSuccess(`Selected permits status changed to ${modalStatus} successfully`);
      }
      setActiveModal(null);
      fetchRequests(currentPage);
    } catch (err) {
      const backendMsg = err?.response?.data?.message;
      const errMsg = Array.isArray(backendMsg)
        ? backendMsg.join(", ")
        : (typeof backendMsg === "string" ? backendMsg : null) || err?.message || "Bulk status update failed";
      showError(errMsg);
    }
  };

  // Bulk Edit Dialogs
  const handleBulkTimeEdit = () => {
    if (!validateBulkAction()) return;
    setBulkTime({ startTime: "", endTime: "", nightShift: false, newEndTime: "" });
    setActiveModal("time");
  };

  const handleBulkTimeSubmit = async (e) => {
    e.preventDefault();

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

    // Validate input formats if they are entered
    if (bulkTime.startTime && !timeRegex.test(bulkTime.startTime)) {
      showError("Start time must be in 24-hour format (HH:MM).");
      return;
    }
    if (bulkTime.endTime && !timeRegex.test(bulkTime.endTime)) {
      showError("End time must be in 24-hour format (HH:MM).");
      return;
    }
    if (bulkTime.nightShift && bulkTime.newEndTime && !timeRegex.test(bulkTime.newEndTime)) {
      showError("New End time must be in 24-hour format (HH:MM).");
      return;
    }

    // Validate relationships between start and end times (if provided)
    if (bulkTime.startTime) {
      if (bulkTime.nightShift) {
        if (bulkTime.newEndTime) {
          if (bulkTime.newEndTime >= bulkTime.startTime) {
            showError("For working after midnight, new end time must be earlier than start time.");
            return;
          }
        }
      } else {
        if (bulkTime.endTime) {
          if (bulkTime.startTime >= bulkTime.endTime) {
            showError("Start time must be earlier than End time.");
            return;
          }
        }
      }
    }

    const payload = {
      id: selectedIds.join(","),
      Start_Time: bulkTime.startTime ? `${bulkTime.startTime}:00` : "",
      End_Time: bulkTime.endTime ? `${bulkTime.endTime}:00` : "",
      night_shift: bulkTime.nightShift ? 1 : 0,
      new_end_time: bulkTime.newEndTime ? `${bulkTime.newEndTime}:00` : "",
      logs: []
    };
    try {
      const result = await updateListReqstTime(payload);
      if (result && result.failed && result.failed.length > 0) {
        Swal.fire({
          title: "Bulk Time Update Results",
          html: `<div style="text-align: left;">
            <p style="color: #22c55e; font-weight: bold; margin-bottom: 4px;">Successfully updated: ${result.successfulIds?.length || 0} permits</p>
            <p style="color: #ef4444; font-weight: bold; margin-top: 0;">Failed/Skipped: ${result.failed.length} permits</p>
            <hr style="border: 0; border-top: 1.5px solid #374151; margin: 12px 0;" />
            <div style="max-height: 200px; overflow-y: auto; font-size: 13px; color: #d1d5db; line-height: 1.5;">
              ${result.failed.map(f => `<p style="margin: 6px 0;"><strong>ID ${f.id}:</strong> ${f.error}</p>`).join("")}
            </div>
          </div>`,
          icon: "warning",
          confirmButtonText: "OK",
          confirmButtonColor: "#ca8a04",
          background: "#111827",
          color: "#ffffff"
        });
      } else {
        showSuccess("Selected permits time/shift updated successfully");
      }
      setActiveModal(null);
      fetchRequests(currentPage);
    } catch {
      showError("Bulk time update failed");
    }
  };

  const handleBulkSafetyEdit = () => {
    if (!validateBulkAction()) return;
    setBulkSafety([]);
    setIsPrecautionsDropdownOpen(false);
    setActiveModal("safety");
  };

  const handleBulkSafetySubmit = async (e) => {
    e.preventDefault();
    const payload = {
      id: selectedIds.join(","),
      safety: bulkSafety.join(","),
      logs: []
    };
    try {
      await updateListReqstSafety(payload);
      showSuccess("Selected permits safety instructions updated successfully");
      setActiveModal(null);
      fetchRequests(currentPage);
    } catch (err) {
      const backendMsg = err?.response?.data?.message;
      const errMsg = Array.isArray(backendMsg)
        ? backendMsg.join(", ")
        : (typeof backendMsg === "string" ? backendMsg : null) || err?.message || "Bulk safety update failed";
      showError(errMsg);
    }
  };

  const handleBulkNotesEdit = () => {
    if (!validateBulkAction()) return;
    setBulkNote("");
    setActiveModal("notes");
  };

  const handleBulkNotesSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      request_id: selectedIds.join(","),
      permit_no: requests.filter(r => selectedIds.includes(r.id)).map(r => r.PermitNo).join(","),
      user_id: currentUser?.id || 1,
      username: currentUser?.displayName || currentUser?.username || "Operator",
      note: bulkNote.trim()
    };
    try {
      await addListReqstNote(payload);
      showSuccess("Selected permits note added successfully");
      setActiveModal(null);
      fetchRequests(currentPage);
    } catch {
      showError("Bulk notes submission failed");
    }
  };

  // Copy permit request to range
  const handleCopyTrigger = (row) => {
    setModalTarget(row);
    const isNight = row.night_shift === 1 || row.night_shift === true || row.night_shift === "1";
    const formatTimeHHMM = (t) => {
      if (!t) return "";
      const str = String(t).trim();
      return str.length >= 5 ? str.substring(0, 5) : str;
    };
    setCopyDates({
      from: "",
      to: "",
      startTime: formatTimeHHMM(row.Start_Time || row.start_time),
      endTime: isNight ? "23:59" : formatTimeHHMM(row.End_Time || row.end_time),
      nightShift: isNight,
      newEndTime: formatTimeHHMM(row.New_End_Time || row.new_end_time)
    });
    setShowCopyStartPicker(false);
    setShowCopyEndPicker(false);
    setShowCopyNewEndPicker(false);
    setActiveModal("copy");
  };

  const handleCopySubmit = async (e) => {
    e.preventDefault();
    if (!copyDates.from || !copyDates.to) return showError("Please select date range.");
    if (!copyDates.startTime) return showError("Please enter Start Time.");
    if (!copyDates.endTime) return showError("Please enter End Time.");
    if (copyDates.nightShift && !copyDates.newEndTime) return showError("Working after midnight requires a New End Time.");

    const oneDay = 24 * 60 * 60 * 1000;
    const fromVal = new Date(copyDates.from);
    const toVal = new Date(copyDates.to);

    if (toVal < fromVal) return showError("End date cannot be earlier than start date.");

    if (!copyDates.nightShift && copyDates.endTime < copyDates.startTime) {
      return showError("End Time cannot be earlier than Start Time for a day shift.");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (fromVal < today || toVal < today) {
      return showError("Dates cannot be in the past.");
    }
    const diffDays = Math.round(Math.abs((toVal - fromVal) / oneDay)) + 1;

    // Build zone array by matching room names against DB roomsList/zonesList & ZONE_MAPPING
    const zoneObjects = resolveZoneObjectsFromRequest(modalTarget, zonesList, roomsList);

    const payload = {
      userId: currentUser?.id || 1,
      Request_status: modalTarget.Request_status || "Pending",
      Room_Nos: modalTarget.Room_Nos,
      Room_Type: modalTarget.Room_Type,
      Site_Id: modalTarget.Site_Id ? Number(modalTarget.Site_Id) : 5,
      Start_Time: copyDates.startTime ? (copyDates.startTime.length === 5 ? `${copyDates.startTime}:00` : copyDates.startTime) : "",
      Sub_Contractor_Id: modalTarget.Sub_Contractor_Id ? Number(modalTarget.Sub_Contractor_Id) : null,
      Type_Of_Activity_Id: modalTarget.Type_Of_Activity_Id ? String(modalTarget.Type_Of_Activity_Id) : "",
      Assign_Start_Time: copyDates.startTime ? (copyDates.startTime.length === 5 ? `${copyDates.startTime}:00` : copyDates.startTime) : "",
      Assign_End_Time: copyDates.endTime ? (copyDates.endTime.length === 5 ? `${copyDates.endTime}:00` : copyDates.endTime) : "",
      Assign_Start_Date: copyDates.from,
      Assign_End_Date: copyDates.to,
      Building_Id: modalTarget.Building_Id ? Number(modalTarget.Building_Id) : null,
      Company_Name: modalTarget.Company_Name,
      End_Time: copyDates.endTime ? (copyDates.endTime.length === 5 ? `${copyDates.endTime}:00` : copyDates.endTime) : "",
      New_End_Time: copyDates.nightShift ? (copyDates.newEndTime ? (copyDates.newEndTime.length === 5 ? `${copyDates.newEndTime}:00` : copyDates.newEndTime) : undefined) : undefined,
      night_shift: copyDates.nightShift ? 1 : 0,
      Number_Of_Workers: modalTarget.Number_Of_Workers || undefined,
      Floor_Id: modalTarget.Floor_Id ? Number(modalTarget.Floor_Id) : null,
      Foreman: modalTarget.Foreman,
      Foreman_Phone_Number: modalTarget.Foreman_Phone_Number,
      PermitNo: modalTarget.PermitNo,
      count: diffDays,
      createdTime: getDenmarkTimeISOString(),
      zone: zoneObjects
    };

    try {
      await createByCount(payload);
      showSuccess("Permits copied successfully");
      setActiveModal(null);
      fetchRequests(currentPage);
} catch (err) {
  console.log("COPY ERR:", err, err?.response?.data);
  const backendMsg = err?.response?.data?.message;
  const errMsg = Array.isArray(backendMsg)
    ? backendMsg.join(", ")
    : (typeof backendMsg === "string" ? backendMsg : null) || err?.message || "Copy operation failed";
  showError(errMsg);
}
  };

  const selectableRequestsCount = useMemo(() => {
    return requests.filter(r => !checkIfHideCheckbox(r)).length;
  }, [requests, checkIfHideCheckbox]);

  // ─── Table Configuration ──────────────────────────────────────────────────
  const columns = [
    {
      header: !isObserver && !isSubcontractor && (
        <input
          type="checkbox"
          checked={selectableRequestsCount > 0 && selectedIds.length === selectableRequestsCount}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      accessor: "checkboxCell",
      className: "sticky-col-checkbox",
      style: { width: "40px", textAlign: "center" }
    },
    { header: "Permit Number", accessor: "PermitNo" },
    { header: "HRA'S", accessor: "hraCell" },
    { header: "Permit Under", accessor: "permit_under" },
    { header: "Request Date", accessor: "Request_Date" },
    { header: "Permit Type", accessor: "permit_type" },
    { header: "Activity", accessor: "Activity" },
    { header: "Contractor", accessor: "contractorName" },
    { header: "Building", accessor: "buildingName" },
    { header: "Level", accessor: "Room_Type" },
    { header: "Zone", accessor: "zone" },
    { header: "Rooms", accessor: "rooms" },
    { header: "Working Date", accessor: "Working_Date" },
    { header: "Time", accessor: "timeCell" },
    { header: "Working After Midnight", accessor: "nightShiftCell" },
    { header: "New End Time", accessor: "newEndTimeCell" },
    { header: "Status", accessor: "statusCell", className: "sticky-col-status" },
    { header: "Operations", accessor: "operationsCell", className: "sticky-col-operations", style: { width: "180px", minWidth: "180px", maxWidth: "180px" } }
  ].filter(col => {
    if (col.accessor === "checkboxCell" && (isObserver || isSubcontractor)) {
      return false;
    }
    return true;
  });

  const tableData = useMemo(() => {
    return requests.map((row) => {
      // Find contractor name
      const contrObj = contractors.find(c => String(c.id) === String(row.Sub_Contractor_Id));
      const contractorName = contrObj ? contrObj.subContractorName : (row.Company_Name || "—");

      // Find building name
      const buildObj = buildingsList.find(b => Number(b.build_id) === Number(row.Building_Id));
      const buildingName = buildObj ? buildObj.building_name : "—";

      // Find area (zone) name safely
      const zoneName = resolveZoneNameFromRooms(row);

      // Find Level (Room_Type) name safely
      const roomTypeCell = (row.Room_Type && typeof row.Room_Type === "object")
        ? (row.Room_Type.floor_name || row.Room_Type.name || "—")
        : (row.Room_Type || "—");

      // Formatted Start/End time
      const timeCell = (row.Start_Time && row.End_Time)
        ? `${row.Start_Time.slice(0, 5)} - ${row.End_Time.slice(0, 5)}`
        : "—";

      // Night Shift status
      const nightShiftCell = (row.night_shift === 1 || row.night_shift === "1") ? "Yes" : "No";

      // New End Time value
      const newEndTimeCell = row.new_end_time ? row.new_end_time.slice(0, 5) : "—";

      // HRA icons logic — only show logos for active HRAs (no black-and-white for inactive)
      const activeHras = HRA_LIST.filter(hra => row[hra.key] === 1 || row[hra.key] === "1" || row[hra.key] === true);
      const hraCell = (
        <div className="hra-icons-group">
          {activeHras.map((hra) => (
            <img
              key={hra.key}
              src={hra.image || LOGO_MAP[hra.icon]}
              alt={hra.label}
              className="hra-icon-thumb"
              title={hra.label}
            />
          ))}
          {activeHras.length === 0 && <span style={{ color: "#4b5563" }}>—</span>}
        </div>
      );

      const isDept1Commissioning = isDept1 && (
        String(row.permit_under).toLowerCase() === "commissioning" ||
        String(row.permit_type).toLowerCase() === "commissioning"
      );

      const isMultiDept = isDept && isDept1;

      const isEditable = (() => {
        const isStatusAllowed = row.Request_status !== "Cancelled" &&
          row.Request_status !== "Closed" &&
          row.Request_status !== "Rejected" &&
          row.Request_status !== "Auto-Cancelled" &&
          row.Request_status !== "Auto Cancelled" &&
          currentUser?.role !== "Observer";

        if (!isStatusAllowed) return false;
        if (isSubcontractor) {
          return row.Request_status === "Draft";
        }
        if (row.Request_status === "Opened") {
          if (!isAdmin && !isDept && !isDept1 && !isMultiDept) return false;
        }
        if (isAdmin || isMultiDept) return true;

        if (isDept) {
          const eitherIsConstruction = String(row.permit_under).toLowerCase() === "construction" ||
            String(row.permit_type).toLowerCase() === "construction";
          return eitherIsConstruction;
        }

        if (isDept1) {
          return isDept1Commissioning;
        }

        return false;
      })();

      const isDeletable = (() => {
        if (isDept || isDept1 || isMultiDept) return false;
        if (isAdmin) return true;

        return false;
      })();

      const isCopyable = (() => {
        if (currentUser?.role === "Observer") return false;
        if (isAdmin || isSubcontractor || isMultiDept) return true;

        if (isDept) {
          const eitherIsConstruction = String(row.permit_under).toLowerCase() === "construction" ||
            String(row.permit_type).toLowerCase() === "construction";
          return eitherIsConstruction;
        }

        if (isDept1) {
          const bothAreConstruction = String(row.permit_under).toLowerCase() === "construction" &&
            String(row.permit_type).toLowerCase() === "construction";
          return !bothAreConstruction;
        }

        return false;
      })();

      // Status chip render
      const statusClass = `status-badge status-badge--${row.Request_status?.toLowerCase().replace(" ", "-")}`;

      const handleStatusClick = () => {
        // If status is Draft, click opens edit form
        if (row.Request_status === "Draft") {
          if (isEditable) {
            handleEditClick(row);
          }
          return;
        }

        // Subcontractor opening or closing permit
        if (isSubcontractor) {
          if (row.Request_status === "Approved") {
            handleStatusTransition(row, "Opened");
          } else if (row.Request_status === "Opened") {
            handleStatusTransition(row, "Closed");
          }
        }
        // Operator approving/pre-approving
        else if (canBulkAction) {
          if (row.Request_status === "Hold") {
            const permitType = row.permit_type || "";
            const permitUnder = row.permit_under || "";
            // Matched configurations go directly to Approved
            if (
              (permitType === "Commissioning" && permitUnder === "Commissioning") ||
              (permitType === "Construction" && permitUnder === "Construction")
            ) {
              handleStatusTransition(row, "Approved");
            } else {
              // Mismatched configurations go to Pre-Approved first
              handleStatusTransition(row, "Pre-Approved");
            }
          } else if (row.Request_status === "Pre-Approved") {
            handleStatusTransition(row, "Approved");
          } else if (row.Request_status === "Approved") {
            promptApprovedAction(row);
          } else if (row.Request_status === "Opened") {
            handleStatusTransition(row, "Closed");
          }
        }
      };

      const statusCell = (
        <span
          className={statusClass}
          onClick={handleStatusClick}
          style={{ cursor: "pointer" }}
        >
          {row.Request_status}
        </span>
      );

      const isEditLoading = loadingEditId === row.id;

      const operationsCell = (
        <div className="list-operations-cell">
          {isEditable && (
            <button
              className="op-action-btn op-action-btn--edit"
              title="Edit Request"
              onClick={() => handleEditClick(row)}
              disabled={isEditLoading}
              style={{ opacity: isEditLoading ? 0.7 : 1, cursor: isEditLoading ? "not-allowed" : "pointer" }}
            >
              {isEditLoading ? <span className="spinner-mini" /> : <FaEdit />}
            </button>
          )}

          <a
            href={`${API_BASE_URL.replace(/\/$/, "")}/requests/permit-design/${row.PermitNo}`}
            target="_blank"
            rel="noreferrer"
            className="op-action-btn op-action-btn--view"
            title="View Details Drawing"
          >
            <FaEye />
          </a>

          {isCopyable && (
            <button
              className="op-action-btn op-action-btn--copy"
              title="Copy Request"
              onClick={() => handleCopyTrigger(row)}
            >
              <FaCopy />
            </button>
          )}

          {isDeletable && (
            <button
              className="op-action-btn op-action-btn--delete"
              title="Delete Request"
              onClick={() => handleRowDelete(row)}
            >
              <FaTrash />
            </button>
          )}

          {/* <button
            className="op-action-btn op-action-btn--history"
            title="History Logs"
            onClick={() => handleViewLogs(row)}
          >
            <FaHistory />
          </button> */}
        </div>
      );

      return {
        ...row,
        _rowClassName: selectedIds.includes(row.id) ? "row-selected" : "",
        checkboxCell: !checkIfHideCheckbox(row) ? (
          <input
            type="checkbox"
            checked={selectedIds.includes(row.id)}
            onChange={(e) => handleSelectRow(e.target.checked, row.id)}
          />
        ) : null,
        contractorName: trimLongValue(contractorName, 25),
        buildingName: trimLongValue(buildingName, 20),
        zone: trimLongValue(zoneName, 20),
        Room_Type: trimLongValue(roomTypeCell, 20),
        rooms: trimLongValue(row.room_names || row.Room_Nos, 25),
        Request_Date: formatDateToDDMMYYYY(row.Request_Date),
        Working_Date: formatDateToDDMMYYYY(row.Working_Date),
        Activity: trimLongValue(row.Activity, 30),
        timeCell,
        nightShiftCell,
        newEndTimeCell,
        hraCell,
        statusCell,
        operationsCell
      };
    });
  }, [requests, selectedIds, contractors, buildingsList, isSubcontractor, canBulkAction, isAdmin, currentUser]);

  const totalPages = Math.ceil(totalCount / limit);

  // ─── Render UI ────────────────────────────────────────────────────────────
  return (
    <div className="dept-page">
      {/* Page Header */}
      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Work Permits &amp; Requests</h1>
          <p className="dept-page-subtitle">Track, filter, sign, and manage all active safety work permits</p>
        </div>
        <div className="dept-page-header__right">
          <button
            className="filters-toggle-btn dept-filters-btn"
            onClick={() => setFiltersOpen(p => !p)}
          >
            <FaFilter />
            {filtersOpen ? "Hide Filters" : "Show Filters"}
          </button>
          {currentUser?.role !== "Observer" && (
            <button className="dept-add-btn" onClick={() => navigate("/new-request")}>
              <FaPlus style={{ marginRight: "6px" }} />
              New Permit Request
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Search Filters Card */}
      {filtersOpen && (
        <div className="form-card filters-card-wrapper premium-form-container">
          <form
            onSubmit={handleSearchSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchSubmit(e);
              }
            }}
            className="df-form"
          >
            <div className="df-grid">
              {/* Row 1: Working Date range (From) | Working Date range (To) */}
              <div className="df-field">
                <label className="df-label">Working Date range (From)</label>
                <input
                  type="date"
                  className="df-input"
                  value={searchFilters.fromDate}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                />
              </div>

              <div className="df-field">
                <label className="df-label">Working Date range (To)</label>
                <input
                  type="date"
                  className="df-input"
                  value={searchFilters.toDate}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, toDate: e.target.value }))}
                />
              </div>

              {/* Row 2: Building | Level / Floor */}
              <div className="df-field">
                <label className="df-label">Building</label>
                <MultiSelectDropdown
                  placeholder="Select Buildings"
                  options={buildingsList}
                  selectedValues={searchFilters.buildings}
                  onChange={(vals) => setSearchFilters(prev => ({ ...prev, buildings: vals, levels: [], areas: [] }))}
                />
              </div>

              <div className="df-field">
                <label className="df-label">Level / Floor</label>
                <MultiSelectDropdown
                  placeholder="Select Levels"
                  options={filteredLevels.map(f => f.floor_name)}
                  selectedValues={searchFilters.levels}
                  onChange={(vals) => setSearchFilters(prev => ({ ...prev, levels: vals, areas: [], zones: [] }))}
                />
              </div>

              {/* Row 3: Zones | Rooms */}
              <div className="df-field">
                <label className="df-label">Zones</label>
                <MultiSelectDropdown
                  placeholder="Select Zones"
                  options={filteredZones.map(z => z.zone)}
                  selectedValues={searchFilters.zones || []}
                  onChange={(vals) => setSearchFilters(prev => ({ ...prev, zones: vals, areas: [] }))}
                />
              </div>

              <div className="df-field">
                <label className="df-label">Rooms</label>
                <MultiSelectDropdown
                  placeholder="Select Rooms"
                  options={filteredRooms}
                  selectedValues={searchFilters.areas}
                  onChange={(vals) => setSearchFilters(prev => ({ ...prev, areas: vals }))}
                />
              </div>

              {/* Row 4: Contractor | Permit Status */}
              <div className="df-field">
                <label className="df-label">Contractor</label>
                {isSubcontractor ? (
                  <input
                    type="text"
                    className="df-input df-readonly"
                    value={contractors.length > 0 ? (contractors.find(c => String(c.id) === String(currentUser?.typeId))?.subContractorName || contractors[0]?.subContractorName) : "Loading..."}
                    readOnly
                  />
                ) : (
                  <MultiSelectDropdown
                    placeholder="Select Contractors"
                    options={contractors}
                    selectedValues={searchFilters.contractors}
                    onChange={(vals) => setSearchFilters(prev => ({ ...prev, contractors: vals }))}
                  />
                )}
              </div>

              <div className="df-field">
                <label className="df-label">Permit Status</label>
                <MultiSelectDropdown
                  placeholder="Select Statuses"
                  options={STATUS_OPTIONS}
                  selectedValues={searchFilters.statuses}
                  onChange={(vals) => setSearchFilters(prev => ({ ...prev, statuses: vals }))}
                />
              </div>

              {/* Row 5: Type of activity | Keyword (Activity) */}
              <div className="df-field">
                <label className="df-label">Type of activity</label>
                <select
                  className="df-select"
                  value={searchFilters.typeOfActivityId}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, typeOfActivityId: e.target.value }))}
                >
                  <option value="">All Activities</option>
                  {activitiesList.map(act => (
                    <option key={act.id} value={act.id}>{act.activityName}</option>
                  ))}
                </select>
              </div>

              <div className="df-field">
                <label className="df-label">Keyword (Activity)</label>
                <input
                  type="text"
                  className="df-input"
                  placeholder="e.g. Piping, welding..."
                  value={searchFilters.keyword}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, keyword: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchSubmit(e);
                    }
                  }}
                />
              </div>

              {/* Row 6: Start Time | End Time | Night Shift */}
              <div className="df-field--full time-nightshift-grid">
                <div className="df-field">
                  <label className="df-label">Start Time</label>
                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      type="text"
                      placeholder="00:00"
                      readOnly
                      className="df-input"
                      value={searchFilters.startTime}
                      onClick={() => setShowStartPicker(true)}
                      style={{ cursor: 'pointer', paddingRight: searchFilters.startTime ? "30px" : "12px" }}
                    />
                    {searchFilters.startTime && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchFilters(prev => ({ ...prev, startTime: "" }));
                        }}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "var(--text-muted, #9ca3af)",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "4px"
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {showStartPicker && (
                    <div className="timekeeper-modal-overlay" onClick={() => setShowStartPicker(false)}>
                      <AnalogTimePicker
                        initialTime={searchFilters.startTime || "12:00"}
                        onSave={(newTime) => {
                          setSearchFilters(prev => ({ ...prev, startTime: newTime }));
                          setShowStartPicker(false);
                        }}
                        onCancel={() => setShowStartPicker(false)}
                      />
                    </div>
                  )}
                </div>

                <div className="df-field">
                  <label className="df-label">End Time</label>
                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      type="text"
                      placeholder="00:00"
                      readOnly
                      className="df-input"
                      value={searchFilters.endTime}
                      onClick={() => setShowEndPicker(true)}
                      style={{ cursor: 'pointer', paddingRight: searchFilters.endTime ? "30px" : "12px" }}
                    />
                    {searchFilters.endTime && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchFilters(prev => ({ ...prev, endTime: "" }));
                        }}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "var(--text-muted, #9ca3af)",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "4px"
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {showEndPicker && (
                    <div className="timekeeper-modal-overlay" onClick={() => setShowEndPicker(false)}>
                      <AnalogTimePicker
                        initialTime={searchFilters.endTime || "12:00"}
                        onSave={(newTime) => {
                          setSearchFilters(prev => ({ ...prev, endTime: newTime }));
                          setShowEndPicker(false);
                        }}
                        onCancel={() => setShowEndPicker(false)}
                      />
                    </div>
                  )}
                </div>

                <div className="df-field" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "46px", paddingLeft: "12px", border: "1.5px solid var(--border-color, #374151)", borderRadius: "12px", backgroundColor: "var(--bg-card, #111827)" }}>
                    <input
                      type="checkbox"
                      id="listRequestNightShiftCheckbox"
                      checked={Boolean(searchFilters.nightShift === "1" || searchFilters.nightShift === 1 || searchFilters.nightShift === true)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSearchFilters(prev => ({
                          ...prev,
                          nightShift: checked ? "1" : "",
                          newDate: checked ? prev.newDate : "",
                          newEndTime: checked ? prev.newEndTime : ""
                        }));
                      }}
                      style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent, #00e5a0)" }}
                    />
                    <label htmlFor="listRequestNightShiftCheckbox" className="df-label" style={{ margin: 0, cursor: "pointer", textTransform: "none", fontSize: "14px", fontWeight: "normal", color: "var(--text-main, #f9fafb)" }}>
                      Working after midnight? Yes
                    </label>
                  </div>
                </div>
              </div>

              {/* Conditional Working After Midnight Fields */}
              {(searchFilters.nightShift === "1" || searchFilters.nightShift === 1 || searchFilters.nightShift === true) && (
                <>
                  <div className="df-field">
                    <label className="df-label">New Date</label>
                    <input
                      type="date"
                      className="df-input"
                      value={searchFilters.newDate || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, newDate: e.target.value }))}
                    />
                  </div>
                  <div className="df-field">
                    <label className="df-label">New End Time</label>
                    <div style={{ position: "relative", width: "100%" }}>
                      <input
                        type="text"
                        placeholder="00:00"
                        readOnly
                        className="df-input"
                        value={searchFilters.newEndTime || ""}
                        onClick={() => setShowSearchNewEndPicker(true)}
                        style={{ cursor: 'pointer', paddingRight: searchFilters.newEndTime ? "30px" : "12px" }}
                      />
                      {searchFilters.newEndTime && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchFilters(prev => ({ ...prev, newEndTime: "" }));
                          }}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            color: "var(--text-muted, #9ca3af)",
                            cursor: "pointer",
                            fontSize: "14px",
                            padding: "4px"
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {showSearchNewEndPicker && (
                      <div className="timekeeper-modal-overlay" onClick={() => setShowSearchNewEndPicker(false)}>
                        <AnalogTimePicker
                          initialTime={searchFilters.newEndTime || "12:00"}
                          onSave={(newTime) => {
                            setSearchFilters(prev => ({ ...prev, newEndTime: newTime }));
                            setShowSearchNewEndPicker(false);
                          }}
                          onCancel={() => setShowSearchNewEndPicker(false)}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Row 7: Permit Under | Permit Type */}
              <div className="df-field">
                <label className="df-label">Permit Under</label>
                <select
                  className="df-select"
                  value={searchFilters.permitUnder}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, permitUnder: e.target.value }))}
                >
                  <option value="">All Areas</option>
                  <option value="Construction">Construction</option>
                  <option value="Commissioning">Commissioning</option>
                </select>
              </div>

              <div className="df-field">
                <label className="df-label">Permit Type</label>
                <select
                  className="df-select"
                  value={searchFilters.permitType}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, permitType: e.target.value }))}
                >
                  <option value="">All Types</option>
                  <option value="Construction">Construction</option>
                  <option value="Commissioning">Commissioning</option>
                </select>
              </div>

              {/* Row 8: Permit Number | HRA Checklists */}
              <div className="df-field">
                <label className="df-label">Permit Number</label>
                <input
                  type="text"
                  className="df-input"
                  placeholder="e.g. 82389714..."
                  value={searchFilters.permitNo}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, permitNo: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchSubmit(e);
                    }
                  }}
                />
              </div>

              <div className="df-field">
                <label className="df-label">HRA Checklists</label>
                <MultiSelectDropdown
                  placeholder="Select HRA Checklists"
                  options={HRA_LIST.map(h => ({ ...h, image: h.image || LOGO_MAP[h.icon] }))}
                  selectedValues={searchFilters.hras}
                  onChange={(vals) => setSearchFilters(prev => ({ ...prev, hras: vals }))}
                  hasNone={true}
                  isHra={true}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="df-footer" style={{ justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                type="button"
                className="df-btn df-btn--cancel"
                onClick={handleResetFilters}
              >
                Reset
              </button>
              <button
                type="submit"
                className="df-btn df-btn--submit"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Operations Toolbar Block */}
      {selectedIds.length > 0 && (
        <div className="bulk-actions-toolbar animate-slide-in">
          <div className="bat-info">
            <span className="bat-badge">{selectedIds.length}</span>
            <span>Permits selected for bulk actions:</span>
          </div>
          <div className="bat-buttons">
            {canBulkAction && (
              <>
                <button
                  className="bat-btn bat-btn--approve"
                  onClick={() => handleBulkStatusChange("Pre-Approved")}
                  title="Bulk Pre-Approve"
                >
                  <FaCheck style={{ marginRight: "6px" }} />
                  Pre-Approve
                </button>
                <button
                  className="bat-btn bat-btn--approve-final"
                  onClick={() => handleBulkStatusChange("Approved")}
                  title="Bulk Approve"
                >
                  <FaCheck style={{ marginRight: "6px" }} />
                  Approve
                </button>
                <button
                  className="bat-btn bat-btn--reject"
                  onClick={() => handleBulkStatusChange("Rejected")}
                  title="Bulk Reject"
                >
                  <FaTimes style={{ marginRight: "6px" }} />
                  Reject
                </button>

                {/* Operations Dropdown */}
                <div className="bulk-edit-dropdown-container" ref={bulkDropdownRef}>
                  <button
                    type="button"
                    className="bat-btn bat-btn--edit"
                    onClick={(e) => {
                      e.preventDefault();
                      setBulkDropdownOpen(prev => !prev);
                    }}
                  >
                    Bulk Edit Controls
                  </button>
                  {bulkDropdownOpen && (
                    <div className="bulk-edit-dropdown-menu" style={{ display: "block" }}>
                      <button
                        type="button"
                        onClick={() => {
                          handleBulkTimeEdit();
                          setBulkDropdownOpen(false);
                        }}
                      >
                        Shift &amp; Working Time
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleBulkSafetyEdit();
                          setBulkDropdownOpen(false);
                        }}
                      >
                        Safety Precautions
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleBulkNotesEdit();
                          setBulkDropdownOpen(false);
                        }}
                      >
                        Add Note
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {isAdmin && (
              <button
                className="bat-btn bat-btn--delete"
                onClick={handleBulkDelete}
                title="Bulk Delete Requests"
              >
                <FaTrash style={{ marginRight: "6px" }} />
                Delete Selected
              </button>
            )}

            <button
              className="bat-btn bat-btn--cancel"
              onClick={() => setSelectedIds([])}
            >
              Cancel Selection
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="dept-table-card" style={{ marginTop: "16px" }}>
        <Table
          columns={columns}
          data={tableData}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
        {!isLoading && requests.length > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-color, #374151)",
            color: "var(--text-muted, #9ca3af)",
            fontSize: "14px",
            fontWeight: 500
          }}>
            <div>
              Showing {requests.length} of <strong style={{ color: "var(--text-main, #f9fafb)", marginLeft: "4px", marginRight: "4px" }}>{totalCount}</strong> permits
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted, #9ca3af)", fontWeight: 500 }}>Permits per page:</span>
              <div style={{
                display: "inline-flex",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                borderRadius: "8px",
                padding: "3px",
                gap: "4px"
              }}>
                {[30, 50].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setLimit(size);
                      setCurrentPage(1);
                    }}
                    style={{
                      border: "none",
                      background: limit === size ? "var(--primary-color, #3b82f6)" : "transparent",
                      color: limit === size ? "#ffffff" : "var(--text-muted, #9ca3af)",
                      padding: "4px 14px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: limit === size ? "600" : "500",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: limit === size ? "0 2px 8px rgba(59, 130, 246, 0.3)" : "none"
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals implementation ────────────────────────────────────────────── */}

      {/* Modal: Status Change */}
      <Modal
        open={activeModal === "status"}
        onClose={() => setActiveModal(null)}
        title={`Request Status Change: ${modalStatus}`}
        size="md"
        type={modalStatus === "Rejected" ? "danger" : "default"}
        scrollable={true}
      >
        {modalTarget && (
          <form onSubmit={handleStatusSubmit} className="df-form">
            <div style={{ maxHeight: "50vh", overflowY: "auto", paddingRight: "8px", marginBottom: "16px" }}>
              <div style={{ marginBottom: "16px" }}>
                <p style={{ color: "var(--text-muted, inherit)", fontSize: "14px" }}>
                  Changing status of Permit No: <strong style={{ color: "var(--text-h, inherit)" }}>{modalTarget.PermitNo}</strong>
                </p>
              </div>

              {/* Opening Confirmation Declaration */}
              {modalStatus === "Opened" && openActionType === "Open" && (
                <div style={{
                  background: "rgba(59, 130, 246, 0.12)",
                  borderLeft: "4px solid #3b82f6",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  color: "var(--text-h, inherit)",
                  fontSize: "13px",
                  fontWeight: "500",
                  lineHeight: "1.5"
                }}>
                  I confirm that the permit is met with all conditions according to RAMS/SPA requirements and take responsibility for safe work execution.
                </div>
              )}

              {/* Closing Confirmation Declaration */}
              {modalStatus === "Closed" && (
                <div style={{
                  background: "rgba(16, 185, 129, 0.12)",
                  borderLeft: "4px solid #10b981",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  color: "var(--text-h, inherit)",
                  fontSize: "13px",
                  fontWeight: "500",
                  lineHeight: "1.5"
                }}>
                  I confirm that the work activities under this permit are completed and the area has been made safe, clean and ensure that all post work conditions are fulfilled.
                </div>
              )}

              {/* Action choice if status is Pre-Approved */}
              {modalStatus === "Pre-Approved" && (
                <div className="df-field" style={{ marginBottom: "16px" }}>
                  <label className="df-label">Action to Take</label>
                  <select
                    className="df-select"
                    value={approveActionType}
                    onChange={(e) => setApproveActionType(e.target.value)}
                  >
                    <option value="Approve">Pre-Approve Permit</option>
                    <option value="Reject">Reject Permit</option>
                  </select>
                </div>
              )}

              {/* Action choice if status is Opened */}
              {modalStatus === "Opened" && (
                <div className="df-field" style={{ marginBottom: "16px" }}>
                  <label className="df-label">Action to Take</label>
                  <select
                    className="df-select"
                    value={openActionType}
                    onChange={(e) => {
                      const selectedAction = e.target.value;
                      const workingDateVal = modalTarget?.Working_Date || modalTarget?.workingDate || modalTarget?.working_date || "";
                      if (selectedAction === "Open" && !isTodayDate(workingDateVal)) {
                        showError("Permits can only be opened on their active Working Date.");
                        return;
                      }
                      setOpenActionType(selectedAction);
                    }}
                  >
                    <option value="Open" disabled={!isTodayDate(modalTarget?.Working_Date || modalTarget?.workingDate || modalTarget?.working_date || "")}>
                      Open Permit {!isTodayDate(modalTarget?.Working_Date || modalTarget?.workingDate || modalTarget?.working_date || "") ? "(Working date is not today)" : ""}
                    </option>
                    <option value="Cancel">Cancel Permit</option>
                  </select>
                  {!isTodayDate(modalTarget?.Working_Date || modalTarget?.workingDate || modalTarget?.working_date || "") && (
                    <p style={{ color: "#f59e0b", fontSize: "12px", marginTop: "6px" }}>
                      Note: Permit working date does not match today. Opening this permit is restricted, but you can cancel the permit.
                    </p>
                  )}
                </div>
              )}

              {/* Cancel reason if Action is Cancel */}
              {modalStatus === "Opened" && openActionType === "Cancel" && (
                <div className="df-field" style={{ marginBottom: "16px" }}>
                  <label className="df-label">
                    Cancel Reason <span className="df-required">*</span>
                  </label>
                  <textarea
                    required
                    placeholder="Type cancellation reason..."
                    className="df-textarea"
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>
              )}

              {/* Initials signature prompt */}
              {(((modalStatus === "Pre-Approved" || modalStatus === "Approved") && approveActionType === "Approve") || (modalStatus === "Opened" && openActionType === "Open")) && (
                <div className="df-field" style={{ marginBottom: "16px" }}>
                  <label className="df-label">
                    {modalStatus === "Opened" ? "Supervisor Full Name / Phone Number" : "Initials Signature"} <span className="df-required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={modalStatus === "Opened" ? "Enter supervisor full name / phone number..." : "Enter your initials..."}
                    className="df-input"
                    value={initials}
                    onChange={(e) => setInitials(e.target.value)}
                  />
                </div>
              )}

              {/* Hot Work opening checklist */}
              {modalStatus === "Opened" && openActionType === "Open" && modalTarget.Hot_work === 1 && (
                <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "16px", background: "rgba(255,255,255,0.02)", marginBottom: "16px" }}>
                  <h4 style={{ color: "#00e5a0", fontSize: "13px", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Hot Work Opening Checklist</h4>

                  <div className="df-field" style={{ marginBottom: "12px" }}>
                    <label className="df-label">Is it Low Risk Hot Work?</label>
                    <select
                      className="df-select"
                      value={lowRiskHotwork}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLowRiskHotwork(val);
                        if (val === 1) {
                          setHighRiskHotwork(0);
                          setHotWorkChecklistFilled(0);
                          setFireGuardPresent(0);
                        }
                      }}
                    >
                      <option value={0}>No</option>
                      <option value={1}>Yes</option>
                    </select>
                  </div>

                  <div className="df-field" style={{ marginBottom: "12px" }}>
                    <label className="df-label">Is it High Risk Hot Work?</label>
                    <select
                      className="df-select"
                      value={highRiskHotwork}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setHighRiskHotwork(val);
                        if (val === 1) {
                          setLowRiskHotwork(0);
                        } else {
                          setHotWorkChecklistFilled(0);
                          setFireGuardPresent(0);
                        }
                      }}
                    >
                      <option value={0}>No</option>
                      <option value={1}>Yes</option>
                    </select>
                  </div>

                  {highRiskHotwork === 1 && (
                    <>
                      <div className="df-field" style={{ marginBottom: "12px" }}>
                        <label className="df-label">Hot Work Checklist Filled?</label>
                        <select
                          className="df-select"
                          value={hotWorkChecklistFilled}
                          onChange={(e) => setHotWorkChecklistFilled(Number(e.target.value))}
                        >
                          <option value={0}>No</option>
                          <option value={1}>Yes</option>
                        </select>
                      </div>

                      <div className="df-field" style={{ marginBottom: "12px" }}>
                        <label className="df-label">Fire Guard Present?</label>
                        <select
                          className="df-select"
                          value={fireGuardPresent}
                          onChange={(e) => setFireGuardPresent(Number(e.target.value))}
                        >
                          <option value={0}>No</option>
                          <option value={1}>Yes</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Rejection reason */}
              {(modalStatus === "Rejected" || ((modalStatus === "Pre-Approved" || modalStatus === "Approved") && approveActionType === "Reject")) && (
                <div className="df-field" style={{ marginBottom: "16px" }}>
                  <label className="df-label">
                    Rejection Reason <span className="df-required">*</span>
                  </label>
                  <textarea
                    required
                    placeholder="Type rejection comments..."
                    className="df-textarea"
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              )}

              {/* Close Checklist note */}
              {modalStatus === "Closed" && (
                <div className="df-field" style={{ marginBottom: "16px" }}>
                  <label className="df-label">
                    Closing Notes / Remarks <span className="df-required">*</span>
                  </label>
                  <textarea
                    placeholder="Enter comments on close-out checklists..."
                    className="df-textarea"
                    rows={3}
                    value={closeNote}
                    onChange={(e) => setCloseNote(e.target.value)}
                  />
                </div>
              )}

              {/* Close-Out Image upload */}
              {modalStatus === "Closed" && (
                <div className="df-field" style={{ marginBottom: "16px" }}>
                  <label className="df-label">Close-Out Pictures</label>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        const newFiles = files.map((file) => ({
                          file,
                          preview: URL.createObjectURL(file)
                        }));
                        setClosingImageFiles((prev) => [...prev, ...newFiles]);
                      }}
                      id="close-image-upload"
                      style={{ display: "none" }}
                    />
                    <label
                      htmlFor="close-image-upload"
                      className="df-btn df-btn--secondary"
                      style={{ cursor: "pointer", margin: 0, padding: "8px 16px" }}
                    >
                      Add Image
                    </label>
                    {closingImageFiles.length > 0 && (
                      <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                        {closingImageFiles.length} image{closingImageFiles.length > 1 ? "s" : ""} selected
                      </span>
                    )}
                  </div>
                  {closingImageFiles.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "12px" }}>
                      {closingImageFiles.map((img, index) => (
                        <div key={index} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", width: "100px", height: "100px" }}>
                          <img src={img.preview} alt={`Preview ${index}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button
                            type="button"
                            onClick={() => {
                              setClosingImageFiles((prev) => prev.filter((_, i) => i !== index));
                            }}
                            style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              background: "rgba(220, 38, 38, 0.9)",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              width: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              cursor: "pointer",
                              padding: 0,
                              lineHeight: 1
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hot Work closing check list */}
              {modalStatus === "Closed" && modalTarget.Hot_work === 1 && (
                <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "16px", background: "rgba(255,255,255,0.02)", marginBottom: "16px" }}>
                  <h4 style={{ color: "#00e5a0", fontSize: "13px", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Hot Work Closing Workplace Check</h4>

                  <div className="df-field" style={{ marginBottom: "12px" }}>
                    <label className="df-label">Has the work area been inspected for smoldering materials or residual heat? <span className="req-star">*</span></label>
                    <select
                      className="df-select"
                      value={hHeatSource}
                      onChange={(e) => setHHeatSource(e.target.value === "" ? "" : Number(e.target.value))}
                    >
                      <option value="">-- Select --</option>
                      <option value={1}>Yes</option>
                      <option value={0}>No</option>
                      <option value={2}>N/A</option>
                    </select>
                  </div>

                  <div className="df-field" style={{ marginBottom: "12px" }}>
                    <label className="df-label">Have all tools and hot work equipment been safely removed from the work area? <span className="req-star">*</span></label>
                    <select
                      className="df-select"
                      value={hWorkplaceCheck}
                      onChange={(e) => setHWorkplaceCheck(e.target.value === "" ? "" : Number(e.target.value))}
                    >
                      <option value="">-- Select --</option>
                      <option value={1}>Yes</option>
                      <option value={0}>No</option>
                      <option value={2}>N/A</option>
                    </select>
                  </div>

                  <div className="df-field" style={{ marginBottom: "12px" }}>
                    <label className="df-label">Has the area been cleaned and restored to its original safe condition? <span className="req-star">*</span></label>
                    <select
                      className="df-select"
                      value={hFireDetectors}
                      onChange={(e) => setHFireDetectors(e.target.value === "" ? "" : Number(e.target.value))}
                    >
                      <option value="">-- Select --</option>
                      <option value={1}>Yes</option>
                      <option value={0}>No</option>
                      <option value={2}>N/A</option>
                    </select>
                  </div>

                  <div className="df-grid" style={{ gap: "16px" }}>
                    <div className="df-field" style={{ marginBottom: "12px" }}>
                      <label className="df-label">1hr time : <span className="df-required">*</span></label>
                      <div style={{ position: "relative", width: "100%" }}>
                        <input
                          type="text"
                          placeholder="00:00"
                          readOnly
                          required
                          className="df-input"
                          value={hStartTime}
                          onClick={() => setShowHStartPicker(true)}
                          style={{ cursor: "pointer", paddingRight: hStartTime ? "30px" : "12px" }}
                        />
                        {hStartTime && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHStartTime("");
                            }}
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              color: "var(--text-muted, #9ca3af)",
                              cursor: "pointer",
                              fontSize: "14px",
                              padding: "4px"
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {showHStartPicker && (
                        <div className="timekeeper-modal-overlay" onClick={() => setShowHStartPicker(false)}>
                          <AnalogTimePicker
                            initialTime={hStartTime || "12:00"}
                            onSave={(newTime) => {
                              setHStartTime(newTime);
                              setShowHStartPicker(false);
                            }}
                            onCancel={() => setShowHStartPicker(false)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="df-field" style={{ marginBottom: "12px" }}>
                      <label className="df-label">3hrs time : <span className="df-required">*</span></label>
                      <div style={{ position: "relative", width: "100%" }}>
                        <input
                          type="text"
                          placeholder="00:00"
                          readOnly
                          required
                          className="df-input"
                          value={hEndTime}
                          onClick={() => setShowHEndPicker(true)}
                          style={{ cursor: "pointer", paddingRight: hEndTime ? "30px" : "12px" }}
                        />
                        {hEndTime && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHEndTime("");
                            }}
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              color: "var(--text-muted, #9ca3af)",
                              cursor: "pointer",
                              fontSize: "14px",
                              padding: "4px"
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {showHEndPicker && (
                        <div className="timekeeper-modal-overlay" onClick={() => setShowHEndPicker(false)}>
                          <AnalogTimePicker
                            initialTime={hEndTime || "12:00"}
                            onSave={(newTime) => {
                              setHEndTime(newTime);
                              setShowHEndPicker(false);
                            }}
                            onCancel={() => setShowHEndPicker(false)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="df-footer">
              <button type="button" className="df-btn df-btn--cancel" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              {modalStatus === "Closed" ? (
                <>
                  <button
                    type="submit"
                    className="df-btn df-btn--secondary"
                    onClick={() => setSubmitStatusOverride("Opened")}
                  >
                    Update Status
                  </button>
                  <button
                    type="submit"
                    className="df-btn df-btn--submit"
                    onClick={() => setSubmitStatusOverride("Closed")}
                  >
                    Close Permit
                  </button>
                </>
              ) : (
                <button type="submit" className="df-btn df-btn--submit">
                  Confirm Status Transition
                </button>
              )}
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Bulk Status Change */}
      <Modal
        open={activeModal === "status-bulk"}
        onClose={() => setActiveModal(null)}
        title={`Bulk Status Change to: ${modalStatus}`}
        size="md"
        type="warning"
      >
        <form onSubmit={handleBulkStatusSubmit} className="df-form">
          <div style={{ marginBottom: "16px" }}>
            <p style={{ color: "#d1d5db" }}>
              Updating status of <strong style={{ color: "#fff" }}>{selectedIds.length}</strong> selected requests.
            </p>
          </div>

          {(modalStatus === "Pre-Approved" || modalStatus === "Approved") && (
            <div className="df-field" style={{ marginBottom: "16px" }}>
              <label className="df-label">
                Initials Signature <span className="df-required">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter your initials..."
                className="df-input"
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
              />
            </div>
          )}

          {modalStatus === "Rejected" && (
            <div className="df-field" style={{ marginBottom: "16px" }}>
              <label className="df-label">
                Rejection Reason <span className="df-required">*</span>
              </label>
              <textarea
                required
                placeholder="Type rejection comments..."
                className="df-textarea"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          )}

          <div className="df-footer">
            <button type="button" className="df-btn df-btn--cancel" onClick={() => setActiveModal(null)}>
              Cancel
            </button>
            <button type="submit" className="df-btn df-btn--submit">
              Apply Status to All
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Bulk Time Edit */}
      <Modal
        open={activeModal === "time"}
        onClose={() => setActiveModal(null)}
        title="Bulk Shift &amp; Working Time Edit"
        size="md"
      >
        <form onSubmit={handleBulkTimeSubmit} className="df-form">
          <div className="df-grid">
            <div className="df-field">
              <label className="df-label">Start Time</label>
              <input
                type="text"
                placeholder="00:00"
                readOnly
                className="df-input"
                value={bulkTime.startTime}
                onClick={() => setShowBulkStartPicker(true)}
                style={{ cursor: 'pointer' }}
              />
              {showBulkStartPicker && (
                <AnalogTimePicker
                  initialTime={bulkTime.startTime || "12:00"}
                  onSave={(newTime) => {
                    setBulkTime(p => ({ ...p, startTime: newTime }));
                    setShowBulkStartPicker(false);
                  }}
                  onCancel={() => setShowBulkStartPicker(false)}
                />
              )}
            </div>
            <div className="df-field">
              <label className="df-label">End Time</label>
              <input
                type="text"
                placeholder="00:00"
                readOnly
                className="df-input"
                value={bulkTime.endTime}
                onClick={() => {
                  if (!bulkTime.nightShift) setShowBulkEndPicker(true);
                }}
                disabled={bulkTime.nightShift}
                style={{ cursor: bulkTime.nightShift ? 'default' : 'pointer' }}
              />
              {!bulkTime.nightShift && showBulkEndPicker && (
                <AnalogTimePicker
                  initialTime={bulkTime.endTime || "12:00"}
                  onSave={(newTime) => {
                    setBulkTime(p => ({ ...p, endTime: newTime }));
                    setShowBulkEndPicker(false);
                  }}
                  onCancel={() => setShowBulkEndPicker(false)}
                />
              )}
            </div>
          </div>
          <div className="df-grid" style={{ marginTop: "16px" }}>
            <div className="df-field night-shift-field" style={{ display: "flex", alignItems: "center", paddingTop: "24px" }}>
              <label className="checkbox-container" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#fff", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={bulkTime.nightShift}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setBulkTime(p => ({
                      ...p,
                      nightShift: checked,
                      endTime: checked ? "23:59" : "",
                      newEndTime: checked ? p.newEndTime : ""
                    }));
                  }}
                />
                <span className="checkbox-label">Is this working after midnight?</span>
              </label>
            </div>
          </div>

          {bulkTime.nightShift && (
            <div className="df-grid night-shift-subform" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">New End Time (Working After Midnight)</label>
                <input
                  type="text"
                  placeholder="00:00"
                  readOnly
                  className="df-input"
                  value={bulkTime.newEndTime}
                  onClick={() => setShowBulkNewEndPicker(true)}
                  style={{ cursor: 'pointer' }}
                />
                {showBulkNewEndPicker && (
                  <AnalogTimePicker
                    initialTime={bulkTime.newEndTime || "12:00"}
                    onSave={(newTime) => {
                      setBulkTime(p => ({ ...p, newEndTime: newTime }));
                      setShowBulkNewEndPicker(false);
                    }}
                    onCancel={() => setShowBulkNewEndPicker(false)}
                  />
                )}
              </div>
            </div>
          )}

          <div className="df-footer" style={{ marginTop: "24px" }}>
            <button type="button" className="df-btn df-btn--cancel" onClick={() => setActiveModal(null)}>
              Cancel
            </button>
            <button type="submit" className="df-btn df-btn--submit">
              Update Times
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Bulk Safety Instructions Edit */}
      <Modal
        open={activeModal === "safety"}
        onClose={() => setActiveModal(null)}
        title="Bulk Edit Safety Precautions"
        size="md"
      >
        <form onSubmit={handleBulkSafetySubmit} className="df-form">
          <div ref={precautionsDropdownRef} className="df-field" style={{ position: "relative" }}>
            <label className="df-label">Safety Precautions</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="df-input"
                style={{ cursor: "pointer", background: "rgba(255, 255, 255, 0.02)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                placeholder="Click to select safety precautions..."
                value={
                  bulkSafety?.length > 0
                    ? bulkSafety.map(id => precautionsList.find(x => String(x.id) === String(id))?.precaution || id).join(", ")
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
              <div className="zone-rooms-dropdown" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px", marginTop: "8px", boxShadow: "var(--shadow-md)", position: "absolute", top: "100%", left: 0, width: "100%", zIndex: 100, maxHeight: "200px", overflowY: "auto" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {precautionsList.map((p) => {
                    const isChecked = bulkSafety.includes(String(p.id));
                    return (
                      <label key={p.id} className="custom-checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          className="custom-checkbox-input"
                          checked={isChecked}
                          onChange={() => {
                            const current = bulkSafety || [];
                            const newValues = isChecked
                              ? current.filter(val => val !== String(p.id))
                              : [...current, String(p.id)];
                            setBulkSafety(newValues);
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

          <div className="df-footer" style={{ marginTop: "24px" }}>
            <button type="button" className="df-btn df-btn--cancel" onClick={() => setActiveModal(null)}>
              Cancel
            </button>
            <button type="submit" className="df-btn df-btn--submit">
              Save Safety Details
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Bulk Notes */}
      <Modal
        open={activeModal === "notes"}
        onClose={() => setActiveModal(null)}
        title="Add Notes to Selection"
        size="md"
      >
        <form onSubmit={handleBulkNotesSubmit} className="df-form">
          <div className="df-field">
            <label className="df-label">Note Comments</label>
            <textarea
              required
              rows={4}
              placeholder="Add comments to request note feeds..."
              className="df-textarea"
              value={bulkNote}
              onChange={(e) => setBulkNote(e.target.value)}
            />
          </div>

          <div className="df-footer" style={{ marginTop: "24px" }}>
            <button type="button" className="df-btn df-btn--cancel" onClick={() => setActiveModal(null)}>
              Cancel
            </button>
            <button type="submit" className="df-btn df-btn--submit">
              Save Note
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Copy permit range */}
      <Modal
        open={activeModal === "copy"}
        onClose={() => setActiveModal(null)}
        title="Copy Request to Consecutive Dates"
        size="md"
        scrollable={true}
      >
        {modalTarget && (
          <form onSubmit={handleCopySubmit} className="df-form">
            <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "8px", marginBottom: "16px" }}>
              <div style={{ marginBottom: "16px" }}>
                <p style={{ color: "var(--text-muted, inherit)" }}>
                  Copying request Permit No: <strong style={{ color: "var(--text-main, inherit)" }}>{modalTarget.PermitNo}</strong>
                </p>
              </div>

              {/* Date Range */}
              <div className="df-grid">
                <div className="df-field">
                  <label className="df-label">Working Date (From)</label>
                  <input
                    type="date"
                    required
                    className="df-input"
                    min={getTodayDateString()}
                    value={copyDates.from}
                    onChange={(e) => setCopyDates(p => ({ ...p, from: e.target.value }))}
                  />
                </div>
                <div className="df-field">
                  <label className="df-label">Working Date (To)</label>
                  <input
                    type="date"
                    required
                    className="df-input"
                    min={copyDates.from || getTodayDateString()}
                    value={copyDates.to}
                    onChange={(e) => setCopyDates(p => ({ ...p, to: e.target.value }))}
                  />
                </div>
              </div>

              {/* Times matching NewRequest.jsx design */}
              <div className="df-grid" style={{ marginTop: "16px" }}>
                <div className="df-field">
                  <label className="df-label">Start Time <span className="req-star">*</span></label>
                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      type="text"
                      placeholder="00:00"
                      readOnly
                      className="df-input"
                      value={copyDates.startTime || ""}
                      onClick={() => setShowCopyStartPicker(true)}
                      style={{ cursor: 'pointer', paddingRight: copyDates.startTime ? "30px" : "12px" }}
                    />
                    {copyDates.startTime && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCopyDates(p => ({ ...p, startTime: "" }));
                        }}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "var(--text-muted, #9ca3af)",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "4px"
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {showCopyStartPicker && (
                    <div className="timekeeper-modal-overlay" onClick={() => setShowCopyStartPicker(false)}>
                      <AnalogTimePicker
                        initialTime={copyDates.startTime || "12:00"}
                        onSave={(newTime) => {
                          setCopyDates(p => ({ ...p, startTime: newTime }));
                          setShowCopyStartPicker(false);
                        }}
                        onCancel={() => setShowCopyStartPicker(false)}
                      />
                    </div>
                  )}
                </div>

                <div className="df-field">
                  <label className="df-label">End Time <span className="req-star">*</span></label>
                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      type="text"
                      placeholder="00:00"
                      readOnly
                      className={`df-input${copyDates.nightShift ? " df-readonly" : ""}`}
                      value={copyDates.endTime || ""}
                      disabled={copyDates.nightShift}
                      onClick={() => {
                        if (!copyDates.nightShift) {
                          setShowCopyEndPicker(true);
                        }
                      }}
                      style={{ cursor: copyDates.nightShift ? 'not-allowed' : 'pointer', paddingRight: copyDates.endTime && !copyDates.nightShift ? "30px" : "12px" }}
                    />
                    {copyDates.endTime && !copyDates.nightShift && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCopyDates(p => ({ ...p, endTime: "" }));
                        }}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "var(--text-muted, #9ca3af)",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "4px"
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {showCopyEndPicker && (
                    <div className="timekeeper-modal-overlay" onClick={() => setShowCopyEndPicker(false)}>
                      <AnalogTimePicker
                        initialTime={copyDates.endTime || "12:00"}
                        onSave={(newTime) => {
                          setCopyDates(p => ({ ...p, endTime: newTime }));
                          setShowCopyEndPicker(false);
                        }}
                        onCancel={() => setShowCopyEndPicker(false)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Working After Midnight */}
              <div style={{ marginTop: "16px" }}>
                <label className="checkbox-container" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-main, #d1d5db)", cursor: "pointer", fontSize: "14px" }}>
                  <input
                    type="checkbox"
                    checked={copyDates.nightShift}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const origEndTime = modalTarget ? (modalTarget.End_Time || modalTarget.end_time || "").slice(0, 5) : "";
                      setCopyDates(p => ({
                        ...p,
                        nightShift: checked,
                        endTime: checked ? "23:59" : (origEndTime || p.endTime),
                        newEndTime: checked ? p.newEndTime : ""
                      }));
                    }}
                    style={{ accentColor: "var(--accent, #00e5a0)" }}
                  />
                  <span>Is this working after midnight?</span>
                </label>
              </div>

              {/* New End Time (Working After Midnight) */}
              {copyDates.nightShift && (
                <div className="df-grid" style={{ marginTop: "16px" }}>
                  <div className="df-field">
                    <label className="df-label">New End Time (Working After Midnight) <span className="req-star">*</span></label>
                    <div style={{ position: "relative", width: "100%" }}>
                      <input
                        type="text"
                        placeholder="00:00"
                        readOnly
                        className="df-input"
                        value={copyDates.newEndTime || ""}
                        onClick={() => setShowCopyNewEndPicker(true)}
                        style={{ cursor: 'pointer', paddingRight: copyDates.newEndTime ? "30px" : "12px" }}
                      />
                      {copyDates.newEndTime && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCopyDates(p => ({ ...p, newEndTime: "" }));
                          }}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            color: "var(--text-muted, #9ca3af)",
                            cursor: "pointer",
                            fontSize: "14px",
                            padding: "4px"
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {showCopyNewEndPicker && (
                      <div className="timekeeper-modal-overlay" onClick={() => setShowCopyNewEndPicker(false)}>
                        <AnalogTimePicker
                          initialTime={copyDates.newEndTime || "12:00"}
                          onSave={(newTime) => {
                            setCopyDates(p => ({ ...p, newEndTime: newTime }));
                            setShowCopyNewEndPicker(false);
                          }}
                          onCancel={() => setShowCopyNewEndPicker(false)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="df-field" />
                </div>
              )}
            </div>

            <div className="df-footer" style={{ marginTop: "24px" }}>
              <button type="button" className="df-btn df-btn--cancel" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="submit" className="df-btn df-btn--submit">
                Copy Permits
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Logs Details */}
      <Modal
        open={activeModal === "logs"}
        onClose={() => setActiveModal(null)}
        title="Permit Request Logs History"
        size="lg"
      >
        {modalTarget && (
          <div className="logs-history-modal-body">
            <div style={{ marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>Permit Number: <strong style={{ color: "var(--text-main)" }}>{modalTarget.PermitNo}</strong></p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0 0" }}>Activity: <strong style={{ color: "var(--text-main)" }}>{modalTarget.Activity}</strong></p>
            </div>

            <div className="logs-timeline">
              {logsData.length > 0 ? (
                logsData.map((log, idx) => (
                  <div key={log.id || idx} className="timeline-item">
                    <div className="timeline-marker" />
                    <div className="timeline-content">
                      <div className="timeline-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <strong style={{ color: "var(--accent, #3b82f6)", fontSize: "13px" }}>{log.username || "Operator"}</strong>
                        <small style={{ color: "var(--text-muted)" }}>{formatToDenmarkDateTime(log.createdTime || log.createdAt)}</small>
                      </div>
                      <p style={{ color: "var(--text-main)", fontSize: "14px", margin: 0 }}>
                        {log.note || log.message || "Log entry recorded."}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0" }}>
                  No historical logs found for this request.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ListRequest;