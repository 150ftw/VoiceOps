import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VoiceOps — Agentic Voice-Based DevOps Engineer',
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
        className={`${inter.variable} ${mono.variable} ${outfit.variable} ${jakarta.variable} font-sans bg-[#030206] text-slate-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
