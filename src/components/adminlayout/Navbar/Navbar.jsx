import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import { logout, sendChangePasswordOtp, verifyAndChangePassword } from "../../../services/authService";
import { navigateTo } from "../../../config/basePath";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationSettings,
  updateNotificationSettings,
} from "../../../services/notificationService";
import Swal from "sweetalert2";
import { formatToDenmarkDateTime, getDenmarkTimeISOString } from "../../../utils/dateUtils";

const STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Hold', label: 'Hold' },
  { value: 'Pre-Approved', label: 'Pre-Approved' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Opened', label: 'Opened' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Auto-Cancelled', label: 'Auto-Cancelled' },
];

const formatCopenhagenTime = (dateStr) => {
  if (!dateStr) return '';
  const localStr = getDenmarkTimeISOString(new Date(dateStr));
  return formatToDenmarkDateTime(localStr);
};

const extractPermitNo = (n) => {
  if (!n) return "";

  // 1. Check metadata (string or object)
  if (n.metadata) {
    try {
      const meta = typeof n.metadata === "string" ? JSON.parse(n.metadata) : n.metadata;
      if (meta && meta.permitNo) return String(meta.permitNo).trim();
      if (meta && meta.permit_no) return String(meta.permit_no).trim();
      if (meta && meta.permitNumber) return String(meta.permitNumber).trim();
      if (meta && meta.PermitNo) return String(meta.PermitNo).trim();
      if (meta && meta.requestId) return String(meta.requestId).trim();
      if (meta && meta.request_id) return String(meta.request_id).trim();
    } catch (e) {
      console.error("Error parsing notification metadata:", e);
    }
  }

  // 2. Check direct properties on n
  if (n.PermitNo) return String(n.PermitNo).trim();
  if (n.permitNo) return String(n.permitNo).trim();
  if (n.permit_no) return String(n.permit_no).trim();
  if (n.permitNumber) return String(n.permitNumber).trim();
  if (n.permit_number) return String(n.permit_number).trim();
  if (n.permitRequestId) return String(n.permitRequestId).trim();
  if (n.permit_request_id) return String(n.permit_request_id).trim();
  if (n.request_id) return String(n.request_id).trim();
  if (n.requestId) return String(n.requestId).trim();
  if (n.requestNo) return String(n.requestNo).trim();
  if (n.request_no) return String(n.request_no).trim();
  if (n.id_number) return String(n.id_number).trim();

  // 3. Fallback: Parse from title or message using regex
  const text = `${n.title || ""} ${n.message || ""}`;

  const match =
    text.match(/(?:permit|request|id|no\.?)\s*(?:#|\:|\s)*([a-z0-9\-_]+)/i) ||
    text.match(/#([a-z0-9\-_]+)/i);

  if (
    match &&
    match[1] &&
    !["changed", "status", "has", "been", "was", "for", "the", "and"].includes(match[1].toLowerCase())
  ) {
    return match[1].trim();
  }

  return "";
};

const getNotificationStyleInfo = (title = "", message = "") => {
  const t = (title + " " + message).toLowerCase();

  if (t.includes("auto-cancelled") || t.includes("auto cancelled")) {
    return { typeClass: "notif-type-autocancelled", badgeText: "AUTO-CANCELLED" };
  }
  if (t.includes("pre-approved") || t.includes("pre approved") || t.includes("preok") || t.includes("pre-ok")) {
    return { typeClass: "notif-type-preapproved", badgeText: "PRE-APPROVED" };
  }
  if (t.includes("approved")) {
    return { typeClass: "notif-type-approved", badgeText: "APPROVED" };
  }
  if (t.includes("reject") || t.includes("denied")) {
    return { typeClass: "notif-type-rejected", badgeText: "REJECTED" };
  }
  if (t.includes("cancelled") || t.includes("cancel")) {
    return { typeClass: "notif-type-cancelled", badgeText: "CANCELLED" };
  }
  if (t.includes("closed") || t.includes("close")) {
    return { typeClass: "notif-type-closed", badgeText: "CLOSED" };
  }
  if (t.includes("hold")) {
    return { typeClass: "notif-type-hold", badgeText: "HOLD" };
  }
  if (t.includes("draft")) {
    return { typeClass: "notif-type-draft", badgeText: "DRAFT" };
  }
  // Default to Opened
  return { typeClass: "notif-type-opened", badgeText: "OPENED" };
};

/* ── Live Clock ── */
function LiveClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="navbar-clock">
      {time.toLocaleTimeString('en-US', {
        timeZone: 'Europe/Copenhagen',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })}
    </span>
  )
}

/* ── Sync label (updates every minute) ── */
function SyncLabel() {
  const [label, setLabel] = useState('Just now')

  useEffect(() => {
    let mins = 0
    const id = setInterval(() => {
      mins++
      setLabel(mins === 1 ? '1 min ago' : `${mins} mins ago`)
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  return <span className="sync-label">Sync: {label}</span>
}

/* ── Theme Switcher — controlled, synced with Layout state ── */
const THEMES = [
  { value: 'default-dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'midnight-blue', label: 'Midnight' },
  { value: 'steel-gray', label: 'Steel Gray' },
]

function ThemeSwitcher({ theme, onThemeChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const currentLabel = THEMES.find(t => t.value === theme)?.label ?? 'Dark'

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="theme-switcher" ref={ref}>
      <button className="theme-btn" onClick={() => setOpen(v => !v)}>
        {currentLabel}
        <i className="ti ti-chevron-down" style={{ fontSize: 12, opacity: 0.6 }} />
      </button>
      {open && (
        <div className="theme-menu">
          {THEMES.map(t => (
            <button
              key={t.value}
              className={`theme-option ${theme === t.value ? 'selected' : ''}`}
              onClick={() => {
                onThemeChange(t.value)
                setOpen(false)
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Module Switcher ── */
const MODULES = [
  { id: 'ptw', label: 'Permit to Work', path: '/dashboard', icon: 'ti-file-certificate' },
  { id: 'im', label: 'Incident Management', path: '/incident-management/dashboard', icon: 'ti-alert-triangle' },
  { id: 'so', label: 'Safety Observations', path: '/safety-observations/dashboard', icon: 'ti-eye' }
];

function ModuleSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveModule = () => {
    if (location.pathname.includes('/safety-observations')) return MODULES[2];
    if (location.pathname.includes('/incident-management')) return MODULES[1];
    return MODULES[0];
  };
  const currentModule = getActiveModule();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <h4
        onClick={() => setOpen(!open)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, userSelect: 'none' }}
        title="Switch Module"
      >
        {currentModule.icon && <i className={`ti ${currentModule.icon}`} style={{ fontSize: '18px', color: 'var(--accent-primary, #3B82F6)' }} />}
        {currentModule.label}
        <i className="ti ti-chevron-down" style={{ fontSize: '14px', opacity: 0.6, marginTop: '2px' }} />
      </h4>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '8px',
          background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 100, minWidth: '220px',
          padding: '4px'
        }}>
          {MODULES.map(m => (
            <div
              key={m.id}
              onClick={() => {
                navigate(m.path);
                setOpen(false);
              }}
              style={{
                padding: '10px 14px', cursor: 'pointer',
                background: currentModule.id === m.id ? 'var(--bg-card-hover, rgba(0,0,0,0.04))' : 'transparent',
                color: currentModule.id === m.id ? 'var(--accent-primary, #3B82F6)' : 'var(--text-main, #1e293b)',
                fontWeight: currentModule.id === m.id ? '600' : 'normal',
                borderRadius: '6px',
                fontSize: '14px',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                if (currentModule.id !== m.id) e.currentTarget.style.background = 'var(--bg-card-hover, rgba(0,0,0,0.04))';
              }}
              onMouseLeave={(e) => {
                if (currentModule.id !== m.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              {m.label}
              {currentModule.id === m.id && (
                <i className="ti ti-check" style={{ fontSize: '14px' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════ */
function Navbar({ toggleSidebar, theme, onThemeChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isPermitToWork = !location.pathname.includes('/incident-management') && !location.pathname.includes('/safety-observations');
  
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // ── Change Password Modal state ───────────────────
  const [cpModalOpen, setCpModalOpen] = useState(false);
  const [cpStep, setCpStep] = useState(1); // 1=sending OTP, 2=OTP+pass form
  const [cpMaskedPhone, setCpMaskedPhone] = useState("");
  const [cpDigits, setCpDigits] = useState(Array(6).fill(""));
  const cpInputRefs = useRef([]);
  const [cpNewPass, setCpNewPass] = useState("");
  const [cpConfirmPass, setCpConfirmPass] = useState("");
  const [cpShowNew, setCpShowNew] = useState(false);
  const [cpShowConfirm, setCpShowConfirm] = useState(false);
  const [cpLoading, setCpLoading] = useState(false);
  const [cpSending, setCpSending] = useState(false);
  const [cpError, setCpError] = useState("");
  const [cpSuccess, setCpSuccess] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const bellRef = useRef(null);

  const [currentUser, setCurrentUser] = useState({
    username: "Alex Mercer",
    role: "Site Manager",
    name: "Alex Mercer"
  });

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count);
    } catch (e) {
      console.error("Error fetching unread count:", e);
    }
  };

  const fetchNotificationsList = async (pageNum = 1, append = false) => {
    try {
      setIsLoading(true);
      const res = await getNotifications(pageNum, 10);
      if (append) {
        setNotifications(prev => [...prev, ...res.data]);
      } else {
        setNotifications(res.data);
      }
      setHasMore(res.page < res.totalPages);
      setPage(res.page);
    } catch (e) {
      console.error("Error fetching notifications:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const parsed = JSON.parse(u);
        setCurrentUser({
          username: parsed.username || "Alex Mercer",
          role: parsed.role || parsed.userType || "Site Manager",
          name: parsed.username || "Alex Mercer"
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, []);

  const handleToggleNotifications = async () => {
    const nextOpenState = !notificationsOpen;
    setNotificationsOpen(nextOpenState);
    if (nextOpenState) {
      await fetchNotificationsList(1, false);
      try {
        await markAllNotificationsRead();
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
      } catch (e) {
        console.error("Error marking all notifications as read on open:", e);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
    } catch (e) {
      console.error("Error marking all as read:", e);
    }
  };

  const handleNotificationClick = async (n) => {
    if (n.isRead === 0) {
      try {
        await markNotificationRead(n.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: 1 } : item));
      } catch (e) {
        console.error("Error marking notification as read:", e);
      }
    }

    setNotificationsOpen(false);

    const permitNo = extractPermitNo(n);
    if (permitNo) {
      navigate(`/list-request?permitNo=${encodeURIComponent(permitNo)}`, {
        state: { permitNo }
      });
    } else {
      navigate("/list-request");
    }
  };

  const handleOpenSettings = async () => {
    setDropdownOpen(false);
    setSettingsOpen(true);
    try {
      const data = await getNotificationSettings();
      const normSettings = {};
      STATUS_OPTIONS.forEach(opt => {
        const key = opt.value.toLowerCase().trim();
        normSettings[opt.value] = data[key] !== false;
      });
      setSettings(normSettings);
    } catch (e) {
      console.error("Error fetching notification settings:", e);
      const defaultSettings = {};
      STATUS_OPTIONS.forEach(opt => {
        defaultSettings[opt.value] = true;
      });
      setSettings(defaultSettings);
    }
  };

  const handleToggleSetting = (statusName) => {
    setSettings(prev => ({
      ...prev,
      [statusName]: !prev[statusName]
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await updateNotificationSettings(settings);
      setSettingsOpen(false);
      Swal.fire({
        title: "Success",
        text: "Notification settings saved successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        background: "var(--bg-card)",
        color: "var(--text-primary)",
      });
    } catch (e) {
      console.error("Error saving notification settings:", e);
      Swal.fire({
        title: "Error",
        text: "Failed to save settings. Please try again.",
        icon: "error",
        background: "var(--bg-card)",
        color: "var(--text-primary)",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
    navigateTo("/login");
  };

  // ── Change Password handlers ─────────────────────
  const handleOpenChangePassword = async () => {
    setDropdownOpen(false);
    setCpModalOpen(true);
    setCpStep(1);
    setCpDigits(Array(6).fill(""));
    setCpNewPass("");
    setCpConfirmPass("");
    setCpError("");
    setCpSuccess("");
    setCpSending(true);

    try {
      const res = await sendChangePasswordOtp();
      if (res && (res.statusCode === 200 || res.status === true)) {
        setCpMaskedPhone(res.maskedPhone || "");
        setCpStep(2);
        setCpSuccess(`OTP sent to your phone${res.maskedPhone ? ` ending in ${res.maskedPhone}` : ""}`);
        setTimeout(() => setCpSuccess(""), 4000);
        setTimeout(() => cpInputRefs.current[0]?.focus(), 200);
      } else {
        setCpError(res?.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setCpError(err?.response?.data?.message || err?.message || "Failed to send OTP.");
    } finally {
      setCpSending(false);
    }
  };

  const handleCpDigitChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...cpDigits]; next[idx] = val; setCpDigits(next);
    setCpError("");
    if (val && idx < 5) cpInputRefs.current[idx + 1]?.focus();
  };

  const handleCpDigitKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (cpDigits[idx]) { const next = [...cpDigits]; next[idx] = ""; setCpDigits(next); }
      else if (idx > 0) cpInputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) cpInputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) cpInputRefs.current[idx + 1]?.focus();
  };

  const handleCpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...cpDigits];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setCpDigits(next);
    cpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleCpSubmit = async (e) => {
    e.preventDefault();
    setCpError("");
    const otp = cpDigits.join("");
    if (otp.length < 6) { setCpError("Please enter the full 6-digit OTP."); return; }
    if (!cpNewPass || cpNewPass.length < 6) { setCpError("Password must be at least 6 characters."); return; }
    if (cpNewPass !== cpConfirmPass) { setCpError("Passwords do not match."); return; }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id === undefined || user?.id === null) { setCpError("Session error. Please login again."); return; }

    setCpLoading(true);
    try {
      const res = await verifyAndChangePassword({ id: user.id, otp, password: cpNewPass });
      if (res && (res.statusCode === 200 || res.status === true)) {
        setCpSuccess("Password changed successfully!");
        setTimeout(() => {
          setCpModalOpen(false);
          setCpDigits(Array(6).fill(""));
          setCpNewPass(""); setCpConfirmPass(""); setCpError(""); setCpSuccess("");
        }, 2000);
      } else {
        setCpError(res?.message || "Failed to change password.");
      }
    } catch (err) {
      setCpError(err?.response?.data?.message || err?.message || "An error occurred.");
    } finally {
      setCpLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "US";
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="top-navbar">

      {/* ── LEFT ── */}
      <div className="navbar-left">
        <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Toggle Sidebar">
          <i className="ti ti-menu-2" />
        </button>
        <div className="navbar-title">
          <div className="beam20-title-row">
            <ModuleSwitcher />
            <span className="beam20-nav-badge">BEAM 2.0</span>
          </div>
          <p>Operational Overview &amp; System Analytics</p>
        </div>
      </div>

      {/* ── CENTER — Status + Clock ── */}
      <div className="navbar-center">
        <LiveClock />
      </div>

      {/* ── RIGHT ── */}
      <div className="navbar-right">

        {/* Theme switcher — now controlled via Layout state */}
        <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />

        {/* Bell with badge */}
        {isPermitToWork && (
          <div className="bell-wrap" ref={bellRef}>
            <button
              className="navbar-bell"
              title="Notifications"
              aria-label="Notifications"
              onClick={handleToggleNotifications}
            >
              <i className="ti ti-bell" />
              {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
            </button>

            {notificationsOpen && (
              <div className="notifications-dropdown">
                <div className="nd-header">
                  <h5 className="nd-title">Notifications</h5>
                  {unreadCount > 0 && (
                    <button className="nd-mark-read" onClick={handleMarkAllRead}>
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="nd-list">
                  {notifications.length === 0 ? (
                    <div className="nd-empty">
                      {isLoading ? "Loading..." : "No notifications"}
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const styleInfo = getNotificationStyleInfo(n.title, n.message);
                      const permitNo = extractPermitNo(n);
                      return (
                        <button
                          key={n.id}
                          className={`nd-item ${n.isRead === 0 ? "unread" : ""} ${styleInfo.typeClass}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          {n.isRead === 0 && <span className="nd-item-dot" />}
                          <div className="nd-item-header">
                            <span className="nd-status-badge">{styleInfo.badgeText}</span>
                            <span className="nd-item-time">{formatCopenhagenTime(n.createdAt)}</span>
                          </div>
                          {permitNo && (
                            <div className="nd-item-permit">
                              <span className="nd-permit-label">Permit No:</span> <span className="nd-permit-value">#{permitNo}</span>
                            </div>
                          )}
                          <span className="nd-item-title">{n.title}</span>
                          <span className="nd-item-msg">{n.message}</span>
                        </button>
                      );
                    })
                  )}
                </div>
                {hasMore && (
                  <div className="nd-footer">
                    <button
                      className="nd-load-more"
                      onClick={() => fetchNotificationsList(page + 1, true)}
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : "Load older notifications"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Avatar + name + dropdown */}
        <div className="avatar-wrap" ref={dropdownRef}>
          <button
            className="navbar-user-btn"
            onClick={() => setDropdownOpen(v => !v)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="navbar-avatar-img">{getInitials(currentUser.name)}</div>
            <div className="navbar-user-info">
              <span className="navbar-user-name">{currentUser.name}</span>
              <span className="navbar-user-role">{currentUser.role}</span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="profile-dropdown" role="menu">

              {/* Header */}
              <div className="pd-head">
                <div className="pd-avatar">{getInitials(currentUser.name)}</div>
                <div>
                  <div className="pd-name">{currentUser.name}</div>
                  <div className="pd-role">{currentUser.role} · M3 South</div>
                </div>
              </div>

              {/* Account */}
              <div className="pd-section">
                <div className="pd-label">Account</div>
                <button
                  className="pd-item"
                  onClick={handleOpenChangePassword}
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                  <i className="ti ti-lock" /> Change Password
                </button>
                {isPermitToWork && (
                  <button
                    className="pd-item"
                    onClick={handleOpenSettings}
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <i className="ti ti-settings" /> Notification Settings
                  </button>
                )}
              </div>

              <div className="pd-divider" />

              {/* Logout */}
              <div className="pd-section">
                <button className="pd-item pd-logout" onClick={handleLogout}>
                  <i className="ti ti-logout" /> Logout
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Notification Settings Modal */}
      {settingsOpen && (
        <div className="ns-modal-overlay">
          <div className="ns-modal">
            <div className="ns-modal-header">
              <h3>Notification Settings</h3>
              <button className="ns-close-btn" onClick={() => setSettingsOpen(false)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="ns-modal-body">
              <p className="ns-subtitle">Enable or disable in-app notifications for permit request status changes:</p>
              <div className="ns-settings-list">
                {STATUS_OPTIONS.map((opt) => (
                  <div className="ns-setting-item" key={opt.value}>
                    <span className="ns-setting-label">{opt.label}</span>
                    <label className="ns-switch">
                      <input
                        type="checkbox"
                        checked={settings[opt.value] || false}
                        onChange={() => handleToggleSetting(opt.value)}
                      />
                      <span className="ns-slider round"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="ns-modal-footer">
              <button className="ns-btn-secondary" onClick={() => setSettingsOpen(false)}>
                Cancel
              </button>
              <button className="ns-btn-primary" onClick={handleSaveSettings}>
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {cpModalOpen && (
        <div className="ns-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setCpModalOpen(false); }}>
          <div className="ns-modal" style={{ maxWidth: 420, width: '100%' }}>
            <div className="ns-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-lock" style={{ color: '#818cf8' }} /> Change Password
              </h3>
              <button className="ns-close-btn" onClick={() => setCpModalOpen(false)}>
                <i className="ti ti-x" />
              </button>
            </div>

            <div className="ns-modal-body">
              {/* Sending OTP step */}
              {cpSending && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(226,232,240,0.6)', fontSize: 14 }}>
                  <div style={{ width: 32, height: 32, border: '3px solid rgba(129,140,248,0.3)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'nspin 0.7s linear infinite', margin: '0 auto 12px' }} />
                  Sending OTP to your phone...
                </div>
              )}

              {/* Error */}
              {cpError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fca5a5', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {cpError}
                </div>
              )}

              {/* Success */}
              {cpSuccess && (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#6ee7b7', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }}><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  {cpSuccess}
                </div>
              )}

              {/* OTP + password form (step 2) */}
              {cpStep === 2 && !cpSending && (
                <form onSubmit={handleCpSubmit} noValidate>
                  <p style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.5, color: 'var(--text-muted, #64748b)' }}>
                    Enter the 6-digit code sent to your phone{cpMaskedPhone ? <> ending in <strong style={{ color: '#6366f1' }}>{cpMaskedPhone}</strong></> : ""} and your new password.
                  </p>

                  {/* OTP inputs */}
                  <label className="cp-label">Verification Code</label>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 18 }} onPaste={handleCpPaste}>
                    {cpDigits.map((d, i) => (
                      <input
                        key={i}
                        ref={el => (cpInputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={e => handleCpDigitChange(e, i)}
                        onKeyDown={e => handleCpDigitKeyDown(e, i)}
                        autoComplete="one-time-code"
                        className="cp-otp-digit"
                      />
                    ))}
                  </div>

                  {/* New password */}
                  <div style={{ marginBottom: 12 }}>
                    <label className="cp-label">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={cpShowNew ? 'text' : 'password'}
                        placeholder="New password (min 6 chars)"
                        value={cpNewPass}
                        onChange={e => { setCpNewPass(e.target.value); setCpError(''); }}
                        className="cp-input"
                      />
                      <button type="button" onClick={() => setCpShowNew(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #64748b)', padding: 0 }}>
                        {cpShowNew
                          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        }
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div style={{ marginBottom: 20 }}>
                    <label className="cp-label">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={cpShowConfirm ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={cpConfirmPass}
                        onChange={e => { setCpConfirmPass(e.target.value); setCpError(''); }}
                        className="cp-input"
                      />
                      <button type="button" onClick={() => setCpShowConfirm(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #64748b)', padding: 0 }}>
                        {cpShowConfirm
                          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        }
                      </button>
                    </div>
                  </div>

                  <div className="ns-modal-footer" style={{ paddingTop: 0 }}>
                    <button type="button" className="ns-btn-secondary" onClick={() => setCpModalOpen(false)}>Cancel</button>
                    <button
                      type="submit"
                      className="ns-btn-primary"
                      disabled={cpLoading || cpDigits.join('').length < 6}
                    >
                      {cpLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar