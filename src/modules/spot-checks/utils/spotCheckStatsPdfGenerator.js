import { jsPDF } from "jspdf";
import nneLogoImg from "../../../assets/images/nne_logo.png";
import projectLogoImg from "../../../assets/images/Logo.jpeg";

// ── Helpers ────────────────────────────────────────────────────────────────

function hexToRgba(hex, a) {
  if (!hex) return `rgba(161,165,179,${a})`;
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${a})`;
}

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

async function htmlToCanvas(htmlStr, width = 794) {
  const { default: html2canvas } = await import("html2canvas");
  const container = document.createElement("div");
  container.style.cssText = `
    position:fixed;top:-9999px;left:-9999px;z-index:-1;
    width:${width}px;background:#ffffff;padding:0;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  `;
  container.innerHTML = htmlStr;
  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    return canvas;
  } finally {
    document.body.removeChild(container);
  }
}

function getRateColor(rate) {
  if (rate >= 80) return "#34D399";
  if (rate >= 60) return "#38BDF8";
  if (rate >= 40) return "#FBBF24";
  return "#F87171";
}

// ── Main Export ────────────────────────────────────────────────────────────

/**
 * Generates and downloads a clean 2-page A4 PDF:
 *  - Page 1: KPI summary cards (8 cards, 4-per-row) + Contractor Statistics table
 *  - Page 2: Buildings Statistics table
 */
export async function generateSpotCheckStatsPdf({
  stats = {},
  contractorStats = [],
  buildingStats = [],
  currentUser = {},
}) {
  const [projectLogo, nneLogo] = await Promise.all([
    loadBase64Image(projectLogoImg),
    loadBase64Image(nneLogoImg),
  ]);

  const generatedDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const generatedBy =
    currentUser?.name ||
    currentUser?.username ||
    currentUser?.email ||
    "Superadmin";

  const totalChecks      = stats.totalChecks      || 0;
  const compliant        = stats.compliantCount   || 0;
  const nonCompliant     = stats.nonCompliantCount || 0;
  const activePermit     = stats.activePermitted  ?? totalChecks;
  const recentPeriod     = stats.recentPeriodCount ?? 0;
  const totalContractors = contractorStats.length;
  const totalBuildings   = buildingStats.length;
  const overallRate      = totalChecks > 0
    ? Math.round((compliant / totalChecks) * 100)
    : 0;

  // ── Shared templates ─────────────────────────────────────────────────────

  const renderHeader = (subtitle) => `
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="width:22%;vertical-align:middle;text-align:left;padding-bottom:14px;">
          ${projectLogo ? `<img src="${projectLogo}" style="height:40px;max-width:140px;object-fit:contain;display:block;" alt="Project Logo"/>` : ""}
        </td>
        <td style="width:56%;text-align:center;vertical-align:middle;padding-bottom:14px;">
          <div style="font-size:18px;font-weight:800;color:#0F172A;text-transform:uppercase;letter-spacing:-0.01em;margin-bottom:4px;">
            Spot Check Analytics &amp; Statistics
          </div>
          <div style="font-size:11.5px;color:#64748B;font-weight:600;">${subtitle}</div>
        </td>
        <td style="width:22%;text-align:right;vertical-align:middle;padding-bottom:14px;">
          ${nneLogo ? `<img src="${nneLogo}" style="height:40px;max-width:140px;object-fit:contain;display:inline-block;" alt="NNE Logo"/>` : ""}
        </td>
      </tr>
    </table>
    <div style="width:100%;height:2px;background:#0F172A;margin-top:2px;margin-bottom:20px;"></div>
  `;

  const renderMeta = () => `
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
      <tr>
        <td style="padding:10px 14px;font-size:11px;color:#475569;width:60%;">
          <b>Total Checks:</b> <span style="color:#0F172A;">${totalChecks}</span> &nbsp;&nbsp;
          <b>Compliant:</b> <span style="color:#14B8A6;">${compliant}</span> &nbsp;&nbsp;
          <b>Non-Compliant:</b> <span style="color:#E32B50;">${nonCompliant}</span> &nbsp;&nbsp;
          <b>Overall Pass Rate:</b> <span style="color:${getRateColor(overallRate)};font-weight:700;">${overallRate}%</span>
        </td>
        <td style="padding:10px 14px;font-size:10px;color:#64748B;text-align:right;width:40%;">
          <b>Generated:</b> ${generatedDate} | <b>By:</b> ${generatedBy}
        </td>
      </tr>
    </table>
  `;

  const renderFooter = (pageNo, totalPages = 2) => `
    <table style="width:100%;border-collapse:collapse;margin-top:24px;border-top:1.5px solid #E2E8F0;padding-top:10px;">
      <tr>
        <td style="font-size:9px;color:#94A3B8;padding-top:8px;">HSE Spot Check Analytics Report — CONFIDENTIAL</td>
        <td style="font-size:9px;color:#94A3B8;text-align:center;padding-top:8px;">Page ${pageNo} of ${totalPages}</td>
        <td style="font-size:9px;color:#94A3B8;text-align:right;padding-top:8px;">${generatedDate}</td>
      </tr>
    </table>
  `;

  const kpiCard = (label, value, color, sub) => `
    <div style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:18px 20px;border-left:5px solid ${color};box-sizing:border-box;">
      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;color:#64748B;margin-bottom:10px;">${label}</div>
      <div style="font-size:26px;font-weight:800;color:${color};line-height:1;margin-bottom:6px;">${value}</div>
      <div style="font-size:10px;color:#94A3B8;">${sub}</div>
    </div>
  `;

  const tableHead = `
    <thead>
      <tr style="background:#F8FAFC;">
        <th style="padding:9px 10px;font-size:10px;font-weight:700;text-transform:uppercase;color:#64748B;text-align:left;border-bottom:2px solid #E2E8F0;">Name</th>
        <th style="padding:9px 10px;font-size:10px;font-weight:700;text-transform:uppercase;color:#64748B;text-align:center;border-bottom:2px solid #E2E8F0;">Audits</th>
        <th style="padding:9px 10px;font-size:10px;font-weight:700;text-transform:uppercase;color:#64748B;text-align:center;border-bottom:2px solid #E2E8F0;">Pass</th>
        <th style="padding:9px 10px;font-size:10px;font-weight:700;text-transform:uppercase;color:#64748B;text-align:center;border-bottom:2px solid #E2E8F0;">Fail</th>
        <th style="padding:9px 10px;font-size:10px;font-weight:700;text-transform:uppercase;color:#64748B;text-align:right;border-bottom:2px solid #E2E8F0;min-width:110px;">Compliance Rate</th>
      </tr>
    </thead>
  `;

  const buildRows = (rows) =>
    rows.map((item) => {
      const rate = item.count > 0 ? Math.round((item.compliant / item.count) * 100) : 0;
      const col = getRateColor(rate);
      return `
        <tr style="border-bottom:1px solid #F1F5F9;">
          <td style="padding:8px 10px;font-size:11px;font-weight:600;color:#0F172A;">${item.name || "—"}</td>
          <td style="padding:8px 10px;font-size:11px;text-align:center;color:#334155;">${item.count}</td>
          <td style="padding:8px 10px;font-size:11px;text-align:center;color:#16A34A;">${item.compliant}</td>
          <td style="padding:8px 10px;font-size:11px;text-align:center;color:#DC2626;">${item.nonCompliant}</td>
          <td style="padding:8px 10px;font-size:11px;text-align:right;">
            <span style="font-weight:700;color:${col};">${rate}%</span>
            <div style="margin-top:4px;height:5px;background:#E2E8F0;border-radius:3px;width:100%;">
              <div style="width:${rate}%;height:5px;background:${col};border-radius:3px;"></div>
            </div>
          </td>
        </tr>
      `;
    }).join("");

  const sectionTitle = (title, color = "#0F172A") => `
    <div style="font-size:13px;font-weight:800;color:${color};margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid ${hexToRgba(color, 0.2)};">
      ${title}
    </div>
  `;

  const emptyMsg = `
    <div style="padding:20px;text-align:center;color:#94A3B8;font-size:12px;border:1px dashed #E2E8F0;border-radius:8px;">
      No data recorded yet.
    </div>
  `;

  // ── Page 1 (single page) ────────────────────────────────────────────────
  const page1Html = `
    <div style="padding:32px 36px;background:#fff;width:794px;box-sizing:border-box;">
      ${renderHeader("Overview &amp; Statistics")}
      ${sectionTitle("Overview")}
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px;">
        ${kpiCard("Total Checks",     totalChecks,      "#583C66", "all recorded spot checks")}
        ${kpiCard("Compliant (Pass)", compliant,        "#14B8A6", "passed audits")}
        ${kpiCard("Non-Compliant",    nonCompliant,     "#E32B50", "requiring corrective action")}
        ${kpiCard("Contractors",      totalContractors, "#0284C7", "audited contractors")}
        ${kpiCard("Active Permitted", activePermit,     "#F97316", "verified PTWs")}
        ${kpiCard("Recent Period",    recentPeriod,     "#64748B", "latest inspections")}
      </div>

      ${sectionTitle("Contractor Statistics", "#0284C7")}
      ${contractorStats.length === 0 ? emptyMsg
        : `<table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">${tableHead}<tbody>${buildRows(contractorStats)}</tbody></table>`}

      <div style="margin-top:24px;"></div>

      ${sectionTitle("Buildings Statistics", "#8B5CF6")}
      ${buildingStats.length === 0 ? emptyMsg
        : `<table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">${tableHead}<tbody>${buildRows(buildingStats)}</tbody></table>`}

      ${renderFooter(1, 1)}
    </div>
  `;

  // ── Render & compose ─────────────────────────────────────────────────────
  const canvas1 = await htmlToCanvas(page1Html);

  const pdf  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();

  const ratio = canvas1.height / canvas1.width;
  const imgH  = Math.min(pdfW * ratio, pdfH);
  pdf.addImage(canvas1.toDataURL("image/png"), "PNG", 0, 0, pdfW, imgH, undefined, "FAST");

  pdf.save(`SpotCheck_Analytics_${new Date().toISOString().slice(0, 10)}.pdf`);
}
