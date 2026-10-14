import React from "react";
import { Navigate } from "react-router-dom";

export const isTokenValid = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token && !user) {
    return false;
  }

  if (token && typeof token === "string" && token.trim() !== "" && token !== "undefined" && token !== "null") {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(payloadBase64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const decoded = JSON.parse(jsonPayload);
        if (decoded && decoded.exp) {
          const currentTime = Math.floor(Date.now() / 1000);
          if (decoded.exp <= currentTime) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("tempUser");
            localStorage.removeItem("UserType");
            localStorage.removeItem("secretkey");
            return false;
          }
        }
      }
    } catch (err) {
      // Fallback
    }
    return true;
  }

  if (user && typeof user === "string" && user.trim() !== "" && user !== "undefined" && user !== "null") {
    try {
      const parsed = JSON.parse(user);
      if (parsed && (parsed.id || parsed.user_id || parsed.username || parsed.role)) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
};

const PublicRoute = ({ children }) => {
  if (isTokenValid()) {
    let target = "/modules";
    try {
      const saved = sessionStorage.getItem("post_login_redirect");
      if (saved && saved.startsWith("/") && saved !== "/login" && saved !== "/") {
        sessionStorage.removeItem("post_login_redirect");
        target = saved;
      }
    } catch (e) {}
    return <Navigate to={target} replace />;
  }

  return children;
};

export default PublicRoute;
