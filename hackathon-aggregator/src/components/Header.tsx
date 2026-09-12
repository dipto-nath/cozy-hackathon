import { Sun, Moon, Search, Heart } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
  search: string;
  onSearchChange: (v: string) => void;
  showFavourites?: boolean;
  onToggleFavouritesView?: () => void;
}

export default function Header({ search, onSearchChange, showFavourites, onToggleFavouritesView }: HeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b transition-theme
      bg-cream-100/80 dark:bg-night-100/80
      backdrop-blur-md border-cream-200 dark:border-night-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-sage-500 flex items-center justify-center">
              <span className="text-cream-50 text-sm font-bold">H</span>
            </div>
            <span className="font-semibold text-night-400 dark:text-cream-100 text-base tracking-wide hidden sm:block">
              HackAggregator
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dusk-400 dark:text-dusk-300 pointer-events-none" />
            <input
              type="text"
              placeholder="Search hackathons, orgs..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm
                bg-cream-200 dark:bg-night-200
                text-night-400 dark:text-cream-100
                placeholder-dusk-400 dark:placeholder-dusk-300
                border border-transparent focus:border-sage-300 dark:focus:border-dusk-400
                outline-none transition-theme"
            />
          </div>

          {/* Theme toggle & Favourites */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFavouritesView}
              aria-label="Toggle favourites"
              className={`p-2 rounded-xl transition-theme
                ${showFavourites 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-500' 
                  : 'bg-cream-200 dark:bg-night-200 text-sage-500 dark:text-dusk-400 hover:bg-sage-100 dark:hover:bg-dusk-100'
                }`}>
              <Heart className={`w-4 h-4 ${showFavourites ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="p-2 rounded-xl
                bg-cream-200 dark:bg-night-200
                text-sage-500 dark:text-dusk-400
                hover:bg-sage-100 dark:hover:bg-dusk-100
                transition-theme">
              {theme === 'light'
                ? <Moon className="w-4 h-4" />
                : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
