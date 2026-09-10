'use client';

type ImageRevealUpProps = {
  src: string;
  alt: string;
  triggered: boolean;
  width?: number;
  duration?: number; // ms
};

export default function ImageRevealUp({ src, alt, triggered, width, duration = 900 }: ImageRevealUpProps) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className="select-none"
      style={{
        width,
        height: 'auto',
        // top-inset shrinking from 100% → 0% reveals the image starting
        // at the BOTTOM edge and growing upward, since less is clipped
        // away from the top as this shrinks
        clipPath: triggered ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)',
        transition: `clip-path ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    />
  );
}