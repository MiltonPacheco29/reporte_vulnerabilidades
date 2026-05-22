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

export function drawCoverPage(doc, { sprintName, totalVulnerabilities, severityCounts, generationDate }) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // Full-page dark background
  doc.rect(0, 0, pageW, pageH).fill(COLORS.coverBg);

  // Accent bar at top
  doc.rect(0, 0, pageW, 6).fill(COLORS.accent);

  // Left accent stripe
  doc.rect(0, 0, 4, pageH).fill(COLORS.accent);

  // Geometric decoration - subtle grid pattern
  doc.save();
  doc.opacity(0.03);
  for (let i = 0; i < 20; i++) {
    doc.rect(40 + (i * 28), 80, 1, pageH - 160).fill(COLORS.white);
  }
  for (let i = 0; i < 30; i++) {
    doc.rect(40, 80 + (i * 28), pageW - 80, 0.5).fill(COLORS.white);
  }
  doc.restore();

  // Classification badge
  doc.save();
  const classW = 120;
  const classH = 22;
  const classX = pageW - classW - 40;
  const classY = 35;
  doc.roundedRect(classX, classY, classW, classH, 3).fill('#DC2626');
  applyFont(doc, { size: 8, font: 'Helvetica-Bold', color: COLORS.white });
  doc.text(REPORT_META.classification, classX, classY + 7, { width: classW, align: 'center' });
  doc.restore();

  // Main title block - positioned at golden ratio
  const titleY = pageH * 0.30;

  // Accent line before title
  doc.rect(56, titleY - 20, 60, 3).fill(COLORS.accent);

  // Report type label
  applyFont(doc, { size: 11, font: 'Helvetica', color: '#64748B' });
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
  doc.rect(56, divY, pageW - 112, 0.5).fill('#334155');

  // Metadata block
  doc.moveDown(1.5);
  const metaY = doc.y;
  const metaItems = [
    ['Producto', REPORT_META.product],
    ['Tipo', REPORT_META.reportType],
    ['Fecha', generationDate],
    ['Versión', REPORT_META.version],
  ];

  metaItems.forEach(([label, value], i) => {
    const y = metaY + (i * 22);
    applyFont(doc, { size: 9, font: 'Helvetica', color: '#64748B' });
    doc.text(label.toUpperCase(), 56, y);
    applyFont(doc, { size: 10, font: 'Helvetica-Bold', color: '#E2E8F0' });
    doc.text(value, 180, y);
  });

  // Risk summary block at bottom
  const summaryY = pageH - 200;
  doc.rect(56, summaryY, pageW - 112, 1).fill('#334155');

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
  doc.text(`${REPORT_META.company} — Generado automáticamente`, 56, pageH - 50, { width: pageW - 112, align: 'center' });
}

// ── Page Header & Footer ─────────────────────────────────────

export function addHeaderFooter(doc, pageIndex, totalPages, sectionName = '') {
  const pageW = doc.page.width;
  const margins = PAGE.margins;

  // Header
  doc.save();
  // Top accent line
  doc.rect(0, 0, pageW, 3).fill(COLORS.accent);

  // Header bar
  doc.rect(margins.left, 20, PAGE.width, 20).fill('transparent');
  applyFont(doc, TYPOGRAPHY.header);
  doc.text(REPORT_META.reportType.toUpperCase(), margins.left, 26);

  if (sectionName) {
    doc.text(sectionName, margins.left, 26, { width: PAGE.width, align: 'right' });
  }

  // Header divider
  doc.rect(margins.left, 42, PAGE.width, 0.5).fill(COLORS.gray200);

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

  // Section number accent
  if (sectionNumber) {
    doc.rect(startX, y, 4, 28).fill(COLORS.accent);
    applyFont(doc, { size: 10, font: 'Helvetica-Bold', color: COLORS.accent });
    doc.text(`SECCIÓN ${sectionNumber}`, startX + 14, y + 2);
  }

  // Title
  applyFont(doc, TYPOGRAPHY.sectionTitle);
  doc.text(title, startX + 14, sectionNumber ? y + 14 : y, { width: PAGE.width - 20 });

  // Underline
  const lineY = doc.y + 8;
  doc.rect(startX, lineY, PAGE.width, 1.5).fill(COLORS.primary);
  doc.rect(startX, lineY + 2, 60, 1.5).fill(COLORS.accent);
  doc.y = lineY + SPACING.xl;
}

export function drawSubsectionTitle(doc, title) {
  ensureSpace(doc, 50);
  const startX = PAGE.margins.left;
  const y = doc.y;

  // Small accent dot
  doc.circle(startX + 4, y + 6, 3).fill(COLORS.accent);

  applyFont(doc, TYPOGRAPHY.sectionSubtitle);
  doc.text(title, startX + 14, y);
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
  const cardGap = 12;
  const cardWidth = (PAGE.width - (cardGap * (kpis.length - 1))) / kpis.length;
  const cardHeight = 76;
  const y = doc.y;

  kpis.forEach((kpi, i) => {
    const x = startX + (i * (cardWidth + cardGap));

    // Card background
    doc.save();
    doc.roundedRect(x, y, cardWidth, cardHeight, 4).fill(COLORS.gray50);

    // Top accent bar
    doc.rect(x, y, cardWidth, 3).fill(kpi.color || COLORS.accent);

    // Value
    doc.fontSize(22).font('Helvetica-Bold').fillColor(kpi.color || COLORS.primary);
    doc.text(kpi.value, x, y + 20, { width: cardWidth, align: 'center' });

    // Label
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.gray500);
    doc.text(kpi.label, x, y + 52, { width: cardWidth, align: 'center' });

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
  const showBorder = options.showBorder !== false;

  let currentY = doc.y;

  function drawHeaderRow(y) {
    // Header background with rounded top
    doc.save();
    doc.roundedRect(startX, y, totalWidth, headerH, 3).fill(COLORS.headerBg);
    // Make bottom corners square
    doc.rect(startX, y + headerH - 3, totalWidth, 3).fill(COLORS.headerBg);
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

  // Table outer border
  if (showBorder) {
    const tableH = currentY - doc.y + headerH + (rows.length * rowH);
    doc.save();
    doc.roundedRect(startX, doc.y, totalWidth, currentY - doc.y + headerH, 3)
      .strokeColor(COLORS.gray200).lineWidth(0.5).stroke();
    doc.restore();
  }

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
    info: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
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
