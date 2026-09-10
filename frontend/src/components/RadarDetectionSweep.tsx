import React, { useEffect, useRef } from 'react';

interface RadarDetectionSweepProps {
  isAnalyzing?: boolean;
  onClick?: () => void;
}

interface Particle {
  x: number;
  y: number;
  baseRadius: number;
  angle: number;
  dist: number;
  speed: number;
  size: number;
  baseAlpha: number;
  highlightAlpha: number;
}

interface ThreatBlip {
  id: string;
  angle: number;
  distance: number;
  label: string;
  sub: string;
  status: 'critical' | 'warning' | 'verified';
  lastHit: number;
}

export const RadarDetectionSweep: React.FC<RadarDetectionSweepProps> = ({
  isAnalyzing = false,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 460;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxRadius = size / 2 - 14;

    const particleCount = 42;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const dist = 28 + Math.pow(Math.random(), 0.7) * (maxRadius - 38);
      const angle = Math.random() * Math.PI * 2;
      particles.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        baseRadius: dist,
        angle,
        dist,
        speed: (0.001 + Math.random() * 0.002) * (Math.random() > 0.5 ? 1 : -1),
        size: 1.1 + Math.random() * 1.6,
        baseAlpha: 0.25 + Math.random() * 0.4,
        highlightAlpha: 0,
      });
    }

    const threatTargets: ThreatBlip[] = [
      {
        id: 'blip-1',
        angle: 0.88,
        distance: 0.65,
        label: 'NEURAL CLONE',
        sub: '98.7% MATCH',
        status: 'critical',
        lastHit: 0,
      },
      {
        id: 'blip-2',
        angle: 2.35,
        distance: 0.42,
        label: 'PHASE JITTER',
        sub: 'HF VOCODER',
        status: 'warning',
        lastHit: 0,
      },
      {
        id: 'blip-3',
        angle: 4.15,
        distance: 0.76,
        label: 'HUMAN CALLER',
        sub: 'NATURAL GLOTTAL',
        status: 'verified',
        lastHit: 0,
      },
    ];

    let sweepAngle = 0;
    const sweepSpeed = isAnalyzing ? 0.038 : 0.02;

    const render = (now: number) => {
      const t = now / 1000;

      sweepAngle = (sweepAngle + sweepSpeed) % (Math.PI * 2);

      threatTargets.forEach((tgt) => {
        let diff = (sweepAngle - tgt.angle) % (Math.PI * 2);
        if (diff < 0) diff += Math.PI * 2;
        if (diff < 0.16 && now - tgt.lastHit > 1100) {
          tgt.lastHit = now;
        }
      });

      particles.forEach((p) => {
        p.angle += p.speed;
        const r = p.baseRadius + Math.sin(t * 1.5 + p.angle * 3) * 2.8;
        p.x = cx + Math.cos(p.angle) * r;
        p.y = cy + Math.sin(p.angle) * r;

        let diff = (sweepAngle - p.angle) % (Math.PI * 2);
        if (diff < 0) diff += Math.PI * 2;
        if (diff < 0.35) {
          p.highlightAlpha = 1 - diff / 0.35;
        } else {
          p.highlightAlpha = Math.max(0, p.highlightAlpha - 0.04);
        }
      });

      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
      bgGrad.addColorStop(0, '#092330');
      bgGrad.addColorStop(0.35, '#061622');
      bgGrad.addColorStop(0.72, '#040e16');
      bgGrad.addColorStop(1, '#02070b');
      ctx.fillStyle = bgGrad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();

      const eqRingRadius = maxRadius * 0.73;
      const numBars = 72;
      ctx.save();
      for (let i = 0; i < numBars; i++) {
        const barAngle = (i / numBars) * Math.PI * 2;
        const wave1 = Math.sin(barAngle * 6 + t * 2.8) * 0.5 + 0.5;
        const wave2 = Math.cos(barAngle * 12 - t * 3.4) * 0.5 + 0.5;
        const barHeight = 2.6 + (wave1 * 0.6 + wave2 * 0.4) * (isAnalyzing ? 13 : 7.5);

        let diff = (sweepAngle - barAngle) % (Math.PI * 2);
        if (diff < 0) diff += Math.PI * 2;
        const isNearSweep = diff < 0.55;

        const x1 = cx + Math.cos(barAngle) * eqRingRadius;
        const y1 = cy + Math.sin(barAngle) * eqRingRadius;
        const x2 = cx + Math.cos(barAngle) * (eqRingRadius + barHeight);
        const y2 = cy + Math.sin(barAngle) * (eqRingRadius + barHeight);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isNearSweep
          ? 'rgba(255, 255, 255, 0.96)'
          : 'rgba(230, 242, 255, 0.42)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();

      const rings = [
        { r: maxRadius * 0.28, dash: [], alpha: 0.40, width: 1.1, label: '6 kHz' },
        { r: maxRadius * 0.52, dash: [4, 4], alpha: 0.48, width: 1.1, rotate: t * 0.05, label: '12 kHz' },
        { r: maxRadius * 0.75, dash: [], alpha: 0.40, width: 1.1, label: '18 kHz' },
        { r: maxRadius, dash: [], alpha: 0.68, width: 1.5, label: '24 kHz' },
      ];

      rings.forEach((ring) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(240, 248, 255, ${ring.alpha})`;
        ctx.lineWidth = ring.width;
        if (ring.dash.length > 0) {
          ctx.setLineDash(ring.dash);
          ctx.lineDashOffset = (ring.rotate || 0) * 80;
        }
        ctx.stroke();

        if (ring.label && ring.r < maxRadius) {
          ctx.font = '8.5px "Space Grotesk", monospace';
          ctx.fillStyle = 'rgba(235, 245, 255, 0.75)';
          ctx.textAlign = 'center';
          ctx.fillText(ring.label, cx, cy - ring.r + 10);
        }
        ctx.restore();
      });

      ctx.save();
      ctx.strokeStyle = 'rgba(240, 248, 255, 0.26)';
      ctx.lineWidth = 1;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18);
        ctx.lineTo(cx + Math.cos(a) * maxRadius, cy + Math.sin(a) * maxRadius);
        ctx.stroke();

        const midX = cx + Math.cos(a) * (maxRadius * 0.52);
        const midY = cy + Math.sin(a) * (maxRadius * 0.52);
        ctx.beginPath();
        ctx.arc(midX, midY, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      const tickCount = 36;
      for (let i = 0; i < tickCount; i++) {
        const a = (i / tickCount) * Math.PI * 2;
        const isMajor = i % 3 === 0;
        const isCardinal = i % 9 === 0;
        const innerR = maxRadius - (isCardinal ? 9 : isMajor ? 6 : 3.5);
        const outerR = maxRadius;

        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
        ctx.lineTo(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
        ctx.strokeStyle = isCardinal
          ? 'rgba(255, 255, 255, 0.95)'
          : isMajor
          ? 'rgba(240, 248, 255, 0.60)'
          : 'rgba(230, 242, 255, 0.35)';
        ctx.lineWidth = isCardinal ? 1.5 : isMajor ? 1.2 : 0.85;
        ctx.stroke();

        if (isCardinal) {
          const deg = (i * 10) % 360;
          const labelDist = maxRadius - 16;
          ctx.font = 'bold 8.5px monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${deg}°`, cx + Math.cos(a) * labelDist, cy + Math.sin(a) * labelDist);
        }
      }
      ctx.restore();

      const sweepTailAngle = Math.PI / 2.6;
      const tailSegments = 30;

      for (let s = 0; s < tailSegments; s++) {
        const start = sweepAngle - (sweepTailAngle * (s + 1)) / tailSegments;
        const end = sweepAngle - (sweepTailAngle * s) / tailSegments;
        const decay = 1 - s / tailSegments;
        const alpha = Math.pow(decay, 1.8) * 0.24;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxRadius, start, end);
        ctx.closePath();

        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxRadius);
        grad.addColorStop(0, `rgba(45, 212, 191, ${alpha * 0.35})`);
        grad.addColorStop(0.6, `rgba(20, 184, 166, ${alpha * 0.9})`);
        grad.addColorStop(1, `rgba(13, 148, 136, ${alpha * 0.12})`);

        ctx.fillStyle = grad;
        ctx.fill();
      }

      const needleX = cx + Math.cos(sweepAngle) * maxRadius;
      const needleY = cy + Math.sin(sweepAngle) * maxRadius;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(needleX, needleY);
      ctx.strokeStyle = 'rgba(94, 234, 212, 0.98)';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#2dd4bf';
      ctx.shadowBlur = 12;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(needleX, needleY, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#5eead4';
      ctx.shadowBlur = 9;
      ctx.fill();
      ctx.restore();

      particles.forEach((p) => {
        const totalAlpha = Math.min(1, p.baseAlpha + p.highlightAlpha * 0.85);
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + p.highlightAlpha * 0.8), 0, Math.PI * 2);
        if (p.highlightAlpha > 0.3) {
          ctx.fillStyle = `rgba(255, 255, 255, ${totalAlpha})`;
          ctx.shadowColor = '#2dd4bf';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = `rgba(230, 242, 255, ${totalAlpha * 0.7})`;
        }
        ctx.fill();
        ctx.restore();
      });

      threatTargets.forEach((tgt) => {
        const tx = cx + Math.cos(tgt.angle) * (maxRadius * tgt.distance);
        const ty = cy + Math.sin(tgt.angle) * (maxRadius * tgt.distance);

        const timeSince = now - tgt.lastHit;
        const decay = Math.max(0.15, Math.exp(-timeSince / 800));

        let color = '#2dd4bf';
        let rgb = '45, 212, 191';
        if (tgt.status === 'critical') {
          color = '#f43f5e';
          rgb = '244, 63, 94';
        } else if (tgt.status === 'warning') {
          color = '#fbbf24';
          rgb = '251, 191, 36';
        } else if (tgt.status === 'verified') {
          color = '#34d399';
          rgb = '52, 211, 153';
        }

        if (timeSince < 1200) {
          const prog = timeSince / 1200;
          const rippleR = 5 + prog * 28;
          const rippleAlpha = (1 - prog) * 0.75;

          ctx.save();
          ctx.beginPath();
          ctx.arc(tx, ty, rippleR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${rgb}, ${rippleAlpha})`;
          ctx.lineWidth = 1.1;
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(tx, ty, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = decay > 0.4 ? 14 : 5;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(tx, ty, 8.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb}, ${decay * 0.85})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        if (decay > 0.22) {
          ctx.font = '600 9px "Space Grotesk", sans-serif';
          ctx.fillStyle = `rgba(${rgb}, ${Math.min(1, decay * 1.2)})`;
          ctx.textAlign = 'left';
          ctx.fillText(tgt.label, tx + 12, ty - 2);

          ctx.font = '7.5px monospace';
          ctx.fillStyle = `rgba(230, 242, 255, ${decay * 0.9})`;
          ctx.fillText(tgt.sub, tx + 12, ty + 8);

          ctx.beginPath();
          ctx.moveTo(tx + 5, ty - 3);
          ctx.lineTo(tx + 10, ty - 3);
          ctx.strokeStyle = `rgba(${rgb}, ${decay * 0.55})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
        ctx.restore();
      });

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, Math.PI * 2);
      ctx.fillStyle = '#06131c';
      ctx.strokeStyle = 'rgba(240, 248, 255, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();

      const pulseSize = 3.6 + Math.sin(t * 3) * 0.8;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = '#5eead4';
      ctx.shadowColor = '#2dd4bf';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isAnalyzing]);

  return (
    <div
      id="radar-detection-sweep-widget"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="relative flex items-center justify-center cursor-pointer group select-none focus:outline-none"
    >
      <div
        className={`absolute w-[360px] h-[360px] sm:w-[430px] sm:h-[430px] lg:w-[470px] lg:h-[470px] rounded-full transition-all duration-700 pointer-events-none ${
          isAnalyzing
            ? 'bg-teal-400/20 blur-[85px] scale-105'
            : 'bg-teal-500/10 group-hover:bg-cyan-500/18 blur-[75px]'
        }`}
      />

      <div className="relative w-[340px] h-[340px] sm:w-[410px] sm:h-[410px] md:w-[440px] md:h-[440px] lg:w-[460px] lg:h-[460px] rounded-full bg-[#03070b] border-2 border-slate-700/80 shadow-[0_22px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(45,212,191,0.09),inset_0_0_25px_rgba(0,0,0,0.85)] flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-[1.015]">
        <div className="absolute inset-1 rounded-full border border-white/20 pointer-events-none shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]" />
        <canvas
          ref={canvasRef}
          className="w-full h-full pointer-events-none z-10"
        />
      </div>
    </div>
  );
};
