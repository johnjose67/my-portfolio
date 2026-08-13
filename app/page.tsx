import FloatingImage from '@/components/FloatingImage';

// Desktop-first build matching the Figma "My Portfolio" frame.
// Mobile responsiveness is intentionally deferred — see the note at the
// bottom of this file for what to tackle next.

export default function Home() {
  return (
    <main className="relative bg-white w-full min-h-screen overflow-hidden">
      {/* Top nav row */}
      <p className="absolute left-[51px] top-[50px] text-black text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold">
        Home
      </p>

      {/* Bio block, top center */}
      <p className="absolute left-1/2 -translate-x-1/2 top-[54px] w-[480px] text-black text-[20px] leading-[20px] tracking-[0.48px] uppercase text-left font-[family-name:var(--font-thermochrome)] font-semibold">
        Hi, I am John. I&apos;m a passionate interaction designer dedicated to
        crafting exceptional user experiences by empathizing with and
        understanding people&apos;s perspectives. My expertise extends to
        enhancing both the UX and UI of products, ensuring they are not only
        user-friendly but visually appealing.
      </p>

      {/* Contact block, top right */}
      <div className="absolute right-[51px] top-[54px] text-black text-[20px] tracking-[0.48px] uppercase text-left whitespace-nowrap font-[family-name:var(--font-thermochrome)] font-semibold leading-[20px]">
        <p>Brisbane, Australia</p>
        <p>Available for freelance works</p>
        <p>johnjoro15@gmail.com</p>
      </div>

      {/* Nav pills — Projects (left) / Gallery (right) */}
      <a
        href="/projects"
        className="absolute left-[51px] top-[481px] w-[148px] h-[41px] flex items-center justify-center text-black text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-medium group"
      >
        <svg
          className="absolute inset-0 w-full h-full transition-opacity group-hover:opacity-60"
          viewBox="0 0 148 41"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="74" cy="20.5" rx="73.5" ry="20" stroke="#FC8EF1" strokeWidth="1" />
        </svg>
        <span className="relative z-10">Projects</span>
      </a>
      <a
        href="/gallery"
        className="absolute right-[51px] top-[481px] w-[148px] h-[41px] flex items-center justify-center text-black text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-medium group"
      >
        <svg
          className="absolute inset-0 w-full h-full transition-opacity group-hover:opacity-60"
          viewBox="0 0 148 41"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="74" cy="20.5" rx="73.5" ry="20" stroke="#FC8EF1" strokeWidth="1" />
        </svg>
        <span className="relative z-10">Gallery</span>
      </a>

      {/* Name badge, dead center */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[370px] w-[572px] h-[230px] flex items-center justify-center">
        {/* Swap this div for your exported green sticker-shape SVG/PNG as the
            background, then layer the two fonts on top exactly like Figma */}
        <div className="absolute inset-0 bg-[#7ED957] [clip-path:polygon(8%_0,92%_0,100%_18%,100%_82%,92%_100%,8%_100%,0_82%,0_18%)]" />
        <p className="relative text-[96px] leading-none tracking-[-0.96px] uppercase font-[family-name:var(--font-neue-bit)] font-bold">
          <span className="font-[family-name:var(--font-condiment)] normal-case">J</span>
          hn{' '}
          <span className="font-[family-name:var(--font-condiment)] normal-case">o</span>
          SE
        </p>
      </div>

      {/* Floating object photos — swap src for your exported images in /public */}
      <FloatingImage
        src="/images/cat.png"
        alt="Floating cat photo"
        width={260}
        height={230}
        className="absolute left-[100px] top-[150px]"
        rotate={-6}
        floatDelay={0}
      />
      <FloatingImage
        src="/images/headphones.png"
        alt="Floating headphones photo"
        width={278}
        height={275}
        className="absolute left-[190px] top-[590px]"
        rotate={10}
        floatDelay={0.8}
      />
      <FloatingImage
        src="/images/vinyl.png"
        alt="Floating vinyl record photo"
        width={266}
        height={211}
        className="absolute right-[210px] top-[589px]"
        rotate={-4}
        floatDelay={1.6}
      />

      {/* Footer row */}
      <p className="absolute left-[51px] bottom-[40px] text-black text-[20px] font-[family-name:var(--font-thermochrome)] font-semibold">
        27° 28&apos; 04&quot; S, 153° 01&apos; 41&quot; E
      </p>
      <div className="absolute right-[51px] bottom-[40px] flex items-center gap-6 text-black text-[20px] tracking-[0.48px] uppercase font-[family-name:var(--font-thermochrome)] font-semibold">
        <span>[</span>
        <a href="https://behance.net" target="_blank" rel="noopener noreferrer" className="hover:opacity-60">
          Behance
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-60">
          Linkedin
        </a>
        <a href="https://medium.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-60">
          Medium
        </a>
        <span>]</span>
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

2. Images: export the cat, headphones, and vinyl photos from Figma
   (right-click layer → Export) as PNG, and place them in /public/images/
   with the filenames referenced above.

3. Name badge shape: the green sticker background here is a rough
   CSS clip-path approximation. For an exact match to your Figma vector,
   export that shape as an SVG from Figma and swap it in as a background
   image instead — much closer to pixel-perfect than a CSS shape.

4. This uses fixed pixel positioning (matches your 1024px-wide Figma
   frame). It will look correct on a standard desktop viewport but will
   overflow/clip on smaller screens — expected for now per your call to
   get desktop working first.
*/