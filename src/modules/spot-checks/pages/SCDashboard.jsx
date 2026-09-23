import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { spotCheckService } from "../../../services/spotCheckService";
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

export default function SCDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalChecks: 0,
    compliantCount: 0,
    nonCompliantCount: 0,
    complianceRate: 100,
  });
  const [recentChecks, setRecentChecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({ q: '', compliance: '' });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const [statsRes, checksRes] = await Promise.all([
          spotCheckService.getSpotCheckStats().catch(() => ({ totalChecks: 0, compliantCount: 0, nonCompliantCount: 0, complianceRate: 100 })),
          spotCheckService.getSpotChecks({ page: 1, limit: 10 }).catch(() => ({ spotChecks: [] }))
        ]);
        setStats(statsRes);
        setRecentChecks(checksRes?.spotChecks || []);
      } catch (err) {
        console.error("Failed to load spot checks dashboard", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const filteredDeepDive = recentChecks.filter(r => {
    if (filter.q && !(r.spotCheckRef + ' ' + (r.activityName || '') + ' ' + (r.location || '')).toLowerCase().includes(filter.q.toLowerCase())) return false;
    if (filter.compliance && r.chk3_2 !== filter.compliance) return false;
    return true;
  });

  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const rawRole = (localStorage.getItem("UserType") || currentUser?.role || currentUser?.userType || currentUser?.user_type || "").toUpperCase();
  const userRolesArr = Array.isArray(currentUser?.userTypes) ? currentUser.userTypes.map((t) => String(t).toUpperCase()) : [];
  const allRoles = [rawRole, ...userRolesArr].join(" ");
  const isContractor = allRoles.includes("CONTRACTOR") || allRoles.includes("SUBCONTRACTOR") || Boolean(currentUser?.subcontractor_id) || Boolean(currentUser?.contractorId) || Boolean(currentUser?.typeId && allRoles.includes("SUBCONTRACTOR"));
  const isObserver = allRoles.includes("OBSERVER");
  const isReadOnly = isContractor || isObserver;

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
          {!isReadOnly && (
            <button className="mod-btn-primary" onClick={() => navigate("/spot-checks/create")}>+ New Spot Check</button>
          )}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="dash-kpis">
        <StatCard label="Total Checks" value={stats.totalChecks || 0} accent="#583C66" valColor="#583C66" icon="layers" sub="all recorded spot checks" />
        <StatCard label="Compliance Rate" value={`${stats.complianceRate || 100}%`} accent="#7BBE97" valColor="#7BBE97" icon="activity" sub="overall pass rate" />
        <StatCard label="Compliant (Pass)" value={stats.compliantCount || 0} accent="#14B8A6" valColor="#14B8A6" icon="eye" sub="passed audits" />
        <StatCard label="Non-Compliant" value={stats.nonCompliantCount || 0} accent="#E32B50" valColor="#E32B50" icon="target" sub="requiring corrective action" />
        <StatCard label="Active Permitted" value={stats.totalChecks || 0} accent="#F97316" valColor="#F97316" icon="calendar" sub="verified PTWs" />
        <StatCard label="Recent Period" value={recentChecks.length} accent="#8A8F9F" icon="clock" sub="latest inspections" />
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
