import GalleryTunnel from '@/components/GalleryTunnel';
import CubeFlipText from '@/components/CubeFlipText';
import Link from 'next/link';

export default function Projects() {
  return (
    <main className="relative w-full min-h-screen overflow-hidden">
      {/* Same background tunnel as the homepage, but with the character
          videos removed — just the wireframe grid scrolling on its own */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <GalleryTunnel
          background="#FFFFFF"
          lineColor="#000000"
          lineOpacity={10}
          speed={10}
        />
      </div>

      {/* All page content sits above the tunnel */}
      <div className="relative z-10 w-full min-h-screen">
        {/* Home nav button — the only nav element on this page */}
        <Link href="/" className="group absolute left-[51px] top-[50px]">
          <CubeFlipText
            text="Home"
            frontColor="#000000"
            bottomColor="#FC8EF1"
            fontClassName="text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
          />
        </Link>

        {/* Projects badge, same position/size as the homepage's name tag */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[370px] w-[672px] h-[430px]">
          <img
            src="/images/Projects.png"
            alt="Projects"
            draggable={false}
            className="w-full h-full object-contain select-none [-webkit-user-drag:none]"
          />
        </div>
      </div>
    </main>
  );
}