import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getIncidents } from "../../../services/incidentService";
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

const LtiHero = ({ current, best, target, lastDate }) => {
  const pct = Math.min(100, Math.round((current / (target || 365)) * 100));
  return (
    <div className="stat lti-hero">
      <div className="stat-top">
        <span className="stat-label" style={{ color: 'rgba(255,255,255,0.85)' }}>Days Since Last LTI</span>
        <span className="stat-icon" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}><Icons.check /></span>
      </div>
      <div className="stat-value">{current}</div>
      <div className="lti-hero-track"><div className="lti-hero-fill" style={{ width: `${pct}%` }}></div></div>
      <div className="lti-hero-metrics">
        <span><b>{best}</b> best streak</span>
        <span><b>{target}</b> target</span>
        <span>last: {lastDate}</span>
      </div>
    </div>
  );
};

/* ── Main Dashboard ── */
export default function IMDashboard() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await getIncidents();
        setIncidents(Array.isArray(res) ? res : (res?.data || []));
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  /* Mock Data representing APIs we might call later */
  const K = {
    trir: { value: 11.99, max: 20, target: 5, hours: 8591180 },
    ltir: { value: 3.96, max: 5, target: 1, hours: 8591180 },
    ltiStreak: { current: 157, best: 214, target: 365, lastLtiDate: '17 Jun 2026' },
    frontParts: [
      { part: 'R. Hand', count: 6 },
      { part: 'L. Forearm', count: 4 },
      { part: 'Lower Abdomen', count: 3 },
      { part: 'R. Foot', count: 2 },
      { part: 'Head', count: 2 },
      { part: 'Chest', count: 1 },
      { part: 'L. Hand', count: 1 },
      { part: 'R. Forearm', count: 1 },
      { part: 'L. Foot', count: 1 }
    ],
    backParts: [
      { part: 'Lower Back', count: 6 },
      { part: 'Upper Back', count: 4 },
      { part: 'Neck', count: 3 },
      { part: 'R. Forearm', count: 2 },
      { part: 'R. Hand', count: 2 },
      { part: 'R. Foot', count: 1 },
      { part: 'L. Hand', count: 1 },
      { part: 'L. Forearm', count: 1 },
      { part: 'L. Foot', count: 1 }
    ]
  };

  /* Aggregations */
  const processData = (list) => {
    if (!list) list = [];
    let closed = 0, active = 0, hipo = 0, lti = 0, needsAction = 0;
    const sevCount = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    const typeCount = {};
    const pipeCount = { 'Heads-Up': 0, 'Initial': 0, 'Investigation': 0, 'Closed': 0 };

    const getSev = (r) => {
      let w = String(r.severity || r.actualSeverity || r.potentialSeverity || '').toLowerCase();
      if (w.includes('crit') || w === '4' || w === '5') return 'CRITICAL';
      if (w.includes('high') || w === '3') return 'HIGH';
      if (w.includes('med') || w === '2') return 'MEDIUM';
      return 'LOW';
    };

    list.forEach(r => {
      const isClosed = r.status === 'closed' || r.status === 'Closed' || r.pipeline === 'Closed' || r.stage === 'CLOSED';
      if (isClosed) closed++; else active++;
      if (r.hipo) hipo++;
      const ty = (r.type || r.classification || r.category || 'Other');
      if (/Lost Time|LTI/i.test(ty)) lti++;
      if (!isClosed) needsAction++;
      
      sevCount[getSev(r)]++;
      typeCount[ty] = (typeCount[ty] || 0) + 1;
      
      let pk = r.pipeline || r.stage || 'Heads-Up';
      if (pk === 'INITIAL_REPORT') pk = 'Initial';
      if (pk === 'INVESTIGATION') pk = 'Investigation';
      if (pk === 'CLOSED') pk = 'Closed';
      if (pk === 'HEADS_UP') pk = 'Heads-Up';
      pipeCount[pk] = (pipeCount[pk] || 0) + 1;
    });

    // For Incident Types, the user requested static mock data matching the screenshot.
    const staticTypes = [
      { type: 'Near Miss', count: 5, color: '#C07D10' },
      { type: 'First Aid', count: 2, color: '#583C66' },
      { type: 'Property Damage', count: 1, color: '#A1A5B3' },
      { type: 'Environmental', count: 1, color: '#7BBE97' },
      { type: 'LTI', count: 1, color: '#A1A5B3' }
    ];
    
    return {
      total: list.length, active, closed, hipo, lti, needsAction,
      severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(k => ({ level: k, count: sevCount[k], color: sevHex(k) })),
      types: staticTypes,
      typesTotal: 10,
      pipeline: [
        { label: 'Heads-Up', count: pipeCount['Heads-Up'], color: '#C07D10' },
        { label: 'Initial', count: pipeCount['Initial'], color: '#E32B50' },
        { label: 'Investigation', count: pipeCount['Investigation'], color: '#131E40' },
        { label: 'Closed', count: pipeCount['Closed'], color: '#A1A5B3' }
      ]
    };
  };

  const agg = processData(incidents);
  const maxT = Math.max(...agg.types.map(x => x.count)) || 1;
  const maxB = 6; // Fixed max for body parts based on screenshot (6 is highest)

  const filteredIncidents = incidents ? incidents.filter(r => {
    if (stageFilter === 'all') return true;
    let s = r.pipeline || r.stage || 'Heads-Up';
    if (s === 'INITIAL_REPORT') s = 'Initial';
    if (s === 'INVESTIGATION') s = 'Investigation';
    if (s === 'CLOSED') s = 'Closed';
    if (s === 'HEADS_UP') s = 'Heads-Up';
    if (stageFilter === 'active') return s !== 'Closed';
    return s === stageFilter || s === stageFilter.split(' ')[0]; 
  }).slice(0, 15) : []; // Show top 15 for demo

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
            <select><option>All Buildings</option></select>
            <select><option>All Contractors</option></select>
            <select><option>Last 13 Months</option></select>
          </div>
          <button type="button" className="btn btn-outline" onClick={() => console.log('Export')}>
            <Icons.export /> Export CSV
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="dash-kpis">
        <LtiHero current={K.ltiStreak.current} best={K.ltiStreak.best} target={K.ltiStreak.target} lastDate={K.ltiStreak.lastLtiDate} />
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
                <BodyMap data={K.frontParts} view="front" />
              </div>
              <div className="bp-list">
                {K.frontParts.map((b, i) => {
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
                <BodyMap data={K.backParts} view="back" />
              </div>
              <div className="bp-list">
                {K.backParts.map((b, i) => {
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
                 <div className="bp-sum-val" style={{ color: '#3B82F6' }}>18</div>
              </div>
           </div>
           <div className="bp-sum-card">
              <div className="bp-sum-dot"><span style={{ background: '#E32B50' }}/></div>
              <div>
                 <div className="bp-sum-lbl" style={{ color: '#E32B50' }}>High (5 or more)</div>
                 <div className="bp-sum-val" style={{ color: '#E32B50' }}>2</div>
              </div>
           </div>
           <div className="bp-sum-card">
              <div className="bp-sum-dot"><span style={{ background: '#C07D10' }}/></div>
              <div>
                 <div className="bp-sum-lbl" style={{ color: '#C07D10' }}>Medium (3 - 4)</div>
                 <div className="bp-sum-val" style={{ color: '#C07D10' }}>6</div>
              </div>
           </div>
           <div className="bp-sum-card">
              <div className="bp-sum-dot"><span style={{ background: '#7BBE97' }}/></div>
              <div>
                 <div className="bp-sum-lbl" style={{ color: '#7BBE97' }}>Low (1 - 2)</div>
                 <div className="bp-sum-val" style={{ color: '#7BBE97' }}>10</div>
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
                const s = String(r.severity || r.actualSeverity || r.potentialSeverity || '').toLowerCase();
                let sev = 'LOW';
                if (s.includes('crit') || s === '4' || s === '5') sev = 'CRITICAL';
                else if (s.includes('high') || s === '3') sev = 'HIGH';
                else if (s.includes('med') || s === '2') sev = 'MEDIUM';

                const stage = r.pipeline || r.stage || 'Heads-Up';
                const stageColor = stage.includes('Head') ? '#C07D10' : stage.includes('Init') ? '#E32B50' : stage.includes('Invest') ? '#131E40' : '#A1A5B3';

                return (
                  <tr key={r.id || Math.random()} onClick={() => navigate(`/incident-management/details/${r.id}`)}>
                    <td className="code">{r.id || r.caseNumber} {r.hipo && <span className="hipo-badge">HiPo</span>}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.date || r.createdAt?.split('T')[0] || r.incidentDate || "—"}</td>
                    <td>{r.type || r.classification || r.category || "—"}</td>
                    <td><span className="sev-badge" style={{ background: hexA(sevHex(sev), 0.14), color: sevHex(sev) }}>{sev}</span></td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: stageColor }} />
                        {stage}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.contractor || "—"}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No incidents match the criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
