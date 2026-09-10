'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { animate } from 'framer-motion';

export type BadgeReelHandle = {
  spin: () => Promise<void>;
};

type BadgeReelProps = {
  frontSrc: string;
  frontAlt: string;
  backSrc: string;
  backAlt: string;
  width: number;
  height: number;
  duration?: number; // ms
  curveAmount?: number; // px — how far the strip bows sideways at the midpoint
  suckAmount?: number; // 0-1 — how much narrower the strip gets at the midpoint
};

const BadgeReel = forwardRef<BadgeReelHandle, BadgeReelProps>(function BadgeReel(
  { frontSrc, frontAlt, backSrc, backAlt, width, height, duration = 600, curveAmount = 40, suckAmount = 0.35 },
  ref
) {
  const stripRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    spin: () => {
      return new Promise<void>((resolve) => {
        animate(0, 1, {
          duration: duration / 1000,
          ease: [0.65, 0, 0.35, 1],
          onUpdate: (t) => {
            const y = -height * t;
            // Bows out sideways and back — this is the curve, rather than
            // a straight vertical line. Peaks at the midpoint (t=0.5), back
            // to 0 by the time it lands.
            const curveX = curveAmount * Math.sin(t * Math.PI);
            // Narrows and widens back out, also peaking at the midpoint —
            // this is what sells the "being sucked through a point" feel.
            // Combined with the curve, it reads as pulled rather than slid.
            const squeeze = 1 - suckAmount * Math.sin(t * Math.PI);

            if (stripRef.current) {
              stripRef.current.style.transform = `translate(${curveX}px, ${y}px) scaleX(${squeeze})`;
            }
          },
          onComplete: resolve,
        });
      });
    },
  }));

  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      {/* The strip — Home sits in the visible window at rest, Projects sits
          directly below it, already positioned and simply waiting off-screen */}
      <div ref={stripRef} style={{ transform: 'translate(0px, 0px) scaleX(1)' }}>
        <div style={{ width, height }}>
          <img
            src={frontSrc}
            alt={frontAlt}
            draggable={false}
            className="w-full h-full object-contain select-none"
          />
        </div>
        <div style={{ width, height }}>
          <img
            src={backSrc}
            alt={backAlt}
            draggable={false}
            className="w-full h-full object-contain select-none"
          />
        </div>
      </div>
    </div>
  );
});

export default BadgeReel;