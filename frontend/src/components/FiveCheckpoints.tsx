import React from 'react';
import { Mic, Brain, Activity, Radio, FileText } from 'lucide-react';

interface CheckpointItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

interface FiveCheckpointsProps {
  activeCheckpoint?: string | null;
  onSelectCheckpoint?: (id: string) => void;
}

export const FiveCheckpoints: React.FC<FiveCheckpointsProps> = ({
  activeCheckpoint,
  onSelectCheckpoint,
}) => {
  const checkpoints: CheckpointItem[] = [
    {
      id: 'capture',
      icon: <Mic className="w-5 h-5 text-[#22d3ee]" />,
      title: 'Audio capture',
      description: 'A call or clip enters the pipeline via mic or upload.',
    },
    {
      id: 'spectral',
      icon: <Brain className="w-5 h-5 text-[#f472b6]" />,
      title: 'AI analysis',
      description: 'Spectral and temporal features are extracted.',
    },
    {
      id: 'authenticity',
      icon: <Activity className="w-5 h-5 text-[#2dd4bf]" />,
      title: 'Voice authenticity',
      description: 'Human vs. synthetic-origin probability scored.',
    },
    {
      id: 'threat',
      icon: <Radio className="w-5 h-5 text-[#818cf8]" />,
      title: 'Threat detection',
      description: 'Scam patterns and social engineering flagged.',
    },
    {
      id: 'action',
      icon: <FileText className="w-5 h-5 text-[#f8fafc]" />,
      title: 'Explanation & action',
      description: 'Evidence surfaced with a recommended next step.',
    },
  ];

  return (
    <section className="w-full mt-16 sm:mt-24 pt-6">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-6 sm:mb-8 font-['Plus_Jakarta_Sans',sans-serif]">
        One call, five checkpoints
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {checkpoints.map((cp, idx) => {
          const isActive = activeCheckpoint === cp.id;

          return (
            <button
              key={cp.id}
              type="button"
              id={`checkpoint-card-${cp.id}`}
              onClick={() => onSelectCheckpoint?.(cp.id)}
              className={`rounded-2xl p-5 sm:p-6 text-left flex flex-col justify-between transition-all duration-300 group cursor-pointer border select-none ${
                isActive
                  ? 'bg-[#121c25] border-cyan-400/60 shadow-[0_0_25px_rgba(34,211,238,0.2)] -translate-y-1'
                  : 'bg-[#091117]/85 hover:bg-[#0e1922] border-slate-800/80 hover:border-slate-700 shadow-lg hover:-translate-y-0.5'
              }`}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                  {cp.icon}
                </div>

                <h3 className="text-[15px] sm:text-base font-bold text-white tracking-tight mb-2">
                  {cp.title}
                </h3>

                <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed font-normal">
                  {cp.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>STAGE 0{idx + 1}</span>
                <span className="text-teal-400/80 opacity-0 group-hover:opacity-100 transition-opacity">
                  Inspect →
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
