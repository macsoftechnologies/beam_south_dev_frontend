import React, { useState, useRef, useEffect } from "react";

export const SEVERITY_OPTIONS = [
  {
    level: 1,
    label: "1 - Insignificant",
    riskLabel: "Very low risk",
    desc: "Small injury/bruises or no local damage",
    bg: "#C0C0C0", // Exactly sampled from image: #C2C2C2 / #C4C4C4
    color: "#000000",
    border: "#A6A6A6"
  },
  {
    level: 2,
    label: "2 - Minor",
    riskLabel: "Low risk",
    desc: "Minor injury or small spill cleaned up immediately",
    bg: "#92D050", // Exactly sampled from image: #96D355 / #99D757
    color: "#000000",
    border: "#7BB33B"
  },
  {
    level: 3,
    label: "3 - Moderate",
    riskLabel: "Moderate risk",
    desc: "Serious injury (no absence) or serious damage/major spills",
    bg: "#FFFF00", // Exactly sampled from image: #FFFF06
    color: "#000000",
    border: "#D6D600"
  },
  {
    level: 4,
    label: "4 - Critical",
    riskLabel: "High risk",
    desc: "One or more injuries (permanent) or damage hard to reverse",
    bg: "#FF0000", // Exactly sampled from image: #FF0606
    color: "#FFFFFF",
    border: "#CC0000"
  },
  {
    level: 5,
    label: "5 - Catastrophic",
    riskLabel: "Very high risk",
    desc: "One or more deaths or irreversible damage",
    bg: "#C00000", // Exactly sampled from image: #C30606 / #B30606
    color: "#FFFFFF",
    border: "#8B0000"
  }
];

export const SEVERITY_MAP = SEVERITY_OPTIONS.reduce((acc, item) => {
  acc[item.level] = item;
  return acc;
}, {});

/**
 * Incident Category Severity Rules Table
 * (From Heads-Up Classification Practice Standard)
 */
export const CATEGORY_SEVERITY_RULES = {
  "Near Miss": {
    fixedActual: "N/A",
    allowedActual: ["N/A"],
    allowedPotential: [1, 2, 3, 4, 5],
    noteActual: "N/A for Near Miss",
    notePotential: null
  },
  "No Treatment Injury": {
    fixedActual: 1,
    allowedActual: [1],
    allowedPotential: [1, 2, 3, 4, 5],
    noteActual: "Fixed to Level 1 for No Treatment Injury",
    notePotential: null
  },
  "First Aid Injury": {
    fixedActual: 2,
    allowedActual: [2],
    allowedPotential: [2, 3, 4, 5],
    noteActual: "Fixed to Level 2 for First Aid Injury",
    notePotential: "Level 2–5"
  },
  "Medical Treatment Injury": {
    fixedActual: 3,
    allowedActual: [3],
    allowedPotential: [3, 4, 5],
    noteActual: "Fixed to Level 3 for Medical Treatment Injury",
    notePotential: "Level 3–5"
  },
  "Restricted Work Injury": {
    fixedActual: 3,
    allowedActual: [3],
    allowedPotential: [3, 4, 5],
    noteActual: "Fixed to Level 3 for Restricted Work Injury",
    notePotential: "Level 3–5"
  },
  "Lost Time Injury": {
    fixedActual: 3,
    allowedActual: [3],
    allowedPotential: [3, 4, 5],
    noteActual: "Fixed to Level 3 for Lost Time Injury",
    notePotential: "Level 3–5"
  },
  "Permanent Disability": {
    fixedActual: 4,
    allowedActual: [4],
    allowedPotential: [4, 5],
    noteActual: "Fixed to Level 4 for Permanent Disability",
    notePotential: "Level 4–5"
  },
  "Fatality": {
    fixedActual: 5,
    allowedActual: [5],
    allowedPotential: [],
    fixedPotential: "N/A",
    noteActual: "Fixed to Level 5 for Fatality",
    notePotential: "N/A for Catastrophic"
  },
  "Occupational Illness": {
    fixedActual: null,
    allowedActual: [1, 2, 3, 4, 5],
    allowedPotential: null,
    noteActual: null,
    notePotential: null
  },
  "Environmental Incident": {
    fixedActual: null,
    allowedActual: [1, 2, 3, 4, 5],
    allowedPotential: null,
    noteActual: null,
    notePotential: null
  },
  "Property Damage": {
    fixedActual: null,
    allowedActual: [1, 2, 3, 4, 5],
    allowedPotential: null,
    noteActual: null,
    notePotential: null
  }
};

/**
 * Resolves configuration for Actual and Potential Severity based on selected Category and Actual Severity.
 */
export const getCategorySeverityConfig = (category, currentActual) => {
  let ruleKey = null;
  if (category) {
    const cLower = String(category).toLowerCase().trim();
    ruleKey = Object.keys(CATEGORY_SEVERITY_RULES).find((k) => {
      const kLower = k.toLowerCase();
      return cLower === kLower || cLower.includes(kLower) || kLower.includes(cLower);
    });
  }
  const rule = ruleKey ? CATEGORY_SEVERITY_RULES[ruleKey] : null;

  // Actual Severity
  const isActualFixed = Boolean(rule && rule.fixedActual !== null && rule.fixedActual !== undefined);
  const actualValue = isActualFixed ? rule.fixedActual : currentActual;
  const isActualNA = String(actualValue).toUpperCase() === "N/A" || ruleKey === "Near Miss";

  // Potential Severity
  let isPotentialFixed = false;
  let fixedPotentialValue = null;
  let allowedPotentialLevels = [1, 2, 3, 4, 5];

  if (ruleKey === "Near Miss" || isActualNA) {
    // Near Miss: Actual is N/A, Potential can be 1-5
    isPotentialFixed = false;
    fixedPotentialValue = null;
    allowedPotentialLevels = [1, 2, 3, 4, 5];
  } else if (ruleKey === "Fatality" || String(actualValue) === "5") {
    // Fatality or Catastrophic: Potential is N/A
    isPotentialFixed = true;
    fixedPotentialValue = "N/A";
    allowedPotentialLevels = [];
  } else if (actualValue && actualValue !== "N/A") {
    const actNum = Number(actualValue);
    if (!isNaN(actNum) && actNum >= 1 && actNum <= 4) {
      // Potential Severity starting point is Actual (Potential >= Actual)
      allowedPotentialLevels = [1, 2, 3, 4, 5].filter((lvl) => lvl >= actNum);
    }
  }

  // Intersect with rule's specific allowedPotential if defined
  if (rule && Array.isArray(rule.allowedPotential) && rule.allowedPotential.length > 0) {
    allowedPotentialLevels = allowedPotentialLevels.filter((lvl) => rule.allowedPotential.includes(lvl));
  }

  let notePotential = null;
  if (isPotentialFixed) {
    notePotential = "N/A for Catastrophic / Fatality";
  } else if (allowedPotentialLevels.length < 5 && allowedPotentialLevels.length > 0) {
    notePotential = `Level ${allowedPotentialLevels[0]}–5 (cannot be less than Actual)`;
  }

  return {
    ruleKey,
    isActualFixed,
    actualValue: isActualNA ? "N/A" : actualValue,
    isActualNA,
    isPotentialFixed,
    fixedPotentialValue,
    allowedPotentialLevels,
    allowedActualLevels: rule?.allowedActual || [1, 2, 3, 4, 5],
    noteActual: rule?.noteActual || null,
    notePotential: rule?.notePotential || notePotential
  };
};

export default function SeverityDropdown({
  value = "",
  onChange,
  placeholder = "Select severity...",
  disabled = false,
  hasError = false,
  id,
  allowedLevels
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const isNA = String(value).toUpperCase() === "N/A";

  const selectedOption = !isNA
    ? SEVERITY_OPTIONS.find((s) => String(s.level) === String(value))
    : null;

  const availableOptions = SEVERITY_OPTIONS.filter((s) => {
    if (Array.isArray(allowedLevels)) {
      return allowedLevels.includes(s.level);
    }
    return true;
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if ((e.key === "Enter" || e.key === " ") && !isOpen) {
      e.preventDefault();
      if (!disabled) setIsOpen(true);
    }
  };

  const handleSelect = (level) => {
    if (disabled) return;
    if (onChange) {
      onChange(level);
    }
    setIsOpen(false);
  };

  return (
    <div
      className="im-select-container"
      ref={containerRef}
      id={id}
      style={{ position: "relative", width: "100%" }}
    >
      <button
        type="button"
        disabled={disabled || isNA || availableOptions.length === 0}
        onClick={() => !(disabled || isNA || availableOptions.length === 0) && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          minHeight: "40px",
          borderRadius: "8px",
          border: hasError
            ? "1.5px solid #DC2626"
            : selectedOption
            ? `1.5px solid ${selectedOption.border}`
            : "1px solid var(--border-color, #CBD5E1)",
          background: disabled || isNA
            ? "var(--bg-dark, #F1F5F9)"
            : selectedOption
            ? selectedOption.bg
            : "#FFFFFF",
          color: disabled || isNA
            ? "var(--text-muted, #64748B)"
            : selectedOption
            ? selectedOption.color
            : "var(--text-muted, #64748B)",
          cursor: disabled ? "not-allowed" : "pointer",
          fontWeight: isNA ? 600 : selectedOption ? 700 : 400,
          fontSize: "13px",
          boxShadow: isOpen
            ? "0 0 0 2px rgba(37, 99, 235, 0.2)"
            : "none",
          transition: "all 0.15s ease",
          textAlign: "left"
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {isNA ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: 600, color: "var(--text-muted, #64748B)" }}>N/A</span>
            </span>
          ) : selectedOption ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <span>{selectedOption.label}</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  opacity: 0.85,
                  padding: "1px 6px",
                  borderRadius: "4px",
                  background:
                    selectedOption.color === "#FFFFFF"
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.08)"
                }}
              >
                {selectedOption.riskLabel}
              </span>
            </span>
          ) : (
            placeholder
          )}
        </span>

        <span
          style={{
            marginLeft: "8px",
            display: "inline-flex",
            alignItems: "center",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease"
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      {isOpen && !disabled && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 60,
            background: "#FFFFFF",
            border: "1px solid #CBD5E1",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
            overflow: "hidden"
          }}
        >
          {/* Default / Clear Option */}
          <div
            role="option"
            aria-selected={!value}
            onClick={() => handleSelect("")}
            style={{
              padding: "8px 12px",
              background: "#F8FAFC",
              color: "#64748B",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              borderBottom: "1px solid #E2E8F0"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F8FAFC")}
          >
            {placeholder}
          </div>

          {/* Color-Coded Severity Options from Risk Matrix */}
          {availableOptions.length === 0 ? (
            <div style={{ padding: "12px", textAlign: "center", color: "#64748B", fontSize: "12px" }}>
              No severity options available
            </div>
          ) : (
            availableOptions.map((s) => {
              const isSelected = String(s.level) === String(value);
              return (
                <div
                  key={s.level}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(s.level)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: s.bg,
                    color: s.color,
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                    fontWeight: isSelected ? 700 : 600,
                    fontSize: "13px",
                    transition: "filter 0.15s ease",
                    boxShadow: isSelected ? "inset 0 0 0 2px #0F172A" : "none"
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.filter = "brightness(0.92)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.filter = "brightness(1)")
                  }
                  title={`${s.label} (${s.riskLabel}): ${s.desc}`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{s.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background:
                          s.color === "#FFFFFF"
                            ? "rgba(255, 255, 255, 0.25)"
                            : "rgba(0, 0, 0, 0.1)"
                      }}
                    >
                      {s.riskLabel}
                    </span>
                    {isSelected && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

