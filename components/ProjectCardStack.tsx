'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import MorphBlurText from './MorphBlurText';
import ImageRevealUp from './ImageRevealUp';
import ViewProjectLabel from './ViewProjectLabel';
import LoopingFlipImage from './LoopingFlipImage';

export type ProjectCardStackHandle = {
  exitDown: () => Promise<void>;
  nextCard: () => void;
  prevCard: () => void;
};

type CardData = { src: string; alt: string; href: string };

// Placeholder hrefs — swap these for real case-study destinations later.
const CARDS: CardData[] = [
  { src: '/images/project-1.png', alt: 'Project 1', href: 'https://pitch.com/public/f8813b6f-5fc7-4b3d-a791-d68b8b5bdda0/d61bc874-b160-4286-a9a1-cbc868078606' },
  { src: '/images/project-2.png', alt: 'Project 2', href: 'https://pitch.com/public/e8bc97d2-cf7a-4d5e-af27-20ad1671754f/76c032b6-fc48-4e42-bb2b-0d6be078e997' },
  { src: '/images/project-3.png', alt: 'Project 3', href: 'https://www.behance.net/gallery/177080617/Trax-eBike-Ecommerce-App' },
  { src: '/images/project-4.png', alt: 'Project 4', href: 'https://www.behance.net/gallery/180135813/UI-Revamp-Tech-Media-Company' },
];

const CARD_WIDTH = 1125;
const CARD_HEIGHT = 730; // matches project-1.png's real aspect ratio (2252×1462 ≈ 1.540:1) exactly, so nothing gets cropped
const TILT_DEG = 26; // how tilted a card is while still below center, rotating upright as it arrives
const WHEEL_SENSITIVITY = 0.0006; // lower = less sensitive, more scrolling needed per card
// Higher = catches up to the target faster (snappier); lower = smoother,
// more cinematic lag. This is now a rate (per second), not a per-frame
// fraction, so it behaves identically on 60Hz and 120Hz screens alike.
const EASE_RATE = 9;

// The desktop page wraps everything in transform: scale(0.67) (see
// app/projects/page.tsx's <main>). Mouse coordinates from getBoundingClientRect()
// are in real screen pixels (post-scale), but this card's own left/top
// positioning happens in its unscaled internal space — dividing by this
// factor converts between the two. See the onMouseMove comment below for
// the full explanation.
const DESKTOP_SCALE = 0.67;

// "7% distance from project-1.png" = 7% of the card's own width
const SIDE_GAP = CARD_WIDTH * 0.07; // 78.75px
const SIDE_OFFSET = CARD_WIDTH / 2 + SIDE_GAP; // 787.5px from screen center

const WRITEWAY_TEXT =
  'Writeway is an online book publishing firm that specializes in making the publishing process easy and efficient for authors.';

const HAMAD_TEXT =
  'An app designed to enhance both the travel and meet-and-greet experience for airline passengers and their greeters.';

const TRAX_TEXT =
  'TRAX is an e-commerce app that targets e-bike enthusiasts to purchase e-bikes and customize them according to their preferences.';

const BEEBOM_TEXT =
  'Beebom is a leading tech platform that delivers the latest news, in-depth reviews, and quality videos to help consumers navigate technology.';

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

  // Which card (if any) is currently hovered, and where the cursor is
  // within it — drives the "[ VIEW PROJECT ]" cursor-following label.
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Scroll hint (scroll.png) — same appear/dismiss logic as mobile:
  // appears once card 1 has fully arrived, then is PERMANENTLY
  // dismissed the first time the user interacts (here: the first wheel
  // scroll, or exiting) — never comes back, even scrolling back to
  // card 0 later.
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [scrollHintDismissed, setScrollHintDismissed] = useState(false);

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
        setShowScrollHint(true);
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
      setScrollHintDismissed(true); // one-way latch — first scroll, gone for good (safe to call every event: setState to the same value is a no-op after the first)
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
        setScrollHintDismissed(true); // card is about to pass over/down through it — dismiss now, same as a scroll does
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
      setScrollHintDismissed(true);
      targetRef.current = Math.min(CARDS.length - 1, targetRef.current + 1);
    },
    prevCard: () => {
      if (!introDone.current || exiting) return;
      setScrollHintDismissed(true);
      targetRef.current = Math.max(0, targetRef.current - 1);
    },
  }));

  // Each card's own distance from center drives its side content. Uses a
  // single clean cutover point (progress = 0.5, the midpoint between
  // card 0 and card 1) rather than two overlapping ranges — overlapping
  // ranges meant both stayed visible together for as long as you lingered
  // in that zone, which read as cluttered rather than a handoff. The
  // 800ms opacity/filter transition on each still provides a brief,
  // natural smoothing right at the crossover, without the sustained
  // simultaneous overlap.
  const card0Rel = progress - 0;
  const card1Rel = progress - 1;
  const card2Rel = progress - 2;
  const card3Rel = progress - 3;
  const showWriteway = !exiting && progress < 0.5 && card0Rel > -0.15;
  const showHamad = !exiting && progress >= 0.5 && progress < 1.5 && card1Rel < 0.6;
  const showTrax = !exiting && progress >= 1.5 && progress < 2.5 && card2Rel < 0.6;
  const showBeebom = !exiting && progress >= 2.5 && card3Rel < 0.6;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center overflow-hidden" style={{ perspective: 1400, pointerEvents: 'none' }}>
      {/* Right side, text — Writeway (project-1). MorphBlurText handles
          its own opacity/blur/scale internally — this outer div is now
          purely for position/layout. */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          left: `calc(50% + ${SIDE_OFFSET}px)`,
          width: '15vw',
          zIndex: 500,
          pointerEvents: showWriteway ? 'auto' : 'none',
        }}
      >
        <MorphBlurText
          text={WRITEWAY_TEXT}
          triggered={showWriteway}
          className="text-black text-[20px] leading-[20px] tracking-[0.48px] uppercase text-left font-[family-name:var(--font-thermochrome)] font-semibold"
        />
      </div>

      {/* Left side, image — Writeway (project-1) */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ right: `calc(50% + ${SIDE_OFFSET}px)`, zIndex: 500 }}
      >
        <ImageRevealUp src="/images/writewaytext.png" alt="Writeway" triggered={showWriteway} width={350} />
      </div>

      {/* Right side, text — Hamad International Airport (project-2). Same
          position, same sizing, same style as Writeway's — only the
          content and trigger differ. */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          left: `calc(50% + ${SIDE_OFFSET}px)`,
          width: '15vw',
          zIndex: 500,
          pointerEvents: showHamad ? 'auto' : 'none',
        }}
      >
        <MorphBlurText
          text={HAMAD_TEXT}
          triggered={showHamad}
          className="text-black text-[20px] leading-[20px] tracking-[0.48px] uppercase text-left font-[family-name:var(--font-thermochrome)] font-semibold"
        />
      </div>

      {/* Left side, image — Hamad International Airport (project-2) */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ right: `calc(50% + ${SIDE_OFFSET}px)`, zIndex: 500 }}
      >
        <ImageRevealUp src="/images/hiatext.png" alt="Hamad International Airport" triggered={showHamad} width={350} />
      </div>

      {/* Right side, text — TRAX (project-3). Same position, sizing, and
          style as the previous two — only content and trigger differ. */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          left: `calc(50% + ${SIDE_OFFSET}px)`,
          width: '15vw',
          zIndex: 500,
          pointerEvents: showTrax ? 'auto' : 'none',
        }}
      >
        <MorphBlurText
          text={TRAX_TEXT}
          triggered={showTrax}
          className="text-black text-[20px] leading-[20px] tracking-[0.48px] uppercase text-left font-[family-name:var(--font-thermochrome)] font-semibold"
        />
      </div>

      {/* Left side, image — TRAX (project-3) */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ right: `calc(50% + ${SIDE_OFFSET}px)`, zIndex: 500 }}
      >
        <ImageRevealUp src="/images/traxtext.png" alt="TRAX" triggered={showTrax} width={350} />
      </div>

      {/* Right side, text — Beebom (project-4). Same position, sizing,
          and style as the previous three — only content and trigger
          differ. */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          left: `calc(50% + ${SIDE_OFFSET}px)`,
          width: '15vw',
          zIndex: 500,
          pointerEvents: showBeebom ? 'auto' : 'none',
        }}
      >
        <MorphBlurText
          text={BEEBOM_TEXT}
          triggered={showBeebom}
          className="text-black text-[20px] leading-[20px] tracking-[0.48px] uppercase text-left font-[family-name:var(--font-thermochrome)] font-semibold"
        />
      </div>

      {/* Left side, image — Beebom (project-4) */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ right: `calc(50% + ${SIDE_OFFSET}px)`, zIndex: 500 }}
      >
        <ImageRevealUp src="/images/beebomtext.png" alt="Beebom" triggered={showBeebom} width={350} />
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
              target="_blank"
              rel="noopener noreferrer"
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
            target="_blank"
            rel="noopener noreferrer"
            className="absolute cursor-pointer overflow-hidden"
            style={{
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              zIndex: 1000 + i, // later cards (more recently centered) always render above older, receded ones
              transform: `translateY(${y}%) scale(${scale}) rotateX(${rotateX}deg)`,
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              setHoveredCard(i);
              // Computed here too, not just in onMouseMove below — without
              // this, the label became visible immediately on enter but
              // sat at whatever stale position cursorPos last held (from
              // a previous card, or the initial default), only catching
              // up to the real cursor once the first onMouseMove fired.
              // Divided by DESKTOP_SCALE for the reason explained below.
              const rect = e.currentTarget.getBoundingClientRect();
              setCursorPos({ x: (e.clientX - rect.left) / DESKTOP_SCALE, y: (e.clientY - rect.top) / DESKTOP_SCALE });
              // Hides the global pixelated cursor while over a card — it
              // was making the label feel disconnected/far from the
              // actual pointer, since there were two competing visual
              // indicators at once. See AsciiCursor.tsx for the other
              // side of this (a class-check inside its animation loop).
              document.body.classList.add('hide-ascii-cursor');
            }}
            onMouseLeave={() => {
              setHoveredCard(null);
              document.body.classList.remove('hide-ascii-cursor');
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              // getBoundingClientRect() measures the card's actual VISUAL
              // (post scale(0.67)) size in real screen pixels, but the
              // label's left/top below get interpreted in the card's own
              // UNSCALED internal coordinate space (1125×730), which then
              // gets scaled down by 0.67 again on render — double-scaling
              // the effective position. Dividing by DESKTOP_SCALE here
              // converts the screen-pixel delta back into that unscaled
              // space, so the label lands exactly where the cursor
              // visually is, not proportionally pulled toward the corner.
              setCursorPos({ x: (e.clientX - rect.left) / DESKTOP_SCALE, y: (e.clientY - rect.top) / DESKTOP_SCALE });
            }}
          >
            <img
              src={card.src}
              alt={card.alt}
              draggable={false}
              className="w-full h-full object-cover select-none"
            />
            <ViewProjectLabel active={hoveredCard === i} x={cursorPos.x} y={cursorPos.y} />
          </a>
        );
      })}

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 flex justify-center pointer-events-none">
        <LoopingFlipImage
          src="/images/scroll.png"
          alt="Scroll"
          visible={showScrollHint && !scrollHintDismissed}
          width={80}
          pauseDuration={2500}
        />
      </div>
    </div>
  );
});

export default ProjectCardStack;