import React, { useEffect, useRef, useState } from 'react';

interface CallerPitchWaveformProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
  threatLevel: 'Safe' | 'Suspicious' | 'Critical';
  aiVoiceScore: number;
}

export const CallerPitchWaveform: React.FC<CallerPitchWaveformProps> = ({
  analyserNode,
  isActive,
  threatLevel,
  aiVoiceScore,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const [currentPitch, setCurrentPitch] = useState<number>(185);

  const isCritical = threatLevel === 'Critical';
  const isSuspicious = threatLevel === 'Suspicious';

  const primaryColor = isCritical ? '#f43f5e' : isSuspicious ? '#f59e0b' : '#2dd4bf';
  const glowColor = isCritical
    ? 'rgba(244, 63, 94, 0.4)'
    : isSuspicious
    ? 'rgba(245, 158, 11, 0.4)'
    : 'rgba(45, 212, 191, 0.4)';

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight || 280);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          width = canvas.width = entry.contentRect.width;
          height = canvas.height = entry.contentRect.height;
        }
      }
    });
    resizeObserver.observe(container);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 256;
    const dataArray = new Uint8Array(bufferLength);
    let phase = 0;
    let pitchVal = isCritical ? 230 : 175;

    let frameCount = 0;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      frameCount++;

      ctx.clearRect(0, 0, width, height);

      // Deep dark canvas background
      ctx.fillStyle = '#060a0f';
      ctx.fillRect(0, 0, width, height);

      // Subtle horizontal center baseline
      const centerY = height / 2;
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (analyserNode && isActive) {
        analyserNode.getByteTimeDomainData(dataArray);
      }

      phase += 0.04;

      // Calculate pseudo pitch variation for display
      if (frameCount % 15 === 0) {
        if (isActive) {
          const jitter = (Math.sin(phase * 1.5) + Math.cos(phase * 0.7)) * (isCritical ? 18 : 8);
          const base = isCritical ? 218 : 172;
          pitchVal = Math.round(base + jitter);
          setCurrentPitch(pitchVal);
        } else {
          setCurrentPitch(0);
        }
      }

      // Draw Waveform
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = primaryColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isActive ? 14 : 0;
      ctx.beginPath();

      const sliceWidth = width / 120;
      let x = 0;

      for (let i = 0; i < 120; i++) {
        let v = 0;

        if (isActive) {
          if (analyserNode) {
            const index = Math.floor((i / 120) * bufferLength);
            v = (dataArray[index] - 128) / 128;
          } else {
            // Simulated speech waveform with pitch fundamental
            const harmonic1 = Math.sin(i * 0.12 + phase * 2.5) * 0.45;
            const harmonic2 = Math.sin(i * 0.24 + phase * 1.2) * 0.25;
            const harmonic3 = Math.cos(i * 0.06 + phase * 0.8) * 0.2;
            const envelope = Math.sin((i / 120) * Math.PI); // Window envelope
            v = (harmonic1 + harmonic2 + harmonic3) * envelope;
          }
        }

        const y = centerY + v * (height * 0.38);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw secondary pitch contour ribbon
      if (isActive) {
        ctx.beginPath();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = isCritical ? 'rgba(244, 63, 94, 0.45)' : 'rgba(45, 212, 191, 0.45)';

        let px = 0;
        for (let i = 0; i < 120; i++) {
          const envelope = Math.sin((i / 120) * Math.PI);
          const pitchOffset = Math.sin(i * 0.08 - phase * 1.8) * 22 * envelope;
          const py = centerY + pitchOffset;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
          px += sliceWidth;
        }
        ctx.stroke();
      }
    };

    draw();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      resizeObserver.disconnect();
    };
  }, [analyserNode, isActive, threatLevel, isCritical, isSuspicious, primaryColor, glowColor]);

  return (
    <div className="relative w-full rounded-2xl bg-[#070c12] border border-slate-800/90 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      {/* Top Header of the single waveform */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-[#091118]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isActive
                ? isCritical
                  ? 'bg-rose-500 animate-ping'
                  : 'bg-teal-400 animate-pulse'
                : 'bg-slate-600'
            }`}
          />
          <div>
            <h3 className="text-sm font-bold font-['Space_Grotesk'] text-white tracking-wide">
              Caller Voice Waveform & Pitch Pitchprint
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Real-time fundamental frequency (F0) and harmonic oscillations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500">Pitch:</span>
            <span className={`font-semibold ${isCritical ? 'text-rose-400' : 'text-teal-400'}`}>
              {isActive ? `${currentPitch} Hz` : '0 Hz'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-[11px]">
            <span>48 kHz PCM</span>
          </div>
        </div>
      </div>

      {/* The Single Waveform Canvas */}
      <div ref={containerRef} className="w-full h-64 sm:h-72 relative">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Overlay badges in bottom corner */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold uppercase backdrop-blur-md border ${
                isCritical
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                  : isSuspicious
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                  : 'bg-teal-950/80 border-teal-500/50 text-teal-300'
              }`}
            >
              {isCritical
                ? 'Artificial Pitch Quantization'
                : isSuspicious
                ? 'Mild Pitch Smearing'
                : 'Natural Biological Glottal Jitter'}
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            {isActive ? 'Ingest: Active' : 'Ingest: Inactive'}
          </div>
        </div>
      </div>
    </div>
  );
};
