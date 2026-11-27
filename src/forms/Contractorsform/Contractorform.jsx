import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../../services/api";
import { showError } from "../../components/common/Toast/Toast";
import { validateUploadFiles } from "../../utils/fileUploadValidation";
import "../../forms/styles/forms.css";

function Contractorform({ onClose, initialData, isEdit, onSubmit }) {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState(null); // Preview URL
  const [logoFile, setLogoFile] = useState(null); // File object

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isEdit && initialData) {
      setName(initialData.subContractorName || initialData.name || "");
      
      if (initialData.logo) {
        if (initialData.logo.startsWith("data:") || initialData.logo.startsWith("http")) {
          setLogo(initialData.logo);
        } else {
          setLogo(`${API_BASE_URL}/subcontractors/${initialData.logo}`);
        }
      } else {
        setLogo(null);
      }
    }
  }, [initialData, isEdit]);

  // ── Logo Upload ────────────────────────────────────────────────────────────
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { valid, errorMessage } = validateUploadFiles([file], {
      maxFiles: 1,
      maxFileSizeMB: 2,
      label: "Contractor logo",
    });
    if (!valid) {
      showError(errorMessage);
      e.target.value = "";
      return;
    }

    setLogoFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    setLogoFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      subContractorName: name,
      logoFile,
      logoCleared: logo === null,
    };

    onSubmit && onSubmit(payload);
  };

  return (
    <form className="df-form" onSubmit={handleSubmit} noValidate>
      <div className="df-grid">

        {/* Contractor Name */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Contractor Name <span className="df-required">*</span>
          </label>
          <input
            type="text"
            className="df-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alpha Build Co."
            required
          />
        </div>

        {/* Upload Logo */}
        <div className="df-field df-field--full">
          <label className="df-label">Upload Logo</label>

          {logo ? (
            <div className="df-logo-preview">
              <img
                src={logo}
                alt="Logo Preview"
                className="df-logo-img"
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "contain",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                }}
              />

              <div style={{ marginTop: "10px" }}>
                <span>{logoFile?.name || "Current Logo"}</span>

                <button
                  type="button"
                  className="df-btn df-btn--cancel"
                  style={{ marginLeft: "10px" }}
                  onClick={handleRemoveLogo}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              className="df-upload-box"
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed #d1d5db",
                padding: "20px",
                textAlign: "center",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>☁</div>
              <div>Click to upload logo</div>
              <small>PNG, JPG, SVG up to 2 MB</small>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleLogoChange}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="df-footer">
        <button
          type="button"
          className="df-btn df-btn--cancel"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="df-btn df-btn--submit"
        >
          {isEdit ? "Update Contractor" : "Add Contractor"}
        </button>
      </div>
    </form>
  );
}

export default Contractorform;