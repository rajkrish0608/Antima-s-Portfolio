import React, { useEffect, useRef, useState } from 'react';
import { PORTFOLIO_DATA } from '../data';
import { director } from '../engine/director';

export const JourneyBack: React.FC = () => {
  const yearWrapRef = useRef<HTMLDivElement>(null);
  const [yearText, setYearText] = useState('2021');

  useEffect(() => {
    const unsubscribe = director.subscribe((state) => {
      const metrics = state.scenes['journey'];
      if (!metrics || !yearWrapRef.current) return;

      const { enter, p, exit } = metrics;
      const opacity = Math.min(enter * 1.6, Math.max(0, 1 - exit * 2.4));
      yearWrapRef.current.style.opacity = `${opacity}`;

      // Rolling year from 2021 to 2024 with scroll
      const { start, end } = PORTFOLIO_DATA.journeyYears;
      const exactYear = start + (end - start) * p;
      setYearText(String(Math.min(end, Math.max(start, Math.round(exactYear)))));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div
      ref={yearWrapRef}
      style={{
        position: 'absolute',
        top: '20vh',
        left: '6vw',
        fontSize: '44vh',
        lineHeight: 0.82,
        color: 'transparent',
        WebkitTextStroke: '2px var(--red)',
        userSelect: 'none',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0,
        willChange: 'opacity',
      }}
      className="font-anton journey-colossal-year"
    >
      {yearText}
    </div>
  );
};

export const Journey: React.FC = () => {
  const frontRef = useRef<HTMLDivElement>(null);
  const timelineSvgRef = useRef<SVGPathElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const nodesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const unsubscribe = director.subscribe((state) => {
      const metrics = state.scenes['journey'];
      if (!metrics || !frontRef.current) return;

      const { enter, p, exit } = metrics;
      const opacity = Math.min(enter * 1.8, Math.max(0, 1 - exit * 2.4));
      frontRef.current.style.opacity = `${opacity}`;

      // Red SVG line that draws from bottom up using pathLength=1 and dashoffset
      if (timelineSvgRef.current) {
        // Drawing from bottom to top as p advances (0 -> 1)
        const offset = Math.max(0, Math.min(1, 1 - p));
        timelineSvgRef.current.style.strokeDashoffset = `${offset}`;
      }

      // Three items reveal from bottom with rotateY -55deg -> 0, active node fills red
      const total = PORTFOLIO_DATA.journey.length;
      itemsRef.current.forEach((itemEl, idx) => {
        if (!itemEl) return;
        // Reversed index because bottom item is oldest
        const itemP = Math.max(0, Math.min(1, (p - (total - 1 - idx) * 0.25) / 0.35));
        const rotY = (1 - itemP) * -55;
        const itemOp = 0.15 + 0.85 * itemP;
        const itemY = (1 - itemP) * 35;

        itemEl.style.transform = `translate3d(0, ${itemY}px, 0) rotateY(${rotY}deg)`;
        itemEl.style.opacity = `${itemOp}`;

        const nodeEl = nodesRef.current[idx];
        if (nodeEl) {
          nodeEl.style.backgroundColor = itemP > 0.5 ? 'var(--red)' : '#ffffff';
          nodeEl.style.borderColor = itemP > 0.5 ? 'var(--red)' : 'rgba(13, 13, 13, 0.2)';
        }
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="section-inner journey-scene">
      <div
        ref={frontRef}
        className="mobile-panel journey-front-col"
        style={{
          position: 'absolute',
          left: '52vw',
          right: '5vw',
          top: '15vh',
          bottom: '8vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 3,
          willChange: 'transform, opacity',
        }}
      >
        {/* Header */}
        <div>
          <div className="section-label">
            <span className="num">(03)</span> — EXPERIENCE & EDUCATION
          </div>

          <h2
            className="font-anton"
            style={{
              fontSize: 'clamp(44px, 4.8vw, 92px)',
              lineHeight: 0.88,
              color: 'var(--ink)',
              marginBottom: '4vh',
            }}
          >
            <div>LEARNING</div>
            <div style={{ color: 'var(--red)' }}>OUT LOUD.</div>
          </h2>
        </div>

        {/* Timeline with SVG Track & Line */}
        <div
          style={{
            position: 'relative',
            paddingLeft: '44px',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
          }}
        >
          {/* Vertical Track (SVG) */}
          <svg
            style={{
              position: 'absolute',
              top: '12px',
              bottom: '12px',
              left: '12px',
              width: '2px',
              height: 'calc(100% - 24px)',
              overflow: 'visible',
            }}
          >
            {/* Grey 1px track */}
            <line
              x1="1"
              y1="0"
              x2="1"
              y2="100%"
              stroke="rgba(13, 13, 13, 0.12)"
              strokeWidth="2"
            />
            {/* Red drawing line from bottom up */}
            <path
              ref={timelineSvgRef}
              d="M 1 320 L 1 0"
              pathLength="1"
              fill="none"
              stroke="var(--red)"
              strokeWidth="3"
              style={{
                strokeDasharray: '1',
                strokeDashoffset: '1',
                transition: 'strokeDashoffset 0.05s linear',
              }}
            />
          </svg>

          {PORTFOLIO_DATA.journey.map((item, idx) => (
            <div
              key={item.year + item.title}
              ref={(el) => (itemsRef.current[idx] = el)}
              style={{
                position: 'relative',
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center',
                willChange: 'transform, opacity',
              }}
            >
              {/* Node bullet */}
              <div
                ref={(el) => (nodesRef.current[idx] = el)}
                style={{
                  position: 'absolute',
                  left: '-40px',
                  top: '4px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '2px solid rgba(13, 13, 13, 0.2)',
                  transition: 'background-color 0.3s ease, border-color 0.3s ease',
                  zIndex: 2,
                }}
              />

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.06em',
                  color: 'var(--red)',
                  fontWeight: 600,
                  marginBottom: '6px',
                }}
              >
                {item.year}
              </div>

              <div
                className="font-anton"
                style={{
                  fontSize: 'clamp(22px, 2.2vw, 36px)',
                  lineHeight: 1.05,
                  color: 'var(--ink)',
                  marginBottom: '6px',
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--mute)',
                  letterSpacing: '0.03em',
                  marginBottom: '8px',
                }}
              >
                {item.organization} — {item.location}
              </div>

              <p
                style={{
                  fontSize: '14px',
                  lineHeight: 1.45,
                  color: 'var(--ink)',
                  maxWidth: '36em',
                }}
              >
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

