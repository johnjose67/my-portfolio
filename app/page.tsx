'use client';

import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import GalleryTunnel from '@/components/GalleryTunnel';
import ScatterText from '@/components/ScatterText';
import CurvedFlipText from '@/components/CurvedFlipText';
import CubeFlipText from '@/components/CubeFlipText';
import BadgeDissolve, { type BadgeDissolveHandle } from '@/components/BadgeDissolve';
import CRTPowerOn, { type CRTPowerOnHandle } from '@/components/CRTPowerOn';

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
  const [mobileTab, setMobileTab] = useState<'about' | 'contact' | null>(null);
  // Tap-driven flip state for the mobile Projects/Gallery pills — CSS
  // :hover (what desktop uses) doesn't reliably fire on a tap, so these
  // are passed as CurvedFlipText's `triggered` prop instead.
  const [projectsFlipped, setProjectsFlipped] = useState(false);
  const [galleryFlipped, setGalleryFlipped] = useState(false);
  // Mobile's own badge ref/target — kept separate from the desktop
  // instance above since both are mounted simultaneously (CSS hidden vs
  // block), just one visible at a time depending on screen width.
  const mobileBadgeRef = useRef<BadgeDissolveHandle>(null);
  const [mobileBadgeTarget, setMobileBadgeTarget] = useState({ src: '/images/Projects.png', alt: 'Projects' });
  // CRT power-on overlay for the About Me/Contact/Close transitions —
  // panels open from a center line, like an old monitor powering on.
  const crtRef = useRef<CRTPowerOnHandle>(null);

  // Same tap-triggered pattern extended to Home, the About Me/Contact
  // toggle, and the social links — each waits for the full flip
  // animation to finish before doing anything (switching tab, opening a
  // link), rather than acting immediately on tap.
  const FLIP_DURATION = 450; // matches CubeFlipText's default duration
  const [homeFlipped, setHomeFlipped] = useState(false);
  const [aboutFlipped, setAboutFlipped] = useState(false);
  const [contactFlipped, setContactFlipped] = useState(false);
  const [behanceFlipped, setBehanceFlipped] = useState(false);
  const [linkedinFlipped, setLinkedinFlipped] = useState(false);
  const [mediumFlipped, setMediumFlipped] = useState(false);

  const handleMobileHomeTap = () => {
    setHomeFlipped(true);
    setTimeout(() => setHomeFlipped(false), FLIP_DURATION);
  };

  const handleMobileTabTap = (tab: 'about' | 'contact', setFlipped: (v: boolean) => void) => async () => {
    setFlipped(true);
    await new Promise((r) => setTimeout(r, FLIP_DURATION));
    // Covers the screen in whichever color we're LEAVING (white if
    // coming from the normal view, black if switching between About
    // Me and Contact directly), then switches the view underneath
    // WHILE the panels are opening, so the new view is what's
    // revealed as they part.
    const leavingColor = mobileTab ? '#000000' : '#FFFFFF';
    const playPromise = crtRef.current?.play(leavingColor);
    setMobileTab(tab);
    await playPromise;
    setFlipped(false);
  };

  const handleMobileCloseTap = async () => {
    // Always leaving a black takeover view when Close is tapped.
    const playPromise = crtRef.current?.play('#000000');
    setMobileTab(null);
    await playPromise;
  };

  const handleMobileSocialTap = (url: string, setFlipped: (v: boolean) => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    setFlipped(true);
    setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
      setFlipped(false);
    }, FLIP_DURATION);
  };

  const handleMobileProjectsClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setProjectsFlipped(true); // plays the CurvedFlipText flip right as the tap happens
    flushSync(() => setMobileBadgeTarget({ src: '/images/Projects.png', alt: 'Projects' }));
    await mobileBadgeRef.current?.dissolve();
    router.push('/projects');
  };

  const handleMobileGalleryClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setGalleryFlipped(true);
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
    <div className={`block md:hidden relative w-full h-[100dvh] overflow-hidden ${mobileTab ? 'bg-black' : 'bg-white'}`}>
      {/* Tile-dissolve overlay for the About Me/Contact/Close
          transitions — mounted once here, outside the view-switching
          ternary below, so it persists regardless of which view is
          currently showing. */}
      <CRTPowerOn ref={crtRef} />

      {/* Tunnel background — no scale wrapper needed here, since mobile
          is natively responsive rather than a scaled-down desktop layout.
          Inverted (black bg/white lines) for EITHER full-screen takeover
          (About Me or Contact), not just About Me specifically. */}
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
      <div className="relative z-10 w-full h-[100dvh] px-6 pt-6 pb-6 flex flex-col">
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

        {/* Middle section: badge is vertically centered in the space
            between the top nav and footer, and the pills sit exactly
            10% of the way through the remaining space below the badge.
            The 1 / 0.1 / 0.9 flex-grow ratios achieve both at once —
            0.1 + 0.9 = 1, matching the top spacer, so the badge stays
            centered regardless of viewport height, and the pills land
            precisely at the 10% mark of the space below it. */}
        <div className="flex-1 flex flex-col items-center min-h-0">
          <div style={{ flexGrow: 1 }} />

          <div className="w-full max-w-[320px] aspect-[672/430]">
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

          <div style={{ flexGrow: 0.1 }} />

          <div className="flex items-center justify-center gap-6">
            <a href="/projects" onClick={handleMobileProjectsClick} className="group relative w-[140px] h-[40px]">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="100" cy="28" rx="99.5" ry="27.5" stroke="#FC8EF1" strokeWidth="1" />
              </svg>
              <CurvedFlipText
                text="Projects"
                frontColor="#000000"
                backColor="#FC8EF1"
                radius={17}
                arcDegrees={22}
                fontClassName="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-medium"
                triggered={projectsFlipped}
              />
            </a>
            <a href="/gallery" onClick={handleMobileGalleryClick} className="group relative w-[140px] h-[40px]">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="100" cy="28" rx="99.5" ry="27.5" stroke="#FC8EF1" strokeWidth="1" />
              </svg>
              <CurvedFlipText
                text="Gallery"
                frontColor="#000000"
                backColor="#FC8EF1"
                radius={17}
                arcDegrees={22}
                fontClassName="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-medium"
                triggered={galleryFlipped}
              />
            </a>
          </div>

          <div style={{ flexGrow: 0.9 }} />
        </div>

        {/* Footer row — social links now use the same CubeFlipText
            interaction as desktop, real <a> tags instead of plain text */}
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
        /* Full-screen takeover — About Me or Contact. Replaces the
           entire normal view (nav/badge/pills/footer all hidden) while
           either tab is active; Close is the only way back. */
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
              className="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold no-underline"
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

          {/* Close — same CubeFlipText interaction as the social links,
              returns to the normal view (doesn't navigate pages). */}
          <button onClick={handleMobileCloseTap} className="group relative flex items-center gap-1">
            <span className="text-white text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold" style={{ letterSpacing: '0.03em' }}>
              [
            </span>
            <CubeFlipText
              text="Close"
              frontColor="#FFFFFF"
              bottomColor="#FC8EF1"
              fontClassName="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
            />
            <span className="text-white text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold" style={{ letterSpacing: '0.03em' }}>
              ]
            </span>
          </button>
        </div>
      )}
    </div>
    </>
  );
}