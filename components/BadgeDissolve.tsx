'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { animate } from 'framer-motion';

export type BadgeDissolveHandle = {
  dissolve: () => Promise<void>;
};

type BadgeDissolveProps = {
  frontSrc: string;
  frontAlt: string;
  backSrc: string;
  backAlt: string;
  width: number;
  height: number;
  cols?: number;
  rows?: number;
  tileDuration?: number; // ms — total time for all tiles to finish dissolving
  revealDuration?: number; // ms — how long Projects.png takes to fade from 0 to full opacity
};

const BadgeDissolve = forwardRef<BadgeDissolveHandle, BadgeDissolveProps>(function BadgeDissolve(
  {
    frontSrc,
    frontAlt,
    backSrc,
    backAlt,
    width,
    height,
    cols = 12,
    rows = 30,
    tileDuration = 1000,
    revealDuration = 2500,
  },
  ref
) {
  const [dissolved, setDissolved] = useState(false);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const backImgRef = useRef<HTMLImageElement>(null);
  const totalTiles = cols * rows;
  const tileWidthPct = 100 / cols;
  const tileHeightPct = 100 / rows;

  useImperativeHandle(ref, () => ({
    dissolve: () => {
      return new Promise<void>((resolve) => {
        // Projects.png fades in on its own independent timeline
        animate(0, 1, {
          duration: revealDuration / 1000,
          ease: 'linear',
          onUpdate: (v) => {
            if (backImgRef.current) backImgRef.current.style.opacity = String(v);
          },
        });

        // Tiles dissolve in scattered (shuffled) order
        const order = Array.from({ length: totalTiles }, (_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }

        const tileAnimDuration = 250;
        const maxDelay = Math.max(0, tileDuration - tileAnimDuration);

        order.forEach((tileIndex, orderPos) => {
          const el = tileRefs.current[tileIndex];
          if (!el) return;
          const delay = (orderPos / totalTiles) * maxDelay;
          setTimeout(() => {
            animate(1, 0, {
              duration: tileAnimDuration / 1000,
              ease: 'easeIn',
              onUpdate: (v) => {
                el.style.opacity = String(v);
                el.style.transform = `scale(${v})`;
              },
            });
          }, delay);
        });

        const total = Math.max(tileDuration, revealDuration);
        setTimeout(() => {
          setDissolved(true);
          resolve();
        }, total);
      });
    },
  }));

  return (
    <div className="relative" style={{ width, height }}>
      {/* Hidden at rest (opacity 0) — only ever fades in via dissolve() */}
      <img
        ref={backImgRef}
        src={backSrc}
        alt={backAlt}
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain select-none"
        style={{ opacity: 0 }}
      />

      {!dissolved && (
        <div className="absolute inset-0">
          {Array.from({ length: totalTiles }).map((_, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            // Each tile's clip region is expanded slightly beyond its exact
            // boundary and into its neighbors — this is what eliminates the
            // hairline gaps clip-path anti-aliasing can leave between
            // adjacent tiles. Safe to overlap since every tile shows the
            // SAME image, so overlapping regions just show identical,
            // correctly-aligned content rather than any visible seam.
            const overlapX = tileWidthPct * 0.15;
            const overlapY = tileHeightPct * 0.15;
            const x0 = Math.max(0, col * tileWidthPct - overlapX);
            const x1 = Math.min(100, (col + 1) * tileWidthPct + overlapX);
            const y0 = Math.max(0, row * tileHeightPct - overlapY);
            const y1 = Math.min(100, (row + 1) * tileHeightPct + overlapY);
            return (
              <div
                key={i}
                ref={(el) => {
                  tileRefs.current[i] = el;
                }}
                className="absolute inset-0"
                style={{
                  // Every tile renders the SAME full image at the same
                  // size/position — clip-path just masks which square of
                  // it is visible. Since it's one consistent render, not
                  // independently-scaled crops, there's nothing to
                  // produce a seam between adjacent tiles.
                  clipPath: `polygon(${x0}% ${y0}%, ${x1}% ${y0}%, ${x1}% ${y1}%, ${x0}% ${y1}%)`,
                  transformOrigin: `${(x0 + x1) / 2}% ${(y0 + y1) / 2}%`,
                  opacity: 1,
                  transform: 'scale(1)',
                }}
              >
                <img
                  src={frontSrc}
                  alt={frontAlt}
                  draggable={false}
                  className="w-full h-full object-contain select-none"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default BadgeDissolve;