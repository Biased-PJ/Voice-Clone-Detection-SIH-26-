import React from 'react';

export type BackgroundVariant = 'dashboard' | 'live' | 'recorded' | 'call-intel';

interface PageBackgroundProps {
  variant: BackgroundVariant;
}

const KEYFRAMES = `
@keyframes pb-scanline {
  0% { transform: translateY(-10%); opacity: 0; }
  10% { opacity: 0.55; }
  90% { opacity: 0.55; }
  100% { transform: translateY(110vh); opacity: 0; }
}
@keyframes pb-pulse-ring {
  0% { transform: scale(0.6); opacity: 0.5; }
  100% { transform: scale(2.6); opacity: 0; }
}
@keyframes pb-drift {
  0% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(30px, -20px) rotate(6deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
@keyframes pb-ribbon {
  0% { transform: translateX(-10%); }
  100% { transform: translateX(10%); }
}
@keyframes pb-node-pulse {
  0%, 100% { opacity: 0.25; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.4); }
}
@keyframes pb-dash {
  to { stroke-dashoffset: -200; }
}
`;

const DashboardBg: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#060a0e]">
    <div
      className="absolute inset-0 opacity-[0.14]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(45,212,191,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.5) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    />
    <div
      className="absolute left-0 right-0 h-40 bg-gradient-to-b from-transparent via-teal-400/25 to-transparent"
      style={{ animation: 'pb-scanline 9s linear infinite' }}
    />
    <div
      aria-hidden="true"
      className="absolute -top-32 left-1/3 w-[520px] h-[520px] rounded-full bg-teal-500/10 blur-[130px]"
    />
    <div
      aria-hidden="true"
      className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-cyan-500/10 blur-[120px]"
    />
  </div>
);

const LiveBg: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0a0705]">
    <div
      aria-hidden="true"
      className="absolute -top-24 right-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/[0.06] blur-[140px]"
    />
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      {[0, 1.3, 2.6].map((delay) => (
        <div
          key={delay}
          className="absolute left-1/2 top-1/2 w-40 h-40 -ml-20 -mt-20 rounded-full border border-amber-400/40"
          style={{ animation: `pb-pulse-ring 3.9s ease-out ${delay}s infinite` }}
        />
      ))}
    </div>
    <div
      className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-orange-400/10 to-transparent"
      style={{ animation: 'pb-scanline 6s linear infinite' }}
    />
  </div>
);

const RecordedBg: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#08060d]">
    <div
      aria-hidden="true"
      className="absolute top-1/4 -left-20 w-[520px] h-[520px] rounded-full bg-violet-500/[0.08] blur-[130px]"
      style={{ animation: 'pb-drift 14s ease-in-out infinite' }}
    />
    <div
      aria-hidden="true"
      className="absolute bottom-0 right-0 w-[460px] h-[460px] rounded-full bg-fuchsia-500/[0.07] blur-[130px]"
      style={{ animation: 'pb-drift 18s ease-in-out infinite reverse' }}
    />
    <svg
      viewBox="0 0 1600 400"
      preserveAspectRatio="none"
      className="absolute inset-x-0 bottom-0 w-[130%] h-1/2 opacity-30"
      style={{ animation: 'pb-ribbon 22s ease-in-out infinite alternate' }}
    >
      <path
        d="M0,200 Q100,120 200,200 T400,200 T600,200 T800,200 T1000,200 T1200,200 T1400,200 T1600,200"
        fill="none"
        stroke="#c084fc"
        strokeWidth="2"
        strokeOpacity="0.5"
      />
      <path
        d="M0,240 Q100,300 200,240 T400,240 T600,240 T800,240 T1000,240 T1200,240 T1400,240 T1600,240"
        fill="none"
        stroke="#e879f9"
        strokeWidth="1.5"
        strokeOpacity="0.35"
      />
    </svg>
  </div>
);

const CallIntelBg: React.FC = () => {
  const nodes = [
    { x: 12, y: 18, delay: 0 },
    { x: 32, y: 62, delay: 0.6 },
    { x: 58, y: 24, delay: 1.2 },
    { x: 74, y: 70, delay: 0.3 },
    { x: 88, y: 32, delay: 0.9 },
    { x: 46, y: 84, delay: 1.5 },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#060810]">
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-500/[0.07] blur-[150px]"
      />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-40">
        {nodes.map((n, i) =>
          nodes.slice(i + 1).map((m, j) => (
            <line
              key={`${i}-${j}`}
              x1={n.x}
              y1={n.y}
              x2={m.x}
              y2={m.y}
              stroke="#38bdf8"
              strokeWidth="0.15"
              strokeDasharray="1.5 2"
              style={{ animation: 'pb-dash 30s linear infinite' }}
            />
          ))
        )}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r="0.9"
            fill="#38bdf8"
            style={{ animation: `pb-node-pulse 3.2s ease-in-out ${n.delay}s infinite` }}
          />
        ))}
      </svg>
    </div>
  );
};

export const PageBackground: React.FC<PageBackgroundProps> = ({ variant }) => {
  return (
    <>
      <style>{KEYFRAMES}</style>
      {variant === 'dashboard' && <DashboardBg />}
      {variant === 'live' && <LiveBg />}
      {variant === 'recorded' && <RecordedBg />}
      {variant === 'call-intel' && <CallIntelBg />}
    </>
  );
};
