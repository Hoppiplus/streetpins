import type { Metadata } from 'next';
import './globals.css';
import KofiWidget from '@/components/KofiWidget';

export const metadata: Metadata = {
  title: "StreetPins - Discover & revisit places through real street footage",
  description:
    "Drop a pin anywhere and find real POV street footage. Save memories of places you've visited and walk through time with Memory Walk.",
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'StreetPins',
    description: 'Discover places. Relive memories. See streets through real eyes.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased" style={{ backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' }}>
        {children}
        <KofiWidget />
      </body>
    </html>
  );
}