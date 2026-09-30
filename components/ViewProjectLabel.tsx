'use client';

import { useEffect, useState } from 'react';

type ViewProjectLabelProps = {
  active: boolean; // true while the card is hovered — the loop only runs then
  x: number; // cursor position, px, relative to the positioning parent
  y: number;
};

// Same four-face, continuous-one-direction-rotation approach as
// LoopingFlipImage — at every 90° step exactly one face is camera-
// facing, no gap, never reversing. Here the four faces alternate
// green/white/green/white, completing one full green→white→green→white
// cycle every 360° of rotation, matching "completes one cycle" from
// the spec.
const FACE_ROTATIONS = [0, -90, -180, -270];
const FACE_COLORS = ['#55D657', '#FFFFFF', '#55D657', '#FFFFFF'];
const FLIP_DURATION = 450; // ms — one 90° rotation
const HOLD_DURATION = 2000; // ms — 2-3 second delay before each flip
const LABEL_DEPTH = 11; // px — rescaled down from 70: with the padding now down to ~2px, the label itself is much smaller, so the depth (roughly half its own height) needs to shrink to match, or the faces stay too far apart during rotation, showing a visible gap

export default function ViewProjectLabel({ active, x, y }: ViewProjectLabelProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!active) {
      setRotation(0); // resets so it always starts fresh (green, face 0) the next time it's hovered
      return;
    }
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const loop = () => {
      if (cancelled) return;
      setRotation((r) => r + 90);
      timeoutId = setTimeout(loop, HOLD_DURATION);
    };

    timeoutId = setTimeout(loop, HOLD_DURATION);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [active]);

  if (!active) return null;

  const activeFace = Math.round(rotation / 90) % 4;

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x, top: y, transform: 'translate(calc(-100% - 8px), calc(-100% - 8px))', perspective: 300, zIndex: 600 }}
    >
      <span
        className="relative inline-block [transform-style:preserve-3d]"
        style={{ transform: `rotateX(${rotation}deg)`, transition: `transform ${FLIP_DURATION}ms ease-in-out` }}
      >
        {FACE_ROTATIONS.map((faceRot, i) => (
          <div
            key={i}
            className={`select-none whitespace-nowrap [backface-visibility:hidden] text-black text-[20px] tracking-[0.32px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold ${
              i === 0 ? '' : 'absolute top-0 left-0'
            }`}
            style={{
              padding: '4px',
              backgroundColor: FACE_COLORS[i],
              transform: `rotateX(${faceRot}deg) translateZ(${LABEL_DEPTH}px)`,
              opacity: activeFace === i ? 1 : 0,
              transition: `opacity ${FLIP_DURATION}ms ease-in-out`,
            }}
          >
            [ VIEW PROJECT ]
          </div>
        ))}
      </span>
    </div>
  );
}