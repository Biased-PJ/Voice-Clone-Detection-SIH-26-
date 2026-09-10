import React, { useEffect, useRef } from 'react';

interface LiveWaveformOscilloscopeProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
  threatLevel: 'Safe' | 'Suspicious' | 'Critical';
  rmsVolume: number;
}

export const LiveWaveformOscilloscope: React.FC<LiveWaveformOscilloscopeProps> = ({
  analyserNode,
  isActive,
  threatLevel,
  rmsVolume,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(analyserNode ? analyserNode.frequencyBinCount : 1024);
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.fillStyle = '#060a0f';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();

      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);

      for (let y = 0; y < height; y += 30) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      for (let x = 0; x < width; x += 40) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(45, 212, 191, 0.2)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      let primaryColor = '#2dd4bf';
      let glowColor = 'rgba(45, 212, 191, 0.45)';
      if (threatLevel === 'Critical') {
        primaryColor = '#f43f5e';
        glowColor = 'rgba(244, 63, 94, 0.55)';
      } else if (threatLevel === 'Suspicious') {
        primaryColor = '#f59e0b';
        glowColor = 'rgba(245, 158, 11, 0.5)';
      }

      if (analyserNode && isActive) {
        analyserNode.getByteTimeDomainData(dataArray);
      } else if (isActive) {

        phase += 0.08;
        const baseAmp = threatLevel === 'Critical' ? 45 : 30;
        for (let i = 0; i < dataArray.length; i++) {
          const t = i / dataArray.length;
          const harmonic1 = Math.sin(t * Math.PI * 8 + phase);
          const harmonic2 = Math.sin(t * Math.PI * 18 - phase * 1.5) * 0.4;
          const jitterNoise = (Math.random() - 0.5) * (threatLevel === 'Critical' ? 12 : 3);
          const val = 128 + (harmonic1 + harmonic2) * baseAmp + jitterNoise;
          dataArray[i] = Math.max(0, Math.min(255, Math.floor(val)));
        }
      } else {

        phase += 0.02;
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = 128 + Math.sin(i * 0.05 + phase) * 2;
        }
      }

      ctx.save();
      ctx.beginPath();
      const sliceWidth = width / (dataArray.length - 1);
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * centerY;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.shadowBlur = 12;
      ctx.shadowColor = glowColor;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.font = '9px monospace';
      ctx.fillText('+1.0 FS', 8, 14);
      ctx.fillText('0.0 (DC)', 8, centerY - 4);
      ctx.fillText('-1.0 FS', 8, height - 6);

      ctx.fillStyle = isActive ? primaryColor : '#64748b';
      ctx.beginPath();
      ctx.arc(width - 16, 16, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(isActive ? 'DSP RUNNING' : 'STANDBY', width - 26, 19);
      ctx.textAlign = 'left';

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyserNode, isActive, threatLevel]);

  const dbValue = rmsVolume > 0.001 ? Math.max(-60, Math.round(20 * Math.log10(rmsVolume))) : -60;

  return (
    <div className="relative rounded-2xl bg-[#091219]/95 border border-slate-800/90 p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono tracking-wider text-slate-300 uppercase font-semibold">
            Live Acoustic Oscilloscope
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            TIME-DOMAIN WAVEFORM
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-slate-400">
            Peak: <span className="text-cyan-300 font-bold">{dbValue} dBFS</span>
          </div>
          <div className="w-20 bg-slate-800/80 h-2 rounded-full overflow-hidden border border-slate-700/60 hidden sm:block">
            <div
              className={`h-full transition-all duration-75 ${
                dbValue > -6
                  ? 'bg-rose-500'
                  : dbValue > -18
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-teal-500 to-cyan-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(4, ((dbValue + 60) / 60) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden border border-slate-800 bg-[#060a0f]">
        <canvas
          ref={canvasRef}
          width={800}
          height={220}
          className="w-full h-full object-cover block"
        />

        <div className="absolute bottom-2 left-3 flex items-center gap-2 text-[10px] font-mono text-slate-500 pointer-events-none">
          <span>SAMPLING: 48 kHz / 24-BIT</span>
          <span>•</span>
          <span>WINDOW: HANNING (1024)</span>
        </div>
      </div>
    </div>
  );
};
