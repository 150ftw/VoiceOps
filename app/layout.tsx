import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Outfit, Rubik_Glitch } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});
const rubikGlitch = Rubik_Glitch({
  subsets: ['latin'],
  variable: '--font-glitch',
  weight: '400',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VoiceOps',
  description:
    'Investigate GitHub CI/CD failures, analyze deployment logs, search documentation via RAG, and execute safe DevOps actions with voice AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${mono.variable} ${outfit.variable} ${rubikGlitch.variable} font-sans bg-[#030206] text-slate-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
