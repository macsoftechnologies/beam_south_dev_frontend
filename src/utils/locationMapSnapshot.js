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

        // 2. Identify the active zone that contains these room(s)
        let activeZone = null;
        if (roomNames.length > 0 && Array.isArray(zones)) {
            activeZone = zones.find((z) =>
                z.rooms && z.rooms.some((r) => {
                    const rName = (typeof r === "object" ? r.name : r || "").trim().toLowerCase();
                    return roomNames.some((rn) => rn.toLowerCase() === rName);
                })
            );
        }

        // Fallback: match by zone token or first zone
        if (!activeZone && Array.isArray(zones) && zones.length > 0) {
            const zoneToken = (selectedRooms || []).find((r) => typeof r === "string" && r.includes(":::"));
            if (zoneToken) {
                const parts = zoneToken.split(":::");
                const zName = parts.length > 1 ? parts[parts.length - 2].trim().toLowerCase() : "";
                activeZone = zones.find((z) => z.name && z.name.trim().toLowerCase() === zName);
            }
            if (!activeZone && zones.length === 1) {
                activeZone = zones[0];
            }
        }

        // 3. Render Level Overview PDF at high resolution (1200px width)
        const overviewPdfCanvas = await renderPdf(levelPdf, 1200);
        const overviewCanvas = document.createElement("canvas");
        overviewCanvas.width = overviewPdfCanvas.width;
        overviewCanvas.height = overviewPdfCanvas.height;
        const oCtx = overviewCanvas.getContext("2d");
        oCtx.drawImage(overviewPdfCanvas, 0, 0);

        // Highlight zones on the overview canvas
        (zones || []).forEach((z) => {
            if (!z.points || z.points.length < 3) return;
            const isMatch = activeZone && (z.id === activeZone.id || z.name === activeZone.name);
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

        // 4. If room(s) are selected and activeZone has a separate zone.pdf:
        let roomDrawingCanvas = null;
        let cropRect = null;
        const matchedRoomObjs = (activeZone?.rooms || []).filter((r) => {
            const rName = (typeof r === "object" ? r.name : r || "").trim().toLowerCase();
            return roomNames.some((rn) => rn.toLowerCase() === rName);
        });

        if (activeZone?.pdf && matchedRoomObjs.length > 0) {
            try {
                // Render Zone CAD PDF at high resolution (1400px width)
                const zonePdfCanvas = await renderPdf(activeZone.pdf, 1400);
                roomDrawingCanvas = document.createElement("canvas");
                roomDrawingCanvas.width = zonePdfCanvas.width;
                roomDrawingCanvas.height = zonePdfCanvas.height;
                const rCtx = roomDrawingCanvas.getContext("2d");
                rCtx.drawImage(zonePdfCanvas, 0, 0);

                // Draw unselected rooms softly
                (activeZone.rooms || []).forEach((r) => {
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

        // 5. Create Master Canvas
        const MASTER_W = 1600;
        const MASTER_H = 720;
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
        const locParts = [buildingName, level, activeZone?.name].filter(Boolean);
        const locTitle = locParts.length > 0 ? locParts.join(" • ") : "Floor Plan Location";
        const roomTitle = roomNames.length > 0 ? ` • Room(s): ${roomNames.join(", ")}` : "";
        mCtx.fillText(`📍 Location: ${locTitle}${roomTitle}`, 16, HEADER_H / 2);

        mCtx.fillStyle = "#94a3b8";
        mCtx.font = "500 13px -apple-system, BlinkMacSystemFont, sans-serif";
        mCtx.textAlign = "right";
        mCtx.fillText("Verified High-Resolution CAD Map", MASTER_W - 16, HEADER_H / 2);
        mCtx.textAlign = "left";

        const contentY = HEADER_H;
        const contentH = MASTER_H - HEADER_H;

        if (roomDrawingCanvas && cropRect) {
            // ── 2-PANEL COMPOSITE ──
            // Left Panel: Overview (38% width)
            // Right Panel: Specific Work Area Room Detail (62% width)
            const splitX = Math.round(MASTER_W * 0.38);

            // Left sub-header
            mCtx.fillStyle = "#f8fafc";
            mCtx.fillRect(0, contentY, splitX, 30);
            mCtx.fillStyle = "#334155";
            mCtx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
            mCtx.fillText(`BUILDING OVERVIEW — ${activeZone ? activeZone.name : "ZONE"}`, 16, contentY + 15);

            // Draw Overview fitted into Left Panel
            const oTargetX = 12;
            const oTargetY = contentY + 34;
            const oTargetW = splitX - 24;
            const oTargetH = contentH - 44;
            drawContained(mCtx, overviewCanvas, 0, 0, overviewCanvas.width, overviewCanvas.height, oTargetX, oTargetY, oTargetW, oTargetH);

            // Vertical divider line
            mCtx.strokeStyle = "#cbd5e1";
            mCtx.lineWidth = 1.5;
            mCtx.beginPath();
            mCtx.moveTo(splitX, contentY);
            mCtx.lineTo(splitX, MASTER_H);
            mCtx.stroke();

            // Right sub-header
            mCtx.fillStyle = "#f8fafc";
            mCtx.fillRect(splitX, contentY, MASTER_W - splitX, 30);
            mCtx.fillStyle = "#15803d";
            mCtx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
            mCtx.fillText(`🎯 SPECIFIC WORK AREA — ROOM ${roomNames.join(", ")}`, splitX + 16, contentY + 15);

            // Draw Room Drawing fitted into Right Panel
            const rTargetX = splitX + 12;
            const rTargetY = contentY + 34;
            const rTargetW = (MASTER_W - splitX) - 24;
            const rTargetH = contentH - 44;
            drawContained(mCtx, roomDrawingCanvas, cropRect.x, cropRect.y, cropRect.w, cropRect.h, rTargetX, rTargetY, rTargetW, rTargetH);
        } else {
            // ── FULL WIDTH OVERVIEW ──
            // Sub-header
            mCtx.fillStyle = "#f8fafc";
            mCtx.fillRect(0, contentY, MASTER_W, 30);
            mCtx.fillStyle = "#334155";
            mCtx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
            mCtx.fillText(`BUILDING FLOOR PLAN OVERVIEW — ${activeZone ? activeZone.name : "ZONE AREA"}`, 16, contentY + 15);

            const oTargetX = 16;
            const oTargetY = contentY + 36;
            const oTargetW = MASTER_W - 32;
            const oTargetH = contentH - 48;
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
