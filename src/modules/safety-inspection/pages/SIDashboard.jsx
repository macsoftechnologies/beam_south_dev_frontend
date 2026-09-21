import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { safetyInspectionService } from "../../../services/safetyInspectionService";
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

export default function SIDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    thisWeek: 0,
    thisMonth: 0,
    lastWeek: 0,
    totalInspections: 0,
    averageScore: 85,
    complianceRate: 92,
    weeklyTrend: [],
    recentInspections: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({ q: '', status: '' });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await safetyInspectionService.getInspectionStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load inspection stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  const weeklyTrend = stats.weeklyTrend && stats.weeklyTrend.length > 0 
    ? stats.weeklyTrend 
    : [
        { label: 'Wk 1', count: 0 },
        { label: 'Wk 2', count: 0 },
        { label: 'Wk 3', count: 0 },
        { label: 'Wk 4', count: 0 },
        { label: 'Wk 5', count: 0 },
        { label: 'Wk 6', count: 0 },
        { label: 'Wk 7', count: 0 },
        { label: 'This wk', count: stats.thisWeek || 0 }
      ];

  const maxWeeklyCount = Math.max(...weeklyTrend.map(w => w.count), 5);

  const recentInspections = stats.recentInspections || [];
  const filteredDeepDive = recentInspections.filter(r => {
    const num = r.inspectionNumber || `SI${r.id}`;
    const site = r.buildingName || '';
    if (filter.q && !(num + ' ' + site).toLowerCase().includes(filter.q.toLowerCase())) return false;
    if (filter.status && r.status !== filter.status) return false;
    return true;
  });

  const weekGrowth = stats.lastWeek > 0 
    ? Math.round(((stats.thisWeek - stats.lastWeek) / stats.lastWeek) * 100) 
    : (stats.thisWeek > 0 ? 100 : 0);

  return (
    <div className="si-dashboard-container">
      {/* ── Hero ── */}
      <div className="dash-hero">
        <div className="dash-hero-l">
          <div className="dash-hero-icon"><Icons.eye /></div>
          <div>
            <h1>Safety Inspection Analytics</h1>
            <p>Track site compliance, 21-category inspection scores, and compliance metrics</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="mod-btn-outline" style={{ height: '36px', padding: '0 16px' }} onClick={() => navigate("/safety-inspection/list")}>View All List</button>
          <button className="mod-btn-primary" onClick={() => navigate("/safety-inspection/create")}>+ New Inspection</button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="dash-kpis">
        <StatCard 
          label="This Week" 
          value={stats.thisWeek || 0} 
          accent="#8B5CF6" 
          icon="eye" 
          sub="inspections done" 
          foot={<><TrendPill pct={weekGrowth} /> <span style={{marginLeft: 4, color:'var(--text-muted)'}}>vs last week</span></>} 
        />
        <StatCard 
          label="This Month" 
          value={stats.thisMonth || 0} 
          accent="#8B5CF6" 
          icon="calendar" 
          sub="month to date" 
        />
        <StatCard 
          label="Average Score" 
          value={`${stats.averageScore || 0}%`} 
          accent="#7BBE97" 
          valColor="#7BBE97" 
          icon="activity" 
          sub="overall pass rate" 
        />
        <StatCard 
          label="Total Inspections" 
          value={stats.totalInspections || 0} 
          accent="#583C66" 
          valColor="#583C66" 
          icon="layers" 
          sub="all time recorded" 
        />
        <StatCard 
          label="Compliance Rate" 
          value={`${stats.complianceRate || 0}%`} 
          accent="#7BBE97" 
          valColor="#7BBE97" 
          icon="target" 
          sub="Sites passing audit" 
        />
        <StatCard 
          label="Last Week" 
          value={stats.lastWeek || 0} 
          accent="#8A8F9F" 
          icon="clock" 
          sub="complete week total" 
        />
      </div>

      {/* ── Trend ── */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Weekly Inspection Trend</span>
        </div>
        <div className="panel-body">
          <div className="vbars">
            {weeklyTrend.map((w, i) => {
              const h = Math.max((w.count / maxWeeklyCount) * 90, 8);
              const isCur = i === weeklyTrend.length - 1;
              return (
                <div key={i} className="vb">
                  <span className="vnum" style={{ color: isCur ? '#8B5CF6' : 'var(--text-muted)' }}>{w.count}</span>
                  <div className="vbar" style={{ height: `${h}px`, background: isCur ? '#8B5CF6' : '#C4B79A' }}></div>
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
          <input className="df-input" style={{ flex: 1 }} placeholder="Search Reference or Building..." value={filter.q} onChange={e => setFilter({ ...filter, q: e.target.value })} />
          <select className="df-input" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Statuses</option>
            <option value="CLOSED">Closed</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Building / Location</th>
                <th>Floor / Level</th>
                <th>Inspector</th>
                <th>Status</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    <i className="ti ti-loader ti-spin" style={{ marginRight: 8, color: '#0ea5e9' }}></i> Loading inspections...
                  </td>
                </tr>
              ) : filteredDeepDive.map(r => {
                const isClosed = r.status === 'CLOSED' || r.status === 'COMPLETED' || r.isCompleted;
                const scoreVal = r.score !== undefined ? r.score : 100;
                const inspector = Array.isArray(r.performedBy) && r.performedBy.length > 0 ? r.performedBy[0] : (r.modifiedByUserName || r.createdByUserName || "-");
                return (
                  <tr key={r.id} onClick={() => navigate(`/safety-inspection/${r.id}`)} style={{ cursor: 'pointer' }}>
                    <td><b>{r.inspectionNumber || `SI${r.id}`}</b></td>
                    <td>{r.buildingName || "Main Building"}</td>
                    <td>{r.floorLevel || "-"}</td>
                    <td>{inspector}</td>
                    <td>
                      <span className={`badge ${isClosed ? 'badge-green' : 'badge-orange'}`}>
                        {isClosed ? 'CLOSED' : 'IN_PROGRESS'}
                      </span>
                    </td>
                    <td>
                      <span style={{color: scoreVal >= 80 ? '#2D7A4F' : scoreVal >= 60 ? '#C07D10' : '#E32B50', fontWeight: 'bold'}}>
                        {scoreVal}%
                      </span>
                    </td>
                    <td>{r.inspectionDate || "-"}</td>
                  </tr>
                );
              })}
              {filteredDeepDive.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No recent inspections recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
