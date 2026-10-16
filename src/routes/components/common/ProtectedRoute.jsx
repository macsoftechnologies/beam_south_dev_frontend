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
  { prefix: "/dashboard",           moduleId: "permit-to-work",      name: "Permit to Work" },
  { prefix: "/new-request",         moduleId: "permit-to-work",      name: "Permit to Work" },
  { prefix: "/list-request",        moduleId: "permit-to-work",      name: "Permit to Work" },
  { prefix: "/departments",         moduleId: "permit-to-work",      name: "Permit to Work" },
  { prefix: "/contractors",         moduleId: "permit-to-work",      name: "Permit to Work" },
  { prefix: "/employees",           moduleId: "permit-to-work",      name: "Permit to Work" },
  { prefix: "/electrical-works",    moduleId: "permit-to-work",      name: "Permit to Work" },
  { prefix: "/mechanical-works",    moduleId: "permit-to-work",      name: "Permit to Work" },
  { prefix: "/reports",             moduleId: "permit-to-work",      name: "Permit to Work" },
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
      const effLower = String(effectiveRole || "").trim().toLowerCase();

      // For Safety Inspection: Contractors are strictly not allowed access
      if (activeModuleId === "safety-inspection") {
        if (effLower.includes("contractor") || effLower.includes("subcontractor")) {
          showError("Contractors are not permitted to access Safety Inspection");
          return <Navigate to="/modules" replace />;
        }
      }

      // Determine module-specific role classification for the active module
      const isEffDepartment =
        ["department", "department1", "operator", "operator1", "conm", "comm", "c&q", "hse", "safety"].some((r) =>
          effLower.includes(r)
        );
      const isEffObserver = !isEffDepartment && effLower.includes("observer");
      const isEffContractor =
        !isEffDepartment &&
        !isEffObserver &&
        (effLower.includes("contractor") || effLower.includes("subcontractor"));

      const allowedLower = allowedRoles.map((r) => String(r).trim().toLowerCase());
      const allowedIncludesContractor = allowedLower.some(
        (a) => a.includes("contractor") || a.includes("subcontractor")
      );
      const allowedIncludesObserver = allowedLower.some((a) => a.includes("observer"));
      const allowedIncludesDepartment = allowedLower.some((a) =>
        ["department", "department1", "operator", "operator1", "conm", "comm", "c&q", "hse", "safety"].some((d) =>
          a.includes(d)
        )
      );

      // Check role restrictions
      if (isEffContractor && !allowedIncludesContractor) {
        showError("You do not have permission to access this page");
        return <Navigate to="/modules" replace />;
      }
      if (isEffObserver && !allowedIncludesObserver) {
        showError("You do not have permission to access this page");
        return <Navigate to="/modules" replace />;
      }
      if (isEffDepartment && !allowedIncludesDepartment && !allowedLower.includes("admin")) {
        showError("You do not have permission to access this page");
        return <Navigate to="/modules" replace />;
      }

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
      addRoleString(localStorage.getItem("activeModuleRole"));
      if (!effectiveRole) {
        addRoleString(localStorage.getItem("UserType"));
        addRoleString(parsedUser?.role);
        addRoleString(parsedUser?.userType);
      }

      // Expand role aliases
      if (
        isEffDepartment ||
        Array.from(userRoleTokens).some((r) =>
          ["department", "department1", "operator", "operator1", "conm", "comm", "c&q", "hse", "safety"].includes(r)
        )
      ) {
        userRoleTokens.add("department");
        userRoleTokens.add("department1");
        userRoleTokens.add("operator");
        userRoleTokens.add("operator1");
        userRoleTokens.add("conm");
        userRoleTokens.add("hse");
        userRoleTokens.add("safety");
      }
      if (
        isEffContractor ||
        Array.from(userRoleTokens).some((r) => ["contractor", "subcontractor"].includes(r))
      ) {
        userRoleTokens.add("contractor");
        userRoleTokens.add("subcontractor");
      }
      if (isEffObserver || Array.from(userRoleTokens).some((r) => r.includes("observer"))) {
        userRoleTokens.add("observer");
      }

      const roleTokensArray = Array.from(userRoleTokens);
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