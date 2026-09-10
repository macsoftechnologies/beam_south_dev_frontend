import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SIDashboard.css";

// ── Icons ──
const Icons = {
  eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15L11 17L15 13"/></svg>,
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
const MOCK_INSPECTIONS = [
  { id: "INSP-2026-001", site: "Main Building", contractor: "ABC Construction", type: "Site Audit", status: "COMPLETED", date: "2026-09-08", score: 92 },
  { id: "INSP-2026-002", site: "North Wing", contractor: "XYZ Engineering", type: "Equipment Check", status: "IN_PROGRESS", date: "2026-09-09", score: 75 },
  { id: "INSP-2026-003", site: "East Plaza", contractor: "LMN Services", type: "Safety Walk", status: "COMPLETED", date: "2026-09-07", score: 88 },
  { id: "INSP-2026-004", site: "South Tower", contractor: "ABC Construction", type: "Compliance Audit", status: "FAILED", date: "2026-09-06", score: 45 },
  { id: "INSP-2026-005", site: "Main Building", contractor: "XYZ Engineering", type: "Site Audit", status: "COMPLETED", date: "2026-09-05", score: 95 }
];

export default function SIDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState({ q: '', contractor: '', status: '' });
  
  const filteredDeepDive = MOCK_INSPECTIONS.filter(r => {
    if (filter.q && !(r.id + ' ' + r.type).toLowerCase().includes(filter.q.toLowerCase())) return false;
    if (filter.contractor && r.contractor !== filter.contractor) return false;
    if (filter.status && r.status !== filter.status) return false;
    return true;
  });

  return (
    <div className="si-dashboard-container">
      {/* ── Hero ── */}
      <div className="dash-hero">
        <div className="dash-hero-l">
          <div className="dash-hero-icon"><Icons.eye /></div>
          <div>
            <h1>Safety Inspection Analytics</h1>
            <p>Track site compliance, inspection scores, and compliance metrics</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="mod-btn-outline" style={{ height: '28px', padding: '0 12px' }} onClick={() => navigate("/safety-inspection/list")}>View All</button>
          <button className="mod-btn-primary" onClick={() => navigate("/safety-inspection/create")}>+ New Inspection</button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="dash-kpis">
        <StatCard label="This Week" value="12" accent="#8B5CF6" icon="eye" sub="inspections done" foot={<><TrendPill pct={15} /> <span style={{marginLeft: 4, color:'var(--text-muted)'}}>vs last week</span></>} />
        <StatCard label="This Month" value="48" accent="#8B5CF6" icon="calendar" sub="month to date" foot={<><TrendPill pct={-5} goodIsDown={false} /> <span style={{marginLeft: 4, color:'var(--text-muted)'}}>vs last month</span></>} />
        <StatCard label="Average Score" value="85%" accent="#7BBE97" valColor="#7BBE97" icon="activity" sub="overall pass rate" />
        <StatCard label="Total Inspections" value="342" accent="#583C66" valColor="#583C66" icon="layers" sub="all time" />
        <StatCard label="Compliance Rate" value="92%" accent="#7BBE97" valColor="#7BBE97" icon="target" sub="Sites passing audit" />
        <StatCard label="Last Week" value="10" accent="#8A8F9F" icon="clock" sub="complete week total" />
      </div>

      {/* ── Trend ── */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Weekly Inspection Trend</span>
        </div>
        <div className="panel-body">
          <div className="vbars">
            {[{label:'Wk 1', count:5}, {label:'Wk 2', count:8}, {label:'Wk 3', count:6}, {label:'Wk 4', count:9}, {label:'Wk 5', count:11}, {label:'Wk 6', count:7}, {label:'Wk 7', count:10}, {label:'This wk', count:12}].map((w, i) => {
              const h = Math.max((w.count / 12) * 90, 6);
              const isCur = i === 7;
              return (
                <div key={i} className="vb">
                  <span className="vnum" style={{ color: isCur ? '#8B5CF6' : 'var(--text-muted)' }}>{w.count}</span>
                  <div className="vbar" style={{ height: h, background: isCur ? '#8B5CF6' : '#C4B79A' }}></div>
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
          <span className="panel-title">Recent Inspections</span>
        </div>
        <div className="dd-filters">
          <input className="df-input" style={{ flex: 1 }} placeholder="Search ID or type..." value={filter.q} onChange={e => setFilter({ ...filter, q: e.target.value })} />
          <select className="df-input" value={filter.contractor} onChange={e => setFilter({ ...filter, contractor: e.target.value })}>
            <option value="">All Contractors</option>
            <option value="ABC Construction">ABC Construction</option>
            <option value="XYZ Engineering">XYZ Engineering</option>
            <option value="LMN Services">LMN Services</option>
          </select>
          <select className="df-input" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Site</th>
                <th>Contractor</th>
                <th>Type</th>
                <th>Status</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeepDive.map(r => {
                const getStatusBadgeClass = (statusStr) => {
                  switch (statusStr) {
                    case 'COMPLETED': return 'badge-green';
                    case 'FAILED': return 'badge-red';
                    case 'IN_PROGRESS': return 'badge-orange';
                    default: return 'badge-blue';
                  }
                };
                return (
                  <tr key={r.id}>
                    <td><b>{r.id}</b></td>
                    <td>{r.site}</td>
                    <td>{r.contractor}</td>
                    <td>{r.type}</td>
                    <td><span className={`badge ${getStatusBadgeClass(r.status)}`}>{r.status}</span></td>
                    <td><span style={{color: r.score >= 80 ? '#2D7A4F' : r.score >= 60 ? '#C07D10' : '#E32B50', fontWeight: 'bold'}}>{r.score}%</span></td>
                    <td>{r.date}</td>
                  </tr>
                );
              })}
              {filteredDeepDive.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No inspections match the filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
