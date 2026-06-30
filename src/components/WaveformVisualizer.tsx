import React, { useEffect, useRef } from 'react';
import { getAudioAnalyser } from '../utils/audio';

export const WaveformVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(canvas);

    const analyser = getAudioAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    let idlePhase = 0;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      // Clear the canvas cleanly
      ctx.clearRect(0, 0, width, height);

      let isAudioActive = false;

      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
        // Detect if there is sound going through the analyser
        for (let i = 0; i < bufferLength; i++) {
          if (Math.abs(dataArray[i] - 128) > 2) {
            isAudioActive = true;
            break;
          }
        }
      }

      const dpr = window.devicePixelRatio || 1;
      ctx.lineWidth = 2.5 * dpr;
      
      // Gorgeous gradient line matching our chemical brand
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#6366f1');   // indigo-500
      gradient.addColorStop(0.5, '#a855f7'); // purple-500
      gradient.addColorStop(1, '#ec4899');   // pink-500
      
      ctx.strokeStyle = gradient;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();

      if (isAudioActive && analyser) {
        // Draw real-time oscillating waveform
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }
      } else {
        // Draw gorgeous, smooth, slowly morphing ambient sine wave (idle)
        idlePhase += 0.04;
        const numPoints = 80;
        const sliceWidth = width / numPoints;
        let x = 0;

        for (let i = 0; i <= numPoints; i++) {
          // Create taper effect at edges so it feels suspended inside the box
          const edgeDecay = Math.sin((i / numPoints) * Math.PI);
          const y = height / 2 + Math.sin(i * 0.12 + idlePhase) * (height * 0.15) * edgeDecay;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
      }

      ctx.stroke();

      // Create beautiful glowing fill under the wave path
      if (isAudioActive && analyser) {
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
        fillGradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
        fillGradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = fillGradient;
        ctx.fill();
      } else {
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
        fillGradient.addColorStop(0, 'rgba(168, 85, 247, 0.08)');
        fillGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = fillGradient;
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-24 bg-slate-950/90 dark:bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col justify-between p-2.5 shadow-inner">
      {/* Background grids */}
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-[0.03] pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-slate-500" />
        ))}
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top HUD */}
      <div className="relative z-10 flex justify-between items-center w-full">
        <span className="text-[9px] font-black font-mono tracking-widest text-indigo-400/80 uppercase">
          Acoustic Waveform Visualizer
        </span>
        <div className="flex items-center gap-1.5 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/40">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[8px] font-bold font-mono text-emerald-400/90 uppercase tracking-widest leading-none">
            Live
          </span>
        </div>
      </div>

      {/* Bottom HUD info */}
      <div className="relative z-10 flex justify-between items-center w-full mt-auto text-[8px] font-mono text-slate-500 tracking-wider">
        <span>0 ms</span>
        <span>Physical-Acoustic Resonance Signature</span>
        <span>Time-Domain</span>
      </div>
    </div>
  );
};
