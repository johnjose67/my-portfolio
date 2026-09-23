import { neueBit, condiment, thermochrome } from '@/lib/fonts';
import AsciiCursor from '@/components/AsciiCursor';
import './globals.css';

export const metadata = {
  title: 'John Jose — Interaction Designer',
  description: 'Portfolio of John Jose, interaction designer based in Brisbane, Australia.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${neueBit.variable} ${condiment.variable} ${thermochrome.variable}`}
    >
      <body className="overflow-hidden">
        {children}
        {/* Full-screen cursor trail effect — sits above all page content,
            but pointer-events-none so it never blocks clicks/links underneath.
            scale-90 below md shrinks it 10% for mobile only; md:scale-100
            restores full size on desktop, completely unchanged. */}
        <div className="fixed inset-0 pointer-events-none z-[9999] scale-90 md:scale-100">
          <AsciiCursor label={false} />
        </div>
      </body>
    </html>
  );
}