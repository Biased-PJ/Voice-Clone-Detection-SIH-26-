import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Brain,
  Mic,
  Activity,
  PhoneOff,
  KeyRound,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export interface CheckpointStatus {
  id: string;
  name: string;
  category: string;
  status: 'passed' | 'warning' | 'failed' | 'scanning';
  confidence: number;
  metric: string;
  detail: string;
}

interface LiveBiometricMatrixProps {
  threatScore: number;
  threatLevel: 'Safe' | 'Suspicious' | 'Critical';
  cloneProbability: number;
  checkpoints: CheckpointStatus[];
  onSeverCall: () => void;
  onEnforcePin: () => void;
  onExportReport: () => void;
  onDownloadWav: () => void;
  isCallSevered: boolean;
  pinEnforced: boolean;
}

export const LiveBiometricMatrix: React.FC<LiveBiometricMatrixProps> = ({
  threatScore,
  threatLevel,
  cloneProbability,
  checkpoints,
  onSeverCall,
  onEnforcePin,
  onExportReport,
  onDownloadWav,
  isCallSevered,
  pinEnforced,
}) => {
  const isCritical = threatLevel === 'Critical';
  const isSuspicious = threatLevel === 'Suspicious';

  const themeColor = isCritical ? '#f43f5e' : isSuspicious ? '#f59e0b' : '#2dd4bf';

  // Circular gauge math
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (threatScore / 100) * circumference;

  return (
    <div className="flex flex-col gap-5">
      {/* Real-time Threat Gauge & Severity Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#091219]/95 border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
            <span className="text-xs font-mono tracking-wider text-slate-300 uppercase font-semibold">
              Live Threat Index
            </span>
          </div>

          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${
              isCritical
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : isSuspicious
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
            }`}
          >
            {isCritical
              ? 'CRITICAL DEEPFAKE CLONE'
              : isSuspicious
              ? 'SUSPICIOUS REVERBERATION'
              : 'VERIFIED ORGANIC VOICE'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Circular SVG Meter */}
          <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#1e293b"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress Arc */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={themeColor}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-500 ease-out"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                className="text-3xl font-extrabold tracking-tight font-['Space_Grotesk']"
                style={{ color: themeColor }}
              >
                {threatScore}%
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                THREAT SCORE
              </span>
            </div>
          </div>

          {/* Key Metric Breakdowns */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="p-2.5 rounded-xl bg-[#060a0f] border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400">Clone Probability</div>
              <div className="text-base font-bold text-slate-100 font-mono mt-0.5">
                {cloneProbability.toFixed(1)}%
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#060a0f] border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400">Phase Glitch Rate</div>
              <div className="text-base font-bold font-mono mt-0.5 text-[#9d8df1]">
                {isCritical ? '8.4 ms' : isSuspicious ? '3.8 ms' : '0.8 ms'}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#060a0f] border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400">Glottal Shimmer</div>
              <div className="text-base font-bold font-mono mt-0.5 text-slate-200">
                {isCritical ? '14.2%' : isSuspicious ? '6.8%' : '1.3%'}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#060a0f] border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400">Harmonic-to-Noise</div>
              <div className="text-base font-bold font-mono mt-0.5 text-cyan-300">
                {isCritical ? '8.2 dB' : isSuspicious ? '14.5 dB' : '24.1 dB'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Checkpoint Verification Matrix */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#091219]/95 border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-mono tracking-wider text-slate-300 uppercase font-semibold">
              5-Point Biometric Verification Matrix
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-400">
            Real-time Acoustic DSP Validation
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {checkpoints.map((cp, idx) => {
            const isPassed = cp.status === 'passed';
            const isWarn = cp.status === 'warning';
            const isFailed = cp.status === 'failed';

            return (
              <div
                key={cp.id}
                className={`p-3 rounded-xl border transition-all ${
                  isFailed
                    ? 'bg-rose-950/30 border-rose-500/40'
                    : isWarn
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-[#060a0f] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      0{idx + 1}.
                    </span>
                    <span className="text-xs font-semibold text-slate-100 font-['Space_Grotesk']">
                      {cp.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                      {cp.metric}
                    </span>
                    {isPassed && (
                      <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        PASSED
                      </span>
                    )}
                    {isWarn && (
                      <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        WARNING
                      </span>
                    )}
                    {isFailed && (
                      <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                        <XCircle className="w-3 h-3 text-rose-400" />
                        ANOMALY
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  {cp.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incident Mitigation Action Deck */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#091219]/95 border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono tracking-wider text-slate-300 uppercase font-semibold">
            Telecom Mitigation Controls
          </span>
          <span className="text-[10px] font-mono text-slate-500">SIP TRUNK COMMANDS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onSeverCall}
            disabled={isCallSevered}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isCallSevered
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
            }`}
          >
            <PhoneOff className="w-4 h-4" />
            <span>{isCallSevered ? 'SIP Trunk Severed' : 'Sever SIP Trunk Now'}</span>
          </button>

          <button
            type="button"
            onClick={onEnforcePin}
            disabled={pinEnforced}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              pinEnforced
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-not-allowed'
                : 'bg-[#0f2429] hover:bg-[#163840] text-teal-300 border border-teal-500/40 shadow-sm'
            }`}
          >
            <KeyRound className="w-4 h-4 text-teal-400" />
            <span>{pinEnforced ? 'Challenge PIN Active' : 'Enforce Biometric PIN'}</span>
          </button>

          <button
            type="button"
            onClick={onExportReport}
            className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Export Incident PDF</span>
          </button>

          <button
            type="button"
            onClick={onDownloadWav}
            className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>Download Raw Audio Intercept</span>
          </button>
        </div>
      </div>
    </div>
  );
};
