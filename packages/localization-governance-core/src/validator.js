import { hashCatalog } from './hash.js';
import { normalizeLocale } from './locale.js';

const META_KEYS = new Set(['__label', '__meta']);
const PLACEHOLDER = /\{([A-Za-z0-9_]+)\}/g;

function cleanCatalog(catalog = {}) {
  return Object.fromEntries(
    Object.entries(catalog).filter(([key]) => !META_KEYS.has(key)),
  );
}

function tokenCounts(value) {
  const counts = new Map();
  for (const match of String(value ?? '').matchAll(PLACEHOLDER)) {
    counts.set(match[1], (counts.get(match[1]) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function addIssue(issues, code, key) {
  if (!issues.has(code)) issues.set(code, new Set());
  issues.get(code).add(key);
}

function pluralBase(key) {
  const match = key.match(/^(.*)_(zero|one|two|few|many|other)$/);
  return match ? { base: match[1], form: match[2] } : null;
}

export function validateCatalog(options) {
  const sourceLocale = normalizeLocale(options.sourceLocale);
  const targetLocale = normalizeLocale(options.targetLocale);
  const source = cleanCatalog(options.source);
  const target = cleanCatalog(options.target);
  const issues = new Map();
  const allowlist = new Set(options.untranslatedAllowlist ?? []);
  const sourceKeys = Object.keys(source).sort();
  const targetKeys = Object.keys(target).sort();

  for (const key of sourceKeys) {
    if (!(key in target)) {
      addIssue(issues, 'missing_key', key);
      continue;
    }
    if (typeof target[key] !== 'string' || target[key].trim() === '') {
      addIssue(issues, 'blank_value', key);
      continue;
    }
    if (JSON.stringify(tokenCounts(source[key])) !== JSON.stringify(tokenCounts(target[key]))) {
      addIssue(issues, 'placeholder_mismatch', key);
    }
    if (source[key] === target[key] && !allowlist.has(key)) {
      addIssue(issues, 'untranslated_value', key);
    }
  }

  for (const key of targetKeys) {
    if (!(key in source)) addIssue(issues, 'extra_key', key);
  }

  const sourcePluralGroups = new Map();
  for (const key of sourceKeys) {
    const parsed = pluralBase(key);
    if (!parsed) continue;
    if (!sourcePluralGroups.has(parsed.base)) sourcePluralGroups.set(parsed.base, new Set());
    sourcePluralGroups.get(parsed.base).add(parsed.form);
  }
  const targetCategories = new Set(new Intl.PluralRules(targetLocale).resolvedOptions().pluralCategories);
  targetCategories.add('other');
  for (const [base, sourceForms] of sourcePluralGroups) {
    for (const form of targetCategories) {
      if (sourceForms.has(form) && !(`${base}_${form}` in target)) {
        addIssue(issues, 'plural_form_missing', `${base}_${form}`);
      }
    }
  }

  const required = options.glossary?.required ?? {};
  const prohibited = options.glossary?.prohibited ?? {};
  for (const key of sourceKeys) {
    const sourceValue = String(source[key]);
    const targetValue = String(target[key] ?? '');
    for (const [sourceTerm, requiredTerm] of Object.entries(required)) {
      if (
        sourceValue.toLocaleLowerCase(sourceLocale).includes(sourceTerm.toLocaleLowerCase(sourceLocale))
        && !targetValue.toLocaleLowerCase(targetLocale).includes(String(requiredTerm).toLocaleLowerCase(targetLocale))
      ) {
        addIssue(issues, 'glossary_required_term_missing', key);
      }
    }
    for (const [sourceTerm, prohibitedTerm] of Object.entries(prohibited)) {
      if (
        sourceValue.toLocaleLowerCase(sourceLocale).includes(sourceTerm.toLocaleLowerCase(sourceLocale))
        && targetValue.toLocaleLowerCase(targetLocale).includes(String(prohibitedTerm).toLocaleLowerCase(targetLocale))
      ) {
        addIssue(issues, 'glossary_prohibited_term_present', key);
      }
    }
  }

  const translatedCount = sourceKeys.filter(
    (key) => key in target && typeof target[key] === 'string' && target[key].trim() !== '',
  ).length;
  const coverage = sourceKeys.length === 0
    ? 100
    : Math.min(100, Math.max(0, Math.round((translatedCount / sourceKeys.length) * 100)));
  const checks = [...issues.entries()]
    .map(([code, keys]) => ({
      code,
      severity: 'error',
      keys: [...keys].sort(),
      count: keys.size,
    }))
    .sort((left, right) => left.code.localeCompare(right.code));

  return {
    passed: checks.every((check) => check.severity !== 'error'),
    coverage,
    sourceContentHash: hashCatalog(source),
    contentHash: hashCatalog(target),
    checks,
  };
}
