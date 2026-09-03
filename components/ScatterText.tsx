'use client';

import { useEffect, useRef } from 'react';

type ScatterTextProps = {
  text: string;
  className?: string;
  radius?: number; // how close the cursor needs to be to affect a word, in px
  strength?: number; // max distance a word gets pushed, in px
};

export default function ScatterText({
  text,
  className = '',
  radius = 90,
  strength = 40,
}: ScatterTextProps) {
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });
  // Current animated offset per word — eased toward a target each frame
  // rather than snapping, so the scatter/return both feel physical.
  const current = useRef<{ x: number; y: number; rot: number }[]>([]);
  const words = text.split(' ');

  useEffect(() => {
    current.current = words.map(() => ({ x: 0, y: 0, rot: 0 }));

    const onMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    const onLeave = () => {
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);

      wordRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cx - mouse.current.x;
        const dy = cy - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = 0;
        let targetY = 0;
        let targetRot = 0;

        if (dist < radius) {
          // Closer to the cursor = pushed further away (falloff 0..1)
          const falloff = 1 - dist / radius;
          const angle = Math.atan2(dy, dx);
          targetX = Math.cos(angle) * strength * falloff;
          targetY = Math.sin(angle) * strength * falloff;
          // Small random jitter while actively disturbed, for a slightly
          // trembling, "knocked off balance" feel rather than a clean push
          targetRot = (Math.random() - 0.5) * 20 * falloff;
        }

        const c = current.current[i];
        // Snappier scatter, slightly slower/springier return to rest —
        // this asymmetry is what sells the "bump, then settle" feel
        const ease = dist < radius ? 0.25 : 0.12;
        c.x += (targetX - c.x) * ease;
        c.y += (targetY - c.y) * ease;
        c.rot += (targetRot - c.rot) * ease;

        el.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${c.rot}deg)`;
      });
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [text, radius, strength]);

  return (
    <p className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          ref={(el) => {
            wordRefs.current[i] = el;
          }}
          style={{ display: 'inline-block', willChange: 'transform' }}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </p>
  );
}