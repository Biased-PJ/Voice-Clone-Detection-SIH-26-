import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Search,
  BrainCircuit,
  Radio,
  FileAudio,
  Activity,
  Sliders,
  Sparkles,
  PanelLeftOpen,
  PanelLeftClose,
  LayoutDashboard,
  Clock,
  Phone,
  Waves,
  Lightbulb,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { AppSidebar } from '../common/AppSidebar';
import { SoundWaveBackground } from '../SoundWaveBackground';
import { ForensicsCall, CallSuggestion } from './CallForensicsInspector';

interface CallForensicsTabProps {
  user: UserProfile;
  calls: ForensicsCall[];
  onBackToOverview: () => void;
  onNavigate?: (
    view: 'dashboard' | 'live-analysis' | 'recorded-analysis' | 'call-intelligence' | 'landing',
    tab?: string
  ) => void;
  onInspectCallIntelligence?: (callId: string) => void;
  onViewLanding?: () => void;
  onSignOut?: () => void;
}

export const CallForensicsTab: React.FC<CallForensicsTabProps> = ({
  user,
  calls,
  onBackToOverview,
  onNavigate,
  onInspectCallIntelligence,
  onViewLanding,
  onSignOut,
}) => {
  const [selectedCallId, setSelectedCallId] = useState<string>(calls[0]?.id || 'CALL-2291');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Critical' | 'Suspicious' | 'Safe'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [audioFilterMode, setAudioFilterMode] = useState<'normal' | 'vocoder'>('normal');
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<Record<string, string>>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentOscillatorsRef = useRef<OscillatorNode[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Filter calls list
  const filteredCalls = calls.filter((c) => {
    const matchesFilter = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caller.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.carrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.aiFamily.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selectedCall = calls.find((c) => c.id === selectedCallId) || calls[0] || null;

  const isCritical = selectedCall?.status === 'Critical';
  const isSuspicious = selectedCall?.status === 'Suspicious';
  const isSafe = selectedCall?.status === 'Safe';

  const aiScore = selectedCall?.aiVoiceScore ?? (isCritical ? 98 : isSuspicious ? 72 : 4);
  const scamScore = selectedCall?.scamIntentScore ?? (isCritical ? 96 : isSuspicious ? 68 : 5);

  // Audio synthesis for realistic playback
  const stopAudio = () => {
    currentOscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
      } catch {}
    });
    currentOscillatorsRef.current = [];
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
    }
    setPlayingCallId(null);
  };

  const handleTogglePlayAudio = (callId: string, status: string) => {
    if (playingCallId === callId) {
      stopAudio();
      return;
    }

    stopAudio();
    setPlayingCallId(callId);

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      if (audioFilterMode === 'vocoder') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(3200, ctx.currentTime);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3200, ctx.currentTime);
        filter.Q.setValueAtTime(14, ctx.currentTime);
      } else if (status === 'Critical') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(230, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + 0.6);
        osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 1.6);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, ctx.currentTime);
        filter.Q.setValueAtTime(5, ctx.currentTime);
      } else if (status === 'Suspicious') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(165, ctx.currentTime);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, ctx.currentTime);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(135, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(148, ctx.currentTime + 1.2);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3400, ctx.currentTime);
      }

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 3.5);

      currentOscillatorsRef.current = [osc];

      setTimeout(() => {
        setPlayingCallId(null);
      }, 3500);
    } catch (e) {
      console.warn('Audio playback error:', e);
      setTimeout(() => setPlayingCallId(null), 2000);
    }
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  // Animated spectrum oscilloscope canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const isPlaying = playingCallId !== null;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const gridSpacing = 24;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const centerY = height / 2;
      const numBars = 48;
      const barWidth = (width - (numBars - 1) * 3) / numBars;

      // Draw frequency spectrum bars
      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 3);
        const norm = i / numBars;
        const envelope = Math.sin(norm * Math.PI);

        const speed = isPlaying ? 0.08 : 0.02;
        const wave1 = Math.sin(i * 0.25 + phase);
        const wave2 = Math.cos(i * 0.4 - phase * 0.8);
        const noise = (Math.sin(i * 99 + phase * 2) * 0.5 + 0.5) * (isPlaying ? 0.35 : 0.1);

        let amp = (wave1 * 0.5 + wave2 * 0.5 + noise) * envelope;
        if (amp < 0.05) amp = 0.05;

        const barHeight = amp * (height * 0.75);

        // Color based on threat level
        let fill = 'rgba(45, 212, 191, 0.85)';
        if (isCritical) {
          fill = norm > 0.6 ? 'rgba(244, 63, 94, 0.9)' : 'rgba(251, 146, 60, 0.85)';
        } else if (isSuspicious) {
          fill = 'rgba(251, 191, 36, 0.85)';
        }

        ctx.fillStyle = fill;
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
      }

      // Draw continuous pitch contour line
      ctx.beginPath();
      ctx.strokeStyle = isCritical ? '#fb7185' : isSuspicious ? '#fcd34d' : '#2dd4bf';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = isCritical ? 'rgba(244, 63, 94, 0.6)' : 'rgba(45, 212, 191, 0.6)';

      for (let x = 0; x < width; x += 3) {
        const normX = x / width;
        const pitchWave =
          Math.sin(normX * 8 + phase * 1.5) * (isCritical ? 24 : 12) * Math.sin(normX * Math.PI);
        const y = centerY + pitchWave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      phase += isPlaying ? 0.06 : 0.02;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playingCallId, isCritical, isSuspicious, selectedCallId]);

  const copyCallHash = () => {
    if (!selectedCall) return;
    navigator.clipboard.writeText(
      `TEAM-ROCKET::FORENSICS::${selectedCall.id}::CARRIER-${selectedCall.carrier.replace(/\s+/g, '_')}::AI-${aiScore}::SCAM-${scamScore}`
    );
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyAdvice = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAction = (id: string, label?: string) => {
    if (label?.includes('Copy')) {
      navigator.clipboard.writeText(`TEAM-ROCKET::EVIDENCE::${selectedCall?.id}`);
      setActionDone((prev) => ({ ...prev, [id]: 'Copied ✓' }));
    } else {
      setActionDone((prev) => ({ ...prev, [id]: 'Protocol Logged ✓' }));
    }
    setTimeout(() => {
      setActionDone((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 2200);
  };

  const handleExportForensicDossier = () => {
    if (!selectedCall) return;
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            platform: 'Team Rocket Voice Threat Intelligence',
            tab: 'Call Forensics Deep-Dive Archive',
            callId: selectedCall.id,
            exportedAt: new Date().toISOString(),
            classification: selectedCall.status,
            aiVoiceScore: aiScore,
            scamIntentScore: scamScore,
            detectedAiArchitecture: selectedCall.aiFamily,
            biometrics: {
              jitter: selectedCall.jitter,
              shimmer: selectedCall.shimmer,
              formants: {
                f1: selectedCall.formantF1,
                f2: selectedCall.formantF2,
              },
              vocalTractEstimate: isSafe ? '17.2 cm (Biological Standard)' : 'Discontinuous / Inconsistent',
            },
            carrierTelemetry: {
              caller: selectedCall.caller,
              carrier: selectedCall.carrier,
              timestamp: selectedCall.timestamp,
              duration: selectedCall.duration,
            },
            analystReport: selectedCall.details,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${selectedCall.id}-forensic-dossier.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Get actionable protocol suggestions
  const getSuggestions = (): CallSuggestion[] => {
    if (!selectedCall) return [];
    if (isCritical) {
      return [
        {
          id: `${selectedCall.id}-sug-1`,
          level: 'critical',
          title: 'Reject Financial Transfer & Terminate Call',
          advice: `AI voice clone matched to ${selectedCall.aiFamily} with ${aiScore}% confidence. Immediately withhold wire transfers and access credentials.`,
          actionLabel: 'Reject Request',
        },
        {
          id: `${selectedCall.id}-sug-2`,
          level: 'critical',
          title: 'Demand Verbal Secret Passphrase Challenge',
          advice: 'Execute organizational verbal challenge phrase or sever telephony connection and call back on internal verified extension.',
          actionLabel: 'Prompt Challenge',
        },
        {
          id: `${selectedCall.id}-sug-3`,
          level: 'warning',
          title: 'Quarantine Inbound SIP Gateway',
          advice: `Inbound trunk ${selectedCall.carrier} exhibits synthetic vocoder injection. Report to IT SecOps for immediate IP firewall quarantine.`,
          actionLabel: 'Quarantine Route',
        },
      ];
    }

    if (isSuspicious) {
      return [
        {
          id: `${selectedCall.id}-sug-1`,
          level: 'warning',
          title: 'Verify Identity via Out-of-Band Channel',
          advice: 'Acoustic spectrum shows pitch quantization and vocoder phase smearing. Confirm caller identity through corporate directory.',
          actionLabel: 'Verify Identity',
        },
        {
          id: `${selectedCall.id}-sug-2`,
          level: 'warning',
          title: 'Never Disclose 2FA or Verification Codes',
          advice: 'Unsolicited verification inquiry detected with abnormal PBX routing characteristics. Keep credentials confidential.',
          actionLabel: 'Block Inbound',
        },
      ];
    }

    return [
      {
        id: `${selectedCall.id}-sug-1`,
        level: 'safe',
        title: 'Biometric Human Voice Authenticated',
        advice: `Acoustic room resonance, vocal tract length, and glottal micro-jitter (${selectedCall.jitter}) are fully consistent with biological human vocal cords.`,
      },
      {
        id: `${selectedCall.id}-sug-2`,
        level: 'safe',
        title: 'No Social Engineering Pattern Detected',
        advice: 'Conversational tone and semantic flow exhibit standard, benign conversational patterns with zero fraud escalation triggers.',
      },
      {
        id: `${selectedCall.id}-sug-3`,
        level: 'info',
        title: 'Routine Compliance Archival',
        advice: `Call session ${selectedCall.id} cleared and securely archived under standard operational security records.`,
        actionLabel: 'Copy Call ID',
      },
    ];
  };

  const suggestions = getSuggestions();

  return (
    <div className="min-h-screen bg-[#05080c] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden selection:bg-teal-500/30 selection:text-teal-200">
      <SoundWaveBackground />

      {/* Universal App Sidebar */}
      <AppSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="dashboard"
        activeTab="Call Forensics"
        onNavigate={(view, tab) => {
          setIsSidebarOpen(false);
          if (onNavigate) {
            onNavigate(view, tab);
          } else if (view === 'dashboard' && tab === 'Overview') {
            onBackToOverview();
          } else if (view === 'landing' && onViewLanding) {
            onViewLanding();
          }
        }}
        user={user}
        onSignOut={onSignOut}
        isOverlay={true}
      />

      {/* Background glowing blurs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 left-1/4 w-[700px] h-[700px] rounded-full bg-cyan-500/5 blur-[140px] z-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-[140px] z-0"
      />

      {/* Header Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#060a0e]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            id="forensics-sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              isSidebarOpen
                ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.2)]'
                : 'bg-[#0d161e] hover:bg-[#152330] border-teal-500/40 text-teal-300 hover:text-white shadow-sm'
            }`}
            title={isSidebarOpen ? 'Hide Navigation Sidebar' : 'Open Navigation Sidebar'}
          >
            {isSidebarOpen ? (
              <>
                <PanelLeftClose className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Hide Sidebar</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Sidebar</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
              <FileAudio className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Space_Grotesk'] font-bold text-base tracking-wider text-slate-100">
                  CALL<span className="text-[#2dd4bf]"> FORENSICS</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide bg-teal-500/10 border border-teal-500/25 text-teal-300">
                  <Activity className="w-2.5 h-2.5" />
                  DSP Telemetry
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 hidden sm:block">
                Deepfake Acoustic Spectrum & Glottal Pulse Verification
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 font-mono">
          <button
            type="button"
            onClick={onBackToOverview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Overview Tab</span>
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('live-analysis')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">Live Mode</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="relative z-10 flex-1 max-w-[1680px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Top Summary Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#080d13]/90 border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.3)] backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-xs font-mono">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Archived Intercepts</div>
              <div className="text-lg font-bold text-white font-['Space_Grotesk']">{calls.length} Calls</div>
            </div>
            <div className="h-7 w-px bg-slate-800 hidden sm:block" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Synthesis Rate</div>
              <div className="text-lg font-bold text-rose-400 font-['Space_Grotesk']">
                {Math.round((calls.filter((c) => c.status === 'Critical').length / calls.length) * 100)}% Cloned
              </div>
            </div>
            <div className="h-7 w-px bg-slate-800 hidden sm:block" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Acoustic Ingest</div>
              <div className="text-lg font-bold text-teal-300 font-['Space_Grotesk']">96 kHz Lossless</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportForensicDossier}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
              title="Download structured forensic evidence JSON"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Export Forensic Dossier</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split Master/Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Call Ingest Directory (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-[#080d13] border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                  <FileAudio className="w-3.5 h-3.5 text-teal-400" />
                  Forensic Ingest Directory
                </span>
                <span className="text-[11px] font-mono text-slate-500">{filteredCalls.length} records</span>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by Call ID, number, carrier, AI family..."
                  className="w-full bg-[#05080c] border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {(['ALL', 'Critical', 'Suspicious', 'Safe'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono transition-all cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* List of Calls */}
              <div className="space-y-2.5 mt-1 max-h-[620px] overflow-y-auto pr-1">
                {filteredCalls.map((call) => {
                  const isSelected = selectedCall?.id === call.id;
                  const isPlaying = playingCallId === call.id;

                  const callAi = call.aiVoiceScore ?? (call.status === 'Critical' ? 98 : call.status === 'Suspicious' ? 72 : 4);
                  const callScam = call.scamIntentScore ?? (call.status === 'Critical' ? 96 : call.status === 'Suspicious' ? 68 : 5);

                  return (
                    <div
                      key={call.id}
                      onClick={() => setSelectedCallId(call.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'bg-[#0f1f2a] border-teal-500/60 shadow-[0_0_20px_rgba(45,212,191,0.18)]'
                          : 'bg-[#05080c] hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePlayAudio(call.id, call.status);
                            }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isPlaying
                                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                                : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                            }`}
                            title="Play simulated acoustic forensics sample"
                          >
                            {isPlaying ? (
                              <Pause className="w-3 h-3 fill-current" />
                            ) : (
                              <Play className="w-3 h-3 fill-current" />
                            )}
                          </button>

                          <div>
                            <span className="text-sm font-bold text-white font-mono tracking-wide">
                              {call.id}
                            </span>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {call.caller}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase border ${
                            call.status === 'Safe'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                              : call.status === 'Suspicious'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                              : 'bg-rose-950/80 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {call.status}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="truncate max-w-[160px] text-slate-400">{call.carrier}</span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-cyan-400 font-semibold">AI: {callAi}%</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-rose-400 font-semibold">Scam: {callScam}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Deep Forensic Workspace (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {selectedCall && (
              <div className="p-5 sm:p-6 rounded-2xl bg-[#080d13] border border-slate-800/90 shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col gap-5">
                {/* 1. Header with Call Meta & Fast Actions */}
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
                        <h3 className="text-lg font-bold text-white font-mono tracking-tight">
                          {selectedCall.id}
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
                          {selectedCall.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Caller: <strong className="text-slate-200">{selectedCall.caller}</strong> • {selectedCall.carrier} • {selectedCall.timestamp} ({selectedCall.duration})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onInspectCallIntelligence && (
                      <button
                        type="button"
                        onClick={() => onInspectCallIntelligence(selectedCall.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm"
                        title="View conversation transcript and NLP threat flags"
                      >
                        <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                        <span>Transcript & NLP</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={copyCallHash}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                      title="Copy Cryptographic Evidence Hash"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copiedHash ? 'Copied' : 'Hash'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. The Two Core Scores in 2 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* SCORE 1: AI VOICE SCORE */}
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
                      {isCritical
                        ? `${selectedCall.aiFamily} • Neural vocoder phase anomalies & missing glottal pulses`
                        : isSuspicious
                        ? `${selectedCall.aiFamily} • Micro-pitch quantization & formant smearing detected`
                        : 'Organic vocal tract resonance verified (15-18cm) • Zero synthetic phase anomalies'}
                    </p>
                  </div>

                  {/* SCORE 2: SCAM INTENT SCORE */}
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
                      {isCritical
                        ? 'High-urgency financial diversion script • Coercive social engineering pattern'
                        : isSuspicious
                        ? 'Suspicious identity credential request • Inconsistent carrier gateway'
                        : 'Natural glottal pulse timing with standard biological breathing pauses & benign intent'}
                    </p>
                  </div>
                </div>

                {/* 3. Acoustic Waveform & Spectral Oscilloscope */}
                <div className="p-4 rounded-xl bg-[#05080c] border border-slate-800/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePlayAudio(selectedCall.id, selectedCall.status)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          playingCallId === selectedCall.id
                            ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
                            : 'bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 shadow-[0_0_15px_rgba(45,212,191,0.25)]'
                        }`}
                      >
                        {playingCallId === selectedCall.id ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>{playingCallId === selectedCall.id ? 'Halt Audio' : 'Play Acoustic Sample'}</span>
                      </button>

                      <span className="text-[11px] font-mono text-slate-400">
                        Duration: <strong className="text-slate-200">{selectedCall.duration}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-[10.5px] font-mono">
                      <button
                        type="button"
                        onClick={() => setAudioFilterMode('normal')}
                        className={`px-2 py-1 rounded transition-all cursor-pointer ${
                          audioFilterMode === 'normal'
                            ? 'bg-slate-800 text-teal-300 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Raw Signal
                      </button>
                      <button
                        type="button"
                        onClick={() => setAudioFilterMode('vocoder')}
                        className={`px-2 py-1 rounded transition-all cursor-pointer ${
                          audioFilterMode === 'vocoder'
                            ? 'bg-rose-950 text-rose-300 font-bold border border-rose-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Isolate 3.2kHz vocoder artifact frequencies"
                      >
                        3.2kHz Vocoder
                      </button>
                    </div>
                  </div>

                  {/* Oscilloscope Canvas */}
                  <div className="w-full h-24 rounded-lg bg-[#040609] border border-slate-800/80 overflow-hidden relative">
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={96}
                      className="w-full h-full block"
                    />
                    <div className="absolute top-1.5 left-2.5 text-[9.5px] font-mono text-slate-500 flex items-center gap-2">
                      <span>FORMANT SWEEP: F1 {selectedCall.formantF1} / F2 {selectedCall.formantF2}</span>
                      <span className="text-slate-600">•</span>
                      <span className={isCritical ? 'text-rose-400' : 'text-teal-400'}>
                        {audioFilterMode === 'vocoder' ? 'VOCODER ISOLATION ACTIVE' : 'BROADBAND DSP'}
                      </span>
                    </div>
                  </div>

                  {/* 4 Biometric Telemetry Stat Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                    <div className="p-2 rounded-lg bg-[#091219] border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase">Glottal Jitter</div>
                      <div className={`font-bold mt-0.5 ${isCritical ? 'text-rose-400' : 'text-teal-300'}`}>
                        {selectedCall.jitter}
                      </div>
                      <div className="text-[9px] text-slate-500">Ref: &lt; 1.5ms</div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#091219] border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase">Shimmer Perturbation</div>
                      <div className={`font-bold mt-0.5 ${isCritical ? 'text-rose-400' : 'text-teal-300'}`}>
                        {selectedCall.shimmer}
                      </div>
                      <div className="text-[9px] text-slate-500">Ref: &lt; 3.0%</div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#091219] border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase">Formant F1 / F2</div>
                      <div className="font-bold text-slate-200 mt-0.5 truncate">
                        {selectedCall.formantF1} / {selectedCall.formantF2}
                      </div>
                      <div className="text-[9px] text-slate-500">Acoustic resonance</div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#091219] border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase">Vocal Tract Length</div>
                      <div className={`font-bold mt-0.5 truncate ${isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isSafe ? '17.2cm (Bio)' : 'Synthetic Discont.'}
                      </div>
                      <div className="text-[9px] text-slate-500">Biological tract</div>
                    </div>
                  </div>
                </div>

                {/* 4. Forensic Telemetry Assessment & 5-Checkpoint Verification */}
                <div className="p-4 rounded-xl bg-[#05080c] border border-slate-800/80 flex flex-col gap-3 font-mono">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>5-Point Acoustic Biometrics Matrix</span>
                    <span className="text-[10px] text-teal-400 font-normal">DSP Verification Suite</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#080d13] border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">1. Formant Dispersion</span>
                      <span className={isCritical ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {isCritical ? 'Phase Glitch (FAIL)' : 'Normal (PASS)'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#080d13] border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">2. Vocal Tract Length (15-18cm)</span>
                      <span className={isSafe ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {isSafe ? '17.2cm Biological (PASS)' : 'Inconsistent (FAIL)'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#080d13] border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">3. Glottal Micro-Jitter</span>
                      <span className={isCritical ? 'text-rose-400 font-bold' : 'text-cyan-300 font-bold'}>
                        {selectedCall.jitter} {isCritical ? '(ARTIFICIAL)' : '(BIOLOGICAL)'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#080d13] border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">4. Vocoder Phase Continuity</span>
                      <span className={isSafe ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                        {selectedCall.shimmer} {isSafe ? '(SEAMLESS)' : '(ARTIFACTS)'}
                      </span>
                    </div>

                    <div className="col-span-1 sm:col-span-2 p-2.5 rounded-lg bg-[#080d13] border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">5. Social Engineering Threat Scripting</span>
                      <span className={isCritical ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {isCritical ? 'Urgent Wire Transfer Pattern (FAIL)' : 'Standard Benign Call (PASS)'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#091219] border border-slate-800/90 text-xs text-slate-300 leading-relaxed mt-1">
                    <span className="text-teal-400 font-bold uppercase tracking-wider block mb-0.5">
                      Analyst Telemetry Assessment:
                    </span>
                    {selectedCall.details}
                  </div>
                </div>

                {/* 5. Suggestions & Recommended Protocol Section */}
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

                      const isDone = actionDone[sug.id];

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
                                onClick={() => handleAction(sug.id, sug.actionLabel)}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
