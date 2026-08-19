'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  GitBranch,
  Database,
  Cpu,
  ShieldCheck,
  Radio,
  Terminal,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

interface Node {
  id: string;
  label: string;
  sublabel: string;
  category: 'ast' | 'vector' | 'voice' | 'ci' | 'security' | 'core';
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  icon: any;
  color: string;
  borderGlow: string;
}

const TOPOLOGY_NODES: Node[] = [
  {
    id: 'core',
    label: 'VoiceOps Engine',
    sublabel: 'Autonomous Core',
    category: 'core',
    x: 50,
    y: 50,
    icon: Sparkles,
    color: 'from-purple-500 via-indigo-500 to-cyan-400',
    borderGlow: 'rgba(168, 85, 247, 0.4)',
  },
  {
    id: 'ast',
    label: 'Tree-sitter AST',
    sublabel: 'Syntax Parser',
    category: 'ast',
    x: 18,
    y: 32,
    icon: GitBranch,
    color: 'from-indigo-500 to-purple-500',
    borderGlow: 'rgba(99, 102, 241, 0.35)',
  },
  {
    id: 'ci',
    label: 'CI/CD Pipelines',
    sublabel: 'Actions & Logs',
    category: 'ci',
    x: 18,
    y: 72,
    icon: Terminal,
    color: 'from-amber-500 to-rose-500',
    borderGlow: 'rgba(245, 158, 11, 0.35)',
  },
  {
    id: 'vector',
    label: 'pgvector RAG',
    sublabel: '1536-dim Embeddings',
    category: 'vector',
    x: 82,
    y: 32,
    icon: Database,
    color: 'from-cyan-500 to-blue-500',
    borderGlow: 'rgba(6, 182, 212, 0.35)',
  },
  {
    id: 'security',
    label: 'Guardrails HUD',
    sublabel: 'Ed25519 Signatures',
    category: 'security',
    x: 82,
    y: 72,
    icon: ShieldCheck,
    color: 'from-emerald-500 to-teal-400',
    borderGlow: 'rgba(16, 185, 129, 0.35)',
  },
];

const CONNECTIONS = [
  { from: 'core', to: 'ast' },
  { from: 'core', to: 'vector' },
  { from: 'core', to: 'ci' },
  { from: 'core', to: 'security' },
  { from: 'ast', to: 'ci' },
  { from: 'vector', to: 'security' },
];

export const RepoTopologyVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeNode, setActiveNode] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    window.addEventListener('resize', handleResize);

    // Particles moving along connections
    interface Packet {
      fromId: string;
      toId: string;
      progress: number;
      speed: number;
      color: string;
      size: number;
    }

    const packets: Packet[] = Array.from({ length: 14 }).map((_, i) => {
      const conn = CONNECTIONS[i % CONNECTIONS.length];
      return {
        fromId: conn.from,
        toId: conn.to,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.005,
        color: i % 2 === 0 ? '#a855f7' : '#06b6d4',
        size: 2.5 + Math.random() * 2,
      };
    });

    // Floating ambient background stars
    const stars = Array.from({ length: 45 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 0.2 + 0.05,
    }));

    let radarAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle isometric grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 40 * window.devicePixelRatio;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw ambient stars
      stars.forEach((star) => {
        star.y -= star.speed;
        if (star.y < 0) star.y = height;
        ctx.fillStyle = `rgba(168, 85, 247, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Radar Sweep Line from Center
      const centerX = width * 0.5;
      const centerY = height * 0.34;
      const maxRadarRadius = Math.max(width, height) * 0.55;

      radarAngle += 0.008;
      const sweepX = centerX + Math.cos(radarAngle) * maxRadarRadius;
      const sweepY = centerY + Math.sin(radarAngle) * maxRadarRadius;

      const radarGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, maxRadarRadius);
      radarGrad.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
      radarGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.03)');
      radarGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = radarGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadarRadius, 0, Math.PI * 2);
      ctx.fill();

      // Subtle radar arm
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // 4. Draw Connection Beziers & Lasers
      const nodeMap = new Map(TOPOLOGY_NODES.map((n) => [n.id, n]));

      CONNECTIONS.forEach(({ from, to }) => {
        const n1 = nodeMap.get(from);
        const n2 = nodeMap.get(to);
        if (!n1 || !n2) return;

        const x1 = (n1.x / 100) * width;
        const y1 = (n1.y / 100) * height;
        const x2 = (n2.x / 100) * width;
        const y2 = (n2.y / 100) * height;

        // Base connecting wire
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 15 * window.devicePixelRatio;
        ctx.quadraticCurveTo(midX, midY, x2, y2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 1.5 * window.devicePixelRatio;
        ctx.stroke();

        // Glowing pulse along connection
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(midX, midY, x2, y2);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.12)';
        ctx.lineWidth = 3 * window.devicePixelRatio;
        ctx.stroke();
      });

      // 5. Draw Animated Traveling Packets
      packets.forEach((pkt) => {
        pkt.progress += pkt.speed;
        if (pkt.progress >= 1) pkt.progress = 0;

        const n1 = nodeMap.get(pkt.fromId);
        const n2 = nodeMap.get(pkt.toId);
        if (!n1 || !n2) return;

        const x1 = (n1.x / 100) * width;
        const y1 = (n1.y / 100) * height;
        const x2 = (n2.x / 100) * width;
        const y2 = (n2.y / 100) * height;

        const t = pkt.progress;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 15 * window.devicePixelRatio;

        // Quadratic bezier interpolation: (1-t)^2 * p0 + 2*(1-t)*t * p1 + t^2 * p2
        const curX = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * midX + t * t * x2;
        const curY = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * midY + t * t * y2;

        // Draw packet glow
        const glow = ctx.createRadialGradient(curX, curY, 0, curX, curY, pkt.size * 3);
        glow.addColorStop(0, pkt.color);
        glow.addColorStop(1, 'transparent');

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(curX, curY, pkt.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw core packet dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(curX, curY, pkt.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 16;
    setMousePos({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full max-w-2xl h-[230px] sm:h-[250px] rounded-3xl overflow-hidden bg-[#070B16] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.6)] select-none shrink-0 ring-1 ring-purple-500/10"
    >
      {/* Background HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Interactive Floating Node Badges */}
      <div
        className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out pointer-events-none"
        style={{
          transform: `translate3d(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px, 0)`,
        }}
      >
        {TOPOLOGY_NODES.map((node) => {
          const Icon = node.icon;
          const isCore = node.id === 'core';

          return (
            <div
              key={node.id}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute transition-all duration-300 pointer-events-auto ${
                isCore ? 'z-20' : 'z-10'
              }`}
            >
              {isCore ? (
                /* Central VoiceOps Neural Core Orb */
                <div className="relative group cursor-pointer">
                  <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-cyan-500/30 blur-xl group-hover:scale-125 transition-transform duration-500 animate-pulse" />
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#090D1A] border border-purple-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] ring-2 ring-purple-500/20 group-hover:border-purple-400 transition-colors">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-purple-300 animate-spin-slow" />
                  </div>
                  {/* Core Status Label */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                    <span className="px-2 py-0.5 rounded-full bg-[#080C16]/90 border border-purple-500/30 text-[9.5px] font-mono font-bold text-purple-200 shadow-md">
                      VoiceOps Neural Engine
                    </span>
                  </div>
                </div>
              ) : (
                /* Satellite Feature Nodes */
                <div
                  onMouseEnter={() => setActiveNode(node.id)}
                  onMouseLeave={() => setActiveNode(null)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-[#080C16]/90 hover:bg-[#0B1020] border border-white/[0.08] hover:border-indigo-500/40 shadow-xl backdrop-blur-md transition-all duration-300 group hover:scale-105 cursor-pointer ring-1 ring-white/[0.02]"
                >
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-gradient-to-tr ${node.color} p-1 flex items-center justify-center text-white shadow-md group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-shadow shrink-0`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left font-mono">
                    <p className="text-[10.5px] font-bold text-slate-200 group-hover:text-white leading-tight">
                      {node.label}
                    </p>
                    <p className="text-[8.5px] text-slate-400 font-sans">{node.sublabel}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Holographic Ambient Accents */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[9.5px] font-mono text-slate-400">
        <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
        <span>TOPOLOGY RADAR: ACTIVE</span>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[9.5px] font-mono text-slate-400">
        <Cpu className="w-2.5 h-2.5 text-purple-400" />
        <span>AST MESH READY</span>
      </div>
    </div>
  );
};
