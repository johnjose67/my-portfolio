import React from "react";

/**
 * CurvedFlipText
 * ----------------
 * Each letter is its own small "flap": a front (black) face and a back
 * (pink) face, stacked and flipped on the X axis, like a tiny coin.
 * On hover, every letter's flap rotates 180° — front rolls up and away,
 * back rolls in from the bottom to replace it (backface-visibility hides
 * each face once it turns past 90° and faces away from the viewer).
 *
 * Letters sit side by side using normal inline layout (not stacked on top
 * of each other), so the word reads correctly at rest. A light static
 * tilt/curve is layered on each letter independently of the flip, so the
 * word bows slightly like text sitting on a curved rim, without fighting
 * the hover transform for control of the same element.
 *
 * Each letter's flip has a slightly different transition-delay based on
 * its distance from the center of the word — that's what creates the
 * staggered "wrap/peel" look rather than every letter flipping in lockstep.
 *
 * Tuning knobs:
 *  - radius:      how far the front/back faces sit apart in depth (bigger = more pronounced flip/bulge)
 *  - arcDegrees:  how much the word curves/tilts at rest (bigger = more dramatic curve)
 *  - duration-700 below controls flip speed
 */
interface CurvedFlipTextProps {
  text: string;
  frontColor?: string;
  backColor?: string;
  radius?: number;
  arcDegrees?: number;
  fontClassName?: string;
  tiltFactor?: number; // how much each letter rotates to look "curved" — 0 = straight line
  bowFactor?: number; // how much edge letters dip/rise vertically — 0 = flat baseline
}

export default function CurvedFlipText({
  text,
  frontColor = "#000000",
  backColor = "#FC8EF1",
  radius = 16,
  arcDegrees = 22,
  fontClassName = "",
  tiltFactor = 0,
  bowFactor = 0,
}: CurvedFlipTextProps) {
  const letters: string[] = text.split("");
  const mid = (letters.length - 1) / 2;
  const step = letters.length > 1 ? arcDegrees / (letters.length - 1) : 0;

  return (
    <span
      className={`absolute inset-0 flex items-center justify-center ${fontClassName}`}
      style={{ perspective: "600px" }}
    >
      {letters.map((ch: string, i: number) => {
        const angle = (i - mid) * step; // this letter's position along the arc, at rest
        const distFromCenter = mid ? Math.abs(i - mid) / mid : 0; // 0 at center, 1 at edges
        const delay = distFromCenter * 20; // ms stagger — outer letters lag behind center

        return (
          // Outer span: static curve/tilt only. Kept separate from the flip
          // so its inline `transform` never overwrites the hover transform below.
          <span
            key={i}
            className="relative inline-block [transform-style:preserve-3d]"
            style={{
              transform: `rotateZ(${angle * tiltFactor}deg) translateY(${
                angle * angle * bowFactor
              }px)`,
            }}
          >
            {/* Inner span: the actual flip. No inline `transform` here on
                purpose — group-hover:[...] fully controls this element. */}
            <span
              className="relative block [transform-style:preserve-3d] transition-transform duration-700 ease-in-out group-hover:[transform:rotateX(180deg)]"
              style={{ transitionDelay: `${delay}ms` }}
            >
              {/* front face — black */}
              <span
                className="block [backface-visibility:hidden]"
                style={{
                  color: frontColor,
                  transform: `translateZ(${radius}px)`,
                }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>

              {/* back face — pink, pre-rotated so it only faces the viewer
                  once the parent has flipped past 90° */}
              <span
                className="absolute inset-0 [backface-visibility:hidden]"
                style={{
                  color: backColor,
                  transform: `rotateX(180deg) translateZ(${radius}px)`,
                }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            </span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * Preview only — not used by page.js. Shows CurvedFlipText inside a static
 * ellipse outline the same way your Home nav pills use it.
 */
export function EllipseButtonPreview() {
  const buttons = [
    { label: "Projects", radius: 16, arcDegrees: 22 },
    { label: "Contact", radius: 14, arcDegrees: 26 },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center gap-10 bg-white">
      {buttons.map((btn) => (
        <a
          key={btn.label}
          href="#"
          className="group relative inline-flex h-16 w-44 items-center justify-center"
        >
          <svg
            viewBox="0 0 176 64"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <ellipse
              cx="88"
              cy="32"
              rx="86"
              ry="30"
              fill="none"
              stroke="#000000"
              strokeWidth="1.5"
            />
          </svg>

          <CurvedFlipText
            text={btn.label}
            frontColor="#000000"
            backColor="#FC8EF1"
            radius={btn.radius}
            arcDegrees={btn.arcDegrees}
            fontClassName="text-sm font-medium tracking-wide"
          />
        </a>
      ))}
    </div>
  );
}