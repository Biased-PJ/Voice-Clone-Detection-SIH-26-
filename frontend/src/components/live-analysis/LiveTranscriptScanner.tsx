import React from 'react';
import { MessageSquare, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

export interface TranscriptSnippet {
  id: string;
  timestamp: string;
  speaker: 'Caller (Ingest)' | 'Target Agent' | 'Automated PBX';
  text: string;
  flaggedKeywords?: string[];
  threatLevel?: 'Normal' | 'Urgent' | 'Critical';
}

interface LiveTranscriptScannerProps {
  snippets: TranscriptSnippet[];
  urgencyScore: number;
  isStreaming: boolean;
}

export const LiveTranscriptScanner: React.FC<LiveTranscriptScannerProps> = ({
  snippets,
  urgencyScore,
  isStreaming,
}) => {
  return (
    <div className="relative rounded-2xl bg-[#091219]/95 border border-slate-800/90 p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono tracking-wider text-slate-300 uppercase font-semibold">
            Live Speech & Semantic Telemetry
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            NLP INTENT MODEL
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">Social Engineering Urgency:</span>
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              urgencyScore > 70
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : urgencyScore > 35
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {urgencyScore}% {urgencyScore > 70 ? 'CRITICAL' : urgencyScore > 35 ? 'ELEVATED' : 'NOMINAL'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1 select-text">
        {snippets.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-xl">
            Waiting for acoustic ingress to decode phonemes and conversational phrases...
          </div>
        ) : (
          snippets.map((snip) => {
            const isCritical = snip.threatLevel === 'Critical';
            const isUrgent = snip.threatLevel === 'Urgent';

            return (
              <div
                key={snip.id}
                className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                  isCritical
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-100'
                    : isUrgent
                    ? 'bg-amber-950/30 border-amber-500/30 text-amber-100'
                    : 'bg-[#060a0f] border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{snip.speaker}</span>
                    <span>•</span>
                    <span>{snip.timestamp}</span>
                  </div>

                  {snip.flaggedKeywords && snip.flaggedKeywords.length > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span className="text-rose-400 font-semibold">
                        TRIGGER: {snip.flaggedKeywords.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <p className="leading-relaxed text-[13px] font-sans text-slate-200">
                  {snip.text}
                </p>
              </div>
            );
          })
        )}
      </div>

      {isStreaming && (
        <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400/80 pt-1 border-t border-slate-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>REAL-TIME RTP TRANSCRIBER LISTENING (DEEPGRAM / CONFORMER ASR NODE)</span>
        </div>
      )}
    </div>
  );
};
