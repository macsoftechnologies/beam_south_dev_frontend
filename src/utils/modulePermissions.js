// ─── Module Permissions & Multi-Module User Types Utility ──────────────────

export const MODULE_DEFINITIONS = [
  { id: "permit-to-work",      label: "Permit to Work",       shortLabel: "PTW", defaultRole: "Department" },
  { id: "incident-management", label: "Incident Management",  shortLabel: "IM",  defaultRole: "Department" },
  { id: "safety-observations", label: "Safety Observations",  shortLabel: "SO",  defaultRole: "Department" },
  { id: "safety-inspection",   label: "Safety Inspection",    shortLabel: "SI",  defaultRole: "Department" },
  { id: "spot-checks",         label: "Spot Checks",          shortLabel: "SC",  defaultRole: "Department" },
];

export const MODULE_USER_TYPE_OPTIONS = [
  { value: "Department",    label: "ConM/HSE" },
  { value: "Department1",   label: "C&Q" },
  { value: "Subcontractor", label: "Contractor" },
  { value: "Observer",      label: "Observer" },
];

export const USER_TYPE_LABELS = {
  Department: "ConM/HSE",
  Department1: "C&Q",
  Subcontractor: "Contractor",
  Observer: "Observer",
  Admin: "Admin",
  SuperAdmin: "SuperAdmin",
};

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
    return parsedMap[matchedKey];
  }

  // Fallback to user's primary user type
  const primary =
    localStorage.getItem("primaryUserType") ||
    user?.role ||
    user?.userType ||
    user?.user_type ||
    "Department";

  // If primary is comma-separated (e.g. "Department,Department1"), extract first or matching
  if (typeof primary === "string" && primary.includes(",")) {
    return primary.split(",")[0].trim();
  }

  return primary || "Department";
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
    const effectiveRole = getEffectiveRoleForModule(moduleId, user);

    if (effectiveRole) {
      localStorage.setItem("UserType", effectiveRole);
      localStorage.setItem("activeModule", moduleId);
      localStorage.setItem("activeModuleRole", effectiveRole);
    }

    const roleLower = String(effectiveRole || "").toLowerCase();
    const isObserver = roleLower.includes("observer");
    const isContractor = roleLower.includes("subcontractor") || roleLower.includes("contractor");
    const isDepartment = roleLower.includes("department");
    const isAdmin = isUserAdmin(user);

    return {
      moduleId,
      effectiveRole,
      isObserver,
      isContractor,
      isDepartment,
      isAdmin,
      isReadOnly: isObserver || isContractor,
    };
  } catch (err) {
    console.error("Error syncing active module role:", err);
    return null;
  }
}
