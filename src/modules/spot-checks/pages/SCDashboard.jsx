import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SCDashboard.css";

// ── Icons ──
const Icons = {
  eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>,
  calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>,
  activity: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  layers: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>,
  target: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  up: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>,
  down: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/></svg>
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

// ── Mock Data ──
const MOCK_CHECKS = [
  { id: "SC-2026-101", location: "Zone A", type: "PPE Check", result: "PASS", date: "2026-09-09", inspector: "John Doe" },
  { id: "SC-2026-102", location: "Zone B", type: "Scaffolding", result: "FAIL", date: "2026-09-09", inspector: "Jane Smith" },
  { id: "SC-2026-103", location: "Zone C", type: "Electrical", result: "PASS", date: "2026-09-08", inspector: "Mike Johnson" },
  { id: "SC-2026-104", location: "Zone A", type: "Housekeeping", result: "PASS", date: "2026-09-08", inspector: "John Doe" },
  { id: "SC-2026-105", location: "Zone D", type: "PPE Check", result: "WARNING", date: "2026-09-07", inspector: "Jane Smith" }
];

export default function SCDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState({ q: '', location: '', result: '' });
  
  const filteredDeepDive = MOCK_CHECKS.filter(r => {
    if (filter.q && !(r.id + ' ' + r.type).toLowerCase().includes(filter.q.toLowerCase())) return false;
    if (filter.location && r.location !== filter.location) return false;
    if (filter.result && r.result !== filter.result) return false;
    return true;
  });

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
          <button className="mod-btn-outline" style={{ height: '28px', padding: '0 12px' }} onClick={() => navigate("/spot-checks/list")}>View All</button>
          <button className="mod-btn-primary">+ New Spot Check</button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="dash-kpis">
        <StatCard label="Today" value="24" accent="#14B8A6" icon="eye" sub="checks completed" foot={<><TrendPill pct={8} /> <span style={{marginLeft: 4, color:'var(--text-muted)'}}>vs yesterday</span></>} />
        <StatCard label="This Week" value="156" accent="#14B8A6" icon="calendar" sub="week to date" foot={<><TrendPill pct={12} /> <span style={{marginLeft: 4, color:'var(--text-muted)'}}>vs last week</span></>} />
        <StatCard label="Pass Rate" value="88%" accent="#7BBE97" valColor="#7BBE97" icon="activity" sub="overall pass rate" />
        <StatCard label="Total Checks" value="1,245" accent="#583C66" valColor="#583C66" icon="layers" sub="all time" />
        <StatCard label="Failed Checks" value="18" accent="#E32B50" valColor="#E32B50" icon="target" sub="this week" />
        <StatCard label="Last Week" value="142" accent="#8A8F9F" icon="clock" sub="complete week total" />
      </div>

      {/* ── Trend ── */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Daily Spot Check Trend</span>
        </div>
        <div className="panel-body">
          <div className="vbars">
            {[{label:'Mon', count:22}, {label:'Tue', count:25}, {label:'Wed', count:20}, {label:'Thu', count:28}, {label:'Fri', count:24}, {label:'Sat', count:15}, {label:'Sun', count:12}, {label:'Today', count:24}].map((w, i) => {
              const h = Math.max((w.count / 28) * 90, 6);
              const isCur = i === 7;
              return (
                <div key={i} className="vb">
                  <span className="vnum" style={{ color: isCur ? '#14B8A6' : 'var(--text-muted)' }}>{w.count}</span>
                  <div className="vbar" style={{ height: h, background: isCur ? '#14B8A6' : '#C4B79A' }}></div>
                  <span className="vlbl">{w.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Deep Dive Table ── */}
      <div className="panel dash-tablecard">
        <div className="panel-head">
          <span className="panel-title">Recent Spot Checks</span>
        </div>
        <div className="dd-filters">
          <input className="df-input" style={{ flex: 1 }} placeholder="Search ID or type..." value={filter.q} onChange={e => setFilter({ ...filter, q: e.target.value })} />
          <select className="df-input" value={filter.location} onChange={e => setFilter({ ...filter, location: e.target.value })}>
            <option value="">All Locations</option>
            <option value="Zone A">Zone A</option>
            <option value="Zone B">Zone B</option>
            <option value="Zone C">Zone C</option>
            <option value="Zone D">Zone D</option>
          </select>
          <select className="df-input" value={filter.result} onChange={e => setFilter({ ...filter, result: e.target.value })}>
            <option value="">All Results</option>
            <option value="PASS">Pass</option>
            <option value="WARNING">Warning</option>
            <option value="FAIL">Fail</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Location</th>
                <th>Type</th>
                <th>Inspector</th>
                <th>Result</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeepDive.map(r => {
                const getStatusBadgeClass = (statusStr) => {
                  switch (statusStr) {
                    case 'PASS': return 'badge-green';
                    case 'FAIL': return 'badge-red';
                    case 'WARNING': return 'badge-orange';
                    default: return 'badge-blue';
                  }
                };
                return (
                  <tr key={r.id}>
                    <td><b>{r.id}</b></td>
                    <td>{r.location}</td>
                    <td>{r.type}</td>
                    <td>{r.inspector}</td>
                    <td><span className={`badge ${getStatusBadgeClass(r.result)}`}>{r.result}</span></td>
                    <td>{r.date}</td>
                  </tr>
                );
              })}
              {filteredDeepDive.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No checks match the filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
