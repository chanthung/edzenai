/**
 * Lightweight, non-blocking IP geo lookup. Returns the Indian state name
 * (matching keys in STATE_LANGUAGE_MAP) or null on any failure.
 *
 * Failsafe: never throws, hard timeout, AbortController for unmount safety.
 */
export interface GeoResult {
  state: string | null;
  country: string | null;
}

export async function fetchGeoState(signal?: AbortSignal, timeoutMs = 1500): Promise<GeoResult | null> {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) return null;
    signal.addEventListener('abort', onAbort, { once: true });
  }
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('https://ipapi.co/json/', {
      signal: ctrl.signal,
      // Avoid sending cookies/credentials
      credentials: 'omit',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || typeof data !== 'object') return null;
    const country = typeof data.country_name === 'string' ? data.country_name : null;
    const state = typeof data.region === 'string' ? data.region : null;
    return { state, country };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}
