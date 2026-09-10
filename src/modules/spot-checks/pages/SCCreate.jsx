import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import "../../../styles/module-shared.css";
import "./SCDashboard.css";

const CreateIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
);

const SignaturePad = ({ value, onChange, onClear }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { 
      x: (clientX - rect.left) * scaleX, 
      y: (clientY - rect.top) * scaleY 
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    
    // Dynamically get the current text color based on the theme
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim();
    ctx.strokeStyle = themeColor || '#0f172a';
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault(); 
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      setIsDrawing(false);
      if (onChange && canvasRef.current) {
        onChange(canvasRef.current.toDataURL("image/png"));
      }
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onClear) onClear();
    if (onChange) onChange(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div 
        style={{ 
          position: "relative", 
          border: "1px dashed var(--border-color)", 
          borderRadius: 6, 
          height: 120, 
          background: "var(--bg-card)", 
          touchAction: "none", 
          overflow: "hidden" 
        }}
      >
        {!value && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "var(--text-muted)", pointerEvents: "none", fontSize: 14 }}>Draw your signature here</div>}
        <canvas 
          ref={canvasRef}
          width={800}
          height={120}
          style={{ width: "100%", height: "100%", cursor: "crosshair", display: "block" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
      <button 
        type="button" 
        style={{ alignSelf: "flex-start", color: "#e11d48", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: 0 }} 
        onClick={handleClear}
      >
        Clear signature
      </button>
    </div>
  );
};

export default function SCCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    workPackage: "Safety Internal - HSE Spot Check",
    spotCheckRef: "",
    date: "",
    time: "",
    location: "",
    weather: "",
    activityName: "",
    companyInvolved: "",
    permitId: "",
    ramsId: "",
    
    // PTW
    highRiskActivities: [],
    ifHotWork: "",
    chk1_2: "", chk1_3: "", chk1_4: "", chk1_5: "", chk1_6: "", chk1_7: "", chk1_8: "",
    
    // Communication
    chk2_1: "",
    briefingDate: "", briefingTime: "", conductedBy: "", participants: "",
    keyTopics: [], otherTopic: "",
    chk2_1_5: "",
    explainNoBriefing: "",
    
    // Summary
    chk3_2: "",
    safetyIssueCreated: "", safetyIssueRef: "",
    findings: "",
    correctiveActions: [{ action: "", responsible: "", dueDate: "", closed: false }],
    
    // Signatures
    foremanName: "", foremanCompany: "", foremanDate: "", foremanSignature: "",
    attachments: [{ desc: "", attached: "" }, { desc: "", attached: "" }, { desc: "", attached: "" }],
    inspectorName: "", inspectorCompany: "", inspectorDate: "", inspectorSignature: ""
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayToggle = (field, val) => {
    setForm(prev => {
      const arr = prev[field] || [];
      if (arr.includes(val)) return { ...prev, [field]: arr.filter(v => v !== val) };
      return { ...prev, [field]: [...arr, val] };
    });
  };

  const handleActionChange = (index, field, value) => {
    const actions = [...form.correctiveActions];
    actions[index][field] = value;
    setForm({ ...form, correctiveActions: actions });
  };

  const handleAttachmentChange = (index, field, value) => {
    const atts = [...form.attachments];
    atts[index][field] = value;
    setForm({ ...form, attachments: atts });
  };

  const highRiskOptions = [
    "Hot work", "Working on electrical systems", "Hazardous substances / chemicals",
    "Pressure testing of equipment", "Working at height", "Working in confined spaces",
    "Working in ATEX area", "Securing facilities (LOTO)", "Excavation works",
    "Using crane or lifting equipment", "N/A"
  ];
  
  const topicOptions = [
    "PPE", "Site hazards", "Task-specific risks", "Recent accidents",
    "Emergency procedures", "Permit To Work content", "Risk Assessment Method Statement content"
  ];

  const renderRadioGroup = (name) => (
    <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "4px" }}><input type="radio" name={name} value="Yes" onChange={handleChange} checked={form[name] === "Yes"} /> Yes</label>
      <label style={{ display: "flex", alignItems: "center", gap: "4px" }}><input type="radio" name={name} value="No" onChange={handleChange} checked={form[name] === "No"} /> No</label>
      <label style={{ display: "flex", alignItems: "center", gap: "4px" }}><input type="radio" name={name} value="N/A" onChange={handleChange} checked={form[name] === "N/A"} /> N/A</label>
    </div>
  );

  const renderYesNo = (name) => (
    <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "4px" }}><input type="radio" name={name} value="Yes" onChange={handleChange} checked={form[name] === "Yes"} /> Yes</label>
      <label style={{ display: "flex", alignItems: "center", gap: "4px" }}><input type="radio" name={name} value="No" onChange={handleChange} checked={form[name] === "No"} /> No</label>
    </div>
  );

  return (
    <div className="mod-page">
      <PageHeader
        title="Site HSE Spot Check"
        subtitle="Permit, controls and toolbox talk verification"
        icon={<CreateIcon />}
        breadcrumbs={[{ label: "Home" }, { label: "Spot Checks" }, { label: "New Spot Check" }]}
        actions={
          <button className="mod-btn-outline" onClick={() => navigate("/spot-checks/list")}>
            ← Back to List
          </button>
        }
      />

      <div className="mod-card" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* 0 | GENERAL INFORMATION */}
        <div className="mod-card-header" style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-color)", borderLeft: "4px solid var(--primary-color, #F97316)" }}>
          <h3 className="mod-card-title" style={{ margin: 0, color: "var(--text-main)", fontSize: "1.1rem", fontWeight: "700" }}>0 | GENERAL INFORMATION</h3>
        </div>
        <div className="mod-card-body" style={{ padding: "0" }}>
          <table className="sc-table">
            <tbody>
              <tr>
                <td className="sc-td-label">Work package</td>
                <td><input className="mod-form-input" name="workPackage" value={form.workPackage} onChange={handleChange} /></td>
                <td className="sc-td-label">Spot check ref.</td>
                <td><input className="mod-form-input" name="spotCheckRef" value={form.spotCheckRef} onChange={handleChange} /></td>
              </tr>
              <tr>
                <td className="sc-td-label">Date</td>
                <td><input type="date" className="mod-form-input" name="date" value={form.date} onChange={handleChange} /></td>
                <td className="sc-td-label">Time</td>
                <td><input type="time" className="mod-form-input" name="time" value={form.time} onChange={handleChange} /></td>
              </tr>
              <tr>
                <td className="sc-td-label">Location</td>
                <td><input className="mod-form-input" name="location" value={form.location} onChange={handleChange} /></td>
                <td className="sc-td-label">Weather conditions</td>
                <td><input className="mod-form-input" name="weather" value={form.weather} onChange={handleChange} /></td>
              </tr>
              <tr>
                <td className="sc-td-label">Activity / Task name</td>
                <td><input className="mod-form-input" name="activityName" value={form.activityName} onChange={handleChange} /></td>
                <td className="sc-td-label">Company involved</td>
                <td><input className="mod-form-input" name="companyInvolved" value={form.companyInvolved} onChange={handleChange} /></td>
              </tr>
              <tr>
                <td className="sc-td-label">Permit ID</td>
                <td><input className="mod-form-input" name="permitId" value={form.permitId} onChange={handleChange} /></td>
                <td className="sc-td-label">RAMS / SPA ID</td>
                <td><input className="mod-form-input" name="ramsId" value={form.ramsId} onChange={handleChange} /></td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)", backgroundColor: "var(--bg-card-hover)" }}>
            <b>Instructions:</b> Tick one response for each checkpoint. Use N/A only when the checkpoint does not apply. Record relevant facts in the comments field.
          </div>
        </div>

        {/* 1 | PERMIT TO WORK (PTW) */}
        <div className="mod-card-header" style={{ backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", marginTop: "32px", borderLeft: "4px solid var(--primary-color, #F97316)" }}>
          <h3 className="mod-card-title" style={{ margin: 0, color: "var(--text-main)", fontSize: "1.1rem", fontWeight: "700" }}>1 | PERMIT TO WORK (PTW)</h3>
        </div>
        <div className="mod-card-body" style={{ padding: "0" }}>
          <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-card-hover)", color: "var(--text-main)", fontWeight: "600", fontSize: "0.9rem", borderBottom: "1px solid var(--border-color)" }}>
            1.1 High-risk activities included
          </div>
          <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", borderBottom: "1px solid var(--border-color)" }}>
            {highRiskOptions.map(opt => (
              <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
                <input type="checkbox" checked={form.highRiskActivities.includes(opt)} onChange={() => handleArrayToggle("highRiskActivities", opt)} />
                {opt}
              </label>
            ))}
          </div>
          <div style={{ padding: "16px", display: "flex", gap: "24px", alignItems: "center", borderBottom: "1px solid var(--border-color)" }}>
            <span style={{ fontWeight: 600, width: "120px" }}>If Hot Work:</span>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="radio" name="ifHotWork" value="High Risk" onChange={handleChange} checked={form.ifHotWork === "High Risk"} /> High Risk - Open Flame
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="radio" name="ifHotWork" value="Low Risk" onChange={handleChange} checked={form.ifHotWork === "Low Risk"} /> Low Risk - Spark Spreading
            </label>
          </div>
          
          <table className="sc-table">
            <thead>
              <tr style={{ backgroundColor: "var(--bg-dark)" }}>
                <th style={{ width: "50px", textAlign: "center", color: "var(--text-main)" }}>No.</th>
                <th style={{ color: "var(--text-main)" }}>Checkpoint</th>
                <th style={{ width: "150px", textAlign: "center", color: "var(--text-main)" }}>Yes / No / N/A</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>1.2</td>
                <td>Does the description of work, including scope, location and times, match the work performed?</td>
                <td>{renderRadioGroup("chk1_2")}</td>
              </tr>
              <tr>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>1.3</td>
                <td>Are the PTW and RAMS valid for the work performed?</td>
                <td>{renderRadioGroup("chk1_3")}</td>
              </tr>
              <tr>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>1.4</td>
                <td>Are key risks controlled? Consider barriers, signage and whether controls are working as planned and coordinated.</td>
                <td>{renderRadioGroup("chk1_4")}</td>
              </tr>
              <tr>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>1.5</td>
                <td>Do workers know the emergency plan? Consider contact information, medical centre, alarm / muster arrangements and rescue / emergency arrangements.</td>
                <td>{renderRadioGroup("chk1_5")}</td>
              </tr>
              <tr>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>1.6</td>
                <td>Is correct task-specific PPE in use, in proper condition and worn properly?</td>
                <td>{renderRadioGroup("chk1_6")}</td>
              </tr>
              <tr>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>1.7</td>
                <td>Is supervision present? Is the responsible person named on the PTW overseeing the work?</td>
                <td>{renderRadioGroup("chk1_7")}</td>
              </tr>
              <tr>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>1.8</td>
                <td>Is the area orderly and safe? Consider clear access / egress, housekeeping and unblocked exits.</td>
                <td>{renderRadioGroup("chk1_8")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2 | COMMUNICATION / TOOLBOX TALK */}
        <div className="mod-card-header" style={{ backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", marginTop: "32px", borderLeft: "4px solid var(--primary-color, #F97316)" }}>
          <h3 className="mod-card-title" style={{ margin: 0, color: "var(--text-main)", fontSize: "1.1rem", fontWeight: "700" }}>2 | COMMUNICATION / TOOLBOX TALK</h3>
        </div>
        <div className="mod-card-body" style={{ padding: "0" }}>
          <table className="sc-table">
            <thead>
              <tr style={{ backgroundColor: "var(--bg-dark)" }}>
                <th style={{ width: "50px", textAlign: "center", color: "var(--text-main)" }}>No.</th>
                <th style={{ color: "var(--text-main)" }}>Checkpoint</th>
                <th style={{ width: "150px", textAlign: "center", color: "var(--text-main)" }}>Yes / No / N/A</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>2.1</td>
                <td>Has a Toolbox Talk / pre-start briefing been held?</td>
                <td>{renderRadioGroup("chk2_1")}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)", backgroundColor: "var(--bg-card-hover)" }}>
            If YES, complete items 2.1.1 to 2.1.5. If NO, complete the explanation box below.
          </div>
          <table className="sc-table">
            <tbody>
              <tr>
                <td className="sc-td-label">2.1.1 Date of briefing</td>
                <td><input type="date" className="mod-form-input" name="briefingDate" value={form.briefingDate} onChange={handleChange} /></td>
                <td className="sc-td-label">Time</td>
                <td><input type="time" className="mod-form-input" name="briefingTime" value={form.briefingTime} onChange={handleChange} /></td>
              </tr>
              <tr>
                <td className="sc-td-label">2.1.2 Conducted by</td>
                <td><input className="mod-form-input" name="conductedBy" value={form.conductedBy} onChange={handleChange} /></td>
                <td className="sc-td-label">Number of participants</td>
                <td><input type="number" className="mod-form-input" name="participants" value={form.participants} onChange={handleChange} /></td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-card-hover)", color: "var(--text-main)", fontWeight: "600", fontSize: "0.9rem", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
            2.1.4 Key topics covered
          </div>
          <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderBottom: "1px solid var(--border-color)" }}>
            {topicOptions.map(opt => (
              <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
                <input type="checkbox" checked={form.keyTopics.includes(opt)} onChange={() => handleArrayToggle("keyTopics", opt)} />
                {opt}
              </label>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", gridColumn: "1 / -1" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
                <input type="checkbox" checked={form.keyTopics.includes("Other")} onChange={() => handleArrayToggle("keyTopics", "Other")} />
                Other topics:
              </label>
              {form.keyTopics.includes("Other") && (
                <input className="mod-form-input" style={{ flex: 1 }} name="otherTopic" value={form.otherTopic} onChange={handleChange} />
              )}
            </div>
          </div>
          <table className="sc-table">
            <thead>
              <tr style={{ backgroundColor: "#0f172a", color: "#fff" }}>
                <th style={{ width: "50px", textAlign: "center" }}>No.</th>
                <th>Checkpoint</th>
                <th style={{ width: "120px", textAlign: "center" }}>Yes / No</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>2.1.5</td>
                <td>Have all workers confirmed understanding of the PTW and RAMS requirements?</td>
                <td>{renderYesNo("chk2_1_5")}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-card-hover)", color: "var(--text-main)", fontWeight: "600", fontSize: "0.9rem", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
            2.1.6 If NO, explain why the Toolbox Talk / pre-start briefing was not held
          </div>
          <div style={{ padding: "16px", backgroundColor: "var(--bg-card)" }}>
            <textarea className="mod-form-textarea" rows="4" name="explainNoBriefing" value={form.explainNoBriefing} onChange={handleChange}></textarea>
          </div>
        </div>

        {/* 3 | SUMMARY */}
        <div className="mod-card-header" style={{ backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", marginTop: "32px", borderLeft: "4px solid var(--primary-color, #F97316)" }}>
          <h3 className="mod-card-title" style={{ margin: 0, color: "var(--text-main)", fontSize: "1.1rem", fontWeight: "700" }}>3 | SUMMARY</h3>
        </div>
        <div className="mod-card-body" style={{ padding: "0" }}>
          <table className="sc-table">
            <thead>
              <tr style={{ backgroundColor: "var(--bg-dark)" }}>
                <th style={{ width: "50px", textAlign: "center", color: "var(--text-main)" }}>No.</th>
                <th style={{ color: "var(--text-main)" }}>Checkpoint</th>
                <th style={{ width: "120px", textAlign: "center", color: "var(--text-main)" }}>Yes / No</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>3.2</td>
                <td>Was the activity in compliance?</td>
                <td>{renderYesNo("chk3_2")}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-card-hover)", color: "var(--text-main)", fontWeight: "600", fontSize: "0.9rem", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
            3.2.1 Safety issue traceability, if activity is not compliant
          </div>
          <table className="sc-table">
            <tbody>
              <tr>
                <td className="sc-td-label" style={{ width: "200px" }}>Safety issue created?</td>
                <td style={{ width: "150px" }}>{renderYesNo("safetyIssueCreated")}</td>
                <td className="sc-td-label" style={{ width: "200px" }}>Safety issue / SPOT ref.</td>
                <td><input className="mod-form-input" name="safetyIssueRef" value={form.safetyIssueRef} onChange={handleChange} /></td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-card-hover)", color: "var(--text-main)", fontWeight: "600", fontSize: "0.9rem", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
            Findings / comments
          </div>
          <div style={{ padding: "16px", backgroundColor: "var(--bg-card)" }}>
            <textarea className="mod-form-textarea" rows="4" name="findings" value={form.findings} onChange={handleChange}></textarea>
          </div>
          <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-card-hover)", color: "var(--text-main)", fontWeight: "600", fontSize: "0.9rem", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
            Corrective actions
          </div>
          <table className="sc-table">
            <thead>
              <tr style={{ backgroundColor: "var(--bg-dark)" }}>
                <th style={{ color: "var(--text-main)" }}>Action required</th>
                <th style={{ width: "200px", color: "var(--text-main)" }}>Responsible person</th>
                <th style={{ width: "150px", color: "var(--text-main)" }}>Due date</th>
                <th style={{ width: "80px", textAlign: "center", color: "var(--text-main)" }}>Closed</th>
              </tr>
            </thead>
            <tbody>
              {form.correctiveActions.map((action, idx) => (
                <tr key={idx}>
                  <td><input className="mod-form-input" value={action.action} onChange={(e) => handleActionChange(idx, "action", e.target.value)} /></td>
                  <td><input className="mod-form-input" value={action.responsible} onChange={(e) => handleActionChange(idx, "responsible", e.target.value)} /></td>
                  <td><input type="date" className="mod-form-input" value={action.dueDate} onChange={(e) => handleActionChange(idx, "dueDate", e.target.value)} /></td>
                  <td style={{ textAlign: "center" }}><input type="checkbox" checked={action.closed} onChange={(e) => handleActionChange(idx, "closed", e.target.checked)} /></td>
                </tr>
              ))}
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "8px" }}>
                  <button type="button" className="mod-btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setForm({ ...form, correctiveActions: [...form.correctiveActions, { action: "", responsible: "", dueDate: "", closed: false }] })}>
                    + Add Action
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3 | SUMMARY - SIGNATURES AND EVIDENCE */}
        <div className="mod-card-header" style={{ backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", marginTop: "32px", borderLeft: "4px solid var(--primary-color, #F97316)" }}>
          <h3 className="mod-card-title" style={{ margin: 0, color: "var(--text-main)", fontSize: "1.1rem", fontWeight: "700" }}>3 | SUMMARY - SIGNATURES AND EVIDENCE</h3>
        </div>
        <div className="mod-card-body" style={{ padding: "0" }}>
          <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-card-hover)", color: "var(--text-main)", fontWeight: "600", fontSize: "0.9rem", borderBottom: "1px solid var(--border-color)" }}>
            3.1 Foreman / Lead-hand confirmation
          </div>
          <table className="sc-table">
            <tbody>
              <tr>
                <td className="sc-td-label" style={{ width: "150px" }}>Name</td>
                <td><input className="mod-form-input" name="foremanName" value={form.foremanName} onChange={handleChange} /></td>
                <td className="sc-td-label" style={{ width: "150px" }}>Company</td>
                <td><input className="mod-form-input" name="foremanCompany" value={form.foremanCompany} onChange={handleChange} /></td>
              </tr>
              <tr>
                <td className="sc-td-label">Date</td>
                <td colSpan="3"><input type="date" className="mod-form-input" style={{ maxWidth: "200px" }} name="foremanDate" value={form.foremanDate} onChange={handleChange} /></td>
              </tr>
              <tr>
                <td className="sc-td-label" style={{ verticalAlign: "top", paddingTop: "16px" }}>Signature <span style={{ color: "#DC2626" }}>*</span></td>
                <td colSpan="3">
                  <SignaturePad 
                    value={form.foremanSignature} 
                    onChange={val => setForm(prev => ({...prev, foremanSignature: val}))} 
                    onClear={() => setForm(prev => ({...prev, foremanSignature: false}))} 
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-card-hover)", color: "var(--text-main)", fontWeight: "600", fontSize: "0.9rem", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
            3.3 Photographs and attachments <span style={{ color: "red", fontWeight: "normal", fontSize: "0.85rem" }}>(required)</span>
          </div>
          <table className="sc-table">
            <thead>
              <tr style={{ backgroundColor: "var(--bg-dark)" }}>
                <th style={{ width: "50px", textAlign: "center", color: "var(--text-main)" }}>No.</th>
                <th style={{ color: "var(--text-main)" }}>Description / reference</th>
                <th style={{ width: "120px", textAlign: "center", color: "var(--text-main)" }}>Attached</th>
              </tr>
            </thead>
            <tbody>
              {form.attachments.map((att, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: "center", fontWeight: "bold" }}>{idx + 1}</td>
                  <td><input className="mod-form-input" value={att.desc} onChange={(e) => handleAttachmentChange(idx, "desc", e.target.value)} /></td>
                  <td>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "4px" }}><input type="radio" name={`att_${idx}`} value="Yes" onChange={(e) => handleAttachmentChange(idx, "attached", "Yes")} checked={att.attached === "Yes"} /> Yes</label>
                      <label style={{ display: "flex", alignItems: "center", gap: "4px" }}><input type="radio" name={`att_${idx}`} value="N/A" onChange={(e) => handleAttachmentChange(idx, "attached", "N/A")} checked={att.attached === "N/A"} /> N/A</label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-card-hover)", color: "var(--text-main)", fontWeight: "600", fontSize: "0.9rem", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
            Spot check performed by
          </div>
          <table className="sc-table">
            <tbody>
              <tr>
                <td className="sc-td-label" style={{ width: "150px" }}>Name</td>
                <td><input className="mod-form-input" name="inspectorName" value={form.inspectorName} onChange={handleChange} /></td>
                <td className="sc-td-label" style={{ width: "150px" }}>Company / function</td>
                <td><input className="mod-form-input" name="inspectorCompany" value={form.inspectorCompany} onChange={handleChange} /></td>
              </tr>
              <tr>
                <td className="sc-td-label">Date</td>
                <td colSpan="3"><input type="date" className="mod-form-input" style={{ maxWidth: "200px" }} name="inspectorDate" value={form.inspectorDate} onChange={handleChange} /></td>
              </tr>
              <tr>
                <td className="sc-td-label" style={{ verticalAlign: "top", paddingTop: "16px" }}>Signature <span style={{ color: "#DC2626" }}>*</span></td>
                <td colSpan="3">
                  <SignaturePad 
                    value={form.inspectorSignature} 
                    onChange={val => setForm(prev => ({...prev, inspectorSignature: val}))} 
                    onClear={() => setForm(prev => ({...prev, inspectorSignature: false}))} 
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Retain the completed paper form and associated evidence in accordance with the applicable project filing process.
        </div>

        <div style={{ padding: "24px", display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--border-color)" }}>
          <button className="mod-btn-outline" onClick={() => navigate("/spot-checks/list")}>Cancel</button>
          <button className="mod-btn-primary" onClick={() => navigate("/spot-checks/list")}>Submit Spot Check</button>
        </div>
      </div>
      
    </div>
  );
}
