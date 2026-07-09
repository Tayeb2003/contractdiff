import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import type { ReactNode } from 'react';

interface HorizontalScrollProps {
  children: ReactNode;
  panelCount: number;
  className?: string;
}

export default function HorizontalScroll({ children, panelCount, className = '' }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', `-${(panelCount - 1) * 100 / panelCount}%`]);

  return (
    <div ref={containerRef} className="relative" style={{ height: `${panelCount * 100}vh` }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div className={`flex ${className}`} style={{ x, width: `${panelCount * 100}%` }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
