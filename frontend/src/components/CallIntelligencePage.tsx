import React, { useState, useEffect, useRef } from 'react';
import {
  BrainCircuit,
  Search,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Phone,
  Radio,
  FileText,
  Copy,
  Check,
  Download,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowRight,
  User,
  Bot,
  PanelLeftOpen,
  PanelLeftClose,
  LayoutDashboard,
  FileAudio,
  Hash,
  Share2,
  HelpCircle,
  Info,
  X,
} from 'lucide-react';
import { UserProfile, CallIntelligenceRecord, CaughtFlag, TranscriptItem } from '../types';
import { getMyCalls, getCall } from '../utils/api';
import { AppSidebar } from './common/AppSidebar';
import { PageBackground } from './backgrounds/PageBackground';
import { Footer } from './Footer';

interface CallIntelligencePageProps {
  user: UserProfile | null;
  authToken?: string | null;
  initialCallId?: string;
  onBackToDashboard?: () => void;
  onViewLanding?: () => void;
  onNavigate?: (view: 'dashboard' | 'live-analysis' | 'recorded-analysis' | 'call-intelligence' | 'landing', tab?: string) => void;
}

const EMPTY_RECORD: CallIntelligenceRecord = {
  callId: '', callerNumber: '', targetNumber: '', carrier: '', duration: '', timestamp: '',
  threatScore: 0, aiVoiceScore: 0, scamIntentScore: 0, classification: 'Safe', summary: '',
  transcripts: [], flags: [],
};

function recordFromBackend(result: Record<string, any>): CallIntelligenceRecord {
  const score = Number(result.risk_score ?? 0);
  const classification: CallIntelligenceRecord['classification'] = result.risk_level === 'CRITICAL' || result.risk_level === 'HIGH'
    ? 'Critical' : result.risk_level === 'MEDIUM' ? 'Suspicious' : 'Safe';
  const transcript = typeof result.transcript === 'string' ? result.transcript.trim() : '';
  const factors = Array.isArray(result.risk_factors) ? result.risk_factors.filter(Boolean) : [];
  const evidence = transcript || factors.join('; ');
  const flags: CaughtFlag[] = factors.map((factor: string, index: number) => ({
    id: `${result.session_id || result._id}-factor-${index}`,
    title: factor,
    category: 'Backend risk factor',
    severity: classification === 'Critical' ? 'critical' : classification === 'Suspicious' ? 'high' : 'info',
    timestamp: '00:00', timeSec: 0, snippet: evidence.slice(0, 280),
    triggerRule: 'BACKEND-RISK-FACTOR',
    explanation: `The backend risk engine reported this factor for session ${result.session_id || 'unknown'}.`,
    recommendedAction: result.suggestion || 'Review the recording and verify the caller independently.',
  }));
  return {
    callId: result.session_id || result._id || '',
    callerNumber: result.file_name || 'Recorded audio',
    targetNumber: 'Authenticated user', carrier: result.threat_location?.city || 'Not provided',
    duration: result.duration ? `${Math.floor(result.duration / 60)}:${String(Math.floor(result.duration % 60)).padStart(2, '0')}` : 'Not provided',
    timestamp: result.created_at || result.started_at || '', threatScore: score,
    aiVoiceScore: Math.round(Number(result.synthetic_probability ?? 0) * 100), scamIntentScore: score,
    classification, verdictType: classification === 'Critical' ? 'Cloned' : classification === 'Safe' ? 'Safe' : 'Suspicious',
    verdictReason: factors.length ? `Classified ${classification.toLowerCase()} because: ${factors.join('; ')}.` : (result.suggestion || 'No risk factors were returned.'),
    primaryEvidence: evidence, aiModelDetected: 'Backend risk engine',
    summary: result.suggestion || 'Backend analysis completed without a summary.', transcripts: transcript ? [{ id: `${result.session_id}-transcript`, speaker: 'Caller', speakerLabel: 'Backend transcript', timestamp: '00:00', timeSec: 0, text: transcript }] : [], flags,
  };
}

export const CallIntelligencePage: React.FC<CallIntelligencePageProps> = ({
  user,
  authToken,
  initialCallId = '',
  onBackToDashboard,
  onViewLanding,
  onNavigate,
}) => {
  // This page's rich transcript/flag/telemetry view only exists for the
  // seeded demo records (is_demo: true in Mongo). Real users' own uploads
  // only produce an AnalyzeResponse (risk score + suggestion), which doesn't
  // have that shape yet — so rather than fake a transcript for them, real
  // (non-admin) users get an honest empty state instead of CALL-2289.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(initialCallId);
  const [currentCallId, setCurrentCallId] = useState(initialCallId);
  const [userAnalyses, setUserAnalyses] = useState<any[]>([]);
  const [record, setRecord] = useState<CallIntelligenceRecord>(EMPTY_RECORD);
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null);
  const [highlightedTurnId, setHighlightedTurnId] = useState<string | null>(null);
  const [flagFilter, setFlagFilter] = useState<'all' | 'critical' | 'high' | 'warning'>('all');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [selectedModalEvidence, setSelectedModalEvidence] = useState<{
    title: string;
    snippet: string;
    rule: string;
    explanation: string;
    action: string;
    severity?: string;
  } | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const flagsScrollRef = useRef<HTMLDivElement>(null);

  // Load real user analyses from backend if logged in
  useEffect(() => {
    if (authToken) {
      getMyCalls(authToken)
        .then((data) => {
          const analyses = data.analysis_results || [];
          setUserAnalyses(analyses);
          setRecord(initialCallId ? recordFromBackend(analyses.find((item) => item.session_id === initialCallId) || EMPTY_RECORD) : EMPTY_RECORD);
        })
        .catch(() => { });
    }
  }, [authToken, initialCallId]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;
    setCurrentCallId(query);
    const localRecord = userAnalyses.find((item) => (item.session_id || item._id) === query);
    if (localRecord) setRecord(recordFromBackend(localRecord));
    if (authToken) getCall(query, authToken).then((detail) => setRecord((current) => ({ ...current, ...recordFromBackend({ ...localRecord, ...detail }) }))).catch(() => { });
    setSelectedFlagId(null);
    setHighlightedTurnId(null);
  };

  const handleSelectPreset = (id: string) => {
    setSearchInput(id);
    setCurrentCallId(id);
    const source = userAnalyses.find((item) => (item.session_id || item._id) === id);
    if (source) setRecord(recordFromBackend(source));
    if (authToken) getCall(id, authToken).then((detail) => setRecord((current) => ({ ...current, ...recordFromBackend({ ...source, ...detail }) }))).catch(() => { });
    setSelectedFlagId(null);
    setHighlightedTurnId(null);
  };

  // Jump from Flag to Transcript turn
  const handleJumpToTranscript = (flag: CaughtFlag) => {
    setSelectedFlagId(flag.id);
    const matchingTurn = record.transcripts.find((t) => t.flagId === flag.id);
    if (matchingTurn) {
      setHighlightedTurnId(matchingTurn.id);
      const element = document.getElementById(`transcript-turn-${matchingTurn.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Jump from Transcript turn to Flag
  const handleJumpToFlag = (flagId: string) => {
    setSelectedFlagId(flagId);
    const element = document.getElementById(`flag-card-${flagId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(`VOICE-GUARDIAN::FORENSIC-HASH::${record.callId}::SCORE-${record.threatScore}`);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyFullTranscript = () => {
    const text = record.transcripts
      .map((t) => `[${t.timestamp}] ${t.speakerLabel}:\n${t.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${record.callId}_intelligence_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredFlags = record.flags.filter((flag) => {
    if (flagFilter === 'all') return true;
    return flag.severity === flagFilter;
  });

  const isCritical = record.classification === 'Critical';
  const isSuspicious = record.classification === 'Suspicious';
  const isSafe = record.classification === 'Safe';



  return (
    <div className="min-h-screen bg-[#060a0e] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden selection:bg-teal-500/30 selection:text-teal-200">
      <PageBackground variant="call-intel" />

      {/* Global Ambient Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 left-1/4 w-[700px] h-[700px] rounded-full bg-cyan-500/5 blur-[140px] z-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-[140px] z-0"
      />

      {/* Global Sidebar */}
      <AppSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="call-intelligence"
        activeTab="Call Intelligence"
        user={user}
        isOverlay={true}
        onNavigate={(view, tab) => {
          setIsSidebarOpen(false);
          if (onNavigate) {
            onNavigate(view as any, tab);
          } else if (view === 'dashboard' && onBackToDashboard) {
            onBackToDashboard();
          } else if (view === 'landing' && onViewLanding) {
            onViewLanding();
          }
        }}
      />

      {/* Header Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#060a0e]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="call-intel-sidebar-toggle-btn"
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

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
              <BrainCircuit className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Space_Grotesk'] font-bold text-base tracking-wider text-slate-100">
                  VOICE<span className="text-teal-400">GUARDIAN</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide bg-teal-500/10 border border-teal-500/25 text-teal-300">
                  CALL INTELLIGENCE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Transcript Decomposition & NLP Flag Extraction
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onNavigate && (
            <>
              <button
                type="button"
                id="call-intel-nav-live-btn"
                onClick={() => onNavigate('live-analysis')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d1c24] hover:bg-[#142935] border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-mono font-medium transition-all cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Live Stream</span>
              </button>

              <button
                type="button"
                id="call-intel-nav-recorded-btn"
                onClick={() => onNavigate('recorded-analysis')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d1c24] hover:bg-[#142935] border border-teal-500/30 text-teal-300 hover:text-white text-xs font-mono font-medium transition-all cursor-pointer"
              >
                <FileAudio className="w-3.5 h-3.5 text-teal-400" />
                <span>Recorded Audio</span>
              </button>
            </>
          )}

          {onBackToDashboard && (
            <button
              type="button"
              id="call-intel-back-dashboard-btn"
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d161e] hover:bg-[#152330] border border-slate-700 hover:border-teal-500/40 text-slate-200 hover:text-white text-xs font-mono font-medium transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-xs font-mono text-teal-300">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-300 font-mono hidden lg:inline truncate max-w-[120px]">
                {user.name}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Container - Breathable, Unclustered Layout */}
      <main className="flex-1 w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 relative z-10">

        {/* TOP SECTION: Call ID Input & Metadata Ribbon */}
        <section
          aria-label="Call ID Search & Telemetry"
          className="w-full bg-[#0a1118]/80 backdrop-blur-md rounded-2xl border border-slate-800/90 p-5 sm:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.35)] transition-all"
        >
          {/* Header & Description */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-teal-400" />
                <h1 className="text-lg sm:text-xl font-bold font-['Space_Grotesk'] text-slate-100 tracking-wide">
                  Call Intelligence Search
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  Active Inspector
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Enter any telephonic Call ID to immediately inspect its complete turn-by-turn conversational transcript alongside all semantic flags, extortion patterns, and policy bypasses caught by the neural engine.
              </p>
            </div>

            {/* Actions for Loaded Call */}
            <div className="flex items-center gap-2 self-start md:self-center">
              <button
                type="button"
                id="copy-call-hash-btn"
                onClick={handleCopyHash}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-mono transition-colors cursor-pointer"
                title="Copy cryptographic forensic call hash"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedHash ? 'Hash Copied' : 'Evidence Hash'}</span>
              </button>

              <button
                type="button"
                id="export-intel-report-btn"
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-mono transition-colors cursor-pointer"
                title="Export complete intelligence report as JSON"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Search Input Box */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-teal-400/80" />
              </div>
              <input
                type="text"
                id="call-id-search-input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter a real session ID from your call history..."
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#060c12] border border-slate-700/90 focus:border-teal-400 text-slate-100 placeholder-slate-500 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              id="fetch-call-intel-btn"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-[#060a0e] font-bold text-sm font-mono tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(45,212,191,0.25)] hover:shadow-[0_0_28px_rgba(45,212,191,0.4)] transition-all cursor-pointer shrink-0"
            >
              <span>Inspect Call</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Real backend analyses */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/60">
            {userAnalyses.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 ml-0 sm:ml-2 pt-2 sm:pt-0 sm:border-l sm:border-slate-800 sm:pl-3 w-full sm:w-auto">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                  <FileAudio className="w-3 h-3 text-cyan-400" /> Your Analyses:
                </span>
                {userAnalyses.slice(0, 4).map((a: any) => {
                  const id = a.session_id || a.id || 'Analysis';
                  const isActive = currentCallId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setSearchInput(id);
                        setCurrentCallId(id);
                        setRecord(recordFromBackend(a));
                        if (authToken) getCall(id, authToken).then((detail) => setRecord((current) => ({ ...current, ...recordFromBackend({ ...a, ...detail }) }))).catch(() => { });
                        setSelectedFlagId(null);
                        setHighlightedTurnId(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${isActive
                          ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-sm font-semibold'
                          : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300'
                        }`}
                      title={`Session: ${id}`}
                    >
                      {a.file_name ? a.file_name.slice(0, 18) : id.slice(0, 12)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Loaded Call Metadata Ribbon */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
            <div className="bg-[#070d13] rounded-xl p-3 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase">Loaded Call ID</span>
              <span className="text-teal-300 font-bold text-sm tracking-wider">{record.callId}</span>
            </div>

            <div className="bg-[#070d13] rounded-xl p-3 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase">Caller Origin</span>
              <span className="text-slate-200 truncate block font-medium" title={record.callerNumber}>
                {record.callerNumber}
              </span>
            </div>

            <div className="bg-[#070d13] rounded-xl p-3 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase">Target Recipient</span>
              <span className="text-slate-200 truncate block font-medium" title={record.targetNumber}>
                {record.targetNumber}
              </span>
            </div>

            <div className="bg-[#070d13] rounded-xl p-3 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase">Duration & Time</span>
              <span className="text-slate-200 truncate block font-medium">
                {record.duration} • {record.timestamp.split(' ')[1] || '15:58 UTC'}
              </span>
            </div>

            <div className="bg-[#070d13] rounded-xl p-3 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase">Threat Severity</span>
              <span
                className={`font-bold inline-flex items-center gap-1 ${isCritical ? 'text-rose-400' : isSuspicious ? 'text-amber-400' : 'text-teal-400'
                  }`}
              >
                {isCritical ? <ShieldAlert className="w-3.5 h-3.5" /> : isSuspicious ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                {record.threatScore}/100 ({record.classification})
              </span>
            </div>

            <div className="bg-[#070d13] rounded-xl p-3 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase">Flags Caught</span>
              <span className="text-amber-300 font-bold text-sm">
                {record.flags.length} Detected
              </span>
            </div>
          </div>

          {/* AI Model Summary Note */}
          {record.summary && (
            <div className="mt-4 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-teal-300 font-mono mr-1.5">
                  [{record.aiModelDetected || 'Acoustic Model'}]
                </span>
                {record.summary}
              </div>
            </div>
          )}
        </section>

        {!record.callId ? (
          <div className="w-full rounded-2xl border border-dashed border-slate-800 bg-[#0a1118]/70 p-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-slate-600" />
            <h2 className="mt-3 text-base font-bold text-slate-300">No call selected</h2>
            <p className="mt-1 text-xs text-slate-500">Real call intelligence, evidence, transcript, and risk factors will appear after a backend analysis exists.</p>
          </div>
        ) : <>
          {/* EVIDENCE & CLASSIFICATION BREAKDOWN CARD */}
          <section
            aria-label="Evidence and Classification Breakdown"
            className="w-full bg-[#0a1118]/90 backdrop-blur-md rounded-2xl border border-slate-800/90 p-5 sm:p-6 shadow-xl flex flex-col gap-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800/80">
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 ${record.verdictType === 'Cloned' || isCritical
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      : record.verdictType === 'Spam'
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                        : record.verdictType === 'Suspicious' || isSuspicious
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>
                    VERDICT:{' '}
                    {record.verdictType?.toUpperCase() || (isCritical ? 'CLONED' : isSafe ? 'SAFE' : 'SUSPICIOUS')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="relative group">
                    AI Voice: <strong className="text-cyan-400">{record.aiVoiceScore}/100</strong>
                  </span>
                  <span>•</span>
                  <span className="relative group">
                    Scam Intent: <strong className="text-rose-400">{record.scamIntentScore}/100</strong>
                  </span>
                  <span>•</span>
                  <span className="text-slate-500">{record.carrier}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedModalEvidence({
                    title: record.flags[0]?.title || `${record.verdictType || record.classification} Forensic Assessment`,
                    snippet: record.primaryEvidence || record.summary,
                    rule: record.flags[0]?.triggerRule || 'AUD-FORENSIC-001',
                    explanation: record.verdictReason || record.summary,
                    action: record.flags[0]?.recommendedAction || 'Execute standard SOC incident handling procedure.',
                    severity: record.classification.toLowerCase(),
                  })
                }
                className="px-3.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer w-fit"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Evidence Deep-Dive Modal</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Why This Call Was Classified */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1.5">
                <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>WHY CLASSIFIED AS {record.verdictType?.toUpperCase() || record.classification.toUpperCase()}</span>
                </div>
                <p className="text-slate-200 leading-relaxed font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-[13px]">
                  {record.verdictReason || record.summary}
                </p>
              </div>

              {/* Actual Evidence from Audio / Transcript */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1.5">
                <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ACTUAL FORENSIC EVIDENCE & VERBATIM QUOTE</span>
                </div>
                <blockquote className="border-l-2 border-cyan-500/60 pl-3 italic text-slate-300 text-xs sm:text-[13px] font-['Plus_Jakarta_Sans',sans-serif] leading-relaxed">
                  "{record.primaryEvidence || (record.flags[0]?.snippet ? `"${record.flags[0].snippet}"` : 'Zero synthetic anomalies or extortion phrases identified.')}"
                </blockquote>
                {record.flags[0]?.triggerRule && (
                  <span className="text-[10.5px] text-slate-500 mt-1 font-mono">
                    Trigger: {record.flags[0].triggerRule}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* MAIN SPLIT: Left = Transcript | Right = Caught Flags */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* LEFT COLUMN: Call Transcript (7 Columns on large screens) */}
            <section
              aria-label="Call Transcript"
              className="lg:col-span-7 bg-[#0a1118]/80 backdrop-blur-md rounded-2xl border border-slate-800/90 flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.35)] overflow-hidden"
            >
              {/* Transcript Panel Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#070d13]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-['Space_Grotesk'] text-slate-100 flex items-center gap-2">
                      <span>Call Transcript</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {record.transcripts.length} Turns
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Highlighted phrases indicate detected threat triggers & policy violations
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Search within transcript */}
                  <div className="relative">
                    <input
                      type="text"
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value)}
                      placeholder="Filter dialogue..."
                      className="w-36 sm:w-44 pl-7 pr-2.5 py-1.5 rounded-lg bg-[#0a1118] border border-slate-700/80 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-400"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
                  </div>

                  <button
                    type="button"
                    id="copy-transcript-btn"
                    onClick={handleCopyFullTranscript}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                    title="Copy complete transcript to clipboard"
                  >
                    {copiedTranscript ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Speaker Legend */}
              <div className="px-5 py-2.5 bg-[#060b10] border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span>External Caller (Suspected Impersonator)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/80 inline-block" />
                    <span>Internal Target (Employee)</span>
                  </span>
                </div>
                <span className="text-slate-500">Carrier: {record.carrier}</span>
              </div>

              {/* Dialogue Turns List */}
              <div
                ref={transcriptScrollRef}
                className="p-4 sm:p-6 flex flex-col gap-4 max-h-[700px] overflow-y-auto divide-y divide-slate-800/40"
              >
                {record.transcripts.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-xs">
                    No transcript entries recorded for this call.
                  </div>
                ) : (
                  record.transcripts.map((turn) => {
                    const isCaller = turn.speaker === 'Caller' || turn.speaker === 'Suspect';
                    const hasFlag = !!turn.flagId;
                    const isHighlighted = highlightedTurnId === turn.id;
                    const matchesSearch =
                      !transcriptSearch || turn.text.toLowerCase().includes(transcriptSearch.toLowerCase());

                    if (!matchesSearch) return null;

                    return (
                      <div
                        key={turn.id}
                        id={`transcript-turn-${turn.id}`}
                        className={`pt-4 first:pt-0 transition-all rounded-xl p-3 ${isHighlighted
                            ? 'bg-amber-500/10 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                            : hasFlag
                              ? 'bg-rose-950/20 border border-rose-900/30'
                              : 'hover:bg-slate-900/30 border border-transparent'
                          }`}
                      >
                        {/* Turn Meta Row */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${isCaller
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                }`}
                            >
                              {isCaller ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                            </div>

                            <span
                              className={`text-xs font-bold font-mono ${isCaller ? 'text-rose-300' : 'text-cyan-300'
                                }`}
                            >
                              {turn.speakerLabel}
                            </span>

                            {turn.isAiVoice && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 tracking-wider">
                                AI Voice
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {turn.timestamp}
                            </span>

                            {hasFlag && (
                              <button
                                type="button"
                                onClick={() => handleJumpToFlag(turn.flagId!)}
                                className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                title="Jump to associated flag on the right panel"
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                                <span>View Flag</span>
                                <ChevronRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Text Body with Flag Highlight */}
                        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed pl-8">
                          {turn.highlightPhrase && turn.text.includes(turn.highlightPhrase) ? (
                            <>
                              {turn.text.split(turn.highlightPhrase)[0]}
                              <mark
                                onClick={() => turn.flagId && handleJumpToFlag(turn.flagId)}
                                className="bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border-b-2 border-amber-400 px-1 py-0.5 rounded cursor-pointer transition-all font-medium inline shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                                title="Click to view detected threat rule"
                              >
                                {turn.highlightPhrase}
                              </mark>
                              {turn.text.split(turn.highlightPhrase)[1]}
                            </>
                          ) : (
                            turn.text
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* RIGHT COLUMN: Flags Caught from Call Transcript (5 Columns on large screens) */}
            <section
              aria-label="Caught Threat Flags"
              className="lg:col-span-5 bg-[#0a1118]/80 backdrop-blur-md rounded-2xl border border-slate-800/90 flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.35)] overflow-hidden"
            >
              {/* Flags Panel Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-[#070d13] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-['Space_Grotesk'] text-slate-100 flex items-center gap-2">
                      <span>Caught Flags</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {record.flags.length} Violations
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Extracted from speech content & behavioral triggers
                    </p>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-[#091117] p-1 rounded-xl border border-slate-800">
                  {(['all', 'critical', 'high'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setFlagFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono capitalize transition-all cursor-pointer ${flagFilter === filter
                          ? 'bg-slate-800 text-teal-300 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flags List Container */}
              <div
                ref={flagsScrollRef}
                className="p-4 sm:p-5 flex flex-col gap-4 max-h-[700px] overflow-y-auto"
              >
                {filteredFlags.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-xs">
                    No flags matching the selected severity filter.
                  </div>
                ) : (
                  filteredFlags.map((flag, idx) => {
                    const isSelected = selectedFlagId === flag.id;
                    const isCrit = flag.severity === 'critical';
                    const isHigh = flag.severity === 'high';

                    return (
                      <article
                        key={flag.id}
                        id={`flag-card-${flag.id}`}
                        className={`p-4 rounded-xl border transition-all duration-200 ${isSelected
                            ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/50'
                            : isCrit
                              ? 'bg-[#12090b] border-rose-500/30 hover:border-rose-500/60'
                              : isHigh
                                ? 'bg-[#140e07] border-amber-500/30 hover:border-amber-500/60'
                                : 'bg-[#0a1218] border-teal-500/30 hover:border-teal-500/60'
                          }`}
                      >
                        {/* Flag Card Top Row */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-slate-300">
                              #{idx + 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${isCrit
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : isHigh
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                                }`}
                            >
                              {flag.severity}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {flag.category}
                            </span>
                          </div>

                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {flag.timestamp}
                          </span>
                        </div>

                        {/* Flag Title */}
                        <h3 className="text-sm font-bold text-slate-100 mb-2 font-['Space_Grotesk'] tracking-wide">
                          {flag.title}
                        </h3>

                        {/* Quote from Transcript */}
                        <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800/80 text-xs font-mono text-amber-200/90 mb-3 italic leading-relaxed">
                          "{flag.snippet}"
                        </div>

                        {/* Triggered Rule */}
                        <div className="mb-2">
                          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-0.5">
                            Triggered NLP Signature
                          </span>
                          <code className="text-[11px] font-mono text-teal-300 bg-teal-950/40 px-2 py-1 rounded border border-teal-800/40 block">
                            {flag.triggerRule}
                          </code>
                        </div>

                        {/* Explanation */}
                        <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                          {flag.explanation}
                        </p>

                        {/* Recommended Countermeasure Box */}
                        <div className="p-2.5 rounded-lg bg-teal-950/20 border border-teal-500/20 text-xs text-teal-200 flex items-start gap-2 mb-3">
                          <ShieldAlert className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-semibold text-teal-300 block text-[11px] uppercase font-mono">
                              Countermeasure
                            </strong>
                            <span>{flag.recommendedAction}</span>
                          </div>
                        </div>

                        {/* Action Button: Jump to Transcript Turn on Left */}
                        <button
                          type="button"
                          onClick={() => handleJumpToTranscript(flag)}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-800 hover:border-teal-500/40 text-xs font-mono transition-all cursor-pointer"
                        >
                          <span>Locate in Transcript ({flag.timestamp})</span>
                          <ChevronRight className="w-3.5 h-3.5 text-teal-400" />
                        </button>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

          </div>
        </>}
      </main>

      {/* Evidence Deep-Dive Modal */}
      {selectedModalEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border bg-[#0d161d] border-slate-800 text-slate-200 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative">
            <button
              type="button"
              onClick={() => setSelectedModalEvidence(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <ShieldAlert className="w-5 h-5 text-teal-400" />
              <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                {selectedModalEvidence.title}
              </h3>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold block mb-1">
                  Verbatim Forensic Snippet
                </span>
                <p className="text-slate-200 font-['Plus_Jakarta_Sans',sans-serif] text-sm italic leading-relaxed">
                  "{selectedModalEvidence.snippet}"
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-teal-400 uppercase tracking-wider font-bold block">
                  Rule Triggered & In-Depth Explanation
                </span>
                <div className="text-[11px] text-amber-300 font-mono">{selectedModalEvidence.rule}</div>
                <p className="text-slate-300 font-['Plus_Jakarta_Sans',sans-serif] text-xs leading-relaxed">
                  {selectedModalEvidence.explanation}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-500/30 space-y-1">
                <span className="text-[10px] text-teal-400 uppercase tracking-wider font-bold block">
                  Mandated Security Countermeasure
                </span>
                <p className="text-teal-200 font-['Plus_Jakarta_Sans',sans-serif] text-xs leading-relaxed">
                  {selectedModalEvidence.action}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`EVIDENCE::${record.callId}::${selectedModalEvidence.snippet}`);
                  setSelectedModalEvidence(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                Copy Forensic Citation
              </button>
              <button
                type="button"
                onClick={() => setSelectedModalEvidence(null)}
                className="px-5 py-2 rounded-xl text-xs font-mono font-semibold bg-teal-400 text-slate-950 hover:bg-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.3)] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Consistent Footer */}
      <Footer />
    </div>
  );
};
