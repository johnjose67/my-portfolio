'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import MorphBlurText from './MorphBlurText';
import ImageRevealUp from './ImageRevealUp';
import BadgeDissolve, { type BadgeDissolveHandle } from './BadgeDissolve';
import LoopingFlipImage from './LoopingFlipImage';

export type MobileProjectCardStackHandle = {
  exitDown: () => Promise<void>;
  dissolveBadge: () => Promise<void>;
};

type CardData = { src: string; alt: string; href: string };

const CARDS: CardData[] = [
  { src: '/images/projectmobile-1.png', alt: 'Project 1', href: 'https://pitch.com/public/f8813b6f-5fc7-4b3d-a791-d68b8b5bdda0/d61bc874-b160-4286-a9a1-cbc868078606' },
  { src: '/images/projectmobile-2.png', alt: 'Project 2', href: 'https://pitch.com/public/e8bc97d2-cf7a-4d5e-af27-20ad1671754f/76c032b6-fc48-4e42-bb2b-0d6be078e997' },
  { src: '/images/projectmobile-3.png', alt: 'Project 3', href: 'https://www.behance.net/gallery/177080617/Trax-eBike-Ecommerce-App' },
  { src: '/images/projectmobile-4.png', alt: 'Project 4', href: 'https://www.behance.net/gallery/180135813/UI-Revamp-Tech-Media-Company' },
];

// Card sizing — confirmed from the actual projectmobile-1.png file
// (666×777px, a portrait ratio), not desktop's landscape cards.
const CARD_WIDTH_VW = 80; // 100vw - 5% - 5% margin each side
const CARD_ASPECT = 0.857;
const TILT_DEG = 26;
const SWIPE_THRESHOLD = 15; // px — "slightest swipe" trigger distance; once a swipe crosses this, it commits to advancing one full card (not proportional to how far you swipe)
// EASE_RATE removed — replaced by CARD_TRANSITION_DURATION (a fixed
// per-swipe duration) below, since the old continuous-rate approach
// could finish faster or slower depending on how much distance
// remained from an interrupted previous animation.

// Identical tier table to desktop. Percentages here are relative to the
// CARD's own height, not the container — so as long as the card layer
// itself isn't clipped (no overflow-hidden on a small box), a receding
// card genuinely travels far enough to exit past the top of the screen,
// same as it does on desktop.
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

function tiltFor(rel: number) {
  return rel < 0 ? -TILT_DEG * Math.max(-1, rel) : 0;
}

// Mobile-specific title graphics — different files from desktop's
// writewaytext.png/hiatext.png/traxtext.png/beebomtext.png, which stay
// untouched and are still used on the desktop page.
const WRITEWAY_TITLE = '/images/writewaytextmobile.png';
const WRITEWAY_TEXT =
  'Writeway is an online book publishing firm that specializes in making the publishing process easy and efficient for authors.';

const HAMAD_TITLE = '/images/hiatextmobile.png';
const HAMAD_TEXT =
  'An app designed to enhance both the travel and meet-and-greet experience for airline passengers and their greeters.';

const TRAX_TITLE = '/images/traxtextmobile.png';
const TRAX_TEXT =
  'TRAX is an e-commerce app that targets e-bike enthusiasts to purchase e-bikes and customize them according to their preferences.';

const BEEBOM_TITLE = '/images/beebomtextmobile.png';
const BEEBOM_TEXT =
  'Beebom is a leading tech platform that delivers the latest news, in-depth reviews, and quality videos to help consumers navigate technology.';

// All four title graphics now share identical dimensions (1176×298px,
// ratio 3.946) — re-exported consistently, so a single shared width
// works correctly for all of them, same as before this needed a
// per-title workaround.
const TITLE_WIDTH = 220;
const TITLE_ASPECT = 3.9463; // all four title images now share this exact ratio
const TITLE_HEIGHT = TITLE_WIDTH / TITLE_ASPECT; // ≈55.75px — the container below uses this directly, so it reserves exactly enough space (no more, no less) for elements after it, since its children are position:absolute and wouldn't otherwise contribute any height on their own

const PROJECTS = [
  { title: WRITEWAY_TITLE, text: WRITEWAY_TEXT },
  { title: HAMAD_TITLE, text: HAMAD_TEXT },
  { title: TRAX_TITLE, text: TRAX_TEXT },
  { title: BEEBOM_TITLE, text: BEEBOM_TEXT },
];

const MobileProjectCardStack = forwardRef<MobileProjectCardStackHandle>(function MobileProjectCardStack(_, ref) {
  const [progress, setProgress] = useState(-1);
  const currentRef = useRef(-1);
  const targetRef = useRef(-1);
  const introDone = useRef(false);
  const cardAnimRef = useRef<ReturnType<typeof animate> | null>(null); // tracks the in-flight swipe transition, so a new swipe can cleanly stop the previous one rather than the two fighting over currentRef.current

  const badgeRef = useRef<BadgeDissolveHandle>(null);

  // Scroll hint (scroll.png): appears once card 1 has arrived, then is
  // PERMANENTLY dismissed the first time the user swipes — never comes
  // back, even if they swipe back down to card 0 later.
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [scrollHintDismissed, setScrollHintDismissed] = useState(false);

  const [exiting, setExiting] = useState(false);
  const [exitT, setExitT] = useState(0);
  const startRelsRef = useRef<number[]>(CARDS.map(() => -1));

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

    return () => {
      controls.stop();
      cardAnimRef.current?.stop();
    };
  }, [exiting]);

  // Runs a single card-to-card transition over a FIXED duration,
  // regardless of the starting position — this is what makes every
  // swipe take the same amount of time, even if it interrupts a still-
  // settling previous swipe (which is what previously made swipe-down
  // look faster: less remaining distance at the same easing RATE meant
  // less absolute time to finish, even though the curve itself was
  // identical).
  const CARD_TRANSITION_DURATION = 0.5; // seconds — same for every swipe, either direction
  const goToCard = (target: number) => {
    cardAnimRef.current?.stop();
    targetRef.current = target;
    cardAnimRef.current = animate(currentRef.current, target, {
      duration: CARD_TRANSITION_DURATION,
      ease: [0.16, 0.46, 0.45, 0.94],
      onUpdate: (v) => {
        currentRef.current = v;
        setProgress(v);
      },
    });
  };

  useEffect(() => {
    let touchStartY = 0;
    let hasTriggered = false; // ensures ONE continuous finger-drag only advances a single card, even though touchmove fires many times past the threshold

    const onTouchStart = (e: TouchEvent) => {
      if (!introDone.current || exiting) return;
      touchStartY = e.touches[0].clientY;
      hasTriggered = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!introDone.current || exiting || hasTriggered) return;
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY; // positive = swiping up

      if (Math.abs(deltaY) >= SWIPE_THRESHOLD) {
        hasTriggered = true;
        setScrollHintDismissed(true); // one-way latch — first swipe, gone for good
        // Rounds to the card currently nearest rest, then steps exactly
        // one card in the swiped direction.
        const nearestCard = Math.round(currentRef.current);
        const nextCard =
          deltaY > 0
            ? Math.min(CARDS.length - 1, nearestCard + 1) // swipe up → next card
            : Math.max(0, nearestCard - 1); // swipe down → previous card
        goToCard(nextCard);
      }
    };

    const onTouchEnd = () => {
      // Nothing to do here — hasTriggered resets on the next touchstart.
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [exiting]);

  useImperativeHandle(ref, () => ({
    exitDown: () => {
      return new Promise<void>((resolve) => {
        startRelsRef.current = CARDS.map((_, i) =>
          Math.max(TIERS[0].rel, Math.min(TIERS[TIERS.length - 1].rel, currentRef.current - i))
        );
        setExiting(true);
        setScrollHintDismissed(true); // card is about to pass over/down through it — dismiss now, same as a swipe does
        animate(0, 1, {
          duration: 0.7,
          ease: 'easeIn',
          onUpdate: (t) => setExitT(t),
          onComplete: resolve,
        });
      });
    },
    dissolveBadge: () => {
      return badgeRef.current?.dissolve() ?? Promise.resolve();
    },
  }));

  // Badge fades out gradually as the first card rises over it. progress runs
  // -1 -> 0 during the intro; the fade spans the last BADGE_FADE_RANGE of that.
  // Full opacity again once the exit starts (cards slide down and uncover it).
  const BADGE_FADE_RANGE = 0.6; // larger = fade starts earlier / lasts longer
  const badgeOpacity = exiting ? 1 : Math.max(0, Math.min(1, -progress / BADGE_FADE_RANGE));

  const card0Rel = progress - 0;
  const card1Rel = progress - 1;
  const card2Rel = progress - 2;
  const card3Rel = progress - 3;
  const showFlags = [
    !exiting && progress < 0.5 && card0Rel > -0.15,
    !exiting && progress >= 0.5 && progress < 1.5 && card1Rel < 0.6,
    !exiting && progress >= 1.5 && progress < 2.5 && card2Rel < 0.6,
    !exiting && progress >= 2.5 && card3Rel < 0.6,
  ];

  return (
    <>
      {/* Persistent Projects.png — stays mounted permanently, no
          explicit "hide now" trigger at all. Sits at z-20, BELOW the
          card layer's z-30, so once the first card arrives it's simply
          covered naturally by whatever's rendering on top of it — there's
          no discrete state-toggle moment that could mistime relative to
          the card's actual visual coverage, which is what caused the
          "hidden before the card gets there" issue with the previous
          version. */}
      <div
        className="absolute inset-0 z-20 flex flex-col items-center min-h-0 pointer-events-none"
        style={{ opacity: badgeOpacity }}
      >
        <div style={{ flexGrow: 1 }} />
        <div className="w-full max-w-[320px] aspect-[672/430]">
          <BadgeDissolve
            ref={badgeRef}
            frontSrc="/images/Projects.png"
            frontAlt="Projects"
            backSrc="/images/Home-Name-Tag.png"
            backAlt="John Jose"
            width={340}
            height={218}
          />
        </div>
        <div style={{ flexGrow: 0.1 }} />
        <div style={{ height: 40 }} />
        <div style={{ flexGrow: 0.9 }} />
      </div>

      {/* Full-screen card layer — NOT clipped to a small box, so the
          tier system's percentage-based translateY (relative to the
          card's own height) can genuinely carry a receding card up
          past the top of the screen, same as desktop. z-30: above the
          Projects.png badge, below nav/footer (z-50) so those stay
          visible/tappable throughout, per your confirmation.
          Anchored near the top (90px below screen-top, roughly below
          the nav) instead of full-viewport-centered — that decoupling
          was why title/text could end up rendering above the card:
          they're positioned independently in normal flow, with no
          awareness of where a screen-centered fixed card actually
          sits. Anchoring from a known top offset lets the title/text
          block below coordinate against that same reference point. */}
      <div
        className="fixed inset-0 z-30 flex justify-center"
        style={{ alignItems: 'flex-start', paddingTop: '90px', perspective: 1400, pointerEvents: 'none' }}
      >
        {CARDS.map((card, i) => {
          if (exiting) {
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
                  width: `${CARD_WIDTH_VW}vw`,
                  height: `${CARD_WIDTH_VW / CARD_ASPECT}vw`,
                  zIndex: 1000 + i,
                  transform: `translateY(${translateY}%) rotateX(${rotateX}deg)`,
                  pointerEvents: 'auto',
                }}
              >
                <img src={card.src} alt={card.alt} draggable={false} className="w-full h-full object-contain select-none" />
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
                width: `${CARD_WIDTH_VW}vw`,
                height: `${CARD_WIDTH_VW / CARD_ASPECT}vw`,
                zIndex: 1000 + i,
                transform: `translateY(${y}%) scale(${scale}) rotateX(${rotateX}deg)`,
                pointerEvents: 'auto',
              }}
            >
              <img src={card.src} alt={card.alt} draggable={false} className="w-full h-full object-contain select-none" />
            </a>
          );
        })}
      </div>

      {/* Title + body text — stay in normal document flow, placed by
          whichever flex layout the parent page wraps this component
          in (NOT part of the fixed card layer above, since these need
          to sit in a fixed spot below the card's resting position,
          not move with it). */}
      <div
        className="relative w-full flex items-center justify-center shrink-0"
        style={{ height: `${TITLE_HEIGHT}px`, marginTop: `calc(90px + ${CARD_WIDTH_VW / CARD_ASPECT}vw - 30px)` }}
      >
        {PROJECTS.map((p, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ pointerEvents: showFlags[i] ? 'auto' : 'none' }}
          >
            <ImageRevealUp src={p.title} alt="" triggered={showFlags[i]} width={TITLE_WIDTH} />
          </div>
        ))}
      </div>

      {/* Gap from title to body text — switched from a flex-grow ratio
          (which depended unpredictably on how much space was left
          after everything else) to a simple fixed margin instead. */}
      <div className="relative w-full px-8 text-center" style={{ marginTop: '4px' }}>
        {PROJECTS.map((p, i) => (
          <div key={i} className="absolute inset-0 px-8" style={{ pointerEvents: showFlags[i] ? 'auto' : 'none' }}>
            <MorphBlurText
              text={p.text}
              triggered={showFlags[i]}
              className="text-black text-[12px] leading-[13px] tracking-[0.03em] uppercase text-center font-[family-name:var(--font-thermochrome)] font-semibold"
              entranceDuration={0.35}
              exitDuration={0.3}
            />
          </div>
        ))}
      </div>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex justify-center pointer-events-none">
        <LoopingFlipImage
          src="/images/scroll.png"
          alt="Scroll"
          visible={showScrollHint && !scrollHintDismissed}
          width={48}
          pauseDuration={2000}
        />
      </div>
    </>
  );
});

export default MobileProjectCardStack;