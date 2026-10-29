import React, { useMemo } from 'react';

interface OdometerProps {
  value: number | string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  digitClassName?: string;
  height?: number; // px
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export const Odometer: React.FC<OdometerProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  digitClassName = '',
  height = 48,
}) => {
  const numStr = useMemo(() => {
    if (typeof value === 'number') {
      return value.toFixed(decimals);
    }
    return String(value);
  }, [value, decimals]);

  const chars = useMemo(() => numStr.split(''), [numStr]);

  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      style={{ height: `${height}px`, overflow: 'hidden', lineHeight: `${height}px` }}
    >
      {prefix && <span className="mr-0.5">{prefix}</span>}
      {chars.map((char, idx) => {
        const isDigit = !isNaN(parseInt(char, 10));
        if (!isDigit) {
          return (
            <span key={idx} style={{ height: `${height}px` }}>
              {char}
            </span>
          );
        }

        const digitVal = parseInt(char, 10);
        const translateY = -(digitVal * height);

        return (
          <div
            key={idx}
            style={{
              height: `${height}px`,
              width: `${height * 0.58}px`,
              overflow: 'hidden',
              position: 'relative',
              display: 'inline-block',
            }}
          >
            <div
              style={{
                transform: `translate3d(0, ${translateY}px, 0)`,
                transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {DIGITS.map((d, dIdx) => (
                <div
                  key={dIdx}
                  className={digitClassName}
                  style={{
                    height: `${height}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </div>
  );
};

