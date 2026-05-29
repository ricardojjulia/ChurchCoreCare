/**
 * nightly-security-runner.mjs
 *
 * Orchestrates the nightly AppSec and DB Security scans for ChurchCore Care.
 * Generates dated JSON reports and a human-readable Markdown summary in
 * docs/SecurityChecks/.
 *
 * Features:
 *   - Runs AppSec scan  (ops/appsec-scan.mjs)
 *   - Runs DB Security scan  (ops/db-security-scan.mjs)
 *   - Writes timestamped JSON reports to docs/SecurityChecks/
 *   - Writes a Markdown summary for human review
 *   - Exits non-zero if critical issues are detected (for CI gating)
 *
 * Usage:
 *   node ops/nightly-security-runner.mjs [--dry-run]
 *
 * Environment:
 *   SECURITY_REPORT_DIR  — Override output directory (default: docs/SecurityChecks)
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync, unlinkSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = join(__dirname, '..');

const DRY_RUN    = process.argv.includes('--dry-run');
const REPORT_DIR = process.env.SECURITY_REPORT_DIR
  ? join(ROOT, process.env.SECURITY_REPORT_DIR)
  : join(ROOT, 'docs/SecurityChecks');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function isoDateTime() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19); // safe for filenames
}

function badge(status) {
  const map = {
    CLEAN:    '✅ CLEAN',
    LOW:      '🟡 LOW',
    MEDIUM:   '🟠 MEDIUM',
    HIGH:     '🔴 HIGH',
    CRITICAL: '🚨 CRITICAL',
    ERROR:    '❌ ERROR',
  };
  return map[status] ?? `⚪ ${status}`;
}

function runScan(scriptPath, outputPath) {
  console.log(`\n[runner] Running: node ${relative(ROOT, scriptPath)}`);
  const result = spawnSync(
    'node',
    [scriptPath, '--output', outputPath],
    {
      cwd: ROOT,
      stdio: ['ignore', 'inherit', 'inherit'],
      timeout: 300_000, // 5 minute timeout
    }
  );

  return {
    exitCode:  result.status ?? 1,
    timedOut:  result.signal === 'SIGTERM',
    error:     result.error?.message ?? null,
  };
}

function loadReportEsm(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

// ─── Markdown report generator ────────────────────────────────────────────────

function formatIssueSeveritySection(issues, level) {
  const filtered = issues.filter(i => i.level === level);
  if (filtered.length === 0) return '';

  const emoji = { critical: '🚨', high: '🔴', medium: '🟠', low: '🟡', info: 'ℹ️' }[level] ?? '⚪';
  let out = `\n#### ${emoji} ${level.toUpperCase()} (${filtered.length})\n\n`;
  for (const issue of filtered) {
    out += `- **${issue.check}**: ${issue.message}`;
    if (issue.file || issue.context) out += ` *(${issue.file ?? issue.context}${issue.line ? `:${issue.line}` : ''})*`;
    if (issue.recommendation) out += `\n  - 💡 ${issue.recommendation}`;
    out += '\n';
  }
  return out;
}

function generateMarkdownSummary({ date, appSecReport, dbReport, appSecResult, dbResult }) {
  const ts = new Date().toUTCString();

  let md = `# 🔒 Nightly Security Report — ${date}\n\n`;
  md += `> Generated: ${ts}\n\n`;
  md += `---\n\n`;

  // Overall status
  const appStatus = appSecReport?.overallStatus ?? (appSecResult.exitCode !== 0 ? 'ERROR' : 'UNKNOWN');
  const dbStatus  = dbReport?.overallStatus     ?? (dbResult.exitCode !== 0    ? 'ERROR' : 'UNKNOWN');

  md += `## 📊 Executive Summary\n\n`;
  md += `| Scan | Status | Critical | High | Medium | Low |\n`;
  md += `|------|--------|----------|------|--------|-----|\n`;

  if (appSecReport) {
    const s = appSecReport.summary;
    md += `| AppSec | ${badge(appStatus)} | ${s.critical} | ${s.high} | ${s.medium} | ${s.low} |\n`;
  } else {
    md += `| AppSec | ${badge('ERROR')} | — | — | — | — |\n`;
  }

  if (dbReport) {
    const s = dbReport.summary;
    md += `| DB Security | ${badge(dbStatus)} | ${s.critical} | ${s.high} | ${s.medium} | ${s.low} |\n`;
  } else {
    md += `| DB Security | ${badge('ERROR')} | — | — | — | — |\n`;
  }

  md += `\n`;

  // PHI compliance callout
  if (dbReport?.phiComplianceSummary) {
    const phi = dbReport.phiComplianceSummary;
    const pct = phi.encryptionCoverage;
    const phiBadge = pct === 100 ? '✅' : pct >= 90 ? '🟡' : '🚨';
    md += `### ${phiBadge} PHI/PII Encryption Coverage: ${phi.encryptedPhiFields}/${phi.totalPhiFields} fields (${pct}%)\n\n`;
    if (pct < 100) {
      md += `> ⚠️ **${phi.unencryptedPhiFields} field(s) contain potential PHI/PII without encryption.**\n`;
      md += `> Review the DB Security findings below for details.\n\n`;
    } else {
      md += `> All identified PHI/PII fields are encrypted at rest.\n\n`;
    }
  }

  md += `---\n\n`;

  // AppSec Section
  md += `## 🛡️ Application Security (AppSec) Scan\n\n`;
  if (appSecReport) {
    md += `- **Files scanned:** ${appSecReport.sourceFilesScanned}\n`;
    md += `- **Started:** ${appSecReport.startedAt}\n`;
    md += `- **Completed:** ${appSecReport.generatedAt}\n\n`;

    const allIssues = appSecReport.checks.flatMap(c => c.issues ?? []);

    ['critical', 'high', 'medium', 'low'].forEach(level => {
      const section = formatIssueSeveritySection(allIssues, level);
      if (section) md += section;
    });

    const infoIssues = allIssues.filter(i => i.level === 'info');
    if (infoIssues.length > 0) {
      md += `\n#### ✅ Confirmations (${infoIssues.length})\n\n`;
      for (const issue of infoIssues) {
        md += `- ${issue.message}\n`;
      }
    }
  } else {
    md += `> ❌ AppSec scan failed to run or produced no output.\n`;
    if (appSecResult.error) md += `> Error: ${appSecResult.error}\n`;
  }

  md += `\n---\n\n`;

  // DB Security Section
  md += `## 🗄️ Database Security Scan\n\n`;
  if (dbReport) {
    md += `- **Tables analyzed:** ${dbReport.tablesAnalyzed}\n`;
    md += `- **Schema file:** \`${dbReport.schemaPath}\`\n`;
    md += `- **Started:** ${dbReport.startedAt}\n`;
    md += `- **Completed:** ${dbReport.generatedAt}\n\n`;

    const allDbIssues = dbReport.checks.flatMap(c => c.issues ?? []);

    ['critical', 'high', 'medium', 'low'].forEach(level => {
      const section = formatIssueSeveritySection(allDbIssues, level);
      if (section) md += section;
    });

    const dbInfoIssues = allDbIssues.filter(i => i.level === 'info');
    if (dbInfoIssues.length > 0) {
      md += `\n#### ✅ Confirmations (${dbInfoIssues.length})\n\n`;
      for (const issue of dbInfoIssues) {
        md += `- ${issue.message}\n`;
      }
    }

    // PHI tables detail
    if (dbReport.phiTablesAudited?.length > 0) {
      md += `\n### PHI/PII Field Audit\n\n`;
      md += `| Table | Column | Status |\n`;
      md += `|-------|--------|--------|\n`;
      for (const { table, columns } of dbReport.phiTablesAudited) {
        for (const col of columns) {
          const colStatus = col.status === 'encrypted' ? '✅ Encrypted' : '🚨 PLAINTEXT';
          md += `| ${table} | ${col.name} | ${colStatus} |\n`;
        }
      }
      md += `\n`;
    }
  } else {
    md += `> ❌ DB Security scan failed to run or produced no output.\n`;
    if (dbResult.error) md += `> Error: ${dbResult.error}\n`;
  }

  md += `\n---\n\n`;
  md += `## 📁 Raw Report Files\n\n`;
  md += `Full JSON reports are stored in \`docs/SecurityChecks/\`:\n\n`;

  return md;
}

// ─── Retention: remove old reports ────────────────────────────────────────────

function pruneOldReports(dir, keepDays = 30) {
  if (!existsSync(dir)) return;
  const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
  const entries = readdirSync(dir);
  let pruned = 0;

  for (const entry of entries) {
    if (!entry.endsWith('.json') && !entry.endsWith('.md')) continue;
    // Parse date from filename like appsec-2026-04-06T23-00-00.json
    const dateMatch = entry.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) continue;
    const fileDate = new Date(dateMatch[1]).getTime();
    if (fileDate < cutoff) {
      try {
        if (!entry.toLowerCase().includes('readme')) {
          unlinkSync(join(dir, entry));
          pruned++;
        }
      } catch { /* skip */ }
    }
  }

  if (pruned > 0) console.log(`[runner] Pruned ${pruned} report(s) older than ${keepDays} days`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const runDate     = isoDate();
  const runDateTime = isoDateTime();

  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ChurchCore Care — Nightly Security Runner`);
  console.log(`  Date: ${runDate}  |  UTC: ${new Date().toUTCString()}`);
  if (DRY_RUN) console.log(`  MODE: DRY RUN (no files will be written)`);
  console.log(`${'='.repeat(70)}\n`);

  // Ensure output directory exists
  if (!DRY_RUN) {
    mkdirSync(REPORT_DIR, { recursive: true });
  }

  const appSecReportPath = join(REPORT_DIR, `appsec-${runDateTime}.json`);
  const dbReportPath     = join(REPORT_DIR, `db-security-${runDateTime}.json`);
  const summaryPath      = join(REPORT_DIR, `summary-${runDate}.md`);

  const appSecScript = join(ROOT, 'ops/appsec-scan.mjs');
  const dbScript     = join(ROOT, 'ops/db-security-scan.mjs');

  // ── Step 1: AppSec scan ────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`  STEP 1: Application Security (AppSec) Scan`);
  console.log(`${'─'.repeat(70)}`);

  let appSecResult = { exitCode: 0, timedOut: false, error: null };
  if (!DRY_RUN) {
    appSecResult = runScan(appSecScript, appSecReportPath);
    console.log(`[runner] AppSec scan exit code: ${appSecResult.exitCode}`);
  } else {
    console.log('[runner] DRY RUN — skipping AppSec scan execution');
  }

  // ── Step 2: DB security scan ───────────────────────────────────────────────
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`  STEP 2: Database Security + PHI/PII Scan`);
  console.log(`${'─'.repeat(70)}`);

  let dbResult = { exitCode: 0, timedOut: false, error: null };
  if (!DRY_RUN) {
    dbResult = runScan(dbScript, dbReportPath);
    console.log(`[runner] DB Security scan exit code: ${dbResult.exitCode}`);
  } else {
    console.log('[runner] DRY RUN — skipping DB Security scan execution');
  }

  // ── Step 3: Load reports and generate summary ─────────────────────────────
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`  STEP 3: Generating Summary Report`);
  console.log(`${'─'.repeat(70)}\n`);

  const appSecReport = existsSync(appSecReportPath) ? loadReportEsm(appSecReportPath) : null;
  const dbReport     = existsSync(dbReportPath)     ? loadReportEsm(dbReportPath)     : null;

  const markdownSummary = generateMarkdownSummary({
    date: runDate,
    appSecReport,
    dbReport,
    appSecResult,
    dbResult,
  });

  // Append report file links
  let fullMarkdown = markdownSummary;
  fullMarkdown += `- [\`appsec-${runDateTime}.json\`](./appsec-${runDateTime}.json)\n`;
  fullMarkdown += `- [\`db-security-${runDateTime}.json\`](./db-security-${runDateTime}.json)\n\n`;
  fullMarkdown += `---\n\n`;
  fullMarkdown += `*This report was generated automatically by the nightly security runner.*\n`;
  fullMarkdown += `*See \`ops/nightly-security-runner.mjs\` for implementation.*\n`;

  if (!DRY_RUN) {
    writeFileSync(summaryPath, fullMarkdown, 'utf8');
    console.log(`[runner] Summary written to: ${relative(ROOT, summaryPath)}`);
  } else {
    console.log('[runner] DRY RUN — summary would be written to:', relative(ROOT, summaryPath));
    console.log('\n' + fullMarkdown);
  }

  // ── Step 4: Prune old reports ─────────────────────────────────────────────
  if (!DRY_RUN) {
    pruneOldReports(REPORT_DIR, 30);
  }

  // ── Final summary ─────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  Nightly Security Run Complete`);
  console.log(`  AppSec : ${appSecReport?.overallStatus ?? 'ERROR'}`);
  console.log(`  DB     : ${dbReport?.overallStatus ?? 'ERROR'}`);
  console.log(`  Reports: ${relative(ROOT, REPORT_DIR)}/`);
  console.log(`${'='.repeat(70)}\n`);

  // Exit non-zero if either scan found critical issues
  const appSecCritical = appSecReport?.summary?.critical ?? 0;
  const dbCritical     = dbReport?.summary?.critical ?? 0;
  const scanErrors     = (appSecResult.exitCode > 0 ? 1 : 0) + (dbResult.exitCode > 0 ? 1 : 0);

  if (appSecCritical + dbCritical > 0) {
    console.error(`[runner] ⛔ ${appSecCritical + dbCritical} CRITICAL issue(s) found — review required`);
    process.exit(2);
  }

  if (scanErrors > 0) {
    console.error(`[runner] ⚠️  ${scanErrors} scan(s) exited with errors`);
    process.exit(1);
  }

  console.log('[runner] ✅ Nightly security checks passed');
}

main().catch(err => {
  console.error('[runner] Fatal error:', err.message);
  process.exit(1);
});
