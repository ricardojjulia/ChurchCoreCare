import { GovernanceError, normalizeLocale } from '@localization-governance/core';

function primaryLanguage(locale) {
  return normalizeLocale(locale).split('-')[0];
}

const HTML_ENTITIES = Object.freeze({
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&lt;': '<',
  '&gt;': '>',
});

function decodeEntities(value) {
  return String(value).replace(/&(?:amp|quot|#39|lt|gt);/g, (entity) => HTML_ENTITIES[entity]);
}

export function createGoogleTranslationProvider(options = {}) {
  if (!options.apiKey) {
    throw new GovernanceError('provider_failure', 'Google Translation API key is required.');
  }
  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new GovernanceError('provider_failure', 'Fetch implementation is required.');
  }

  return {
    async translate({ sourceLocale, targetLocale, messages, signal }) {
      const entries = Object.entries(messages ?? {});
      if (entries.length === 0) {
        return { messages: {}, provenance: { provider: 'google', translatedKeys: [] } };
      }

      const response = await fetchImpl(
        `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(options.apiKey)}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            q: entries.map(([, value]) => value),
            source: primaryLanguage(sourceLocale),
            target: primaryLanguage(targetLocale),
            format: 'text',
          }),
          signal,
        },
      );
      if (!response.ok) {
        throw new GovernanceError('provider_failure', 'Google Translation API request failed.', {
          status: response.status,
        });
      }
      const payload = await response.json();
      const translations = payload?.data?.translations;
      if (!Array.isArray(translations) || translations.length !== entries.length) {
        throw new GovernanceError('provider_failure', 'Google Translation API returned an invalid payload.');
      }
      const translated = Object.fromEntries(
        entries.map(([key], index) => [key, decodeEntities(translations[index]?.translatedText)]),
      );
      return {
        messages: translated,
        provenance: {
          provider: 'google',
          translatedKeys: entries.map(([key]) => key),
        },
      };
    },
  };
}
