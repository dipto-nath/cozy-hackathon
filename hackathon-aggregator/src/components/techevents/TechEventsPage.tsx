import { useState, useMemo, useCallback } from 'react';
import { TechEventFilterState } from '../../types/techevents';
import { useTechEvents } from '../../hooks/techevents/useTechEvents';
import TechEventFilterBar from './TechEventFilterBar';
import TechEventGrid from './TechEventGrid';

const DEFAULT_FILTERS: TechEventFilterState = {
  category: 'All',
  mode:     'All',
  fee:      'All',
};

interface TechEventsPageProps {
  search: string;
}

export default function TechEventsPage({ search }: TechEventsPageProps) {
  const [filters, setFilters] = useState<TechEventFilterState>(DEFAULT_FILTERS);

  const [showFavourites, setShowFavourites] = useState(false);
  const [favourites, setFavourites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('techevents-favourites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleFavourite = useCallback((id: string) => {
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('techevents-favourites', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const { data: events, loading, error, total } = useTechEvents(filters, search);

  const displayedEvents = useMemo(() => {
    if (showFavourites) return events.filter((e) => favourites.has(e.id));
    return events;
  }, [events, showFavourites, favourites]);

  const hasActiveFilters = useMemo(() => (
    filters.category !== 'All' ||
    filters.mode     !== 'All' ||
    filters.fee      !== 'All' ||
    search           !== ''
  ), [filters, search]);

  const onFiltersChange = useCallback((partial: Partial<TechEventFilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const onClearAll = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return (
    <>
      {/* ── Section header ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-night-400 dark:text-cream-100">
            Global Tech Events
          </h2>
          <p className="text-sm text-night-100 dark:text-cream-300 mt-0.5">
            {total} upcoming conferences, summits &amp; meetups · filtered to {displayedEvents.length}
          </p>
        </div>

        {/* Favourites toggle */}
        <button
          onClick={() => setShowFavourites((v) => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-theme
            ${showFavourites
              ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
              : 'bg-cream-200 dark:bg-night-200 text-night-100 dark:text-cream-300 hover:bg-sage-100 dark:hover:bg-sage-900/30 hover:text-sage-600 dark:hover:text-sage-400'
            }`}
        >
          {/* heart emoji keeps it dependency-free */}
          <span>{showFavourites ? '❤️' : '🤍'}</span>
          {showFavourites ? 'All Events' : `Saved (${favourites.size})`}
        </button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <TechEventFilterBar
        filters={filters}
        onFiltersChange={onFiltersChange}
        hasActiveFilters={hasActiveFilters}
        onClearAll={onClearAll}
      />

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      <TechEventGrid
        events={displayedEvents}
        loading={loading}
        error={error}
        favourites={favourites}
        onToggleFavourite={toggleFavourite}
      />
    </>
  );
}
