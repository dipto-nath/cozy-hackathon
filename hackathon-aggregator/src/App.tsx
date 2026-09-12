import { useState, useMemo, useCallback, useEffect } from 'react';
import { ThemeProvider } from './hooks/useTheme';
import { useDebounce } from './hooks/useDebounce';
import { useHackathons } from './hooks/useHackathons';
import { FlaskConical, Zap, Calendar } from 'lucide-react';
import { FilterState } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import FilterBar from './components/FilterBar';
import HackathonGrid from './components/HackathonGrid';
import TechEventsPage from './components/techevents/TechEventsPage';

type ActiveTab = 'hackathons' | 'techevents';

// ─── Tab Switcher ─────────────────────────────────────────────────────────────
function TabSwitcher({ active, onChange }: { active: ActiveTab; onChange: (t: ActiveTab) => void }) {
  const tabs: Array<{ key: ActiveTab; label: string; icon: React.ElementType }> = [
    { key: 'hackathons', label: 'Hackathons',   icon: Zap      },
    { key: 'techevents', label: 'Tech Events',  icon: Calendar },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div className="inline-flex gap-1 bg-cream-200 dark:bg-night-200 rounded-xl p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`tab-${key}`}
            onClick={() => onChange(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
              ${active === key
                ? 'bg-cream-50 dark:bg-night-50 text-night-400 dark:text-cream-100 shadow-soft'
                : 'text-night-100 dark:text-cream-300 hover:bg-cream-300 dark:hover:bg-night-300'
              }`}
          >
            <Icon className={`w-4 h-4 transition-colors
              ${active === key ? 'text-sage-500 dark:text-sage-400' : 'text-dusk-400 dark:text-dusk-300'}`} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main App Content ─────────────────────────────────────────────────────────
function AppContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hackathons');

  // ── Hackathon state ───────────────────────────────────────────────────────
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

  const [showFavourites, setShowFavourites] = useState(false);
  const [favourites, setFavourites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('hackathon-favourites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  const toggleFavourite = useCallback((id: string) => {
    setFavourites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem('hackathon-favourites', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const displayedHackathons = useMemo(() => {
    if (!hackathons) return [];
    if (showFavourites) {
      return hackathons.filter(h => favourites.has(h.id));
    }
    return hackathons;
  }, [hackathons, showFavourites, favourites]);

  const [locationsMap, setLocationsMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const API_BASE = 'https://cozy-hackathon-3.onrender.com/api/hackathons';
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
    const allStates = new Set<string>();
    Object.values(locationsMap).forEach(stateList => {
      stateList.forEach(s => allStates.add(s));
    });
    return Array.from(allStates).sort();
  }, [filters.country, locationsMap]);

  const hasActiveFilters = useMemo(() => (
    filters.mode !== 'All' ||
    filters.fee !== 'All' ||
    filters.country !== '' ||
    filters.state !== '' ||
    debouncedSearch !== ''
  ), [filters, debouncedSearch]);

  const onFiltersChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };
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
      <Header
        search={search}
        onSearchChange={onSearchChange}
        showFavourites={showFavourites}
        onToggleFavouritesView={() => setShowFavourites(prev => !prev)}
      />

      <main className="max-w-7xl mx-auto">
        <Hero />

        {/* ── Tab switcher ───────────────────────────────────────────────── */}
        <TabSwitcher active={activeTab} onChange={setActiveTab} />

        {/* ── Hackathons tab ─────────────────────────────────────────────── */}
        {activeTab === 'hackathons' && (
          <>
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
              hackathons={displayedHackathons}
              loading={loading}
              error={error}
              favourites={favourites}
              onToggleFavourite={toggleFavourite}
            />
          </>
        )}

        {/* ── Tech Events tab ────────────────────────────────────────────── */}
        {activeTab === 'techevents' && <TechEventsPage search={debouncedSearch} />}
      </main>

      <footer className="border-t border-cream-200 dark:border-night-200
        bg-cream-100/50 dark:bg-night-100/50 transition-theme py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-night-100 dark:text-cream-300 text-sm">
            Hackathons sourced from Devpost, MLH, Unstop &amp; more · Tech events from Luma, Confs.tech &amp; 8 more sources.
            Built with React + TypeScript + Tailwind.
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
