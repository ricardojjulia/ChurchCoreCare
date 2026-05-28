import { useCallback, useEffect, useState } from 'react';

const BASE = '/api';

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

function buildQs(params) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null) p.set(k, v);
  return p.toString() ? `?${p}` : '';
}

export function useSessionVolume({ preset, from, to, counselorId } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQs({ preset, from, to, counselorId });
      setData(await apiFetch(`/v1/reports/sessions${qs}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [preset, from, to, counselorId]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

export function useRevenueStats({ preset, from, to } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQs({ preset, from, to });
      setData(await apiFetch(`/v1/reports/revenue${qs}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [preset, from, to]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

export function useOutcomeTrends({ clientId, formKey = 'PHQ-9', from, to } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQs({ clientId, formKey, from, to });
      setData(await apiFetch(`/v1/reports/outcomes${qs}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId, formKey, from, to]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

export function useCounselorProductivity({ preset, from, to } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQs({ preset, from, to });
      setData(await apiFetch(`/v1/reports/counselors${qs}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [preset, from, to]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

export function exportCsv(type, { preset, from, to } = {}) {
  const qs = buildQs({ preset, from, to });
  const url = `${BASE}/v1/reports/${type}/export${qs}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  a.click();
}
