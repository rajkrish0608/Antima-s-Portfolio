import React, { useEffect, useRef, useState } from 'react';
import { PORTFOLIO_DATA } from '../data';
import { director } from '../engine/director';

export const ContactBack: React.FC = () => {
  const redBgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = director.subscribe((state) => {
      const metrics = state.scenes['contact'];
      if (!metrics || !redBgRef.current) return;

      const { enter } = metrics;
      const vh = state.vh;
      const vw = state.vw;

      // Check if transitioning into Contact
      const trans = state.transition;
      const isEnteringContact = trans && trans.toScene.id === 'contact';

      if (isEnteringContact) {
        redBgRef.current.style.display = 'block';
        const t = trans.t;
        const skew = 0.2 * vh;
        const e = -skew + (vw + 2 * skew) * t;

        // Clip path matching canvas blade transition
        redBgRef.current.style.clipPath = `polygon(0 0, ${e + skew}px 0, ${e - skew}px 100%, 0 100%)`;
      } else if (state.activeScene.id === 'contact') {
        redBgRef.current.style.display = 'block';
        redBgRef.current.style.clipPath = 'none';
      } else {
        redBgRef.current.style.display = 'none';
      }

      // Giant white "LET'S TALK" fades and rises on enter
      if (titleRef.current) {
        const titleOp = Math.min(1, enter * 1.5);
        const titleY = (1 - titleOp) * 40;
        titleRef.current.style.opacity = `${titleOp}`;
        titleRef.current.style.transform = `translate3d(-50%, ${titleY}px, 0)`;
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div
      ref={redBgRef}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'var(--red)',
        display: 'none',
        zIndex: 0,
        willChange: 'clip-path',
      }}
    >
      {/* Giant white "LET'S / TALK" centered at top: 10vh behind person */}
      <div
        ref={titleRef}
        className="font-anton contact-giant-title"
        style={{
          position: 'absolute',
          top: '10vh',
          left: '50%',
          transform: 'translate3d(-50%, 0, 0)',
          fontSize: 'min(36vh, 26vw)',
          lineHeight: 0.84,
          color: '#ffffff',
          textAlign: 'center',
          userSelect: 'none',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          willChange: 'transform, opacity',
        }}
      >
        <div>LET'S</div>
        <div>TALK</div>
      </div>
    </div>
  );
};

export const Contact: React.FC = () => {
  const frontRef = useRef<HTMLDivElement>(null);
  const [emailHovered, setEmailHovered] = useState(false);

  useEffect(() => {
    const unsubscribe = director.subscribe((state) => {
      const metrics = state.scenes['contact'];
      if (!metrics || !frontRef.current) return;

      const { enter, exit } = metrics;
      const opacity = Math.min(enter * 1.8, Math.max(0, 1 - exit * 2.4));
      frontRef.current.style.opacity = `${opacity}`;
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="section-inner contact-scene">
      <div
        ref={frontRef}
        style={{
          position: 'absolute',
          inset: 0,
          padding: '8vh 5vw 4vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          zIndex: 3,
          color: '#ffffff',
          willChange: 'opacity',
        }}
      >
        {/* Main Content Row: Bottom-Left Email & Bottom-Right Links */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '32px',
            marginBottom: '6vh',
          }}
          className="contact-main-row"
        >
          {/* Bottom-Left Email */}
          <div style={{ maxWidth: '640px' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.75)',
                marginBottom: '12px',
              }}
            >
              START A CONVERSATION
            </div>

            <a
              href={`mailto:${PORTFOLIO_DATA.contact.fullEmail}`}
              onMouseEnter={() => setEmailHovered(true)}
              onMouseLeave={() => setEmailHovered(false)}
              data-cursor="WRITE"
              className="font-anton contact-email-link"
              style={{
                display: 'inline-block',
                fontSize: 'clamp(34px, 3.7vw, 74px)',
                lineHeight: 0.92,
                color: '#ffffff',
                textDecoration: 'none',
                position: 'relative',
              }}
            >
              <div>{PORTFOLIO_DATA.contact.emailUser}</div>
              <div className="contact-email-domain" style={{ color: 'var(--ink)' }}>
                {PORTFOLIO_DATA.contact.emailDomain}
              </div>

              {/* White underline wipes on hover */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: 0,
                  height: '3px',
                  backgroundColor: '#ffffff',
                  width: emailHovered ? '100%' : '0%',
                  transition: 'width 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
                }}
              />
            </a>
          </div>

          {/* Bottom-Right Stacked Links */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minWidth: '240px',
            }}
          >
            {[
              { label: 'GitHub', href: PORTFOLIO_DATA.contact.github, cursor: 'OPEN' },
              { label: 'LinkedIn', href: PORTFOLIO_DATA.contact.linkedin, cursor: 'OPEN' },
              { label: 'Résumé', href: PORTFOLIO_DATA.contact.resumeUrl, cursor: 'PDF', download: true },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.download ? '_self' : '_blank'}
                rel="noreferrer"
                download={link.download ? 'Antima_Resume.pdf' : undefined}
                data-cursor={link.cursor}
                className="contact-link-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  transition: 'color 0.2s ease',
                }}
              >
                <span>{link.label}</span>
                <span
                  className="contact-arrow-icon"
                  style={{
                    fontSize: '18px',
                    transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                  }}
                >
                  ↗
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Footer: © year and full name, and "Back to top ↑". No phone number. */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.04em',
            color: 'rgba(255, 255, 255, 0.75)',
          }}
        >
          <div>
            © {PORTFOLIO_DATA.contact.copyrightYear} {PORTFOLIO_DATA.name.full}. ALL RIGHTS RESERVED.
          </div>

          <button
            onClick={() => director.scrollToTop()}
            data-cursor="TOP"
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </div>
  );
};

