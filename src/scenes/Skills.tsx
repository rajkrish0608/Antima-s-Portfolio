import React, { useEffect, useRef } from 'react';
import { PORTFOLIO_DATA } from '../data';
import { director } from '../engine/director';

interface ProjectedChip {
  skill: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
}

// Compute Fibonacci Sphere coordinates
const N = PORTFOLIO_DATA.skills.length; // 16 skills
const goldenAngle = Math.PI * (3 - Math.sqrt(5));

const SPHERE_POINTS = PORTFOLIO_DATA.skills.map((skill, i) => {
  const y = 1 - (i / Math.max(1, N - 1)) * 2; // 1 to -1
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = goldenAngle * i;
  const x = Math.cos(theta) * radius;
  const z = Math.sin(theta) * radius;
  return { skill, x, y, z };
});

// The orbit loop pushes projected chips straight into the Back and Front layers'
// DOM nodes (no React state), so spinning the sphere never re-renders anything
const orbitListeners = new Set<(chips: ProjectedChip[]) => void>();

function updateGlobalOrbit(chips: ProjectedChip[]) {
  for (const fn of orbitListeners) {
    fn(chips);
  }
}

// Back layer: chips behind the person (z < 0). Front layer: z >= 0.
const OrbitLayer: React.FC<{ front: boolean }> = ({ front }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const onOrbit = (chips: ProjectedChip[]) => {
      chips.forEach((chip, i) => {
        const el = chipRefs.current[i];
        if (!el) return;
        const show = front ? chip.z >= 0 : chip.z < 0;
        el.style.display = show ? '' : 'none';
        if (!show) return;
        el.style.transform = `translate3d(${chip.x}px, ${chip.y}px, 0) translate(-50%, -50%) scale(${chip.scale})`;
        el.style.opacity = `${front ? chip.opacity : chip.opacity * 0.7}`;
      });
    };
    orbitListeners.add(onOrbit);

    const unsubscribe = director.subscribe((state) => {
      const metrics = state.scenes['skills'];
      if (!metrics || !containerRef.current) return;
      const { enter, exit } = metrics;
      const opacity = Math.min(enter * 1.8, Math.max(0, 1 - exit * 2.4));
      containerRef.current.style.opacity = `${opacity}`;
    });

    return () => {
      orbitListeners.delete(onOrbit);
      unsubscribe();
    };
  }, [front]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: front ? 2 : 0,
        opacity: 0,
        willChange: 'opacity',
      }}
    >
      {SPHERE_POINTS.map((pt, i) => (
        <div
          key={pt.skill}
          ref={(el) => (chipRefs.current[i] = el)}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            display: 'none',
            padding: front ? '9px 22px' : '8px 20px',
            borderRadius: '9999px',
            background: front ? 'var(--red)' : 'rgba(255, 255, 255, 0.75)',
            border: front ? '1.5px solid #ffffff' : '1.5px solid var(--red)',
            color: front ? '#ffffff' : 'var(--red)',
            fontFamily: 'var(--font-mono)',
            fontSize: front ? '12px' : '11px',
            fontWeight: front ? 700 : 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            boxShadow: front ? '0 8px 24px rgba(255, 31, 31, 0.45)' : '0 4px 16px rgba(255, 31, 31, 0.08)',
            willChange: 'transform, opacity',
          }}
        >
          {pt.skill}
        </div>
      ))}
    </div>
  );
};

export const SkillsBack: React.FC = () => <OrbitLayer front={false} />;

export const SkillsFront: React.FC = () => <OrbitLayer front />;

export const Skills: React.FC = () => {
  const frontRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const autoAngleRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Orbit calculation loop
    const loop = () => {
      animFrameRef.current = requestAnimationFrame(loop);
      autoAngleRef.current += 0.006;

      const state = director.getState();
      const metrics = state.scenes['skills'];
      // Nothing to draw while Toolkit is off screen
      if (!metrics || metrics.enter <= 0 || metrics.exit >= 1) return;
      const p = metrics.p;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Orbit parameters:
      // R = min(27vw, 46vh), y squashed by .78, tilt -0.28 rad
      // Auto-spins, spins with scroll * 5, follows mouse
      const R = Math.min(vw * 0.27, vh * 0.46);
      const rotY = autoAngleRef.current + p * 5 * Math.PI + mouseRef.current.x * 0.4;
      const tilt = -0.28;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosTilt = Math.cos(tilt);
      const sinTilt = Math.sin(tilt);

      const cx = vw * (vw < 820 ? 0.5 : 0.5);
      const cy = vh * 0.54;

      const chips: ProjectedChip[] = SPHERE_POINTS.map((pt) => {
        // Rotate around Y
        const x1 = pt.x * cosY - pt.z * sinY;
        const z1 = pt.x * sinY + pt.z * cosY;
        const y1 = pt.y;

        // Tilt around X
        const y2 = y1 * cosTilt - z1 * sinTilt;
        const z2 = y1 * sinTilt + z1 * cosTilt;
        const x2 = x1;

        // Squash Y by 0.78
        const y3 = y2 * 0.78;

        const posX = cx + x2 * R;
        const posY = cy + y3 * R;

        const scale = 0.82 + ((z2 + 1) / 2) * 0.36; // 0.82 to 1.18
        const opacity = 0.5 + ((z2 + 1) / 2) * 0.5;

        return {
          skill: pt.skill,
          x: Math.round(posX),
          y: Math.round(posY),
          z: z2,
          scale: parseFloat(scale.toFixed(3)),
          opacity: parseFloat(opacity.toFixed(2)),
        };
      });

      updateGlobalOrbit(chips);

      // Scroll progress updates for marquee and scene fade
      if (metrics && frontRef.current) {
        const { enter, exit } = metrics;
        const opacity = Math.min(enter * 1.8, Math.max(0, 1 - exit * 2.4));
        frontRef.current.style.opacity = `${opacity}`;

        if (marqueeInnerRef.current) {
          const shift = (p * 500) % 1000;
          marqueeInnerRef.current.style.transform = `translate3d(-${shift}px, 0, 0)`;
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const marqueeText = Array.from({ length: 6 })
    .map(() => PORTFOLIO_DATA.skills.join('  ✦  '))
    .join('  ✦  ');

  return (
    <div className="section-inner skills-scene">
      <div
        ref={frontRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          pointerEvents: 'none',
          willChange: 'opacity',
        }}
      >
        {/* Title Top Left */}
        <div
          style={{
            position: 'absolute',
            left: '5vw',
            top: '12vh',
            pointerEvents: 'auto',
          }}
          className="mobile-panel"
        >
          <div className="section-label">
            <span className="num">(04)</span> — SYSTEM CAPABILITIES
          </div>

          <h2
            className="font-anton"
            style={{
              fontSize: 'clamp(44px, 5.2vw, 100px)',
              lineHeight: 0.88,
              color: 'var(--ink)',
            }}
          >
            <div>EVERYTHING</div>
            <div style={{ color: 'var(--red)' }}>IN ORBIT.</div>
          </h2>
        </div>

        {/* Marquee Tape at Bottom: 10vh high, rotated -2deg, Anton uppercase */}
        <div
          style={{
            position: 'absolute',
            bottom: '2vh',
            left: '-5vw',
            width: '110vw',
            height: '10vh',
            background: 'var(--red)',
            color: '#ffffff',
            transform: 'rotate(-2deg)',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(255, 31, 31, 0.35)',
            zIndex: 4,
          }}
        >
          <div
            ref={marqueeInnerRef}
            className="font-anton"
            style={{
              whiteSpace: 'nowrap',
              fontSize: 'clamp(28px, 3.2vw, 54px)',
              letterSpacing: '0.04em',
              lineHeight: 1,
              willChange: 'transform',
            }}
          >
            {marqueeText}
          </div>
        </div>
      </div>
    </div>
  );
};

