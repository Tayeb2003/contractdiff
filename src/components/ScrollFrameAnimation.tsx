import { useEffect, useRef } from 'react';

const FRAME_COUNT = 182;
const BASE_PATH = '/frames/frame-';

export default function ScrollFrameAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    images: [] as HTMLImageElement[],
    loaded: false,
    dpr: 1,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = stateRef.current;
    const ctx = canvas.getContext('2d')!;
    const container = document.getElementById('hero-track');

    // Preload frames
    let loaded = 0;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      const idx = String(i + 1).padStart(4, '0');
      img.src = `${BASE_PATH}${idx}.jpg`;
      state.images.push(img);

      img.onload = img.onerror = () => {
        loaded++;
        if (loaded >= FRAME_COUNT) {
          state.loaded = true;
          draw(0);
        }
      };
    }

    function draw(idx: number) {
      const img = state.images[idx];
      if (!img || !img.complete || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;

      // Cover behavior: scale to fill, crop excess
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvAspect = w / h;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

      if (imgAspect > canvAspect) {
        sw = img.naturalHeight * canvAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / canvAspect;
        sy = (img.naturalHeight - sh) / 2;
      }

      const dpr = state.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    }

    function update() {
      if (!state.loaded || !container) return;

      const rect = container.getBoundingClientRect();
      const scrollableHeight = rect.height - window.innerHeight;
      const scrolled = Math.max(0, Math.min(scrollableHeight, -rect.top));
      const progress = scrollableHeight > 0 ? scrolled / scrollableHeight : 0;

      const frameIdx = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));
      draw(frameIdx);
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.dpr = dpr;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      update();
    }

    let rafId = 0;
    function onScroll() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    }

    resize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ filter: 'brightness(1.45) contrast(1.1)' }}
    />
  );
}