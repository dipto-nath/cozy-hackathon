import { useState, useEffect, useMemo } from 'react';
import { Hackathon, FilterState } from '../types';
import { DEMO_HACKATHONS } from '../data/demoHackathons';

const API_BASE = 'http://localhost:8000/api/hackathons';

function buildQueryString(filters: FilterState): string {
  const params = new URLSearchParams();
  params.set('page_size', '100');
  if (filters.mode !== 'All') params.set('mode', filters.mode);
  if (filters.fee !== 'All') params.set('fee', filters.fee);
  if (filters.country) params.set('country', filters.country);
  if (filters.state) params.set('state_location', filters.state);
  if (filters.search) params.set('search', filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Demo fallback: applies the same filters client-side that the API would
 * apply server-side, so the UI stays fully interactive without a backend.
 */
function applyDemoFilters(hackathons: Hackathon[], filters: FilterState): Hackathon[] {
  const search = filters.search.trim().toLowerCase();
  return hackathons.filter((h) => {
    if (filters.mode !== 'All' && h.mode !== filters.mode) return false;
    if (filters.fee !== 'All' && h.fee_type !== filters.fee) return false;
    // NOTE: DEMO_HACKATHONS doesn't currently define 'country', so demo filtering
    // might not work completely, but we add it for completeness.
    if (filters.country && (h as any).country !== filters.country) return false;
    if (filters.state && h.state_location !== filters.state) return false;
    if (search) {
      const haystack = `${h.title} ${h.organization} ${h.platform_source}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function useHackathons(filters: FilterState) {
  const [rawData, setRawData] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // The serialized query string is the real effect dependency. Callers may
  // pass a fresh object literal on every render, so depending on `filters`
  // directly would re-fetch (and flip `loading`) on every single render.
  const queryString = useMemo(() => buildQueryString(filters), [filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}${queryString}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API responded with status ${res.status}`);
        return res.json();
      })
      .then((json: Hackathon[]) => {
        if (!cancelled) {
          setRawData(json);
          setIsDemo(false);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          // Backend unreachable — fall back to bundled demo data so the
          // frontend remains explorable. `isDemo` drives the UI banner.
          setError(err.message);
          setRawData(DEMO_HACKATHONS);
          setIsDemo(true);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [queryString]);

  // In demo mode the API can't filter server-side, so filter client-side.
  // Derived (not state) — recomputing is cheap and can't cause loops.
  const data = useMemo(
    () => (isDemo ? applyDemoFilters(rawData, filters) : rawData),
    [isDemo, rawData, filters],
  );

  return { data, loading, error, isDemo };
}
