import { SkipBack, SkipForward, Play, Pause, Music2 } from 'lucide-react';
import type { MusicPlayerState } from '../hooks/useYouTubePlayer';

// ── Time formatter ─────────────────────────────────────────────────────────────
function fmt(secs: number): string {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// LANDING variant — full saloon.wtf-style glassmorphic player
// ──────────────────────────────────────────────────────────────────────────────
export function LandingMusicPlayer({
  isReady, isPlaying, autoplayBlocked, currentTrack,
  currentTime, duration, play, toggle, next, prev, seek,
}: MusicPlayerState) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  };

  return (
    <div className="w-[360px] sm:w-[420px] rounded-2xl
      bg-black/45 backdrop-blur-2xl
      border border-white/15
      shadow-[0_8px_48px_rgba(0,0,0,0.5)]
      p-3.5">

      {/* ── Track row ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Album art / placeholder */}
        <div className="shrink-0 relative">
          {currentTrack?.thumbnailUrl ? (
            <img
              src={currentTrack.thumbnailUrl}
              alt={currentTrack.title}
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Music2 className="w-5 h-5 text-white/40" />
            </div>
          )}
          {/* Playing pulse ring */}
          {isPlaying && (
            <span className="absolute -inset-0.5 rounded-xl border border-white/30 animate-ping opacity-30" />
          )}
        </div>

        {/* Title + Artist */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-tight truncate">
            {isReady
              ? (currentTrack?.title || 'Loading…')
              : 'Connecting…'}
          </p>
          <p className="text-white/50 text-xs truncate mt-0.5">
            {currentTrack?.author || ''}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={prev}
            disabled={!isReady}
            className="w-8 h-8 flex items-center justify-center rounded-full
              text-white/60 hover:text-white hover:bg-white/10
              transition-all duration-150 disabled:opacity-40"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={autoplayBlocked ? play : toggle}
            disabled={!isReady}
            className="w-9 h-9 flex items-center justify-center rounded-full
              bg-white/20 hover:bg-white/30 active:bg-white/40
              text-white transition-all duration-150 disabled:opacity-40
              hover:scale-105"
          >
            {isPlaying
              ? <Pause className="w-4 h-4 fill-current" />
              : <Play className="w-4 h-4 fill-current translate-x-0.5" />
            }
          </button>

          <button
            onClick={next}
            disabled={!isReady}
            className="w-8 h-8 flex items-center justify-center rounded-full
              text-white/60 hover:text-white hover:bg-white/10
              transition-all duration-150 disabled:opacity-40"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* ── Progress bar ────────────────────────────────────────────────── */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-white/35 text-[10px] w-7 text-right tabular-nums shrink-0">
          {fmt(currentTime)}
        </span>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          onClick={handleProgressClick}
          className="flex-1 h-0.5 bg-white/20 rounded-full relative cursor-pointer group"
        >
          <div
            className="h-full bg-white/80 rounded-full relative transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5
              bg-white rounded-full shadow -translate-x-1/2
              opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
          </div>
        </div>

        <span className="text-white/35 text-[10px] w-7 tabular-nums shrink-0">
          {fmt(duration)}
        </span>
      </div>

      {/* Autoplay blocked nudge */}
      {autoplayBlocked && (
        <p className="mt-2 text-center text-white/40 text-xs">
          Click ▶ to start music
        </p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// FLOATING mini-player — persists on main site (bottom-left)
// ──────────────────────────────────────────────────────────────────────────────
export function FloatingMusicPlayer({
  isReady, isPlaying, currentTrack,
  toggle, next, prev,
}: MusicPlayerState) {
  if (!isReady) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50
      flex items-center gap-2 pl-2 pr-3 py-1.5
      rounded-2xl
      bg-cream-100/90 dark:bg-night-200/90
      backdrop-blur-md
      border border-cream-200 dark:border-night-300
      shadow-softHover
      transition-all duration-300 hover:shadow-ambient">

      {/* Mini album art */}
      {currentTrack?.thumbnailUrl ? (
        <img
          src={currentTrack.thumbnailUrl}
          alt={currentTrack.title}
          className="w-7 h-7 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-7 h-7 rounded-lg bg-cream-200 dark:bg-night-300 flex items-center justify-center shrink-0">
          <Music2 className="w-3.5 h-3.5 text-night-100 dark:text-cream-300" />
        </div>
      )}

      {/* Title */}
      <p className="text-xs font-medium text-night-300 dark:text-cream-200
        max-w-[120px] truncate">
        {currentTrack?.title || '…'}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-0.5 ml-1">
        <button
          onClick={prev}
          className="w-6 h-6 flex items-center justify-center rounded-full
            text-night-100 dark:text-cream-300 hover:text-sage-500 dark:hover:text-sage-400
            transition-colors"
        >
          <SkipBack className="w-3 h-3 fill-current" />
        </button>

        <button
          onClick={toggle}
          className="w-7 h-7 flex items-center justify-center rounded-full
            bg-sage-500/10 hover:bg-sage-500/20
            text-sage-600 dark:text-sage-400
            transition-all duration-150 hover:scale-105"
        >
          {isPlaying
            ? <Pause className="w-3.5 h-3.5 fill-current" />
            : <Play className="w-3.5 h-3.5 fill-current translate-x-px" />
          }
        </button>

        <button
          onClick={next}
          className="w-6 h-6 flex items-center justify-center rounded-full
            text-night-100 dark:text-cream-300 hover:text-sage-500 dark:hover:text-sage-400
            transition-colors"
        >
          <SkipForward className="w-3 h-3 fill-current" />
        </button>
      </div>
    </div>
  );
}
