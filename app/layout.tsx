import { neueBit, condiment, thermochrome } from '@/lib/fonts';
import './globals.css';

export const metadata = {
  title: 'John Jose — Interaction Designer',
  description: 'Portfolio of John Jose, interaction designer based in Brisbane, Australia.',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${neueBit.variable} ${condiment.variable} ${thermochrome.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}