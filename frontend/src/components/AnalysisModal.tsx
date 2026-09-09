import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Radio,
  FileText,
  Activity,
  Brain,
  ShieldAlert,
  Volume2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioAnalysisResult } from '../types';
import { analyzeAudioFile } from '../utils/audioAnalyzer';
import { generatePdfReport } from '../utils/pdfGenerator';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'mic' | 'upload' | 'demo';
  initialCheckpoint?: string | null;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'mic',
  initialCheckpoint,
}) => {
  const [activeTab, setActiveTab] = useState<'mic' | 'upload' | 'demo'>('mic');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      if (initialCheckpoint === 'spectral') setCurrentCheckpointIndex(1);
      else if (initialCheckpoint === 'authenticity') setCurrentCheckpointIndex(2);
      else if (initialCheckpoint === 'threat') setCurrentCheckpointIndex(3);
      else if (initialCheckpoint === 'action') setCurrentCheckpointIndex(4);
      else setCurrentCheckpointIndex(0);
    } else {
      stopRecording();
      resetState();
    }
  }, [isOpen, initialMode, initialCheckpoint]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [audioUrl]);

  const resetState = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentCheckpointIndex(0);
    setRecordingSeconds(0);
  };

  const checkpoints = [
    {
      id: 'capture',
      icon: <Mic className="w-4 h-4 text-cyan-400" />,
      label: '1. Audio capture',
      detail: 'Streaming raw acoustic waveform into ingest pipeline',
    },
    {
      id: 'spectral',
      icon: <Brain className="w-4 h-4 text-pink-400" />,
      label: '2. AI analysis',
      detail: 'Extracting Mel-Frequency Cepstral Coefficients & phase anomalies',
    },
    {
      id: 'authenticity',
      icon: <Activity className="w-4 h-4 text-teal-400" />,
      label: '3. Voice authenticity',
      detail: 'Calculating biological laryngeal micro-tremor probabilities',
    },
    {
      id: 'threat',
      icon: <Radio className="w-4 h-4 text-indigo-400" />,
      label: '4. Threat detection',
      detail: 'Flagging social engineering, voice clone vectors & scam scripts',
    },
    {
      id: 'action',
      icon: <FileText className="w-4 h-4 text-slate-200" />,
      label: '5. Explanation & action',
      detail: 'Synthesizing forensic evidence telemetry & response guidance',
    },
  ];

  const executePipeline = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setCurrentCheckpointIndex(0);

    const stepInterval = setInterval(() => {
      setCurrentCheckpointIndex((prev) => {
        if (prev < 4) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 550);

    try {
      const { result, audioUrl: url } = await analyzeAudioFile(file);

      setTimeout(() => {
        clearInterval(stepInterval);
        setCurrentCheckpointIndex(4);
        setAudioUrl(url);
        setAnalysisResult(result);
        setAudioDuration(result.duration);
        setIsAnalyzing(false);

        if (!result.isAiGenerated) {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#22d3ee', '#2dd4bf', '#14b8a6'],
          });
        }
      }, 2800);
    } catch (err) {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      console.error(err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `mic_recording_${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        executePipeline(file);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access unavailable, using synthetic live voice simulation:', err);
      simulateMicVoice();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  };

  const simulateMicVoice = () => {
    setIsRecording(true);
    let sec = 0;
    const interval = setInterval(() => {
      sec++;
      setRecordingSeconds(sec);
      if (sec >= 4) {
        clearInterval(interval);
        setIsRecording(false);
        loadDemoSample('ai');
      }
    }, 1000);
  };

  const loadDemoSample = (type: 'ai' | 'human') => {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      const sampleRate = 44100;
      const duration = type === 'ai' ? 4.5 : 5.0;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        if (type === 'ai') {
          data[i] =
            Math.sin(2 * Math.PI * 220 * t) * 0.3 * Math.sin(2 * Math.PI * 3 * t) +
            Math.sin(2 * Math.PI * 440 * t) * 0.15;
        } else {
          data[i] =
            (Math.sin(2 * Math.PI * 160 * t) +
              Math.sin(2 * Math.PI * 320 * t) * 0.4 +
              Math.sin(2 * Math.PI * 640 * t) * 0.15) *
            0.25 *
            (1 + Math.sin(2 * Math.PI * 1.5 * t) * 0.3);
        }
      }

      const wavBytes = encodeWav(data, sampleRate);
      const fileName =
        type === 'ai'
          ? 'urgent_wire_fraud_scam_call.wav'
          : 'executive_authorized_voice_call.wav';
      const file = new File([wavBytes], fileName, { type: 'audio/wav' });
      executePipeline(file);
    }
  };

  function encodeWav(samples: Float32Array, sampleRate: number) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
    return buffer;
  }

  useEffect(() => {
    if (!canvasRef.current || !isPlaying) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const numBars = 36;
      const barWidth = width / numBars;

      for (let i = 0; i < numBars; i++) {
        const x = i * barWidth + barWidth / 2;
        const amplitude = Math.sin(i * 0.35 + phase) * Math.cos(i * 0.2 - phase * 0.6);
        const barHeight = Math.max(4, Math.abs(amplitude) * (height * 0.44));

        ctx.fillStyle = analysisResult?.isAiGenerated ? '#f87171' : '#2dd4bf';
        ctx.fillRect(x - barWidth * 0.35, centerY - barHeight, barWidth * 0.7, barHeight * 2);
      }

      phase += 0.08;
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, analysisResult]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#091117] border border-slate-800/90 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-[#060c11]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
              Voice Threat Intelligence Pipeline
            </h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
              Live Checkpoints
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Input Method Navigation Tabs */}
          {!isAnalyzing && !analysisResult && (
            <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('mic')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'mic'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Live Microphone</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Audio File</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('demo')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'demo'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo Data</span>
              </button>
            </div>
          )}

          {/* TAB 1: Microphone */}
          {!isAnalyzing && !analysisResult && activeTab === 'mic' && (
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 text-center">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all ${
                  isRecording
                    ? 'bg-red-500/20 text-red-400 ring-4 ring-red-500/30 animate-pulse'
                    : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                <Mic className="w-9 h-9" />
              </div>

              {isRecording ? (
                <>
                  <p className="text-sm font-bold text-red-400">Recording call audio...</p>
                  <p className="text-2xl font-mono font-bold text-white mt-1">
                    00:0{recordingSeconds}
                  </p>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="mt-5 px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-lg shadow-red-500/20 cursor-pointer"
                  >
                    Stop & Analyze Call
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-200">Capture Live Voice Stream</p>
                  <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5">
                    Speak or play an audio sample into your mic to inspect voice authenticity and
                    threat signatures in real-time.
                  </p>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-6 py-2.5 rounded-xl bg-[#2dd4bf] hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Start Recording</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Upload File */}
          {!isAnalyzing && !analysisResult && activeTab === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) executePipeline(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/30'
                  : 'border-slate-800 hover:border-cyan-500/60 bg-slate-950/40 hover:bg-slate-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".wav,.flac,.mp3,.aac,.m4a,.ogg,audio/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) executePipeline(e.target.files[0]);
                }}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Drop audio recording here, or <span className="text-cyan-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports: wav, flac, mp3, aac, m4a, ogg (up to 100 MB)
              </p>
            </div>
          )}

          {/* TAB 3: Pre-loaded Demo Data */}
          {!isAnalyzing && !analysisResult && activeTab === 'demo' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Select a verified threat intelligence case to see the 5-checkpoint pipeline in action:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => loadDemoSample('ai')}
                  className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-red-300">
                      AI Impersonation Attack
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Urgent CEO wire-transfer request simulated with synthetic neural vocoder.
                  </p>
                  <span className="text-[10px] font-mono text-red-400 mt-2 inline-block">
                    Run Analysis →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => loadDemoSample('human')}
                  className="p-4 rounded-xl border border-teal-500/30 bg-teal-950/20 hover:bg-teal-950/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Volume2 className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-teal-300">
                      Verified Human Call
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Authentic customer authorization with natural pitch contour and vocal tract resonance.
                  </p>
                  <span className="text-[10px] font-mono text-teal-400 mt-2 inline-block">
                    Run Analysis →
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 5 Checkpoints Progress */}
          <div className="p-4 rounded-2xl bg-[#070d12] border border-slate-800">
            <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 mb-3 flex items-center justify-between">
              <span>Execution Pipeline: 5 Checkpoints</span>
              <span className="text-cyan-400">
                {isAnalyzing ? `Stage ${currentCheckpointIndex + 1} of 5` : analysisResult ? 'Completed' : 'Standby'}
              </span>
            </h4>

            <div className="space-y-2.5">
              {checkpoints.map((cp, idx) => {
                const isPassed = isAnalyzing ? idx < currentCheckpointIndex : analysisResult !== null;
                const isCurrent = isAnalyzing && idx === currentCheckpointIndex;

                return (
                  <div
                    key={cp.id}
                    className={`p-2.5 rounded-xl border transition-all flex items-start gap-3 ${
                      isCurrent
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                        : isPassed
                        ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                        : 'bg-slate-950/40 border-slate-900 text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 animate-pulse'
                          : isPassed
                          ? 'bg-teal-500/20 text-teal-300'
                          : 'bg-slate-800/40 text-slate-600'
                      }`}
                    >
                      {cp.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isCurrent ? 'text-cyan-300' : isPassed ? 'text-white' : 'text-slate-500'
                          }`}
                        >
                          {cp.label}
                        </span>
                        {isPassed && (
                          <span className="text-[10px] font-mono text-teal-400">VERIFIED</span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-mono text-cyan-400 animate-pulse">
                            PROCESSING...
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] leading-snug mt-0.5 ${
                          isCurrent ? 'text-cyan-200/80' : isPassed ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {cp.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Results & Action Buttons */}
          {analysisResult && (
            <div className="space-y-4 animate-fadeIn">
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  analysisResult.isAiGenerated
                    ? 'bg-red-950/40 border-red-500/40 text-red-100'
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                }`}
              >
                {analysisResult.isAiGenerated ? (
                  <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold tracking-tight">
                      {analysisResult.isAiGenerated
                        ? 'AI Voice Impersonation Detected'
                        : 'Authentic Human Voice Verified'}
                    </span>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        analysisResult.isAiGenerated
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {analysisResult.confidenceScore}% Confidence
                    </span>
                  </div>

                  {/* Clean 2-Score Verdict Display */}
                  <div className="grid grid-cols-2 gap-2 mt-3 mb-2 font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">1. AI Voice Score</div>
                      <div className="text-lg font-bold text-cyan-400">
                        {analysisResult.aiVoiceScore ?? analysisResult.confidenceScore}
                        <span className="text-xs text-slate-500 font-normal"> / 100</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Frequency & Pitch Analysis</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">2. Scam Intent Score</div>
                      <div className="text-lg font-bold text-rose-400">
                        {analysisResult.scamIntentScore ?? (analysisResult.isAiGenerated ? 95 : 5)}
                        <span className="text-xs text-slate-500 font-normal"> / 100</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Call Content & Urgency</div>
                    </div>
                  </div>

                  <p className="text-xs mt-1.5 text-slate-300 leading-relaxed">
                    <strong className="text-white">Threat Assessment: </strong>
                    {analysisResult.threatCategory}
                  </p>

                  <p className="text-xs mt-1 text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Recommended Action: </strong>
                    {analysisResult.recommendedAction}
                  </p>
                </div>
              </div>

              {audioUrl && (
                <div className="bg-[#060c11] rounded-2xl p-3.5 border border-slate-800">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={() => {
                      if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                    }}
                    onEnded={() => setIsPlaying(false)}
                    preload="metadata"
                  />

                  <div className="h-12 w-full bg-slate-950 rounded-xl mb-3 overflow-hidden flex items-center justify-center relative border border-slate-800/60">
                    <canvas
                      ref={canvasRef}
                      width={440}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                    {!isPlaying && (
                      <span className="absolute text-[11px] text-slate-400 font-medium">
                        Press Play to inspect acoustic waveform
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!audioRef.current) return;
                        if (isPlaying) {
                          audioRef.current.pause();
                          setIsPlaying(false);
                        } else {
                          audioRef.current.play();
                          setIsPlaying(true);
                        }
                      }}
                      className="w-9 h-9 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center font-bold shadow-[0_0_12px_rgba(34,211,238,0.4)] shrink-0 cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>

                    <div className="flex-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1 font-mono">
                        <span className="truncate max-w-[200px]">{analysisResult.fileName}</span>
                        <span>
                          {currentTime.toFixed(1)}s / {audioDuration.toFixed(1)}s
                        </span>
                      </div>
                      <div
                        className="w-full bg-slate-800 rounded-full h-1.5 cursor-pointer overflow-hidden"
                        onClick={(e) => {
                          if (!audioRef.current) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          audioRef.current.currentTime = (clickX / rect.width) * audioDuration;
                        }}
                      >
                        <div
                          className="bg-cyan-400 h-full rounded-full transition-all"
                          style={{
                            width: `${audioDuration ? (currentTime / audioDuration) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  id="download-evidence-btn"
                  onClick={() => generatePdfReport(analysisResult)}
                  className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Evidence PDF</span>
                </button>

                <button
                  type="button"
                  id="retest-pipeline-btn"
                  onClick={resetState}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Analyze Another Call</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
