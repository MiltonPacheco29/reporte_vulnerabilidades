// ============================================================
// DESIGN SYSTEM - Enterprise Security Report
// ============================================================
// Design tokens, typography scales, color palettes, spacing
// Inspired by: Tenable, Qualys, Rapid7, CrowdStrike reports

export const PAGE = {
  size: 'A4',
  margins: { top: 64, bottom: 58, left: 54, right: 54 },
  get width() { return 595.28 - this.margins.left - this.margins.right; },
  get height() { return 841.89; }
};

// ── Color Palette (preserved from original) ──────────────────
export const COLORS = {
  // Brand
  primary: '#263238',
  primaryLight: '#455A64',
  primaryDark: '#111827',
  accent: '#00A884',

  // Severity (original palette)
  Critical: '#DC2626',
  High: '#EA580C',
  Medium: '#CA8A04',
  Low: '#16A34A',
  Info: '#0284C7',
  'Medium Low': '#D97706',
  'Medium High': '#E11D48',

  // Neutrals
  white: '#FFFFFF',
  gray50: '#FAFBFC',
  gray100: '#F1F5F7',
  gray200: '#DCE4E8',
  gray300: '#C7D2D8',
  gray400: '#8A9BA6',
  gray500: '#60717B',
  gray600: '#43525A',
  gray700: '#303C43',
  gray800: '#1F2930',
  gray900: '#111827',

  // Functional
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#0284C7',

  // Backgrounds
  coverBg: '#172126',
  headerBg: '#263238',
  tableBg: '#F6F9FA',
  cardBg: '#FFFFFF',
  accentBar: '#00A884',
};

export const TAG_COLORS = {
  'engine_dependencies': '#0284C7',
  'c2c': '#EF4444',
  'engine_container': '#7C3AED',
  'engine_iac': '#D97706',
  'fluidattacks': '#00A884',
  'black_list; engine_dependencies': '#475569'
};

// ── Severity Visual Config ───────────────────────────────────
export const SEVERITY_CONFIG = {
  Critical: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '●', order: 0 },
  High:     { color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', icon: '●', order: 1 },
  Medium:   { color: '#CA8A04', bg: '#FEFCE8', border: '#FEF08A', icon: '●', order: 2 },
  'Medium High': { color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3', icon: '●', order: 2 },
  'Medium Low':  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '●', order: 3 },
  Low:      { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', icon: '●', order: 4 },
  Info:     { color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', icon: '●', order: 5 },
};

// ── Typography Scale ─────────────────────────────────────────
export const TYPOGRAPHY = {
  coverTitle:      { size: 30, font: 'Helvetica-Bold', color: COLORS.white },
  coverSubtitle:   { size: 15, font: 'Helvetica',      color: '#B8C7CE' },
  coverMeta:       { size: 10, font: 'Helvetica',      color: '#D7E0E4' },
  sectionTitle:    { size: 17, font: 'Helvetica-Bold', color: COLORS.primary },
  sectionSubtitle: { size: 12, font: 'Helvetica-Bold', color: COLORS.gray700 },
  subsection:      { size: 11, font: 'Helvetica-Bold', color: COLORS.gray700 },
  body:            { size: 10, font: 'Helvetica',      color: COLORS.gray800 },
  bodySmall:       { size: 9,  font: 'Helvetica',      color: COLORS.gray600 },
  caption:         { size: 8,  font: 'Helvetica',      color: COLORS.gray500 },
  tableHeader:     { size: 8.5, font: 'Helvetica-Bold', color: COLORS.primary },
  tableCell:       { size: 8.5, font: 'Helvetica',      color: COLORS.gray800 },
  tableCellBold:   { size: 8.5, font: 'Helvetica-Bold', color: COLORS.gray800 },
  badge:           { size: 7.5, font: 'Helvetica-Bold', color: COLORS.white },
  kpiValue:        { size: 24, font: 'Helvetica-Bold', color: COLORS.primary },
  kpiLabel:        { size: 9,  font: 'Helvetica',      color: COLORS.gray500 },
  footer:          { size: 7.5, font: 'Helvetica',      color: COLORS.gray400 },
  header:          { size: 8,  font: 'Helvetica',      color: COLORS.gray400 },
  pageNumber:      { size: 8,  font: 'Helvetica-Bold', color: COLORS.gray500 },
};

// ── Spacing System (base 4px) ────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 56,
  section: 48,      // Between major sections
  paragraph: 14,    // Between paragraphs
  tableRow: 28,     // Row height (increased for readability)
  tableHeaderH: 30, // Header height
  cardPadding: 18,  // Card internal padding
  pagePadding: 56,  // Page margins
};

// ── Report Metadata ──────────────────────────────────────────
export const REPORT_META = {
  company: 'Entitlement Security',
  product: 'Entitlement_NU0141001',
  reportType: 'Vulnerability Assessment Report',
  classification: 'CONFIDENCIAL',
  version: '1.0',
  methodology: 'Análisis continuo de vulnerabilidades mediante herramientas automatizadas (SAST, DAST, SCA, Container Scanning, IaC) complementado con pentesting continuo.',
};

// ── Valid Tags ───────────────────────────────────────────────
export const VALID_TAGS = [
  'engine_dependencies',
  'c2c',
  'engine_container',
  'engine_iac',
  'fluidattacks',
  'black_list; engine_dependencies'
];

export const TAG_DESCRIPTIONS = {
  'engine_dependencies': 'Vulnerabilidades en dependencias/librerías del proyecto.',
  'c2c': 'Vulnerabilidades de Continuous Compliance (configuración AWS).',
  'engine_container': 'Vulnerabilidades en contenedores Docker.',
  'engine_iac': 'Vulnerabilidades en infraestructura como código (IaC).',
  'fluidattacks': 'Vulnerabilidades detectadas por Hacking Continuo (Fluid Attacks).',
  'black_list; engine_dependencies': 'Dependencias en lista negra.'
};

export const TAG_GROUPS = {
  'fluidattacks': ['fluidattacks'],
  'c2c': ['c2c'],
  'IAC/NGC/NG DEP': ['engine_dependencies', 'engine_container', 'engine_iac', 'black_list; engine_dependencies']
};

export const SEVERITY_ORDER = {
  'Critical': 0, 'High': 1, 'Medium High': 2, 'Medium': 3, 'Medium Low': 4, 'Low': 5, 'Info': 6
};
