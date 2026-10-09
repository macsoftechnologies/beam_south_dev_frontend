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

      const userRoleTokens = new Set();
      const addRoleString = (val) => {
        if (!val) return;
        if (typeof val === "string") {
          val.split(",").forEach((r) => {
            const t = r.trim().toLowerCase();
            if (t) userRoleTokens.add(t);
          });
        } else if (Array.isArray(val)) {
          val.forEach((r) => {
            const t = String(r).trim().toLowerCase();
            if (t) userRoleTokens.add(t);
          });
        }
      };

      addRoleString(effectiveRole);
      addRoleString(parsedUser?.role);
      addRoleString(parsedUser?.userType);
      addRoleString(parsedUser?.user_type);
      addRoleString(localStorage.getItem("UserType"));
      addRoleString(localStorage.getItem("primaryUserType"));
      addRoleString(localStorage.getItem("activeModuleRole"));

      // Expand role aliases so Department1 / Department match all variations
      if (
        Array.from(userRoleTokens).some((r) =>
          ["department1", "operator1", "c&q", "comm"].includes(r)
        )
      ) {
        userRoleTokens.add("department1");
        userRoleTokens.add("operator1");
        userRoleTokens.add("c&q");
        userRoleTokens.add("comm");
      }
      if (
        Array.from(userRoleTokens).some((r) =>
          ["department", "operator", "conm", "hse"].includes(r)
        )
      ) {
        userRoleTokens.add("department");
        userRoleTokens.add("operator");
        userRoleTokens.add("conm");
        userRoleTokens.add("hse");
      }

      const roleTokensArray = Array.from(userRoleTokens);

      const isDepartment = roleTokensArray.some((r) =>
        ["department", "department1", "operator", "operator1", "conm", "comm", "c&q", "hse"].includes(r)
      );
      const isObserver = !isDepartment && roleTokensArray.some((r) => r.includes("observer"));
      const isContractor =
        !isDepartment &&
        !isObserver &&
        roleTokensArray.some((r) => r.includes("contractor") || r.includes("subcontractor"));

      const allowedLower = allowedRoles.map((r) => String(r).trim().toLowerCase());
      const allowedIncludesContractor = allowedLower.some(
        (a) => a.includes("contractor") || a.includes("subcontractor")
      );
      const allowedIncludesObserver = allowedLower.some((a) => a.includes("observer"));

      if (isContractor && !allowedIncludesContractor) {
        showError("You do not have permission to access this page");
        return <Navigate to="/modules" replace />;
      }
      if (isObserver && !allowedIncludesObserver) {
        showError("You do not have permission to access this page");
        return <Navigate to="/modules" replace />;
      }

      const hasAccess = allowedLower.some((a) =>
        roleTokensArray.some((r) => r === a || r.includes(a) || a.includes(r))
      );
      if (!hasAccess) {
        showError("You do not have permission to access this page");
        return <Navigate to="/modules" replace />;
      }
    }
  } catch {
    return <Navigate to="/modules" replace />;
  }

  return children;
};

export default ProtectedRoute;