import { Calendar, MapPin, Globe, ExternalLink, Heart, Shield, Cpu, Layers } from 'lucide-react';
import { TechEvent, TechEventCardProps } from '../../types/techevents';

// ─── Reusable sub-badges ─────────────────────────────────────────────────────

function ModeBadge({ mode }: { mode: TechEvent['mode'] }) {
  const configs: Record<TechEvent['mode'], { bg: string; text: string; icon: React.ElementType }> = {
    Online:  { bg: 'bg-sage-100 dark:bg-sage-900/30',       text: 'text-sage-700 dark:text-sage-300',       icon: Globe   },
    Offline: { bg: 'bg-dusk-100 dark:bg-dusk-900/30',       text: 'text-dusk-700 dark:text-dusk-300',       icon: MapPin  },
    Hybrid:  { bg: 'bg-terracotta-100 dark:bg-terracotta-900/30', text: 'text-terracotta-700 dark:text-terracotta-300', icon: Shield },
  };
  const { bg, text, icon: Icon } = configs[mode];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      <Icon className="w-3 h-3" />
      {mode}
    </span>
  );
}

function FeeBadge({ fee }: { fee: TechEvent['fee_type'] }) {
  const isFree = fee === 'Free';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
      ${isFree
        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      }`}>
      {isFree ? '✦ Free' : '$ Paid'}
    </span>
  );
}

/** Color-coded category badge */
function CategoryBadge({ category }: { category: TechEvent['category'] }) {
  const configs: Record<TechEvent['category'], { bg: string; text: string; ring: string; icon: React.ElementType }> = {
    'Web3':         { bg: 'bg-dusk-100 dark:bg-dusk-900/30',         text: 'text-dusk-700 dark:text-dusk-200',         ring: 'ring-dusk-200 dark:ring-dusk-700',         icon: Layers },
    'AI':           { bg: 'bg-terracotta-100 dark:bg-terracotta-900/30', text: 'text-terracotta-700 dark:text-terracotta-200', ring: 'ring-terracotta-200 dark:ring-terracotta-700', icon: Cpu   },
    'General Tech': { bg: 'bg-sage-100 dark:bg-sage-900/30',           text: 'text-sage-700 dark:text-sage-200',           ring: 'ring-sage-200 dark:ring-sage-700',           icon: Layers },
  };
  const { bg, text, ring, icon: Icon } = configs[category];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1
      ${bg} ${text} ${ring}`}>
      <Icon className="w-3 h-3" />
      {category}
    </span>
  );
}

/** Format YYYY-MM-DD as "Nov 14, 2025" */
function formatDate(dateStr: string): string {
  if (!dateStr) return 'TBD';
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export default function TechEventCard({ event, isFavourite, onToggleFavourite }: TechEventCardProps) {
  return (
    <article
      className="group relative flex flex-col
        bg-cream-50 dark:bg-night-50
        rounded-4xl border border-cream-200 dark:border-night-200
        p-5 sm:p-6
        hover:border-sage-200 dark:hover:border-sage-800
        hover:shadow-softHover shadow-ambient
        transition-all duration-300 hover:-translate-y-1"
    >
      {/* ── Top row: category + source ───────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <CategoryBadge category={event.category} />
        <span className="text-night-100 dark:text-cream-300 text-xs shrink-0 mt-0.5">
          via {event.platform_source}
        </span>
      </div>

      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <h3 className="text-base sm:text-lg font-bold text-night-400 dark:text-cream-100 mb-3
        line-clamp-2 group-hover:text-sage-600 dark:group-hover:text-sage-400 transition-colors leading-snug">
        {event.title}
      </h3>

      {/* ── Meta: date + location ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 text-sm text-night-100 dark:text-cream-300 mb-4">
        <span className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-dusk-500 dark:text-dusk-300 shrink-0" />
          <span>{formatDate(event.event_date)}</span>
        </span>
        <span className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-dusk-500 dark:text-dusk-300 shrink-0" />
          <span className="truncate">{event.location}</span>
        </span>
      </div>

      {/* ── Badges ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-auto pb-4">
        <ModeBadge mode={event.mode} />
        <FeeBadge  fee={event.fee_type} />
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-4 border-t border-cream-200 dark:border-night-200">
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            text-sm font-semibold
            bg-sage-500 text-cream-50 hover:bg-sage-600
            active:scale-[0.98] transition-all duration-200 shadow-soft"
        >
          <ExternalLink className="w-4 h-4" />
          View Event
        </a>

        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavourite?.(event.id);
          }}
          aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          className={`p-2.5 rounded-xl transition-theme
            ${isFavourite
              ? 'bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50'
              : 'bg-cream-200 dark:bg-night-200 text-night-400 dark:text-cream-100 hover:bg-sage-100 dark:hover:bg-sage-900/30 hover:text-sage-500 dark:hover:text-sage-400'
            }`}
        >
          <Heart className={`w-5 h-5 ${isFavourite ? 'fill-current' : ''}`} />
        </button>
      </div>
    </article>
  );
}
