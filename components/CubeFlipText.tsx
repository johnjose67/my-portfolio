'use client';

type CubeFlipTextProps = {
  text: string;
  frontColor?: string;
  bottomColor?: string;
  fontClassName?: string;
  depth?: number; // px — how far each face is pushed out from the cube's center pivot
  duration?: number; // ms
  triggered?: boolean; // when passed, controls the flip directly instead of relying on CSS :hover — for tap-driven mobile use
};

export default function CubeFlipText({
  text,
  frontColor = '#000000',
  bottomColor = '#FC8EF1',
  fontClassName = '',
  depth = 12,
  duration = 450,
  triggered,
}: CubeFlipTextProps) {
  if (!text) return null;

  const isControlled = triggered !== undefined;

  return (
    <span className="relative inline-block" style={{ perspective: 300 }}>
      {/* The cube itself — only THIS element's rotation is animated.
          Each face inside keeps a fixed local transform representing its
          position on the cube; rotating the whole cube is what makes the
          faces swing, not animating them individually.
          Uncontrolled (desktop): CSS .group:hover fully controls this.
          Controlled (mobile): `triggered` drives an explicit inline
          transform instead, bypassing hover entirely. */}
      <span
        className="cube-wrap relative inline-block [transform-style:preserve-3d]"
        style={{
          '--dur': `${duration}ms`,
          ...(isControlled
            ? { transform: `rotateX(${triggered ? 90 : 0}deg)`, transition: `transform ${duration}ms ease-in-out` }
            : {}),
        } as React.CSSProperties}
      >
        {/* Front face — normal document flow, so it's what actually
            establishes the box's real width/height from the text itself.
            Fades out as it rotates away. */}
        <span
          className={`cube-face-front inline-block [backface-visibility:hidden] ${fontClassName}`}
          style={{
            color: frontColor,
            transform: `translateZ(${depth}px)`,
            whiteSpace: 'pre',
            ...(isControlled ? { opacity: triggered ? 0 : 1, transition: `opacity ${duration}ms ease-in-out` } : {}),
          }}
        >
          {text}
        </span>

        {/* Bottom face — sits at rotateX(-90deg), which points it downward
            and hides it below the front face at rest. Absolutely
            positioned to exactly overlay the front face's box. Fades in
            as it rotates into view. */}
        <span
          className={`cube-face-bottom absolute inset-0 flex items-center justify-center [backface-visibility:hidden] ${fontClassName}`}
          style={{
            color: bottomColor,
            transform: `rotateX(-90deg) translateZ(${depth}px)`,
            whiteSpace: 'pre',
            ...(isControlled ? { opacity: triggered ? 1 : 0, transition: `opacity ${duration}ms ease-in-out` } : {}),
          }}
        >
          {text}
        </span>
      </span>

      <style jsx>{`
        .cube-wrap {
          transform: rotateX(0deg);
          transition: transform var(--dur) ease-in-out;
        }
        :global(.group:hover) .cube-wrap {
          transform: rotateX(90deg);
        }
        .cube-face-front {
          opacity: 1;
          transition: opacity var(--dur) ease-in-out;
        }
        .cube-face-bottom {
          opacity: 0;
          transition: opacity var(--dur) ease-in-out;
        }
        /* Same transition, reversed target values — this is what makes
           the fade work identically in both directions: front fades out
           / bottom fades in on hover, and the reverse happens for free
           when the cursor leaves, since it's just the same transition
           easing back to its rest values. */
        :global(.group:hover) .cube-face-front {
          opacity: 0;
        }
        :global(.group:hover) .cube-face-bottom {
          opacity: 1;
        }
      `}</style>
    </span>
  );
}