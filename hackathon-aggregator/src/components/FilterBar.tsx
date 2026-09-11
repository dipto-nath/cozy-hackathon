import { Filter, ChevronDown, X } from 'lucide-react';
import { FilterState, FilterMode, FilterFee } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  countries: string[];
  states: string[];
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

const MODES: FilterMode[] = ['All', 'Online', 'Offline', 'Hybrid'];
const FEES: FilterFee[] = ['All', 'Free', 'Paid'];

export default function FilterBar({ filters, onFiltersChange, countries, states, hasActiveFilters, onClearAll }: FilterBarProps) {
  return (
    <div className="sticky top-16 z-40 border-b transition-theme
      bg-cream-100/80 dark:bg-night-100/80
      backdrop-blur-md border-cream-200 dark:border-night-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row gap-3 py-3">
          {/* Mode Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-dusk-500 dark:text-dusk-300 hidden sm:block" />
            <div className="flex gap-1 bg-cream-200 dark:bg-night-200 rounded-xl p-1">
              {MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => onFiltersChange({ mode })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-theme
                    ${filters.mode === mode
                      ? 'bg-sage-500 text-cream-50 shadow-soft'
                      : 'text-night-100 dark:text-cream-200 hover:bg-cream-300 dark:hover:bg-night-300'
                    }`}>
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Fee Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 bg-cream-200 dark:bg-night-200 rounded-xl p-1">
              {FEES.map((fee) => (
                <button
                  key={fee}
                  onClick={() => onFiltersChange({ fee })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-theme
                    ${filters.fee === fee
                      ? 'bg-terracotta-500 text-cream-50 shadow-soft'
                      : 'text-night-100 dark:text-cream-200 hover:bg-cream-300 dark:hover:bg-night-300'
                    }`}>
                  {fee}
                </button>
              ))}
            </div>
          </div>

          {/* Country Filter */}
          <div className="flex-1 sm:w-48 relative">
            <select
              value={filters.country}
              onChange={(e) => onFiltersChange({ country: e.target.value })}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-sm
                bg-cream-200 dark:bg-night-200
                text-night-400 dark:text-cream-100
                border border-transparent focus:border-sage-300 dark:focus:border-dusk-400
                outline-none transition-theme cursor-pointer">
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dusk-500 dark:text-dusk-300 pointer-events-none" />
          </div>

          {/* State Filter */}
          <div className="flex-1 sm:w-48 relative">
            <select
              value={filters.state}
              onChange={(e) => onFiltersChange({ state: e.target.value })}
              className={`w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-sm
                bg-cream-200 dark:bg-night-200
                text-night-400 dark:text-cream-100
                border border-transparent focus:border-sage-300 dark:focus:border-dusk-400
                outline-none transition-theme cursor-pointer
                ${!filters.country && 'opacity-70'}`}
            >
              <option value="">{filters.country ? 'All States' : 'All States (Global)'}</option>
              {states.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dusk-500 dark:text-dusk-300 pointer-events-none" />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                bg-terracotta-50 dark:bg-terracotta-900/30
                text-terracotta-600 dark:text-terracotta-400
                hover:bg-terracotta-100 dark:hover:bg-terracotta-900/50
                transition-theme">
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
