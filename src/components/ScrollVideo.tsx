import { useEffect, useRef, useState } from 'react';

interface ScrollVideoProps {
  src: string;
  scrollHeight?: string;
}

export default function ScrollVideo({ src, scrollHeight = '300vh' }: ScrollVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    let rafId = 0;

    const updateVideoTime = () => {
      const rect = container.getBoundingClientRect();
      const scrollableHeight = rect.height - window.innerHeight;
      const scrolled = Math.max(0, Math.min(scrollableHeight, -rect.top));
      const progress = scrollableHeight > 0 ? scrolled / scrollableHeight : 0;

      if (video.duration && !isNaN(video.duration)) {
        video.currentTime = progress * video.duration;
      }
    };

    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateVideoTime);
    };

    updateVideoTime();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [loaded]);

  return (
    <div
      ref={containerRef}
      style={{ height: scrollHeight }}
      className="relative w-full"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          onLoadedData={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 1 }}
        />
      </div>
    </div>
  );
}
