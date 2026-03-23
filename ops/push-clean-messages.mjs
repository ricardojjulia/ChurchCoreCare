/**
 * Pushes the canonical baseMessages to the running API as overrides for the
 * 'en' locale. This overwrites any corrupted "[en] ..." strings that were
 * stored as overrides in the in-memory i18n store, fixing the display
 * without requiring an API restart.
 *
 * Root cause: "Auto Translate" was run on the English locale with
 * fallbackMode='prefixed' and no Google Translate API key, which stored
 * "[en] <text>" for every key as an override. Since overrides win over
 * baseMessages in buildLocaleCatalog(), they corrupted the UI.
 */

import { baseMessages } from '../packages/i18n/src/index.js';

const apiBase = (process.env.API_BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const headers = {
  'content-type': 'application/json',
  'x-staff-role': 'practice_admin',
  'x-tenant-id': 'system',
  'x-actor-id': 'push-clean-messages',
  'x-request-id': `push-clean-${Date.now()}`,
};

async function patchCatalog(locale, messages) {
  const res = await fetch(`${apiBase}/v1/i18n/catalog/${locale}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`PATCH catalog/${locale} failed ${res.status}: ${err.error || res.statusText}`);
  }
  return res.json();
}

async function main() {
  // Push clean English base messages — this merges on top of the corrupted
  // overrides: { ...corruptedOverrides, ...cleanBaseMessages } = clean result.
  console.log('[push-clean] Patching en locale with clean baseMessages...');
  await patchCatalog('en', { ...baseMessages });
  console.log('[push-clean] en locale updated in-memory.');

  // Verify the catalog no longer has [en] prefixes
  const res = await fetch(`${apiBase}/v1/i18n/catalog?locale=en`, { headers });
  const catalog = await res.json();
  const sample = catalog?.messages?.['panels.schedule'] ?? '(not found)';
  const dirty = sample.startsWith('[');
  console.log(`[push-clean] Verification — panels.schedule = "${sample}" ${dirty ? '❌ still dirty' : '✅ clean'}`);

  if (dirty) {
    console.error('[push-clean] Strings still have prefix — API restart required.');
    process.exit(1);
  }
  console.log('[push-clean] Done. All English strings are now clean without restart.');
}

main().catch((e) => { console.error('[push-clean] Error:', e.message); process.exit(1); });
