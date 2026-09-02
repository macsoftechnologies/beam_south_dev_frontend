import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import Table from "../../components/common/Table/Table";
import { FaFileCsv, FaArrowDown, FaSearch } from "react-icons/fa";
import * as XLSX from "xlsx";

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

// ─── Searchable Multi-Select Dropdown Component ──────────────────────────────
const SearchableMultiSelect = ({
  options = [],
  selectedValues = [],
  onChange = () => { },
  placeholder = "Select Contractors",
  disabled = false,
  valueKey = "id",
  labelKey = "subContractorName"
}) => {
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

  const handleToggle = () => !disabled && setIsOpen(!isOpen);

  const handleCheckboxChange = (valStr, checked) => {
    let nextValues = Array.isArray(selectedValues) ? [...selectedValues] : [];
    if (checked) {
      if (!nextValues.includes(valStr)) nextValues.push(valStr);
    } else {
      nextValues = nextValues.filter(v => v !== valStr);
    }
    onChange(nextValues);
  };

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(o => {
      const label = o[labelKey] || o.label || o.name || "";
      return String(label).toLowerCase().includes(q);
    });
  }, [options, search, labelKey]);

  const handleSelectAll = () => {
    const allIds = filteredOptions.map(o => String(o[valueKey] ?? o.value ?? o.id));
    const merged = Array.from(new Set([...(Array.isArray(selectedValues) ? selectedValues : []), ...allIds]));
    onChange(merged);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  let displayText = placeholder;
  const currentSelected = Array.isArray(selectedValues) ? selectedValues : (selectedValues ? [String(selectedValues)] : []);
  if (currentSelected.length > 0) {
    const selectedLabels = [];
    currentSelected.forEach(val => {
      const opt = options.find(o => String(o[valueKey] ?? o.value ?? o.id) === String(val));
      if (opt) {
        selectedLabels.push(opt[labelKey] || opt.label || opt.name || val);
      }
    });
    if (selectedLabels.length > 0) {
      displayText = selectedLabels.join(", ");
    }
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
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

      {isOpen && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "100%",
            maxHeight: "300px",
            backgroundColor: "var(--bg-card, #111827)",
            border: "1.5px solid var(--border-color, #374151)",
            borderRadius: "12px",
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
          </div>
          <div style={{ padding: "4px 8px", borderBottom: "1px solid var(--border-color, #374151)", display: "flex", justifyContent: "space-between" }}>
            <button
              type="button"
              onClick={handleSelectAll}
              style={{ background: "none", border: "none", color: "var(--primary-color, #3b82f6)", fontSize: "12px", cursor: "pointer", padding: "2px 4px" }}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer", padding: "2px 4px" }}
            >
              Clear All
            </button>
          </div>
          <div style={{ overflowY: "auto", maxHeight: "200px", padding: "4px 0" }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: "10px 16px", fontSize: "13px", color: "var(--text-muted, #9ca3af)", textAlign: "center" }}>
                No options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const optValue = String(opt[valueKey] ?? opt.value ?? opt.id);
                const optLabel = opt[labelKey] || opt.label || opt.name || optValue;
                const isChecked = currentSelected.map(String).includes(optValue);

                return (
                  <label
                    key={optValue}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "8px 16px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      color: "var(--text-main, #f9fafb)",
                      backgroundColor: isChecked ? "rgba(255, 255, 255, 0.05)" : "transparent",
                      fontSize: "13px",
                      userSelect: "none"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isChecked ? "rgba(255, 255, 255, 0.05)" : "transparent"}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleCheckboxChange(optValue, e.target.checked)}
                      style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "var(--accent, #00e5a0)" }}
                    />
                    <span>{optLabel}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
import {
  getContractors,
  getBuildings,
  getFloors,
  getZones,
  getRooms,
  getPlans,
  getActivities,
  getUser
} from "../../services/authService";
import { planRequests, searchRequests } from "../../services/requestService";
import { buildingDataWithIds } from "../../data/buildingDataWithIds";
import { ZONE_MAPPING } from "../../data/zones";
import "../styles/pages.css";
import "../../forms/styles/forms.css";

// ─── Import HRA Icons ───────────────────────────────────────────────────────
import HotWorksLogo from "../../assets/images/logos/HotWorks.png";
import ElectricalSystemsLogo from "../../assets/images/logos/ElectricalSystems.png";
import SubstanceChemicalLogo from "../../assets/images/logos/substanceChemical.png";
import TestingEquipmentLogo from "../../assets/images/logos/testingequipment.png";
import WorkingAtHightLogo from "../../assets/images/logos/WorkingAtHight.png";
import ConfinedSpaceLogo from "../../assets/images/logos/ConfinedSpace.png";
import ExcavationWorksLogo from "../../assets/images/logos/ExcavationWorks.png";
import CranesLiftingLogo from "../../assets/images/logos/Craneslifting.png";
import ElectricalWorksLogo from "../../assets/images/logos/electrical_works.png";
import MechanicalWorksLogo from "../../assets/images/logos/mechanical1.png";

// ─── Static options ───────────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => String(CURRENT_YEAR - 5 + i));

const STATUS_OPTIONS = [
  "Draft",
  "Hold",
  "Pre-Approved",
  "Approved",
  "Rejected",
  "Opened",
  "Closed",
  "Cancelled",
  "Auto-Cancelled",
];

const HRA_LIST = [
  { key: "Hot_work", label: "Hot Work", image: HotWorksLogo },
  { key: "working_on_electrical_system", label: "Electrical Systems", image: ElectricalSystemsLogo },
  { key: "working_hazardious_substen", label: "Hazardous Substances", image: SubstanceChemicalLogo },
  { key: "pressure_tesing_of_equipment", label: "Testing Equipment", image: TestingEquipmentLogo },
  { key: "working_at_height", label: "Working at Height", image: WorkingAtHightLogo },
  { key: "working_confined_spaces", label: "Confined Space", image: ConfinedSpaceLogo },
  { key: "excavation_works", label: "Excavation Works", image: ExcavationWorksLogo },
  { key: "using_cranes_or_lifting", label: "Cranes & Lifting", image: CranesLiftingLogo },
  { key: "power_on", label: "Electrical Works", image: ElectricalWorksLogo },
  { key: "pressurization", label: "Mechanical Works", image: MechanicalWorksLogo }
];

const INITIAL_FILTERS = {
  reportType: "1", // 1 = Daily Report, 2 = Weekly Report
  date: "",
  year: "",
  weekno: "",
  subContractor: [],
  building: [],
  workingDateFrom: "",
  workingDateTo: "",
  startTime: "",
  endTime: "",
  level: [],
  area: [],
  permitType: "",
  permitUnder: "",
  nightShift: false,
  newWorkDate: "",
  newEndTime: "",
  status: [],
  zones: [],
  hras: [],
  typeOfActivityId: "",
  permitNo: "",
  keyword: ""
};

// Helper to resolve zone name from building, floor/level, and rooms data
const resolveZoneNameFromRooms = (row) => {
  // 1. If the request already has a valid zone name from the database, use it
  const dbZoneName = (row.zone && typeof row.zone === "object")
    ? row.zone.zone
    : (row.zone || "");
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

// ─── Custom Multiple Select Dropdown Component ──────────────────────────────
const MultiSelectDropdown = ({
  placeholder,
  options = [],
  selectedValues = [],
  onChange = () => { },
  hasNone = false,
  isHra = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleToggle = () => setIsOpen(!isOpen);

  const handleCheckboxChange = (value, checked) => {
    let nextValues = [...selectedValues];
    if (hasNone && value === "none") {
      if (checked) {
        nextValues = ["none"];
      } else {
        nextValues = [];
      }
    } else {
      if (checked) {
        nextValues = nextValues.filter(v => v !== "none");
        if (!nextValues.includes(value)) {
          nextValues.push(value);
        }
      } else {
        nextValues = nextValues.filter(v => v !== value);
      }
    }
    onChange(nextValues);
  };

  // Resolve trigger display label text
  let displayText = placeholder;
  if (selectedValues.length > 0) {
    if (hasNone && selectedValues.includes("none")) {
      displayText = "None";
    } else {
      const selectedLabels = [];

      // Flatten options to easily search labels
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
          cursor: "pointer",
          userSelect: "none",
          paddingRight: "14px",
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

          {options.map((opt, idx) => {
            // Support grouped zones
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

            return (
              <label
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
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
                {(opt.image || opt.icon) && (
                  <img
                    src={opt.image || opt.icon}
                    alt={displayLabel}
                    style={{ width: "22px", height: "22px", objectFit: "contain", borderRadius: "4px", flexShrink: 0 }}
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

// ─── Status Badge Component ──────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  let color = "#3b82f6";
  let bg = "rgba(59, 130, 246, 0.1)";

  const s = String(status || "").toLowerCase();
  if (s === "approved") {
    color = "#10b981";
    bg = "rgba(16, 185, 129, 0.1)";
  } else if (s === "hold" || s === "draft") {
    color = "#f59e0b";
    bg = "rgba(245, 158, 11, 0.1)";
  } else if (s === "rejected" || s === "cancelled" || s === "auto-cancel" || s === "auto-cancelled") {
    color = "#ef4444";
    bg = "rgba(239, 68, 68, 0.1)";
  } else if (s === "pre-approved") {
    color = "#8b5cf6";
    bg = "rgba(139, 92, 246, 0.1)";
  } else if (s === "opened") {
    color = "#06b6d4";
    bg = "rgba(6, 182, 212, 0.1)";
  } else if (s === "closed") {
    color = "#6b7280";
    bg = "rgba(107, 114, 128, 0.1)";
  }

  return (
    <span style={{
      color,
      backgroundColor: bg,
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: 600,
      textTransform: "uppercase"
    }}>
      {status}
    </span>
  );
};

const Reports = () => {
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
  const userContractorId = currentUser?.typeId || currentUser?.subContId || currentUser?.subContractorId;
  const isSubcontractor = userRoles.includes("subcontractor");

  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // Default subcontractor filter if current user is a contractor
  useEffect(() => {
    if (isSubcontractor && userContractorId) {
      setFilters(prev => ({
        ...prev,
        subContractor: [String(userContractorId)]
      }));
    }
  }, [isSubcontractor, userContractorId]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showNewEndPicker, setShowNewEndPicker] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_LIMIT = 10;

  // Dropdown options
  const [contractors, setContractors] = useState([]);
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [zonesList, setZonesList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [weeksList, setWeeksList] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);
  const [isLoadingSelectors, setIsLoadingSelectors] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // ─── Fetch Selector Lists ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchSelectors = async () => {
      try {
        const [subRes, buildRes, floorRes, zoneRes, roomRes, actRes] = await Promise.all([
          getContractors(1, 1000),
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getZones(1, 10000),
          getRooms(1, 10000),
          getActivities(1, 1000)
        ]);
        const rawContractors = subRes?.data?.rows ?? subRes?.data ?? subRes ?? [];
        const loadedContractors = rawContractors
          .slice()
          .sort((a, b) => (a.subContractorName || "").localeCompare(b.subContractorName || "", undefined, { sensitivity: "base" }));
        setContractors(loadedContractors);
        if (isSubcontractor) {
          const defaultSubId = userContractorId || (loadedContractors.length > 0 ? loadedContractors[0].id : "");
          if (defaultSubId) {
            setFilters(prev => ({
              ...prev,
              subContractor: [String(defaultSubId)]
            }));
          }
        }
        setBuildingsList(buildRes?.data ?? []);
        setFloorsList(floorRes?.data ?? []);
        setZonesList(zoneRes?.data ?? []);
        setRoomsList(roomRes?.data?.rows ?? roomRes?.data ?? roomRes ?? []);
        setActivitiesList(actRes?.data?.rows ?? actRes?.data ?? actRes ?? []);
      } catch (err) {
        console.error("Failed to load selectors lists", err);
      } finally {
        setIsLoadingSelectors(false);
      }
    };
    fetchSelectors();
  }, []);

  // ─── Filtered Levels, Zones, and Areas ─────────────────────────────────────
  const buildingsOptions = useMemo(() => {
    if (buildingsList && buildingsList.length > 0) return buildingsList;
    const uniqueIds = [...new Set(buildingDataWithIds.map(b => String(b.buildingId)))];
    return uniqueIds.map(id => {
      const apiBuild = buildingsList.find(b => String(b.build_id) === id);
      return {
        build_id: id,
        building_name: apiBuild ? apiBuild.building_name : `Building ${id}`
      };
    });
  }, [buildingsList]);

  // Filter levels based on selected buildings
  const filteredLevels = useMemo(() => {
    if (filters.building.length === 0) return floorsList;
    return floorsList.filter(f => filters.building.includes(String(f.build_id)));
  }, [filters.building, floorsList]);

  // Filter zones based on selected levels/floors (and buildings)
  const filteredZones = useMemo(() => {
    let zonesToFilter = zonesList;

    if (filters.building && filters.building.length > 0) {
      const selectedBuildingIds = filters.building.map(Number);
      zonesToFilter = zonesToFilter.filter(z =>
        z.building_id !== undefined && z.building_id !== null && selectedBuildingIds.includes(Number(z.building_id))
      );
    }

    if (filters.level && filters.level.length > 0) {
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
        .filter(f => filters.level.some(l => isLevelMatch(l, f.floor_name)))
        .map(f => Number(f.fl_id));

      const zoneIdsFromRooms = roomsList
        .filter(r => matchedFloorIds.includes(Number(r.fl_id)))
        .map(r => Number(r.zone_id))
        .filter(Boolean);

      zonesToFilter = zonesToFilter.filter(z => {
        const matchDirectFloorId = z.floor_id !== undefined && z.floor_id !== null && matchedFloorIds.includes(Number(z.floor_id));
        const matchDirectLevelName = z.level !== undefined && z.level !== null && filters.level.some(l => isLevelMatch(l, z.level));
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
  }, [zonesList, floorsList, roomsList, filters.building, filters.level]);

  // Filter rooms based on selected levels/floors and zones, and group them by zone names
  const filteredRooms = useMemo(() => {
    let roomsToGroup = roomsList;

    if (filters.building && filters.building.length > 0) {
      roomsToGroup = roomsToGroup.filter(r => filters.building.includes(String(r.building_id)));
    }

    if (filters.level && filters.level.length > 0) {
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
        .filter(f => filters.level.some(l => isLevelMatch(l, f.floor_name)))
        .map(f => f.fl_id);
      roomsToGroup = roomsToGroup.filter(r => matchedFloorIds.includes(r.fl_id));
    }

    if (filters.zones && filters.zones.length > 0) {
      const selectedZoneNamesOrIds = filters.zones.map(z => String(z).trim().toLowerCase());
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
  }, [roomsList, zonesList, floorsList, filters.building, filters.level, filters.zones]);

  // ─── Change Handlers ────────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "reportType") {
        next.date = "";
        next.year = "";
        next.weekno = "";
        if (value === "2") {
          next.workingDateFrom = "";
          next.workingDateTo = "";
        }
      }
      return next;
    });
  };

  const handleYearChange = (yearVal) => {
    handleChange("year", yearVal);
    handleChange("weekno", "");
    if (!yearVal) {
      setWeeksList([]);
      return;
    }

    const weeks = [];
    const dec28 = new Date(Number(yearVal), 11, 28);
    const day = dec28.getDay();
    const isLeap = (Number(yearVal) % 4 === 0 && Number(yearVal) % 100 !== 0) || (Number(yearVal) % 400 === 0);
    const totalWeeks = (day === 4 || (isLeap && day === 3)) ? 53 : 52;

    for (let w = 1; w <= totalWeeks; w++) {
      const simple = new Date(Number(yearVal), 0, 1 + (w - 1) * 7);
      const dow = simple.getDay();
      const ISOweekStart = new Date(simple);
      const startDayOffset = dow === 0 ? -6 : 1 - dow;
      ISOweekStart.setDate(simple.getDate() + startDayOffset);

      const ISOweekEnd = new Date(ISOweekStart);
      ISOweekEnd.setDate(ISOweekStart.getDate() + 6);

      const formatDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        return `${y}/${m}/${dt}`;
      };

      weeks.push(`${formatDate(ISOweekStart)}  -  ${formatDate(ISOweekEnd)}  -  ${w}`);
    }
    setWeeksList(weeks);
  };

  // ─── Search API Query ──────────────────────────────────────────────────────
  const handleShow = async () => {
    const targetDate = (filters.reportType === "1" && filters.date) ? filters.date : "";
    const fromDateStr = targetDate || filters.workingDateFrom || "";
    const toDateStr = targetDate || filters.workingDateTo || "";

    if (fromDateStr && toDateStr) {
      const fromVal = new Date(fromDateStr);
      const toVal = new Date(toDateStr);
      if (toVal < fromVal) {
        showError("To Date cannot be earlier than From Date.");
        return;
      }
      if (fromDateStr === toDateStr && filters.startTime && filters.endTime) {
        if (filters.endTime < filters.startTime) {
          showError("End Time cannot be earlier than Start Time for the same day.");
          return;
        }
      }
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const searchPayload = {};

      // Unified search payload parameters (with fallback/compatible keys)
      searchPayload.Site_Id = 5;
      // searchPayload.Page = 1;
      // searchPayload.End = 5000;
      searchPayload.Building_Id = Array.isArray(filters.building) && filters.building.length > 0 ? filters.building.join(",") : (filters.building || null);
      if (isSubcontractor && userContractorId) {
        searchPayload.Sub_Contractor_Id = String(userContractorId);
      } else {
        const selectedSubcon = Array.isArray(filters.subContractor) ? filters.subContractor : (filters.subContractor ? [filters.subContractor] : []);
        searchPayload.Sub_Contractor_Id = selectedSubcon.length > 0 ? selectedSubcon.join(",") : null;
      }
      searchPayload.Room_Type = filters.level.length > 0 ? filters.level.join(",") : "";
      const selectedZoneIds = zonesList
        .filter(z => filters.zones && filters.zones.includes(z.zone))
        .map(z => z.id);
      searchPayload.zoneIds = selectedZoneIds.length > 0 ? selectedZoneIds : null;
      searchPayload.zone = filters.zones && filters.zones.length > 0 ? filters.zones.join(",") : null;
      searchPayload.Room_Nos = filters.area.length > 0 ? filters.area.join(",") : null;
      searchPayload.area = filters.area.length > 0 ? filters.area.join(",") : "";
      searchPayload.permit_type = filters.permitType || "";
      searchPayload.permit_under = filters.permitUnder || "";
      searchPayload.night_shift = filters.nightShift ? "1" : "";
      searchPayload.Type_Of_Activity_Id = filters.typeOfActivityId || null;
      searchPayload.PermitNo = filters.permitNo || null;
      searchPayload.Activity = filters.keyword || null;

      const targetDate = (filters.reportType === "1" && filters.date) ? filters.date : "";

      // For Weekly Report, parse the selected week string to extract fromDate and toDate
      // Week string format: "2026/07/20  -  2026/07/26  -  30"
      let weekFromDate = "";
      let weekToDate = "";
      if (filters.reportType === "2" && filters.weekno) {
        const parts = filters.weekno.split("-").map(p => p.trim());
        if (parts.length >= 2) {
          weekFromDate = parts[0].trim().replace(/\//g, "-");
          weekToDate = parts[1].trim().replace(/\//g, "-");
        }
      }

      searchPayload.fromDate = weekFromDate || targetDate || filters.workingDateFrom || "";
      searchPayload.toDate = weekToDate || targetDate || filters.workingDateTo || "";

      // Suffix start/end time with :00 if present
      searchPayload.Start_Time = filters.startTime ? (filters.startTime.length === 5 ? `${filters.startTime}:00` : filters.startTime) : "";
      searchPayload.End_Time = filters.endTime ? (filters.endTime.length === 5 ? `${filters.endTime}:00` : filters.endTime) : "";

      // Format status
      const statusArray = Array.isArray(filters.status) ? filters.status : [];
      const formattedStatus = statusArray
        .filter(val => val !== null && val !== undefined && val !== "")
        .join(",");
      searchPayload.Request_status = formattedStatus || "";

      // HRA calculations
      const hrasList = Array.isArray(filters.hras) ? filters.hras : [];
      const hasNone = hrasList.includes("none");
      if (hasNone) {
        searchPayload.hras = "0";
      } else if (hrasList.length > 0) {
        searchPayload.hras = "1";
        hrasList.forEach(hraKey => {
          searchPayload[hraKey] = 1;
        });
      }

      // Keep only allowed custom extension fields that don't trigger validation errors
      searchPayload.new_date = filters.newWorkDate || "";
      searchPayload.new_end_time = filters.newEndTime || "";

      // Call Unified Search API
      const res = await planRequests(searchPayload);

      let rows = [];
      if (res && res.data) {
        if (Array.isArray(res.data) && res.data.length > 0 && res.data[0] && Array.isArray(res.data[0].data)) {
          rows = res.data[0].data;
        } else if (Array.isArray(res.data)) {
          rows = res.data;
        } else if (res.data.rows) {
          rows = res.data.rows;
        }
      } else if (Array.isArray(res)) {
        if (res.length > 0 && res[0] && Array.isArray(res[0].data)) {
          rows = res[0].data;
        } else {
          rows = res;
        }
      }

      setTableData(rows);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load reports data", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setFilters({
      ...INITIAL_FILTERS,
      subContractor: isSubcontractor && currentUser?.typeId ? [String(currentUser.typeId)] : []
    });
    setTableData([]);
    setHasSearched(false);
    setWeeksList([]);
  };

  // ─── Listen to Enter Key ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        const isFocusableSelect = document.querySelector("select:focus");
        if (isFocusableSelect) return;

        const activeTag = document.activeElement?.tagName?.toUpperCase();
        if (activeTag === "BUTTON" || activeTag === "TEXTAREA" || activeTag === "SELECT") return;

        event.preventDefault();
        handleShow();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filters]);

  // ─── CSV Export Logic ──────────────────────────────────────────────────────
  const handleDownload = () => {
    if (tableData.length === 0) {
      alert("No data available to export.");
      return;
    }
    const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const printHRAS = (row) => {
      const hrasValues = [];
      const keys = [
        "Hot_work", "working_on_electrical_system", "working_hazardious_substen",
        "pressure_tesing_of_equipment", "working_at_height", "working_confined_spaces",
        "work_in_atex_area", "securing_facilities", "excavation_works", "using_cranes_or_lifting",
        "power_on", "pressurization"
      ];
      keys.forEach(key => {
        if (row[key] == 1 || row[key] === "1" || row[key] === true) {
          hrasValues.push(key.replace(/_/g, ' '));
        }
      });
      return hrasValues.join(", ");
    };

    const formatNotes = (notes) => {
      if (!notes) return "";
      if (typeof notes === "string") return notes.replace(/[\n\r,]+/g, " ");
      if (Array.isArray(notes)) {
        return notes
          .map(n => `${n.username || n.Username || ""}: ${n.note || n.Note || ""}`)
          .join("; ")
          .replace(/[\n\r,]+/g, " ");
      }
      return "";
    };

    const findNewDay = (row) => {
      if (row.new_date && row.new_date !== "00-00-0000" && row.new_date !== "0000-00-00") {
        const newDate = new Date(row.new_date);
        if (!isNaN(newDate.getTime())) {
          return daysNames[newDate.getDay()];
        }
      }
      return "";
    };

    const resolveActivityName = (row) => {
      const actId = row.Type_Of_Activity_Id ?? row.type_of_activity_id ?? row.typeOfActivityId ?? row.Activity;
      if (actId !== null && actId !== undefined && actId !== "" && activitiesList && activitiesList.length > 0) {
        const found = activitiesList.find(a => String(a.id) === String(actId) || String(a.activity_id) === String(actId) || String(a.activityId) === String(actId));
        if (found) {
          return found.activityName || found.activity_name || found.name || found.Activity || found.label || String(actId);
        }
      }
      if (row.Activity && isNaN(Number(String(row.Activity).trim()))) {
        return row.Activity;
      }
      if (row.Type_Of_Activity && isNaN(Number(String(row.Type_Of_Activity).trim()))) {
        return row.Type_Of_Activity;
      }
      return actId ? String(actId) : (row.Activity || "");
    };

    const resolveTypeOfWork = (row) => {
      const permitKind = (row.permit_type || row.permit_under || "").trim();
      if (permitKind.toLowerCase() !== "commissioning") {
        return "";
      }
      if (row.work_type) return row.work_type;
      if (row.Work_Type) return row.Work_Type;
      if (row.electrical_works && row.electrical_works.length > 0) return "Electrical Works";
      if (row.mechanical_works && row.mechanical_works.length > 0) return "Mechanical Works";
      return "";
    };

    const formatReportTime = (timeVal) => {
      if (!timeVal) return "";
      const str = String(timeVal).trim();
      if (!str || str === "null" || str === "undefined") return "";
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
        return str;
      }
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, "0");
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }
      return str;
    };

    const headers = [
      "PermitNo", "PermitUnder", "PermitType", "ContractorName", "Sub_Contractor_Name",
      "Building_Name", "Level", "Zone", "Room_Nos", "Type_Of_Activity", "Type_Of_Work",
      "Number_Of_Workers", "Activity", "description_of_activity", "Rams_Number", "HRAs",
      "Start_Time", "End_Time", "Night_Shift", "New_End_Time", "Request_status", "Notes",
      "Working_Date", "Day", "New_Date", "New_Day", "CoNM_initials", "CoMM_initials",
      "Opening_Person_Name", "Opening_Time", "Closing_Person_Name", "Closing_Time",
      "Reject_Reason", "Cancel_Reason"
    ];

    const rows = tableData.map(x => {
      const dayIndex = x.Working_Date ? new Date(x.Working_Date).getDay() : null;
      const dayName = (dayIndex !== null && !isNaN(dayIndex)) ? daysNames[dayIndex] : "";

      const rowData = {
        PermitNo: x.PermitNo || "",
        PermitUnder: x.permit_under || 'Construction',
        PermitType: x.permit_type || 'Construction',
        ContractorName: x.subContractorName || "",
        Sub_Contractor_Name: x.new_sub_contractor || "",
        Building_Name: x.building_name || "",
        Level: x.Room_Type || "",
        Zone: resolveZoneNameFromRooms(x),
        Room_Nos: x.Room_Nos || "",
        Type_Of_Activity: resolveActivityName(x),
        Type_Of_Work: resolveTypeOfWork(x),
        Number_Of_Workers: x.Number_Of_Workers || x.number_of_workers || "",
        Activity: x.Activity || "",
        description_of_activity: x.description_of_activity || "",
        Rams_Number: x.rams_number || "",
        HRAs: printHRAS(x),
        Start_Time: x.Start_Time || "",
        End_Time: x.End_Time || "",
        Night_Shift: x.night_shift == 1 ? 'Yes' : 'No',
        New_End_Time: x.new_end_time || "",
        Request_status: x.Request_status || "",
        Notes: formatNotes(x.Notes || x.note),
        Working_Date: x.Working_Date || "",
        Day: dayName,
        New_Date: x.new_date || "",
        New_Day: findNewDay(x),
        CoNM_initials: x.ConM_initials || "",
        CoMM_initials: x.CoMM_initials || "",
        Opening_Person_Name: x.ConM_initials1 || x.opened_by || x.check_in_user || "",
        Opening_Time: formatReportTime(x.open_time || x.check_in_time || x.h_start_time),
        Closing_Person_Name: x.closed_by || x.close_note || x.check_out_user || "",
        Closing_Time: formatReportTime(x.close_time || x.check_out_time || x.h_end_time),
        Reject_Reason: x.reject_reason || "",
        Cancel_Reason: x.cancel_reason || ""
      };

      return headers.map(header => {
        let val = String(rowData[header] ?? "").replace(/"/g, '""');
        if (header === 'PermitNo') {
          val = '\t' + val;
        }
        return `"${val}"`;
      }).join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ACTIVITY_PERMITS_REPORT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExcel = () => {
    if (tableData.length === 0) {
      alert("No data available to export.");
      return;
    }
    const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const printHRAS = (row) => {
      const hrasValues = [];
      const keys = [
        "Hot_work", "working_on_electrical_system", "working_hazardious_substen",
        "pressure_tesing_of_equipment", "working_at_height", "working_confined_spaces",
        "work_in_atex_area", "securing_facilities", "excavation_works", "using_cranes_or_lifting",
        "power_on", "pressurization"
      ];
      keys.forEach(key => {
        if (row[key] == 1 || row[key] === "1" || row[key] === true) {
          hrasValues.push(key.replace(/_/g, ' '));
        }
      });
      return hrasValues.join(", ");
    };

    const formatNotes = (notes) => {
      if (!notes) return "";
      if (typeof notes === "string") return notes.replace(/[\n\r,]+/g, " ");
      if (Array.isArray(notes)) {
        return notes
          .map(n => `${n.username || n.Username || ""}: ${n.note || n.Note || ""}`)
          .join("; ")
          .replace(/[\n\r,]+/g, " ");
      }
      return "";
    };

    const findNewDay = (row) => {
      if (row.new_date && row.new_date !== "00-00-0000" && row.new_date !== "0000-00-00") {
        const newDate = new Date(row.new_date);
        if (!isNaN(newDate.getTime())) {
          return daysNames[newDate.getDay()];
        }
      }
      return "";
    };

    const resolveActivityName = (row) => {
      const actId = row.Type_Of_Activity_Id ?? row.type_of_activity_id ?? row.typeOfActivityId ?? row.Activity;
      if (actId !== null && actId !== undefined && actId !== "" && activitiesList && activitiesList.length > 0) {
        const found = activitiesList.find(a => String(a.id) === String(actId) || String(a.activity_id) === String(actId) || String(a.activityId) === String(actId));
        if (found) {
          return found.activityName || found.activity_name || found.name || found.Activity || found.label || String(actId);
        }
      }
      if (row.Activity && isNaN(Number(String(row.Activity).trim()))) {
        return row.Activity;
      }
      if (row.Type_Of_Activity && isNaN(Number(String(row.Type_Of_Activity).trim()))) {
        return row.Type_Of_Activity;
      }
      return actId ? String(actId) : (row.Activity || "");
    };

    const resolveTypeOfWork = (row) => {
      const permitKind = (row.permit_type || row.permit_under || "").trim();
      if (permitKind.toLowerCase() !== "commissioning") {
        return "";
      }
      if (row.work_type) return row.work_type;
      if (row.Work_Type) return row.Work_Type;
      if (row.electrical_works && row.electrical_works.length > 0) return "Electrical Works";
      if (row.mechanical_works && row.mechanical_works.length > 0) return "Mechanical Works";
      return "";
    };

    const formatReportTime = (timeVal) => {
      if (!timeVal) return "";
      const str = String(timeVal).trim();
      if (!str || str === "null" || str === "undefined") return "";
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
        return str;
      }
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, "0");
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }
      return str;
    };

    const headers = [
      "PermitNo", "PermitUnder", "PermitType", "ContractorName", "Sub_Contractor_Name",
      "Building_Name", "Level", "Zone", "Room_Nos", "Type_Of_Activity", "Type_Of_Work",
      "Number_Of_Workers", "Activity", "description_of_activity", "Rams_Number", "HRAs",
      "Start_Time", "End_Time", "Night_Shift", "New_End_Time", "Request_status", "Notes",
      "Working_Date", "Day", "New_Date", "New_Day", "CoNM_initials", "CoMM_initials",
      "Opening_Person_Name", "Opening_Time", "Closing_Person_Name", "Closing_Time",
      "Reject_Reason", "Cancel_Reason"
    ];

    const rowsData = tableData.map(x => {
      const dayIndex = x.Working_Date ? new Date(x.Working_Date).getDay() : null;
      const dayName = (dayIndex !== null && !isNaN(dayIndex)) ? daysNames[dayIndex] : "";

      return {
        PermitNo: x.PermitNo || "",
        PermitUnder: x.permit_under || 'Construction',
        PermitType: x.permit_type || 'Construction',
        ContractorName: x.subContractorName || "",
        Sub_Contractor_Name: x.new_sub_contractor || "",
        Building_Name: x.building_name || "",
        Level: x.Room_Type || "",
        Zone: resolveZoneNameFromRooms(x),
        Room_Nos: x.Room_Nos || "",
        Type_Of_Activity: resolveActivityName(x),
        Type_Of_Work: resolveTypeOfWork(x),
        Number_Of_Workers: x.Number_Of_Workers || x.number_of_workers || "",
        Activity: x.Activity || "",
        description_of_activity: x.description_of_activity || "",
        Rams_Number: x.rams_number || "",
        HRAs: printHRAS(x),
        Start_Time: x.Start_Time || "",
        End_Time: x.End_Time || "",
        Night_Shift: x.night_shift == 1 ? 'Yes' : 'No',
        New_End_Time: x.new_end_time || "",
        Request_status: x.Request_status || "",
        Notes: formatNotes(x.Notes || x.note),
        Working_Date: x.Working_Date || "",
        Day: dayName,
        New_Date: x.new_date || "",
        New_Day: findNewDay(x),
        CoNM_initials: x.ConM_initials || "",
        CoMM_initials: x.CoMM_initials || "",
        Opening_Person_Name: x.ConM_initials1 || x.opened_by || x.check_in_user || "",
        Opening_Time: formatReportTime(x.open_time || x.check_in_time || x.h_start_time),
        Closing_Person_Name: x.closed_by || x.close_note || x.check_out_user || "",
        Closing_Time: formatReportTime(x.close_time || x.check_out_time || x.h_end_time),
        Reject_Reason: x.reject_reason || "",
        Cancel_Reason: x.cancel_reason || ""
      };
    });

    const wsData = [
      headers,
      ...rowsData.map(row => headers.map(h => {
        const val = row[h];
        if (h === 'PermitNo') {
          return String(val ?? "");
        }
        return val ?? "";
      }))
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const permitNoColIndex = headers.indexOf('PermitNo');
    if (permitNoColIndex !== -1) {
      const colLetter = XLSX.utils.encode_col(permitNoColIndex);
      for (let r = 1; r < wsData.length; r++) {
        const cellRef = `${colLetter}${r + 1}`;
        if (ws[cellRef]) {
          ws[cellRef].t = 's';
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Permits");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ACTIVITY_PERMITS_REPORT_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Table Configuration ───────────────────────────────────────────────────
  const columns = [
    { header: "Permit number", accessor: "PermitNo" },
    { header: "Activity", accessor: "Activity" },
    { header: "Contractor", accessor: "subContractorName" },
    { header: "Sub-Contractor", accessor: "new_sub_contractor" },
    { header: "Level", accessor: "Room_Type" },
    { header: "Building Name", accessor: "building_name" },
    { header: "Zone", accessor: "zone" },
    { header: "Area", accessor: "Room_Nos" },
    { header: "Working Date", accessor: "Working_Date" },
    { header: "Time", accessor: "timeCell" },
    { header: "Working After Midnight", accessor: "nightShiftCell" },
    { header: "New Date", accessor: "newDateCell" },
    { header: "New End Time", accessor: "newEndTime" },
    { header: "Status", accessor: "statusCell" }
  ];

  const totalPages = Math.max(1, Math.ceil(tableData.length / PAGE_LIMIT));
  const startIndex = (currentPage - 1) * PAGE_LIMIT;
  const paginatedData = tableData.slice(startIndex, startIndex + PAGE_LIMIT);

  const formattedTableData = paginatedData.map(item => {
    const isValidDate = (d) => {
      if (!d || d === "0000-00-00" || d === "00-00-0000") return false;
      const parsed = Date.parse(d);
      return !isNaN(parsed);
    };

    const formatMediumDate = (d) => {
      if (!isValidDate(d)) return "N/A";
      return new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    };

    return {
      ...item,
      zone: resolveZoneNameFromRooms(item),
      Working_Date: formatMediumDate(item.Working_Date),
      timeCell: `${item.Start_Time || ""} - ${item.End_Time || ""}`,
      nightShiftCell: item.night_shift == 1 ? "Yes" : "No",
      newDateCell: formatMediumDate(item.new_date),
      newEndTime: item.new_end_time || "",
      statusCell: <StatusBadge status={item.Request_status} />
    };
  });

  return (
    <div className="dept-page reports-page">
      {/* Page Header */}
      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Show Reports</h1>
          <p className="dept-page-subtitle">Filter and generate permit reports dynamically</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="dept-table-card" style={{ marginBottom: "24px" }}>
        <div className="df-form" style={{ padding: "24px" }}>
          <div className="df-grid">

            {/* Row 1: Report Type | Date */}
            <div className="df-field">
              <label className="df-label">Report Type</label>
              <select
                className="df-select"
                value={filters.reportType}
                onChange={(e) => handleChange("reportType", e.target.value)}
              >
                <option value="1">Daily Report</option>
                <option value="2">Weekly Report</option>
              </select>
            </div>

            <div className="df-field">
              <label className="df-label">Date</label>
              <input
                type="date"
                className={`df-input ${filters.reportType === "2" ? "df-readonly" : ""}`}
                disabled={filters.reportType === "2"}
                value={filters.date}
                onChange={(e) => handleChange("date", e.target.value)}
              />
            </div>

            {/* Row 2: Year | Week */}
            <div className="df-field">
              <label className="df-label">Year</label>
              <select
                className={`df-select ${filters.reportType === "1" ? "df-readonly" : ""}`}
                disabled={filters.reportType === "1"}
                value={filters.year}
                onChange={(e) => handleYearChange(e.target.value)}
              >
                <option value="">Select Year</option>
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="df-field">
              <label className="df-label">Week</label>
              <select
                className={`df-select ${filters.reportType === "1" || !filters.year ? "df-readonly" : ""}`}
                disabled={filters.reportType === "1" || !filters.year}
                value={filters.weekno}
                onChange={(e) => handleChange("weekno", e.target.value)}
              >
                <option value="">Select Week</option>
                {weeksList.map((wk, idx) => (
                  <option key={idx} value={wk}>{wk}</option>
                ))}
              </select>
            </div>

            {/* Row 1: Working Date range (From) | Working Date range (To) */}
            <div className="df-field">
              <label className="df-label">Working Date range (From)</label>
              <input
                type="date"
                className={`df-input ${filters.reportType === "2" ? "df-readonly" : ""}`}
                disabled={filters.reportType === "2"}
                value={filters.workingDateFrom}
                onChange={(e) => handleChange("workingDateFrom", e.target.value)}
              />
            </div>

            <div className="df-field">
              <label className="df-label">Working Date range (To)</label>
              <input
                type="date"
                className={`df-input ${filters.reportType === "2" ? "df-readonly" : ""}`}
                disabled={filters.reportType === "2"}
                value={filters.workingDateTo}
                onChange={(e) => handleChange("workingDateTo", e.target.value)}
              />
            </div>

            {/* Row 2: Building | Level / Floor */}
            <div className="df-field">
              <label className="df-label">Building</label>
              <MultiSelectDropdown
                placeholder="Select Buildings"
                options={buildingsOptions}
                selectedValues={filters.building}
                onChange={(vals) => {
                  setFilters(prev => ({ ...prev, building: vals, level: [], area: [] }));
                }}
              />
            </div>

            <div className="df-field">
              <label className="df-label">Level / Floor</label>
              <MultiSelectDropdown
                placeholder="Select Levels"
                options={filteredLevels.map(f => f.floor_name)}
                selectedValues={filters.level}
                onChange={(vals) => {
                  setFilters(prev => ({ ...prev, level: vals, area: [], zones: [] }));
                }}
              />
            </div>

            {/* Row 3: Zones | Rooms */}
            <div className="df-field">
              <label className="df-label">Zones</label>
              <MultiSelectDropdown
                placeholder="Select Zones"
                options={filteredZones.map(z => z.zone)}
                selectedValues={filters.zones || []}
                onChange={(vals) => setFilters(prev => ({ ...prev, zones: vals, area: [] }))}
              />
            </div>

            <div className="df-field">
              <label className="df-label">Rooms</label>
              <MultiSelectDropdown
                placeholder="Select Rooms"
                options={filteredRooms}
                selectedValues={filters.area}
                onChange={(vals) => handleChange("area", vals)}
              />
            </div>

            {/* Row 4: Contractor | Permit Status */}
            <div className="df-field">
              <label className="df-label">Contractor</label>
              {isSubcontractor ? (
                <input
                  type="text"
                  className="df-input df-readonly"
                  value={contractors.length > 0 ? (contractors.find(c => String(c.id) === String(userContractorId))?.subContractorName || contractors.find(c => String(c.id) === String(Array.isArray(filters.subContractor) ? filters.subContractor[0] : filters.subContractor))?.subContractorName || contractors[0]?.subContractorName) : "Loading..."}
                  readOnly
                />
              ) : (
                <SearchableMultiSelect
                  options={contractors}
                  selectedValues={Array.isArray(filters.subContractor) ? filters.subContractor : (filters.subContractor ? [String(filters.subContractor)] : [])}
                  onChange={(vals) => handleChange("subContractor", vals)}
                  placeholder="Select Contractors"
                  disabled={isSubcontractor}
                  valueKey="id"
                  labelKey="subContractorName"
                />
              )}
            </div>

            <div className="df-field">
              <label className="df-label">Permit Status</label>
              <MultiSelectDropdown
                placeholder="Select Statuses"
                options={STATUS_OPTIONS}
                selectedValues={filters.status}
                onChange={(vals) => handleChange("status", vals)}
              />
            </div>

            {/* Row 5: Start Time | End Time | Night Shift */}
            <div className="df-field--full time-nightshift-grid">
              <div className="df-field">
                <label className="df-label">Start Time</label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type="text"
                    placeholder="00:00"
                    readOnly
                    className="df-input"
                    value={filters.startTime}
                    onClick={() => setShowStartPicker(true)}
                    style={{ cursor: 'pointer', paddingRight: filters.startTime ? "30px" : "12px" }}
                  />
                  {filters.startTime && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChange("startTime", "");
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
                      initialTime={filters.startTime || "12:00"}
                      onSave={(newTime) => {
                        handleChange("startTime", newTime);
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
                    value={filters.endTime}
                    onClick={() => setShowEndPicker(true)}
                    style={{ cursor: 'pointer', paddingRight: filters.endTime ? "30px" : "12px" }}
                  />
                  {filters.endTime && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChange("endTime", "");
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
                      initialTime={filters.endTime || "12:00"}
                      onSave={(newTime) => {
                        handleChange("endTime", newTime);
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
                    id="nightShiftCheckbox"
                    checked={filters.nightShift}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFilters(prev => ({
                        ...prev,
                        nightShift: checked,
                        newWorkDate: checked ? prev.newWorkDate : "",
                        newEndTime: checked ? prev.newEndTime : ""
                      }));
                    }}
                    style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent, #00e5a0)" }}
                  />
                  <label htmlFor="nightShiftCheckbox" className="df-label" style={{ margin: 0, cursor: "pointer", textTransform: "none", fontSize: "14px", fontWeight: "normal", color: "var(--text-main, #f9fafb)" }}>
                    Working after midnight? Yes
                  </label>
                </div>
              </div>
            </div>

            {/* Conditional Night Shift Fields */}
            {filters.nightShift && (
              <>
                <div className="df-field">
                  <label className="df-label">New Date</label>
                  <input
                    type="date"
                    className="df-input"
                    value={filters.newWorkDate}
                    onChange={(e) => handleChange("newWorkDate", e.target.value)}
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
                      value={filters.newEndTime}
                      onClick={() => setShowNewEndPicker(true)}
                      style={{ cursor: 'pointer', paddingRight: filters.newEndTime ? "30px" : "12px" }}
                    />
                    {filters.newEndTime && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChange("newEndTime", "");
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
                  {showNewEndPicker && (
                    <div className="timekeeper-modal-overlay" onClick={() => setShowNewEndPicker(false)}>
                      <AnalogTimePicker
                        initialTime={filters.newEndTime || "12:00"}
                        onSave={(newTime) => {
                          handleChange("newEndTime", newTime);
                          setShowNewEndPicker(false);
                        }}
                        onCancel={() => setShowNewEndPicker(false)}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Row 6: Permit Under | Permit Type */}
            <div className="df-field">
              <label className="df-label">Permit Under</label>
              <select
                className="df-select"
                value={filters.permitUnder}
                onChange={(e) => handleChange("permitUnder", e.target.value)}
              >
                <option value="">Select Permit Under</option>
                <option value="Construction">Construction</option>
                <option value="Commissioning">Commissioning</option>
              </select>
            </div>

            <div className="df-field">
              <label className="df-label">Permit Type</label>
              <select
                className="df-select"
                value={filters.permitType}
                onChange={(e) => handleChange("permitType", e.target.value)}
              >
                <option value="">Select Permit Type</option>
                <option value="Construction">Construction</option>
                <option value="Commissioning">Commissioning</option>
              </select>
            </div>

            {/* Row 10: Permit Number | HRA Checklists */}
            <div className="df-field">
              <label className="df-label">Permit Number</label>
              <input
                type="text"
                className="df-input"
                placeholder="e.g. 82389714..."
                value={filters.permitNo}
                onChange={(e) => handleChange("permitNo", e.target.value)}
              />
            </div>

            <div className="df-field">
              <label className="df-label">HRA Checklists</label>
              <MultiSelectDropdown
                placeholder="Select HRA Checklists"
                options={HRA_LIST}
                selectedValues={filters.hras}
                onChange={(vals) => handleChange("hras", vals)}
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
              onClick={handleReset}
              disabled={isSearching}
            >
              Reset
            </button>
            <button
              type="button"
              className="df-btn df-btn--submit"
              onClick={handleShow}
              disabled={isSearching}
            >
              {isSearching ? "Searching..." : "Show"}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table Card */}
      <div className="dept-table-card">
        <div className="dept-page-header" style={{ padding: "12px 16px", marginBottom: 0 }}>
          <div className="dept-page-header__left">
            <span className="dept-count-badge">{tableData.length} Total</span>
          </div>
          <div className="dept-page-header__right" style={{ display: "flex", gap: "12px" }}>
            <button
              className="dept-add-btn"
              onClick={handleDownload}
              disabled={tableData.length === 0}
              style={{ backgroundColor: '#22C55E', border: 'none' }}
            >
              <FaFileCsv style={{ marginRight: '6px', fontSize: '1.1rem' }} /> CSV
            </button>
            <button
              className="dept-add-btn"
              onClick={handleDownloadExcel}
              disabled={tableData.length === 0}
              style={{ backgroundColor: '#3B82F6', border: 'none' }}
            >
              <FaArrowDown style={{ marginRight: '6px' }} /> Excel
            </button>
          </div>
        </div>

        <Table
          columns={columns}
          data={formattedTableData}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoadingSelectors || isSearching}
        />
        {!(isLoadingSelectors || isSearching) && tableData.length > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-color, #374151)",
            color: "var(--text-muted, #9ca3af)",
            fontSize: "14px",
            fontWeight: 500
          }}>
            Showing {paginatedData.length} of <strong style={{ color: "var(--text-main, #f9fafb)", marginLeft: "4px", marginRight: "4px" }}>{tableData.length}</strong> permits
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;