'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import GalleryTunnel from '@/components/GalleryTunnel';
import ScatterText from '@/components/ScatterText';
import CurvedFlipText from '@/components/CurvedFlipText';
import CubeFlipText from '@/components/CubeFlipText';
import BadgeDissolve, { type BadgeDissolveHandle } from '@/components/BadgeDissolve';

// Desktop-first build matching the Figma "My Portfolio" frame.
// Mobile responsiveness is intentionally deferred — see the note at the
// bottom of this file for what to tackle next.

export default function Home() {
  const router = useRouter();
  const badgeRef = useRef<BadgeDissolveHandle>(null);

  const handleProjectsClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await badgeRef.current?.dissolve(); // wait for the badge coin-flip to finish, then navigate
    router.push('/projects');
  };

  return (
    <main className="relative w-full min-h-screen overflow-hidden">
      {/* Continuous background tunnel — fixed behind everything, no
          pointer interaction, runs on its own indefinitely */}
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
      {/* Top nav row */}
      <p className="group absolute left-[51px] top-[50px]">
        <CubeFlipText
          text="Home"
          frontColor="#000000"
          bottomColor="#FC8EF1"
          fontClassName="text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
        />
      </p>

      {/* Bio block, top center — words scatter away from the cursor when
          it passes near, then spring back into place */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[54px] w-[480px]">
        <ScatterText
          text="Hi, I am John. I'm a passionate interaction designer dedicated to crafting exceptional user experiences by empathizing with and understanding people's perspectives. My expertise extends to enhancing both the UX and UI of products, ensuring they are not only user-friendly but visually appealing."
          className="text-black text-[20px] leading-[20px] tracking-[0.48px] uppercase text-left font-[family-name:var(--font-thermochrome)] font-semibold"
        />
      </div>

      {/* Contact block, top right */}
      <div className="absolute right-[51px] top-[54px] text-black text-[20px] tracking-[0.48px] uppercase text-left whitespace-nowrap font-[family-name:var(--font-thermochrome)] font-semibold leading-[20px]">
        <p>Brisbane, Australia</p>
        <p>Available for freelance works</p>
        <p>johnjoro15@gmail.com</p>
      </div>

      {/* Nav pills — Projects (left) / Gallery (right). Ellipse outline
          stays static; the text itself curves and rolls on hover. Clicking
          Projects now triggers the badge coin-flip, then navigates. */}
      <a
        href="/projects"
        onClick={handleProjectsClick}
        className="group absolute left-[51px] top-[481px] w-[200px] h-[56px]"
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 200 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="100" cy="28" rx="99.5" ry="27.5" stroke="#FC8EF1" strokeWidth="1" />
        </svg>
        <CurvedFlipText
          text="Projects"
          frontColor="#000000"
          backColor="#FC8EF1"
          radius={24}
          arcDegrees={22}
          fontClassName="text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-medium"
        />
      </a>
      <a
        href="/gallery"
        className="group absolute right-[51px] top-[481px] w-[200px] h-[56px]"
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 200 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="100" cy="28" rx="99.5" ry="27.5" stroke="#FC8EF1" strokeWidth="1" />
        </svg>
        <CurvedFlipText
          text="Gallery"
          frontColor="#000000"
          backColor="#FC8EF1"
          radius={24}
          arcDegrees={22}
          fontClassName="text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-medium"
        />
      </a>

      {/* Name badge, dead center — dissolves into a fine grid of tiles in
          scattered order when the Projects button is clicked, while
          Projects.png fades in underneath over 2 seconds */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[370px] w-[672px] h-[430px]">
        <BadgeDissolve
          ref={badgeRef}
          frontSrc="/images/Home-Name-Tag.png"
          frontAlt="John Jose"
          backSrc="/images/Projects.png"
          backAlt="Projects"
          width={672}
          height={430}
        />
      </div>

      {/* Footer row */}
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
    </main>
  );
}

/*
NEXT STEPS FOR YOU:

1. Fonts: drop your PP Neue Bit, Condiment, and MD Thermochrome font files
   into /public/fonts/ and update lib/fonts.js with the exact filenames.
   Then import and apply the font variables in app/layout.js:

     import { neueBit, condiment, thermochrome } from '@/lib/fonts';

     export default function RootLayout({ children }) {
       return (
         <html lang="en" className={`${neueBit.variable} ${condiment.variable} ${thermochrome.variable}`}>
           <body>{children}</body>
         </html>
       );
     }

2. Name badge shape: the green sticker background here is a rough
   CSS clip-path approximation. For an exact match to your Figma vector,
   export that shape as an SVG from Figma and swap it in as a background
   image instead — much closer to pixel-perfect than a CSS shape.

3. This uses fixed pixel positioning (matches your 1024px-wide Figma
   frame). It will look correct on a standard desktop viewport but will
   overflow/clip on smaller screens — expected for now per your call to
   get desktop working first.
*/