// ─── Module Permissions & Multi-Module User Types Utility ──────────────────

export const MODULE_DEFINITIONS = [
  { id: "permit-to-work",      label: "Permit to Work",       shortLabel: "PTW", defaultRole: "Department" },
  { id: "incident-management", label: "Incident Management",  shortLabel: "IM",  defaultRole: "Department" },
  { id: "safety-observations", label: "Safety Observations",  shortLabel: "SO",  defaultRole: "Department" },
  { id: "safety-inspection",   label: "Safety Inspection",    shortLabel: "SI",  defaultRole: "Department" },
  { id: "spot-checks",         label: "Spot Checks",          shortLabel: "SC",  defaultRole: "Department" },
];

export const PTW_USER_TYPE_OPTIONS = [
  { value: "Department",    label: "ConM/HSE" },
  { value: "Department1",   label: "C&Q" },
  { value: "Subcontractor", label: "Contractor" },
  { value: "Observer",      label: "Observer" },
];

export const NEW_MODULE_USER_TYPE_OPTIONS = [
  { value: "Department",    label: "Department/HSE" },
  { value: "Subcontractor", label: "Contractor" },
  { value: "Observer",      label: "Observer" },
];

export const INSPECTION_USER_TYPE_OPTIONS = [
  { value: "Department",    label: "Department/HSE" },
  { value: "Observer",      label: "Observer" },
];

export const MODULE_USER_TYPE_OPTIONS = NEW_MODULE_USER_TYPE_OPTIONS;

export function getModuleUserTypeOptions(moduleId) {
  if (moduleId === "permit-to-work") {
    return PTW_USER_TYPE_OPTIONS;
  }
  if (moduleId === "safety-inspection") {
    return INSPECTION_USER_TYPE_OPTIONS;
  }
  return NEW_MODULE_USER_TYPE_OPTIONS;
}

export const USER_TYPE_LABELS = {
  Department: "ConM/HSE",
  Department1: "C&Q",
  Subcontractor: "Contractor",
  Observer: "Observer",
  Admin: "Admin",
  SuperAdmin: "SuperAdmin",
};

export function getUserTypeLabel(roleValue, moduleId = null) {
  if (!roleValue) return "";
  const roleLower = String(roleValue).toLowerCase();

  // For new modules (non-PTW), ConM and C&Q are the same: Department/HSE
  if (moduleId && moduleId !== "permit-to-work") {
    if (roleLower === "department" || roleLower === "department1") {
      return "Department/HSE";
    }
  }

  if (roleLower === "department") return "ConM/HSE";
  if (roleLower === "department1") return "C&Q";
  if (roleLower === "subcontractor") return "Contractor";
  if (roleLower === "observer") return "Observer";
  if (roleLower === "admin") return "Admin";
  if (roleLower === "superadmin") return "SuperAdmin";
  return USER_TYPE_LABELS[roleValue] || roleValue;
}

/**
 * Format role for display in the navbar under the username.
 * For example:
 * - PTW Department1 -> Department1
 * - Contractor/Subcontractor -> Contractor
 * - Department -> Department
 * - Observer -> Observer
 */
export function getNavbarDisplayRole(role) {
  if (!role) return "";
  const r = String(role).trim();
  const lower = r.toLowerCase();
  if (lower === "subcontractor" || lower === "contractor") return "Contractor";
  if (lower === "department1" || lower === "c&q") return "Department1";
  if (lower === "department" || lower === "conm/hse" || lower === "conm") return "Department";
  if (lower === "observer") return "Observer";
  if (lower === "admin") return "Admin";
  if (lower === "superadmin") return "SuperAdmin";
  if (r.includes(",")) {
    const first = r.split(",")[0].trim();
    return getNavbarDisplayRole(first);
  }
  return r;
}

/**
 * Detect module ID from a path/pathname
 */
export function detectModuleFromPath(pathname = "") {
  const p = String(pathname).toLowerCase();
  if (p.startsWith("/incident-management")) return "incident-management";
  if (p.startsWith("/safety-observations"))  return "safety-observations";
  if (p.startsWith("/safety-inspection"))    return "safety-inspection";
  if (p.startsWith("/spot-checks"))          return "spot-checks";
  return "permit-to-work";
}

/**
 * Parse raw moduleAccess string/array into a structured map:
 * { [moduleId]: userType | null }
 * Supports:
 * - "permit-to-work:Department,incident-management:Observer"
 * - Legacy: "permit-to-work,incident-management"
 * - JSON string: '{"permit-to-work":"Department"}'
 */
export function parseModuleAccess(rawModuleAccess) {
  if (!rawModuleAccess) return {};

  if (typeof rawModuleAccess === "object" && !Array.isArray(rawModuleAccess)) {
    return rawModuleAccess;
  }

  // Handle JSON format
  if (typeof rawModuleAccess === "string" && rawModuleAccess.trim().startsWith("{")) {
    try {
      return JSON.parse(rawModuleAccess);
    } catch {
      // fallback to comma parsing
    }
  }

  const items = Array.isArray(rawModuleAccess)
    ? rawModuleAccess
    : String(rawModuleAccess).split(",");

  const result = {};
  items.forEach((item) => {
    if (!item) return;
    const str = String(item).trim();
    if (!str) return;

    if (str.includes(":")) {
      const colonIdx = str.indexOf(":");
      const modId = str.substring(0, colonIdx).trim();
      const userType = str.substring(colonIdx + 1).trim();
      if (modId) {
        result[modId] = userType || null;
      }
    } else {
      result[str] = null; // Legacy format: access granted, role inherits from primary
    }
  });

  return result;
}

/**
 * Serialize a map of modules and userTypes into a comma-separated colon string
 * Example: "permit-to-work:Department,incident-management:Observer"
 */
export function serializeModuleAccess(moduleMap = {}) {
  return Object.entries(moduleMap)
    .filter(([modId]) => Boolean(modId))
    .map(([modId, userType]) => (userType ? `${modId}:${userType}` : modId))
    .join(",");
}

/**
 * Check if the user is an admin / superadmin
 */
export function isUserAdmin(user = null) {
  if (!user) {
    try {
      user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      user = {};
    }
  }

  const rawRole = (
    localStorage.getItem("primaryUserType") ||
    localStorage.getItem("UserType") ||
    user?.role ||
    user?.userType ||
    user?.user_type ||
    ""
  ).toLowerCase();

  const userRoles = Array.isArray(user?.userTypes)
    ? user.userTypes.map((r) => String(r).toLowerCase())
    : [];

  return (
    Number(user?.roleId) === 0 ||
    Boolean(user?.isSuperAdmin) ||
    rawRole.includes("admin") ||
    rawRole.includes("superadmin") ||
    userRoles.some((r) => r.includes("admin") || r.includes("superadmin"))
  );
}

/**
 * Check if user has access to a specific module
 */
export function hasUserModuleAccess(moduleId, user = null) {
  if (moduleId === "permit-to-work") return true;
  if (isUserAdmin(user)) return true;

  if (!user) {
    try {
      user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      user = {};
    }
  }

  const parsedMap = parseModuleAccess(user?.moduleAccess);
  const keys = Object.keys(parsedMap).map((k) => k.toLowerCase());
  return keys.includes(String(moduleId).toLowerCase());
}

/**
 * Resolve the effective role for a user in a specific module.
 * Priority:
 * 1. Admin/SuperAdmin -> "Admin"
 * 2. Specific module role in user.moduleAccess (e.g. "Observer", "Department", "Subcontractor")
 * 3. Fallback to user's primary userType (ConM/HSE, Contractor, etc.)
 */
export function getEffectiveRoleForModule(moduleId, user = null) {
  if (!user) {
    try {
      user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      user = {};
    }
  }

  if (isUserAdmin(user)) {
    return "Admin";
  }

  const parsedMap = parseModuleAccess(user?.moduleAccess);
  const matchedKey = Object.keys(parsedMap).find(
    (k) => k.toLowerCase() === String(moduleId).toLowerCase()
  );

  // If specific role assigned for this module
  if (matchedKey && parsedMap[matchedKey]) {
    const assignedRole = parsedMap[matchedKey];
    if (moduleId !== "permit-to-work" && assignedRole === "Department1") {
      return "Department";
    }
    return assignedRole;
  }

  // Fallback to user's primary user type
  const primary =
    localStorage.getItem("primaryUserType") ||
    user?.role ||
    user?.userType ||
    user?.user_type ||
    "Department";

  // If primary is comma-separated (e.g. "Department,Department1" or "Department1,Subcontractor,Observer"), extract matching role
  let resolvedPrimary = primary;
  if (typeof primary === "string" && primary.includes(",")) {
    const parts = primary.split(",").map((s) => s.trim()).filter(Boolean);
    if (moduleId === "permit-to-work") {
      if (parts.includes("Department1")) resolvedPrimary = "Department1";
      else if (parts.includes("Department")) resolvedPrimary = "Department";
      else if (parts.includes("Subcontractor") || parts.includes("Contractor")) resolvedPrimary = "Subcontractor";
      else if (parts.includes("Observer")) resolvedPrimary = "Observer";
      else resolvedPrimary = parts[0] || "Department";
    } else if (moduleId === "incident-management" || moduleId === "safety-observations" || moduleId === "safety-inspection" || moduleId === "spot-checks") {
      if (parts.includes("Subcontractor") || parts.includes("Contractor")) resolvedPrimary = "Subcontractor";
      else if (parts.includes("Department") || parts.includes("Department1")) resolvedPrimary = "Department";
      else if (parts.includes("Observer")) resolvedPrimary = "Observer";
      else resolvedPrimary = parts[0] || "Department";
    } else {
      resolvedPrimary = parts[0] || "Department";
    }
  }

  if (moduleId !== "permit-to-work" && resolvedPrimary === "Department1") {
    return "Department";
  }

  return resolvedPrimary || "Department";
}

/**
 * Resolve effective role, typeId, contractorId, departmentId for a specific module.
 * If user is a multi-role employee (has both departId and subContId):
 * - If module role is Subcontractor/Contractor -> uses subContId / subcontractor_id.
 * - If module role is Department/Department1 -> uses departId / department_id.
 * - If module role is Observer -> uses obserId / departId.
 */
export function getModuleUserContext(moduleId, user = null) {
  if (!user) {
    try {
      user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      user = {};
    }
  }

  const effectiveRole = getEffectiveRoleForModule(moduleId, user);
  const roleLower = String(effectiveRole || "").toLowerCase();

  const isObserver = roleLower.includes("observer");
  const isContractor = (roleLower.includes("subcontractor") || roleLower.includes("contractor")) && !isObserver;
  const isDepartment = (roleLower.includes("department") || roleLower.includes("department1")) && !isObserver;
  const isAdmin = isUserAdmin(user);

  // Subcontractor ID (Bilfinger, etc.): Explicit subcontractor ID takes priority over ambiguous typeId
  const rawSubContId =
    user?.subContId !== undefined && user?.subContId !== null ? user.subContId :
    user?.subcontractor_id !== undefined && user?.subcontractor_id !== null ? user.subcontractor_id :
    user?.subContractorId !== undefined && user?.subContractorId !== null ? user.subContractorId :
    (isContractor && !user?.departId ? user?.typeId : null);

  const contractorId = rawSubContId ? Number(rawSubContId) : null;

  // Department ID: Explicit department ID takes priority over typeId
  const rawDepartId =
    user?.departId !== undefined && user?.departId !== null ? user.departId :
    user?.department_id !== undefined && user?.department_id !== null ? user.department_id :
    user?.departmentId !== undefined && user?.departmentId !== null ? user.departmentId :
    (!isContractor ? user?.typeId : null);

  const departmentId = rawDepartId ? Number(rawDepartId) : null;

  // Observer ID:
  const rawObserId =
    user?.obserId !== undefined && user?.obserId !== null ? user.obserId :
    user?.observerId !== undefined && user?.observerId !== null ? user.observerId :
    departmentId;

  const observerId = rawObserId ? Number(rawObserId) : null;

  // Active Type ID based on selected module role
  let activeTypeId = null;
  if (isContractor) {
    activeTypeId = contractorId || Number(user?.typeId) || null;
  } else if (isDepartment) {
    activeTypeId = departmentId || Number(user?.typeId) || null;
  } else if (isObserver) {
    activeTypeId = observerId || Number(user?.typeId) || null;
  } else {
    activeTypeId = Number(user?.typeId) || null;
  }

  return {
    moduleId,
    effectiveRole,
    roleLower,
    isObserver,
    isContractor,
    isDepartment,
    isAdmin,
    isDeptOrAdmin: (isAdmin || isDepartment) && !isContractor && !isObserver,
    isReadOnly: isObserver,
    contractorId,
    departmentId,
    observerId,
    activeTypeId,
  };
}

/**
 * Sync active module and effective userType into localStorage based on current route
 * Call this in ProtectedRoute / Layout on route change
 */
export function syncActiveModuleRole(pathname = window.location.pathname) {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    const user = JSON.parse(userStr);

    // Save primary user type if not already saved
    if (!localStorage.getItem("primaryUserType")) {
      const primary = user?.role || user?.userType || user?.user_type || "";
      if (primary) {
        localStorage.setItem("primaryUserType", primary);
      }
    }

    const moduleId = detectModuleFromPath(pathname);
    const ctx = getModuleUserContext(moduleId, user);

    if (ctx.effectiveRole) {
      localStorage.setItem("UserType", ctx.effectiveRole);
      localStorage.setItem("activeModule", moduleId);
      localStorage.setItem("activeModuleRole", ctx.effectiveRole);
    }
    if (ctx.activeTypeId) {
      localStorage.setItem("activeTypeId", String(ctx.activeTypeId));
    }
    if (ctx.contractorId) {
      localStorage.setItem("activeContractorId", String(ctx.contractorId));
    }
    if (ctx.departmentId) {
      localStorage.setItem("activeDepartmentId", String(ctx.departmentId));
    }

    return {
      moduleId,
      effectiveRole: ctx.effectiveRole,
      isObserver: ctx.isObserver,
      isContractor: ctx.isContractor,
      isDepartment: ctx.isDepartment,
      isAdmin: ctx.isAdmin,
      isReadOnly: ctx.isReadOnly,
      contractorId: ctx.contractorId,
      departmentId: ctx.departmentId,
      activeTypeId: ctx.activeTypeId,
    };
  } catch (err) {
    console.error("Error syncing active module role:", err);
    return null;
  }
}
