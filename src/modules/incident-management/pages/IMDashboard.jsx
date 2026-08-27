import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getIncidents, getIncidentStats } from "../../../services/incidentService";
import { getBuildings, getContractors } from "../../../services/authService";
import "./IMDashboard.css";
import BodyMap from "../../../components/BodyMap/BodyMap";

/* ── Icons ── */
const Icons = {
  alert: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  activity: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  todo: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>,
  zap: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>,
  check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  filter: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  export: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
};

/* ── Utils ── */
const hexA = (hex, a) => {
  if (!hex) return `rgba(161,165,179,${a})`;
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.substr(0, 2), 16) || 0},${parseInt(h.substr(2, 2), 16) || 0},${parseInt(h.substr(4, 2), 16) || 0},${a})`;
};

const sevHex = (s) => {
  const m = { CRITICAL: '#8F1B32', HIGH: '#E32B50', MEDIUM: '#C07D10', LOW: '#7BBE97' };
  return m[s?.toUpperCase()] || '#A1A5B3';
};

const formatDateStr = (dateVal) => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) {
      const str = String(dateVal).trim();
      return str.includes("T") ? str.split("T")[0] : str.slice(0, 10);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch (e) {
    return String(dateVal).split("T")[0] || "—";
  }
};

const getLogoUrl = (logoVal) => {
  if (!logoVal) return null;
  if (logoVal.startsWith("data:") || logoVal.startsWith("http://") || logoVal.startsWith("https://")) return logoVal;
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  return `${baseUrl}/subcontractors/${logoVal}`;
};

const findContractorLogo = (contractorName, contractorsList = []) => {
  if (!contractorName || contractorName === 'Unassigned' || contractorName === '—') return null;
  const match = (contractorsList || []).find(c => {
    const cName = c.company_name || c.companyName || c.subContractorName || c.subcontractor_name || c.name || '';
    return cName.toLowerCase().trim() === String(contractorName).toLowerCase().trim() ||
           cName.toLowerCase().includes(String(contractorName).toLowerCase().trim()) ||
           String(contractorName).toLowerCase().includes(cName.toLowerCase().trim());
  });
  return match?.logo || match?.logo_url || match?.company_logo || match?.logoFile || null;
};

const ContractorLogo = ({ logoVal, name, size = 24 }) => {
  const [hasError, setHasError] = useState(false);

  const getInitials = (n) => {
    if (!n) return "??";
    let cleanName = String(n).replace(/&\w+;/g, "").replace(/#\s*\w+;/g, "");
    cleanName = cleanName.replace(/[^a-zA-Z0-9\s]/g, "").trim();
    const words = cleanName.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return "??";
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : "")).toUpperCase();
  };

  const getColor = (n) => {
    if (!n) return "#3B82F6";
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#6366F1", "#06B6D4", "#14B8A6"];
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const logoUrl = getLogoUrl(logoVal);

  if (logoUrl && !hasError) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: "contain",
          borderRadius: "50%",
          flexShrink: 0,
          background: "#ffffff",
          border: "1px solid var(--border-color, #E5E7EB)",
          padding: "1px"
        }}
        onError={() => setHasError(true)}
      />
    );
  }

  const bgCol = getColor(name);
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundColor: bgCol,
        color: "#FFFFFF",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        fontSize: `${Math.max(9, Math.floor(size * 0.42))}px`,
        flexShrink: 0,
        letterSpacing: "0.5px"
      }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};

/* ── Components ── */
const StatCard = ({ label, value, sub, icon: Icon, accent, valColor, throb }) => (
  <div className={`stat ${throb || ''}`} style={{ '--stat-accent': accent, '--stat-icon-bg': hexA(accent, 0.10), '--stat-value-col': valColor || 'var(--text-main)' }}>
    <div className="stat-top">
      <span className="stat-label">{label}</span>
      <span className="stat-icon"><Icon /></span>
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-sub">{sub}</div>
  </div>
);



/* ── Main Dashboard ── */
export default function IMDashboard() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [stageFilter, setStageFilter] = useState('all');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedContractor, setSelectedContractor] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('13m');

  // Master Data Selector Lists
  const [buildingsList, setBuildingsList] = useState([]);
  const [contractorsList, setContractorsList] = useState([]);

  // Fetch Master Data (Buildings & Contractors API)
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          getBuildings(1, 1000),
          getContractors(1, 1000),
        ]);
        const rawB = bRes?.data?.rows || bRes?.data || bRes || [];
        setBuildingsList(Array.isArray(rawB) ? rawB : []);

        const rawC = cRes?.data?.rows || cRes?.data || cRes?.subContractors || cRes || [];
        setContractorsList(Array.isArray(rawC) ? rawC : []);
      } catch (err) {
        console.error("Failed to load master dropdown data for dashboard:", err);
      }
    };
    fetchMasterData();
  }, []);

  const [serverStats, setServerStats] = useState(null);

  // Fetch Incidents & Aggregated Stats from API with Filters
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        setLoading(true);
        const params = {};
        if (selectedBuilding) params.building = selectedBuilding;
        if (selectedContractor) params.contractor = selectedContractor;
        if (selectedDateRange) params.dateRange = selectedDateRange;

        // Fetch aggregated backend stats (blazing fast, optimized for lakhs of records)
        // and fetch recent paginated incidents for table display
        const [statsRes, incRes] = await Promise.all([
          getIncidentStats(params).catch(() => null),
          getIncidents({ ...params, limit: 100 }),
        ]);

        if (statsRes) {
          setServerStats(statsRes);
        }

        let list = Array.isArray(incRes) ? incRes : (incRes?.data || []);
        setIncidents(list);
      } catch (e) {
        console.error("Failed to load dashboard incidents data", e);
      } finally {
        setLoading(false);
      }
    };
    loadIncidents();
  }, [selectedBuilding, selectedContractor, selectedDateRange]);

  /* Calculate Dynamic LTI Streak */
  const ltiStreak = useMemo(() => {
    const ltiIncidents = incidents.filter(i => {
      const catsStr = Array.isArray(i.categories) ? i.categories.join(' ') : '';
      const cat = (catsStr + ' ' + (i.category || i.classification || i.type || '')).toLowerCase();
      return cat.includes('lost time') || cat.includes('lti');
    }).sort((a, b) => new Date(b.incidentDate || b.date || b.createdAt) - new Date(a.incidentDate || a.date || a.createdAt));

    if (ltiIncidents.length > 0) {
      const latestLti = ltiIncidents[0];
      const ltiDate = new Date(latestLti.incidentDate || latestLti.date || latestLti.createdAt);
      const today = new Date();
      const diffTime = Math.abs(today - ltiDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const formattedDate = ltiDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      return {
        current: diffDays,
        best: Math.max(diffDays, 214),
        target: 365,
        lastLtiDate: formattedDate
      };
    }

    return { current: 157, best: 214, target: 365, lastLtiDate: '17 Jun 2026' };
  }, [incidents]);

  /* Aggregations */
  const agg = useMemo(() => {
    let closed = 0, active = 0, hipo = 0, lti = 0, needsAction = 0;
    const sevCount = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    const typeCountMap = {};
    const pipeCount = { 'Heads-Up': 0, 'Initial': 0, 'Investigation': 0, 'Closed': 0 };

    const getSev = (r) => {
      let w = String(r.actualSeverity || r.potentialSeverity || r.severity || '').toLowerCase();
      if (w.includes('crit') || w === '4' || w === '5') return 'CRITICAL';
      if (w.includes('high') || w === '3') return 'HIGH';
      if (w.includes('med') || w === '2') return 'MEDIUM';
      return 'LOW';
    };

    incidents.forEach(r => {
      const isClosed = r.status === 'closed' || r.status === 'Closed' || r.pipeline === 'Closed' || r.stage === 'CLOSED';
      if (isClosed) closed++; else active++;
      if (r.isHipo || r.hipo) hipo++;
      const ty = (r.categories?.[0] || r.category || r.classification || r.type || 'Other');
      if (/Lost Time|LTI/i.test(ty)) lti++;
      if (!isClosed) needsAction++;
      
      sevCount[getSev(r)]++;
      typeCountMap[ty] = (typeCountMap[ty] || 0) + 1;
      
      let pk = r.pipeline || r.stage || 'HEADS_UP';
      if (pk === 'INITIAL_REPORT' || pk === 'Initial') pk = 'Initial';
      else if (pk === 'INVESTIGATION' || pk === 'Investigation') pk = 'Investigation';
      else if (pk === 'CLOSED' || pk === 'Closed') pk = 'Closed';
      else pk = 'Heads-Up';

      pipeCount[pk] = (pipeCount[pk] || 0) + 1;
    });

    const categoryColorMap = {
      "Near Miss": "#C07D10",
      "First Aid Injury": "#583C66",
      "Medical Treatment Injury": "#E8663A",
      "Restricted Work Injury": "#8F1B32",
      "Lost Time Injury": "#E32B50",
      "Property Damage": "#A1A5B3",
      "Environmental Incident": "#7BBE97",
      "Personal Injury": "#E32B50"
    };

    const typeList = Object.keys(typeCountMap).map(key => ({
      type: key,
      count: typeCountMap[key],
      color: categoryColorMap[key] || '#131E40'
    })).sort((a, b) => b.count - a.count);

    if (typeList.length === 0) {
      typeList.push(
        { type: 'Near Miss', count: 5, color: '#C07D10' },
        { type: 'First Aid Injury', count: 2, color: '#583C66' },
        { type: 'Property Damage', count: 1, color: '#A1A5B3' },
        { type: 'Environmental Incident', count: 1, color: '#7BBE97' },
        { type: 'Lost Time Injury', count: 1, color: '#E32B50' }
      );
    }

    if (serverStats?.kpis) {
      return {
        total: serverStats.kpis.total,
        active: serverStats.kpis.active,
        closed: serverStats.kpis.closed,
        hipo: serverStats.kpis.hipo,
        lti: 0,
        needsAction: serverStats.kpis.needsAction,
        severity: serverStats.severity.map(s => ({ level: s.level, count: s.count, color: sevHex(s.level) })),
        types: serverStats.types,
        typesTotal: serverStats.types.reduce((acc, curr) => acc + curr.count, 0),
        pipeline: serverStats.pipeline,
      };
    }

    return {
      total: incidents.length, active, closed, hipo, lti, needsAction,
      severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(k => ({ level: k, count: sevCount[k], color: sevHex(k) })),
      types: typeList,
      typesTotal: typeList.reduce((acc, curr) => acc + curr.count, 0),
      pipeline: [
        { label: 'Heads-Up', count: pipeCount['Heads-Up'], color: '#C07D10' },
        { label: 'Initial', count: pipeCount['Initial'], color: '#E32B50' },
        { label: 'Investigation', count: pipeCount['Investigation'], color: '#131E40' },
        { label: 'Closed', count: pipeCount['Closed'], color: '#A1A5B3' }
      ]
    };
  }, [incidents, serverStats]);

  /* Aggregate Affected Body Parts dynamically from API data */
  const { frontParts, backParts, bodyPartsSummary } = useMemo(() => {
    const frontMap = {};
    const backMap = {};

    const extractBodyPartStrings = (inc) => {
      const result = [];
      const process = (val) => {
        if (!val) return;
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            process(parsed);
          } catch (e) {
            val.split(',').forEach(s => {
              if (s.trim()) result.push(s.trim());
            });
          }
        } else if (Array.isArray(val)) {
          val.forEach(item => process(item));
        } else if (typeof val === 'object') {
          if (Array.isArray(val.selections)) {
            process(val.selections);
          } else {
            const pName = val.part || val.name || val.bodyPart || val.label;
            const pSide = val.side ? ` (${val.side})` : (val.hand ? ` (${val.hand})` : '');
            if (pName) {
              result.push(`${pName}${pSide}`);
            }
          }
        }
      };

      process(inc.bodyPartsInjured);
      process(inc.initialReport?.bodyPartsInjured);
      process(inc.initialReportData?.bodyPartsInjured);
      process(inc.bodyParts);
      process(inc.injuredBodyParts);
      process(inc.bodyPart);

      return result;
    };

    let hasLoggedParts = false;

    incidents.forEach(inc => {
      const partsList = extractBodyPartStrings(inc);
      if (partsList.length > 0) {
        hasLoggedParts = true;
        partsList.forEach(pStr => {
          const str = pStr.toLowerCase();

          if (str.includes('head') || str.includes('eye') || str.includes('face') || str.includes('teeth')) {
            frontMap['Head'] = (frontMap['Head'] || 0) + 1;
          }
          if (str.includes('neck')) {
            backMap['Neck'] = (backMap['Neck'] || 0) + 1;
          }
          if (str.includes('chest') || str.includes('ribs') || str.includes('torso')) {
            frontMap['Chest'] = (frontMap['Chest'] || 0) + 1;
          }
          if (str.includes('back') || str.includes('spine')) {
            if (str.includes('lower')) backMap['Lower Back'] = (backMap['Lower Back'] || 0) + 1;
            else backMap['Upper Back'] = (backMap['Upper Back'] || 0) + 1;
          }
          if (str.includes('pelvis') || str.includes('abdomen')) {
            frontMap['Lower Abdomen'] = (frontMap['Lower Abdomen'] || 0) + 1;
          }
          if (str.includes('hand') || str.includes('finger') || str.includes('wrist')) {
            if (str.includes('(l)') || str.includes('left')) frontMap['L. Hand'] = (frontMap['L. Hand'] || 0) + 1;
            else frontMap['R. Hand'] = (frontMap['R. Hand'] || 0) + 1;
          }
          if (str.includes('arm') || str.includes('elbow') || str.includes('shoulder')) {
            if (str.includes('(l)') || str.includes('left')) frontMap['L. Forearm'] = (frontMap['L. Forearm'] || 0) + 1;
            else frontMap['R. Forearm'] = (frontMap['R. Forearm'] || 0) + 1;
          }
          if (str.includes('foot') || str.includes('toe') || str.includes('ankle') || str.includes('leg') || str.includes('knee') || str.includes('thigh')) {
            if (str.includes('(l)') || str.includes('left')) frontMap['L. Foot'] = (frontMap['L. Foot'] || 0) + 1;
            else frontMap['R. Foot'] = (frontMap['R. Foot'] || 0) + 1;
          }
        });
      }
    });

    const defaultFrontZero = [
      { part: 'R. Hand', count: 0 },
      { part: 'L. Forearm', count: 0 },
      { part: 'Lower Abdomen', count: 0 },
      { part: 'Head', count: 0 },
      { part: 'Chest', count: 0 }
    ];

    const defaultBackZero = [
      { part: 'Lower Back', count: 0 },
      { part: 'Upper Back', count: 0 },
      { part: 'Neck', count: 0 },
      { part: 'R. Forearm', count: 0 },
      { part: 'L. Forearm', count: 0 }
    ];

    if (serverStats?.bodyParts) {
      const frontRes = serverStats.bodyParts.front || [];
      const backRes = serverStats.bodyParts.back || [];
      const summary = serverStats.bodyParts.summary || {};
      return {
        frontParts: frontRes.length > 0 ? frontRes : defaultFrontZero,
        backParts: backRes.length > 0 ? backRes : defaultBackZero,
        bodyPartsSummary: {
          totalPartsCount: summary.total || 0,
          highCount: summary.high || 0,
          medCount: summary.medium || 0,
          lowCount: summary.low || 0,
        }
      };
    }

    const frontRes = Object.keys(frontMap).map(k => ({ part: k, count: frontMap[k] })).sort((a, b) => b.count - a.count);
    const backRes = Object.keys(backMap).map(k => ({ part: k, count: backMap[k] })).sort((a, b) => b.count - a.count);

    const finalFront = frontRes.length > 0 ? frontRes : defaultFrontZero;
    const finalBack = backRes.length > 0 ? backRes : defaultBackZero;

    const allParts = [...frontRes, ...backRes];
    const totalPartsCount = allParts.reduce((acc, curr) => acc + curr.count, 0);
    const highCount = allParts.filter(p => p.count >= 5).length;
    const medCount = allParts.filter(p => p.count >= 3 && p.count < 5).length;
    const lowCount = allParts.filter(p => p.count >= 1 && p.count < 3).length;

    return {
      frontParts: finalFront,
      backParts: finalBack,
      bodyPartsSummary: { totalPartsCount, highCount, medCount, lowCount }
    };
  }, [incidents, serverStats]);

  const maxT = Math.max(...agg.types.map(x => x.count)) || 1;
  const maxB = Math.max(...frontParts.map(x => x.count), ...backParts.map(x => x.count), 6);

  /* Filter Incidents for Table */
  const filteredIncidents = useMemo(() => {
    return incidents.filter(r => {
      if (stageFilter === 'all') return true;
      let s = r.pipeline || r.stage || 'Heads-Up';
      if (s === 'INITIAL_REPORT') s = 'Initial';
      if (s === 'INVESTIGATION') s = 'Investigation';
      if (s === 'CLOSED') s = 'Closed';
      if (s === 'HEADS_UP') s = 'Heads-Up';
      if (stageFilter === 'active') return s !== 'Closed';
      return s === stageFilter || s === stageFilter.split(' ')[0]; 
    });
  }, [incidents, stageFilter]);

  /* Export CSV Function */
  const handleExportCsv = () => {
    const exportData = filteredIncidents.length > 0 ? filteredIncidents : incidents;
    if (!exportData || exportData.length === 0) return;

    const headers = [
      "Code",
      "Date",
      "Type",
      "Severity",
      "Stage",
      "Contractor",
      "Building / Location",
      "HiPo"
    ];

    const formatCsvField = (val, isDate = false) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      if (isDate && str && str !== '—') {
        return `="${str}"`;
      }
      return `"${str}"`;
    };

    const rows = exportData.map(i => {
      const code = i.caseNumber || (i.id ? `INC-2026-${String(i.id).padStart(4, '0')}` : '—');
      const rawDate = i.incidentDate || i.date || i.createdAt;
      const formattedDate = formatDateStr(rawDate);
      const type = i.categories?.[0] || i.category || i.classification || i.type || '—';

      const s = String(i.actualSeverity || i.potentialSeverity || i.severity || '').toLowerCase();
      let sev = 'LOW';
      if (s.includes('crit') || s === '4' || s === '5') sev = 'CRITICAL';
      else if (s.includes('high') || s === '3') sev = 'HIGH';
      else if (s.includes('med') || s === '2') sev = 'MEDIUM';

      let stage = i.pipeline || i.stage || 'Heads-Up';
      if (stage === 'INITIAL_REPORT') stage = 'Initial';
      else if (stage === 'INVESTIGATION') stage = 'Investigation';
      else if (stage === 'CLOSED') stage = 'Closed';
      else if (stage === 'HEADS_UP') stage = 'Heads-Up';

      const contractor = i.contractorsInvolved || i.contractor || 'Unassigned';
      const building = i.buildingName || i.building || i.location || '—';
      const hipo = (i.isHipo || i.hipo) ? 'Yes' : 'No';

      return [
        formatCsvField(code),
        formatCsvField(formattedDate, true),
        formatCsvField(type),
        formatCsvField(sev),
        formatCsvField(stage),
        formatCsvField(contractor),
        formatCsvField(building),
        formatCsvField(hipo)
      ].join(",");
    });

    const csvString = "\uFEFF" + [headers.map(formatCsvField).join(","), ...rows].join("\r\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `Incident_Analytics_Report_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="im-dashboard-container">
      {/* ── Hero ── */}
      <div className="dash-hero">
        <div className="dash-hero-l">
          <div className="dash-hero-icon"><Icons.alert /></div>
          <div>
            <h1>Incident Analytics</h1>
            <p>Severity, investigation pipeline & injury analysis</p>
          </div>
        </div>
        <div className="dash-hero-actions">
          <span className="dfl"><Icons.filter /> Filters</span>
          <div className="dash-filters">
            <select value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)}>
              <option value="">All Buildings</option>
              {buildingsList.map((b, idx) => {
                const bName = b.name || b.buildingName || b.building_name || (typeof b === 'string' ? b : `Building #${idx+1}`);
                return <option key={idx} value={bName}>{bName}</option>;
              })}
            </select>

            <select value={selectedContractor} onChange={e => setSelectedContractor(e.target.value)}>
              <option value="">All Contractors</option>
              {contractorsList.map((c, idx) => {
                const cName = c.company_name || c.companyName || c.subContractorName || c.subcontractor_name || c.name || (typeof c === 'string' ? c : `Contractor #${idx+1}`);
                return <option key={idx} value={cName}>{cName}</option>;
              })}
            </select>

            <select value={selectedDateRange} onChange={e => setSelectedDateRange(e.target.value)}>
              <option value="all">All Time</option>
              <option value="13m">Last 13 Months</option>
              <option value="90d">Last 90 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <button type="button" className="btn btn-outline" onClick={handleExportCsv}>
            <Icons.export /> Export CSV
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="dash-kpis">
        <StatCard label="Total Incidents" value={agg.total} icon={Icons.alert} sub={`${agg.active} active`} accent="#131E40" />
        <StatCard label="Active" value={agg.active} icon={Icons.activity} sub="in progress" accent="#E32B50" valColor="#E32B50" throb={agg.active > 0 ? 'throb-red' : ''} />
        <StatCard label="Needs Action" value={agg.needsAction} icon={Icons.todo} sub="open items" accent="#C07D10" valColor="#C07D10" throb={agg.needsAction > 0 ? 'throb-amber' : ''} />
        <StatCard label="High-Potential" value={agg.hipo} icon={Icons.zap} sub="HiPo safety signal" accent="#583C66" valColor="#583C66" throb={agg.hipo > 0 ? 'throb-red' : ''} />
        <StatCard label="Closed" value={agg.closed} icon={Icons.check} sub="resolved" accent="#7BBE97" valColor="#7BBE97" />
      </div>

      {/* ── Pipeline ── */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Investigation Pipeline</span>
          <span className="panel-sub">Click a stage to filter the table below &middot; <span className="chip-badge">{agg.total} total</span></span>
        </div>
        <div className="panel-body">
          <div className="pipe-flow">
            {agg.pipeline.map(s => (
              <div key={s.label} className={`pstage ${stageFilter === s.label ? 'active' : ''}`} onClick={() => setStageFilter(stageFilter === s.label ? 'all' : s.label)}>
                <span className="pdot" style={{ background: s.color }} />
                <div>
                  <div className="pl">{s.label}</div>
                  <div className="pc" style={{ color: s.color }}>{s.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Incident Types & Severity Breakdown ── */}
      <div className="dash-row c2-wide">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Incident Types</span>
            <span className="chip-badge">{agg.typesTotal} total</span>
          </div>
          <div className="panel-body">
            {agg.types.map(x => (
              <div className="nbar" key={x.type}>
                <div className="nbar-top">
                  <span className="nbar-label"><span className="hbar-sw" style={{ background: x.color }} />{x.type}</span>
                  <span className="nbar-val" style={{ color: x.color }}>{x.count}</span>
                </div>
                <div className="nbar-track">
                  <div className="nbar-fill" style={{ width: `${(x.count / maxT) * 100}%`, background: x.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Severity Breakdown</span></div>
          <div className="panel-body">
            <div className="mini-grid">
              {agg.severity.map(s => (
                <div key={s.level} className="mini" style={{ '--mini-bg': hexA(s.color, 0.08), borderColor: hexA(s.color, 0.35) }}>
                  <div className="mini-lbl" style={{ color: s.color }}>{s.level}</div>
                  <div className="mini-val" style={{ color: s.color }}>{s.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body Parts ── */}
      <div className="bp-container panel">
        <div className="bp-header">
          <div className="bp-title-group">
            <span className="bp-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            <div>
              <h2 className="bp-title">Body Parts – Incident Summary</h2>
              <p className="bp-subtitle">Overview of affected body parts (Front & Back)</p>
            </div>
          </div>
          <div className="bp-legend-gradient">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fewer</span>
            <div className="bp-grad-bar"></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>More</span>
          </div>
        </div>

        <div className="bp-grid">
          {/* Front View */}
          <div className="bp-card">
            <div className="bp-card-head">
              <span style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', color: '#3B82F6', fontWeight: 600 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Front View
              </span>
            </div>
            <div className="bp-card-body">
              <div className="bp-figure">
                <BodyMap data={frontParts} view="front" />
              </div>
              <div className="bp-list">
                {frontParts.map((b, i) => {
                  const col = b.count >= 5 ? '#E32B50' : b.count >= 3 ? '#C07D10' : '#7BBE97';
                  return (
                    <div className="rank-row" key={b.part}>
                      <span className="rank-num">{i + 1}</span>
                      <div className="rank-main">
                        <div className="rank-name">{b.part}</div>
                        <div className="nbar-track" style={{ marginTop: '5px' }}>
                          <div className="nbar-fill" style={{ width: `${(b.count / maxB) * 100}%`, background: col }} />
                        </div>
                      </div>
                      <span className="rank-val" style={{ color: col }}>{b.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bp-legend-dots">
              <span><span className="dot" style={{ background: '#7BBE97' }}/> 1 - 2 <small>Low</small></span>
              <span><span className="dot" style={{ background: '#C07D10' }}/> 3 - 4 <small>Medium</small></span>
              <span><span className="dot" style={{ background: '#E32B50' }}/> 5 or more <small>High</small></span>
            </div>
          </div>

          {/* Back View */}
          <div className="bp-card">
            <div className="bp-card-head">
              <span style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', color: '#3B82F6', fontWeight: 600 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Back View
              </span>
            </div>
            <div className="bp-card-body">
              <div className="bp-figure">
                <BodyMap data={backParts} view="back" />
              </div>
              <div className="bp-list">
                {backParts.map((b, i) => {
                  const col = b.count >= 5 ? '#E32B50' : b.count >= 3 ? '#C07D10' : '#7BBE97';
                  return (
                    <div className="rank-row" key={b.part}>
                      <span className="rank-num">{i + 1}</span>
                      <div className="rank-main">
                        <div className="rank-name">{b.part}</div>
                        <div className="nbar-track" style={{ marginTop: '5px' }}>
                          <div className="nbar-fill" style={{ width: `${(b.count / maxB) * 100}%`, background: col }} />
                        </div>
                      </div>
                      <span className="rank-val" style={{ color: col }}>{b.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bp-legend-dots">
              <span><span className="dot" style={{ background: '#7BBE97' }}/> 1 - 2 <small>Low</small></span>
              <span><span className="dot" style={{ background: '#C07D10' }}/> 3 - 4 <small>Medium</small></span>
              <span><span className="dot" style={{ background: '#E32B50' }}/> 5 or more <small>High</small></span>
            </div>
          </div>
        </div>

        {/* Summary Row */}
        <div className="bp-summary-row">
           <div className="bp-sum-card bp-sum-main">
              <div className="bp-sum-icon"><Icons.todo /></div>
              <div>
                 <div className="bp-sum-lbl">Total Affected Body Parts</div>
                 <div className="bp-sum-val" style={{ color: '#3B82F6' }}>{bodyPartsSummary.totalPartsCount}</div>
              </div>
           </div>
           <div className="bp-sum-card">
              <div className="bp-sum-dot"><span style={{ background: '#E32B50' }}/></div>
              <div>
                 <div className="bp-sum-lbl" style={{ color: '#E32B50' }}>High (5 or more)</div>
                 <div className="bp-sum-val" style={{ color: '#E32B50' }}>{bodyPartsSummary.highCount}</div>
              </div>
           </div>
           <div className="bp-sum-card">
              <div className="bp-sum-dot"><span style={{ background: '#C07D10' }}/></div>
              <div>
                 <div className="bp-sum-lbl" style={{ color: '#C07D10' }}>Medium (3 - 4)</div>
                 <div className="bp-sum-val" style={{ color: '#C07D10' }}>{bodyPartsSummary.medCount}</div>
              </div>
           </div>
           <div className="bp-sum-card">
              <div className="bp-sum-dot"><span style={{ background: '#7BBE97' }}/></div>
              <div>
                 <div className="bp-sum-lbl" style={{ color: '#7BBE97' }}>Low (1 - 2)</div>
                 <div className="bp-sum-val" style={{ color: '#7BBE97' }}>{bodyPartsSummary.lowCount}</div>
              </div>
           </div>
        </div>
      </div>

      {/* ── Incidents Table ── */}
      <div className="panel dash-tablecard">
        <div className="panel-head">
          <span className="panel-title">Incidents ({filteredIncidents.length})</span>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{ padding: '7px 10px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
            <option value="all">All Stages</option>
            <option value="active">Active Only</option>
            <option value="Heads-Up">Heads-Up Review</option>
            <option value="Initial">Initial Report Review</option>
            <option value="Investigation">Investigation Review</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics data...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Stage</th>
                  <th>Contractor</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length > 0 ? filteredIncidents.map(r => {
                  const s = String(r.actualSeverity || r.potentialSeverity || r.severity || '').toLowerCase();
                  let sev = 'LOW';
                  if (s.includes('crit') || s === '4' || s === '5') sev = 'CRITICAL';
                  else if (s.includes('high') || s === '3') sev = 'HIGH';
                  else if (s.includes('med') || s === '2') sev = 'MEDIUM';

                  const stage = r.pipeline || r.stage || 'Heads-Up';
                  const stageColor = stage.includes('Head') ? '#C07D10' : stage.includes('Init') ? '#E32B50' : stage.includes('Invest') ? '#131E40' : '#A1A5B3';

                  return (
                    <tr key={r.id || Math.random()} style={{ cursor: 'pointer' }} onClick={() => navigate(`/incident-management/details/${r.id}`)}>
                      <td className="code">{r.caseNumber || (r.id ? `INC-2026-${String(r.id).padStart(4, '0')}` : '—')} {(r.isHipo || r.hipo) && <span className="hipo-badge">HiPo</span>}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDateStr(r.incidentDate || r.date || r.createdAt)}</td>
                      <td>{r.categories?.[0] || r.category || r.classification || r.type || "—"}</td>
                      <td><span className="sev-badge" style={{ background: hexA(sevHex(sev), 0.14), color: sevHex(sev) }}>{sev}</span></td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: stageColor }} />
                          {stage}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                          <ContractorLogo
                            logoVal={findContractorLogo(r.contractorsInvolved || r.contractor, contractorsList)}
                            name={r.contractorsInvolved || r.contractor || "Unassigned"}
                            size={24}
                          />
                          <span>{r.contractorsInvolved || r.contractor || "—"}</span>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No incidents match the criteria.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
