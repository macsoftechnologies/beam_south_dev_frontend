const fs = require('fs');
const file = 'd:/Projects/React/Beam/Development/Beam2.o_South_Incidents/src/modules/safety-observations/pages/SOCreate.jsx';

let content = `import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import { SAFETY_CATEGORIES, SO_RISK_LEVELS } from "../data/observations";
import "../../../styles/module-shared.css";

const initialForm = {
  obsType: "", // SAFE | UNSAFE
  subClass: "Unsafe Condition", // Unsafe Act | Unsafe Condition
  subject: "",
  category: "",
  risk: "Moderate",
  project: "m3-south",
  contractor: "",
  description: "",
  building: "",
  location: ""
};

function SOCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [photos, setPhotos] = useState([]);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      alert("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPhotos(prev => [...prev, dataUrl]);
      stopCamera();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos(prev => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const validate = () => {
    const errs = {};
    if (!form.obsType) errs.obsType = "Required";
    if (!form.subject) errs.subject = "Required";
    if (!form.category) errs.category = "Required";
    if (!form.description) errs.description = "Required";
    if (!form.location) errs.location = "Required";
    return errs;
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitted(true);
    setTimeout(() => navigate("/safety-observations/list"), 2000);
  };

  if (submitted) {
    return (
      <div className="mod-page">
        <div className="mod-card" style={{ maxWidth: 480, margin: "60px auto", textAlign: "center", padding: "48px 32px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-safe-bg)", color: "var(--color-safe)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="32" height="32"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ margin: "0 0 12px", color: "var(--text-main)" }}>Observation Submitted</h2>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Redirecting to observations list...</p>
        </div>
      </div>
    );
  }

  const isNeedsAttention = form.obsType === "UNSAFE";

  return (
    <div className="mod-page">
      <PageHeader
        title="New Safety Observation"
        breadcrumb={[{ label: "Safety Observations", link: "/safety-observations/list" }, { label: "New Observation" }]}
      />
      
      <div className="mod-card" style={{ maxWidth: 760, margin: "0 auto" }}>
        <form onSubmit={handleSubmit} className="mod-card-body" style={{ padding: 32 }}>
          
          <div className="fsec"><div className="fsec-title" style={{ fontSize: 13, borderBottom: "none", marginBottom: 12 }}>Observation Type <span style={{ color:"#E32B50" }}>*</span></div></div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <button type="button" onClick={() => setForm({...form, obsType: "SAFE"})} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, border: \`2px solid \${form.obsType === 'SAFE' ? '#7BBE97' : 'var(--border-color)'}\`, borderRadius: 9, background: form.obsType === 'SAFE' ? 'rgba(123,190,151,0.12)' : 'var(--bg-card)', color: form.obsType === 'SAFE' ? '#2D7A4F' : 'var(--text-main)', cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.12s" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
              Positive Observation
            </button>
            <button type="button" onClick={() => setForm({...form, obsType: "UNSAFE"})} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, border: \`2px solid \${form.obsType === 'UNSAFE' ? '#E32B50' : 'var(--border-color)'}\`, borderRadius: 9, background: form.obsType === 'UNSAFE' ? 'rgba(227,43,80,0.10)' : 'var(--bg-card)', color: form.obsType === 'UNSAFE' ? '#E32B50' : 'var(--text-main)', cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.12s" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              Needs Attention
            </button>
          </div>
          {errors.obsType && <div className="mod-form-error" style={{ marginTop:-16, marginBottom: 16 }}>{errors.obsType}</div>}

          {isNeedsAttention && (
            <div className="mod-form-group" style={{ marginBottom: 24 }}>
              <label className="mod-form-label">Nature of finding <span style={{ color:"#E32B50" }}>*</span></label>
              <select className="mod-form-select" name="subClass" value={form.subClass} onChange={handleChange}>
                <option value="Unsafe Act">Unsafe Act (behaviour)</option>
                <option value="Unsafe Condition">Unsafe Condition (environment)</option>
              </select>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Per NNE Incident Classification poster</div>
            </div>
          )}

          <div className="fsec"><div className="fsec-title" style={{ fontSize: 13, borderBottom: "none", marginBottom: 12 }}>General Information</div></div>
          
          <div className="mod-form-group">
            <label className="mod-form-label">Subject <span style={{ color:"#E32B50" }}>*</span></label>
            <input className={\`mod-form-input \${errors.subject ? 'error' : ''}\`} name="subject" value={form.subject} onChange={handleChange} placeholder="Brief description of the observation" />
            {errors.subject && <div className="mod-form-error">{errors.subject}</div>}
          </div>

          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="mod-form-group">
              <label className="mod-form-label">Safety Category <span style={{ color:"#E32B50" }}>*</span></label>
              <select className={\`mod-form-select \${errors.category ? 'error' : ''}\`} name="category" value={form.category} onChange={handleChange}>
                <option value="">-- Select category --</option>
                {SAFETY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <div className="mod-form-error">{errors.category}</div>}
            </div>
            {isNeedsAttention && (
              <div className="mod-form-group">
                <label className="mod-form-label">Risk level <span style={{ color:"#E32B50" }}>*</span></label>
                <select className="mod-form-select" name="risk" value={form.risk} onChange={handleChange}>
                  {SO_RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="mod-form-group">
              <label className="mod-form-label">Project <span style={{ color:"#E32B50" }}>*</span></label>
              <select className="mod-form-select" name="project" value={form.project} onChange={handleChange}>
                <option value="m3-south">M3 South</option>
                <option value="m3-north">M3 North</option>
                <option value="m3-infra">M3 Infrastructure</option>
              </select>
            </div>
            <div className="mod-form-group">
              <label className="mod-form-label">Contractor</label>
              <select className="mod-form-select" name="contractor" value={form.contractor} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="NNE">NNE</option>
                <option value="DK Electrical">DK Electrical</option>
                <option value="Nordic Cranes">Nordic Cranes</option>
              </select>
            </div>
          </div>

          <div className="mod-form-group">
            <label className="mod-form-label">Description <span style={{ color:"#E32B50" }}>*</span></label>
            <textarea className={\`mod-form-textarea \${errors.description ? 'error' : ''}\`} rows="4" name="description" value={form.description} onChange={handleChange} placeholder="Detailed description of what was observed..."></textarea>
            {errors.description && <div className="mod-form-error">{errors.description}</div>}
          </div>

          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="mod-form-group">
              <label className="mod-form-label">Building</label>
              <select className="mod-form-select" name="building" value={form.building} onChange={handleChange}>
                <option value="">Select...</option>
                {['JG', 'AB', 'CD', 'EF'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="mod-form-group">
              <label className="mod-form-label">Location detail <span style={{ color:"#E32B50" }}>*</span></label>
              <input className={\`mod-form-input \${errors.location ? 'error' : ''}\`} name="location" value={form.location} onChange={handleChange} placeholder="e.g. Utilities - Ground Floor, Grid B4" />
              {errors.location && <div className="mod-form-error">{errors.location}</div>}
            </div>
          </div>

          <div className="fsec" style={{ marginTop: 24 }}><div className="fsec-title" style={{ fontSize: 13, borderBottom: "none", marginBottom: 12 }}>Attachments & Photos</div></div>
          
          <div className="mod-form-group">
            <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
              <div onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: 16, border: "1.5px dashed var(--border-color)", borderRadius: 9, background: "var(--bg-card)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                <div style={{ fontSize: 13 }}>Click to upload photos or documents</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>JPG, PNG, PDF up to 10MB each</div>
              </div>
              <button type="button" onClick={startCamera} style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 22px", border: "1.5px dashed var(--border-color)", borderRadius: 9, background: "var(--bg-card)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--nne-brand-blue)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                Take Photo
              </button>
            </div>
            <input type="file" ref={fileInputRef} multiple accept="image/*,.pdf" style={{ display: "none" }} onChange={handleFileSelect} />
            
            {isCameraActive && (
              <div style={{ marginTop: 12 }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", maxHeight: 280, background: "#000", borderRadius: 8, display: "block" }}></video>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button type="button" className="mod-btn-primary" style={{ padding: "4px 12px", fontSize: 13 }} onClick={capturePhoto}>Capture</button>
                  <button type="button" className="mod-btn-outline" style={{ padding: "4px 12px", fontSize: 13 }} onClick={stopCamera}>Cancel Camera</button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {photos.map((src, idx) => (
                <div key={idx} style={{ position: "relative", width: 72, height: 72, borderRadius: 7, overflow: "hidden", border: "1px solid var(--border-color)" }}>
                  <img src={src} alt="thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <button type="button" onClick={() => setPhotos(photos.filter((_, i) => i !== idx))} style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 12, lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border-color)" }}>
            <button type="button" className="mod-btn-outline" onClick={() => navigate("/safety-observations/list")}>Cancel</button>
            <button type="submit" className="mod-btn-primary">Submit Observation</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SOCreate;
`
fs.writeFileSync(file, content, 'utf8');
console.log("Create Page Rebuilt.");
