import React, { useEffect, useRef, useState } from 'react';
import { Crosshair } from 'lucide-react';

export interface RadarIntercept {
  id: string;
  angle: number;
  distance: number;
  caller: string;
  carrier: string;
  region: string;
  threatLevel: 'Safe' | 'Suspicious' | 'Critical';
  score: number;
}

interface TacticalThreatRadarProps {
  intercepts: RadarIntercept[];
  selectedId?: string;
  onSelectIntercept: (id: string) => void;
}

export const TacticalThreatRadar: React.FC<TacticalThreatRadarProps> = ({
  intercepts,
  selectedId,
  onSelectIntercept,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let sweepAngle = 0;

    const render = () => {
      const size = canvas.width;
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 12;

      ctx.clearRect(0, 0, size, size);

      ctx.fillStyle = '#060a0f';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      const rings = [0.25, 0.5, 0.75, 1.0];
      rings.forEach((r) => {
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * r, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.strokeStyle = 'rgba(45, 212, 191, 0.14)';
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(45, 212, 191, 0.08)';
      ctx.beginPath();
      const d = radius * 0.7071;
      ctx.moveTo(cx - d, cy - d);
      ctx.lineTo(cx + d, cy + d);
      ctx.moveTo(cx + d, cy - d);
      ctx.lineTo(cx - d, cy + d);
      ctx.stroke();

      const beamGrad = ctx.createConicGradient(sweepAngle, cx, cy);
      beamGrad.addColorStop(0, 'rgba(34, 211, 238, 0.28)');
      beamGrad.addColorStop(0.12, 'rgba(45, 212, 191, 0.08)');
      beamGrad.addColorStop(0.25, 'rgba(15, 23, 42, 0.0)');
      beamGrad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      const sweepX = cx + Math.cos(sweepAngle) * radius;
      const sweepY = cy + Math.sin(sweepAngle) * radius;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      intercepts.forEach((blip) => {
        const blipDist = blip.distance * radius;
        const bx = cx + Math.cos(blip.angle) * blipDist;
        const by = cy + Math.sin(blip.angle) * blipDist;

        let diff = sweepAngle - blip.angle;
        while (diff < 0) diff += Math.PI * 2;
        while (diff >= Math.PI * 2) diff -= Math.PI * 2;

        const isFresh = diff < 0.6;
        const isSelected = selectedId === blip.id;

        const color =
          blip.threatLevel === 'Critical'
            ? '#f43f5e'
            : blip.threatLevel === 'Suspicious'
            ? '#fbbf24'
            : '#2dd4bf';

        if (isFresh || isSelected) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(bx, by, isSelected ? 12 : 9, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = isSelected ? 14 : isFresh ? 10 : 4;
        ctx.beginPath();
        ctx.arc(bx, by, isSelected ? 5.5 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isSelected || blip.threatLevel === 'Critical') {
          ctx.font = '9px monospace';
          ctx.fillStyle = color;
          ctx.fillText(blip.id, bx + 7, by - 4);
        }
      });

      sweepAngle = (sweepAngle + 0.035) % (Math.PI * 2);
      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [intercepts, selectedId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = canvas.width / 2 - 12;

    let closest: RadarIntercept | null = null;
    let minDist = 22;

    intercepts.forEach((blip) => {
      const blipDist = blip.distance * radius;
      const bx = cx + Math.cos(blip.angle) * blipDist;
      const by = cy + Math.sin(blip.angle) * blipDist;
      const d = Math.hypot(bx - x, by - y);
      if (d < minDist) {
        minDist = d;
        closest = blip;
      }
    });

    if (closest) {
      onSelectIntercept((closest as RadarIntercept).id);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[#091219] border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-[#22d3ee]" />
          <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
            Surveillance Radar
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
          Sweep: 360° ACTIVE
        </span>
      </div>

      <div className="relative w-full aspect-square max-w-[240px] mx-auto my-2 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={240}
          height={240}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair rounded-full shadow-[0_0_20px_rgba(34,211,238,0.12)] border border-slate-800"
        />

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 text-[10px] font-mono pt-2 border-t border-slate-800/60 text-center">
        <div className="p-1 rounded bg-slate-900/60 border border-slate-800 text-emerald-400">
          ● Safe
        </div>
        <div className="p-1 rounded bg-slate-900/60 border border-slate-800 text-amber-400">
          ● Suspicious
        </div>
        <div className="p-1 rounded bg-slate-900/60 border border-slate-800 text-rose-400">
          ● Critical
        </div>
      </div>
    </div>
  );
};
