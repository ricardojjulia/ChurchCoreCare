export async function translateMessages({ locale, messages, settings = {} }) {
  const sourceLocale = settings.sourceLocale || 'en';
  const tone = settings.tone || 'neutral';
  const fallbackMode = settings.fallbackMode || 'prefixed';
  const glossary = normalizeGlossary(settings.glossary);

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return Object.fromEntries(Object.entries(messages).map(([key, value]) => {
      const base = fallbackMode === 'copy' ? value : `[${locale}] ${value}`;
      return [key, applyCustomizations(base, tone, glossary, settings.useGlossary !== false)];
    }));
  }

  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      q: Object.values(messages),
      source: sourceLocale,
      target: locale,
      format: 'text',
    }),
  });

  if (!response.ok) {
    throw new Error('Google Translate request failed');
  }

  const payload = await response.json();
  const translations = payload.data?.translations ?? [];
  return Object.keys(messages).reduce((result, key, index) => {
    const translated = translations[index]?.translatedText ?? messages[key];
    result[key] = applyCustomizations(translated, tone, glossary, settings.useGlossary !== false);
    return result;
  }, {});
}

function applyCustomizations(text, tone, glossary, useGlossary) {
  let value = text;
  if (useGlossary) {
    Object.entries(glossary).forEach(([source, target]) => {
      value = value.replaceAll(source, target);
    });
  }

  if (tone === 'pastoral') {
    return value.replaceAll('Operations', 'Care Operations').replaceAll('Dashboard', 'Care Dashboard');
  }

  if (tone === 'clinical') {
    return value.replaceAll('Care', 'Clinical Care').replaceAll('Session', 'Clinical Session');
  }

  return value;
}

function normalizeGlossary(glossary) {
  if (!glossary || typeof glossary !== 'object') {
    return {};
  }

  return Object.entries(glossary).reduce((result, [source, target]) => {
    if (source && typeof target === 'string') {
      result[source] = target;
    }
    return result;
  }, {});
}