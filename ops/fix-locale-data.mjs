import { readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('../apps/api/data/i18n/', import.meta.url).pathname;

// 1. Clear en.json — English falls back to clean baseMessages, no overrides
writeFileSync(dir + 'en.json', JSON.stringify({ __label: 'English' }, null, 2));

// 2. Clean espanol.json — was double-corrupted with [espanol][en] prefixes
writeFileSync(dir + 'espanol.json', JSON.stringify({ __label: 'Español' }, null, 2));

// 3. Clean englis.json — typo locale, strip corrupted translations
writeFileSync(dir + 'englis.json', JSON.stringify({ __label: 'English (typo)' }, null, 2));

// 4. Fix settings.json — change fallbackMode from 'prefixed' → 'copy' for all locales
//    so future auto-translates without a Google API key produce readable copy text
//    instead of "[locale] ..." prefixed strings
const settings = JSON.parse(readFileSync(dir + 'settings.json', 'utf8'));
for (const locale of Object.keys(settings)) {
  settings[locale].fallbackMode = 'copy';
}
writeFileSync(dir + 'settings.json', JSON.stringify(settings, null, 2));

console.log('[fix-locale-data] en.json cleared.');
console.log('[fix-locale-data] espanol.json cleared.');
console.log('[fix-locale-data] englis.json cleared.');
console.log('[fix-locale-data] settings.json fallbackMode set to "copy" for all locales:',
  Object.entries(settings).map(([k, v]) => `${k}:${v.fallbackMode}`).join(', '));
console.log('[fix-locale-data] Done. Restart the API to apply.');
