import Lenis from 'lenis';
import gsap from 'gsap';

export interface SceneDef {
  id: string;
  from: number;
  to: number;
  x: number;
  k: number;
  label: string;
  heightVh: number;
}

export const SCENES: SceneDef[] = [
  { id: 'hero', from: 0, to: 65, x: 0.70, k: 1.0, label: 'Hello', heightVh: 230 },
  { id: 'about', from: 66, to: 119, x: 0.27, k: 1.0, label: 'About', heightVh: 280 },
  { id: 'work', from: 120, to: 179, x: 0.82, k: 0.8, label: 'Work', heightVh: 460 },
  { id: 'journey', from: 180, to: 215, x: 0.26, k: 1.0, label: 'Journey', heightVh: 240 },
  { id: 'skills', from: 216, to: 231, x: 0.50, k: 0.98, label: 'Toolkit', heightVh: 280 },
  { id: 'awards', from: 232, to: 238, x: 0.75, k: 1.0, label: 'Awards', heightVh: 320 },
  { id: 'contact', from: 65, to: 0, x: 0.50, k: 1.0, label: 'Contact', heightVh: 240 },
];

export interface SceneMetrics {
  enter: number;
  p: number;
  exit: number;
  vis: number;
  top: number;
  height: number;
}

export interface TransitionState {
  isTransitioning: boolean;
  fromScene: SceneDef;
  toScene: SceneDef;
  t: number;
  outgoingFrame: number;
  incomingFrame: number;
}

export interface ScrollDirectorState {
  y: number;
  progress: number;
  activeSceneIndex: number;
  activeScene: SceneDef;
  frame: number;
  scenes: Record<string, SceneMetrics>;
  transition: TransitionState | null;
  vw: number;
  vh: number;
}

export type ScrollSubscriber = (state: ScrollDirectorState) => void;

function clamp(val: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, val));
}

function easeInOutSine(x: number): number {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

class Director {
  private lenis: Lenis | null = null;
  private subscribers = new Set<ScrollSubscriber>();
  private sectionElements: HTMLElement[] = [];
  private sectionBounds: { top: number; height: number }[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private currentY = 0;
  private maxScroll = 1;
  private isPreloaded = false;

  private state: ScrollDirectorState = {
    y: 0,
    progress: 0,
    activeSceneIndex: 0,
    activeScene: SCENES[0],
    frame: 0,
    scenes: {},
    transition: null,
    vw: typeof window !== 'undefined' ? window.innerWidth : 1600,
    vh: typeof window !== 'undefined' ? window.innerHeight : 900,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual';
    }
  }

  public init() {
    if (typeof window === 'undefined') return;

    // 1. Lenis setup
    this.lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1.2,
      touchMultiplier: 1.7,
    });

    this.lenis.stop(); // kept stopped until preloader finishes

    // 2. Drive Lenis with gsap.ticker and lagSmoothing(0)
    gsap.ticker.lagSmoothing(0);
    gsap.ticker.add((time: number) => {
      this.lenis?.raf(time * 1000);
    });

    this.lenis.on('scroll', (e: { scroll: number }) => {
      this.currentY = e.scroll;
      this.updateState();
    });

    // 3. ResizeObserver & measurements
    this.measureSections();
    this.resizeObserver = new ResizeObserver(() => {
      this.measureSections();
      this.updateState();
    });
    this.resizeObserver.observe(document.body);

    // Lenis already reports native scrolls (scrollbar, keyboard) through its own
    // 'scroll' event; a second window listener would run every subscriber twice
    window.addEventListener('resize', this.onResize, { passive: true });

    (window as any).__director = this;
    (window as any).__lenis = this.lenis;

    // Initial update
    this.updateState();
  }

  private onResize = () => {
    this.state.vw = window.innerWidth;
    this.state.vh = window.innerHeight;
    this.measureSections();
    this.updateState();
  };

  public setScroll(y: number) {
    this.currentY = y;
    if (this.lenis) {
      this.lenis.scrollTo(y, { immediate: true });
    } else {
      window.scrollTo(0, y);
    }
    this.updateState();
  }

  public registerSection(index: number, el: HTMLElement | null) {
    if (!el) return;
    this.sectionElements[index] = el;
    this.measureSections();
  }

  public measureSections() {
    if (typeof window === 'undefined') return;
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    this.state.vh = vh;
    this.state.vw = vw;

    this.sectionBounds = SCENES.map((_, i) => {
      const el = this.sectionElements[i];
      if (el) {
        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        return { top, height: el.offsetHeight };
      }
      return { top: 0, height: vh * (SCENES[i].heightVh / 100) };
    });

    const docHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    this.maxScroll = Math.max(1, docHeight - vh);
  }

  public start() {
    this.isPreloaded = true;
    if (this.lenis) {
      this.lenis.start();
    }
    this.measureSections();
    this.updateState();
  }

  public scrollToScene(index: number) {
    if (!this.lenis || index < 0 || index >= SCENES.length) return;
    const bounds = this.sectionBounds[index];
    if (bounds) {
      this.lenis.scrollTo(bounds.top + 2, {
        duration: 2.2,
        easing: (x: number) => 1 - Math.pow(1 - x, 4), // easeOutQuart
      });
    }
  }

  public scrollToTop() {
    if (!this.lenis) return;
    this.lenis.scrollTo(0, {
      duration: 2.2,
      easing: (x: number) => 1 - Math.pow(1 - x, 4),
    });
  }

  public subscribe(fn: ScrollSubscriber): () => void {
    this.subscribers.add(fn);
    fn(this.state);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  public getState(): ScrollDirectorState {
    return this.state;
  }

  private updateState() {
    const y = this.currentY;
    const vh = this.state.vh || (typeof window !== 'undefined' ? window.innerHeight : 900);
    const vw = this.state.vw || (typeof window !== 'undefined' ? window.innerWidth : 1600);

    const progress = clamp(y / this.maxScroll);

    // Compute metrics for each scene
    const scenesMetrics: Record<string, SceneMetrics> = {};
    for (let i = 0; i < SCENES.length; i++) {
      const sc = SCENES[i];
      const bounds = this.sectionBounds[i] || { top: 0, height: vh * (sc.heightVh / 100) };
      const top = bounds.top;
      const h = bounds.height;

      const enter = clamp((y - (top - vh)) / vh);
      const p = clamp((y - top) / Math.max(1, h - vh));
      const exit = clamp((y - (top + h - vh)) / vh);
      const vis = clamp(Math.min(enter * 1.6, 1 - exit * 2.2));

      scenesMetrics[sc.id] = { enter, p, exit, vis, top, height: h };
    }

    // Frame selection
    // lead = 0.78vh and span = 0.62vh
    const lead = 0.78 * vh;
    const span = 0.62 * vh;

    // The active scene is the last one where y >= top - lead
    let activeIndex = 0;
    for (let i = 0; i < SCENES.length; i++) {
      const top = this.sectionBounds[i]?.top ?? 0;
      if (y >= top - lead) {
        activeIndex = i;
      }
    }

    const activeScene = SCENES[activeIndex];
    const activeMetrics = scenesMetrics[activeScene.id];
    const sceneP = activeMetrics ? activeMetrics.p : 0;
    const exactFrame = activeScene.from + (activeScene.to - activeScene.from) * sceneP;

    // Check blade transition between activeScene and adjacent scene
    let transition: TransitionState | null = null;
    if (activeIndex > 0) {
      const prevScene = SCENES[activeIndex - 1];
      const currentTop = this.sectionBounds[activeIndex]?.top ?? 0;
      const transProgress = clamp((y - (currentTop - lead)) / span);

      if (transProgress > 0 && transProgress < 1) {
        const t = easeInOutSine(transProgress);
        transition = {
          isTransitioning: true,
          fromScene: prevScene,
          toScene: activeScene,
          t,
          outgoingFrame: prevScene.to,
          incomingFrame: activeScene.from,
        };
      }
    }

    this.state = {
      y,
      progress,
      activeSceneIndex: activeIndex,
      activeScene,
      frame: exactFrame,
      scenes: scenesMetrics,
      transition,
      vw,
      vh,
    };

    // Notify subscribers
    for (const sub of this.subscribers) {
      sub(this.state);
    }
  }
}

export const director = new Director();
