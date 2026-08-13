import localFont from 'next/font/local';

// Drop your actual font files into /public/fonts/ and update the paths below
// to match the exact filenames you have (woff2 preferred for web performance).

export const neueBit = localFont({
  src: '../public/fonts/PPNeueBit-Bold.otf',
  variable: '--font-neue-bit',
  display: 'swap',
});

export const condiment = localFont({
  src: '../public/fonts/Condiment-Regular.ttf',
  variable: '--font-condiment',
  display: 'swap',
});

export const thermochrome = localFont({
  src: [
    {
      path: '../public/fonts/MDThermochrome0.3-Medium-Trial.otf',
      weight: '500',
    },
    {
      path: '../public/fonts/MDThermochrome0.3-Semibold-Trial.otf',
      weight: '600',
    },
  ],
  variable: '--font-thermochrome',
  display: 'swap',
});