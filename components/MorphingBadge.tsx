'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { interpolate } from 'flubber';
import { animate, useMotionValue } from 'framer-motion';

// Straight from your two SVG files — the outline shape only, no text.
const HOME_PATH =
  'M130.591 71.1554H81.8038C76.281 71.1554 71.8038 75.6325 71.8038 81.1554V100.742C71.8038 106.265 67.3267 110.742 61.8038 110.742H59.4783C53.9554 110.742 49.4783 115.219 49.4783 120.742V139.326C49.4783 144.849 53.9554 149.326 59.4783 149.326H72.0615C77.5844 149.326 82.0615 153.803 82.0615 159.326V174.904C82.0615 180.427 77.5844 184.904 72.0615 184.904H10C4.47715 184.904 0 189.381 0 194.904V219C0 224.523 4.47716 229 10 229H140.848C146.371 229 150.848 224.523 150.848 219V183.379C150.848 177.856 155.326 173.379 160.848 173.379H247.046C252.568 173.379 257.046 177.856 257.046 183.379V191.941C257.046 197.464 261.523 201.941 267.046 201.941H340.229C345.403 201.941 349.722 197.995 350.188 192.842L352.26 169.95C352.726 164.797 357.046 160.851 362.219 160.851H442.661C446.12 160.851 448.925 163.656 448.925 167.115C448.925 170.574 451.729 173.379 455.188 173.379H559C564.523 173.379 569 168.901 569 163.379V120.742C569 115.219 564.523 110.742 559 110.742H515.644C510.121 110.742 505.644 106.265 505.644 100.742V81.1554C505.644 75.6325 501.167 71.1554 495.644 71.1554H412.463C406.941 71.1554 402.463 66.6782 402.463 61.1554V10C402.463 4.47715 397.986 0 392.463 0H314.714C309.191 0 304.714 4.47715 304.714 10V25.5777C304.714 31.1005 300.237 35.5777 294.714 35.5777H267.046C261.523 35.5777 257.046 40.0548 257.046 45.5777V73.6827C257.046 79.2056 252.568 83.6827 247.046 83.6827H194.638C189.116 83.6827 184.638 79.2056 184.638 73.6827V55.0985C184.638 49.5756 180.161 45.0985 174.638 45.0985H150.591C145.068 45.0985 140.591 49.5756 140.591 55.0985V61.1554C140.591 66.6782 136.114 71.1554 130.591 71.1554Z';

const PROJECTS_PATH =
  'M106.5 71H69.5C63.9772 71 59.5 75.4771 59.5 81V101.25C59.5 106.359 55.3586 110.5 50.25 110.5C45.1414 110.5 41 114.641 41 119.75V139C41 144.523 45.4772 149 51 149H58C63.5228 149 68 153.477 68 159V174.5C68 180.023 63.5228 184.5 58 184.5H10C4.47715 184.5 0 188.977 0 194.5V218.5C0 224.023 4.47715 228.5 10 228.5H115C120.523 228.5 125 224.023 125 218.5V183C125 177.477 129.477 173 135 173H203C208.523 173 213 177.477 213 183V191.5C213 197.023 217.477 201.5 223 201.5H280.223C285.455 201.5 289.803 197.467 290.195 192.249L291.886 169.751C292.278 164.533 296.626 160.5 301.858 160.5H365.75C369.202 160.5 372 163.298 372 166.75C372 170.202 374.798 173 378.25 173H461.5C467.023 173 471.5 168.523 471.5 163V120.5C471.5 114.977 467.023 110.5 461.5 110.5H429C423.477 110.5 419 106.023 419 100.5V81C419 75.4771 414.523 71 409 71H343.5C337.977 71 333.5 66.5229 333.5 61V10C333.5 4.47715 329.023 0 323.5 0H262.5C256.977 0 252.5 4.47715 252.5 10V25.5C252.5 31.0228 248.023 35.5 242.5 35.5H223C217.477 35.5 213 39.9771 213 45.5V73.5C213 79.0229 208.523 83.5 203 83.5H163C157.477 83.5 153 79.0229 153 73.5V55C153 49.4772 148.523 45 143 45H126.5C120.977 45 116.5 49.4772 116.5 55V61C116.5 66.5229 112.023 71 106.5 71Z';

const HOME_WIDTH = 569;
const PROJECTS_WIDTH = 471.5;
const HEIGHT = 229;

export default function MorphingBadge() {
  const pathname = usePathname();
  const isProjects = pathname === '/projects';

  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const progress = useMotionValue(isProjects ? 1 : 0);
  const [showProjectsText, setShowProjectsText] = useState(isProjects);

  // Fixed direction: t=0 → home shape, t=1 → projects shape.
  // maxSegmentLength controls how finely flubber subdivides the paths —
  // smaller = smoother in-between shapes, at the cost of more points to
  // compute each frame.
  const interpolatorRef = useRef(
    interpolate(HOME_PATH, PROJECTS_PATH, { maxSegmentLength: 2 })
  );

  const applyFrame = (t: number) => {
    if (pathRef.current) {
      pathRef.current.setAttribute('d', interpolatorRef.current(t));
    }
    if (svgRef.current) {
      // The two badges are different widths — animating the viewBox width
      // alongside the path keeps everything centered and correctly scaled
      // at every point in the morph, instead of the narrower Projects
      // shape ending up stranded on the left side of a fixed-width box.
      const width = HOME_WIDTH + (PROJECTS_WIDTH - HOME_WIDTH) * t;
      svgRef.current.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`);
    }
  };

  useEffect(() => {
    applyFrame(progress.get()); // paint the correct resting shape on first mount
  }, []);

  useEffect(() => {
    const target = isProjects ? 1 : 0;
    const controls = animate(progress, target, {
      duration: 0.8,
      ease: 'easeInOut',
      onUpdate: applyFrame,
    });

    // Swap the text at the morph's midpoint, not at the very start/end —
    // reads as one unified transition rather than two separate effects
    const textTimeout = setTimeout(() => setShowProjectsText(isProjects), 400);

    return () => {
      controls.stop();
      clearTimeout(textTimeout);
    };
  }, [isProjects]);

  return (
    <div className="relative" style={{ width: HOME_WIDTH, height: HEIGHT }}>
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${HOME_WIDTH} ${HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path ref={pathRef} d={HOME_PATH} fill="#55D657" stroke="white" strokeWidth="3" />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <p
          className={`absolute text-[64px] uppercase font-[family-name:var(--font-neue-bit)] font-bold transition-opacity duration-300 ${
            showProjectsText ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <span className="font-[family-name:var(--font-condiment)] normal-case">J</span>
          hn{' '}
          <span className="font-[family-name:var(--font-condiment)] normal-case">o</span>
          SE
        </p>
        <p
          className={`absolute text-[64px] uppercase font-[family-name:var(--font-neue-bit)] font-bold transition-opacity duration-300 ${
            showProjectsText ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          PROJE
          <span className="font-[family-name:var(--font-condiment)] normal-case">C</span>
          TS
        </p>
      </div>
    </div>
  );
}