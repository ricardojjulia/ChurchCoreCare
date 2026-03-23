// Resets all locale translation overrides and settings by writing directly
// to the i18n data files on disk. This avoids the API saveCatalog merge bug
// (PATCH with {} is a no-op because the store does { ...current, ...{} }).
// After running this script the API must be restarted to reload clean data.

import { readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defaultLocale, localeLabels } from '../packages/i18n/src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const i18nDir = path.join(__dirname, '../apps/api/data/i18n');
const settingsFile = path.join(i18nDir, 'settings.json');

// Use 'copy' (not 'prefixed') so auto-translate without a Google API key
// produces readable English copy instead of "[locale] ..." prefixed strings.
const defaultSettings = {
  sourceLocale: 'en',
  tone: 'neutral',
  fallbackMode: 'copy',
  useGlossary: true,
  glossary: {},
};

function main() {
  const supportedLocales = [...new Set([defaultLocale, ...Object.keys(localeLabels)])].sort();
  const existingLocaleFiles = readdirSync(i18nDir)
    .filter((fileName) => fileName.endsWith('.json') && fileName !== 'settings.json')
    .map((fileName) => fileName.replace('.json', ''));

  const staleLocales = existingLocaleFiles.filter((locale) => !supportedLocales.includes(locale));
  for (const staleLocale of staleLocales) {
    unlinkSync(path.join(i18nDir, `${staleLocale}.json`));
    console.log(`[language-reset] removed non-standard locale file: ${staleLocale}`);
  }

  const settingsByLocale = {};

  for (const locale of supportedLocales) {
    // Keep only the __label metadata; strip all translation overrides so the
    // app falls back to clean baseMessages defined in packages/i18n/src/index.js
    let label;
    try {
      const existing = JSON.parse(readFileSync(path.join(i18nDir, `${locale}.json`), 'utf8'));
      label = existing.__label;
    } catch {
      label = undefined;
    }
    const canonicalLabel = localeLabels[locale] ?? locale.toUpperCase();
    const cleared = { __label: label ?? canonicalLabel };
    writeFileSync(path.join(i18nDir, `${locale}.json`), JSON.stringify(cleared, null, 2));

    settingsByLocale[locale] = { ...defaultSettings };
    console.log(`[language-reset] cleared locale: ${locale}`);
  }

  // Overwrite settings with clean defaults for all locales
  writeFileSync(settingsFile, JSON.stringify(settingsByLocale, null, 2));
  console.log('[language-reset] settings reset (fallbackMode: copy) for all locales.');

  console.log('[language-reset] completed successfully.');
  console.log('[language-reset] IMPORTANT: restart the API server for changes to take effect.');
  console.log(`[language-reset] locales reset: ${supportedLocales.join(', ')}`);
}

main();
