import React, { useEffect, useRef } from 'react';
import { director, SceneDef, TransitionState } from '../engine/director';
import { frameLoader, LoadedFrameInfo } from '../engine/frames';

export const Stage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });
  const lastKeyRef = useRef<string>('');
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    // Mouse listener for parallax (±14px, lerp 0.06)
    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseRef.current.x = nx * 14;
      mouseRef.current.y = ny * 14;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Lerp mouse parallax (0.06)
      mouseRef.current.currentX += (mouseRef.current.x - mouseRef.current.currentX) * 0.06;
      mouseRef.current.currentY += (mouseRef.current.y - mouseRef.current.currentY) * 0.06;

      const state = director.getState();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const loadedCount = frameLoader.getLoadedCount();

      // DPR capped at 2
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      if (canvas.width !== Math.round(vw * dpr) || canvas.height !== Math.round(vh * dpr)) {
        canvas.width = Math.round(vw * dpr);
        canvas.height = Math.round(vh * dpr);
        canvas.style.width = `${vw}px`;
        canvas.style.height = `${vh}px`;
      }

      // Input key string
      const transitionKey = state.transition
        ? `${state.transition.fromScene.id}_${state.transition.toScene.id}_${state.transition.t.toFixed(3)}`
        : 'none';
      const key = `${state.frame.toFixed(2)}_${transitionKey}_${mouseRef.current.currentX.toFixed(1)}_${loadedCount}_${vw}x${vh}`;

      if (key !== lastKeyRef.current) {
        lastKeyRef.current = key;
        frameLoader.warm(
          state.transition
            ? [state.transition.outgoingFrame, state.transition.incomingFrame]
            : [state.frame]
        );

        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, vw, vh);

        const isMobile = vw < 820;

        // Helper to draw a single or fractional frame for a scene
        const drawSceneFrame = (
          frameVal: number,
          sceneDef: SceneDef,
          shiftX = 0,
          alphaMultiplier = 1.0
        ) => {
          const frameInfo = frameLoader.getFrame(frameVal);
          if (!frameInfo) return;

          const { shot } = frameInfo;
          // Fit the person, not the props around her, so the desk doesn't shrink her on mobile
          const boxWidth = shot.pw ?? shot.box[2];

          let scale: number;
          let effectiveX: number;

          if (isMobile) {
            effectiveX = 0.5;
            scale = Math.min((vh * 0.74) / 900, (vw * 1.05) / boxWidth);
          } else {
            effectiveX = sceneDef.x;
            scale = (vh * sceneDef.k) / 900;
          }

          const offY = vh - 900 * scale;
          const offX =
            effectiveX * vw - shot.cx * 1600 * scale + mouseRef.current.currentX + shiftX;

          const dx = offX + shot.box[0] * scale;
          const dy = offY + shot.box[1] * scale;
          const dw = shot.box[2] * scale;
          const dh = shot.box[3] * scale;

          // Fractional blending within same shot
          const baseF = Math.floor(frameVal);
          const frac = frameVal - baseF;

          ctx.save();
          ctx.globalAlpha = alphaMultiplier;
          ctx.drawImage(frameInfo.img, dx, dy, dw, dh);

          if (frac > 0.01 && baseF + 1 <= shot.to) {
            const nextInfo = frameLoader.getFrame(baseF + 1);
            if (nextInfo && nextInfo.img) {
              ctx.globalAlpha = alphaMultiplier * frac;
              ctx.drawImage(nextInfo.img, dx, dy, dw, dh);
            }
          }
          ctx.restore();
        };

        if (state.transition && state.transition.isTransitioning) {
          const { t, fromScene, toScene, outgoingFrame, incomingFrame } = state.transition;
          const skew = 0.2 * vh;
          const e = -skew + (vw + 2 * skew) * t;

          // 1. Outgoing shot:
          // Clip to polygon right of line (e+skew, 0) to (e-skew, vh)
          // Draw at alpha 1 - 0.35t, shifted +60t px
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(e + skew, 0);
          ctx.lineTo(vw + 100, 0);
          ctx.lineTo(vw + 100, vh + 100);
          ctx.lineTo(e - skew, vh + 100);
          ctx.closePath();
          ctx.clip();

          drawSceneFrame(outgoingFrame, fromScene, 60 * t, 1 - 0.35 * t);
          ctx.restore();

          // 2. Incoming shot:
          // Clip to polygon left of line (e+skew, 0) to (e-skew, vh)
          // Draw shifted -60(1-t) px
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(-100, -100);
          ctx.lineTo(e + skew, -100);
          ctx.lineTo(e - skew, vh + 100);
          ctx.lineTo(-100, vh + 100);
          ctx.closePath();
          ctx.clip();

          drawSceneFrame(incomingFrame, toScene, -60 * (1 - t), 1.0);
          ctx.restore();

          // 3. Blade transition line & glow:
          // "Draw the blade as a 3px red line (white when entering Contact) with a 24px glow and a 90px gradient trail."
          const isEnteringContact = toScene.id === 'contact';
          const bladeColor = isEnteringContact ? '#ffffff' : '#ff1f1f';

          // 90px gradient trail behind the blade
          ctx.save();
          const trailGradient = ctx.createLinearGradient(e + skew - 90, 0, e + skew, 0);
          if (isEnteringContact) {
            trailGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            trailGradient.addColorStop(1, 'rgba(255, 255, 255, 0.28)');
          } else {
            trailGradient.addColorStop(0, 'rgba(255, 31, 31, 0)');
            trailGradient.addColorStop(1, 'rgba(255, 31, 31, 0.28)');
          }
          ctx.fillStyle = trailGradient;
          ctx.beginPath();
          ctx.moveTo(e + skew - 90, 0);
          ctx.lineTo(e + skew, 0);
          ctx.lineTo(e - skew, vh);
          ctx.lineTo(e - skew - 90, vh);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // 3px blade line with 24px glow
          ctx.save();
          ctx.strokeStyle = bladeColor;
          ctx.lineWidth = 3;
          ctx.shadowColor = bladeColor;
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.moveTo(e + skew, 0);
          ctx.lineTo(e - skew, vh);
          ctx.stroke();
          ctx.restore();
        } else {
          // Standard single scene drawing
          drawSceneFrame(state.frame, state.activeScene);
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="stage-canvas" />;
};

