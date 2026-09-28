import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isTokenValid } from "./PublicRoute";
import { showError } from "./Toast/Toast";
import {
  hasUserModuleAccess,
  getEffectiveRoleForModule,
  syncActiveModuleRole,
  isUserAdmin,
  detectModuleFromPath,
} from "../../utils/modulePermissions";

const ROUTE_MODULE_MAP = [
  { prefix: "/incident-management", moduleId: "incident-management", name: "Incident Management" },
  { prefix: "/safety-observations", moduleId: "safety-observations", name: "Safety Observations" },
  { prefix: "/safety-inspection",   moduleId: "safety-inspection",   name: "Safety Inspection" },
  { prefix: "/spot-checks",         moduleId: "spot-checks",         name: "Spot Checks" },
];

const ProtectedRoute = ({ children, allowedRoles, requiredModule }) => {
  const location = useLocation();

  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = localStorage.getItem("user");
    const parsedUser = user ? JSON.parse(user) : null;

    // Synchronize active module and module-specific role into localStorage
    syncActiveModuleRole(location.pathname);

    const isAdmin = isUserAdmin(parsedUser);

    // Check Module-level Permissions
    const matched = ROUTE_MODULE_MAP.find((m) => location.pathname.startsWith(m.prefix));
    const matchedModule = requiredModule || matched?.moduleId;
    if (matchedModule && !isAdmin) {
      if (!hasUserModuleAccess(matchedModule, parsedUser)) {
        showError(`You do not have access to the ${matched?.name || 'requested'} module`);
        return <Navigate to="/modules" replace />;
      }
    }

    // Role-based Permissions Check using module-specific user type
    if (allowedRoles && allowedRoles.length > 0) {
      if (isAdmin) {
        return children;
      }

      const activeModuleId = matchedModule || detectModuleFromPath(location.pathname);
      const effectiveRole = getEffectiveRoleForModule(activeModuleId, parsedUser);
      const roleLower = String(effectiveRole || "").toLowerCase();

      const isContractor =
        roleLower.includes("contractor") ||
        roleLower.includes("subcontractor") ||
        Boolean(parsedUser?.subcontractor_id) ||
        Boolean(parsedUser?.contractorId) ||
        Boolean(parsedUser?.contractor_id) ||
        Boolean(parsedUser?.typeId && roleLower.includes("subcontractor"));
      const isObserver = roleLower.includes("observer");

      const allowedLower = allowedRoles.map((r) => String(r).trim().toLowerCase());
      const allowedIncludesContractor = allowedLower.some(
        (a) => a.includes("contractor") || a.includes("subcontractor")
      );
      const allowedIncludesObserver = allowedLower.some((a) => a.includes("observer"));

      if (isContractor && !allowedIncludesContractor) {
        return <Navigate to="/modules" replace />;
      }
      if (isObserver && !allowedIncludesObserver) {
        return <Navigate to="/modules" replace />;
      }

      const hasAccess = allowedLower.some((a) => roleLower.includes(a));
      if (!hasAccess) {
        return <Navigate to="/modules" replace />;
      }
    }
  } catch {
    return <Navigate to="/modules" replace />;
  }

  return children;
};

export default ProtectedRoute;