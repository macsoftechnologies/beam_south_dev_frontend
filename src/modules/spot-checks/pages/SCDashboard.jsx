import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { spotCheckService } from "../../../services/spotCheckService";
import { getBuildings, getContractors } from "../../../services/authService";
import { generateSpotCheckStatsPdf } from "../utils/spotCheckStatsPdfGenerator";
import "./SCDashboard.css";

// ── Icons ──
const Icons = {
  eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>,
  calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>,
  activity: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  layers: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>,
  target: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  users: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  building: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  check: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  cross: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  up: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>,
  down: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/></svg>,
  download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
};

// ── Date Range Bounds Helper ──
const getDateRangeBounds = (rangeKey) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  if (rangeKey === 'week') {
    const diff = (today.getDay() === 0 ? -6 : 1) - today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return { startDate: monday.toISOString().split('T')[0], endDate: todayStr };
  }
  if (rangeKey === '30d') { const d = new Date(Date.now() - 30 * 864e5); return { startDate: d.toISOString().split('T')[0], endDate: todayStr }; }
  if (rangeKey === '90d') { const d = new Date(Date.now() - 90 * 864e5); return { startDate: d.toISOString().split('T')[0], endDate: todayStr }; }
  if (rangeKey === 'year') { return { startDate: `${today.getFullYear()}-01-01`, endDate: todayStr }; }
  if (rangeKey === '13m') { const d = new Date(Date.now() - 395 * 864e5); return { startDate: d.toISOString().split('T')[0], endDate: todayStr }; }
  return { startDate: '', endDate: '' };
};

const extractDateYMD = (dateVal) => {
  if (!dateVal) return null;
  const str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch {}
  return null;
};

const getLogoUrl = (logoVal) => {
  if (!logoVal) return null;
  if (logoVal.startsWith("data:") || logoVal.startsWith("http://") || logoVal.startsWith("https://")) return logoVal;
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  return `${baseUrl}/subcontractors/${logoVal}`;
};

const findContractorLogo = (contractorName, contractorsList = []) => {
  if (!contractorName || contractorName === "Unassigned" || contractorName === "—") return null;
  const match = (contractorsList || []).find((c) => {
    const cName = c.company_name || c.companyName || c.subContractorName || c.subcontractor_name || c.name || "";
    return (
      cName.toLowerCase().trim() === String(contractorName).toLowerCase().trim() ||
      cName.toLowerCase().includes(String(contractorName).toLowerCase().trim()) ||
      String(contractorName).toLowerCase().includes(cName.toLowerCase().trim())
    );
  });
  return match?.logo || match?.logo_url || match?.company_logo || match?.logoFile || null;
};

const getInitials = (n) => {
  if (!n) return "??";
  let cleanName = String(n).replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const words = cleanName.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + (words[1] ? words[1][0] : "")).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = ["#0284C7", "#0D9488", "#D97706", "#7C3AED", "#DB2777", "#4F46E5"];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getRateColor = (rate) => {
  if (rate >= 80) return "#34D399";
  if (rate >= 60) return "#38BDF8";
  if (rate >= 40) return "#FBBF24";
  return "#F87171";
};

const ContractorAvatar = ({ name, contractorsList, size = 28 }) => {
  const [imgError, setImgError] = useState(false);
  const rawLogo = findContractorLogo(name, contractorsList);
  const logoUrl = getLogoUrl(rawLogo);
  const color = getAvatarColor(name);
  const initials = getInitials(name);

  if (logoUrl && !imgError) {
    return (
      <div className="sc-ent-logo sc-ent-logo-img" style={size ? { width: size, height: size } : {}}>
        <img
          src={logoUrl}
          alt={name}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="sc-ent-logo"
      style={{
        background: `${color}25`,
        color: color,
        border: `1px solid ${color}55`,
        ...(size ? { width: size, height: size, fontSize: Math.max(9, Math.floor(size * 0.42)) } : {})
      }}
    >
      {initials}
    </div>
  );
};

const StatCard = ({ label, value, sub, foot, accent = "#131E40", valColor, icon }) => {
  const Icon = Icons[icon];
  return (
    <div className="stat" style={{ '--stat-accent': accent, '--stat-icon-bg': `${accent}1A`, '--stat-value-col': valColor || 'var(--text-main)' }}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">{Icon && <Icon />}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{sub}</div>
      {foot && <div className="stat-foot">{foot}</div>}
    </div>
  );
};

// ── Multi-Select Filter Component ──
const MultiSelectFilter = ({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  showLogos = false,
  contractorsList = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(opt => String(opt.label || opt.value || opt).toLowerCase().includes(q));
  }, [options, search]);

  const toggleOption = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const handleSelectAll = () => {
    if (filteredOptions.length === 0) return;
    const allFilteredVals = filteredOptions.map(o => o.value);
    const areAllSelected = allFilteredVals.every(v => selected.includes(v));
    if (areAllSelected) {
      onChange(selected.filter(v => !allFilteredVals.includes(v)));
    } else {
      const newSel = Array.from(new Set([...selected, ...allFilteredVals]));
      onChange(newSel);
    }
  };

  const handleClear = (e) => {
    e?.stopPropagation?.();
    onChange([]);
  };

  const triggerLabel = useMemo(() => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) return selected[0];
    return `${selected.length} Selected`;
  }, [selected, placeholder]);

  return (
    <div ref={dropdownRef} className="sc-multi-select-container">
      <button
        type="button"
        className={`sc-multi-select-trigger ${selected.length > 0 ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title={selected.length > 0 ? selected.join(", ") : placeholder}
      >
        <span className="sc-multi-select-text">
          {triggerLabel}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {selected.length > 0 && (
            <span
              className="sc-multi-select-clear"
              onClick={handleClear}
              title="Clear selection"
            >
              &times;
            </span>
          )}
          <svg
            className={`sc-multi-select-chevron ${isOpen ? "open" : ""}`}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="sc-multi-select-menu">
          <div className="sc-multi-select-search-box">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="sc-multi-select-search-input"
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <span className="sc-multi-select-search-clear" onClick={() => setSearch("")}>&times;</span>
            )}
          </div>

          <div className="sc-multi-select-actions">
            <button
              type="button"
              className="sc-multi-select-action-btn"
              onClick={handleSelectAll}
            >
              {filteredOptions.length > 0 && filteredOptions.every(o => selected.includes(o.value))
                ? "Deselect All"
                : "Select All"}
            </button>
            {selected.length > 0 && (
              <button
                type="button"
                className="sc-multi-select-action-btn danger"
                onClick={handleClear}
              >
                Clear ({selected.length})
              </button>
            )}
          </div>

          <div className="sc-multi-select-list">
            {filteredOptions.length === 0 ? (
              <div className="sc-multi-select-empty">No options found</div>
            ) : (
              filteredOptions.map(opt => {
                const isChecked = selected.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    className={`sc-multi-select-item ${isChecked ? "selected" : ""}`}
                    onClick={() => toggleOption(opt.value)}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="sc-multi-select-checkbox"
                    />
                    {showLogos && (
                      <ContractorAvatar
                        name={opt.label}
                        contractorsList={contractorsList}
                        size={20}
                      />
                    )}
                    <span className="sc-multi-select-item-label" title={opt.label}>
                      {opt.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function SCDashboard() {
  const navigate = useNavigate();
  const [allSpotChecks, setAllSpotChecks] = useState([]);
  const [buildingsList, setBuildingsList] = useState([]);
  const [contractorsList, setContractorsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Filter States
  const [selectedBuildings, setSelectedBuildings] = useState([]);
  const [selectedContractors, setSelectedContractors] = useState([]);
  const [selectedRange, setSelectedRange] = useState('13m');
  const [startDate, setStartDate] = useState(() => getDateRangeBounds('13m').startDate);
  const [endDate, setEndDate] = useState(() => getDateRangeBounds('13m').endDate);
  const [filter, setFilter] = useState({ q: '', compliance: '' });

  const handleRangeChange = (range) => {
    setSelectedRange(range);
    if (range !== 'custom') {
      const bounds = getDateRangeBounds(range);
      setStartDate(bounds.startDate);
      setEndDate(bounds.endDate);
    }
  };

  const handleStartDateChange = (val) => {
    setStartDate(val);
    setSelectedRange('custom');
  };

  const handleEndDateChange = (val) => {
    setEndDate(val);
    setSelectedRange('custom');
  };

  const handleClearFilters = () => {
    setSelectedBuildings([]);
    setSelectedContractors([]);
    handleRangeChange('13m');
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const [allChecksRes, cListRes, bListRes] = await Promise.all([
          spotCheckService.getSpotChecks({ page: 1, limit: 1000 }).catch(() => ({ spotChecks: [] })),
          getContractors(1, 1000).catch(() => ({ data: [] })),
          getBuildings(1, 1000).catch(() => ({ data: [] })),
        ]);

        const rawC = cListRes?.data?.rows || cListRes?.data || cListRes?.subContractors || cListRes || [];
        setContractorsList(Array.isArray(rawC) ? rawC : []);

        const rawB = bListRes?.data?.rows || bListRes?.data || bListRes?.buildings || bListRes || [];
        setBuildingsList(Array.isArray(rawB) ? rawB : []);

        const checks = allChecksRes?.spotChecks || [];
        setAllSpotChecks(Array.isArray(checks) ? checks : []);
      } catch (err) {
        console.error("Failed to load spot checks dashboard", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const rawRoleAdmin = (localStorage.getItem("UserType") || currentUser?.role || currentUser?.userType || currentUser?.user_type || "").toUpperCase();
  const userRolesArrAdmin = Array.isArray(currentUser?.userTypes) ? currentUser.userTypes.map((t) => String(t).toUpperCase()) : [];
  const allRolesAdmin = [rawRoleAdmin, ...userRolesArrAdmin].join(" ");
  const isAdmin = allRolesAdmin.includes("ADMIN") || allRolesAdmin.includes("SUPERADMIN") || Boolean(currentUser?.isSuperAdmin);

  const rawRole = (localStorage.getItem("UserType") || currentUser?.role || currentUser?.userType || currentUser?.user_type || "").toUpperCase();
  const userRolesArr = Array.isArray(currentUser?.userTypes) ? currentUser.userTypes.map((t) => String(t).toUpperCase()) : [];
  const allRoles = [rawRole, ...userRolesArr].join(" ");
  const isContractor = allRoles.includes("CONTRACTOR") || allRoles.includes("SUBCONTRACTOR") || Boolean(currentUser?.subcontractor_id) || Boolean(currentUser?.contractorId) || Boolean(currentUser?.typeId && allRoles.includes("SUBCONTRACTOR"));
  const isObserver = allRoles.includes("OBSERVER");
  const isReadOnly = isContractor || isObserver;
  const contractorId = currentUser?.typeId || currentUser?.subcontractor_id || currentUser?.subContId || currentUser?.contractorId;

  const myContractor = useMemo(() => {
    if (!isContractor) return null;
    return (
      contractorsList.find(c => 
        String(c.id) === String(contractorId) || 
        String(c.subcontractor_id) === String(contractorId) ||
        (currentUser?.username && c.username === currentUser.username) ||
        (currentUser?.company_name && (c.subContractorName === currentUser.company_name || c.company_name === currentUser.company_name)) ||
        (currentUser?.companyName && (c.subContractorName === currentUser.companyName || c.company_name === currentUser.companyName))
      ) || (contractorsList.length === 1 ? contractorsList[0] : null)
    );
  }, [isContractor, contractorsList, contractorId, currentUser?.company_name, currentUser?.companyName, currentUser?.username]);

  const myContractorName = currentUser?.company_name || currentUser?.companyName || currentUser?.subContractorName || currentUser?.contractorName || myContractor?.subContractorName || myContractor?.company_name || myContractor?.companyName || myContractor?.subcontractor_name || myContractor?.name || "";

  // ── Dropdown Options ──
  const buildingOptions = useMemo(() => {
    const names = new Set();
    (buildingsList || []).forEach((b, idx) => {
      const bName = b?.name || b?.buildingName || b?.building_name || (typeof b === 'string' ? b : `Building #${idx+1}`);
      if (bName && String(bName).trim()) {
        names.add(String(bName).trim());
      }
    });
    (allSpotChecks || []).forEach(c => {
      if (c.buildingName && String(c.buildingName).trim()) {
        names.add(String(c.buildingName).trim());
      }
      if (c.location && String(c.location).trim()) {
        names.add(String(c.location).trim());
      }
    });
    return Array.from(names).sort().map(name => ({ label: name, value: name }));
  }, [buildingsList, allSpotChecks]);

  const contractorOptions = useMemo(() => {
    const map = new Map();
    (contractorsList || []).forEach((c, idx) => {
      const cName = c?.company_name || c?.companyName || c?.subContractorName || c?.subcontractor_name || c?.name || (typeof c === 'string' ? c : `Contractor #${idx+1}`);
      const trimmed = String(cName || '').trim();
      if (trimmed && !map.has(trimmed)) {
        map.set(trimmed, {
          label: trimmed,
          value: trimmed,
          logo: c?.logo || c?.logo_url || c?.company_logo || c?.logoFile || null
        });
      }
    });
    (allSpotChecks || []).forEach(c => {
      if (c.companyInvolved && String(c.companyInvolved).trim()) {
        const trimmed = String(c.companyInvolved).trim();
        if (!map.has(trimmed)) {
          map.set(trimmed, {
            label: trimmed,
            value: trimmed,
            logo: findContractorLogo(trimmed, contractorsList)
          });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [contractorsList, allSpotChecks]);

  // ── Filtered Spot Checks Data ──
  const filteredSpotChecks = useMemo(() => {
    return allSpotChecks.filter(item => {
      // 1. Contractor
      if (isContractor) {
        if (myContractorName) {
          const comp = (item.companyInvolved || '').toLowerCase();
          if (!comp.includes(myContractorName.toLowerCase()) && myContractorName.toLowerCase() !== comp) {
            return false;
          }
        }
      } else if (selectedContractors.length > 0) {
        const comp = (item.companyInvolved || '').toLowerCase().trim();
        const matches = selectedContractors.some(c => {
          const sel = c.toLowerCase().trim();
          return comp === sel || comp.includes(sel) || sel.includes(comp);
        });
        if (!matches) return false;
      }

      // 2. Building
      if (selectedBuildings.length > 0) {
        const bName = (item.buildingName || '').toLowerCase().trim();
        const loc = (item.location || '').toLowerCase().trim();
        const matches = selectedBuildings.some(b => {
          const sel = b.toLowerCase().trim();
          return bName === sel || bName.includes(sel) || loc === sel || loc.includes(sel);
        });
        if (!matches) return false;
      }

      // 3. Date Range
      if (startDate || endDate) {
        const itemYMD = extractDateYMD(item.date || item.createdTime || item.createdAt);
        if (itemYMD) {
          if (startDate && itemYMD < startDate) return false;
          if (endDate && itemYMD > endDate) return false;
        }
      }

      return true;
    });
  }, [allSpotChecks, isContractor, myContractorName, selectedContractors, selectedBuildings, startDate, endDate]);

  // ── Derived Dashboard Metrics ──
  const stats = useMemo(() => {
    const totalChecks = filteredSpotChecks.length;
    const compliantCount = filteredSpotChecks.filter(c => c.chk3_2 === 'Yes').length;
    const nonCompliantCount = filteredSpotChecks.filter(c => c.chk3_2 === 'No').length;
    const activePermitted = filteredSpotChecks.filter(c => c.chk1_1 === 'Yes' || c.ptwNumber || c.permitNumber).length || totalChecks;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 864e5).toISOString().split('T')[0];
    const recentPeriodCount = filteredSpotChecks.filter(c => {
      const ymd = extractDateYMD(c.date || c.createdTime || c.createdAt);
      return ymd && ymd >= sevenDaysAgo;
    }).length;

    return {
      totalChecks,
      compliantCount,
      nonCompliantCount,
      activePermitted,
      recentPeriodCount,
    };
  }, [filteredSpotChecks]);

  // ── Contractor Statistics ──
  const contractorStats = useMemo(() => {
    const cMap = {};
    filteredSpotChecks.forEach(c => {
      const name = c.companyInvolved || 'Unspecified Contractor';
      if (!cMap[name]) cMap[name] = { name, count: 0, compliant: 0, nonCompliant: 0 };
      cMap[name].count += 1;
      if (c.chk3_2 === 'Yes') cMap[name].compliant += 1;
      else if (c.chk3_2 === 'No') cMap[name].nonCompliant += 1;
    });
    return Object.values(cMap).sort((a, b) => b.count - a.count);
  }, [filteredSpotChecks]);

  // ── Building Statistics ──
  const buildingStats = useMemo(() => {
    const bMap = {};
    filteredSpotChecks.forEach(c => {
      const name = c.buildingName || c.location || 'Unspecified Building';
      if (!bMap[name]) bMap[name] = { name, count: 0, compliant: 0, nonCompliant: 0 };
      bMap[name].count += 1;
      if (c.chk3_2 === 'Yes') bMap[name].compliant += 1;
      else if (c.chk3_2 === 'No') bMap[name].nonCompliant += 1;
    });
    return Object.values(bMap).sort((a, b) => b.count - a.count);
  }, [filteredSpotChecks]);

  // ── Recent Inspections Table List ──
  const filteredDeepDive = useMemo(() => {
    return filteredSpotChecks.filter(r => {
      if (filter.q && !(r.spotCheckRef + ' ' + (r.activityName || '') + ' ' + (r.location || '') + ' ' + (r.buildingName || '') + ' ' + (r.companyInvolved || '')).toLowerCase().includes(filter.q.toLowerCase())) return false;
      if (filter.compliance && r.chk3_2 !== filter.compliance) return false;
      return true;
    });
  }, [filteredSpotChecks, filter]);

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await generateSpotCheckStatsPdf({
        stats,
        contractorStats,
        buildingStats,
        currentUser,
      });
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const hasActiveFilters = selectedBuildings.length > 0 || selectedContractors.length > 0 || (selectedRange && selectedRange !== '13m') || (selectedRange === 'custom' && (startDate || endDate));


  return (
    <div className="sc-dashboard-container">
      {/* ── Hero ── */}
      <div className="dash-hero">
        <div className="dash-hero-l">
          <div className="dash-hero-icon"><Icons.eye /></div>
          <div>
            <h1>Spot Checks Analytics</h1>
            <p>Monitor daily spot check compliance and immediate actions</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && (
            <button
              type="button"
              className="mod-btn-outline"
              style={{ height: '28px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || isLoading}
            >
              <Icons.download />
              {isGeneratingPdf ? "Generating..." : "Download PDF"}
            </button>
          )}
          <button className="mod-btn-outline" style={{ height: '28px', padding: '0 12px' }} onClick={() => navigate("/spot-checks/list")}>View All</button>
          {!isReadOnly && (
            <button className="mod-btn-primary" onClick={() => navigate("/spot-checks/create")}>+ New Spot Check</button>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="dash-filters">
        <div className="dash-filter-item">
          <span className="dfl">Buildings</span>
          <MultiSelectFilter
            options={buildingOptions}
            selected={selectedBuildings}
            onChange={setSelectedBuildings}
            placeholder="All Buildings"
            searchPlaceholder="Search buildings..."
          />
        </div>

        {!isContractor && (
          <div className="dash-filter-item">
            <span className="dfl">Contractors</span>
            <MultiSelectFilter
              options={contractorOptions}
              selected={selectedContractors}
              onChange={setSelectedContractors}
              placeholder="All Contractors"
              searchPlaceholder="Search contractors..."
              showLogos={true}
              contractorsList={contractorsList}
            />
          </div>
        )}

        <div className="dash-filter-item">
          <span className="dfl">Range</span>
          <select value={selectedRange} onChange={e => handleRangeChange(e.target.value)}>
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="year">This Year</option>
            <option value="13m">Last 13 Months</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <div className="dash-filter-date-group">
          <span className="dfl">From</span>
          <input
            type="date"
            className="dash-filter-date"
            value={startDate}
            onChange={e => handleStartDateChange(e.target.value)}
            title="From Date"
          />
          <span className="dfl">To</span>
          <input
            type="date"
            className="dash-filter-date"
            value={endDate}
            onChange={e => handleEndDateChange(e.target.value)}
            title="To Date"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="sc-dash-filter-clear-btn"
            onClick={handleClearFilters}
            title="Clear all filters"
          >
            &times; Clear
          </button>
        )}
      </div>

      {/* ── KPIs ── */}
      <div className="dash-kpis">
        <StatCard label="Total Checks" value={stats.totalChecks || 0} accent="#583C66" valColor="#583C66" icon="layers" sub="all recorded spot checks" />
        <StatCard label="Compliant (Pass)" value={stats.compliantCount || 0} accent="#14B8A6" valColor="#14B8A6" icon="eye" sub="passed audits" />
        <StatCard label="Non-Compliant" value={stats.nonCompliantCount || 0} accent="#E32B50" valColor="#E32B50" icon="target" sub="requiring corrective action" />
        <StatCard label="Contractors" value={contractorStats.length} accent="#0284C7" valColor="#0284C7" icon="users" sub="audited contractors" />
        <StatCard label="Active Permitted" value={stats.activePermitted ?? stats.totalChecks ?? 0} accent="#F97316" valColor="#F97316" icon="calendar" sub="verified PTWs" />
        <StatCard label="Recent Period" value={stats.recentPeriodCount ?? 0} accent="#64748B" valColor="#64748B" icon="clock" sub="latest inspections" />
      </div>

      {/* ── Contractors & Buildings Statistics (Enterprise Layout) ── */}
      <div className="dash-row c2">
        {/* Contractors Statistics */}
        <div className="sc-stat-panel">
          <div className="panel-head-flex">
            <div className="panel-head-left">
              <div className="panel-head-icon" style={{ background: "rgba(2, 132, 199, 0.1)", color: "#0284C7" }}>
                <Icons.users />
              </div>
              <div className="panel-head-title-wrap">
                <h3 className="panel-head-title">Contractor Statistics</h3>
                <p className="panel-head-sub">Inspection volume & compliance by contractor</p>
              </div>
            </div>
            <span className="chip-badge">{contractorStats.length} Contractors</span>
          </div>

          <div className="sc-panel-table-wrap">
            {isLoading ? (
              <div className="sc-stat-empty">
                <i className="ti ti-loader ti-spin" style={{ marginRight: 8, color: "#0284c7" }}></i> Loading contractor statistics...
              </div>
            ) : contractorStats.length === 0 ? (
              <div className="sc-stat-empty">No contractor data recorded yet.</div>
            ) : (
              <table className="sc-ent-table">
                <thead>
                  <tr>
                    <th>Contractor</th>
                    <th style={{ textAlign: "center" }}>Audits</th>
                    <th style={{ textAlign: "center" }}>Results</th>
                    <th style={{ textAlign: "right", minWidth: "120px" }}>Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {contractorStats.map((item, idx) => {
                    const passRate = item.count > 0 ? Math.round((item.compliant / item.count) * 100) : 0;
                    const rateColor = getRateColor(passRate);
                    return (
                      <tr key={idx}>
                        <td>
                          <div className="sc-ent-entity">
                            <ContractorAvatar name={item.name} contractorsList={contractorsList} />
                            <span className="sc-ent-name" title={item.name}>{item.name}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="sc-ent-count">{item.count}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div className="sc-ent-badges">
                            <span className="sc-ent-badge pass" title={`${item.compliant} Compliant`}>
                              <Icons.check /> {item.compliant}
                            </span>
                            <span className="sc-ent-badge fail" title={`${item.nonCompliant} Non-Compliant`}>
                              <Icons.cross /> {item.nonCompliant}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="sc-ent-rate-wrap">
                            <div className="sc-ent-progress">
                              <div
                                className="sc-ent-progress-bar"
                                style={{ width: `${passRate}%`, background: rateColor }}
                              />
                            </div>
                            <span className="sc-ent-rate-pct" style={{ color: rateColor }}>
                              {passRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Buildings Statistics */}
        <div className="sc-stat-panel">
          <div className="panel-head-flex">
            <div className="panel-head-left">
              <div className="panel-head-icon" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8B5CF6" }}>
                <Icons.building />
              </div>
              <div className="panel-head-title-wrap">
                <h3 className="panel-head-title">Buildings Statistics</h3>
                <p className="panel-head-sub">Inspection coverage & results by facility</p>
              </div>
            </div>
            <span className="chip-badge">{buildingStats.length} Facilities</span>
          </div>

          <div className="sc-panel-table-wrap">
            {isLoading ? (
              <div className="sc-stat-empty">
                <i className="ti ti-loader ti-spin" style={{ marginRight: 8, color: "#0284c7" }}></i> Loading building statistics...
              </div>
            ) : buildingStats.length === 0 ? (
              <div className="sc-stat-empty">No building data recorded yet.</div>
            ) : (
              <table className="sc-ent-table">
                <thead>
                  <tr>
                    <th>Facility / Location</th>
                    <th style={{ textAlign: "center" }}>Audits</th>
                    <th style={{ textAlign: "center" }}>Results</th>
                    <th style={{ textAlign: "right", minWidth: "120px" }}>Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {buildingStats.map((item, idx) => {
                    const passRate = item.count > 0 ? Math.round((item.compliant / item.count) * 100) : 0;
                    const rateColor = getRateColor(passRate);
                    return (
                      <tr key={idx}>
                        <td>
                          <div className="sc-ent-entity">
                            <div
                              className="sc-ent-logo"
                              style={{
                                background: "rgba(139, 92, 246, 0.18)",
                                color: "#C084FC",
                                border: "1px solid rgba(139, 92, 246, 0.35)",
                              }}
                            >
                              <Icons.building />
                            </div>
                            <span className="sc-ent-name" title={item.name}>{item.name}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="sc-ent-count">{item.count}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div className="sc-ent-badges">
                            <span className="sc-ent-badge pass" title={`${item.compliant} Compliant`}>
                              <Icons.check /> {item.compliant}
                            </span>
                            <span className="sc-ent-badge fail" title={`${item.nonCompliant} Non-Compliant`}>
                              <Icons.cross /> {item.nonCompliant}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="sc-ent-rate-wrap">
                            <div className="sc-ent-progress">
                              <div
                                className="sc-ent-progress-bar"
                                style={{ width: `${passRate}%`, background: rateColor }}
                              />
                            </div>
                            <span className="sc-ent-rate-pct" style={{ color: rateColor }}>
                              {passRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Inspections Table ── */}
      <div className="panel dash-tablecard">
        <div className="panel-head">
          <span className="panel-title">Recent Spot Checks</span>
        </div>
        <div className="dd-filters">
          <input className="df-input" style={{ flex: 1 }} placeholder="Search Reference, Activity, Location..." value={filter.q} onChange={e => setFilter({ ...filter, q: e.target.value })} />
          <select className="df-input" value={filter.compliance} onChange={e => setFilter({ ...filter, compliance: e.target.value })}>
            <option value="">All Statuses</option>
            <option value="Yes">Compliant</option>
            <option value="No">Non-Compliant</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Activity / Task</th>
                <th>Building / Location</th>
                <th>Company Involved</th>
                <th>Inspector</th>
                <th>Result</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    <i className="ti ti-loader ti-spin" style={{ marginRight: 8, color: '#0284c7' }}></i> Loading spot checks...
                  </td>
                </tr>
              ) : filteredDeepDive.map(r => {
                const isCompliant = r.chk3_2 === 'Yes';
                return (
                  <tr key={r.id} onClick={() => navigate(`/spot-checks/${r.id}`)} style={{ cursor: 'pointer' }}>
                    <td><b>{r.spotCheckRef || `SC-${r.id}`}</b></td>
                    <td>{r.activityName || "HSE Inspection"}</td>
                    <td>{r.buildingName ? `${r.buildingName} ${r.location ? `(${r.location})` : ''}` : (r.location || "-")}</td>
                    <td>{r.companyInvolved || "-"}</td>
                    <td>{r.inspectorName || r.createdByUserName || "-"}</td>
                    <td>
                      <span className={`badge ${isCompliant ? 'badge-green' : 'badge-red'}`}>
                        {isCompliant ? 'COMPLIANT' : (r.chk3_2 === 'No' ? 'NON-COMPLIANT' : 'PENDING')}
                      </span>
                    </td>
                    <td>{r.date || "-"}</td>
                  </tr>
                );
              })}
              {!isLoading && filteredDeepDive.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No spot checks recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
