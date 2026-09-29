'use client';

import { useEffect, useState } from 'react';

type LoopingFlipImageProps = {
  src: string;
  alt: string;
  visible: boolean; // fades in/out; the auto-loop pauses entirely while false
  width?: number;
  depth?: number; // px — how far each face is pushed out from the cube's pivot
  flipDuration?: number; // ms — how long one 90° rotation takes
  pauseDuration?: number; // ms — how long it holds at each resting face before flipping again
};

// Local rotation of each of the cube's four faces. A face at local
// rotateX(θ) becomes camera-facing exactly when the WRAPPER's own
// rotation is also θ (mod 360) — so as the wrapper steps through
// 0 → 90 → 180 → 270 → 360 in one direction, each step lines up with
// exactly one face here, with no point where none of them do.
const FACE_ROTATIONS = [0, -90, -180, -270];

export default function LoopingFlipImage({
  src,
  alt,
  visible,
  width = 48,
  depth = 12,
  flipDuration = 450,
  pauseDuration = 2000,
}: LoopingFlipImageProps) {
  // Grows without bound (0, 90, 180, 270, 360...) rather than toggling
  // between fixed values — CSS animates the raw number forward each
  // step, so the cube always continues rotating the same direction,
  // never reversing back the way it came.
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const loop = () => {
      if (cancelled) return;
      setRotation((r) => r + 90);
      timeoutId = setTimeout(loop, pauseDuration);
    };

    timeoutId = setTimeout(loop, pauseDuration);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [visible, pauseDuration]);

  // Which of the four faces is currently camera-facing.
  const activeFace = Math.round(rotation / 90) % 4;

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 400ms ease-out',
        pointerEvents: 'none',
      }}
    >
      <span className="relative inline-block" style={{ perspective: 300 }}>
        <span
          className="relative inline-block [transform-style:preserve-3d]"
          style={{
            transform: `rotateX(${rotation}deg)`,
            transition: `transform ${flipDuration}ms ease-in-out`,
          }}
        >
          {FACE_ROTATIONS.map((faceRot, i) => (
            <img
              key={i}
              src={src}
              alt={i === 0 ? alt : ''}
              draggable={false}
              className={`select-none [backface-visibility:hidden] block ${i === 0 ? '' : 'absolute inset-0'}`}
              style={{
                width,
                height: 'auto',
                transform: `rotateX(${faceRot}deg) translateZ(${depth}px)`,
                opacity: activeFace === i ? 1 : 0,
                transition: `opacity ${flipDuration}ms ease-in-out`,
              }}
            />
          ))}
        </span>
      </span>
    </div>
  );
}