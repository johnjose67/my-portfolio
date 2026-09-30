'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SphereGalleryCanvas, { type SphereGalleryCanvasHandle } from '@/components/SphereGalleryCanvas';
import CubeFlipText from '@/components/CubeFlipText';
import BadgeDissolve, { type BadgeDissolveHandle } from '@/components/BadgeDissolve';
import CRTPowerOn, { type CRTPowerOnHandle } from '@/components/CRTPowerOn';

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

  // --- Mobile-only state/handlers ---
  const mobileBadgeRef = useRef<BadgeDissolveHandle>(null);
  const mobileCanvasRef = useRef<SphereGalleryCanvasHandle>(null);
  const [showMobileCanvas, setShowMobileCanvas] = useState(true);
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
    // Same reverse-intro-plus-dissolve pair as desktop's handleHomeClick,
    // just triggered from the mobile Home button instead.
    await Promise.all([mobileCanvasRef.current?.exitAnimation(), mobileBadgeRef.current?.dissolve()]);
    setShowMobileCanvas(false);
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
      className="relative w-full h-screen overflow-hidden bg-white"
      style={{ transform: 'scale(0.67)', transformOrigin: 'top left', width: '149.25vw', height: '149.25vh' }}
    >
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
        <a href="https://www.behance.net/johnjoro15fed6" target="_blank" rel="noopener noreferrer" className="group">
          <CubeFlipText
            text="Behance"
            frontColor="#000000"
            bottomColor="#FC8EF1"
            fontClassName="text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
          />
        </a>
        <a href="https://www.linkedin.com/in/john-jose-376500141/" target="_blank" rel="noopener noreferrer" className="group">
          <CubeFlipText
            text="Linkedin"
            frontColor="#000000"
            bottomColor="#FC8EF1"
            fontClassName="text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
          />
        </a>
        <a href="https://medium.com/design-bootcamp/ux-audit-done-for-a-ride-hailing-app-5bf335e12376" target="_blank" rel="noopener noreferrer" className="group">
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
    </div>

    {/* Mobile layout — shown only below the md breakpoint. Same nav/
        footer/About Me/Contact/CRT pattern as Home and Projects. No
        GalleryTunnel here — background is just a plain white/black
        fill (via bg-white/bg-black below) matching the mobileTab state,
        since there's no tunnel to invert like the other pages do. */}
    <div className={`block md:hidden relative w-full h-[100dvh] overflow-hidden ${mobileTab ? 'bg-black' : 'bg-white'}`}>
      <CRTPowerOn ref={crtRef} />

      {showMobileCanvas && <SphereGalleryCanvas ref={mobileCanvasRef} mobile />}

      {mobileTab === null ? (
      <div className="relative z-50 w-full h-[100dvh] px-6 pt-6 pb-6 flex flex-col pointer-events-none">
        {/* Top nav row — Home only, no About Me/Contact on this page.
            The invisible placeholder on the right keeps this row's
            height identical to Home's/Projects' nav rows, so the
            flexGrow-based badge layout below resolves to the same
            available space Home's own layout has. */}
        <div className="flex items-start justify-between">
          <button onClick={handleMobileHomeTap} className="group relative pointer-events-auto">
            <CubeFlipText
              text="Home"
              frontColor="#000000"
              bottomColor="#FC8EF1"
              fontClassName="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
              triggered={homeFlipped}
            />
          </button>
          <div
            aria-hidden="true"
            className="invisible text-right text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
            style={{ lineHeight: '13px', letterSpacing: '0.03em' }}
          >
            <p>[ About Me</p>
            <p>Contact ]</p>
          </div>
        </div>

        {/* Middle: badge positioned using the EXACT same flexGrow(1 :
            0.1 : 0.9) structure Home's own badge uses — not an
            approximation, the identical mechanism. The h-[40px]
            invisible placeholder stands in for where Home's real
            Projects/Gallery pills sit, matching their actual height,
            so the ratio math resolves to the same result Home's own
            layout produces. Since this is the same positioning system
            Home's badge already uses (confirmed to never shift), this
            should inherit that same stability, not just imitate its
            resting position. */}
        <div className="relative flex-1 flex flex-col items-center min-h-0 pointer-events-auto">
          <div style={{ flexGrow: 1 }} />

          <div className="w-full max-w-[320px] aspect-[672/430]">
            <BadgeDissolve
              ref={mobileBadgeRef}
              frontSrc="/images/gallery.png"
              frontAlt="Gallery"
              backSrc="/images/Home-Name-Tag.png"
              backAlt="John Jose"
              width={340}
              height={218}
            />
          </div>

          <div style={{ flexGrow: 0.1 }} />

          <div aria-hidden="true" className="invisible h-[40px]" />

          <div style={{ flexGrow: 0.9 }} />
        </div>

        {/* Footer row — same stacked-links structure as Home/Projects */}
        <div className="flex items-end justify-between">
          <p
            className="text-black text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold pointer-events-auto"
            style={{ lineHeight: '13px', letterSpacing: '0.03em' }}
          >
            27° 28&apos; 04&quot; S,
            <br />
            153° 01&apos; 41&quot; E
          </p>
          <div
            className="flex flex-col items-end text-black text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold pointer-events-auto"
            style={{ lineHeight: '13px', letterSpacing: '0.03em' }}
          >
            <div className="flex items-center gap-1">
              <span>[</span>
              <a href="https://www.behance.net/johnjoro15fed6" onClick={handleMobileSocialTap('https://www.behance.net/johnjoro15fed6', setBehanceFlipped)} className="group">
                <CubeFlipText
                  text="Behance"
                  frontColor="#000000"
                  bottomColor="#FC8EF1"
                  fontClassName="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
                  triggered={behanceFlipped}
                />
              </a>
            </div>
            <a href="https://www.linkedin.com/in/john-jose-376500141/" onClick={handleMobileSocialTap('https://www.linkedin.com/in/john-jose-376500141/', setLinkedinFlipped)} className="group">
              <CubeFlipText
                text="Linkedin"
                frontColor="#000000"
                bottomColor="#FC8EF1"
                fontClassName="text-[12px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold"
                triggered={linkedinFlipped}
              />
            </a>
            <div className="flex items-center gap-1">
              <a href="https://medium.com/design-bootcamp/ux-audit-done-for-a-ride-hailing-app-5bf335e12376" onClick={handleMobileSocialTap('https://medium.com/design-bootcamp/ux-audit-done-for-a-ride-hailing-app-5bf335e12376', setMediumFlipped)} className="group">
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
           to Home/Projects' mobile build. */
        <div className="relative z-50 w-full h-[100dvh] px-8 pt-6 pb-10 flex flex-col items-center">
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