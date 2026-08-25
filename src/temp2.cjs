const fs = require('fs');
const file = 'd:/Projects/React/Beam/Development/Beam2.o_South_Incidents/src/modules/incident-management/pages/IMDetails.jsx';
let content = fs.readFileSync(file, 'utf8');

// Uppercase Reviewer Name and Digital Signature labels
content = content.replace(/<label className="mod-form-label">Reviewer Name<\/label>/g, '<label className="mod-form-label" style={{ textTransform: "uppercase" }}>Reviewer Name</label>');
content = content.replace(/<label className="mod-form-label">Digital Signature<\/label>/g, '<label className="mod-form-label" style={{ textTransform: "uppercase" }}>Digital Signature</label>');

// Add approved state block for initialReport
let initialReportReview = `                {initialReportApproved && (
                <div className="mod-card mb-4" style={{ marginTop: 24 }}>
                  <div className="mod-card-header">
                    <span className="mod-card-title">Review & Sign-Off: Initial Incident Report {incident.id}</span>
                    <span className="inv-chip chip-approved">APPROVED</span>
                  </div>
                  <div className="mod-card-body">
                    <div style={{ padding: "16px", background: "rgba(123,190,151,0.1)", border: "1px solid rgba(123,190,151,0.5)", borderRadius: "8px", color: "#2D7A4F", marginBottom: "16px" }}>
                      The Initial Incident Report has been approved. The Investigation Report has been unlocked.
                    </div>
                    <div style={{ padding: "16px", border: "1px solid var(--border-color)", borderRadius: "8px", display: "flex", gap: "16px", alignItems: "center" }}>
                      <div style={{ width: 120, height: 40, border: "1px solid var(--border-color)", borderRadius: 5, background: "#f8fafc" }}>
                        <svg width="100%" height="100%" viewBox="0 0 500 120" preserveAspectRatio="none">
                          <path d="M50,80 Q100,20 150,60 T250,80 T350,40 T450,70" fill="none" stroke="#0f172a" strokeWidth="3" />
                        </svg>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-main)" }}>
                        <b style={{ color: "#2D7A4F" }}>Marked OK & signed by Reviewer</b><br/>
                        19/08/2026, 11:44
                      </div>
                    </div>
                  </div>
                </div>
                )}
                {!initialReportApproved && (`;

content = content.replace(/\{\!initialReportApproved && \(/, initialReportReview);

fs.writeFileSync(file, content, 'utf8');
console.log('Update complete');
