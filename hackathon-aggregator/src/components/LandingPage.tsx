import { useState, useEffect } from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [entered, setEntered] = useState(false);
  const [visible, setVisible] = useState(false);

  // Fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = () => {
    setEntered(true);
    // Give the exit animation time to play before swapping view
    setTimeout(onEnter, 700);
  };

  return (
    <div
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
            fontFamily: '"Noto Sans Devanagari", "Mangal", serif',
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

      {/* ── Bottom enter button — replaces the music player in saloon.wtf ─── */}
      <div
        className={`absolute bottom-12 left-1/2 -translate-x-1/2 z-10
          transition-all duration-1000 delay-500
          ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        <button
          id="landing-enter-btn"
          onClick={handleEnter}
          className="group relative flex items-center gap-3 px-7 py-3.5 rounded-full
            bg-white/10 hover:bg-white/20 active:bg-white/30
            border border-white/25 hover:border-white/50
            backdrop-blur-md
            text-white text-sm font-semibold tracking-wide
            transition-all duration-300 ease-out
            hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
        >
          {/* Subtle left arrow / enter icon */}
          <span className="text-white/50 group-hover:text-white/80 transition-colors text-lg leading-none">
            →
          </span>
          <span>अंदर आओ</span>
          <span className="text-white/40 text-xs font-normal">enter</span>
        </button>

        {/* Tiny keyboard hint */}
        <p className="mt-3 text-center text-white/30 text-xs tracking-widest">
          press  <kbd className="px-1.5 py-0.5 rounded border border-white/20 text-white/40 text-xs">enter</kbd>  or click
        </p>
      </div>

      {/* ── Keyboard shortcut support ────────────────────────────────────── */}
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
