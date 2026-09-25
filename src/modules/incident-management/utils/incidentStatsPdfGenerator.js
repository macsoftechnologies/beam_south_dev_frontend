import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import nneLogoImg from "../../../assets/images/nne_logo.png";
import projectLogoImg from "../../../assets/images/Logo.jpeg";

/**
 * Converts a hex color to rgba string for mini tile backgrounds and borders.
 */
function hexToRgba(hex, a) {
  if (!hex) return `rgba(161,165,179,${a})`;
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * Preloads and converts an image URL into a base64 data URL via canvas.
 */
function loadBase64Image(url) {
  return new Promise((resolve) => {
    if (!url) return resolve("");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

/**
 * Generates the SVG string for the humanoid body figure (Front & Back view)
 * matching BodyMap.jsx exactly.
 */
function renderBodyMapSvg(data = [], view = "front", width = 85, height = 175) {
  const getCount = (partNames) => {
    if (!Array.isArray(partNames)) partNames = [partNames];
    let count = 0;
    if (!data || !Array.isArray(data)) return 0;

    partNames.forEach((name) => {
      const lowerName = name.toLowerCase();
      data.forEach((d) => {
        if (!d || !d.part) return;
        const dPart = String(d.part).toLowerCase();
        if (dPart === lowerName || dPart.includes(lowerName) || lowerName.includes(dPart)) {
          count += d.count || 0;
        }
      });
    });
    return count;
  };

  const getColor = (count) => {
    if (count >= 5) return "#E32B50"; // High - Red
    if (count >= 3) return "#C07D10"; // Medium - Orange
    if (count >= 1) return "#7BBE97"; // Low - Green
    return "#b4c6e7"; // Neutral default
  };

  const c = (names) => getColor(getCount(names));
  const isBack = view === "back";

  if (!isBack) {
    const headCol = c(["Head", "Cranium"]);
    const facialCnt = getCount(["Facial area", "Teeth", "Eye", "Face"]);
    const facialCol = facialCnt > 0 ? getColor(facialCnt) : "#ffffff";
    const neckCol = c(["Neck"]);
    const rShoulderCol = c(["R. Shoulder", "Shoulder (R)", "Shoulder, Right", "Right Shoulder"]);
    const lShoulderCol = c(["L. Shoulder", "Shoulder (L)", "Shoulder, Left", "Left Shoulder"]);
    const chestCol = c(["Chest", "Ribs", "Torso"]);
    const abdomenCol = c(["Lower Abdomen", "Abdomen", "Pelvis", "Pelvis or abdomen"]);
    const rArmCol = c(["R. Forearm", "R. Arm", "Right Arm", "Arm, Elbow (R)", "R. Upper Arm"]);
    const lArmCol = c(["L. Forearm", "L. Arm", "Left Arm", "Arm, Elbow (L)", "L. Upper Arm"]);
    const rWristCol = c(["R. Wrist", "Wrist (R)", "R. Hand", "Right Hand"]);
    const lWristCol = c(["L. Wrist", "Wrist (L)", "L. Hand", "Left Hand"]);
    const rHandCol = c(["R. Hand", "Right Hand", "Hand (R)", "Finger(s) (R)", "Finger (R)"]);
    const lHandCol = c(["L. Hand", "Left Hand", "Hand (L)", "Finger(s) (L)", "Finger (L)"]);
    const rLegCol = c(["R. Thigh", "R. Leg", "Right Leg", "Legs, Knee (R)"]);
    const lLegCol = c(["L. Thigh", "L. Leg", "Left Leg", "Legs, Knee (L)"]);
    const rKneeCol = c(["R. Knee", "Knee (R)", "Legs, Knee (R)"]);
    const lKneeCol = c(["L. Knee", "Knee (L)", "Legs, Knee (L)"]);
    const rCalfCol = c(["R. Calf", "R. Lower Leg", "Legs, Knee (R)"]);
    const lCalfCol = c(["L. Calf", "L. Lower Leg", "Legs, Knee (L)"]);
    const rAnkleCol = c(["R. Ankle", "Ankle (R)", "R. Foot", "Right Foot"]);
    const lAnkleCol = c(["L. Ankle", "Ankle (L)", "L. Foot", "Left Foot"]);
    const rFootCol = c(["R. Foot", "Right Foot", "Foot (R)", "Toe(s) (R)", "Toe (R)"]);
    const lFootCol = c(["L. Foot", "Left Foot", "Foot (L)", "Toe(s) (L)", "Toe (L)"]);

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 140 280">
        <circle cx="70" cy="24" r="16" fill="${headCol}" stroke="#ffffff" stroke-width="2" />
        <circle cx="70" cy="24" r="9" fill="${facialCol}" stroke="#ffffff" stroke-width="1" />
        <rect x="61" y="42" width="18" height="9" rx="3" fill="${neckCol}" stroke="#ffffff" stroke-width="2" />
        <circle cx="42" cy="59" r="8" fill="${rShoulderCol}" stroke="#ffffff" stroke-width="2" />
        <circle cx="98" cy="59" r="8" fill="${lShoulderCol}" stroke="#ffffff" stroke-width="2" />
        <rect x="52" y="53" width="36" height="26" rx="4" fill="${chestCol}" stroke="#ffffff" stroke-width="2" />
        <rect x="54" y="81" width="32" height="18" rx="3" fill="${abdomenCol}" stroke="#ffffff" stroke-width="2" />
        <rect x="52" y="101" width="36" height="24" rx="4" fill="${abdomenCol}" stroke="#ffffff" stroke-width="2" />
        <rect x="36" y="69" width="12" height="38" rx="5" fill="${rArmCol}" stroke="#ffffff" stroke-width="2" />
        <rect x="92" y="69" width="12" height="38" rx="5" fill="${lArmCol}" stroke="#ffffff" stroke-width="2" />
        <circle cx="36" cy="112" r="5" fill="${rWristCol}" stroke="#ffffff" stroke-width="2" />
        <circle cx="104" cy="112" r="5" fill="${lWristCol}" stroke="#ffffff" stroke-width="2" />
        <rect x="30" y="119" width="12" height="18" rx="6" fill="${rHandCol}" stroke="#ffffff" stroke-width="2" />
        <rect x="98" y="119" width="12" height="18" rx="6" fill="${lHandCol}" stroke="#ffffff" stroke-width="2" />
        <rect x="52" y="127" width="14" height="48" rx="6" fill="${rLegCol}" stroke="#ffffff" stroke-width="2" />
        <rect x="74" y="127" width="14" height="48" rx="6" fill="${lLegCol}" stroke="#ffffff" stroke-width="2" />
        <circle cx="59" cy="179" r="5" fill="${rKneeCol}" stroke="#ffffff" stroke-width="2" />
        <circle cx="81" cy="179" r="5" fill="${lKneeCol}" stroke="#ffffff" stroke-width="2" />
        <rect x="53" y="186" width="12" height="44" rx="5" fill="${rCalfCol}" stroke="#ffffff" stroke-width="2" />
        <rect x="75" y="186" width="12" height="44" rx="5" fill="${lCalfCol}" stroke="#ffffff" stroke-width="2" />
        <circle cx="59" cy="234" r="4" fill="${rAnkleCol}" stroke="#ffffff" stroke-width="2" />
        <circle cx="81" cy="234" r="4" fill="${lAnkleCol}" stroke="#ffffff" stroke-width="2" />
        <ellipse cx="53" cy="244" rx="10" ry="5" fill="${rFootCol}" stroke="#ffffff" stroke-width="2" />
        <ellipse cx="87" cy="244" rx="10" ry="5" fill="${lFootCol}" stroke="#ffffff" stroke-width="2" />
      </svg>
    `;
  }

  // Back View
  const headCol = c(["Head", "Cranium"]);
  const lEarCnt = getCount(["Ear (L)", "Ear", "L. Ear"]);
  const lEarCol = lEarCnt > 0 ? getColor(lEarCnt) : "#ffffff";
  const rEarCnt = getCount(["Ear (R)", "Ear", "R. Ear"]);
  const rEarCol = rEarCnt > 0 ? getColor(rEarCnt) : "#ffffff";
  const neckCol = c(["Neck"]);
  const lShoulderCol = c(["L. Shoulder", "Shoulder (L)", "Shoulder, Left", "Left Shoulder"]);
  const rShoulderCol = c(["R. Shoulder", "Shoulder (R)", "Shoulder, Right", "Right Shoulder"]);
  const upperBackCol = c(["Upper Back", "Back incl. spine", "Back", "Spine"]);
  const lowerBackCol = c(["Lower Back", "Back incl. spine", "Back", "Spine"]);
  const lArmCol = c(["L. Forearm", "L. Arm", "Left Arm", "Arm, Elbow (L)", "L. Upper Arm"]);
  const rArmCol = c(["R. Forearm", "R. Arm", "Right Arm", "Arm, Elbow (R)", "R. Upper Arm"]);
  const lWristCol = c(["L. Wrist", "Wrist (L)", "L. Hand", "Left Hand"]);
  const rWristCol = c(["R. Wrist", "Wrist (R)", "R. Hand", "Right Hand"]);
  const lHandCol = c(["L. Hand", "Left Hand", "Hand (L)", "Finger(s) (L)", "Finger (L)"]);
  const rHandCol = c(["R. Hand", "Right Hand", "Hand (R)", "Finger(s) (R)", "Finger (R)"]);
  const lLegCol = c(["L. Thigh", "L. Leg", "Left Leg", "Legs, Knee (L)"]);
  const rLegCol = c(["R. Thigh", "R. Leg", "Right Leg", "Legs, Knee (R)"]);
  const lKneeCol = c(["L. Knee", "Knee (L)", "Legs, Knee (L)"]);
  const rKneeCol = c(["R. Knee", "Knee (R)", "Legs, Knee (R)"]);
  const lCalfCol = c(["L. Calf", "L. Lower Leg", "Legs, Knee (L)"]);
  const rCalfCol = c(["R. Calf", "R. Lower Leg", "Legs, Knee (R)"]);
  const lAnkleCol = c(["L. Ankle", "Ankle (L)", "L. Foot", "Left Foot"]);
  const rAnkleCol = c(["R. Ankle", "Ankle (R)", "R. Foot", "Right Foot"]);
  const lFootCol = c(["L. Foot", "Left Foot", "Foot (L)", "Toe(s) (L)", "Toe (L)"]);
  const rFootCol = c(["R. Foot", "Right Foot", "Foot (R)", "Toe(s) (R)", "Toe (R)"]);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 140 280">
      <circle cx="70" cy="24" r="16" fill="${headCol}" stroke="#ffffff" stroke-width="2" />
      <circle cx="52" cy="24" r="4" fill="${lEarCol}" stroke="#ffffff" stroke-width="1.5" />
      <circle cx="88" cy="24" r="4" fill="${rEarCol}" stroke="#ffffff" stroke-width="1.5" />
      <rect x="61" y="42" width="18" height="9" rx="3" fill="${neckCol}" stroke="#ffffff" stroke-width="2" />
      <circle cx="42" cy="59" r="8" fill="${lShoulderCol}" stroke="#ffffff" stroke-width="2" />
      <circle cx="98" cy="59" r="8" fill="${rShoulderCol}" stroke="#ffffff" stroke-width="2" />
      <rect x="52" y="53" width="36" height="46" rx="4" fill="${upperBackCol}" stroke="#ffffff" stroke-width="2" />
      <rect x="52" y="101" width="36" height="24" rx="4" fill="${lowerBackCol}" stroke="#ffffff" stroke-width="2" />
      <rect x="36" y="69" width="12" height="38" rx="5" fill="${lArmCol}" stroke="#ffffff" stroke-width="2" />
      <rect x="92" y="69" width="12" height="38" rx="5" fill="${rArmCol}" stroke="#ffffff" stroke-width="2" />
      <circle cx="36" cy="112" r="5" fill="${lWristCol}" stroke="#ffffff" stroke-width="2" />
      <circle cx="104" cy="112" r="5" fill="${rWristCol}" stroke="#ffffff" stroke-width="2" />
      <circle cx="30" cy="125" r="9" fill="${lHandCol}" stroke="#ffffff" stroke-width="2" />
      <circle cx="110" cy="125" r="9" fill="${rHandCol}" stroke="#ffffff" stroke-width="2" />
      <rect x="52" y="127" width="14" height="48" rx="6" fill="${lLegCol}" stroke="#ffffff" stroke-width="2" />
      <rect x="74" y="127" width="14" height="48" rx="6" fill="${rLegCol}" stroke="#ffffff" stroke-width="2" />
      <circle cx="59" cy="179" r="5" fill="${lKneeCol}" stroke="#ffffff" stroke-width="2" />
      <circle cx="81" cy="179" r="5" fill="${rKneeCol}" stroke="#ffffff" stroke-width="2" />
      <rect x="53" y="186" width="12" height="44" rx="5" fill="${lCalfCol}" stroke="#ffffff" stroke-width="2" />
      <rect x="75" y="186" width="12" height="44" rx="5" fill="${rCalfCol}" stroke="#ffffff" stroke-width="2" />
      <circle cx="59" cy="234" r="4" fill="${lAnkleCol}" stroke="#ffffff" stroke-width="2" />
      <circle cx="81" cy="234" r="4" fill="${rAnkleCol}" stroke="#ffffff" stroke-width="2" />
      <ellipse cx="53" cy="244" rx="10" ry="5" fill="${lFootCol}" stroke="#ffffff" stroke-width="2" />
      <ellipse cx="87" cy="244" rx="10" ry="5" fill="${rFootCol}" stroke="#ffffff" stroke-width="2" />
    </svg>
  `;
}

/**
 * Generates and downloads a clean, unhurried, executive 2-Page PDF report:
 * - Page 1: Executive KPI Overview, Investigation Pipeline, Incident Types & Severity Classification.
 * - Page 2: Dedicated Body Parts & Injury Analysis with full-size humanoid figures and summary cards.
 * - Top logos are swapped (Project Logo on Left, NNE Logo on Right).
 */
export async function generateIncidentStatsPdf({
  agg,
  filters = {},
  bodyParts = {},
  currentUser = {}
}) {
  const [projectLogo, nneLogo] = await Promise.all([
    loadBase64Image(projectLogoImg),
    loadBase64Image(nneLogoImg)
  ]);

  const rangeLabels = {
    all: "All Time",
    week: "This Week",
    "30d": "Last 30 Days",
    "90d": "Last 90 Days",
    year: "This Year",
    "13m": "Last 13 Months",
    custom: "Custom Range"
  };

  const selectedRangeName = rangeLabels[filters.selectedDateRange] || "Last 13 Months";
  const dateFrom = filters.startDate || "—";
  const dateTo = filters.endDate || "—";
  const buildingName = Array.isArray(filters.selectedBuildings) && filters.selectedBuildings.length > 0
    ? filters.selectedBuildings.join(", ")
    : (filters.selectedBuilding || "All Buildings");
  const contractorName = Array.isArray(filters.selectedContractors) && filters.selectedContractors.length > 0
    ? filters.selectedContractors.join(", ")
    : (filters.selectedContractor || "All Contractors");
  const generatedDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const generatedBy = currentUser?.name || currentUser?.username || currentUser?.email || "Superadmin";

  const total = agg?.total || 0;
  const active = agg?.active || 0;
  const needsAction = agg?.needsAction || 0;
  const closed = agg?.closed || 0;

  const pipeline = agg?.pipeline || [
    { label: "Heads-Up", count: 0, color: "#C07D10" },
    { label: "Initial", count: 0, color: "#E32B50" },
    { label: "Investigation", count: 0, color: "#131E40" },
    { label: "Closed", count: 0, color: "#A1A5B3" }
  ];

  const types = agg?.types || [];
  const maxType = Math.max(...types.map((t) => t.count), 1);
  const totalTypeCount = agg?.typesTotal || types.reduce((acc, curr) => acc + (curr.count || 0), 0) || total || 1;

  const severity = agg?.severity || [
    { level: "CRITICAL", count: 0, color: "#8F1B32" },
    { level: "HIGH", count: 0, color: "#E32B50" },
    { level: "MEDIUM", count: 0, color: "#C07D10" },
    { level: "LOW", count: 0, color: "#7BBE97" }
  ];

  const frontParts = bodyParts?.frontParts || [];
  const backParts = bodyParts?.backParts || [];
  const maxB = Math.max(...frontParts.map((x) => x.count), ...backParts.map((x) => x.count), 6);
  const bpSummary = bodyParts?.bodyPartsSummary || { totalPartsCount: 0, highCount: 0, medCount: 0, lowCount: 0 };

  // Common Header Generator: Project Logo on LEFT, NNE Logo on RIGHT (swapped as requested)
  const renderHeader = (subtitle) => `
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 22%; vertical-align: middle; text-align: left; padding-bottom: 14px;">
          ${projectLogo ? `<img src="${projectLogo}" style="height: 40px; max-width: 140px; object-fit: contain; display: block;" alt="Project Logo" />` : ""}
        </td>
        <td style="width: 56%; text-align: center; vertical-align: middle; padding-bottom: 14px;">
          <div style="font-size: 18px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 4px;">
            Incident Analytics &amp; Statistics
          </div>
          <div style="font-size: 11.5px; color: #64748B; font-weight: 600;">
            ${subtitle}
          </div>
        </td>
        <td style="width: 22%; text-align: right; vertical-align: middle; padding-bottom: 14px;">
          ${nneLogo ? `<img src="${nneLogo}" style="height: 40px; max-width: 140px; object-fit: contain; display: inline-block;" alt="NNE Logo" />` : ""}
        </td>
      </tr>
    </table>
    <div style="width: 100%; height: 2px; background: #0F172A; margin-top: 2px; margin-bottom: 20px;"></div>
  `;

  // Common Filter / Metadata Bar
  const renderFilterBar = () => `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
      <tr>
        <td style="padding: 10px 14px; font-size: 11px; color: #475569; width: 68%;">
          <span style="display: inline-block; margin-right: 14px;"><b>Building:</b> <span style="color: #0F172A;">${buildingName}</span></span>
          <span style="display: inline-block; margin-right: 14px;"><b>Contractor:</b> <span style="color: #0F172A;">${contractorName}</span></span>
          <span style="display: inline-block; margin-right: 14px;"><b>Range:</b> <span style="color: #0F172A;">${selectedRangeName}</span></span>
          <span style="display: inline-block;"><b>Dates:</b> <span style="color: #0F172A;">${dateFrom} &rarr; ${dateTo}</span></span>
        </td>
        <td style="padding: 10px 14px; font-size: 10px; color: #64748B; text-align: right; width: 32%;">
          <b>Generated:</b> ${generatedDate} | <b>By:</b> ${generatedBy}
        </td>
      </tr>
    </table>
  `;

  // Common Footer Generator
  const renderFooter = (pageNo, totalPages = 2) => `
    <div style="position: absolute; bottom: 22px; left: 32px; right: 32px; border-top: 1px solid #CBD5E1; padding-top: 10px; font-size: 10px; color: #94A3B8; display: flex; justify-content: space-between;">
      <span>Beam 2.0 &bull; Incident Management Analytics</span>
      <span>Page ${pageNo} of ${totalPages} &bull; Confidential &bull; Internal Site Safety Report</span>
    </div>
  `;

  /* ═══════════════════════════════════════════
     PAGE 1: OVERVIEW, PIPELINE, TYPES & SEVERITY
     ═══════════════════════════════════════════ */
  const page1 = document.createElement("div");
  page1.style.width = "794px";
  page1.style.height = "1123px";
  page1.style.background = "#FFFFFF";
  page1.style.color = "#0F172A";
  page1.style.padding = "28px 32px";
  page1.style.boxSizing = "border-box";
  page1.style.position = "relative";
  page1.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  page1.innerHTML = `
    ${renderHeader("Executive Operational Summary &bull; Pipeline &amp; Classification")}
    ${renderFilterBar()}

    <!-- 4 KPI Cards -->
    <table style="width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-left: -12px; width: calc(100% + 24px); margin-bottom: 22px;">
      <tr>
        <!-- Total Incidents -->
        <td style="width: 25%; background: #FFFFFF; border: 1px solid #E2E8F0; border-left: 5px solid #131E40; border-radius: 8px; padding: 14px 16px; vertical-align: top; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            Total Incidents
          </div>
          <div style="font-size: 28px; font-weight: 800; color: #0F172A; line-height: 1; margin-bottom: 5px;">
            ${total}
          </div>
          <div style="font-size: 11px; color: #64748B;">
            ${active} active
          </div>
        </td>

        <!-- Active -->
        <td style="width: 25%; background: #FFFFFF; border: 1px solid #E2E8F0; border-left: 5px solid #E32B50; border-radius: 8px; padding: 14px 16px; vertical-align: top; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            Active
          </div>
          <div style="font-size: 28px; font-weight: 800; color: #E32B50; line-height: 1; margin-bottom: 5px;">
            ${active}
          </div>
          <div style="font-size: 11px; color: #E32B50;">
            in progress
          </div>
        </td>

        <!-- Needs Action -->
        <td style="width: 25%; background: #FFFFFF; border: 1px solid #E2E8F0; border-left: 5px solid #C07D10; border-radius: 8px; padding: 14px 16px; vertical-align: top; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            Needs Action
          </div>
          <div style="font-size: 28px; font-weight: 800; color: #C07D10; line-height: 1; margin-bottom: 5px;">
            ${needsAction}
          </div>
          <div style="font-size: 11px; color: #C07D10;">
            open items
          </div>
        </td>

        <!-- Closed -->
        <td style="width: 25%; background: #FFFFFF; border: 1px solid #E2E8F0; border-left: 5px solid #7BBE97; border-radius: 8px; padding: 14px 16px; vertical-align: top; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            Closed
          </div>
          <div style="font-size: 28px; font-weight: 800; color: #7BBE97; line-height: 1; margin-bottom: 5px;">
            ${closed}
          </div>
          <div style="font-size: 11px; color: #7BBE97;">
            resolved
          </div>
        </td>
      </tr>
    </table>

    <!-- Investigation Pipeline Stages -->
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px; margin-bottom: 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
      <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 12px; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px;">
        Investigation Pipeline
        <span style="font-size: 11px; font-weight: 600; color: #64748B; float: right;">${total} total across stages</span>
      </div>
      <table style="width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-left: -12px; width: calc(100% + 24px);">
        <tr>
          ${pipeline.map((p) => {
            const dotColor = p.color || (p.label === 'Heads-Up' ? '#C07D10' : p.label === 'Initial' ? '#E32B50' : p.label === 'Investigation' ? '#131E40' : '#A1A5B3');
            return `
              <td style="width: 25%; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; text-align: center;">
                <div style="font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 5px;">
                  <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: ${dotColor}; margin-right: 6px; vertical-align: middle;"></span>
                  ${p.label}
                </div>
                <div style="font-size: 24px; font-weight: 800; color: #0F172A; line-height: 1;">
                  ${p.count}
                </div>
              </td>
            `;
          }).join("")}
        </tr>
      </table>
    </div>

    <!-- 2-Column Split: Incident Types & Severity Breakdown -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <!-- Incident Types -->
        <td style="width: 52%; vertical-align: top; padding-right: 10px;">
          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px; box-sizing: border-box; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
            <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 12px; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px;">
              Incident Types
              <span style="font-size: 10.5px; font-weight: 700; background: #F1F5F9; color: #0F172A; padding: 3px 8px; border-radius: 12px; float: right;">
                ${totalTypeCount} total
              </span>
            </div>
            ${types.length === 0 ? '<div style="color: #94A3B8; font-size: 11px; padding: 12px 0;">No incident types recorded.</div>' : types.map((t) => {
              const barWidth = Math.max(Math.round((t.count / maxType) * 100), 4);
              const color = t.color || '#131E40';
              return `
                <div style="margin-bottom: 9px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 11px; font-weight: 600; margin-bottom: 3px;">
                    <tr>
                      <td style="color: #0F172A; text-align: left;">
                        <span style="display: inline-block; width: 9px; height: 9px; border-radius: 2px; background: ${color}; margin-right: 6px; vertical-align: middle;"></span>
                        ${t.type}
                      </td>
                      <td style="text-align: right; color: #0F172A; font-weight: 800; white-space: nowrap;">
                        ${t.count}
                      </td>
                    </tr>
                  </table>
                  <div style="height: 7px; background: #F1F5F9; border-radius: 3.5px; overflow: hidden;">
                    <div style="height: 100%; width: ${barWidth}%; background: ${color}; border-radius: 3.5px;"></div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </td>

        <!-- Severity Breakdown (2x2 Mini Tiles) -->
        <td style="width: 48%; vertical-align: top; padding-left: 10px;">
          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px; box-sizing: border-box; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
            <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 12px; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px;">
              Severity Breakdown
              <span style="font-size: 11px; font-weight: 600; color: #64748B; float: right;">Classification</span>
            </div>
            
            <table style="width: 100%; border-collapse: separate; border-spacing: 10px 10px; margin-left: -10px; width: calc(100% + 20px);">
              <tr>
                ${severity.slice(0, 2).map((s) => `
                  <td style="width: 50%; background: ${hexToRgba(s.color, 0.08)}; border: 1px solid ${hexToRgba(s.color, 0.35)}; border-radius: 8px; padding: 14px 16px; text-align: left; vertical-align: middle;">
                    <div style="font-size: 10px; font-weight: 800; color: ${s.color}; text-transform: uppercase; letter-spacing: 0.05em;">
                      ${s.level}
                    </div>
                    <div style="font-size: 26px; font-weight: 800; color: ${s.color}; margin-top: 4px; line-height: 1;">
                      ${s.count}
                    </div>
                  </td>
                `).join("")}
              </tr>
              <tr>
                ${severity.slice(2, 4).map((s) => `
                  <td style="width: 50%; background: ${hexToRgba(s.color, 0.08)}; border: 1px solid ${hexToRgba(s.color, 0.35)}; border-radius: 8px; padding: 14px 16px; text-align: left; vertical-align: middle;">
                    <div style="font-size: 10px; font-weight: 800; color: ${s.color}; text-transform: uppercase; letter-spacing: 0.05em;">
                      ${s.level}
                    </div>
                    <div style="font-size: 26px; font-weight: 800; color: ${s.color}; margin-top: 4px; line-height: 1;">
                      ${s.count}
                    </div>
                  </td>
                `).join("")}
              </tr>
            </table>

            <!-- Supplementary Severity Proportions -->
            <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #F1F5F9;">
              ${severity.map((s) => {
                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                return `
                  <div style="display: flex; justify-content: space-between; font-size: 10.5px; margin-bottom: 5px; color: #475569;">
                    <span><span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${s.color}; margin-right: 6px;"></span>${s.level}</span>
                    <span style="font-weight: 700; color: ${s.color};">${s.count} (${pct}%)</span>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        </td>
      </tr>
    </table>

    ${renderFooter(1, 2)}
  `;

  /* ═══════════════════════════════════════════
     PAGE 2: DEDICATED BODY PARTS & INJURY ANALYSIS
     ═══════════════════════════════════════════ */
  const page2 = document.createElement("div");
  page2.style.width = "794px";
  page2.style.height = "1123px";
  page2.style.background = "#FFFFFF";
  page2.style.color = "#0F172A";
  page2.style.padding = "28px 32px";
  page2.style.boxSizing = "border-box";
  page2.style.position = "relative";
  page2.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  page2.innerHTML = `
    ${renderHeader("Body Parts &bull; Injury Location &amp; Severity Analysis")}
    ${renderFilterBar()}

    <!-- Main Body Parts Panel -->
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px 22px; margin-bottom: 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
      <!-- Body Parts Header -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; border-bottom: 1px solid #F1F5F9; padding-bottom: 12px;">
        <tr>
          <td style="vertical-align: middle; text-align: left;">
            <div style="font-size: 15px; font-weight: 700; color: #0F172A; display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 26px; height: 26px; border-radius: 6px; background: rgba(59, 130, 246, 0.1); color: #3B82F6; text-align: center; line-height: 26px; font-size: 14px; font-weight: bold;">&bull;</span>
              Body Parts &ndash; Incident Summary
            </div>
            <div style="font-size: 11px; color: #64748B; margin-top: 3px;">
              Overview of affected body parts (Front &amp; Back View Analysis)
            </div>
          </td>
          <td style="vertical-align: middle; text-align: right;">
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 10px; color: #64748B;">
              <span>Fewer</span>
              <span style="display: inline-block; width: 90px; height: 6px; border-radius: 3px; background: linear-gradient(to right, #7BBE97, #E6B54A, #E32B50);"></span>
              <span>More</span>
            </div>
          </td>
        </tr>
      </table>

      <!-- Front View & Back View Cards with Humanoid Figures -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <!-- Front View Card -->
          <td style="width: 50%; vertical-align: top; padding-right: 8px;">
            <div style="border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; background: #FFFFFF; box-sizing: border-box;">
              <div style="font-size: 12.5px; font-weight: 700; color: #3B82F6; margin-bottom: 12px;">
                Front View
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <!-- Left: Humanoid Body Map SVG -->
                  <td style="width: 90px; vertical-align: top; text-align: center; padding-right: 12px;">
                    ${renderBodyMapSvg(frontParts, "front", 85, 175)}
                  </td>
                  <!-- Right: Ranked Injury List -->
                  <td style="vertical-align: top;">
                    ${frontParts.length === 0 ? '<div style="color: #94A3B8; font-size: 11px; padding: 12px 0;">No front injuries.</div>' : frontParts.map((b, i) => {
                      const col = b.count >= 5 ? "#E32B50" : b.count >= 3 ? "#C07D10" : "#7BBE97";
                      return `
                        <div style="margin-bottom: 6px;">
                          <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 2px;">
                            <tr>
                              <td style="color: #0F172A; font-weight: 600;">
                                <span style="display: inline-block; width: 16px; height: 16px; line-height: 16px; background: #F1F5F9; color: #64748B; border-radius: 4px; text-align: center; font-size: 9px; font-weight: 700; margin-right: 5px;">${i + 1}</span>
                                ${b.part}
                              </td>
                              <td style="text-align: right; font-weight: 800; color: ${col}; font-size: 11px;">
                                ${b.count}
                              </td>
                            </tr>
                          </table>
                          <div style="height: 5px; background: #F1F5F9; border-radius: 2.5px; overflow: hidden;">
                            <div style="height: 100%; width: ${(b.count / maxB) * 100}%; background: ${col}; border-radius: 2.5px;"></div>
                          </div>
                        </div>
                      `;
                    }).join("")}
                  </td>
                </tr>
              </table>
              <div style="display: flex; gap: 12px; justify-content: center; margin-top: 14px; font-size: 9.5px; color: #475569; font-weight: 600; border-top: 1px solid #F8FAFC; padding-top: 8px;">
                <span><span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#7BBE97; margin-right:3px;"></span> 1 - 2 <span style="color:#64748B; font-weight:400;">Low</span></span>
                <span><span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#C07D10; margin-right:3px;"></span> 3 - 4 <span style="color:#64748B; font-weight:400;">Medium</span></span>
                <span><span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#E32B50; margin-right:3px;"></span> 5+ <span style="color:#64748B; font-weight:400;">High</span></span>
              </div>
            </div>
          </td>

          <!-- Back View Card -->
          <td style="width: 50%; vertical-align: top; padding-left: 8px;">
            <div style="border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; background: #FFFFFF; box-sizing: border-box;">
              <div style="font-size: 12.5px; font-weight: 700; color: #3B82F6; margin-bottom: 12px;">
                Back View
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <!-- Left: Humanoid Body Map SVG -->
                  <td style="width: 90px; vertical-align: top; text-align: center; padding-right: 12px;">
                    ${renderBodyMapSvg(backParts, "back", 85, 175)}
                  </td>
                  <!-- Right: Ranked Injury List -->
                  <td style="vertical-align: top;">
                    ${backParts.length === 0 ? '<div style="color: #94A3B8; font-size: 11px; padding: 12px 0;">No back injuries.</div>' : backParts.map((b, i) => {
                      const col = b.count >= 5 ? "#E32B50" : b.count >= 3 ? "#C07D10" : "#7BBE97";
                      return `
                        <div style="margin-bottom: 6px;">
                          <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 2px;">
                            <tr>
                              <td style="color: #0F172A; font-weight: 600;">
                                <span style="display: inline-block; width: 16px; height: 16px; line-height: 16px; background: #F1F5F9; color: #64748B; border-radius: 4px; text-align: center; font-size: 9px; font-weight: 700; margin-right: 5px;">${i + 1}</span>
                                ${b.part}
                              </td>
                              <td style="text-align: right; font-weight: 800; color: ${col}; font-size: 11px;">
                                ${b.count}
                              </td>
                            </tr>
                          </table>
                          <div style="height: 5px; background: #F1F5F9; border-radius: 2.5px; overflow: hidden;">
                            <div style="height: 100%; width: ${(b.count / maxB) * 100}%; background: ${col}; border-radius: 2.5px;"></div>
                          </div>
                        </div>
                      `;
                    }).join("")}
                  </td>
                </tr>
              </table>
              <div style="display: flex; gap: 12px; justify-content: center; margin-top: 14px; font-size: 9.5px; color: #475569; font-weight: 600; border-top: 1px solid #F8FAFC; padding-top: 8px;">
                <span><span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#7BBE97; margin-right:3px;"></span> 1 - 2 <span style="color:#64748B; font-weight:400;">Low</span></span>
                <span><span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#C07D10; margin-right:3px;"></span> 3 - 4 <span style="color:#64748B; font-weight:400;">Medium</span></span>
                <span><span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#E32B50; margin-right:3px;"></span> 5+ <span style="color:#64748B; font-weight:400;">High</span></span>
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Summary Row (Exact 4 Cards from dashboard at bottom of body parts) -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-left: -12px; width: calc(100% + 24px);">
        <tr>
          <!-- Total Affected Body Parts (Main) -->
          <td style="width: 25%; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; padding: 12px 14px; vertical-align: middle;">
            <div style="font-size: 10px; font-weight: 600; color: #64748B; margin-bottom: 3px;">
              Total Affected Body Parts
            </div>
            <div style="font-size: 24px; font-weight: 800; color: #3B82F6; line-height: 1;">
              ${bpSummary.totalPartsCount || 0}
            </div>
          </td>

          <!-- High Severity -->
          <td style="width: 25%; background: #F9FAFB; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; vertical-align: middle;">
            <div style="font-size: 10px; font-weight: 600; color: #E32B50; margin-bottom: 3px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#E32B50; margin-right:4px;"></span>
              High (5 or more)
            </div>
            <div style="font-size: 24px; font-weight: 800; color: #E32B50; line-height: 1;">
              ${bpSummary.highCount || 0}
            </div>
          </td>

          <!-- Medium Severity -->
          <td style="width: 25%; background: #F9FAFB; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; vertical-align: middle;">
            <div style="font-size: 10px; font-weight: 600; color: #C07D10; margin-bottom: 3px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#C07D10; margin-right:4px;"></span>
              Medium (3 - 4)
            </div>
            <div style="font-size: 24px; font-weight: 800; color: #C07D10; line-height: 1;">
              ${bpSummary.medCount || 0}
            </div>
          </td>

          <!-- Low Severity -->
          <td style="width: 25%; background: #F9FAFB; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; vertical-align: middle;">
            <div style="font-size: 10px; font-weight: 600; color: #7BBE97; margin-bottom: 3px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#7BBE97; margin-right:4px;"></span>
              Low (1 - 2)
            </div>
            <div style="font-size: 24px; font-weight: 800; color: #7BBE97; line-height: 1;">
              ${bpSummary.lowCount || 0}
            </div>
          </td>
        </tr>
      </table>
    </div>

    ${renderFooter(2, 2)}
  `;

  // Attach pages in a temporary hidden container
  const wrapper = document.createElement("div");
  wrapper.id = "incident-stats-pdf-export-wrapper";
  wrapper.style.position = "absolute";
  wrapper.style.left = "0px";
  wrapper.style.top = "0px";
  wrapper.style.width = "794px";
  wrapper.style.zIndex = "9999999";
  wrapper.appendChild(page1);
  wrapper.appendChild(page2);
  document.body.appendChild(wrapper);

  // Preserve scroll position and scroll to (0, 0)
  const prevScrollY = window.scrollY;
  const prevScrollX = window.scrollX;
  window.scrollTo(0, 0);

  try {
    // Wait for DOM to finish rendering and fonts/images to settle
    await new Promise((resolve) => setTimeout(resolve, 150));

    const [canvas1, canvas2] = await Promise.all([
      html2canvas(page1, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFFFFF",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: 794,
        height: 1123
      }),
      html2canvas(page2, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFFFFF",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: 794,
        height: 1123
      })
    ]);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Page 1
    pdf.addImage(canvas1.toDataURL("image/jpeg", 0.98), "JPEG", 0, 0, 210, 297);

    // Page 2
    pdf.addPage();
    pdf.addImage(canvas2.toDataURL("image/jpeg", 0.98), "JPEG", 0, 0, 210, 297);

    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `Incident_Analytics_Report_${timestamp}.pdf`;
    pdf.save(fileName);
    return true;
  } finally {
    window.scrollTo(prevScrollX, prevScrollY);
    if (wrapper && wrapper.parentNode) {
      document.body.removeChild(wrapper);
    }
  }
}
