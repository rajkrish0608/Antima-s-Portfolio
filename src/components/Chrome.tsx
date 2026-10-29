import React, { useEffect, useRef, useState, useCallback } from 'react';
import { director, SCENES, ScrollDirectorState } from '../engine/director';
import { frameLoader } from '../engine/frames';
import { PORTFOLIO_DATA } from '../data';
import gsap from 'gsap';

interface ChromeProps {
  onIntroComplete?: () => void;
}

export const Chrome: React.FC<ChromeProps> = ({ onIntroComplete }) => {
  // Preloader State
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isPreloaderFinished, setIsPreloaderFinished] = useState(false);
  const [preloaderRemoved, setPreloaderRemoved] = useState(false);

  // HUD State
  const [hudState, setHudState] = useState<{
    activeSceneIndex: number;
    progressPercent: number;
    isContactMode: boolean;
  }>({
    activeSceneIndex: 0,
    progressPercent: 0,
    isContactMode: false,
  });

  // Cursor State
  const [cursorLabel, setCursorLabel] = useState<string | null>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef({ x: -100, y: -100, ringX: -100, ringY: -100 });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. PRELOADER LOGIC
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const currentTweenVal = { val: 0 };
    // Local flag, not state: every onUpdate at 100 would otherwise queue another
    // finish (and re-running the effect on state change restarted the counter)
    let finishing = false;

    const unsubscribe = frameLoader.onProgress((_loaded, _total, readyRatio) => {
      const targetPercent = Math.round(readyRatio * 100);

      gsap.to(currentTweenVal, {
        val: targetPercent,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => {
          setPreloadProgress(Math.round(currentTweenVal.val));
          if (currentTweenVal.val >= 100 && !finishing) {
            finishing = true;
            setTimeout(() => {
              setIsPreloaderFinished(true);
              // Lenis starts, intro fires
              setTimeout(() => {
                director.start();
                if (onIntroComplete) onIntroComplete();
                // dispatch global window event as well
                window.dispatchEvent(new CustomEvent('portfolio-intro-complete'));
                setPreloaderRemoved(true);
              }, 1200);
            }, 300);
          }
        },
      });
    });

    return () => unsubscribe();
  }, [onIntroComplete]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. HUD & SCROLL TRACKING
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    return director.subscribe((state: ScrollDirectorState) => {
      const isEnteringContact =
        state.activeScene.id === 'contact' &&
        (!state.transition || state.transition.t > 0.6);

      const progressPercent = Math.round(state.progress * 100);
      // Scroll ticks far more often than these values change: skip no-op renders
      setHudState((prev) =>
        prev.activeSceneIndex === state.activeSceneIndex &&
        prev.progressPercent === progressPercent &&
        prev.isContactMode === isEnteringContact
          ? prev
          : { activeSceneIndex: state.activeSceneIndex, progressPercent, isContactMode: isEnteringContact }
      );
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. CURSOR LOGIC (DESKTOP)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < 820) return;

    let animId = 0;

    const onMouseMove = (e: MouseEvent) => {
      mousePosRef.current.x = e.clientX;
      mousePosRef.current.y = e.clientY;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }

      // Check for [data-cursor]
      const target = e.target as HTMLElement | null;
      const cursorTarget = target?.closest('[data-cursor]');
      if (cursorTarget) {
        const label = cursorTarget.getAttribute('data-cursor') || 'GO';
        setCursorLabel(label);
      } else {
        setCursorLabel(null);
      }
    };

    const updateRing = () => {
      const m = mousePosRef.current;
      // Lerp ring behind at 0.16
      m.ringX += (m.x - m.ringX) * 0.16;
      m.ringY += (m.y - m.ringY) * 0.16;

      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${m.ringX}px, ${m.ringY}px, 0) translate(-50%, -50%)`;
      }

      animId = requestAnimationFrame(updateRing);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    animId = requestAnimationFrame(updateRing);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Magnetic button helper for pill nav or links
  const handleNavClick = useCallback((index: number) => {
    director.scrollToScene(index);
  }, []);

  return (
    <>
      {/* ────────────────── CURSOR (DESKTOP) ────────────────── */}
      <div ref={cursorDotRef} className="custom-cursor-dot" />
      <div
        ref={cursorRingRef}
        className={`custom-cursor-ring ${cursorLabel ? 'hovered' : ''}`}
      >
        <span className="custom-cursor-label">{cursorLabel}</span>
      </div>

      {/* ────────────────── HUD ────────────────── */}
      <div className={`hud-container ${hudState.isContactMode ? 'hud-contact-mode' : ''}`}>
        <header className="hud-top">
          {/* Logo */}
          <div
            onClick={() => director.scrollToTop()}
            className="hud-logo"
            data-cursor="TOP"
          >
            <span>{PORTFOLIO_DATA.name.first}</span>
            <span className="reg">®</span>
          </div>

          {/* Pill Nav */}
          <nav className="hud-nav" data-cursor="NAV">
            {SCENES.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => handleNavClick(idx)}
                className={`hud-nav-item ${hudState.activeSceneIndex === idx ? 'active' : ''}`}
              >
                {scene.label}
              </button>
            ))}
          </nav>
        </header>

        {/* Rail & Progress */}
        <div className="hud-rail-wrap">
          <span className="hud-progress-label">
            {String(hudState.progressPercent).padStart(2, '0')}%
          </span>
          <div className="hud-rail-track">
            <div
              className="hud-rail-fill"
              style={{ height: `${hudState.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ────────────────── PRELOADER ────────────────── */}
      {!preloaderRemoved && (
        <div
          className={`preloader-container ${isPreloaderFinished ? 'finished' : ''}`}
        >
          <div className="preloader-half top" />
          <div className="preloader-half bottom" />

          <div className="preloader-content">
            <div className="preloader-line" style={{ marginBottom: '1.2vh' }}>
              INITIALIZING ENGINE // 240 FRAMES
            </div>
            <div className="preloader-num">
              {String(preloadProgress).padStart(3, '0')}
            </div>
            <div className="preloader-line" style={{ marginTop: '1.2vh' }}>
              ANTIMA — PORTFOLIO 2026
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface MagneticButtonProps {
  children: React.ReactNode;
  variant?: 'red' | 'outline';
  onClick?: () => void;
  href?: string;
  cursorLabel?: string;
  className?: string;
  download?: boolean | string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  variant = 'red',
  onClick,
  href,
  cursorLabel = 'GO',
  className = '',
  download,
}) => {
  const wrapRef = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const qxRef = useRef<any>(null);
  const qyRef = useRef<any>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    // quickTo with elastic easing, strength 0.35
    qxRef.current = gsap.quickTo(wrapRef.current, 'x', {
      duration: 0.5,
      ease: 'elastic.out(1, 0.35)',
    });
    qyRef.current = gsap.quickTo(wrapRef.current, 'y', {
      duration: 0.5,
      ease: 'elastic.out(1, 0.35)',
    });
  }, []);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!wrapRef.current || !qxRef.current || !qyRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    qxRef.current(x * 0.35);
    qyRef.current(y * 0.35);
  };

  const onMouseLeave = () => {
    if (qxRef.current && qyRef.current) {
      qxRef.current(0);
      qyRef.current(0);
    }
  };

  const Component: any = href ? 'a' : 'button';

  return (
    <Component
      ref={wrapRef}
      href={href}
      onClick={onClick}
      download={download}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      data-cursor={cursorLabel}
      className={`btn-magnetic-wrap ${className}`}
    >
      <div className={`btn-pill btn-${variant}`}>
        <div className="btn-fill" />
        <div className="btn-text-roll">
          <div className="roll-inner">
            <span className="roll-line">{children}</span>
            <span className="roll-line">{children}</span>
          </div>
        </div>
      </div>
    </Component>
  );
};

