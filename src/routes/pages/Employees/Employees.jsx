import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEye, FaEdit, FaTrash, FaFilter, FaFileCsv, FaArrowDown, FaTimes, FaSearch } from "react-icons/fa";
import * as XLSX from "xlsx";
import EmployeeForm from "../../forms/Employeesform/Employeesform";
import { getEmployees, addEmployee, updateEmployee, deleteEmployee, getRoles, searchEmployees, getContractors, getDepartments } from "../../services/authService";
import "../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;

const ActionButtons = ({ onView, onEdit, onDelete, showDelete }) => (
  <div className="dept-action-btns">
    <button className="dept-action-btn dept-action-btn--view" title="View" onClick={onView}>
      <FaEye />
    </button>
    <button className="dept-action-btn dept-action-btn--edit" title="Edit" onClick={onEdit}>
      <FaEdit />
    </button>
    {showDelete && (
      <button className="dept-action-btn dept-action-btn--delete" title="Delete" onClick={onDelete}>
        <FaTrash />
      </button>
    )}
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`dept-status-badge dept-status-badge--${status ? "active" : "inactive"}`}>
    {status ? "● Active" : "● Inactive"}
  </span>
);

const EMPLOYEE_TYPE_LABELS = {
  "Department": "ConM/HSE",
  "Department1": "C&Q",
  "Subcontractor": "Contractor",
  "Observer": "Observer"
};

const Employees = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [rolesList, setRolesList] = useState([]);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const parsed = JSON.parse(u);
        setUserRole(parsed.role || parsed.userType || "");
      } else {
        setUserRole(localStorage.getItem("UserType") || "");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [filterName, setFilterName] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [contractors, setContractors] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Fetch departments
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await getDepartments(1, 100);
        const rows = res?.data?.rows ?? res?.data ?? res ?? [];
        setDepartments(rows);
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };
    fetchDepts();
  }, []);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await getRoles(1, 100);
        const rows = res?.data?.rows ?? res?.data ?? res ?? [];
        setRolesList(rows);
      } catch (err) {
        console.error("Failed to load roles", err);
      }
    };
    fetchRoles();
  }, []);

  // Fetch contractors list for company filter
  useEffect(() => {
    const fetchContractorsList = async () => {
      try {
        const res = await getContractors(1, 100000, true);
        const rows = res?.data?.rows ?? res?.data ?? res ?? [];
        const sortedRows = [...rows].sort((a, b) => 
          (a.subContractorName || "").localeCompare(b.subContractorName || "", undefined, { sensitivity: 'base' })
        );
        setContractors(sortedRows);
      } catch (err) {
        console.error("Failed to load contractors", err);
      }
    };
    fetchContractorsList();
  }, []);

  const getEmployeeTypeDisplay = (userType) => {
    if (!userType) return "—";
    const types = typeof userType === "string" ? userType.split(",") : Array.isArray(userType) ? userType : [userType];
    return types.map(t => EMPLOYEE_TYPE_LABELS[t.trim()] || t.trim()).join(", ");
  };

  const getDepartmentDisplay = (item) => {
    const deptId = item.departId || item.obserId;
    if (!deptId) return "—";
    const dept = departments.find(d => String(d.id) === String(deptId));
    return dept ? dept.departmentName : "—";
  };

  // Fetch employees with search and filters
  const fetchEmployees = useCallback(async (page = 1, searchKeyword = filterName, company = filterCompany) => {
    setIsLoading(true);
    try {
      const res = await searchEmployees(searchKeyword, page, pageLimit, false, company);
      const rawData = res?.data ?? (Array.isArray(res) ? res : []);
      const rows = Array.isArray(rawData) ? rawData : (rawData?.rows ?? []);
      const count = res?.total ?? (Array.isArray(rawData) ? rawData.length : (rawData?.count ?? 0));
      setEmployeeList(rows);
      setTotalCount(count);
    } catch {
      showError("Failed to load employees");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit, filterName, filterCompany]);

  useEffect(() => {
    fetchEmployees(currentPage);
  }, [currentPage]);

  const handleFilter = () => {
    setCurrentPage(1);
    fetchEmployees(1, filterName, filterCompany);
  };

  const handleClear = () => {
    setFilterName("");
    setFilterCompany("");
    setCurrentPage(1);
    fetchEmployees(1, "", "");
  };

  const handleExportCSV = async () => {
    try {
      const res = await searchEmployees(filterName, 1, 100000, true, filterCompany);
      const rows = res?.data?.rows ?? res?.data ?? res ?? [];
      if (rows.length === 0) {
        alert("No data available to export.");
        return;
      }
      const headers = ["S.No", "Employee Name", "Badge Id", "Designation", "Employee Type", "Department", "Company Name", "Email ID", "Phonenumber"];
      const csvRows = rows.map((item, index) => {
        const badgeIdVal = item.badgeId ? '\t' + String(item.badgeId).replace(/"/g, '""') : "";
        const phoneVal = item.phonenumber ? '\t' + String(item.phonenumber).replace(/"/g, '""') : "";
        const empTypeVal = getEmployeeTypeDisplay(item.userType);
        const deptVal = getDepartmentDisplay(item);
        return [
          index + 1,
          `"${(item.employeeName || "").replace(/"/g, '""')}"`,
          `"${badgeIdVal}"`,
          `"${(item.designation || "").replace(/"/g, '""')}"`,
          `"${(empTypeVal || "").replace(/"/g, '""')}"`,
          `"${(deptVal || "").replace(/"/g, '""')}"`,
          `"${(item.companyName || "").replace(/"/g, '""')}"`,
          `"${(item.email || "").replace(/"/g, '""')}"`,
          `"${phoneVal}"`
        ].join(",");
      });
      const csvContent = "\uFEFF" + [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Employees_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      showError("Export failed");
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await searchEmployees(filterName, 1, 100000, true, filterCompany);
      const rows = res?.data?.rows ?? res?.data ?? res ?? [];
      if (rows.length === 0) {
        alert("No data available to export.");
        return;
      }
      const headers = ["S.No", "Employee Name", "Badge Id", "Designation", "Employee Type", "Department", "Company Name", "Email ID", "Phonenumber"];
      const wsData = [
        headers,
        ...rows.map((item, index) => [
          index + 1,
          item.employeeName || "",
          item.badgeId || "",
          item.designation || "",
          getEmployeeTypeDisplay(item.userType),
          getDepartmentDisplay(item),
          item.companyName || "",
          item.email || "",
          item.phonenumber || ""
        ])
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      const badgeIdColIndex = headers.indexOf('Badge Id');
      const phoneColIndex = headers.indexOf('Phonenumber');
      for (let r = 1; r < wsData.length; r++) {
        if (badgeIdColIndex !== -1) {
          const badgeCellRef = `${XLSX.utils.encode_col(badgeIdColIndex)}${r + 1}`;
          if (ws[badgeCellRef]) ws[badgeCellRef].t = 's';
        }
        if (phoneColIndex !== -1) {
          const phoneCellRef = `${XLSX.utils.encode_col(phoneColIndex)}${r + 1}`;
          if (ws[phoneCellRef]) ws[phoneCellRef].t = 's';
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Employees");
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Employees_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      showError("Export failed");
    }
  };

  const handleView = (item, index) => {
    setSelectedEmployee({ ...item, serial: startIndex + index + 1 });
    setViewOpen(true);
  };

  const handleEdit = (item, index) => {
    setSelectedEmployee({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deleteEmployee(item.id);
      showDeleteSuccess();
      const newPage = employeeList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchEmployees(newPage);
    } catch {
      showError("Failed to delete employee");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      let res;
      if (selectedEmployee && editOpen) {
        res = await updateEmployee(formData);
      } else {
        res = await addEmployee(formData);
      }

      if (res?.statusCode === 409 || res?.statusCode === 400 || (res?.message && res.message.toLowerCase().includes("username"))) {
        showError(res?.message || "Username already exists");
        return;
      }

      if (selectedEmployee && editOpen) {
        showSuccess("Employee updated successfully");
        setEditOpen(false);
        setSelectedEmployee(null);
      } else {
        showSuccess("Employee added successfully");
        setOpen(false);
      }
      fetchEmployees(currentPage);
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || "Operation failed";
      showError(errMsg);
    }
  };

  const totalPages = Math.ceil((totalCount || employeeList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  const columns = [
    { header: "S.No", accessor: "serial" },
    { header: "Employee Name", accessor: "name" },
    { header: "Badge Id", accessor: "badgeId" },
    { header: "Designation", accessor: "designation" },
    { header: "Employee Type", accessor: "employeeType" },
    { header: "Department", accessor: "department" },
    { header: "Company Name", accessor: "companyName" },
    { header: "Email ID", accessor: "email" },
    { header: "Phonenumber", accessor: "phoneNumber" },
    { header: "Actions", accessor: "actions" },
  ];

  const isAuthorized = ["superadmin", "admin"].includes(String(userRole).toLowerCase());

  const tableData = employeeList.map((item, index) => ({
    ...item,
    serial: startIndex + index + 1,
    name: item.employeeName,
    phoneNumber: item.phonenumber,
    employeeType: getEmployeeTypeDisplay(item.userType),
    department: getDepartmentDisplay(item),
    actions: (
      <ActionButtons
        onView={() => handleView(item, index)}
        onEdit={() => handleEdit(item, index)}
        onDelete={() => handleDelete(item)}
        showDelete={isAuthorized}
      />
    ),
  }));

  return (
    <div className="dept-page">

      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Employees</h1>
          <p className="dept-page-subtitle">Manage and configure all employee records</p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">{(totalCount || employeeList.length)} Total</span>
          <button className="dept-add-btn" onClick={() => { setSelectedEmployee(null); setOpen(true); }}>
            <span className="dept-add-btn__icon">＋</span>
            Add Employee
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="dept-table-card" style={{ marginBottom: "16px", padding: "16px 24px" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", fontWeight: "600", color: "#F9FAFB" }}>Filters</h3>
        <div className="df-form" style={{ padding: "0" }}>
          <div className="filters-grid">
            <div className="df-field" style={{ marginBottom: 0 }}>
              <label className="df-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>EMPLOYEE NAME / SEARCH KEYWORD</label>
              <input
                type="text"
                className="df-input"
                placeholder="Search by name, email, badge, designation..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFilter();
                }}
              />
            </div>
            <div className="df-field" style={{ marginBottom: 0 }}>
              <label className="df-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>COMPANY NAME</label>
              <select className="df-select" value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}>
                <option value="">All</option>
                {contractors.map(c => (
                  <option key={c.id} value={c.subContractorName}>{c.subContractorName}</option>
                ))}
              </select>
            </div>
            <div className="filters-actions">
              <button onClick={handleFilter} type="button" className="dept-add-btn" style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)', color: '#fff', border: '1.5px solid #38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 4px 18px rgba(14,165,233,0.35)', transition: 'all 0.2s ease' }}>
                <FaSearch style={{ marginRight: '6px' }} /> Search
              </button>
              <button onClick={handleClear} type="button" className="dept-add-btn" style={{ background: 'rgba(14,165,233,0.07)', color: '#9ca3af', border: '1.5px solid rgba(14,165,233,0.22)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s ease' }}>
                <FaTimes style={{ marginRight: '6px' }} /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="dept-table-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '12px' }}>
          <button onClick={handleExportCSV} className="dept-add-btn" style={{ backgroundColor: '#22C55E', border: 'none', cursor: 'pointer' }}>
            <FaFileCsv style={{ marginRight: '6px', fontSize: '1.1rem' }} /> CSV
          </button>
          <button onClick={handleExportExcel} className="dept-add-btn" style={{ backgroundColor: '#3B82F6', border: 'none', cursor: 'pointer' }}>
            <FaArrowDown style={{ marginRight: '6px' }} /> Excel
          </button>
        </div>
        <Table
          columns={columns}
          data={tableData}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Employee" size="xl" type="default" scrollable>
        <EmployeeForm onClose={() => setOpen(false)} onSubmit={handleSubmit} />
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Employee" size="xl" type="warning" scrollable>
        <EmployeeForm isEdit initialData={selectedEmployee} onClose={() => setEditOpen(false)} onSubmit={handleSubmit} />
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Employee Details" size="md" type="info" scrollable>
        {selectedEmployee && (
          <div className="dept-view-grid">
            <div className="dept-view-item">
              <span className="dept-view-label">Employee Name</span>
              <span className="dept-view-value">{selectedEmployee.employeeName}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Badge Id</span>
              <span className="dept-view-value dept-view-value--code">{selectedEmployee.badgeId || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Designation</span>
              <span className="dept-view-value">{selectedEmployee.designation || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Phone Number</span>
              <span className="dept-view-value">{selectedEmployee.phonenumber || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Role</span>
              <span className="dept-view-value dept-view-value--code">
                {rolesList.find(r => Number(r.id) === Number(selectedEmployee.roleId))?.roleName || (selectedEmployee.roleId === 0 ? "Admin" : selectedEmployee.role || "—")}
              </span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Employee Type</span>
              <span className="dept-view-value">
                {EMPLOYEE_TYPE_LABELS[selectedEmployee.userType] || selectedEmployee.userType || "—"}
              </span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Company Name</span>
              <span className="dept-view-value">{selectedEmployee.companyName || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Access</span>
              <StatusBadge status={selectedEmployee.access === "1" || selectedEmployee.access === true} />
            </div>
            <div className="dept-view-item" style={{ gridColumn: "1 / -1" }}>
              <span className="dept-view-label">Assigned Modules</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                {(() => {
                  const MODULE_MAP = {
                    "permit-to-work": "Permit to Work",
                    "incident-management": "Incident Management",
                    "safety-observations": "Safety Observations",
                    "safety-inspection": "Safety Inspection",
                    "spot-checks": "Spot Checks",
                  };
                  const raw = selectedEmployee.moduleAccess || selectedEmployee.module_access;
                  const mods = raw ? (typeof raw === "string" ? raw.split(",").map(m => m.trim()) : raw) : [];
                  if (!mods.length) {
                    return <span className="dept-view-value" style={{ color: "#9ca3af" }}>No modules assigned</span>;
                  }
                  return mods.map((m) => (
                    <span
                      key={m}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: "#065f46",
                        color: "#6ee7b7",
                        border: "1px solid #047857",
                      }}
                    >
                      {MODULE_MAP[m] || m}
                    </span>
                  ));
                })()}
              </div>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Email</span>
              <span className="dept-view-value">{selectedEmployee.email || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Username</span>
              <span className="dept-view-value dept-view-value--code">{selectedEmployee.username}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Serial No.</span>
              <span className="dept-view-value">#{selectedEmployee.serial}</span>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Employees;