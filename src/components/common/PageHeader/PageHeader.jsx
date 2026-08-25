import React from "react";
import "./PageHeader.css";

/**
 * PageHeader — consistent page title + breadcrumb + action slot
 * Props: title, subtitle, icon (JSX), actions (JSX), breadcrumbs (array of {label, path?})
 */
function PageHeader({ title, subtitle, icon, actions, breadcrumbs = [] }) {
  return (
    <div className="ph-root">
      <div className="ph-left">
        {icon && <div className="ph-icon">{icon}</div>}
        <div>
          {breadcrumbs.length > 0 && (
            <div className="ph-breadcrumb">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="ph-crumb">
                  {crumb.label}
                  {i < breadcrumbs.length - 1 && (
                    <span className="ph-sep">›</span>
                  )}
                </span>
              ))}
            </div>
          )}
          <h1 className="ph-title">{title}</h1>
          {subtitle && <p className="ph-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </div>
  );
}

export default PageHeader;
