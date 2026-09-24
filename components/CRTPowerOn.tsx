'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { animate } from 'framer-motion';

export type CRTPowerOnHandle = {
  /** Covers the screen in `color` as two panels meeting at a thin line
   * center-screen, then those panels shrink away from center — like an
   * old CRT monitor powering on — revealing whatever's underneath as
   * they open. Resolves once fully open. */
  play: (color: string) => Promise<void>;
};

const EXPAND_DURATION = 1000; // ms — how long the panels take to fully open
const STATIC_FLASH_DURATION = 580; // ms — brief noise flash right as it starts

const CRTPowerOn = forwardRef<CRTPowerOnHandle>(function CRTPowerOn(_, ref) {
  const [active, setActive] = useState(false);
  const [color, setColor] = useState('#000000');
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const staticRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    play: (c: string) => {
      return new Promise<void>((resolve) => {
        setColor(c);
        setActive(true);

        // One frame to let the panels mount at their starting state
        // (each 50% tall, meeting exactly at center — reads as a thin
        // line) before animating them apart.
        requestAnimationFrame(() => {
          // Static flash — quick, fades out well before the panels
          // finish opening.
          animate(0.7, 0, {
            duration: STATIC_FLASH_DURATION / 1000,
            ease: 'easeOut',
            onUpdate: (v) => {
              if (staticRef.current) staticRef.current.style.opacity = String(v);
            },
          });

          // Both panels shrink from 50% height down to 0% together —
          // their shared boundary (screen center) is what makes this
          // read as one band opening outward, not two independent bars.
          animate(50, 0, {
            duration: EXPAND_DURATION / 1000,
            ease: [0.16, 1, 0.3, 1], // same elegant-deceleration curve used elsewhere on this site
            onUpdate: (v) => {
              if (topRef.current) topRef.current.style.height = `${v}%`;
              if (bottomRef.current) bottomRef.current.style.height = `${v}%`;
            },
            onComplete: () => {
              setActive(false);
              resolve();
            },
          });
        });
      });
    },
  }));

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      <div ref={topRef} className="absolute top-0 left-0 right-0" style={{ height: '50%', backgroundColor: color }} />
      <div ref={bottomRef} className="absolute bottom-0 left-0 right-0" style={{ height: '50%', backgroundColor: color }} />
      {/* Brief noise/static flash, CSS-only via an SVG turbulence filter
          — no image asset needed. mix-blend-mode makes it read as
          static laid over the panels rather than a flat overlay. */}
      <div
        ref={staticRef}
        className="absolute inset-0"
        style={{
          opacity: 0.7,
          mixBlendMode: 'overlay',
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
});

export default CRTPowerOn;