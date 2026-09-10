import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  UploadCloud,
  FileAudio,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Lightbulb,
  Copy,
  Check,
  RefreshCw,
  PanelLeftOpen,
  PanelLeftClose,
  Play,
  FileText,
  Download,
} from 'lucide-react';
import { UserProfile, AudioAnalysisResult } from '../types';
import { PageBackground } from './backgrounds/PageBackground';
import { RecordedWaveformPlayer } from './recorded-analysis/RecordedWaveformPlayer';
import { AppSidebar } from './common/AppSidebar';
import { analyzeAudioFile } from '../utils/audioAnalyzer';
import { analyzeAudio as analyzeAudioBackend } from '../utils/api';
import { generatePdfReport } from '../utils/pdfGenerator';
import { Footer } from './Footer';

interface RecordedAnalysisPageProps {
  user: UserProfile | null;
  authToken?: string | null;
  onBackToDashboard: () => void;
  onViewLanding?: () => void;
  onNavigate?: (view: 'dashboard' | 'live-analysis' | 'recorded-analysis' | 'call-intelligence' | 'landing', tab?: string) => void;
}

interface SamplePreset {
  id: string;
  name: string;
  size: string;
  duration: number;
  sampleRate: number;
  aiVoiceScore: number;
  aiVoiceDescription: string;
  scamIntentScore: number;
  scamIntentDescription: string;
  threatCategory: string;
  suggestions: {
    id: string;
    level: 'critical' | 'warning' | 'info' | 'safe';
    title: string;
    advice: string;
    actionLabel?: string;
  }[];
}

const SAMPLE_RECORDINGS: SamplePreset[] = [
  {
    id: 'ceo-wire',
    name: 'CEO_Urgent_Wire_Impersonation.wav',
    size: '1.8 MB',
    duration: 18.4,
    sampleRate: 44100,
    aiVoiceScore: 98,
    aiVoiceDescription: 'Neural vocoder detected • High pitch quantization & missing glottal pulse',
    scamIntentScore: 96,
    scamIntentDescription: 'High-urgency $450,000 international wire transfer bypassing authorization',
    threatCategory: 'Zero-Shot AI Voice Clone + Executive Financial Impersonation',
    suggestions: [
      {
        id: 'sug-1',
        level: 'critical',
        title: 'Reject Financial Transfer Immediately',
        advice: 'Audio exhibits zero-shot voice synthesis artifacts with 98% certainty. Never release funds.',
        actionLabel: 'Flag as Fraud',
      },
      {
        id: 'sug-2',
        level: 'critical',
        title: 'Verify via Secondary Internal Line',
        advice: 'Sever communication with caller and call the CEO on their internal verified company extension.',
      },
      {
        id: 'sug-3',
        level: 'warning',
        title: 'Quarantine Sender PBX & IP Gateway',
        advice: 'Submit audio hash and telephony carrier headers to IT SecOps for immediate SIP trunk blacklisting.',
        actionLabel: 'Submit to SecOps',
      },
      {
        id: 'sug-4',
        level: 'info',
        title: 'Archive Forensic Audio Dossier',
        advice: 'Export signed cryptographic analysis report for cyber insurance and legal compliance.',
      },
    ],
  },
  {
    id: 'it-helpdesk',
    name: 'IT_Helpdesk_2FA_Harvest_Scam.wav',
    size: '2.4 MB',
    duration: 24.2,
    sampleRate: 48000,
    aiVoiceScore: 89,
    aiVoiceDescription: 'Real-time voice conversion (RVC) • Formant smearing at 3.5 kHz',
    scamIntentScore: 93,
    scamIntentDescription: 'Coercive employee credential & one-time authenticator passcode harvesting',
    threatCategory: 'Real-Time Voice Conversion + Social Engineering Helpdesk Spoof',
    suggestions: [
      {
        id: 'sug-1',
        level: 'critical',
        title: 'Never Share MFA / 2FA Passcodes',
        advice: 'Legitimate IT support will never ask you to read out a 6-digit authenticator or SMS verification code.',
        actionLabel: 'Lock Account',
      },
      {
        id: 'sug-2',
        level: 'warning',
        title: 'Validate Service Desk Ticket',
        advice: 'Inquire for the official ticket number and verify independently on your corporate help portal.',
      },
      {
        id: 'sug-3',
        level: 'info',
        title: 'Report Impersonator Telephony ID',
        advice: 'Forward caller metadata to internal infosec for credential stuffing mitigation.',
      },
    ],
  },
  {
    id: 'organic-call',
    name: 'Internal_Team_Project_Sync.wav',
    size: '1.2 MB',
    duration: 14.6,
    sampleRate: 44100,
    aiVoiceScore: 4,
    aiVoiceDescription: 'Natural human vocal tract resonance • Authentic micro-jitter & shimmer',
    scamIntentScore: 5,
    scamIntentDescription: 'Routine collaborative project discussion without social engineering pressure',
    threatCategory: 'Authentic Biological Human Speech • Benign Intent',
    suggestions: [
      {
        id: 'sug-1',
        level: 'safe',
        title: 'Voice Verified as Biological Human',
        advice: 'Harmonic spectral distribution and pitch perturbation match natural human vocal cord mechanics.',
      },
      {
        id: 'sug-2',
        level: 'safe',
        title: 'No Coercive Intent Detected',
        advice: 'Conversation transcript analysis identified routine operational exchange without fraud markers.',
      },
      {
        id: 'sug-3',
        level: 'info',
        title: 'Standard Storage Compliance',
        advice: 'Audio file can be archived according to standard corporate data retention policies.',
      },
    ],
  },
];

export const RecordedAnalysisPage: React.FC<RecordedAnalysisPageProps> = ({
  user,
  authToken,
  onBackToDashboard,
  onViewLanding,
  onNavigate,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'processing' | 'success' | 'error' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const emptyRecording: SamplePreset = {
    id: 'empty',
    name: 'No recording selected',
    size: '—',
    duration: 0,
    sampleRate: 0,
    aiVoiceScore: 0,
    aiVoiceDescription: 'Upload an audio file to run backend analysis.',
    scamIntentScore: 0,
    scamIntentDescription: 'No analysis result available.',
    threatCategory: 'Awaiting audio',
    suggestions: [],
  };
  const [currentRecording, setCurrentRecording] = useState<SamplePreset>(emptyRecording);
  const [isCustomUploaded, setIsCustomUploaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCritical = currentRecording.aiVoiceScore >= 70 || currentRecording.scamIntentScore >= 70;
  const isSuspicious = !isCritical && (currentRecording.aiVoiceScore >= 40 || currentRecording.scamIntentScore >= 40);

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setIsAnalyzing(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setSuccessMessage(null);
    setAnalysisError(null);

    try {

      const { audioUrl: generatedUrl, result: localMeta } = await analyzeAudioFile(file);
      setAudioUrl(generatedUrl);

      const sessionId = `rec-${Date.now()}`;
      const language = 'auto';
      setUploadStatus('processing');
      const backendResult = await analyzeAudioBackend(file, sessionId, language, authToken, setUploadProgress);
      window.dispatchEvent(new Event('voiceguardian-history-updated'));

      setIsCustomUploaded(true);

      const aiScore = Math.round(backendResult.synthetic_probability * 100);
      const scamScore = backendResult.risk_score;
      const isAiGenerated = backendResult.synthetic_probability >= 0.5;

      const levelForRisk = (): 'critical' | 'warning' | 'info' | 'safe' => {
        if (backendResult.risk_level === 'CRITICAL') return 'critical';
        if (backendResult.risk_level === 'HIGH') return 'critical';
        if (backendResult.risk_level === 'MEDIUM') return 'warning';
        return 'safe';
      };

      const customSuggestions = [
        {
          id: 'c-sug-1',
          level: levelForRisk(),
          title: `Risk level: ${backendResult.risk_level}`,
          advice: backendResult.suggestion,
        },
        ...backendResult.risk_factors.map((factor, idx) => ({
          id: `c-sug-factor-${idx}`,
          level: 'warning' as const,
          title: factor,
          advice: 'Flagged by the acoustic + conversational risk engine as a contributing factor.',
        })),
      ];

      setCurrentRecording({
        id: 'custom-upload',
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        duration: Math.round((localMeta?.duration || 0) * 10) / 10,
        sampleRate: localMeta?.sampleRate || 0,
        aiVoiceScore: aiScore,
        aiVoiceDescription: isAiGenerated
          ? 'Backend ML service flagged synthetic-voice acoustic markers'
          : 'Backend ML service found acoustic markers consistent with a human voice',
        scamIntentScore: scamScore,
        scamIntentDescription: `Composite risk score from /api/v1/analyze/audio (speaker match: ${Math.round(backendResult.speaker_match_probability * 100)}%)`,
        threatCategory: backendResult.risk_level,
        suggestions: customSuggestions,
      });
      setUploadProgress(100);
      setUploadStatus('success');
      setSuccessMessage(`${file.name} was analyzed successfully.`);
    } catch (err: any) {
      setUploadStatus('error');
      setAnalysisError(
        err?.message || 'Could not reach the analysis backend. Is it running on the configured VITE_API_BASE_URL?'
      );
    } finally {
      setIsAnalyzing(false);
      window.setTimeout(() => setUploadStatus(null), 3500);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = (sample: SamplePreset) => {
    setCurrentRecording(sample);
    setIsCustomUploaded(false);
    setSelectedFile(null);
    setAudioUrl(null);
  };

  const handleCopyAdvice = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadPdf = () => {
    const dummyResult: AudioAnalysisResult = {
      fileName: currentRecording.name,
      fileSize: currentRecording.size,
      duration: currentRecording.duration,
      sampleRate: currentRecording.sampleRate,
      isAiGenerated: currentRecording.aiVoiceScore >= 50,
      confidenceScore: currentRecording.aiVoiceScore,
      aiVoiceScore: currentRecording.aiVoiceScore,
      scamIntentScore: currentRecording.scamIntentScore,
      threatCategory: currentRecording.threatCategory,
      recommendedAction: currentRecording.suggestions[0]?.advice || 'Hold all financial actions.',
      analysisTimestamp: new Date().toISOString(),
      acousticMetrics: {
        zeroCrossingRate: 0.042,
        spectralCentroid: 1840,
        jitterPercent: 1.2,
        shimmerPercent: 2.4,
        harmonicToNoiseRatio: 18.2,
        vocoderArtifactProbability: currentRecording.aiVoiceScore / 100,
      },
      checkpoints: [
        {
          id: '1',
          name: 'Fundamental Pitch Tracking (F0)',
          status: currentRecording.aiVoiceScore < 50 ? 'passed' : 'failed',
          detail: currentRecording.aiVoiceDescription,
        },
        {
          id: '2',
          name: 'Conversational Intent & Pretext',
          status: currentRecording.scamIntentScore < 50 ? 'passed' : 'failed',
          detail: currentRecording.scamIntentDescription,
        },
      ],
    };
    generatePdfReport(dummyResult);
  };

  return (
    <div className="min-h-screen bg-[#05080c] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden selection:bg-teal-500/30 selection:text-teal-200">
      <PageBackground variant="recorded" />

      {uploadStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="upload-status-title">
          <div className="w-full max-w-md rounded-2xl border border-teal-500/40 bg-[#0a1117] p-6 shadow-[0_0_50px_rgba(45,212,191,0.2)]">
            <div className="flex items-start gap-3">
              {uploadStatus === 'success' ? <CheckCircle2 className="h-6 w-6 text-emerald-400" /> : uploadStatus === 'error' ? <AlertTriangle className="h-6 w-6 text-rose-400" /> : <RefreshCw className="h-6 w-6 animate-spin text-teal-400" />}
              <div className="min-w-0 flex-1">
                <h2 id="upload-status-title" className="text-base font-bold text-white">
                  {uploadStatus === 'uploading' ? 'Uploading audio' : uploadStatus === 'processing' ? 'Processing audio' : uploadStatus === 'success' ? 'Analysis complete' : 'Analysis failed'}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {uploadStatus === 'uploading' ? `${uploadProgress}% uploaded` : uploadStatus === 'processing' ? 'The backend is transcribing and scoring this recording.' : uploadStatus === 'success' ? successMessage : analysisError}
                </p>
              </div>
            </div>
            {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
              <div className="mt-5">
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300" style={{ width: `${uploadStatus === 'processing' ? 100 : uploadProgress}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-[11px] font-mono text-slate-500"><span>{uploadStatus === 'processing' ? 'Backend analysis' : 'Transfer'}</span><span>{uploadStatus === 'processing' ? 'In progress' : `${uploadProgress}%`}</span></div>
              </div>
            )}
          </div>
        </div>
      )}

      <AppSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="recorded-analysis"
        onNavigate={(view, tab) => {
          setIsSidebarOpen(false);
          if (onNavigate) {
            onNavigate(view, tab);
          } else if (view === 'dashboard') {
            onBackToDashboard();
          } else if (view === 'landing' && onViewLanding) {
            onViewLanding();
          }
        }}
        user={user}
      authToken={authToken}
        isOverlay={true}
      />

      <header className="relative z-20 border-b border-slate-800/80 bg-[#070b10]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            id="recorded-analysis-sidebar-toggle-btn"
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

          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <FileAudio className="w-4 h-4 text-teal-400" />
            <div>
              <span className="text-sm font-bold text-white font-['Space_Grotesk'] tracking-wide">
                Recorded Audio Forensics
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.wav,.mp3,.m4a,.flac,.ogg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-[0_0_15px_rgba(45,212,191,0.25)] cursor-pointer disabled:opacity-50 pb-primary-btn"
          >
            {isAnalyzing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5" />
            )}
            <span>{isAnalyzing ? 'Analyzing Audio...' : 'Upload Audio File'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-all cursor-pointer"
            title="Download PDF Forensic Dossier"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Dossier</span>
          </button>
        </div>
      </header>

      <div className="relative z-10 border-b border-slate-800/50 bg-[#06090d]/60 px-4 sm:px-8 py-2 flex items-center justify-between gap-3 overflow-x-auto">
        <span className="text-[11px] font-mono text-slate-400 uppercase shrink-0">
          Optional sample recordings:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto">
          {SAMPLE_RECORDINGS.map((sample) => {
            const isSelected = !isCustomUploaded && currentRecording.id === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className={`px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${isSelected
                  ? 'bg-slate-700/90 text-white border border-teal-500/50 shadow-sm font-semibold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
                  }`}
              >
                {sample.name.replace('.wav', '')}
              </button>
            );
          })}

          {isCustomUploaded && (
            <span className="px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold">
              Uploaded: {currentRecording.name}
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-800 hover:border-teal-500/50 bg-[#080d13]/60 hover:bg-[#091118]/80 rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer group flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 text-left">
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-['Space_Grotesk'] text-white">
                Drop audio file here or click to browse
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Supports WAV, MP3, M4A, FLAC, OGG up to 50MB for acoustic & semantic extraction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 group-hover:border-slate-700">
              Browse Files
            </span>
          </div>
        </div>
      </div>

      <main className="relative z-10 flex-1 max-w-[1360px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full flex flex-col gap-6">
          {analysisError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{analysisError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#080d13] border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/70">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Score 1 of 2
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${currentRecording.aiVoiceScore >= 70
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : currentRecording.aiVoiceScore >= 40
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                    }`}
                >
                  {currentRecording.aiVoiceScore >= 70
                    ? 'Synthetic Clone'
                    : currentRecording.aiVoiceScore >= 40
                      ? 'Suspicious Pitch'
                      : 'Natural Voice'}
                </span>
              </div>

              <div className="my-4 flex items-baseline gap-2">
                <span
                  className={`text-4xl sm:text-5xl font-extrabold font-['Space_Grotesk'] tracking-tight ${currentRecording.aiVoiceScore >= 70
                    ? 'text-rose-400'
                    : currentRecording.aiVoiceScore >= 40
                      ? 'text-amber-400'
                      : 'text-teal-400'
                    }`}
                >
                  {currentRecording.aiVoiceScore}
                </span>
                <span className="text-sm font-mono text-slate-500 uppercase">/ 100</span>
                <span className="ml-auto text-xs font-mono text-slate-400 font-medium">
                  AI Voice Score
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${currentRecording.aiVoiceScore >= 70
                    ? 'bg-rose-500'
                    : currentRecording.aiVoiceScore >= 40
                      ? 'bg-amber-500'
                      : 'bg-teal-400'
                    }`}
                  style={{ width: `${currentRecording.aiVoiceScore}%` }}
                />
              </div>

              <p className="text-xs text-slate-400 font-mono mt-1">
                {currentRecording.aiVoiceDescription}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#080d13] border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/70">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Score 2 of 2
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${currentRecording.scamIntentScore >= 70
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : currentRecording.scamIntentScore >= 40
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                    }`}
                >
                  {currentRecording.scamIntentScore >= 70
                    ? 'High-Risk Scam'
                    : currentRecording.scamIntentScore >= 40
                      ? 'Suspicious Intent'
                      : 'Benign Audio'}
                </span>
              </div>

              <div className="my-4 flex items-baseline gap-2">
                <span
                  className={`text-4xl sm:text-5xl font-extrabold font-['Space_Grotesk'] tracking-tight ${currentRecording.scamIntentScore >= 70
                    ? 'text-rose-400'
                    : currentRecording.scamIntentScore >= 40
                      ? 'text-amber-400'
                      : 'text-teal-400'
                    }`}
                >
                  {currentRecording.scamIntentScore}
                </span>
                <span className="text-sm font-mono text-slate-500 uppercase">/ 100</span>
                <span className="ml-auto text-xs font-mono text-slate-400 font-medium">
                  Scam Intent Score
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${currentRecording.scamIntentScore >= 70
                    ? 'bg-rose-500'
                    : currentRecording.scamIntentScore >= 40
                      ? 'bg-amber-500'
                      : 'bg-teal-400'
                    }`}
                  style={{ width: `${currentRecording.scamIntentScore}%` }}
                />
              </div>

              <p className="text-xs text-slate-400 font-mono mt-1">
                {currentRecording.scamIntentDescription}
              </p>
            </div>
          </div>

          <RecordedWaveformPlayer
            audioUrl={audioUrl || undefined}
            fileName={currentRecording.name}
            duration={currentRecording.duration}
            sampleRate={currentRecording.sampleRate}
            aiVoiceScore={currentRecording.aiVoiceScore}
            isAiGenerated={currentRecording.aiVoiceScore >= 50}
          />
        </div>

        <aside className="w-full lg:w-[420px] shrink-0 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-[#080d13] border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold font-['Space_Grotesk'] text-white">
                    Action Suggestions
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400">
                    Recommendations for this recording
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                {currentRecording.size}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {currentRecording.suggestions.map((sug) => {
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

                    <p className="text-xs text-slate-300 mt-2 leading-relaxed font-normal">
                      {sug.advice}
                    </p>

                    {sug.actionLabel && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCopyAdvice(sug.id, sug.advice)}
                          className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition-all cursor-pointer font-semibold ${isCrit
                            ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                            }`}
                        >
                          {sug.actionLabel}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Download Forensic Report</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Another File</span>
              </button>
            </div>
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
};
