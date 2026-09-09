export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'google' | 'email';
  role?: string;
  // Authoritative admin flag, always sourced from the backend (GET /api/v1/auth/me)
  // — never derived from the client-side job-title `role` field above.
  isAdmin?: boolean;
  createdAt?: string;
}

export type StepState = 'upload' | 'analyze' | 'complete';

export interface AudioAnalysisResult {
  fileName: string;
  fileSize: string;
  duration: number;
  sampleRate: number;
  isAiGenerated: boolean;
  confidenceScore: number;
  // Two core scores (out of 100)
  aiVoiceScore: number; // 0-100 based on frequency, pitch, vocoder artifacts
  scamIntentScore: number; // 0-100 based on conversational content, urgency, social engineering
  threatCategory: string;
  recommendedAction: string;
  analysisTimestamp: string;
  acousticMetrics: {
    spectralCentroid: number;
    zeroCrossingRate: number;
    jitterPercent: number;
    shimmerPercent: number;
    harmonicToNoiseRatio: number;
    vocoderArtifactProbability: number;
  };
  checkpoints: {
    id: string;
    name: string;
    status: 'passed' | 'warning' | 'failed';
    detail: string;
  }[];
}

export interface TranscriptItem {
  id: string;
  speaker: 'Caller' | 'Agent' | 'Target' | 'Suspect';
  speakerLabel: string;
  timestamp: string;
  timeSec: number;
  text: string;
  flagId?: string;
  highlightPhrase?: string;
  isAiVoice?: boolean;
}

export interface CaughtFlag {
  id: string;
  title: string;
  category: string;
  severity: 'critical' | 'high' | 'warning' | 'info';
  timestamp: string;
  timeSec: number;
  snippet: string;
  triggerRule: string;
  explanation: string;
  recommendedAction: string;
}

export interface CallIntelligenceRecord {
  callId: string;
  callerNumber: string;
  targetNumber: string;
  carrier: string;
  duration: string;
  timestamp: string;
  threatScore: number;
  aiVoiceScore: number;
  scamIntentScore: number;
  classification: 'Critical' | 'Suspicious' | 'Safe';
  verdictType?: 'Cloned' | 'Spam' | 'Suspicious' | 'Safe';
  verdictReason?: string;
  primaryEvidence?: string;
  aiModelDetected?: string;
  summary: string;
  transcripts: TranscriptItem[];
  flags: CaughtFlag[];
}
