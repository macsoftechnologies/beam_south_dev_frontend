import html2pdf from "html2pdf.js";
import nneLogoImg from "../../../assets/images/nne_logo.png";
import projectLogoImg from "../../../assets/images/Logo.jpeg";

/**
 * Client-side PDF generator for Safety Observations
 * Used directly or as an instant fallback when backend PDF generation is unavailable.
 */
export async function generateObservationClientPdf(data, fileName = "Safety_Observation.pdf") {
  const obs = data?.observation || data || {};
  const history = Array.isArray(data?.history) ? data.history : [];

  const isPositive = obs.observationType === "POSITIVE";
  const obsRef = obs.observationNumber || `SO-${obs.id || "Report"}`;

  const parseArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [val];
      } catch {
        return [val];
      }
    }
    return [];
  };

  const resolvePhotoUrl = (p) => {
    if (!p) return "";
    if (typeof p !== "string") return "";
    if (p.startsWith("data:") || p.startsWith("blob:")) return p;
    const filename = p.split("/").pop().split("\\").pop();
    const baseUrl = (import.meta.env?.VITE_API_BASE_URL || 'https://api.beam.safesiteworks.com/development/m3south').replace(/\/+$/, '');
    return p.startsWith("http")
      ? p
      : `${baseUrl}/observations/${filename}`;
  };

  const toBase64 = async (url) => {
    if (!url || url.startsWith("data:")) return url;
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) return url;
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      });
    } catch {
      return url;
    }
  };

  const rawPhotos = parseArray(obs.photos);
  const rawResolutionPhotos = parseArray(obs.resolutionPhotos);

  const photos = (await Promise.all(rawPhotos.map((p) => toBase64(resolvePhotoUrl(p))))).filter(Boolean);
  const resolutionPhotos = (await Promise.all(rawResolutionPhotos.map((p) => toBase64(resolvePhotoUrl(p))))).filter(Boolean);
  const closureSignature = obs.closureSignature ? await toBase64(resolvePhotoUrl(obs.closureSignature)) : "";

  const resolvedHistory = await Promise.all(
    history.map(async (log) => {
      const logPhotos = parseArray(log.photos);
      const resolvedLogPhotos = (await Promise.all(logPhotos.map((p) => toBase64(resolvePhotoUrl(p))))).filter(Boolean);
      return {
        ...log,
        resolvedLogPhotos,
      };
    })
  );

  const formatDate = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toISOString().split("T")[0];
    } catch {
      return String(d);
    }
  };

  const formatDateTime = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return `${dt.toISOString().split("T")[0]} ${dt.toTimeString().split(" ")[0].substring(0, 5)}`;
    } catch {
      return String(d);
    }
  };

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0px";
  container.style.top = "0px";
  container.style.width = "210mm";
  container.style.zIndex = "99999";
  container.style.opacity = "1";
  container.style.pointerEvents = "none";
  container.style.background = "#ffffff";
  container.style.padding = "10mm";
  container.style.boxSizing = "border-box";
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.fontSize = "11px";
  container.style.color = "#1e293b";
  container.style.lineHeight = "1.4";

  container.innerHTML = `
    <!-- Header -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border-bottom: 2px solid #0f172a; padding-bottom: 8px;">
      <tr>
        <td style="width: 25%; vertical-align: middle;">
          <img src="${nneLogoImg}" style="height: 36px; object-fit: contain;" alt="NNE" onerror="this.style.display='none'" />
        </td>
        <td style="width: 50%; text-align: center; vertical-align: middle;">
          <div style="font-size: 17px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Safety Observation Report</div>
          <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px;">Official Closed Record &amp; Verification Sign-off</div>
        </td>
        <td style="width: 25%; text-align: right; vertical-align: middle;">
          <img src="${projectLogoImg}" style="height: 36px; object-fit: contain;" alt="Project Logo" onerror="this.style.display='none'" />
        </td>
      </tr>
    </table>

    <!-- Meta Header Box -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px;">
      <tr>
        <td style="width: 50%; padding-right: 6px;">
          <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 7px 10px; border-radius: 4px;">
            <b>Observation Ref:</b> <span style="font-family: monospace; font-size: 12px; font-weight: 700; color: #0284c7;">${obsRef}</span><br />
            <b>Project Name:</b> ${obs.projectName || ((import.meta.env?.VITE_API_BASE_URL || '').toLowerCase().includes('north') ? 'M3NORTH' : (import.meta.env?.VITE_API_BASE_URL || '').toLowerCase().includes('infra') ? 'M3INFRASTRUCTURE' : 'M3SOUTH')}<br />
            <b>Date of Observation:</b> ${formatDate(obs.observationDate || obs.createdTime)} ${obs.observationTime ? `(${obs.observationTime})` : ""}
          </div>
        </td>
        <td style="width: 50%; padding-left: 6px;">
          <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 7px 10px; border-radius: 4px;">
            <b>Status:</b> <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; background: #dcfce7; color: #15803d; border: 1px solid #86efac; text-transform: uppercase;">CLOSED</span><br />
            <b>Type:</b> <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; background: ${isPositive ? "#dcfce7" : "#fee2e2"}; color: ${isPositive ? "#15803d" : "#b91c1c"}; border: 1px solid ${isPositive ? "#86efac" : "#fca5a5"}; text-transform: uppercase;">${isPositive ? "Positive" : "Needs Attention"}</span><br />
            <b>Risk Level:</b> <span style="font-weight: 700;">${obs.riskLevel || "MEDIUM"}</span>
          </div>
        </td>
      </tr>
    </table>

    <!-- Classification & Location -->
    <div style="border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 12px; overflow: hidden;">
      <div style="background: #1e293b; color: #fff; padding: 5px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        Observation Classification &amp; Location
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
        <tr>
          <td style="width: 22%; background: #f8fafc; font-weight: 600; color: #475569; padding: 5px 8px; border: 1px solid #e2e8f0;">Subject / Title</td>
          <td colspan="3" style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${obs.subject || "-"}</td>
        </tr>
        <tr>
          <td style="width: 22%; background: #f8fafc; font-weight: 600; color: #475569; padding: 5px 8px; border: 1px solid #e2e8f0;">Nature of Finding</td>
          <td style="width: 28%; padding: 5px 8px; border: 1px solid #e2e8f0;">${obs.natureOfFinding || "-"}</td>
          <td style="width: 22%; background: #f8fafc; font-weight: 600; color: #475569; padding: 5px 8px; border: 1px solid #e2e8f0;">Safety Category</td>
          <td style="width: 28%; padding: 5px 8px; border: 1px solid #e2e8f0;">${obs.safetyCategory || "-"}</td>
        </tr>
        <tr>
          <td style="background: #f8fafc; font-weight: 600; color: #475569; padding: 5px 8px; border: 1px solid #e2e8f0;">Subcategory</td>
          <td style="padding: 5px 8px; border: 1px solid #e2e8f0;">${obs.subcategory || "N/A"}</td>
          <td style="background: #f8fafc; font-weight: 600; color: #475569; padding: 5px 8px; border: 1px solid #e2e8f0;">Target Deadline</td>
          <td style="padding: 5px 8px; border: 1px solid #e2e8f0;">${formatDate(obs.deadline)}</td>
        </tr>
        <tr>
          <td style="background: #f8fafc; font-weight: 600; color: #475569; padding: 5px 8px; border: 1px solid #e2e8f0;">Building / Area</td>
          <td style="padding: 5px 8px; border: 1px solid #e2e8f0;">${obs.buildingName || "-"}</td>
          <td style="background: #f8fafc; font-weight: 600; color: #475569; padding: 5px 8px; border: 1px solid #e2e8f0;">Floor Level</td>
          <td style="padding: 5px 8px; border: 1px solid #e2e8f0;">${obs.floorLevel || "-"}</td>
        </tr>
        <tr>
          <td style="background: #f8fafc; font-weight: 600; color: #475569; padding: 5px 8px; border: 1px solid #e2e8f0;">Specific Location</td>
          <td colspan="3" style="padding: 5px 8px; border: 1px solid #e2e8f0;">${obs.specificLocation || "-"}</td>
        </tr>
        <tr>
          <td style="background: #f8fafc; font-weight: 600; color: #475569; padding: 5px 8px; border: 1px solid #e2e8f0;">Assigned Contractor</td>
          <td style="padding: 5px 8px; border: 1px solid #e2e8f0;"><b>${obs.assignedContractorName || "N/A"}</b></td>
          <td style="background: #f8fafc; font-weight: 600; color: #475569; padding: 5px 8px; border: 1px solid #e2e8f0;">Reported By</td>
          <td style="padding: 5px 8px; border: 1px solid #e2e8f0;">${obs.createdByUserName || "Safety Inspector"} (${obs.createdByRole || "DEPARTMENT"})</td>
        </tr>
      </table>
    </div>

    <!-- Finding & Observations -->
    <div style="border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 12px; overflow: hidden;">
      <div style="background: #1e293b; color: #fff; padding: 5px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        Finding Description &amp; Immediate Action
      </div>
      <div style="padding: 8px 10px;">
        <div style="font-weight: 700; color: #475569; margin-bottom: 3px;">Detailed Description:</div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 7px 10px; font-size: 10.5px; white-space: pre-wrap; margin-bottom: 8px;">
          ${obs.description || "No detailed description recorded."}
        </div>

        ${obs.immediateActionTaken ? `
        <div style="font-weight: 700; color: #475569; margin-bottom: 3px;">Immediate Action Taken on Site:</div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 7px 10px; font-size: 10.5px; white-space: pre-wrap; margin-bottom: 8px;">
          ${obs.immediateActionTaken}
        </div>` : ""}

        ${photos && photos.length > 0 ? `
        <div style="font-weight: 700; color: #475569; margin-bottom: 3px;">Initial Evidence Photographs (${photos.length}):</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
          ${photos.map(p => `<img src="${p}" style="width: 100px; height: 75px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1;" alt="Evidence" />`).join("")}
        </div>` : ""}
      </div>
    </div>

    <!-- Contractor Resolution (if available) -->
    ${(obs.resolutionNotes || (resolutionPhotos && resolutionPhotos.length > 0)) ? `
    <div style="border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 12px; overflow: hidden;">
      <div style="background: #1e293b; color: #fff; padding: 5px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        Contractor Corrective Action &amp; Resolution
      </div>
      <div style="padding: 8px 10px;">
        <div style="font-weight: 700; color: #475569; margin-bottom: 3px;">Resolution Notes &amp; Actions Implemented:</div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 7px 10px; font-size: 10.5px; white-space: pre-wrap; margin-bottom: 8px;">
          ${obs.resolutionNotes || "Corrective actions completed."}
        </div>

        ${resolutionPhotos && resolutionPhotos.length > 0 ? `
        <div style="font-weight: 700; color: #475569; margin-bottom: 3px;">Resolution Evidence Photographs (${resolutionPhotos.length}):</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
          ${resolutionPhotos.map(p => `<img src="${p}" style="width: 100px; height: 75px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1;" alt="Resolution Evidence" />`).join("")}
        </div>` : ""}
      </div>
    </div>` : ""}

    <!-- Sign-off & Closure Verification -->
    <div style="border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 12px; overflow: hidden;">
      <div style="background: #1e293b; color: #fff; padding: 5px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        HSE Department Sign-off &amp; Final Closure
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
        <tr>
          <td style="width: 22%; background: #f8fafc; font-weight: 600; color: #475569; padding: 5px 8px; border: 1px solid #e2e8f0;">Closed By</td>
          <td style="width: 28%; padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 700;">${obs.closedBy || "HSE Department"}</td>
          <td style="width: 22%; background: #f8fafc; font-weight: 600; color: #475569; padding: 5px 8px; border: 1px solid #e2e8f0;">Closure Date &amp; Time</td>
          <td style="width: 28%; padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 700;">${formatDateTime(obs.closedTime || obs.updatedTime)}</td>
        </tr>
        <tr>
          <td style="background: #f8fafc; font-weight: 600; color: #475569; padding: 5px 8px; border: 1px solid #e2e8f0;">Closure Verification Comments</td>
          <td colspan="3" style="padding: 5px 8px; border: 1px solid #e2e8f0;">${obs.closureComments || "Observation verified, documented, and closed in accordance with applicable project HSE requirements."}</td>
        </tr>
        ${closureSignature ? `
        <tr>
          <td style="background: #f8fafc; font-weight: 600; color: #475569; padding: 5px 8px; border: 1px solid #e2e8f0; vertical-align: middle;">Digital Signature</td>
          <td colspan="3" style="padding: 5px 8px; border: 1px solid #e2e8f0;">
            <img src="${closureSignature}" style="max-height: 48px; object-fit: contain;" alt="Closure Signature" />
          </td>
        </tr>` : ""}
      </table>
    </div>

    <!-- Audit Trail History -->
    ${resolvedHistory && resolvedHistory.length > 0 ? `
    <div style="border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 12px; overflow: hidden;">
      <div style="background: #1e293b; color: #fff; padding: 5px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        Action History &amp; Audit Trail
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; width: 17%;">Action</th>
            <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; width: 20%;">Performed By</th>
            <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; width: 18%;">Date &amp; Time</th>
            <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; width: 45%;">Remarks / Details &amp; Attachments</th>
          </tr>
        </thead>
        <tbody>
          ${resolvedHistory.map(log => `
          <tr>
            <td style="padding: 4px 8px; border: 1px solid #e2e8f0; vertical-align: top;"><b>${log.actionType}</b></td>
            <td style="padding: 4px 8px; border: 1px solid #e2e8f0; vertical-align: top;">${log.performedByUserName || "System"}<br /><span style="color: #64748b; font-size: 9.5px;">(${log.performedByUserRole || "-"})</span></td>
            <td style="padding: 4px 8px; border: 1px solid #e2e8f0; vertical-align: top;">${formatDateTime(log.timestamp || log.createdTime)}</td>
            <td style="padding: 4px 8px; border: 1px solid #e2e8f0; vertical-align: top;">
              ${log.previousContractor && log.newContractor ? `<div style="color: #6366f1; font-weight: 600; font-size: 10px; margin-bottom: 3px;">Contractor: ${log.previousContractor} &rarr; ${log.newContractor}</div>` : ""}
              ${log.remarks ? `<div>${log.remarks}</div>` : '<span style="color: #94a3b8; font-style: italic;">No remarks</span>'}
              ${log.resolvedLogPhotos && log.resolvedLogPhotos.length > 0 ? `
              <div style="margin-top: 6px; padding-top: 5px; border-top: 1px dashed #cbd5e1;">
                <div style="font-size: 9.5px; font-weight: 700; color: #475569; margin-bottom: 3px;">Attached Photos (${log.resolvedLogPhotos.length}):</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                  ${log.resolvedLogPhotos.map((src) => `
                    <img src="${src}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1;" alt="Log Attachment" />
                  `).join("")}
                </div>
              </div>` : ""}
            </td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>` : ""}

    <div style="text-align: center; font-size: 9.5px; color: #64748b; margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
      Confidential document generated by BEAM Safety Management System. Retain this record in accordance with the project HSE compliance filing process.
    </div>
  `;

  document.body.appendChild(container);

  try {
    const opt = {
      margin: [6, 6, 6, 6],
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        scrollY: 0,
        scrollX: 0,
        windowWidth: 1200,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };

    await html2pdf().set(opt).from(container).save();
    return true;
  } finally {
    document.body.removeChild(container);
  }
}
