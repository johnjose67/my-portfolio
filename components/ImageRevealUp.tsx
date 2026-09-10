'use client';

type ImageRevealUpProps = {
  src: string;
  alt: string;
  triggered: boolean;
  width?: number;
  duration?: number; // ms
};

export default function ImageRevealUp({ src, alt, triggered, width, duration = 500 }: ImageRevealUpProps) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className="select-none"
      style={{
        width,
        height: 'auto',
        // Blur-to-focus, matching the same technique used for the
        // Writeway text — starts soft/blurred and faded out, sharpens
        // into focus as it fades in
        opacity: triggered ? 1 : 0,
        filter: triggered ? 'blur(0px)' : 'blur(10px)',
        transition: `opacity ${duration}ms ease-out, filter ${duration}ms ease-out`,
      }}
    />
  );
}