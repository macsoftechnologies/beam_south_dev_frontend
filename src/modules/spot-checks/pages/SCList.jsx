import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SCDashboard.css"; // Reuse dashboard CSS for basic styling and table layout

const MOCK_CHECKS = [
  { id: "SC-2026-101", location: "Zone A", type: "PPE Check", result: "PASS", date: "2026-09-09", inspector: "John Doe" },
  { id: "SC-2026-102", location: "Zone B", type: "Scaffolding", result: "FAIL", date: "2026-09-09", inspector: "Jane Smith" },
  { id: "SC-2026-103", location: "Zone C", type: "Electrical", result: "PASS", date: "2026-09-08", inspector: "Mike Johnson" },
  { id: "SC-2026-104", location: "Zone A", type: "Housekeeping", result: "PASS", date: "2026-09-08", inspector: "John Doe" },
  { id: "SC-2026-105", location: "Zone D", type: "PPE Check", result: "WARNING", date: "2026-09-07", inspector: "Jane Smith" }
];

export default function SCList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState({ q: '', location: '', result: '' });
  
  const filteredList = MOCK_CHECKS.filter(r => {
    if (filter.q && !(r.id + ' ' + r.type).toLowerCase().includes(filter.q.toLowerCase())) return false;
    if (filter.location && r.location !== filter.location) return false;
    if (filter.result && r.result !== filter.result) return false;
    return true;
  });

  return (
    <div className="sc-dashboard-container">
      <div className="dash-hero">
        <div className="dash-hero-l">
          <div>
            <h1>Spot Checks List</h1>
            <p>View all spot checks and their compliance results</p>
          </div>
        </div>
        <div>
          <button className="mod-btn-primary">+ New Spot Check</button>
        </div>
      </div>

      <div className="panel dash-tablecard">
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
              {filteredList.map(r => {
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
              {filteredList.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No checks match the filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
