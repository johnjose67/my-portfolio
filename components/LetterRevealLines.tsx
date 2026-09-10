'use client';

type LetterRevealLinesProps = {
  lines: string[];
  triggered: boolean;
  className?: string;
  perCharDelay?: number; // ms between each character within a line
  duration?: number; // ms — how long each character's own fade/rise takes
};

export default function LetterRevealLines({
  lines,
  triggered,
  className = '',
  perCharDelay = 28,
  duration = 350,
}: LetterRevealLinesProps) {
  return (
    <div className={className}>
      {lines.map((line, lineIndex) => (
        <div key={lineIndex} style={{ whiteSpace: 'nowrap' }}>
          {line.split('').map((ch, charIndex) => (
            <span
              key={charIndex}
              style={{
                display: 'inline-block',
                opacity: triggered ? 1 : 0,
                transform: triggered ? 'translateY(0)' : 'translateY(10px)',
                transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
                // Same formula for every line — this is what keeps all 7
                // lines moving at identical pace, rather than staggering
                // line-by-line
                transitionDelay: `${charIndex * perCharDelay}ms`,
              }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}