import { Hackathon } from '../types';
import HackathonCard from './HackathonCard';
import { SearchX } from 'lucide-react';

interface HackathonGridProps {
  hackathons: Hackathon[];
  loading: boolean;
  error: string | null;
  favourites?: Set<string>;
  onToggleFavourite?: (id: string) => void;
}

export default function HackathonGrid({ hackathons, loading, error, favourites, onToggleFavourite }: HackathonGridProps) {
  if (error && hackathons.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-terracotta-100 dark:bg-terracotta-900/30
            flex items-center justify-center mx-auto mb-4">
            <SearchX className="w-8 h-8 text-terracotta-500 dark:text-terracotta-400" />
          </div>
          <h3 className="text-lg font-semibold text-night-400 dark:text-cream-100 mb-2">
            Failed to load hackathons
          </h3>
          <p className="text-night-100 dark:text-cream-300 max-w-md mx-auto">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (loading && hackathons.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-cream-50 dark:bg-night-50 rounded-4xl border border-cream-200 dark:border-night-200 p-6 animate-shimmer">
              <div className="h-4 bg-cream-200 dark:bg-night-200 rounded w-3/4 mb-4" />
              <div className="h-6 bg-cream-200 dark:bg-night-200 rounded w-full mb-2" />
              <div className="h-4 bg-cream-200 dark:bg-night-200 rounded w-1/2 mb-4" />
              <div className="h-4 bg-cream-200 dark:bg-night-200 rounded w-1/3 mb-4" />
              <div className="h-4 bg-cream-200 dark:bg-night-200 rounded w-1/4 mb-4" />
              <div className="flex gap-2">
                <div className="h-6 bg-cream-200 dark:bg-night-200 rounded-full w-20" />
                <div className="h-6 bg-cream-200 dark:bg-night-200 rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hackathons.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-sage-100 dark:bg-sage-900/30
            flex items-center justify-center mx-auto mb-4">
            <SearchX className="w-8 h-8 text-sage-500 dark:text-sage-400" />
          </div>
          <h3 className="text-lg font-semibold text-night-400 dark:text-cream-100 mb-2">
            No hackathons found
          </h3>
          <p className="text-night-100 dark:text-cream-300 max-w-md mx-auto">
            Try adjusting your filters or search terms to find more events.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {hackathons.map((hackathon) => (
          <HackathonCard 
            key={hackathon.id} 
            hackathon={hackathon} 
            isFavourite={favourites?.has(hackathon.id)}
            onToggleFavourite={onToggleFavourite}
          />
        ))}
      </div>
    </div>
  );
}
