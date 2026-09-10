'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import GalleryTunnel from '@/components/GalleryTunnel';
import CubeFlipText from '@/components/CubeFlipText';
import BadgeDissolve, { type BadgeDissolveHandle } from '@/components/BadgeDissolve';
import ProjectCardStack, { type ProjectCardStackHandle } from '@/components/ProjectCardStack';

export default function Projects() {
  const router = useRouter();
  const badgeRef = useRef<BadgeDissolveHandle>(null);
  const cardStackRef = useRef<ProjectCardStackHandle>(null);
  const [showCards, setShowCards] = useState(true);

  const handleHomeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await cardStackRef.current?.exitDown(); // cards slide down and off-screen first
    setShowCards(false); // then unmount the (now invisible) card stack
    await badgeRef.current?.dissolve(); // then the badge dissolve plays
    router.push('/'); // then navigate
  };

  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* Same background tunnel as the homepage, but with the character
          videos removed — just the wireframe grid scrolling on its own */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <GalleryTunnel
          background="#FFFFFF"
          lineColor="#000000"
          lineOpacity={10}
          speed={10}
          characterVideoUrl="/videos/johnsitting.webm"
          characterChromaKey={false}
          characterWidth={0.4}
          characterOffsetX={0.65}
          characterVideoUrl2="/videos/johnstanding.webm"
          characterChromaKey2={false}
          characterWidth2={0.55}
          characterOffsetX2={-0.65}
          characterDelaySeconds2={10}
          characterTrimSeconds2={8}
          characterRepeat={3}
        />
      </div>

      {/* All page content sits above the tunnel */}
      <div className="relative z-10 w-full min-h-screen">
        {/* Home nav button — now triggers the reversed dissolve before navigating */}
        <a
          href="/"
          onClick={handleHomeClick}
          className="group absolute left-[51px] top-[50px]"
        >
          <CubeFlipText
            text="Home"
            frontColor="#000000"
            bottomColor="#FC8EF1"
            fontClassName="text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
          />
        </a>

        {/* Badge, same position/size as the homepage's name tag — front is
            Projects.png (roles reversed from the homepage), dissolving to
            reveal Home-Name-Tag.png underneath */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[370px] w-[672px] h-[430px]">
          <BadgeDissolve
            ref={badgeRef}
            frontSrc="/images/Projects.png"
            frontAlt="Projects"
            backSrc="/images/Home-Name-Tag.png"
            backAlt="John Jose"
            width={672}
            height={430}
          />
        </div>

        {/* Footer row — same as the homepage */}
        <p className="absolute left-[51px] bottom-[40px] text-black text-[20px] font-[family-name:var(--font-thermochrome)] font-semibold">
          27° 28&apos; 04&quot; S, 153° 01&apos; 41&quot; E
        </p>
        <div className="absolute right-[51px] bottom-[40px] flex items-center gap-6 text-black text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold">
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
      </div>

      {/* Card carousel — occupies the full static viewport, wheel-driven,
          no page scroll involved at all. On Home click, it plays its
          exitDown animation first, THEN unmounts, THEN the badge dissolves. */}
      {showCards && <ProjectCardStack ref={cardStackRef} />}
    </main>
  );
}