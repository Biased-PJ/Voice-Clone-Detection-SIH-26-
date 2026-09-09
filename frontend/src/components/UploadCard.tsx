import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Play, Pause, RotateCcw, Download, CheckCircle, AlertTriangle, Sparkles, Volume2 } from 'lucide-react';
import { AudioAnalysisResult, StepState } from '../types';
import { analyzeAudioFile } from '../utils/audioAnalyzer';
import { generatePdfReport } from '../utils/pdfGenerator';
import { useTheme } from '../context/ThemeContext';

interface UploadCardProps {
  currentStep: StepState;
  onStepChange: (step: StepState) => void;
  onResultChange?: (result: AudioAnalysisResult | null) => void;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  currentStep,
  onStepChange,
  onResultChange,
}) => {
  const { isDark } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [audioUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setIsAnalyzing(true);
    onStepChange('analyze');
    setAnalysisProgress(5);
    setProgressStage('Reading audio waveform...');

    const stages = [
      { p: 25, label: 'Extracting Mel-Frequency Cepstral Coefficients (MFCC)...' },
      { p: 50, label: 'Scanning for neural vocoder phase artifacts...' },
      { p: 75, label: 'Calculating biological laryngeal micro-tremors...' },
      { p: 90, label: 'Cross-verifying synthetic voice acoustic profile...' },
      { p: 100, label: 'Finalizing authenticity diagnostic report...' },
    ];

    let stageIdx = 0;
    const interval = setInterval(() => {
      if (stageIdx < stages.length) {
        setAnalysisProgress(stages[stageIdx].p);
        setProgressStage(stages[stageIdx].label);
        stageIdx++;
      } else {
        clearInterval(interval);
      }
    }, 450);

    try {
      const { result, audioUrl: url } = await analyzeAudioFile(file);

      setTimeout(() => {
        clearInterval(interval);
        setAudioUrl(url);
        setAnalysisResult(result);
        setAudioDuration(result.duration);
        setIsAnalyzing(false);
        onStepChange('complete');
        onResultChange?.(result);

        if (!result.isAiGenerated) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#14b8a6', '#06b6d4', '#0d9488'],
          });
        }
      }, 2600);
    } catch (err) {
      clearInterval(interval);
      setIsAnalyzing(false);
      console.error(err);
    }
  };

  const loadSampleAudio = (type: 'ai' | 'human') => {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      const sampleRate = 44100;
      const duration = type === 'ai' ? 4.2 : 5.0;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        if (type === 'ai') {
          data[i] = Math.sin(2 * Math.PI * 220 * t) * 0.3 * Math.sin(2 * Math.PI * 4 * t);
        } else {
          data[i] =
            (Math.sin(2 * Math.PI * 180 * t) + 0.4 * Math.sin(2 * Math.PI * 360 * t + 0.3)) *
            0.3 *
            (0.8 + 0.2 * Math.sin(2 * Math.PI * 1.5 * t));
        }
      }

      const wavBlob = audioBufferToWavBlob(buffer);
      const filename =
        type === 'ai'
          ? 'Deepfake_Synthetic_AI_Voice_Sample.wav'
          : 'Natural_Human_Speech_Sample.wav';
      const file = new File([wavBlob], filename, { type: 'audio/wav' });
      processFile(file);
      ctx.close();
    }
  };

  const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let sampleRate = buffer.sampleRate;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
      out.setUint16(pos, data, true);
      pos += 2;
    }
    function setUint32(data: number) {
      out.setUint32(pos, data, true);
      pos += 4;
    }

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: 'audio/wav' });
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setIsPlaying(false);
    setCurrentTime(0);
    onStepChange('upload');
    onResultChange?.(null);
  };

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

      ctx.beginPath();
      ctx.strokeStyle = analysisResult?.isAiGenerated ? '#ef4444' : '#14b8a6';
      ctx.lineWidth = 2.5;

      const numBars = 32;
      const barWidth = width / numBars;

      for (let i = 0; i < numBars; i++) {
        const x = i * barWidth + barWidth / 2;
        const amplitude = Math.sin(i * 0.35 + phase) * Math.cos(i * 0.15 - phase * 0.5);
        const barHeight = Math.max(4, Math.abs(amplitude) * (height * 0.42));

        ctx.fillStyle = analysisResult?.isAiGenerated ? '#fca5a5' : '#5eead4';
        ctx.fillRect(x - barWidth * 0.35, centerY - barHeight, barWidth * 0.7, barHeight * 2);
      }

      phase += 0.08;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, analysisResult]);

  return (
    <div
      className={`w-full max-w-[490px] rounded-3xl p-7 sm:p-9 transition-all duration-300 ${
        isDark
          ? 'bg-[#0d141a]/95 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
          : 'bg-white border border-slate-100/80 shadow-[0_20px_50px_rgba(15,118,110,0.08)]'
      }`}
    >
      <h2
        className={`text-[22px] sm:text-2xl font-bold tracking-tight text-center ${
          isDark ? 'text-slate-100' : 'text-slate-800'
        }`}
      >
        Upload and Analyze.
      </h2>

      <div
        className={`text-center text-[12.5px] sm:text-[13px] leading-relaxed mt-2 mb-6 max-w-sm mx-auto ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        <p>After refreshing the page, all audio files and PDF report data will be cleared.</p>
        <p className="mt-0.5">Please download the PDF file directly once the computation is complete.</p>
      </div>

      {!isAnalyzing && !analysisResult && (
        <>
          <div
            id="dropzone-area"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-7 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? isDark
                  ? 'border-teal-400 bg-teal-950/40 scale-[1.01]'
                  : 'border-[#137882] bg-teal-50/60 scale-[1.01]'
                : isDark
                ? 'border-teal-500/30 hover:border-teal-400/80 bg-teal-950/15 hover:bg-teal-950/30'
                : 'border-[#5eead4]/80 hover:border-[#14b8a6] bg-teal-50/20 hover:bg-teal-50/35'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,.flac,.mp3,.aac,.m4a,.ogg,audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="w-14 h-16 sm:w-16 sm:h-18 relative flex items-center justify-center mb-3">
              <div
                className={`w-12 h-14 rounded-lg shadow-sm relative flex items-center justify-center ${
                  isDark ? 'bg-[#14b8a6] shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'bg-[#76ebd9]'
                }`}
              >
                <div
                  className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-bl-sm border-b border-l ${
                    isDark
                      ? 'bg-teal-300 border-teal-400'
                      : 'bg-teal-200/90 border-teal-300'
                  }`}
                />
                <svg
                  className={`w-6 h-6 ${isDark ? 'text-slate-950 font-bold' : 'text-[#0d766e]'}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            </div>

            <p className={`text-[14px] font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              Drop file here, or{' '}
              <span
                className={`font-semibold underline underline-offset-2 ${
                  isDark
                    ? 'text-teal-400 hover:text-teal-300'
                    : 'text-[#137882] hover:text-[#0f6068]'
                }`}
              >
                browse
              </span>
            </p>

            <p className={`text-[12px] mt-1.5 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Supports: wav, flac, mp3, aac, m4a, ogg
            </p>

            <p className={`text-[12px] mt-0.5 font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Maximum size: 100 MB
            </p>
          </div>

          <div className={`mt-5 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <p
              className={`text-[11px] font-semibold uppercase tracking-wider text-center mb-2.5 ${
                isDark ? 'text-slate-400' : 'text-slate-400'
              }`}
            >
              Quick Test With Sample Audio
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="sample-ai-btn"
                onClick={() => loadSampleAudio('ai')}
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDark
                    ? 'text-amber-300 bg-amber-950/35 hover:bg-amber-900/50 border-amber-500/30'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Clone Sample</span>
              </button>
              <button
                type="button"
                id="sample-human-btn"
                onClick={() => loadSampleAudio('human')}
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDark
                    ? 'text-teal-300 bg-teal-950/35 hover:bg-teal-900/50 border-teal-500/30'
                    : 'text-teal-800 bg-teal-50 hover:bg-teal-100 border-teal-200/60'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Human Voice Sample</span>
              </button>
            </div>
          </div>
        </>
      )}

      {isAnalyzing && (
        <div className="py-6 px-4 flex flex-col items-center justify-center text-center">
          <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
            <div
              className={`absolute inset-0 rounded-full border-4 ${
                isDark
                  ? 'border-teal-500/20 border-t-teal-400'
                  : 'border-[#14b8a6]/20 border-t-[#137882]'
              } animate-spin`}
            />
            <Sparkles
              className={`w-6 h-6 animate-pulse ${
                isDark ? 'text-teal-400' : 'text-[#137882]'
              }`}
            />
          </div>

          <h3
            className={`text-base font-semibold ${
              isDark ? 'text-slate-100' : 'text-slate-800'
            }`}
          >
            Analyzing Biometric Voiceprints...
          </h3>

          <p
            className={`text-xs mt-1 min-h-[32px] max-w-xs transition-all ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {progressStage}
          </p>

          <div
            className={`w-full rounded-full h-2 mt-4 overflow-hidden ${
              isDark ? 'bg-slate-800' : 'bg-slate-100'
            }`}
          >
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isDark
                  ? 'bg-gradient-to-r from-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(45,212,191,0.5)]'
                  : 'bg-gradient-to-r from-[#2dd4bf] to-[#137882]'
              }`}
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
          <span
            className={`text-[11px] mt-1.5 font-medium ${
              isDark ? 'text-slate-400' : 'text-slate-400'
            }`}
          >
            {analysisProgress}% Complete
          </span>
        </div>
      )}

      {analysisResult && !isAnalyzing && (
        <div className="space-y-4 pt-1 animate-fadeIn">
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
              analysisResult.isAiGenerated
                ? isDark
                  ? 'bg-red-950/40 border-red-500/40 text-red-100'
                  : 'bg-red-50/80 border-red-200/80 text-red-950'
                : isDark
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950'
            }`}
          >
            {analysisResult.isAiGenerated ? (
              <AlertTriangle className={`w-6 h-6 shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            ) : (
              <CheckCircle className={`w-6 h-6 shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight">
                  {analysisResult.isAiGenerated
                    ? 'AI Voice Impersonation Detected'
                    : 'Authentic Human Voice Verified'}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    analysisResult.isAiGenerated
                      ? isDark
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-red-100 text-red-700'
                      : isDark
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {analysisResult.confidenceScore}% Confidence
                </span>
              </div>
              <p
                className={`text-xs mt-1 leading-normal ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {analysisResult.isAiGenerated
                  ? 'Neural speech synthesis artifacts detected in high-frequency spectrum.'
                  : 'Natural vocal tract resonance and authentic biological micro-variations confirmed.'}
              </p>
            </div>
          </div>

          {audioUrl && (
            <div
              className={`rounded-2xl p-3.5 border ${
                isDark
                  ? 'bg-[#090e13] border-slate-800/90'
                  : 'bg-slate-50/80 border-slate-200/60'
              }`}
            >
              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleAudioTimeUpdate}
                onEnded={handleAudioEnded}
                preload="metadata"
              />

              <div
                className={`h-12 w-full rounded-xl mb-3 overflow-hidden flex items-center justify-center relative ${
                  isDark ? 'bg-slate-950/80 border border-slate-800/40' : 'bg-slate-900/5'
                }`}
              >
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={48}
                  className="w-full h-full object-cover"
                />
                {!isPlaying && (
                  <span className={`absolute text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                    Press Play to view real-time voice waveform
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  id="play-audio-btn"
                  onClick={handlePlayPause}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer ${
                    isDark
                      ? 'bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-[0_0_12px_rgba(45,212,191,0.4)]'
                      : 'bg-[#137882] hover:bg-[#0f6068] text-white'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <div className="flex-1">
                  <div
                    className={`flex justify-between text-[11px] font-medium mb-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    <span className="truncate max-w-[180px]">{analysisResult.fileName}</span>
                    <span>
                      {currentTime.toFixed(1)}s / {audioDuration.toFixed(1)}s
                    </span>
                  </div>
                  <div
                    className={`w-full rounded-full h-1.5 cursor-pointer overflow-hidden ${
                      isDark ? 'bg-slate-800' : 'bg-slate-200'
                    }`}
                    onClick={(e) => {
                      if (!audioRef.current) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const ratio = clickX / rect.width;
                      audioRef.current.currentTime = ratio * audioDuration;
                    }}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        isDark ? 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]' : 'bg-[#137882]'
                      }`}
                      style={{
                        width: `${audioDuration ? (currentTime / audioDuration) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              id="download-pdf-btn"
              onClick={() => generatePdfReport(analysisResult)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold shadow-[0_0_15px_rgba(45,212,191,0.3)]'
                  : 'bg-[#137882] hover:bg-[#0f6068] text-white shadow-md shadow-teal-900/10'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              id="reset-analysis-btn"
              onClick={handleReset}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
                isDark
                  ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Analyze Another</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
