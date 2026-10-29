import React, { useEffect, useRef } from 'react';
import { PORTFOLIO_DATA } from '../data';
import { director } from '../engine/director';

export const Awards: React.FC = () => {
  const frontRef = useRef<HTMLDivElement>(null);
  const flipCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const certCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const certCounterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const unsubscribe = director.subscribe((state) => {
      const metrics = state.scenes['awards'];
      if (!metrics || !frontRef.current) return;

      const { enter, p, exit } = metrics;
      const opacity = Math.min(enter * 1.8, Math.max(0, 1 - exit * 2.4));
      frontRef.current.style.opacity = `${opacity}`;

      // Four flip-in counter cards: rotateX -100deg -> 0, staggered
      flipCardsRef.current.forEach((el, idx) => {
        if (!el) return;
        const cardP = Math.max(0, Math.min(1, (enter - 0.2 - idx * 0.12) / 0.45));
        const rotX = (1 - cardP) * -100;
        const cardOp = cardP;
        el.style.transform = `perspective(1000px) rotateX(${rotX}deg)`;
        el.style.opacity = `${cardOp}`;
      });

      // Certification cards rise in after the counters, then the highlight
      // steps through them as the section scrolls
      const N = PORTFOLIO_DATA.certifications.length;
      const active = Math.min(N - 1, Math.floor(p * N));
      certCardsRef.current.forEach((el, idx) => {
        if (!el) return;
        const cardP = Math.max(0, Math.min(1, (enter - 0.35 - idx * 0.06) / 0.3));
        el.style.opacity = `${cardP}`;
        el.style.transform = `translate3d(0, ${(1 - cardP) * 24}px, 0)`;
        el.classList.toggle('is-active', idx === active);
      });
      if (certCounterRef.current) {
        certCounterRef.current.textContent = `${String(active + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="section-inner awards-scene">
      <div
        ref={frontRef}
        style={{
          position: 'absolute',
          inset: 0,
          // clear the HUD logo (top 32px + ~34px) on short viewports
          padding: 'max(12vh, 104px) 5vw 6vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 3,
          willChange: 'opacity',
        }}
      >
        {/* Top Header & 4 Flip-in Counter Cards */}
        <div className="awards-col">
          <div className="section-label">
            <span className="num">(05)</span> — CREDENTIALS & BENCHMARKS
          </div>

          <h2
            className="font-anton"
            style={{
              fontSize: 'clamp(36px, 3.8vw, 72px)',
              lineHeight: 0.9,
              color: 'var(--ink)',
              marginBottom: '3vh',
            }}
          >
            VERIFIED EXECUTION.
          </h2>

          {/* Four flip-in cards alternating red/black */}
          <div
            className="awards-counter-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '14px',
            }}
          >
            {PORTFOLIO_DATA.awardStats.map((stat, idx) => {
              const isRed = idx % 2 === 0;
              return (
                <div
                  key={stat.platform}
                  ref={(el) => (flipCardsRef.current[idx] = el)}
                  style={{
                    background: isRed ? 'var(--red)' : 'var(--ink)',
                    color: '#ffffff',
                    borderRadius: '18px',
                    padding: '20px 16px',
                    boxShadow: isRed
                      ? '0 12px 28px -6px rgba(255, 31, 31, 0.35)'
                      : '0 12px 28px -6px rgba(13, 13, 13, 0.25)',
                    transformOrigin: 'top center',
                    willChange: 'transform, opacity',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      letterSpacing: '0.06em',
                      opacity: 0.8,
                      marginBottom: '8px',
                    }}
                  >
                    {stat.platform}
                  </div>
                  <div
                    className="font-anton"
                    style={{
                      fontSize: 'clamp(32px, 3.2vw, 54px)',
                      lineHeight: 0.92,
                      letterSpacing: '-0.02em',
                      marginBottom: '6px',
                    }}
                  >
                    {stat.count}
                    <span style={{ fontSize: '0.6em', marginLeft: '2px' }}>{stat.suffix}</span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      letterSpacing: '0.04em',
                      opacity: 0.9,
                      lineHeight: 1.3,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certifications: 3x2 grid centred in the space under the counters */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', marginTop: '3vh' }}>
          <div className="awards-col" style={{ width: '100%' }}>
            <div className="cert-head">
              <span>CERTIFICATIONS</span>
              <span ref={certCounterRef} className="cert-counter">
                01 / {String(PORTFOLIO_DATA.certifications.length).padStart(2, '0')}
              </span>
            </div>

            <div className="cert-grid">
              {PORTFOLIO_DATA.certifications.map((cert, i) => (
                <div
                  key={cert.id}
                  ref={(el) => (certCardsRef.current[i] = el)}
                  className="cert-card"
                  style={{ opacity: 0 }}
                >
                  <div className="cert-top">
                    <span className="cert-id">{cert.id}</span>
                    <span className="cert-seal">✓</span>
                  </div>
                  <div>
                    <div className="font-anton cert-title">{cert.title}</div>
                    <div className="cert-issuer">
                      {cert.issuer} // {cert.year}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

