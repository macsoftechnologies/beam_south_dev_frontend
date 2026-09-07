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

const BellGroupIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <circle cx="18" cy="4" r="3" fill="#3B82F6" stroke="none" />
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

      <div className="mod-content-container" style={{ padding: "0 24px 40px 24px" }}>
        {/* Metric / Stat Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div className="mod-card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Total Group Members
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-main)", marginTop: "4px" }}>
              {stats.total}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Users configured to receive alerts
            </div>
          </div>

          <div className="mod-card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: "12px", color: "#3B82F6", fontWeight: 600, textTransform: "uppercase" }}>
              ✉️ Email Alerts Active
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#3B82F6", marginTop: "4px" }}>
              {stats.emailCount}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Members with valid email enabled
            </div>
          </div>

          <div className="mod-card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: "12px", color: "#10B981", fontWeight: 600, textTransform: "uppercase" }}>
              📱 SMS Alerts Active
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#10B981", marginTop: "4px" }}>
              {stats.smsCount}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Members with mobile phone configured
            </div>
          </div>

          <div className="mod-card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: "12px", color: "#8B5CF6", fontWeight: 600, textTransform: "uppercase" }}>
              🔔 In-App Notifications
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#8B5CF6", marginTop: "4px" }}>
              {stats.inAppCount}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Receives in-app navbar alerts
            </div>
          </div>
        </div>

        {/* Action Header & Filters Card */}
        <div className="mod-card" style={{ padding: "20px", marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Search and Filters */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", flex: 1, minWidth: "300px" }}>
              <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                <input
                  type="text"
                  className="mod-form-input"
                  placeholder="Search by name, email, phone, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: "36px" }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    fontSize: "14px",
                  }}
                >
                  🔍
                </span>
              </div>

              <select
                className="mod-form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ width: "auto", minWidth: "150px" }}
              >
                <option value="ALL">All Roles</option>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <select
                className="mod-form-select"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                style={{ width: "auto", minWidth: "150px" }}
              >
                <option value="ALL">All Channels</option>
                <option value="EMAIL">Email Enabled</option>
                <option value="SMS">SMS Enabled</option>
                <option value="INAPP">In-App Enabled</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                className="mod-btn-outline"
                onClick={handleSeedDefaults}
                disabled={saving}
                title="Quickly add all Department and Department1 users"
              >
                👥 Quick-Import Dept Users
              </button>
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
            </div>
          </div>
        </div>

        {/* Group Members Table Card */}
        <div className="mod-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="mod-table-responsive">
            <table className="mod-table" style={{ width: "100%", margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: "24%" }}>Member / User</th>
                  <th style={{ width: "16%" }}>Role & Department</th>
                  <th style={{ width: "22%" }}>Contact Info</th>
                  <th style={{ width: "26%", textAlign: "center" }}>Notification Channels</th>
                  <th style={{ width: "12%", textAlign: "right" }}>Actions</th>
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
                        onClick={handleSeedDefaults}
                      >
                        👥 Import Department & Department1 Users
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id}>
                      {/* User Name & Avatar */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "14px",
                              flexShrink: 0,
                            }}
                          >
                            {(member.name || member.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "14px" }}>
                              {member.name || "—"}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                              ID: #{member.userId || member.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Department */}
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: member.userType?.toLowerCase().includes("dept")
                              ? "rgba(59, 130, 246, 0.12)"
                              : "rgba(100, 116, 139, 0.12)",
                            color: member.userType?.toLowerCase().includes("dept")
                              ? "#2563EB"
                              : "#475569",
                            fontWeight: 600,
                            padding: "4px 8px",
                            borderRadius: "4px",
                            display: "inline-block",
                            marginBottom: "4px",
                          }}
                        >
                          {member.userType || "Department"}
                        </span>
                        {member.departmentName && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {member.departmentName}
                          </div>
                        )}
                      </td>

                      {/* Contact Info (Email & Phone) */}
                      <td>
                        <div style={{ fontSize: "13px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>✉️</span> {member.email || <span style={{ color: "var(--text-muted)" }}>No email</span>}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>📱</span> {member.phoneNumber || <span style={{ color: "#EF4444" }}>No mobile (SMS disabled)</span>}
                        </div>
                      </td>

                      {/* Notification Channel Toggles */}
                      <td>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "16px",
                            alignItems: "center",
                          }}
                        >
                          {/* In-App Toggle */}
                          <label
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 500,
                              color: member.isInAppEnabled ? "var(--text-main)" : "var(--text-muted)",
                            }}
                            title="Toggle In-App bell notification"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(member.isInAppEnabled)}
                              onChange={() =>
                                handleToggleChannel(member.id, "isInAppEnabled", member.isInAppEnabled)
                              }
                            />
                            <span>In-App</span>
                          </label>

                          {/* Email Toggle */}
                          <label
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: member.email ? "pointer" : "not-allowed",
                              fontSize: "12px",
                              fontWeight: 500,
                              color: member.isEmailEnabled && member.email ? "#2563EB" : "var(--text-muted)",
                            }}
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
                            <span>Email</span>
                          </label>

                          {/* SMS Toggle */}
                          <label
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: member.phoneNumber ? "pointer" : "not-allowed",
                              fontSize: "12px",
                              fontWeight: 500,
                              color: member.isSmsEnabled && member.phoneNumber ? "#059669" : "var(--text-muted)",
                            }}
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
                            <span>SMS</span>
                          </label>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="mod-btn-outline"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                            onClick={() => setEditingMember({ ...member })}
                            title="Edit member contact details"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="mod-btn-outline"
                            style={{ padding: "4px 8px", fontSize: "12px", color: "#EF4444", borderColor: "#FCA5A5" }}
                            onClick={() => handleRemoveMember(member)}
                            title="Remove member from notification group"
                          >
                            🗑️
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
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            className="mod-card"
            style={{
              width: "100%",
              maxWidth: "760px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-main)" }}>
                  Add Users to Incident Notification Group
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                  Select users who should receive incident submission alerts via SMS, Email, and In-App.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <input
                type="text"
                className="mod-form-input"
                placeholder="Search candidates by name, username, email, department..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                className="mod-form-select"
                value={modalRoleFilter}
                onChange={(e) => setModalRoleFilter(e.target.value)}
                style={{ width: "160px" }}
              >
                <option value="ALL">All Roles</option>
                <option value="Department">Department</option>
                <option value="Department1">Department1</option>
                <option value="Admin">Admin</option>
                <option value="Site Manager">Site Manager</option>
              </select>
            </div>

            {/* Default Channel Checkboxes */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                padding: "10px 14px",
                background: "var(--bg-hover)",
                borderRadius: "6px",
                marginBottom: "16px",
                fontSize: "13px",
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--text-main)" }}>Default Channels:</span>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={modalDefaultInApp}
                  onChange={(e) => setModalDefaultInApp(e.target.checked)}
                />
                In-App
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={modalDefaultEmail}
                  onChange={(e) => setModalDefaultEmail(e.target.checked)}
                />
                Email
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={modalDefaultSms}
                  onChange={(e) => setModalDefaultSms(e.target.checked)}
                />
                SMS
              </label>
            </div>

            {/* Candidate List */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                marginBottom: "20px",
              }}
            >
              <table className="mod-table" style={{ width: "100%", margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: "40px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={
                          candidateUsers.filter((u) => !u.isAdded).length > 0 &&
                          selectedUserIds.length === candidateUsers.filter((u) => !u.isAdded).length
                        }
                        onChange={handleSelectAllCandidates}
                      />
                    </th>
                    <th>User / Name</th>
                    <th>Role & Department</th>
                    <th>Contact Info</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {candidateUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                        No matching users found.
                      </td>
                    </tr>
                  ) : (
                    candidateUsers.map((u) => (
                      <tr
                        key={u.userId || u.username}
                        onClick={() => !u.isAdded && handleToggleSelectUser(u.userId)}
                        style={{
                          cursor: u.isAdded ? "default" : "pointer",
                          backgroundColor: u.isAdded
                            ? "var(--bg-hover)"
                            : selectedUserIds.includes(u.userId)
                            ? "rgba(59, 130, 246, 0.08)"
                            : "transparent",
                        }}
                      >
                        <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            disabled={u.isAdded}
                            checked={u.isAdded || selectedUserIds.includes(u.userId)}
                            onChange={() => !u.isAdded && handleToggleSelectUser(u.userId)}
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{u.name || u.username}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>@{u.username}</div>
                        </td>
                        <td>
                          <span className="badge" style={{ fontSize: "11px" }}>
                            {u.userType}
                          </span>
                          {u.departmentName && (
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{u.departmentName}</div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: "12px", color: "var(--text-main)" }}>{u.email || "—"}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{u.phoneNumber || "—"}</div>
                        </td>
                        <td>
                          {u.isAdded ? (
                            <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 600 }}>
                              ✓ In Group
                            </span>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Available</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Selected: <strong>{selectedUserIds.length}</strong> user(s)
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
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
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            className="mod-card"
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-main)" }}>
                Edit Group Member
              </h3>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditMember}>
              <div style={{ marginBottom: "14px" }}>
                <label className="mod-form-label">Full Name</label>
                <input
                  type="text"
                  className="mod-form-input"
                  value={editingMember.name || ""}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label className="mod-form-label">Email Address (for Email alerts)</label>
                <input
                  type="email"
                  className="mod-form-input"
                  value={editingMember.email || ""}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label className="mod-form-label">Mobile Phone Number (for SMS alerts)</label>
                <input
                  type="text"
                  className="mod-form-input"
                  placeholder="+45 12345678"
                  value={editingMember.phoneNumber || ""}
                  onChange={(e) => setEditingMember({ ...editingMember, phoneNumber: e.target.value })}
                />
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  background: "var(--bg-hover)",
                  borderRadius: "6px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)", marginBottom: "8px", textTransform: "uppercase" }}>
                  Notification Channels
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(editingMember.isInAppEnabled)}
                      onChange={(e) => setEditingMember({ ...editingMember, isInAppEnabled: e.target.checked })}
                    />
                    Enable In-App Navbar Notifications
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(editingMember.isEmailEnabled)}
                      onChange={(e) => setEditingMember({ ...editingMember, isEmailEnabled: e.target.checked })}
                    />
                    Enable Email Notifications
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(editingMember.isSmsEnabled)}
                      onChange={(e) => setEditingMember({ ...editingMember, isSmsEnabled: e.target.checked })}
                    />
                    Enable SMS Notifications
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
