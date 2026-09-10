'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { animate } from 'framer-motion';

export type BadgeRevolveHandle = {
  spin: () => Promise<void>;
};

type BadgeRevolveProps = {
  frontSrc: string;
  frontAlt: string;
  backSrc: string;
  backAlt: string;
  width: number;
  height: number;
  duration?: number; // ms — full 360° takes this long
  warpAmount?: number; // 0-1, how much squeeze/warp happens mid-rotation
};

const BadgeRevolve = forwardRef<BadgeRevolveHandle, BadgeRevolveProps>(function BadgeRevolve(
  { frontSrc, frontAlt, backSrc, backAlt, width, height, duration = 900, warpAmount = 0.35 },
  ref
) {
  const [showBack, setShowBack] = useState(false);
  const spinRef = useRef<HTMLDivElement>(null);
  const swappedRef = useRef(false);

  useImperativeHandle(ref, () => ({
    spin: () => {
      swappedRef.current = false;
      return new Promise<void>((resolve) => {
        animate(0, 1, {
          duration: duration / 1000,
          // Approximates the reference's qinticInOut — snappy in/out
          ease: [0.7, 0, 0.3, 1],
          onUpdate: (t) => {
            // Horizontal axis (rotateX) — this is the top-to-bottom flip,
            // not a left-right spin
            const angle = t * 360;

            // The warp: a squeeze that bulges in at the midpoint and
            // relaxes back out, synced to the same t as the rotation —
            // this is standing in for the shader's per-vertex twist, since
            // a flat CSS rotateX alone has no give to it at all
            const warp = Math.sin(t * Math.PI) * warpAmount;
            const scaleY = 1 - warp;
            const skew = (t < 0.5 ? warp : -warp) * 8; // deg, subtle shear reinforcing the twist

            if (spinRef.current) {
              spinRef.current.style.transform = `rotateX(${angle}deg) scaleY(${scaleY}) skewX(${skew}deg)`;
            }

            // Swap the image at the exact halfway point (180°), where the
            // plane is edge-on to the camera
            if (t >= 0.5 && !swappedRef.current) {
              swappedRef.current = true;
              setShowBack(true);
            }
          },
          onComplete: resolve,
        });
      });
    },
  }));

  return (
    <div style={{ width, height, perspective: 1400 }}>
      <div
        ref={spinRef}
        style={{
          width: '100%',
          height: '100%',
          transform: 'rotateX(0deg)',
          transformStyle: 'preserve-3d',
        }}
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

export default BadgeRevolve;