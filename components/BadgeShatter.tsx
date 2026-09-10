'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { animate } from 'framer-motion';

export type BadgeShatterHandle = {
  shatter: () => Promise<void>;
};

type BadgeShatterProps = {
  frontSrc: string;
  frontAlt: string;
  backSrc: string;
  backAlt: string;
  width: number;
  height: number;
  explodeDuration?: number; // ms — how long the outward flight takes
  reformDuration?: number; // ms — how long the pieces take to snap into place
  overlap?: number; // ms — how much reform starts before explode finishes, for a snappier feel
};

// 50 irregular shards, generated from a jittered 5×5 grid (each cell split
// into 2 triangles along a randomized diagonal). Jittering the grid points
// is what keeps this looking like cracked glass rather than a neat grid —
// but since every triangle's corners come from shared grid points, the
// pieces still tile the box perfectly with zero gaps between them.
function generateShards(cols: number, rows: number): string[] {
  const points: { x: number; y: number }[][] = [];
  for (let row = 0; row <= rows; row++) {
    const line: { x: number; y: number }[] = [];
    for (let col = 0; col <= cols; col++) {
      const onEdge = row === 0 || row === rows || col === 0 || col === cols;
      const jitterX = onEdge ? 0 : (Math.random() - 0.5) * (100 / cols) * 0.6;
      const jitterY = onEdge ? 0 : (Math.random() - 0.5) * (100 / rows) * 0.6;
      line.push({
        x: (col / cols) * 100 + jitterX,
        y: (row / rows) * 100 + jitterY,
      });
    }
    points.push(line);
  }

  const shards: string[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const a = points[row][col];
      const b = points[row][col + 1];
      const c = points[row + 1][col];
      const d = points[row + 1][col + 1];
      // Alternate the diagonal direction per cell for a less uniform look
      if ((row + col) % 2 === 0) {
        shards.push(`polygon(${a.x}% ${a.y}%, ${b.x}% ${b.y}%, ${c.x}% ${c.y}%)`);
        shards.push(`polygon(${b.x}% ${b.y}%, ${d.x}% ${d.y}%, ${c.x}% ${c.y}%)`);
      } else {
        shards.push(`polygon(${a.x}% ${a.y}%, ${b.x}% ${b.y}%, ${d.x}% ${d.y}%)`);
        shards.push(`polygon(${a.x}% ${a.y}%, ${d.x}% ${d.y}%, ${c.x}% ${c.y}%)`);
      }
    }
  }
  return shards;
}

const SHARDS = generateShards(5, 5); // 5×5 cells × 2 triangles = 50 shards

const BadgeShatter = forwardRef<BadgeShatterHandle, BadgeShatterProps>(function BadgeShatter(
  {
    frontSrc,
    frontAlt,
    backSrc,
    backAlt,
    width,
    height,
    explodeDuration = 500,
    reformDuration = 500,
    overlap = 150,
  },
  ref
) {
  const frontShardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const backShardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    shatter: () => {
      return new Promise<void>((resolve) => {
        const diag = Math.hypot(width, height);

        // Explode: each Home shard flies outward in its own random
        // direction, spinning and fading, away from wherever it happens
        // to sit — not a uniform radial burst
        SHARDS.forEach((_, i) => {
          const el = frontShardRefs.current[i];
          if (!el) return;
          const angle = Math.random() * Math.PI * 2;
          const dist = diag * (0.6 + Math.random() * 0.5);
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist;
          const rot = (Math.random() - 0.5) * 720;
          animate(0, 1, {
            duration: explodeDuration / 1000,
            delay: (i / SHARDS.length) * 0.08,
            ease: 'easeIn',
            onUpdate: (t) => {
              el.style.transform = `translate(${dx * t}px, ${dy * t}px) rotate(${rot * t}deg)`;
              el.style.opacity = String(1 - t);
            },
          });
        });

        // Reform: each Projects shard starts scattered off-screen (its own
        // random direction/rotation) and flies IN to its correct resting
        // position, fading in — starts slightly before explode finishes
        setTimeout(() => {
          SHARDS.forEach((_, i) => {
            const el = backShardRefs.current[i];
            if (!el) return;
            const angle = Math.random() * Math.PI * 2;
            const dist = diag * (0.6 + Math.random() * 0.5);
            const startX = Math.cos(angle) * dist;
            const startY = Math.sin(angle) * dist;
            const startRot = (Math.random() - 0.5) * 720;
            animate(0, 1, {
              duration: reformDuration / 1000,
              delay: (i / SHARDS.length) * 0.08,
              ease: [0.34, 1.56, 0.64, 1], // slight overshoot — pieces "snap" into place rather than gently arrive
              onUpdate: (t) => {
                el.style.transform = `translate(${startX * (1 - t)}px, ${startY * (1 - t)}px) rotate(${startRot * (1 - t)}deg)`;
                el.style.opacity = String(t);
              },
            });
          });
        }, Math.max(0, explodeDuration - overlap));

        const total = Math.max(explodeDuration, explodeDuration - overlap + reformDuration);
        setTimeout(resolve, total);
      });
    },
  }));

  return (
    <div className="relative" style={{ width, height }}>
      {/* Projects shards — sit behind, scattered/invisible until reform starts */}
      {SHARDS.map((clipPath, i) => (
        <div
          key={`back-${i}`}
          ref={(el) => {
            backShardRefs.current[i] = el;
          }}
          className="absolute inset-0"
          style={{ clipPath, opacity: 0 }}
        >
          <img
            src={backSrc}
            alt={backAlt}
            draggable={false}
            className="w-full h-full object-contain select-none"
          />
        </div>
      ))}

      {/* Home shards — assembled and fully visible at rest */}
      {SHARDS.map((clipPath, i) => (
        <div
          key={`front-${i}`}
          ref={(el) => {
            frontShardRefs.current[i] = el;
          }}
          className="absolute inset-0"
          style={{ clipPath, opacity: 1 }}
        >
          <img
            src={frontSrc}
            alt={frontAlt}
            draggable={false}
            className="w-full h-full object-contain select-none"
          />
        </div>
      ))}
    </div>
  );
});

export default BadgeShatter;