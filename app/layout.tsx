import { neueBit, condiment, thermochrome } from '@/lib/fonts';
import AsciiCursor from '@/components/AsciiCursor';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata = {
  title: 'John Jose — Interaction Designer',
  description: 'Portfolio of John Jose, interaction designer based in Brisbane, Australia.',
  other: {
    'format-detection': 'telephone=no, email=no, address=no',
  },
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
        <div className="fixed inset-0 pointer-events-none z-[9999] scale-90 md:scale-100">
          <AsciiCursor label={false} />
        </div>
        <Analytics />
      </body>
    </html>
  );
}