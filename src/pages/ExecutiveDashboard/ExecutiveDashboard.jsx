import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import { showSuccess } from "../../components/common/Toast/Toast";
import "./ExecutiveDashboard.css";
import groundFloorPlan from "../../assets/images/ground_floor_plan.png";

import { ZONE_MAPPING } from "../../data/zones";
import DashboardPolygonViewer from "../../components/DashboardPolygonViewer";
import { getDashboardOverview, getDashboardBuildingMetrics } from "../../services/requestService";

import { FLOOR_PDFS } from "../../data/pdfMapping";
import { BUILDINGS } from "../../data/buildings";

// HRA Image Logos for Tooltip Hover Card
import workingAtHeightImg from "../../assets/images/logos/WorkingAtHight.png";
import hotWorksImg from "../../assets/images/logos/HotWorks.png";
import electricalSystemsImg from "../../assets/images/logos/ElectricalSystems.png";
import confinedSpaceImg from "../../assets/images/logos/ConfinedSpace.png";
import cranesLiftingImg from "../../assets/images/logos/Craneslifting.png";
import excavationWorksImg from "../../assets/images/logos/ExcavationWorks.png";
import substanceChemicalImg from "../../assets/images/logos/substanceChemical.png";
import testingEquipmentImg from "../../assets/images/logos/testingequipment.png";

const HRA_LOGOS_MAP = [
  { key: "workingAtHeight", title: "Working at Height", img: workingAtHeightImg, check: (d, s) => Boolean(d?.workingAtHeight || d?.isWorkHeight || s.includes("height") || s.includes("fall")) },
  { key: "hotWork", title: "Hot Work", img: hotWorksImg, check: (d, s) => Boolean(d?.hotWork || d?.isHotWork || s.includes("hot work") || s.includes("fire")) },
  { key: "electrical", title: "Electrical Systems", img: electricalSystemsImg, check: (d, s) => Boolean(d?.electrical || d?.isElectrical || s.includes("electrical") || s.includes("elec")) },
  { key: "confinedSpace", title: "Confined Space", img: confinedSpaceImg, check: (d, s) => Boolean(d?.confinedSpaces || d?.confinedSpace || d?.isConfinedSpace || s.includes("confined")) },
  { key: "cranesLifting", title: "Cranes & Lifting", img: cranesLiftingImg, check: (d, s) => Boolean(d?.cranesLifting || d?.cranes || d?.isCranes || s.includes("crane") || s.includes("lifting") || s.includes("lift")) },
  { key: "excavation", title: "Excavation Works", img: excavationWorksImg, check: (d, s) => Boolean(d?.excavation || d?.excavationWorks || d?.isExcavation || s.includes("excavat")) },
  { key: "hazardousSubstances", title: "Hazardous Substances", img: substanceChemicalImg, check: (d, s) => Boolean(d?.hazardousSubstances || d?.chemical || d?.isChemical || s.includes("hazard") || s.includes("substance") || s.includes("chemic")) },
  { key: "pressureTesting", title: "Pressure Testing", img: testingEquipmentImg, check: (d, s) => Boolean(d?.pressureTesting || d?.testing || d?.isPressureTesting || s.includes("pressur") || s.includes("testing")) }
];

const getActiveHraLogosForRoom = (roomData) => {
  if (!roomData) return [];
  const hraText = [
    typeof roomData?.hra === "string" ? roomData.hra : "",
    roomData?.hraText || "",
    roomData?.hraString || "",
    Array.isArray(roomData?.hraList) ? roomData.hraList.join(" ") : "",
    Array.isArray(roomData?.hraActivities) ? roomData.hraActivities.join(" ") : ""
  ].join(" ").toLowerCase();
  return HRA_LOGOS_MAP.filter((item) => item.check(roomData, hraText));
};





const formatCompanyLogoUrl = (logoVal) => {
  if (!logoVal) return null;
  const str = String(logoVal).trim();
  if (!str || str === "null" || str === "undefined") return null;
  if (str.startsWith("http://") || str.startsWith("https://") || str.startsWith("data:")) {
    return str;
  }
  const cleanPath = str.startsWith("/") ? str.slice(1) : str;
  if (cleanPath.startsWith("subcontractors/")) {
    return `https://api.beam.safesiteworks.com/development/m3south/${cleanPath}`;
  }
  return `https://api.beam.safesiteworks.com/south/subcontractors/${cleanPath}`;
};

const CompanyLogo = ({ logo, name, code, color, size = 22, style = {}, className = "mini-company-badge" }) => {
  const [hasError, setHasError] = useState(false);
  const logoUrl = formatCompanyLogoUrl(logo);

  if (logoUrl && !hasError) {
    return (
      <img
        src={logoUrl}
        alt={name || code}
        onError={() => setHasError(true)}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          marginRight: 6,
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  return (
    <span
      className={className}
      style={{
        backgroundColor: color || "#3b82f6",
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        fontSize: size <= 20 ? "9px" : "10px",
        color: "#ffffff",
        marginRight: 6,
        flexShrink: 0,
        ...style,
      }}
    >
      {code}
    </span>
  );
};

function ExecutiveDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [roomSearch, setRoomSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [isZonesActive, setIsZonesActive] = useState(true);
  const [isIconsActive, setIsIconsActive] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState("All room types");
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const mapContainerRef = useRef(null);
  const [mapWidth, setMapWidth] = useState(800);
  const [mapHeight, setMapHeight] = useState(480);

  const [selectedBuilding, setSelectedBuilding] = useState("JF");
  const [overviewData, setOverviewData] = useState(null);
  const [buildingData, setBuildingData] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Checkbox Filter States (declared at top to prevent TDZ ReferenceError)
  const [permitTypes, setPermitTypes] = useState({
    commissioning: true,
    construction: true,
  });

  const [permitStatuses, setPermitStatuses] = useState({
    opened: true,
    preApproved: true,
    approved: true,
    hold: true,
    rejected: true,
    draft: true,
    cancelled: true,
    closed: true,
    autoCancel: true,
  });

  const [activityRiskTypes, setActivityRiskTypes] = useState({
    nonHra: true,
    hra: true,
    hotWork: true,
    electrical: true,
    hazardousSubstances: true,
    workingAtHeight: true,
    confinedSpaces: true,
    excavation: true,
    cranesLifting: true,
    pressureTesting: true,
  });

  const [selectedCompanies, setSelectedCompanies] = useState(new Set());
  const [hasInitializedCompanies, setHasInitializedCompanies] = useState(false);

  const [hoveredRoom, setHoveredRoom] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const isHoverCardActive = useRef(false);

  const handleHoverRoom = (room) => {
    if (room) {
      // Immediately clear any pending close timeout and show new room
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setHoveredRoom(room);
    } else {
      // Only schedule close if hover card itself is not under cursor
      if (!isHoverCardActive.current) {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
          if (!isHoverCardActive.current) setHoveredRoom(null);
        }, 350);
      }
    }
  };

  const handleHoverCardEnter = () => {
    isHoverCardActive.current = true;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleHoverCardLeave = () => {
    isHoverCardActive.current = false;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredRoom(null);
    }, 200);
  };

  // Auto-select first building if empty
  useEffect(() => {
    if (!selectedBuilding || selectedBuilding === "") {
      setSelectedBuilding("JF");
    }
    setHasInitializedCompanies(false);
  }, [selectedBuilding]);

  // Fetch Overview metrics when Overview tab, selectedBuilding, or date range changes
  useEffect(() => {
    let isMounted = true;
    if (activeTab === "Overview") {
      const bName = selectedBuilding || "JF";
      getDashboardOverview(bName, fromDate, toDate)
        .then((res) => {
          if (isMounted && res && res.data) {
            setOverviewData(res.data);
          }
        })
        .catch((err) => console.error("Error fetching overview metrics:", err));
    }
    return () => { isMounted = false; };
  }, [activeTab, selectedBuilding, fromDate, toDate]);

  // Fetch Building / Floor metrics when building, floor, date range, or Left Panel checkbox filters change
  useEffect(() => {
    let isMounted = true;
    const bName = selectedBuilding || "JF";
    const fName = activeTab === "Overview" ? "" : activeTab;

    const filterPayload = {
      building: bName,
      floor: fName,
      permitTypes,
      permitStatuses,
      activityRiskTypes,
      selectedCompanies: Array.from(selectedCompanies),
      roomSearch,
      fromDate,
      toDate,
    };

    getDashboardBuildingMetrics(filterPayload)
      .then((res) => {
        if (isMounted && res && res.data) {
          setBuildingData(res.data);
          if (!hasInitializedCompanies && Array.isArray(res.data.companies) && res.data.companies.length > 0) {
            setSelectedCompanies(new Set(res.data.companies.map((c) => c.name)));
            setHasInitializedCompanies(true);
          }
        }
      })
      .catch((err) => console.error("Error fetching building metrics:", err));
    return () => { isMounted = false; };
  }, [selectedBuilding, activeTab, permitTypes, permitStatuses, activityRiskTypes, selectedCompanies, roomSearch, hasInitializedCompanies, fromDate, toDate]);

  const levels = useMemo(() => {
    if (!selectedBuilding || selectedBuilding === "") return [];

    const staticB = BUILDINGS.find(
      (item) => item.name.toLowerCase().trim() === selectedBuilding.toLowerCase().trim()
    );
    const staticBuildingId = staticB ? staticB.id : "";

    if (staticBuildingId && FLOOR_PDFS[staticBuildingId]) {
      return Object.keys(FLOOR_PDFS[staticBuildingId]);
    }

    const bClean = selectedBuilding.replace(/\s+/g, "").toLowerCase().trim();
    return Object.keys(ZONE_MAPPING).filter((key) => {
      const keyClean = key.replace(/\s+/g, "").toLowerCase().trim();
      return keyClean === bClean || keyClean.startsWith(bClean);
    });
  }, [selectedBuilding]);

  useEffect(() => {
    if (activeTab !== "Overview") {
      if (levels.length > 0 && !levels.includes(activeTab)) {
        setActiveTab(levels[0]);
      }
    }
  }, [levels, activeTab]);

  const selectedLevel = useMemo(() => {
    if (activeTab !== "Overview") return activeTab;
    return levels[0] || "";
  }, [activeTab, levels]);

  const selectedLevelZones = useMemo(() => {
    if (!selectedLevel) return [];
    if (ZONE_MAPPING[selectedLevel]) return ZONE_MAPPING[selectedLevel];

    const levelLower = selectedLevel.toLowerCase().trim();
    const foundKey = Object.keys(ZONE_MAPPING).find((key) => {
      const keyLower = key.toLowerCase().trim();
      return keyLower.includes(levelLower) || levelLower.includes(keyLower);
    });
    if (foundKey) return ZONE_MAPPING[foundKey];

    return [];
  }, [selectedLevel]);

  const selectedPdf = useMemo(() => {
    if (!selectedBuilding || !selectedLevel) return null;

    const staticB = BUILDINGS.find(
      (item) => item.name.toLowerCase().trim() === selectedBuilding.toLowerCase().trim()
    );
    const staticBuildingId = staticB ? staticB.id : "";

    if (staticBuildingId && FLOOR_PDFS[staticBuildingId]) {
      const pdfsForBuilding = FLOOR_PDFS[staticBuildingId];

      if (pdfsForBuilding[selectedLevel]) return pdfsForBuilding[selectedLevel];

      const levelLower = selectedLevel.toLowerCase().trim();
      const foundKey = Object.keys(pdfsForBuilding).find((key) => {
        const keyLower = key.toLowerCase().trim();
        return keyLower.includes(levelLower) || levelLower.includes(keyLower);
      });
      if (foundKey) return pdfsForBuilding[foundKey];

      return Object.values(pdfsForBuilding)[0] || null;
    }

    return selectedLevelZones[0]?.pdf || null;
  }, [selectedBuilding, selectedLevel, selectedLevelZones]);

  const rooms = useMemo(() => {
    return selectedLevelZones.flatMap(zone => {
      if (!zone.rooms) return [];

      // Get the floor's PDF for this level
      const floorPdf = selectedPdf || selectedLevelZones[0]?.pdf;

      // If the zone uses the same PDF as the floor plan itself,
      // the coordinates of the rooms are already correct relative to the floor. Skip projection.
      if (zone.pdf === floorPdf) {
        return zone.rooms;
      }

      const zonePoints = zone.points || [];
      if (zonePoints.length === 0) return zone.rooms;

      const xs = zonePoints.map(p => p.x);
      const ys = zonePoints.map(p => p.y);
      const xMin = Math.min(...xs);
      const xMax = Math.max(...xs);
      const yMin = Math.min(...ys);
      const yMax = Math.max(...ys);

      const zoneWidthOnFloor = xMax - xMin;
      const zoneHeightOnFloor = yMax - yMin;

      return zone.rooms.map(room => {
        if (!room.points || room.points.length === 0) return room;

        const roomPdfWidth = room.pdfWidth || 1;
        const roomPdfHeight = room.pdfHeight || 1;

        const mappedPoints = room.points.map(p => {
          const normX = p.x / roomPdfWidth;
          const normY = p.y / roomPdfHeight;
          return {
            ...p,
            x: xMin + (normX * zoneWidthOnFloor),
            y: yMin + (normY * zoneHeightOnFloor)
          };
        });

        return {
          ...room,
          pdfWidth: zone.pdfWidth,
          pdfHeight: zone.pdfHeight,
          points: mappedPoints
        };
      });
    });
  }, [selectedLevelZones, selectedBuilding]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0) setMapWidth(width);
      if (height > 0) setMapHeight(height);
    });

    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [activeTab]);

  useEffect(() => {
    // When Executive Dashboard loads, automatically close sidebar if open
    const sidebar = document.querySelector(".sidebar");
    if (sidebar && !sidebar.classList.contains("sidebar-closed")) {
      const toggleBtn = document.querySelector(".sidebar-toggle-btn");
      if (toggleBtn) {
        toggleBtn.click();
      }
    }
  }, []);

  const handleAutoApprove = () => {
    showSuccess("Successfully auto-approved 18 clear rooms with no active clashes!", "#10b981");
  };

  const handleToggleAllPermitTypes = (val) => {
    setPermitTypes({
      commissioning: val,
      construction: val,
    });
  };

  const handleToggleAllStatuses = (val) => {
    setPermitStatuses({
      opened: val,
      preApproved: val,
      approved: val,
      hold: val,
      rejected: val,
      draft: val,
      cancelled: val,
      closed: val,
      autoCancel: val,
    });
  };

  const handleToggleAllRiskTypes = (val) => {
    setActivityRiskTypes({
      nonHra: val,
      hra: val,
      hotWork: val,
      electrical: val,
      hazardousSubstances: val,
      workingAtHeight: val,
      confinedSpaces: val,
      excavation: val,
      cranesLifting: val,
      pressureTesting: val,
    });
  };

  const toggleCompany = (companyName) => {
    setSelectedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(companyName)) {
        next.delete(companyName);
      } else {
        next.add(companyName);
      }
      return next;
    });
  };

  const activeCompaniesList = useMemo(() => {
    if (buildingData && Array.isArray(buildingData.companies)) {
      return buildingData.companies;
    }
    return [];
  }, [buildingData]);

  const activeRoomsToReview = useMemo(() => {
    if (buildingData && Array.isArray(buildingData.roomsToReview)) {
      return buildingData.roomsToReview;
    }
    return [];
  }, [buildingData]);

  const filteredCompanies = useMemo(() => {
    return activeCompaniesList.filter((c) =>
      c.name.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [activeCompaniesList, companySearch]);

  const filteredRoomsToReview = useMemo(() => {
    if (selectedCompanies.size === 0) {
      return [];
    }

    return activeRoomsToReview.filter((item) => {
      const matchesSearch = item.zone.toLowerCase().includes(roomSearch.toLowerCase());
      if (!item.companies || item.companies.length === 0) {
        return matchesSearch;
      }
      const matchesCompanies = (item.companies || []).some((cCode) => {
        const comp = activeCompaniesList.find(
          (cl) => cl.code === cCode || cl.name === cCode
        );
        return comp ? selectedCompanies.has(comp.name) : selectedCompanies.has(cCode);
      });
      return matchesSearch && matchesCompanies;
    });
  }, [activeRoomsToReview, roomSearch, selectedCompanies, activeCompaniesList]);

  const hoveredRoomData = useMemo(() => {
    if (!hoveredRoom || !hoveredRoom.name) return null;

    const rName = hoveredRoom.name.trim();

    const getCompDetails = (rNameClean) => {
      const match = (buildingData?.roomsToReview || []).find(
        (item) =>
          item.zone.toLowerCase().trim() === rNameClean.toLowerCase().trim() ||
          rNameClean.toLowerCase().trim().includes(item.zone.toLowerCase().trim()) ||
          item.zone.toLowerCase().trim().includes(rNameClean.toLowerCase().trim())
      );

      const compList = match?.companies || buildingData?.roomHoverData?.[rNameClean]?.companyList || [];
      if (!Array.isArray(compList) || compList.length === 0) return [];

      const hData = buildingData?.roomHoverData?.[rNameClean] || match;

      return compList.map((c) => {
        const comp = activeCompaniesList.find(
          (cl) => cl.code === c || cl.name === c
        ) || { code: c, name: c };

        return {
          name: comp?.name || c,
          code: comp?.code || (c ? String(c).slice(0, 2).toUpperCase() : "?"),
          logo: comp?.logo ? formatCompanyLogoUrl(comp.logo) : null,
          color: comp?.color || "#3b82f6",
          hraLogos: getActiveHraLogosForRoom(hData)
        };
      });
    };

    const compDetails = getCompDetails(rName);

    if (buildingData?.roomHoverData?.[rName]) {
      const hData = buildingData.roomHoverData[rName];
      return {
        title: hData.title || rName,
        subtitle: hData.subtitle || `Room / Area ${rName}`,
        clash: hData.clash,
        companies: hData.companies,
        permits: hData.permits,
        hra: hData.hra,
        isNoWork: hData.permits === "0 permits" || hData.hra === "No Work",
        compDetails
      };
    }

    const activeMatch = filteredRoomsToReview.find(
      (r) =>
        r.zone.toLowerCase().trim() === rName.toLowerCase() ||
        r.zone.toLowerCase().includes(rName.toLowerCase()) ||
        rName.toLowerCase().includes(r.zone.toLowerCase())
    );

    if (activeMatch && activeMatch.permits > 0) {
      return {
        title: activeMatch.zone,
        subtitle: `Room / Area ${activeMatch.zone}`,
        clash: activeMatch.clash
          ? `Clash (${activeMatch.companies.length} companies)`
          : "Clear (No Clash)",
        companies: `${activeMatch.companies.length} companies`,
        permits: `${activeMatch.permits} permits`,
        hra: activeMatch.hra ? "HRA Activity Detected" : null,
        isNoWork: false,
        compDetails
      };
    }

    const allMatch = (buildingData?.roomsToReview || []).find(
      (r) =>
        r.zone.toLowerCase().trim() === rName.toLowerCase() ||
        r.zone.toLowerCase().includes(rName.toLowerCase()) ||
        rName.toLowerCase().includes(r.zone.toLowerCase())
    );

    if (allMatch && allMatch.permits > 0) {
      return {
        title: allMatch.zone,
        subtitle: `Room / Area ${allMatch.zone}`,
        clash: allMatch.clash
          ? `Clash (${allMatch.companies.length} companies)`
          : "Clear (No Clash)",
        companies: `${allMatch.companies.length} companies`,
        permits: `${allMatch.permits} permits`,
        hra: allMatch.hra ? "HRA Activity Detected" : null,
        isNoWork: false,
        compDetails
      };
    }

    return {
      title: rName,
      subtitle: `Room / Area ${rName}`,
      isNoWork: true,
      permits: "0 permits",
      companies: "0 companies",
      clash: "Clear (No Clash)",
      compDetails: []
    };
  }, [hoveredRoom, buildingData, filteredRoomsToReview, activeCompaniesList]);

  // Returns portal-style {fixed} positioning based on page coordinates derived from mapContainerRef
  const getPortalTooltipStyle = (relX, relY) => {
    const CARD_WIDTH = 320;
    const CARD_HEIGHT = 380; // max estimated height
    const MARGIN = 12;

    let pageX = relX;
    let pageY = relY;

    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      pageX = rect.left + relX;
      pageY = rect.top + relY;
    }

    const vpW = window.innerWidth;
    const vpH = window.innerHeight;

    // Horizontal: default center, clamp to viewport
    let left = pageX - CARD_WIDTH / 2;
    if (left < MARGIN) left = MARGIN;
    if (left + CARD_WIDTH > vpW - MARGIN) left = vpW - CARD_WIDTH - MARGIN;

    // Vertical: prefer above the point, flip below if not enough room
    let top = pageY - CARD_HEIGHT - MARGIN;
    if (top < MARGIN) {
      top = pageY + MARGIN; // flip below
    }
    // If even below is off screen, clamp
    if (top + CARD_HEIGHT > vpH - MARGIN) {
      top = vpH - CARD_HEIGHT - MARGIN;
    }
    if (top < MARGIN) top = MARGIN;

    return {
      position: "fixed",
      left,
      top,
      width: CARD_WIDTH,
      zIndex: 2147483647,
      pointerEvents: "auto",
      fontSize: "13px",
      lineHeight: "1.5",
      textAlign: "left",
    };
  };

  const dynamicOverviewMetrics = useMemo(() => {
    const m = overviewData?.metrics || { total: 0, clashes: 0, approved: 0, hold: 0, activeRooms: 0 };
    return [
      { id: "total", label: "TOTAL PERMITS", value: m.total ?? 0, sub: `${m.activeRooms ?? 0} rooms with activity`, color: "blue" },
      { id: "clashes", label: "CLASHES", value: m.clashes ?? 0, sub: `${m.clashes ?? 0} HRA, 0 non-HRA`, color: "red" },
      { id: "approved", label: "APPROVED", value: m.approved ?? 0, sub: `at ${m.activeRooms ?? 0} active rooms`, color: "green" },
      { id: "pending", label: "PENDING REVIEW", value: m.hold ?? 0, sub: `${m.hold ?? 0} permits on hold`, color: "orange" },
    ];
  }, [overviewData]);

  const dynamicPermitStatuses = useMemo(() => {
    const m = overviewData?.metrics || {};
    return [
      { name: "Hold", count: m.hold ?? 0, color: "#d97706" },
      { name: "Opened", count: m.opened ?? 0, color: "#2563eb" },
      { name: "Pre-approved", count: m.preApproved ?? 0, color: "#059669" },
      { name: "Approved", count: m.approved ?? 0, color: "#10b981" },
      { name: "Rejected", count: m.rejected ?? 0, color: "#dc2626" },
      { name: "Draft", count: m.draft ?? 0, color: "#6b7280" },
      { name: "Cancelled", count: m.cancelled ?? 0, color: "#e11d48" },
      { name: "Closed", count: m.closed ?? 0, color: "#475569" },
      { name: "Auto-Cancel", count: m.autoCancel ?? 0, color: "#9333ea" },
    ];
  }, [overviewData]);

  const dynamicOverviewCompanies = useMemo(() => {
    if (overviewData && Array.isArray(overviewData.overviewCompanies)) {
      return overviewData.overviewCompanies;
    }
    return [];
  }, [overviewData]);

  const dynamicFloors = useMemo(() => {
    if (buildingData && Array.isArray(buildingData.floors) && buildingData.floors.length > 0) {
      return buildingData.floors;
    }
    if (overviewData && Array.isArray(overviewData.floors) && overviewData.floors.length > 0) {
      return overviewData.floors;
    }
    return [];
  }, [buildingData, overviewData]);

  const floorTabNames = useMemo(() => {
    if (dynamicFloors && dynamicFloors.length > 0) {
      return dynamicFloors.map((f) => f.name);
    }
    return levels;
  }, [dynamicFloors, levels]);

  const displayCounts = useMemo(() => {
    return {
      permitTypes: {
        commissioning: buildingData?.counts?.permitTypes?.commissioning ?? 0,
        construction: buildingData?.counts?.permitTypes?.construction ?? 0,
      },
      permitStatuses: {
        opened: buildingData?.counts?.permitStatuses?.opened ?? 0,
        preApproved: buildingData?.counts?.permitStatuses?.preApproved ?? 0,
        approved: buildingData?.counts?.permitStatuses?.approved ?? 0,
        hold: buildingData?.counts?.permitStatuses?.hold ?? 0,
        rejected: buildingData?.counts?.permitStatuses?.rejected ?? 0,
        draft: buildingData?.counts?.permitStatuses?.draft ?? 0,
        cancelled: buildingData?.counts?.permitStatuses?.cancelled ?? 0,
        closed: buildingData?.counts?.permitStatuses?.closed ?? 0,
        autoCancel: buildingData?.counts?.permitStatuses?.autoCancel ?? 0,
      },
      activityRiskTypes: {
        nonHra: buildingData?.counts?.activityRiskTypes?.nonHra ?? 0,
        hra: buildingData?.counts?.activityRiskTypes?.hra ?? 0,
        hotWork: buildingData?.counts?.activityRiskTypes?.hotWork ?? 0,
        electrical: buildingData?.counts?.activityRiskTypes?.electrical ?? 0,
        hazardousSubstances: buildingData?.counts?.activityRiskTypes?.hazardousSubstances ?? 0,
        workingAtHeight: buildingData?.counts?.activityRiskTypes?.workingAtHeight ?? 0,
        confinedSpaces: buildingData?.counts?.activityRiskTypes?.confinedSpaces ?? 0,
        excavation: buildingData?.counts?.activityRiskTypes?.excavation ?? 0,
        cranesLifting: buildingData?.counts?.activityRiskTypes?.cranesLifting ?? 0,
        pressureTesting: buildingData?.counts?.activityRiskTypes?.pressureTesting ?? 0,
      },
    };
  }, [buildingData]);

  return (
    <>
      <div className="exec-dashboard-container">
        {/* ── BUILDING & DATE SELECTOR ── */}
        <div className="exec-building-selector-row" style={{ margin: "10px 24px 12px 24px", padding: "12px 16px", display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center" }}>
          <div className="exec-building-selector-group">
            <span className="exec-building-lbl">BUILDING</span>
            <select
              className="exec-building-select"
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
            >
              <option value="" disabled>— Select a Building —</option>
              {BUILDINGS.map((b) => (
                <option key={b.id || b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Inputs */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span className="exec-building-lbl">START DATE</span>
              <input
                type="date"
                className="exec-date-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  height: "38px",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span className="exec-building-lbl">END DATE</span>
              <input
                type="date"
                className="exec-date-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  height: "38px",
                  outline: "none"
                }}
              />
            </div>

            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                style={{
                  marginTop: "16px",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "var(--accent, #00e5a0)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                ✕ Clear Date
              </button>
            )}
          </div>
        </div>

        {/* ── FLOOR TABS ── */}
        <div className="exec-tabs-container">
          <div className="exec-tabs-left">
            {["Overview", ...floorTabNames].map((tab) => (
              <button
                key={tab}
                className={`exec-tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab !== "Overview" && (
            <div className="exec-tabs-right">
              <button
                className={`action-btn-toggle ${isZonesActive ? "active" : ""}`}
                onClick={() => setIsZonesActive((prev) => !prev)}
              >
                <i className={`ti ${isZonesActive ? "ti-square-check" : "ti-square"}`} />
                Zones
              </button>
            </div>
          )}
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="exec-content-area">
          {activeTab === "Overview" ? (
            /* ════════ OVERVIEW TAB ════════ */
            <div className="overview-tab-view animate-fade-in">
              {/* Metric Cards Row */}
              <div className="overview-metrics-grid">
                {dynamicOverviewMetrics.map((metric) => (
                  <div key={metric.id} className={`overview-card metric-card-${metric.color}`}>
                    <div className="card-lbl">{metric.label}</div>
                    <div className="card-val">{metric.value}</div>
                    <div className="card-sub">{metric.sub}</div>
                  </div>
                ))}
              </div>

              {/* Permit Statuses & Floor grid Row */}
              <div className="overview-middle-row">
                {/* Permit Statuses Chart & Legend */}
                <div className="overview-card status-panel">
                  <h4>PERMIT STATUSES (SSW)</h4>

                  {/* Horizontal Progress Bar */}
                  <div className="status-progress-bar">
                    {dynamicPermitStatuses.map((status) => {
                      const totalPermits = overviewData?.metrics?.total || 1;
                      const pct = (status.count / totalPermits) * 100;
                      return (
                        <div
                          key={status.name}
                          className="status-progress-seg"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: status.color,
                          }}
                          title={`${status.name}: ${status.count} (${pct.toFixed(1)}%)`}
                        />
                      );
                    })}
                  </div>

                  {/* Legend List */}
                  <div className="status-legend-list">
                    {dynamicPermitStatuses.map((status) => (
                      <div key={status.name} className="legend-row">
                        <div className="legend-left">
                          <span
                            className="legend-dot"
                            style={{ backgroundColor: status.color }}
                          />
                          <span className="legend-name">{status.name}</span>
                        </div>
                        <span className="legend-count">{status.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floor Permit Cards Grid */}
                <div className="overview-card floors-panel">
                  <h4>Floors</h4>
                  <div className="floors-mini-grid">
                    {dynamicFloors.map((floor) => (
                      <div
                        key={floor.name}
                        className="floor-mini-card"
                        style={{ cursor: "pointer" }}
                        onClick={() => setActiveTab(floor.name)}
                      >
                        <div className="floor-card-title">
                          <span className={`status-dot-indicator dot-${floor.status}`} />
                          {floor.name}
                        </div>
                        <div className="floor-card-stats">
                          <span>{floor.permits} permits</span>
                          <span>{floor.rooms} rooms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Companies Table Row */}
              <div className="overview-card companies-panel-card">
                <h4>Companies</h4>
                <div className="companies-table-wrapper">
                  <table className="companies-table">
                    <thead>
                      <tr>
                        <th>COMPANY</th>
                        <th>PERMITS</th>
                        <th>ROOMS</th>
                        <th>CLASHES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dynamicOverviewCompanies.map((company) => (
                        <tr key={company.name}>
                          <td>
                            <div className="company-name-cell">
                              <span
                                className="company-letter-badge"
                                style={{ backgroundColor: company.color }}
                              >
                                {company.code}
                              </span>
                              {company.name}
                            </div>
                          </td>
                          <td>{company.permits}</td>
                          <td>{company.rooms}</td>
                          <td className="clash-highlight">{company.clashes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* ════════ FLOOR LAYOUTS (Ground Floor, etc.) ════════ */
            <div className="floor-layout-view animate-fade-in">

              <div className="three-column-grid">
                {/* ── COLUMN 1: FILTERS (Left) ── */}
                <div className={`panel-col filter-panel ${isLeftOpen ? "panel-open" : "panel-closed"}`}>

                  {/* Auto Approve Button inside the Left Panel */}
                  {/* <div className="panel-auto-approve-wrapper">
                  <button className="auto-approve-btn" onClick={handleAutoApprove}>
                    <i className="ti ti-check" /> Auto-approve clear rooms
                  </button>
                  <span className="auto-approve-subtext">
                    Approves rooms with no clashes (excludes HRA rooms)
                  </span>
                </div> */}



                  {/* Companies Section */}
                  <div className="filter-group companies-filter-group">
                    <div className="filter-header-row">
                      <label className="filter-lbl">COMPANIES</label>
                      <div className="toggle-links">
                        <button onClick={() => setSelectedCompanies(new Set(activeCompaniesList.map((c) => c.name)))}>all</button>
                        <span>|</span>
                        <button onClick={() => setSelectedCompanies(new Set())}>none</button>
                      </div>
                    </div>
                    <div className="search-input-wrapper">
                      <i className="ti ti-search search-icon" />
                      <input
                        type="text"
                        className="search-control"
                        placeholder="Search company..."
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                      />
                    </div>
                    <div className="companies-scroll-list">
                      {filteredCompanies.map((company) => (
                        <div
                          key={company.name}
                          className={`company-list-item ${selectedCompanies.has(company.name) ? "enabled" : "disabled"}`}
                          onClick={() => toggleCompany(company.name)}
                          style={{
                            cursor: "pointer",
                            opacity: selectedCompanies.has(company.name) ? 1 : 0.45,
                            transition: "opacity 0.2s",
                          }}
                        >
                          <div className="company-item-left">
                            <CompanyLogo
                              logo={company.logo}
                              name={company.name}
                              code={company.code}
                              color={company.color}
                            />
                            <span className="company-item-name">{company.name}</span>
                          </div>
                          <span className="company-item-count">{company.count}</span>
                        </div>
                      ))}
                      {filteredCompanies.length === 0 && (
                        <div className="no-results">No companies found</div>
                      )}
                    </div>
                  </div>

                  {/* Permit Type Checkboxes */}
                  <div className="filter-group">
                    <div className="filter-header-row">
                      <label className="filter-lbl">PERMIT TYPE</label>
                      <div className="toggle-links">
                        <button onClick={() => handleToggleAllPermitTypes(true)}>all</button>
                        <span>|</span>
                        <button onClick={() => handleToggleAllPermitTypes(false)}>none</button>
                      </div>
                    </div>
                    <div className="checkbox-list">
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={permitTypes.commissioning}
                          onChange={(e) =>
                            setPermitTypes((prev) => ({
                              ...prev,
                              commissioning: e.target.checked,
                            }))
                          }
                        />
                        Commissioning ({displayCounts.permitTypes.commissioning})
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={permitTypes.construction}
                          onChange={(e) =>
                            setPermitTypes((prev) => ({
                              ...prev,
                              construction: e.target.checked,
                            }))
                          }
                        />
                        Construction ({displayCounts.permitTypes.construction})
                      </label>
                    </div>
                  </div>

                  {/* Permit Status Checkboxes */}
                  <div className="filter-group">
                    <div className="filter-header-row">
                      <label className="filter-lbl">PERMIT STATUS</label>
                      <div className="toggle-links">
                        <button onClick={() => handleToggleAllStatuses(true)}>all</button>
                        <span>|</span>
                        <button onClick={() => handleToggleAllStatuses(false)}>none</button>
                      </div>
                    </div>
                    <div className="checkbox-list">
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={permitStatuses.opened}
                          onChange={(e) =>
                            setPermitStatuses((prev) => ({
                              ...prev,
                              opened: e.target.checked,
                            }))
                          }
                        />
                        <span className="status-dot dot-blue" style={{ marginRight: 6, backgroundColor: "#2563eb" }} />
                        Opened ({displayCounts.permitStatuses.opened})
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={permitStatuses.preApproved}
                          onChange={(e) =>
                            setPermitStatuses((prev) => ({
                              ...prev,
                              preApproved: e.target.checked,
                            }))
                          }
                        />
                        <span className="status-dot dot-green" style={{ marginRight: 6, backgroundColor: "#059669" }} />
                        Pre-approved ({displayCounts.permitStatuses.preApproved})
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={permitStatuses.approved}
                          onChange={(e) =>
                            setPermitStatuses((prev) => ({
                              ...prev,
                              approved: e.target.checked,
                            }))
                          }
                        />
                        <span className="status-dot dot-green" style={{ marginRight: 6, backgroundColor: "#10b981" }} />
                        Approved ({displayCounts.permitStatuses.approved})
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={permitStatuses.hold}
                          onChange={(e) =>
                            setPermitStatuses((prev) => ({
                              ...prev,
                              hold: e.target.checked,
                            }))
                          }
                        />
                        <span className="status-dot dot-yellow" style={{ marginRight: 6, backgroundColor: "#d97706" }} />
                        Hold ({displayCounts.permitStatuses.hold})
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={permitStatuses.rejected}
                          onChange={(e) =>
                            setPermitStatuses((prev) => ({
                              ...prev,
                              rejected: e.target.checked,
                            }))
                          }
                        />
                        <span className="status-dot dot-red" style={{ marginRight: 6, backgroundColor: "#dc2626" }} />
                        Rejected ({displayCounts.permitStatuses.rejected})
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={permitStatuses.draft}
                          onChange={(e) =>
                            setPermitStatuses((prev) => ({
                              ...prev,
                              draft: e.target.checked,
                            }))
                          }
                        />
                        <span className="status-dot dot-gray" style={{ marginRight: 6, backgroundColor: "#6b7280" }} />
                        Draft ({displayCounts.permitStatuses.draft})
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={permitStatuses.cancelled}
                          onChange={(e) =>
                            setPermitStatuses((prev) => ({
                              ...prev,
                              cancelled: e.target.checked,
                            }))
                          }
                        />
                        <span className="status-dot dot-red" style={{ marginRight: 6, backgroundColor: "#e11d48" }} />
                        Cancelled ({displayCounts.permitStatuses.cancelled})
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={permitStatuses.closed}
                          onChange={(e) =>
                            setPermitStatuses((prev) => ({
                              ...prev,
                              closed: e.target.checked,
                            }))
                          }
                        />
                        <span className="status-dot dot-gray" style={{ marginRight: 6, backgroundColor: "#475569" }} />
                        Closed ({displayCounts.permitStatuses.closed})
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={permitStatuses.autoCancel}
                          onChange={(e) =>
                            setPermitStatuses((prev) => ({
                              ...prev,
                              autoCancel: e.target.checked,
                            }))
                          }
                        />
                        <span className="status-dot dot-purple" style={{ marginRight: 6, backgroundColor: "#9333ea" }} />
                        Auto-Cancel ({displayCounts.permitStatuses.autoCancel})
                      </label>
                    </div>
                  </div>

                  {/* Activity Risk Type Checkboxes */}
                  <div className="filter-group">
                    <div className="filter-header-row">
                      <label className="filter-lbl">ACTIVITY RISK TYPE</label>
                      <div className="toggle-links">
                        <button onClick={() => handleToggleAllRiskTypes(true)}>all</button>
                        <span>|</span>
                        <button onClick={() => handleToggleAllRiskTypes(false)}>none</button>
                      </div>
                    </div>
                    <div className="checkbox-list">
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={activityRiskTypes.nonHra}
                          onChange={(e) =>
                            setActivityRiskTypes((prev) => ({
                              ...prev,
                              nonHra: e.target.checked,
                            }))
                          }
                        />
                        <span className="status-dot dot-gray" style={{ marginRight: 6, backgroundColor: "#94a3b8" }} />
                        Non-HRA ({displayCounts.activityRiskTypes.nonHra})
                      </label>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={activityRiskTypes.hra}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setActivityRiskTypes((prev) => ({
                              ...prev,
                              hra: val,
                              hotWork: val,
                              electrical: val,
                              hazardousSubstances: val,
                              workingAtHeight: val,
                              confinedSpaces: val,
                              excavation: val,
                              cranesLifting: val,
                              pressureTesting: val,
                            }));
                          }}
                        />
                        <span className="status-dot dot-red" style={{ marginRight: 6, backgroundColor: "#ef4444" }} />
                        HRA ({displayCounts.activityRiskTypes.hra})
                      </label>

                      {/* HRA Nested List */}
                      <div className="nested-checkbox-list" style={{ paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={activityRiskTypes.hotWork}
                            onChange={(e) =>
                              setActivityRiskTypes((prev) => ({
                                ...prev,
                                hotWork: e.target.checked,
                              }))
                            }
                          />
                          <span className="status-dot dot-red" style={{ marginRight: 6, backgroundColor: "#ef4444" }} />
                          Hot Work ({displayCounts.activityRiskTypes.hotWork})
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={activityRiskTypes.electrical}
                            onChange={(e) =>
                              setActivityRiskTypes((prev) => ({
                                ...prev,
                                electrical: e.target.checked,
                              }))
                            }
                          />
                          <span className="status-dot dot-yellow" style={{ marginRight: 6, backgroundColor: "#eab308" }} />
                          Electrical Systems ({displayCounts.activityRiskTypes.electrical})
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={activityRiskTypes.hazardousSubstances}
                            onChange={(e) =>
                              setActivityRiskTypes((prev) => ({
                                ...prev,
                                hazardousSubstances: e.target.checked,
                              }))
                            }
                          />
                          <span className="status-dot dot-yellow" style={{ marginRight: 6, backgroundColor: "#facc15" }} />
                          Hazardous Substances ({displayCounts.activityRiskTypes.hazardousSubstances})
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={activityRiskTypes.workingAtHeight}
                            onChange={(e) =>
                              setActivityRiskTypes((prev) => ({
                                ...prev,
                                workingAtHeight: e.target.checked,
                              }))
                            }
                          />
                          <span className="status-dot dot-blue" style={{ marginRight: 6, backgroundColor: "#2563eb" }} />
                          Working at Height ({displayCounts.activityRiskTypes.workingAtHeight})
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={activityRiskTypes.confinedSpaces}
                            onChange={(e) =>
                              setActivityRiskTypes((prev) => ({
                                ...prev,
                                confinedSpaces: e.target.checked,
                              }))
                            }
                          />
                          <span className="status-dot dot-orange" style={{ marginRight: 6, backgroundColor: "#f97316" }} />
                          Confined Spaces ({displayCounts.activityRiskTypes.confinedSpaces})
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={activityRiskTypes.excavation}
                            onChange={(e) =>
                              setActivityRiskTypes((prev) => ({
                                ...prev,
                                excavation: e.target.checked,
                              }))
                            }
                          />
                          <span className="status-dot dot-green" style={{ marginRight: 6, backgroundColor: "#22c55e" }} />
                          Excavation Works ({displayCounts.activityRiskTypes.excavation})
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={activityRiskTypes.cranesLifting}
                            onChange={(e) =>
                              setActivityRiskTypes((prev) => ({
                                ...prev,
                                cranesLifting: e.target.checked,
                              }))
                            }
                          />
                          <span className="status-dot dot-purple" style={{ marginRight: 6, backgroundColor: "#a855f7" }} />
                          Cranes / Lifting ({displayCounts.activityRiskTypes.cranesLifting})
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={activityRiskTypes.pressureTesting}
                            onChange={(e) =>
                              setActivityRiskTypes((prev) => ({
                                ...prev,
                                pressureTesting: e.target.checked,
                              }))
                            }
                          />
                          <span className="status-dot dot-teal" style={{ marginRight: 6, backgroundColor: "#0d9488" }} />
                          Pressure Testing ({displayCounts.activityRiskTypes.pressureTesting})
                        </label>
                      </div>
                    </div>
                  </div>

                </div>

                {/* ── COLUMN 2: MAP VIEWER (Center) ── */}
                <div className="panel-col map-viewer-panel">
                  {/* Left panel collapse tab */}
                  <button
                    className={`panel-toggle-tab toggle-tab-left ${isLeftOpen ? "open" : "closed"}`}
                    onClick={() => setIsLeftOpen(!isLeftOpen)}
                    title={isLeftOpen ? "Collapse Left Panel" : "Expand Left Panel"}
                  >
                    <i className={`ti ${isLeftOpen ? "ti-chevron-left" : "ti-chevron-right"}`} />
                  </button>

                  {/* Right panel collapse tab */}
                  <button
                    className={`panel-toggle-tab toggle-tab-right ${isRightOpen ? "open" : "closed"}`}
                    onClick={() => setIsRightOpen(!isRightOpen)}
                    title={isRightOpen ? "Collapse Right Panel" : "Expand Right Panel"}
                  >
                    <i className={`ti ${isRightOpen ? "ti-chevron-right" : "ti-chevron-left"}`} />
                  </button>

                  <div className="map-view-header">
                    <div className="map-title-badge">{activeTab === "Ground Floor" ? "JG- Ground floor" : `${activeTab}`}</div>
                  </div>



                  <div className="map-image-wrapper" ref={mapContainerRef} style={{ position: "relative", overflow: "visible" }}>
                    {selectedPdf ? (
                      <DashboardPolygonViewer
                        pdf={selectedPdf}
                        rooms={rooms}
                        width={mapWidth}
                        isZonesActive={isZonesActive}
                        isIconsActive={isIconsActive}
                        roomsToReview={filteredRoomsToReview}
                        roomHoverData={buildingData?.roomHoverData}
                        activeCompaniesList={activeCompaniesList}
                        onHoverRoom={handleHoverRoom}
                      />
                    ) : (
                      <img
                        src={groundFloorPlan}
                        alt="Ground Floor CAD drawing"
                        className="static-cad-image"
                      />
                    )}
                  </div>

                  {/* Map Legend Footer */}
                  <div className="map-legend-footer">
                    <div className="legend-indicator-item">
                      <span className="legend-indicator-dot dot-indicator-ok" />
                      OK
                    </div>
                    <div className="legend-indicator-item">
                      <span className="legend-indicator-dot dot-indicator-nowork" />
                      No work
                    </div>
                    <div className="legend-indicator-item">
                      <span className="legend-indicator-dot dot-indicator-clash" />
                      Clash
                    </div>
                  </div>
                </div>

                {/* ── COLUMN 3: ROOMS TO REVIEW (Right) ── */}
                <div className={`panel-col review-panel ${isRightOpen ? "panel-open" : "panel-closed"}`}>


                  {/* Room Search */}
                  <div className="filter-group room-search-filter-group" style={{ marginBottom: "16px" }}>
                    <label className="filter-lbl">ROOM SEARCH</label>
                    <div className="search-input-wrapper">
                      <i className="ti ti-search search-icon" />
                      <input
                        type="text"
                        className="search-control"
                        placeholder="Search room..."
                        value={roomSearch}
                        onChange={(e) => setRoomSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="review-list-header">
                    <h5>ROOMS TO REVIEW</h5>
                  </div>

                  <div className="review-scroll-container">
                    {filteredRoomsToReview.map((item) => (
                      <div key={item.zone} className="review-card-item">
                        <div className="review-card-top-row">
                          <span className="review-zone-name">{item.zone}</span>
                          {/* Avatar Row */}
                          <div className="review-avatar-row">
                            {item.companies.slice(0, 3).map((c, i) => {
                              const comp = activeCompaniesList.find(cl => cl.code === c || cl.name === c);
                              const compColor = comp?.color || "#3b82f6";
                              const compLogo = comp?.logo;
                              return (
                                <CompanyLogo
                                  key={c}
                                  logo={compLogo}
                                  name={comp?.name || c}
                                  code={c}
                                  color={compColor}
                                  size={22}
                                  className="mini-avatar"
                                  style={{ zIndex: 10 - i, marginRight: 0 }}
                                />
                              );
                            })}
                            {item.companies.length > 3 && (
                              <span className="mini-avatar avatar-plus">+{item.companies.length - 3}</span>
                            )}
                          </div>
                        </div>

                        {/* Status Pills */}
                        <div className="review-pills-row">
                          {item.clash && <span className="pill-badge pill-red">CLASH</span>}
                          {item.hra && <span className="pill-badge pill-darkred">HRA</span>}
                          {item.onHold && <span className="pill-badge pill-purple">ON HOLD</span>}
                          {item.preOk > 0 && (
                            <span className="pill-badge pill-green">{item.preOk} PRE-OK</span>
                          )}
                        </div>

                        <div className="review-card-footer">
                          <span>{item.sub}</span>
                        </div>
                      </div>
                    ))}
                    {filteredRoomsToReview.length === 0 && (
                      <div className="no-results" style={{ padding: "20px", color: "var(--text-muted)", textAlign: "center" }}>
                        No rooms to review match filters.
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ── HOVER CARD PORTAL — rendered at document.body to escape all overflow containers ── */}
      {hoveredRoomData && hoveredRoom && ReactDOM.createPortal(
        <div
          className="map-tooltip-overlay"
          onMouseEnter={handleHoverCardEnter}
          onMouseLeave={handleHoverCardLeave}
          style={getPortalTooltipStyle(hoveredRoom.x, hoveredRoom.y)}
        >
          <div
            style={{
              backgroundColor: "#111827",
              color: "#ffffff",
              padding: "14px 18px",
              borderRadius: "10px",
              boxShadow: "0 20px 50px -5px rgba(0,0,0,0.7), 0 10px 20px -8px rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: "14.5px", marginBottom: "4px" }}>
              {hoveredRoomData.title}
            </div>
            <div style={{ color: "#94a3b8", marginBottom: "8px", fontSize: "12px" }}>
              {hoveredRoomData.subtitle}
            </div>
            {hoveredRoomData.isNoWork ? (
              <div style={{ color: "#94a3b8", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#94a3b8", display: "inline-block" }} />
                No work (0 active permits)
              </div>
            ) : (
              <>
                <div style={{ color: hoveredRoomData.clash?.includes("Clash") ? "#ef4444" : "#10b981", fontWeight: 700, marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px", fontSize: "13px" }}>
                  <i className={hoveredRoomData.clash?.includes("Clash") ? "ti ti-alert-triangle" : "ti ti-check"} />
                  {hoveredRoomData.clash}
                </div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                  <span style={{ backgroundColor: "#1e293b", border: "1px solid #334155", padding: "3px 10px", borderRadius: "20px", color: "#e2e8f0", fontSize: "11px", fontWeight: 600 }}>
                    {hoveredRoomData.companies}
                  </span>
                  <span style={{ backgroundColor: "#1e293b", border: "1px solid #334155", padding: "3px 10px", borderRadius: "20px", color: "#e2e8f0", fontSize: "11px", fontWeight: 600 }}>
                    {hoveredRoomData.permits}
                  </span>
                </div>
                {hoveredRoomData.hra && (
                  <div style={{ fontSize: "11.5px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px", marginBottom: "8px", color: "#cbd5e1" }}>
                    <span style={{ fontWeight: 700, color: "#fca5a5" }}>HRA:</span>{" "}
                    {typeof hoveredRoomData.hra === "string" ? hoveredRoomData.hra.replace("HRA:", "").trim() : "High Risk Activity"}
                  </div>
                )}
                {hoveredRoomData.compDetails && hoveredRoomData.compDetails.length > 0 && (
                  <div style={{ marginTop: "8px", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "8px" }}>
                    <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#94a3b8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Companies & HRAs Involved ({hoveredRoomData.compDetails.length}):
                    </div>
                    <div
                      className="hover-card-comp-scroll"
                      onWheel={(e) => e.stopPropagation()}
                      style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "180px", overflowY: "auto", paddingRight: "4px" }}
                    >
                      {hoveredRoomData.compDetails.map((cObj, idx) => (
                        <div
                          key={idx}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.06)", padding: "5px 8px", borderRadius: "6px", gap: "8px" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                            <CompanyLogo
                              logo={cObj.logo}
                              name={cObj.name}
                              code={cObj.code}
                              color={cObj.color}
                              size={20}
                              style={{ marginRight: 0, flexShrink: 0 }}
                            />
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cObj.name}</span>
                          </div>
                          {cObj.hraLogos && cObj.hraLogos.length > 0 && (
                            <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                              {cObj.hraLogos.map((hra) => (
                                <img
                                  key={hra.key}
                                  src={hra.img}
                                  alt={hra.title}
                                  title={hra.title}
                                  style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.4)" }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default ExecutiveDashboard;
