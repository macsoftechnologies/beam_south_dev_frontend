import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { INCIDENTS } from "../data/incidents";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
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

const StatusTracker = ({ pipeline }) => {
  const steps = [
    { key: "Heads-Up", title: "Heads-Up Notification" },
    { key: "Initial", title: "Initial Incident Report" },
    { key: "Investigation", title: "Investigation Report" }
  ];
  const order = { "Heads-Up": 0, "Initial": 1, "Investigation": 2, "Closed": 3 };
  const curIdx = order.hasOwnProperty(pipeline) ? order[pipeline] : 0;
  const closed = pipeline === "Closed";
  const label = closed ? "Closed" : (steps[curIdx] ? steps[curIdx].title : pipeline);

  const checkS = (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );

  return (
    <div className="st-track" title={label}>
      {steps.map((step, i) => {
        const state = closed || i < curIdx ? "done" : (i === curIdx ? "current" : "pending");
        return (
          <React.Fragment key={step.key}>
            <span className={`st-line ${i <= curIdx || closed ? "on" : ""}`} style={i === 0 ? { visibility: "hidden" } : {}}></span>
            <span className={`st-dot st-${state}`} title={step.title}>
              {state === "done" ? checkS : (i + 1)}
            </span>
          </React.Fragment>
        );
      })}
      <span className={`st-label ${closed ? "st-label-closed" : "st-label-live"}`}>{label}</span>
    </div>
  );
};

function IMList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const filteredIncidents = useMemo(() => {
    return INCIDENTS.filter(inc => {
      if (filter === "hipo") return inc.hipo;
      if (filter !== "all") return inc.status.toLowerCase() === filter;
      return true;
    });
  }, [filter]);

  // KPIs
  const total = INCIDENTS.length;
  const openCount = INCIDENTS.filter(i => i.status.toLowerCase() !== "closed").length;
  const invCount = INCIDENTS.filter(i => i.pipeline === "Initial" || i.pipeline === "Investigation").length;
  const hipoCount = INCIDENTS.filter(i => i.hipo).length;
  const ltiCount = INCIDENTS.filter(i => i.category === "Lost Time Injury" || i.type === "LTI").length;

  // Pipeline Stages
  const pipelineStages = [
    { key: "Heads-Up", label: "Heads-Up (2h)", color: "var(--text-main)", bg: "var(--color-gray-bg)" },
    { key: "Initial", label: "Initial Report (24h)", color: "var(--color-caution)", bg: "var(--color-caution-bg)" },
    { key: "Investigation", label: "Investigation (7d)", color: "var(--text-muted)", bg: "var(--color-gray-bg)" },
    { key: "Closed", label: "Closed", color: "var(--color-safe)", bg: "var(--color-safe-bg)" }
  ];

  // Classification 
  const orderClass = ["Near Miss", "First Aid Injury", "Medical Treatment Injury", "Restricted Work Injury", "Lost Time Injury", "Property Damage", "Environmental Incident", "Personal Injury"];
  const palClass = { "Near Miss": "var(--nne-brand-blue, #131E40)", "First Aid Injury": "#C07D10", "Medical Treatment Injury": "#E8663A", "Restricted Work Injury": "#8F1B32", "Lost Time Injury": "var(--nne-brand-red, #E32B50)", "Property Damage": "var(--nne-concrete, #c8c8c8)", "Environmental Incident": "var(--nne-copper, #c46d32)" };
  
  const classRows = orderClass.map(c => {
    const n = INCIDENTS.filter(i => i.category === c).length;
    return n > 0 ? { label: c, n, color: palClass[c] || "#A1A5B3" } : null;
  }).filter(Boolean);
  if (!classRows.length) classRows.push({ label: "No incidents", n: 0, color: "#A1A5B3" });
  const maxClass = Math.max(...classRows.map(r => r.n), 1);

  // Potential Severity
  const potRows = [];
  for (let lvl = 5; lvl >= 1; lvl--) {
    const meta = severityMeta(lvl);
    const n = INCIDENTS.filter(i => i.potentialSeverity === lvl).length;
    potRows.push({ label: `${lvl} · ${meta.label}`, n, color: meta.color });
  }
  const maxPot = Math.max(...potRows.map(r => r.n), 1);

  return (
    <div className="mod-page" style={{ "--accent-primary": "#0f172a", "--accent-hover": "#1e293b" }}>
      <PageHeader
        title="Incidents"
        subtitle={`${total} total incidents`}
        icon={<ListIcon />}
        breadcrumbs={[{ label: "Home" }, { label: "Incident Management" }, { label: "Incidents" }]}
        actions={
          <button className="mod-btn-primary" onClick={() => navigate("/incident-management/create")}>
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
              const n = INCIDENTS.filter(i => i.pipeline === s.key).length;
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
          <span key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
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
                <th className="ith" style={{ minWidth: 190 }}>STATUS</th>
              </tr>
              <tr style={{ background: "var(--bg-card)" }}>
                <th colSpan="4"></th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }}>
                    <option>All Classification</option>
                  </select>
                </th>
                <th></th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }}>
                    <option>All Building</option>
                  </select>
                </th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }}>
                    <option>All Actual</option>
                  </select>
                </th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }}>
                    <option>All Potential</option>
                  </select>
                </th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }}>
                    <option>All HiPo</option>
                  </select>
                </th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }}>
                    <option>All Inv</option>
                  </select>
                </th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }}>
                    <option>All Contractor</option>
                  </select>
                </th>
                <th>
                  <select className="mod-form-select" style={{ padding: "4px 24px 4px 8px", fontSize: "11px", height: "auto" }}>
                    <option>All Origin</option>
                  </select>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr><td colSpan="14" style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>No incidents found</td></tr>
              ) : filteredIncidents.map(inc => (
                <tr key={inc.id} onClick={() => navigate(`/incident-management/details/${inc.id}`)} style={{ cursor: "pointer" }}>
                  <td className="id-cell">{inc.id}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{inc.date}</td>
                  <td style={{ whiteSpace: "nowrap", fontSize: "12px" }}>{inc.createdAt || "—"}</td>
                  <td style={{ whiteSpace: "nowrap", fontSize: "12px" }}>{inc.editedAt || "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{inc.category}</td>
                  <td style={{ maxWidth: "180px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inc.title}</td>
                  <td>{inc.building || "—"}</td>
                  <td><SevPill level={inc.actualSeverity} /></td>
                  <td><SevPill level={inc.potentialSeverity} /></td>
                  <td>
                    {inc.hipo ? <span className="badge" style={{ background: "var(--color-risk)", color: "#fff" }}>HiPo</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td>
                    {inc.investigation ? (
                      <span className={`badge ${inc.investigation === "L3" ? "badge-red" : inc.investigation === "L2" ? "badge-orange" : "badge-gray"}`}>
                        {inc.investigation}
                      </span>
                    ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td>
                    {inc.contractor ? (
                       <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                         <div style={{ width: "16px", height: "16px", background: "var(--bg-dark)", borderRadius: "4px", display: "inline-block" }}></div>
                         <span style={{ whiteSpace: "nowrap" }}>{inc.contractor === "c01" ? "Alpha" : inc.contractor === "c02" ? "Zeta" : "NNE"}</span>
                       </div>
                    ) : (
                       <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td><span style={{ whiteSpace: "nowrap" }}>{inc.origin || "Direct"}</span></td>
                  <td><StatusTracker pipeline={inc.pipeline || "Closed"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default IMList;
