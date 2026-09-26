import React, { useState, useEffect, useRef } from "react";
import { getContractors, getDepartments, getRoles } from "../../services/authService";
import { showError } from "../../components/common/Toast/Toast";
import "../../forms/styles/forms.css";

// ─── Employee Type options ───────────────────────────────────────────────────
const EMPLOYEE_TYPE_OPTIONS = [
  { value: "Department", label: "ConM/HSE" },
  { value: "Department1", label: "C&Q" },
  { value: "Subcontractor", label: "Contractor" },
  { value: "Observer", label: "Observer" },
];

const MODULE_OPTIONS = [
  { id: "permit-to-work",      label: "Permit to Work" },
  { id: "incident-management", label: "Incident Management" },
  { id: "safety-observations", label: "Safety Observations" },
  { id: "safety-inspection",   label: "Safety Inspection" },
  { id: "spot-checks",         label: "Spot Checks" },
];

function Employeesform({ onClose, initialData, isEdit, onSubmit }) {
  const [employeeBadgeId, setEmployeeBadgeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [roleId, setRoleId] = useState("");
  const [employeeTypes, setEmployeeTypes] = useState([]); // Array of strings (userType in backend)
  const [companyName, setCompanyName] = useState("");
  const [subContId, setSubContId] = useState("");
  const [departId, setDepartId] = useState("");
  const [obserId, setObserId] = useState("");
  const [access, setAccess] = useState(true);
  const [selectedModules, setSelectedModules] = useState([
    "permit-to-work",
  ]);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [rolesList, setRolesList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [subcontractorList, setSubcontractorList] = useState([]);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch roles, departments, and subcontractors dynamically
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, depsRes, subsRes] = await Promise.all([
          getRoles(1, 1000, true),
          getDepartments(1, 1000, true),
          getContractors(1, 100000, true),
        ]);

        const roles = rolesRes?.data?.rows ?? rolesRes?.data ?? rolesRes ?? [];
        const deps = depsRes?.data?.rows ?? depsRes?.data ?? depsRes ?? [];
        const subs = subsRes?.data?.rows ?? subsRes?.data ?? subsRes ?? [];
        const sortedSubs = [...subs].sort((a, b) =>
          (a.subContractorName || "").localeCompare(b.subContractorName || "", undefined, { sensitivity: 'base' })
        );

        setRolesList(roles);
        setDepartmentList(deps);
        setSubcontractorList(sortedSubs);
      } catch (err) {
        console.error("Failed to fetch form data sources", err);
      }
    };
    fetchData();
  }, []);

  // Set initial form data in edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      setEmployeeBadgeId(initialData.badgeId || "");
      setEmployeeName(initialData.employeeName || initialData.name || "");
      setDesignation(initialData.designation || "");
      setPhoneNumber(String(initialData.phonenumber || initialData.phoneNumber || "").replace(/^\+/, ""));
      setRoleId(initialData.roleId !== undefined && initialData.roleId !== null ? String(initialData.roleId) : "");

      // Parse userType (comma-separated string or array) into employeeTypes array
      const rawUserType = initialData.userType || "";
      const initialTypes = rawUserType
        ? (typeof rawUserType === "string" ? rawUserType.split(",") : Array.isArray(rawUserType) ? rawUserType : [rawUserType])
        : [];
      setEmployeeTypes(initialTypes);

      setCompanyName(initialData.companyName || "");
      setSubContId(initialData.subContId !== undefined && initialData.subContId !== null ? String(initialData.subContId) : "");
      setDepartId(initialData.departId !== undefined && initialData.departId !== null ? String(initialData.departId) : "");
      setObserId(initialData.obserId !== undefined && initialData.obserId !== null ? String(initialData.obserId) : "");
      setAccess(initialData.access !== undefined ? (initialData.access === 1 || initialData.access === "1" || initialData.access === true) : true);
      
      const rawModules = initialData.moduleAccess || initialData.module_access;
      if (rawModules !== undefined && rawModules !== null && rawModules !== "") {
        const parsed = typeof rawModules === "string"
          ? (rawModules.trim() ? rawModules.split(",").map(m => m.trim()) : [])
          : Array.isArray(rawModules) ? rawModules : [];
        setSelectedModules(parsed);
      } else {
        setSelectedModules(["permit-to-work"]);
      }

      setEmail(initialData.email || "");
      setUsername(initialData.username || "");
      setPassword(""); // Leave blank in edit mode to avoid corrupting existing password
    }
  }, [initialData, isEdit]);

  const handleToggleOption = (value) => {
    setEmployeeTypes((prev) => {
      let next;
      if (prev.includes(value)) {
        next = prev.filter((v) => v !== value);
      } else {
        next = [...prev, value];
      }

      // Automatically set company name if "Department" is selected but no Subcontractor is selected
      if (next.includes("Department") || next.includes("Department1")) {
        if (!companyName) {
          setCompanyName("M3 South");
        }
      }

      // Reset fields if option group is completely deselected
      if (!next.includes("Subcontractor")) {
        setSubContId("");
      }
      if (!next.includes("Department") && !next.includes("Department1")) {
        setDepartId("");
      }
      if (!next.includes("Observer")) {
        setObserId("");
      }
      return next;
    });
  };

  const handleContractorChange = (e) => {
    const selectedId = e.target.value;
    setSubContId(selectedId);

    const matched = subcontractorList.find((s) => String(s.id) === String(selectedId));
    if (matched) {
      setCompanyName(matched.subContractorName);
      setDepartId(matched.departId || "");
    } else {
      setCompanyName("");
      setDepartId("");
    }
  };

  const handleDepartmentChange = (e) => {
    setDepartId(e.target.value);
  };

  // Get dynamic display text for the select button
  const getDropdownLabel = () => {
    if (employeeTypes.length === 0) return "Select Employee Type(s)";
    return employeeTypes
      .map((val) => EMPLOYEE_TYPE_OPTIONS.find((opt) => opt.value === val)?.label)
      .filter(Boolean)
      .join(", ");
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!employeeTypes || employeeTypes.length === 0 || !employeeTypes.join(",").trim()) {
      showError("Please select at least one Employee Type");
      return;
    }

    if ((employeeTypes.includes("Department") || employeeTypes.includes("Department1")) && !departId) {
      showError("Please select a Department");
      return;
    }

    if (employeeTypes.includes("Subcontractor") && !subContId) {
      showError("Please select a Contractor");
      return;
    }

    if (employeeTypes.includes("Observer") && !obserId) {
      showError("Please select a Department for Observer");
      return;
    }

    if (access) {
      if (!username || !username.trim()) {
        showError("UserName is required when Access is ON");
        return;
      }
      if (!isEdit && (!password || !password.trim())) {
        showError("Password is required when Access is ON");
        return;
      }
    }

    const payload = {
      badgeId: employeeBadgeId,
      employeeName: employeeName,
      designation,
      phonenumber: phoneNumber,
      roleId: roleId ? Number(roleId) : 4,
      userType: employeeTypes.join(","),
      companyName,
      subContId: (employeeTypes.includes("Subcontractor") && subContId) ? Number(subContId) : null,
      departId: ((employeeTypes.includes("Department") || employeeTypes.includes("Department1")) && departId) ? Number(departId) : null,
      obserId: (employeeTypes.includes("Observer") && obserId) ? Number(obserId) : null,
      access: access ? "1" : "0",
      moduleAccess: access ? selectedModules.join(",") : "",
      email,
      username: access ? username : "",
      password: access ? password : "",
    };

    if (isEdit && (initialData?.id !== undefined ? initialData.id : initialData?.employeeId)) {
      payload.id = initialData.id !== undefined ? initialData.id : initialData.employeeId;
    }

    onSubmit && onSubmit(payload);
  };

  return (
    <form className="df-form" onSubmit={handleSubmit} noValidate>
      <div className="df-grid">

        {/* Employee Badge Id */}
        <div className="df-field">
          <label className="df-label">Employee Badge Id</label>
          <input
            type="text"
            className="df-input"
            value={employeeBadgeId}
            onChange={(e) => setEmployeeBadgeId(e.target.value)}
            placeholder="Employee Badge Id"
          />
        </div>

        {/* Employee Name */}
        <div className="df-field">
          <label className="df-label">
            Employee Name <span className="df-required">*</span>
          </label>
          <input
            type="text"
            className="df-input"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="Employee Name"
            required
          />
        </div>

        {/* Designation */}
        <div className="df-field">
          <label className="df-label">
            Designation <span className="df-required">*</span>
          </label>
          <input
            type="text"
            className="df-input"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Designation"
            required
          />
        </div>

        {/* Phone Number */}
        <div className="df-field">
          <label className="df-label">
            Phone Number <span className="df-required">*</span>
          </label>
          <div className="df-phone-group">
            <span className="df-phone-prefix">+</span>
            <input
              type="text"
              className="df-phone-input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/^\+/, ""))}
              placeholder="Phone Number"
              required
            />
          </div>
        </div>

        {/* Select Role */}
        <div className="df-field">
          <label className="df-label">
            Select Role <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            required
          >
            <option value="">Select Role</option>
            {rolesList.map((r) => (
              <option key={r.id} value={r.id}>{r.roleName}</option>
            ))}
          </select>
        </div>

        {/* Custom Multi-select Dropdown for Employee Types */}
        <div className="df-field" ref={dropdownRef} style={{ position: "relative" }}>
          <label className="df-label">
            Select Employee Type(s) <span className="df-required">*</span>
          </label>
          <div
            onClick={() => setDropdownOpen((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              height: "46px",
              padding: "0 14px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#f9fafb",
              backgroundColor: "#1f2937",
              border: "1.5px solid #374151",
              borderRadius: "12px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <span style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "calc(100% - 24px)"
            }}>
              {getDropdownLabel()}
            </span>
            <span style={{
              display: "inline-block",
              width: "0",
              height: "0",
              marginLeft: "8px",
              verticalAlign: "middle",
              borderTop: "6px solid #9ca3af",
              borderRight: "6px solid transparent",
              borderLeft: "6px solid transparent",
              transition: "transform 0.2s",
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)",
            }} />
          </div>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "76px",
                left: 0,
                width: "100%",
                backgroundColor: "#111827",
                border: "1.5px solid #374151",
                borderRadius: "12px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                zIndex: 100000,
                overflow: "hidden",
                padding: "6px 0",
              }}
            >
              {EMPLOYEE_TYPE_OPTIONS.map((opt) => {
                const isChecked = employeeTypes.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggleOption(opt.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      userSelect: "none",
                      color: "#f9fafb",
                      backgroundColor: isChecked ? "#1f2937" : "transparent",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1f2937"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isChecked ? "#1f2937" : "transparent"; }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      style={{
                        width: "16px",
                        height: "16px",
                        accentColor: "#00e5a0",
                        cursor: "pointer",
                      }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>
                      {opt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Company Name */}
        <div className="df-field">
          <label className="df-label">Company Name</label>
          <input
            type="text"
            className="df-input"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company Name"
          />
        </div>

        {/* Conditional Select Department */}
        {(employeeTypes.includes("Department") || employeeTypes.includes("Department1")) && (
          <div className="df-field">
            <label className="df-label">
              Select Department <span className="df-required">*</span>
            </label>
            <select
              className="df-select"
              value={departId}
              onChange={handleDepartmentChange}
              required
            >
              <option value="">Select Department</option>
              {departmentList.map((dep) => (
                <option key={dep.id} value={dep.id}>{dep.departmentName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Conditional Select Department for Observer */}
        {employeeTypes.includes("Observer") && (
          <div className="df-field">
            <label className="df-label">
              Select Department <span className="df-required">*</span>
            </label>
            <select
              className="df-select"
              value={obserId}
              onChange={(e) => setObserId(e.target.value)}
              required
            >
              <option value="">Select Department</option>
              {departmentList.map((dep) => (
                <option key={dep.id} value={dep.id}>{dep.departmentName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Conditional Select Contractor */}
        {employeeTypes.includes("Subcontractor") && (
          <div className="df-field">
            <label className="df-label">
              Select Contractor <span className="df-required">*</span>
            </label>
            <select
              className="df-select"
              value={subContId}
              onChange={handleContractorChange}
              required
            >
              <option value="">Select Contractor</option>
              {subcontractorList.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.subContractorName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Access Toggle */}
        <div className="df-field" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label className="df-label" style={{ margin: 0 }}>Access</label>
          <div
            className={`df-toggle ${access ? "df-toggle--on" : "df-toggle--off"}`}
            onClick={() => setAccess((prev) => !prev)}
            style={{
              width: "48px",
              height: "26px",
              borderRadius: "999px",
              background: access ? "#f59e0b" : "#d1d5db",
              position: "relative",
              cursor: "pointer",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "3px",
                left: access ? "24px" : "3px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </div>
        </div>

        {/* Module Access Checkboxes */}
        {access && (
          <div className="df-field" style={{ gridColumn: "1 / -1", marginTop: "4px", marginBottom: "8px" }}>
            <label className="df-label" style={{ marginBottom: "8px", fontWeight: "600", color: "#e5e7eb" }}>
              Module Access Permissions
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
                padding: "14px 16px",
                backgroundColor: "#1f2937",
                border: "1.5px solid #374151",
                borderRadius: "12px",
              }}
            >
              {MODULE_OPTIONS.map((mod) => {
                const isChecked = selectedModules.includes(mod.id);
                return (
                  <label
                    key={mod.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      color: isChecked ? "#f9fafb" : "#9ca3af",
                      fontSize: "14px",
                      fontWeight: 500,
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedModules((prev) => [...prev, mod.id]);
                        } else {
                          setSelectedModules((prev) => prev.filter((id) => id !== mod.id));
                        }
                      }}
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "#00e5a0",
                        cursor: "pointer",
                      }}
                    />
                    <span>{mod.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Email */}
        <div className="df-field">
          <label className="df-label">
            Email <span className="df-required">*</span>
          </label>
          <input
            type="email"
            className="df-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>

        {/* Conditional Credentials Fields */}
        {access && (
          <>
            {/* UserName */}
            <div className="df-field">
              <label className="df-label">
                UserName <span className="df-required">*</span>
              </label>
              <input
                type="text"
                className="df-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="UserName"
                required
              />
            </div>

            {/* Password */}
            <div className="df-field">
              <label className="df-label">
                Password <span className="df-required">*</span>
              </label>
              <input
                type="password"
                className="df-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? "Leave blank to keep unchanged" : "Password"}
                required={!isEdit}
              />
            </div>
          </>
        )}

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
          {isEdit ? "Update Employee" : "Create"}
        </button>
      </div>
    </form>
  );
}

export default Employeesform;