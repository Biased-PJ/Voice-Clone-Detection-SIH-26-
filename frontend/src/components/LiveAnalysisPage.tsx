import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  PhoneOff,
  Mic,
  Volume2,
  VolumeX,
  Lightbulb,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';
import { UserProfile } from '../types';
import { PageBackground } from './backgrounds/PageBackground';
import { CallerPitchWaveform } from './live-analysis/CallerPitchWaveform';
import { AppSidebar } from './common/AppSidebar';
import { startCallSession, endCallSession, createLiveAnalysisSocket, AnalyzeResponse } from '../utils/api';
import { Footer } from './Footer';

interface LiveAnalysisPageProps {
  user: UserProfile | null;
  authToken?: string | null;
  onBackToDashboard: () => void;
  onViewLanding?: () => void;
  onNavigate?: (view: 'dashboard' | 'live-analysis' | 'recorded-analysis' | 'call-intelligence' | 'landing', tab?: string) => void;
  initialSource?: 'mic' | 'elevenlabs' | 'rvc' | 'xtts' | 'organic-human';
}

type CallScenario = 'elevenlabs' | 'rvc' | 'xtts' | 'organic-human' | 'mic';

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};


interface ScenarioData {
  id: CallScenario;
  callerName: string;
  callerNumber: string;
  callType: 'attack' | 'safe' | 'mic';
  aiVoiceScore: number;
  aiVoiceDescription: string;
  scamIntentScore: number;
  scamIntentDescription: string;
  suggestions: {
    id: string;
    level: 'critical' | 'warning' | 'info' | 'safe';
    title: string;
    advice: string;
    actionLabel?: string;
  }[];
}

const SCENARIOS: Record<CallScenario, ScenarioData> = {
  elevenlabs: {
    id: 'elevenlabs',
    callerName: 'CEO Impersonation ($450k Wire)',
    callerNumber: '+44 20 7946 0912',
    callType: 'attack',
    aiVoiceScore: 98,
    aiVoiceDescription: 'Neural vocoder detected • High pitch quantization',
    scamIntentScore: 96,
    scamIntentDescription: 'Urgent wire transfer • Bypassing authorization portal',
    suggestions: [
      {
        id: 'sug-1',
        level: 'critical',
        title: 'Do Not Execute Any Wire Transfer',
        advice: 'Caller is demanding an emergency $450,000 wire before 5 PM. Never bypass secondary approval.',
        actionLabel: 'Reject Request',
      },
      {
        id: 'sug-2',
        level: 'critical',
        title: 'Demand Verbal Secret Passphrase',
        advice: 'Voice clone detected with 98% confidence. Request your company pre-shared challenge phrase.',
        actionLabel: 'Prompt Challenge',
      },
      {
        id: 'sug-3',
        level: 'warning',
        title: 'Call Back on Official Number',
        advice: 'Immediately sever this connection and dial the CEO on their internal verified extension.',
        actionLabel: 'Dial Official Line',
      },
      {
        id: 'sug-4',
        level: 'info',
        title: 'Notify Security Response Team',
        advice: 'Report this inbound spoofing incident to IT SecOps for IP and PBX gateway quarantine.',
      },
    ],
  },
  rvc: {
    id: 'rvc',
    callerName: 'Fake IT Helpdesk (2FA Harvest)',
    callerNumber: '+1 (800) 441-2099',
    callType: 'attack',
    aiVoiceScore: 89,
    aiVoiceDescription: 'Real-time pitch conversion • Formant phase smearing',
    scamIntentScore: 93,
    scamIntentDescription: 'Coercive lockout threat • Soliciting 6-digit 2FA token',
    suggestions: [
      {
        id: 'sug-1',
        level: 'critical',
        title: 'Never Disclose 2FA or OTP Tokens',
        advice: 'Legitimate IT support will never request your one-time authenticator passcode over the phone.',
        actionLabel: 'Block Inbound',
      },
      {
        id: 'sug-2',
        level: 'warning',
        title: 'Ignore Account Lockout Threats',
        advice: 'Caller is leveraging artificial urgency. Check your corporate Okta/Google portal independently.',
      },
      {
        id: 'sug-3',
        level: 'info',
        title: 'Verify Caller Employee ID',
        advice: 'Request the technician’s full employee directory ID and ticket reference number.',
        actionLabel: 'Request Ticket ID',
      },
    ],
  },
  xtts: {
    id: 'xtts',
    callerName: 'Vendor Invoice Redirect (ACH Fraud)',
    callerNumber: '+1 (202) 555-0198',
    callType: 'attack',
    aiVoiceScore: 74,
    aiVoiceDescription: 'Open-source diffusion vocoder • Shimmer anomalies',
    scamIntentScore: 71,
    scamIntentDescription: 'Modifying bank routing numbers for pending shipment',
    suggestions: [
      {
        id: 'sug-1',
        level: 'warning',
        title: 'Freeze Bank Account Modifications',
        advice: 'Never update vendor bank routing details based solely on an inbound telephone call.',
        actionLabel: 'Lock ACH Records',
      },
      {
        id: 'sug-2',
        level: 'warning',
        title: 'Perform Out-of-Band Confirmation',
        advice: 'Contact the established vendor accounts payable contact via their signed contract details.',
      },
      {
        id: 'sug-3',
        level: 'info',
        title: 'Inspect Invoice INV-8821',
        advice: 'Compare the cited invoice against previous legitimate invoices for inconsistencies.',
      },
    ],
  },
  'organic-human': {
    id: 'organic-human',
    callerName: 'Internal Team Member (Budget Sync)',
    callerNumber: '+1 (415) 890-2104',
    callType: 'safe',
    aiVoiceScore: 4,
    aiVoiceDescription: 'Natural human vocal cord jitter • Organic resonance',
    scamIntentScore: 6,
    scamIntentDescription: 'Casual collaborative conversation • No pressure',
    suggestions: [
      {
        id: 'sug-1',
        level: 'safe',
        title: 'Voice Verified as Biological Human',
        advice: 'Acoustic micro-jitter and harmonic distribution are consistent with real biological speech.',
      },
      {
        id: 'sug-2',
        level: 'safe',
        title: 'No Coercive Intent Detected',
        advice: 'Transcript reveals routine workplace coordination without social engineering or financial demands.',
      },
      {
        id: 'sug-3',
        level: 'info',
        title: 'Routine Line Monitoring Active',
        advice: 'Real-time pitch and semantic monitoring remain active in the background for this session.',
      },
    ],
  },
  mic: {
    id: 'mic',
    callerName: 'Live Hardware Microphone Ingest',
    callerNumber: 'Local Audio Input',
    callType: 'mic',
    aiVoiceScore: 5,
    aiVoiceDescription: 'Real-time hardware input • Continuous biological phase',
    scamIntentScore: 7,
    scamIntentDescription: 'Ambient microphone telemetry • Low threat',
    suggestions: [
      {
        id: 'sug-1',
        level: 'info',
        title: 'Microphone Active & Listening',
        advice: 'Speak into your microphone. The waveform above visualizes your real-time pitch oscillations.',
      },
      {
        id: 'sug-2',
        level: 'safe',
        title: 'Pitch Characteristics Nominal',
        advice: 'Live pitch and frequency analysis indicate authentic biological vocal production.',
      },
      {
        id: 'sug-3',
        level: 'info',
        title: 'Test Live Phone Scenarios',
        advice: 'You can switch to simulated voice clone attack calls above to observe threat suggestions.',
      },
    ],
  },
};

const IDLE_SCENARIO: ScenarioData = {
  id: 'mic',
  callerName: 'Live Analysis Standby',
  callerNumber: 'Microphone not activated',
  callType: 'mic',
  aiVoiceScore: 0,
  aiVoiceDescription: 'Start live analysis to collect a real microphone sample.',
  scamIntentScore: 0,
  scamIntentDescription: 'No call has been analyzed yet.',
  suggestions: [],
};

export const LiveAnalysisPage: React.FC<LiveAnalysisPageProps> = ({
  user,
  authToken,
  onBackToDashboard,
  onViewLanding,
  onNavigate,
  initialSource = 'mic',
}) => {
  const [currentScenario, setCurrentScenario] = useState<CallScenario>(initialSource);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showStartConfirmation, setShowStartConfirmation] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Real scoring for the "mic" scenario only — the canned attack scenarios
  // (elevenlabs/rvc/xtts/organic-human) stay as illustrative demo content,
  // same as RecordedAnalysisPage's sample gallery. Mic mode is the one that
  // actually talks to POST /api/v1/analyze/audio.
  const [micLiveResult, setMicLiveResult] = useState<ScenarioData | null>(null);
  const [micStatus, setMicStatus] = useState<'idle' | 'listening' | 'analyzing' | 'error'>('idle');
  const [micError, setMicError] = useState<string | null>(null);
  const [thresholdAlert, setThresholdAlert] = useState(false);
  const [cloneAlarmScore, setCloneAlarmScore] = useState<number | null>(null);
  const [finalConclusion, setFinalConclusion] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<AnalyzeResponse | null>(null);
  const alarmArmedRef = useRef(true);
  const cloneAlarmThreshold = 80;

  // Audio Context for hardware mic
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const liveSocketRef = useRef<WebSocket | null>(null);
  const micLoopActiveRef = useRef(false);
  const backendSessionIdRef = useRef<string | null>(null);
  const sessionStartPromiseRef = useRef<Promise<string | null> | null>(null);
  const finalizeSentRef = useRef(false);
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const finalizeTimerRef = useRef<number | null>(null);

  const scenario = isCallActive && currentScenario === 'mic' && micLiveResult ? micLiveResult : IDLE_SCENARIO;
  const isCritical = scenario.aiVoiceScore >= 70 || scenario.scamIntentScore >= 70;
  const isSuspicious = !isCritical && (scenario.aiVoiceScore >= 40 || scenario.scamIntentScore >= 40);
  const threatLevel: 'Safe' | 'Suspicious' | 'Critical' = isCritical
    ? 'Critical'
    : isSuspicious
      ? 'Suspicious'
      : 'Safe';

  // Call timer simulation
  useEffect(() => {
    if (!isCallActive) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCallActive]);

  // Handle hardware mic
  useEffect(() => {
    if (currentScenario === 'mic' && isCallActive) {
      startMic();
    } else {
      stopMic();
    }
    return () => stopMic();
  }, [currentScenario, isCallActive]);

  const applyBackendResult = (backendResult: AnalyzeResponse) => {
    const aiScore = Math.round(backendResult.synthetic_probability * 100);
    const scamScore = Number.isFinite(backendResult.scam_score) ? backendResult.scam_score : backendResult.risk_score;
    const isCritical = backendResult.risk_level === 'CRITICAL' || backendResult.risk_level === 'HIGH';

    const audioAlerts = localStorage.getItem('voiceguardian_audio_alerts') !== 'false';
    const cloneAlarmTriggered = aiScore > cloneAlarmThreshold && alarmArmedRef.current;
    if (cloneAlarmTriggered) {
      alarmArmedRef.current = false;
      setThresholdAlert(true);
      setCloneAlarmScore(aiScore);
      if (audioAlerts) {
        try {
          const context = new AudioContext();
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.frequency.value = 880;
          gain.gain.value = 0.08;
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start();
          oscillator.stop(context.currentTime + 0.4);
        } catch {
          setMicError('Threshold crossed, but the browser blocked the audible alarm.');
        }
      }
      if ('Notification' in window && Notification.permission === 'default') {
        void Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('VoiceGuardian: cloned voice detected', {
              body: `Live call clone probability reached ${aiScore}%. Verify the caller and stop sensitive actions.`,
              tag: 'voiceguardian-clone-alert',
            });
          }
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('VoiceGuardian: cloned voice detected', {
          body: `Live call clone probability reached ${aiScore}%. Verify the caller and stop sensitive actions.`,
          tag: 'voiceguardian-clone-alert',
        });
      }
    } else if (aiScore <= cloneAlarmThreshold) {
      alarmArmedRef.current = true;
      setThresholdAlert(false);
      setCloneAlarmScore(null);
    }
    const liveAdvice = scamScore >= 80
      ? '🚨 Do NOT share OTPs, passwords, PINs, or transfer money. End the call and verify the caller through an official channel.'
      : scamScore >= 60
        ? '⚠️ Do not make payments or share sensitive information. Independently verify the caller before taking action.'
        : aiScore >= 70
          ? '⚠️ The voice shows a high synthetic probability. Verify the caller using a trusted channel before trusting requests.'
          : backendResult.risk_level === 'HIGH' || backendResult.risk_level === 'CRITICAL'
            ? '⚠️ Suspicious activity detected. Slow down and verify the caller before sharing information or taking financial action.'
            : '🟢 No strong threat detected yet. Continue normal verification and never share sensitive credentials.';

    setMicLiveResult({
      id: 'mic',
      callerName: 'Live Hardware Microphone Ingest',
      callerNumber: 'Local Audio Input',
      callType: 'mic',
      aiVoiceScore: aiScore,
      aiVoiceDescription: `Backend ML service — speaker match ${Math.round(backendResult.speaker_match_probability * 100)}%`,
      scamIntentScore: scamScore,
      scamIntentDescription: `Composite risk score from live audio segment (${backendResult.risk_level})`,
      suggestions: [
        {
          id: 'mic-sug-live',
          level: isCritical ? 'critical' : scamScore >= 40 ? 'warning' : 'safe',
          title: scamScore >= 80 ? 'STOP — High Scam Risk' : scamScore >= 60 ? 'Verify Before Acting' : aiScore >= 70 ? 'Possible Cloned Voice' : `Risk level: ${backendResult.risk_level}`,
          advice: liveAdvice,
        },
        ...backendResult.risk_factors.slice(0, 2).map((f, i) => ({
          id: `mic-sug-factor-${i}`,
          level: 'warning' as const,
          title: f,
          advice: 'Flagged by the acoustic + conversational risk engine.',
        })),
      ],
    });
  };

  const startBrowserTranscription = (socket: WebSocket) => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return false;

    try {
      const recognition = new SpeechRecognitionCtor() as BrowserSpeechRecognition;
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';
      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = event.resultIndex || 0; i < event.results.length; i += 1) {
          if (event.results[i].isFinal) text += `${event.results[i][0]?.transcript || ''} `;
        }
        text = text.trim();
        if (text && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'transcript', text }));
        }
      };
      recognition.onerror = (event: any) => {
        if (event?.error !== 'aborted' && micLoopActiveRef.current) {
          setMicError(
            `Browser speech recognition: ${event?.error || 'unavailable'}. Falling back to backend transcription.`
          );
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'transcription_mode', mode: 'whisper' }));
          }
        }
      };
      recognition.onend = () => {
        if (micLoopActiveRef.current && socket.readyState === WebSocket.OPEN) {
          try { recognition.start(); } catch { /* already restarting */ }
        }
      };
      recognition.start();
      speechRecognitionRef.current = recognition;
      return true;
    } catch {
      speechRecognitionRef.current = null;
      return false;
    }
  };

  const stopBrowserTranscription = () => {
    const recognition = speechRecognitionRef.current;
    speechRecognitionRef.current = null;
    if (recognition) {
      try { recognition.stop(); } catch { /* already stopped */ }
    }
  };

  // Live analysis uses a persistent WebSocket. Each MediaRecorder segment is a
  // complete, independently decodable audio file, so the backend can score it
  // immediately without waiting for the call to finish.
  const runMicAnalysisLoop = async (stream: MediaStream, sessionId: string) => {
    micLoopActiveRef.current = true;

    const mimeCandidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];
    const mimeType = mimeCandidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';

    const socket = createLiveAnalysisSocket(sessionId, 'en', authToken);
    liveSocketRef.current = socket;

    socket.binaryType = 'arraybuffer';

    socket.onopen = () => {
      if (!micLoopActiveRef.current) {
        socket.close(1000, 'analysis stopped');
        return;
      }
      setMicStatus('listening');
      setMicError(null);
    };

    socket.onmessage = (event) => {
      try {
        const result = JSON.parse(event.data) as AnalyzeResponse & { type?: string; error?: string };
        if (result.type === 'error') {
          setMicStatus('error');
          setMicError(result.error || 'Live analysis failed.');
          return;
        }
        if (result.type === 'final') {
          const finalMessage = result as AnalyzeResponse & { conclusion?: string };
          finalizeSentRef.current = true;
          setFinalResult(finalMessage);
          setFinalConclusion(finalMessage.conclusion || 'Call analysis complete.');
          applyBackendResult(finalMessage);
          if (backendSessionIdRef.current && authToken) {
            const sid = backendSessionIdRef.current;
            void endCallSession(sid, authToken).finally(() => {
              backendSessionIdRef.current = null;
              window.dispatchEvent(new Event('voiceguardian-history-updated'));
            });
          } else {
            window.dispatchEvent(new Event('voiceguardian-history-updated'));
          }
          setMicStatus('idle');
          return;
        }
        if (result.type === 'analysis' || result.synthetic_probability !== undefined) {
          applyBackendResult(result);
          setMicStatus('listening');
        }
      } catch {
        setMicStatus('error');
        setMicError('The live analysis service returned an invalid response.');
      }
    };

    socket.onerror = () => {
      if (micLoopActiveRef.current) {
        setMicStatus('error');
        setMicError('Could not connect to the live analysis backend.');
      }
    };

    socket.onclose = (event) => {
      liveSocketRef.current = null;
      if (micLoopActiveRef.current && event.code !== 1000) {
        setMicStatus('error');
        setMicError(`Live analysis connection closed (${event.code}).`);
      }
    };

    // Wait for the WebSocket before recording so the first chunk cannot be lost.
    try {
      await new Promise<void>((resolve, reject) => {
        if (socket.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }
        const timeout = window.setTimeout(() => reject(new Error('Live analysis connection timed out.')), 10000);
        const previousOpen = socket.onopen;
        socket.onopen = (event) => {
          window.clearTimeout(timeout);
          previousOpen?.call(socket, event);
          resolve();
        };
        const previousError = socket.onerror;
        socket.onerror = (event) => {
          window.clearTimeout(timeout);
          previousError?.call(socket, event);
          reject(new Error('Live analysis WebSocket connection failed.'));
        };
      });
    } catch (error: any) {
      if (micLoopActiveRef.current) {
        setMicStatus('error');
        setMicError(error?.message || 'Could not connect to the live analysis backend.');
      }
      socket.close();
      return;
    }

    // Chrome/Edge browser speech recognition gives us a live transcript without
    // requiring a Whisper model download. Whisper remains the backend fallback.
    const browserTranscriptEnabled = startBrowserTranscription(socket);
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'transcription_mode', mode: browserTranscriptEnabled ? 'browser' : 'whisper' }));
    }

    while (micLoopActiveRef.current && socket.readyState === WebSocket.OPEN) {
      let recorder: MediaRecorder;
      try {
        recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
      } catch {
        setMicStatus('error');
        setMicError('This browser cannot record microphone audio for live analysis.');
        break;
      }

      mediaRecorderRef.current = recorder;
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      const recordingDone = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      try {
        setMicStatus('listening');
        recorder.start();
        await new Promise((resolve) => window.setTimeout(resolve, 2000));

        if (recorder.state !== 'inactive') recorder.stop();
        await recordingDone;

        if (socket.readyState !== WebSocket.OPEN) break;

        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        if (blob.size < 1500) continue;

        setMicStatus('analyzing');
        socket.send(blob);
      } catch (error: any) {
        if (micLoopActiveRef.current) {
          setMicStatus('error');
          setMicError(error?.message || 'Could not send audio to the live analysis backend.');
        }
        break;
      } finally {
        if (mediaRecorderRef.current === recorder) mediaRecorderRef.current = null;
      }
    }

    // stopMic() owns the socket shutdown so it can request one final aggregate
    // analysis before closing the connection.
    if (micLoopActiveRef.current && socket.readyState === WebSocket.OPEN) {
      socket.close(1000, 'analysis loop ended');
    }
    if (micLoopActiveRef.current) {
      liveSocketRef.current = null;
    }
  };

  const ensureBackendSession = async (): Promise<string | null> => {
    if (backendSessionIdRef.current) return backendSessionIdRef.current;
    if (!authToken) throw new Error('You must be logged in to use live analysis.');

    if (!sessionStartPromiseRef.current) {
      sessionStartPromiseRef.current = startCallSession('en', authToken)
        .then((session: any) => {
          const id = session?.session_id || null;
          backendSessionIdRef.current = id;
          return id;
        })
        .finally(() => {
          sessionStartPromiseRef.current = null;
        });
    }

    return sessionStartPromiseRef.current;
  };

  const startMic = async () => {
    try {
      finalizeSentRef.current = false;
      setFinalConclusion(null);
      setFinalResult(null);
      setMicLiveResult(null);
      backendSessionIdRef.current = null;
      if (!authToken) {
        setMicStatus('error');
        setMicError('Please log in before starting live analysis.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;
      setMicError(null);

      const sessionId = await ensureBackendSession();
      if (!sessionId) throw new Error('Could not create a live call session.');

      void runMicAnalysisLoop(stream, sessionId);
    } catch (error: any) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setMicStatus('error');
      setMicError(error?.message || 'Microphone access was denied or unavailable.');
    }
  };

  const stopMic = () => {
    micLoopActiveRef.current = false;
    stopBrowserTranscription();

    const socket = liveSocketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN && !finalizeSentRef.current) {
      // Let SpeechRecognition deliver any final phrase before the aggregate.
      if (finalizeTimerRef.current) window.clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = window.setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN || finalizeSentRef.current) return;
        try {
          finalizeSentRef.current = true;
          setMicStatus('analyzing');
          socket.send(JSON.stringify({ type: 'finalize' }));
          finalizeTimerRef.current = window.setTimeout(() => {
            if (liveSocketRef.current === socket) {
              try { socket.close(1000, 'final analysis complete'); } catch { }
              liveSocketRef.current = null;
            }
          }, 30000);
        } catch {
          try { socket.close(1000, 'analysis stopped'); } catch { }
          liveSocketRef.current = null;
        }
      }, 1200);
    }
    // IMPORTANT: stopMic can be called twice by React effects. If finalization
    // was already requested, do not close the socket; wait for the final result.
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch { }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { });
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    if (!finalizeSentRef.current) setMicStatus('idle');
    // Keep the last live result visible after the call ends so the final
    // conclusion modal can summarize the completed call. A new call clears it.
    setThresholdAlert(false);
    setCloneAlarmScore(null);
    alarmArmedRef.current = true;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyAdvice = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadFinalReport = () => {
    if (!finalResult) return;
    const report = [
      'VOICEGUARDIAN — LIVE CALL ANALYSIS REPORT',
      '=========================================',
      `Conclusion: ${finalConclusion || 'Call analysis complete.'}`,
      `Session ID: ${finalResult.session_id}`,
      `Risk level: ${finalResult.risk_level}`,
      `Overall risk: ${finalResult.risk_score}/100`,
      `AI / Clone probability: ${Math.round(finalResult.ai_voice_percent)}%`,
      `Scam likelihood: ${finalResult.scam_score}%`,
      `Suggestion: ${finalResult.suggestion}`,
      `Risk factors: ${(finalResult.risk_factors || []).join('; ') || 'None'}`,
      '',
      'Transcript:',
      (finalResult as any).transcript || 'Transcript unavailable',
    ].join('\n');
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voiceguardian-call-report-${finalResult.session_id}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#05080c] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden selection:bg-teal-500/30 selection:text-teal-200">
      <PageBackground variant="live" />

      {showStartConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="start-live-title">
          <div className="w-full max-w-md rounded-2xl border border-teal-500/40 bg-[#0a1117] p-6 shadow-[0_0_50px_rgba(45,212,191,0.2)]">
            <div className="flex items-start gap-3">
              <Radio className="h-6 w-6 text-teal-400" />
              <div><h2 id="start-live-title" className="text-lg font-bold text-white">Start Live Analysis?</h2><p className="mt-2 text-sm text-slate-400">VoiceGuardian will request microphone access and analyze real audio samples from this device.</p></div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowStartConfirmation(false)} className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-slate-500 hover:text-white">No</button>
              <button type="button" onClick={() => { setShowStartConfirmation(false); setCurrentScenario('mic'); setCallDuration(0); setIsCallActive(true); }} className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:from-teal-400 hover:to-cyan-400 active:scale-[0.98]">Yes, start analysis</button>
            </div>
          </div>
        </div>
      )}

      {thresholdAlert && currentScenario === 'mic' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="clone-alarm-title">
          <div className="w-full max-w-lg rounded-2xl border border-rose-500/70 bg-[#120b12] p-6 shadow-[0_0_60px_rgba(244,63,94,0.35)]">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-rose-500/15 p-3 text-rose-300">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-rose-300">Critical live call alert</p>
                <h2 id="clone-alarm-title" className="mt-1 text-xl font-bold text-white">Likely cloned voice detected</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  The live voice clone probability reached <strong className="text-rose-300">{cloneAlarmScore ?? 81}%</strong>, above the 80% safety threshold.
                  Do not share credentials, approve payments, or follow urgent instructions.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => setIsCallActive(false)} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500">End call</button>
              <button type="button" onClick={() => { setThresholdAlert(false); setCloneAlarmScore(null); }} className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/20">Dismiss alert</button>
              <button type="button" onClick={() => handleCopyAdvice('clone-alarm', `VoiceGuardian clone probability: ${cloneAlarmScore ?? 81}%`)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">Copy incident</button>
            </div>
          </div>
        </div>
      )}

      {finalConclusion && finalResult && !isCallActive && currentScenario === 'mic' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="final-analysis-title">
          <div className="w-full max-w-xl rounded-2xl border border-teal-500/40 bg-[#0a1117] p-6 shadow-[0_0_60px_rgba(45,212,191,0.18)]">
            <div className="flex items-start gap-4">
              <div className={`rounded-full p-3 ${finalResult.risk_level === 'CRITICAL' || finalResult.risk_level === 'HIGH' ? 'bg-rose-500/15 text-rose-300' : finalResult.risk_level === 'MEDIUM' ? 'bg-amber-500/15 text-amber-300' : 'bg-teal-500/15 text-teal-300'}`}>
                {finalResult.risk_level === 'CRITICAL' || finalResult.risk_level === 'HIGH' ? <ShieldAlert className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-teal-300">Final call analysis</p>
                <h2 id="final-analysis-title" className="mt-1 text-2xl font-bold text-white">{finalConclusion}</h2>
                <p className="mt-2 text-sm text-slate-400">The call has ended. This conclusion combines the voice-clone model with the accumulated conversational scam analysis.</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={`rounded-xl border p-4 ${finalResult.ai_voice_percent >= 70 ? 'border-rose-500/40 bg-rose-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
                <p className="text-[10px] font-mono uppercase text-slate-500">Voice authenticity</p>
                <p className="mt-1 text-lg font-extrabold text-white">{finalResult.ai_voice_percent >= 70 ? 'CLONED / SYNTHETIC LIKELY' : 'NOT STRONGLY CLONED'}</p>
                <p className="mt-1 text-xs text-slate-400">Based on the acoustic AI-voice probability.</p>
              </div>
              <div className={`rounded-xl border p-4 ${finalResult.scam_score >= 70 ? 'border-rose-500/40 bg-rose-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
                <p className="text-[10px] font-mono uppercase text-slate-500">Conversation safety</p>
                <p className="mt-1 text-lg font-extrabold text-white">{finalResult.scam_score >= 70 ? 'SCAM LIKELY' : 'NO STRONG SCAM SIGNAL'}</p>
                <p className="mt-1 text-xs text-slate-400">Based on the accumulated transcript and scam indicators.</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-[10px] font-mono uppercase text-slate-500">AI / Clone</p>
                <p className="mt-1 text-2xl font-extrabold text-rose-300">{Math.round(finalResult.ai_voice_percent)}%</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-[10px] font-mono uppercase text-slate-500">Scam likelihood</p>
                <p className="mt-1 text-2xl font-extrabold text-amber-300">{finalResult.scam_score}%</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-[10px] font-mono uppercase text-slate-500">Overall risk</p>
                <p className="mt-1 text-2xl font-extrabold text-white">{finalResult.risk_score}/100</p>
              </div>
            </div>

            {finalResult.risk_factors.length > 0 && (
              <div className="mt-5 rounded-xl border border-slate-800 bg-[#06090e] p-4">
                <p className="text-xs font-bold text-slate-200">Why it was flagged</p>
                <ul className="mt-2 space-y-1.5">
                  {finalResult.risk_factors.map((factor) => <li key={factor} className="text-xs text-slate-400">• {factor}</li>)}
                </ul>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={downloadFinalReport} className="rounded-xl border border-teal-500/40 bg-teal-500/10 px-4 py-2.5 text-xs font-mono font-bold text-teal-300 hover:bg-teal-500/20">Download report</button>
              <button type="button" onClick={() => handleCopyAdvice('final-analysis', `${finalConclusion} | AI/Clone: ${Math.round(finalResult.ai_voice_percent)}% | Scam: ${finalResult.scam_score}% | Risk: ${finalResult.risk_score}/100`)} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-mono font-bold text-slate-200 hover:bg-slate-800">
                {copiedId === 'final-analysis' ? 'Copied' : 'Copy conclusion'}
              </button>
              <button type="button" onClick={() => { setFinalConclusion(null); setFinalResult(null); }} className="rounded-xl bg-teal-500 px-5 py-2.5 text-xs font-mono font-bold text-slate-950 hover:bg-teal-400">Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== UNIVERSAL APP SIDEBAR ===================== */}
      <AppSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="live-analysis"
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

      {/* ===================== CLEAN, UNCLUSTERED HEADER ===================== */}
      <header className="relative z-20 border-b border-slate-800/80 bg-[#070b10]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Sidebar Toggle Button */}
          <button
            type="button"
            id="live-analysis-sidebar-toggle-btn"
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

          {/* Caller Identity */}
          <div className="flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isCallActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-['Space_Grotesk']">
                  {scenario.callerName}
                </span>
                <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                  ({scenario.callerNumber})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Call Controls */}
        <div className="flex items-center gap-3">
          {/* Call Duration */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
            {isCallActive ? (
              <span className="flex items-center gap-1.5">
                <span className="text-slate-500">Duration:</span>
                <span className="font-semibold text-emerald-400">{formatTime(callDuration)}</span>
              </span>
            ) : (
              <span className="text-rose-400 font-semibold">Call Ended</span>
            )}
          </div>

          {/* End / Sever Call Button */}
          {isCallActive ? (
            <button
              type="button"
              onClick={() => setIsCallActive(false)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Call</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowStartConfirmation(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-slate-950 text-xs font-mono font-bold transition-all cursor-pointer shadow-[0_0_18px_rgba(45,212,191,0.2)]"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Activate Live Analysis</span>
            </button>
          )}
        </div>
      </header>

      {/* ===================== CALL SCENARIO SWITCHER (CLEAN & SUBTLE) ===================== */}
      <div className="relative z-10 border-b border-slate-800/50 bg-[#06090d]/60 px-4 sm:px-8 py-4">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Live microphone channel</span><p className="mt-1 text-xs text-slate-500">Only backend results from an activated microphone session appear here.</p></div>
          {!isCallActive && <button type="button" onClick={() => setShowStartConfirmation(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:from-cyan-400 hover:to-teal-400 active:scale-[0.98] sm:w-auto"><Mic className="h-4 w-4" />Activate / Start</button>}
        </div>
      </div>

      {/* ===================== MAIN UNCLUSTERED WORKSPACE ===================== */}
      {/* Exactly: Waveform Pitch Animation + Two Scores /100 + One Column for Live Suggestions */}
      <main className="relative z-10 flex-1 max-w-[1360px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start">
        {/* ===================== LEFT: THE TWO SCORES + THE ONE WAVEFORM ANIMATION ===================== */}
        <div className="flex-1 w-full flex flex-col gap-6">
          {/* ===================== THE TWO SCORES OUT OF 100 ===================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SCORE 1: AI VOICE SCORE */}
            <div className="p-5 rounded-2xl bg-[#080d13] border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/70">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Score 1 of 2
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${scenario.aiVoiceScore >= 70
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : scenario.aiVoiceScore >= 40
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                    }`}
                >
                  {scenario.aiVoiceScore >= 70
                    ? 'Synthetic Clone'
                    : scenario.aiVoiceScore >= 40
                      ? 'Suspicious Pitch'
                      : 'Natural Voice'}
                </span>
              </div>

              <div className="my-4 flex items-baseline gap-2">
                <span
                  className={`text-4xl sm:text-5xl font-extrabold font-['Space_Grotesk'] tracking-tight ${scenario.aiVoiceScore >= 70
                    ? 'text-rose-400'
                    : scenario.aiVoiceScore >= 40
                      ? 'text-amber-400'
                      : 'text-teal-400'
                    }`}
                >
                  {scenario.aiVoiceScore}
                </span>
                <span className="text-sm font-mono text-slate-500 uppercase">/ 100</span>
                <span className="ml-auto text-xs font-mono text-slate-400 font-medium">
                  AI Voice Score
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${scenario.aiVoiceScore >= 70
                    ? 'bg-rose-500'
                    : scenario.aiVoiceScore >= 40
                      ? 'bg-amber-500'
                      : 'bg-teal-400'
                    }`}
                  style={{ width: `${scenario.aiVoiceScore}%` }}
                />
              </div>

              <p className="text-xs text-slate-400 font-mono mt-1">
                {scenario.aiVoiceDescription}
              </p>
            </div>

            {/* SCORE 2: SCAM INTENT SCORE */}
            <div className="p-5 rounded-2xl bg-[#080d13] border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/70">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Score 2 of 2
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${scenario.scamIntentScore >= 70
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : scenario.scamIntentScore >= 40
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                    }`}
                >
                  {scenario.scamIntentScore >= 70
                    ? 'High-Risk Scam'
                    : scenario.scamIntentScore >= 40
                      ? 'Suspicious Intent'
                      : 'Benign Call'}
                </span>
              </div>

              <div className="my-4 flex items-baseline gap-2">
                <span
                  className={`text-4xl sm:text-5xl font-extrabold font-['Space_Grotesk'] tracking-tight ${scenario.scamIntentScore >= 70
                    ? 'text-rose-400'
                    : scenario.scamIntentScore >= 40
                      ? 'text-amber-400'
                      : 'text-teal-400'
                    }`}
                >
                  {scenario.scamIntentScore}
                </span>
                <span className="text-sm font-mono text-slate-500 uppercase">/ 100</span>
                <span className="ml-auto text-xs font-mono text-slate-400 font-medium">
                  Scam Intent Score
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${scenario.scamIntentScore >= 70
                    ? 'bg-rose-500'
                    : scenario.scamIntentScore >= 40
                      ? 'bg-amber-500'
                      : 'bg-teal-400'
                    }`}
                  style={{ width: `${scenario.scamIntentScore}%` }}
                />
              </div>

              <p className="text-xs text-slate-400 font-mono mt-1">
                {scenario.scamIntentDescription}
              </p>
            </div>
          </div>

          {/* ===================== THE ONE WAVEFORM PITCH ANIMATION ===================== */}
          <CallerPitchWaveform
            analyserNode={analyserRef.current}
            isActive={isCallActive}
            threatLevel={threatLevel}
            aiVoiceScore={scenario.aiVoiceScore}
          />

          {currentScenario === 'mic' && (
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono border ${micStatus === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : micStatus === 'analyzing'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${micStatus === 'error' ? 'bg-rose-400' : micStatus === 'analyzing' ? 'bg-amber-400 animate-pulse' : 'bg-teal-400 animate-pulse'
                  }`}
              />
              <span>
                {micStatus === 'error'
                  ? micError || 'Microphone error'
                  : micStatus === 'analyzing'
                    ? 'Sending audio segment to the analysis backend…'
                    : micStatus === 'listening'
                      ? 'Listening — streaming 2s audio segments for continuous scoring'
                      : 'Microphone idle'}
              </span>
            </div>
          )}
          {thresholdAlert && currentScenario === 'mic' && (
            <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-rose-500/15 border border-rose-500/60 text-rose-200 text-sm font-semibold shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <span>Clone detection threshold crossed. Review the live risk result.</span>
            </div>
          )}
        </div>

        {/* ===================== RIGHT: THE ONE COLUMN FOR LIVE SUGGESTIONS ===================== */}
        <aside className="w-full lg:w-[420px] shrink-0 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-[#080d13] border border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col">
            {/* Header of Live Suggestions */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold font-['Space_Grotesk'] text-white">
                    Live Suggestions
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400">
                    Real-time guidance for this call
                  </p>
                </div>
              </div>

              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Active</span>
              </span>
            </div>

            {/* List of Suggestions */}
            <div className="mt-4 space-y-3">
              {scenario.suggestions.map((sug) => {
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

            {/* Quick Emergency Action */}
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setIsCallActive(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 text-slate-300 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>Sever Call Immediately</span>
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* Consistent Professional Footer */}
      <Footer />
    </div>
  );
};
