'use client';

import { useEffect, useRef } from 'react';

type ScatterTextProps = {
  text: string;
  className?: string;
  radius?: number; // px — cursor scatter influence radius
  strength?: number; // px — max scatter push distance
  as?: 'p' | 'span' | 'div';
};

export default function ScatterText({
  text,
  className = '',
  radius = 90,
  strength = 40,
  as = 'div',
}: ScatterTextProps) {
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });
  const current = useRef<{ x: number; y: number }[]>([]);
  const words = text.split(' ');

  useEffect(() => {
    current.current = words.map(() => ({ x: 0, y: 0 }));

    const onMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      wordRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouse.current.x - cx;
        const dy = mouse.current.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = 0;
        let targetY = 0;
        if (dist < radius) {
          const falloff = 1 - dist / radius;
          const angle = Math.atan2(-dy, -dx);
          targetX = Math.cos(angle) * strength * falloff;
          targetY = Math.sin(angle) * strength * falloff;
        }

        const c = current.current[i];
        // Asymmetric easing — snappier scatter, slower return to rest
        const ease = dist < radius ? 0.25 : 0.12;
        c.x += (targetX - c.x) * ease;
        c.y += (targetY - c.y) * ease;
        el.style.transform = `translate(${c.x}px, ${c.y}px)`;
      });
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, [radius, strength, text]);

  const Wrapper = as;

  return (
    <Wrapper className={className}>
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
    </Wrapper>
  );
}