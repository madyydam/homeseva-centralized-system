'use client';

import { useEffect, useRef } from 'react';

export default function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let isVisible = true;

    // 15 Vertical Layered 3D Ribbons cascading from Bright White/Silver on the Left
    // to Deep Charcoal and Obsidian Pitch Black on the Right (matching reference image)
    const NUM_LAYERS = 15;
    const ribbonPalettes = [
      { start: '#ffffff', end: '#f0f3f6', shadowAlpha: 0.35 },
      { start: '#f0f3f6', end: '#e2e7ee', shadowAlpha: 0.38 },
      { start: '#e2e7ee', end: '#d0d8e2', shadowAlpha: 0.40 },
      { start: '#d0d8e2', end: '#bac5d3', shadowAlpha: 0.44 },
      { start: '#bac5d3', end: '#9faec0', shadowAlpha: 0.48 },
      { start: '#9faec0', end: '#8291a5', shadowAlpha: 0.52 },
      { start: '#8291a5', end: '#657489', shadowAlpha: 0.56 },
      { start: '#657489', end: '#4a576b', shadowAlpha: 0.60 },
      { start: '#4a576b', end: '#333e50', shadowAlpha: 0.64 },
      { start: '#333e50', end: '#222b38', shadowAlpha: 0.68 },
      { start: '#222b38', end: '#151b24', shadowAlpha: 0.72 },
      { start: '#151b24', end: '#0c1118', shadowAlpha: 0.76 },
      { start: '#0c1118', end: '#06090e', shadowAlpha: 0.82 },
      { start: '#06090e', end: '#030508', shadowAlpha: 0.88 },
      { start: '#030508', end: '#000000', shadowAlpha: 0.95 },
    ];

    const step = 10;
    let totalSteps = 0;
    // Reusable Flat Typed Array for 0 GC memory allocations per frame
    let xCoords = new Float32Array(0);

    const handleResize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      totalSteps = Math.ceil((height + 140) / step);
      const neededCapacity = NUM_LAYERS * (totalSteps + 1);
      if (xCoords.length < neededCapacity) {
        xCoords = new Float32Array(neededCapacity);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    let t = 0;
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Delta-time based advancement: uniform silky motion on 60Hz, 120Hz & 144Hz
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      t += dt * 0.42;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Deep dark base
      ctx.fillStyle = '#050609';
      ctx.fillRect(0, 0, width, height);

      const invLayers = 1 / (NUM_LAYERS - 1);
      const invHeight = 1 / height;
      const stride = totalSteps + 1;

      // Fast pre-calculation of X coordinates into flat typed array (0 heap allocations)
      for (let i = 0; i < NUM_LAYERS; i++) {
        const u = i * invLayers;
        const baseX = -width * 0.15 + u * (width * 1.32);
        const layerOffset = i * stride;
        const iPhase1 = t + i * 0.16;
        const iPhase2 = -t * 0.72 + i * 0.11;
        const tPhase3 = t * 0.45;

        for (let j = 0; j <= totalSteps; j++) {
          const y = -70 + j * step;
          const normY = y * invHeight;

          const s1 = Math.sin(normY * Math.PI * 1.85 + iPhase1);
          const s2 = Math.cos(normY * Math.PI * 3.2 + iPhase2);
          const s3 = Math.sin(normY * Math.PI * 0.9 + tPhase3);

          const offset =
            s1 * (width * 0.052) +
            s2 * (width * 0.024) +
            s3 * (width * 0.032);
          const slant = (normY - 0.5) * (width * 0.05);

          xCoords[layerOffset + j] = baseX + offset + slant;
        }
      }

      // Draw ribbons from Right (darkest) to Left (lightest)
      // This allows each lighter ribbon on the left to cast a 3D drop-shadow to the right
      const midIdx = totalSteps >> 1;

      for (let i = NUM_LAYERS - 2; i >= 0; i--) {
        const palette = ribbonPalettes[i] ?? ribbonPalettes[ribbonPalettes.length - 1]!;
        const currOffset = i * stride;
        const nextOffset = (i + 1) * stride;

        ctx.beginPath();

        // 1. Trace down along curve i (top to bottom)
        ctx.moveTo(xCoords[currOffset + 0]!, -70);
        for (let j = 1; j <= totalSteps; j++) {
          ctx.lineTo(xCoords[currOffset + j]!, -70 + j * step);
        }

        // 2. Trace back up along curve i+1 (bottom to top)
        for (let j = totalSteps; j >= 0; j--) {
          ctx.lineTo(xCoords[nextOffset + j]!, -70 + j * step);
        }

        ctx.closePath();

        // Horizontal gradient across this specific vertical ribbon
        const x1 = xCoords[currOffset + midIdx]!;
        const x2 = xCoords[nextOffset + midIdx]!;
        const grad = ctx.createLinearGradient(x1, 0, x2, 0);
        grad.addColorStop(0, palette.start);
        grad.addColorStop(1, palette.end);
        ctx.fillStyle = grad;

        // Realistic 3D drop shadow cast towards the right fold
        ctx.shadowColor = `rgba(0, 0, 0, ${palette.shadowAlpha})`;
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 3;

        ctx.fill();
      }

      // Reset shadows to avoid state leakage
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      animId = requestAnimationFrame(render);
    };

    // Pause when page is hidden to save battery/CPU, resume seamlessly
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    lastTime = performance.now();
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none transform-gpu" />
      {/* High-contrast ambient veil so cards & white text always pop */}
      <div className="absolute inset-0 bg-black/35 pointer-events-none" />
    </div>
  );
}
