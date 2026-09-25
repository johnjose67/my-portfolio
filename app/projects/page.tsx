'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import GalleryTunnel from '@/components/GalleryTunnel';
import CubeFlipText from '@/components/CubeFlipText';
import BadgeDissolve, { type BadgeDissolveHandle } from '@/components/BadgeDissolve';
import ProjectCardStack, { type ProjectCardStackHandle } from '@/components/ProjectCardStack';
import CRTPowerOn, { type CRTPowerOnHandle } from '@/components/CRTPowerOn';
import MobileProjectCardStack, { type MobileProjectCardStackHandle } from '@/components/MobileProjectCardStack';

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

  // --- Mobile-only state/handlers ---
  const mobileCardStackRef = useRef<MobileProjectCardStackHandle>(null);
  const [showMobileCards, setShowMobileCards] = useState(true);
  const crtRef = useRef<CRTPowerOnHandle>(null);
  const [mobileTab, setMobileTab] = useState<'about' | 'contact' | null>(null);
  const FLIP_DURATION = 450;
  const [homeFlipped, setHomeFlipped] = useState(false);
  const [aboutFlipped, setAboutFlipped] = useState(false);
  const [contactFlipped, setContactFlipped] = useState(false);
  const [behanceFlipped, setBehanceFlipped] = useState(false);
  const [linkedinFlipped, setLinkedinFlipped] = useState(false);
  const [mediumFlipped, setMediumFlipped] = useState(false);
  const [closeFlipped, setCloseFlipped] = useState(false);

  const handleMobileHomeTap = async () => {
    setHomeFlipped(true);
    await new Promise((r) => setTimeout(r, FLIP_DURATION));
    // Same exitDown-then-dissolve-then-navigate sequence as desktop,
    // just triggered from the mobile Home button instead.
    await mobileCardStackRef.current?.exitDown();
    setShowMobileCards(false);
    setHomeFlipped(false);
    router.push('/');
  };

  const handleMobileTabTap = (tab: 'about' | 'contact', setFlipped: (v: boolean) => void) => async () => {
    setFlipped(true);
    await new Promise((r) => setTimeout(r, FLIP_DURATION));
    const leavingColor = mobileTab ? '#000000' : '#FFFFFF';
    const playPromise = crtRef.current?.play(leavingColor);
    setMobileTab(tab);
    await playPromise;
    setFlipped(false);
  };

  const handleMobileCloseTap = async () => {
    setCloseFlipped(true);
    await new Promise((r) => setTimeout(r, FLIP_DURATION));
    const playPromise = crtRef.current?.play('#000000');
    setMobileTab(null);
    await playPromise;
    setCloseFlipped(false);
  };

  const handleMobileSocialTap = (url: string, setFlipped: (v: boolean) => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    setFlipped(true);
    setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
      setFlipped(false);
    }, FLIP_DURATION);
  };

  return (
    <>
    {/* Desktop layout — unchanged, hidden below the md breakpoint */}
    <div className="hidden md:block">
    <main
      className="relative w-full h-screen overflow-hidden"
      style={{ transform: 'scale(0.67)', transformOrigin: 'top left', width: '149.25vw', height: '149.25vh' }}
    >
      {/* Same background tunnel as the homepage, but with the character
          videos removed — just the wireframe grid scrolling on its own */}
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
    </div>

    {/* Mobile layout — shown only below the md breakpoint. Same nav/
        footer/About Me/Contact/CRT pattern as the Home page's mobile
        build, with MobileProjectCardStack replacing the badge+pills area. */}
    <div className={`block md:hidden relative w-full h-[100dvh] overflow-hidden ${mobileTab ? 'bg-black' : 'bg-white'}`}>
      <CRTPowerOn ref={crtRef} />

      <div className="fixed inset-0 z-0 pointer-events-none">
        <GalleryTunnel
          background={mobileTab ? '#000000' : '#FFFFFF'}
          lineColor={mobileTab ? '#FFFFFF' : '#000000'}
          lineOpacity={10}
          speed={28}
          characterVideoUrl={mobileTab ? undefined : '/videos/johnsitting.webm'}
          characterChromaKey={false}
          characterWidth={0.4}
          characterOffsetX={0.65}
          characterVideoUrl2={mobileTab ? undefined : '/videos/johnstanding.webm'}
          characterChromaKey2={false}
          characterWidth2={0.55}
          characterOffsetX2={-0.65}
          characterDelaySeconds2={10}
          characterTrimSeconds2={8}
        />
      </div>

      {mobileTab === null ? (
      <div className="relative z-50 w-full h-[100dvh] px-6 pt-6 pb-6 flex flex-col">
        {/* Top nav row */}
        <div className="flex items-start justify-between">
          <button onClick={handleMobileHomeTap} className="group relative">
            <CubeFlipText
              text="Home"
              frontColor="#000000"
              bottomColor="#FC8EF1"
              fontClassName="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
              triggered={homeFlipped}
            />
          </button>
          <div
            className="text-right text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
            style={{ lineHeight: '13px', letterSpacing: '0.03em' }}
          >
            <p>
              <span className="text-black">[</span>{' '}
              <button onClick={handleMobileTabTap('about', setAboutFlipped)} className="group relative inline-block align-middle">
                <CubeFlipText
                  text="About Me"
                  frontColor="#000000"
                  bottomColor="#FC8EF1"
                  fontClassName="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
                  triggered={aboutFlipped}
                />
              </button>
            </p>
            <p>
              <button onClick={handleMobileTabTap('contact', setContactFlipped)} className="group relative inline-block align-middle">
                <CubeFlipText
                  text="Contact"
                  frontColor="#000000"
                  bottomColor="#FC8EF1"
                  fontClassName="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
                  triggered={contactFlipped}
                />
              </button>{' '}
              <span className="text-black">]</span>
            </p>
          </div>
        </div>

        {/* Card stack renders as a fixed full-screen layer internally
            (z-30), NOT constrained to this wrapper — this div just
            occupies the flex space between nav and footer for the
            title/text content that DOES flow normally. flex-col (not
            centered) lets the component's internal flex-grow spacers
            (title, 2%-gap, text, remaining-gap) actually work. */}
        <div className="flex-1 flex flex-col">
          {showMobileCards && <MobileProjectCardStack ref={mobileCardStackRef} />}
        </div>

        {/* Footer row — same stacked-links structure as the homepage:
            [ wraps Behance, Linkedin stands alone, ] wraps Medium —
            three separate lines, not one horizontal row. */}
        <div className="flex items-end justify-between">
          <p
            className="text-black text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
            style={{ lineHeight: '13px', letterSpacing: '0.03em' }}
          >
            27° 28&apos; 04&quot; S,
            <br />
            153° 01&apos; 41&quot; E
          </p>
          <div
            className="flex flex-col items-end text-black text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
            style={{ lineHeight: '13px', letterSpacing: '0.03em' }}
          >
            <div className="flex items-center gap-1">
              <span>[</span>
              <a href="https://behance.net" onClick={handleMobileSocialTap('https://behance.net', setBehanceFlipped)} className="group">
                <CubeFlipText
                  text="Behance"
                  frontColor="#000000"
                  bottomColor="#FC8EF1"
                  fontClassName="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
                  triggered={behanceFlipped}
                />
              </a>
            </div>
            <a href="https://linkedin.com" onClick={handleMobileSocialTap('https://linkedin.com', setLinkedinFlipped)} className="group">
              <CubeFlipText
                text="Linkedin"
                frontColor="#000000"
                bottomColor="#FC8EF1"
                fontClassName="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
                triggered={linkedinFlipped}
              />
            </a>
            <div className="flex items-center gap-1">
              <a href="https://medium.com" onClick={handleMobileSocialTap('https://medium.com', setMediumFlipped)} className="group">
                <CubeFlipText
                  text="Medium"
                  frontColor="#000000"
                  bottomColor="#FC8EF1"
                  fontClassName="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
                  triggered={mediumFlipped}
                />
              </a>
              <span>]</span>
            </div>
          </div>
        </div>
      </div>
      ) : (
        /* Full-screen takeover — About Me or Contact. Identical pattern
           to the Home page's mobile build. */
        <div className="relative z-10 w-full h-[100dvh] px-8 pt-6 pb-10 flex flex-col items-center">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {mobileTab === 'about' && (
              <p
                className="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold mb-4"
                style={{ color: '#55D657', lineHeight: '13px', letterSpacing: '0.03em' }}
              >
                Hi, I am John.
              </p>
            )}
            <p
              className="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
              style={{ color: '#55D657', lineHeight: '13px', letterSpacing: '0.03em', textDecoration: 'none' }}
            >
              {mobileTab === 'about' ? (
                "An interaction designer with 3 years of experience turning ideas into intuitive, thoughtful digital experiences. When I'm not deep in a design file, you'll find me behind a camera chasing good light, or being a very devoted cat person. I care about designing things that feel as good as they work."
              ) : (
                <>
                  Brisbane, Australia
                  <br />
                  Available for freelance works
                  <br />
                  johnjoro15@gmail.com
                </>
              )}
            </p>
          </div>

          <button onClick={handleMobileCloseTap} className="group relative flex items-center gap-1">
            <span
              className="text-white text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
              style={{ letterSpacing: '0.03em', lineHeight: '13px' }}
            >
              [
            </span>
            <span className="flex items-center" style={{ lineHeight: '13px' }}>
              <CubeFlipText
                text="Close"
                frontColor="#FFFFFF"
                bottomColor="#FC8EF1"
                fontClassName="text-[12px] leading-[13px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
                triggered={closeFlipped}
              />
            </span>
            <span
              className="text-white text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
              style={{ letterSpacing: '0.03em', lineHeight: '13px' }}
            >
              ]
            </span>
          </button>
        </div>
      )}
    </div>
    </>
  );
}