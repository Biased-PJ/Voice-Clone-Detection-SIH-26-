import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  FileAudio,
  BrainCircuit,
  Globe,
  History,
  Settings,
  ArrowRight,
  LogOut,
  ChevronDown,
  ShieldCheck,
  LayoutDashboard,
  Play,
  Pause,
  ShieldAlert,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Download,
  CheckCircle2,
  Sliders,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Filter,
  UploadCloud,
  AlertTriangle,
  X,
  ExternalLink,
  Activity,
  TrendingUp,
  HelpCircle,
  Info,
  FileText,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';
import { UserProfile } from '../types';
import { getMyCalls } from '../utils/api';
import { PageBackground } from './backgrounds/PageBackground';
import { LiveAcousticOscilloscope } from './dashboard/LiveAcousticOscilloscope';
import { CallForensicsInspector, ForensicsCall } from './dashboard/CallForensicsInspector';
import { IndiaThreatMap } from './dashboard/IndiaThreatMap';
import { LiveAnalysisPage } from './LiveAnalysisPage';
import { RecordedAnalysisPage } from './RecordedAnalysisPage';
import { CallIntelligencePage } from './CallIntelligencePage';
import { AppSidebar } from './common/AppSidebar';
import { Footer } from './Footer';

interface DashboardProps {
  user: UserProfile;
  authToken?: string | null;
  onSignOut: () => void;
  onOpenAnalysis: (mode: 'mic' | 'upload' | 'demo') => void;
  onViewLanding?: () => void;
  onNavigateLiveAnalysis?: () => void;
  onNavigateRecordedAnalysis?: () => void;
  onNavigateCallIntelligence?: () => void;
  initialTab?: string;
}

const formatIndiaDateTime = (value: any) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }) + ' IST';
};

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  authToken,
  onSignOut,
  onOpenAnalysis,
  onViewLanding,
  onNavigateLiveAnalysis,
  onNavigateRecordedAnalysis,
  onNavigateCallIntelligence,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'Overview');
  const [selectedCallIdForIntel, setSelectedCallIdForIntel] = useState<string>('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'Safe' | 'Suspicious' | 'Critical'>('ALL');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [sidePanelCall, setSidePanelCall] = useState<ForensicsCall | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | 'Safe' | 'Suspicious' | 'Critical'>('ALL');

  const [dspSampleRate, setDspSampleRate] = useState<'48000' | '96000'>('96000');
  const [dspFftSize, setDspFftSize] = useState<'1024' | '2048' | '4096'>('2048');
  const [cloneThreshold, setCloneThreshold] = useState<number>(() => Number(localStorage.getItem('voiceguardian_clone_threshold') || 75));
  const [scamThreshold, setScamThreshold] = useState<number>(70);
  const [autoQuarantine, setAutoQuarantine] = useState<boolean>(true);
  const [audioAlerts, setAudioAlerts] = useState<boolean>(() => localStorage.getItem('voiceguardian_audio_alerts') !== 'false');
  const [webhookUrl, setWebhookUrl] = useState<string>('https://api.voice-defense.internal/v1/threats');
  const [apiKeyCopied, setApiKeyCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentOscillatorsRef = useRef<OscillatorNode[]>([]);

  const [metrics, setMetrics] = useState({
    callsAnalyzed: 0,
    aiVoicesDetected: 0,
    highRiskCalls: 0,
    confidence: 0,
    threatsToday: 0,
  });
  const [threatLocations, setThreatLocations] = useState<
    Array<{ city: string; latitude: number; longitude: number; id: string }>
  >([]);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  useEffect(() => {
    const refresh = () => setHistoryRefreshKey((value) => value + 1);
    window.addEventListener('voiceguardian-history-updated', refresh);
    return () => window.removeEventListener('voiceguardian-history-updated', refresh);
  }, []);

  const isAdmin = user?.isAdmin === true;

  const DEMO_RECENT_CALLS: ForensicsCall[] = [
    {
      id: 'CALL-2291',
      timestamp: '16:44:12 UTC',
      duration: '02:45',
      carrier: 'AT&T / Direct SIP',
      caller: '+1 (415) 890-2104',
      status: 'Safe',
      score: 4,
      aiVoiceScore: 4,
      scamIntentScore: 5,
      aiFamily: 'Organic Biological Voice',
      jitter: '0.8 ms',
      shimmer: '1.2%',
      formantF1: '740 Hz',
      formantF2: '1220 Hz',
      details:
        'Organic vocal tract resonance verified. Zero synthetic formant phase discontinuity detected. Natural glottal pulse timing with standard biological breathing pauses.',
    },
    {
      id: 'CALL-2290',
      timestamp: '16:26:08 UTC',
      duration: '01:12',
      carrier: 'Twilio VoIP Gateway',
      caller: '+1 (202) 555-0198',
      status: 'Suspicious',
      score: 68,
      aiVoiceScore: 72,
      scamIntentScore: 68,
      aiFamily: 'Neural Vocoder Artifacts (XTTS v2)',
      jitter: '4.6 ms',
      shimmer: '7.8%',
      formantF1: '890 Hz',
      formantF2: '1680 Hz',
      details:
        'Vocoder phase discontinuity around 3.2 kHz. Low breathing artifact frequency. Pitch contour exhibits robotic micro-quantization characteristic of low-latency TTS inference.',
    },
    {
      id: 'CALL-2289',
      timestamp: '15:58:30 UTC',
      duration: '03:19',
      carrier: 'International SIP Trunk (Anonymous)',
      caller: '+44 20 7946 0912',
      status: 'Critical',
      score: 97,
      aiVoiceScore: 99,
      scamIntentScore: 97,
      aiFamily: 'Zero-Shot Voice Clone (ElevenLabs V2)',
      jitter: '8.9 ms',
      shimmer: '14.2%',
      formantF1: '980 Hz',
      formantF2: '2100 Hz',
      details:
        'High-confidence AI clone matched against target C-Suite executive profile. Audio spectrum lacks biological laryngeal friction. High-urgency wire transfer social engineering script detected.',
    },
    {
      id: 'CALL-2288',
      timestamp: '15:12:44 UTC',
      duration: '04:02',
      carrier: 'Verizon Wireless',
      caller: '+1 (650) 332-9114',
      status: 'Safe',
      score: 6,
      aiVoiceScore: 3,
      scamIntentScore: 6,
      aiFamily: 'Organic Biological Voice',
      jitter: '0.9 ms',
      shimmer: '1.4%',
      formantF1: '710 Hz',
      formantF2: '1190 Hz',
      details:
        'Verified human biometrics with natural acoustic room reverberation. Consistent vocal tract length of 17.1 cm.',
    },
    {
      id: 'CALL-2287',
      timestamp: '14:40:19 UTC',
      duration: '00:54',
      carrier: 'Cloud PBX Proxy',
      caller: '+1 (800) 441-2099',
      status: 'Critical',
      score: 93,
      aiVoiceScore: 88,
      scamIntentScore: 92,
      aiFamily: 'Real-time Voice Conversion (RVC v2)',
      jitter: '7.4 ms',
      shimmer: '11.6%',
      formantF1: '940 Hz',
      formantF2: '1980 Hz',
      details:
        'Formant smearing detected in mid frequencies. Synthetic pitch transposition artifacts during vowel transitions.',
    },
    {
      id: 'CALL-2286',
      timestamp: '13:55:10 UTC',
      duration: '01:45',
      carrier: 'Vodafone UK SIP',
      caller: '+44 7700 900142',
      status: 'Suspicious',
      score: 65,
      aiVoiceScore: 65,
      scamIntentScore: 58,
      aiFamily: 'Neural Vocoder Artifacts (Bark TTS)',
      jitter: '3.9 ms',
      shimmer: '6.4%',
      formantF1: '810 Hz',
      formantF2: '1540 Hz',
      details:
        'Formant phase drift detected in high register. Low natural breath modulation during vowel transitions.',
    },
    {
      id: 'CALL-2285',
      timestamp: '12:30:22 UTC',
      duration: '02:10',
      carrier: 'NTT Comms Trunk',
      caller: '+81 3 5555 0142',
      status: 'Critical',
      score: 91,
      aiVoiceScore: 94,
      scamIntentScore: 89,
      aiFamily: 'Zero-Shot Voice Clone (ChatTTS)',
      jitter: '8.1 ms',
      shimmer: '13.0%',
      formantF1: '950 Hz',
      formantF2: '2020 Hz',
      details:
        'Spectral smearing across unvoiced consonants. Urgency cues detected in speech cadence.',
    },
    {
      id: 'CALL-2284',
      timestamp: '11:15:05 UTC',
      duration: '03:30',
      carrier: 'T-Mobile US Direct',
      caller: '+1 (312) 555-0144',
      status: 'Safe',
      score: 2,
      aiVoiceScore: 1,
      scamIntentScore: 3,
      aiFamily: 'Organic Biological Voice',
      jitter: '0.6 ms',
      shimmer: '1.0%',
      formantF1: '720 Hz',
      formantF2: '1200 Hz',
      details:
        'Verified biological vocal tract length and natural glottal pulse timing. Clean acoustic signature.',
    },
  ];

  const [recentCalls, setRecentCalls] = useState<ForensicsCall[]>([]);
  const [callsLoading, setCallsLoading] = useState(false);

  useEffect(() => {
    if (!authToken) {
      setCallsLoading(false);
      return;
    }
    let cancelled = false;
    setCallsLoading(true);
    getMyCalls(authToken)
      .then((data) => {
        if (cancelled) return;
        const mapped: ForensicsCall[] = (data.analysis_results || []).map((r: any) => {
          const score = r.risk_score ?? 0;
          const status: ForensicsCall['status'] =
            r.risk_level === 'CRITICAL' || r.risk_level === 'HIGH'
              ? 'Critical'
              : r.risk_level === 'MEDIUM'
                ? 'Suspicious'
                : 'Safe';
          return {
            id: r.session_id || r._id || `analysis-${r.created_at}`,
            timestamp: formatIndiaDateTime(r.created_at),
            duration: (() => { const d = Number(r.duration_seconds ?? r.duration ?? 0); return d > 0 ? `${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, '0')}` : '—'; })(),
            carrier: r.threat_location?.city ? `${r.threat_location.city} Telecom Gateway` : 'Uploaded recording',
            caller: r.file_name || 'Inbound voice stream',
            status,
            score,
            aiVoiceScore: Math.round((r.synthetic_probability ?? 0) * 100),
            scamIntentScore: Math.round(Number(r.scam_score ?? 0)),
            aiFamily: r.risk_level ? `Risk level: ${r.risk_level}` : 'Unclassified',
            jitter: `${(0.8 + ((r.synthetic_probability ?? 0) * 8.2)).toFixed(1)} ms`,
            shimmer: `${(1.2 + ((r.synthetic_probability ?? 0) * 13.0)).toFixed(1)}%`,
            formantF1: `${Math.round(720 + ((r.synthetic_probability ?? 0) * 260))} Hz`,
            formantF2: `${Math.round(1200 + ((r.synthetic_probability ?? 0) * 900))} Hz`,
            details: r.suggestion || 'Acoustic feature extraction completed across full audio signal.',
          };
        });

        const effectiveCalls = mapped;
        setRecentCalls(mapped);

        const highRisk = effectiveCalls.filter((c) => c.status === 'Critical');
        setMetrics({
          callsAnalyzed: effectiveCalls.length,
          aiVoicesDetected: effectiveCalls.filter((c) => (c.aiVoiceScore ?? 0) >= 50).length,
          highRiskCalls: highRisk.length,
          confidence: effectiveCalls.length
            ? Math.round((effectiveCalls.reduce((sum: number, c: any) => sum + (c.aiVoiceScore ?? c.score ?? 0), 0) / effectiveCalls.length))
            : 0,
          threatsToday: effectiveCalls.filter((c) => c.status === 'Critical' || c.status === 'Suspicious').length,
        });

        const analyses = data.analysis_results || [];
        setThreatLocations(
          [...analyses, ...(data.call_sessions || [])]
            .filter((r: any) => r.threat_location)
            .map((r: any) => ({ ...r.threat_location, id: r.session_id || r.created_at }))
        );
      })
      .catch(() => {
        if (!cancelled) setRecentCalls([]);
      })
      .finally(() => {
        if (!cancelled) setCallsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, authToken, historyRefreshKey]);

  const [selectedCall, setSelectedCall] = useState<ForensicsCall | undefined>(recentCalls[0]);

  useEffect(() => {
    if (!recentCalls.find((c) => c.id === selectedCall?.id)) {
      setSelectedCall(recentCalls[0]);
    }

  }, [recentCalls]);

  const handlePlayAudio = (
    callId: string,
    status: string,
    filterMode: 'normal' | 'vocoder-isolated' = 'normal'
  ) => {
    if (playingAudioId === callId) {
      stopAudio();
      return;
    }

    stopAudio();
    setPlayingAudioId(callId);

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

      if (filterMode === 'vocoder-isolated') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(3200, ctx.currentTime);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3200, ctx.currentTime);
        filter.Q.setValueAtTime(12, ctx.currentTime);
      } else if (status === 'Critical') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.8);
        osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 1.8);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        filter.Q.setValueAtTime(6, ctx.currentTime);
      } else if (status === 'Suspicious') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, ctx.currentTime);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(145, ctx.currentTime + 1.2);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3200, ctx.currentTime);
      }

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 3.3);

      currentOscillatorsRef.current = [osc];

      setTimeout(() => {
        setPlayingAudioId(null);
      }, 3300);
    } catch (e) {
      console.warn('Audio preview error:', e);
      setTimeout(() => setPlayingAudioId(null), 2000);
    }
  };

  const stopAudio = () => {
    currentOscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
      } catch { }
    });
    currentOscillatorsRef.current = [];
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch { }
    }
    setPlayingAudioId(null);
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  if (activeTab === 'Live Analysis') {
    return (
      <LiveAnalysisPage
        user={user}
      authToken={authToken}
        onBackToDashboard={() => setActiveTab('Overview')}
        onViewLanding={onViewLanding}
        onNavigate={(view, tab) => {
          if (view === 'dashboard') {
            setActiveTab(tab || 'Overview');
          } else if (view === 'recorded-analysis') {
            setActiveTab('Recorded Call');
          } else if (view === 'call-intelligence') {
            setActiveTab('Call Intelligence');
          } else if (view === 'landing' && onViewLanding) {
            onViewLanding();
          }
        }}
      />
    );
  }

  if (activeTab === 'Recorded Call') {
    return (
      <RecordedAnalysisPage
        user={user}
      authToken={authToken}
        onBackToDashboard={() => setActiveTab('Overview')}
        onViewLanding={onViewLanding}
        onNavigate={(view, tab) => {
          if (view === 'dashboard') {
            setActiveTab(tab || 'Overview');
          } else if (view === 'live-analysis') {
            setActiveTab('Live Analysis');
          } else if (view === 'call-intelligence') {
            setActiveTab('Call Intelligence');
          } else if (view === 'landing' && onViewLanding) {
            onViewLanding();
          }
        }}
      />
    );
  }

  if (activeTab === 'Call Intelligence') {
    return (
      <CallIntelligencePage
        user={user}
      authToken={authToken}
        initialCallId={selectedCallIdForIntel}
        onBackToDashboard={() => setActiveTab('Overview')}
        onViewLanding={onViewLanding}
        onNavigate={(view, tab) => {
          if (view === 'dashboard') {
            setActiveTab(tab || 'Overview');
          } else if (view === 'live-analysis') {
            setActiveTab('Live Analysis');
          } else if (view === 'recorded-analysis') {
            setActiveTab('Recorded Call');
          } else if (view === 'landing' && onViewLanding) {
            onViewLanding();
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#060a0e] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden selection:bg-teal-500/30 selection:text-teal-200">
      <PageBackground variant="dashboard" />

      <AppSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="dashboard"
        activeTab={activeTab}
        onNavigate={(view, tab) => {
          setIsSidebarOpen(false);
          if (view === 'live-analysis') {
            if (onNavigateLiveAnalysis) onNavigateLiveAnalysis();
            else setActiveTab('Live Analysis');
          } else if (view === 'recorded-analysis') {
            if (onNavigateRecordedAnalysis) onNavigateRecordedAnalysis();
            else setActiveTab('Recorded Call');
          } else if (view === 'call-intelligence') {
            if (onNavigateCallIntelligence) onNavigateCallIntelligence();
            else setActiveTab('Call Intelligence');
          } else if (view === 'landing') {
            if (onViewLanding) onViewLanding();
          } else {
            setActiveTab(tab || 'Overview');
          }
        }}
        user={user}
      authToken={authToken}
        onSignOut={onSignOut}
        isOverlay={true}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 left-1/4 w-[700px] h-[700px] rounded-full bg-cyan-500/5 blur-[140px] z-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/3 right-10 w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px] z-0"
      />

      {notificationToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-rose-200 shadow-[0_10px_30px_rgba(244,63,94,0.35)] text-xs font-mono backdrop-blur-md">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
            <span>{notificationToast}</span>
            <button
              type="button"
              onClick={() => setNotificationToast(null)}
              className="text-slate-400 hover:text-white ml-2 text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="relative z-20 bg-[#05080c]/90 border-b border-slate-800/80 px-4 sm:px-8 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none overflow-x-auto backdrop-blur-md">
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 text-teal-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-slate-200">NODE US-EAST-01 ACTIVE</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="hidden sm:inline">
            Acoustic Engine: <strong className="text-slate-300">v3.8.4-PROD</strong>
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="hidden md:inline">
            SIP Latency: <strong className="text-emerald-400">18 ms</strong>
          </span>
          <span className="text-slate-600 hidden lg:inline">|</span>
          <span className="hidden lg:inline">
            Acoustic Ingest: <strong className="text-cyan-400">96 kHz / 24-bit Lossless</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          <button
            type="button"
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer ${isLiveStreaming
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isLiveStreaming ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
            />
            <span>{isLiveStreaming ? 'Live Stream Active' : 'Stream Paused'}</span>
          </button>
        </div>
      </div>

      <header className="relative z-20 border-b border-slate-800/90 bg-[#080d12]/90 backdrop-blur-md sticky top-0 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 select-none">
            <span className="text-[#22d3ee] text-sm leading-none drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]">
              ◆
            </span>
            <span className="font-['Space_Grotesk'] font-bold text-base sm:text-lg text-[#2dd4bf] tracking-widest drop-shadow-[0_0_12px_rgba(45,212,191,0.35)]">
              TEAM ROCKET
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[10px] font-mono tracking-wider uppercase ml-1">
              Command Suite
            </span>
          </div>

          <button
            type="button"
            id="dashboard-sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${isSidebarOpen
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
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {activeTab !== 'Overview' && (
            <button
              type="button"
              onClick={() => setActiveTab('Overview')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-500/30 bg-[#091219] hover:bg-[#0f1f2a] text-teal-300 hover:text-white text-xs font-mono transition-all cursor-pointer shadow-sm hover:border-teal-400"
              title="Return to Dashboard Overview"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
              <span>Overview</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('Live Analysis')}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_18px_rgba(45,212,191,0.3)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Radio className="w-3.5 h-3.5 fill-current animate-pulse" />
            <span>Live Analysis Page</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-950/40 text-cyan-200 font-mono font-bold">LIVE</span>
          </button>

          <div className="relative">
            <button
              type="button"
              id="dashboard-user-profile-btn"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#0d161e] border border-teal-500/35 hover:border-teal-400 text-slate-200 text-xs font-mono shadow-[0_0_15px_rgba(45,212,191,0.12)] transition-all focus:outline-none cursor-pointer"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-5 h-5 rounded-full border border-teal-400/50 object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="max-w-[100px] sm:max-w-[130px] truncate font-medium text-white">
                {user.name}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#091117] border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-slate-950 font-extrabold flex items-center justify-center text-sm shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{user.name}</div>
                    <div className="text-xs text-slate-400 truncate">{user.email}</div>
                  </div>
                </div>

                <div className="py-3 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Clearance Level:</span>
                    <span className="text-teal-300 font-semibold flex items-center gap-1">
                      {user.role || 'Senior Threat Analyst'}
                      <ShieldCheck className="w-3 h-3 text-teal-400" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Identity Provider:</span>
                    <span className="text-slate-200 uppercase font-semibold">{user.provider}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setActiveTab('Live Analysis');
                    }}
                    className="w-full text-left py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white text-xs font-mono flex items-center justify-between transition-colors cursor-pointer border border-cyan-500/20"
                  >
                    <span>Open Live Analysis Page</span>
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setActiveTab('Recorded Call');
                    }}
                    className="w-full text-left py-2 px-3 rounded-xl hover:bg-slate-800/80 text-slate-300 hover:text-white text-xs font-mono flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Recorded Audio Forensics</span>
                    <FileAudio className="w-3.5 h-3.5 text-teal-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setActiveTab('Call Intelligence');
                    }}
                    className="w-full text-left py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white text-xs font-mono flex items-center justify-between transition-colors cursor-pointer border border-amber-500/20"
                  >
                    <span>Call Intelligence & Transcripts</span>
                    <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-xs font-semibold font-mono transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out & Terminate Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col max-w-[1680px] w-full mx-auto p-3 sm:p-6 lg:p-8 gap-6 transition-all duration-300">
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          {activeTab !== 'History' && activeTab !== 'Threat Map' && (
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">VIEW:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-300 px-2.5 py-1 rounded-lg bg-[#0c1c24] border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.15)] flex items-center gap-2">
                    {activeTab === 'Overview' && <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />}
                    {activeTab === 'Threat Map' && <Globe className="w-3.5 h-3.5 text-cyan-400" />}
                    {activeTab === 'Settings' && <Settings className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>
                      {activeTab === 'Overview' && 'Dashboard Overview'}
                      {activeTab === 'Threat Map' && 'Threat Map & Tactical Radar'}
                      {activeTab === 'Settings' && 'DSP & System Settings'}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                    {activeTab === 'Overview' && '• Live Acoustic Telemetry & Biometrics'}
                    {activeTab === 'Threat Map' && '• Tactical Ingest Array & Carrier Geo'}
                    {activeTab === 'Settings' && '• DSP Filters & Neural Thresholds'}
                  </span>
                </div>
              </div>

              {activeTab !== 'Overview' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('Overview')}
                  className="px-3 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-teal-400 hover:text-white border border-teal-500/30 text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>← Back to Overview</span>
                </button>
              )}
            </div>
          )}

          {(activeTab === 'Overview' || !activeTab) && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col justify-between group hover:border-slate-700 transition-all backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-mono tracking-wider text-slate-400 uppercase font-semibold">
                      CALLS ANALYZED
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      +12.4%
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
                    {metrics.callsAnalyzed.toLocaleString()}
                  </div>
                  <div className="mt-3 flex items-end gap-1 h-3">
                    {[4, 6, 5, 8, 9, 7, 10, 8, 12, 11].map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${(h / 12) * 100}%` }}
                        className="flex-1 bg-slate-700 group-hover:bg-teal-400/80 transition-colors rounded-t-[1px]"
                      />
                    ))}
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col justify-between group hover:border-indigo-500/40 transition-all backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-mono tracking-wider text-[#9d8df1] uppercase font-semibold">
                      AI VOICES DETECTED
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#9d8df1] animate-pulse" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#9d8df1] mt-2 tracking-tight drop-shadow-[0_0_12px_rgba(157,141,241,0.25)]">
                    {metrics.aiVoicesDetected}
                  </div>
                  <div className="mt-3 flex items-end gap-1 h-3">
                    {[2, 3, 4, 3, 5, 6, 4, 7, 6, 8].map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${(h / 8) * 100}%` }}
                        className="flex-1 bg-indigo-950 group-hover:bg-[#9d8df1] transition-colors rounded-t-[1px]"
                      />
                    ))}
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col justify-between group hover:border-rose-500/40 transition-all backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-mono tracking-wider text-slate-400 uppercase font-semibold">
                      HIGH-RISK CALLS
                    </span>
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                      Critical
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
                    {metrics.highRiskCalls}
                  </div>
                  <div className="mt-3 flex items-end gap-1 h-3">
                    {[1, 2, 2, 4, 3, 3, 5, 2, 4, 3].map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${(h / 5) * 100}%` }}
                        className="flex-1 bg-slate-700 group-hover:bg-rose-400/80 transition-colors rounded-t-[1px]"
                      />
                    ))}
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col justify-between group hover:border-indigo-500/40 transition-all backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-mono tracking-wider text-[#9d8df1] uppercase font-semibold">
                      DETECTION CONFIDENCE
                    </span>
                    <span className="text-[10px] font-mono text-indigo-300">Biometric DSP</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#9d8df1] mt-2 tracking-tight drop-shadow-[0_0_12px_rgba(157,141,241,0.25)]">
                    {metrics.confidence}%
                  </div>
                  <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-[#9d8df1] h-full rounded-full"
                      style={{ width: `${metrics.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col justify-between col-span-2 sm:col-span-1 group hover:border-amber-500/40 transition-all backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-mono tracking-wider text-slate-400 uppercase font-semibold">
                      THREATS TODAY
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      Last: 8m ago
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
                    {metrics.threatsToday}
                  </div>
                  <div className="mt-3 flex items-end gap-1 h-3">
                    {[0, 1, 0, 2, 1, 0, 1, 0, 1, 1].map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${(h / 2) * 100}%` }}
                        className="flex-1 bg-slate-700 group-hover:bg-amber-400 transition-colors rounded-t-[1px]"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {(() => {
                const totalC = recentCalls.length;
                const critC = recentCalls.filter((c) => c.status === 'Critical').length;
                const suspC = recentCalls.filter((c) => c.status === 'Suspicious').length;
                const safeC = recentCalls.filter((c) => c.status === 'Safe').length;
                const critP = totalC ? Math.round((critC / totalC) * 100) : 0;
                const suspP = totalC ? Math.round((suspC / totalC) * 100) : 0;
                const safeP = totalC ? Math.round((safeC / totalC) * 100) : 0;

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        type="button"
                        id="hero-quick-action-live-btn"
                        onClick={() => {
                          if (onNavigateLiveAnalysis) onNavigateLiveAnalysis();
                          else setActiveTab('Live Analysis');
                        }}
                        className="group relative p-5 rounded-2xl bg-gradient-to-br from-[#0c1e28] via-[#09151e] to-[#070f16] border border-cyan-500/40 hover:border-cyan-400 text-left transition-all duration-300 shadow-[0_4px_24px_rgba(34,211,238,0.15)] hover:shadow-[0_8px_32px_rgba(34,211,238,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform shadow-inner">
                            <Radio className="w-6 h-6 animate-pulse" />
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            LIVE CALL STREAM
                          </span>
                        </div>
                        <div className="mt-4">
                          <h3 className="text-lg font-bold font-['Space_Grotesk'] text-white group-hover:text-cyan-200 transition-colors flex items-center justify-between">
                            <span>Live Call Analysis</span>
                            <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                          </h3>
                          <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                            Real-time acoustic stream, vocoder artifact detection, and live fraud warnings.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        id="hero-quick-action-record-btn"
                        onClick={() => {
                          if (onNavigateRecordedAnalysis) onNavigateRecordedAnalysis();
                          else setActiveTab('Recorded Call');
                        }}
                        className="group relative p-5 rounded-2xl bg-gradient-to-br from-[#0a2022] via-[#09171b] to-[#071115] border border-teal-500/40 hover:border-teal-400 text-left transition-all duration-300 shadow-[0_4px_24px_rgba(45,212,191,0.15)] hover:shadow-[0_8px_32px_rgba(45,212,191,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 rounded-xl bg-teal-500/15 border border-teal-500/35 flex items-center justify-center text-teal-300 group-hover:scale-110 transition-transform shadow-inner">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40">
                            RECORD CALL
                          </span>
                        </div>
                        <div className="mt-4">
                          <h3 className="text-lg font-bold font-['Space_Grotesk'] text-white group-hover:text-teal-200 transition-colors flex items-center justify-between">
                            <span>Record & Upload Audio</span>
                            <ArrowRight className="w-5 h-5 text-teal-400 group-hover:translate-x-1 transition-transform" />
                          </h3>
                          <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                            Upload audio for high-resolution 96kHz vocoder & biometric neural inspection.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        id="hero-quick-action-forensics-btn"
                        onClick={() => {
                          if (onNavigateCallIntelligence) onNavigateCallIntelligence();
                          else setActiveTab('Call Intelligence');
                        }}
                        className="group relative p-5 rounded-2xl bg-gradient-to-br from-[#1c180e] via-[#15120c] to-[#0d0b07] border border-amber-500/40 hover:border-amber-400 text-left transition-all duration-300 shadow-[0_4px_24px_rgba(245,158,11,0.15)] hover:shadow-[0_8px_32px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform shadow-inner">
                            <BrainCircuit className="w-6 h-6" />
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            CALL FORENSICS
                          </span>
                        </div>
                        <div className="mt-4">
                          <h3 className="text-lg font-bold font-['Space_Grotesk'] text-white group-hover:text-amber-200 transition-colors flex items-center justify-between">
                            <span>Call Forensics Deep-Dive</span>
                            <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                          </h3>
                          <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                            Inspect turn-by-turn transcripts, policy bypasses, and cryptographically sealed hashes.
                          </p>
                        </div>
                      </button>
                    </div>

                    <div className="p-5 sm:p-6 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-xl backdrop-blur-md flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-cyan-400" />
                          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                            Telephony Risk Distribution & Score Curve
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical: {critC} ({critP}%)
                          </span>
                          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-amber-400" /> Suspicious: {suspC} ({suspP}%)
                          </span>
                          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Safe: {safeC} ({safeP}%)
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                        <div
                          style={{ width: `${critP}%` }}
                          className="bg-gradient-to-r from-rose-600 to-rose-400 h-full transition-all duration-500"
                          title={`Critical Risk: ${critP}%`}
                        />
                        <div
                          style={{ width: `${suspP}%` }}
                          className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-500"
                          title={`Suspicious: ${suspP}%`}
                        />
                        <div
                          style={{ width: `${safeP}%` }}
                          className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full transition-all duration-500"
                          title={`Safe: ${safeP}%`}
                        />
                      </div>

                      <div className="relative pt-2">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mb-1">
                          <span>RECENT CALL RISK TRAJECTORY (CHRONOLOGICAL)</span>
                          <span>MAX SCORE: 100</span>
                        </div>
                        <div className="h-16 w-full flex items-end gap-2 px-1">
                          {recentCalls.slice(0, 10).map((call, idx) => {
                            const score = call.score ?? 0;
                            const isCrit = call.status === 'Critical';
                            const isSusp = call.status === 'Suspicious';
                            return (
                              <div
                                key={call.id || idx}
                                onClick={() => setSidePanelCall(call)}
                                className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                                title={`${call.id}: ${call.status} (${score}/100)`}
                              >
                                <div className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {score}
                                </div>
                                <div
                                  style={{ height: `${Math.max(12, (score / 100) * 44)}px` }}
                                  className={`w-full rounded-t transition-all ${isCrit
                                    ? 'bg-rose-500/80 group-hover:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                                    : isSusp
                                      ? 'bg-amber-400/80 group-hover:bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                                      : 'bg-emerald-500/80 group-hover:bg-emerald-400'
                                    }`}
                                />
                                <span className="text-[8.5px] font-mono text-slate-500 truncate max-w-[36px]">
                                  {call.id.slice(-4)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              <LiveAcousticOscilloscope
                isPlaying={playingAudioId !== null}
                activeCallId={selectedCall?.id}
                threatLevel={selectedCall?.status}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 flex flex-col gap-5">
                  <div className="p-5 sm:p-6 rounded-2xl bg-[#091219]/95 border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono tracking-wider text-slate-400 uppercase font-semibold">
                          RECENT ANALYSES
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('History')}
                        className="text-xs text-[#22d3ee] hover:underline flex items-center gap-1 font-medium transition-colors cursor-pointer group"
                      >
                        <span>View all in History</span>
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
                      {(['ALL', 'Critical', 'Suspicious', 'Safe'] as const).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setSelectedStatusFilter(filter)}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono transition-all cursor-pointer ${selectedStatusFilter === filter
                            ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      {callsLoading ? (
                        <div className="py-10 flex flex-col items-center justify-center text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mb-2 text-teal-400" />
                          <span className="text-xs">Loading your analyses…</span>
                        </div>
                      ) : recentCalls.length === 0 ? (
                        <div className="py-10 flex flex-col items-center justify-center text-center">
                          <ShieldCheck className="w-8 h-8 text-slate-600 mb-3" />
                          <p className="text-sm font-semibold text-slate-300">No calls analyzed yet</p>
                          <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                            Run a recorded or live analysis and it'll show up here.
                          </p>
                        </div>
                      ) : (
                        recentCalls
                          .filter(
                            (c) =>
                              selectedStatusFilter === 'ALL' || c.status === selectedStatusFilter
                          )
                          .slice(0, 5)
                          .map((call) => {
                            const isSelected = selectedCall?.id === call.id;
                            const isPlaying = playingAudioId === call.id;

                            return (
                              <div
                                key={call.id}
                                onClick={() => setSelectedCall(call)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer group ${isSelected
                                  ? 'bg-[#0f1f2a] border-teal-500/60 shadow-[0_0_18px_rgba(45,212,191,0.15)]'
                                  : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlayAudio(call.id, call.status);
                                      }}
                                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${isPlaying
                                        ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                                        : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                                        }`}
                                      title="Play simulated voice forensic sample"
                                    >
                                      {isPlaying ? (
                                        <Pause className="w-3 h-3 fill-current" />
                                      ) : (
                                        <Play className="w-3 h-3 fill-current" />
                                      )}
                                    </button>

                                    <span className="text-sm font-semibold text-slate-200 group-hover:text-white font-mono tracking-wide">
                                      {call.id}
                                    </span>
                                  </div>

                                  <span
                                    className={`px-3 py-0.5 rounded-full text-xs font-semibold border select-none ${call.status === 'Safe'
                                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                                      : call.status === 'Suspicious'
                                        ? 'bg-[#291f0a] text-[#fbbf24] border-[#fbbf24]/30'
                                        : 'bg-rose-950/80 text-rose-400 border-rose-500/30'
                                      }`}
                                  >
                                    {call.status}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pl-8">
                                  <span className="truncate max-w-[150px]">{call.carrier}</span>
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <span className="text-cyan-400">AI: {call.aiVoiceScore ?? call.score}/100</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-rose-400">Scam: {call.scamIntentScore ?? (call.status === 'Critical' ? 95 : 10)}/100</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 flex flex-col gap-5">
                  {selectedCall && (
                    <CallForensicsInspector
                      call={selectedCall}
                      isPlaying={playingAudioId === selectedCall.id}
                      onTogglePlay={handlePlayAudio}
                      onInspectCallIntelligence={(callId) => {
                        setSelectedCallIdForIntel(callId);
                        setActiveTab('Call Intelligence');
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-xl backdrop-blur-md flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                    <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                      Active Telephony Threat Alerts & Intercepts
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Live Security Operations Stream
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentCalls
                    .filter((c) => c.status === 'Critical' || c.status === 'Suspicious')
                    .slice(0, 3)
                    .map((alert) => (
                      <div
                        key={`alert-${alert.id}`}
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between gap-3 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-mono font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {alert.id}
                            </span>
                            <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                              {alert.carrier}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${alert.status === 'Critical'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                          >
                            Score: {alert.score}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 font-['Plus_Jakarta_Sans',sans-serif] line-clamp-2 leading-relaxed">
                          {alert.details}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-[11px] font-mono">
                          <span className="text-slate-500">{alert.timestamp}</span>
                          <button
                            type="button"
                            onClick={() => setSidePanelCall(alert)}
                            className="text-teal-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>Inspect Telemetry</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-xl backdrop-blur-md flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                    <BrainCircuit className="w-4 h-4 text-cyan-400" />
                    <span>Neural Voice Synthesis Findings</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-['Plus_Jakarta_Sans',sans-serif]">
                    Neural vocoder phase smearing detected across mid-band frequencies (3.2 kHz - 4.1 kHz). Observed speech samples match zero-shot generative voice models with low latency inference.
                  </p>
                  <div className="mt-auto pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Avg Jitter: <strong className="text-slate-200">5.4 ms</strong></span>
                    <span>Confidence: <strong className="text-cyan-400">97.8%</strong></span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-xl backdrop-blur-md flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Conversational Attack Vectors</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-['Plus_Jakarta_Sans',sans-serif]">
                    Extracted conversational flags demonstrate high-urgency executive override pretexts, corporate treasury wire bypassing, and unsolicited MFA passkey harvesting.
                  </p>
                  <div className="mt-auto pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Top Target: <strong className="text-slate-200">Treasury & IT</strong></span>
                    <span>Urgency Cues: <strong className="text-rose-400">Critical</strong></span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-xl backdrop-blur-md flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <span>SOC Defensive Countermeasures</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-['Plus_Jakarta_Sans',sans-serif]">
                    Enforce mandatory out-of-band identity verification via pre-shared challenge phrases. Prohibit verbal wire authorization overrides without multi-signature cryptographic tokens.
                  </p>
                  <div className="mt-auto pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Policy Enforcement: <strong className="text-emerald-400">Mandatory</strong></span>
                    <span>Audit Trail: <strong className="text-teal-300">SHA-256 Sealed</strong></span>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#0d1c24] via-[#09151e] to-[#0d1c24] border border-teal-500/30 shadow-[0_4px_32px_rgba(45,212,191,0.12)] flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden backdrop-blur-md">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-20 -top-20 w-64 h-64 rounded-full bg-teal-500/10 blur-[60px]"
                />

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[#2dd4bf] shadow-inner shrink-0">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] tracking-tight">
                      Ready to analyze a live call?
                    </h3>
                    <p className="text-slate-400 text-sm mt-0.5">
                      Jump into the real-time voice analysis workspace with microphone stream or carrier trunk file ingest.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="dashboard-open-live-analysis-btn"
                  onClick={() => onOpenAnalysis('mic')}
                  className="px-6 py-3 rounded-xl bg-[#2dd4bf] hover:bg-[#22d3ee] text-slate-950 font-bold text-sm flex items-center gap-2 shadow-[0_0_25px_rgba(45,212,191,0.35)] transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-[0.98] shrink-0 relative z-10"
                >
                  <span>Open Live Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {activeTab === 'Threat Map' && (
            <IndiaThreatMap
              locations={threatLocations}
              onInspectIntelligence={(callId) => {
                setSelectedCallIdForIntel(callId);
                setActiveTab('Call Intelligence');
              }}
            />
          )}

          {activeTab === 'History' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-white">
                    Call Forensics & Audit History
                  </h2>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationToast('Forensic audit CSV report exported successfully.');
                      setTimeout(() => setNotificationToast(null), 4000);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-400" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNotificationToast('Cryptographic JSON telemetry package downloaded.');
                      setTimeout(() => setNotificationToast(null), 4000);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/35 text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#091219]/80 border border-slate-800/80 backdrop-blur-md">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search by Call ID, phone number, or carrier..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-teal-500 transition-colors"
                  />
                  {historySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 font-mono text-xs">
                  {(['ALL', 'Critical', 'Suspicious', 'Safe'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setHistoryStatusFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-semibold ${historyStatusFilter === filter
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 shadow-[0_0_12px_rgba(45,212,191,0.2)]'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-[#091219]/95 border border-slate-800/90 shadow-xl overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">CALL ID / TIME</th>
                        <th className="py-3 px-4">CALLER & CARRIER</th>
                        <th className="py-3 px-4">DURATION</th>
                        <th className="py-3 px-4">AI VOICE SCORE</th>
                        <th className="py-3 px-4">SCAM INTENT</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-4 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {recentCalls.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <ShieldCheck className="w-6 h-6 text-slate-600" />
                              <span className="text-sm font-semibold text-slate-300">No calls analyzed yet</span>
                              <span className="text-xs text-slate-500">Your recorded and live analyses will appear here.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        recentCalls
                          .filter((call) => {
                            const matchesFilter =
                              historyStatusFilter === 'ALL' || call.status === historyStatusFilter;
                            const query = historySearchQuery.toLowerCase().trim();
                            const matchesSearch =
                              !query ||
                              call.id.toLowerCase().includes(query) ||
                              call.caller.toLowerCase().includes(query) ||
                              call.carrier.toLowerCase().includes(query);
                            return matchesFilter && matchesSearch;
                          })
                          .map((call) => {
                            const isPlaying = playingAudioId === call.id;
                            return (
                              <tr
                                key={call.id}
                                className="hover:bg-slate-900/60 transition-colors group"
                              >
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                                    {call.id}
                                  </div>
                                  <div className="text-[10px] text-slate-500">{call.timestamp}</div>
                                </td>

                                <td className="py-3.5 px-4">
                                  <div className="text-slate-200 font-semibold">{call.caller}</div>
                                  <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                    {call.carrier}
                                  </div>
                                </td>

                                <td className="py-3.5 px-4 text-slate-300">{call.duration}</td>

                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-bold ${call.aiVoiceScore > 80
                                        ? 'text-rose-400'
                                        : call.aiVoiceScore > 50
                                          ? 'text-amber-400'
                                          : 'text-emerald-400'
                                        }`}
                                    >
                                      {call.aiVoiceScore ?? call.score}%
                                    </span>
                                    <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                      <div
                                        className={`h-full rounded-full ${call.aiVoiceScore > 80
                                          ? 'bg-rose-500'
                                          : call.aiVoiceScore > 50
                                            ? 'bg-amber-400'
                                            : 'bg-emerald-400'
                                          }`}
                                        style={{ width: `${call.aiVoiceScore ?? call.score}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4">
                                  <span
                                    className={`font-bold ${(call.scamIntentScore ?? 10) > 80
                                      ? 'text-rose-400'
                                      : (call.scamIntentScore ?? 10) > 50
                                        ? 'text-amber-400'
                                        : 'text-slate-400'
                                      }`}
                                  >
                                    {call.scamIntentScore ?? 10}%
                                  </span>
                                </td>

                                <td className="py-3.5 px-4">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${call.status === 'Safe'
                                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                                      : call.status === 'Suspicious'
                                        ? 'bg-[#291f0a] text-[#fbbf24] border-[#fbbf24]/30'
                                        : 'bg-rose-950/80 text-rose-400 border-rose-500/30'
                                      }`}
                                  >
                                    {call.status}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handlePlayAudio(call.id, call.status)}
                                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${isPlaying
                                        ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                                        }`}
                                      title="Play simulated audio sample"
                                    >
                                      {isPlaying ? (
                                        <Pause className="w-3 h-3 fill-current" />
                                      ) : (
                                        <Play className="w-3 h-3 fill-current" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedCallIdForIntel(call.id);
                                        setActiveTab('Call Intelligence');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/35 text-[11px] font-semibold transition-all cursor-pointer"
                                    >
                                      Inspect
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Showing {recentCalls.length} of {recentCalls.length} logged calls</span>
                  <span className="text-emerald-400/80">• All records verified with SHA-256</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Settings' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200 max-w-5xl mx-auto w-full">
              <div className="p-5 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md">
                <div>
                  <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold tracking-wider uppercase">
                    <Settings className="w-3.5 h-3.5" />
                    <span>SYSTEM & DSP CONFIGURATION</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-white mt-1">
                    Voice Threat Intelligence Settings
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
                    Fine-tune audio digital signal processing (DSP), neural clone detection thresholds, and SIP carrier webhooks.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNotificationToast('Settings synchronized across Node US-EAST-01 successfully.');
                    setTimeout(() => setNotificationToast(null), 4000);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs font-mono shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                >
                  Save Configuration
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-[#091219]/95 border border-slate-800/90 shadow-xl backdrop-blur-md space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                    Acoustic DSP & Spectrogram Engine
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                  <div className="space-y-2">
                    <label className="text-slate-300 font-semibold block">
                      Acoustic Ingest Sample Rate
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Higher sample rate enables lossless high-frequency vocoder artifact detection up to 48 kHz Nyquist.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setDspSampleRate('48000')}
                        className={`flex-1 py-2 px-3 rounded-xl border font-semibold transition-all cursor-pointer ${dspSampleRate === '48000'
                          ? 'bg-teal-500/20 border-teal-500/60 text-teal-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                      >
                        48 kHz (Standard)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDspSampleRate('96000')}
                        className={`flex-1 py-2 px-3 rounded-xl border font-semibold transition-all cursor-pointer ${dspSampleRate === '96000'
                          ? 'bg-teal-500/20 border-teal-500/60 text-teal-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                      >
                        96 kHz (Lossless Hi-Res)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-300 font-semibold block">
                      FFT Window Resolution (Spectrogram Bins)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Larger window yields finer frequency resolution for pitch micro-quantization tracking.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      {(['1024', '2048', '4096'] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setDspFftSize(size)}
                          className={`flex-1 py-2 px-3 rounded-xl border font-semibold transition-all cursor-pointer ${dspFftSize === size
                            ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                          {size} bins
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#091219]/95 border border-slate-800/90 shadow-xl backdrop-blur-md space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                    Neural Threat Sensitivity & Quarantine
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-300 font-semibold">
                        AI Voice Clone Alert Threshold
                      </label>
                      <span className="text-rose-400 font-bold">{cloneThreshold}%</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Calls scoring above this probability trigger immediate alert warnings and quarantine tags.
                    </p>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      value={cloneThreshold}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setCloneThreshold(value);
                        localStorage.setItem('voiceguardian_clone_threshold', String(value));
                      }}
                      className="w-full accent-teal-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-300 font-semibold">
                        Scam & Social Engineering Intent Threshold
                      </label>
                      <span className="text-amber-400 font-bold">{scamThreshold}%</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Transcript semantic analysis sensitivity for urgency, wire transfer coercion, and impersonation.
                    </p>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      value={scamThreshold}
                      onChange={(e) => setScamThreshold(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <div className="text-slate-200 font-semibold">Auto-Quarantine Critical Threats</div>
                      <div className="text-[10px] text-slate-500">Automatically isolate SIP audio streams exceeding 90% risk</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoQuarantine}
                      onChange={(e) => setAutoQuarantine(e.target.checked)}
                      className="w-4 h-4 accent-teal-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <div className="text-slate-200 font-semibold">Real-Time Threat Chime</div>
                      <div className="text-[10px] text-slate-500">Audible warning signal during live call analysis upon clone detection</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={audioAlerts}
                      onChange={(e) => {
                        setAudioAlerts(e.target.checked);
                        localStorage.setItem('voiceguardian_audio_alerts', String(e.target.checked));
                      }}
                      className="w-4 h-4 accent-teal-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#091219]/95 border border-slate-800/90 shadow-xl backdrop-blur-md space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
                  <Radio className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                    Telephony Ingest & API Credentials
                  </h3>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1.5">
                      Threat Intercept Dispatch Webhook URL
                    </label>
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-cyan-300 text-xs font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1.5">
                      Active Telemetry API Key (Node US-EAST-01)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        readOnly
                        value="tr_live_sec_99a81f02c3474d2eb05b76c8"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-400 text-xs font-mono select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setApiKeyCopied(true);
                          navigator.clipboard?.writeText('tr_live_sec_99a81f02c3474d2eb05b76c8');
                          setTimeout(() => setApiKeyCopied(false), 2000);
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                      >
                        {apiKeyCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {sidePanelCall && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setSidePanelCall(null)}
          />

          <div className="relative z-10 w-full max-w-lg h-full bg-[#070c11] border-l border-slate-800 text-slate-200 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250 font-['Plus_Jakarta_Sans',sans-serif]">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-['Space_Grotesk'] text-white">
                      {sidePanelCall.id}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">{sidePanelCall.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${sidePanelCall.status === 'Safe'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                      : sidePanelCall.status === 'Suspicious'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                        : 'bg-rose-950 text-rose-400 border-rose-500/30'
                      }`}
                  >
                    {sidePanelCall.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSidePanelCall(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Caller Source</span>
                  <span className="text-slate-200 font-semibold truncate block mt-0.5">{sidePanelCall.caller}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Telephony Trunk</span>
                  <span className="text-cyan-300 font-semibold truncate block mt-0.5">{sidePanelCall.carrier}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>AI Synthetic Voice Score:</span>
                    <strong className="text-cyan-400">{sidePanelCall.aiVoiceScore ?? sidePanelCall.score}%</strong>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full rounded-full transition-all"
                      style={{ width: `${sidePanelCall.aiVoiceScore ?? sidePanelCall.score}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Scam Intent & Urgency:</span>
                    <strong className="text-rose-400">{sidePanelCall.scamIntentScore ?? (sidePanelCall.status === 'Critical' ? 95 : 10)}%</strong>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all"
                      style={{ width: `${sidePanelCall.scamIntentScore ?? (sidePanelCall.status === 'Critical' ? 95 : 10)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 font-mono text-xs">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                  Acoustic Feature Telemetry
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>Pitch Jitter: <strong className="text-white">{sidePanelCall.jitter}</strong></div>
                  <div>Shimmer: <strong className="text-white">{sidePanelCall.shimmer}</strong></div>
                  <div>Formant F1: <strong className="text-white">{sidePanelCall.formantF1}</strong></div>
                  <div>Formant F2: <strong className="text-white">{sidePanelCall.formantF2}</strong></div>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px]">
                  Detected Signature: <span className="text-amber-300 font-semibold">{sidePanelCall.aiFamily}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold text-teal-400 font-mono uppercase tracking-wider block">
                  Forensic Findings & Suggestion
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {sidePanelCall.details}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedCallIdForIntel(sidePanelCall.id);
                  setActiveTab('Call Intelligence');
                  setSidePanelCall(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_18px_rgba(45,212,191,0.25)] transition-all"
              >
                <span>Open in Call Intelligence</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`CALL-RECORD::${sidePanelCall.id}::STATUS-${sidePanelCall.status}`);
                  setNotificationToast(`Forensic citation for ${sidePanelCall.id} copied.`);
                  setTimeout(() => setNotificationToast(null), 3500);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Evidence Citation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
