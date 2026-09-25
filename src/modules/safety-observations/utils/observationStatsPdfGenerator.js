/**
 * Safety Observations Dashboard - Stats PDF Generator
 * Generates a professional PDF report of all analytics panels:
 * - KPIs (This Week, This Month, Weekly Avg, Total, Last Week)
 * - Observation Status Distribution (Open, Assigned, Accepted, Resolved, Closed, Escalated)
 * - Observation Severity / Risk Level Distribution (Critical, High, Medium, Low)
 * - Observation Type Breakdown (Positive vs Needs Attention)
 * - Observations by Safety Category
 * - Weekly Observation Trend (Last 8 Weeks)
 * - All Contractor-wise Statistics (Total, Positive, Needs Attention, Positive Rate, Status breakdown)
 * Deep Dive Observations table is intentionally excluded.
 */

const BRAND_COLOR = '#131E40';
const ACCENT_GREEN = '#7BBE97';
const ACCENT_RED = '#E32B50';
const ACCENT_AMBER = '#C07D10';
const ACCENT_PURPLE = '#583C66';
const TEXT_MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const CATEGORY_PALETTE = ['#131E40', '#E32B50', '#7BBE97', '#C07D10', '#8F1B32', '#583C66', '#82274E', '#C49F85'];

const SEVERITY_COLORS = {
  'Critical': '#8F1B32',
  'High': '#E32B50',
  'Medium': '#C07D10',
  'Low': '#7BBE97',
};

const STATUS_COLORS = {
  'Open': '#60A5FA',
  'Assigned': '#A78BFA',
  'Accepted': '#FBBF24',
  'Resolved': '#FBBF24',
  'Closed': '#34D399',
  'Rejected': '#F87171',
  'Escalated': '#EF4444',
};

function loadjsPDF() {
  return new Promise((resolve, reject) => {
    if (window.jspdf && window.jspdf.jsPDF) return resolve(window.jspdf.jsPDF);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => resolve(window.jspdf.jsPDF);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return [100, 100, 100];
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return [r, g, b];
}

function drawSectionTitle(doc, title, y, pageW) {
  doc.setFillColor(...hexToRgb(BRAND_COLOR));
  doc.rect(14, y, pageW - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), 17, y + 5);
  return y + 11;
}

function drawKpiBox(doc, x, y, w, h, label, value, color) {
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  const rgb = hexToRgb(color);
  doc.setFillColor(...rgb);
  doc.rect(x, y, 3, h, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...rgb);
  doc.text(String(value), x + w / 2, y + h / 2 + 1, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...hexToRgb(TEXT_MUTED));
  doc.text(label.toUpperCase(), x + w / 2, y + h - 3.5, { align: 'center' });
}

function drawHBar(doc, x, y, label, count, maxCount, barMaxW, color) {
  const barW = maxCount > 0 ? Math.max((count / maxCount) * barMaxW, 2) : 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(50, 50, 50);
  const display = label.length > 26 ? label.slice(0, 24) + '...' : label;
  doc.text(display, x, y + 3);
  const rgb = hexToRgb(color);
  doc.setFillColor(...rgb);
  doc.rect(x + 55, y, barW, 3.8, 'F');
  doc.setFillColor(235, 235, 235);
  doc.rect(x + 55 + barW, y, barMaxW - barW, 3.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text(String(count), x + 55 + barMaxW + 3, y + 3.2);
}

export async function generateObservationStatsPdf({ agg, filters, contractorStats = [], currentUser }) {
  const jsPDF = await loadjsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = 14;

  // ── Cover Header ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  const filterParts = [];
  if (filters?.startDate) filterParts.push('From: ' + filters.startDate);
  if (filters?.endDate) filterParts.push('To: ' + filters.endDate);
  if (filters?.selectedContractor) filterParts.push('Contractor: ' + filters.selectedContractor);
  if (filters?.selectedBuilding) filterParts.push('Building: ' + filters.selectedBuilding);
  filterParts.push('Generated: ' + new Date().toLocaleDateString('en-GB') + ' by ' + (currentUser?.username || currentUser?.name || 'User'));

  const metaString = filterParts.join('   |   ');
  const maxTextW = pageW - margin * 2;
  const metaLines = doc.splitTextToSize(metaString, maxTextW);

  const lineHeight = 4.2;
  const bannerH = 13 + (metaLines.length * lineHeight) + 5;
  const headerH = Math.max(28, bannerH);

  doc.setFillColor(...hexToRgb(BRAND_COLOR));
  doc.rect(0, 0, pageW, headerH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Safety Observations - Analytics Report', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 210, 230);
  let currentMetaY = 18.5;
  metaLines.forEach((line) => {
    doc.text(line, margin, currentMetaY);
    currentMetaY += lineHeight;
  });

  y = headerH + 6;

  // ── 1. KPI Cards ──
  y = drawSectionTitle(doc, 'Key Performance Indicators', y, pageW);
  const kpiBoxW = (contentW - 16) / 5;
  const kpiGap = 4;
  const kpiBoxH = 19;
  const kpis = [
    { label: 'This Week', value: agg?.thisWeek || 0, color: BRAND_COLOR },
    { label: 'This Month', value: agg?.thisMonth || 0, color: BRAND_COLOR },
    { label: 'Weekly Avg', value: Number(agg?.weeklyAvg || 0).toFixed(1), color: ACCENT_GREEN },
    { label: 'Total Obs', value: agg?.total || 0, color: ACCENT_PURPLE },
    { label: 'Last Week', value: agg?.lastWeek || 0, color: '#8A8F9F' },
  ];
  kpis.forEach((k, i) => drawKpiBox(doc, margin + i * (kpiBoxW + kpiGap), y, kpiBoxW, kpiBoxH, k.label, k.value, k.color));
  y += kpiBoxH + 8;

  // ── 2. Status & Severity Breakdown (Side-by-Side Panels) ──
  const halfColW = (contentW - 8) / 2;

  // Header strip for 2 columns
  doc.setFillColor(...hexToRgb(BRAND_COLOR));
  doc.rect(margin, y, halfColW, 6.5, 'F');
  doc.rect(margin + halfColW + 8, y, halfColW, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('OBSERVATION STATUS DISTRIBUTION', margin + 3, y + 4.5);
  doc.text('OBSERVATION SEVERITY DISTRIBUTION', margin + halfColW + 11, y + 4.5);
  y += 10;

  // Compile status counts
  const totalObs = agg?.total || 0;
  const allStatuses = [
    { label: 'Open', count: contractorStats.reduce((s, c) => s + (c.open || 0), 0), color: STATUS_COLORS['Open'] },
    { label: 'Assigned', count: contractorStats.reduce((s, c) => s + (c.assigned || 0), 0), color: STATUS_COLORS['Assigned'] },
    { label: 'Accepted', count: contractorStats.reduce((s, c) => s + (c.accepted || 0), 0), color: STATUS_COLORS['Accepted'] },
    { label: 'Resolved', count: contractorStats.reduce((s, c) => s + (c.resolved || 0), 0), color: STATUS_COLORS['Resolved'] },
    { label: 'Closed', count: contractorStats.reduce((s, c) => s + (c.closed || 0), 0), color: STATUS_COLORS['Closed'] },
    { label: 'Rejected', count: contractorStats.reduce((s, c) => s + (c.rejected || 0), 0), color: STATUS_COLORS['Rejected'] },
    { label: 'Escalated', count: contractorStats.reduce((s, c) => s + (c.escalated || 0), 0), color: STATUS_COLORS['Escalated'] },
  ].filter(st => st.count > 0);

  const maxStatusCount = Math.max(...allStatuses.map(s => s.count), 1);

  // Compile severity counts (Critical, High, Medium, Low)
  const severityList = (agg?.severity && agg.severity.length > 0)
    ? agg.severity
    : [
        { level: 'Critical', count: 0, color: SEVERITY_COLORS['Critical'] },
        { level: 'High', count: 0, color: SEVERITY_COLORS['High'] },
        { level: 'Medium', count: 0, color: SEVERITY_COLORS['Medium'] },
        { level: 'Low', count: 0, color: SEVERITY_COLORS['Low'] },
      ];
  const maxSevCount = Math.max(...severityList.map(s => s.count), 1);
  const totalSevObs = severityList.reduce((sum, s) => sum + s.count, 0) || totalObs || 1;

  const startTwoColY = y;

  // Left Column: Status Rows
  let leftY = startTwoColY;
  allStatuses.forEach((st) => {
    const pct = totalObs > 0 ? Math.round((st.count / totalObs) * 100) : 0;
    const barW = Math.max((st.count / maxStatusCount) * 44, 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    doc.text(st.label, margin, leftY + 3);

    // Bar
    const rgb = hexToRgb(st.color || '#60A5FA');
    doc.setFillColor(...rgb);
    doc.rect(margin + 20, leftY, barW, 3.5, 'F');
    doc.setFillColor(235, 235, 235);
    doc.rect(margin + 20 + barW, leftY, 44 - barW, 3.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(String(st.count), margin + 68, leftY + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...hexToRgb(TEXT_MUTED));
    doc.text(pct + '%', margin + 78, leftY + 3);

    leftY += 6.5;
  });

  // Right Column: Severity Rows
  let rightY = startTwoColY;
  const rightX = margin + halfColW + 8;
  severityList.forEach((sev) => {
    const sevColor = sev.color || SEVERITY_COLORS[sev.level] || '#8A8F9F';
    const pct = Math.round((sev.count / totalSevObs) * 100);
    const barW = Math.max((sev.count / maxSevCount) * 44, 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    doc.text(sev.level, rightX, rightY + 3);

    // Bar
    const rgb = hexToRgb(sevColor);
    doc.setFillColor(...rgb);
    doc.rect(rightX + 20, rightY, barW, 3.5, 'F');
    doc.setFillColor(235, 235, 235);
    doc.rect(rightX + 20 + barW, rightY, 44 - barW, 3.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...rgb);
    doc.text(String(sev.count), rightX + 68, rightY + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...hexToRgb(TEXT_MUTED));
    doc.text(pct + '%', rightX + 78, rightY + 3);

    rightY += 6.5;
  });

  y = Math.max(leftY, rightY) + 6;

  // ── 3. Type Breakdown & Weekly Observation Trend ──
  y = drawSectionTitle(doc, 'Observation Type & Weekly Trend', y, pageW);

  // Type Breakdown box (left side of this section)
  const typeTotal = (agg?.safe || 0) + (agg?.unsafe || 0);
  const safePct = typeTotal > 0 ? Math.round(((agg?.safe || 0) / typeTotal) * 100) : 0;
  const typeBoxW = 42;

  // Positive tile
  doc.setFillColor(232, 245, 238);
  doc.roundedRect(margin, y, typeBoxW, 13, 2, 2, 'F');
  doc.setFillColor(...hexToRgb(ACCENT_GREEN));
  doc.rect(margin, y, 3, 13, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...hexToRgb(ACCENT_GREEN));
  doc.text(String(agg?.safe || 0), margin + typeBoxW / 2, y + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); doc.setTextColor(...hexToRgb(TEXT_MUTED));
  doc.text('POSITIVE (' + safePct + '%)', margin + typeBoxW / 2, y + 11, { align: 'center' });

  // Needs Attention tile
  doc.setFillColor(254, 242, 244);
  doc.roundedRect(margin, y + 15, typeBoxW, 13, 2, 2, 'F');
  doc.setFillColor(...hexToRgb(ACCENT_RED));
  doc.rect(margin, y + 15, 3, 13, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...hexToRgb(ACCENT_RED));
  doc.text(String(agg?.unsafe || 0), margin + typeBoxW / 2, y + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); doc.setTextColor(...hexToRgb(TEXT_MUTED));
  doc.text('NEEDS ATTENTION (' + (100 - safePct) + '%)', margin + typeBoxW / 2, y + 26, { align: 'center' });

  // Weekly Trend Chart on right side
  const trendX = margin + typeBoxW + 8;
  const trendAreaW = contentW - typeBoxW - 8;
  const trend = agg?.weeklyTrend || [];
  const maxTrend = Math.max(...trend.map(w => w.count), 1);
  const colW = trendAreaW / Math.max(trend.length, 1);
  const maxBarH = 22;

  trend.forEach((w, i) => {
    const barH = maxTrend > 0 ? Math.max((w.count / maxTrend) * maxBarH, 2) : 2;
    const isCur = i === trend.length - 1;
    const bx = trendX + i * colW + colW * 0.2;
    const bw = colW * 0.6;
    doc.setFillColor(...hexToRgb(isCur ? BRAND_COLOR : '#C4B79A'));
    doc.roundedRect(bx, y + maxBarH - barH, bw, barH, 1, 1, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
    doc.setTextColor(...hexToRgb(isCur ? BRAND_COLOR : TEXT_MUTED));
    doc.text(String(w.count), bx + bw / 2, y + maxBarH - barH - 1, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); doc.setTextColor(...hexToRgb(TEXT_MUTED));
    doc.text(w.label || '', bx + bw / 2, y + maxBarH + 4, { align: 'center' });
  });

  y += 32;

  // ── 4. Observations by Safety Category ──
  y = drawSectionTitle(doc, 'Observations by Safety Category', y, pageW);
  const cats = (agg?.categories || []).slice(0, 8);
  const maxCat = Math.max(...cats.map(c => c.count), 1);
  const catBarAreaW = contentW - 75;
  cats.forEach((c, i) => {
    drawHBar(doc, margin, y, c.name, c.count, maxCat, catBarAreaW, CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]);
    y += 6.5;
  });
  y += 4;

  // ── 5. All Contractor-wise Statistics (Comprehensive Table) ──
  if (y > pageH - 45) {
    doc.addPage();
    y = 14;
  }

  y = drawSectionTitle(doc, 'All Contractor-wise Statistics (Volume, Type & Status)', y, pageW);

  if (!contractorStats || contractorStats.length === 0) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...hexToRgb(TEXT_MUTED));
    doc.text('No contractor data recorded for the selected filters.', margin, y + 6);
    y += 14;
  } else {
    const colWidths = [46, 16, 18, 20, 18, 16, 16, 16, 16];
    const headers = ['Contractor', 'Total', 'Positive', 'Needs Attn', 'Pos Rate', 'Open', 'Assigned', 'Resolved', 'Closed'];
    const colX = [margin];
    colWidths.forEach((w, i) => { if (i > 0) colX.push(colX[i - 1] + colWidths[i - 1]); });

    const renderTableHeader = (currentY) => {
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, currentY, contentW, 6.5, 'F');
      headers.forEach((h, i) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(60, 60, 60);
        doc.text(h, colX[i] + (i === 0 ? 1.5 : colWidths[i] / 2), currentY + 4.5, { align: i === 0 ? 'left' : 'center' });
      });
      return currentY + 7;
    };

    y = renderTableHeader(y);

    contractorStats.forEach((cs, idx) => {
      if (y > pageH - 22) {
        doc.addPage();
        y = 14;
        y = drawSectionTitle(doc, 'All Contractor-wise Statistics (Continued)', y, pageW);
        y = renderTableHeader(y);
      }

      if (idx % 2 === 0) {
        doc.setFillColor(250, 251, 253);
        doc.rect(margin, y, contentW, 6.5, 'F');
      }
      doc.setDrawColor(...hexToRgb(BORDER));
      doc.line(margin, y + 6.5, margin + contentW, y + 6.5);

      const posRate = cs.total > 0 ? Math.round((cs.positive / cs.total) * 100) : 0;
      const rowData = [
        cs.name,
        String(cs.total || 0),
        String(cs.positive || 0),
        String(cs.needsAttention || 0),
        `${posRate}%`,
        String(cs.open || 0),
        String(cs.assigned || 0),
        String(cs.resolved || 0),
        String(cs.closed || 0),
      ];

      rowData.forEach((val, i) => {
        doc.setFont('helvetica', i === 0 || i === 1 ? 'bold' : 'normal');
        doc.setFontSize(6.5);
        if (i === 4) {
          if (posRate >= 60) doc.setTextColor(45, 122, 79);
          else if (posRate >= 40) doc.setTextColor(192, 125, 16);
          else doc.setTextColor(227, 43, 80);
        } else {
          doc.setTextColor(50, 50, 50);
        }
        const display = i === 0 && val.length > 24 ? val.slice(0, 22) + '...' : val;
        doc.text(display, colX[i] + (i === 0 ? 1.5 : colWidths[i] / 2), y + 4.5, { align: i === 0 ? 'left' : 'center' });
      });

      y += 6.5;
    });
  }

  // ── Footer on all pages ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...hexToRgb(BRAND_COLOR));
    doc.rect(0, pageH - 9, pageW, 9, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(200, 210, 230);
    doc.text('M3 South - Safety Observations Analytics Report  |  Confidential', margin, pageH - 3.5);
    doc.text('Page ' + p + ' of ' + totalPages, pageW - margin, pageH - 3.5, { align: 'right' });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  doc.save('Safety_Observations_Stats_' + timestamp + '.pdf');
}