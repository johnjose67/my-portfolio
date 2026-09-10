'use client';

import { useEffect, useId, useRef } from 'react';
import { animate } from 'framer-motion';

type MorphBlurTextProps = {
  text: string;
  triggered: boolean;
  className?: string;
};

export default function MorphBlurText({ text, triggered, className = '' }: MorphBlurTextProps) {
  const uid = useId().replace(/:/g, '');
  const filterId = `morph-goo-${uid}`;
  const innerRef = useRef<HTMLDivElement>(null);
  const prevTriggered = useRef(triggered);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    if (triggered && !prevTriggered.current) {
      // Entrance: blurred + scaled down → sharp + full size, matching the
      // reference's 0% → 15% keyframe stretch
      animate(0, 1, {
        duration: 0.9,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (t) => {
          el.style.opacity = String(t);
          el.style.filter = `blur(${20 * (1 - t)}px)`;
          el.style.transform = `scale(${0.8 + 0.2 * t})`;
        },
      });
    } else if (!triggered && prevTriggered.current) {
      // Exit: sharp + full size → blurred + scaled UP (not back down) —
      // matching the reference's 45% → 50% stretch, which is what makes
      // the exit read as "dissolving forward" rather than just reversing
      // the entrance
      animate(0, 1, {
        duration: 0.7,
        ease: 'easeIn',
        onUpdate: (t) => {
          el.style.opacity = String(1 - t);
          el.style.filter = `blur(${20 * t}px)`;
          el.style.transform = `scale(${1 + 0.2 * t})`;
        },
      });
    }

    prevTriggered.current = triggered;
  }, [triggered]);

  return (
    <>
      {/* Hidden goo filter def — unique ID per instance via useId, so
          multiple MorphBlurText components on the page never collide */}
      <svg aria-hidden focusable="false" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id={filterId}>
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Goo filter sits statically on this OUTER wrapper — the animated
          blur happens on the inner element below, and the goo filter
          processes that blurred result, which is what gives it a
          "chunky/gooey" quality rather than a plain smooth camera blur */}
      <div style={{ filter: `url(#${filterId})` }}>
        <div
          ref={innerRef}
          className={className}
          style={{ opacity: triggered ? 1 : 0, willChange: 'transform, filter, opacity' }}
        >
          {text}
        </div>
      </div>
    </>
  );
}