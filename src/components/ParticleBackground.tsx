import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface State {
  particles: Particle[];
  w: number;
  h: number;
  count: number;
  linkDist: number;
  baseHue: string;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    const state: State = {
      particles: [],
      w: 0,
      h: 0,
      count: window.matchMedia('(max-width: 768px)').matches ? 28 : 70,
      linkDist: window.matchMedia('(max-width: 768px)').matches ? 100 : 140,
      baseHue: '227, 195, 129',
    };

    const spawnParticle = (initial = false): Particle => ({
      x: initial ? rand(0, state.w) : (Math.random() < 0.5 ? 0 : state.w),
      y: rand(0, state.h),
      vx: rand(-0.22, 0.22),
      vy: rand(-0.22, 0.22),
      r: rand(1.2, 2.6),
    });

    const init = () => {
      state.particles = Array.from({ length: state.count }, () => spawnParticle(true));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = window.innerWidth;
      state.h = window.innerHeight;
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      canvasEl.width = Math.floor(state.w * dpr);
      canvasEl.height = Math.floor(state.h * dpr);
      canvasEl.style.width = `${state.w}px`;
      canvasEl.style.height = `${state.h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init();
    };

    const draw = () => {
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, state.w, state.h);

      // draw links (static - no animation)
      for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i];
        for (let j = i + 1; j < state.particles.length; j++) {
          const q = state.particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < state.linkDist) {
            const alpha = (1 - d / state.linkDist) * 0.32;
            ctx.strokeStyle = `rgba(227, 195, 129, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      // draw dots
      ctx.fillStyle = 'rgba(227, 195, 129, 0.85)';
      ctx.shadowColor = 'rgba(227, 195, 129, 0.7)';
      ctx.shadowBlur = 10;
      for (const p of state.particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    const canvasEl = canvasRef.current;
    if (canvasEl) {
      resize();
      draw();
    }

    const onResize = () => {
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = window.innerWidth;
      state.h = window.innerHeight;
      canvasEl.width = Math.floor(state.w * (window.devicePixelRatio || 1));
      canvasEl.height = Math.floor(state.h * (window.devicePixelRatio || 1));
      canvasEl.style.width = `${state.w}px`;
      canvasEl.style.height = `${state.h}px`;
      const ctx = canvasEl.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init();
      draw();
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}