import { useState, useEffect } from 'react';
import { LandingMusicPlayer } from './MusicPlayer';
import type { MusicPlayerState } from '../hooks/useYouTubePlayer';

interface LandingPageProps {
  onEnter: () => void;
  player: MusicPlayerState;
}

export default function LandingPage({ onEnter, player }: LandingPageProps) {
  const [entered, setEntered] = useState(false);
  const [visible, setVisible] = useState(false);

  // Fade-in on mount and prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => setVisible(true), 80);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, []);

  const handleEnter = () => {
    setEntered(true);
    if (!player.isPlaying && player.isReady) {
      player.play();
    }
    // Give the exit animation time to play before swapping view
    setTimeout(onEnter, 700);
  };

  const handleInteraction = () => {
    if (!player.isPlaying && player.isReady) {
      player.play();
    }
  };

  return (
    <div
      onClick={handleInteraction}
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-700 ease-in-out
        ${visible ? 'opacity-100' : 'opacity-0'}
        ${entered ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
    >
      {/* ── Full-bleed background image ───────────────────────────────────── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
      />

      {/* ── Warm dark vignette overlay ─────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

      {/* ── Top-right indicators (minimal, like saloon.wtf) ───────────────── */}
      <div className="absolute top-5 right-6 flex items-center gap-3 z-10">
        <span className="flex items-center gap-1.5 text-white/60 text-xs font-medium tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          online
        </span>
      </div>

      {/* ── Main centered content ──────────────────────────────────────────── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6">
        {/* Hindi headline — matching saloon.wtf large bold Devanagari style */}
        <h1
          className={`text-center font-extrabold leading-none tracking-tight select-none
            transition-all duration-1000 delay-100
            ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
          style={{
            fontSize: 'clamp(3.5rem, 12vw, 9rem)',
            color: '#fff',
            textShadow: '0 4px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(0,0,0,0.4)',
            fontFamily: '"Yatra One", serif',
          }}
        >
          बनाने वालों
          <br />
          की जगह
        </h1>

        {/* Sub-label */}
        <p
          className={`mt-5 text-white/60 text-sm font-medium tracking-widest uppercase
            transition-all duration-1000 delay-300
            ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        >
          Hackathons &amp; Tech Events · India &amp; Beyond
        </p>
      </div>

      {/* ── Bottom area — music player + enter button (like saloon.wtf) ────── */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-10
          flex flex-col items-center gap-4
          transition-all duration-1000 delay-500
          ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
      >
        {/* Full music player widget */}
        <LandingMusicPlayer {...player} />

        {/* Minimal enter button below the player */}
        <button
          id="landing-enter-btn"
          onClick={handleEnter}
          className="group flex items-center gap-2.5 px-6 py-2.5 rounded-full
            bg-white/8 hover:bg-white/15 active:bg-white/25
            border border-white/20 hover:border-white/40
            backdrop-blur-md
            text-white/70 hover:text-white text-sm font-medium tracking-wide
            transition-all duration-300 ease-out
            hover:scale-105"
        >
          <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
          <span>अंदर आओ</span>
          <span className="text-white/35 text-xs font-normal ml-0.5">enter</span>
        </button>

        {/* Keyboard hint */}
        <p className="text-white/25 text-xs tracking-widest -mt-2">
          or press <kbd className="px-1 py-0.5 rounded border border-white/15 text-white/30 text-[10px]">enter</kbd>
        </p>
      </div>

      {/* ── Keyboard shortcut support ─────────────────────────────────────── */}
      <KeyListener onEnter={handleEnter} />
    </div>
  );
}

/** Listen for Enter/Space keypress to trigger the entry */
function KeyListener({ onEnter }: { onEnter: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onEnter();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEnter]);
  return null;
}
