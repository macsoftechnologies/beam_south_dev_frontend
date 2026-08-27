import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import Loader from "../../../components/common/Loader/Loader";
import { getIncidents } from "../../../services/incidentService";
import { getBuildings, getContractors } from "../../../services/authService";
import "../../../styles/module-shared.css";
import "./IMList.css";

const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const severityMeta = (level) => {
  const meta = {
    1: { level: 1, label: "Insignificant", color: "#2D9E5A" },
    2: { level: 2, label: "Minor", color: "#C07D10" },
    3: { level: 3, label: "Moderate", color: "#D97706" },
    4: { level: 4, label: "Critical", color: "#E32B50" },
    5: { level: 5, label: "Catastrophic", color: "#8F1B32" }
  };
  return meta[level] || { level: level || 1, label: "", color: "#A1A5B3" };
};

const SevPill = ({ level }) => {
  const m = severityMeta(level);
  return (
    <span className="badge" style={{ background: `${m.color}22`, color: m.color, fontWeight: 700 }}>
      {m.level} {m.label}
    </span>
  );
};

const StatusTracker = ({ pipeline, isPendingClosure }) => {
  const steps = [
    { key: "Heads-Up", title: "Heads-Up Notification" },
    { key: "Initial", title: "Initial Incident Report" },
    { key: "Investigation", title: "Investigation Report" }
  ];
  const order = { 
    "HEADS_UP": 0, "Heads-Up": 0, 
    "INITIAL_REPORT": 1, "Initial": 1, 
    "INVESTIGATION": 2, "Investigation": 2, 
    "CLOSED": 3, "Closed": 3 
  };
  const normalizedPipeline = String(pipeline).toUpperCase();
  let curIdx = 0;
  if (order.hasOwnProperty(normalizedPipeline)) curIdx = order[normalizedPipeline];
  else if (order.hasOwnProperty(pipeline)) curIdx = order[pipeline];

  const closed = normalizedPipeline === "CLOSED" || pipeline === "Closed";
  const isOpenedState = !closed && curIdx === 2; // Investigation stage but not closed
  
  const label = closed ? "Closed" : isOpenedState ? "Opened" : (steps[curIdx] ? steps[curIdx].title : pipeline);

  const checkS = (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );

  return (
    <div className="st-track" title={label}>
      {steps.map((step, i) => {
        let state = "pending";
        if (closed) state = "done";
        else if (isOpenedState) state = "opened";
        else if (i < curIdx) state = "done";
        else if (i === curIdx) state = "current";

        return (
          <React.Fragment key={step.key}>
            <span className={`st-line ${isOpenedState && i > 0 ? "on-opened" : i <= curIdx || closed ? "on" : ""}`} style={i === 0 ? { visibility: "hidden" } : {}}></span>
            <span className={`st-dot st-${state}`} title={step.title}>
              {state === "done" ? checkS : (i + 1)}
            </span>
          </React.Fragment>
        );
      })}
      <span className={`st-label ${closed ? "st-label-closed" : isOpenedState ? "st-label-opened" : "st-label-live"}`}>{label}</span>
    </div>
  );
};

function IMList() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // 9 Column Filters + 1 top chip filter
  const [filters, setFilters] = useState({
    statusChip: "all", // "all", "open", "closed", "hipo"
    category: "",
    building: "",
    actualSeverity: "",
    potentialSeverity: "",
    isHipo: "",
    investigationLevel: "",
    contractor: "",
    stage: "",
    origin: ""
  });

  const [buildings, setBuildings] = useState([]);
  const [contractors, setContractors] = useState([]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const apiFilters = {
        page: currentPage,
        limit: itemsPerPage === "all" ? "all" : itemsPerPage,
      };

      if (filters.category) apiFilters.category = filters.category;
      if (filters.building) apiFilters.building = filters.building;
      if (filters.actualSeverity) apiFilters.actualSeverity = filters.actualSeverity;
      if (filters.potentialSeverity) apiFilters.potentialSeverity = filters.potentialSeverity;
      
      if (filters.statusChip && filters.statusChip !== "all") apiFilters.statusChip = filters.statusChip;
      if (filters.isHipo === "true" || filters.statusChip === "hipo") apiFilters.isHipo = "true";
      if (filters.isHipo === "false") apiFilters.isHipo = "false";
      
      if (filters.investigationLevel) apiFilters.investigationLevel = filters.investigationLevel;
      if (filters.contractor) apiFilters.contractor = filters.contractor;
      if (filters.stage) apiFilters.stage = filters.stage;
      if (filters.origin) apiFilters.origin = filters.origin;

      const response = await getIncidents(apiFilters);
      
      if (response && response.data && Array.isArray(response.data)) {
        setIncidents(response.data);
        const tot = response.total !== undefined ? response.total : response.data.length;
        setTotalItems(tot);
        const limitVal = itemsPerPage === "all" ? tot : Number(itemsPerPage);
        setTotalPages(response.totalPages !== undefined ? response.totalPages : Math.ceil(tot / (limitVal || 1)));
      } else if (Array.isArray(response)) {
        setIncidents(response);
        setTotalItems(response.length);
        const limitVal = itemsPerPage === "all" ? response.length : Number(itemsPerPage);
        setTotalPages(Math.ceil(response.length / (limitVal || 1)));
      }
    } catch (err) {
      console.error("Failed to load incidents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          getBuildings(1), // Assuming project 1
          getContractors(1, 1000)
        ]);
        setBuildings(Array.isArray(bRes) ? bRes : (bRes.data || []));
        setContractors(Array.isArray(cRes) ? cRes : (cRes.data || cRes.subContractors || []));
      } catch (err) {
        console.error("Failed to fetch dropdown data", err);
      }
    };
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [currentPage, itemsPerPage, filters]);

  const handleFilterChange = (key, value) => {
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredIncidents = incidents;
  const currentIncidents = incidents;
  const total = totalItems;
  const openCount = incidents.filter(i => i.stage !== "CLOSED" && i.status !== "Closed").length;
  const invCount = incidents.filter(i => i.stage === "INITIAL_REPORT" || i.stage === "INVESTIGATION" || i.pipeline === "Initial" || i.pipeline === "Investigation").length;
  const hipoCount = incidents.filter(i => i.isHipo === true || String(i.isHipo) === "true" || i.hipo).length;
  const ltiCount = incidents.filter(i => i.category === "Lost Time Injury" || i.type === "LTI" || i.classification === "Lost Time Injury").length;

  // Pipeline Stages
  const pipelineStages = [
    { key: "HEADS_UP", match: ["Heads-Up", "HEADS_UP"], label: "Heads-Up (2h)", color: "var(--text-main)", bg: "var(--color-gray-bg)" },
    { key: "INITIAL_REPORT", match: ["Initial", "INITIAL_REPORT"], label: "Initial Report (24h)", color: "var(--color-caution)", bg: "var(--color-caution-bg)" },
    { key: "INVESTIGATION", match: ["Investigation", "INVESTIGATION"], label: "Investigation (7d)", color: "var(--text-muted)", bg: "var(--color-gray-bg)" },
    { key: "CLOSED", match: ["Closed", "CLOSED"], label: "Closed", color: "var(--color-safe)", bg: "var(--color-safe-bg)" }
  ];

  // Classification 
  const orderClass = ["Near Miss", "First Aid Injury", "Medical Treatment Injury", "Restricted Work Injury", "Lost Time Injury", "Property Damage", "Environmental Incident", "Personal Injury"];
  const palClass = { "Near Miss": "var(--nne-brand-blue, #131E40)", "First Aid Injury": "#C07D10", "Medical Treatment Injury": "#E8663A", "Restricted Work Injury": "#8F1B32", "Lost Time Injury": "var(--nne-brand-red, #E32B50)", "Property Damage": "var(--nne-concrete, #c8c8c8)", "Environmental Incident": "var(--nne-copper, #c46d32)" };
  
  const classRows = orderClass.map(c => {
    const n = filteredIncidents.filter(i => i.category === c || i.classification === c || (i.categories && i.categories.includes(c))).length;
    return n > 0 ? { label: c, n, color: palClass[c] || "#A1A5B3" } : null;
  }).filter(Boolean);
  if (!classRows.length) classRows.push({ label: "No incidents", n: 0, color: "#A1A5B3" });
  const maxClass = Math.max(...classRows.map(r => r.n), 1);

  // Potential Severity
  const potRows = [];
  for (let lvl = 5; lvl >= 1; lvl--) {
    const meta = severityMeta(lvl);
    const n = filteredIncidents.filter(i => String(i.potentialSeverity) === String(lvl)).length;
    potRows.push({ label: `${lvl} · ${meta.label}`, n, color: meta.color });
  }
  const maxPot = Math.max(...potRows.map(r => r.n), 1);

  return (
    <div className="mod-page">
      <PageHeader
        title="Incidents"
        subtitle={`${total} total incidents`}
        icon={<ListIcon />}
        breadcrumbs={[{ label: "Home" }, { label: "Incident Management" }, { label: "Incidents" }]}
        actions={
          <button className="mod-btn-primary im-btn-primary" onClick={() => navigate("/incident-management/create")}>
            + Report Incident
          </button>
        }
      />

      {/* KPI Row */}
      <div className="im-kpis">
        <div className="im-hero">
          <div className="im-stat-top"><span className="im-hero-label">Days Since Last LTI</span></div>
          <div className="im-hero-val">7</div>
          <div className="im-hero-track"><div className="im-hero-fill" style={{ width: "2%" }}></div></div>
          <div className="im-hero-metrics"><span><b>214</b> best</span><span><b>365</b> target</span></div>
        </div>
        {[
          { label: "Total Incidents", value: total, sub: "this period", accent: "var(--accent-primary)" },
          { label: "Open", value: openCount, sub: "awaiting close-out", accent: "var(--color-caution)", valColor: "var(--color-caution)" },
          { label: "Under Investigation", value: invCount, sub: "initial / investigation", accent: "var(--text-muted)", valColor: "var(--text-muted)" },
          { label: "High-Potential", value: hipoCount, sub: "HiPo flagged", accent: "var(--color-risk)", valColor: "var(--color-risk)" },
          { label: "LTIs", value: ltiCount, sub: "lost-time injuries", accent: "var(--color-risk)", valColor: "var(--color-risk)" }
        ].map(k => (
          <div key={k.label} className="im-stat" style={{ "--a": k.accent }}>
            <div className="im-stat-top"><span className="im-stat-label">{k.label}</span></div>
            <div className="im-stat-val" style={{ color: k.valColor || "var(--text, #334155)" }}>{k.value}</div>
            <div className="im-stat-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Pipeline Overview */}
      <div className="mod-card mb-6">
        <div className="mod-card-header"><span className="mod-card-title">Investigation Pipeline</span></div>
        <div className="mod-card-body">
          <div style={{ display: "flex", gap: "12px", overflowX: "auto" }}>
            {pipelineStages.map(s => {
              const n = filteredIncidents.filter(i => s.match.includes(i.stage) || s.match.includes(i.pipeline)).length;
              const pct = Math.round(n / Math.max(total, 1) * 100);
              return (
                <div key={s.key} style={{ flex: 1, minWidth: 150, textAlign: "center", padding: "16px", borderRadius: "8px", background: s.bg }}>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: s.color }}>{n}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
                  <div className="progress-bar" style={{ marginTop: 16 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: s.color }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Classifications & Severity */}
      <div className="grid-2 mb-6">
        <div className="mod-card">
          <div className="mod-card-header"><span className="mod-card-title">By Classification</span></div>
          <div className="mod-card-body">
            {classRows.map(r => (
              <div key={r.label} className="stat-bar">
                <span className="stat-bar-label">{r.label}</span>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill" style={{ width: `${r.n / maxClass * 100}%`, background: r.color }}></div>
                </div>
                <span className="stat-bar-value">{r.n}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mod-card">
          <div className="mod-card-header"><span className="mod-card-title">By Potential Severity</span></div>
          <div className="mod-card-body">
            {potRows.map(r => (
              <div key={r.label} className="stat-bar">
                <span className="stat-bar-label">{r.label}</span>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill" style={{ width: `${r.n / maxPot * 100}%`, background: r.color }}></div>
                </div>
                <span className="stat-bar-value">{r.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        {["all", "open", "closed", "hipo"].map(f => (
          <span key={f} className={`filter-chip ${filters.statusChip === f ? "active" : ""}`} onClick={() => handleFilterChange('statusChip', f)}>
            {f === "all" ? "All" : f === "open" ? "Open" : f === "closed" ? "Closed" : "High-Potential"}
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="mod-card">
        <div className="mod-table-wrap">
          <table className="mod-table">
            <thead>
              <tr>
                <th className="ith">ID</th>
                <th className="ith">OCCURRED</th>
                <th className="ith">DATE CREATED</th>
                <th className="ith">LAST EDITED</th>
                <th className="ith">CLASSIFICATION</th>
                <th className="ith">TITLE</th>
                <th className="ith">BUILDING</th>
                <th className="ith">ACTUAL</th>
                <th className="ith">POTENTIAL</th>
                <th className="ith">HIPO</th>
                <th className="ith">INV.</th>
                <th className="ith">CONTRACTOR</th>
                <th className="ith">ORIGIN</th>
                <th className="ith" style={{ minWidth: 190, position: "sticky", right: 0, zIndex: 3, background: "var(--bg-card, #fff)" }}>STATUS</th>
              </tr>
              <tr style={{ background: "var(--bg-card)" }}>
                <th colSpan="4"></th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }} value={filters.category} onChange={e => handleFilterChange('category', e.target.value)}>
                    <option value="">All</option>
                    {orderClass.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </th>
                <th></th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }} value={filters.building} onChange={e => handleFilterChange('building', e.target.value)}>
                    <option value="">All</option>
                    {buildings.map((b, i) => {
                      const bName = b.building_name || b.buildingName || b.name || (typeof b === 'string' ? b : String(b.build_id || i));
                      return <option key={i} value={bName}>{bName}</option>;
                    })}
                  </select>
                </th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }} value={filters.actualSeverity} onChange={e => handleFilterChange('actualSeverity', e.target.value)}>
                    <option value="">All</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }} value={filters.potentialSeverity} onChange={e => handleFilterChange('potentialSeverity', e.target.value)}>
                    <option value="">All</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }} value={filters.isHipo} onChange={e => handleFilterChange('isHipo', e.target.value)}>
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }} value={filters.investigationLevel} onChange={e => handleFilterChange('investigationLevel', e.target.value)}>
                    <option value="">All</option>
                    <option value="L1">L1</option>
                    <option value="L2">L2</option>
                    <option value="L3">L3</option>
                  </select>
                </th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }} value={filters.contractor} onChange={e => handleFilterChange('contractor', e.target.value)}>
                    <option value="">All</option>
                    {contractors.map((c, i) => {
                      const cName = c.subContractorName || c.name || (typeof c === 'string' ? c : String(c.id || i));
                      return <option key={i} value={cName}>{cName}</option>;
                    })}
                  </select>
                </th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }} value={filters.origin} onChange={e => handleFilterChange('origin', e.target.value)}>
                    <option value="">All</option>
                    <option value="Direct">Direct</option>
                    <option value="Observation">Observation</option>
                  </select>
                </th>
                <th style={{ position: "sticky", right: 0, zIndex: 3, background: "var(--bg-card, #fff)" }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="14" style={{ textAlign: "center", padding: "48px 0" }}><Loader size="md" text="Loading Incidents..." /></td></tr>
              ) : currentIncidents.length === 0 ? (
                <tr><td colSpan="14" style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>No incidents found</td></tr>
              ) : currentIncidents.map(inc => (
                <tr key={inc.id} onClick={() => navigate(`/incident-management/details/${inc.id}`)} style={{ cursor: "pointer" }}>
                  <td className="id-cell">{inc.id}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{inc.incidentDate || inc.date || "—"}</td>
                  <td style={{ whiteSpace: "nowrap", fontSize: "12px" }}>{inc.createdTime ? inc.createdTime.split("T")[0] : inc.createdAt || "—"}</td>
                  <td style={{ whiteSpace: "nowrap", fontSize: "12px" }}>{inc.updatedTime ? inc.updatedTime.split("T")[0] : inc.editedAt || "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{inc.categories?.[0] || inc.category || "—"}</td>
                  <td style={{ maxWidth: "180px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inc.caseNumber || inc.title || "—"}</td>
                  <td>{inc.buildingName || inc.building || "—"}</td>
                  <td><SevPill level={inc.actualSeverity} /></td>
                  <td><SevPill level={inc.potentialSeverity} /></td>
                  <td>
                    {inc.isHipo || inc.hipo ? <span className="badge" style={{ background: "var(--color-risk)", color: "#fff" }}>HiPo</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td>
                    {(inc.investigationLevel || inc.investigation) ? (
                      <span className={`badge ${(inc.investigationLevel || inc.investigation) === "L3" ? "badge-red" : (inc.investigationLevel || inc.investigation) === "L2" ? "badge-orange" : "badge-gray"}`}>
                        {inc.investigationLevel || inc.investigation}
                      </span>
                    ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td>
                    {inc.contractorsInvolved || inc.contractor ? (
                       <span style={{ whiteSpace: "nowrap" }}>{inc.contractorsInvolved || inc.contractor}</span>
                    ) : (
                       <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td><span style={{ whiteSpace: "nowrap" }}>{inc.origin || "Direct"}</span></td>
                  <td style={{ position: "sticky", right: 0, zIndex: 1, background: "var(--bg-card, #fff)", borderLeft: "1px solid var(--border-color)", boxShadow: "-4px 0 12px rgba(0,0,0,0.02)" }}><StatusTracker pipeline={inc.stage || inc.pipeline || "Closed"} isPendingClosure={typeof inc.investigation === 'object' && !!(inc.investigation?.reviewedBy || inc.investigation?.approvedBy)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* ── Pagination ── */}
        {!loading && totalItems > 0 && (
          <div className="beam-pagination" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderTop: "1px solid var(--border-color)", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "12px" }}>
              <span>
                Showing {totalItems === 0 ? 0 : (currentPage - 1) * (itemsPerPage === "all" ? totalItems : itemsPerPage) + 1} to {itemsPerPage === "all" ? totalItems : Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} incidents
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const val = e.target.value === "all" ? "all" : Number(e.target.value);
                    setItemsPerPage(val);
                    setCurrentPage(1);
                  }}
                  style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && itemsPerPage !== "all" && (
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <button className="beam-page-btn" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>←</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                  .reduce((acc, page, i, arr) => {
                    if (i > 0 && page - arr[i - 1] > 1) {
                      acc.push('ellipsis-' + page);
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map(item => typeof item === 'string' ? (
                    <span key={item} style={{ padding: "0 6px", color: "var(--text-muted)", fontSize: "12px" }}>...</span>
                  ) : (
                    <button key={item} className={`beam-page-number ${currentPage === item ? "beam-page-number--active" : ""}`} onClick={() => handlePageChange(item)}>
                      {item}
                    </button>
                  ))}
                <button className="beam-page-btn" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>→</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default IMList;
