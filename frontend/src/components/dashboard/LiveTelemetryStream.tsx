import React, { useState, useEffect } from 'react';
import { Terminal, ShieldAlert, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';

export interface TelemetryLogEvent {
  id: string;
  time: string;
  type: 'intercept' | 'quarantine' | 'verified' | 'vocoder-flag';
  level: 'info' | 'warning' | 'critical';
  message: string;
  carrier: string;
}

interface LiveTelemetryStreamProps {
  onSimulateEvent?: () => void;
}

export const LiveTelemetryStream: React.FC<LiveTelemetryStreamProps> = ({
  onSimulateEvent,
}) => {
  const [logs, setLogs] = useState<TelemetryLogEvent[]>([
    {
      id: 'LOG-8812',
      time: '16:51:02',
      type: 'vocoder-flag',
      level: 'critical',
      message: 'Zero-shot voice clone match (97.4%) on Trunk #04. Target: C-Suite Executive Profile.',
      carrier: 'International SIP Proxy',
    },
    {
      id: 'LOG-8811',
      time: '16:48:40',
      type: 'quarantine',
      level: 'warning',
      message: 'Twilio VoIP Gateway rate-limited: high burst of synthetic formant phase jitter.',
      carrier: 'Twilio Gateway 02',
    },
    {
      id: 'LOG-8810',
      time: '16:44:12',
      type: 'verified',
      level: 'info',
      message: 'Inbound call +1 (415) 890-2104 passed 5-checkpoint acoustic biometric verification.',
      carrier: 'AT&T Direct SIP',
    },
    {
      id: 'LOG-8809',
      time: '16:39:15',
      type: 'intercept',
      level: 'warning',
      message: 'Pitch contour micro-quantization detected (XTTS v2 inference signature).',
      carrier: 'Bandwidth SIP Proxy',
    },
    {
      id: 'LOG-8808',
      time: '16:32:01',
      type: 'verified',
      level: 'info',
      message: 'Vocal tract physical resonance matched 17.2cm human benchmark.',
      carrier: 'Verizon Wireless',
    },
  ]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning'>('all');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const randomSeed = Math.random();

      let newLog: TelemetryLogEvent;
      if (randomSeed > 0.7) {
        newLog = {
          id: `LOG-${Math.floor(8813 + Math.random() * 500)}`,
          time: timeStr,
          type: 'vocoder-flag',
          level: 'critical',
          message: `Deepfake anomaly intercepted on SIP Trunk #${Math.floor(1 + Math.random() * 8)}: glottal pulse mismatch.`,
          carrier: 'Cloud PBX Ingress',
        };
      } else if (randomSeed > 0.4) {
        newLog = {
          id: `LOG-${Math.floor(8813 + Math.random() * 500)}`,
          time: timeStr,
          type: 'intercept',
          level: 'warning',
          message: `Inbound caller ANI spoof check: carrier routing latency discrepancy (${Math.floor(180 + Math.random() * 90)}ms).`,
          carrier: 'VoIP Exchange London',
        };
      } else {
        newLog = {
          id: `LOG-${Math.floor(8813 + Math.random() * 500)}`,
          time: timeStr,
          type: 'verified',
          level: 'info',
          message: `Call biometric signature verified: natural room reverberation & laryngeal friction present.`,
          carrier: 'T-Mobile US Direct',
        };
      }

      setLogs((prev) => [newLog, ...prev.slice(0, 14)]);
    }, 6500);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (activeFilter === 'all') return true;
    return l.level === activeFilter;
  });

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#091219] border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
            Live Telephony Incident Log
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                activeFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('critical')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                activeFilter === 'critical' ? 'bg-rose-950 text-rose-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Critical
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('warning')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                activeFilter === 'warning' ? 'bg-amber-950 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Warn
            </button>
          </div>

          {onSimulateEvent && (
            <button
              type="button"
              onClick={onSimulateEvent}
              className="px-2 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Simulate a real-time deepfake call intercept"
            >
              <Sparkles className="w-3 h-3" />
              <span>+ Intercept</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 select-none font-mono text-xs">
        {filteredLogs.map((log) => {
          const isCrit = log.level === 'critical';
          const isWarn = log.level === 'warning';

          return (
            <div
              key={log.id}
              className={`p-2.5 rounded-xl border transition-all ${
                isCrit
                  ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                  : isWarn
                  ? 'bg-amber-950/20 border-amber-500/25 text-amber-200'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-bold">
                  {isCrit ? (
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                  ) : isWarn ? (
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  ) : (
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  )}
                  <span className={isCrit ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'}>
                    [{log.time}] {log.id}
                  </span>
                </span>
                <span className="text-slate-500">{log.carrier}</span>
              </div>
              <p className="text-[11px] leading-relaxed pl-4">{log.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
