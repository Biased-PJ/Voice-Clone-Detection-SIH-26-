import React, { useState } from 'react';
import { Activity, TrendingUp } from 'lucide-react';

interface ChartPoint {
  x: number;
  time: string;
  calls: number;
  threats: number;
  jitter: string;
  incident?: string;
}

interface InteractiveVolumeGraphProps {
  onSelectIncident?: (incident: string) => void;
}

export const InteractiveVolumeGraph: React.FC<InteractiveVolumeGraphProps> = ({
  onSelectIncident,
}) => {
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '7D' | '30D' | 'LIVE'>('24H');
  const [showCallsLayer, setShowCallsLayer] = useState(true);
  const [showThreatsLayer, setShowThreatsLayer] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartPoints: ChartPoint[] = [
    { x: 30, time: '00:00', calls: 94, threats: 4, jitter: '0.9ms' },
    { x: 105, time: '03:00', calls: 142, threats: 9, jitter: '1.1ms' },
    { x: 185, time: '06:00', calls: 110, threats: 6, jitter: '0.8ms' },
    { x: 265, time: '09:00', calls: 245, threats: 19, jitter: '2.4ms', incident: 'VoIP Burst' },
    { x: 345, time: '12:00', calls: 360, threats: 32, jitter: '3.1ms' },
    { x: 425, time: '15:00', calls: 490, threats: 41, jitter: '4.8ms', incident: 'Clone Campaign Intercepted' },
    { x: 505, time: '18:00', calls: 410, threats: 28, jitter: '2.2ms' },
    { x: 575, time: '21:00', calls: 320, threats: 18, jitter: '1.4ms' },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#091219] border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 w-64 h-64 rounded-full bg-cyan-500/5 blur-[80px]"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#22d3ee]" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-['Space_Grotesk']">
              Call Volume vs. Flagged Threats
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#242340] border border-indigo-500/30 text-[#a5b4fc] text-[10px] sm:text-[11px] font-mono font-bold tracking-wide">
            ACOUSTIC TELEMETRY
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          {(['1H', '24H', '7D', '30D', 'LIVE'] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-[#0f2429] text-[#22d3ee] font-bold border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCallsLayer(!showCallsLayer)}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all cursor-pointer ${
              showCallsLayer
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#22d3ee] shadow-[0_0_8px_#22d3ee]" />
            <span className="font-semibold">Call Volume</span>
          </button>

          <button
            type="button"
            onClick={() => setShowThreatsLayer(!showThreatsLayer)}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all cursor-pointer ${
              showThreatsLayer
                ? 'bg-indigo-500/10 border-indigo-500/30 text-[#a5b4fc]'
                : 'bg-slate-900 border-slate-800 text-slate-500 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#a78bfa] shadow-[0_0_8px_#a78bfa]" />
            <span className="font-semibold">Flagged Threats</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>
              Ingest Latency: <strong className="text-white">18 ms</strong>
            </span>
          </span>
          <span className="text-slate-600">|</span>
          <span>
            Sample Peak: <strong className="text-cyan-300">490 calls/hr</strong>
          </span>
        </div>
      </div>

      <div
        className="relative w-full h-48 sm:h-64 mt-1 flex items-center select-none"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relativeX = ((e.clientX - rect.left) / rect.width) * 600;

          let closest = 0;
          let minDiff = Infinity;
          chartPoints.forEach((p, idx) => {
            const diff = Math.abs(p.x - relativeX);
            if (diff < minDiff) {
              minDiff = diff;
              closest = idx;
            }
          });
          setHoveredIndex(closest);
        }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <svg
          className="w-full h-full overflow-visible"
          viewBox="0 0 600 200"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="volCyanGradientArea" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#0d9488" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="volPurpleGradientArea" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.26" />
              <stop offset="70%" stopColor="#6366f1" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <line x1="0" y1="35" x2="600" y2="35" stroke="#17222c" strokeDasharray="3 3" />
          <line x1="0" y1="85" x2="600" y2="85" stroke="#17222c" strokeDasharray="3 3" />
          <line x1="0" y1="135" x2="600" y2="135" stroke="#17222c" strokeDasharray="3 3" />

          {showCallsLayer && (
            <>
              <path
                d="M 0 135 C 50 115, 80 130, 110 115 C 150 95, 170 120, 210 90 C 260 55, 300 100, 350 70 C 400 45, 430 75, 480 50 C 520 30, 560 60, 600 55 L 600 200 L 0 200 Z"
                fill="url(#volCyanGradientArea)"
              />
              <path
                d="M 0 135 C 50 115, 80 130, 110 115 C 150 95, 170 120, 210 90 C 260 55, 300 100, 350 70 C 400 45, 430 75, 480 50 C 520 30, 560 60, 600 55"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.8"
                strokeLinecap="round"
                className="drop-shadow-[0_0_10px_rgba(34,211,238,0.45)]"
              />
            </>
          )}

          {showThreatsLayer && (
            <>
              <path
                d="M 0 160 C 50 155, 80 165, 110 155 C 150 145, 170 160, 210 140 C 260 115, 300 150, 350 125 C 400 110, 430 135, 480 115 C 520 95, 560 120, 600 115 L 600 200 L 0 200 Z"
                fill="url(#volPurpleGradientArea)"
              />
              <path
                d="M 0 160 C 50 155, 80 165, 110 155 C 150 145, 170 160, 210 140 C 260 115, 300 150, 350 125 C 400 110, 430 135, 480 115 C 520 95, 560 120, 600 115"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2.8"
                strokeLinecap="round"
                className="drop-shadow-[0_0_10px_rgba(167,139,250,0.45)]"
              />
            </>
          )}

          {hoveredIndex !== null && (
            <line
              x1={chartPoints[hoveredIndex].x}
              y1="0"
              x2={chartPoints[hoveredIndex].x}
              y2="200"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              className="opacity-90"
            />
          )}

          {chartPoints.map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            const yCyan = 135 - idx * 11 + (idx % 2 === 0 ? 8 : -8);
            const yPurple = 160 - idx * 6 + (idx % 2 === 0 ? 5 : -5);

            return (
              <g key={p.time}>
                {showCallsLayer && (
                  <circle
                    cx={p.x}
                    cy={yCyan}
                    r={isHovered ? 6 : 3.5}
                    className={`fill-[#22d3ee] transition-all duration-150 ${
                      isHovered ? 'stroke-2 stroke-slate-950 shadow-lg' : ''
                    }`}
                  />
                )}
                {showThreatsLayer && (
                  <circle
                    cx={p.x}
                    cy={yPurple}
                    r={isHovered ? 6 : 3.5}
                    className={`fill-[#a78bfa] transition-all duration-150 ${
                      isHovered ? 'stroke-2 stroke-slate-950 shadow-lg' : ''
                    }`}
                  />
                )}

                {p.incident && (
                  <g
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectIncident) onSelectIncident(p.incident!);
                    }}
                  >
                    <line
                      x1={p.x}
                      y1={yPurple}
                      x2={p.x}
                      y2={yPurple - 30}
                      stroke="#f43f5e"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={p.x - 38}
                      y={yPurple - 44}
                      width={76}
                      height={16}
                      rx={4}
                      fill="#881337"
                      stroke="#f43f5e"
                      strokeWidth={0.8}
                    />
                    <text
                      x={p.x}
                      y={yPurple - 33}
                      textAnchor="middle"
                      fill="#fecdd3"
                      fontSize={8}
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {p.incident.length > 13 ? p.incident.substring(0, 12) + '…' : p.incident}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {hoveredIndex !== null && (
          <div
            className="absolute pointer-events-none z-20 p-3.5 rounded-xl bg-[#080e14]/95 border border-teal-500/40 shadow-[0_12px_32px_rgba(0,0,0,0.9)] text-xs font-mono min-w-[200px] animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
            style={{
              left: `${Math.min(Math.max((chartPoints[hoveredIndex].x / 600) * 100 - 15, 2), 70)}%`,
              top: '8px',
            }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
              <span className="text-white font-bold">{chartPoints[hoveredIndex].time} UTC</span>
              <span className="text-[10px] text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/30">
                {chartPoints[hoveredIndex].jitter} jitter
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <span className="w-2 h-2 rounded-full bg-[#22d3ee]" />
                  Total Inbound:
                </span>
                <strong className="text-white font-bold">{chartPoints[hoveredIndex].calls}</strong>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-indigo-300">
                  <span className="w-2 h-2 rounded-full bg-[#a78bfa]" />
                  Flagged Threats:
                </span>
                <strong className="text-[#a78bfa] font-bold">
                  {chartPoints[hoveredIndex].threats}
                </strong>
              </div>

              <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span>Threat Ratio:</span>
                <span className="text-amber-400 font-bold">
                  {((chartPoints[hoveredIndex].threats / chartPoints[hoveredIndex].calls) * 100).toFixed(
                    1
                  )}
                  %
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-800/70 mt-2 relative z-10">
        <span>00:00</span>
        <span>04:00</span>
        <span>08:00</span>
        <span>12:00</span>
        <span>16:00</span>
        <span>20:00</span>
        <span>23:59</span>
      </div>
    </div>
  );
};
