import { renderPdf } from "./pdfRenderer";

/**
 * Helper to calculate centroid of a polygon
 */
function getCentroid(pts) {
    if (!pts || pts.length === 0) return { x: 0, y: 0 };
    const sum = pts.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / pts.length, y: sum.y / pts.length };
}

/**
 * Generate a clear, high-resolution location floor map snapshot:
 * - If room(s) are selected:
 *   Produces a crisp 2-panel composite image:
 *   [Left Panel]: Full Building Floor Plan with the Zone highlighted
 *   [Right Panel]: Zoomed-in detailed CAD Drawing with the exact Room(s) highlighted in green + pin badge
 * - If no room is selected:
 *   Produces a high-resolution Building Floor Plan with the Zone highlighted full-width
 *
 * @param {Object} params
 * @param {string|File} params.levelPdf - Main floor level PDF (e.g. JF-GroundFloor.pdf)
 * @param {Array} params.zones - Array of zone objects for this level from ZONE_MAPPING
 * @param {Array} params.selectedRooms - Array of selected room tokens / names
 * @param {string} params.level - Level name string (e.g. "JF-Ground Floor")
 * @param {string} params.buildingName - Building name string (e.g. "JF")
 * @returns {Promise<string|null>} Data URL (JPEG, quality 0.92)
 */
export async function generateLocationMapSnapshot({
    levelPdf,
    zones = [],
    selectedRooms = [],
    level = "",
    buildingName = "",
}) {
    if (!levelPdf) return null;

    try {
        // 1. Normalize selected room names
        const roomNames = (selectedRooms || []).map((r) => {
            if (typeof r === "object" && r) return (r.name || r.room_name || "").trim();
            const str = String(r || "");
            return str.split(":::").pop().trim();
        }).filter(Boolean);

        // 2. Identify ALL active zones that contain any selected room(s) or are selected
        const activeZones = [];
        if (Array.isArray(zones) && zones.length > 0) {
            zones.forEach((z) => {
                const zNameLower = (z.name || "").trim().toLowerCase();

                // Check if any selected token matches this zone by name (e.g. Level:::Zone:::Room)
                const tokenMatches = (selectedRooms || []).some((sr) => {
                    if (typeof sr === "string" && sr.includes(":::")) {
                        const parts = sr.split(":::");
                        const tokenZ = parts.length > 1 ? parts[parts.length - 2].trim().toLowerCase() : "";
                        return tokenZ && tokenZ === zNameLower;
                    }
                    if (typeof sr === "object" && sr !== null) {
                        const objZ = (sr.zoneName || sr.zone || "").trim().toLowerCase();
                        return objZ && objZ === zNameLower;
                    }
                    return false;
                });

                // Check if any room belonging to this zone is in the selected roomNames
                const roomMatches = (z.rooms || []).some((r) => {
                    const rName = (typeof r === "object" ? r.name : r || "").trim().toLowerCase();
                    return roomNames.some((rn) => rn.toLowerCase() === rName);
                });

                if (tokenMatches || roomMatches) {
                    if (!activeZones.some((az) => az.id === z.id || az.name === z.name)) {
                        activeZones.push(z);
                    }
                }
            });

            // Fallback: if no active zones found but zones exist, and only 1 zone in total
            if (activeZones.length === 0 && zones.length === 1) {
                activeZones.push(zones[0]);
            }
        }

        // 3. Render Level Overview PDF at high resolution (1200px width)
        const overviewPdfCanvas = await renderPdf(levelPdf, 1200);
        const overviewCanvas = document.createElement("canvas");
        overviewCanvas.width = overviewPdfCanvas.width;
        overviewCanvas.height = overviewPdfCanvas.height;
        const oCtx = overviewCanvas.getContext("2d");
        oCtx.drawImage(overviewPdfCanvas, 0, 0);

        // Highlight all active zones on the overview canvas
        (zones || []).forEach((z) => {
            if (!z.points || z.points.length < 3) return;
            const isMatch = activeZones.some((az) => az.id === z.id || az.name === z.name);
            const scaleX = overviewCanvas.width / (z.pdfWidth || 1);
            const scaleY = overviewCanvas.height / (z.pdfHeight || 1);

            const pts = z.points.map((pt) => ({ x: pt.x * scaleX, y: pt.y * scaleY }));

            oCtx.beginPath();
            pts.forEach((pt, i) => {
                if (i === 0) oCtx.moveTo(pt.x, pt.y);
                else oCtx.lineTo(pt.x, pt.y);
            });
            oCtx.closePath();

            if (isMatch) {
                oCtx.fillStyle = "rgba(34, 197, 94, 0.40)";
                oCtx.fill();
                oCtx.strokeStyle = "#16a34a";
                oCtx.lineWidth = 4;
                oCtx.stroke();

                // Draw Zone name pill badge at centroid
                const c = getCentroid(pts);
                const badgeText = z.name || "Active Zone";
                oCtx.save();
                oCtx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
                const tw = oCtx.measureText(badgeText).width;
                const bw = tw + 18;
                const bh = 26;
                oCtx.fillStyle = "#15803d";
                oCtx.shadowColor = "rgba(0,0,0,0.3)";
                oCtx.shadowBlur = 4;
                oCtx.beginPath();
                if (oCtx.roundRect) oCtx.roundRect(c.x - bw / 2, c.y - bh / 2, bw, bh, 13);
                else oCtx.rect(c.x - bw / 2, c.y - bh / 2, bw, bh);
                oCtx.fill();
                oCtx.fillStyle = "#ffffff";
                oCtx.textAlign = "center";
                oCtx.textBaseline = "middle";
                oCtx.fillText(badgeText, c.x, c.y);
                oCtx.restore();
            } else {
                oCtx.fillStyle = "rgba(59, 130, 246, 0.12)";
                oCtx.fill();
                oCtx.strokeStyle = "#3b82f6";
                oCtx.lineWidth = 2;
                oCtx.stroke();
            }
        });

        // 4. Room Detail Drawing:
        // ONLY generate room detail if EXACTLY ONE zone is selected.
        // If more zones are provided, only the zones overview map is enough per user requirement.
        let roomDrawingCanvas = null;
        let cropRect = null;
        const singleActiveZone = activeZones.length === 1 ? activeZones[0] : null;

        if (singleActiveZone && singleActiveZone.pdf) {
            const matchedRoomObjs = (singleActiveZone.rooms || []).filter((r) => {
                const rName = (typeof r === "object" ? r.name : r || "").trim().toLowerCase();
                return roomNames.some((rn) => rn.toLowerCase() === rName);
            });

            if (matchedRoomObjs.length > 0) {
                try {
                    // Render Zone CAD PDF at high resolution (1400px width)
                    const zonePdfCanvas = await renderPdf(singleActiveZone.pdf, 1400);
                    roomDrawingCanvas = document.createElement("canvas");
                    roomDrawingCanvas.width = zonePdfCanvas.width;
                    roomDrawingCanvas.height = zonePdfCanvas.height;
                    const rCtx = roomDrawingCanvas.getContext("2d");
                rCtx.drawImage(zonePdfCanvas, 0, 0);

                    // Draw unselected rooms softly
                    (singleActiveZone.rooms || []).forEach((r) => {
                    if (!r.points || r.points.length < 3) return;
                    const isSelected = matchedRoomObjs.some((sr) => sr.name === r.name);
                    if (isSelected) return;

                    const scaleX = roomDrawingCanvas.width / (r.pdfWidth || 1);
                    const scaleY = roomDrawingCanvas.height / (r.pdfHeight || 1);
                    rCtx.beginPath();
                    r.points.forEach((pt, i) => {
                        const px = pt.x * scaleX;
                        const py = pt.y * scaleY;
                        if (i === 0) rCtx.moveTo(px, py);
                        else rCtx.lineTo(px, py);
                    });
                    rCtx.closePath();
                    rCtx.strokeStyle = "rgba(148, 163, 184, 0.4)";
                    rCtx.lineWidth = 1.5;
                    rCtx.stroke();
                });

                // Draw selected room(s) with bold highlighting & pin badge
                const allSelectedRoomPoints = [];
                matchedRoomObjs.forEach((r) => {
                    if (!r.points || r.points.length < 3) return;
                    const scaleX = roomDrawingCanvas.width / (r.pdfWidth || 1);
                    const scaleY = roomDrawingCanvas.height / (r.pdfHeight || 1);
                    const pts = r.points.map((pt) => ({ x: pt.x * scaleX, y: pt.y * scaleY }));
                    pts.forEach((p) => allSelectedRoomPoints.push(p));

                    // Highlight fill
                    rCtx.beginPath();
                    pts.forEach((pt, i) => {
                        if (i === 0) rCtx.moveTo(pt.x, pt.y);
                        else rCtx.lineTo(pt.x, pt.y);
                    });
                    rCtx.closePath();
                    rCtx.fillStyle = "rgba(34, 197, 94, 0.42)";
                    rCtx.fill();
                    rCtx.strokeStyle = "#16a34a";
                    rCtx.lineWidth = 4.5;
                    rCtx.stroke();

                    // Room pin badge at centroid
                    const c = getCentroid(pts);
                    const label = `📍 Room ${r.name}`;
                    rCtx.save();
                    rCtx.font = "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
                    const tw = rCtx.measureText(label).width;
                    const bw = tw + 22;
                    const bh = 34;

                    rCtx.shadowColor = "rgba(0,0,0,0.35)";
                    rCtx.shadowBlur = 8;
                    rCtx.shadowOffsetY = 3;
                    rCtx.fillStyle = "#ffffff";
                    rCtx.beginPath();
                    if (rCtx.roundRect) rCtx.roundRect(c.x - bw / 2, c.y - bh / 2, bw, bh, 17);
                    else rCtx.rect(c.x - bw / 2, c.y - bh / 2, bw, bh);
                    rCtx.fill();

                    rCtx.strokeStyle = "#16a34a";
                    rCtx.lineWidth = 2.5;
                    rCtx.stroke();

                    rCtx.fillStyle = "#15803d";
                    rCtx.textAlign = "center";
                    rCtx.textBaseline = "middle";
                    rCtx.fillText(label, c.x, c.y);
                    rCtx.restore();
                });

                // Calculate bounding box crop with 35% context padding so surrounding doors and walls are clearly visible
                if (allSelectedRoomPoints.length > 0) {
                    const minX = Math.min(...allSelectedRoomPoints.map((p) => p.x));
                    const maxX = Math.max(...allSelectedRoomPoints.map((p) => p.x));
                    const minY = Math.min(...allSelectedRoomPoints.map((p) => p.y));
                    const maxY = Math.max(...allSelectedRoomPoints.map((p) => p.y));

                    const rw = maxX - minX;
                    const rh = maxY - minY;
                    const padX = Math.max(100, rw * 0.4);
                    const padY = Math.max(100, rh * 0.4);

                    cropRect = {
                        x: Math.max(0, minX - padX),
                        y: Math.max(0, minY - padY),
                        w: Math.min(roomDrawingCanvas.width - Math.max(0, minX - padX), rw + padX * 2),
                        h: Math.min(roomDrawingCanvas.height - Math.max(0, minY - padY), rh + padY * 2),
                    };
                }
            } catch (err) {
                console.warn("Could not render zone CAD room drawing:", err);
                roomDrawingCanvas = null;
            }
        }
    }

        // 5. Create Master Canvas
        const hasRoomDetail = Boolean(roomDrawingCanvas && cropRect);
        const overviewAspect = overviewCanvas.width / (overviewCanvas.height || 1);
        // Floor plans with more height than width (portrait / vertical strip, e.g. MR building)
        // are placed side-by-side with the room detail to avoid large horizontal empty gaps.
        // Floor plans with more width than height (landscape / horizontal, e.g. JF building)
        // are stacked up-and-down so both plans stretch across the full width.
        const isVerticalFloor = overviewAspect < 1.15;

        const MASTER_W = 1600;
        let MASTER_H;
        if (hasRoomDetail) {
            MASTER_H = isVerticalFloor ? 960 : 1120;
        } else {
            MASTER_H = isVerticalFloor ? 1000 : 720;
        }

        const masterCanvas = document.createElement("canvas");
        masterCanvas.width = MASTER_W;
        masterCanvas.height = MASTER_H;
        const mCtx = masterCanvas.getContext("2d");

        // Background
        mCtx.fillStyle = "#ffffff";
        mCtx.fillRect(0, 0, MASTER_W, MASTER_H);

        // Header bar
        const HEADER_H = 42;
        mCtx.fillStyle = "#0f172a";
        mCtx.fillRect(0, 0, MASTER_W, HEADER_H);

        // Header text
        mCtx.fillStyle = "#ffffff";
        mCtx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        mCtx.textBaseline = "middle";
        const zoneDisplayNames = activeZones.map((z) => z.name).filter(Boolean);
        const zoneTitle = zoneDisplayNames.length > 0
            ? (zoneDisplayNames.length === 1 ? zoneDisplayNames[0] : `${zoneDisplayNames.length} Zones (${zoneDisplayNames.join(", ")})`)
            : "";
        const locParts = [buildingName, level, zoneTitle].filter(Boolean);
        const locTitle = locParts.length > 0 ? locParts.join(" • ") : "Floor Plan Location";
        const maxHeaderLeftW = MASTER_W - 320;
        let displayLocationText = `📍 Location: ${locTitle}`;
        if (roomNames.length === 1) {
            displayLocationText += ` • Room: ${roomNames[0]}`;
        } else if (roomNames.length > 1) {
            displayLocationText += ` • ${roomNames.length} Rooms Selected`;
        }
        mCtx.fillText(displayLocationText, 16, HEADER_H / 2);

        mCtx.fillStyle = "#94a3b8";
        mCtx.font = "500 13px -apple-system, BlinkMacSystemFont, sans-serif";
        mCtx.textAlign = "right";
        mCtx.fillText("Verified High-Resolution CAD Map", MASTER_W - 16, HEADER_H / 2);
        mCtx.textAlign = "left";

        const contentY = HEADER_H;
        const contentH = MASTER_H - HEADER_H;
        const SUBHEADER_H = 32;

        if (hasRoomDetail) {
            if (isVerticalFloor) {
                // ── SIDE-BY-SIDE FORMAT (FOR TALL / PORTRAIT FLOOR PLANS) ──
                // Left Column: Building Zone Overview (Vertical)
                // Right Column: Specific Work Area Detail
                const col1W = Math.round(MASTER_W * 0.38); // ~608px
                const col2W = MASTER_W - col1W;            // ~992px
                const splitX = col1W;

                // Left: Building Overview
                mCtx.fillStyle = "#f8fafc";
                mCtx.fillRect(0, contentY, col1W, SUBHEADER_H);
                mCtx.fillStyle = "#334155";
                mCtx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
                mCtx.textBaseline = "middle";
                mCtx.fillText(`BUILDING OVERVIEW — ${singleActiveZone ? singleActiveZone.name : "ZONE"}`, 16, contentY + SUBHEADER_H / 2);

                const oTargetX = 14;
                const oTargetY = contentY + SUBHEADER_H + 6;
                const oTargetW = col1W - 28;
                const oTargetH = contentH - SUBHEADER_H - 12;
                drawContained(mCtx, overviewCanvas, 0, 0, overviewCanvas.width, overviewCanvas.height, oTargetX, oTargetY, oTargetW, oTargetH);

                // Vertical divider line between columns
                mCtx.strokeStyle = "#cbd5e1";
                mCtx.lineWidth = 2;
                mCtx.beginPath();
                mCtx.moveTo(splitX, contentY);
                mCtx.lineTo(splitX, MASTER_H);
                mCtx.stroke();

                // Right: Specific Work Area
                mCtx.fillStyle = "#f8fafc";
                mCtx.fillRect(splitX, contentY, col2W, SUBHEADER_H);
                mCtx.fillStyle = "#15803d";
                mCtx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
                mCtx.textBaseline = "middle";
                const workAreaText = roomNames.length === 1
                    ? `🎯 SPECIFIC WORK AREA — ROOM ${roomNames[0]}`
                    : `🎯 SPECIFIC WORK AREA — SELECTED ROOMS DETAIL (${roomNames.length} ROOMS)`;
                mCtx.fillText(workAreaText, splitX + 16, contentY + SUBHEADER_H / 2);

                const rTargetX = splitX + 14;
                const rTargetY = contentY + SUBHEADER_H + 6;
                const rTargetW = col2W - 28;
                const rTargetH = contentH - SUBHEADER_H - 12;
                drawContained(mCtx, roomDrawingCanvas, cropRect.x, cropRect.y, cropRect.w, cropRect.h, rTargetX, rTargetY, rTargetW, rTargetH);
            } else {
                // ── UP-AND-DOWN FORMAT (FOR WIDE / LANDSCAPE FLOOR PLANS) ──
                // Top Row: Building Zone Overview (Full Width)
                // Bottom Row: Specific Work Area Detail (Full Width)
                const row1H = Math.round(contentH * 0.44); // ~474px
                const row2H = contentH - row1H;            // ~604px
                const splitY = contentY + row1H;

                // Top Row: Building Overview
                mCtx.fillStyle = "#f8fafc";
                mCtx.fillRect(0, contentY, MASTER_W, SUBHEADER_H);
                mCtx.fillStyle = "#334155";
                mCtx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
                mCtx.textBaseline = "middle";
                mCtx.fillText(`BUILDING OVERVIEW — ${singleActiveZone ? singleActiveZone.name : "ZONE"}`, 16, contentY + SUBHEADER_H / 2);

                const oTargetX = 14;
                const oTargetY = contentY + SUBHEADER_H + 6;
                const oTargetW = MASTER_W - 28;
                const oTargetH = row1H - SUBHEADER_H - 12;
                drawContained(mCtx, overviewCanvas, 0, 0, overviewCanvas.width, overviewCanvas.height, oTargetX, oTargetY, oTargetW, oTargetH);

                // Horizontal divider line between rows
                mCtx.strokeStyle = "#cbd5e1";
                mCtx.lineWidth = 2;
                mCtx.beginPath();
                mCtx.moveTo(0, splitY);
                mCtx.lineTo(MASTER_W, splitY);
                mCtx.stroke();

                // Bottom Row: Specific Work Area
                mCtx.fillStyle = "#f8fafc";
                mCtx.fillRect(0, splitY, MASTER_W, SUBHEADER_H);
                mCtx.fillStyle = "#15803d";
                mCtx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
                mCtx.textBaseline = "middle";
                const workAreaText = roomNames.length === 1
                    ? `🎯 SPECIFIC WORK AREA — ROOM ${roomNames[0]}`
                    : `🎯 SPECIFIC WORK AREA — SELECTED ROOMS DETAIL (${roomNames.length} ROOMS)`;
                mCtx.fillText(workAreaText, 16, splitY + SUBHEADER_H / 2);

                const rTargetX = 14;
                const rTargetY = splitY + SUBHEADER_H + 6;
                const rTargetW = MASTER_W - 28;
                const rTargetH = row2H - SUBHEADER_H - 12;
                drawContained(mCtx, roomDrawingCanvas, cropRect.x, cropRect.y, cropRect.w, cropRect.h, rTargetX, rTargetY, rTargetW, rTargetH);
            }
        } else {
            // ── FULL WIDTH OVERVIEW ──
            const SUBHEADER_H = 32;
            mCtx.fillStyle = "#f8fafc";
            mCtx.fillRect(0, contentY, MASTER_W, SUBHEADER_H);
            mCtx.fillStyle = "#334155";
            mCtx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
            mCtx.textBaseline = "middle";

            let subheaderTitle = "BUILDING FLOOR PLAN OVERVIEW";
            if (activeZones.length === 1) {
                subheaderTitle += ` — ${activeZones[0].name || "ZONE AREA"}`;
            } else if (activeZones.length > 1) {
                const zNames = activeZones.map((z) => z.name).filter(Boolean).join(", ");
                subheaderTitle += ` — SELECTED ZONES (${zNames})`;
                if (mCtx.measureText(subheaderTitle).width > MASTER_W - 32) {
                    subheaderTitle = `BUILDING FLOOR PLAN OVERVIEW — ${activeZones.length} SELECTED ZONES`;
                }
            }
            mCtx.fillText(subheaderTitle, 16, contentY + SUBHEADER_H / 2);

            const oTargetX = 16;
            const oTargetY = contentY + SUBHEADER_H + 6;
            const oTargetW = MASTER_W - 32;
            const oTargetH = contentH - SUBHEADER_H - 12;
            drawContained(mCtx, overviewCanvas, 0, 0, overviewCanvas.width, overviewCanvas.height, oTargetX, oTargetY, oTargetW, oTargetH);
        }

        // Outer border
        mCtx.strokeStyle = "#cbd5e1";
        mCtx.lineWidth = 2;
        mCtx.strokeRect(1, 1, MASTER_W - 2, MASTER_H - 2);

        return masterCanvas.toDataURL("image/jpeg", 0.92);
    } catch (err) {
        console.error("Failed to generate location map snapshot:", err);
        return null;
    }
}

/**
 * Utility to draw source canvas into target rectangle with object-fit: contain
 */
function drawContained(ctx, srcCanvas, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (!sw || !sh || !dw || !dh) return;
    const srcAspect = sw / sh;
    const destAspect = dw / dh;

    let targetW = dw;
    let targetH = dh;
    let targetX = dx;
    let targetY = dy;

    if (srcAspect > destAspect) {
        targetH = dw / srcAspect;
        targetY = dy + (dh - targetH) / 2;
    } else {
        targetW = dh * srcAspect;
        targetX = dx + (dw - targetW) / 2;
    }

    ctx.drawImage(srcCanvas, sx, sy, sw, sh, targetX, targetY, targetW, targetH);
}
