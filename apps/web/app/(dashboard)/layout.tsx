'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Project } from '@voiceops/shared';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);

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
