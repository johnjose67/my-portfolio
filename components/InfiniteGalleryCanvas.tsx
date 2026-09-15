'use client';

import { useEffect, useRef, useState } from 'react';

// One repeating "tile" of photos — this exact arrangement repeats
// endlessly in every direction. Positions are fixed (not randomized per
// render) so the pattern stays visually consistent as it tiles.
type PhotoCard = {
  x: number; // px, position within one tile
  y: number;
  width: number;
  height: number;
  rotation: number; // deg
  color: string; // placeholder fill — swap for a real image later
  label: string;
};

const TILE_WIDTH = 2400;
const TILE_HEIGHT = 1700;

const PHOTOS: PhotoCard[] = [
  { x: 100, y: 100, width: 420, height: 520, rotation: 0, color: '#C9A88A', label: '1' },
  { x: 900, y: 180, width: 440, height: 540, rotation: 0, color: '#8FA6C9', label: '2' },
  { x: 1720, y: 90, width: 400, height: 500, rotation: 0, color: '#C98F8F', label: '3' },
  { x: 380, y: 800, width: 440, height: 540, rotation: 0, color: '#A8C98F', label: '4' },
  { x: 1250, y: 750, width: 420, height: 520, rotation: 0, color: '#C9B78F', label: '5' },
  { x: 2000, y: 820, width: 400, height: 500, rotation: 0, color: '#8FC9BE', label: '6' },
  { x: 150, y: 1400, width: 420, height: 520, rotation: 0, color: '#B78FC9', label: '7' },
  { x: 1550, y: 1420, width: 440, height: 540, rotation: 0, color: '#C98FA8', label: '8' },
];

const MOMENTUM_DECAY = 0.94; // per frame — higher = coasts further after release
const MIN_VELOCITY = 0.02; // px/frame — below this, momentum stops

// --- Ripple edge tuning ---
const RIPPLE_MAX_AMPLITUDE = 10; // % of screen size — how far the edge bulges at max speed
const RIPPLE_SPEED_TO_AMPLITUDE = 0.035; // how much drag speed (px/frame) translates into amplitude
const RIPPLE_EASE = 0.12; // how quickly the ripple grows/settles toward its target each frame
const RIPPLE_POINTS_PER_EDGE = 5; // more points = smoother wave, fewer = chunkier
const RIPPLE_WAVE_COUNT = 2; // how many full waves fit along one edge
const PHASE_SPEED = 0.18; // how fast the wave travels along the edge over time

function buildRipplePolygon(amplitude: number, phase: number): string {
  const pts: string[] = [];
  const n = RIPPLE_POINTS_PER_EDGE;
  const wave = (t: number) => amplitude * Math.sin(phase + t * Math.PI * 2 * RIPPLE_WAVE_COUNT);

  // Top edge: left → right
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push(`${t * 100}% ${wave(t)}%`);
  }
  // Right edge: top → bottom
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    pts.push(`${100 - wave(t)}% ${t * 100}%`);
  }
  // Bottom edge: right → left
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    pts.push(`${100 - t * 100}% ${100 - wave(t)}%`);
  }
  // Left edge: bottom → top
  for (let i = 1; i < n; i++) {
    const t = i / n;
    pts.push(`${wave(t)}% ${100 - t * 100}%`);
  }

  return `polygon(${pts.join(', ')})`;
}

export default function InfiniteGalleryCanvas() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const momentumRaf = useRef(0);

  const frameRef = useRef<HTMLDivElement>(null);
  const rippleAmplitude = useRef(0);
  const ripplePhase = useRef(0);
  const rippleRaf = useRef(0);

  const applyOffset = (x: number, y: number) => {
    offsetRef.current = { x, y };
    setOffset({ x, y });
  };

  const stopMomentum = () => {
    cancelAnimationFrame(momentumRaf.current);
  };

  const runMomentum = () => {
    const tick = () => {
      velocity.current.x *= MOMENTUM_DECAY;
      velocity.current.y *= MOMENTUM_DECAY;
      if (
        Math.abs(velocity.current.x) < MIN_VELOCITY &&
        Math.abs(velocity.current.y) < MIN_VELOCITY
      ) {
        return;
      }
      applyOffset(
        offsetRef.current.x + velocity.current.x,
        offsetRef.current.y + velocity.current.y
      );
      momentumRaf.current = requestAnimationFrame(tick);
    };
    momentumRaf.current = requestAnimationFrame(tick);
  };

  // Continuous ripple loop — runs the ENTIRE time the component is
  // mounted (not just while dragging), since the amplitude needs to keep
  // smoothly easing back down to 0 even after you've stopped. Reads the
  // same `velocity` ref the drag/momentum logic already maintains, so
  // there's no duplicate velocity tracking.
  useEffect(() => {
    const tick = () => {
      rippleRaf.current = requestAnimationFrame(tick);

      const speed = Math.hypot(velocity.current.x, velocity.current.y);
      const targetAmplitude = Math.min(RIPPLE_MAX_AMPLITUDE, speed * RIPPLE_SPEED_TO_AMPLITUDE);
      rippleAmplitude.current += (targetAmplitude - rippleAmplitude.current) * RIPPLE_EASE;
      ripplePhase.current += PHASE_SPEED;

      if (frameRef.current) {
        // Below this threshold the wave is visually flat anyway — skip
        // the (fairly expensive) polygon string rebuild and just clip to
        // a plain rectangle
        if (rippleAmplitude.current < 0.02) {
          frameRef.current.style.clipPath = 'none';
        } else {
          frameRef.current.style.clipPath = buildRipplePolygon(
            rippleAmplitude.current,
            ripplePhase.current
          );
        }
      }
    };
    rippleRaf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rippleRaf.current);
  }, []);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      dragging.current = true;
      stopMomentum();
      lastPointer.current = { x: e.clientX, y: e.clientY };
      velocity.current = { x: 0, y: 0 };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      velocity.current = { x: dx, y: dy };
      applyOffset(offsetRef.current.x + dx, offsetRef.current.y + dy);
    };

    const onPointerUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      runMomentum();
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      stopMomentum();
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  const wrappedX = ((offset.x % TILE_WIDTH) + TILE_WIDTH) % TILE_WIDTH;
  const wrappedY = ((offset.y % TILE_HEIGHT) + TILE_HEIGHT) % TILE_HEIGHT;

  const REPEAT_RANGE = [-2, -1, 0, 1, 2];

  return (
    <div
      ref={frameRef}
      className="fixed inset-0 overflow-hidden"
      style={{ backgroundColor: '#FFFFFF', cursor: 'grab', touchAction: 'none' }}
    >
      {REPEAT_RANGE.map((row) =>
        REPEAT_RANGE.map((col) => (
          <div
            key={`${row}-${col}`}
            className="absolute top-0 left-0"
            style={{
              width: TILE_WIDTH,
              height: TILE_HEIGHT,
              transform: `translate(${wrappedX + col * TILE_WIDTH}px, ${wrappedY + row * TILE_HEIGHT}px)`,
            }}
          >
            {PHOTOS.map((photo, i) => (
              <div
                key={i}
                className="absolute rounded-md shadow-2xl flex items-center justify-center select-none"
                style={{
                  left: photo.x,
                  top: photo.y,
                  width: photo.width,
                  height: photo.height,
                  backgroundColor: photo.color,
                }}
              >
                <span className="text-black/40 text-2xl font-semibold">{photo.label}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}