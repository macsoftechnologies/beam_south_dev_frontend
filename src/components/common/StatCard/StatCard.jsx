import React from "react";
import "./StatCard.css";

/**
 * StatCard — reusable dashboard stat card
 * Props: icon (JSX), label, value, colorClass (safe|risk|caution|info|purple)
 */
function StatCard({ icon, label, value, colorClass = "info", onClick }) {
  return (
    <div
      className={`sc-card sc-${colorClass}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="sc-icon-wrap">{icon}</div>
      <div className="sc-body">
        <p className="sc-label">{label}</p>
        <h3 className="sc-value">{value ?? 0}</h3>
      </div>
    </div>
  );
}

export default StatCard;
