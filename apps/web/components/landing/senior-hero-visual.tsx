'use client';

import React, { useEffect, useRef } from 'react';

export const SeniorHeroVisual: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Particle nodes in 3D perspective grid
    const cols = 36;
    const rows = 20;
    let time = 0;

    const render = () => {
      time += 0.02;

      // Smooth mouse easing
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Draw perspective wave grid
      const centerX = width / 2;
      const startY = height * 0.45;

      for (let r = 0; r < rows; r++) {
        const perspective = (r + 1) / rows;
        const y = startY + Math.pow(perspective, 2) * (height * 0.55);
        const rowWidth = width * (0.3 + perspective * 0.9);
        const startX = centerX - rowWidth / 2;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.04 + perspective * 0.12})`;
        ctx.lineWidth = 1;

        for (let c = 0; c <= cols; c++) {
          const colRatio = c / cols;
          const x = startX + colRatio * rowWidth;

          // Wave elevation
          const distFromMouse = Math.hypot(x - mouse.x, y - mouse.y);
          const mouseElevation = Math.max(0, (250 - distFromMouse) / 250) * 40;
          const waveElevation =
            Math.sin(colRatio * 8 + time * 1.5) * Math.cos(perspective * 6 + time) * (15 * perspective);

          const finalY = y - waveElevation - mouseElevation;

          if (c === 0) {
            ctx.moveTo(x, finalY);
          } else {
            ctx.lineTo(x, finalY);
          }

          // Glowing node dots on intersections
          if (r % 2 === 0 && c % 2 === 0) {
            const isNearMouse = distFromMouse < 180;
            ctx.fillStyle = isNearMouse
              ? `rgba(34, 211, 238, ${0.4 + perspective * 0.5})`
              : `rgba(99, 102, 241, ${0.1 + perspective * 0.3})`;

            ctx.beginPath();
            ctx.arc(x, finalY, isNearMouse ? 2.2 : 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Background Radial Light Orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 filter blur-[140px] pointer-events-none" />
      <div className="absolute top-[15%] right-[15%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 filter blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[700px] h-[400px] rounded-full bg-purple-600/10 filter blur-[150px] pointer-events-none" />

      {/* Grid Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block opacity-70" />

      {/* Fade Masks */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020408] via-transparent to-[#020408] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#020408_80%)] pointer-events-none" />
    </div>
  );
};
