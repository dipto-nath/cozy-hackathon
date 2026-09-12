import { useState, useMemo } from 'react';
import { TechEvent, TechEventFilterState } from '../../types/techevents';
import SEED_EVENTS from '../../data/techevents.json';

// Cast the imported JSON to the proper type
const ALL_EVENTS: TechEvent[] = SEED_EVENTS as TechEvent[];

/** Apply TechEventFilterState client-side */
function applyFilters(events: TechEvent[], filters: TechEventFilterState): TechEvent[] {
  const search = filters.search.trim().toLowerCase();

  return events.filter((e) => {
    if (filters.category !== 'All' && e.category !== filters.category) return false;
    if (filters.mode     !== 'All' && e.mode     !== filters.mode)     return false;
    if (search) {
      const haystack = `${e.title} ${e.location} ${e.platform_source}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function useTechEvents(filters: TechEventFilterState) {
  // Static JSON — no async needed. We keep loading/error shapes to match
  // the useHackathons interface so components stay symmetrical.
  const [loading] = useState(false);
  const [error]   = useState<string | null>(null);

  const data = useMemo(() => applyFilters(ALL_EVENTS, filters), [filters]);

  return { data, loading, error, total: ALL_EVENTS.length };
}
