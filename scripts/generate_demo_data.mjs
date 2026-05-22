// ============================================================
// DEMO DATA GENERATOR  (150 registros ficticios)
// ============================================================
// Genera datos de ejemplo ficticios para findings.csv
// Sin relación con datos reales de ningún sistema
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, '..', 'data', 'Ejemplo', 'findings.csv');

const TARGET_ROWS = 150;

// ── Datos ficticios base ─────────────────────────────────────

const ENGAGEMENTS = [
  { name: 'DEMO_001_FakeBank_MR_ms_cuentas', product: 'Demo_DEMO001', area: 'EQUIPO DEMO BACKEND', type: 'DEMO PRODUCTO A', env: 'PRODUCCION' },
  { name: 'DEMO_002_FakeShop_MR_ms_pedidos', product: 'Demo_DEMO002', area: 'EQUIPO DEMO ECOMMERCE', type: 'DEMO PRODUCTO B', env: 'PRODUCCION' },
  { name: 'DEMO_003_FakeLogistic_MR_ms_envios', product: 'Demo_DEMO003', area: 'EQUIPO DEMO LOGISTICA', type: 'DEMO PRODUCTO C', env: 'ENTORNO PLATAFORMAS DE DESARROLLO' },
  { name: 'DEMO_004_FakeInsurance_MR_ms_polizas', product: 'Demo_DEMO004', area: 'EQUIPO DEMO SEGUROS', type: 'DEMO PRODUCTO D', env: 'PRODUCCION' },
  { name: 'DEMO_002_FakeShop_TEST_ms_pedidos_test', product: 'Demo_DEMO002', area: 'EQUIPO DEMO ECOMMERCE', type: 'DEMO PRODUCTO B', env: 'QA' },
];

const COMPONENTS = [
  { name: 'com.demo_fake-crypto-lib', version: '1.2.3', fix: '1.2.5' },
  { name: 'org.example_demo-http-client', version: '2.1.0', fix: '2.1.4' },
  { name: 'com.example_fake-json-parser', version: '3.0.1', fix: '3.0.3' },
  { name: 'io.demo_fake-db-driver', version: '4.5.2', fix: '4.5.9' },
  { name: 'org.demo_fake-xml-parser', version: '1.0.0', fix: '1.1.0' },
  { name: 'com.fake_demo-session-manager', version: '2.3.4', fix: '' },
  { name: 'io.example_demo-auth-lib', version: '5.1.0', fix: '5.1.3' },
  { name: 'com.demo_example-cache', version: '3.2.1', fix: '3.3.0' },
  { name: 'org.fake_demo-logger', version: '1.8.5', fix: '' },
  { name: 'com.example_demo-scheduler', version: '2.0.0', fix: '2.0.2' },
  { name: 'io.demo_fake-template-engine', version: '6.3.0', fix: '6.3.2' },
  { name: 'org.demo_fake-serializer', version: '0.9.1', fix: '' },
];

const VULNS_RAW = [
  {
    eng: 0, comp: 5, sev: 'Critical', cvss: 9.8, cve: 'CVE-2025-99001',
    title: 'Broken Authentication: Session tokens with insufficient entropy',
    desc: 'The session management module generates tokens with only 32 bits of entropy using a predictable PRNG seeded with system time. An attacker can brute-force valid tokens and hijack authenticated sessions without credentials.',
    mit: 'Upgrade com.fake:demo-session-manager to 3.0.0 or replace token generation with java.security.SecureRandom with at least 128-bit entropy.',
    tag: 'fluidattacks', found_by: 'fluidattacks', sla_remaining: -45,
  },
  {
    eng: 0, comp: 6, sev: 'High', cvss: 8.1, cve: 'CVE-2025-99002',
    title: 'SQL Injection via unparameterized dynamic query builder',
    desc: 'The user search endpoint concatenates user-supplied input directly into SQL statements without sanitization. An unauthenticated attacker can extract the full database contents or execute arbitrary DDL commands.',
    mit: 'Upgrade io.example:demo-auth-lib to 5.1.3 and replace all dynamic query construction with prepared statements.',
    tag: 'fluidattacks', found_by: 'fluidattacks', sla_remaining: 12,
  },
  {
    eng: 0, comp: 0, sev: 'High', cvss: 7.5, cve: 'CVE-2025-99003',
    title: 'Sensitive Data Exposure: Cryptographic keys stored in source code',
    desc: 'AES-128 encryption keys are hardcoded in the application source code and committed to the version control history. Any developer or CI/CD agent with repository access can retrieve and misuse these keys.',
    mit: 'Rotate all exposed keys immediately. Move secrets to a vault solution (e.g. HashiCorp Vault or AWS Secrets Manager). Remove key material from git history.',
    tag: 'fluidattacks', found_by: 'fluidattacks', sla_remaining: 25,
  },
  {
    eng: 2, comp: 4, sev: 'Medium', cvss: 6.1, cve: 'CVE-2025-99004',
    title: 'Cross-Site Scripting (Reflected) in error response body',
    desc: 'Error messages rendered by the XML parser module reflect unescaped request parameters into the HTML response. A remote attacker can craft a malicious link and execute arbitrary JavaScript in the victim\'s browser context.',
    mit: 'Upgrade org.demo:fake-xml-parser to 1.1.0 and apply output encoding on all user-supplied values before HTML rendering.',
    tag: 'fluidattacks', found_by: 'fluidattacks', sla_remaining: 60,
  },
  {
    eng: 2, comp: 8, sev: 'Medium', cvss: 5.3, cve: 'CVE-2025-99005',
    title: 'Verbose logging exposes internal stack traces to end users',
    desc: 'The logger library is configured to write full exception stack traces and internal class paths into HTTP responses in production. This information aids an attacker in identifying exploitable components and their versions.',
    mit: '',
    tag: 'fluidattacks', found_by: 'fluidattacks', sla_remaining: 75,
  },
  {
    eng: 3, comp: 3, sev: 'High', cvss: 8.8, cve: 'CVE-2025-99006',
    title: 'Insecure Direct Object Reference in policy document download',
    desc: 'The policy download endpoint accepts a numeric document ID as a URL parameter without verifying ownership. Any authenticated user can iterate IDs and download confidential policy documents belonging to other customers.',
    mit: 'Upgrade io.demo:fake-db-driver to 4.5.9 and implement resource-level authorization checks on every download request.',
    tag: 'fluidattacks', found_by: 'fluidattacks', sla_remaining: -10,
  },
  {
    eng: 3, comp: 11, sev: 'Low', cvss: 3.1, cve: 'CVE-2025-99007',
    title: 'Missing HTTP Strict-Transport-Security header',
    desc: 'Responses from the insurance portal do not include the Strict-Transport-Security (HSTS) header. Clients connecting over HTTP are not automatically upgraded to HTTPS, enabling potential downgrade attacks on insecure networks.',
    mit: '',
    tag: 'fluidattacks', found_by: 'fluidattacks', sla_remaining: 120,
  },
  {
    eng: 4, comp: 1, sev: 'Medium', cvss: 5.9, cve: 'CVE-2025-99008',
    title: 'Open Redirect via unvalidated returnUrl query parameter',
    desc: 'The login flow in the test environment accepts an arbitrary returnUrl parameter and redirects the user post-authentication without validating the destination domain, enabling phishing via trusted-domain redirects.',
    mit: 'Upgrade org.example:demo-http-client to 2.1.4 and implement an allowlist of valid redirect destinations.',
    tag: 'fluidattacks', found_by: 'fluidattacks', sla_remaining: 40,
  },
  {
    eng: 1, comp: 7, sev: 'Critical', cvss: 9.1, cve: 'CVE-2025-99009',
    title: 'AWS S3 bucket with public read access and no encryption at rest',
    desc: 'The S3 bucket used by the orders service for storing order attachments is configured with ACL public-read and has server-side encryption disabled. Any unauthenticated internet user can list and download customer order files.',
    mit: 'Enable SSE-S3 or SSE-KMS encryption. Remove public-read ACL and enforce bucket policy to deny public access. Upgrade cache lib to 3.3.0.',
    tag: 'c2c', found_by: 'AWS Config', sla_remaining: -30,
  },
  {
    eng: 1, comp: 2, sev: 'High', cvss: 8.0, cve: 'CVE-2025-99010',
    title: 'IAM role with wildcard action allows privilege escalation',
    desc: 'An IAM role attached to the orders microservice grants "Action: *" on "Resource: *" without condition keys. A compromised instance can call any AWS API including IAM manipulation APIs, enabling full account takeover.',
    mit: 'Restrict IAM role to least-privilege actions required by the service. Apply permission boundaries.',
    tag: 'c2c', found_by: 'AWS Config', sla_remaining: 5,
  },
  {
    eng: 1, comp: 9, sev: 'Medium', cvss: 6.5, cve: 'CVE-2025-99011',
    title: 'CloudTrail logging disabled for management events in region us-east-1',
    desc: 'AWS CloudTrail is not enabled for management event logging in the us-east-1 region. Privileged API calls including IAM changes and security group modifications go unrecorded, reducing visibility for incident response.',
    mit: '',
    tag: 'c2c', found_by: 'AWS Config', sla_remaining: 55,
  },
  {
    eng: 3, comp: 7, sev: 'Medium', cvss: 5.5, cve: 'CVE-2025-99012',
    title: 'Security group allows unrestricted inbound SSH access from 0.0.0.0/0',
    desc: 'The EC2 security group associated with the insurance service allows inbound TCP port 22 (SSH) from all IPv4 addresses. This unnecessarily expands the attack surface and enables brute-force login attempts from the internet.',
    mit: 'Restrict SSH access to a bastion host IP range or use AWS Systems Manager Session Manager to eliminate SSH exposure entirely.',
    tag: 'c2c', found_by: 'AWS Config', sla_remaining: 88,
  },
  {
    eng: 3, comp: 10, sev: 'Low', cvss: 3.5, cve: 'CVE-2025-99013',
    title: 'RDS instance with automated backups disabled',
    desc: 'The RDS database instance for the insurance service has automated backups disabled. A failure or ransomware event would result in irreversible data loss without a point-in-time recovery option.',
    mit: 'Enable automated backups with a retention period of at least 7 days. Upgrade template engine to 6.3.2.',
    tag: 'c2c', found_by: 'AWS Config', sla_remaining: 150,
  },
  {
    eng: 0, comp: 1, sev: 'High', cvss: 7.8, cve: 'CVE-2025-99014',
    title: 'HTTP Client: Server-Side Request Forgery via malformed redirect handling',
    desc: 'org.example:demo-http-client versions below 2.1.4 do not validate redirect destinations when following 3xx responses. An attacker controlling a server can redirect the client to internal network endpoints (e.g. AWS metadata service at 169.254.169.254).',
    mit: 'Upgrade org.example:demo-http-client to 2.1.4.',
    tag: 'engine_dependencies', found_by: 'Trivy Scan', sla_remaining: 20,
  },
  {
    eng: 0, comp: 2, sev: 'Medium', cvss: 6.2, cve: 'CVE-2025-99015',
    title: 'JSON Parser: Uncontrolled resource consumption via deeply nested input',
    desc: 'com.example:fake-json-parser versions before 3.0.3 do not impose limits on object nesting depth. A crafted JSON payload with thousands of nested objects causes unbounded memory allocation and stack overflow, leading to denial of service.',
    mit: 'Upgrade com.example:fake-json-parser to 3.0.3.',
    tag: 'engine_dependencies', found_by: 'Trivy Scan', sla_remaining: 70,
  },
  {
    eng: 1, comp: 0, sev: 'High', cvss: 8.2, cve: 'CVE-2025-99016',
    title: 'Crypto Lib: Weak RSA key generation due to biased PRNG',
    desc: 'com.demo:fake-crypto-lib prior to 1.2.5 uses a PRNG with a measurable statistical bias when generating RSA prime candidates. Sufficiently large samples of public keys generated by the affected library can be factored using a lattice-based attack.',
    mit: 'Upgrade com.demo:fake-crypto-lib to 1.2.5.',
    tag: 'engine_dependencies', found_by: 'Trivy Scan', sla_remaining: -5,
  },
  {
    eng: 1, comp: 3, sev: 'Critical', cvss: 9.8, cve: 'CVE-2025-99017',
    title: 'DB Driver: Remote code execution via deserialization of untrusted data',
    desc: 'io.demo:fake-db-driver versions before 4.5.9 deserialize server-provided responses without type validation. A malicious or compromised database server can deliver a gadget chain payload that executes arbitrary code on the application host.',
    mit: 'Upgrade io.demo:fake-db-driver to 4.5.9 immediately.',
    tag: 'engine_dependencies', found_by: 'Trivy Scan', sla_remaining: -60,
  },
  {
    eng: 2, comp: 6, sev: 'Medium', cvss: 5.8, cve: 'CVE-2025-99018',
    title: 'Auth Lib: JWT signature verification bypass with algorithm confusion',
    desc: 'io.example:demo-auth-lib before 5.1.3 accepts JWTs with the "none" algorithm if the header algorithm field is set to "None" (mixed case). An attacker can forge arbitrary JWT payloads and bypass authentication entirely.',
    mit: 'Upgrade io.example:demo-auth-lib to 5.1.3 and explicitly reject the "none" algorithm in the JWT validation configuration.',
    tag: 'engine_dependencies', found_by: 'Trivy Scan', sla_remaining: 35,
  },
  {
    eng: 2, comp: 9, sev: 'Low', cvss: 3.7, cve: 'CVE-2025-99019',
    title: 'Scheduler: Denial of service via malformed cron expression',
    desc: 'com.example:demo-scheduler version 2.0.0 does not validate cron expressions before parsing. A user with job scheduling permissions can submit an expression with a zero-length time unit that causes an infinite loop in the scheduler thread.',
    mit: 'Upgrade com.example:demo-scheduler to 2.0.2.',
    tag: 'engine_dependencies', found_by: 'Trivy Scan', sla_remaining: 110,
  },
  {
    eng: 3, comp: 4, sev: 'Medium', cvss: 6.5, cve: 'CVE-2025-99020',
    title: 'XML Parser: Billion laughs XML entity expansion attack',
    desc: 'org.demo:fake-xml-parser versions before 1.1.0 do not set limits on XML entity expansion. A small XML document that references deeply nested entities can expand to gigabytes in memory, causing out-of-memory conditions.',
    mit: 'Upgrade org.demo:fake-xml-parser to 1.1.0.',
    tag: 'engine_dependencies', found_by: 'Trivy Scan', sla_remaining: 45,
  },
  {
    eng: 4, comp: 10, sev: 'Medium', cvss: 5.0, cve: 'CVE-2025-99021',
    title: 'Template Engine: Server-side template injection via user-controlled input',
    desc: 'io.demo:fake-template-engine 6.3.0 evaluates template expressions found in user input without sandboxing. An attacker can inject template directives that execute arbitrary server-side code or read sensitive files from the filesystem.',
    mit: 'Upgrade io.demo:fake-template-engine to 6.3.2 and always sanitize input before passing it to the template rendering context.',
    tag: 'engine_dependencies', found_by: 'Trivy Scan', sla_remaining: 90,
  },
  {
    eng: 0, comp: 7, sev: 'High', cvss: 8.6, cve: 'CVE-2025-99022',
    title: 'Container image running as root user without read-only filesystem',
    desc: 'The Docker image for the accounts service runs processes as root (UID 0) and mounts the application volume as read-write. A container escape or RCE vulnerability would immediately grant root-level access to the host namespace.',
    mit: 'Define a non-root USER in the Dockerfile and set the root filesystem to read-only using securityContext.readOnlyRootFilesystem: true.',
    tag: 'engine_container', found_by: 'Trivy Scan', sla_remaining: 18,
  },
  {
    eng: 1, comp: 11, sev: 'Medium', cvss: 5.5, cve: 'CVE-2025-99023',
    title: 'Container image based on deprecated base OS with unpatched CVEs',
    desc: 'The orders service container image is built on a base OS image that reached end-of-life and no longer receives security patches. Several high-severity kernel and libc vulnerabilities remain unpatched in the base layer.',
    mit: 'Rebuild image using a maintained base image (e.g. alpine:3.19 or debian:bookworm-slim). Pin base image digest to prevent supply-chain substitution.',
    tag: 'engine_container', found_by: 'Trivy Scan', sla_remaining: 65,
  },
  {
    eng: 2, comp: 5, sev: 'Low', cvss: 3.3, cve: 'CVE-2025-99024',
    title: 'Secrets mounted as environment variables in container spec',
    desc: 'Database credentials and API keys are injected as environment variables in the Kubernetes pod specification using plain-text values. Environment variables are readable by any process in the container and may be leaked via /proc inspection.',
    mit: '',
    tag: 'engine_container', found_by: 'Trivy Scan', sla_remaining: 135,
  },
  {
    eng: 3, comp: 2, sev: 'Info', cvss: 0.0, cve: '',
    title: 'Container image has no defined HEALTHCHECK instruction',
    desc: 'The insurance service Dockerfile does not define a HEALTHCHECK instruction. Without a health check, orchestrators cannot detect hung or unresponsive containers and may route traffic to degraded instances.',
    mit: 'Add HEALTHCHECK INTERVAL=30s TIMEOUT=5s CMD curl -f http://localhost:8080/actuator/health || exit 1 to the Dockerfile.',
    tag: 'engine_container', found_by: 'Trivy Scan', sla_remaining: 999,
  },
  {
    eng: 0, comp: 9, sev: 'High', cvss: 7.9, cve: 'CVE-2025-99025',
    title: 'Terraform: S3 backend state file has no encryption or access logging',
    desc: 'The Terraform remote state backend S3 bucket is configured without server-side encryption and without access logging. The state file contains sensitive infrastructure metadata including IAM role ARNs and database connection strings.',
    mit: 'Enable SSE-KMS on the Terraform state bucket and configure S3 access logging to a separate audit bucket.',
    tag: 'engine_iac', found_by: 'Checkov', sla_remaining: 28,
  },
  {
    eng: 1, comp: 10, sev: 'Medium', cvss: 6.0, cve: 'CVE-2025-99026',
    title: 'Kubernetes RBAC: ClusterRole binds wildcard verbs to core API group',
    desc: 'A ClusterRole definition in the Helm chart grants ["*"] verbs on core API resources including pods, secrets, and configmaps. Any service account bound to this role can read cluster-wide secrets and execute arbitrary commands in any pod.',
    mit: 'Replace wildcard verbs with explicit minimal verb sets. Separate read and write roles. Upgrade scheduler to 2.0.2 to patch related scheduling flaw.',
    tag: 'engine_iac', found_by: 'Checkov', sla_remaining: 50,
  },
  {
    eng: 2, comp: 8, sev: 'Info', cvss: 0.0, cve: '',
    title: 'Terraform module lacks required_providers version constraints',
    desc: 'Several Terraform modules declare providers without pinning to a specific version range. Uncontrolled provider upgrades during terraform init can introduce breaking changes or subtle behavioral differences in infrastructure configuration.',
    mit: '',
    tag: 'engine_iac', found_by: 'Checkov', sla_remaining: 999,
  },
  {
    eng: 1, comp: 11, sev: 'High', cvss: 8.0, cve: 'CVE-2025-99027',
    title: 'Blacklisted dependency: known malicious package in transitive graph',
    desc: 'A transitive dependency of the orders service pulls in org.fake:demo-serializer 0.9.1, which appears on the internal security blacklist following the discovery of obfuscated exfiltration code in a previous patch release.',
    mit: 'Remove org.fake:demo-serializer from the dependency graph. Replace with a vetted serialization alternative and verify no other transitive paths re-introduce the package.',
    tag: 'black_list; engine_dependencies', found_by: 'Trivy Scan', sla_remaining: -20,
  },
];

// ── CSV helpers ──────────────────────────────────────────────

function escapeCSV(val) {
  if (val === null || val === undefined) return '';

  const s = String(val);

  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }

  return s;
}

function row(fields) {
  if (fields.length !== HEADER.length) {
    throw new Error(`Fila inválida: se esperaban ${HEADER.length} columnas y llegaron ${fields.length}`);
  }

  return fields.map(escapeCSV).join(',');
}

// ── Row builder ──────────────────────────────────────────────

const HEADER = [
  'accepted_by',
  'active',
  'component_name',
  'component_version',
  'created',
  'cvssv3_score',
  'description',
  'epss_percentile',
  'epss_score',
  'false_p',
  'file_path',
  'id',
  'is_mitigated',
  'line',
  'long_term_acceptance',
  'mitigated',
  'mitigation',
  'priority',
  'priority_classification',
  'references',
  'reviewed_by',
  'risk_status',
  'severity',
  'sla_age',
  'sla_days_remaining',
  'sla_expiration_date',
  'sla_start_date',
  'title',
  'risk_acceptance_expiration_date',
  'environment_image',
  'cluster',
  'registry_image',
  'repository_image',
  'namespace_image',
  'tag_image',
  'cloud_id',
  'hostname',
  'custom_id',
  'found_by',
  'engagement',
  'area_responsible',
  'product',
  'product_type',
  'product_type_environment',
  'company',
  'endpoints',
  'vulnerability_ids',
  'tags',
  'classification',
];

const TODAY = new Date(Date.UTC(2026, 4, 21, 10, 0, 0));

function formatUTCDate(date) {
  return date.toISOString().split('T')[0];
}

function formatUTCTimestamp(date) {
  return date
    .toISOString()
    .replace('T', ' ')
    .replace('Z', '+00:00');
}

function addDays(date, n) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return formatUTCDate(d);
}

function buildCreatedDate(index) {
  const d = new Date(TODAY);
  d.setUTCMinutes(d.getUTCMinutes() + index);
  return formatUTCTimestamp(d);
}

const SEV_PRIORITY_MAP = {
  Critical: { priority: '0.01', pc: 'Critical' },
  High: { priority: '0.01', pc: 'High' },
  'Medium High': { priority: '0.01', pc: 'Medium High' },
  Medium: { priority: '0.01', pc: 'Medium Low' },
  'Medium Low': { priority: '0.01', pc: 'Medium Low' },
  Low: { priority: '0.01', pc: 'Low' },
  Info: { priority: '0.00', pc: 'Info' },
};

const rows = [HEADER.join(',')];
let idCounter = 10000001;

for (let i = 0; i < TARGET_ROWS; i++) {
  const base = VULNS_RAW[i % VULNS_RAW.length];

  const eng = ENGAGEMENTS[i % ENGAGEMENTS.length];
  const comp = COMPONENTS[i % COMPONENTS.length];

  const slaVariation = (i % 40) - 20;
  const slaRemaining = base.sla_remaining + slaVariation;

  const slaExp = addDays(TODAY, slaRemaining);
  const slaStart = addDays(TODAY, slaRemaining - 180);
  const slaAge = 180 + (i % 30);

  const pm = SEV_PRIORITY_MAP[base.sev] || SEV_PRIORITY_MAP.Medium;

  const epssPercentile = +(Math.random() * 0.4).toFixed(5);
  const epssScore = +(Math.random() * 0.001).toFixed(5);

  const refBase = base.cve
    ? `https://nvd.nist.gov/vuln/detail/${base.cve} NEWLINE https://www.cve.org/CVERecord?id=${base.cve} NEWLINE https://demo.example.com/advisories/${base.cve}`
    : 'https://demo.example.com/advisories/DEMO-BEST-PRACTICES';

  const vulnIds = base.cve
    ? `${base.cve} ${comp.name} ${comp.version}`
    : '';

  rows.push(row([
    '',                                                    // accepted_by
    'True',                                                // active
    comp.name,                                             // component_name
    comp.version,                                          // component_version
    buildCreatedDate(i),                                   // created
    base.cvss,                                             // cvssv3_score
    `${base.desc} Demo record ${i + 1}.`,                  // description
    epssPercentile,                                        // epss_percentile
    epssScore,                                             // epss_score
    'False',                                               // false_p
    `src/main/${comp.name.replace(/_/g, '/')}/demo_${i + 1}.java`, // file_path
    idCounter++,                                           // id
    'False',                                               // is_mitigated
    '',                                                    // line
    '',                                                    // long_term_acceptance
    '',                                                    // mitigated
    base.mit || comp.fix || '',                            // mitigation
    pm.priority,                                           // priority
    pm.pc,                                                 // priority_classification
    refBase,                                               // references
    '',                                                    // reviewed_by
    'Risk Active',                                         // risk_status
    base.sev,                                              // severity
    slaAge,                                                // sla_age
    slaRemaining,                                          // sla_days_remaining
    slaExp,                                                // sla_expiration_date
    slaStart,                                              // sla_start_date
    `${base.title} - Demo ${i + 1}`,                       // title
    '',                                                    // risk_acceptance_expiration_date
    '',                                                    // environment_image
    '',                                                    // cluster
    '',                                                    // registry_image
    '',                                                    // repository_image
    '',                                                    // namespace_image
    '',                                                    // tag_image
    '',                                                    // cloud_id
    '',                                                    // hostname
    '',                                                    // custom_id
    base.found_by,                                         // found_by
    eng.name,                                              // engagement
    eng.area,                                              // area_responsible
    eng.product,                                           // product
    eng.type,                                              // product_type
    eng.env,                                               // product_type_environment
    'Demo Corp',                                           // company
    '',                                                    // endpoints
    vulnIds,                                               // vulnerability_ids
    base.tag,                                              // tags
    'Business Application',                                // classification
  ]));
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, rows.join('\n'), 'utf-8');

console.log(`✓ Demo data generada: ${rows.length - 1} vulnerabilidades → ${OUTPUT}`);