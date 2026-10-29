import React, { useEffect, useRef } from 'react';
import { PORTFOLIO_DATA } from '../data';
import { director } from '../engine/director';
import { MagneticButton } from '../components/Chrome';
import gsap from 'gsap';

export const HeroBack: React.FC = () => {
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intro animation when preloader finishes
    const onIntro = () => {
      gsap.fromTo(
        lettersRef.current,
        {
          yPercent: 115,
          rotateX: -80,
          opacity: 0,
        },
        {
          yPercent: 0,
          rotateX: 0,
          opacity: 1,
          stagger: 0.07,
          duration: 1.6,
          ease: 'expo.out',
        }
      );
    };

    window.addEventListener('portfolio-intro-complete', onIntro);

    // Scroll parallax & exit fade
    const unsubscribe = director.subscribe((state) => {
      const metrics = state.scenes['hero'];
      if (!metrics || !wrapRef.current) return;

      const { p, exit } = metrics;
      const opacity = Math.max(0, 1 - exit * 2.4);

      wrapRef.current.style.opacity = `${opacity}`;
      // Tiny alternating vertical parallax per letter
      lettersRef.current.forEach((el, idx) => {
        if (!el) return;
        const dir = idx % 2 === 0 ? 1 : -1;
        const yShift = p * 40 * dir;
        el.style.transform = `translate3d(0, ${yShift}px, 0)`;
      });
    });

    return () => {
      window.removeEventListener('portfolio-intro-complete', onIntro);
      unsubscribe();
    };
  }, []);

  const nameLetters = PORTFOLIO_DATA.name.first.split('');

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        top: '10.5vh',
        right: '3vw',
        fontSize: 'min(18.5vw, 36vh)',
        lineHeight: 0.82,
        color: 'var(--red)',
        userSelect: 'none',
        display: 'flex',
        perspective: '1000px',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      className="font-anton hero-giant-name"
    >
      {nameLetters.map((char, i) => (
        <span
          key={i}
          ref={(el) => (lettersRef.current[i] = el)}
          style={{
            display: 'inline-block',
            transformOrigin: 'bottom center',
            willChange: 'transform, opacity',
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
};

export const Hero: React.FC = () => {
  const frontRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intro animation
    const onIntro = () => {
      if (line1Ref.current && line2Ref.current) {
        gsap.fromTo(
          [line1Ref.current, line2Ref.current],
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 1.4,
            stagger: 0.12,
            ease: 'expo.out',
          }
        );
      }
    };

    window.addEventListener('portfolio-intro-complete', onIntro);

    // Scroll updates: mutate DOM through refs only (no React re-renders)
    const unsubscribe = director.subscribe((state) => {
      const metrics = state.scenes['hero'];
      if (!metrics || !frontRef.current) return;

      const { p, exit } = metrics;
      // Motion rules: opacity * max(0, 1 - exit * 2.4)
      const opacity = Math.max(0, 1 - exit * 2.4);
      const yTranslate = p * -60;

      frontRef.current.style.opacity = `${opacity}`;
      frontRef.current.style.transform = `translate3d(0, ${yTranslate}px, 0)`;

      // Red highlighter underline grows with scroll progress
      if (highlightRef.current) {
        highlightRef.current.style.width = `${Math.min(100, p * 180)}%`;
      }
    });

    return () => {
      window.removeEventListener('portfolio-intro-complete', onIntro);
      unsubscribe();
    };
  }, []);

  return (
    <div className="section-inner hero-scene">
      <div
        ref={frontRef}
        className="mobile-panel"
        style={{
          position: 'absolute',
          left: '5vw',
          top: '26vh',
          width: 'min(47vw, 780px)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 3,
          willChange: 'transform, opacity',
        }}
      >
        {/* Subtitle */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--mute)',
            marginBottom: '1.4vh',
          }}
        >
          Hi, I'm <strong style={{ color: 'var(--ink)' }}>{PORTFOLIO_DATA.name.full}</strong> —
        </div>

        {/* Title */}
        <h1
          className="font-anton"
          style={{
            fontSize: 'clamp(56px, 7.6vw, 156px)',
            lineHeight: 0.88,
            color: 'var(--ink)',
            marginBottom: '2.5vh',
          }}
        >
          <div style={{ overflow: 'hidden' }}>
            <div ref={line1Ref}>{PORTFOLIO_DATA.role.line1}</div>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div ref={line2Ref} style={{ color: 'var(--red)' }}>
              {PORTFOLIO_DATA.role.line2}
            </div>
          </div>
        </h1>

        {/* 3-line description (~190 chars) */}
        <div
          style={{
            fontSize: 'clamp(16px, 1.35vw, 23px)',
            lineHeight: 1.45,
            maxWidth: '31em',
            color: 'var(--ink)',
            marginBottom: '4vh',
            position: 'relative',
            display: 'inline-block',
          }}
        >
          <span>{PORTFOLIO_DATA.tagline}</span>
          {/* Red highlighter underline whose width grows with scroll */}
          <div
            ref={highlightRef}
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: 0,
              height: '3px',
              backgroundColor: 'var(--red)',
              width: '0%',
              transition: 'width 0.05s linear',
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <MagneticButton
            variant="red"
            cursorLabel="WORK"
            onClick={() => director.scrollToScene(2)}
          >
            See my work ↘
          </MagneticButton>
          <MagneticButton
            variant="outline"
            cursorLabel="PDF"
            href="./resume.pdf"
            download="Antima_Resume.pdf"
          >
            Download résumé
          </MagneticButton>
        </div>
      </div>
    </div>
  );
};

