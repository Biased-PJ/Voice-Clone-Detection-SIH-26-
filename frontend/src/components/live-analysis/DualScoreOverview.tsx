import React from 'react';
import {
  Mic,
  BrainCircuit,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  MessageSquareWarning,
  Flame,
  Radio,
} from 'lucide-react';

interface DualScoreOverviewProps {

  aiVoiceScore: number;
  pitchStability: string;
  frequencyContinuity: string;
  vocoderDetected: boolean;

  scamIntentScore: number;
  urgencyLevel: string;
  detectedTactic: string;
  intentCategory: string;

  onSeverCall?: () => void;
  onEnforcePin?: () => void;
  isCallSevered?: boolean;
  pinEnforced?: boolean;
}

export const DualScoreOverview: React.FC<DualScoreOverviewProps> = ({
  aiVoiceScore,
  pitchStability,
  frequencyContinuity,
  vocoderDetected,
  scamIntentScore,
  urgencyLevel,
  detectedTactic,
  intentCategory,
  onSeverCall,
  onEnforcePin,
  isCallSevered,
  pinEnforced,
}) => {

  const isAiCritical = aiVoiceScore >= 70;
  const isAiWarning = aiVoiceScore >= 40 && aiVoiceScore < 70;
  const aiColor = isAiCritical ? '#f43f5e' : isAiWarning ? '#f59e0b' : '#2dd4bf';
  const aiTextColor = isAiCritical ? 'text-rose-400' : isAiWarning ? 'text-amber-400' : 'text-teal-400';
  const aiBgColor = isAiCritical ? 'bg-rose-500/10 border-rose-500/30' : isAiWarning ? 'bg-amber-500/10 border-amber-500/30' : 'bg-teal-500/10 border-teal-500/30';

  const isScamCritical = scamIntentScore >= 70;
  const isScamWarning = scamIntentScore >= 40 && scamIntentScore < 70;
  const scamColor = isScamCritical ? '#f43f5e' : isScamWarning ? '#f59e0b' : '#2dd4bf';
  const scamTextColor = isScamCritical ? 'text-rose-400' : isScamWarning ? 'text-amber-400' : 'text-teal-400';
  const scamBgColor = isScamCritical ? 'bg-rose-500/10 border-rose-500/30' : isScamWarning ? 'bg-amber-500/10 border-amber-500/30' : 'bg-teal-500/10 border-teal-500/30';

  const isOverallCritical = isAiCritical || isScamCritical;
  const isOverallSuspicious = !isOverallCritical && (isAiWarning || isScamWarning);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const aiOffset = circumference - (Math.min(Math.max(aiVoiceScore, 0), 100) / 100) * circumference;
  const scamOffset = circumference - (Math.min(Math.max(scamIntentScore, 0), 100) / 100) * circumference;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.3)] backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div
            className="absolute top-0 right-0 w-36 h-36 rounded-full blur-[70px] pointer-events-none"
            style={{ backgroundColor: `${aiColor}15` }}
          />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <Mic className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold block">
                    Score 1 of 2
                  </span>
                  <h3 className="text-sm font-bold font-['Space_Grotesk'] text-white">
                    AI Voice Probability
                  </h3>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase border ${aiBgColor} ${aiTextColor}`}
              >
                {isAiCritical ? 'Synthetic Clone' : isAiWarning ? 'Suspicious Audio' : 'Natural Voice'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2 font-normal leading-relaxed">
              Analyzes acoustic frequencies, pitch micro-jitter, and vocoder phase continuity.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-5">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={aiColor}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={aiOffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold font-['Space_Grotesk'] text-white tracking-tight">
                  {aiVoiceScore}
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">/ 100</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                <span className="text-slate-400">Pitch Jitter:</span>
                <span className={`font-semibold ${aiTextColor}`}>{pitchStability}</span>
              </div>
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                <span className="text-slate-400">Frequency Phase:</span>
                <span className="text-slate-200">{frequencyContinuity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Vocoder Artifact:</span>
                <span className={`font-semibold ${vocoderDetected ? 'text-rose-400' : 'text-teal-400'}`}>
                  {vocoderDetected ? 'Detected (3.5 kHz)' : 'None (Natural)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.3)] backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div
            className="absolute top-0 right-0 w-36 h-36 rounded-full blur-[70px] pointer-events-none"
            style={{ backgroundColor: `${scamColor}15` }}
          />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <BrainCircuit className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold block">
                    Score 2 of 2
                  </span>
                  <h3 className="text-sm font-bold font-['Space_Grotesk'] text-white">
                    Scam & Fraud Intent Risk
                  </h3>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase border ${scamBgColor} ${scamTextColor}`}
              >
                {isScamCritical ? 'High-Risk Scam' : isScamWarning ? 'Suspicious Pretext' : 'Benign Content'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2 font-normal leading-relaxed">
              Analyzes conversation transcript, urgent wire requests, and social engineering coercion.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-5">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={scamColor}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={scamOffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold font-['Space_Grotesk'] text-white tracking-tight">
                  {scamIntentScore}
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">/ 100</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                <span className="text-slate-400">Urgency Level:</span>
                <span className={`font-semibold ${scamTextColor}`}>{urgencyLevel}</span>
              </div>
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                <span className="text-slate-400">Pretext Target:</span>
                <span className="text-slate-200 truncate max-w-[130px]">{intentCategory}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Attack Pattern:</span>
                <span className="text-slate-300 truncate max-w-[130px]">{detectedTactic}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md ${
          isOverallCritical
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            : isOverallSuspicious
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            : 'bg-teal-950/40 border-teal-500/40 text-teal-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {isOverallCritical ? (
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          ) : isOverallSuspicious ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
          )}

          <div>
            <div className="text-xs font-bold font-['Space_Grotesk'] tracking-wide uppercase">
              {isAiCritical && isScamCritical
                ? 'VERDICT: CRITICAL AI CLONE & ACTIVE SCAM DETECTED'
                : isAiCritical
                ? 'VERDICT: SYNTHETIC AI VOICE DETECTED (NEURAL VOCODER)'
                : isScamCritical
                ? 'VERDICT: HIGH-RISK SCAM / SOCIAL ENGINEERING IN PROGRESS'
                : isOverallSuspicious
                ? 'VERDICT: SUSPICIOUS CALL PATTERN — MONITORING'
                : 'VERDICT: AUTHENTIC HUMAN VOICEPRINT & BENIGN CONVERSATION'}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              {isOverallCritical
                ? 'Voice telemetry reveals artificial pitch synthesis combined with high-urgency financial or credential solicitation.'
                : isOverallSuspicious
                ? 'Minor acoustic variance or elevated pressure detected. Keep line monitored.'
                : 'Natural biological glottal jitter observed with standard conversational cadence.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onEnforcePin && (
            <button
              type="button"
              onClick={onEnforcePin}
              disabled={pinEnforced}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                pinEnforced
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              }`}
            >
              {pinEnforced ? 'PIN Challenge Dispatched' : 'Enforce Voice PIN'}
            </button>
          )}

          {onSeverCall && (
            <button
              type="button"
              onClick={onSeverCall}
              disabled={isCallSevered}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                isCallSevered
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
              }`}
            >
              {isCallSevered ? 'Trunk Severed' : 'Sever SIP Call'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
