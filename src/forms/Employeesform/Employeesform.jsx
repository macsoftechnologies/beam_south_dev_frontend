import React, { useState, useEffect, useMemo } from "react";
import { getContractors, getDepartments, getRoles } from "../../services/authService";
import { showError } from "../../components/common/Toast/Toast";
import {
  MODULE_DEFINITIONS,
  getModuleUserTypeOptions,
  getUserTypeLabel,
  parseModuleAccess,
} from "../../utils/modulePermissions";
import "../../forms/styles/forms.css";

const MODULE_OPTIONS = MODULE_DEFINITIONS;

function Employeesform({ onClose, initialData, isEdit, onSubmit }) {
  const [employeeBadgeId, setEmployeeBadgeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [roleId, setRoleId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [subContId, setSubContId] = useState("");
  const [departId, setDepartId] = useState("");
  const [obserId, setObserId] = useState("");
  const [access, setAccess] = useState(true);
  const [selectedModules, setSelectedModules] = useState([
    "permit-to-work",
  ]);
  const [moduleUserTypes, setModuleUserTypes] = useState({
    "permit-to-work": "Department",
  });
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [rolesList, setRolesList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [subcontractorList, setSubcontractorList] = useState([]);

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
          (a.subContractorName || "").localeCompare(b.subContractorName || "", undefined, { sensitivity: "base" })
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

      const rawUserType = initialData.userType || "";
      const initialTypes = rawUserType
        ? (typeof rawUserType === "string" ? rawUserType.split(",") : Array.isArray(rawUserType) ? rawUserType : [rawUserType])
        : [];

      setCompanyName(initialData.companyName || "");
      setSubContId(initialData.subContId !== undefined && initialData.subContId !== null ? String(initialData.subContId) : "");
      setDepartId(initialData.departId !== undefined && initialData.departId !== null ? String(initialData.departId) : "");
      setObserId(initialData.obserId !== undefined && initialData.obserId !== null ? String(initialData.obserId) : "");
      setAccess(initialData.access !== undefined ? (initialData.access === 1 || initialData.access === "1" || initialData.access === true) : true);

      const rawModules = initialData.moduleAccess || initialData.module_access;
      if (rawModules !== undefined && rawModules !== null && rawModules !== "") {
        const parsedMap = parseModuleAccess(rawModules);
        const mods = Object.keys(parsedMap);
        setSelectedModules(mods.length > 0 ? mods : ["permit-to-work"]);
        const typeMap = {};
        mods.forEach((m) => {
          let role = parsedMap[m] || initialTypes[0] || "Department";
          if (m === "safety-inspection" && role === "Subcontractor") {
            role = "Department";
          } else if (m !== "permit-to-work" && role === "Department1") {
            role = "Department";
          }
          typeMap[m] = role;
        });
        if (!typeMap["permit-to-work"] && initialTypes[0]) {
          typeMap["permit-to-work"] = initialTypes[0];
        }
        setModuleUserTypes(typeMap);
      } else {
        setSelectedModules(["permit-to-work"]);
        setModuleUserTypes({ "permit-to-work": initialTypes[0] || "Department" });
      }

      setEmail(initialData.email || "");
      setUsername(initialData.username || "");
      setPassword(""); // Leave blank in edit mode to avoid corrupting existing password
    }
  }, [initialData, isEdit]);

  // Derived user types from individual module configurations
  const activeEmployeeTypes = useMemo(() => {
    const types = selectedModules
      .map((m) => {
        let role = moduleUserTypes[m];
        if (m === "safety-inspection" && role === "Subcontractor") {
          role = "Department";
        }
        return role;
      })
      .filter(Boolean);
    if (types.length > 0) {
      return Array.from(new Set(types));
    }
    return ["Department"];
  }, [selectedModules, moduleUserTypes]);

  const hasDepartment = activeEmployeeTypes.includes("Department") || activeEmployeeTypes.includes("Department1");
  const hasContractor = activeEmployeeTypes.includes("Subcontractor");
  const hasObserver = activeEmployeeTypes.includes("Observer");

  // Show "Select Department" ONLY when Department is selected in any module dropdown
  const shouldShowDepartment = hasDepartment;
  // Show "Select Contractor" when Contractor is selected in any module dropdown
  const shouldShowContractor = hasContractor;

  // Automatically default companyName if Department selected and no Contractor selected
  useEffect(() => {
    if (hasDepartment && !hasContractor && !companyName) {
      setCompanyName("M3 South");
    }
  }, [hasDepartment, hasContractor, companyName]);

  // Cleanup selection IDs if types are no longer in selected modules
  useEffect(() => {
    if (!shouldShowContractor && subContId) {
      setSubContId("");
    }
    if (!shouldShowDepartment && departId) {
      setDepartId("");
    }
    if (!hasObserver && obserId) {
      setObserId("");
    }
  }, [shouldShowContractor, shouldShowDepartment, hasObserver, subContId, departId, obserId]);

  const handleToggleModule = (modId) => {
    setSelectedModules((prev) => {
      const isAlreadySelected = prev.includes(modId);
      if (isAlreadySelected) {
        const next = prev.filter((id) => id !== modId);
        setModuleUserTypes((prevTypes) => {
          const updated = { ...prevTypes };
          delete updated[modId];
          return updated;
        });
        return next;
      } else {
        const validOptions = getModuleUserTypeOptions(modId);
        const defaultRole = validOptions[0]?.value || "Department";
        setModuleUserTypes((prevTypes) => ({
          ...prevTypes,
          [modId]: prevTypes[modId] || defaultRole,
        }));
        return [...prev, modId];
      }
    });
  };

  const handleModuleUserTypeChange = (modId, roleValue) => {
    let effectiveRole = roleValue;
    if (modId === "safety-inspection" && roleValue === "Subcontractor") {
      effectiveRole = "Department";
    }
    setModuleUserTypes((prev) => ({
      ...prev,
      [modId]: effectiveRole,
    }));
  };

  const handleContractorChange = (e) => {
    const selectedId = e.target.value;
    setSubContId(selectedId);

    const matched = subcontractorList.find((s) => String(s.id) === String(selectedId));
    if (matched) {
      setCompanyName(matched.subContractorName);
      if (hasDepartment && matched.departId) {
        setDepartId(matched.departId);
      }
    } else {
      if (!hasDepartment) {
        setCompanyName("");
      }
    }
  };

  const handleDepartmentChange = (e) => {
    setDepartId(e.target.value);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedModules.length === 0) {
      showError("Please select at least one Module Access permission");
      return;
    }

    if (shouldShowDepartment && !departId) {
      showError("Please select a Department");
      return;
    }

    if (shouldShowContractor && !subContId) {
      showError("Please select a Contractor");
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

    const activeModuleRoles = selectedModules.map((m) => {
      let roleVal = moduleUserTypes[m] || "Department";
      if (m === "safety-inspection" && roleVal === "Subcontractor") {
        roleVal = "Department";
      }
      return `${m}:${roleVal}`;
    });
    const moduleAccessPayload = access ? activeModuleRoles.join(",") : "";

    const resolvedObserId = obserId || (hasObserver ? departId : null);

    const payload = {
      badgeId: employeeBadgeId,
      employeeName: employeeName,
      designation,
      phonenumber: phoneNumber,
      roleId: roleId ? Number(roleId) : 4,
      userType: activeEmployeeTypes.join(","),
      companyName: companyName || (hasDepartment && !hasContractor ? "M3 South" : ""),
      subContId: shouldShowContractor && subContId ? Number(subContId) : null,
      departId: shouldShowDepartment && departId ? Number(departId) : null,
      obserId: hasObserver && resolvedObserId ? Number(resolvedObserId) : null,
      access: access ? "1" : "0",
      moduleAccess: moduleAccessPayload,
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

        {/* Select Department Dropdown (shown whenever Department OR Contractor is selected in any module) */}
        {shouldShowDepartment && (
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

        {/* Select Contractor Dropdown (shown when Contractor is selected in any module) */}
        {shouldShowContractor && (
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

        {/* Module Access Checkboxes with Individual User Types */}
        {access && (
          <div className="df-modules-wrapper">
            <div className="df-modules-header">
              <label className="df-modules-title">
                Module Access Permissions &amp; Assigned User Types
              </label>
              <span className="df-modules-subtitle">
                Select access and assign specific user type per module
              </span>
            </div>
            
            <div className="df-modules-grid">
              {MODULE_OPTIONS.map((mod) => {
                const isChecked = selectedModules.includes(mod.id);
                let currentRole = moduleUserTypes[mod.id] || "Department";
                if (mod.id === "safety-inspection" && currentRole === "Subcontractor") {
                  currentRole = "Department";
                }

                return (
                  <div
                    key={mod.id}
                    className={`df-module-card ${isChecked ? "checked" : ""}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <label className="df-module-label">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModule(mod.id)}
                          style={{
                            width: "18px",
                            height: "18px",
                            accentColor: "#00e5a0",
                            cursor: "pointer",
                          }}
                        />
                        <span>{mod.label}</span>
                      </label>

                      {isChecked && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            textTransform: "uppercase",
                            backgroundColor:
                              currentRole === "Observer"
                                ? "rgba(99, 102, 241, 0.15)"
                                : currentRole === "Subcontractor"
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(16, 185, 129, 0.15)",
                            color:
                              currentRole === "Observer"
                                ? "#4f46e5"
                                : currentRole === "Subcontractor"
                                ? "#d97706"
                                : "#059669",
                            border: `1px solid ${
                              currentRole === "Observer"
                                ? "rgba(99, 102, 241, 0.35)"
                                : currentRole === "Subcontractor"
                                ? "rgba(245, 158, 11, 0.35)"
                                : "rgba(16, 185, 129, 0.35)"
                            }`,
                          }}
                        >
                          {getUserTypeLabel(currentRole, mod.id)}
                        </span>
                      )}
                    </div>

                    {isChecked && (
                      <div className="df-module-select-row">
                        <span className="df-module-select-label">
                          User Type:
                        </span>
                        <select
                          className="df-module-select"
                          value={mod.id === "permit-to-work" ? currentRole : (currentRole === "Department1" ? "Department" : currentRole)}
                          onChange={(e) => handleModuleUserTypeChange(mod.id, e.target.value)}
                        >
                          {getModuleUserTypeOptions(mod.id).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
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