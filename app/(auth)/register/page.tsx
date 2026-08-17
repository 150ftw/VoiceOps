'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Github, ShieldCheck, GitBranch, Zap } from 'lucide-react';
import logoImg from '@/public/logo.png';
import { apiRequest, setAuthToken, getAuthToken } from '@/lib/api-client';
import { Suspense } from 'react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getAuthToken()) {
      const redirect = searchParams?.get('redirect') || '/overview';
      router.replace(redirect);
    }
  }, [router, searchParams]);

  const handleGitHubLogin = () => {
    setIsLoading(true);
    setError(null);
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Ov23livqbvm2o1wqn6oE';
    const scope = 'user:email,repo,workflow,read:org';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(scope)}`;
  };

  return (
    <div className="min-h-screen bg-[#030206] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Grid Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(168,85,247,0.07)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
      {/* Glow Orbs */}
      <div className="absolute w-[600px] h-[600px] bg-purple-600/12 rounded-full blur-[140px] pointer-events-none -top-32 -left-32" />
      <div className="absolute w-[500px] h-[500px] bg-fuchsia-700/8 rounded-full blur-[160px] pointer-events-none -bottom-32 -right-32" />

      {/* Back Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-xs text-slate-400 hover:text-purple-300 transition-colors px-3 py-1.5 rounded-full bg-[#090514]/80 border border-purple-500/20 backdrop-blur-md"
        >
          <span>←</span>
          <span className="uppercase tracking-wider">Back</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-sm relative z-10">
        {/* Top glow rim */}
        <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-purple-400/80 to-transparent" />

        <div className="bg-[#07040f]/95 border border-purple-500/25 rounded-3xl p-10 shadow-[0_0_100px_rgba(147,51,234,0.15)] backdrop-blur-2xl space-y-8 overflow-hidden">

          {/* Brand */}
          <div className="text-center space-y-4">
            <Link href="/" className="inline-block group">
              <div className="relative mx-auto w-fit">
                <div className="absolute -inset-5 bg-purple-600/25 rounded-full blur-xl group-hover:bg-purple-500/40 transition-all duration-500" />
                <Image
                  src={logoImg}
                  alt="VoiceOps"
                  priority
                  className="relative w-14 h-14 object-contain drop-shadow-[0_0_30px_rgba(168,85,247,0.9)] group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </Link>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
                <span>Join</span>
                <span className="font-glitch text-purple-200 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                  VOICEOPS
                </span>
              </h1>
              <p className="text-[11px] font-mono text-purple-300/70 uppercase tracking-widest">
                Voice-Native Autonomous DevOps
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-start gap-2">
              <span className="mt-px shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* GitHub OAuth Button — PRIMARY */}
          <button
            type="button"
            onClick={handleGitHubLogin}
            disabled={isLoading}
            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#1a0f2e] to-[#120a22] hover:from-[#2a1a4e] hover:to-[#1a0f3e] border border-purple-500/40 hover:border-purple-400/70 text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-[0_0_40px_rgba(168,85,247,0.2)] hover:shadow-[0_0_60px_rgba(168,85,247,0.35)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            ) : (
              <svg
                className="w-5 h-5 fill-white group-hover:fill-purple-200 transition-colors"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            )}
            <span>{isLoading ? 'Redirecting to GitHub…' : 'Continue with GitHub'}</span>
          </button>

          {/* What you get */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 text-center">
              Instant access with your GitHub profile
            </p>
            <div className="space-y-2">
              {[
                { icon: GitBranch, label: 'Read & write your repositories' },
                { icon: Zap, label: 'Trigger workflows & pipelines' },
                { icon: ShieldCheck, label: 'Create issues, PRs & deployments' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-purple-950/30 border border-purple-500/15">
                  <Icon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="text-xs text-slate-300 font-mono">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center font-mono text-xs text-slate-400 pt-2 border-t border-purple-500/15">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-300 hover:text-white font-bold transition-colors">
              Sign In →
            </Link>
          </div>
        </div>
      </div>

      {/* Security badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-8 font-mono text-[10px] text-slate-600 uppercase tracking-widest z-10">
        <span>🔒 AES-256 Encrypted</span>
        <span>•</span>
        <span>⚡ OAuth 2.0</span>
        <span>•</span>
        <span>🛡️ Zero Plaintext Secrets</span>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030206] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
