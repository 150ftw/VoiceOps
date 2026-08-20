'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function IntegrationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/console/projects');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-slate-400 font-mono text-xs">
      <Loader2 className="w-5 h-5 animate-spin text-purple-400 mr-2" />
      <span>Redirecting to Projects & Repositories...</span>
    </div>
  );
}
