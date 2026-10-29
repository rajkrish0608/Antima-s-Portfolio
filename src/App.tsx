import React, { useEffect, useRef } from 'react';
import { SCENES, director } from './engine/director';
import { frameLoader } from './engine/frames';

// Components
import { Stage } from './components/Stage';
import { Chrome } from './components/Chrome';

// Scenes Front & Back
import { Hero, HeroBack } from './scenes/Hero';
import { About, AboutBack } from './scenes/About';
import { Work, WorkBack } from './scenes/Work';
import { Journey, JourneyBack } from './scenes/Journey';
import { Skills, SkillsBack, SkillsFront } from './scenes/Skills';
import { Awards } from './scenes/Awards';
import { Contact, ContactBack } from './scenes/Contact';

export const App: React.FC = () => {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    // 1. Initialize frameLoader and director
    frameLoader.init();
    director.init();

    // Register section elements with director
    sectionRefs.current.forEach((el, idx) => {
      director.registerSection(idx, el);
    });

    // Re-measure after initial layout
    setTimeout(() => {
      director.measureSections();
    }, 200);
  }, []);

  return (
    <div className="portfolio-root" style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      {/* ────────────────── z0: FIXED .layer-back ────────────────── */}
      <div className="layer-back">
        <HeroBack />
        <AboutBack />
        <WorkBack />
        <JourneyBack />
        <SkillsBack />
        <ContactBack />
      </div>

      {/* ────────────────── z1: STAGE CANVAS ────────────────── */}
      <Stage />

      {/* ────────────────── z2: FIXED .layer-front ────────────────── */}
      <div className="layer-front">
        <SkillsFront />
      </div>

      {/* ────────────────── z3: <main> CONTAINING SECTIONS ────────────────── */}
      <main className="sections-container">
        {/* HERO: 230vh */}
        <section
          ref={(el) => (sectionRefs.current[0] = el)}
          id="hero"
          className="section-wrapper"
          style={{ height: `${SCENES[0].heightVh}vh` }}
        >
          <div className="section-sticky">
            <Hero />
          </div>
        </section>

        {/* ABOUT: 280vh */}
        <section
          ref={(el) => (sectionRefs.current[1] = el)}
          id="about"
          className="section-wrapper"
          style={{ height: `${SCENES[1].heightVh}vh` }}
        >
          <div className="section-sticky">
            <About />
          </div>
        </section>

        {/* WORK: 460vh */}
        <section
          ref={(el) => (sectionRefs.current[2] = el)}
          id="work"
          className="section-wrapper"
          style={{ height: `${SCENES[2].heightVh}vh` }}
        >
          <div className="section-sticky">
            <Work />
          </div>
        </section>

        {/* JOURNEY: 240vh */}
        <section
          ref={(el) => (sectionRefs.current[3] = el)}
          id="journey"
          className="section-wrapper"
          style={{ height: `${SCENES[3].heightVh}vh` }}
        >
          <div className="section-sticky">
            <Journey />
          </div>
        </section>

        {/* SKILLS / TOOLKIT: 280vh */}
        <section
          ref={(el) => (sectionRefs.current[4] = el)}
          id="skills"
          className="section-wrapper"
          style={{ height: `${SCENES[4].heightVh}vh` }}
        >
          <div className="section-sticky">
            <Skills />
          </div>
        </section>

        {/* AWARDS: 320vh */}
        <section
          ref={(el) => (sectionRefs.current[5] = el)}
          id="awards"
          className="section-wrapper"
          style={{ height: `${SCENES[5].heightVh}vh` }}
        >
          <div className="section-sticky">
            <Awards />
          </div>
        </section>

        {/* CONTACT: 240vh */}
        <section
          ref={(el) => (sectionRefs.current[6] = el)}
          id="contact"
          className="section-wrapper"
          style={{ height: `${SCENES[6].heightVh}vh` }}
        >
          <div className="section-sticky">
            <Contact />
          </div>
        </section>
      </main>

      {/* ────────────────── z50 & z90+: CHROME (HUD, CURSOR, PRELOADER) ────────────────── */}
      <Chrome />
    </div>
  );
};
export default App;

