export interface ManifestShot {
  from: number;
  to: number;
  box: [number, number, number, number];
  cx: number;
  pw?: number; // person-only width, when the box also holds props (laptop, desk)
}

export interface Manifest {
  w: number;
  h: number;
  count: number;
  shots: ManifestShot[];
}

export interface LoadedFrameInfo {
  img: HTMLImageElement | ImageBitmap;
  shot: ManifestShot;
  shotIndex: number;
  frameIndex: number;
}

function img_url(small: boolean, frameIndex: number): string {
  return `./frames/${small ? 'sm' : 'lg'}/f${String(frameIndex).padStart(3, '0')}.webp`;
}

export type FrameLoadListener = (loadedCount: number, totalCount: number, readyRatio: number) => void;

class FrameLoader {
  private manifest: Manifest | null = null;
  private images = new Map<number, HTMLImageElement>();
  // Pre-decoded frames near the playhead. Drawing an <img> makes Chrome decode
  // the WebP inside the frame (~12ms each); a bitmap is already decoded. All 240
  // would be ~700MB, so only a window around the current frame is kept.
  private bitmaps = new Map<number, ImageBitmap>();
  private pendingBitmaps = new Set<number>();
  private loadedCount = 0;
  private totalCount = 240;
  private isSmall = false;
  private listeners = new Set<FrameLoadListener>();
  private initialReady = false;
  private initialQuarter = 60; // 240 / 4

  public async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    this.isSmall = window.innerWidth < 820;

    try {
      const res = await fetch('./frames/manifest.json');
      this.manifest = await res.json();
      if (this.manifest) {
        this.totalCount = this.manifest.count;
        this.initialQuarter = Math.ceil(this.totalCount / 4);
      }
    } catch (err) {
      console.warn('Failed to load manifest.json, using defaults', err);
      this.manifest = {
        w: 1600,
        h: 900,
        count: 240,
        shots: [
          { from: 0, to: 59, box: [471, 112, 666, 788], cx: 0.5023 },
          { from: 60, to: 115, box: [439, 130, 710, 770], cx: 0.5007 },
          { from: 116, to: 175, box: [220, 143, 922, 696], cx: 0.5164 },
          { from: 176, to: 239, box: [462, 22, 668, 878], cx: 0.4915 },
        ],
      };
    }

    this.startLoading();
  }

  public getManifest(): Manifest | null {
    return this.manifest;
  }

  public getLoadedCount(): number {
    return this.loadedCount;
  }

  public isReady(): boolean {
    return this.initialReady;
  }

  public onProgress(fn: FrameLoadListener): () => void {
    this.listeners.add(fn);
    fn(this.loadedCount, this.totalCount, Math.min(1, this.loadedCount / this.initialQuarter));
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    const readyRatio = Math.min(1, this.loadedCount / this.initialQuarter);
    for (const fn of this.listeners) {
      fn(this.loadedCount, this.totalCount, readyRatio);
    }
  }

  private buildLoadSequence(): number[] {
    const seq: number[] = [];
    const added = new Set<number>();

    const add = (f: number) => {
      if (f >= 0 && f < this.totalCount && !added.has(f)) {
        added.add(f);
        seq.push(f);
      }
    };

    // 1. Shot boundaries first
    if (this.manifest) {
      for (const shot of this.manifest.shots) {
        add(shot.from);
        add(shot.to);
      }
    } else {
      add(0);
      add(59);
      add(60);
      add(115);
      add(116);
      add(175);
      add(176);
      add(239);
    }

    // 2. Stride 8 -> 4 -> 2 -> 1
    for (const stride of [8, 4, 2, 1]) {
      for (let i = 0; i < this.totalCount; i += stride) {
        add(i);
      }
    }

    return seq;
  }

  private async loadFrame(frameIndex: number): Promise<void> {
    const img = new Image();
    img.src = img_url(this.isSmall, frameIndex);

    try {
      if (img.decode) {
        await img.decode();
      } else {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      }
      this.images.set(frameIndex, img);
      this.loadedCount++;
      if (this.loadedCount >= this.initialQuarter && !this.initialReady) {
        this.initialReady = true;
      }
      this.notify();
    } catch {
      // Still mark progress so preloader doesn't stall if one fails
      this.loadedCount++;
      this.notify();
    }
  }

  private async startLoading() {
    const seq = this.buildLoadSequence();
    const concurrency = 6;
    let idx = 0;

    const worker = async () => {
      while (idx < seq.length) {
        const fi = seq[idx++];
        await this.loadFrame(fi);
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);
  }

  /** Decode frames around each playhead off the main thread; free the rest. */
  public warm(centers: number[]) {
    if (typeof createImageBitmap === 'undefined') return;
    const WARM = 10;
    const KEEP = 20;
    const cs = centers.map((c) => Math.round(c));

    for (const c of cs) {
      for (let d = -WARM; d <= WARM; d++) {
        const f = c + d;
        if (this.bitmaps.has(f) || this.pendingBitmaps.has(f)) continue;
        if (!this.images.has(f)) continue;
        this.pendingBitmaps.add(f);
        // From an <img>, Chrome decodes on the main thread; from a Blob it
        // decodes on a worker. The file is already in the HTTP cache.
        fetch(img_url(this.isSmall, f))
          .then((res) => res.blob())
          .then((blob) => createImageBitmap(blob))
          .then((bmp) => {
            // the playhead may have moved on while this decoded
            if (cs.some((c) => Math.abs(f - c) <= KEEP)) this.bitmaps.set(f, bmp);
            else bmp.close();
          })
          .catch(() => {})
          .finally(() => this.pendingBitmaps.delete(f));
      }
    }

    for (const [f, bmp] of this.bitmaps) {
      if (cs.every((c) => Math.abs(f - c) > KEEP)) {
        bmp.close();
        this.bitmaps.delete(f);
      }
    }
  }

  private source(f: number): HTMLImageElement | ImageBitmap {
    return this.bitmaps.get(f) ?? this.images.get(f)!;
  }

  public getShotForFrame(frameIndex: number): { shot: ManifestShot; shotIndex: number } | null {
    if (!this.manifest) return null;
    const fi = Math.round(frameIndex);
    for (let i = 0; i < this.manifest.shots.length; i++) {
      const sh = this.manifest.shots[i];
      if (fi >= sh.from && fi <= sh.to) {
        return { shot: sh, shotIndex: i };
      }
    }
    // Fallback: clamp to nearest shot
    if (fi < this.manifest.shots[0].from) {
      return { shot: this.manifest.shots[0], shotIndex: 0 };
    }
    const last = this.manifest.shots.length - 1;
    return { shot: this.manifest.shots[last], shotIndex: last };
  }

  public getFrame(targetFrame: number): LoadedFrameInfo | null {
    const shotInfo = this.getShotForFrame(targetFrame);
    if (!shotInfo) return null;
    const { shot, shotIndex } = shotInfo;

    const fi = Math.round(targetFrame);

    // If frame is loaded, return it
    if (this.images.has(fi)) {
      return {
        img: this.source(fi),
        shot,
        shotIndex,
        frameIndex: fi,
      };
    }

    // "A missing frame must fall back to the nearest loaded frame in the same shot."
    let bestDist = Infinity;
    let bestFi = -1;

    for (let f = shot.from; f <= shot.to; f++) {
      if (this.images.has(f)) {
        const d = Math.abs(f - fi);
        if (d < bestDist) {
          bestDist = d;
          bestFi = f;
        }
      }
    }

    if (bestFi !== -1) {
      return {
        img: this.source(bestFi),
        shot,
        shotIndex,
        frameIndex: bestFi,
      };
    }

    // If no frame in same shot is loaded yet, check ANY loaded frame
    for (const [loadedIdx, img] of this.images.entries()) {
      return {
        img,
        shot,
        shotIndex,
        frameIndex: loadedIdx,
      };
    }

    return null;
  }
}

export const frameLoader = new FrameLoader();

