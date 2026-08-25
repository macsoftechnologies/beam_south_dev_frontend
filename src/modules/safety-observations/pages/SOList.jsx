import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import { OBSERVATIONS, SAFETY_CATEGORIES, SO_STATS } from "../data/observations";
import "../../../styles/module-shared.css";

const BarChartIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#131E40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>;
const ShieldIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D7A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>;
const AlertIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E32B50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>;
const CalIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C07D10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;

const Trend = ({ val, up }) => (
  <div style={{ fontSize: 11, marginTop: 7, fontWeight: 600, color: up ? "#2D7A4F" : "#E32B50" }}>
    {up ? 'â†—' : 'â†˜'} {val > 0 ? '+' : ''}{val}% vs last wk
  </div>
);

function SOList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterContractor, setFilterContractor] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterTime, setFilterTime] = useState("all");

  const uniqueContractors = useMemo(() => [...new Set(OBSERVATIONS.map(o => o.contractor).filter(Boolean))], []);
  const uniqueLocations = useMemo(() => [...new Set(OBSERVATIONS.map(o => o.location).filter(Boolean))], []);

  const positive = OBSERVATIONS.filter(o => o.obsType === "Positive").length;
  const needsAttn = OBSERVATIONS.length - positive;
  const posRatio = Math.round((positive / OBSERVATIONS.length) * 100) || 0;

  const filtered = useMemo(() => {
    return OBSERVATIONS.filter(o => {
      if (filterType && o.obsType !== filterType) return false;
      if (filterCategory && o.category !== filterCategory) return false;
      if (filterContractor && o.contractor !== filterContractor) return false;
      if (filterLocation && o.location !== filterLocation) return false;
      if (searchTerm && !(o.id + o.subject + o.category + o.description).toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [filterType, filterCategory, filterContractor, filterLocation, searchTerm]);

  return (
    <div className="mod-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--nne-brand-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--nne-brand-blue)", margin: 0 }}>Safety Observations</h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>Track and manage safety observations across the site</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="mod-btn-outline" onClick={() => window.print()}>Print</button>
          <button className="mod-btn-primary" onClick={() => navigate("/safety-observations/create")}>+ New Observation</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 20 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "15px 16px", position: "relative" }}>
          <div style={{ position: "absolute", top: 14, right: 14, opacity: 0.85 }}><BarChartIcon /></div>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Total</div>
          <div style={{ fontSize: 27, fontWeight: 700, marginTop: 6, color: "#131E40" }}>{OBSERVATIONS.length}</div>
          <Trend val={12} up={true} />
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "15px 16px", position: "relative" }}>
          <div style={{ position: "absolute", top: 14, right: 14, opacity: 0.85 }}><ShieldIcon /></div>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Positive</div>
          <div style={{ fontSize: 27, fontWeight: 700, marginTop: 6, color: "#2D7A4F" }}>{positive}</div>
          <Trend val={4} up={true} />
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid #E32B50", boxShadow: "0 0 0 1px rgba(227,43,80,0.35)", borderRadius: 10, padding: "15px 16px", position: "relative" }}>
          <div style={{ position: "absolute", top: 14, right: 14, opacity: 0.85 }}><AlertIcon /></div>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Needs Attention</div>
          <div style={{ fontSize: 27, fontWeight: 700, marginTop: 6, color: "#E32B50" }}>{needsAttn}</div>
          <Trend val={-2} up={false} />
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "15px 16px", position: "relative" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Positive Ratio</div>
          <div style={{ fontSize: 27, fontWeight: 700, marginTop: 6, color: "#C07D10" }}>{posRatio}%</div>
          <div style={{ height: 7, background: "#eef0f3", borderRadius: 5, marginTop: 9 }}><div style={{ height: "100%", background: "#C07D10", borderRadius: 5, width: `${posRatio}%` }}></div></div>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "15px 16px", position: "relative" }}>
          <div style={{ position: "absolute", top: 14, right: 14, opacity: 0.85 }}><CalIcon /></div>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>This Week</div>
          <div style={{ fontSize: 27, fontWeight: 700, marginTop: 6, color: "#C07D10" }}>2</div>
          <Trend val={0} up={true} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div className="mod-card">
          <div className="mod-card-header"><span className="mod-card-title">Positive vs Needs Attention Ratio</span></div>
          <div className="mod-card-body">
            <div style={{ display: "flex", height: 34, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: `${posRatio}%`, background: "#7BBE97", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{positive}</div>
              <div style={{ width: `${100 - posRatio}%`, background: "#E32B50", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{needsAttn}</div>
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: 12.5, color: "var(--text-muted)" }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#7BBE97", marginRight: 6 }}></span>Positive {positive} ({posRatio}%)</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#E32B50", marginRight: 6 }}></span>Needs Attention {needsAttn} ({100 - posRatio}%)</span>
            </div>
          </div>
        </div>
        <div className="mod-card">
          <div className="mod-card-header"><span className="mod-card-title">Top Categories</span></div>
          <div className="mod-card-body">
            {[
              { name: "Working at Heights", count: 12, col: "#131E40" },
              { name: "Housekeeping", count: 8, col: "#C49F85" },
              { name: "Lifting Operations", count: 5, col: "#583C66" }
            ].map(c => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                <span style={{ width: 150, fontSize: 12, color: "var(--text-muted)" }}>{c.name}</span>
                <span style={{ flex: 1, height: 10, background: "#eef0f3", borderRadius: 5, overflow: "hidden" }}><span style={{ display: "block", height: "100%", borderRadius: 5, background: c.col, width: `${(c.count/12)*100}%` }}></span></span>
                <span style={{ width: 26, textAlign: "right", fontSize: 12, fontWeight: 700 }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input type="text" className="mod-form-input" placeholder="Search ref, description, category..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <select className="mod-form-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 150 }}>
          <option value="">All Types</option>
          <option value="Positive">Positive</option>
          <option value="Needs Attention">Needs Attention</option>
        </select>
        <select className="mod-form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ width: 180 }}>
          <option value="">All Categories</option>
          {SAFETY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="mod-form-select" value={filterContractor} onChange={e => setFilterContractor(e.target.value)} style={{ width: 150 }}>
          <option value="">All Contractors</option>
          {uniqueContractors.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="mod-form-select" value={filterLocation} onChange={e => setFilterLocation(e.target.value)} style={{ width: 150 }}>
          <option value="">All Locations</option>
          {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="mod-form-select" value={filterTime} onChange={e => setFilterTime(e.target.value)} style={{ width: 120 }}>
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      <div className="mod-card">
        <div className="mod-table-wrap">
          <table className="mod-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Date</th>
                <th>Type</th>
                <th>Nature</th>
                <th>Contractor</th>
                <th>Category</th>
                <th>Risk</th>
                <th>Location</th>
                <th>Description</th>
                <th>Reporter</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} onClick={() => navigate(`/safety-observations/details/${o.id}`)} style={{ cursor: "pointer" }}>
                  <td>{o.id}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{o.date}</td>
                  <td>
                    {o.obsType === 'Needs Attention' ? (
                      <span className="badge badge-red">Needs Attention</span>
                    ) : (
                      <span className="badge badge-green">Positive</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{o.subClass}</td>
                  <td>{o.contractor}</td>
                  <td>{o.category}</td>
                  <td>
                    <span style={{ 
                      fontWeight: 700, 
                      color: o.risk === 'High' || o.risk === 'Very high' ? '#E32B50' : 
                             o.risk === 'Medium' ? '#C07D10' : 
                             o.risk === 'Low' || o.risk === 'Very low' ? '#2D7A4F' : 'var(--text-muted)' 
                    }}>
                      {o.risk}
                    </span>
                  </td>
                  <td>{o.location}</td>
                  <td style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={o.description}>{o.description}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{o.createdBy}</td>
                  <td>
                    <button className="mod-btn-outline" style={{ padding: "4px 8px", fontSize: 12 }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default SOList;

