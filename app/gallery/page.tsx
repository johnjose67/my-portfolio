import Link from 'next/link';
import GalleryTunnel from '@/components/GalleryTunnel';
import SphereGalleryCanvas from '@/components/SphereGalleryCanvas';
import CubeFlipText from '@/components/CubeFlipText';

export default function Gallery() {
  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* Same wireframe tunnel as the homepage/projects page, no character
          videos — just the grid scrolling on its own */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <GalleryTunnel background="#FFFFFF" lineColor="#000000" lineOpacity={10} speed={10} />
      </div>

      <SphereGalleryCanvas />

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