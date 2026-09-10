import React, { useEffect, useRef, useState } from 'react';
import { Radio, Sparkles, ShieldAlert } from 'lucide-react';

interface LiveAcousticOscilloscopeProps {
  isPlaying: boolean;
  activeCallId?: string;
  threatLevel?: 'Safe' | 'Suspicious' | 'Critical';
  onSimulateThreat?: () => void;
}

export const LiveAcousticOscilloscope: React.FC<LiveAcousticOscilloscopeProps> = ({
  isPlaying,
  activeCallId,
  threatLevel = 'Critical',
  onSimulateThreat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [vizMode, setVizMode] = useState<'wave' | 'fft' | 'formants'>('wave');
  const [dbLevel, setDbLevel] = useState(-18.4);
  const [jitterMs, setJitterMs] = useState(1.2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const step = 24;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(45, 212, 191, 0.2)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const activeFactor = isPlaying ? 1.6 : 0.6;
      const isCritical = threatLevel === 'Critical';
      const isSuspicious = threatLevel === 'Suspicious';

      const mainColor = isCritical ? '#f43f5e' : isSuspicious ? '#fbbf24' : '#2dd4bf';
      const glowColor = isCritical
        ? 'rgba(244, 63, 94, 0.4)'
        : isSuspicious
        ? 'rgba(251, 191, 36, 0.35)'
        : 'rgba(45, 212, 191, 0.35)';

      if (vizMode === 'wave') {
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2.4;
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
          const t = x * 0.04 + phase;
          const f1 = Math.sin(t) * 18 * activeFactor;
          const f2 = Math.sin(t * 2.3 + phase * 0.5) * 12 * activeFactor;
          const f3 = Math.sin(t * 5.1) * 6 * activeFactor;

          let noise = 0;
          if (isCritical) {
            noise = (Math.sin(x * 0.8 + phase * 4) > 0.6 ? 7 : -7) * (isPlaying ? 1.2 : 0.4);
          } else if (isSuspicious) {
            noise = (Math.random() - 0.5) * 5;
          }

          const y = height / 2 + f1 + f2 + f3 + noise;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = isCritical ? 'rgba(244,63,94,0.3)' : 'rgba(34,211,238,0.25)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let x = 0; x < width; x += 2) {
          const t = x * 0.04 - phase * 0.8;
          const y = height / 2 + Math.sin(t * 1.8) * 16 * activeFactor;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      } else if (vizMode === 'fft') {
        const barCount = 48;
        const barWidth = width / barCount;
        for (let i = 0; i < barCount; i++) {
          const freq = i / barCount;
          let baseAmp = Math.exp(-freq * 3.5) * height * 0.85 * activeFactor;
          if (i > 8 && i < 16) baseAmp += Math.sin(i * 0.5 + phase) * 22 * activeFactor;
          if (i > 22 && i < 30) baseAmp += Math.cos(i * 0.7 + phase * 1.2) * 15 * activeFactor;

          if (isCritical && i > 36) {
            baseAmp += (Math.sin(phase * 4 + i) + 1.2) * 18 * activeFactor;
          }

          const barH = Math.min(Math.max(baseAmp + (Math.random() * 8 - 4), 3), height - 8);
          const x = i * barWidth;
          const y = height - barH;

          const grad = ctx.createLinearGradient(0, y, 0, height);
          if (isCritical) {
            grad.addColorStop(0, '#f43f5e');
            grad.addColorStop(1, 'rgba(159, 18, 57, 0.2)');
          } else {
            grad.addColorStop(0, '#22d3ee');
            grad.addColorStop(0.5, '#2dd4bf');
            grad.addColorStop(1, 'rgba(13, 148, 136, 0.15)');
          }

          ctx.fillStyle = grad;
          ctx.fillRect(x + 1.5, y, barWidth - 3, barH);
        }
      } else {
        ctx.save();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.strokeRect(20, 20, width - 40, height - 40);

        ctx.strokeStyle = isCritical ? 'rgba(244,63,94,0.5)' : 'rgba(45,212,191,0.5)';
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2, 70, 36, Math.PI / 6, 0, Math.PI * 2);
        ctx.stroke();

        const ptX = width / 2 + Math.cos(phase * 1.5) * 50 * activeFactor;
        const ptY = height / 2 + Math.sin(phase * 2.1) * 25 * activeFactor;

        ctx.fillStyle = mainColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(ptX, ptY, isPlaying ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '10px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`F1: 720 Hz`, 28, 36);
        ctx.fillText(`F2: 1840 Hz`, 28, 50);
        ctx.fillText(`Δ Formant Dispersion: 1120 Hz`, 28, 64);
        ctx.restore();
      }

      phase += isPlaying ? 0.08 : 0.025;
      animId = requestAnimationFrame(render);
    };

    render();

    const teleInterval = setInterval(() => {
      setDbLevel(parseFloat((-16 - Math.random() * 4.5).toFixed(1)));
      setJitterMs(
        parseFloat(
          (1.1 + (threatLevel === 'Critical' ? Math.random() * 6 : Math.random() * 0.4)).toFixed(2)
        )
      );
    }, 1200);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(teleInterval);
    };
  }, [vizMode, isPlaying, threatLevel]);

  return (
    <div className="p-4 rounded-2xl bg-[#091219] border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/25 text-[#2dd4bf]">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span>Real-Time Acoustic DSP Stream</span>
              {isPlaying && (
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                  AUDIBLE SPLAY
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Target: <strong className="text-cyan-300">{activeCallId || 'SIP Trunk Intercept #04'}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setVizMode('wave')}
            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
              vizMode === 'wave'
                ? 'bg-[#0f2429] text-[#22d3ee] font-bold border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Oscilloscope
          </button>
          <button
            type="button"
            onClick={() => setVizMode('fft')}
            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
              vizMode === 'fft'
                ? 'bg-[#0f2429] text-[#22d3ee] font-bold border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            FFT
          </button>
          <button
            type="button"
            onClick={() => setVizMode('formants')}
            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
              vizMode === 'formants'
                ? 'bg-[#0f2429] text-[#22d3ee] font-bold border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Vowel Formants
          </button>
        </div>
      </div>

      <div className="relative w-full h-32 rounded-xl bg-[#04080c] border border-slate-800/80 overflow-hidden shadow-inner flex items-center justify-center">
        <canvas ref={canvasRef} width={520} height={128} className="w-full h-full object-cover" />

        <div className="absolute top-2 left-3 text-[10px] font-mono text-slate-500 select-none pointer-events-none flex items-center gap-3">
          <span>
            dBFS: <strong className="text-emerald-400">{dbLevel}</strong>
          </span>
          <span>
            Sample: <strong className="text-slate-300">96 kHz</strong>
          </span>
          <span>
            Buffer: <strong className="text-cyan-400">128f</strong>
          </span>
        </div>

        <div className="absolute top-2 right-3 text-[10px] font-mono select-none pointer-events-none flex items-center gap-2">
          {threatLevel === 'Critical' ? (
            <span className="flex items-center gap-1 text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40">
              <ShieldAlert className="w-3 h-3" />
              VOCODER ARTIFACT PHASE GLITCH
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              HARMONIC CONTINUITY NOMINAL
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60 gap-2">
        <div className="flex items-center gap-4">
          <span>
            Jitter: <strong className="text-white">{jitterMs} ms</strong>
          </span>
          <span>
            Glottal Cycle: <strong className="text-cyan-300">128 Hz</strong>
          </span>
          <span>
            Laryngeal Friction:{' '}
            <strong className={threatLevel === 'Critical' ? 'text-rose-400' : 'text-emerald-400'}>
              {threatLevel === 'Critical' ? '0.04 (Synthetic)' : '0.88 (Biological)'}
            </strong>
          </span>
        </div>

        {onSimulateThreat && (
          <button
            type="button"
            onClick={onSimulateThreat}
            className="text-[10px] uppercase tracking-wider text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 transition-all cursor-pointer hover:bg-rose-500/20"
          >
            <Sparkles className="w-3 h-3" />
            <span>Simulate Clone Attack</span>
          </button>
        )}
      </div>
    </div>
  );
};
