import { ArrowDown } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { useCallback, useEffect, useState, type MouseEvent } from 'react';

const titleFirst = 'Contract Diff';
const titleSecond = 'For Non-Lawyers';

export default function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

  const springRotateX = useSpring(rotateX, { stiffness: 180, damping: 25 });
  const springRotateY = useSpring(rotateY, { stiffness: 180, damping: 25 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const [typedFirst, setTypedFirst] = useState('');
  const [typedSecond, setTypedSecond] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    let phase = 0;
    const interval = setInterval(() => {
      if (phase === 0) {
        i++;
        setTypedFirst(titleFirst.slice(0, i));
        if (i >= titleFirst.length) {
          phase = 1;
          i = 0;
        }
      } else {
        i++;
        setTypedSecond(titleSecond.slice(0, i));
        if (i >= titleSecond.length) {
          clearInterval(interval);
          setDone(true);
        }
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-center overflow-hidden">
      <div className="relative z-10 w-full h-full min-h-[60vh] flex flex-col justify-between px-6 md:px-12 pt-32 pb-20 max-w-[90rem] mx-auto">
        {/* Main Title */}
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transformPerspective: 600,
            rotateX: springRotateX,
            rotateY: springRotateY,
          }}
          className="text-center mt-auto mb-12 md:mb-auto"
        >
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] uppercase tracking-tight text-metallic inline-block min-h-[2.4em]">
            <span className="block min-h-[1.2em]">
              {typedFirst}
            </span>
            <span className="block min-h-[1.2em]">
              {typedSecond}
              <AnimatePresence>
                {!done && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block ml-1 -mb-1 bg-mint/80 align-middle"
                    style={{ height: "0.8em", width: "3px" }}
                  />
                )}
              </AnimatePresence>
            </span>
          </h1>
        </motion.div>

        {/* Bottom Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-end mt-auto">
          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 2.4, ease: "easeOut" }}
            className="max-w-md"
          >
            <span className="flex items-center gap-3 mb-6">
              <span className="w-10 h-px bg-mint" />
              <span className="text-xs uppercase tracking-[0.3em] text-mint/80">Smart Diff</span>
            </span>
            <p className="text-xl md:text-[1.75rem] font-normal text-body leading-snug">
              Compare Contracts<br />in Seconds with Smart Diff.
            </p>
          </motion.div>

          {/* Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 2.6, ease: "easeOut" }}
            className="max-w-[28rem] md:justify-self-end text-lg md:text-xl font-normal text-body leading-relaxed text-mint/90"
          >
            <p>
              Upload two versions of any contract and instantly see every change, risk, and important update explained in simple language—no legal expertise required.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 3.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-mint/60">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="w-5 h-5 text-mint/60" strokeWidth={1} />
        </motion.div>
      </motion.div>
    </section>
  );
}
