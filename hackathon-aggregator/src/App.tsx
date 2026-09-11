import { useState, useMemo, useCallback, useEffect } from 'react';
import { ThemeProvider } from './hooks/useTheme';
import { useDebounce } from './hooks/useDebounce';
import { useHackathons } from './hooks/useHackathons';
import { FlaskConical } from 'lucide-react';
import { FilterState } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import FilterBar from './components/FilterBar';
import HackathonGrid from './components/HackathonGrid';

function AppContent() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [filters, setFilters] = useState<FilterState>({
    mode: 'All',
    fee: 'All',
    country: 'India',
    state: '',
    search: '',
  });

  const { data: hackathons, loading, error, isDemo } = useHackathons({
    ...filters,
    search: debouncedSearch,
  });

  const [locationsMap, setLocationsMap] = useState<Record<string, string[]>>({});

  // Fetch unique countries and states globally
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/hackathons';
    console.log("Current API_BASE is:", API_BASE);
    fetch(`${API_BASE}/locations`)
      .then((res) => res.json())
      .then((data) => setLocationsMap(data))
      .catch((err) => console.error('Failed to fetch locations:', err));
  }, []);

  const countries = useMemo(() => Object.keys(locationsMap), [locationsMap]);
  
  const states = useMemo(() => {
    if (filters.country && locationsMap[filters.country]) {
      return locationsMap[filters.country];
    }
    // If no country is selected, flatten all states
    const allStates = new Set<string>();
    Object.values(locationsMap).forEach(stateList => {
      stateList.forEach(s => allStates.add(s));
    });
    return Array.from(allStates).sort();
  }, [filters.country, locationsMap]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.mode !== 'All' ||
      filters.fee !== 'All' ||
      filters.country !== '' ||
      filters.state !== '' ||
      debouncedSearch !== ''
    );
  }, [filters, debouncedSearch]);

  const onFiltersChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };
      // If country changed and state is not empty, clear the state
      if ('country' in newFilters && newFilters.country !== prev.country) {
        updated.state = '';
      }
      return updated;
    });
  }, []);

  const onClearAll = useCallback(() => {
    setFilters({ mode: 'All', fee: 'All', country: 'India', state: '', search: '' });
    setSearch('');
  }, []);

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-night-100 transition-theme">
      <Header search={search} onSearchChange={onSearchChange} />
      <main className="max-w-7xl mx-auto">
        <Hero />
        <FilterBar
          filters={{ ...filters, search: debouncedSearch }}
          onFiltersChange={onFiltersChange}
          countries={countries}
          states={states}
          hasActiveFilters={hasActiveFilters}
          onClearAll={onClearAll}
        />
        {isDemo && !loading && error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-terracotta-200 dark:border-terracotta-700
              bg-terracotta-50 dark:bg-terracotta-900/20 px-4 py-2.5
              text-sm text-terracotta-600 dark:text-terracotta-300 transition-theme">
              <FlaskConical className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong className="font-semibold">Demo mode.</strong>{' '}
                Couldn't reach the API ({error}) — showing bundled sample data.
                Start your backend on port 8000 to load live hackathons.
              </span>
            </div>
          </div>
        )}
        <HackathonGrid
          hackathons={hackathons}
          loading={loading}
          error={error}
        />
      </main>
      <footer className="border-t border-cream-200 dark:border-night-200
        bg-cream-100/50 dark:bg-night-100/50 transition-theme py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-night-100 dark:text-cream-300 text-sm">
            Data sourced from Devpost, MLH, Unstop & more. Built with React + TypeScript + Tailwind.
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
