import { Calendar, MapPin, Globe, ExternalLink, Clock, Shield, DollarSign } from 'lucide-react';
import { Hackathon } from '../types';
import { formatDate, getDaysUntil } from '../utils/countdown';

interface HackathonCardProps {
  hackathon: Hackathon;
}

function ModeBadge({ mode }: { mode: Hackathon['mode'] }) {
  const configs = {
    Online: { bg: 'bg-sage-100 dark:bg-sage-900/30', text: 'text-sage-700 dark:text-sage-300', icon: Globe },
    Offline: { bg: 'bg-dusk-100 dark:bg-dusk-900/30', text: 'text-dusk-700 dark:text-dusk-300', icon: MapPin },
    Hybrid: { bg: 'bg-terracotta-100 dark:bg-terracotta-900/30', text: 'text-terracotta-700 dark:text-terracotta-300', icon: Shield },
  };
  const config = configs[mode];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      {mode}
    </span>
  );
}

function FeeBadge({ fee }: { fee: Hackathon['fee_type'] }) {
  const isFree = fee === 'Free';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
      ${isFree
        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      }`}>
      {isFree ? <DollarSign className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
      {fee}
    </span>
  );
}

export default function HackathonCard({ hackathon }: HackathonCardProps) {
  const { days, urgent } = getDaysUntil(hackathon.registration_deadline);
  const isExpired = days === 0 && new Date(hackathon.registration_deadline) < new Date();

  return (
    <article className="group relative bg-cream-50 dark:bg-night-50 rounded-4xl border border-cream-200 dark:border-night-200
      p-5 sm:p-6 hover:border-sage-200 dark:hover:border-sage-800
      hover:shadow-softHover shadow-ambient transition-all duration-300
      hover:-translate-y-1">
      {/* Top row - Organization & Platform */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-sage-500 dark:text-sage-400 text-xs font-medium uppercase tracking-wider">
            {hackathon.organization}
          </p>
          <p className="text-night-100 dark:text-cream-300 text-xs mt-0.5">
            via {hackathon.platform_source}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0
          ${urgent && !isExpired
            ? 'bg-terracotta-100 dark:bg-terracotta-900/30 text-terracotta-700 dark:text-terracotta-300 animate-pulse'
            : isExpired
            ? 'bg-cream-200 dark:bg-night-200 text-night-400 dark:text-cream-300'
            : 'bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300'
          }`}>
        {isExpired ? 'Expired' : `${days}d left`}
      </span>
      </div>

      {/* Title */}
      <h3 className="text-lg sm:text-xl font-bold text-night-400 dark:text-cream-100 mb-3 line-clamp-2 group-hover:text-sage-500 dark:group-hover:text-sage-400 transition-colors">
        {hackathon.title}
      </h3>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-night-100 dark:text-cream-300 mb-4">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-dusk-500 dark:text-dusk-300 shrink-0" />
          <span>{formatDate(hackathon.event_date)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-dusk-500 dark:text-dusk-300 shrink-0" />
          <span>{hackathon.state_location}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-dusk-500 dark:text-dusk-300 shrink-0" />
          <span>Deadline: {formatDate(hackathon.registration_deadline)}</span>
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <ModeBadge mode={hackathon.mode} />
        <FeeBadge fee={hackathon.fee_type} />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-cream-200 dark:border-night-200">
        <a
          href={hackathon.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
            bg-sage-500 text-cream-50 hover:bg-sage-600
            active:scale-[0.98] transition-all duration-200 shadow-soft">
          <ExternalLink className="w-4 h-4" />
          View Details
        </a>
        <button className="p-2.5 rounded-xl
          bg-cream-200 dark:bg-night-200
          text-night-400 dark:text-cream-100
          hover:bg-sage-100 dark:hover:bg-sage-900/30
          hover:text-sage-500 dark:hover:text-sage-400
          transition-theme" aria-label="Bookmark">
          <Shield className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
}
