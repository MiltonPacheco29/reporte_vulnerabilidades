// ============================================================
// SECTION RENDERERS - Enterprise Report Sections
// ============================================================
// Each function renders a complete section of the PDF report

import {
  COLORS, TAG_COLORS, SEVERITY_CONFIG, TYPOGRAPHY,
  PAGE, TAG_DESCRIPTIONS, TAG_GROUPS, SEVERITY_ORDER
} from '../config/index.mjs';

import {
  ensureSpace, applyFont, drawCoverPage, drawSectionTitle,
  drawSubsectionTitle, drawKPIRow, drawSeverityBadge, drawTable,
  drawBarChart, drawSeverityDistribution, drawInfoBox
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
    productTypes: analysis.productTypes,
    generationDate
  });
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
  doc.addPage();
  drawSectionTitle(doc, 'Análisis por Servicio y Severidad', '03');
  doc.moveDown(1);

  applyFont(doc, TYPOGRAPHY.body);
  doc.text(
    'Distribución de vulnerabilidades por servicio (engagement), nivel de severidad y grupo de origen: Fluid Attacks, C2C y motores de análisis agrupados.',
    PAGE.margins.left
  );
  doc.moveDown(1.2);

  const groups = buildEngagementSeverityGroups(analysis.rawData);
  const headers = ['Servicio', 'Info', 'Low', 'Med', 'High', 'Crit', 'Total'];
  const colWidths = [
    PAGE.width * 0.46,
    PAGE.width * 0.08,
    PAGE.width * 0.08,
    PAGE.width * 0.08,
    PAGE.width * 0.08,
    PAGE.width * 0.08,
    PAGE.width * 0.10,
  ];

  // Adjust for rounding
  const remainder = PAGE.width - colWidths.reduce((a, b) => a + b, 0);
  colWidths[0] += remainder;

  groups.forEach(group => {
    ensureSpace(doc, 120);
    drawSubsectionTitle(doc, group.title);
    applyFont(doc, TYPOGRAPHY.bodySmall);
    doc.text(group.description, PAGE.margins.left);
    doc.moveDown(0.7);

    if (group.rows.length === 0) {
      drawInfoBox(doc, `No se encontraron vulnerabilidades para ${group.title}.`, 'info');
      return;
    }

    drawTable(doc, {
      headers,
      rows: group.rows,
      colWidths,
      tableWidth: PAGE.width,
      options: {
        rowHeight: 30,
        boldColumns: [6],
        alignments: ['left', 'center', 'center', 'center', 'center', 'center', 'center'],
        cellColors: {
          4: (cell) => parseInt(cell) > 0 ? COLORS.High : null,
          5: (cell) => parseInt(cell) > 0 ? COLORS.Critical : null,
        }
      }
    });
  });
}

export function renderActionablePriorities(doc, analysis) {
  doc.addPage();
  drawSectionTitle(doc, 'Prioridades Accionables', '04');
  doc.moveDown(1);

  applyFont(doc, TYPOGRAPHY.body);
  doc.text(
    'Ranking de vulnerabilidades que deberían atenderse primero, combinando severidad, CVSS, EPSS, vencimiento de SLA, ambiente y disponibilidad de mitigación.',
    PAGE.margins.left
  );
  doc.moveDown(1);

  const priorities = analysis.actionablePriorities || [];

  if (priorities.length === 0) {
    drawInfoBox(doc, 'No se encontraron vulnerabilidades priorizables con los datos actuales.', 'info');
    return;
  }

  const top = priorities[0];
  drawInfoBox(
    doc,
    `Prioridad principal: ${top.title} en ${top.engagement}. Motivo: ${top.reason}.`,
    top.severity === 'Critical' || top.slaDaysRemaining <= 0 ? 'danger' : 'warning'
  );

  const headers = ['#', 'Score', 'Sev', 'SLA', 'Ambiente', 'Servicio', 'Acción'];
  const colWidths = [
    PAGE.width * 0.05,
    PAGE.width * 0.08,
    PAGE.width * 0.12,
    PAGE.width * 0.08,
    PAGE.width * 0.13,
    PAGE.width * 0.20,
    PAGE.width * 0.30,
  ];
  const remainder = PAGE.width - colWidths.reduce((a, b) => a + b, 0);
  colWidths[6] += remainder;

  drawTable(doc, {
    headers,
    rows: priorities.map((vuln, idx) => [
      (idx + 1).toString(),
      vuln.score.toFixed(1),
      vuln.severity,
      vuln.slaDaysRemaining <= 0 ? 'Vencido' : `${vuln.slaDaysRemaining}d`,
      shortenText(vuln.environment, 18),
      shortenText(vuln.engagement, 28),
      buildActionText(vuln)
    ]),
    colWidths,
    tableWidth: PAGE.width,
    options: {
      rowHeight: 42,
      severityColumn: 2,
      boldColumns: [0, 1],
      alignments: ['center', 'center', 'left', 'center', 'left', 'left', 'left'],
      cellColors: {
        3: (cell) => cell === 'Vencido' ? COLORS.Critical : null,
      }
    }
  });
}

function buildActionText(vuln) {
  const mitigation = vuln.mitigation || 'Definir remediación';
  const component = vuln.component ? `${vuln.component}${vuln.version ? ` ${vuln.version}` : ''}` : 'componente no informado';
  return shortenText(`${vuln.reason}. ${component}. ${mitigation}`, 92);
}

function shortenText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength - 3)}...` : text;
}

function buildEngagementSeverityGroups(data) {
  const groupDefinitions = [
    {
      title: 'fluidattacks',
      description: 'Hallazgos detectados por Hacking Continuo / Fluid Attacks.',
      tags: ['fluidattacks']
    },
    {
      title: 'c2c',
      description: 'Hallazgos de Continuous Compliance y configuración de infraestructura.',
      tags: ['c2c']
    },
    {
      title: 'engines',
      description: 'Grupo combinado: engine_dependencies, engine_container, engine_iac y black_list; engine_dependencies.',
      tags: ['engine_dependencies', 'engine_container', 'engine_iac', 'black_list; engine_dependencies']
    },
  ];

  return groupDefinitions.map(group => {
    const byEngagement = {};

    data.forEach(row => {
      const tag = (row.tags || '').trim().toLowerCase();
      if (!group.tags.includes(tag)) return;

      const engagement = (row.engagement || 'Sin engagement').trim();
      const severity = (row.severity || 'Info').trim();

      if (!byEngagement[engagement]) {
        byEngagement[engagement] = {
          Info: 0,
          Low: 0,
          Medium: 0,
          High: 0,
          Critical: 0,
          total: 0,
        };
      }

      if (severity === 'Medium' || severity === 'Medium Low') byEngagement[engagement].Medium++;
      else if (severity === 'High' || severity === 'Medium High') byEngagement[engagement].High++;
      else if (severity === 'Critical') byEngagement[engagement].Critical++;
      else if (severity === 'Low') byEngagement[engagement].Low++;
      else byEngagement[engagement].Info++;

      byEngagement[engagement].total++;
    });

    const rows = Object.entries(byEngagement)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([engagement, counts]) => {
        const shortName = engagement.length > 34 ? engagement.substring(0, 34) + '...' : engagement;
        return [
          shortName,
          counts.Info.toString(),
          counts.Low.toString(),
          counts.Medium.toString(),
          counts.High.toString(),
          counts.Critical.toString(),
          counts.total.toString(),
        ];
      });

    return { ...group, rows };
  });
}

// ── 5. Vulnerability Detail ──────────────────────────────────

export function renderVulnerabilityDetail(doc, analysis) {
  doc.addPage();
  drawSectionTitle(doc, 'Detalle de Vulnerabilidades por Servicio', '05');
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
  doc.roundedRect(PAGE.margins.left, y, PAGE.width, 32, 4).fill(COLORS.gray50);
  doc.rect(PAGE.margins.left, y + 6, 3, 20).fill(COLORS.accent);

  applyFont(doc, { size: 12, font: 'Helvetica-Bold', color: COLORS.primary });
  doc.text(`5.${sectionNum} ${title}`, PAGE.margins.left + 14, y + 5);
  applyFont(doc, TYPOGRAPHY.caption);
  doc.text(description, PAGE.margins.left + 14, y + 19);
  doc.y = y + 40;

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
  doc.text(groupTitle.toUpperCase(), PAGE.margins.left);
  doc.moveDown(0.5);

  engagementsList.forEach(([engagement, vulns]) => {
    ensureSpace(doc, 100);

    const shortEngagement = engagement.length > 75 ? engagement.substring(0, 75) + '...' : engagement;

    // Engagement header bar - taller for better readability
    const engY = doc.y;
    doc.roundedRect(PAGE.margins.left, engY, PAGE.width, 32, 4).fill('#ECFDF5');
    doc.rect(PAGE.margins.left, engY + 6, 3, 20).fill(COLORS.accent);

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
