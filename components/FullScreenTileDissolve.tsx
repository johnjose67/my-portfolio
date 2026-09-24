'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { animate } from 'framer-motion';

export type FullScreenTileDissolveHandle = {
  /** Covers the screen in `color`, then shatters those tiles away in
   * scattered order — same grid/scale/fade mechanic as BadgeDissolve,
   * just solid-color tiles instead of image tiles (this transitions
   * between live views, not static images). Resolves once fully cleared. */
  dissolve: (color: string) => Promise<void>;
};

const COLS = 10;
const ROWS = 18;
const TOTAL_TILES = COLS * ROWS;
const TILE_ANIM_DURATION = 250; // ms — matches BadgeDissolve's per-tile duration
const TILE_DURATION = 900; // ms — total time for all tiles to finish

const FullScreenTileDissolve = forwardRef<FullScreenTileDissolveHandle>(function FullScreenTileDissolve(_, ref) {
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    dissolve: (color: string) => {
      return new Promise<void>((resolve) => {
        setActiveColor(color);

        // Tiles need one frame to actually mount before their refs are
        // usable — otherwise the very first dissolve() call would find
        // tileRefs.current empty and animate nothing.
        requestAnimationFrame(() => {
          const order = Array.from({ length: TOTAL_TILES }, (_, i) => i);
          for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
          }

          const maxDelay = Math.max(0, TILE_DURATION - TILE_ANIM_DURATION);

          order.forEach((tileIndex, orderPos) => {
            const el = tileRefs.current[tileIndex];
            if (!el) return;
            const delay = (orderPos / TOTAL_TILES) * maxDelay;
            setTimeout(() => {
              animate(1, 0, {
                duration: TILE_ANIM_DURATION / 1000,
                ease: 'easeIn',
                onUpdate: (v) => {
                  el.style.opacity = String(v);
                  el.style.transform = `scale(${v})`;
                },
              });
            }, delay);
          });

          setTimeout(() => {
            setActiveColor(null);
            resolve();
          }, TILE_DURATION);
        });
      });
    },
  }));

  if (!activeColor) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {Array.from({ length: TOTAL_TILES }).map((_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const wPct = 100 / COLS;
        const hPct = 100 / ROWS;
        // Same slight overlap-into-neighbors technique as BadgeDissolve,
        // to avoid hairline gaps from clip-path anti-aliasing between
        // adjacent tiles.
        const overlapX = wPct * 0.15;
        const overlapY = hPct * 0.15;
        const x0 = Math.max(0, col * wPct - overlapX);
        const x1 = Math.min(100, (col + 1) * wPct + overlapX);
        const y0 = Math.max(0, row * hPct - overlapY);
        const y1 = Math.min(100, (row + 1) * hPct + overlapY);
        return (
          <div
            key={i}
            ref={(el) => {
              tileRefs.current[i] = el;
            }}
            className="absolute inset-0"
            style={{
              clipPath: `polygon(${x0}% ${y0}%, ${x1}% ${y0}%, ${x1}% ${y1}%, ${x0}% ${y1}%)`,
              backgroundColor: activeColor,
              opacity: 1,
              transform: 'scale(1)',
              transformOrigin: `${(x0 + x1) / 2}% ${(y0 + y1) / 2}%`,
            }}
          />
        );
      })}
    </div>
  );
});

export default FullScreenTileDissolve;