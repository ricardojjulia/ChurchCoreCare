import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { baseMessages, buildLocaleCatalog, defaultLocale, formatMessage, localeLabels } from '@faith/i18n';
import { frontendTelemetry } from './frontendTelemetry.js';

const LOCALE_STORAGE_KEY = 'faith.locale';

const I18nContext = createContext({
  locale: defaultLocale,
  messages: baseMessages,
  locales: [],
  loading: false,
  t: (key, values) => formatMessage(baseMessages, key, values),
  setLocale: async () => {},
  refreshLocales: async () => {},
});

function normalizeLocaleCode(value) {
  if (typeof value !== 'string') return defaultLocale;
  const normalized = value.trim().toLowerCase();
  return normalized || defaultLocale;
}

function normalizeLocalesResponse(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const fromApi = items.map((item) => {
    const code = normalizeLocaleCode(item?.locale ?? item?.code ?? '');
    return {
      value: code,
      label: item?.label || localeLabels[code] || code.toUpperCase(),
    };
  });

  if (fromApi.length > 0) return fromApi;

  return Object.entries(localeLabels).map(([code, label]) => ({
    value: code,
    label,
  }));
}

export function I18nProvider({ children }) {
  const initialLocale = normalizeLocaleCode(localStorage.getItem(LOCALE_STORAGE_KEY) || defaultLocale);
  const [locale, setLocaleState] = useState(initialLocale);
  const [messages, setMessages] = useState(baseMessages);
  const [locales, setLocales] = useState(() =>
    Object.entries(localeLabels).map(([code, label]) => ({ value: code, label }))
  );
  const [loading, setLoading] = useState(false);

  const refreshLocales = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/i18n/locales', { credentials: 'include' });
      if (!response.ok) throw new Error(`Unable to load locales (${response.status})`);
      const payload = await response.json();
      setLocales(normalizeLocalesResponse(payload));
    } catch {
      setLocales(Object.entries(localeLabels).map(([code, label]) => ({ value: code, label })));
    }
  }, []);

  const loadCatalog = useCallback(async (nextLocale) => {
    const code = normalizeLocaleCode(nextLocale);
    const response = await fetch(`/api/v1/i18n/catalog?locale=${encodeURIComponent(code)}`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Unable to load locale catalog (${response.status})`);
    }

    const payload = await response.json();
    const catalog = buildLocaleCatalog(payload?.messages ?? {});
    setMessages(catalog);
    return code;
  }, []);

  const setLocale = useCallback(async (nextLocale) => {
    const code = normalizeLocaleCode(nextLocale);
    if (!code || code === locale) return;

    setLoading(true);
    try {
      const applied = await loadCatalog(code);
      setLocaleState(applied);
      localStorage.setItem(LOCALE_STORAGE_KEY, applied);
      frontendTelemetry.trackAction('settings', 'locale_switch', 'success', {
        workflow: 'i18n',
        statusClass: applied,
      });
    } catch {
      frontendTelemetry.trackAction('settings', 'locale_switch', 'error', {
        workflow: 'i18n',
        statusClass: code,
      });
    } finally {
      setLoading(false);
    }
  }, [loadCatalog, locale]);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      setLoading(true);
      try {
        await Promise.all([refreshLocales(), loadCatalog(initialLocale)]);
        if (!cancelled) {
          setLocaleState(initialLocale);
          localStorage.setItem(LOCALE_STORAGE_KEY, initialLocale);
        }
      } catch {
        if (!cancelled) {
          setMessages(baseMessages);
          setLocaleState(defaultLocale);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [initialLocale, loadCatalog, refreshLocales]);

  const value = useMemo(() => ({
    locale,
    messages,
    locales,
    loading,
    setLocale,
    refreshLocales,
    t: (key, values) => formatMessage(messages, key, values),
  }), [locale, messages, locales, loading, setLocale, refreshLocales]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
