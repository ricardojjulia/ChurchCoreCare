import { GovernanceError } from './errors.js';

export function normalizeLocale(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new GovernanceError('invalid_locale', 'Locale is required.');
  }
  try {
    const [canonical] = Intl.getCanonicalLocales(value.trim());
    if (!canonical || !/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(canonical)) {
      throw new Error('invalid');
    }
    return canonical;
  } catch {
    throw new GovernanceError('invalid_locale', `Invalid locale: ${value}`);
  }
}
