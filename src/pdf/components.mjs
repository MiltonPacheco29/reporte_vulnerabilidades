// ============================================================
// REUSABLE PDF COMPONENTS - Enterprise Visual Library
// ============================================================
// Professional components for security reports
// Tables, badges, cards, charts, headers, footers, separators

import { COLORS, SEVERITY_CONFIG, TYPOGRAPHY, SPACING, PAGE, REPORT_META } from '../config/index.mjs';

// ── Layout Helpers ───────────────────────────────────────────

export function ensureSpace(doc, requiredHeight = 120) {
  if (doc.y > PAGE.height - PAGE.margins.bottom - requiredHeight) {
    doc.addPage();
    return true;
  }
  return false;
}

export function applyFont(doc, style) {
  doc.fontSize(style.size).font(style.font).fillColor(style.color);
  return doc;
}

// ── Cover Page ───────────────────────────────────────────────

export function drawCoverPage(doc, { sprintName, totalVulnerabilities, severityCounts, productTypes = [], generationDate }) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // Full-page editorial background
  doc.rect(0, 0, pageW, pageH).fill(COLORS.coverBg);

  // Accent bar at top
  doc.rect(0, 0, pageW, 7).fill(COLORS.accent);

  // Soft panel for the main content area
  doc.save();
  doc.opacity(0.08);
  doc.roundedRect(38, 92, pageW - 76, pageH - 188, 10).fill(COLORS.white);
  doc.opacity(0.18);
  doc.rect(56, 130, 70, 4).fill(COLORS.accent);
  doc.restore();

  // Classification badge
  doc.save();
  const classW = 120;
  const classH = 22;
  const classX = pageW - classW - 40;
  const classY = 35;
  doc.roundedRect(classX, classY, classW, classH, 4).fill(COLORS.danger);
  applyFont(doc, { size: 8, font: 'Helvetica-Bold', color: COLORS.white });
  doc.text(REPORT_META.classification, classX, classY + 7, { width: classW, align: 'center' });
  doc.restore();

  // Main title block - positioned at golden ratio
  const titleY = pageH * 0.30;

  // Report type label
  applyFont(doc, { size: 10, font: 'Helvetica-Bold', color: '#8FA3AD' });
  doc.text('SECURITY ASSESSMENT', 56, titleY);

  // Main title
  doc.moveDown(0.6);
  applyFont(doc, TYPOGRAPHY.coverTitle);
  doc.text('Reporte de Análisis\nde Vulnerabilidades', 56, doc.y, { width: pageW - 120 });

  // Sprint subtitle
  doc.moveDown(0.8);
  applyFont(doc, TYPOGRAPHY.coverSubtitle);
  doc.text(sprintName, 56);

  // Divider
  doc.moveDown(1.5);
  const divY = doc.y;
  doc.rect(56, divY, pageW - 112, 0.5).fill('#3A4A51');

  // Metadata block
  doc.moveDown(1.5);
  const metaY = doc.y;
  const productTypeText = productTypes.length > 0
    ? productTypes.join(', ')
    : REPORT_META.product;
  const metaItems = [
    ['Producto', productTypeText],
    ['Tipo', REPORT_META.reportType],
    ['Fecha', generationDate],
    ['Versión', REPORT_META.version],
  ];

  let currentMetaY = metaY;
  metaItems.forEach(([label, value]) => {
    applyFont(doc, { size: 8, font: 'Helvetica-Bold', color: '#8FA3AD' });
    doc.text(label.toUpperCase(), 56, currentMetaY);
    applyFont(doc, { size: 10, font: 'Helvetica', color: '#E4ECEF' });
    const valueHeight = doc.heightOfString(value, { width: pageW - 236 });
    doc.text(value, 180, currentMetaY, { width: pageW - 236 });
    currentMetaY += Math.max(valueHeight, 12) + 10;
  });

  // Risk summary block at bottom
  const summaryY = pageH - 200;
  doc.rect(56, summaryY, pageW - 112, 1).fill('#3A4A51');

  // KPI row on cover
  const kpiY = summaryY + 25;
  const kpiWidth = (pageW - 112) / 4;

  const kpiItems = [
    { label: 'TOTAL', value: totalVulnerabilities.toString(), color: COLORS.accent },
    { label: 'CRITICAL', value: (severityCounts['Critical'] || 0).toString(), color: COLORS.Critical },
    { label: 'HIGH', value: (severityCounts['High'] || 0).toString(), color: COLORS.High },
    { label: 'MEDIUM', value: (severityCounts['Medium'] || severityCounts['Medium Low'] || 0).toString(), color: COLORS.Medium },
  ];

  kpiItems.forEach((kpi, i) => {
    const x = 56 + (i * kpiWidth);
    // Value
    doc.fontSize(26).font('Helvetica-Bold').fillColor(kpi.color);
    doc.text(kpi.value, x, kpiY, { width: kpiWidth, align: 'center' });
    // Label
    doc.fontSize(8).font('Helvetica').fillColor('#64748B');
    doc.text(kpi.label, x, kpiY + 32, { width: kpiWidth, align: 'center' });
  });

  // Footer on cover
  doc.fontSize(8).font('Helvetica').fillColor('#475569');
  doc.text(`${REPORT_META.company} — Generado automáticamente`, 56, pageH - 82, { width: pageW - 112, align: 'center' });
}

// ── Page Header & Footer ─────────────────────────────────────

export function addHeaderFooter(doc, pageIndex, totalPages, sectionName = '') {
  const margins = PAGE.margins;

  // Footer only. The visual top header was removed to keep pages clean.
  doc.save();

  // Footer
  doc.rect(margins.left, PAGE.height - 40, PAGE.width, 0.5).fill(COLORS.gray200);

  // Footer left - classification
  applyFont(doc, TYPOGRAPHY.footer);
  doc.text(REPORT_META.classification, margins.left, PAGE.height - 30);

  // Footer center - company
  doc.text(REPORT_META.company, margins.left, PAGE.height - 30, { width: PAGE.width, align: 'center' });

  // Footer right - page number
  applyFont(doc, TYPOGRAPHY.pageNumber);
  doc.text(`${pageIndex + 1} / ${totalPages}`, margins.left, PAGE.height - 30, { width: PAGE.width, align: 'right' });

  doc.restore();
}

// ── Section Headers ──────────────────────────────────────────

export function drawSectionTitle(doc, title, sectionNumber) {
  ensureSpace(doc, 80);

  const startX = PAGE.margins.left;
  const y = doc.y;

  doc.save();
  doc.roundedRect(startX, y, PAGE.width, sectionNumber ? 46 : 36, 5).fill(COLORS.gray50);

  if (sectionNumber) {
    doc.rect(startX, y, 4, 46).fill(COLORS.accent);
    applyFont(doc, { size: 8, font: 'Helvetica-Bold', color: COLORS.accent });
    doc.text(`SECCIÓN ${sectionNumber}`, startX + 16, y + 8);
  }

  applyFont(doc, TYPOGRAPHY.sectionTitle);
  doc.text(title, startX + 16, sectionNumber ? y + 22 : y + 10, { width: PAGE.width - 28 });
  doc.restore();

  doc.y = y + (sectionNumber ? 62 : 52);
}

export function drawSubsectionTitle(doc, title) {
  ensureSpace(doc, 50);
  const startX = PAGE.margins.left;
  const y = doc.y;

  // Small accent rule
  doc.rect(startX, y + 3, 3, 14).fill(COLORS.accent);

  applyFont(doc, TYPOGRAPHY.sectionSubtitle);
  doc.text(title, startX + 12, y);
  doc.moveDown(0.7);
}

export function drawSubsection(doc, title) {
  ensureSpace(doc, 40);
  applyFont(doc, TYPOGRAPHY.subsection);
  doc.text(title, PAGE.margins.left);
  doc.moveDown(0.3);
}

// ── Separator ────────────────────────────────────────────────

export function drawSeparator(doc, style = 'light') {
  const y = doc.y + 8;
  const color = style === 'heavy' ? COLORS.gray300 : COLORS.gray200;
  const width = style === 'heavy' ? 1 : 0.5;
  doc.rect(PAGE.margins.left, y, PAGE.width, width).fill(color);
  doc.y = y + SPACING.md;
}

// ── KPI Cards ────────────────────────────────────────────────

export function drawKPIRow(doc, kpis) {
  ensureSpace(doc, 100);
  const startX = PAGE.margins.left;
  const cardGap = 10;
  const cardWidth = (PAGE.width - (cardGap * (kpis.length - 1))) / kpis.length;
  const cardHeight = 72;
  const y = doc.y;

  kpis.forEach((kpi, i) => {
    const x = startX + (i * (cardWidth + cardGap));

    // Card background
    doc.save();
    doc.roundedRect(x, y, cardWidth, cardHeight, 5)
      .fillAndStroke(COLORS.white, COLORS.gray200);

    // Left accent bar
    doc.rect(x, y + 8, 3, cardHeight - 16).fill(kpi.color || COLORS.accent);

    // Value
    doc.fontSize(22).font('Helvetica-Bold').fillColor(kpi.color || COLORS.primary);
    doc.text(kpi.value, x + 10, y + 18, { width: cardWidth - 20, align: 'center' });

    // Label
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.gray500);
    doc.text(kpi.label, x + 10, y + 48, { width: cardWidth - 20, align: 'center' });

    doc.restore();
  });

  doc.y = y + cardHeight + SPACING.xl;
}

// ── Severity Badge / Pill ────────────────────────────────────

export function drawSeverityBadge(doc, severity, x, y) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG['Info'];
  const text = severity.toUpperCase();
  const width = Math.max(doc.widthOfString(text, { fontSize: 7 }) + 14, 50);
  const height = 15;

  doc.save();
  // Pill background
  doc.roundedRect(x, y, width, height, 7.5).fill(config.bg);
  // Pill border
  doc.roundedRect(x, y, width, height, 7.5).strokeColor(config.border).lineWidth(0.5).stroke();
  // Dot indicator
  doc.circle(x + 8, y + height / 2, 2.5).fill(config.color);
  // Text
  doc.fontSize(7).font('Helvetica-Bold').fillColor(config.color);
  doc.text(text, x + 14, y + 4, { width: width - 18, align: 'left' });
  doc.restore();

  return width;
}

export function drawSeverityIndicator(doc, severity, x, y, height = 18) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG['Info'];
  doc.rect(x, y, 3, height).fill(config.color);
}

// ── Professional Tables ──────────────────────────────────────

export function drawTable(doc, { headers, rows, colWidths, tableWidth, options = {} }) {
  const startX = PAGE.margins.left;
  const totalWidth = tableWidth || PAGE.width;
  const computedWidths = colWidths || headers.map(() => totalWidth / headers.length);
  const rowH = options.rowHeight || SPACING.tableRow;
  const headerH = options.headerHeight || SPACING.tableHeaderH;

  let currentY = doc.y;

  function drawHeaderRow(y) {
    // Header background with rounded top
    doc.save();
    doc.roundedRect(startX, y, totalWidth, headerH, 4).fill(COLORS.tableBg);
    doc.rect(startX, y + headerH - 1, totalWidth, 1).fill(COLORS.accent);
    doc.restore();

    let xOffset = startX;
    headers.forEach((h, i) => {
      applyFont(doc, TYPOGRAPHY.tableHeader);
      const align = options.alignments?.[i] || (i === 0 ? 'left' : 'center');
      doc.text(h, xOffset + 8, y + 8, { width: computedWidths[i] - 16, align });
      xOffset += computedWidths[i];
    });

    return y + headerH;
  }

  currentY = drawHeaderRow(currentY);

  // Table body
  rows.forEach((row, rowIdx) => {
    // Page break check
    if (currentY > PAGE.height - PAGE.margins.bottom - rowH - 20) {
      doc.addPage();
      currentY = PAGE.margins.top + 30;
      currentY = drawHeaderRow(currentY);
    }

    // Alternating row background
    const bgColor = rowIdx % 2 === 0 ? COLORS.white : COLORS.gray50;
    doc.rect(startX, currentY, totalWidth, rowH).fill(bgColor);

    // Bottom border for each row
    doc.rect(startX, currentY + rowH - 0.5, totalWidth, 0.5).fill(COLORS.gray200);

    // Severity color indicator (left border) if first column looks like severity
    if (options.severityColumn !== undefined) {
      const sevValue = row[options.severityColumn];
      const config = SEVERITY_CONFIG[sevValue];
      if (config) {
        doc.rect(startX, currentY, 3, rowH).fill(config.color);
      }
    }

    // Cell content
    let xOffset = startX;
    row.forEach((cell, i) => {
      const isSeverity = options.severityColumn === i;
      if (isSeverity) {
        drawSeverityBadge(doc, cell, xOffset + 6, currentY + 3);
      } else {
        const style = options.boldColumns?.includes(i) ? TYPOGRAPHY.tableCellBold : TYPOGRAPHY.tableCell;
        applyFont(doc, style);

        // Custom cell color
        if (options.cellColors?.[i]) {
          const colorFn = options.cellColors[i];
          const color = typeof colorFn === 'function' ? colorFn(cell, row) : colorFn;
          if (color) doc.fillColor(color);
        }

        const align = options.alignments?.[i] || (i === 0 ? 'left' : 'center');
        doc.text(cell, xOffset + 8, currentY + 6, {
          width: computedWidths[i] - 16,
          align,
          height: rowH - 8,
          ellipsis: true
        });
      }
      xOffset += computedWidths[i];
    });

    currentY += rowH;
  });

  doc.y = currentY + SPACING.lg;
}

// ── Bar Chart (Professional) ─────────────────────────────────

export function drawBarChart(doc, { title, data, colors, maxWidth }) {
  ensureSpace(doc, 60 + (Object.keys(data).length * 28));

  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const maxValue = Math.max(...entries.map(e => e[1]), 1);
  const barHeight = 22;
  const gap = 10;
  const labelWidth = 140;
  const chartWidth = (maxWidth || PAGE.width) - labelWidth - 60;
  const startX = PAGE.margins.left;

  if (title) {
    drawSubsection(doc, title);
    doc.moveDown(0.3);
  }

  let currentY = doc.y;

  entries.forEach(([label, value]) => {
    if (currentY > PAGE.height - PAGE.margins.bottom - 50) return;

    const barWidth = Math.max((value / maxValue) * chartWidth, 2);
    const color = colors?.[label] || COLORS.accent;

    // Label
    applyFont(doc, TYPOGRAPHY.caption);
    doc.text(
      label.length > 25 ? label.substring(0, 25) + '...' : label,
      startX, currentY + 4, { width: labelWidth - 10 }
    );

    // Bar background (track)
    doc.roundedRect(startX + labelWidth, currentY + 2, chartWidth, barHeight - 4, 3).fill(COLORS.gray100);

    // Bar fill
    doc.roundedRect(startX + labelWidth, currentY + 2, barWidth, barHeight - 4, 3).fill(color);

    // Value label
    applyFont(doc, TYPOGRAPHY.tableCellBold);
    doc.text(value.toString(), startX + labelWidth + barWidth + 8, currentY + 4);

    currentY += barHeight + gap;
  });

  doc.y = currentY + SPACING.lg;
}

// ── Stat Cards (inline) ──────────────────────────────────────

export function drawStatCard(doc, { x, y, width, height, value, label, color, percentage }) {
  doc.save();

  // Card border
  doc.roundedRect(x, y, width, height, 4)
    .fillAndStroke(COLORS.white, COLORS.gray200);

  // Left color accent
  doc.rect(x, y + 4, 3, height - 8).fill(color || COLORS.accent);

  // Value
  doc.fontSize(18).font('Helvetica-Bold').fillColor(color || COLORS.primary);
  doc.text(value, x + 12, y + 12, { width: width - 24 });

  // Label
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.gray500);
  doc.text(label, x + 12, y + 34, { width: width - 24 });

  // Percentage if provided
  if (percentage !== undefined) {
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.gray400);
    doc.text(`${percentage}%`, x + 12, y + height - 20, { width: width - 24 });
  }

  doc.restore();
}

// ── Vulnerability Detail Card ────────────────────────────────

export function drawVulnCard(doc, vuln, index) {
  ensureSpace(doc, 100);

  const startX = PAGE.margins.left;
  const y = doc.y;
  const cardWidth = PAGE.width;
  const config = SEVERITY_CONFIG[vuln.severity] || SEVERITY_CONFIG['Info'];

  // Card container with subtle background
  doc.save();

  // Left severity indicator
  doc.rect(startX, y, 3, 70).fill(config.color);

  // Card background
  doc.rect(startX + 3, y, cardWidth - 3, 70).fill(COLORS.gray50);

  // Index and title
  doc.fontSize(9).font('Helvetica-Bold').fillColor(config.color);
  doc.text(`${index}. ${vuln.title || vuln.component}`, startX + 12, y + 8, { width: cardWidth - 80 });

  // Severity badge
  drawSeverityBadge(doc, vuln.severity, startX + cardWidth - 65, y + 6);

  // Metadata row
  const metaY = y + 24;
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.gray600);

  const metaParts = [];
  if (vuln.component) metaParts.push(`Componente: ${vuln.component} v${vuln.version}`);
  if (vuln.cvss) metaParts.push(`CVSS: ${vuln.cvss}`);
  if (vuln.vulnerabilityIds) metaParts.push(`CVE: ${vuln.vulnerabilityIds}`);
  doc.text(metaParts.join('  |  '), startX + 12, metaY, { width: cardWidth - 24 });

  // Description
  if (vuln.description) {
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.gray600);
    doc.text(vuln.description, startX + 12, metaY + 14, {
      width: cardWidth - 24, height: 20, ellipsis: true
    });
  }

  // Solution
  if (vuln.solution || vuln.mitigation) {
    const solY = metaY + 32;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.success);
    doc.text('FIX: ', startX + 12, solY, { continued: true });
    doc.font('Helvetica').fillColor(COLORS.gray700);
    doc.text(vuln.mitigation || vuln.solution, { width: cardWidth - 60, height: 12, ellipsis: true });
  }

  doc.restore();
  doc.y = y + 78;
}

// ── Risk Score Visualization ─────────────────────────────────

export function drawRiskGauge(doc, { score, maxScore = 10, x, y, width = 200 }) {
  const height = 12;
  const fillWidth = (score / maxScore) * width;

  // Track
  doc.roundedRect(x, y, width, height, 6).fill(COLORS.gray200);

  // Fill with gradient approximation
  let fillColor = COLORS.success;
  if (score > 7) fillColor = COLORS.Critical;
  else if (score > 5) fillColor = COLORS.High;
  else if (score > 3) fillColor = COLORS.Medium;

  doc.roundedRect(x, y, fillWidth, height, 6).fill(fillColor);

  // Score text
  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.gray700);
  doc.text(`${score.toFixed(1)}/${maxScore}`, x + width + 8, y + 2);
}

// ── Progress Bar ─────────────────────────────────────────────

export function drawProgressBar(doc, { x, y, width, percentage, color, label }) {
  const height = 8;
  const fillWidth = (percentage / 100) * width;

  // Track
  doc.roundedRect(x, y, width, height, 4).fill(COLORS.gray200);
  // Fill
  doc.roundedRect(x, y, fillWidth, height, 4).fill(color || COLORS.accent);

  if (label) {
    doc.fontSize(7).font('Helvetica').fillColor(COLORS.gray500);
    doc.text(label, x, y + height + 2, { width });
  }
}

// ── Donut/Ring Summary ───────────────────────────────────────

export function drawSeverityDistribution(doc, severityCounts, total) {
  ensureSpace(doc, 60);

  const startX = PAGE.margins.left;
  const y = doc.y;
  const barWidth = PAGE.width;
  const barHeight = 24;

  // Full-width stacked bar
  let xOffset = startX;
  const orderedSeverities = ['Critical', 'High', 'Medium High', 'Medium', 'Medium Low', 'Low', 'Info'];

  orderedSeverities.forEach(sev => {
    const count = severityCounts[sev] || 0;
    if (count === 0) return;
    const segWidth = (count / total) * barWidth;
    const config = SEVERITY_CONFIG[sev];
    if (!config) return;

    doc.rect(xOffset, y, segWidth, barHeight).fill(config.color);

    // Label if segment is wide enough
    if (segWidth > 30) {
      doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.white);
      doc.text(count.toString(), xOffset, y + 4, { width: segWidth, align: 'center' });
      doc.fontSize(6).font('Helvetica').fillColor(COLORS.white);
      doc.text(sev, xOffset, y + 14, { width: segWidth, align: 'center' });
    }

    xOffset += segWidth;
  });

  // Legend row below
  doc.y = y + barHeight + 16;
  xOffset = startX;
  orderedSeverities.forEach(sev => {
    const count = severityCounts[sev] || 0;
    if (count === 0) return;
    const config = SEVERITY_CONFIG[sev];
    if (!config) return;

    doc.circle(xOffset + 4, doc.y + 4, 4).fill(config.color);
    doc.fontSize(7.5).font('Helvetica').fillColor(COLORS.gray600);
    doc.text(`${sev} (${count})`, xOffset + 12, doc.y, { continued: false });

    xOffset += 85;
    if (xOffset > startX + barWidth - 85) {
      xOffset = startX;
      doc.moveDown(0.5);
    }
  });

  doc.moveDown(1.2);
}

// ── Info Box ─────────────────────────────────────────────────

export function drawInfoBox(doc, text, type = 'info') {
  ensureSpace(doc, 60);

  const colors = {
    info: { bg: '#ECFDF5', border: COLORS.accent, text: '#065F46' },
    warning: { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E' },
    success: { bg: '#F0FDF4', border: '#16A34A', text: '#166534' },
    danger: { bg: '#FEF2F2', border: '#DC2626', text: '#991B1B' },
  };

  const c = colors[type] || colors.info;
  const startX = PAGE.margins.left;
  const width = PAGE.width;
  const padding = 14;

  const textHeight = doc.heightOfString(text, { width: width - padding * 2 - 12, fontSize: 9 });
  const boxHeight = textHeight + padding * 2 + 4;
  const boxY = doc.y;

  doc.roundedRect(startX, boxY, width, boxHeight, 4).fill(c.bg);
  doc.rect(startX, boxY, 3, boxHeight).fill(c.border);

  doc.fontSize(9).font('Helvetica').fillColor(c.text);
  doc.text(text, startX + padding + 8, boxY + padding, { width: width - padding * 2 - 12 });

  doc.y = boxY + boxHeight + SPACING.md;
}

// ── Table of Contents Entry ──────────────────────────────────

export function drawTOCEntry(doc, { number, title, page, level = 0 }) {
  const startX = PAGE.margins.left + (level * 20);
  const y = doc.y;
  const dotWidth = PAGE.width - 60;

  // Number
  applyFont(doc, { size: 10, font: 'Helvetica-Bold', color: level === 0 ? COLORS.primary : COLORS.gray600 });
  doc.text(number, startX, y);

  // Title
  const titleX = startX + 30;
  applyFont(doc, { size: 10, font: level === 0 ? 'Helvetica-Bold' : 'Helvetica', color: COLORS.gray800 });
  doc.text(title, titleX, y);

  // Page number
  applyFont(doc, { size: 10, font: 'Helvetica-Bold', color: COLORS.gray500 });
  doc.text(page.toString(), startX, y, { width: PAGE.width - (level * 20), align: 'right' });

  // Dot leader
  const titleEnd = titleX + doc.widthOfString(title) + 5;
  const pageStart = startX + PAGE.width - (level * 20) - 20;
  if (pageStart > titleEnd) {
    doc.fontSize(8).fillColor(COLORS.gray300);
    const dots = '.'.repeat(Math.floor((pageStart - titleEnd) / 3.5));
    doc.text(dots, titleEnd, y + 1, { width: pageStart - titleEnd });
  }

  doc.y = y + 20;
}
