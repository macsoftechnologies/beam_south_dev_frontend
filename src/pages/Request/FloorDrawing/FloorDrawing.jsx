import React, { useState, useEffect, useRef } from "react";
import ZoneModal from "../ZoneModal";

import "./FloorDrawing.css";
import ZonePolygonViewer from "../../../components/Zonepolygonviewer";

function FloorDrawing({
  pdf,
  zones = [],
  level,
  selectedRooms = [],
  onRoomsSelected,
  roomStatusMap,
}) {
  const [selectedZone, setSelectedZone] = useState(null);
  const [hoveredZoneId, setHoveredZoneId] = useState(null);

  const containerRef = useRef(null);
  const [viewerWidth, setViewerWidth] = useState(800);

  // Measure container width so the Konva stage fills the panel responsively
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const w = entries[0].contentRect.width;
      if (w > 0) setViewerWidth(Math.max(400, w - 40));
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="floor-drawing-console">

        {/* ── Left Panel: PDF + Zone Polygons ── */}
        <div className="floor-drawing-viewer-card">
          <div className="floor-viewer-header">
            <h4>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10b981",
                  marginRight: 8,
                }}
              />
              Floor Plan Viewer
            </h4>
            {level && <span className="floor-viewer-badge">{level}</span>}
          </div>

          <div
            className="main-section"
            ref={containerRef}
            style={{
              position: "relative",
              overflow: "auto",
              background: "#151d30",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              flex: 1,
              cursor: "pointer",
              padding: "20px",
            }}
          >
            <ZonePolygonViewer
              pdf={pdf}
              zones={zones}
              width={viewerWidth}
              selectedZoneId={selectedZone?.id}
              onZoneClick={(zone) => setSelectedZone(zone)}
            />
          </div>
        </div>

        {/* ── Right Panel: Zones Directory ── */}
        <div className="floor-drawing-sidebar-card">
          <div className="floor-sidebar-header">
            <h4 style={{ margin: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Zones Directory</span>
              <span className="zone-count-badge" style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                {zones.length} {zones.length === 1 ? "Zone" : "Zones"}
              </span>
            </h4>
            <p style={{ margin: "4px 0 0 0" }}>Select a zone to allocate work rooms</p>
          </div>

          <div className="zones-list-container">
            {zones.map((zone) => {
              const roomsCount = zone.rooms ? zone.rooms.length : 0;
              return (
                <div
                  key={zone.id}
                  className={`zone-card ${hoveredZoneId === zone.id ? "hovered" : ""
                    }`}
                  onClick={() => setSelectedZone(zone)}
                  onMouseEnter={() => setHoveredZoneId(zone.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                >
                  <div className="zone-card-top">
                    <span className="zone-card-name">{zone.name}</span>
                    <span className="zone-card-rooms-count">
                      {roomsCount} Room{roomsCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {zone.rooms && zone.rooms.length > 0 && (
                    <div className="zone-card-rooms-list">
                      {zone.rooms.slice(0, 4).map((room, idx) => {
                        const roomName =
                          typeof room === "object" ? room.name : room;
                        return (
                          <span key={idx} className="zone-card-room-tag">
                            {roomName}
                          </span>
                        );
                      })}
                      {zone.rooms.length > 4 && (
                        <span
                          className="zone-card-room-tag"
                          style={{
                            background: "rgba(37,99,235,0.1)",
                            color: "#3b82f6",
                          }}
                        >
                          +{zone.rooms.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Zone Modal — opens when a polygon or sidebar card is clicked */}
      {selectedZone && (
        <ZoneModal
          zone={selectedZone}
          selectedRooms={selectedRooms
            .filter(r => {
              if (typeof r === "string" && r.includes(":::")) {
                const [zName] = r.split(":::");
                return selectedZone && zName === selectedZone.name;
              }
              return true;
            })
            .map(r => (typeof r === "string" && r.includes(":::") ? r.split(":::")[1] : r))}
          onClose={() => setSelectedZone(null)}
          onConfirm={(rooms) => {
            if (onRoomsSelected) {
              onRoomsSelected(rooms, selectedZone);
            }
            setSelectedZone(null);
          }}
          roomStatusMap={roomStatusMap}
        />
      )}
    </>
  );
}

export default FloorDrawing;