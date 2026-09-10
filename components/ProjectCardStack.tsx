'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import LetterRevealLines from './LetterRevealLines';
import ImageRevealUp from './ImageRevealUp';

export type ProjectCardStackHandle = {
  exitDown: () => Promise<void>;
  nextCard: () => void;
  prevCard: () => void;
};

type CardData = { src: string; alt: string; href: string };

// Placeholder hrefs — swap these for real case-study destinations later.
const CARDS: CardData[] = [
  { src: '/images/project-1.png', alt: 'Project 1', href: '#' },
  { src: '/images/project-2.png', alt: 'Project 2', href: '#' },
  { src: '/images/project-3.png', alt: 'Project 3', href: '#' },
  { src: '/images/project-4.png', alt: 'Project 4', href: '#' },
];

const CARD_WIDTH = 1125;
const CARD_HEIGHT = 730; // matches project-1.png's real aspect ratio (2252×1462 ≈ 1.540:1) exactly, so nothing gets cropped
const TILT_DEG = 26; // how tilted a card is while still below center, rotating upright as it arrives
const WHEEL_SENSITIVITY = 0.0006; // lower = less sensitive, more scrolling needed per card
// Higher = catches up to the target faster (snappier); lower = smoother,
// more cinematic lag. This is now a rate (per second), not a per-frame
// fraction, so it behaves identically on 60Hz and 120Hz screens alike.
const EASE_RATE = 6;

// "7% distance from project-1.png" = 7% of the card's own width
const SIDE_GAP = CARD_WIDTH * 0.07; // 78.75px
const SIDE_OFFSET = CARD_WIDTH / 2 + SIDE_GAP; // 787.5px from screen center

const WRITEWAY_LINES = [
  'Writeway is an online book publishing firm',
  'that specializes in making the publishing',
  'process easy and efficient for authors. The',
  'team at Writeway, through their personalized',
  'hands-on approach, guides authors through',
  'every step, ensuring a seamless journey from',
  'manuscript to publication.',
];

// Only applies below center (rel < 0) — tilted while still rising from
// below, perfectly upright by the time it reaches rel 0. Cards already
// past center (the receding stack) stay flat, untouched by this.
function tiltFor(rel: number) {
  return rel < 0 ? -TILT_DEG * Math.max(-1, rel) : 0;
}

// The receding stack, as a small table: how far a card is from being
// centered (`rel`) maps to its scale and vertical offset. Interpolated
// smoothly between these points — since it's a pure function of `rel`,
// scrolling backward automatically retraces the same curve in reverse,
// with no separate rewind logic needed.
//   rel -1 : waiting below, off-screen, full size
//   rel  0 : centered, full size — the active card
//   rel  1 : first stacked tier — fully visible, 90% size, just above center
//   rel  2 : second stacked tier — 80% size, clipped at the top edge
//   rel  3 : fully exited above, gone
const TIERS = [
  { rel: -1, scale: 1, y: 240 },
  { rel: 0, scale: 1, y: 0 },
  { rel: 1, scale: 0.9, y: -50 },
  { rel: 2, scale: 0.8, y: -90 },
  { rel: 3, scale: 0.7, y: -160 },
];

function tierAt(rel: number) {
  const r = Math.max(TIERS[0].rel, Math.min(TIERS[TIERS.length - 1].rel, rel));
  for (let k = 0; k < TIERS.length - 1; k++) {
    const a = TIERS[k];
    const b = TIERS[k + 1];
    if (r >= a.rel && r <= b.rel) {
      const t = (r - a.rel) / (b.rel - a.rel);
      return { scale: a.scale + (b.scale - a.scale) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return TIERS[TIERS.length - 1];
}

const ProjectCardStack = forwardRef<ProjectCardStackHandle>(function ProjectCardStack(_, ref) {
  const [progress, setProgress] = useState(-1);
  const currentRef = useRef(-1);
  const targetRef = useRef(-1);
  const introDone = useRef(false);

  const [exiting, setExiting] = useState(false);
  const [exitT, setExitT] = useState(0);
  const startRelsRef = useRef<number[]>(CARDS.map(() => -1));

  // Intro: rises smoothly and slowly from below, decelerating gently into
  // place — pure ease-out, no overshoot/bounce
  useEffect(() => {
    const controls = animate(-1, 0, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        currentRef.current = v;
        targetRef.current = v;
        setProgress(v);
      },
      onComplete: () => {
        introDone.current = true;
      },
    });

    let raf = 0;
    let lastTime = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - lastTime) / 1000, 1 / 30); // cap dt so a dropped/slow frame can't cause a visible jump
      lastTime = now;
      if (!introDone.current || exiting) return;
      const diff = targetRef.current - currentRef.current;
      // Time-based exponential ease — converges at the same real-world
      // speed regardless of the display's refresh rate, unlike a fixed
      // per-frame multiplier (which would ease twice as fast on a 120Hz
      // screen as on a 60Hz one)
      const factor = 1 - Math.exp(-EASE_RATE * dt);
      currentRef.current += diff * factor;
      if (Math.abs(diff) < 0.0008) currentRef.current = targetRef.current;
      setProgress(currentRef.current);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      controls.stop();
      cancelAnimationFrame(raf);
    };
  }, [exiting]);

  // Wheel input can move progress in EITHER direction (forward into new
  // cards, backward into the stack) — the clamp just keeps it within the
  // valid 0..CARDS.length-1 range; the tier table handles both directions
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!introDone.current || exiting) return;
      const next = Math.min(
        CARDS.length - 1,
        Math.max(0, targetRef.current + e.deltaY * WHEEL_SENSITIVITY)
      );
      targetRef.current = next;
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [exiting]);

  useImperativeHandle(ref, () => ({
    exitDown: () => {
      return new Promise<void>((resolve) => {
        startRelsRef.current = CARDS.map((_, i) =>
          Math.max(TIERS[0].rel, Math.min(TIERS[TIERS.length - 1].rel, currentRef.current - i))
        );
        setExiting(true);
        animate(0, 1, {
          duration: 0.7,
          ease: 'easeIn',
          onUpdate: (t) => setExitT(t),
          onComplete: resolve,
        });
      });
    },
    // Same clamp and same underlying motion as wheel input — just moves
    // the target by exactly one card per click, rather than by a
    // scroll-proportional amount
    nextCard: () => {
      if (!introDone.current || exiting) return;
      targetRef.current = Math.min(CARDS.length - 1, targetRef.current + 1);
    },
    prevCard: () => {
      if (!introDone.current || exiting) return;
      targetRef.current = Math.max(0, targetRef.current - 1);
    },
  }));

  // Card 0's own distance from center — drives the side content. Triggers
  // once it's essentially arrived at center, and stays visible while it
  // remains the active/nearby card.
  const card0Rel = progress - 0;
  const showSideContent = !exiting && card0Rel > -0.15 && card0Rel < 0.6;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center overflow-hidden" style={{ perspective: 1400, pointerEvents: 'none' }}>
      {/* Right side — Writeway description, letter-by-letter reveal */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ left: `calc(50% + ${SIDE_OFFSET}px)`, zIndex: 500 }}
      >
        <LetterRevealLines
          lines={WRITEWAY_LINES}
          triggered={showSideContent}
          className="text-black text-[20px] leading-[20px] tracking-[0.48px] uppercase text-left font-[family-name:var(--font-thermochrome)] font-semibold"
        />
      </div>

      {/* Left side — writewaytext.png, revealed via an upward-growing mask */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ right: `calc(50% + ${SIDE_OFFSET}px)`, zIndex: 500 }}
      >
        <ImageRevealUp src="/images/writewaytext.png" alt="Writeway" triggered={showSideContent} width={350} />
      </div>

      {CARDS.map((card, i) => {
        if (exiting) {
          // exitDown reuses the SAME tilt rule — since its rel also passes
          // down through the negative range on its way to -1, cards
          // naturally tilt as they descend below center, symmetric with
          // how they tilted rising into place originally
          const rel = startRelsRef.current[i] + (-1 - startRelsRef.current[i]) * exitT;
          const translateY = -240 * rel;
          const rotateX = tiltFor(rel);
          return (
            <a
              key={i}
              href={card.href}
              className="absolute cursor-pointer overflow-hidden"
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                zIndex: 1000 + i,
                transform: `translateY(${translateY}%) rotateX(${rotateX}deg)`,
                pointerEvents: 'auto',
              }}
            >
              <img
                src={card.src}
                alt={card.alt}
                draggable={false}
                className="w-full h-full object-cover select-none"
              />
            </a>
          );
        }

        const rel = progress - i;
        const { scale, y } = tierAt(rel);
        const rotateX = tiltFor(rel);

        return (
          <a
            key={i}
            href={card.href}
            className="absolute cursor-pointer overflow-hidden"
            style={{
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              zIndex: 1000 + i, // later cards (more recently centered) always render above older, receded ones
              transform: `translateY(${y}%) scale(${scale}) rotateX(${rotateX}deg)`,
              pointerEvents: 'auto',
            }}
          >
            <img
              src={card.src}
              alt={card.alt}
              draggable={false}
              className="w-full h-full object-cover select-none"
            />
          </a>
        );
      })}
    </div>
  );
});

export default ProjectCardStack;