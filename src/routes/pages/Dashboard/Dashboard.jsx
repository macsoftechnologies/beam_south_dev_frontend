import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import { getRequestCounts, getPlans, getGraphCountsPerDay, getGraphSummary, getZoneStatusCounts, getEmployeeAnalyticsCounts, searchDashboardRequests, getUserLogs } from '../../services/authService';
import Modal from '../../components/common/Modal/Modal';
import { formatToDenmarkDate } from '../../utils/dateUtils';
import { navigateTo } from '../../config/basePath';
import EmployeeForm from '../../forms/Employeesform/Employeesform';
import ContractorForm from '../../forms/Contractorsform/Contractorform';
import './Dashboard.css';
// import {
//   showSuccessToast,
//   showErrorToast,
//   showDeleteConfirm,
// } from '../../components/common/Toast/Toast'

Chart.register(...registerables)
Chart.defaults.font.family = "'Poppins', sans-serif"

/* ── INLINE SVG ICONS ──────────────────────── */
const Icons = {
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  DoorOpen: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  XCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  Stack: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <rect x="2" y="10" width="20" height="5" rx="1" />
      <rect x="2" y="17" width="20" height="5" rx="1" />
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  PersonPlus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  Briefcase: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  ExclamationCircle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  GeoAlt: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  BarChart: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  ConeStriped: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  GearWide: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  ),
  BuildingCheck: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Buildings: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  BriefcaseLg: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  PeopleFill: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
}

/* ── STAT CARD ─────────────────────────────── */
function StatCard({ colorClass, icon: IconComp, value, label, onClick }) {
  return (
    <div className={`stat-card-prime ${colorClass}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="icon-bubble">
        <IconComp />
      </div>
      <h3 className="val-prime">{value}</h3>
      <p className="lab-prime">{label}</p>
    </div>
  )
}

/* ── RECENT REQUESTS TABLE ─────────────────── */
const recentRequests = [
  { permit: '220969065042026', activity: 'Electrical', contractor: 'Alpha Build', status: 'Approved', badgeClass: 'badge-success' },
  { permit: '220969065042032', activity: 'HVAC', contractor: 'Cooling Tech', status: 'Hold', badgeClass: 'badge-warning' },
  { permit: '220969065042111', activity: 'Plumbing', contractor: 'WaterWorks', status: 'Closed', badgeClass: 'badge-primary' },
  { permit: '220969065042322', activity: 'Scaffolding', contractor: 'Safe Erectors', status: 'Rejected', badgeClass: 'badge-danger' },
  { permit: '220969065042398', activity: 'Welding', contractor: 'Metal Masters', status: 'Approved', badgeClass: 'badge-success' },
]

/* ── PENDING APPROVALS TABLE ───────────────── */
const pendingApprovals = [
  { permit: '220969065042026', activity: 'Welding', contractor: 'Metal Masters' },
  { permit: '220969065042032', activity: 'Crane Ops', contractor: 'Heavy Lift' },
  { permit: '220969065042111', activity: 'Excavation', contractor: 'Dig Deep' },
  { permit: '220969065042322', activity: 'Concrete', contractor: 'Solid Base' },
  { permit: '220969065042450', activity: 'Roofing', contractor: 'Top Build' },
]

/* ── LOG COLOR HELPER ───────────────────────── */
function getLogStyle(action) {
  if (!action) return { dot: '#64748B', catColor: '#64748B', category: 'Log' };
  const a = action.toUpperCase();

  // Errors / Failures
  if (a.includes('FAILURE') || a.includes('ERROR') || a.includes('FAIL'))
    return { dot: '#EF4444', catColor: '#EF4444', category: 'Failure' };

  // Deletes — red-orange
  if (a.includes('DELETED') || a.includes('DELETE'))
    return { dot: '#F97316', catColor: '#F97316', category: 'Deleted' };

  // Created — green
  if (a.includes('CREATED') || a.includes('SUCCESS'))
    return { dot: '#10B981', catColor: '#10B981', category: 'Created' };

  // Updated — amber
  if (a.includes('UPDATED') || a.includes('UPDATE'))
    return { dot: '#F59E0B', catColor: '#F59E0B', category: 'Updated' };

  // Permit / Request actions — purple
  if (a.includes('PERMIT') || a.includes('REQUEST'))
    return { dot: '#8B5CF6', catColor: '#8B5CF6', category: 'Permit' };

  // Auth — blue
  if (a.includes('LOGIN'))
    return { dot: '#3B82F6', catColor: '#3B82F6', category: 'Login' };
  if (a.includes('LOGOUT'))
    return { dot: '#F97316', catColor: '#F97316', category: 'Logout' };
  if (a.includes('OTP'))
    return { dot: '#6366F1', catColor: '#6366F1', category: 'OTP' };

  // Search / List — slate
  if (a.includes('SEARCH') || a.includes('LIST'))
    return { dot: '#64748B', catColor: '#64748B', category: 'Search' };

  // Default — cyan
  return { dot: '#06B6D4', catColor: '#06B6D4', category: 'API' };
}


/* ═══════════════════════════════════════════ */
function Dashboard() {
  const navigate = useNavigate();
  const user = localStorage.getItem("user");
  const parsedUser = user ? JSON.parse(user) : null;
  const rawRole = (localStorage.getItem("UserType") || parsedUser?.role || parsedUser?.userType || parsedUser?.user_type || "").toLowerCase();
  const userTypesArr = Array.isArray(parsedUser?.userTypes)
    ? parsedUser.userTypes.map(t => String(t).toLowerCase())
    : (Array.isArray(parsedUser?.userType) ? parsedUser.userType.map(t => String(t).toLowerCase()) : [rawRole]);

  const isObserver = rawRole.includes("observer") || (!rawRole && userTypesArr.some(t => t.includes("observer")));
  const isDepartment = !isObserver && (rawRole.includes("department") || userTypesArr.some(t => t.includes("department")));
  const isContractor = !isObserver && (rawRole.includes("subcontractor") || rawRole.includes("contractor") || (!isDepartment && userTypesArr.some(t => t.includes("subcontractor") || t.includes("contractor"))));
  const isDepartmentOrContractor = isDepartment || isContractor;

  const barChartRef = useRef(null)
  const donutChartRef = useRef(null)
  const barChartInst = useRef(null)
  const donutChartInst = useRef(null)

  const [showAllStats, setShowAllStats] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);

  const [counts, setCounts] = useState({
    totalCount: 0,
    draftCount: 0,
    holdCount: 0,
    preApprovedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    openedCount: 0,
    cancelledCount: 0,
    autoCancelledCount: 0,
    closedCount: 0,
    approved: 0,
    open: 0,
    closed: 0,
    rejected: 0,
    total: 0
  });
  const [todaySummary, setTodaySummary] = useState({
    totalCount: 0,
    nightshiftCount: 0,
    draftCount: 0,
    holdCount: 0,
    preApprovedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    openedCount: 0,
    cancelledCount: 0,
    autoCancelledCount: 0,
    closedCount: 0
  });
  const [zoneCounts, setZoneCounts] = useState({ UC: 0, C: 0, HO: 0 });
  const [employeeCounts, setEmployeeCounts] = useState({ departments: 0, contractors: 0, observers: 0, total: 0 });
  const [recentRequestsList, setRecentRequestsList] = useState(recentRequests);
  const [pendingApprovalsList, setPendingApprovalsList] = useState(pendingApprovals);
  const [recentLogsData, setRecentLogsData] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekLabel, setWeekLabel] = useState("");
  const [graphData, setGraphData] = useState(null);

  const getWeekRange = (offset = 0) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    // Shift so week starts Monday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const first = new Date(today);
    first.setDate(today.getDate() + diffToMonday + offset * 7);

    const last = new Date(first);
    last.setDate(first.getDate() + 6);

    const pad = (d) => d.toISOString().split('T')[0];

    return {
      firstDay: pad(first),
      lastDay: pad(last),
      label: `${first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    };
  };

  // ─── LOAD WEEKLY GRAPH DATA ─────────────────
  useEffect(() => {
    const { firstDay, lastDay, label } = getWeekRange(weekOffset);
    setWeekLabel(label);

    const fetchGraphData = async () => {
      try {
        const res = await getGraphCountsPerDay(firstDay, lastDay);
        console.log(res);
        // API wraps in { data: [...] } or returns array directly
        const raw = res?.data ?? res ?? null;

        // Extract the array regardless of nesting
        const arr = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : null;

        console.log("Graph API response:", res);
        console.log("Graph data array:", arr);

        setGraphData(arr);
      } catch (err) {
        console.error("Failed to load daily graph data", err);
        setGraphData(null);
      }
    };

    fetchGraphData();
  }, [weekOffset]);

  // ─── RENDER BAR CHART ──────────────────────
  useEffect(() => {
    // Default empty data — never use static fallback numbers
    let labels = [];
    let approvedData = [];
    let openData = [];
    let closedData = [];
    let rejectedData = [];

    if (Array.isArray(graphData) && graphData.length > 0) {
      graphData.forEach((dayObj) => {
        // ✅ date already formatted e.g. " Wednesday 14/01/26" — just trim it
        labels.push((dayObj.date ?? "").trim());

        // ✅ correct field names from your API
        approvedData.push(Number(dayObj.approveCount ?? dayObj.Approved ?? dayObj.approved ?? 0));
        openData.push(Number(dayObj.openCount ?? dayObj.Open ?? dayObj.open ?? 0));
        closedData.push(Number(dayObj.closeCount ?? dayObj.Closed ?? dayObj.closed ?? 0));
        rejectedData.push(Number(dayObj.rejectCount ?? dayObj.Rejected ?? dayObj.rejected ?? 0));
      });
    } else {
      // No data yet — show empty placeholder labels
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      approvedData = rejectedData = openData = closedData = [0, 0, 0, 0, 0, 0, 0];
    }

    if (!barChartRef.current) return;

    if (barChartInst.current) {
      barChartInst.current.destroy();
      barChartInst.current = null;
    }

    const ctx = barChartRef.current.getContext('2d');
    const computedStyle = getComputedStyle(document.documentElement);
    const textColor = computedStyle.getPropertyValue('--text-main').trim() || '#fff';
    const gridColor = computedStyle.getPropertyValue('--border-light').trim() || 'rgba(255,255,255,0.07)';

    // Compute a clean round stepSize so Y-axis shows 0, 100, 200... or 0, 500, 1000... etc.
    const allValues = [...approvedData, ...openData, ...closedData, ...rejectedData];
    const maxVal = Math.max(...allValues, 1);
    const niceStepSize = (() => {
      const raw = maxVal / 5;  // target ~5 ticks
      const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
      const normalized = raw / magnitude;
      let nice;
      if (normalized <= 1) nice = 1;
      else if (normalized <= 2) nice = 2;
      else if (normalized <= 5) nice = 5;
      else nice = 10;
      return nice * magnitude;
    })();

    barChartInst.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Approved',
            data: approvedData,
            backgroundColor: '#8B5CF6',
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Open',
            data: openData,
            backgroundColor: '#06B6D4',
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Closed',
            data: closedData,
            backgroundColor: '#10B981',
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Rejected',
            data: rejectedData,
            backgroundColor: '#FB7185',
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        onClick: (event, elements) => {
          if (elements.length > 0 && barChartInst.current) {
            const firstElement = elements[0];
            const datasetIndex = firstElement.datasetIndex;
            const index = firstElement.index;
            const datasetLabel = barChartInst.current.data.datasets[datasetIndex].label;
            const status = datasetLabel === 'Open' ? 'Opened' : datasetLabel;
            
            const label = barChartInst.current.data.labels[index];
            let parsedDate = null;
            const parts = (label ?? "").trim().split(" ");
            const datePart = parts[parts.length - 1];
            if (datePart && datePart.includes("/")) {
              const [day, month, yearShort] = datePart.split("/");
              parsedDate = `20${yearShort}-${month}-${day}`;
            }

            navigate('/list-request', {
              state: {
                status,
                fromDate: parsedDate,
                toDate: parsedDate
              }
            });
          }
        },
        onHover: (event, chartElements) => {
          event.native.target.style.cursor = chartElements.length > 0 ? 'pointer' : 'default';
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 11, padding: 18, color: textColor },
          },
          tooltip: {
            callbacks: {
              // Trim the leading space from date label in tooltip
              title: (items) => (items[0]?.label ?? "").trim(),
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor,
              precision: 0,
              stepSize: niceStepSize,
            },
            grid: { color: gridColor },
          },
          x: {
            ticks: {
              color: textColor,
              maxRotation: 0,
              minRotation: 0,
              font: { size: 11 },
            },
            grid: { display: false },
          },
        },
      },
    });

    return () => {
      if (barChartInst.current) {
        barChartInst.current.destroy();
        barChartInst.current = null;
      }
    };
  }, [graphData]); // ✅ re-renders whenever graphData changes

  // ─── LOAD OVERALL COUNTS, SUMMARY & PLANS ───
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await getRequestCounts();
        const raw = res?.data ?? res ?? null;
        if (raw) {
          let approved = 0, open = 0, closed = 0, rejected = 0, total = 0;

          // Handle format: [ { totalCount: 10418, approvedCount: 71, ... } ] or similar
          const list = Array.isArray(raw) ? raw : [raw];
          const dataObj = list[0];

          if (dataObj && (
            'approvedCount' in dataObj ||
            'totalCount' in dataObj ||
            'draftCount' in dataObj ||
            'closedCount' in dataObj
          )) {
            approved = Number(dataObj.approvedCount ?? 0);
            open = Number(dataObj.draftCount ?? 0) +
              Number(dataObj.holdCount ?? 0) +
              Number(dataObj.preApprovedCount ?? 0) +
              Number(dataObj.openedCount ?? 0);
            closed = Number(dataObj.closedCount ?? 0);
            rejected = Number(dataObj.rejectedCount ?? 0) +
              Number(dataObj.cancelledCount ?? 0) +
              Number(dataObj.autoCancelledCount ?? 0);
            total = Number(dataObj.totalCount ?? (approved + open + closed + rejected));

            setCounts({
              totalCount: Number(dataObj.totalCount ?? 0),
              draftCount: Number(dataObj.draftCount ?? 0),
              holdCount: Number(dataObj.holdCount ?? 0),
              preApprovedCount: Number(dataObj.preApprovedCount ?? 0),
              approvedCount: Number(dataObj.approvedCount ?? 0),
              rejectedCount: Number(dataObj.rejectedCount ?? 0),
              openedCount: Number(dataObj.openedCount ?? 0),
              cancelledCount: Number(dataObj.cancelledCount ?? 0),
              autoCancelledCount: Number(dataObj.autoCancelledCount ?? 0),
              closedCount: Number(dataObj.closedCount ?? 0),
              approved,
              open,
              closed,
              rejected,
              total
            });
          } else {
            // Legacy / alternate format parsing
            if (Array.isArray(raw)) {
              raw.forEach(item => {
                const status = (item.Request_status || item.status || "").toLowerCase();
                const count = Number(item.count || item.total || 0);
                if (status === "approved") approved = count;
                else if (status === "open" || status === "draft") open += count;
                else if (status === "closed" || status === "completed") closed = count;
                else if (status === "rejected") rejected = count;
              });
              total = approved + open + closed + rejected;
            } else if (typeof raw === "object") {
              Object.keys(raw).forEach(key => {
                const val = Number(raw[key]);
                const k = key.toLowerCase();
                if (k === "approved") approved = val;
                else if (k === "open") open = val;
                else if (k === "closed") closed = val;
                else if (k === "rejected") rejected = val;
                else if (k === "total") total = val;
              });
              if (!total) total = approved + open + closed + rejected;
            }

            setCounts({
              totalCount: total,
              draftCount: 0,
              holdCount: 0,
              preApprovedCount: 0,
              approvedCount: approved,
              rejectedCount: rejected,
              openedCount: open,
              cancelledCount: 0,
              autoCancelledCount: 0,
              closedCount: closed,
              approved,
              open,
              closed,
              rejected,
              total
            });
          }
        }
      } catch (err) {
        console.error("Failed to load overall status counts", err);
      }
    };

    const fetchSummary = async () => {
      try {
        const res = await getGraphSummary();
        const raw = res?.data ?? res ?? null;
        if (raw && raw.day && raw.day.length > 0) {
          const target = raw.day[0];
          setTodaySummary({
            totalCount: Number(target.totalCount || 0),
            nightshiftCount: Number(target.nightshiftCount || 0),
            draftCount: Number(target.draftCount || 0),
            holdCount: Number(target.holdCount || 0),
            preApprovedCount: Number(target.preApprovedCount || 0),
            approvedCount: Number(target.approvedCount || 0),
            rejectedCount: Number(target.rejectedCount || 0),
            openedCount: Number(target.openedCount || 0),
            cancelledCount: Number(target.cancelledCount || 0),
            autoCancelledCount: Number(target.autoCancelledCount || 0),
            closedCount: Number(target.closedCount || 0)
          });
        }
      } catch (err) {
        console.error("Failed to load today's summary counts", err);
      }
    };

    const fetchZoneCounts = async () => {
      try {
        const res = await getZoneStatusCounts();
        const raw = res?.data ?? res ?? null;
        if (raw) {
          setZoneCounts({
            UC: Number(raw.UC || 0),
            C: Number(raw.C || 0),
            HO: Number(raw.HO || 0),
          });
        }
      } catch (err) {
        console.error("Failed to load zone status counts", err);
      }
    };

    const fetchEmployeeCounts = async () => {
      try {
        const res = await getEmployeeAnalyticsCounts();
        const raw = res?.data ?? res ?? null;
        if (raw) {
          setEmployeeCounts({
            departments: Number(raw.departments || 0),
            contractors: Number(raw.contractors || 0),
            observers: Number(raw.observers || 0),
            total: Number(raw.total || 0),
          });
        }
      } catch (err) {
        console.error("Failed to load employee analytics counts", err);
      }
    };

    const fetchPlansList = async () => {
      try {
        const parseRow = (item) => {
          const status = item.Request_status || item.status || "Open";
          let badgeClass = "badge-primary";
          if (status.toLowerCase() === "approved") badgeClass = "badge-success";
          else if (status.toLowerCase() === "hold") badgeClass = "badge-warning";
          else if (status.toLowerCase() === "rejected") badgeClass = "badge-danger";
          
          let dateStr = item.Created_At || item.created_at || item.Date || item.date || "";
          if (dateStr) {
            dateStr = formatToDenmarkDate(dateStr, { month: 'short', day: 'numeric', year: 'numeric' });
          }

          return {
            permit: item.PermitNo || item.permit_no || String(item.id || ""),
            date: dateStr || "-",
            Working_Date: item.Working_Date || item.working_date || "-",
            activity: item.Activity || "General Work",
            contractor: item.Company_Name || item.contractor_name || "Contractor",
            status,
            badgeClass
          };
        };

        const extractRows = (apiRes) => {
          if (!apiRes) return [];
          if (Array.isArray(apiRes)) {
            if (apiRes.length > 0 && Array.isArray(apiRes[0].data)) {
              return apiRes[0].data; // Postman screenshot format: [ { data: [...] } ]
            }
            return apiRes;
          }
          if (apiRes.data) {
            return Array.isArray(apiRes.data) ? apiRes.data : (apiRes.data.rows || []);
          }
          return [];
        };

        // Fetch Recent Requests
        const recentRes = await searchDashboardRequests({ Page: 1, End: 5 });
        const recentRows = extractRows(recentRes);
        setRecentRequestsList(recentRows.slice(0, 5).map(parseRow));

        // Fetch Pending Approvals (Status: Hold)
        const pendingRes = await searchDashboardRequests({ Request_status: "Hold", Page: 1, End: 5 });
        const pendingRows = extractRows(pendingRes);
        setPendingApprovalsList(pendingRows.slice(0, 5).map(parseRow));
      } catch (err) {
        console.error("Failed to load plans list", err);
      }
    };

    const fetchRecentLogs = async () => {
      try {
        const res = await getUserLogs(1, 4);
        const rows = res?.data ?? [];
        setRecentLogsData(rows.slice(0, 4));
      } catch (err) {
        console.error('Failed to load recent logs', err);
      }
    };

    fetchCounts();
    fetchSummary();
    fetchZoneCounts();
    fetchEmployeeCounts();
    fetchPlansList();
    fetchRecentLogs();
  }, []);

  // ─── RENDER DONUT CHART ────────────────────
  useEffect(() => {
    if (donutChartRef.current) {
      if (donutChartInst.current) donutChartInst.current.destroy();
      const ctx = donutChartRef.current.getContext('2d');
      donutChartInst.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Approved', 'Closed', 'Opened', 'Pre-Approved', 'Drafts', 'On Hold', 'Rejected', 'Cancelled', 'Auto Cancelled'],
          datasets: [{
            data: [
              counts.approvedCount,
              counts.closedCount,
              counts.openedCount,
              counts.preApprovedCount,
              counts.draftCount,
              counts.holdCount,
              counts.rejectedCount,
              counts.cancelledCount,
              counts.autoCancelledCount
            ],
            backgroundColor: [
              '#8B5CF6',
              '#10B981',
              '#06B6D4',
              '#6366F1',
              '#64748B',
              '#F59E0B',
              '#EF4444',
              '#F43F5E',
              '#EC4899'
            ],
            borderWidth: 0,
            hoverOffset: 12,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '80%',
          plugins: { legend: { display: false } },
        },
      });
    }

    return () => {
      if (donutChartInst.current) donutChartInst.current.destroy();
    };
  }, [counts]);

  /* ── HANDLERS ─────────────────────────── */
  const handleAdd = () => navigateTo('/new-request');
  const handleUpdate = () => setIsEmployeeModalOpen(true);
  const handleDelete = () => setIsContractorModalOpen(true);
  const handleError = () => console.log('Action test');

  /* ── RENDER ───────────────────────────── */
  return (
    <div>

      {/* ── QUICK ACTIONS ── */}
      {!isObserver && (
        <div className="dash-actions">
          <button className="btn-action-primary" onClick={handleAdd}>
            <Icons.Plus /> New Request
          </button>
          {!isDepartmentOrContractor && (
            <>
              <button className="btn-action-outline" onClick={handleUpdate}>
                <Icons.PersonPlus /> New Employee
              </button>
              <button className="btn-action-outline" onClick={handleDelete}>
                <Icons.Briefcase /> New Contractor
              </button>
            </>
          )}
        </div>
      )}

      {/* ── STAT CARDS ── */}
      <div className="stat-cards-row">
        <StatCard colorClass="card-slate" icon={Icons.Stack} value={counts.totalCount.toLocaleString()} label="Total" onClick={() => navigate('/list-request')} />
        <StatCard colorClass="card-purple" icon={Icons.Check} value={counts.approvedCount.toLocaleString()} label="Approved" onClick={() => navigate('/list-request', { state: { status: 'Approved' } })} />
        <StatCard colorClass="card-green" icon={Icons.Shield} value={counts.closedCount.toLocaleString()} label="Closed" onClick={() => navigate('/list-request', { state: { status: 'Closed' } })} />
        <StatCard colorClass="card-cyan" icon={Icons.DoorOpen} value={counts.openedCount.toLocaleString()} label="Opened" onClick={() => navigate('/list-request', { state: { status: 'Opened' } })} />
        <StatCard colorClass="card-cyan" icon={Icons.Clock} value={counts.holdCount.toLocaleString()} label="On Hold" onClick={() => navigate('/list-request', { state: { status: 'Hold' } })} />
        
        {showAllStats && (
          <>
            <StatCard colorClass="card-purple" icon={Icons.Check} value={counts.preApprovedCount.toLocaleString()} label="Pre-Approved" onClick={() => navigate('/list-request', { state: { status: 'Pre-Approved' } })} />
            <StatCard colorClass="card-slate" icon={Icons.Clock} value={counts.draftCount.toLocaleString()} label="Drafts" onClick={() => navigate('/list-request', { state: { status: 'Draft' } })} />
            <StatCard colorClass="card-rose" icon={Icons.XCircle} value={counts.rejectedCount.toLocaleString()} label="Rejected" onClick={() => navigate('/list-request', { state: { status: 'Rejected' } })} />
            <StatCard colorClass="card-rose" icon={Icons.XCircle} value={counts.cancelledCount.toLocaleString()} label="Cancelled" onClick={() => navigate('/list-request', { state: { status: 'Cancelled' } })} />
            <StatCard colorClass="card-rose" icon={Icons.XCircle} value={counts.autoCancelledCount.toLocaleString()} label="Auto Cancelled" onClick={() => navigate('/list-request', { state: { status: 'Auto-Cancelled' } })} />
          </>
        )}
      </div>

      <div style={{ textAlign: 'end', marginTop: '15px', marginBottom: '15px' }}>
        <button 
          className="btn-action-outline" 
          onClick={() => setShowAllStats(!showAllStats)}
          style={{ width: 'auto', padding: '8px 20px', margin: '0 auto' }}
        >
          {showAllStats ? 'View Less' : 'View All'}
        </button>
      </div>

      {/* ── WEEKLY BAR CHART ── */}
      <div className="dark-card">
        <div className="chart-top-bar">
          <div className="section-heading-white">Weekly Performance Data</div>
          <div className="chart-top-bar-right">
            <button className="btn-nav-custom" onClick={() => setWeekOffset(w => w - 1)}>Previous Week</button>
            <button className="btn-nav-custom" onClick={() => setWeekOffset(w => w + 1)}>Next Week</button>
            <span className="week-badge">{weekLabel}</span>
          </div>
        </div>
        <div className="chart-container-tall">
          <canvas ref={barChartRef}></canvas>
        </div>
      </div>

      {/* ── DONUT + TODAY ── */}
      <div className="dist-today-row">
        {/* Donut */}
        <div className="white-card">
          <div className="section-heading">Request Distribution</div>
          <div className="donut-wrap">
            <canvas ref={donutChartRef} style={{ maxHeight: '220px', margin: '0 auto' }}></canvas>
            <div className="donut-center">
              <h3 style={{ fontWeight: 700, fontSize: '1.4rem', margin: 0, color: 'var(--text-main)' }}>
                {counts.total >= 1000 ? `${(counts.total / 1000).toFixed(0)}k` : counts.total}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Total Permits</p>
            </div>
          </div>
          <div className="donut-legend">
            {[
              { color: '#8B5CF6', label: 'Approved', count: counts.approvedCount },
              { color: '#10B981', label: 'Closed', count: counts.closedCount },
              { color: '#06B6D4', label: 'Opened', count: counts.openedCount },
              { color: '#6366F1', label: 'Pre-Approved', count: counts.preApprovedCount },
              { color: '#64748B', label: 'Drafts', count: counts.draftCount },
              { color: '#F59E0B', label: 'On Hold', count: counts.holdCount },
              { color: '#EF4444', label: 'Rejected', count: counts.rejectedCount },
              { color: '#F43F5E', label: 'Cancelled', count: counts.cancelledCount },
              { color: '#EC4899', label: 'Auto Cancelled', count: counts.autoCancelledCount },
            ].map(({ color, label, count }) => (
              <div key={label} className="donut-legend-item">
                <span className="legend-dot" style={{ background: color }}></span>
                {label}: {count.toLocaleString()}
              </div>
            ))}
          </div>
        </div>

        {/* Today's Summary */}
        <div className="today-card">
          <div className="today-card-title">
            <Icons.Calendar />
            Today's Summary
          </div>
          {[
            { label: 'Total Requests', value: todaySummary.totalCount, color: 'var(--text-main)' },
            { label: 'Drafts', value: todaySummary.draftCount, color: '#64748B' },
            { label: 'On Hold', value: todaySummary.holdCount, color: '#F59E0B' },
            { label: 'Pre-Approved', value: todaySummary.preApprovedCount, color: '#6366F1' },
            { label: 'Approved', value: todaySummary.approvedCount, color: '#8B5CF6' },
            { label: 'Opened', value: todaySummary.openedCount, color: '#06B6D4' },
            { label: 'Closed', value: todaySummary.closedCount, color: '#10B981' },
            { label: 'Rejected', value: todaySummary.rejectedCount, color: '#EF4444' },
            { label: 'Cancelled', value: todaySummary.cancelledCount, color: '#F43F5E' },
            { label: 'Auto-Cancelled', value: todaySummary.autoCancelledCount, color: '#E11D48' },
            { label: 'Working After Midnight', value: todaySummary.nightshiftCount, color: '#FCD34D' },
          ].map(({ label, value, color }) => {
            const handleRowClick = () => {
              const todayStr = new Date().toISOString().split('T')[0];
              let status = null;
              let nightShift = undefined;

              if (label === 'Drafts') status = 'Draft';
              else if (label === 'On Hold') status = 'Hold';
              else if (label === 'Pre-Approved') status = 'Pre-Approved';
              else if (label === 'Approved') status = 'Approved';
              else if (label === 'Opened') status = 'Opened';
              else if (label === 'Closed') status = 'Closed';
              else if (label === 'Rejected') status = 'Rejected';
              else if (label === 'Cancelled') status = 'Cancelled';
              else if (label === 'Auto-Cancelled') status = 'Auto-Cancelled';
              else if (label === 'Working After Midnight' || label === 'Night Shift') {
                nightShift = "1";
              }

              navigate('/list-request', {
                state: {
                  status,
                  fromDate: todayStr,
                  toDate: todayStr,
                  nightShift
                }
              });
            };

            return (
              <div key={label} className="today-row" onClick={handleRowClick} style={{ cursor: 'pointer' }}>
                <span>{label}</span>
                <span style={{ fontWeight: 700, color }}>{value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RECENT REQUESTS + PENDING APPROVALS ── */}
      <div className={isContractor ? "tables-row-single" : "tables-row"}>
        {/* Recent Requests */}
        <div className="clean-card">
          <div className="clean-card-header">
            <div className="section-heading">Recent Requests</div>
            <span onClick={() => navigate('/list-request')} className="btn-view-all" style={{ cursor: 'pointer' }}>View All</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Permit No</th>
                  <th>Working Date</th>
                  <th>Activity</th>
                  <th>Contractor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequestsList.map(r => (
                  <tr key={r.permit}>
                    <td className="td-permit">{r.permit}</td>
                    <td>{r.Working_Date}</td>
                    <td>{r.activity}</td>
                    <td>{r.contractor}</td>
                    <td><span className={`badge ${r.badgeClass}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Approvals */}
        {!isContractor && (
          <div className="clean-card">
            <div className="clean-card-header">
              <div className="section-heading">Pending Approvals</div>
              <span onClick={() => navigate('/list-request', { state: { status: 'Hold' } })} className="btn-view-all-danger" style={{ cursor: 'pointer' }}>View All</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Permit No</th>
                    <th>Activity</th>
                    <th>Contractor</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovalsList.map(r => (
                    <tr key={r.permit}>
                      <td className="td-permit">{r.permit}</td>
                      <td>{r.activity}</td>
                      <td>{r.contractor}</td>
                      <td>
                        <button className="btn-review" onClick={() => navigateTo(`/new-request?permit=${r.permit}`)}>Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* ── ZONE STATUS | SYSTEM STATISTICS | RECENT LOGS ── */}
      {!isContractor && (
        <div className="bottom-row">

          {/* Zone Status */}
          <div className="zone-card">
            <div className="card-title" onClick={() => navigate('/location/zones')} style={{ cursor: 'pointer' }}>
              <Icons.GeoAlt /> Zone Status
            </div>
            {[
              {
                cls: 'warning',
                iconBg: '#FEF3C7', iconColor: '#D97706',
                icon: <Icons.ConeStriped />,
                name: 'Under Construction', sub: 'Active zones', count: zoneCounts.UC,
                status: 'UC',
              },
              {
                cls: 'info',
                iconBg: '#CFFAFE', iconColor: '#0891B2',
                icon: <Icons.GearWide />,
                name: 'Commissioning', sub: 'In progress', count: zoneCounts.C,
                status: 'C',
              },
              {
                cls: 'success',
                iconBg: '#D1FAE5', iconColor: '#059669',
                icon: <Icons.BuildingCheck />,
                name: 'Hand Over', sub: 'Completed', count: zoneCounts.HO,
                status: 'HO',
              },
            ].map(z => (
              <div key={z.name} className={`zone-item ${z.cls}`} onClick={() => navigate('/location/zones', { state: { status: z.status } })} style={{ cursor: 'pointer' }}>
                <div className="zone-icon" style={{ background: z.iconBg, color: z.iconColor }}>
                  {z.icon}
                </div>
                <div className="zone-label">
                  <p className="zone-name">{z.name}</p>
                  <small>{z.sub}</small>
                </div>
                <span className="zone-count">{z.count}</span>
              </div>
            ))}
          </div>

          {/* System Statistics */}
          <div className="stats-card">
            <div className="card-title">
              <Icons.BarChart /> System Statistics
            </div>
            <div className="stats-grid">
              <div onClick={() => navigate('/departments')} style={{ cursor: 'pointer' }}>
                <div className="stat-circle bg-primary-soft">
                  <Icons.Buildings />
                </div>
                <p className="stat-circle-num">{employeeCounts.departments}</p>
                <p className="stat-circle-label">Departments</p>
              </div>
              <div onClick={() => navigate('/contractors')} style={{ cursor: 'pointer' }}>
                <div className="stat-circle bg-success-soft">
                  <Icons.BriefcaseLg />
                </div>
                <p className="stat-circle-num">{employeeCounts.contractors}</p>
                <p className="stat-circle-label">Contractors</p>
              </div>
              <div onClick={() => navigate('/employees')} style={{ cursor: 'pointer' }}>
                <div className="stat-circle" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#0891B2' }}>
                  <Icons.Shield />
                </div>
                <p className="stat-circle-num">{employeeCounts.observers}</p>
                <p className="stat-circle-label">Observers</p>
              </div>
            </div>
            <div className="emp-band" onClick={() => navigate('/employees')} style={{ cursor: 'pointer' }}>
              <span className="emp-band-label">
                <Icons.PeopleFill />
                Total Employees
              </span>
              <span className="emp-band-val">{employeeCounts.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Recent Logs */}
          <div className="logs-card">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icons.Clock /> Recent Logs</span>
              <button
                type="button"
                onClick={() => navigate('/logs-reports')}
                style={{ background: 'none', border: 'none', fontSize: '12px', color: '#8B5CF6', textDecoration: 'none', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                View All
              </button>
            </div>
            {recentLogsData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px 0' }}>No logs available</p>
            ) : (
              recentLogsData.map((log, i) => {
                const { dot, catColor, category } = getLogStyle(log.action);
                let displayName = log.user || '—';
                try {
                  const u = JSON.parse(log.user);
                  displayName = u.displayName || u.email || u.username || displayName;
                } catch { /* keep raw */ }
                const timeAgo = log.timestamp
                  ? (() => {
                      const diff = Date.now() - new Date(log.timestamp).getTime();
                      const m = Math.floor(diff / 60000);
                      if (m < 1) return 'just now';
                      if (m < 60) return `${m}m ago`;
                      const h = Math.floor(m / 60);
                      if (h < 24) return `${h}h ago`;
                      return `${Math.floor(h / 24)}d ago`;
                    })()
                  : '';
                return (
                  <div key={log.id ?? i} className="log-item">
                    <span className="log-dot" style={{ background: dot }}></span>
                    <div className="log-body">
                      <p className="log-title">
                        {displayName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— {log.action}</span>
                      </p>
                      <span className="log-category" style={{ color: catColor }}>{category} · {log.method} {log.status}</span>
                    </div>
                    <span className="log-time">{timeAgo}</span>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      <Modal open={isEmployeeModalOpen} onClose={() => setIsEmployeeModalOpen(false)} title="Add Employee" size="lg" type="default">
        <EmployeeForm onClose={() => setIsEmployeeModalOpen(false)} onSubmit={() => setIsEmployeeModalOpen(false)} />
      </Modal>

      <Modal open={isContractorModalOpen} onClose={() => setIsContractorModalOpen(false)} title="Add Contractor" size="lg" type="default">
        <ContractorForm onClose={() => setIsContractorModalOpen(false)} onSubmit={() => setIsContractorModalOpen(false)} />
      </Modal>
    </div>
  )
}

export default Dashboard