import test from 'node:test';
import assert from 'node:assert/strict';

import { GovernanceError } from '@localization-governance/core';
import { createGoogleTranslationProvider } from '../src/index.js';

test('requires an API key', () => {
  assert.throws(
    () => createGoogleTranslationProvider({ apiKey: '' }),
    (error) => error instanceof GovernanceError && error.code === 'provider_failure',
  );
});

test('returns an empty result without calling fetch for an empty batch', async () => {
  let called = false;
  const provider = createGoogleTranslationProvider({
    apiKey: 'test',
    fetch: async () => { called = true; },
  });
  const result = await provider.translate({
    sourceLocale: 'en-US',
    targetLocale: 'es-MX',
    messages: {},
  });
  assert.deepEqual(result.messages, {});
  assert.equal(called, false);
});

test('preserves keys, forwards abort signal, and decodes translated HTML entities', async () => {
  const signal = AbortSignal.timeout(5000);
  let request;
  const provider = createGoogleTranslationProvider({
    apiKey: 'secret',
    fetch: async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        async json() {
          return {
            data: {
              translations: [
                { translatedText: 'Hola &amp; bienvenido' },
                { translatedText: 'Adiós' },
              ],
            },
          };
        },
      };
    },
  });

  const result = await provider.translate({
    sourceLocale: 'en-US',
    targetLocale: 'es-MX',
    messages: { hello: 'Hello & welcome', goodbye: 'Goodbye' },
    signal,
  });

  assert.deepEqual(result.messages, {
    hello: 'Hola & bienvenido',
    goodbye: 'Adiós',
  });
  assert.equal(request.options.signal, signal);
  const body = JSON.parse(request.options.body);
  assert.equal(body.source, 'en');
  assert.equal(body.target, 'es');
  assert.deepEqual(body.q, ['Hello & welcome', 'Goodbye']);
  assert.equal(request.url.includes('secret'), true);
});

test('maps provider HTTP and payload failures to provider_failure', async () => {
  const httpProvider = createGoogleTranslationProvider({
    apiKey: 'test',
    fetch: async () => ({ ok: false, status: 429, async text() { return 'quota'; } }),
  });
  await assert.rejects(
    httpProvider.translate({
      sourceLocale: 'en-US',
      targetLocale: 'es-MX',
      messages: { hello: 'Hello' },
    }),
    (error) => error.code === 'provider_failure' && error.details.status === 429,
  );

  const malformedProvider = createGoogleTranslationProvider({
    apiKey: 'test',
    fetch: async () => ({ ok: true, async json() { return { data: {} }; } }),
  });
  await assert.rejects(
    malformedProvider.translate({
      sourceLocale: 'en-US',
      targetLocale: 'es-MX',
      messages: { hello: 'Hello' },
    }),
    (error) => error.code === 'provider_failure',
  );
});
