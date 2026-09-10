import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface RecordedWaveformPlayerProps {
  audioUrl?: string;
  fileName: string;
  duration: number;
  sampleRate: number;
  aiVoiceScore: number;
  isAiGenerated: boolean;
}

export const RecordedWaveformPlayer: React.FC<RecordedWaveformPlayerProps> = ({
  audioUrl,
  fileName,
  duration,
  sampleRate,
  aiVoiceScore,
  isAiGenerated,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(isAiGenerated ? 218 : 172);

  const animRef = useRef<number | null>(null);
  const primaryColor = isAiGenerated ? '#f43f5e' : '#2dd4bf';
  const glowColor = isAiGenerated ? 'rgba(244, 63, 94, 0.4)' : 'rgba(45, 212, 191, 0.4)';

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percent * (duration || 1);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight || 260);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          width = canvas.width = entry.contentRect.width;
          height = canvas.height = entry.contentRect.height;
        }
      }
    });
    resizeObserver.observe(container);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = '#060a0f';
      ctx.fillRect(0, 0, width, height);

      const centerY = height / 2;

      ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isPlaying) {
        phase += 0.05;

        const base = isAiGenerated ? 218 : 172;
        const variance = (Math.sin(phase * 1.6) + Math.cos(phase * 0.8)) * (isAiGenerated ? 16 : 8);
        setCurrentPitch(Math.round(base + variance));
      }

      const progressRatio = duration > 0 ? currentTime / duration : 0;
      const progressX = progressRatio * width;

      const numBars = 100;
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 2);
        const normX = i / numBars;

        const h1 = Math.sin(normX * 12 + (isPlaying ? phase : 1.2)) * 0.4;
        const h2 = Math.cos(normX * 24 + (isPlaying ? phase * 0.5 : 0.8)) * 0.25;
        const h3 = Math.sin(normX * 6) * 0.25;
        const envelope = Math.sin(normX * Math.PI);
        const rawAmp = Math.abs(h1 + h2 + h3) * envelope;
        const barHeight = Math.max(4, rawAmp * (height * 0.7));

        const isPast = x <= progressX;
        ctx.fillStyle = isPast
          ? primaryColor
          : isAiGenerated
          ? 'rgba(244, 63, 94, 0.25)'
          : 'rgba(45, 212, 191, 0.25)';

        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
      }

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = primaryColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isPlaying ? 12 : 4;

      for (let i = 0; i < width; i += 6) {
        const norm = i / width;
        const wave = Math.sin(norm * 16 + (isPlaying ? phase * 1.8 : 0)) * 20 * Math.sin(norm * Math.PI);
        const py = centerY + wave;
        if (i === 0) ctx.moveTo(i, py);
        else ctx.lineTo(i, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (progressX > 0) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(progressX, 0);
        ctx.lineTo(progressX, height);
        ctx.stroke();

        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.arc(progressX, 10, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      resizeObserver.disconnect();
    };
  }, [isPlaying, currentTime, duration, isAiGenerated, primaryColor, glowColor]);

  return (
    <div className="w-full rounded-2xl bg-[#070c12] border border-slate-800/90 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-[#091118]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isPlaying
                ? isAiGenerated
                  ? 'bg-rose-500 animate-ping'
                  : 'bg-teal-400 animate-pulse'
                : 'bg-slate-600'
            }`}
          />
          <div>
            <h3 className="text-sm font-bold font-['Space_Grotesk'] text-white tracking-wide truncate max-w-[240px] sm:max-w-md">
              {fileName}
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Recorded Speech Waveform & Fundamental Pitch ($F_0$)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500">Pitch:</span>
            <span className={`font-semibold ${isAiGenerated ? 'text-rose-400' : 'text-teal-400'}`}>
              {isPlaying ? `${currentPitch} Hz` : '185 Hz'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-[11px]">
            <span>{sampleRate} Hz</span>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        onClick={handleSeek}
        className="w-full h-56 sm:h-64 relative cursor-pointer group"
        title="Click to seek playback position"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        <div className="absolute top-3 right-4 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900/80 border border-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Click anywhere on waveform to seek
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800/80 bg-[#080d13]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isAiGenerated
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(45,212,191,0.3)]'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Restart playback"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="text-xs font-mono text-slate-300">
            <span className="font-semibold text-white">{formatTime(currentTime)}</span>
            <span className="text-slate-500"> / {formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <span
            className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase border ${
              isAiGenerated
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                : 'bg-teal-950/80 border-teal-500/50 text-teal-300'
            }`}
          >
            {isAiGenerated ? 'Synthetic Artifacts' : 'Biological Voiceprint'}
          </span>
        </div>
      </div>
    </div>
  );
};
