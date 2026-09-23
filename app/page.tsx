'use client';

import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import GalleryTunnel from '@/components/GalleryTunnel';
import ScatterText from '@/components/ScatterText';
import CurvedFlipText from '@/components/CurvedFlipText';
import CubeFlipText from '@/components/CubeFlipText';
import BadgeDissolve, { type BadgeDissolveHandle } from '@/components/BadgeDissolve';

// Desktop-first build matching the Figma "My Portfolio" frame.
// Mobile layout added below, shown only under the md breakpoint.

export default function Home() {
  const router = useRouter();
  const badgeRef = useRef<BadgeDissolveHandle>(null);
  // The badge always dissolves FROM Home-Name-Tag.png, but TO whichever
  // page you're navigating to — Projects or Gallery. flushSync forces
  // this state update to commit synchronously before dissolve() runs,
  // so BadgeDissolve always reads the correct target, not a stale one
  // from React's normal (async/batched) update timing.
  const [badgeTarget, setBadgeTarget] = useState({ src: '/images/Projects.png', alt: 'Projects' });

  const handleProjectsClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    flushSync(() => setBadgeTarget({ src: '/images/Projects.png', alt: 'Projects' }));
    await badgeRef.current?.dissolve(); // wait for the badge coin-flip to finish, then navigate
    router.push('/projects');
  };

  const handleGalleryClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    flushSync(() => setBadgeTarget({ src: '/images/gallery.png', alt: 'Gallery' }));
    await badgeRef.current?.dissolve();
    router.push('/gallery');
  };

  // Mobile only — which tab (About Me / Contact) is active in the top
  // nav, swapping the content shown just below the badge.
  const [mobileTab, setMobileTab] = useState<'about' | 'contact'>('about');
  // Mobile's own badge ref/target — kept separate from the desktop
  // instance above since both are mounted simultaneously (CSS hidden vs
  // block), just one visible at a time depending on screen width.
  const mobileBadgeRef = useRef<BadgeDissolveHandle>(null);
  const [mobileBadgeTarget, setMobileBadgeTarget] = useState({ src: '/images/Projects.png', alt: 'Projects' });

  const handleMobileProjectsClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    flushSync(() => setMobileBadgeTarget({ src: '/images/Projects.png', alt: 'Projects' }));
    await mobileBadgeRef.current?.dissolve();
    router.push('/projects');
  };

  const handleMobileGalleryClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    flushSync(() => setMobileBadgeTarget({ src: '/images/gallery.png', alt: 'Gallery' }));
    await mobileBadgeRef.current?.dissolve();
    router.push('/gallery');
  };

  return (
    <>
    {/* Desktop layout — unchanged, hidden below the md breakpoint */}
    <div className="hidden md:block">
    <main
      className="relative w-full min-h-screen overflow-hidden"
      style={{ transform: 'scale(0.67)', transformOrigin: 'top left', width: '149.25vw', height: '149.25vh' }}
    >
      {/* Continuous background tunnel — fixed behind everything, no
          pointer interaction, runs on its own indefinitely */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ width: '149.25vw', height: '149.25vh' }}>
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
        />
      </div>

      {/* All page content sits above the tunnel */}
      <div className="relative z-10 w-full h-full">
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
          text="Hi, I'm John, an interaction designer with 3 years of experience turning ideas into intuitive, thoughtful digital experiences. When I'm not deep in a design file, you'll find me behind a camera chasing good light, or being a very devoted cat person. I care about designing things that feel as good as they work."
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
          stays static; the text itself curves and rolls on hover. Both
          now trigger the badge dissolve before navigating. */}
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
        onClick={handleGalleryClick}
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
          scattered order when Projects OR Gallery is clicked, revealing
          whichever page's badge underneath via badgeTarget */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[370px] w-[672px] h-[430px]">
        <BadgeDissolve
          ref={badgeRef}
          frontSrc="/images/Home-Name-Tag.png"
          frontAlt="John Jose"
          backSrc={badgeTarget.src}
          backAlt={badgeTarget.alt}
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
    </div>

    {/* Mobile layout — shown only below the md breakpoint. Built from
        the Figma mobile design: ABOUT ME/CONTACT toggle swaps the
        content block between bio text and contact details, badge and
        pill navigation keep the same dissolve behavior as desktop. */}
    <div className="block md:hidden relative w-full min-h-screen overflow-hidden bg-white">
      {/* Tunnel background — no scale wrapper needed here, since mobile
          is natively responsive rather than a scaled-down desktop layout */}
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
        />
      </div>

      <div className="relative z-10 w-full min-h-screen px-6 pt-8 pb-8 flex flex-col">
        {/* Top nav row */}
        <div className="flex items-start justify-between">
          <p className="text-black text-[14px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold">
            Home
          </p>
          <div className="text-right text-[14px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold leading-[20px]">
            <p>
              [{' '}
              <button
                onClick={() => setMobileTab('about')}
                style={{ color: mobileTab === 'about' ? '#FC8EF1' : '#000000' }}
              >
                About Me
              </button>
            </p>
            <p>
              <button
                onClick={() => setMobileTab('contact')}
                style={{ color: mobileTab === 'contact' ? '#FC8EF1' : '#000000' }}
              >
                Contact
              </button>{' '}
              ]
            </p>
          </div>
        </div>

        {/* Heading + toggled content block */}
        <div className="mt-12 text-center px-2">
          <p className="text-black text-[16px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold mb-4">
            Hi, I am John.
          </p>
          {mobileTab === 'about' ? (
            <p className="text-black text-[14px] leading-[19px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold">
              I'm a passionate interaction designer dedicated to crafting exceptional user experiences by empathizing with and understanding people's perspectives. My expertise extends to enhancing both the UX and UI of products, ensuring they are not only user-friendly but visually appealing.
            </p>
          ) : (
            <div className="text-black text-[14px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold leading-[20px]">
              <p>Brisbane, Australia</p>
              <p>Available for freelance works</p>
              <p>johnjoro15@gmail.com</p>
            </div>
          )}
        </div>

        {/* Badge — same dissolve mechanic as desktop, own ref/target
            state so it doesn't interfere with the desktop instance
            (both are mounted at once, just one is display:none) */}
        <div className="mx-auto mt-12 w-full max-w-[340px] aspect-[672/430]">
          <BadgeDissolve
            ref={mobileBadgeRef}
            frontSrc="/images/Home-Name-Tag.png"
            frontAlt="John Jose"
            backSrc={mobileBadgeTarget.src}
            backAlt={mobileBadgeTarget.alt}
            width={340}
            height={218}
          />
        </div>

        {/* Nav pills */}
        <div className="mt-10 flex items-center justify-center gap-6">
          <a
            href="/projects"
            onClick={handleMobileProjectsClick}
            className="border border-[#FC8EF1] rounded-full px-8 py-3 text-black text-[14px] uppercase font-[family-name:var(--font-thermochrome)] font-medium"
          >
            Projects
          </a>
          <a
            href="/gallery"
            onClick={handleMobileGalleryClick}
            className="border border-[#FC8EF1] rounded-full px-8 py-3 text-black text-[14px] uppercase font-[family-name:var(--font-thermochrome)] font-medium"
          >
            Gallery
          </a>
        </div>

        {/* Spacer pushes the footer to the bottom of the viewport */}
        <div className="flex-1" />

        {/* Footer row */}
        <div className="flex items-end justify-between text-black text-[13px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold leading-[18px]">
          <p>
            27° 28&apos; 04&quot; S,
            <br />
            153° 01&apos; 41&quot; E
          </p>
          <div className="text-right">
            <p>[ Behance</p>
            <p>Linkedin</p>
            <p>Medium ]</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}