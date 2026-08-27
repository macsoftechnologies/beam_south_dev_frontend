import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OBSERVATIONS, SAFETY_CATEGORIES, SO_RISK_LEVELS, SO_STATUSES } from "../data/observations";
import observationService from "../../../services/observationService";
import { getBuildings, getContractors } from "../../../services/authService";
import "./SODashboard.css";

// ── Icons ──
const Icons = {
  eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/></svg>,
  calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>,
  activity: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  layers: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>,
  target: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  up: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>,
  down: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/></svg>
};

// ── Helpers ──
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

const parseDate = (str) => {
  if (!str) return new Date();
  const parts = String(str).split(', ');
  if (parts.length < 2) return new Date(str);
  const [day, month, year] = parts[0].split(' ');
  const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  return new Date(year, months[month] || 0, day);
};

const diffDays = (d1, d2) => Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
const pctChange = (cur, prev) => (prev === 0 && cur === 0) ? null : (prev > 0 ? Math.round((cur - prev) / prev * 100) : (cur > 0 ? 100 : 0));

const TrendPill = ({ pct, goodIsDown = false }) => {
  if (pct === null || pct === undefined) return <span className="trend flat"><Icons.activity /> --</span>;
  if (pct === 0) return <span className="trend flat"><Icons.activity /> 0%</span>;
  const isDown = pct < 0;
  const good = goodIsDown ? isDown : !isDown;
  const cls = (isDown ? 'down-' : 'up-') + (good ? 'good' : 'bad');
  return (
    <span className={`trend ${cls}`}>
      <span style={{width: 14, height: 14}}>{isDown ? <Icons.down /> : <Icons.up />}</span>
      {pct > 0 ? '+' : ''}{pct}%
    </span>
  );
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

// ── Data Processing ──
const processSOData = (data) => {
  const now = new Date('2026-06-28');
  
  let thisWeek = 0, lastWeek = 0, thisMonth = 0, lastMonth = 0;
  const contractorMap = {};
  const catMap = {};
  const riskMap = { "Very high": 0, "High": 0, "Moderate": 0, "Medium": 0, "Low": 0, "Very low": 0, "-": 0 };
  let safe = 0, unsafe = 0;
  const weeklyCounts = [0, 0, 0, 0, 0, 0, 0, 0];

  (data || []).forEach(obs => {
    const dateStr = obs.date || obs.createdTime || obs.incidentDate;
    const d = parseDate(dateStr);
    const days = diffDays(now, d);
    
    if (days >= 0 && days < 7) thisWeek++;
    if (days >= 7 && days < 14) lastWeek++;
    if (days >= 0 && days < 30) thisMonth++;
    if (days >= 30 && days < 60) lastMonth++;
    
    const wIdx = Math.floor(days / 7);
    if (wIdx >= 0 && wIdx < 8) weeklyCounts[7 - wIdx]++;

    const isPositive = obs.obsType === "Positive" || obs.observationType === "POSITIVE";
    if (isPositive) safe++;
    else unsafe++;

    const contractorName = obs.contractor || obs.assignedContractorName || 'Unassigned';
    if (!contractorMap[contractorName]) contractorMap[contractorName] = { id: contractorName, thisWeek: 0, lastWeek: 0, total: 0 };
    contractorMap[contractorName].total++;
    if (days >= 0 && days < 7) contractorMap[contractorName].thisWeek++;
    if (days >= 7 && days < 14) contractorMap[contractorName].lastWeek++;

    const catName = obs.category || obs.safetyCategory || 'General';
    catMap[catName] = (catMap[catName] || { total: 0, safe: 0, unsafe: 0 });
    catMap[catName].total++;
    if (isPositive) catMap[catName].safe++;
    else catMap[catName].unsafe++;
    
    const rLevel = obs.risk || obs.riskLevel || 'Low';
    if (riskMap[rLevel] !== undefined) riskMap[rLevel]++;
  });

  const weeklyTrend = weeklyCounts.map((c, i) => ({ label: i === 7 ? 'This wk' : `Wk ${8-i}`, count: c }));
  const weeklyAvg = weeklyCounts.reduce((a, b) => a + b, 0) / 8;
  
  const contractorKPIs = Object.values(contractorMap).map(c => {
    c.target = 5;
    c.weeklyAvg = c.total / 8;
    return c;
  }).sort((a, b) => b.thisWeek - a.thisWeek);

  const categories = Object.keys(catMap).map(k => ({ name: k, count: catMap[k].total, safe: catMap[k].safe, unsafe: catMap[k].unsafe })).sort((a, b) => b.count - a.count);
  const severity = ["Very high", "High", "Moderate", "Medium", "Low"].map(k => ({ level: k, count: riskMap[k] || 0 }));
  const total = (data || []).length;
  const meetingKPI = contractorKPIs.filter(c => c.thisWeek >= c.target).length;
  const kpiCompliance = contractorKPIs.length > 0 ? Math.round((meetingKPI / contractorKPIs.length) * 100) : 0;

  const bodyParts = [
    { part: 'R. Hand', count: 4 }, { part: 'L. Forearm', count: 3 },
    { part: 'Lower Back', count: 3 }, { part: 'R. Foot', count: 2 },
    { part: 'Head', count: 1 }
  ];

  return {
    total, thisWeek, lastWeek, thisMonth, lastMonth, weeklyAvg,
    kpiCompliance, meetingKPI, totalContractors: contractorKPIs.length,
    contractorKPIs, categories, weeklyTrend, safe, unsafe, severity, bodyParts
  };
};

export default function SODashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState({ q: '', contractor: '', status: '', type: '' });
  
  // Filter States
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedContractor, setSelectedContractor] = useState('');
  const [selectedRange, setSelectedRange] = useState('13m');

  // Master Dropdowns Data
  const [buildingsList, setBuildingsList] = useState([]);
  const [contractorsList, setContractorsList] = useState([]);

  // Live Data States
  const [serverStats, setServerStats] = useState(null);
  const [observationsList, setObservationsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Master Selector Data (Buildings & Contractors)
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          getBuildings(1, 1000),
          getContractors(1, 1000)
        ]);
        const rawB = bRes?.data?.rows || bRes?.data || bRes || [];
        setBuildingsList(Array.isArray(rawB) ? rawB : []);

        const rawC = cRes?.data?.rows || cRes?.data || cRes?.subContractors || cRes || [];
        setContractorsList(Array.isArray(rawC) ? rawC : []);
      } catch (err) {
        console.error("Failed to load master dropdowns for SO Dashboard:", err);
      }
    };
    fetchMasterData();
  }, []);

  // Fetch Stats API + List API in Parallel
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const params = {};
        if (selectedBuilding) params.building = selectedBuilding;
        if (selectedContractor) params.contractor = selectedContractor;
        if (selectedRange) params.range = selectedRange;

        const [statsRes, listRes] = await Promise.all([
          observationService.getObservationStats(params).catch(() => null),
          observationService.getObservations({ ...params, limit: 100 }).catch(() => null)
        ]);

        if (statsRes) {
          setServerStats(statsRes);
        }

        const rawList = Array.isArray(listRes) ? listRes : (listRes?.data || []);
        setObservationsList(rawList.length > 0 ? rawList : OBSERVATIONS);
      } catch (err) {
        console.error("Failed to load SO Dashboard data:", err);
        setObservationsList(OBSERVATIONS);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedBuilding, selectedContractor, selectedRange]);

  const agg = useMemo(() => {
    if (serverStats?.total !== undefined) {
      return serverStats;
    }
    return processSOData(observationsList);
  }, [observationsList, serverStats]);

  const filteredDeepDive = useMemo(() => {
    const source = observationsList.length > 0 ? observationsList : OBSERVATIONS;
    return source.filter(r => {
      const numStr = r.observationNumber || r.id || '';
      const subjStr = r.subject || r.title || r.description || '';
      if (filter.q && !(subjStr + ' ' + numStr).toLowerCase().includes(filter.q.toLowerCase())) return false;
      const cName = r.contractor || r.assignedContractorName || '';
      if (filter.contractor && cName !== filter.contractor) return false;
      if (filter.status && String(r.status || 'OPEN').toUpperCase() !== String(filter.status).toUpperCase()) return false;
      const oType = r.obsType || r.observationType || '';
      if (filter.type && oType !== filter.type && (filter.type === 'Positive' ? oType !== 'POSITIVE' : oType !== 'NEEDS_ATTENTION')) return false;
      return true;
    }).sort((a, b) => parseDate(b.date || b.createdTime) - parseDate(a.date || a.createdTime));
  }, [observationsList, filter]);

  const maxW = Math.max(...(agg.weeklyTrend || []).map(w => w.count)) || 1;
  const maxC = Math.max(...(agg.categories || []).map(c => c.count)) || 1;
  const maxS = Math.max(...(agg.severity || []).map(s => s.count)) || 1;

  const totalSU = (agg.safe || 0) + (agg.unsafe || 0);
  const safePct = totalSU > 0 ? Math.round(((agg.safe || 0) / totalSU) * 100) : 0;
  const suRadius = 42;
  const suCircum = 2 * Math.PI * suRadius;
  const safeLen = (suCircum * safePct) / 100;

  // Export CSV Function for Deep Dive Table
  const handleExportCsv = () => {
    const dataToExport = filteredDeepDive.length > 0 ? filteredDeepDive : (observations || []);
    if (!dataToExport || dataToExport.length === 0) return;

    const headers = [
      "Number",
      "Site / Building",
      "Contractor",
      "Subject",
      "Category",
      "Type",
      "Status",
      "Created Date"
    ];

    const formatCsvField = (val, isDate = false) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      if (isDate && str && str !== '—') {
        return `="${str}"`;
      }
      return `"${str}"`;
    };

    const rows = dataToExport.map(r => {
      const numStr = r.observationNumber || r.id || '—';
      const bName = r.buildingName || r.building || '—';
      const cName = r.assignedContractorName || r.contractor || '—';
      const subj = r.subject || r.title || r.description || '—';
      const cat = r.safetyCategory || r.category || '—';
      const isPos = r.observationType === 'POSITIVE' || r.obsType === 'Positive';
      const typeStr = isPos ? 'Positive' : 'Needs Attention';
      const statusStr = String(r.status || 'OPEN').toUpperCase();
      const formattedDate = formatDateStr(r.createdTime || r.createdAt || r.date);

      return [
        formatCsvField(numStr),
        formatCsvField(bName),
        formatCsvField(cName),
        formatCsvField(subj),
        formatCsvField(cat),
        formatCsvField(typeStr),
        formatCsvField(statusStr),
        formatCsvField(formattedDate, true)
      ].join(",");
    });

    const csvString = "\uFEFF" + [headers.map(formatCsvField).join(","), ...rows].join("\r\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `Safety_Observations_Report_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="so-dashboard-container">
      {/* ── Hero ── */}
      <div className="dash-hero">
        <div className="dash-hero-l">
          <div className="dash-hero-icon"><Icons.eye /></div>
          <div>
            <h1>Observation Analytics</h1>
            <p>Weekly observation KPI tracking &middot; target of 5 per week per main contractor</p>
          </div>
        </div>
        <div>
          <button className="mod-btn-primary" onClick={() => navigate("/safety-observations/create")}>+ New Observation</button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="dash-filters">
        <span className="dfl">Buildings</span>
        <select value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)}>
          <option value="">All Buildings</option>
          {buildingsList.map((b, idx) => {
            const bName = b.name || b.buildingName || b.building_name || (typeof b === 'string' ? b : `Building #${idx+1}`);
            return <option key={idx} value={bName}>{bName}</option>;
          })}
        </select>

        <span className="dfl">Contractors</span>
        <select value={selectedContractor} onChange={e => setSelectedContractor(e.target.value)}>
          <option value="">All Contractors</option>
          {contractorsList.map((c, idx) => {
            const cName = c.company_name || c.companyName || c.subContractorName || c.subcontractor_name || c.name || (typeof c === 'string' ? c : `Contractor #${idx+1}`);
            return <option key={idx} value={cName}>{cName}</option>;
          })}
        </select>

        <span className="dfl">Range</span>
        <select value={selectedRange} onChange={e => setSelectedRange(e.target.value)}>
          <option value="13m">Last 13 Months</option>
          <option value="90d">Last 90 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* ── KPIs ── */}
      <div className="dash-kpis">
        <StatCard label="This Week" value={agg.thisWeek || 0} accent="#131E40" icon="eye" sub="observations logged" foot={<><TrendPill pct={pctChange(agg.thisWeek || 0, agg.lastWeek || 0)} /> <span style={{marginLeft: 4, color:'var(--text-muted)'}}>vs last week</span></>} />
        <StatCard label="This Month" value={agg.thisMonth || 0} accent="#131E40" icon="calendar" sub="month to date" foot={<><TrendPill pct={pctChange(agg.thisMonth || 0, agg.lastMonth || 0)} /> <span style={{marginLeft: 4, color:'var(--text-muted)'}}>vs last month</span></>} />
        <StatCard label="Weekly Average" value={Number(agg.weeklyAvg || 0).toFixed(1)} accent="#7BBE97" valColor="#7BBE97" icon="activity" sub="over last 8 weeks" />
        <StatCard label="Total Observations" value={agg.total || 0} accent="#583C66" valColor="#583C66" icon="layers" sub="all time" />
        <StatCard label="KPI Compliance" value={`${agg.kpiCompliance || 0}%`} accent={(agg.kpiCompliance || 0) >= 80 ? '#7BBE97' : (agg.kpiCompliance || 0) >= 50 ? '#C07D10' : '#E32B50'} valColor={(agg.kpiCompliance || 0) >= 80 ? '#7BBE97' : (agg.kpiCompliance || 0) >= 50 ? '#C07D10' : '#E32B50'} icon="target" sub={`${agg.meetingKPI || 0}/${agg.totalContractors || 0} on target`} />
        <StatCard label="Last Week" value={agg.lastWeek || 0} accent="#8A8F9F" icon="clock" sub="complete week total" />
      </div>

      {/* ── Mid Row 1 ── */}
      <div className="dash-row c2-wide">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Contractor Weekly KPI</span>
            <span className="chip-badge">Target 5/wk</span>
          </div>
          <div className="panel-body">
            {(agg.contractorKPIs || []).map(c => {
              const over = c.thisWeek >= c.target;
              const pct = Math.min((c.thisWeek / c.target) * 100, 100);
              const col = over ? '#2D7A4F' : '#E32B50';
              const surplus = c.thisWeek - c.target;
              return (
                <div key={c.id} className={`ckpi ${over ? 'good' : 'bad'}`}>
                  <div className="ck-top">
                    <div className="ck-nm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ContractorLogo
                        logoVal={findContractorLogo(c.id, contractorsList)}
                        name={c.id}
                        size={24}
                      />
                      <span>{c.id}</span>
                      {!over && <span className="atrisk-badge" style={{ marginLeft: 4 }}>AT RISK</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: col }}>{c.thisWeek}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>/{c.target}</span>
                      <TrendPill pct={pctChange(c.thisWeek, c.lastWeek)} />
                    </div>
                  </div>
                  <div className="kpi-target">
                    <div className="kpi-target-fill" style={{ width: `${pct}%`, background: col }} />
                    <span className="kpi-target-mark" style={{ left: '100%' }} />
                  </div>
                  <div className="ck-foot">
                    <span>Last wk: {c.lastWeek}</span>
                    <span>Avg: {Number(c.weeklyAvg || 0).toFixed(1)}</span>
                    <span style={{ color: col, fontWeight: 600 }}>{over ? `+${surplus} above` : `${Math.abs(surplus)} below`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Observations by Category</span>
            <span className="chip-badge">{agg.total || 0} total</span>
          </div>
          <div className="panel-body">
            {(agg.categories || []).slice(0, 8).map((c, i) => {
              const pal = ['#131E40','#E32B50','#7BBE97','#C07D10','#8F1B32','#583C66','#82274E','#C49F85'];
              const col = pal[i % pal.length];
              return (
                <div key={c.name} className="nbar">
                  <div className="nbar-top">
                    <span className="nbar-label"><span className="hbar-sw" style={{ background: col }}></span>{c.name}</span>
                    <span className="nbar-val" style={{ color: col }}>{c.count}</span>
                  </div>
                  <div className="nbar-track">
                    <div className="nbar-fill" style={{ width: `${(c.count / maxC) * 100}%`, background: col }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Trend ── */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Weekly Observation Trend</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{Number(agg.weeklyAvg || 0).toFixed(1)}/wk avg</span>
        </div>
        <div className="panel-body">
          <div className="vbars">
            {(agg.weeklyTrend || []).map((w, i) => {
              const h = maxW > 0 ? Math.max((w.count / maxW) * 90, 6) : 6;
              const isCur = i === (agg.weeklyTrend || []).length - 1;
              return (
                <div key={i} className="vb">
                  <span className="vnum" style={{ color: isCur ? '#131E40' : 'var(--text-muted)' }}>{w.count}</span>
                  <div className="vbar" style={{ height: h, background: isCur ? '#131E40' : '#C4B79A' }}></div>
                  <span className="vlbl">{w.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Mid Row 3 ── */}
      <div className="dash-row c2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Positive vs Needs Attention</span>
            <span className="chip-badge">{totalSU} total</span>
          </div>
          <div className="panel-body">
            <div className="donut-wrap">
              <svg width="118" height="118" viewBox="0 0 118 118" style={{ flexShrink: 0 }}>
                <circle cx="59" cy="59" r={suRadius} fill="none" stroke="#E32B50" strokeWidth="15" />
                <circle cx="59" cy="59" r={suRadius} fill="none" stroke="#7BBE97" strokeWidth="15" strokeDasharray={`${safeLen} ${suCircum}`} transform="rotate(-90 59 59)" strokeLinecap="round" />
                <text x="59" y="56" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text-main)">{safePct}%</text>
                <text x="59" y="72" textAnchor="middle" fontSize="9" fill="var(--text-muted)" letterSpacing="1">POSITIVE</text>
              </svg>
              <div className="donut-legend">
                <div className="dl"><span className="dl-l"><span className="dl-sw" style={{ background: '#7BBE97' }}></span>Positive</span><span style={{ color: '#7BBE97' }}>{agg.safe || 0} ({safePct}%)</span></div>
                <div className="dl"><span className="dl-l"><span className="dl-sw" style={{ background: '#E32B50' }}></span>Needs Attention</span><span style={{ color: '#E32B50' }}>{agg.unsafe || 0} ({100 - safePct}%)</span></div>
                <div className="dl" style={{ marginTop: 8 }}><span className="dl-l" style={{ color: 'var(--text-muted)' }}>Total observations</span><span>{totalSU}</span></div>
              </div>
            </div>
            
            <div style={{ marginTop: 24 }}>
              {(agg.categories || []).slice(0, 6).map(cat => {
                const sp = cat.count > 0 ? (cat.safe / cat.count) * 100 : 0;
                const up = 100 - sp;
                return (
                  <div key={cat.name} className="su-catrow">
                    <span className="name">{cat.name}</span>
                    <div className="stack">
                      {cat.safe > 0 && <span className="seg" style={{ width: `${sp}%`, background: '#7BBE97' }}>{cat.safe}</span>}
                      {cat.unsafe > 0 && <span className="seg" style={{ width: `${up}%`, background: '#E32B50' }}>{cat.unsafe}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Observation Severity Distribution</span>
          </div>
          <div className="panel-body">
            <div className="vbars">
              {(agg.severity || []).map((s, i) => {
                const h = maxS > 0 ? Math.max((s.count / maxS) * 90, 6) : 6;
                const pal = ['#8F1B32','#E32B50','#C07D10','#C4B79A','#7BBE97'];
                const col = pal[i % pal.length];
                return (
                  <div key={s.level} className="vb">
                    <span className="vnum" style={{ color: col }}>{s.count}</span>
                    <div className="vbar" style={{ height: h, background: col }}></div>
                    <span className="vlbl">{s.level}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Deep Dive Table ── */}
      <div className="panel dash-tablecard">
        <div className="panel-head">
          <span className="panel-title">Deep Dive Observations ({filteredDeepDive.length})</span>
          <button className="mod-btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleExportCsv}>Export CSV</button>
        </div>
        <div className="dd-filters">
          <input className="df-input" style={{ flex: 1 }} placeholder="Search subject / number..." value={filter.q} onChange={e => setFilter({ ...filter, q: e.target.value })} />
          <select className="df-input" value={filter.contractor} onChange={e => setFilter({ ...filter, contractor: e.target.value })}>
            <option value="">All Contractors</option>
            {contractorsList.map((c, idx) => {
              const cName = c.company_name || c.companyName || c.subContractorName || c.subcontractor_name || c.name || (typeof c === 'string' ? c : `Contractor #${idx+1}`);
              return <option key={idx} value={cName}>{cName}</option>;
            })}
          </select>
          <select className="df-input" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Statuses</option>
            {SO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="df-input" value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}>
            <option value="">All Types</option>
            <option value="Positive">Positive</option>
            <option value="Needs Attention">Needs Attention</option>
          </select>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics data...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Site</th>
                  <th>Contractor</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeepDive.map(r => {
                  const numStr = r.observationNumber || r.id;
                  const bName = r.buildingName || r.building || '—';
                  const cName = r.assignedContractorName || r.contractor || '—';
                  const subj = r.subject || r.title || r.description || '—';
                  const cat = r.safetyCategory || r.category || '—';
                  const isPos = r.observationType === 'POSITIVE' || r.obsType === 'Positive';
                  const st = String(r.status || 'OPEN').toUpperCase();

                  const getStatusBadgeClass = (statusStr) => {
                    switch (statusStr) {
                      case 'CLOSED':
                        return 'badge-green';
                      case 'REJECTED':
                      case 'ESCALATED':
                        return 'badge-red';
                      case 'ASSIGNED':
                        return 'badge-purple';
                      case 'RESOLVED':
                      case 'ACCEPTED':
                      case 'IN_PROGRESS':
                        return 'badge-orange';
                      case 'OPEN':
                      default:
                        return 'badge-blue';
                    }
                  };

                  return (
                    <tr key={r.id || Math.random()} style={{ cursor: 'pointer' }} onClick={() => navigate(`/safety-observations/details/${r.id}`)}>
                      <td><b>{numStr}</b></td>
                      <td>{bName}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ContractorLogo
                            logoVal={findContractorLogo(cName, contractorsList)}
                            name={cName}
                            size={24}
                          />
                          <span>{cName}</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subj}</td>
                      <td>{cat}</td>
                      <td>{isPos ? <span className="badge badge-green">Positive</span> : <span className="badge badge-red">Needs Attention</span>}</td>
                      <td><span className={`badge ${getStatusBadgeClass(st)}`}>{st}</span></td>
                      <td>{formatDateStr(r.createdTime || r.createdAt || r.date)}</td>
                    </tr>
                  );
                })}
                {filteredDeepDive.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No observations match the filter.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
