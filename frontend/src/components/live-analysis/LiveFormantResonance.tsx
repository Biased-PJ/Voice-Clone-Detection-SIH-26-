import React, { useEffect, useRef } from 'react';

interface LiveFormantResonanceProps {
  isActive: boolean;
  threatLevel: 'Safe' | 'Suspicious' | 'Critical';
  formantF1: number;
  formantF2: number;
  vtlCm: number;
}

export const LiveFormantResonance: React.FC<LiveFormantResonanceProps> = ({
  isActive,
  threatLevel,
  formantF1,
  formantF2,
  vtlCm,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Tactical dark canvas
    ctx.fillStyle = '#060a0f';
    ctx.fillRect(0, 0, width, height);

    // Coordinate grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < width; x += 35) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += 30) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Natural biological human formant boundary ellipse
    const humanCenterX = width * 0.45;
    const humanCenterY = height * 0.55;
    const humanRadiusX = width * 0.32;
    const humanRadiusY = height * 0.35;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(humanCenterX, humanCenterY, humanRadiusX, humanRadiusY, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(45, 212, 191, 0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#2dd4bf';
    ctx.font = '10px monospace';
    ctx.fillText('BIOLOGICAL HUMAN ENVELOPE (VTL 15-18cm)', humanCenterX - 80, humanCenterY - humanRadiusY - 6);

    // Map F1 (300-1200 Hz) to Y, F2 (700-2600 Hz) to X
    const minF1 = 200, maxF1 = 1400;
    const minF2 = 600, maxF2 = 2800;

    const normX = Math.min(1, Math.max(0, (formantF2 - minF2) / (maxF2 - minF2)));
    const normY = Math.min(1, Math.max(0, (formantF1 - minF1) / (maxF1 - minF1)));

    const plotX = 30 + normX * (width - 60);
    const plotY = height - (30 + normY * (height - 60));

    // Plot current live acoustic coordinate
    const isCritical = threatLevel === 'Critical';
    const pointColor = isCritical ? '#f43f5e' : threatLevel === 'Suspicious' ? '#f59e0b' : '#22d3ee';

    // Crosshairs on point
    ctx.strokeStyle = pointColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(plotX, 0);
    ctx.lineTo(plotX, height);
    ctx.moveTo(0, plotY);
    ctx.lineTo(width, plotY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glow pulse ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(plotX, plotY, 14, 0, Math.PI * 2);
    ctx.fillStyle = isCritical ? 'rgba(244, 63, 94, 0.2)' : 'rgba(34, 211, 238, 0.2)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(plotX, plotY, 5, 0, Math.PI * 2);
    ctx.fillStyle = pointColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = pointColor;
    ctx.fill();
    ctx.restore();

    // Coordinates tag
    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px monospace';
    ctx.fillText(
      `F1: ${Math.round(formantF1)}Hz | F2: ${Math.round(formantF2)}Hz`,
      Math.min(width - 150, Math.max(10, plotX + 10)),
      Math.max(20, plotY - 10)
    );

    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.fillText('F2 Resonance (High Formants →)', width - 180, height - 8);
    ctx.save();
    ctx.translate(12, 110);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('F1 Resonance (Low Formants ↑)', 0, 0);
    ctx.restore();
  }, [isActive, threatLevel, formantF1, formantF2]);

  return (
    <div className="relative rounded-2xl bg-[#091219]/95 border border-slate-800/90 p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-xs font-mono tracking-wider text-slate-300 uppercase font-semibold">
            Vocal Tract Biometrics & Resonance
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            F1 vs F2 DISPERSION
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-300">
          VTL Estimate: <span className="text-[#9d8df1] font-bold">{vtlCm.toFixed(1)} cm</span>
          <span className="text-slate-500 ml-1">
            {vtlCm >= 15 && vtlCm <= 18.5 ? '(Biological Normal)' : '(Algorithmic Drift)'}
          </span>
        </div>
      </div>

      <div className="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden border border-slate-800 bg-[#060a0f]">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-full object-cover block"
        />
      </div>
    </div>
  );
};
