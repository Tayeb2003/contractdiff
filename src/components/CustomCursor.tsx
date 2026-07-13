import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    let ringX = -100;
    let ringY = -100;
    let targetX = -100;
    let targetY = -100;

    const handleMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setPos({ x: targetX, y: targetY });
    };

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"]')) {
        setHovering(true);
      }
    };
    const handleOut = () => setHovering(false);

    let frame: number;
    function animate() {
      ringX += (targetX - ringX) * 0.15;
      ringY += (targetY - ringY) * 0.15;
      setRingPos({ x: ringX, y: ringY });
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseover', handleOver);
    window.addEventListener('mouseout', handleOut);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseover', handleOver);
      window.removeEventListener('mouseout', handleOut);
    };
  }, []);

  return (
    <div className="hidden md:block pointer-events-none fixed inset-0 z-[9999]">
      <div
        className="absolute w-2 h-2 rounded-full bg-mint"
        style={{
          left: pos.x - 4,
          top: pos.y - 4,
          transition: 'width 0.2s, height 0.2s, opacity 0.2s',
        }}
      />
      <div
        className="absolute rounded-full border border-mint"
        style={{
          left: ringPos.x - 16,
          top: ringPos.y - 16,
          width: 32,
          height: 32,
          opacity: hovering ? 0.8 : 0.4,
          transform: `scale(${hovering ? 1.5 : 1})`,
          transition: 'transform 0.3s ease, opacity 0.3s ease',
        }}
      />
    </div>
  );
}
