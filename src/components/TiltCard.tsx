import React, { useRef, useState, useCallback } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // degrees, default 14
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  maxTilt = 14,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
  });

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = x / rect.width;
    const py = y / rect.height;

    const rotX = (0.5 - py) * (maxTilt * 2);
    const rotY = (px - 0.5) * (maxTilt * 2);

    setStyle({
      transform: `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(10px)`,
      glareX: Math.round(px * 100),
      glareY: Math.round(py * 100),
      glareOpacity: 0.45,
    });
  }, [maxTilt]);

  const onMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
      glareX: 50,
      glareY: 50,
      glareOpacity: 0,
    });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`glass-card ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.86)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.85)',
        boxShadow: '0 20px 48px -12px rgba(255, 31, 31, 0.14), 0 2px 12px rgba(13, 13, 13, 0.04)',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.18s cubic-bezier(0.25, 1, 0.5, 1)',
        overflow: 'hidden',
        ...({ transform: style.transform }),
      }}
    >
      {/* Glare overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          borderRadius: 'inherit',
          background: `radial-gradient(circle at ${style.glareX}% ${style.glareY}%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 31, 31, 0.08) 40%, transparent 70%)`,
          opacity: style.glareOpacity,
          transition: 'opacity 0.25s ease',
          zIndex: 2,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
};

