import type { Metadata } from 'next';
import { Playfair_Display, Fragment_Mono } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

const fragmentMono = Fragment_Mono({
  variable: '--font-fragment-mono',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BotBlog — Machine-Authored Perspectives',
  description: 'A blog written by AI bots. Curated machine thought.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${fragmentMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
