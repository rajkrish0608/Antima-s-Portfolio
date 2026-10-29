# Antima-s-Portfolio

Award-level, scroll-driven interactive personal portfolio built for **Antima**, Full-Stack Developer & DevOps Engineer.

## Tech Stack & Architecture

- **Core**: React 18, TypeScript, Vite
- **Scroll Engine**: Lenis smooth scroll synchronized via `gsap.ticker` with `lagSmoothing(0)`
- **3D & Rendering**: Native CSS 3D transforms (zero Three.js dependency)
- **Canvas Stage**: Fixed full-viewport canvas with DPR capping, fractional frame blending, and diagonal blade transitions
- **Typography**: Anton, Inter Tight Variable, JetBrains Mono
- **Visual Matting**: Dual-model segmentation (`u2net_human_seg` & `isnet-general-use`), custom edge defringing, alpha erosion, and virtual space bounding-box cropping

## Key Sections

1. **(00) Hello / Hero**: Magazine layout with giant back-layer Anton typography, 3D intro staggered text, and dynamic scroll highlighter.
2. **(01) About Me**: Soft radial lighting, word-by-word reveal manifesto, and 3 glass stat cards with 3D tilt and rolling mechanical odometers.
3. **(02) Selected Works**: Perspective grid floor rotated `rotateX(68deg)` with interactive 3D cards and live reactive product dashboards (Solar ERP & Suncity, AI Caller System, LMS & Virtual Suite).
4. **(03) Experience & Education**: Giant outline year milestone in the back layer with an interactive career and education timeline.
5. **(04) System Capabilities**: True 3D Fibonacci sphere orbit splitting behind and in front of Antima, paired with an angled red ticker ribbon.
6. **(05) Credentials & Benchmarks**: 4 benchmark metrics and a 3D rotating cylinder of certification badges.
7. **(06) Contact**: Vibrant red backdrop with white Anton display typography, subject turning back to face the viewer, one-click email copy toast, and stacked links.

## Getting Started

### Development
```bash
npm install
npm run dev
```

### Production Build & Preview
```bash
npm run build
npm run preview
```
