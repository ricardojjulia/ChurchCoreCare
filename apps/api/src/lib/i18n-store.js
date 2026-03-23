import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseMessages, buildLocaleCatalog, defaultLocale, localeLabels, listMessageKeys } from '../../../../packages/i18n/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localeDir = path.join(__dirname, '../../data/i18n');
const settingsFile = path.join(localeDir, 'settings.json');

export async function createI18nStore() {
  await mkdir(localeDir, { recursive: true });
  const overridesByLocale = {};
  const settingsByLocale = await readSettings();
  const locales = new Set([defaultLocale, ...Object.keys(localeLabels)]);

  for (const locale of locales) {
    overridesByLocale[locale] = await readLocaleOverrides(locale);
  }

  return {
    listLocales() {
      return [...new Set([defaultLocale, ...Object.keys(overridesByLocale)])].map((locale) => ({
        locale,
        label: overridesByLocale[locale]?.__label ?? localeLabels[locale] ?? locale.toUpperCase(),
        completion: calculateCompletion(overridesByLocale[locale]),
      }));
    },
    async ensureLocale(locale, label) {
      if (!overridesByLocale[locale]) {
        overridesByLocale[locale] = {};
      }
      if (label) {
        overridesByLocale[locale].__label = label;
      }
      if (!settingsByLocale[locale]) {
        settingsByLocale[locale] = defaultTranslationSettings();
        await writeSettings(settingsByLocale);
      }
      await writeLocaleOverrides(locale, overridesByLocale[locale]);
      return this.getCatalog(locale);
    },
    getCatalog(locale) {
      const resolvedLocale = locale || defaultLocale;
      const overrides = overridesByLocale[resolvedLocale] ?? {};
      return {
        locale: resolvedLocale,
        label: overrides.__label ?? localeLabels[resolvedLocale] ?? resolvedLocale.toUpperCase(),
        messages: buildLocaleCatalog(stripMeta(overrides)),
        baseMessages,
        completion: calculateCompletion(overrides),
      };
    },
    async saveCatalog(locale, messages) {
      const current = overridesByLocale[locale] ?? {};
      const next = {
        ...current,
        ...messages,
      };
      overridesByLocale[locale] = next;
      await writeLocaleOverrides(locale, next);
      return this.getCatalog(locale);
    },
    async autoTranslate(locale, translator) {
      const settings = this.getSettings(locale);
      const sourceCatalog = this.getCatalog(settings.sourceLocale || defaultLocale).messages;
      const generated = await translator({
        locale,
        settings,
        messages: listMessageKeys().reduce((result, key) => {
          result[key] = sourceCatalog[key] ?? baseMessages[key];
          return result;
        }, {}),
      });
      return this.saveCatalog(locale, generated);
    },
    getSettings(locale) {
      return {
        ...defaultTranslationSettings(),
        ...(settingsByLocale[locale] ?? {}),
      };
    },
    async saveSettings(locale, settings) {
      settingsByLocale[locale] = {
        ...defaultTranslationSettings(),
        ...settings,
      };
      await writeSettings(settingsByLocale);
      return this.getSettings(locale);
    },
  };
}

async function readLocaleOverrides(locale) {
  try {
    const file = await readFile(path.join(localeDir, `${locale}.json`), 'utf8');
    return JSON.parse(file);
  } catch {
    return {};
  }
}

async function writeLocaleOverrides(locale, messages) {
  await writeFile(path.join(localeDir, `${locale}.json`), JSON.stringify(messages, null, 2));
}

async function readSettings() {
  try {
    const file = await readFile(settingsFile, 'utf8');
    return JSON.parse(file);
  } catch {
    return {};
  }
}

async function writeSettings(settingsByLocale) {
  await writeFile(settingsFile, JSON.stringify(settingsByLocale, null, 2));
}

function stripMeta(messages) {
  const clone = { ...messages };
  delete clone.__label;
  return clone;
}

function calculateCompletion(messages = {}) {
  const translatedKeys = Object.keys(stripMeta(messages)).length;
  return Math.round((translatedKeys / listMessageKeys().length) * 100);
}

function defaultTranslationSettings() {
  return {
    sourceLocale: 'en',
    tone: 'neutral',
    fallbackMode: 'prefixed',
    useGlossary: true,
    glossary: {},
  };
}