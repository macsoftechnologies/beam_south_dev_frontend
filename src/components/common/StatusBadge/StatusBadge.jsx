import React from "react";
import "./StatusBadge.css";

const BADGE_MAP = {
  // Incident statuses
  open:           { label: "Open",            cls: "badge-open" },
  "in progress":  { label: "In Progress",     cls: "badge-inprogress" },
  investigating:  { label: "Investigating",   cls: "badge-investigating" },
  closed:         { label: "Closed",          cls: "badge-closed" },
  resolved:       { label: "Resolved",        cls: "badge-resolved" },
  // Severity / Risk
  critical:       { label: "Critical",        cls: "badge-critical" },
  high:           { label: "High",            cls: "badge-high" },
  medium:         { label: "Medium",          cls: "badge-medium" },
  low:            { label: "Low",             cls: "badge-low" },
  // Observation statuses
  pending:        { label: "Pending",         cls: "badge-pending" },
  "in review":    { label: "In Review",       cls: "badge-reviewing" },
  completed:      { label: "Completed",       cls: "badge-completed" },
  // PTW compatible
  approved:       { label: "Approved",        cls: "badge-approved" },
  rejected:       { label: "Rejected",        cls: "badge-rejected" },
  draft:          { label: "Draft",           cls: "badge-draft" },
};

/**
 * StatusBadge — renders a styled pill badge based on status string
 * Props: status (string), className (optional extra class)
 */
function StatusBadge({ status, className = "" }) {
  const key = (status || "").toLowerCase();
  const cfg = BADGE_MAP[key] || { label: status || "—", cls: "badge-default" };

  return (
    <span className={`hse-badge ${cfg.cls} ${className}`}>
      <span className="badge-dot" />
      {cfg.label}
    </span>
  );
}

export default StatusBadge;
