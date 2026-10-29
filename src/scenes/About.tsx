import React, { useEffect, useRef, useState, useMemo } from 'react';
import { PORTFOLIO_DATA } from '../data';
import { director } from '../engine/director';
import { TiltCard } from '../components/TiltCard';
import { Odometer } from '../components/Odometer';

export const AboutBack: React.FC = () => {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = director.subscribe((state) => {
      const metrics = state.scenes['about'];
      if (!metrics || !bgRef.current) return;

      const { enter, exit } = metrics;
      const opacity = Math.min(enter * 1.5, Math.max(0, 1 - exit * 2.4));
      const xTranslate = (1 - enter) * -80;

      bgRef.current.style.opacity = `${opacity}`;
      bgRef.current.style.transform = `translate3d(${xTranslate}px, 0, 0)`;
    });

    return () => unsubscribe();
  }, []);

  return (
    <div
      ref={bgRef}
      style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(60vw 90vh at 22vw 70vh, rgba(255,31,31,0.30), rgba(255,31,31,0.10) 55%, transparent 80%),
          linear-gradient(90deg, rgba(255,31,31,0.06) 0%, transparent 60%)
        `,
        opacity: 0,
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }}
    />
  );
};

export const About: React.FC = () => {
  const frontRef = useRef<HTMLDivElement>(null);
  const wordsWrapRef = useRef<HTMLDivElement>(null);
  const [statsValues, setStatsValues] = useState([0, 0, 0]);
  const wordProgRef = useRef<number[]>([]);

  // Break manifesto into words with highlight metadata
  const words = useMemo(() => {
    const list: { text: string; highlight: boolean }[] = [];
    PORTFOLIO_DATA.manifesto.forEach((seg) => {
      const parts = seg.text.split(' ');
      parts.forEach((p, idx) => {
        if (p.length > 0) {
          list.push({ text: p + (idx === parts.length - 1 ? '' : ' '), highlight: seg.highlight });
        }
      });
    });
    return list;
  }, []);

  useEffect(() => {
    const unsubscribe = director.subscribe((state) => {
      const metrics = state.scenes['about'];
      if (!metrics || !frontRef.current) return;

      const { enter, p, exit } = metrics;
      const opacity = Math.min(enter * 1.8, Math.max(0, 1 - exit * 2.4));
      const yTranslate = (1 - enter) * 40 - exit * 40;

      frontRef.current.style.opacity = `${opacity}`;
      frontRef.current.style.transform = `translate3d(0, ${yTranslate}px, 0)`;

      // Reveal word by word with scroll
      if (wordsWrapRef.current) {
        const wordEls = wordsWrapRef.current.children;
        const total = wordEls.length;
        for (let i = 0; i < total; i++) {
          const el = wordEls[i] as HTMLElement;
          const startP = (i / total) * 0.75;
          const endP = startP + 0.15;
          const wordProg = Math.max(0, Math.min(1, (p - startP) / (endP - startP)));
          // most words sit fully hidden or fully shown: skip untouched ones
          if (wordProgRef.current[i] === wordProg) continue;
          wordProgRef.current[i] = wordProg;

          const wOp = 0.1 + 0.9 * wordProg;
          const wY = (1 - wordProg) * 0.25;
          const wBlur = (1 - wordProg) * 4;

          el.style.opacity = `${wOp}`;
          el.style.transform = `translate3d(0, ${wY}em, 0)`;
          // a filter, even blur(0), keeps an offscreen buffer per word
          el.style.filter = wordProg >= 1 ? 'none' : `blur(${wBlur}px)`;
        }
      }

      // Smoothstep for stat lowest digit rolling driven by scroll
      // smoothstep(0.55, 1.0, p)
      const t = Math.max(0, Math.min(1, (p - 0.25) / 0.7));
      const smooth = t * t * (3 - 2 * t);

      const next = PORTFOLIO_DATA.stats.map((st) => Math.round(st.value * smooth));
      // re-render only when a counter actually ticks, not on every scroll frame
      setStatsValues((prev) => (prev.every((v, i) => v === next[i]) ? prev : next));
    });

    return () => unsubscribe();
  }, [words]);

  return (
    <div className="section-inner about-scene">
      <div
        ref={frontRef}
        className="mobile-panel about-front-col"
        style={{
          position: 'absolute',
          left: '50vw',
          right: '5vw',
          top: '15vh',
          bottom: '7vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 3,
          willChange: 'transform, opacity',
        }}
      >
        {/* Header Label */}
        <div>
          <div className="section-label">
            <span className="num">(01)</span> — ABOUT ME
          </div>

          {/* Manifesto paragraph (4-6 lines) */}
          <div
            ref={wordsWrapRef}
            style={{
              fontSize: 'clamp(26px, 2.6vw, 50px)',
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
              display: 'flex',
              flexWrap: 'wrap',
              alignContent: 'flex-start',
            }}
          >
            {words.map((w, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  color: w.highlight ? 'var(--red)' : 'inherit',
                  opacity: 0.1,
                  transform: 'translate3d(0, 0.25em, 0)',
                  filter: 'blur(4px)',
                  willChange: 'transform, opacity, filter',
                  whiteSpace: 'pre',
                }}
              >
                {w.text}
              </span>
            ))}
          </div>
        </div>

        {/* 3 Glass Stat Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginTop: '3vh',
          }}
          className="about-stats-grid"
        >
          {PORTFOLIO_DATA.stats.map((st, i) => (
            <TiltCard key={st.label} maxTilt={14} className="p-5">
              <div
                style={{
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.06em',
                    color: 'var(--mute)',
                    textTransform: 'uppercase',
                  }}
                >
                  {st.label}
                </div>
                <div
                  className="font-anton"
                  style={{
                    fontSize: 'clamp(38px, 3.8vw, 64px)',
                    lineHeight: 0.9,
                    color: i === 0 ? 'var(--red)' : 'var(--ink)',
                  }}
                >
                  <Odometer
                    value={statsValues[i]}
                    suffix={st.suffix}
                    height={typeof window !== 'undefined' && window.innerWidth < 820 ? 38 : 56}
                  />
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </div>
  );
};

