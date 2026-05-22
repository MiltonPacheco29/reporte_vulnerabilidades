// ============================================================
// SECTION RENDERERS - Enterprise Report Sections
// ============================================================
// Each function renders a complete section of the PDF report

import {
  COLORS, TAG_COLORS, SEVERITY_CONFIG, TYPOGRAPHY, SPACING,
  PAGE, REPORT_META, TAG_DESCRIPTIONS, TAG_GROUPS, SEVERITY_ORDER
} from '../config/index.mjs';

import {
  ensureSpace, applyFont, drawCoverPage, drawSectionTitle,
  drawSubsectionTitle, drawSubsection, drawSeparator, drawKPIRow,
  drawSeverityBadge, drawSeverityIndicator, drawTable, drawBarChart,
  drawStatCard, drawVulnCard, drawRiskGauge, drawProgressBar,
  drawSeverityDistribution, drawInfoBox, drawTOCEntry
} from './components.mjs';

// ── 0. Cover Page ────────────────────────────────────────────

export function renderCover(doc, analysis, sprintName) {
  const generationDate = new Date().toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  drawCoverPage(doc, {
    sprintName,
    totalVulnerabilities: analysis.totalVulnerabilities,
    severityCounts: analysis.severityCounts,
    generationDate
  });
}

// ── 1. Table of Contents ─────────────────────────────────────

export function renderTableOfContents(doc) {
  doc.addPage();
  drawSectionTitle(doc, 'Contenido', null);
  doc.moveDown(1);

  const tocEntries = [
    { number: '01', title: 'Resumen Ejecutivo', page: 3 },
    { number: '02', title: 'Análisis por Tipo de Vulnerabilidad', page: 4 },
    { number: '03', title: 'Análisis por Servicio y Severidad', page: 5 },
    { number: '04', title: 'Detalle de Vulnerabilidades', page: 6 },
    { number: '05', title: 'Top 10 Vulnerabilidades Más Urgentes', page: '-' },
    { number: '06', title: 'Análisis de SLA', page: '-' },
    { number: '07', title: 'Vulnerabilidades Compartidas', page: '-' },
    { number: '08', title: 'Componentes Más Vulnerables', page: '-' },
    { number: '09', title: 'Cobertura de Mitigación', page: '-' },
    { number: '10', title: 'Herramientas y Ambientes', page: '-' },
  ];

  tocEntries.forEach(entry => {
    drawTOCEntry(doc, entry);
  });

  doc.moveDown(2);
  drawInfoBox(doc, `Este reporte contiene información clasificada como ${REPORT_META.classification}. Su distribución está restringida al equipo de seguridad y stakeholders autorizados.`, 'warning');
}

// ── 2. Executive Summary ─────────────────────────────────────

export function renderExecutiveSummary(doc, analysis) {
  doc.addPage();
  drawSectionTitle(doc, 'Resumen Ejecutivo', '01');
  doc.moveDown(1);

  // Introduction paragraph
  applyFont(doc, TYPOGRAPHY.body);
  doc.text(
    `Se identificaron un total de ${analysis.totalVulnerabilities} vulnerabilidades activas en el análisis actual. ` +
    `El siguiente resumen presenta los indicadores clave de riesgo y la distribución por severidad.`,
    PAGE.margins.left
  );
  doc.moveDown(1);

  // KPI Cards
  const critCount = analysis.severityCounts['Critical'] || 0;
  const highCount = analysis.severityCounts['High'] || 0;
  const medCount = (analysis.severityCounts['Medium'] || 0) + (analysis.severityCounts['Medium Low'] || 0) + (analysis.severityCounts['Medium High'] || 0);
  const lowCount = (analysis.severityCounts['Low'] || 0) + (analysis.severityCounts['Info'] || 0);

  drawKPIRow(doc, [
    { label: 'TOTAL VULNS', value: analysis.totalVulnerabilities.toString(), color: COLORS.primary },
    { label: 'CRITICAL', value: critCount.toString(), color: COLORS.Critical },
    { label: 'HIGH', value: highCount.toString(), color: COLORS.High },
    { label: 'MEDIUM', value: medCount.toString(), color: COLORS.Medium },
  ]);

  doc.moveDown(0.5);

  // Secondary KPIs
  const slaVencido = analysis.slaAnalysis.vencido.length;
  const withFix = analysis.mitigationCoverage.withFix;
  const services = Object.keys(analysis.byEngagementSeverity).length;

  drawKPIRow(doc, [
    { label: 'LOW / INFO', value: lowCount.toString(), color: COLORS.Low },
    { label: 'SLA VENCIDO', value: slaVencido.toString(), color: slaVencido > 0 ? COLORS.danger : COLORS.success },
    { label: 'CON FIX', value: `${((withFix / analysis.totalVulnerabilities) * 100).toFixed(0)}%`, color: COLORS.success },
    { label: 'SERVICIOS', value: services.toString(), color: COLORS.accent },
  ]);

  doc.moveDown(1);

  // Severity distribution bar
  drawSubsectionTitle(doc, 'Distribución por Severidad');
  doc.moveDown(0.5);
  drawSeverityDistribution(doc, analysis.severityCounts, analysis.totalVulnerabilities);

  doc.moveDown(0.5);

  // Severity table
  drawTable(doc, {
    headers: ['Severidad', 'Cantidad', '% del Total', 'Riesgo'],
    rows: Object.entries(analysis.severityCounts)
      .sort((a, b) => (SEVERITY_ORDER[a[0]] ?? 99) - (SEVERITY_ORDER[b[0]] ?? 99))
      .map(([sev, count]) => [
        sev,
        count.toString(),
        ((count / analysis.totalVulnerabilities) * 100).toFixed(1) + '%',
        SEVERITY_ORDER[sev] <= 1 ? 'ALTO' : SEVERITY_ORDER[sev] <= 3 ? 'MEDIO' : 'BAJO'
      ]),
    colWidths: [PAGE.width * 0.30, PAGE.width * 0.20, PAGE.width * 0.25, PAGE.width * 0.25],
    tableWidth: PAGE.width,
    options: {
      severityColumn: 0,
      boldColumns: [1],
      alignments: ['left', 'center', 'center', 'center']
    }
  });
}

// ── 3. Tags Analysis ─────────────────────────────────────────

export function renderTagsAnalysis(doc, analysis) {
  ensureSpace(doc, 260);
  doc.moveDown(1);
  drawSectionTitle(doc, 'Análisis por Tipo de Vulnerabilidad', '02');
  doc.moveDown(1);

  applyFont(doc, TYPOGRAPHY.body);
  doc.text('Clasificación de vulnerabilidades según su tipo de escaneo o fuente de detección:', PAGE.margins.left);
  doc.moveDown(1.2);

  drawTable(doc, {
    headers: ['Tipo (Tag)', 'Cantidad', '% del Total'],
    rows: Object.entries(analysis.byTags)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => [
        tag,
        count.toString(),
        ((count / analysis.totalVulnerabilities) * 100).toFixed(1) + '%'
      ]),
    colWidths: [PAGE.width * 0.50, PAGE.width * 0.25, PAGE.width * 0.25],
    tableWidth: PAGE.width,
    options: {
      boldColumns: [1],
      alignments: ['left', 'center', 'center']
    }
  });

  doc.moveDown(1);
  drawBarChart(doc, {
    title: 'Vulnerabilidades por Tipo',
    data: analysis.byTags,
    colors: TAG_COLORS,
    maxWidth: PAGE.width
  });

  // Tag descriptions
  doc.moveDown(1);
  drawSubsectionTitle(doc, 'Descripción de Tipos');
  doc.moveDown(0.4);

  Object.entries(TAG_DESCRIPTIONS).forEach(([tag, desc]) => {
    ensureSpace(doc, 30);
    const tagColor = TAG_COLORS[tag] || COLORS.gray500;
    // Draw a colored circle as bullet (graphic, not unicode)
    doc.circle(PAGE.margins.left + 4, doc.y + 5, 3).fill(tagColor);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(tagColor)
      .text(`${tag}`, PAGE.margins.left + 12, doc.y, { continued: true });
    doc.font('Helvetica').fillColor(COLORS.gray600)
      .text(`: ${desc}`);
    doc.moveDown(0.4);
  });
}

// ── 4. Engagement Severity Matrix ────────────────────────────

export function renderEngagementSeverity(doc, analysis) {
  ensureSpace(doc, 300);
  doc.moveDown(1);
  drawSectionTitle(doc, 'Análisis por Servicio y Severidad', '03');
  doc.moveDown(1);

  applyFont(doc, TYPOGRAPHY.body);
  doc.text('Distribución de vulnerabilidades por servicio (engagement) y nivel de severidad:', PAGE.margins.left);
  doc.moveDown(1.2);

  const severityColumns = ['Info', 'Low', 'Medium', 'High', 'Critical'];
  const engagements = Object.entries(analysis.byEngagementSeverity)
    .sort((a, b) => {
      const totalA = Object.values(a[1]).reduce((s, v) => s + v, 0);
      const totalB = Object.values(b[1]).reduce((s, v) => s + v, 0);
      return totalB - totalA;
    });

  const rows = engagements.map(([engagement, sevMap]) => {
    const total = Object.values(sevMap).reduce((s, v) => s + v, 0);
    const shortName = engagement.length > 40 ? engagement.substring(0, 40) + '...' : engagement;
    return [
      shortName,
      (sevMap['Info'] || 0).toString(),
      (sevMap['Low'] || 0).toString(),
      (sevMap['Medium'] || sevMap['Medium Low'] || 0).toString(),
      (sevMap['High'] || sevMap['Medium High'] || 0).toString(),
      (sevMap['Critical'] || 0).toString(),
      total.toString()
    ];
  });

  const headers = ['Servicio', 'Info', 'Low', 'Med', 'High', 'Crit', 'Total'];
  const colWidths = [
    PAGE.width * 0.37,
    PAGE.width * 0.09,
    PAGE.width * 0.09,
    PAGE.width * 0.09,
    PAGE.width * 0.09,
    PAGE.width * 0.09,
    PAGE.width * 0.10,
  ];

  // Adjust for rounding
  const remainder = PAGE.width - colWidths.reduce((a, b) => a + b, 0);
  colWidths[0] += remainder;

  drawTable(doc, {
    headers,
    rows,
    colWidths,
    tableWidth: PAGE.width,
    options: {
      boldColumns: [6],
      alignments: ['left', 'center', 'center', 'center', 'center', 'center', 'center'],
      cellColors: {
        4: (cell) => parseInt(cell) > 0 ? COLORS.High : null,
        5: (cell) => parseInt(cell) > 0 ? COLORS.Critical : null,
      }
    }
  });
}

// ── 5. Vulnerability Detail ──────────────────────────────────

export function renderVulnerabilityDetail(doc, analysis) {
  ensureSpace(doc, 200);
  doc.moveDown(1);
  drawSectionTitle(doc, 'Detalle de Vulnerabilidades por Servicio', '04');
  doc.moveDown(0.5);

  applyFont(doc, TYPOGRAPHY.bodySmall);
  doc.text(
    'Vulnerabilidades únicas por servicio, organizadas por tipo. Dentro de cada tipo: primero servicios productivos, luego servicios de test.',
    PAGE.margins.left
  );
  doc.moveDown(1);

  // Render each tag group
  renderTypeSection(doc, analysis, 1, 'Hacking Continuo (Fluid Attacks)',
    'Vulnerabilidades detectadas mediante pentesting continuo por Fluid Attacks.',
    TAG_GROUPS['fluidattacks']);

  renderTypeSection(doc, analysis, 2, 'C2C (Continuous Compliance)',
    'Vulnerabilidades de configuración y cumplimiento en recursos AWS.',
    TAG_GROUPS['c2c']);

  renderTypeSection(doc, analysis, 3, 'IAC / NGC / NG DEP',
    'Vulnerabilidades de dependencias, contenedores, infraestructura como código y listas negras.',
    TAG_GROUPS['IAC/NGC/NG DEP']);
}

function renderTypeSection(doc, analysis, sectionNum, title, description, tagGroup) {
  ensureSpace(doc, 100);
  doc.moveDown(0.5);

  // Section header with accent
  const y = doc.y;
  doc.rect(PAGE.margins.left, y, PAGE.width, 28).fill(COLORS.gray50);
  doc.rect(PAGE.margins.left, y, 4, 28).fill(COLORS.accent);

  applyFont(doc, { size: 12, font: 'Helvetica-Bold', color: COLORS.primary });
  doc.text(`4.${sectionNum} ${title}`, PAGE.margins.left + 14, y + 4);
  applyFont(doc, TYPOGRAPHY.caption);
  doc.text(description, PAGE.margins.left + 14, y + 17);
  doc.y = y + 34;

  const engagementsByTag = getEngagementsByTagGroup(analysis.detailByEngagement, tagGroup);
  const { noTest, test } = splitAndSort(engagementsByTag);

  const totalVulns = [...noTest, ...test].reduce((sum, [, v]) => sum + v.length, 0);
  applyFont(doc, TYPOGRAPHY.bodySmall);
  doc.text(`Total vulnerabilidades: ${totalVulns}  |  Servicios afectados: ${noTest.length + test.length}`, PAGE.margins.left);
  doc.moveDown(0.5);

  renderEngagementGroup(doc, 'Servicios Productivos', noTest);
  renderEngagementGroup(doc, 'Servicios de Test', test);
}

function getEngagementsByTagGroup(detailByEngagement, allowedTags) {
  const result = {};
  Object.entries(detailByEngagement).forEach(([engagement, vulns]) => {
    const filtered = vulns.filter(v => allowedTags.includes(v.tag.toLowerCase()));
    if (filtered.length > 0) {
      result[engagement] = filtered;
    }
  });
  return result;
}

function splitAndSort(engagementsObj) {
  const all = Object.entries(engagementsObj);
  const noTest = all.filter(([eng]) => !/test/i.test(eng)).sort((a, b) => b[1].length - a[1].length);
  const test = all.filter(([eng]) => /test/i.test(eng)).sort((a, b) => b[1].length - a[1].length);
  return { noTest, test };
}

function renderEngagementGroup(doc, groupTitle, engagementsList) {
  if (engagementsList.length === 0) return;

  ensureSpace(doc, 80);
  doc.moveDown(0.8);

  // Group header
  applyFont(doc, { size: 10, font: 'Helvetica-Bold', color: COLORS.gray700 });
  doc.text(`> ${groupTitle}`, PAGE.margins.left);
  doc.moveDown(0.5);

  engagementsList.forEach(([engagement, vulns]) => {
    ensureSpace(doc, 100);

    const shortEngagement = engagement.length > 75 ? engagement.substring(0, 75) + '...' : engagement;

    // Engagement header bar - taller for better readability
    const engY = doc.y;
    doc.rect(PAGE.margins.left, engY, PAGE.width, 30).fill('#EFF6FF');
    doc.rect(PAGE.margins.left, engY, 3, 30).fill(COLORS.accent);

    applyFont(doc, { size: 9.5, font: 'Helvetica-Bold', color: COLORS.primary });
    doc.text(shortEngagement, PAGE.margins.left + 12, engY + 5);
    applyFont(doc, TYPOGRAPHY.caption);
    doc.text(`Producto: ${vulns[0]?.product || 'N/A'}  |  Vulnerabilidades: ${vulns.length}`, PAGE.margins.left + 12, engY + 18);
    doc.y = engY + 38;

    // Deduplicate and sort
    const uniqueVulns = deduplicateVulns(vulns);
    uniqueVulns.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99));

    // Render each vulnerability
    uniqueVulns.forEach((vuln, idx) => {
      ensureSpace(doc, 100);
      renderVulnItem(doc, vuln, idx + 1);
    });

    doc.moveDown(1.2);
  });
}

function deduplicateVulns(vulns) {
  const uniqueVulns = [];
  const seen = new Set();
  vulns.forEach(vuln => {
    const key = `${vuln.component}_${vuln.version}_${vuln.title}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueVulns.push(vuln);
    }
  });
  return uniqueVulns;
}

function renderVulnItem(doc, vuln, idx) {
  const startX = PAGE.margins.left + 10;
  const contentX = startX + 12;
  const contentWidth = PAGE.width - 50;
  const config = SEVERITY_CONFIG[vuln.severity] || SEVERITY_CONFIG['Info'];

  // ── Pre-compute heights for each block (so the severity bar matches actual content) ──
  const titleText = `${idx}. ${vuln.title || vuln.component}`;
  doc.fontSize(9).font('Helvetica-Bold');
  const titleHeight = doc.heightOfString(titleText, { width: contentWidth - 60 });

  const metaParts = [];
  if (vuln.tag) metaParts.push(`Tipo: ${vuln.tag}`);
  if (vuln.vulnerabilityIds) metaParts.push(`CVE: ${vuln.vulnerabilityIds}`);
  if (vuln.priority) metaParts.push(`Prioridad: ${vuln.priority}`);
  const metaText = metaParts.join('  |  ');

  doc.fontSize(7.5).font('Helvetica');
  const metaHeight = metaText ? doc.heightOfString(metaText, { width: contentWidth }) : 0;
  const fileHeight = vuln.filePath ? doc.heightOfString(`Archivo: ${vuln.filePath}`, { width: contentWidth }) : 0;

  doc.fontSize(8).font('Helvetica-Oblique');
  const descHeight = vuln.description ? Math.min(doc.heightOfString(vuln.description, { width: contentWidth }), 32) : 0;

  doc.fontSize(8).font('Helvetica-Bold');
  const mitText = vuln.mitigation ? `[Fix] ${vuln.mitigation}` : '';
  const mitHeight = mitText ? doc.heightOfString(mitText, { width: contentWidth - 30 }) : 0;

  const PADDING_TOP = 4;
  const GAP = 5;
  const PADDING_BOTTOM = 8;

  const totalHeight =
    PADDING_TOP +
    titleHeight +
    (metaHeight ? GAP + metaHeight : 0) +
    (fileHeight ? GAP + fileHeight : 0) +
    (descHeight ? GAP + descHeight : 0) +
    (mitHeight ? GAP + mitHeight : 0) +
    PADDING_BOTTOM;

  ensureSpace(doc, totalHeight + 14);

  const y = doc.y;

  // Severity indicator bar (matches actual card height)
  doc.rect(startX, y, 3, totalHeight).fill(config.color);

  // Title
  doc.fontSize(9).font('Helvetica-Bold').fillColor(config.color);
  doc.text(titleText, contentX, y + PADDING_TOP, { width: contentWidth - 60 });

  // Severity badge (top right, independent of cursor)
  drawSeverityBadge(doc, vuln.severity, PAGE.margins.left + PAGE.width - 65, y + PADDING_TOP);

  // Force cursor below title with exact gap
  let cursorY = y + PADDING_TOP + titleHeight;

  // Metadata row
  if (metaText) {
    cursorY += GAP;
    doc.fontSize(7.5).font('Helvetica').fillColor(COLORS.gray500);
    doc.text(metaText, contentX, cursorY, { width: contentWidth });
    cursorY += metaHeight;
  }

  // File path
  if (vuln.filePath) {
    cursorY += GAP;
    doc.fontSize(7.5).font('Helvetica').fillColor(COLORS.gray500);
    doc.text(`Archivo: ${vuln.filePath}`, contentX, cursorY, { width: contentWidth });
    cursorY += fileHeight;
  }

  // Description
  if (vuln.description) {
    cursorY += GAP;
    doc.fontSize(8).font('Helvetica-Oblique').fillColor(COLORS.gray600);
    doc.text(vuln.description, contentX, cursorY, { width: contentWidth, height: descHeight, ellipsis: true });
    cursorY += descHeight;
  }

  // Mitigation
  if (mitText) {
    cursorY += GAP;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.success);
    doc.text('[Fix] ', contentX, cursorY, { continued: true });
    doc.font('Helvetica').fillColor(COLORS.gray700);
    doc.text(vuln.mitigation, { width: contentWidth - 30 });
    cursorY += mitHeight;
  }

  // Separator with breathing room
  const sepY = y + totalHeight + 4;
  doc.rect(contentX, sepY, contentWidth - 10, 0.4).fill(COLORS.gray200);
  doc.y = sepY + 10;
}

// ── 6. Top 10 Urgent ─────────────────────────────────────────

export function renderTopUrgent(doc, analysis) {
  ensureSpace(doc, 200);
  doc.moveDown(1);
  drawSectionTitle(doc, 'Top 10 Vulnerabilidades Más Urgentes', '05');
  doc.moveDown(1);

  applyFont(doc, { size: 8.5, font: 'Helvetica-Oblique', color: COLORS.gray600 });
  doc.text(
    'Nota: Priorización basada en CVSS Score × 0.7 + EPSS Percentil × 0.3. Mayor puntaje combinado = mayor urgencia de remediación.',
    PAGE.margins.left,
    doc.y,
    { width: PAGE.width }
  );
  doc.moveDown(0.9);

  analysis.topUrgent.forEach((vuln, idx) => {
    ensureSpace(doc, 95);
    const config = SEVERITY_CONFIG[vuln.severity] || SEVERITY_CONFIG['Info'];
    const y = doc.y;

    // Card background - taller with more internal space
    doc.rect(PAGE.margins.left, y, PAGE.width, 72).fill(idx < 3 ? '#FEF2F2' : COLORS.gray50);
    doc.rect(PAGE.margins.left, y, 4, 72).fill(config.color);

    // Rank number
    doc.fontSize(16).font('Helvetica-Bold').fillColor(config.color);
    doc.text(`#${idx + 1}`, PAGE.margins.left + 12, y + 10);

    // Title
    const titleText = vuln.title.length > 65 ? vuln.title.substring(0, 65) + '...' : vuln.title;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.gray800);
    doc.text(titleText, PAGE.margins.left + 48, y + 10, { width: PAGE.width - 130 });

    // Severity badge
    drawSeverityBadge(doc, vuln.severity, PAGE.margins.left + PAGE.width - 68, y + 8);

    // Scores
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.gray600);
    doc.text(
      `CVSS: ${vuln.cvss}  |  EPSS: ${(vuln.epss * 100).toFixed(4)}% (P${(vuln.epssPercentile * 100).toFixed(0)}%)  |  Score: ${vuln.combinedScore.toFixed(2)}`,
      PAGE.margins.left + 48, y + 28
    );

    // Component and service
    doc.text(
      `Componente: ${vuln.component} v${vuln.version}  |  Servicio: ${vuln.engagement.length > 40 ? vuln.engagement.substring(0, 40) + '...' : vuln.engagement}`,
      PAGE.margins.left + 48, y + 42
    );

    // Mitigation
    if (vuln.mitigation) {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.success);
      doc.text(`[Fix] ${vuln.mitigation}`, PAGE.margins.left + 48, y + 56);
    }

    doc.y = y + 82;
  });
}

// ── 7. SLA Analysis ──────────────────────────────────────────

export function renderSLAAnalysis(doc, analysis) {
  ensureSpace(doc, 280);
  doc.moveDown(1);
  drawSectionTitle(doc, 'Análisis de SLA', '06');
  doc.moveDown(1);

  applyFont(doc, TYPOGRAPHY.body);
  doc.text('Estado de cumplimiento de SLA. Vulnerabilidades agrupadas por tiempo restante para vencimiento.', PAGE.margins.left);
  doc.moveDown(1.2);

  const { vencido, critico, proximo, holgado, avgAge, urgentSLA, total } = analysis.slaAnalysis;

  // SLA KPI cards
  drawKPIRow(doc, [
    { label: 'VENCIDO', value: vencido.length.toString(), color: COLORS.Critical },
    { label: 'CRÍTICO (1-30d)', value: critico.length.toString(), color: COLORS.High },
    { label: 'PRÓXIMO (31-90d)', value: proximo.length.toString(), color: COLORS.Medium },
    { label: 'HOLGADO (>90d)', value: holgado.length.toString(), color: COLORS.success },
  ]);

  doc.moveDown(0.5);

  // SLA table
  drawTable(doc, {
    headers: ['Estado SLA', 'Cantidad', '% del Total'],
    rows: [
      ['Vencido (0 días o menos)', vencido.length.toString(), ((vencido.length / total) * 100).toFixed(1) + '%'],
      ['Crítico (1-30 días)', critico.length.toString(), ((critico.length / total) * 100).toFixed(1) + '%'],
      ['Próximo (31-90 días)', proximo.length.toString(), ((proximo.length / total) * 100).toFixed(1) + '%'],
      ['Holgado (>90 días)', holgado.length.toString(), ((holgado.length / total) * 100).toFixed(1) + '%'],
    ],
    colWidths: [PAGE.width * 0.50, PAGE.width * 0.25, PAGE.width * 0.25],
    tableWidth: PAGE.width,
    options: { alignments: ['left', 'center', 'center'], boldColumns: [1] }
  });

  doc.moveDown(0.5);
  applyFont(doc, TYPOGRAPHY.body);
  doc.text(`Antigüedad promedio de vulnerabilidades: ${avgAge.toFixed(0)} días`, PAGE.margins.left);
  doc.moveDown(1);

  // Urgent SLA list
  if (urgentSLA.length > 0) {
    drawSubsectionTitle(doc, 'Vulnerabilidades con SLA Crítico o Vencido');
    doc.moveDown(0.4);

    drawTable(doc, {
      headers: ['Severidad', 'Días Restantes', 'Servicio'],
      rows: urgentSLA.map(v => [
        v.severity,
        v.slaDaysRemaining <= 0 ? 'VENCIDO' : v.slaDaysRemaining.toString(),
        v.engagement.length > 42 ? v.engagement.substring(0, 42) + '...' : v.engagement
      ]),
      colWidths: [PAGE.width * 0.20, PAGE.width * 0.20, PAGE.width * 0.60],
      tableWidth: PAGE.width,
      options: {
        severityColumn: 0,
        alignments: ['left', 'center', 'left'],
        cellColors: {
          1: (cell) => cell === 'VENCIDO' ? COLORS.Critical : null
        }
      }
    });
  } else {
    drawInfoBox(doc, 'No hay vulnerabilidades con SLA vencido o crítico.', 'success');
  }
}

// ── 8. Shared Vulnerabilities ────────────────────────────────

export function renderSharedVulnerabilities(doc, analysis) {
  ensureSpace(doc, 240);
  doc.moveDown(1);
  drawSectionTitle(doc, 'Vulnerabilidades Compartidas entre Servicios', '07');
  doc.moveDown(1);

  drawInfoBox(doc,
    'CVEs que aparecen en múltiples servicios. Solucionar una dependencia compartida puede cerrar varias vulnerabilidades simultáneamente.',
    'info'
  );
  doc.moveDown(1);

  const { sharedVulns } = analysis;

  applyFont(doc, TYPOGRAPHY.body);
  doc.text(`Total CVEs compartidos entre 2+ servicios: ${sharedVulns.length}`, PAGE.margins.left);
  doc.moveDown(0.5);

  if (sharedVulns.length > 0) {
    drawTable(doc, {
      headers: ['CVE/ID', 'Severidad', 'Componente', 'Servicios'],
      rows: sharedVulns.slice(0, 20).map(v => [
        v.id.length > 20 ? v.id.substring(0, 20) : v.id,
        v.severity,
        `${v.component} v${v.version}`.substring(0, 30),
        v.engagements.size.toString()
      ]),
      colWidths: [PAGE.width * 0.25, PAGE.width * 0.20, PAGE.width * 0.35, PAGE.width * 0.20],
      tableWidth: PAGE.width,
      options: {
        severityColumn: 1,
        alignments: ['left', 'left', 'left', 'center'],
        boldColumns: [3]
      }
    });

    doc.moveDown(1);
    drawSubsectionTitle(doc, 'Top 10 CVEs Más Extendidos');
    doc.moveDown(0.4);

    sharedVulns.slice(0, 10).forEach((vuln, idx) => {
      ensureSpace(doc, 60);
      const config = SEVERITY_CONFIG[vuln.severity] || SEVERITY_CONFIG['Info'];
      const y = doc.y;

      // Mini card - more height and padding
      doc.rect(PAGE.margins.left, y, PAGE.width, 42).fill(COLORS.gray50);
      doc.rect(PAGE.margins.left, y, 3, 42).fill(config.color);

      doc.fontSize(9).font('Helvetica-Bold').fillColor(config.color);
      doc.text(`${idx + 1}. [${vuln.severity}] ${vuln.id}`, PAGE.margins.left + 12, y + 6);

      doc.fontSize(8).font('Helvetica').fillColor(COLORS.gray600);
      doc.text(`${vuln.component} v${vuln.version}  |  Presente en ${vuln.engagements.size} servicios`, PAGE.margins.left + 12, y + 20);

      if (vuln.mitigation) {
        doc.fontSize(8).font('Helvetica').fillColor(COLORS.success);
        doc.text(`[Fix] ${vuln.mitigation}`, PAGE.margins.left + 12, y + 32);
      }

      doc.y = y + 50;
    });
  } else {
    drawInfoBox(doc, 'No se encontraron CVEs compartidos entre múltiples servicios.', 'success');
  }
}

// ── 9. Top Components ────────────────────────────────────────

export function renderTopComponents(doc, analysis) {
  ensureSpace(doc, 240);
  doc.moveDown(1);
  drawSectionTitle(doc, 'Componentes Más Vulnerables', '08');
  doc.moveDown(1);

  applyFont(doc, TYPOGRAPHY.body);
  doc.text('Librerías/componentes que acumulan más vulnerabilidades. Actualizar estos componentes tiene mayor impacto en la reducción de riesgo.', PAGE.margins.left);
  doc.moveDown(1.2);

  drawTable(doc, {
    headers: ['Componente', 'Vulnerabilidades', 'Versiones', 'Servicios'],
    rows: analysis.topComponents.map(c => [
      c.name.length > 32 ? c.name.substring(0, 32) + '...' : c.name,
      c.count.toString(),
      [...c.versions].join(', ').length > 18 ? [...c.versions].slice(0, 2).join(', ') : [...c.versions].join(', '),
      c.engagements.size.toString()
    ]),
    colWidths: [PAGE.width * 0.38, PAGE.width * 0.18, PAGE.width * 0.26, PAGE.width * 0.18],
    tableWidth: PAGE.width,
    options: {
      boldColumns: [1],
      alignments: ['left', 'center', 'left', 'center']
    }
  });

  doc.moveDown(1.5);
  drawBarChart(doc, {
    title: 'Top 10 Componentes con más vulnerabilidades',
    data: Object.fromEntries(analysis.topComponents.slice(0, 10).map(c => [
      c.name.length > 28 ? c.name.substring(0, 28) : c.name, c.count
    ])),
    colors: TAG_COLORS,
    maxWidth: PAGE.width
  });
}

// ── 10. Mitigation Coverage ──────────────────────────────────

export function renderMitigationCoverage(doc, analysis) {
  ensureSpace(doc, 280);
  doc.moveDown(1);
  drawSectionTitle(doc, 'Cobertura de Mitigación', '09');
  doc.moveDown(1);

  applyFont(doc, TYPOGRAPHY.body);
  doc.text('Porcentaje de vulnerabilidades con fix/versión disponible vs las que no tienen solución conocida.', PAGE.margins.left);
  doc.moveDown(1.2);

  const { withFix, withoutFix, noFixBySeverity, total } = analysis.mitigationCoverage;

  // KPI cards
  drawKPIRow(doc, [
    { label: 'CON FIX DISPONIBLE', value: withFix.toString(), color: COLORS.success },
    { label: 'SIN FIX CONOCIDO', value: withoutFix.toString(), color: COLORS.danger },
    { label: '% COBERTURA', value: `${((withFix / total) * 100).toFixed(0)}%`, color: COLORS.accent },
  ]);

  doc.moveDown(1);

  drawTable(doc, {
    headers: ['Estado', 'Cantidad', '% del Total'],
    rows: [
      ['Con fix disponible', withFix.toString(), ((withFix / total) * 100).toFixed(1) + '%'],
      ['Sin fix conocido', withoutFix.toString(), ((withoutFix / total) * 100).toFixed(1) + '%']
    ],
    colWidths: [PAGE.width * 0.45, PAGE.width * 0.25, PAGE.width * 0.30],
    tableWidth: PAGE.width,
    options: {
      alignments: ['left', 'center', 'center'],
      boldColumns: [1],
      cellColors: {
        0: (cell) => cell.includes('Sin fix') ? COLORS.danger : COLORS.success
      }
    }
  });

  doc.moveDown(1);
  drawBarChart(doc, {
    title: 'Cobertura de Mitigación',
    data: { 'Con fix disponible': withFix, 'Sin fix conocido': withoutFix },
    colors: { 'Con fix disponible': COLORS.success, 'Sin fix conocido': COLORS.danger },
    maxWidth: PAGE.width
  });

  // No fix by severity
  doc.moveDown(1);
  drawSubsectionTitle(doc, 'Sin Fix Conocido por Severidad');
  doc.moveDown(0.4);

  drawTable(doc, {
    headers: ['Severidad', 'Sin Fix', '% sin Fix'],
    rows: Object.entries(noFixBySeverity)
      .sort((a, b) => (SEVERITY_ORDER[a[0]] ?? 99) - (SEVERITY_ORDER[b[0]] ?? 99))
      .map(([sev, count]) => [sev, count.toString(), ((count / withoutFix) * 100).toFixed(1) + '%']),
    colWidths: [PAGE.width * 0.35, PAGE.width * 0.30, PAGE.width * 0.35],
    tableWidth: PAGE.width * 0.7,
    options: {
      severityColumn: 0,
      alignments: ['left', 'center', 'center']
    }
  });
}

// ── 11. Tools & Environment ──────────────────────────────────

export function renderToolsEnvironment(doc, analysis) {
  ensureSpace(doc, 240);
  doc.moveDown(1);
  drawSectionTitle(doc, 'Herramientas de Detección y Ambientes', '10');
  doc.moveDown(1);

  // By tool
  drawSubsectionTitle(doc, 'Vulnerabilidades por Herramienta de Detección');

  drawTable(doc, {
    headers: ['Herramienta', 'Cantidad', '% del Total'],
    rows: Object.entries(analysis.byFoundBy)
      .sort((a, b) => b[1] - a[1])
      .map(([tool, count]) => [tool, count.toString(), ((count / analysis.totalVulnerabilities) * 100).toFixed(1) + '%']),
    colWidths: [PAGE.width * 0.45, PAGE.width * 0.25, PAGE.width * 0.30],
    tableWidth: PAGE.width,
    options: { alignments: ['left', 'center', 'center'], boldColumns: [1] }
  });

  doc.moveDown(1.5);

  // By environment
  drawSubsectionTitle(doc, 'Vulnerabilidades por Ambiente');
  doc.moveDown(0.4);

  drawTable(doc, {
    headers: ['Ambiente', 'Cantidad', '% del Total'],
    rows: Object.entries(analysis.byEnvironment)
      .sort((a, b) => b[1] - a[1])
      .map(([env, count]) => [env, count.toString(), ((count / analysis.totalVulnerabilities) * 100).toFixed(1) + '%']),
    colWidths: [PAGE.width * 0.50, PAGE.width * 0.25, PAGE.width * 0.25],
    tableWidth: PAGE.width,
    options: { alignments: ['left', 'center', 'center'], boldColumns: [1] }
  });

  doc.moveDown(1.5);
  drawBarChart(doc, {
    title: 'Distribución por Ambiente',
    data: analysis.byEnvironment,
    colors: { 'ENTORNO PLATAFORMAS DE DESARROLLO': '#3B82F6', 'PRODUCCION': '#DC2626', 'QA': '#F59E0B' },
    maxWidth: PAGE.width
  });

  // Risk status
  doc.moveDown(1.5);
  ensureSpace(doc, 150);
  drawSubsectionTitle(doc, 'Estado de Riesgo');
  doc.moveDown(0.4);

  drawTable(doc, {
    headers: ['Estado de Riesgo', 'Cantidad', '% del Total'],
    rows: Object.entries(analysis.byRiskStatus)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => [status, count.toString(), ((count / analysis.totalVulnerabilities) * 100).toFixed(1) + '%']),
    colWidths: [PAGE.width * 0.45, PAGE.width * 0.25, PAGE.width * 0.30],
    tableWidth: PAGE.width,
    options: { alignments: ['left', 'center', 'center'], boldColumns: [1] }
  });
}
