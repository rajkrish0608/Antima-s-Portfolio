import { useEffect, useRef, useState } from 'react';
import { director, ScrollDirectorState, ScrollSubscriber } from './director';

/**
 * Subscribe a callback to scroll engine updates.
 * Will run on every tick WITHOUT causing React re-renders in the parent.
 */
export function useScrollDirector(callback: ScrollSubscriber): void {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    return director.subscribe((state) => {
      cbRef.current(state);
    });
  }, []);
}

/**
 * Hook for smooth mouse parallax and tracking
 */
export function useMouseParallax(strength = 14) {
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseRef.current.targetX = nx * strength;
      mouseRef.current.targetY = ny * strength;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [strength]);

  return mouseRef;
}

/**
 * Hook to read initial director state safely
 */
export function useDirectorState(): ScrollDirectorState {
  const [state, setState] = useState<ScrollDirectorState>(() => director.getState());

  useEffect(() => {
    return director.subscribe((s) => {
      // Only set state when active scene changes or on initial mount to avoid scroll re-renders
      setState((prev) => {
        if (prev.activeSceneIndex !== s.activeSceneIndex) {
          return { ...s };
        }
        return prev;
      });
    });
  }, []);

  return state;
}

