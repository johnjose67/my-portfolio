'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { animate } from 'framer-motion';

export type TransitionLineHandle = {
  shuffle: (duration?: number) => Promise<void>;
  hide: (delay?: number) => Promise<void>;
};

const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

type TransitionLineProps = {
  text: string;
  className?: string;
  barColor?: string;
  radius?: number; // px — cursor scatter influence radius, same idea as ScatterText
  strength?: number; // px — max scatter push distance
};

const TransitionLine = forwardRef<TransitionLineHandle, TransitionLineProps>(
  function TransitionLine(
    { text, className = '', barColor = '#FFFFFF', radius = 90, strength = 40 },
    ref
  ) {
    const [transitioning, setTransitioning] = useState(false);
    const [display, setDisplay] = useState(text);

    const wrapRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const mouse = useRef({ x: -9999, y: -9999 });
    const current = useRef<{ x: number; y: number }[]>([]);
    const words = text.split(' ');

    // --- Word-scatter physics, active only while resting (not mid-transition) ---
    useEffect(() => {
      if (transitioning) return; // pause scatter entirely once the click transition starts
      current.current = words.map(() => ({ x: 0, y: 0 }));

      const onMove = (e: PointerEvent) => {
        mouse.current.x = e.clientX;
        mouse.current.y = e.clientY;
      };
      window.addEventListener('pointermove', onMove, { passive: true });

      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        wordRefs.current.forEach((el, i) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = mouse.current.x - cx;
          const dy = mouse.current.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let targetX = 0;
          let targetY = 0;
          if (dist < radius) {
            const falloff = 1 - dist / radius;
            const angle = Math.atan2(-dy, -dx);
            targetX = Math.cos(angle) * strength * falloff;
            targetY = Math.sin(angle) * strength * falloff;
          }

          const c = current.current[i];
          const ease = dist < radius ? 0.25 : 0.12;
          c.x += (targetX - c.x) * ease;
          c.y += (targetY - c.y) * ease;
          el.style.transform = `translate(${c.x}px, ${c.y}px)`;
        });
      };
      raf = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', onMove);
      };
    }, [transitioning, radius, strength, text]);

    useImperativeHandle(ref, () => ({
      shuffle: (duration = 2000) => {
        setTransitioning(true); // stops the word-scatter loop above
        wordRefs.current.forEach((el) => {
          if (el) el.style.transform = 'translate(0px, 0px)'; // reset any residual scatter offset
        });
        return new Promise<void>((resolve) => {
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            if (elapsed >= duration) {
              setDisplay(text);
              resolve();
              return;
            }
            const progress = elapsed / duration;
            const revealCount = Math.floor(progress * text.length);
            const scrambled = text
              .split('')
              .map((ch, i) =>
                ch === ' ' || i < revealCount
                  ? ch
                  : POOL[Math.floor(Math.random() * POOL.length)]
              )
              .join('');
            setDisplay(scrambled);
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      hide: (delay = 0) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            animate(100, 0, {
              duration: 0.5,
              ease: [0.65, 0, 0.35, 1],
              onUpdate: (v) => {
                if (barRef.current) barRef.current.style.transform = `translateY(${v}%)`;
              },
              onComplete: () => {
                animate(0, 100, {
                  duration: 0.4,
                  ease: 'easeIn',
                  onUpdate: (v) => {
                    if (textRef.current) textRef.current.style.transform = `translateY(${v}%)`;
                  },
                  onComplete: () => resolve(),
                });
              },
            });
          }, delay);
        });
      },
    }));

    return (
      <div ref={wrapRef} className="relative overflow-hidden">
        <div ref={textRef} className={className} style={{ transform: 'translateY(0%)' }}>
          {transitioning ? (
            // Mid-transition: plain shuffled text, no per-word scatter spans
            <span style={{ whiteSpace: 'pre-wrap' }}>{display}</span>
          ) : (
            // At rest: each word is its own span so the scatter physics
            // above can move them independently
            words.map((word, i) => (
              <span
                key={i}
                ref={(el) => {
                  wordRefs.current[i] = el;
                }}
                style={{ display: 'inline-block', willChange: 'transform' }}
              >
                {word}
                {i < words.length - 1 ? '\u00A0' : ''}
              </span>
            ))
          )}
        </div>
        <div
          ref={barRef}
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: barColor, transform: 'translateY(100%)' }}
        />
      </div>
    );
  }
);

export default TransitionLine;