import { useEffect } from 'react';

interface ScrollVideoHandlerProps {
  targetId: string;
  containerId?: string;
}

export default function ScrollVideoHandler({ targetId, containerId = 'hero-track' }: ScrollVideoHandlerProps) {
  useEffect(() => {
    const video = document.getElementById(targetId) as HTMLVideoElement | null;
    const container = document.getElementById(containerId) ?? null;

    if (!video) return;

    let rafId = 0;

    const update = () => {
      if (!video) return;

      let progress = 0;
      if (container) {
        const rect = container.getBoundingClientRect();
        const scrollableHeight = rect.height - window.innerHeight;
        const scrolled = Math.max(0, Math.min(scrollableHeight, -rect.top));
        progress = scrollableHeight > 0 ? scrolled / scrollableHeight : 0;
      } else {
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        progress = scrollableHeight > 0 ? Math.min(1, scrolled / scrollableHeight) : 0;
      }

      if (video.duration && !isNaN(video.duration)) {
        video.currentTime = progress * video.duration;
      }
    };

    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    const onLoadedMeta = () => update();

    video.addEventListener('loadedmetadata', onLoadedMeta);
    if (video.readyState >= 1) onLoadedMeta();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMeta);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [targetId, containerId]);

  return null;
}