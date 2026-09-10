import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SIDashboard.css"; // Reuse dashboard CSS for basic styling and table layout

const MOCK_INSPECTIONS = [
  { id: "SI301", status: "Completed", level: "MR - GROUND", room: "", modifiedBy: "Belinda Bell, Nov...", dateModified: "8 Sep 2026, 11:58" },
  { id: "SI300", status: "Completed", level: "", room: "", modifiedBy: "Kim Mulvad, Nov...", dateModified: "4 Sep 2026, 11:05" },
  { id: "SI299", status: "Completed", level: "GROUND FLOOR", room: "", modifiedBy: "Petr Vaberer, Nov...", dateModified: "2 Sep 2026, 08:37" },
  { id: "SI298", status: "Completed", level: "", room: "", modifiedBy: "John Sejling, Nov...", dateModified: "1 Sep 2026, 11:11" },
  { id: "SI297", status: "Completed", level: "", room: "", modifiedBy: "Trine Sandberg-C...", dateModified: "28 Aug 2026, 15:47" },
  { id: "SI296", status: "Completed", level: "GROUND FLOOR", room: "", modifiedBy: "Petr Vaberer, Nov...", dateModified: "26 Aug 2026, 17:31" },
  { id: "SI295", status: "Completed", level: "", room: "", modifiedBy: "Kim Mulvad, Nov...", dateModified: "25 Aug 2026, 10:15" },
  { id: "SI294", status: "Completed", level: "", room: "", modifiedBy: "Trine Sandberg-C...", dateModified: "21 Aug 2026, 12:11" },
  { id: "SI293", status: "Completed", level: "", room: "", modifiedBy: "Kim Mulvad, Nov...", dateModified: "19 Aug 2026, 14:25" },
  { id: "SI292", status: "Completed", level: "", room: "", modifiedBy: "Trine Sandberg-C...", dateModified: "19 Aug 2026, 10:14" },
  { id: "SI291", status: "Completed", level: "GROUND FLOOR", room: "", modifiedBy: "Petr Vaberer, Nov...", dateModified: "19 Aug 2026, 09:18" },
  { id: "SI290", status: "Completed", level: "GROUND FLOOR", room: "", modifiedBy: "Petr Vaberer, Nov...", dateModified: "12 Aug 2026, 08:29" },
  { id: "SI289", status: "Completed", level: "", room: "", modifiedBy: "Kim Mulvad, Nov...", dateModified: "11 Aug 2026, 13:21" },
  { id: "SI288", status: "Completed", level: "", room: "", modifiedBy: "Belinda Bell, Nov...", dateModified: "7 Aug 2026, 09:14" },
  { id: "SI287", status: "Completed", level: "020_Grou...", room: "Atrium S.6...", modifiedBy: "Michal Wiekiera,...", dateModified: "5 Aug 2026, 09:15" }
];

export default function SIList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState({ q: '', contractor: '', status: '' });
  
  const filteredList = MOCK_INSPECTIONS.filter(r => {
    if (filter.q && !(r.id + ' ' + r.type).toLowerCase().includes(filter.q.toLowerCase())) return false;
    if (filter.contractor && r.contractor !== filter.contractor) return false;
    if (filter.status && r.status !== filter.status) return false;
    return true;
  });

  return (
    <div className="si-dashboard-container">
      <div className="dash-hero">
        <div className="dash-hero-l">
          <div>
            <h1>Safety Inspections List</h1>
            <p>View all safety inspections and their current status</p>
          </div>
        </div>
        <div>
          <button className="mod-btn-primary" onClick={() => navigate("/safety-inspection/create")}>+ New Inspection</button>
        </div>
      </div>

      <div className="panel dash-tablecard">
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
                <th>No.</th>
                <th>Status</th>
                <th>Level</th>
                <th>Room</th>
                <th>Modified by</th>
                <th>↓ Date modified</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(r => {
                return (
                  <tr key={r.id} onClick={() => navigate(`/safety-inspection/${r.id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ display: 'flex', alignItems: 'center' }}><span style={{ background: '#22c55e', width: '10px', height: '10px', display: 'inline-block', borderRadius: '50%', marginRight: '8px' }}></span><span style={{ color: '#0ea5e9' }}>{r.id}</span></td>
                    <td>{r.status}</td>
                    <td>{r.level}</td>
                    <td>{r.room}</td>
                    <td>{r.modifiedBy}</td>
                    <td>{r.dateModified}</td>
                  </tr>
                );
              })}
              {filteredList.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No inspections match the filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
