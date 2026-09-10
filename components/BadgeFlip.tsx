'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

export type BadgeFlipHandle = {
  flip: () => Promise<void>;
};

type BadgeFlipProps = {
  frontSrc: string;
  frontAlt: string;
  backSrc: string;
  backAlt: string;
  width: number;
  height: number;
  radius?: number; // px — how far each face is pushed out from the pivot, same idea as CurvedFlipText
  duration?: number; // ms
};

const BadgeFlip = forwardRef<BadgeFlipHandle, BadgeFlipProps>(function BadgeFlip(
  { frontSrc, frontAlt, backSrc, backAlt, width, height, radius = 16, duration = 700 },
  ref
) {
  const [flipped, setFlipped] = useState(false);

  useImperativeHandle(ref, () => ({
    flip: () => {
      return new Promise<void>((resolve) => {
        setFlipped(true);
        setTimeout(resolve, duration);
      });
    },
  }));

  return (
    <div
      className="relative"
      style={{ width, height, perspective: 1200 }}
    >
      {/* The flip itself — exactly CurvedFlipText's inner span, just sized
          to the badge instead of one letter, and toggled via state
          instead of group-hover */}
      <div
        className="relative w-full h-full [transform-style:preserve-3d] transition-transform ease-in-out"
        style={{
          transitionDuration: `${duration}ms`,
          transform: flipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
        }}
      >
        {/* Front face — Home-Name-Tag.png */}
        <div
          className="absolute inset-0 [backface-visibility:hidden]"
          style={{ transform: `translateZ(${radius}px)` }}
        >
          <img
            src={frontSrc}
            alt={frontAlt}
            draggable={false}
            className="w-full h-full object-contain select-none"
          />
        </div>

        {/* Back face — Projects.png, pre-rotated so it only faces the
            viewer once the parent has rotated past 90° */}
        <div
          className="absolute inset-0 [backface-visibility:hidden]"
          style={{ transform: `rotateX(180deg) translateZ(${radius}px)` }}
        >
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

export default BadgeFlip;