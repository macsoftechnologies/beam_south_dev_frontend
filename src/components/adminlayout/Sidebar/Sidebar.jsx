import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import "./Sidebar.css";
import "./Sidebar.module.css";
import { getMenuByRole, imNavigationMenu, soNavigationMenu } from './navigation.service';
import LogoImg from "../../../assets/images/Logo.jpeg";

/* ════════════════════════════════════════════════════
   NAV ITEM — collapsible dropdown parent
════════════════════════════════════════════════════ */
function NavItem({ icon, label, badge, paths, children }) {
  const { pathname } = useLocation()
  const isChildActive = paths ? paths.some(p => pathname.startsWith(p)) : false
  const [open, setOpen] = useState(isChildActive)

  return (
    <>
      <button
        className={`nav-link nav-link-parent ${isChildActive ? 'active' : ''} ${open ? 'nav-link-open' : ''}`}
        onClick={() => setOpen(p => !p)}
        data-tooltip={label}
      >
        <span className="nav-icon-box">
          <i className={`ti ${icon}`} aria-hidden="true" />
        </span>
        <span className="nav-label">{label}</span>
        {badge && <span className={`nav-badge ${badge.color || ''}`}>{badge.text}</span>}
        <span className={`nav-chevron ${open ? 'open' : ''}`}>
          <i className="ti ti-chevron-down" aria-hidden="true" />
        </span>
      </button>
      {open && <ul className="submenu">{children}</ul>}
    </>
  )
}

/* ── Sub item (supports nested level) ── */
function SubItem({ href, label, subChildren }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  if (!subChildren) {
    const isActive = href && pathname === href
    return (
      <li>
        <Link to={href || '#'} className={`nav-sub-link ${isActive ? 'sub-active' : ''}`}>
          <span className="sub-dot" />
          {label}
        </Link>
      </li>
    )
  }

  return (
    <li>
      <button className="nav-sub-link nav-sub-toggle" onClick={() => setOpen(p => !p)}>
        <span className="sub-dot" />
        <span className="nav-label">{label}</span>
        <span className={`nav-chevron small ${open ? 'open' : ''}`}>
          <i className="ti ti-chevron-down" aria-hidden="true" />
        </span>
      </button>
      {open && <ul className="sub-submenu">{subChildren}</ul>}
    </li>
  )
}

/* ════════════════════════════════════════════════════
   MODULE CONTEXT — detect active module from pathname
════════════════════════════════════════════════════ */
function detectModule(pathname) {
  if (pathname.startsWith('/incident-management')) return 'im';
  if (pathname.startsWith('/safety-observations'))  return 'so';
  return 'ptw';
}

const MODULE_CONFIG = {
  im: {
    label: 'INCIDENT MGMT',
    sectionLabel: 'Incident Management',
    accentClass: 'brand-accent-im',
    icon: 'ti-alert-triangle',
    menu: imNavigationMenu,
  },
  so: {
    label: 'SAFETY OBS.',
    sectionLabel: 'Safety Observations',
    accentClass: 'brand-accent-so',
    icon: 'ti-shield-check',
    menu: soNavigationMenu,
  },
  ptw: null,  // PTW uses role-based menus
};

/* ════════════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════════════ */
function Sidebar({ sidebarOpen, toggleSidebar }) {
  const { pathname } = useLocation()

  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    try {
      const u = localStorage.getItem("user")
      if (u) {
        const parsed = JSON.parse(u)
        setUserRole(parsed.role || parsed.userType || "")
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const activeModule = detectModule(pathname);
  const moduleConf   = MODULE_CONFIG[activeModule];  // null for PTW

  // ── Helper: exact match or starts-with for parent routes
  const isActive = (path) => pathname === path || pathname.startsWith(path + '/')

  // ── Helper: map config state string to React Router path
  const mapStateToPath = (state) => {
    if (!state) return "";
    const cleanState = state.replace(/^\//, "");
    const mapping = {
      "user/dashboard":               "/dashboard",
      "user/executive-dashboard":     "/executive-dashboard",
      "admin/listdepartment":         "/departments",
      "admin/subcontractors-list":    "/contractors",
      "admin/listemployee":           "/employees",
      "location/buildings":           "/location/buildings",
      "location/floors":              "/location/floors",
      "location/zones":               "/location/zones",
      "location/rooms":               "/location/rooms",
      "user/list-electricalworks":    "/electrical-works",
      "admin/list-electricalworks":   "/electrical-works",
      "user/list-mechanicalworks":    "/mechanical-works",
      "admin/list-mechanicalworks":   "/mechanical-works",
      "user/new-request":             "/new-request",
      "user/list-request":            "/list-request",
      "user/plans":                   "/reports",
      "admin/activity-list":          "/settings/activity",
      "admin/safety-precautions-list":"/settings/safety/precaution",
      "user/log-history":             "/log-history",
      "user/log-reports":             "/logs-reports",
      // ── Incident Management ──
      "incident-management/dashboard":          "/incident-management/dashboard",
      "incident-management/list":               "/incident-management/list",
      "incident-management/create":             "/incident-management/create",
      "incident-management/reports":            "/incident-management/reports",
      // ── Safety Observations ──
      "safety-observations/dashboard":          "/safety-observations/dashboard",
      "safety-observations/list":               "/safety-observations/list",
      "safety-observations/create":             "/safety-observations/create",
      "safety-observations/corrective-actions": "/safety-observations/corrective-actions",
      "safety-observations/reports":            "/safety-observations/reports",
    };
    return mapping[cleanState] || `/${cleanState}`;
  };

  // ── Helper: name → Tabler icon class
  const getIconClass = (item) => {
    const name = item.name ? item.name.toLowerCase() : "";
    const icon = item.icon || "";
    // If icon is already a ti-* class, use it directly
    if (icon.startsWith("ti-")) return icon;
    if (name.includes("dashboard"))                  return "ti-layout-dashboard";
    if (name.includes("department"))                 return "ti-sitemap";
    if (name.includes("contractor"))                 return "ti-briefcase";
    if (name.includes("employee"))                   return "ti-users-group";
    if (name.includes("location") || name.includes("zone")) return "ti-map-pin";
    if (name.includes("electrical"))                 return "ti-bolt";
    if (name.includes("mechanical"))                 return "ti-settings";
    if (name.includes("request"))                    return "ti-file-description";
    if (name.includes("corrective"))                 return "ti-checkbox";
    if (name.includes("report"))                     return "ti-chart-line";
    if (name.includes("settings"))                   return "ti-adjustments-horizontal";
    if (name.includes("history"))                    return "ti-clock";
    if (name.includes("logs"))                       return "ti-chart-bar";
    if (name.includes("incident"))                   return "ti-alert-triangle";
    if (name.includes("observation"))                return "ti-shield-check";
    if (name.includes("add"))                        return "ti-plus";
    const iconMap = {
      dashboard: "ti-layout-dashboard",
      event:     "ti-calendar",
      person:    "ti-user",
      settings:  "ti-settings",
      history:   "ti-clock",
      assignment:"ti-clipboard",
    };
    return iconMap[icon] || "ti-circle";
  };

  // ── Collect all sub-paths for auto-open detection
  const collectPaths = (item) => {
    const paths = [];
    const recurse = (node) => {
      if (node.sub) { node.sub.forEach(recurse); }
      else if (node.state) { paths.push(mapStateToPath(node.state)); }
    };
    recurse(item);
    return paths;
  };

  // ── Recursive sub-menu renderer (PTW dropdown items)
  const renderSubMenu = (subItem, isNested = false) => {
    if (subItem.type === "dropDown" || subItem.sub) {
      return (
        <SubItem
          key={subItem.name}
          label={subItem.name}
          subChildren={
            <>
              {subItem.sub.map((nestedItem) => renderSubMenu(nestedItem, true))}
            </>
          }
        />
      );
    }
    const href = mapStateToPath(subItem.state);
    const isActiveLink = pathname === href;
    return (
      <li key={subItem.name}>
        <Link
          to={href}
          className={`nav-sub-link ${isNested ? "nested" : ""} ${isActiveLink ? "sub-active" : ""}`}
        >
          <span className={`sub-dot ${isNested ? "small" : ""}`} />
          {subItem.name}
        </Link>
      </li>
    );
  };

  // ── Decide which menu to render
  const menuItems = moduleConf ? moduleConf.menu : getMenuByRole(userRole);

  // PTW section-label trackers
  const reportsAndSettingsNames = ["reports", "settings", "activity", "safety precaution", "log-history", "logs-reports"];
  let renderedMainLabel    = false;
  let renderedReportsLabel = false;

  // ── Render a module-specific simple link item (IM / SO)
  const renderModuleLink = (item) => {
    const href = mapStateToPath(item.state);
    const active = isActive(href);
    return (
      <Link
        key={item.name}
        to={href}
        className={`nav-link ${active ? 'active' : ''}`}
        data-tooltip={item.name}
      >
        <span className="nav-icon-box">
          <i className={`ti ${getIconClass(item)}`} aria-hidden="true" />
        </span>
        <span className="nav-label">{item.name}</span>
      </Link>
    );
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-collapsed'} ${moduleConf ? `sidebar-module sidebar-${activeModule}` : ''}`}>

      {/* Mobile close button */}
      <button
        className="sidebar-close-btn"
        onClick={toggleSidebar}
        title="Close menu"
        aria-label="Close menu"
      >
        <i className="ti ti-x" />
      </button>

      {/* ── Brand header ── */}
      <div className={`sidebar-brand ${moduleConf ? moduleConf.accentClass : ''}`}>
        <div className="brand-mark" style={{ background: "transparent" }}>
          <img
            src={LogoImg}
            alt="M3 Logo"
            style={{ width: "100%", height: "100%", borderRadius: "11px", objectFit: "cover" }}
          />
        </div>
        <div className="brand-text-wrap">
          <span className="brand-name">M3 South</span>
          <span className="brand-sub">
            {moduleConf ? moduleConf.label : 'MANAGEMENT'}
          </span>
        </div>
      </div>

      {/* ── Scrollable nav ── */}
      <div className="sidebar-inner">
        <nav>

          {/* ──────────── MODULE MODE (IM or SO) ──────────── */}
          {moduleConf && (
            <>
              <div className="nav-section-label">{moduleConf.sectionLabel}</div>
              {menuItems.map(item => renderModuleLink(item))}
            </>
          )}

          {/* ──────────── PTW MODE (role-based) ──────────── */}
          {!moduleConf && menuItems.map((item) => {
            const itemKey = item.name;
            const elements = [];

            // Section Headers
            if (!renderedMainLabel) {
              elements.push(
                <div key="label-main" className="nav-section-label">Main</div>
              );
              renderedMainLabel = true;
            }

            if (!renderedReportsLabel && reportsAndSettingsNames.includes(item.name.toLowerCase())) {
              elements.push(
                <div key="label-reports" className="nav-section-label">Reports &amp; Settings</div>
              );
              renderedReportsLabel = true;
            }

            // Render menu item
            if (item.type === "dropDown" || item.sub) {
              elements.push(
                <NavItem
                  key={itemKey}
                  icon={getIconClass(item)}
                  label={item.name}
                  paths={collectPaths(item)}
                >
                  {item.sub.map((subItem) => renderSubMenu(subItem))}
                </NavItem>
              );
            } else {
              const href = mapStateToPath(item.state);
              elements.push(
                <Link
                  key={itemKey}
                  to={href}
                  className={`nav-link ${isActive(href) ? 'active' : ''}`}
                  data-tooltip={item.name}
                >
                  <span className="nav-icon-box">
                    <i className={`ti ${getIconClass(item)}`} aria-hidden="true" />
                  </span>
                  <span className="nav-label">{item.name}</span>
                </Link>
              );
            }

            return elements;
          })}

        </nav>
      </div>
    </aside>
  )
}

export default Sidebar