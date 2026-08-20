'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logoImg from '../public/logo.png';
import {
  Mic,
  Zap,
  ShieldCheck,
  GitBranch,
  Terminal,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Bot,
  Activity,
  Layers,
  Database,
  Lock,
  LogOut,
  LayoutDashboard,
  Github,
  Play,
  Check,
  ChevronRight,
  Cpu,
  Radio,
  FileCode2,
  GitPullRequest,
  AlertTriangle,
  Volume2,
  VolumeX,
  Code2,
  Workflow,
  Search,
  KeyRound,
  ExternalLink,
  ChevronDown,
  Globe,
  Boxes,
  Sliders,
  Shield,
  Menu,
  X,
  RefreshCw,
  Plus,
  Minus,
} from 'lucide-react';
import FlowingMenu from '@/components/landing/FlowingMenu';
import { apiRequest, clearAuthToken, getAuthToken } from '@/lib/api-client';
import { HeroBackground } from '@/components/landing/hero-background';
import Scanner from '@/components/landing/Scanner';
import TextType from '@/components/ui/TextType';

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'diff' | 'rag' | 'approval'>('diagnosis');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [mockApprovalDone, setMockApprovalDone] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string>("Why did my latest deployment to production fail?");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showTelemetryBox, setShowTelemetryBox] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const token = getAuthToken();
      if (token) {
        try {
          const user = await apiRequest('/auth/me');
          setCurrentUser(user);
        } catch (_) {
          clearAuthToken();
        }
      }
      setIsLoadingUser(false);
    }
    checkAuth();

    // Show telemetry popup after 10 seconds
    const timer = setTimeout(() => {
      setShowTelemetryBox(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = () => {
    clearAuthToken();
    setCurrentUser(null);
  };

  const toggleMockVoice = () => {
    if (isPlayingVoice) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingVoice(false);
      return;
    }

    setIsPlayingVoice(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "I analyzed workflow run 1245 for demo-app. The Docker build failed due to Python 3.13 bcrypt incompatibility. Would you like me to open a pull request to patch it?"
      );
      utterance.rate = 1.05;
      utterance.onend = () => setIsPlayingVoice(false);
      utterance.onerror = () => setIsPlayingVoice(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const SCENARIOS: Record<
    string,
    {
      query: string;
      telemetry: string[];
      diagnosis: {
        title: string;
        badge: string;
        header: string;
        details: string[];
        fix: string;
      };
      diff: {
        file: string;
        changes: string;
        lines: { type: 'header' | 'del' | 'add' | 'ctx'; text: string }[];
      };
      runbook: {
        title: string;
        id: string;
        similarity: string;
        excerpt: string;
      };
      approval: {
        title: string;
        description: string;
        branch: string;
        actionText: string;
        completedText: string;
      };
    }
  > = {
    "Why did my latest deployment to production fail?": {
      query: "Why did my latest deployment to production fail?",
      telemetry: [
        "Analyzed GitHub Actions workflow run #1245 (Docker Build & Deploy)",
        "Isolated stack trace error in pip install -r requirements.txt (Line 14)",
      ],
      diagnosis: {
        title: "Root Cause: Python 3.13 / bcrypt Dependency Mismatch",
        badge: "Exit Code: 1",
        header: "# Workflow Run #1245 • Job: docker_build",
        details: [
          "ERROR: Failed building wheel for bcrypt (Legacy C-extension build failed)",
          "• Python 3.13 removed deprecated Py_UNICODE APIs used in bcrypt < 4.0.0",
        ],
        fix: "• Recommended Fix: Pin python:3.11-slim base image or upgrade bcrypt >= 4.1.2",
      },
      diff: {
        file: "Dockerfile",
        changes: "+1 / -1 lines",
        lines: [
          { type: "header", text: "@@ -1,3 +1,3 @@" },
          { type: "del", text: "- FROM python:3.13-rc-slim AS base" },
          { type: "add", text: "+ FROM python:3.11-slim AS base" },
          { type: "ctx", text: "  WORKDIR /app" },
          { type: "ctx", text: "  COPY requirements.txt ." },
        ],
      },
      runbook: {
        title: "Docker Build Standards • Production Runbook",
        id: "Runbook ID: DOC-204",
        similarity: "94.2% Similarity",
        excerpt: "“All microservices deployed to AWS EKS production cluster must pin LTS Python 3.11 runtimes.”",
      },
      approval: {
        title: "Cryptographic Approval Required",
        description: "VoiceOps wants to open a pull request to patch Docker base image to Python 3.11 LTS.",
        branch: "patch/fix-python-base-image",
        actionText: "Approve & Create PR",
        completedText: "PR Created! #1492",
      },
    },
    "Rollback latest container release": {
      query: "Rollback latest container release",
      telemetry: [
        "Identified unhealthy target group: web-api-service (HTTP 502 Bad Gateway)",
        "Located previous stable image digest: sha256:4a8f9c1b (v2.4.1)",
      ],
      diagnosis: {
        title: "Canary Failure: Latency Spike to 4,200ms on v2.4.2",
        badge: "HTTP 502 (2.8% errors)",
        header: "# Kubernetes Deployment • namespace: production",
        details: [
          "CRITICAL: Target group response time exceeded SLA (> 2,000ms)",
          "• 4 pods failing readiness probes on /api/v1/healthz",
        ],
        fix: "• Recommended Action: Trigger zero-downtime rollback to deployment/web-api:v2.4.1",
      },
      diff: {
        file: "k8s/deployment.yaml",
        changes: "+1 / -1 lines",
        lines: [
          { type: "header", text: "@@ -18,3 +18,3 @@" },
          { type: "del", text: "- image: ghcr.io/shivamsharma/voiceops-api:v2.4.2" },
          { type: "add", text: "+ image: ghcr.io/shivamsharma/voiceops-api:v2.4.1" },
          { type: "ctx", text: "  imagePullPolicy: IfNotPresent" },
          { type: "ctx", text: "  replicas: 12" },
        ],
      },
      runbook: {
        title: "P1 Incident Automated Rollback Protocol",
        id: "Runbook ID: INC-SEV-09",
        similarity: "98.7% Similarity",
        excerpt: "“Automated rollback authorized without downtime when 5xx error rate exceeds 2.5% for > 60 seconds.”",
      },
      approval: {
        title: "Production Rollback Authorization",
        description: "VoiceOps wants to execute immediate blue/green rollback to stable revision 48.",
        branch: "ops/rollback-to-v2.4.1",
        actionText: "Approve & Execute Rollback",
        completedText: "Rollback Completed! Traffic 100% on v2.4.1",
      },
    },
    "Fix memory leak in redis worker": {
      query: "Fix memory leak in redis worker",
      telemetry: [
        "Sampled heap dump from worker-pool-7 (RSS Memory: 3.8GB / Limit: 4.0GB)",
        "Identified unclosed Redis client connections in celery task queue",
      ],
      diagnosis: {
        title: "OOM Warning: Connection Pool Starvation in async_worker.py",
        badge: "RSS 94.2% (3.8 GB)",
        header: "# Worker Pod: redis-worker-7c89f • PID 482",
        details: [
          "WARNING: Redis connection leak detected: 4,812 open file descriptors",
          "• Missing connection.close() in @celery_app.task errorHandler",
        ],
        fix: "• Recommended Fix: Wrap client in AsyncRedisContextManager context manager",
      },
      diff: {
        file: "services/worker/tasks.py",
        changes: "+2 / -1 lines",
        lines: [
          { type: "header", text: "@@ -44,3 +44,4 @@" },
          { type: "del", text: "- client = get_redis_client()" },
          { type: "add", text: "+ with get_redis_connection_context() as client:" },
          { type: "add", text: "+     await client.process_queue_payload(payload)" },
          { type: "ctx", text: "  return {'status': 'processed'}" },
        ],
      },
      runbook: {
        title: "Celery & Redis Concurrency Standards",
        id: "Runbook ID: RB-REDIS-301",
        similarity: "96.4% Similarity",
        excerpt: "“Worker pools must utilize connection pooling context managers to prevent socket FD exhaustion under high throughput.”",
      },
      approval: {
        title: "Memory Leak Patch Approval",
        description: "VoiceOps wants to open pull request to wrap Redis client in auto-closing context manager.",
        branch: "fix/redis-connection-context-leak",
        actionText: "Approve & Deploy Patch",
        completedText: "Patch Deployed! Heap Normal (412 MB)",
      },
    },
    "Run security audit on IAM roles": {
      query: "Run security audit on IAM roles",
      telemetry: [
        "Scanned 28 AWS IAM policies across production AWS account (us-east-1)",
        "Flagged 2 overly permissive wildcards (*:*) in CI/CD deployment role",
      ],
      diagnosis: {
        title: "Security Alert: Wildcard AdministratorAccess in deploy-bot",
        badge: "CIS AWS 1.16 Violation",
        header: "# IAM Role: arn:aws:iam::123456789012:role/github-actions-deploy",
        details: [
          "VIOLATION: Action: [\"*\"] with Resource: [\"*\"] detected on CI role",
          "• Over-privileged role allows arbitrary IAM privilege escalation",
        ],
        fix: "• Recommended Fix: Scope down to ecr:PutImage and eks:UpdateClusterConfig",
      },
      diff: {
        file: "terraform/iam/deploy_role.tf",
        changes: "+3 / -1 lines",
        lines: [
          { type: "header", text: "@@ -12,3 +12,5 @@" },
          { type: "del", text: "- actions   = [\"*\"]" },
          { type: "add", text: "+ actions   = [" },
          { type: "add", text: "+   \"ecr:GetAuthorizationToken\", \"ecr:BatchCheckLayerAvailability\"," },
          { type: "add", text: "+   \"eks:DescribeCluster\", \"eks:UpdateClusterConfig\"" },
          { type: "ctx", text: "  ]" },
        ],
      },
      runbook: {
        title: "Principle of Least Privilege Security Standard",
        id: "Runbook ID: SEC-IAM-101",
        similarity: "99.1% Similarity",
        excerpt: "“Automated deployment bots must not possess iam:* or sts:AssumeRole permissions beyond designated deployment namespace.”",
      },
      approval: {
        title: "IAM Least-Privilege Policy Update",
        description: "VoiceOps wants to open a Terraform pull request to restrict CI/CD bot to scoped ECR/EKS actions.",
        branch: "security/scope-down-deploy-role",
        actionText: "Approve & Apply Terraform",
        completedText: "IAM Scoped! Compliance Passed (100%)",
      },
    },
  };

  const currentScenario =
    SCENARIOS[selectedPrompt] || SCENARIOS["Why did my latest deployment to production fail?"];

  return (
    <div className="min-h-screen bg-[#030206] text-slate-100 selection:bg-purple-500/30 selection:text-purple-200 relative overflow-x-hidden font-sans antialiased">
      {/* Background Looping Ambient Video & Particle Sine Wavefield */}
      <HeroBackground />

      {/* React Bits WebGL Scanner Field Background */}
      <div className="absolute inset-0 h-[1000px] pointer-events-none z-0 overflow-hidden">
        <Scanner
          color1="#581C87"
          color2="#C084FC"
          color3="#FFFFFF"
          speed={0.45}
          sweepSpeed={0.3}
          sweepWidth={0.9}
          sweepFalloff={2.8}
          scale={1.4}
          frequency={2.2}
          ripple={0.22}
          bandDensity={11}
          lineSharpness={5.0}
          glow={0.38}
          scanDirection="vertical"
          colorSpread={0.7}
          brightness={1.0}
          contrast={1.15}
          softness={1.4}
          vignette={0.45}
          scanline={true}
          grain={true}
          grainIntensity={0.04}
          opacity={0.8}
          mouseInteraction={true}
          mouseRadius={0.5}
          mouseStrength={0.5}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030206]/40 via-transparent to-[#030206] pointer-events-none" />
      </div>

      {/* Editorial Luxury Header */}
      <header className="relative z-50 w-full px-6 sm:px-12 pt-6 flex items-center justify-between font-mono text-xs text-purple-200/80">
        {/* Left Actions */}
        <div className="flex items-center gap-6 z-10">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 hover:text-white transition-colors group tracking-widest uppercase font-semibold"
          >
            <div className="flex flex-col gap-1 w-4">
              <span className="w-full h-0.5 bg-purple-300 group-hover:bg-white transition-colors" />
              <span className="w-3 h-0.5 bg-purple-300 group-hover:bg-white transition-colors" />
            </div>
            <span>Menu</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 z-10">
          <span className="hidden md:inline-block text-[11px] text-purple-400/80 uppercase tracking-widest font-mono">
            V1.0 &bull; LIVE
          </span>

          {currentUser ? (
            <Link
              href="/console/workspace"
              className="px-4 py-1.5 rounded-full bg-purple-200 hover:bg-white text-slate-950 font-bold tracking-wider text-[11px] uppercase transition-all shadow-lg glow-purple"
            >
              Workspace
            </Link>
          ) : (
            <Link
              href="/register"
              className="px-4 py-1.5 rounded-full bg-purple-200 hover:bg-white text-slate-950 font-bold tracking-wider text-[11px] uppercase transition-all shadow-lg glow-purple"
            >
              Get Started
            </Link>
          )}
        </div>
      </header>

      {/* Full-Screen Flowing Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#030206] flex flex-col justify-between animate-in fade-in duration-300">
          {/* Top Bar with Logo and Close Button */}
          <div className="h-20 px-6 sm:px-12 flex items-center justify-between border-b border-purple-500/20 bg-[#030206]/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Image
                src={logoImg}
                alt="VoiceOps Logo"
                className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]"
              />
              <span className="text-xl sm:text-2xl font-glitch text-purple-200 tracking-widest uppercase">
                VOICEOPS
              </span>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2.5 text-purple-300 hover:text-white hover:scale-110 transition-all rounded-full border border-purple-500/30 hover:border-purple-400 bg-purple-950/40"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Flowing Menu Component */}
          <div className="flex-1 w-full relative overflow-hidden">
            <FlowingMenu
              items={[
                {
                  link: '/workspace',
                  text: 'Live Voice Workspace',
                  image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&h=400&fit=crop&auto=format',
                },
                {
                  link: '/projects',
                  text: 'Repositories & Projects',
                  image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&h=400&fit=crop&auto=format',
                },
                {
                  link: '/knowledge',
                  text: 'pgvector Knowledge Base',
                  image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=600&h=400&fit=crop&auto=format',
                },
                {
                  link: '/founder',
                  text: 'Founder // Shivam Sharma',
                  image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&h=400&fit=crop&auto=format',
                },
                {
                  link: 'https://github.com/150ftw/VoiceOps',
                  text: 'GitHub Repository',
                  image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=600&h=400&fit=crop&auto=format',
                },
              ]}
              speed={14}
              textColor="#E9D5FF"
              bgColor="#030206"
              marqueeBgColor="#A855F7"
              marqueeTextColor="#030206"
              borderColor="rgba(168, 85, 247, 0.18)"
              onItemClick={() => setIsMenuOpen(false)}
            />
          </div>

          {/* Bottom Bar */}
          <div className="h-16 px-6 sm:px-12 flex items-center justify-between border-t border-purple-500/20 bg-[#030206]/90 backdrop-blur-md text-[11px] font-mono text-slate-500 uppercase tracking-widest">
            <span>&copy; 2026 VoiceOps Autonomous DevOps</span>
            <span className="text-purple-400 font-semibold">100% OPERATIONAL &bull; V1.0</span>
          </div>
        </div>
      )}

      {/* Hero Section — Editorial Brutalist Showcase */}
      <section className="relative pt-24 pb-16 px-6 sm:px-12 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[75vh] text-center z-10 select-none">
        {/* Top Sub-Header with React Bits TextType */}
        <div className="w-full flex items-center justify-center text-center font-mono text-xs sm:text-sm text-purple-300/90 tracking-[0.25em] uppercase mb-4 min-h-[1.75rem]">
          <TextType
            as="div"
            text={[
              'AUTONOMOUS DEVOPS VOICE ENGINE',
              'REAL-TIME INCIDENT TRIAGE',
              'DEEP AST CODEBASE REASONING',
              'SUB-SECOND NEURAL SPEECH AI',
              'ZERO-WRITE SECURITY GUARDRAILS',
            ]}
            typingSpeed={60}
            deletingSpeed={35}
            pauseDuration={2400}
            showCursor={true}
            cursorCharacter="|"
            className="flex items-center justify-center text-center font-mono text-xs sm:text-sm text-purple-300 tracking-[0.22em] sm:tracking-[0.25em] uppercase drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]"
            cursorClassName="text-purple-400 font-mono drop-shadow-[0_0_10px_rgba(192,132,252,0.9)] ml-1"
          />
        </div>

        {/* Massive Centerpiece Display Headline with Dynamic Responsive Holographic Aura */}
        <div className="relative w-full max-w-4xl mx-auto flex items-center justify-center py-6 my-2 group cursor-pointer">
          {/* Dynamic Holographic Crest Backdrop */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-0">
            {/* Pulsing Ambient Radial Orb */}
            <div className="absolute w-72 sm:w-96 md:w-[480px] h-72 sm:h-96 md:h-[480px] bg-purple-600/30 rounded-full blur-[90px] group-hover:w-[580px] group-hover:h-[580px] group-hover:bg-purple-500/55 group-hover:blur-[120px] transition-all duration-700 ease-out animate-pulse-subtle" />

            {/* Glowing Crystalline Hologram */}
            <Image
              src={logoImg}
              alt="VoiceOps Logo Backdrop"
              priority
              className="w-72 sm:w-96 md:w-[460px] lg:w-[500px] h-auto object-contain mix-blend-screen opacity-40 sm:opacity-50 scale-95 group-hover:scale-130 group-hover:opacity-100 group-hover:brightness-125 group-hover:-translate-y-4 transition-all duration-700 ease-out drop-shadow-[0_0_50px_rgba(168,85,247,0.6)] group-hover:drop-shadow-[0_0_120px_rgba(192,132,252,0.95)]"
              style={{ animation: 'float 7s ease-in-out infinite' }}
            />
          </div>

          {/* Foreground Glitch Typography */}
          <h1 className="relative z-10 text-4xl sm:text-7xl md:text-9xl lg:text-[10rem] font-glitch uppercase scale-y-95 w-full flex flex-col items-center justify-center gap-1 sm:gap-2 select-none text-center">
            {/* VOICE Row */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 group-hover:gap-2 sm:group-hover:gap-4 md:group-hover:gap-6 transition-all duration-700 ease-out">
              {[
                { char: 'V', delay: '0.1s', duration: '3.4s', color: 'text-purple-100/90' },
                { char: 'O', delay: '1.4s', duration: '4.2s', color: 'text-purple-200/90' },
                { char: 'I', delay: '0.6s', duration: '2.8s', color: 'text-purple-100/85' },
                { char: 'C', delay: '2.1s', duration: '3.9s', color: 'text-purple-300/90' },
                { char: 'E', delay: '0.9s', duration: '4.6s', color: 'text-purple-200/95' },
              ].map((item, idx) => (
                <span
                  key={`voice-${idx}`}
                  data-text={item.char}
                  className={`glitch-letter inline-block ${item.color} drop-shadow-[0_0_35px_rgba(168,85,247,0.35)] transition-all duration-700 ease-out group-hover:scale-102`}
                  style={
                    {
                      '--glitch-delay': item.delay,
                      '--glitch-duration': item.duration,
                    } as React.CSSProperties
                  }
                >
                  {item.char}
                </span>
              ))}
            </div>

            {/* OPS Row */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 group-hover:gap-3 sm:group-hover:gap-5 md:group-hover:gap-7 transition-all duration-700 ease-out">
              {[
                { char: 'O', delay: '1.1s', duration: '3.7s', color: 'text-purple-200/90' },
                { char: 'P', delay: '1.8s', duration: '4.4s', color: 'text-purple-100/90' },
                { char: 'S', delay: '0.4s', duration: '3.2s', color: 'text-purple-300/90' },
              ].map((item, idx) => (
                <span
                  key={`ops-${idx}`}
                  data-text={item.char}
                  className={`glitch-letter inline-block ${item.color} drop-shadow-[0_0_35px_rgba(168,85,247,0.35)] transition-all duration-700 ease-out group-hover:scale-102`}
                  style={
                    {
                      '--glitch-delay': item.delay,
                      '--glitch-duration': item.duration,
                    } as React.CSSProperties
                  }
                >
                  {item.char}
                </span>
              ))}
            </div>
          </h1>
        </div>

        {/* Secondary Subtitle */}
        <p className="font-mono text-xs sm:text-sm text-purple-300/80 max-w-xl mx-auto tracking-widest uppercase mt-4">
          Talk to your infrastructure. Fix CI/CD in seconds.
        </p>

        {/* Sleek Minimalist Editorial Feature Capsule */}
        <div className="w-full max-w-3xl mx-auto mt-8 p-1.5 sm:p-2 rounded-2xl sm:rounded-full bg-[#080412]/80 border border-purple-500/25 backdrop-blur-2xl shadow-[0_0_35px_rgba(168,85,247,0.12)] flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2 text-xs font-mono select-none">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
            <span className="text-[10px] font-bold text-purple-300/90 uppercase tracking-widest">INTELLIGENCE</span>
            <span className="text-slate-500 font-sans">&bull;</span>
            <span className="text-slate-300 font-sans text-xs font-normal">Gemini 1.5 &bull; Deep AST</span>
          </div>

          <div className="hidden sm:block w-[1px] h-4 bg-purple-500/20" />

          <div className="flex items-center gap-2 px-3 sm:px-4 py-1 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse shadow-[0_0_8px_rgba(232,121,249,0.8)]" />
            <span className="text-[10px] font-bold text-fuchsia-300/90 uppercase tracking-widest">VOICE</span>
            <span className="text-slate-500 font-sans">&bull;</span>
            <span className="text-slate-300 font-sans text-xs font-normal">180ms Neural STT/TTS</span>
          </div>

          <div className="hidden sm:block w-[1px] h-4 bg-purple-500/20" />

          <div className="flex items-center gap-2 px-3 sm:px-4 py-1 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] font-bold text-emerald-300/90 uppercase tracking-widest">GUARDRAILS</span>
            <span className="text-slate-500 font-sans">&bull;</span>
            <span className="text-slate-300 font-sans text-xs font-normal">Cryptographic Auth</span>
          </div>
        </div>

        {/* Centered Interactive CTA & Audio Meter */}
        <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          {/* Multi-Bar Audio Level Waveform with Neural Synth */}
          <button
            onClick={toggleMockVoice}
            className="flex items-center gap-3 font-mono text-xs text-purple-300 p-3 px-6 rounded-full bg-[#090514]/90 border border-purple-500/30 hover:border-purple-400/70 hover:bg-purple-950/40 backdrop-blur-md transition-all shadow-lg group cursor-pointer"
          >
            <div className="flex items-end gap-1 h-5 origin-bottom">
              <span className="w-1 bg-purple-400 animate-[wave_0.8s_ease-in-out_infinite] h-3 rounded-full origin-bottom" />
              <span className="w-1 bg-purple-300 animate-[wave_1.2s_ease-in-out_infinite_0.2s] h-5 rounded-full origin-bottom" />
              <span className="w-1 bg-purple-500 animate-[wave_0.9s_ease-in-out_infinite_0.4s] h-2 rounded-full origin-bottom" />
              <span className="w-1 bg-fuchsia-400 animate-[wave_1.1s_ease-in-out_infinite_0.1s] h-4 rounded-full origin-bottom" />
              <span className="w-1 bg-purple-300 animate-[wave_0.7s_ease-in-out_infinite_0.3s] h-3 rounded-full origin-bottom" />
              <span className="w-1 bg-purple-400 animate-[wave_1.0s_ease-in-out_infinite_0.15s] h-5 rounded-full origin-bottom" />
              <span className="w-1 bg-fuchsia-300 animate-[wave_0.85s_ease-in-out_infinite_0.35s] h-3 rounded-full origin-bottom" />
            </div>
            <span className="text-[11px] uppercase tracking-widest text-purple-200 group-hover:text-white transition-colors">
              {isPlayingVoice ? '◼ Pause Voice Demo' : '▶ Play Voice Demo'}
            </span>
          </button>

          <Link
            href="/workspace"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all flex items-center gap-2"
          >
            <span>Launch Studio</span>
            <span>↗</span>
          </Link>
        </div>
      </section>

      {/* Interactive DevOps Studio Console Simulation */}
      <section id="console-preview" className="py-16 px-6 max-w-5xl mx-auto relative z-10">
        <div className="rounded-3xl bg-[#080412] border border-purple-500/20 shadow-2xl overflow-hidden">
          {/* macOS Terminal Window Header */}
          <div className="px-5 py-3.5 bg-[#040209] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-semibold text-slate-200 font-mono">VoiceOps Studio Session</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-purple-400 font-mono">shivamsharma/demo-app (main)</span>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0f0821] border border-purple-500/20 text-xs font-medium font-mono">
              <button
                onClick={() => setActiveTab('diagnosis')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'diagnosis'
                    ? 'bg-purple-600 text-white shadow-md glow-purple'
                    : 'text-slate-400 hover:text-purple-200'
                }`}
              >
                Diagnostics
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'diff'
                    ? 'bg-purple-600 text-white shadow-md glow-purple'
                    : 'text-slate-400 hover:text-purple-200'
                }`}
              >
                Diff
              </button>
              <button
                onClick={() => setActiveTab('rag')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'rag'
                    ? 'bg-purple-600 text-white shadow-md glow-purple'
                    : 'text-slate-400 hover:text-purple-200'
                }`}
              >
                Runbooks
              </button>
              <button
                onClick={() => setActiveTab('approval')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'approval'
                    ? 'bg-purple-600 text-white shadow-md glow-purple'
                    : 'text-slate-400 hover:text-purple-200'
                }`}
              >
                Guardrails
              </button>
            </div>
          </div>

          {/* Console Simulation Body */}
          <div className="p-6 space-y-6">
            {/* User Prompt Simulation */}
            <div className="flex justify-end">
              <div className="flex items-center gap-2.5 max-w-xl">
                <div className="px-4 py-2.5 rounded-2xl bg-purple-600/90 text-white text-xs font-mono leading-relaxed shadow-lg glow-purple border border-purple-400/30 flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-purple-200 animate-pulse shrink-0" />
                  <span>&ldquo;{selectedPrompt}&rdquo;</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#130926] border border-purple-500/40 flex items-center justify-center text-[10px] font-bold text-purple-300 shrink-0 font-mono shadow-md">
                  YOU
                </div>
              </div>
            </div>

            {/* AI Agent Telemetry Steps */}
            <div className="space-y-2 font-mono text-xs max-w-2xl">
              {currentScenario.telemetry.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 text-purple-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{step}</span>
                </div>
              ))}
            </div>

            {/* Tab 1: Diagnostics */}
            {activeTab === 'diagnosis' && (
              <div className="p-4 rounded-2xl bg-[#040209] border border-purple-500/20 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5">
                  <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{currentScenario.diagnosis.title}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{currentScenario.diagnosis.badge}</span>
                </div>
                <div className="bg-[#070310] p-3 rounded-xl border border-purple-500/15 text-[11px] space-y-1 text-slate-300 leading-relaxed">
                  <p className="text-slate-500">{currentScenario.diagnosis.header}</p>
                  {currentScenario.diagnosis.details.map((detail, idx) => (
                    <p key={idx} className="text-rose-400 font-bold">
                      {detail}
                    </p>
                  ))}
                  <p className="text-emerald-400 font-semibold pt-1">
                    {currentScenario.diagnosis.fix}
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Diff Comparison */}
            {activeTab === 'diff' && (
              <div className="p-4 rounded-2xl bg-[#040209] border border-purple-500/20 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5">
                  <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                    <GitPullRequest className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Proposed Patch Diff &bull; {currentScenario.diff.file}</span>
                  </span>
                  <span className="text-[10px] text-emerald-400">{currentScenario.diff.changes}</span>
                </div>
                <div className="bg-[#070310] p-3 rounded-xl border border-purple-500/15 text-[11px] space-y-1 font-mono leading-relaxed">
                  {currentScenario.diff.lines.map((line, idx) => (
                    <p
                      key={idx}
                      className={
                        line.type === 'header'
                          ? 'text-slate-500'
                          : line.type === 'del'
                          ? 'text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded'
                          : line.type === 'add'
                          ? 'text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold'
                          : 'text-slate-400 px-2'
                      }
                    >
                      {line.text}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: RAG Runbook */}
            {activeTab === 'rag' && (
              <div className="p-4 rounded-2xl bg-[#040209] border border-purple-500/20 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5 font-mono">
                  <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                    <Database className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>pgvector Runbook Match &bull; {currentScenario.runbook.similarity}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{currentScenario.runbook.id}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0f0821] border border-purple-500/20 space-y-2 leading-relaxed font-mono">
                  <p className="font-bold text-white">{currentScenario.runbook.title}</p>
                  <p className="text-slate-300 text-[11px]">
                    {currentScenario.runbook.excerpt}
                  </p>
                </div>
              </div>
            )}

            {/* Tab 4: Security Approval */}
            {activeTab === 'approval' && (
              <div className="p-4 rounded-2xl bg-[#040209] border border-purple-500/30 space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5">
                  <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{currentScenario.approval.title}</span>
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {currentScenario.approval.description}{' '}
                  <code className="text-purple-300 bg-slate-900 px-1 py-0.5 rounded">
                    {currentScenario.approval.branch}
                  </code>.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setMockApprovalDone(true)}
                    disabled={mockApprovalDone}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      mockApprovalDone
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{mockApprovalDone ? currentScenario.approval.completedText : currentScenario.approval.actionText}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Interactive Prompt Selector Chips inside Console */}
            <div className="pt-4 border-t border-purple-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[10px] font-mono text-purple-300/80 uppercase tracking-widest shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                <span>Voice Queries:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  "Why did my latest deployment to production fail?",
                  "Rollback latest container release",
                  "Fix memory leak in redis worker",
                  "Run security audit on IAM roles",
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => {
                      setSelectedPrompt(promptText);
                      setMockApprovalDone(false);
                    }}
                    className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 border cursor-pointer ${
                      selectedPrompt === promptText
                        ? "bg-purple-500/30 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-102"
                        : "bg-[#090514]/90 text-slate-400 border-purple-500/20 hover:border-purple-400/60 hover:text-purple-200 hover:scale-102"
                    }`}
                  >
                    <span className="text-purple-400">⚡</span>
                    <span>{promptText}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Technical Architecture & 3-Step Pipeline */}
      <section className="py-24 px-6 sm:px-12 max-w-6xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(168,85,247,0.2)] animate-pulse-subtle">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Under The Hood</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            How VoiceOps Operates Deterministically
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed">
            A deterministic, zero-write pipeline that synthesizes real-time audio commands with deep Abstract Syntax Tree (AST) code analysis and pgvector semantic memory.
          </p>
        </div>

        {/* 3-Step Pipeline Cards with Hover Elevation & Ambient Glow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-7 rounded-3xl bg-[#080412]/90 border border-purple-500/20 shadow-xl space-y-4 relative group hover:-translate-y-2 hover:border-purple-500/50 hover:shadow-[0_15px_40px_rgba(168,85,247,0.22)] transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all duration-500 pointer-events-none" />
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 font-mono font-bold text-sm group-hover:scale-110 group-hover:bg-purple-500/20 transition-transform duration-300 shadow-md">
              01
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-base font-bold text-white flex items-center gap-2 group-hover:text-purple-200 transition-colors">
                <FileCode2 className="w-4 h-4 text-purple-400 group-hover:rotate-6 transition-transform duration-300" />
                <span>AST & Codebase Indexing</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                VoiceOps uses tree-sitter to build a syntax graph of your repository, mapping functions, imports, dependency trees, and configuration files into high-dimensional vector embeddings.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-[11px] font-mono text-purple-300/80 flex items-center gap-2 relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>Polyglot • TypeScript, Python, Go, Rust, K8s</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-7 rounded-3xl bg-[#080412]/90 border border-purple-500/20 shadow-xl space-y-4 relative group hover:-translate-y-2 hover:border-cyan-500/50 hover:shadow-[0_15px_40px_rgba(6,182,212,0.22)] transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/30 transition-all duration-500 pointer-events-none" />
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-mono font-bold text-sm group-hover:scale-110 group-hover:bg-cyan-500/20 transition-transform duration-300 shadow-md">
              02
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-base font-bold text-white flex items-center gap-2 group-hover:text-cyan-200 transition-colors">
                <Activity className="w-4 h-4 text-cyan-400 group-hover:rotate-6 transition-transform duration-300" />
                <span>Telemetry & Log Correlation</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                When a voice query is received, VoiceOps queries GitHub Actions APIs and cloud metrics, isolating the exact failing stack trace line and retrieving matching organizational runbooks from pgvector.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-[11px] font-mono text-cyan-300/80 flex items-center gap-2 relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Cosine Match • Root-Cause Isolation</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-7 rounded-3xl bg-[#080412]/90 border border-purple-500/20 shadow-xl space-y-4 relative group hover:-translate-y-2 hover:border-emerald-500/50 hover:shadow-[0_15px_40px_rgba(52,211,153,0.22)] transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all duration-500 pointer-events-none" />
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-mono font-bold text-sm group-hover:scale-110 group-hover:bg-emerald-500/20 transition-transform duration-300 shadow-md">
              03
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-base font-bold text-white flex items-center gap-2 group-hover:text-emerald-200 transition-colors">
                <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:rotate-6 transition-transform duration-300" />
                <span>Zero-Write Guardrails</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                The agent proposes precise unified diffs and PR branches, but NEVER writes to production or merges code without explicit human cryptographic approval in the workspace interface.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-[11px] font-mono text-emerald-300/80 flex items-center gap-2 relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Human-in-the-Loop • SOC-2 Safe</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Substantive Enterprise Capabilities Grid */}
      <section className="py-24 px-6 sm:px-12 max-w-6xl mx-auto relative z-10 border-t border-purple-500/15">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>DevOps Suite</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Engineered for High-Velocity Engineering Teams
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed">
            Eliminate triage toil, reduce Mean Time to Resolution (MTTR), and automate infrastructure diagnostics with verifiable AI workflows.
          </p>
        </div>

        {/* 6 Grid Feature Cards with Rich Tilt & Glow Animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-7 rounded-3xl bg-[#080412]/80 border border-purple-500/15 hover:border-rose-500/40 hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(244,63,94,0.18)] transition-all duration-500 space-y-3.5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-500 pointer-events-none" />
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-md">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-rose-200 transition-colors">CI/CD Run Log Diagnostics</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Instantly analyzes megabytes of raw GitHub Actions and Docker build logs. Identifies compilation errors, missing environment secrets, and dependency mismatches in seconds.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-3xl bg-[#080412]/80 border border-purple-500/15 hover:border-indigo-500/40 hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(99,102,241,0.18)] transition-all duration-500 space-y-3.5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500 pointer-events-none" />
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">pgvector Runbook Memory</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Indexes your organization’s standard operating procedures, architectural decisions, and past incident post-mortems so fixes adhere to team standards.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-3xl bg-[#080412]/80 border border-purple-500/15 hover:border-cyan-500/40 hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(6,182,212,0.18)] transition-all duration-500 space-y-3.5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all duration-500 pointer-events-none" />
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-md">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">Automated Patch Diff Generation</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Generates clean, git-compliant unified patch diffs targeting only the affected configuration or source files, complete with contextual rationale.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-7 rounded-3xl bg-[#080412]/80 border border-purple-500/15 hover:border-emerald-500/40 hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(52,211,153,0.18)] transition-all duration-500 space-y-3.5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500 pointer-events-none" />
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors">Least-Privilege Security Scans</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Scans Terraform definitions, IAM roles, and Kubernetes manifests for CIS benchmark violations and wildcard permissions before deployment.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-7 rounded-3xl bg-[#080412]/80 border border-purple-500/15 hover:border-amber-500/40 hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(245,158,11,0.18)] transition-all duration-500 space-y-3.5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500 pointer-events-none" />
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-md">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors">Canary & Rollback Orchestration</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Correlates telemetry spikes with recent releases, pinpointing the previous stable container image digest for immediate zero-downtime rollback.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-7 rounded-3xl bg-[#080412]/80 border border-purple-500/15 hover:border-purple-500/40 hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(168,85,247,0.18)] transition-all duration-500 space-y-3.5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500 pointer-events-none" />
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-md">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors">Hands-Free Voice Triage</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Sub-second speech recognition pipeline engineered for on-call engineers to triage critical production alerts hands-free from anywhere.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: System Dataflow Architecture View */}
      <section className="py-24 px-6 sm:px-12 max-w-6xl mx-auto relative z-10 border-t border-purple-500/15">
        <div className="rounded-3xl bg-[#070312] border border-purple-500/20 p-8 sm:p-12 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono mb-2">
                <Workflow className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span>Execution Dataflow</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Deterministic Multi-Agent Workflow
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 self-start shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Read-Only Default State</span>
            </div>
          </div>

          {/* Step Sequence Diagram with Animated Progression */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs relative z-10">
            <div className="p-5 rounded-2xl bg-[#040209] border border-purple-500/20 hover:border-purple-500/40 hover:scale-102 transition-all duration-300 space-y-2.5 shadow-md">
              <span className="text-[10px] text-purple-400 font-bold tracking-widest block uppercase">PHASE 1</span>
              <h4 className="text-white font-bold text-xs">Audio / Text Ingestion</h4>
              <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                Streams 16kHz PCM audio or textual commands into Whisper STT, extracting DevOps intents and parameters.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#040209] border border-purple-500/20 hover:border-cyan-500/40 hover:scale-102 transition-all duration-300 space-y-2.5 shadow-md">
              <span className="text-[10px] text-cyan-400 font-bold tracking-widest block uppercase">PHASE 2</span>
              <h4 className="text-white font-bold text-xs">Context Synthesis</h4>
              <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                Queries tree-sitter AST index + pgvector knowledge base + GitHub CI logs to assemble verified grounding context.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#040209] border border-purple-500/20 hover:border-indigo-500/40 hover:scale-102 transition-all duration-300 space-y-2.5 shadow-md">
              <span className="text-[10px] text-indigo-400 font-bold tracking-widest block uppercase">PHASE 3</span>
              <h4 className="text-white font-bold text-xs">Gemini 1.5 Pro Reasoning</h4>
              <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                Performs deep causal root-cause analysis, isolating failure points and synthesizing unified patch diffs.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#040209] border border-emerald-500/30 hover:border-emerald-500/60 hover:scale-102 transition-all duration-300 space-y-2.5 shadow-md">
              <span className="text-[10px] text-emerald-400 font-bold tracking-widest block uppercase">PHASE 4</span>
              <h4 className="text-white font-bold text-xs">Cryptographic Approval</h4>
              <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                Presents patch for human review. Only executes git branch/PR mutations upon user cryptographic signature.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Engineering FAQ Accordion (Clean Editorial 2-Column Layout) */}
      <section className="py-24 px-6 sm:px-12 max-w-6xl mx-auto relative z-10 border-t border-purple-500/15">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Heading & Context */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono tracking-widest uppercase">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>Technical FAQ</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
              Everything you need to know about AST indexing, cryptographic guardrails, and data isolation in VoiceOps.
            </p>

            <div className="p-5 rounded-2xl bg-[#080412]/80 border border-purple-500/20 space-y-3 mt-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Enterprise Security Standard</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                VoiceOps never writes to branches or triggers merges without human cryptographic confirmation.
              </p>
              <Link
                href="/workspace"
                className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-mono pt-1 transition-colors"
              >
                <span>Explore Live Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Clean Divider Accordion List */}
          <div className="lg:col-span-7 divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {[
              {
                q: "Does VoiceOps have write access to my repositories or production cluster?",
                a: "By default, VoiceOps runs in Zero-Write Strict mode. It only possesses read access to repository AST structures and CI/CD logs. Any action that modifies code, creates pull requests, or triggers deployments requires an explicit human-in-the-loop cryptographic confirmation in the console.",
              },
              {
                q: "How does AST indexing differ from traditional vector search / standard RAG?",
                a: "Standard vector search splits text into arbitrary chunks, often severing function boundaries and imports. VoiceOps parses your code into real Abstract Syntax Trees (AST) using tree-sitter, preserving full semantic relationships, cross-file imports, schema definitions, and call hierarchies.",
              },
              {
                q: "How are credentials and GitHub tokens protected?",
                a: "VoiceOps never stores credentials in plaintext. All tokens and metadata are encrypted at rest using AES-128-CBC (Fernet) encryption keys managed in isolated backend vaults, following least-privilege OAuth scopes.",
              },
              {
                q: "Can I connect private repositories and internal runbooks?",
                a: "Yes. VoiceOps integrates directly with your GitHub account via OAuth and indexes both public and private repositories. You can upload custom markdown runbooks, architectural decision records (ADRs), and post-mortems into the pgvector knowledge base.",
              },
              {
                q: "What latency can I expect during voice triage?",
                a: "VoiceOps achieves sub-second speech transcription and streaming responses through optimized Web Audio API chunking, direct AST index queries, and high-throughput LLM reasoning streams.",
              },
            ].map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-5 transition-colors group">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left flex items-start justify-between gap-4 transition-colors cursor-pointer"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-xs text-purple-400/80 font-bold shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className={`text-sm sm:text-base font-semibold transition-colors ${
                        isOpen ? 'text-purple-200' : 'text-slate-200 group-hover:text-white'
                      }`}>
                        {item.q}
                      </span>
                    </div>

                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 mt-0.5 ${
                      isOpen
                        ? 'bg-purple-500/20 border-purple-400/60 text-purple-300 rotate-90'
                        : 'bg-white/[0.03] border-white/[0.08] text-slate-400 group-hover:border-purple-500/30 group-hover:text-white'
                    }`}>
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="pl-7 pr-8 pt-3 pb-1 text-xs sm:text-sm text-slate-400 leading-relaxed font-sans animate-in fade-in duration-200">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5: Final Call to Action */}
      <section className="py-24 px-6 sm:px-12 max-w-5xl mx-auto relative z-10">
        <div className="rounded-3xl bg-gradient-to-b from-[#120726] via-[#090317] to-[#05020c] border border-purple-500/30 p-10 sm:p-14 text-center space-y-7 shadow-2xl relative overflow-hidden group">
          <div className="w-80 h-80 rounded-full bg-purple-600/25 blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-125 transition-transform duration-700 animate-pulse-subtle" />
          <div className="relative z-10 space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to Accelerate Incident Triage?
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80 font-sans">
              Connect your repository and start resolving CI/CD failures hands-free with verifiable AST context.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/workspace"
              className="px-8 py-3.5 rounded-full bg-purple-200 hover:bg-white text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-xl glow-purple hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <span>Launch Live Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/150ftw/VoiceOps"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-full bg-[#080412] hover:bg-purple-950/50 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-400 text-xs font-semibold font-mono transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <Github className="w-4 h-4" />
              <span>View On GitHub</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-500/10 bg-[#010103] py-12 px-6 relative z-10 text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-slate-300 font-bold">
            <Image
              src={logoImg}
              alt="VoiceOps Logo"
              className="w-5 h-5 object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            />
            <span className="font-glitch text-sm">VOICEOPS</span>
            <span className="text-slate-600 font-normal">&bull; Autonomous DevOps Engineering</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <Link href="/workspace" className="hover:text-purple-300 transition-colors uppercase">
              Workspace
            </Link>
            <Link href="/projects" className="hover:text-purple-300 transition-colors uppercase">
              Projects
            </Link>
            <Link href="/knowledge" className="hover:text-purple-300 transition-colors uppercase">
              Knowledge
            </Link>
            <Link href="/founder" className="text-purple-300 font-bold hover:text-white transition-colors uppercase">
              Founder
            </Link>
            <a
              href="https://github.com/shivamsharma/VoiceOps"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-300 transition-colors uppercase"
            >
              GitHub ↗
            </a>
          </div>

          <p className="text-[11px] text-slate-600">
            &copy; 2026 VoiceOps Monorepo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
