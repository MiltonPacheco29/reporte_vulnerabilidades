// ============================================================
// DATA MODULE - CSV Parsing & Analysis
// ============================================================
// Handles all data ingestion, transformation, and analysis

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { VALID_TAGS, SEVERITY_ORDER } from '../config/index.mjs';

// ── CSV Parsing ──────────────────────────────────────────────

/**
 * Sanitize a string value: remove non-printable chars, BOM, null bytes,
 * and normalize whitespace. Forces everything to clean ASCII/Latin-1 text.
 */
function sanitizeValue(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/\uFEFF/g, '')           // Remove BOM
    .replace(/\x00/g, '')             // Remove null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .replace(/\r\n/g, ' ')            // Normalize line breaks
    .replace(/\r/g, ' ')
    .replace(/\t/g, ' ')              // Tabs to spaces
    .replace(/ {2,}/g, ' ')           // Collapse multiple spaces
    .trim();
}

/**
 * Sanitize all values in a row object, ensuring everything is a clean string.
 */
function sanitizeRow(row) {
  const clean = {};
  for (const [key, value] of Object.entries(row)) {
    clean[sanitizeValue(key)] = sanitizeValue(value);
  }
  return clean;
}

export function parseCSV(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  // Strip BOM if present at file level
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => sanitizeValue(h),
    transform: (value) => sanitizeValue(value)
  });

  if (result.errors.length > 0) {
    console.warn(`  ! Advertencias CSV:`, result.errors.slice(0, 3));
  }

  // Double-sanitize each row to ensure clean strings
  return result.data.map(sanitizeRow);
}

export function filterByValidTags(data) {
  return data.filter(row => {
    const tag = (row.tags || '').trim().toLowerCase();
    return VALID_TAGS.some(vt => vt.toLowerCase() === tag);
  });
}

// ── Text Extraction ──────────────────────────────────────────

export function cleanDescription(desc) {
  if (!desc) return 'Sin descripción disponible';
  return desc
    .replace(/NEWLINE/g, '\n')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractSolution(desc) {
  if (!desc) return 'No se encontró información de solución.';

  const cleaned = desc.replace(/NEWLINE/g, '\n').replace(/\*\*/g, '');

  const fixedMatch = cleaned.match(/Fixed version:\s*([^\n]+)/i);
  const fixedVersion = fixedMatch ? fixedMatch[1].trim() : null;

  const affectedMatch = cleaned.match(/Affected:([^.]+\.)/i);
  const affected = affectedMatch ? affectedMatch[1].trim() : null;

  let solution = '';
  if (fixedVersion) {
    solution += `Actualizar a la versión: ${fixedVersion}`;
  }
  if (affected) {
    solution += solution ? `\n${affected}` : affected;
  }

  if (!solution) {
    const sentences = cleaned.split(/\.\s+/);
    const lastSentences = sentences.slice(-3).join('. ');
    solution = lastSentences.length > 20 ? lastSentences : 'Revisar descripción completa para determinar solución.';
  }

  return solution;
}

export function extractShortDescription(desc) {
  if (!desc) return 'Sin descripción';
  const cleaned = desc.replace(/NEWLINE/g, ' ').replace(/\*\*/g, '').trim();
  const firstSentence = cleaned.split(/\.\s/)[0];
  return firstSentence.length > 200 ? firstSentence.substring(0, 200) + '...' : firstSentence + '.';
}

// ── Data Analysis ────────────────────────────────────────────

export function analyzeData(data) {
  const totalVulnerabilities = data.length;

  // By tags
  const byTags = {};
  data.forEach(row => {
    const tag = (row.tags || 'sin_tag').trim();
    byTags[tag] = (byTags[tag] || 0) + 1;
  });

  // By engagement and severity
  const byEngagementSeverity = {};
  data.forEach(row => {
    const engagement = (row.engagement || 'Sin engagement').trim();
    const severity = (row.severity || 'Sin severity').trim();
    if (!byEngagementSeverity[engagement]) {
      byEngagementSeverity[engagement] = {};
    }
    byEngagementSeverity[engagement][severity] = (byEngagementSeverity[engagement][severity] || 0) + 1;
  });

  // Detail by engagement
  const detailByEngagement = {};
  data.forEach(row => {
    const engagement = (row.engagement || 'Sin engagement').trim();
    if (!detailByEngagement[engagement]) {
      detailByEngagement[engagement] = [];
    }
    detailByEngagement[engagement].push({
      title: (row.title || '').trim(),
      component: (row.component_name || '').trim(),
      version: (row.component_version || '').trim(),
      severity: (row.severity || '').trim(),
      cvss: row.cvssv3_score || '',
      filePath: (row.file_path || '').trim(),
      description: extractShortDescription(row.description),
      solution: extractSolution(row.description),
      tag: (row.tags || '').trim(),
      product: (row.product || '').trim(),
      vulnerabilityIds: (row.vulnerability_ids || '').trim(),
      priority: (row.priority || '').trim(),
      mitigation: (row.mitigation || '').trim()
    });
  });

  // Severity counts
  const severityCounts = {};
  Object.values(byEngagementSeverity).forEach(sevMap => {
    Object.entries(sevMap).forEach(([sev, count]) => {
      severityCounts[sev] = (severityCounts[sev] || 0) + count;
    });
  });

  // SLA Analysis
  const slaAnalysis = analyzeSLA(data);

  // Top vulnerable components
  const topComponents = analyzeComponents(data);

  // Shared vulnerabilities
  const sharedVulns = analyzeSharedVulnerabilities(data);

  // Top 10 urgent
  const topUrgent = analyzeTopUrgent(data);

  // Actionable priorities
  const actionablePriorities = analyzeActionablePriorities(data);

  // Mitigation coverage
  const mitigationCoverage = analyzeMitigation(data);

  // By tool and environment
  const byFoundBy = {};
  data.forEach(row => {
    const tool = (row.found_by || 'Desconocido').trim();
    byFoundBy[tool] = (byFoundBy[tool] || 0) + 1;
  });

  const byEnvironment = {};
  data.forEach(row => {
    const env = (row.product_type_environment || 'Sin ambiente').trim();
    byEnvironment[env] = (byEnvironment[env] || 0) + 1;
  });

  const byRiskStatus = {};
  data.forEach(row => {
    const status = (row.risk_status || 'Sin estado').trim();
    byRiskStatus[status] = (byRiskStatus[status] || 0) + 1;
  });

  const productTypes = [...new Set(
    data
      .map(row => (row.product_type || '').trim())
      .filter(Boolean)
  )].sort();

  return {
    totalVulnerabilities,
    byTags,
    byEngagementSeverity,
    detailByEngagement,
    severityCounts,
    slaAnalysis,
    topComponents,
    sharedVulns,
    topUrgent,
    actionablePriorities,
    mitigationCoverage,
    byFoundBy,
    byEnvironment,
    byRiskStatus,
    productTypes,
    rawData: data
  };
}

// ── SLA Analysis ─────────────────────────────────────────────

function analyzeSLA(data) {
  const slaData = data.map(row => ({
    title: (row.title || '').trim(),
    severity: (row.severity || '').trim(),
    slaAge: parseInt(row.sla_age) || 0,
    slaDaysRemaining: parseInt(row.sla_days_remaining) || 0,
    slaExpiration: (row.sla_expiration_date || '').trim(),
    engagement: (row.engagement || '').trim()
  }));

  const vencido = slaData.filter(v => v.slaDaysRemaining <= 0 && v.slaExpiration);
  const critico = slaData.filter(v => v.slaDaysRemaining > 0 && v.slaDaysRemaining <= 30);
  const proximo = slaData.filter(v => v.slaDaysRemaining > 30 && v.slaDaysRemaining <= 90);
  const holgado = slaData.filter(v => v.slaDaysRemaining > 90);
  const avgAge = slaData.reduce((sum, v) => sum + v.slaAge, 0) / (slaData.length || 1);

  const urgentSLA = [...vencido, ...critico]
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99))
    .slice(0, 15);

  return { vencido, critico, proximo, holgado, avgAge, urgentSLA, total: slaData.length };
}

// ── Component Analysis ───────────────────────────────────────

function analyzeComponents(data) {
  const byComponent = {};
  data.forEach(row => {
    const comp = (row.component_name || '').trim();
    if (!comp) return;
    if (!byComponent[comp]) {
      byComponent[comp] = { name: comp, count: 0, versions: new Set(), severities: {}, engagements: new Set() };
    }
    byComponent[comp].count++;
    byComponent[comp].versions.add((row.component_version || '').trim());
    const sev = (row.severity || 'Info').trim();
    byComponent[comp].severities[sev] = (byComponent[comp].severities[sev] || 0) + 1;
    byComponent[comp].engagements.add((row.engagement || '').trim());
  });

  return Object.values(byComponent)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

// ── Shared Vulnerabilities ───────────────────────────────────

function analyzeSharedVulnerabilities(data) {
  const byVulnId = {};
  data.forEach(row => {
    const vulnId = (row.vulnerability_ids || '').trim();
    if (!vulnId) return;
    if (!byVulnId[vulnId]) {
      byVulnId[vulnId] = {
        id: vulnId,
        title: (row.title || '').trim(),
        severity: (row.severity || '').trim(),
        component: (row.component_name || '').trim(),
        version: (row.component_version || '').trim(),
        mitigation: (row.mitigation || '').trim(),
        engagements: new Set()
      };
    }
    byVulnId[vulnId].engagements.add((row.engagement || '').trim());
  });

  return Object.values(byVulnId)
    .filter(v => v.engagements.size > 1)
    .sort((a, b) => b.engagements.size - a.engagements.size);
}

// ── Top Urgent Analysis ──────────────────────────────────────

function analyzeTopUrgent(data) {
  const scoredVulns = data
    .map(row => ({
      title: (row.title || '').trim(),
      engagement: (row.engagement || '').trim(),
      severity: (row.severity || '').trim(),
      cvss: parseFloat(row.cvssv3_score) || 0,
      epss: parseFloat(row.epss_score) || 0,
      epssPercentile: parseFloat(row.epss_percentile) || 0,
      tag: (row.tags || '').trim(),
      component: (row.component_name || '').trim(),
      version: (row.component_version || '').trim(),
      mitigation: (row.mitigation || '').trim(),
      combinedScore: ((parseFloat(row.cvssv3_score) || 0) * 0.7) + ((parseFloat(row.epss_percentile) || 0) * 0.3 * 10)
    }))
    .sort((a, b) => b.combinedScore - a.combinedScore);

  const topVulns = [];
  const seenTitles = new Set();
  scoredVulns.forEach(v => {
    if (!seenTitles.has(v.title) && topVulns.length < 10) {
      seenTitles.add(v.title);
      topVulns.push(v);
    }
  });

  return topVulns;
}

function analyzeActionablePriorities(data) {
  const severityWeight = {
    Critical: 5,
    High: 4,
    'Medium High': 3.5,
    Medium: 3,
    'Medium Low': 2.5,
    Low: 1.5,
    Info: 0.5
  };

  function getSlaScore(daysRemaining) {
    if (daysRemaining <= 0) return 2.5;
    if (daysRemaining <= 15) return 2;
    if (daysRemaining <= 30) return 1.5;
    if (daysRemaining <= 90) return 0.7;
    return 0;
  }

  function getActionReason(row, slaDaysRemaining, hasMitigation) {
    const reasons = [];
    const severity = (row.severity || '').trim();
    const env = (row.product_type_environment || '').trim();

    if (severity === 'Critical' || severity === 'High') reasons.push(`Severidad ${severity}`);
    if (slaDaysRemaining <= 0) reasons.push('SLA vencido');
    else if (slaDaysRemaining <= 30) reasons.push(`SLA ${slaDaysRemaining}d`);
    if (/prod/i.test(env)) reasons.push('Producción');
    if (!hasMitigation) reasons.push('Sin mitigación');

    return reasons.length > 0 ? reasons.join(' + ') : 'Revisar por score combinado';
  }

  const scored = data.map(row => {
    const severity = (row.severity || 'Info').trim();
    const cvss = parseFloat(row.cvssv3_score) || 0;
    const epssPercentile = parseFloat(row.epss_percentile) || 0;
    const slaDaysRemaining = parseInt(row.sla_days_remaining) || 0;
    const environment = (row.product_type_environment || 'Sin ambiente').trim();
    const hasMitigation = (row.mitigation || '').trim().length > 0;
    const isProduction = /prod/i.test(environment);

    const score =
      ((severityWeight[severity] || 0) * 2) +
      cvss +
      (epssPercentile * 3) +
      getSlaScore(slaDaysRemaining) +
      (isProduction ? 1.2 : 0) +
      (hasMitigation ? 0 : 0.8);

    return {
      title: (row.title || '').trim(),
      engagement: (row.engagement || 'Sin engagement').trim(),
      areaResponsible: (row.area_responsible || 'Sin responsable').trim(),
      product: (row.product || '').trim(),
      productType: (row.product_type || '').trim(),
      environment,
      severity,
      cvss,
      epssPercentile,
      slaDaysRemaining,
      tag: (row.tags || '').trim(),
      component: (row.component_name || '').trim(),
      version: (row.component_version || '').trim(),
      vulnerabilityIds: (row.vulnerability_ids || '').trim(),
      mitigation: (row.mitigation || '').trim(),
      score,
      reason: getActionReason(row, slaDaysRemaining, hasMitigation)
    };
  });

  const unique = [];
  const seen = new Set();

  scored
    .sort((a, b) => b.score - a.score)
    .forEach(vuln => {
      const key = `${vuln.engagement}|${vuln.title}|${vuln.component}|${vuln.version}`;
      if (seen.has(key)) return;
      seen.add(key);
      unique.push(vuln);
    });

  return unique.slice(0, 12);
}

// ── Mitigation Coverage ──────────────────────────────────────

function analyzeMitigation(data) {
  const withMitigation = data.filter(r => (r.mitigation || '').trim().length > 0);
  const withoutMitigation = data.filter(r => (r.mitigation || '').trim().length === 0);

  const noFixBySeverity = {};
  withoutMitigation.forEach(row => {
    const sev = (row.severity || 'Info').trim();
    noFixBySeverity[sev] = (noFixBySeverity[sev] || 0) + 1;
  });

  return {
    withFix: withMitigation.length,
    withoutFix: withoutMitigation.length,
    noFixBySeverity,
    total: data.length
  };
}

// ── Sprint Folder Discovery ──────────────────────────────────

export function findSprintFolders(baseDir) {
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() && /^Sprint\s+\d+/i.test(e.name))
    .map(e => ({
      name: e.name,
      number: parseInt(e.name.match(/\d+/)[0]),
      path: path.join(baseDir, e.name)
    }))
    .sort((a, b) => b.number - a.number);
}
