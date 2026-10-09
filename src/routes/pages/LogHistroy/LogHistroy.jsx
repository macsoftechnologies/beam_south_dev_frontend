import React, { useState, useEffect, useCallback } from "react";
import Table from "../../components/common/Table/Table";
import { searchRequests } from "../../services/requestService";
import { getContractors, getUser } from "../../services/authService";
import { getModuleUserContext } from "../../../utils/modulePermissions";
import { API_BASE_URL } from "../../services/api";
import "../styles/pages.css";
import LogHistoryModal from "./LogHistoryModel";

// Helper to convert yyyy-mm-dd date to dd-mm-yyyy format
const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr || dateStr === "—") return "—";
  const dateOnly = String(dateStr).split(/[ T]/)[0];
  const match = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return dateStr;
};
// Helper to pass long string values directly to Table component (where CSS handles ellipsis)
const trimLongValue = (value) => {
  if (!value || value === "—") return "—";
  return String(value);
};

const PAGE_LIMIT_DEFAULT = 30;

const SearchIcon = () => (
  <svg
    style={{
      position: "absolute",
      left: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      color: "#7a8aab",
    }}
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const LogHistory = () => {
  const [search, setSearch] = useState("");
  const [selectedContractor, setSelectedContractor] = useState("");
  const [contractorsList, setContractorsList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(PAGE_LIMIT_DEFAULT);
  const [requests, setRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const res = await getContractors(1, 1000);
        const raw = res?.data?.rows ?? res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : [];
        const sorted = list
          .slice()
          .sort((a, b) =>
            (a.subContractorName || a.Company_Name || "").localeCompare(
              b.subContractorName || b.Company_Name || "",
              undefined,
              { sensitivity: "base" }
            )
          );
        setContractorsList(sorted);

        const currentUser = getUser();
        const ptwCtx = getModuleUserContext("permit-to-work", currentUser);
        const isSubcontractor = ptwCtx.isContractor;
        const userContractorId = ptwCtx.contractorId || currentUser?.subContId || currentUser?.subcontractor_id || (isSubcontractor ? currentUser?.typeId : null);

        if (isSubcontractor && userContractorId) {
          setSelectedContractor(String(userContractorId));
        }
      } catch (err) {
        console.error("Failed to fetch contractors for log history", err);
      }
    };
    fetchContractors();
  }, []);

  const fetchLogHistory = useCallback(async (page = 1, searchQuery = "", contractorId = "") => {
    setIsLoading(true);
    try {
      const payload = {
        PermitNo: searchQuery.trim(),
        Page: page,
        End: pageLimit,
        Site_Id: 5,
      };
      if (contractorId) {
        payload.Sub_Contractor_Id = contractorId;
      }

      const res = await searchRequests(payload);

      // The API returns an array: [{ data: [...] }, { count: N }, ...]
      // res is either the array directly, or wrapped in res.data by axios
      const responseArray = Array.isArray(res) ? res : (res?.data ?? []);

      const rows = responseArray[0]?.data ?? [];
      const count = responseArray[1]?.count ?? rows.length;

      setRequests(rows);
      setTotalCount(Number(count));
    } catch (err) {
      console.error("Failed to fetch log history", err);
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit]);

  useEffect(() => {
    fetchLogHistory(currentPage, search, selectedContractor);
  }, [currentPage, search, selectedContractor, fetchLogHistory]);

  const columns = [
    { header: "Permit number", accessor: "permitNumber" },
    { header: "Activity", accessor: "activity" },
    { header: "Contractor", accessor: "contractor" },
    { header: "Building", accessor: "building" },
    { header: "Area", accessor: "area" },
    { header: "Level", accessor: "level" },
    { header: "Working Date", accessor: "workingDate" },
    { header: "Working After Midnight", accessor: "nightShift" },
    { header: "New Date", accessor: "newDate" },
    { header: "Actions", accessor: "actions" },
  ];

  const tableData = requests.map((item) => ({
    ...item,
    _rowonClick: () => setSelectedPermit(item),
    // permitNumber: item.PermitNo || "—",
    permitNumber: (
      <span
        onClick={() => setSelectedPermit(item)}
        style={{ color: "#4a9eff", cursor: "pointer", textDecoration: "underline" }}
      >
        {item.PermitNo || "—"}
      </span>
    ),
    activity: trimLongValue(item.Activity, 30),
    contractor: trimLongValue(item.subContractorName || item.Company_Name, 25),
    building: trimLongValue(item.building_name, 20),
    area: trimLongValue(item.zone_name || item.room_names || item.Room_Nos, 25),
    level: trimLongValue(item.Room_Type, 20),
    workingDate: formatDateToDDMMYYYY(item.Working_Date),
    nightShift: (item.night_shift === 1 || item.night_shift === "1") ? "Yes" : "No",
    newDate: formatDateToDDMMYYYY(item.new_date),
    actions: (
      <div className="dept-action-btns">
        <button
          className="dept-action-btn dept-action-btn--view"
          title="View Details Drawing"
          onClick={() => window.open(`${API_BASE_URL}/requests/logs-design/${item.PermitNo}`, '_blank')}
        >
          👁
        </button>
      </div>
    ),
  }));

  const totalPages = Math.ceil(totalCount / pageLimit);

  return (
    <div className="dept-page">

      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Log History</h1>
          <p className="dept-page-subtitle">View and search all permit log records</p>
        </div>
      </div>

      <div className="dept-table-card">

        {/* Search & Filter Header */}
        <div style={{ padding: "16px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Permit Search */}
          <div style={{ position: "relative", flex: "1 1 300px", maxWidth: "480px" }}>
            <SearchIcon />
            <input
              type="text"
              className="df-input"
              style={{
                width: "100%",
                paddingLeft: "42px",
                paddingRight: search ? "36px" : "14px",
                backgroundColor: "#1a2744",
                border: "1px solid #2e3f66",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "14px",
                height: "44px",
                outline: "none",
              }}
              placeholder="Enter Permit number"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setCurrentPage(1); }}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#7a8aab",
                  fontSize: "16px",
                  lineHeight: 1,
                  padding: "2px",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Contractor Filter */}
          <div style={{ width: "260px" }}>
            <select
              className="df-select"
              style={{
                width: "100%",
                backgroundColor: "#1a2744",
                border: "1px solid #2e3f66",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "14px",
                height: "44px",
                padding: "0 14px",
                outline: "none",
                cursor: "pointer",
              }}
              value={selectedContractor}
              onChange={(e) => {
                setSelectedContractor(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Contractors</option>
              {contractorsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.subContractorName || c.Company_Name}
                </option>
              ))}
            </select>
          </div>
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

      <LogHistoryModal
        permit={selectedPermit}
        onClose={() => setSelectedPermit(null)}
      />

    </div>
  );
};

export default LogHistory;