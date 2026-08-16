'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Zap, AlertCircle } from 'lucide-react';
import { apiRequest, setAuthToken } from '@/lib/api-client';

function GitHubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      if (!code) {
        setError('No authorization code received from GitHub.');
        return;
      }

      try {
        const data = await apiRequest('/auth/github/login', {
          method: 'POST',
          body: JSON.stringify({ code }),
        });

        if (data.access_token) {
          setAuthToken(data.access_token);
          router.push('/overview');
        } else {
          setError('Failed to retrieve access token.');
        }
      } catch (err: any) {
        setError(err.message || 'GitHub OAuth authentication failed.');
      }
    }

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 mx-auto flex items-center justify-center text-white shadow-lg glow-indigo">
          <Zap className="w-6 h-6 fill-current" />
        </div>

        {error ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h2 className="text-sm font-bold">Authentication Failed</h2>
            </div>
            <p className="text-xs text-slate-400">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-100">Connecting to GitHub...</h2>
            <p className="text-xs text-slate-400">Securing your session with VoiceOps</p>
            <div className="flex justify-center pt-2">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-white">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      }
    >
      <GitHubCallbackContent />
    </Suspense>
  );
}
