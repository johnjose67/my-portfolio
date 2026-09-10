'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { animate } from 'framer-motion';

export type BadgeSuckHandle = {
  suck: () => Promise<void>;
};

type BadgeSuckProps = {
  frontSrc: string;
  frontAlt: string;
  backSrc: string;
  backAlt: string;
  width: number;
  height: number;
  suckDuration?: number; // ms — Home shrinking away
  revealDuration?: number; // ms — Projects expanding back out
};

const BadgeSuck = forwardRef<BadgeSuckHandle, BadgeSuckProps>(function BadgeSuck(
  { frontSrc, frontAlt, backSrc, backAlt, width, height, suckDuration = 500, revealDuration = 500 },
  ref
) {
  const [showBack, setShowBack] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    suck: () => {
      return new Promise<void>((resolve) => {
        // Phase 1 — Home gets pulled toward center: narrows (scaleX) faster
        // than it shortens (scaleY), which is the actual "squeeze" — a
        // uniform shrink alone would just look like it's shrinking, not
        // being pulled through a point
        animate(0, 1, {
          duration: suckDuration / 1000,
          ease: 'easeIn', // accelerates in, like it's picking up speed toward the vanishing point
          onUpdate: (t) => {
            const scaleX = 1 - t * 0.97;
            const scaleY = 1 - t * 0.85;
            if (wrapRef.current) {
              wrapRef.current.style.transform = `scale(${scaleX}, ${scaleY})`;
              wrapRef.current.style.opacity = String(1 - t * 0.3);
            }
          },
          onComplete: () => {
            setShowBack(true);
            // Phase 2 — Projects reveals from that same squeezed state,
            // expanding back out to full size
            animate(0, 1, {
              duration: revealDuration / 1000,
              ease: [0.34, 1.56, 0.64, 1], // slight overshoot as it settles, rather than a flat arrival
              onUpdate: (t) => {
                const scaleX = 0.03 + t * 0.97;
                const scaleY = 0.15 + t * 0.85;
                if (wrapRef.current) {
                  wrapRef.current.style.transform = `scale(${scaleX}, ${scaleY})`;
                  wrapRef.current.style.opacity = String(0.7 + t * 0.3);
                }
              },
              onComplete: resolve,
            });
          },
        });
      });
    },
  }));

  return (
    <div className="relative" style={{ width, height }}>
      <div
        ref={wrapRef}
        className="w-full h-full"
        style={{ transform: 'scale(1, 1)', transformOrigin: 'center' }}
      >
        <img
          src={showBack ? backSrc : frontSrc}
          alt={showBack ? backAlt : frontAlt}
          draggable={false}
          className="w-full h-full object-contain select-none"
        />
      </div>
    </div>
  );
});

export default BadgeSuck;