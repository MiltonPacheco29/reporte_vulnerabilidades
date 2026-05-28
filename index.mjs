// ============================================================
// VULNERABILITY REPORT GENERATOR - Enterprise Edition
// ============================================================
// Generates professional PDF security reports from CSV findings
// Architecture: Modular components with centralized design system
//
// Usage: node index.mjs "Sprint 245"
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

import { PAGE, REPORT_META } from './src/config/index.mjs';
import { addHeaderFooter } from './src/pdf/components.mjs';
import { parseCSV, filterByValidTags, analyzeData, findSprintFolders } from './src/services/data.mjs';
import {
  renderCover,
  renderExecutiveSummary,
  renderTagsAnalysis,
  renderEngagementSeverity,
  renderActionablePriorities,
  renderVulnerabilityDetail
} from './src/pdf/sections.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SPRINTS_DIR = path.join(__dirname, 'data');
const DEFAULT_INPUT_FOLDER = 'Ejemplo';

// ============================================================
// PDF GENERATION ORCHESTRATOR
// ============================================================

async function generatePDF(analysis, sprintName, outputPath) {
  const doc = new PDFDocument({
    size: PAGE.size,
    margins: PAGE.margins,
    bufferPages: true,
    info: {
      Title: `${REPORT_META.reportType} - ${sprintName}`,
      Author: REPORT_META.company,
      Subject: 'Vulnerability Assessment',
      Keywords: 'security, vulnerabilities, assessment, compliance',
      Creator: 'Entitlement Security Report Generator',
    }
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Render report sections.
  renderCover(doc, analysis, sprintName);
  renderExecutiveSummary(doc, analysis);
  renderTagsAnalysis(doc, analysis);
  renderEngagementSeverity(doc, analysis);
  renderActionablePriorities(doc, analysis);
  renderVulnerabilityDetail(doc, analysis);

  // ── Apply headers and footers to all pages ───────────────
  const range = doc.bufferedPageRange();
  const totalPages = range.count;

  for (let i = range.start; i < range.start + totalPages; i++) {
    doc.switchToPage(i);

    // Skip cover page (page 0)
    if (i === 0) continue;

    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.page.margins.top = 0;

    addHeaderFooter(doc, i, totalPages);

    doc.page.margins.bottom = oldBottom;
    doc.page.margins.top = PAGE.margins.top;
  }

  doc.flushPages();
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

// ============================================================
// MAIN ENTRY POINT
// ============================================================

async function main() {
  console.log('');
  console.log('  ┌─────────────────────────────────────────────────────┐');
  console.log('  │  ◆ Security Vulnerability Report Generator          │');
  console.log('  │    Enterprise Edition v2.0                           │');
  console.log('  └─────────────────────────────────────────────────────┘');
  console.log('');

  // Find Sprint folders
  const sprintFolders = findSprintFolders(SPRINTS_DIR);
  const defaultFolderPath = path.join(SPRINTS_DIR, DEFAULT_INPUT_FOLDER);
  const defaultCsvPath = path.join(defaultFolderPath, 'findings.csv');
  const hasDefaultInput = fs.existsSync(defaultCsvPath);

  if (sprintFolders.length === 0 && !hasDefaultInput) {
    console.error('  ✗ No se encontraron entradas válidas en:', SPRINTS_DIR);
    process.exit(1);
  }

  const availableFolders = [
    ...(hasDefaultInput ? [DEFAULT_INPUT_FOLDER] : []),
    ...sprintFolders.map(f => f.name)
  ];
  console.log(`  ○ Carpetas disponibles: ${availableFolders.join(', ')}`);

  // Validate parameter (optional: defaults to Ejemplo)
  const sprintParam = process.argv[2] || DEFAULT_INPUT_FOLDER;
  if (!process.argv[2]) {
    console.log(`  ○ Sin parámetro de entrada, usando "${DEFAULT_INPUT_FOLDER}" por defecto.`);
  }

  let targetSprint = sprintFolders.find(f => f.name.toLowerCase() === sprintParam.toLowerCase())
    || sprintFolders.find(f => f.name.toLowerCase().includes(sprintParam.toLowerCase()));

  if (!targetSprint && sprintParam.toLowerCase() === DEFAULT_INPUT_FOLDER.toLowerCase() && hasDefaultInput) {
    targetSprint = {
      name: DEFAULT_INPUT_FOLDER,
      number: 0,
      path: defaultFolderPath
    };
  }

  if (!targetSprint) {
    console.error(`  ✗ No se encontró la carpeta "${sprintParam}".`);
    console.log(`    Disponibles: ${availableFolders.join(', ')}`);
    process.exit(1);
  }

  // Find CSV
  const csvPath = path.join(targetSprint.path, 'findings.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`  ✗ No se encontró findings.csv en: ${targetSprint.path}`);
    process.exit(1);
  }

  console.log(`  ○ Sprint: ${targetSprint.name}`);
  console.log(`  ○ CSV: ${csvPath}`);

  // Parse & filter
  const rawData = parseCSV(csvPath);
  console.log(`  ○ Registros CSV: ${rawData.length}`);

  const filteredData = filterByValidTags(rawData);
  console.log(`  ○ Vulnerabilidades válidas: ${filteredData.length}`);

  if (filteredData.length === 0) {
    console.error('  ✗ No se encontraron vulnerabilidades con tags válidos.');
    process.exit(1);
  }

  // Analyze
  console.log('');
  console.log('  ◆ Analizando datos...');
  const analysis = analyzeData(filteredData);

  // Generate PDF
  const outputFileName = `Reporte_Vulnerabilidades_${targetSprint.name.replace(/\s+/g, '_')}.pdf`;
  const outputPath = path.join(targetSprint.path, outputFileName);

  console.log('  ◆ Generando reporte PDF...');
  await generatePDF(analysis, targetSprint.name, outputPath);

  console.log('');
  console.log('  ┌─────────────────────────────────────────────────────┐');
  console.log('  │  ✓ Reporte generado exitosamente                    │');
  console.log('  └─────────────────────────────────────────────────────┘');
  console.log(`  → ${outputPath}`);
  console.log('');

  // Quick summary
  console.log('  ── Resumen ──────────────────────────────────────────');
  console.log(`  Total: ${analysis.totalVulnerabilities} vulnerabilidades`);
  Object.entries(analysis.severityCounts)
    .sort((a, b) => a[1] - b[1])
    .forEach(([sev, count]) => {
      const pct = ((count / analysis.totalVulnerabilities) * 100).toFixed(1);
      console.log(`    ${sev}: ${count} (${pct}%)`);
    });
  console.log(`  Servicios afectados: ${Object.keys(analysis.byEngagementSeverity).length}`);
  console.log('');
}

main().catch(err => {
  console.error('  ✗ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
