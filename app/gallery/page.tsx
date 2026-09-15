import Link from 'next/link';
import SphereGalleryCanvas from '@/components/SphereGalleryCanvas';
import CubeFlipText from '@/components/CubeFlipText';

export default function Gallery() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-white">
      {/* Badge, same position/size as the homepage and projects page badge.
          Sits BEHIND the photo canvas (lower z-index) — note it won't be
          visible right now since the canvas is fully opaque and covers
          the whole screen, but it's correctly layered for whenever that
          changes (a loading state, gaps in the plane, etc). */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[370px] w-[672px] h-[430px] z-10 pointer-events-none">
        <img src="/images/gallery.png" alt="Gallery" className="w-full h-full object-contain select-none" draggable={false} />
      </div>

      <div className="relative z-20">
        <SphereGalleryCanvas />
      </div>

      {/* Home nav — sits above the canvas, matching the rest of the site */}
      <Link href="/" className="group absolute left-[51px] top-[50px] z-50">
        <CubeFlipText
          text="Home"
          frontColor="#000000"
          bottomColor="#FC8EF1"
          fontClassName="text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
        />
      </Link>

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