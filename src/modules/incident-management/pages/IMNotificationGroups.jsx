import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import Loader from "../../../components/common/Loader/Loader";
import Swal from "sweetalert2";
import {
  getIncidentNotificationGroup,
  getAvailableIncidentGroupUsers,
  addIncidentNotificationGroupMembers,
  updateIncidentNotificationGroupMember,
  removeIncidentNotificationGroupMember,
  seedDefaultIncidentNotificationGroup,
} from "../../../services/incidentService";
import "../../../styles/module-shared.css";
import "./IMList.css";
import "./IMNotificationGroups.css";

const BellGroupIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <circle cx="18" cy="4" r="3" fill="#3B82F6" stroke="none" />
  </svg>
);

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const InAppBellIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const EmailIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

export default function IMNotificationGroups() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [channelFilter, setChannelFilter] = useState("ALL");

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalRoleFilter, setModalRoleFilter] = useState("ALL");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [modalDefaultEmail, setModalDefaultEmail] = useState(true);
  const [modalDefaultSms, setModalDefaultSms] = useState(true);
  const [modalDefaultInApp, setModalDefaultInApp] = useState(true);

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState(null);

  // Load Group Members & Available Users
  const loadData = async () => {
    try {
      setLoading(true);
      const [membersData, candidatesData] = await Promise.all([
        getIncidentNotificationGroup(),
        getAvailableIncidentGroupUsers(),
      ]);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setAvailableUsers(Array.isArray(candidatesData) ? candidatesData : []);
    } catch (err) {
      console.error("Failed to load notification group data:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load notification group members.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.phoneNumber && m.phoneNumber.toLowerCase().includes(q)) ||
        (m.departmentName && m.departmentName.toLowerCase().includes(q)) ||
        (m.userType && m.userType.toLowerCase().includes(q));

      const matchRole =
        roleFilter === "ALL" ||
        (m.userType && m.userType.toLowerCase() === roleFilter.toLowerCase());

      const matchChannel =
        channelFilter === "ALL" ||
        (channelFilter === "EMAIL" && m.isEmailEnabled) ||
        (channelFilter === "SMS" && m.isSmsEnabled) ||
        (channelFilter === "INAPP" && m.isInAppEnabled);

      return matchQuery && matchRole && matchChannel;
    });
  }, [members, searchQuery, roleFilter, channelFilter]);

  // Unique roles for filter dropdown
  const availableRoles = useMemo(() => {
    const set = new Set();
    members.forEach((m) => {
      if (m.userType) set.add(m.userType);
    });
    return Array.from(set);
  }, [members]);

  // Metric counts
  const stats = useMemo(() => {
    const total = members.length;
    const emailCount = members.filter((m) => m.isEmailEnabled && m.email).length;
    const smsCount = members.filter((m) => m.isSmsEnabled && m.phoneNumber).length;
    const inAppCount = members.filter((m) => m.isInAppEnabled).length;
    return { total, emailCount, smsCount, inAppCount };
  }, [members]);

  // Toggle single channel for a member
  const handleToggleChannel = async (memberId, channelKey, currentValue) => {
    try {
      const updatedValue = !currentValue;
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, [channelKey]: updatedValue } : m
        )
      );

      await updateIncidentNotificationGroupMember(memberId, {
        [channelKey]: updatedValue,
      });
    } catch (err) {
      console.error("Failed to update notification channel:", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Could not save channel setting.",
      });
      loadData();
    }
  };

  // Remove a member from the group
  const handleRemoveMember = async (member) => {
    const result = await Swal.fire({
      title: "Remove from Group?",
      html: `Are you sure you want to remove <strong>${member.name || member.email}</strong> from the Incident Notification Group? They will no longer receive alerts.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Yes, Remove",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        setSaving(true);
        await removeIncidentNotificationGroupMember(member.id);
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        Swal.fire({
          icon: "success",
          title: "Removed",
          text: `${member.name || member.email} removed from group.`,
          timer: 1500,
          showConfirmButton: false,
        });
        loadData();
      } catch (err) {
        console.error("Failed to remove member:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to remove member.",
        });
      } finally {
        setSaving(false);
      }
    }
  };

  // Quick Seed Department Users
  const handleSeedDefaults = async () => {
    const result = await Swal.fire({
      title: "Import Department Users?",
      html: "This will add all active <strong>Department</strong> and <strong>Department1</strong> users into the notification group if they aren't already added.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563EB",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Yes, Import",
    });

    if (result.isConfirmed) {
      try {
        setSaving(true);
        const res = await seedDefaultIncidentNotificationGroup();
        Swal.fire({
          icon: "success",
          title: "Imported Successfully",
          text: `Added ${res.count || 0} department users to the notification group.`,
        });
        loadData();
      } catch (err) {
        console.error("Failed to seed department users:", err);
        Swal.fire({
          icon: "error",
          title: "Import Failed",
          text: "Failed to import department users.",
        });
      } finally {
        setSaving(false);
      }
    }
  };

  // Candidates for Add Modal
  const candidateUsers = useMemo(() => {
    return availableUsers.filter((u) => {
      const q = modalSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.departmentName && u.departmentName.toLowerCase().includes(q));

      const matchRole =
        modalRoleFilter === "ALL" ||
        (u.userType && u.userType.toLowerCase() === modalRoleFilter.toLowerCase());

      return matchQuery && matchRole;
    });
  }, [availableUsers, modalSearch, modalRoleFilter]);

  // Toggle user selection in Add Modal
  const handleToggleSelectUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllCandidates = () => {
    const unaddedIds = candidateUsers.filter((u) => !u.isAdded).map((u) => u.userId);
    if (selectedUserIds.length === unaddedIds.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(unaddedIds);
    }
  };

  // Submit Add Users Modal
  const handleAddSelectedUsers = async () => {
    if (selectedUserIds.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Users Selected",
        text: "Please select at least one user to add.",
      });
      return;
    }

    try {
      setSaving(true);
      const selectedMembers = availableUsers
        .filter((u) => selectedUserIds.includes(u.userId))
        .map((u) => ({
          userId: u.userId,
          employeeId: u.employeeId,
          name: u.name || u.username,
          email: u.email,
          phoneNumber: u.phoneNumber,
          userType: u.userType,
          departmentName: u.departmentName,
          isEmailEnabled: modalDefaultEmail,
          isSmsEnabled: modalDefaultSms,
          isInAppEnabled: modalDefaultInApp,
        }));

      await addIncidentNotificationGroupMembers(selectedMembers);
      setIsAddModalOpen(false);
      setSelectedUserIds([]);
      Swal.fire({
        icon: "success",
        title: "Members Added",
        text: `Successfully added ${selectedMembers.length} user(s) to the group.`,
        timer: 1500,
        showConfirmButton: false,
      });
      loadData();
    } catch (err) {
      console.error("Failed to add members:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add selected users.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Save Edit Member Modal
  const handleSaveEditMember = async (e) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      setSaving(true);
      await updateIncidentNotificationGroupMember(editingMember.id, {
        name: editingMember.name,
        email: editingMember.email,
        phoneNumber: editingMember.phoneNumber,
        isEmailEnabled: editingMember.isEmailEnabled,
        isSmsEnabled: editingMember.isSmsEnabled,
        isInAppEnabled: editingMember.isInAppEnabled,
      });
      setEditingMember(null);
      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Member details updated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
      loadData();
    } catch (err) {
      console.error("Failed to update member:", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Failed to update member details.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader message="Loading Incident Notification Group..." />;
  }

  return (
    <div className="mod-page-wrapper">
      <PageHeader
        title="Incident Notification Group"
        subtitle="Manage who receives SMS, Email, and In-App notifications when contractors submit incident reports"
        icon={<BellGroupIcon />}
        breadcrumbs={[
          { label: "Incident Management", path: "/incident-management/dashboard" },
          { label: "Notification Group" },
        ]}
      />

      <div className="mod-content-container im-notif-container">
        {/* Metric / Stat Summary Cards */}
        <div className="im-notif-stats-grid">
          <div className="im-notif-stat-card">
            <div className="im-notif-stat-header" style={{ color: "var(--text-muted)" }}>
              <span>Total Members</span>
              <span>👥</span>
            </div>
            <div className="im-notif-stat-value" style={{ color: "var(--text-main)" }}>
              {stats.total}
            </div>
            <div className="im-notif-stat-desc">
              Users configured to receive alerts
            </div>
          </div>

          <div className="im-notif-stat-card">
            <div className="im-notif-stat-header" style={{ color: "#3B82F6" }}>
              <span>Email Active</span>
              <span>✉️</span>
            </div>
            <div className="im-notif-stat-value" style={{ color: "#3B82F6" }}>
              {stats.emailCount}
            </div>
            <div className="im-notif-stat-desc">
              Members with valid email enabled
            </div>
          </div>

          <div className="im-notif-stat-card">
            <div className="im-notif-stat-header" style={{ color: "#10B981" }}>
              <span>SMS Active</span>
              <span>📱</span>
            </div>
            <div className="im-notif-stat-value" style={{ color: "#10B981" }}>
              {stats.smsCount}
            </div>
            <div className="im-notif-stat-desc">
              Members with mobile phone configured
            </div>
          </div>

          <div className="im-notif-stat-card">
            <div className="im-notif-stat-header" style={{ color: "#8B5CF6" }}>
              <span>In-App Active</span>
              <span>🔔</span>
            </div>
            <div className="im-notif-stat-value" style={{ color: "#8B5CF6" }}>
              {stats.inAppCount}
            </div>
            <div className="im-notif-stat-desc">
              Receives in-app navbar alerts
            </div>
          </div>
        </div>

        {/* Action Header & Filters Card */}
        <div className="im-notif-controls-card">
          <div className="im-notif-controls-wrapper">
            {/* Search and Filters */}
            <div className="im-notif-search-filters">
              <div className="im-notif-search-wrap">
                <span className="im-notif-search-icon">🔍</span>
                <input
                  type="text"
                  className="mod-form-input im-notif-search-input"
                  placeholder="Search by name, email, phone, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="im-notif-filters-row">
                <select
                  className="mod-form-select im-notif-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="ALL">All Roles</option>
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <select
                  className="mod-form-select im-notif-select"
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                >
                  <option value="ALL">All Channels</option>
                  <option value="EMAIL">Email Enabled</option>
                  <option value="SMS">SMS Enabled</option>
                  <option value="INAPP">In-App Enabled</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="im-notif-action-btns">
              <button
                type="button"
                className="mod-btn-primary im-btn-primary im-notif-btn-add"
                onClick={() => {
                  setSelectedUserIds([]);
                  setModalSearch("");
                  setModalRoleFilter("ALL");
                  setIsAddModalOpen(true);
                }}
              >
                + Add Members
              </button>
            </div>
          </div>
        </div>

        {/* ── UNIFIED RESPONSIVE TABLE VIEW ── */}
        <div className="im-notif-table-card">
          <div className="im-notif-scroll-hint">
            <span>💡 Swipe horizontally to view full table details</span>
            <span className="im-notif-scroll-arrow">→</span>
          </div>

          <div className="im-notif-table-scroll">
            <table className="im-notif-table">
              <thead>
                <tr>
                  <th style={{ width: "22%" }}>Member / User</th>
                  <th style={{ width: "16%" }}>Role &amp; Department</th>
                  <th style={{ width: "22%" }}>Contact Info</th>
                  <th style={{ width: "26%", textAlign: "center" }}>Notification Channels</th>
                  <th style={{ width: "14%", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-muted)" }}>
                      <div style={{ fontSize: "36px", marginBottom: "8px" }}>🔔</div>
                      <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-main)" }}>
                        No Group Members Found
                      </div>
                      <div style={{ fontSize: "13px", marginTop: "4px", maxWidth: "420px", margin: "4px auto 16px auto" }}>
                        Add users to this group so they receive instant SMS, Email, and In-App notifications when contractors submit incident reports.
                      </div>
                      <button
                        type="button"
                        className="mod-btn-primary im-btn-primary"
                        onClick={() => {
                          setSelectedUserIds([]);
                          setModalSearch("");
                          setModalRoleFilter("ALL");
                          setIsAddModalOpen(true);
                        }}
                      >
                        + Add Members
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id}>
                      {/* User Name & Avatar */}
                      <td>
                        <div className="im-notif-user-row">
                          <div className="im-notif-avatar">
                            {(member.name || member.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="im-notif-user-name">
                              {member.name || "—"}
                            </div>
                            <div className="im-notif-user-id">
                              ID: #{member.userId || member.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Department */}
                      <td>
                        <span
                          className="badge im-notif-role-badge"
                          style={{
                            background: member.userType?.toLowerCase().includes("dept")
                              ? "rgba(59, 130, 246, 0.12)"
                              : "rgba(100, 116, 139, 0.12)",
                            color: member.userType?.toLowerCase().includes("dept")
                              ? "#2563EB"
                              : "var(--text-main)",
                          }}
                        >
                          {member.userType || "Department"}
                        </span>
                        {member.departmentName && (
                          <div className="im-notif-dept-name">
                            {member.departmentName}
                          </div>
                        )}
                      </td>

                      {/* Contact Info (Email & Phone) */}
                      <td>
                        <div className="im-notif-contact-email">
                          <span>✉️</span> {member.email || <span style={{ color: "var(--text-muted)" }}>No email</span>}
                        </div>
                        <div className="im-notif-contact-phone">
                          <span>📱</span> {member.phoneNumber || <span style={{ color: "#EF4444" }}>No mobile (SMS disabled)</span>}
                        </div>
                      </td>

                      {/* Notification Channel Toggles */}
                      <td>
                        <div className="im-notif-channels-wrapper">
                          {/* In-App Toggle */}
                          <label
                            className={`im-notif-channel-toggle inapp ${member.isInAppEnabled ? "active" : ""}`}
                            title="Toggle In-App bell notification"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(member.isInAppEnabled)}
                              onChange={() =>
                                handleToggleChannel(member.id, "isInAppEnabled", member.isInAppEnabled)
                              }
                            />
                            <InAppBellIcon />
                            <span>In-App</span>
                          </label>

                          {/* Email Toggle */}
                          <label
                            className={`im-notif-channel-toggle email ${
                              member.isEmailEnabled && member.email ? "active" : ""
                            } ${!member.email ? "disabled" : ""}`}
                            title={member.email ? "Toggle Email dispatch" : "Email not configured"}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(member.isEmailEnabled && member.email)}
                              disabled={!member.email}
                              onChange={() =>
                                handleToggleChannel(member.id, "isEmailEnabled", member.isEmailEnabled)
                              }
                            />
                            <EmailIcon />
                            <span>Email</span>
                          </label>

                          {/* SMS Toggle */}
                          <label
                            className={`im-notif-channel-toggle sms ${
                              member.isSmsEnabled && member.phoneNumber ? "active" : ""
                            } ${!member.phoneNumber ? "disabled" : ""}`}
                            title={member.phoneNumber ? "Toggle SMS alert" : "Mobile phone not configured"}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(member.isSmsEnabled && member.phoneNumber)}
                              disabled={!member.phoneNumber}
                              onChange={() =>
                                handleToggleChannel(member.id, "isSmsEnabled", member.isSmsEnabled)
                              }
                            />
                            <PhoneIcon />
                            <span>SMS</span>
                          </label>
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="im-notif-actions-wrapper">
                          <button
                            type="button"
                            className="im-notif-btn-edit"
                            onClick={() => setEditingMember({ ...member })}
                            title="Edit member contact details"
                          >
                            <PencilIcon />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="im-notif-btn-delete"
                            onClick={() => handleRemoveMember(member)}
                            title="Remove member from notification group"
                          >
                            <TrashIcon />
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ADD MEMBERS MODAL
      ───────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="im-notif-modal-overlay">
          <div className="im-notif-modal-card">
            {/* Modal Header */}
            <div className="im-notif-modal-header">
              <div>
                <h3 className="im-notif-modal-title">
                  Add Group Members
                </h3>
                <p className="im-notif-modal-subtitle">
                  Select users to receive incident alerts via In-App, Email, and SMS.
                </p>
              </div>
              <button
                type="button"
                className="im-notif-modal-close"
                onClick={() => setIsAddModalOpen(false)}
                title="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="im-notif-modal-body">
              {/* Search & Filters */}
              <div className="im-notif-modal-search-row">
                <div className="im-notif-search-wrap">
                  <span className="im-notif-search-icon">🔍</span>
                  <input
                    type="text"
                    className="mod-form-input im-notif-search-input"
                    placeholder="Search by name, username, email..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                  />
                </div>
                <select
                  className="mod-form-select im-notif-select"
                  value={modalRoleFilter}
                  onChange={(e) => setModalRoleFilter(e.target.value)}
                >
                  <option value="ALL">All Roles</option>
                  <option value="Department">Department</option>
                  <option value="Department1">Department1</option>
                  <option value="Admin">Admin</option>
                  <option value="Site Manager">Site Manager</option>
                </select>
              </div>

              {/* Default Channel Checkboxes */}
              <div className="im-notif-modal-channels-card">
                <span className="im-notif-modal-channels-label">Default Channels:</span>
                <div className="im-notif-modal-channels-group">
                  <label className={`im-notif-modal-channel-chip ${modalDefaultInApp ? "active" : ""}`}>
                    <input
                      type="checkbox"
                      checked={modalDefaultInApp}
                      onChange={(e) => setModalDefaultInApp(e.target.checked)}
                    />
                    <InAppBellIcon />
                    <span>In-App</span>
                  </label>
                  <label className={`im-notif-modal-channel-chip ${modalDefaultEmail ? "active" : ""}`}>
                    <input
                      type="checkbox"
                      checked={modalDefaultEmail}
                      onChange={(e) => setModalDefaultEmail(e.target.checked)}
                    />
                    <EmailIcon />
                    <span>Email</span>
                  </label>
                  <label className={`im-notif-modal-channel-chip ${modalDefaultSms ? "active" : ""}`}>
                    <input
                      type="checkbox"
                      checked={modalDefaultSms}
                      onChange={(e) => setModalDefaultSms(e.target.checked)}
                    />
                    <PhoneIcon />
                    <span>SMS</span>
                  </label>
                </div>
              </div>

              {/* Selection Summary Bar */}
              <div className="im-notif-candidate-select-bar">
                <span>
                  Candidates ({candidateUsers.filter((u) => !u.isAdded).length} available)
                </span>
                {candidateUsers.filter((u) => !u.isAdded).length > 0 && (
                  <button
                    type="button"
                    className="im-notif-select-all-btn"
                    onClick={handleSelectAllCandidates}
                  >
                    {selectedUserIds.length === candidateUsers.filter((u) => !u.isAdded).length
                      ? "Deselect All"
                      : "Select All Available"}
                  </button>
                )}
              </div>

              {/* Candidate List */}
              <div className="im-notif-candidate-list-scroll">
                {candidateUsers.length === 0 ? (
                  <div className="im-notif-candidate-empty">
                    <div style={{ fontSize: "28px", marginBottom: "4px" }}>🔍</div>
                    <div style={{ fontWeight: 600, color: "var(--text-main)" }}>No matching users found</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Try adjusting your search query or role filter.
                    </div>
                  </div>
                ) : (
                  candidateUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u.userId);
                    const isDisabled = Boolean(u.isAdded);
                    return (
                      <div
                        key={u.userId || u.username}
                        className={`im-notif-candidate-item ${isDisabled ? "disabled" : ""} ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => !isDisabled && handleToggleSelectUser(u.userId)}
                      >
                        <div className="im-notif-candidate-checkbox" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            disabled={isDisabled}
                            checked={isDisabled || isSelected}
                            onChange={() => !isDisabled && handleToggleSelectUser(u.userId)}
                          />
                        </div>

                        <div className="im-notif-candidate-avatar">
                          {(u.name || u.username || "U").charAt(0).toUpperCase()}
                        </div>

                        <div className="im-notif-candidate-details">
                          <div className="im-notif-candidate-name-row">
                            <span className="im-notif-candidate-name">{u.name || u.username}</span>
                            <span className="im-notif-candidate-username">@{u.username}</span>
                          </div>
                          <div className="im-notif-candidate-meta-row">
                            {u.email && (
                              <span className="im-notif-candidate-meta-item">
                                <EmailIcon /> {u.email}
                              </span>
                            )}
                            {u.phoneNumber && (
                              <span className="im-notif-candidate-meta-item">
                                <PhoneIcon /> {u.phoneNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="im-notif-candidate-tags">
                          <span
                            className="badge im-notif-role-badge"
                            style={{
                              background: u.userType?.toLowerCase().includes("dept")
                                ? "rgba(59, 130, 246, 0.12)"
                                : "rgba(100, 116, 139, 0.12)",
                              color: u.userType?.toLowerCase().includes("dept")
                                ? "#2563EB"
                                : "var(--text-main)",
                            }}
                          >
                            {u.userType || "User"}
                          </span>
                          {u.departmentName && (
                            <span className="im-notif-candidate-dept-tag">{u.departmentName}</span>
                          )}
                          {isDisabled ? (
                            <span className="im-notif-candidate-status-tag in-group">✓ In Group</span>
                          ) : isSelected ? (
                            <span className="im-notif-candidate-status-tag selected-tag">Selected</span>
                          ) : (
                            <span className="im-notif-candidate-status-tag available">Available</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="im-notif-modal-footer">
              <div className="im-notif-modal-footer-count">
                Selected: <strong>{selectedUserIds.length}</strong> user(s)
              </div>
              <div className="im-notif-modal-footer-actions">
                <button
                  type="button"
                  className="mod-btn-outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="mod-btn-primary im-btn-primary"
                  onClick={handleAddSelectedUsers}
                  disabled={selectedUserIds.length === 0 || saving}
                >
                  {saving ? "Adding..." : `Add Selected Users (${selectedUserIds.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          EDIT MEMBER DETAILS MODAL
      ───────────────────────────────────────────────────────────── */}
      {editingMember && (
        <div className="im-notif-modal-overlay">
          <div className="im-notif-modal-card" style={{ maxWidth: "540px" }}>
            <div className="im-notif-modal-header">
              <div>
                <h3 className="im-notif-modal-title">Edit Group Member</h3>
                <p className="im-notif-modal-subtitle">Update contact info and alert channel preferences</p>
              </div>
              <button
                type="button"
                className="im-notif-modal-close"
                onClick={() => setEditingMember(null)}
                title="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <div className="im-notif-modal-body">
                <div style={{ marginBottom: "12px" }}>
                  <label className="mod-form-label">Full Name</label>
                  <input
                    type="text"
                    className="mod-form-input"
                    value={editingMember.name || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label className="mod-form-label">Email Address (for Email alerts)</label>
                  <input
                    type="email"
                    className="mod-form-input"
                    value={editingMember.email || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  />
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label className="mod-form-label">Mobile Phone Number (for SMS alerts)</label>
                  <input
                    type="text"
                    className="mod-form-input"
                    placeholder="+45 12345678"
                    value={editingMember.phoneNumber || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, phoneNumber: e.target.value })}
                  />
                </div>

                <div className="im-notif-modal-channels-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Notification Channels
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(editingMember.isInAppEnabled)}
                        onChange={(e) => setEditingMember({ ...editingMember, isInAppEnabled: e.target.checked })}
                      />
                      <span>Enable In-App Navbar Notifications</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(editingMember.isEmailEnabled)}
                        onChange={(e) => setEditingMember({ ...editingMember, isEmailEnabled: e.target.checked })}
                      />
                      <span>Enable Email Notifications</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(editingMember.isSmsEnabled)}
                        onChange={(e) => setEditingMember({ ...editingMember, isSmsEnabled: e.target.checked })}
                      />
                      <span>Enable SMS Notifications</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="im-notif-modal-footer">
                <div></div>
                <div className="im-notif-modal-footer-actions">
                  <button
                    type="button"
                    className="mod-btn-outline"
                    onClick={() => setEditingMember(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="mod-btn-primary im-btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
