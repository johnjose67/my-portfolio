'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import SphereGalleryCanvas, { type SphereGalleryCanvasHandle } from '@/components/SphereGalleryCanvas';
import CubeFlipText from '@/components/CubeFlipText';
import BadgeDissolve, { type BadgeDissolveHandle } from '@/components/BadgeDissolve';

export default function Gallery() {
  const router = useRouter();
  const badgeRef = useRef<BadgeDissolveHandle>(null);
  const canvasRef = useRef<SphereGalleryCanvasHandle>(null);

  const handleHomeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    // Both play at once: the photos reverse their intro (slide back
    // down, curve back up, un-reveal), while the badge dissolves —
    // navigation waits for both to finish.
    await Promise.all([canvasRef.current?.exitAnimation(), badgeRef.current?.dissolve()]);
    router.push('/');
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-white">
      {/* Badge, same position/size as the homepage and projects page badge —
          this is now the ONLY gallery.png render on the page, since the
          WebGL version inside SphereGalleryCanvas was removed. z-30 keeps
          it above the photo canvas (z-20), so it renders in front. */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[370px] w-[672px] h-[430px] z-30 pointer-events-none">
        <BadgeDissolve
          ref={badgeRef}
          frontSrc="/images/gallery.png"
          frontAlt="Gallery"
          backSrc="/images/Home-Name-Tag.png"
          backAlt="John Jose"
          width={672}
          height={430}
        />
      </div>

      <div className="relative z-20">
        <SphereGalleryCanvas ref={canvasRef} />
      </div>

      {/* Home nav — now triggers the badge dissolve before navigating,
          same as every other page */}
      <a
        href="/"
        onClick={handleHomeClick}
        className="group absolute left-[51px] top-[50px] z-50"
      >
        <CubeFlipText
          text="Home"
          frontColor="#000000"
          bottomColor="#FC8EF1"
          fontClassName="text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
        />
      </a>

      {/* Footer row — same as the homepage */}
      <p className="absolute left-[51px] bottom-[40px] z-50 text-black text-[20px] font-[family-name:var(--font-thermochrome)] font-semibold">
        27° 28&apos; 04&quot; S, 153° 01&apos; 41&quot; E
      </p>
      <div className="absolute right-[51px] bottom-[40px] z-50 flex items-center gap-6 text-black text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold">
        <span>[</span>
        <a href="https://behance.net" target="_blank" rel="noopener noreferrer" className="group">
          <CubeFlipText
            text="Behance"
            frontColor="#000000"
            bottomColor="#FC8EF1"
            fontClassName="text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
          />
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="group">
          <CubeFlipText
            text="Linkedin"
            frontColor="#000000"
            bottomColor="#FC8EF1"
            fontClassName="text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
          />
        </a>
        <a href="https://medium.com" target="_blank" rel="noopener noreferrer" className="group">
          <CubeFlipText
            text="Medium"
            frontColor="#000000"
            bottomColor="#FC8EF1"
            fontClassName="text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
          />
        </a>
        <span>]</span>
      </div>
    </main>
  );
}