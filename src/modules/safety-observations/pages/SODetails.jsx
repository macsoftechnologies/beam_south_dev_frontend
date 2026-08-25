import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { OBSERVATIONS } from "../data/observations";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import "../../../styles/module-shared.css";

function SODetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [obs, setObs] = useState(OBSERVATIONS.find(o => o.id === id) || OBSERVATIONS[0]);
  const [showEscalate, setShowEscalate] = useState(false);
  const [escForm, setEscForm] = useState({ class: "Near Miss", actual: 2, potential: 4, reason: "" });

  const isPositive = obs.obsType === "Positive";

  const handleEscalate = () => {
    if(!escForm.reason) { alert("Please provide a reason."); return; }
    alert(`Escalated to Incident! Heads-Up Notification started.`);
    setObs(prev => ({ ...prev, status: "escalated", linked: "INC-2026-049" }));
    setShowEscalate(false);
  };

  return (
    <div className="mod-page">
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => navigate("/safety-observations/list")} style={{ background: "none", border: "none", color: "var(--nne-brand-blue)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 14, padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg> Back to Observations
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, fontSize: 13, background: "var(--bg-card)", padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border-color)", width: "fit-content" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--nne-brand-blue)", fontWeight: 600 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/></svg>
          {obs.id}
        </div>
        {obs.linked && (
          <>
            <span style={{ color: "var(--text-muted)" }}>â†’</span>
            <span style={{ color: "var(--nne-brand-red)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate(`/incident-management/details/${obs.linked}`)}>
              {obs.linked}
            </span>
          </>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "var(--text-muted)" }}>{obs.id}</span>
            <span className={`badge ${obs.status === 'open' ? 'badge-orange' : obs.status === 'closed' ? 'badge-green' : 'badge-blue'}`}>{obs.status.toUpperCase()}</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "8px 0 0", color: "var(--text-main)" }}>{obs.subject}</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="mod-btn-outline" onClick={() => window.print()}>Export PDF</button>
          {!isPositive && obs.status !== "escalated" && obs.status !== "closed" && (
            <button className="mod-btn-primary" style={{ background: "#E32B50", borderColor: "#E32B50", color: "#fff" }} onClick={() => setShowEscalate(true)}>Escalate to Incident</button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div>
          <div className="mod-card mb-4">
            <div className="mod-card-header"><span className="mod-card-title">Observation Details</span></div>
            <div className="mod-card-body" style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "12px 16px", fontSize: 13 }}>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Subject</div><div>{obs.subject}</div>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Classification</div><div>{isPositive ? <span className="badge badge-green">Positive</span> : <span className="badge badge-red">Needs Attention</span>}</div>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Nature of finding</div><div>{obs.subClass}</div>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Risk level</div><div><span style={{ fontWeight: 700, color: obs.risk === 'High' ? '#E32B50' : obs.risk === 'Medium' ? '#C07D10' : 'var(--text-muted)' }}>{obs.risk}</span></div>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Safety Category</div><div>{obs.category}</div>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Created By</div><div>{obs.createdBy}</div>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Assignee</div><div>{obs.assignee || 'â€”'}</div>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Date Created</div><div>{obs.date}</div>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Contractor</div><div>{obs.contractor}</div>
            </div>
          </div>

          <div className="mod-card mb-4">
            <div className="mod-card-header"><span className="mod-card-title">Location</span></div>
            <div className="mod-card-body" style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "12px 16px", fontSize: 13 }}>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Project</div><div>{obs.project === 'm3-south' ? 'M3 South' : obs.project === 'm3-north' ? 'M3 North' : 'M3 Infrastructure'}</div>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Building</div><div>{obs.building || 'â€”'}</div>
              <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Location detail</div><div>{obs.location}</div>
            </div>
          </div>

          <div className="mod-card mb-4">
            <div className="mod-card-header"><span className="mod-card-title">Description</span></div>
            <div className="mod-card-body" style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-main)" }}>
              {obs.description}
            </div>
          </div>
        </div>

        <div>
          <div className="mod-card mb-4">
            <div className="mod-card-header"><span className="mod-card-title">Key Information</span></div>
            <div className="mod-card-body" style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 13 }}>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Tracking ID</div><div style={{ fontFamily: "monospace" }}>{obs.id}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Submitted</div><div>{obs.date}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Escalated</div><div>{obs.linked ? <span style={{ color: "var(--nne-brand-red)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate(`/incident-management/details/${obs.linked}`)}>{obs.linked}</span> : 'No'}</div></div>
            </div>
          </div>

          <div className="mod-card mb-4">
            <div className="mod-card-header"><span className="mod-card-title">Photos</span></div>
            <div className="mod-card-body">
              {obs.photo ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ height: 80, background: "var(--bg-dark)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>Photo 1</div>
                  <div style={{ height: 80, background: "var(--bg-dark)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>Photo 2</div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>No photos attached.</div>
              )}
            </div>
          </div>

          <div className="mod-card mb-4">
            <div className="mod-card-header"><span className="mod-card-title">Audit Trail</span></div>
            <div className="mod-card-body" style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--nne-brand-blue)", marginTop: 4, flexShrink: 0 }}></div>
                <div><b>Observation created</b> by {obs.createdBy}<br/><span style={{ color: "var(--text-muted)", fontSize: 11 }}>{obs.date}</span></div>
              </div>
              {obs.assignee && (
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C49F85", marginTop: 4, flexShrink: 0 }}></div>
                  <div><b>Assigned to</b> {obs.assignee}<br/><span style={{ color: "var(--text-muted)", fontSize: 11 }}>{obs.date}</span></div>
                </div>
              )}
              {obs.linked && (
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--nne-brand-red)", marginTop: 4, flexShrink: 0 }}></div>
                  <div><b>Escalated to Incident</b> {obs.linked}<br/><span style={{ color: "var(--text-muted)", fontSize: 11 }}>{obs.date}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEscalate && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: 560, borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 18, color: "var(--text-main)" }}>Escalate to Incident</h2>
              <button onClick={() => setShowEscalate(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, lineHeight: 1, color: "var(--text-muted)" }}>&times;</button>
            </div>
            <div style={{ padding: 24, overflowY: "auto" }}>
              <div style={{ background: "rgba(227,43,80,0.06)", border: "1px solid rgba(227,43,80,0.25)", color: "#E32B50", padding: 12, borderRadius: 8, fontSize: 13, display: "flex", gap: 10, marginBottom: 20 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                This observation will be raised as a formal incident and enter the investigation flow (Heads-Up â†’ Initial Report â†’ Investigation Report). The tracking chain is maintained.
              </div>
              
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--nne-brand-blue)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--border-color)" }}>Classification (Heads-Up)</div>
              <div className="mod-form-group">
                <label className="mod-form-label">Incident Classification <span style={{ color: "#E32B50" }}>*</span></label>
                <select className="mod-form-select" value={escForm.class} onChange={e => setEscForm({...escForm, class: e.target.value})}>
                  {['Near Miss', 'No Treatment Injury', 'First Aid Injury', 'Environmental Incident', 'Property Damage', 'Lost Time Injury (LTI)'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--nne-brand-blue)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--border-color)", marginTop: 20 }}>Severity Assessment (1-5)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="mod-form-group">
                  <label className="mod-form-label">Actual severity <span style={{ color: "#E32B50" }}>*</span></label>
                  <select className="mod-form-select" value={escForm.actual} onChange={e => setEscForm({...escForm, actual: parseInt(e.target.value)})}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} - {['Insignificant','Minor','Moderate','Critical','Catastrophic'][n-1]}</option>)}
                  </select>
                </div>
                <div className="mod-form-group">
                  <label className="mod-form-label">Potential severity <span style={{ color: "#E32B50" }}>*</span></label>
                  <select className="mod-form-select" value={escForm.potential} onChange={e => setEscForm({...escForm, potential: parseInt(e.target.value)})}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} - {['Insignificant','Minor','Moderate','Critical','Catastrophic'][n-1]}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ background: "rgba(19,30,64,0.04)", border: "1px solid var(--border-color)", borderRadius: 9, padding: "10px 13px", marginBottom: 14, fontSize: 12.5 }}>
                <span><b>HiPo:</b> <span style={{ color: escForm.potential === 5 && escForm.actual <= 4 ? '#E32B50' : 'inherit', fontWeight: escForm.potential === 5 && escForm.actual <= 4 ? 700 : 400 }}>{escForm.potential === 5 && escForm.actual <= 4 ? 'Yes (High Potential)' : 'No'}</span></span>
                <span style={{ marginLeft: 16 }}><b>Investigation:</b> <span>{escForm.potential === 5 ? 'L3' : escForm.potential >= 3 ? 'L2' : 'L1'}</span></span>
              </div>

              <div className="mod-form-group" style={{ marginTop: 20 }}>
                <label className="mod-form-label">Reason for Escalation <span style={{ color: "#E32B50" }}>*</span></label>
                <textarea className="mod-form-textarea" rows="2" value={escForm.reason} onChange={e => setEscForm({...escForm, reason: e.target.value})} placeholder="Why should this observation be raised as an incident?"></textarea>
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: 12, background: "var(--bg-light)" }}>
              <button className="mod-btn-outline" onClick={() => setShowEscalate(false)}>Cancel</button>
              <button className="mod-btn-primary" style={{ background: "#E32B50", borderColor: "#E32B50", color: "#fff" }} onClick={handleEscalate}>Confirm & Raise Incident</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SODetails;

