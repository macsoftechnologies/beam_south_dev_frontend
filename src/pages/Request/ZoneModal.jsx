import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { pdfjs } from "react-pdf";
import PdfPolygonViewer from "../../components/PdfPolygonViewer";
import { showError } from "../../components/common/Toast/Toast";

// Using a direct CDN URL avoids Nginx MIME-type issues with .mjs workers
// when the app is deployed under a sub-path (e.g. /m3north_frontend/).
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ZOOM_STEP = 0.25;
const ZOOM_MIN  = 0.25;  // 25% – minimum allowed zoom
const ZOOM_MAX  = 3.0;   // 300% – maximum allowed zoom

function ZoneModal({
  zone,
  selectedRooms: globalSelectedRooms = [],
  onClose,
  onConfirm,
  roomStatusMap,
}) {
  const [selectedRooms, setSelectedRooms] = useState(globalSelectedRooms);
  const [viewerWidth, setViewerWidth] = useState(900);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pdf");
  const containerRef = useRef(null);

  // Sync selected rooms when global selections change or modal opens
  useEffect(() => {
    setSelectedRooms(globalSelectedRooms);
  }, [globalSelectedRooms]);

  const getRoomStatusFromMap = (item) => {
    if (!item) return null;
    // Authoritative status: all rooms inside this ZoneModal belong to this zone
    if (zone && zone.status) return zone.status;

    let rName = "";
    let zName = "";
    if (typeof item === "object") {
      rName = item.name || item.room_name || "";
      zName = item.zone || (zone ? zone.name : "");
    } else {
      const str = String(item);
      const parts = str.split(":::");
      if (parts.length === 3) {
        zName = parts[1];
        rName = parts[2];
      } else if (parts.length === 2) {
        zName = parts[0];
        rName = parts[1];
      } else {
        rName = parts[0];
        zName = zone ? zone.name : "";
      }
    }
    const cleanZone = (zName || (zone ? zone.name : "") || "").toLowerCase().trim();
    const cleanKey = rName.toLowerCase().trim();

    if (cleanZone && roomStatusMap && roomStatusMap[`${cleanZone}:::${cleanKey}`]) {
      return roomStatusMap[`${cleanZone}:::${cleanKey}`];
    }
    if (roomStatusMap && roomStatusMap[cleanKey]) {
      return roomStatusMap[cleanKey];
    }
    return null;
  };

  const toggleRoom = (roomName) => {
    if (selectedRooms.includes(roomName)) {
      setSelectedRooms((prev) => prev.filter((r) => r !== roomName));
      return;
    }

    const newRoomStatus = getRoomStatusFromMap(roomName) || (zone ? zone.status : null);
    if (newRoomStatus) {
      const activeStatus = selectedRooms.reduce((status, item) => {
        if (status) return status;
        return getRoomStatusFromMap(item);
      }, null);

      if (activeStatus && activeStatus !== newRoomStatus) {
        const statusLabelMap = {
          UC: "Construction",
          C: "Commissioning",
          HO: "Hand Over",
        };
        const activeLabel = statusLabelMap[activeStatus] || activeStatus;
        const newLabel = statusLabelMap[newRoomStatus] || newRoomStatus;
        showError(`Cannot select a room in a ${newLabel} zone when a room in a ${activeLabel} zone is already selected.`);
        return;
      }
    }

    setSelectedRooms((prev) => [...prev, roomName]);
  };

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {

    if (!containerRef.current) return;

    const resize = () => {
      const isMobile = window.innerWidth <= 1024;
      const padding = isMobile ? 20 : 40; // 10px each side on mobile, 20px on desktop
      const calculatedWidth = containerRef.current.clientWidth - padding;

      // On mobile, let the PDF scale down to fit the container width (min 280px)
      // On desktop, keep a minimum width of 600px for usability
      const minWidth = isMobile ? 280 : 600;
      setViewerWidth(Math.max(minWidth, calculatedWidth));
    };

    resize();

    window.addEventListener("resize", resize);

    return () =>
      window.removeEventListener("resize", resize);

  }, [activeTab]);

  // Zoom helpers
  const zoomIn    = () => setZoomScale((prev) => Math.min(ZOOM_MAX, parseFloat((prev + ZOOM_STEP).toFixed(2))));
  const zoomOut   = () => setZoomScale((prev) => Math.max(ZOOM_MIN, parseFloat((prev - ZOOM_STEP).toFixed(2))));
  const zoomReset = () => setZoomScale(1.0);

  const zoomedWidth = Math.round(viewerWidth * zoomScale);
  const zoomPercent = Math.round(zoomScale * 100);

  return ReactDOM.createPortal(
    <div
      className="zone-modal"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 20000000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="zone-modal-content"
        style={{
          width: "95vw",
          height: "92vh",
          maxWidth: "1600px",
          background: "#111827",
          display: "flex",
          flexDirection: "column",
          borderRadius: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          .swal2-container {
            z-index: 99999999 !important;
          }
          @media (max-width: 1024px) {
            .zone-modal-mobile-tabs {
              display: flex !important;
            }
            .zone-modal-body {
              grid-template-columns: 1fr !important;
              grid-template-rows: 1fr !important;
              overflow-y: hidden !important;
            }
            .zone-modal-body.show-pdf .zone-modal-sidebar {
              display: none !important;
            }
            .zone-modal-body.show-rooms .zone-modal-pdf-container {
              display: none !important;
            }
            .zone-modal-pdf-container {
              overflow: hidden !important;
            }
            .zone-modal-sidebar {
              height: 100% !important;
              border-left: none !important;
              border-top: none !important;
            }
            .modal-room-list {
              max-height: none !important;
              flex: 1 !important;
            }
          }
          .zm-zoom-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.15);
            background: rgba(255,255,255,0.06);
            color: #e5e7eb;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            line-height: 1;
            transition: background 0.15s, border-color 0.15s;
            user-select: none;
          }
          .zm-zoom-btn:hover:not(:disabled) {
            background: rgba(59,130,246,0.18);
            border-color: rgba(59,130,246,0.5);
            color: #93c5fd;
          }
          .zm-zoom-btn:disabled {
            opacity: 0.35;
            cursor: not-allowed;
          }
          .zm-zoom-reset-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 30px;
            padding: 0 10px;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.15);
            background: rgba(255,255,255,0.06);
            color: #d1d5db;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s;
            min-width: 52px;
          }
          .zm-zoom-reset-btn:hover {
            background: rgba(59,130,246,0.18);
            border-color: rgba(59,130,246,0.5);
            color: #93c5fd;
          }
        `}</style>

        {/* Header */}
        <div
          className="zone-modal-header"
          style={{
            height: "65px",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
            Zone {zone.name} - Select Rooms
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#9ca3af",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Mobile Tab Navigation */}
        <div
          className="zone-modal-mobile-tabs"
          style={{
            display: "none",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "#111827",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setActiveTab("pdf")}
            style={{
              flex: 1,
              padding: "12px",
              background: activeTab === "pdf" ? "#1f2937" : "transparent",
              color: activeTab === "pdf" ? "#3b82f6" : "#9ca3af",
              border: "none",
              borderBottom: activeTab === "pdf" ? "2px solid #3b82f6" : "none",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            PDF Floor Plan
          </button>
          <button
            onClick={() => setActiveTab("rooms")}
            style={{
              flex: 1,
              padding: "12px",
              background: activeTab === "rooms" ? "#1f2937" : "transparent",
              color: activeTab === "rooms" ? "#3b82f6" : "#9ca3af",
              border: "none",
              borderBottom: activeTab === "rooms" ? "2px solid #3b82f6" : "none",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {(() => {
              const selectedRoomsInZoneCount = (zone?.rooms || []).filter((r) => {
                const name = typeof r === "object" ? r.name : r;
                return selectedRooms.includes(name);
              }).length;
              return `Rooms Checklist (${selectedRoomsInZoneCount})`;
            })()}
          </button>
        </div>

        {/* Two-Column Content Layout */}
        <div
          className={`zone-modal-body ${activeTab === "pdf" ? "show-pdf" : "show-rooms"}`}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 340px",
            flex: 1,
            overflow: "hidden",
            background: "#151d30",
          }}
        >
          {/* Left Panel: PDF Viewer (with zoom toolbar) */}
          <div
            className="zone-modal-pdf-container"
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "#1b2436",
            }}
          >
            {/* ── Zoom Toolbar ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(0,0,0,0.25)",
                flexShrink: 0,
              }}
            >
              <span style={{ color: "#6b7280", fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginRight: 2 }}>
                Zoom
              </span>
              <button
                className="zm-zoom-btn"
                onClick={zoomOut}
                disabled={zoomScale <= ZOOM_MIN}
                title="Zoom Out (−25%)"
              >
                −
              </button>
              <button
                className="zm-zoom-reset-btn"
                onClick={zoomReset}
                title="Reset to 100%"
              >
                {zoomPercent}%
              </button>
              <button
                className="zm-zoom-btn"
                onClick={zoomIn}
                disabled={zoomScale >= ZOOM_MAX}
                title="Zoom In (+25%)"
              >
                +
              </button>
            </div>

            {/* Scrollable PDF area */}
            <div
              ref={containerRef}
              style={{
                flex: 1,
                overflow: "auto",
                display: "flex",
                justifyContent: zoomedWidth > (containerRef.current?.clientWidth ?? 0) ? "flex-start" : "center",
                alignItems: "flex-start",
                padding: 20,
              }}
            >
              <PdfPolygonViewer
                pdf={zone.pdf}
                rooms={zone.rooms}
                width={zoomedWidth}
                selectedRooms={selectedRooms}
                toggleRoom={toggleRoom}
              />
            </div>
          </div>

          {/* Right Panel: Rooms Directory Sidebar */}
          <div
            className="zone-modal-sidebar"
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#111827",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <h4 style={{ margin: 0, color: "#fff", fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Rooms Directory</span>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                  {(zone?.rooms || []).length} {(zone?.rooms || []).length === 1 ? "Room" : "Rooms"}
                </span>
              </h4>
              <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: "11px" }}>
                Select rooms to allocate permit work
              </p>
              <div style={{ marginTop: "12px", position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    paddingLeft: "32px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "#1f2937",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    fontSize: "13px",
                    pointerEvents: "none",
                  }}
                >
                  🔍
                </span>
              </div>
            </div>

            <div
              className="modal-room-list"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                overflowY: "auto",
                flex: 1,
                background: "#111827",
              }}
            >
              {zone.rooms
                .filter((room) => {
                  const roomName = typeof room === "object" ? room.name : room;
                  return (roomName || "").toLowerCase().includes((searchTerm || "").toLowerCase().trim());
                })
                .map((room) => {
                  const roomName = typeof room === "object" ? room.name : room;
                  const key = typeof room === "object" ? (room.id || room.name) : room;
                  return (
                    <label
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 8,
                        cursor: "pointer",
                        color: "#f3f4f6",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRooms.includes(roomName)}
                        onChange={() => toggleRoom(roomName)}
                      />
                      {roomName}
                    </label>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="zone-modal-footer"
          style={{
            padding: "16px 24px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            background: "#111827",
            flexShrink: 0,
          }}
        >
          <button
            className="df-btn df-btn-secondary"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            className="df-btn df-btn-primary"
            onClick={() => onConfirm && onConfirm(selectedRooms)}
            style={{
              background: "#2563eb",
              border: "none",
              color: "#fff",
              padding: "8px 24px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ZoneModal;