import React, { useEffect, useRef } from 'react';

interface LiveSpectrogramWaterfallProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
  threatLevel: 'Safe' | 'Suspicious' | 'Critical';
  cloneProbability: number;
}

export const LiveSpectrogramWaterfall: React.FC<LiveSpectrogramWaterfallProps> = ({
  analyserNode,
  isActive,
  threatLevel,
  cloneProbability,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const binCount = analyserNode ? analyserNode.frequencyBinCount : 256;
    const freqData = new Uint8Array(binCount);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#060a0f';
      ctx.fillRect(0, 0, width, height);

      if (analyserNode && isActive) {
        analyserNode.getByteFrequencyData(freqData);
      } else if (isActive) {
        // Simulated FFT spectrum with distinct formant ridges
        const isAttack = threatLevel === 'Critical';
        for (let i = 0; i < 64; i++) {
          const normFreq = i / 64;
          // Formant peaks around 700Hz and 1800Hz
          const f1 = Math.exp(-Math.pow((normFreq - 0.15) * 8, 2)) * 200;
          const f2 = Math.exp(-Math.pow((normFreq - 0.35) * 8, 2)) * 160;
          // Vocoder artifact spike at 3.5kHz (around normFreq 0.5) if attack
          const vocoderGlitch = isAttack
            ? Math.exp(-Math.pow((normFreq - 0.52) * 12, 2)) * 180
            : 0;
          const noise = Math.random() * 25;
          freqData[i] = Math.min(255, Math.floor(f1 + f2 + vocoderGlitch + noise));
        }
      } else {
        // Low idle noise floor
        for (let i = 0; i < 64; i++) {
          freqData[i] = Math.floor(Math.random() * 8);
        }
      }

      const numBars = 48;
      const barWidth = (width - (numBars - 1) * 2) / numBars;

      for (let i = 0; i < numBars; i++) {
        const binIndex = Math.floor((i / numBars) * (freqData.length * 0.7));
        const value = freqData[binIndex] || 0;
        const barHeight = (value / 255) * (height - 24);

        const x = i * (barWidth + 2);
        const y = height - barHeight - 20;

        // Gradient based on frequency band and threat
        const isVocoderBand = i >= 22 && i <= 32; // ~3.2kHz - ~4.5kHz
        let barColor = '#14b8a6'; // teal

        if (isVocoderBand && threatLevel === 'Critical') {
          barColor = '#f43f5e'; // rose warning in the vocoder smear zone
        } else if (isVocoderBand && threatLevel === 'Suspicious') {
          barColor = '#f59e0b';
        } else if (i < 12) {
          barColor = '#38bdf8'; // low fundamental
        } else if (i > 36) {
          barColor = '#818cf8'; // upper air
        }

        ctx.fillStyle = barColor;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Peak cap point
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, Math.max(0, y - 2), barWidth, 1.5);
      }

      // Draw frequency annotations at bottom
      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText('100Hz', 4, height - 6);
      ctx.fillText('1kHz', width * 0.25, height - 6);
      ctx.fillText('3.5kHz (VOCODER ZONE)', width * 0.48, height - 6);
      ctx.fillText('8kHz', width - 36, height - 6);

      // If threat is high, highlight the Vocoder Phase Inpainting anomaly zone
      if (threatLevel === 'Critical' && isActive) {
        const xStart = 22 * (barWidth + 2);
        const xEnd = 32 * (barWidth + 2) + barWidth;
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
        ctx.lineWidth = 1;
        ctx.strokeRect(xStart - 2, 4, xEnd - xStart + 4, height - 28);

        ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
        ctx.fillRect(xStart - 2, 4, xEnd - xStart + 4, height - 28);

        ctx.fillStyle = '#f43f5e';
        ctx.font = '9px monospace';
        ctx.fillText('▲ VOCODER ARTIFACT', xStart, 16);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyserNode, isActive, threatLevel, cloneProbability]);

  return (
    <div className="relative rounded-2xl bg-[#091219]/95 border border-slate-800/90 p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          <span className="text-xs font-mono tracking-wider text-slate-300 uppercase font-semibold">
            Real-Time FFT Spectrogram
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            0 Hz – 8,000 Hz
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-slate-400">Vocoder Risk:</span>
          <span
            className={`font-bold ${
              threatLevel === 'Critical'
                ? 'text-rose-400'
                : threatLevel === 'Suspicious'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {threatLevel === 'Critical' ? 'HIGH (89%)' : threatLevel === 'Suspicious' ? 'MED (42%)' : 'LOW (<4%)'}
          </span>
        </div>
      </div>

      <div className="relative w-full h-40 sm:h-44 rounded-xl overflow-hidden border border-slate-800 bg-[#060a0f]">
        <canvas
          ref={canvasRef}
          width={800}
          height={180}
          className="w-full h-full object-cover block"
        />
      </div>
    </div>
  );
};
