'use client';

import React, { useEffect, useRef, useState } from 'react';

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // High quality, royalty-free abstract dark cyber/data-network looping video sources
  const videoSources = [
    'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-charts-31912-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-futuristic-technology-digital-interface-31911-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-animation-31910-large.mp4',
  ];

  // Interactive Particle Constellation & Audio Sine Wavefield
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes in purple/violet theme
    const particleCount = Math.min(65, Math.floor(width / 22));
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      color: string;
    }> = [];

    const colors = ['#a855f7', '#c084fc', '#7c3aed', '#e879f9', '#818cf8'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 0.8,
        alpha: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Draw flowing sine waves in purple spectrum
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        ctx.lineWidth = 1.2;
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0)');
        gradient.addColorStop(
          0.3,
          w === 0 ? 'rgba(168, 85, 247, 0.14)' : 'rgba(192, 132, 252, 0.10)'
        );
        gradient.addColorStop(
          0.7,
          w === 1 ? 'rgba(232, 121, 249, 0.12)' : 'rgba(124, 58, 237, 0.10)'
        );
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.strokeStyle = gradient;

        const baseHeight = height * (0.28 + w * 0.18);
        const freq = 0.0018 + w * 0.0008;
        const speed = time * (0.8 + w * 0.4);

        for (let x = 0; x < width; x += 6) {
          const dy = Math.sin(x * freq + speed) * 35 * Math.cos(x * 0.001 + time * 0.5);
          const distToMouse = Math.abs(x - mouseX);
          const mouseEffect = Math.max(0, 1 - distToMouse / 350) * 20;
          const y = baseHeight + dy + mouseEffect;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Update and connect particle constellation nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#a855f7';
            ctx.globalAlpha = (1 - dist / 130) * 0.15;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Background Looping Ambient Tech Video with Purple Color Shift */}
      {!videoError && (
        <div className="absolute inset-0 w-full h-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
            className={`absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen transition-opacity duration-1000 scale-105 filter blur-[1px] hue-rotate-[240deg] contrast-125 ${
              videoLoaded ? 'opacity-25' : 'opacity-0'
            }`}
          >
            <source src={videoSources[0]} type="video/mp4" />
          </video>
          {/* Violet Glow Film */}
          <div className="absolute inset-0 bg-purple-900/10 mix-blend-color" />
        </div>
      )}

      {/* Interactive Purple Sine Waves & Constellation Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-75 mix-blend-screen"
      />

      {/* Layered Obsidian Lighting Radial Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030206]/50 via-[#030206]/85 to-[#030206] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#030206]/50 to-[#030206]" />

      {/* Subtle Purple Cyber Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #c084fc 1px, transparent 1px), linear-gradient(to bottom, #c084fc 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}
