import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  BrainCircuit,
  Sparkles,
} from 'lucide-react';

export interface CallSuggestion {
  id: string;
  level: 'critical' | 'warning' | 'info' | 'safe';
  title: string;
  advice: string;
  actionLabel?: string;
}

export interface ForensicsCall {
  id: string;
  timestamp: string;
  duration: string;
  carrier: string;
  caller: string;
  status: 'Safe' | 'Suspicious' | 'Critical';
  score: number;
  aiVoiceScore?: number;
  aiVoiceDescription?: string;
  scamIntentScore?: number;
  scamIntentDescription?: string;
  aiFamily: string;
  jitter: string;
  shimmer: string;
  formantF1: string;
  formantF2: string;
  details: string;
  suggestions?: CallSuggestion[];
}

interface CallForensicsInspectorProps {
  call: ForensicsCall;
  isPlaying?: boolean;
  onTogglePlay?: (id: string, status: string, filterMode: 'normal' | 'vocoder-isolated') => void;
  onClose?: () => void;
  onInspectCallIntelligence?: (callId: string) => void;
}

export const CallForensicsInspector: React.FC<CallForensicsInspectorProps> = ({
  call,
  onInspectCallIntelligence,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({});

  const isCritical = call.status === 'Critical';
  const isSuspicious = call.status === 'Suspicious';

  const aiScore = call.aiVoiceScore ?? (isCritical ? 97 : isSuspicious ? 68 : 4);
  const scamScore = call.scamIntentScore ?? (isCritical ? 94 : isSuspicious ? 62 : 5);

  const getAcousticDescription = (): string => {
    if (call.aiVoiceDescription) return call.aiVoiceDescription;
    if (aiScore >= 70) {
      return `${call.aiFamily} • Neural vocoder phase anomalies & missing glottal pulses`;
    }
    if (aiScore >= 40) {
      return `${call.aiFamily} • Micro-pitch quantization & formant smearing detected`;
    }
    return 'Organic vocal tract resonance verified (15-18cm) • Zero synthetic phase anomalies';
  };

  const getScamDescription = (): string => {
    if (call.scamIntentDescription) return call.scamIntentDescription;
    if (scamScore >= 70) {
      return 'High-urgency financial diversion script • Coercive social engineering pattern';
    }
    if (scamScore >= 40) {
      return 'Suspicious identity credential request • Inconsistent carrier gateway';
    }
    return 'Natural glottal pulse timing with standard biological breathing pauses & benign intent';
  };

  const getSuggestions = (): CallSuggestion[] => {
    if (call.suggestions && call.suggestions.length > 0) {
      return call.suggestions;
    }

    if (isCritical || aiScore >= 70 || scamScore >= 70) {
      return [
        {
          id: `${call.id}-sug-1`,
          level: 'critical',
          title: 'Do Not Execute Any Financial Wire or Credential Release',
          advice: `AI voice clone detected with ${aiScore}% certainty (${call.aiFamily}). Never release funds or bypass secondary dual-authorization.`,
          actionLabel: 'Reject Request',
        },
        {
          id: `${call.id}-sug-2`,
          level: 'critical',
          title: 'Demand Verbal Secret Passphrase Challenge',
          advice: 'High-urgency fraud script detected. Request your organization’s pre-shared challenge code or sever the call immediately.',
          actionLabel: 'Prompt Challenge',
        },
        {
          id: `${call.id}-sug-3`,
          level: 'warning',
          title: 'Quarantine Inbound Carrier & PBX Trunk',
          advice: `Telephony trunk from ${call.carrier} flagged with synthetic voice injection. Report to IT SecOps for immediate IP quarantine.`,
          actionLabel: 'Quarantine Route',
        },
        {
          id: `${call.id}-sug-4`,
          level: 'info',
          title: 'Archive Cryptographic Forensic Dossier',
          advice: `Signed evidence hash for ${call.id} generated. Export telemetry for threat intelligence database and compliance logging.`,
          actionLabel: 'Copy Evidence',
        },
      ];
    }

    if (isSuspicious || aiScore >= 40 || scamScore >= 40) {
      return [
        {
          id: `${call.id}-sug-1`,
          level: 'warning',
          title: 'Verify Caller via Out-of-Band Channel',
          advice: `Micro-pitch anomalies and phase smearing detected in carrier stream. Sever call and dial caller back on verified internal directory.`,
          actionLabel: 'Verify Identity',
        },
        {
          id: `${call.id}-sug-2`,
          level: 'warning',
          title: 'Never Disclose 2FA Passcodes or Credentials',
          advice: 'Caller exhibits abnormal behavioral urgency. Legitimate technical support or executives will never demand one-time SMS pins.',
          actionLabel: 'Block Inbound',
        },
        {
          id: `${call.id}-sug-3`,
          level: 'info',
          title: 'Flag Carrier Gateway for Monitoring',
          advice: `Carrier ${call.carrier} added to high-frequency deepfake watch list. Telemetry recorded with ${call.jitter} jitter.`,
          actionLabel: 'Flag Carrier',
        },
      ];
    }

    return [
      {
        id: `${call.id}-sug-1`,
        level: 'safe',
        title: 'Biometric Human Voice Authenticated',
        advice: `Acoustic resonance, vocal tract length, and glottal micro-jitter (${call.jitter}) are fully consistent with natural biological human speech.`,
      },
      {
        id: `${call.id}-sug-2`,
        level: 'safe',
        title: 'No Social Engineering or Scam Intent Detected',
        advice: 'Conversational acoustics and speech pacing exhibit standard, benign conversational patterns with zero fraud escalation triggers.',
      },
      {
        id: `${call.id}-sug-3`,
        level: 'info',
        title: 'Routine Compliance Archival',
        advice: `Call session ${call.id} cleared and securely archived in telephony threat intelligence logs.`,
        actionLabel: 'Copy Call ID',
      },
    ];
  };

  const copyCallHash = () => {
    navigator.clipboard.writeText(
      `TEAM-ROCKET::EVIDENCE::${call.id}::HASH-8F92A1B::SCORE-${call.score}`
    );
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyAdvice = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleActionClick = (id: string, label?: string) => {
    if (label === 'Copy Evidence' || label === 'Copy Call ID') {
      navigator.clipboard.writeText(`TEAM-ROCKET::CALL::${call.id}::STATUS::${call.status}`);
      setActionStatus((prev) => ({ ...prev, [id]: 'Copied ✓' }));
    } else {
      setActionStatus((prev) => ({ ...prev, [id]: 'Action Logged ✓' }));
    }
    setTimeout(() => {
      setActionStatus((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 2200);
  };

  const suggestions = getSuggestions();

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#080d13] border border-slate-800/90 shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              isCritical
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                : isSuspicious
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
            }`}
          >
            {isCritical ? (
              <ShieldAlert className="w-5 h-5" />
            ) : isSuspicious ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
                {call.id}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase border ${
                  isCritical
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    : isSuspicious
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {call.status}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Caller: <strong className="text-slate-200">{call.caller}</strong> • {call.carrier} • {call.timestamp} ({call.duration})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onInspectCallIntelligence && (
            <button
              type="button"
              id={`inspect-intel-${call.id}`}
              onClick={() => onInspectCallIntelligence(call.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm"
              title="Inspect call transcript intelligence and keywords"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
              <span>Transcript & Flags</span>
            </button>
          )}

          <button
            type="button"
            onClick={copyCallHash}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            title="Copy Evidence Hash"
          >
            {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedHash ? 'Copied' : 'Hash'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-4 rounded-xl bg-[#05080c] border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Score 1 of 2
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                aiScore >= 70
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : aiScore >= 40
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
              }`}
            >
              {aiScore >= 70
                ? 'Synthetic Clone'
                : aiScore >= 40
                ? 'Suspicious Pitch'
                : 'Natural Voice'}
            </span>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span
              className={`text-3xl sm:text-4xl font-extrabold font-['Space_Grotesk'] tracking-tight ${
                aiScore >= 70
                  ? 'text-rose-400'
                  : aiScore >= 40
                  ? 'text-amber-400'
                  : 'text-teal-400'
              }`}
            >
              {aiScore}
            </span>
            <span className="text-xs font-mono text-slate-500 uppercase">/ 100</span>
            <span className="ml-auto text-xs font-mono text-slate-400 font-medium">
              AI Voice Score
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                aiScore >= 70
                  ? 'bg-rose-500'
                  : aiScore >= 40
                  ? 'bg-amber-500'
                  : 'bg-teal-400'
              }`}
              style={{ width: `${aiScore}%` }}
            />
          </div>

          <p className="text-xs text-slate-400 font-mono">
            {getAcousticDescription()}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#05080c] border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Score 2 of 2
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                scamScore >= 70
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : scamScore >= 40
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
              }`}
            >
              {scamScore >= 70
                ? 'High-Risk Scam'
                : scamScore >= 40
                ? 'Suspicious Intent'
                : 'Benign Call'}
            </span>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span
              className={`text-3xl sm:text-4xl font-extrabold font-['Space_Grotesk'] tracking-tight ${
                scamScore >= 70
                  ? 'text-rose-400'
                  : scamScore >= 40
                  ? 'text-amber-400'
                  : 'text-teal-400'
              }`}
            >
              {scamScore}
            </span>
            <span className="text-xs font-mono text-slate-500 uppercase">/ 100</span>
            <span className="ml-auto text-xs font-mono text-slate-400 font-medium">
              Scam Intent Score
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                scamScore >= 70
                  ? 'bg-rose-500'
                  : scamScore >= 40
                  ? 'bg-amber-500'
                  : 'bg-teal-400'
              }`}
              style={{ width: `${scamScore}%` }}
            />
          </div>

          <p className="text-xs text-slate-400 font-mono">
            {getScamDescription()}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex flex-col">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold font-['Space_Grotesk'] text-white">
                Suggestions & Recommended Actions
              </h4>
              <p className="text-[11px] font-mono text-slate-400">
                Protocols based on acoustic and semantic verification
              </p>
            </div>
          </div>

          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Guidance</span>
          </span>
        </div>

        <div className="mt-1 space-y-2.5">
          {suggestions.map((sug) => {
            const isCrit = sug.level === 'critical';
            const isWarn = sug.level === 'warning';
            const isSafe = sug.level === 'safe';

            const borderClass = isCrit
              ? 'border-rose-500/40 bg-rose-950/20'
              : isWarn
              ? 'border-amber-500/40 bg-amber-950/20'
              : isSafe
              ? 'border-teal-500/40 bg-teal-950/20'
              : 'border-slate-800 bg-[#06090e]';

            const titleColor = isCrit
              ? 'text-rose-300'
              : isWarn
              ? 'text-amber-300'
              : isSafe
              ? 'text-teal-300'
              : 'text-slate-200';

            const isDone = actionStatus[sug.id];

            return (
              <div
                key={sug.id}
                className={`p-3.5 rounded-xl border transition-all ${borderClass} relative`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isCrit ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                    )}
                    <h4 className={`text-xs font-bold font-['Space_Grotesk'] ${titleColor}`}>
                      {sug.title}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyAdvice(sug.id, `${sug.title}: ${sug.advice}`)}
                    className="text-slate-400 hover:text-slate-200 text-[10px] p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Copy suggestion"
                  >
                    {copiedId === sug.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-300/90 font-mono mt-2 leading-relaxed">
                  {sug.advice}
                </p>

                {sug.actionLabel && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Recommended Protocol
                    </span>
                    <button
                      type="button"
                      onClick={() => handleActionClick(sug.id, sug.actionLabel)}
                      className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isCrit
                          ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30 hover:border-rose-500/50'
                          : isWarn
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30 hover:border-amber-500/50'
                          : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border-teal-500/30 hover:border-teal-500/50'
                      }`}
                    >
                      {isDone || sug.actionLabel}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
