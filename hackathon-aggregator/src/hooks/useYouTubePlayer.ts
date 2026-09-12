import { useState, useEffect, useRef, useCallback } from 'react';

// ── YouTube IFrame API type declarations ───────────────────────────────────────
interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  getVideoData: () => { video_id: string; title: string; author: string };
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
}

declare global {
  interface Window {
    YT: {
      Player: new (element: string | HTMLElement, config: object) => YTPlayer;
      PlayerState: { UNSTARTED: -1; ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

// ── Public types ───────────────────────────────────────────────────────────────
export interface TrackInfo {
  title: string;
  author: string;
  videoId: string;
  thumbnailUrl: string;
}

export interface MusicPlayerState {
  isReady: boolean;
  isPlaying: boolean;
  autoplayBlocked: boolean;
  currentTrack: TrackInfo | null;
  currentTime: number;
  duration: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useYouTubePlayer(playlistId: string): MusicPlayerState {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerIdRef = useRef(`yt-player-${Math.random().toString(36).slice(2)}`);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Pull fresh track metadata — returns true when data is ready
  const syncTrack = useCallback((): boolean => {
    if (!playerRef.current) return false;
    try {
      const data = playerRef.current.getVideoData();
      // video_id is empty string when the video hasn't loaded yet
      if (data?.video_id && data.title) {
        setCurrentTrack({
          title:        data.title,
          author:       data.author,
          videoId:      data.video_id,
          // mqdefault = 320x180, hqdefault = 480x360
          thumbnailUrl: `https://img.youtube.com/vi/${data.video_id}/hqdefault.jpg`,
        });
        setDuration(playerRef.current.getDuration() || 0);
        setCurrentTime(playerRef.current.getCurrentTime() || 0);
        return true;
      }
    } catch { /* ignore */ }
    return false;
  }, []);

  // Poll every 400 ms until getVideoData() has a real video_id (max 30 tries ≈ 12s)
  const pollUntilReady = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    pollRef.current = setInterval(() => {
      attempts++;
      const ok = syncTrack();
      if (ok || attempts >= 30) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
      }
    }, 400);
  }, [syncTrack]);

  // Start or stop the 1-second progress ticker
  const startTicker = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      if (playerRef.current) {
        try {
          setCurrentTime(playerRef.current.getCurrentTime() || 0);
        } catch { /* ignore */ }
      }
    }, 1000);
  }, []);

  const stopTicker = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  // Initialize player once API is ready
  const initPlayer = useCallback(() => {
    if (!mountedRef.current) return;
    if (!window.YT?.Player) return;

    playerRef.current = new window.YT.Player(containerIdRef.current, {
      height: '250',
      width: '250',
      playerVars: {
        listType: 'playlist',
        list: playlistId,
        autoplay: 1,
        controls: 0,
        rel: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        fs: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: { target: any }) => {
          setIsReady(true);
          // Explicitly cue the playlist to force it to load metadata
          event.target.cuePlaylist({
            listType: 'playlist',
            list: playlistId,
          });
          
          setTimeout(() => {
            try {
              event.target.playVideo();
            } catch {
              setAutoplayBlocked(true);
            }
          }, 500);
          
          // Start polling
          pollUntilReady();
        },
        onStateChange: (event: { data: number; target: any }) => {
          const state = event.data;
          // state 5 is CUED, -1 is UNSTARTED
          if (state === 5) {
            // Once cued, try to play
            try { event.target.playVideo(); } catch { /* ignore */ }
            pollUntilReady();
          } else if (state === 1) {
            // PLAYING
            setIsPlaying(true);
            setAutoplayBlocked(false);
            startTicker();
            if (!syncTrack()) pollUntilReady();
          } else if (state === 2) {
            // PAUSED
            setIsPlaying(false);
            stopTicker();
          } else if (state === 0) {
            // ENDED — auto-advance handled by YT
            setIsPlaying(false);
          } else if (state === 3) {
            // BUFFERING — new track may be loading
            pollUntilReady();
          }
        },
        onError: (e: any) => {
          console.error("YouTube Player Error:", e.data);
          setAutoplayBlocked(true);
        },
      },
    });
  }, [playlistId, syncTrack, pollUntilReady, startTicker, stopTicker]);

  // Load the IFrame API script and init
  useEffect(() => {
    const containerId = containerIdRef.current;

    // Ensure container div exists in the DOM
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.cssText =
        'position:fixed;top:-9999px;left:-9999px;width:250px;height:250px;opacity:0.01;pointer-events:none;';
      document.body.appendChild(container);
    }

    const handleReady = () => initPlayer();
    
    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.addEventListener('yt-ready', handleReady);
      if (!document.getElementById('yt-iframe-api')) {
        const script = document.createElement('script');
        script.id = 'yt-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          prev?.();
          window.dispatchEvent(new Event('yt-ready'));
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      window.removeEventListener('yt-ready', handleReady);
      stopTicker();
      if (pollRef.current) clearInterval(pollRef.current);
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      document.getElementById(containerId)?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  // Controls
  const play = useCallback(() => {
    playerRef.current?.playVideo();
    setAutoplayBlocked(false);
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause(); else play();
  }, [isPlaying, play, pause]);

  const next = useCallback(() => {
    playerRef.current?.nextVideo();
    setTimeout(syncTrack, 1500);
  }, [syncTrack]);

  const prev = useCallback(() => {
    playerRef.current?.previousVideo();
    setTimeout(syncTrack, 1500);
  }, [syncTrack]);

  const seek = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
    setCurrentTime(seconds);
  }, []);

  return {
    isReady, isPlaying, autoplayBlocked, currentTrack,
    currentTime, duration,
    play, pause, toggle, next, prev, seek,
  };
}
