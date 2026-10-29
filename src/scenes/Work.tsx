import React, { useEffect, useRef, useState } from 'react';
import { PORTFOLIO_DATA, Project } from '../data';
import { director } from '../engine/director';

export const WorkBack: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = director.subscribe((state) => {
      const metrics = state.scenes['work'];
      if (!metrics || !gridRef.current) return;

      const { enter, p, exit } = metrics;
      const opacity = Math.min(enter * 1.5, Math.max(0, 1 - exit * 2.4));
      const lineShift = (p * 300) % 90;

      gridRef.current.style.opacity = `${opacity}`;
      gridRef.current.style.backgroundPositionY = `${lineShift}px`;
    });

    return () => unsubscribe();
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        perspective: '900px',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div
        ref={gridRef}
        style={{
          position: 'absolute',
          bottom: '-15vh',
          left: '-20vw',
          width: '140vw',
          height: '80vh',
          transform: 'rotateX(68deg)',
          transformOrigin: 'bottom center',
          backgroundImage: `
            linear-gradient(to right, rgba(255, 31, 31, 0.35) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 31, 31, 0.35) 1px, transparent 1px)
          `,
          backgroundSize: '90px 90px',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 85%)',
          opacity: 0,
          willChange: 'transform, opacity, background-position',
        }}
      />
    </div>
  );
};

export const Work: React.FC = () => {
  const frontRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [activeProjectIdx, setActiveProjectIdx] = useState(0);

  useEffect(() => {
    const unsubscribe = director.subscribe((state) => {
      const metrics = state.scenes['work'];
      if (!metrics || !frontRef.current || !deckRef.current) return;

      const { enter, p, exit } = metrics;
      const opacity = Math.min(enter * 2.0, Math.max(0, 1 - exit * 2.4));
      frontRef.current.style.opacity = `${opacity}`;

      // Entry: deck comes up from below with rotateY -25deg
      const entryProgress = Math.min(1, enter * 1.5);
      const entryRotY = (1 - entryProgress) * -25;
      const entryY = (1 - entryProgress) * 60;
      deckRef.current.style.transform = `translate3d(0, ${entryY}px, 0) rotateY(${entryRotY}deg)`;

      // Progress bar (140px width container)
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${Math.min(100, p * 100)}%`;
      }

      // Scroll mapping with dwell:
      // q = i + easeInOut(frac), d = q - i
      const totalCards = PORTFOLIO_DATA.projects.length;
      const span = totalCards - 1;
      const rawQ = Math.max(0, Math.min(span, p * span));
      const baseI = Math.floor(rawQ);
      const frac = rawQ - baseI;
      const easeFrac = frac < 0.5 ? 2 * frac * frac : 1 - Math.pow(-2 * frac + 2, 2) / 2;
      const q = baseI + easeFrac;

      const currentIdx = Math.min(totalCards - 1, Math.round(q));
      setActiveProjectIdx(currentIdx);

      cardsRef.current.forEach((cardEl, i) => {
        if (!cardEl) return;
        const d = q - i;

        let z = 0;
        let yVh = 0;
        let rotX = 0;
        let cardOpacity = 1;

        if (d < 0) {
          // Upcoming card
          z = d * 300;
          yVh = d * 3.2;
          rotX = 0;
          cardOpacity = Math.max(0, 1 + d * 0.9);
        } else {
          // Leaving / active card
          z = d * 900;
          yVh = -12 * d;
          rotX = 28 * d;
          cardOpacity = Math.max(0, 1 - 1.8 * d);
        }

        cardEl.style.transform = `translate3d(0, ${yVh}vh, ${z}px) rotateX(${rotX}deg)`;
        cardEl.style.opacity = `${cardOpacity}`;
        cardEl.style.pointerEvents = Math.abs(d) < 0.4 ? 'auto' : 'none';
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="section-inner work-scene">
      <div
        ref={frontRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          willChange: 'opacity',
        }}
      >
        {/* Header: Label, Counter "01 / 03", 140px Progress Bar */}
        <div
          style={{
            position: 'absolute',
            left: '5vw',
            top: '12vh',
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
          }}
        >
          <div className="section-label" style={{ margin: 0 }}>
            <span className="num">(02)</span> — SELECTED WORKS
          </div>

          <div
            className="font-anton"
            style={{
              fontSize: '20px',
              color: 'var(--red)',
              letterSpacing: '0.04em',
            }}
          >
            0{activeProjectIdx + 1} / 0{PORTFOLIO_DATA.projects.length}
          </div>

          {/* 140px progress bar */}
          <div
            style={{
              width: '140px',
              height: '3px',
              background: 'rgba(13, 13, 13, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              ref={progressBarRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '33%',
                background: 'var(--red)',
                borderRadius: '2px',
                transition: 'width 0.05s linear',
              }}
            />
          </div>
        </div>

        {/* 3D Deck Container */}
        <div
          ref={deckRef}
          style={{
            position: 'absolute',
            left: '5vw',
            top: '23vh',
            width: 'min(49vw, 840px)',
            height: '55vh',
            perspective: '1500px',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
          className="work-deck-wrap"
        >
          {PORTFOLIO_DATA.projects.map((proj, idx) => (
            <div
              key={proj.id}
              ref={(el) => (cardsRef.current[idx] = el)}
              className="work-card"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '30px',
                background: '#ffffff',
                boxShadow:
                  '0 28px 64px -16px rgba(13, 13, 13, 0.14), 0 0 0 1px rgba(13, 13, 13, 0.06)',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                transformStyle: 'preserve-3d',
                willChange: 'transform, opacity',
              }}
            >
              {/* Left Column: Number, Category, Title, Description, Chips, Link */}
              <div
                style={{
                  padding: '40px 36px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      letterSpacing: '0.06em',
                      color: 'var(--mute)',
                      marginBottom: '10px',
                    }}
                  >
                    <span style={{ color: 'var(--red)', fontWeight: 600 }}>{proj.number}</span> —{' '}
                    {proj.category}
                  </div>

                  <h3
                    className="font-anton"
                    style={{
                      fontSize: 'clamp(36px, 3.7vw, 70px)',
                      lineHeight: 0.92,
                      color: 'var(--ink)',
                      marginBottom: '16px',
                    }}
                  >
                    {proj.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '14px',
                      lineHeight: 1.5,
                      color: 'var(--mute)',
                      marginBottom: '24px',
                    }}
                  >
                    {proj.description}
                  </p>
                </div>

                <div>
                  {/* Four Tech Chips */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '28px',
                    }}
                  >
                    {proj.tech.map((chip) => (
                      <span
                        key={chip}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          letterSpacing: '0.02em',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          background: 'rgba(13, 13, 13, 0.05)',
                          color: 'var(--ink)',
                          fontWeight: 500,
                        }}
                      >
                        {chip}
                      </span>
                    ))}
                  </div>

                  {/* Red "View on GitHub ↗" link */}
                  <a
                    href={proj.github}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor="OPEN"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'var(--red)',
                      textDecoration: 'none',
                    }}
                  >
                    View on GitHub ↗
                  </a>
                </div>
              </div>

              {/* Right Column: Red visual panel with CSS mock */}
              <div
                style={{
                  background: 'var(--red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '30px',
                  color: '#ffffff',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                className="work-mock-panel"
              >
                {proj.mockType === 'erp' && <MockERP />}
                {proj.mockType === 'ai' && <MockAI />}
                {proj.mockType === 'lms' && <MockLMS />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// CSS Mock 1: Solar ERP Platform
const MockERP: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: 'rgba(0, 0, 0, 0.15)',
      borderRadius: '20px',
      padding: '24px',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.05em' }}>
        SOLAR GRID YIELD
      </span>
      <span
        style={{
          background: '#ffffff',
          color: 'var(--red)',
          padding: '2px 8px',
          borderRadius: '999px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          fontWeight: 700,
        }}
      >
        LIVE
      </span>
    </div>

    {/* Animated Gauge & Metric */}
    <div style={{ textAlign: 'center', margin: 'auto 0' }}>
      <div
        className="font-anton"
        style={{ fontSize: '54px', lineHeight: 1, letterSpacing: '0.02em' }}
      >
        98.4<span style={{ fontSize: '24px' }}>%</span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.8)',
          marginTop: '6px',
        }}
      >
        AUTOMATION THROUGHPUT // 2.4k MSG/HR
      </div>
    </div>

    {/* Heatmap / Mini Grid */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '16px',
            borderRadius: '3px',
            background:
              i % 4 === 0
                ? '#ffffff'
                : i % 2 === 0
                ? 'rgba(255, 255, 255, 0.7)'
                : 'rgba(255, 255, 255, 0.3)',
          }}
        />
      ))}
    </div>
  </div>
);

// CSS Mock 2: AI Voice Caller
const MockAI: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: 'rgba(0, 0, 0, 0.15)',
      borderRadius: '20px',
      padding: '24px',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.05em' }}>
        VOICE SYNTHESIS
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>ELEVENLABS API</span>
    </div>

    {/* Waveform Bars */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        height: '80px',
      }}
    >
      {[32, 54, 76, 42, 88, 65, 92, 45, 68, 80, 52, 70, 38].map((h, i) => (
        <div
          key={i}
          style={{
            width: '6px',
            height: `${h}%`,
            background: '#ffffff',
            borderRadius: '999px',
            animation: `pulseWave ${0.8 + (i % 5) * 0.2}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>

    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        paddingTop: '12px',
      }}
    >
      <span>LATENCY: 140ms</span>
      <span>CALLING AGENT: ACTIVE</span>
    </div>
  </div>
);

// CSS Mock 3: LMS & Collaboration
const MockLMS: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: 'rgba(0, 0, 0, 0.15)',
      borderRadius: '20px',
      padding: '24px',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.05em' }}>
        REAL-TIME WHITEBOARD
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>SOCKET.IO</span>
    </div>

    {/* Chat Bubbles Mock */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: 'auto 0' }}>
      <div
        style={{
          background: '#ffffff',
          color: 'var(--red)',
          padding: '8px 14px',
          borderRadius: '14px 14px 14px 2px',
          alignSelf: 'flex-start',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
        }}
      >
        Session connected: 34 peers
      </div>
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.25)',
          color: '#ffffff',
          padding: '8px 14px',
          borderRadius: '14px 14px 2px 14px',
          alignSelf: 'flex-end',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Canvas state synced in 18ms
      </div>
    </div>

    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        paddingTop: '12px',
      }}
    >
      <span>ROLE: ADMIN / INSTRUCTOR</span>
      <span>ENCRYPTION: TLS 1.3</span>
    </div>
  </div>
);

