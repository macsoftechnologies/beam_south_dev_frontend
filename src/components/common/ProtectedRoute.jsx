import React from "react";
import { Navigate } from "react-router-dom";
import { isTokenValid } from "./PublicRoute";

const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
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
    } catch {
      return <Navigate to="/modules" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;