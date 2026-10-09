import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import "./Sidebar.css";
import { getMenuByRole } from './navigation.service';
import { getEffectiveRoleForModule } from '../../../../utils/modulePermissions';
import LogoImg from "../../../assets/images/Logo.jpeg";

/* ── NAV ITEM with collapsible submenu ── */
function NavItem({ icon, label, badge, paths, children }) {
  const { pathname } = useLocation()

  // Auto-open if any child path matches current URL
  const isChildActive = paths ? paths.some(p => pathname.startsWith(p)) : false
  const [open, setOpen] = useState(isChildActive)

  return (
    <>
      <button
        className={`nav-link nav-link-parent ${isChildActive ? 'active' : ''} ${open ? 'nav-link-open' : ''}`}
        onClick={() => setOpen(p => !p)}
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

/* ── SUB ITEM (supports nested level) ── */
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

/* ════════════════════════════════════════════ */
function Sidebar({ sidebarOpen }) {
  const { pathname } = useLocation()

  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    try {
      const activeUserType = localStorage.getItem("UserType");
      if (activeUserType) {
        setUserRole(activeUserType);
        return;
      }
      const u = localStorage.getItem("user")
      if (u) {
        const parsed = JSON.parse(u)
        const ptwRole = getEffectiveRoleForModule("permit-to-work", parsed);
        const roles = [];
        if (ptwRole) {
          String(ptwRole).split(",").forEach(r => roles.push(r.trim()));
        }
        if (parsed.role) {
          if (typeof parsed.role === "string") parsed.role.split(",").forEach(r => roles.push(r.trim()));
          else if (Array.isArray(parsed.role)) parsed.role.forEach(r => roles.push(String(r).trim()));
        }
        if (parsed.userType) {
          if (typeof parsed.userType === "string") parsed.userType.split(",").forEach(r => roles.push(r.trim()));
          else if (Array.isArray(parsed.userType)) parsed.userType.forEach(r => roles.push(String(r).trim()));
        }
        setUserRole(Array.from(new Set(roles.filter(Boolean))).join(","))
      }
    } catch (e) {
      console.error(e)
    }
  }, [pathname])

  // Helper: exact match or starts-with for parent routes
  const isActive = (path) => pathname === path || pathname.startsWith(path + '/')

  // Helper: map config state to actual React Router path
  const mapStateToPath = (state) => {
    if (!state) return "";
    const cleanState = state.replace(/^\//, "");
    const mapping = {
      "user/dashboard": "/dashboard",
      "user/executive-dashboard": "/executive-dashboard",
      // "admin/department": "/departments",
      "admin/listdepartment": "/departments",
      // "admin/sub-contractors": "/contractors",
      "admin/subcontractors-list": "/contractors",
      // "admin/employee": "/employees",
      "admin/listemployee": "/employees",
      "location/buildings": "/location/buildings",
      "location/floors": "/location/floors",
      "location/zones": "/location/zones",
      "location/rooms": "/location/rooms",
      // "user/electricalworks": "/electrical-works",
      "user/list-electricalworks": "/electrical-works",
      // "admin/electricalworks": "/electrical-works",
      "admin/list-electricalworks": "/electrical-works",
      // "user/mechanicalworks": "/mechanical-works",
      "user/list-mechanicalworks": "/mechanical-works",
      // "admin/mechanicalworks": "/mechanical-works",
      "admin/list-mechanicalworks": "/mechanical-works",
      "user/new-request": "/new-request",
      "user/list-request": "/list-request",
      "user/plans": "/reports",
      // "admin/activity": "/settings/activity",
      "admin/activity-list": "/settings/activity",
      // "admin/safety-precaution": "/settings/safety/precaution",
      "admin/safety-precautions-list": "/settings/safety/precaution",
      "user/log-history": "/log-history",
      "user/log-reports": "/logs-reports",
    };
    return mapping[cleanState] || `/${cleanState}`;
  };

  // Helper: map a menu item name or icon string to the corresponding Tabler Icon class
  const getIconClass = (item) => {
    const name = item.name ? item.name.toLowerCase() : "";
    const icon = item.icon ? item.icon.toLowerCase() : "";
    if (name.includes("dashboard")) return "ti-layout-dashboard";
    if (name.includes("department")) return "ti-sitemap";
    if (name.includes("contractor")) return "ti-briefcase";
    if (name.includes("employee")) return "ti-users-group";
    if (name.includes("location") || name.includes("zone")) return "ti-map-pin";
    if (name.includes("electrical")) return "ti-bolt";
    if (name.includes("mechanical")) return "ti-settings";
    if (name.includes("request")) return "ti-file-description";
    if (name.includes("report")) return "ti-chart-line";
    if (name.includes("settings")) return "ti-adjustments-horizontal";
    if (name.includes("history")) return "ti-clock";
    if (name.includes("logs")) return "ti-chart-bar";

    const iconMap = {
      dashboard: "ti-layout-dashboard",
      event: "ti-calendar",
      person: "ti-user",
      settings: "ti-settings",
      history: "ti-clock",
      assignment: "ti-clipboard",
    };
    return iconMap[icon] || "ti-circle";
  };

  // Helper: recursively collect all sub-paths for a menu item
  const collectPaths = (item) => {
    const paths = [];
    const recurse = (node) => {
      if (node.sub) {
        node.sub.forEach(recurse);
      } else if (node.state) {
        paths.push(mapStateToPath(node.state));
      }
    };
    recurse(item);
    return paths;
  };

  // Recursive sub-menu renderer
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

  const menuItems = getMenuByRole(userRole);

  const reportsAndSettingsNames = ["reports", "settings", "activity", "safety precaution", "log-history", "logs-reports"];
  let renderedMainLabel = false;
  let renderedReportsLabel = false;

  return (
    <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-closed'}`}>
      <div className="sidebar-inner">

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-mark" style={{ background: "transparent" }}>
            <img
              src={LogoImg}
              alt="M3 Logo"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "11px",
                objectFit: "cover",
              }}
            />
          </div>
          <div className="brand-text-wrap">
            <span className="brand-name">M3 South</span>
            <span className="brand-sub">MANAGEMENT</span>
          </div>
        </div>

        <nav>
          {menuItems.map((item) => {
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