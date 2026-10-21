'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * The Roomix house-bot chatbot icon with a gaze effect: the icon is two
 * layers — the house frame (public/images/ai-housebot-base.png, eyes removed)
 * and the two indigo eyes as DOM ovals at their measured positions in the
 * artwork (left 27.3% / 55.4%, top 52.2%, 17.3% x 20.4% of the canvas).
 * Eyes and head lean toward the reader's cursor on springs (framer-motion);
 * the eyes blink every few seconds. Honours prefers-reduced-motion.
 */
const EYE = { top: 52.23, height: 20.35, bandLeft: 27.27, bandWidth: 45.46, eyeLeftInBand: 61.9, eyeWidthInBand: 38.12, color: '#4D44DE' };

export default function HouseBotIcon({ size = 36 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [blink, setBlink] = useState(false);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rawR = useMotionValue(0);
  const spring = { stiffness: 160, damping: 15, mass: 0.45 };
  const eyeX = useSpring(rawX, spring);
  const eyeY = useSpring(rawY, spring);
  const tilt = useSpring(rawR, { stiffness: 120, damping: 14, mass: 0.5 });
  const shiftX = useSpring(rawX, { stiffness: 120, damping: 16, mass: 0.6 });
  const shiftY = useSpring(rawY, { stiffness: 120, damping: 16, mass: 0.6 });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
        const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
        rawX.set(dx * size * 0.16);
        rawY.set(dy * size * 0.13);
        rawR.set(dx * 5);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, [rawX, rawY, rawR, size]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let alive = true;
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    const loop = () => {
      t1 = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        t2 = setTimeout(() => { if (alive) { setBlink(false); loop(); } }, 140);
      }, 2600 + Math.random() * 2600);
    };
    loop();
    return () => { alive = false; clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div ref={ref} aria-hidden style={{ width: size, height: size, rotate: tilt, x: shiftX, y: shiftY }} className="relative shrink-0 select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/ai-housebot-base.png" alt="" draggable={false} className="absolute inset-0 h-full w-full" />
      <motion.div style={{ x: eyeX, y: eyeY }} className="absolute inset-0">
        <div
          className="absolute"
          style={{
            left: `${EYE.bandLeft}%`,
            top: `${EYE.top}%`,
            width: `${EYE.bandWidth}%`,
            height: `${EYE.height}%`,
            transform: blink ? 'scaleY(0.08)' : 'scaleY(1)',
            transformOrigin: 'center',
            transition: 'transform 90ms ease-in-out',
          }}
        >
          <span className="absolute top-0 h-full rounded-[50%]" style={{ left: 0, width: `${EYE.eyeWidthInBand}%`, background: EYE.color }} />
          <span className="absolute top-0 h-full rounded-[50%]" style={{ left: `${EYE.eyeLeftInBand}%`, width: `${EYE.eyeWidthInBand}%`, background: EYE.color }} />
        </div>
      </motion.div>
    </motion.div>
  );
}
