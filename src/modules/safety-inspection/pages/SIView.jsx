import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import "./SIView.css";

const MOCK_DATA = {
  project: 'M3 JG (Fermentation)',
  projectNo: '063205-010',
  createdBy: 'Petr Vaberer, Novo Nordisk A/S',
  created: '26 Aug 2026, 18:43',
  modifiedBy: 'Trine Sandberg-Christensen, Novo Nordisk A/S',
  modified: '28 Aug 2026, 15:47',
  status: 'Completed',
  date: '26-08-2026',
  performedBy: [
    'Trine Sandberg-Christensen (Novo Nordisk A/S)',
    'Petr Vaberer (Novo Nordisk A/S)'
  ],
  participants: [
    'Oliver O\'Neill (STS)',
    'Albert Glowniak (Multi-Tech)',
    'Tor Busch Nielsen (Zeta)',
    'Marko Rondic (MSL Engineering Ltd.)',
    'Ali Khairandesh (Allan Ploug A/S)',
    'Charles Luedtke (NNE A/S)',
    'Ramiro Sancheira Borges (NNE A/S)',
    'Kenneth Weigand (SKEL.DK LANDINSPEKTØRER P/S)'
  ]
};

const CHECKLIST_DATA = [
  { id: 1, title: '1. Access/Exit/Walkway', status: 'na' },
  { id: 2, title: '2. Barriers/Signage/Shielding', status: 'yellow', commentAuthor: 'Changed by Trine Sandberg-Christensen, Novo Nordisk A/S, 28 Aug 2026, 13:30', issues: [
      { id: 'SI4695', type: 'orange', text: '2. Barriers/Signage/Shielding' },
      { id: 'SI4696', type: 'green', text: '2. Barriers/Signage/Shielding' },
      { id: 'SI4697', type: 'orange', text: '2. Barriers/Signage/Shielding' },
      { id: 'SI4717', type: 'green', text: '2. Barriers/Signage/Shielding' },
      { id: 'SI4719', type: 'green', text: '2. Barriers/Signage/Shielding' },
      { id: 'SI4720', type: 'green', text: '2. Barriers/Signage/Shielding' },
      { id: 'SI4721', type: 'orange', text: '2. Barriers/Signage/Shielding' },
      { id: 'SI4723', type: 'orange', text: '2. Barriers/Signage/Shielding' },
    ],
    images: ['https://images.unsplash.com/photo-1541888086225-ee50be1e62c2?w=800&q=80', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80']
  },
  { id: 3, title: '3. Housekeeping/Waste', status: 'yellow', commentAuthor: 'Changed by Petr Vaberer, Novo Nordisk A/S, 26 Aug 2026, 18:43', issues: [{ id: 'SI4703', type: 'orange', text: '3. Housekeeping/Waste' }] },
  { id: 4, title: '4. Noise/Dust/fumes/and health hazards', status: 'yellow', commentAuthor: 'Changed by Petr Vaberer, Novo Nordisk A/S, 26 Aug 2026, 18:43', issues: [{ id: 'SI4702', type: 'orange', text: '4. Noise/Dust/fumes/and health hazards' }] },
  { id: 5, title: '5. Storage and Handling of Materials', status: 'yellow', commentAuthor: 'Changed by Petr Vaberer, Novo Nordisk A/S, 26 Aug 2026, 18:43', issues: [
      { id: 'SI4693', type: 'green', text: '5. Storage and Handling of Materials' },
      { id: 'SI4698', type: 'green', text: '5. Storage and Handling of Materials' },
      { id: 'SI4700', type: 'green', text: '5. Storage and Handling of Materials' },
      { id: 'SI4704', type: 'orange', text: '5. Storage and Handling of Materials' }
    ] },
  { id: 6, title: '6. Electrical Hazards', status: 'na' },
  { id: 7, title: '7. Working at heights', status: 'red', commentAuthor: 'Changed by Petr Vaberer, Novo Nordisk A/S, 26 Aug 2026, 18:43', issues: [{ id: 'SI4699', type: 'green', text: '7. Working at heights' }] },
  { id: 8, title: '8. Lifting/Rigging', status: 'na' },
  { id: 9, title: '9. Hot Works', status: 'na' },
  { id: 10, title: '10. Mobile Elevating Work Equipment', status: 'na' },
  { id: 11, title: '11. Lighting', status: 'na', comment: 'Orientation lighting (25lux) on good level across the building!', commentAuthor: 'Changed by Petr Vaberer, Novo Nordisk A/S, 26 Aug 2026, 18:43', issues: [
    { id: 'SI4694', type: 'green', text: '11. Lighting' },
    { id: 'GP362', type: 'green', text: '11. Lighting' }
  ] },
  { id: 12, title: '12. Documentation and Procedures', status: 'na' },
  { id: 13, title: '13. Scaffold / Alloy Towers', status: 'red', commentAuthor: 'Changed by Petr Vaberer, Novo Nordisk A/S, 26 Aug 2026, 18:43', issues: [
    { id: 'SI4701', type: 'orange', text: '13. Scaffold / Alloy Towers' },
    { id: 'SI4716', type: 'orange', text: '13. Scaffold / Alloy Towers' }
  ] },
  { id: 14, title: '14. Slip/Trip Hazard', status: 'na' },
  { id: 15, title: '15. Personal Protective Equipment', status: 'na' },
  { id: 16, title: '16. Use of tools and machinery / technical aid', status: 'na' },
  { id: 17, title: '17. Environmental Hazards', status: 'na' },
  { id: 18, title: '18. Emergency Equipment', status: 'green', comment: 'Two first aid stations placed close to each other due to ongoing work in the area. On the day of the inspection, the escape route drawing had been updated to show the approximate locations of the stations.', commentAuthor: 'Changed by Trine Sandberg-Christensen, Novo Nordisk A/S, 28 Aug 2026, 13:30', issues: [
    { id: 'GP361', type: 'green', text: '18. Emergency Equipment' }
  ], images: ['https://images.unsplash.com/photo-1541888086225-ee50be1e62c2?w=800&q=80'] }
];

export default function SIView() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="siview-page">
      {/* Premium Hero Header Card */}
      <div className="siview-hero-card">
        <div className="siview-hero-content">
          <div className="siview-hero-icon">
            <i className="ti ti-shield-check"></i>
          </div>
          <div className="siview-hero-text">
            <div className="siview-hero-subtitle">SAFETY INSPECTION</div>
            <h1>Record <span>{id}</span></h1>
            <p>Detailed view of the completed safety inspection report.</p>
          </div>
        </div>
        <div className="siview-hero-actions">
          <button className="siview-btn-back" onClick={() => navigate('/safety-inspection/list')}>
            <i className="ti ti-arrow-left"></i> Back to List
          </button>
          <button className="siview-btn-download">
            <i className="ti ti-download"></i> Download Report
          </button>
        </div>
      </div>
      
      <div className="siview-content">
        {/* Modern Card-based Metadata Layout */}
        <div className="siview-metadata-grid">
          
          <div className="siview-card meta-card">
            <div className="meta-card-header">
              <i className="ti ti-briefcase"></i> Project Details
            </div>
            <div className="meta-card-body">
              <div className="meta-item">
                <span className="meta-label">Project</span>
                <span className="meta-value">{MOCK_DATA.project}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Project No.</span>
                <span className="meta-value">{MOCK_DATA.projectNo}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Inspection Date</span>
                <span className="meta-value">{MOCK_DATA.date}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Status</span>
                <span className="meta-badge status-completed">{MOCK_DATA.status}</span>
              </div>
            </div>
          </div>

          <div className="siview-card meta-card">
            <div className="meta-card-header">
              <i className="ti ti-clock"></i> Timeline & Activity
            </div>
            <div className="meta-card-body">
              <div className="meta-item">
                <span className="meta-label">Created By</span>
                <span className="meta-value">{MOCK_DATA.createdBy}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Created Date</span>
                <span className="meta-value">{MOCK_DATA.created}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Last Modified By</span>
                <span className="meta-value">{MOCK_DATA.modifiedBy}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Modified Date</span>
                <span className="meta-value">{MOCK_DATA.modified}</span>
              </div>
            </div>
          </div>

          <div className="siview-card meta-card span-full">
            <div className="meta-card-header">
              <i className="ti ti-users"></i> Personnel & Participants
            </div>
            <div className="meta-card-body grid-2-col">
              <div className="meta-list-group">
                <span className="meta-label">Performed By</span>
                <ul className="meta-ul">
                  {MOCK_DATA.performedBy.map((p, i) => <li key={i}><i className="ti ti-user-check"></i> {p}</li>)}
                </ul>
              </div>
              <div className="meta-list-group">
                <span className="meta-label">Participants</span>
                <ul className="meta-ul">
                  {MOCK_DATA.participants.map((p, i) => <li key={i}><i className="ti ti-user"></i> {p}</li>)}
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Modern Elevated Checklist Rows */}
        <div className="siview-section-title">
          <h2>Inspection Checklist Details</h2>
        </div>

        <div className="siview-checklist-wrapper">
          {CHECKLIST_DATA.map(item => (
            <div key={item.id} className="siview-cl-card">
              <div className="siview-cl-header">
                <div className="siview-cl-title-wrap">
                  <div className="siview-cl-title">{item.title}</div>
                  {item.comment && <div className="siview-cl-comment">{item.comment}</div>}
                  {item.commentAuthor && <div className="siview-cl-author">{item.commentAuthor}</div>}
                </div>
                <div className="siview-cl-status-wrap">
                  <span className={`siview-badge badge-${item.status}`}>
                    {item.status === 'na' ? 'Not Applicable' : 
                     item.status === 'green' ? 'Passed' : 
                     item.status === 'yellow' ? 'Minor Issue' : 
                     item.status === 'orange' ? 'Major Issue' : 
                     item.status === 'red' ? 'Critical Action Needed' : item.status}
                  </span>
                </div>
              </div>

              {(item.issues || item.images) && (
                <div className="siview-cl-details">
                  {item.issues && (
                    <div className="siview-cl-issues">
                      {item.issues.map((iss, i) => (
                        <div key={i} className="siview-issue-tag">
                          <span className={`issue-dot issue-${iss.type}`}></span>
                          <span className="issue-id">{iss.id}</span>
                          <span className="issue-text">{iss.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.images && (
                    <div className="siview-cl-images">
                      {item.images.map((img, i) => (
                        <div key={i} className="siview-img-thumbnail">
                          <img src={img} alt="attachment" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
