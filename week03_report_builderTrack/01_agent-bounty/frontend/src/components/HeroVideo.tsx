"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Pause, Play } from "lucide-react";

interface MotionState {
  playing: boolean;
  toggle: () => void;
}

const MotionContext = createContext<MotionState>({
  playing: false,
  toggle: () => {},
});

export function useMotion() {
  return useContext(MotionContext);
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    videoRef.current
      ?.play()
      .then(() => setPlaying(true))
      .catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.pause();
      setPlaying(false);
    } else {
      video
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  }, [playing]);

  return (
    <MotionContext.Provider value={{ playing, toggle }}>
      <div className="scene-background" aria-hidden="true">
        <video
          ref={videoRef}
          className="hero-video"
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_064556_051587f1-74a1-4336-8c05-4dde3594ed05.mp4"
            type="video/mp4"
          />
        </video>
      </div>
      {children}
    </MotionContext.Provider>
  );
}

/** In-flow background-motion toggle. Place inside nav bars, never as an overlay. */
export function MotionToggle({ className = "" }: { className?: string }) {
  const { playing, toggle } = useMotion();
  return (
    <button
      type="button"
      className={"motion-toggle " + className}
      aria-label={playing ? "Pause background video" : "Play background video"}
      aria-pressed={playing}
      onClick={toggle}
    >
      {playing ? <Pause size={13} /> : <Play size={13} />}
      <span>{playing ? "Pause motion" : "Play motion"}</span>
    </button>
  );
}
