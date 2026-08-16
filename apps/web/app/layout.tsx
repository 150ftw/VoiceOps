import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

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
      <body className={`${inter.variable} ${mono.variable} font-sans bg-[#090D16] text-slate-100 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
