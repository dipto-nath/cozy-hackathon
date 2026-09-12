import { Filter, X } from 'lucide-react';
import { TechEventFilterBarProps, TechEventCategory, TechEventMode, TechEventFeeType } from '../../types/techevents';

const CATEGORIES: Array<TechEventCategory | 'All'> = ['All', 'Web3', 'AI', 'General Tech'];
const MODES:      Array<TechEventMode | 'All'>     = ['All', 'Online', 'Offline', 'Hybrid'];
const FEES:       Array<TechEventFeeType | 'All'>  = ['All', 'Free', 'Paid'];

/** Category accent colours matching the CategoryBadge in TechEventCard */
const CATEGORY_ACTIVE: Record<string, string> = {
  'All':          'bg-sage-500 text-cream-50',
  'Web3':         'bg-dusk-500 text-cream-50',
  'AI':           'bg-terracotta-500 text-cream-50',
  'General Tech': 'bg-sage-500 text-cream-50',
};

export default function TechEventFilterBar({
  filters,
  onFiltersChange,
  hasActiveFilters,
  onClearAll,
}: TechEventFilterBarProps) {
  return (
    <div className="sticky top-16 z-40 border-b transition-theme
      bg-cream-100/80 dark:bg-night-100/80
      backdrop-blur-md border-cream-200 dark:border-night-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row gap-3 py-3 flex-wrap">

          {/* ── Fee filter ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-cream-200 dark:bg-night-200 rounded-xl p-1">
              {FEES.map((fee) => (
                <button
                  key={fee}
                  onClick={() => onFiltersChange({ fee })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-theme
                    ${filters.fee === fee
                      ? 'bg-terracotta-500 text-cream-50 shadow-soft'
                      : 'text-night-100 dark:text-cream-200 hover:bg-cream-300 dark:hover:bg-night-300'
                    }`}
                >
                  {fee}
                </button>
              ))}
            </div>
          </div>

          {/* ── Category filter ───────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dusk-500 dark:text-dusk-300 hidden sm:block shrink-0" />
            <div className="flex gap-1 bg-cream-200 dark:bg-night-200 rounded-xl p-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onFiltersChange({ category: cat })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-theme whitespace-nowrap
                    ${filters.category === cat
                      ? `${CATEGORY_ACTIVE[cat]} shadow-soft`
                      : 'text-night-100 dark:text-cream-200 hover:bg-cream-300 dark:hover:bg-night-300'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ── Mode filter ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-cream-200 dark:bg-night-200 rounded-xl p-1">
              {MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => onFiltersChange({ mode })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-theme
                    ${filters.mode === mode
                      ? 'bg-sage-500 text-cream-50 shadow-soft'
                      : 'text-night-100 dark:text-cream-200 hover:bg-cream-300 dark:hover:bg-night-300'
                    }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* ── Clear all ─────────────────────────────────────────────────── */}
          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                bg-terracotta-50 dark:bg-terracotta-900/30
                text-terracotta-600 dark:text-terracotta-400
                hover:bg-terracotta-100 dark:hover:bg-terracotta-900/50
                transition-theme"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
