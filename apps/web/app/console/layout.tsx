'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Project } from '@voiceops/shared';
import { getAuthToken } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

function useAuthGuard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login?redirect=/console/workspace');
      return;
    }
    setChecking(false);
  }, [router]);

  return checking;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const isChecking = useAuthGuard();

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="font-mono text-xs text-purple-400/70 uppercase tracking-widest">
            Verifying session…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#090D16] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activeProject={activeProject} onSelectProject={setActiveProject} />
        <main className="flex-1 overflow-y-auto p-6 bg-[#090D16]">{children}</main>
      </div>
    </div>
  );
}
