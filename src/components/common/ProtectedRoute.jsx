import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isTokenValid } from "./PublicRoute";
import { showError } from "./Toast/Toast";

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
    const rawRole = (localStorage.getItem("UserType") || parsedUser?.role || parsedUser?.userType || parsedUser?.user_type || "");

    let userRoles = [];
    if (typeof rawRole === "string") {
      userRoles = rawRole.split(",").map(r => r.trim().toLowerCase());
    } else if (Array.isArray(rawRole)) {
      userRoles = rawRole.map(r => String(r).trim().toLowerCase());
    }
    if (Array.isArray(parsedUser?.userTypes)) {
      userRoles.push(...parsedUser.userTypes.map(r => String(r).trim().toLowerCase()));
    }
    if (parsedUser?.role) {
      userRoles.push(String(parsedUser.role).trim().toLowerCase());
    }
    if (parsedUser?.userType) {
      userRoles.push(String(parsedUser.userType).trim().toLowerCase());
    }
    if (parsedUser?.user_type) {
      userRoles.push(String(parsedUser.user_type).trim().toLowerCase());
    }

    const isAdmin = userRoles.some(r => r.includes("admin") || r.includes("superadmin"));

    // Check Module-level Permissions
    const matched = ROUTE_MODULE_MAP.find(m => location.pathname.startsWith(m.prefix));
    const matchedModule = requiredModule || matched?.moduleId;
    if (matchedModule && !isAdmin) {
      const rawMod = parsedUser?.moduleAccess;
      const allowedMods = (rawMod ? (typeof rawMod === "string" ? rawMod.split(",") : rawMod) : ["permit-to-work"]).map(m => String(m).trim().toLowerCase());
      if (!allowedMods.includes(matchedModule.toLowerCase())) {
        showError(`You do not have access to the ${matched?.name || 'requested'} module`);
        return <Navigate to="/modules" replace />;
      }
    }

    // Role-based Permissions Check
    if (allowedRoles && allowedRoles.length > 0) {
      const isContractor = userRoles.some(r => r.includes("contractor") || r.includes("subcontractor")) || Boolean(parsedUser?.subcontractor_id) || Boolean(parsedUser?.contractorId) || Boolean(parsedUser?.contractor_id) || Boolean(parsedUser?.typeId && userRoles.some(r => r.includes("subcontractor")));
      const isObserver = userRoles.some(r => r.includes("observer"));

      const allowedLower = allowedRoles.map(r => String(r).trim().toLowerCase());
      const allowedIncludesContractor = allowedLower.some(a => a.includes("contractor") || a.includes("subcontractor"));
      const allowedIncludesObserver = allowedLower.some(a => a.includes("observer"));

      if (isContractor && !allowedIncludesContractor) {
        return <Navigate to="/modules" replace />;
      }
      if (isObserver && !allowedIncludesObserver) {
        return <Navigate to="/modules" replace />;
      }

      const hasAccess = userRoles.some(r => allowedLower.some(a => r.includes(a)));
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