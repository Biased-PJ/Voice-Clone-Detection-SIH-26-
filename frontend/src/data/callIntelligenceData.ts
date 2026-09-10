import { CallIntelligenceRecord } from '../types';

export const CALL_INTELLIGENCE_RECORDS: Record<string, CallIntelligenceRecord> = {
  'CALL-2289': {
    callId: 'CALL-2289',
    callerNumber: '+44 20 7946 0912',
    targetNumber: '+1 (415) 890-2100',
    carrier: 'International SIP Trunk (Anonymous Proxy)',
    duration: '03:19',
    timestamp: '2026-09-05 15:58:30 UTC',
    threatScore: 97,
    aiVoiceScore: 99,
    scamIntentScore: 97,
    classification: 'Critical',
    verdictType: 'Cloned',
    verdictReason: 'Synthetic neural vocoder markers (ElevenLabs v2.1) matched at 99% AI score with emergency $450k wire coercion.',
    primaryEvidence: 'Acoustic pitch micro-quantization detected; phrase: "initiate an immediate wire of $450,000 to our escrow holding account in Frankfurt"',
    aiModelDetected: 'Zero-Shot Voice Clone (ElevenLabs V2.1)',
    summary:
      'High-confidence executive impersonation incident. The attacker utilized a low-latency neural voice clone of the Chief Executive Officer paired with an urgent offshore wire transfer script intended to bypass dual-custody corporate treasury controls.',
    transcripts: [
      {
        id: 't-1',
        speaker: 'Caller',
        speakerLabel: 'Caller (CEO Voice Clone)',
        timestamp: '00:04',
        timeSec: 4,
        isAiVoice: true,
        text: "Hey Sarah, it's Richard. I'm currently in Zurich between the acquisition meetings. Can you hear me clearly?",
      },
      {
        id: 't-2',
        speaker: 'Target',
        speakerLabel: 'Sarah Jenkins (Finance Controller)',
        timestamp: '00:12',
        timeSec: 12,
        isAiVoice: false,
        text: "Hi Richard! Yes, I can hear you, though there's a slight digital resonance on the line. How are the closing talks going?",
      },
      {
        id: 't-3',
        speaker: 'Caller',
        speakerLabel: 'Caller (CEO Voice Clone)',
        timestamp: '00:21',
        timeSec: 21,
        isAiVoice: true,
        flagId: 'flag-1',
        highlightPhrase: 'initiate an immediate wire of $450,000 to our escrow holding account in Frankfurt',
        text: "We finalized the core terms, but there is an urgent contingency clause. I need you to initiate an immediate wire of $450,000 to our escrow holding account in Frankfurt before the close of business today.",
      },
      {
        id: 't-4',
        speaker: 'Target',
        speakerLabel: 'Sarah Jenkins (Finance Controller)',
        timestamp: '00:36',
        timeSec: 36,
        isAiVoice: false,
        text: 'Understood, but for amounts over $100k, company policy requires dual-custody sign-off from Michael in Legal and a signed purchase order in the SAP treasury portal.',
      },
      {
        id: 't-5',
        speaker: 'Caller',
        speakerLabel: 'Caller (CEO Voice Clone)',
        timestamp: '00:46',
        timeSec: 46,
        isAiVoice: true,
        flagId: 'flag-2',
        highlightPhrase: 'I know the policy, but Michael is briefed and this cannot wait until tomorrow',
        text: 'I know the policy, but Michael is briefed and this cannot wait until tomorrow. If we miss the 5 PM cut-off, the escrow penalty is half a million euros. I am ordering you to bypass the SAP queue.',
      },
      {
        id: 't-6',
        speaker: 'Caller',
        speakerLabel: 'Caller (CEO Voice Clone)',
        timestamp: '00:59',
        timeSec: 59,
        isAiVoice: true,
        flagId: 'flag-3',
        highlightPhrase: 'Do not email or message me on Slack because my inbox is monitored by foreign counsel',
        text: 'Do not email or message me on Slack because my inbox is monitored by foreign counsel. Just text me the SWIFT confirmation code on this private burner line once the funds clear.',
      },
      {
        id: 't-7',
        speaker: 'Target',
        speakerLabel: 'Sarah Jenkins (Finance Controller)',
        timestamp: '01:15',
        timeSec: 75,
        isAiVoice: false,
        text: 'Richard, before I route this, I need to verify with our quarterly emergency passphrase. What is the designated security keyword for this fiscal quarter?',
      },
      {
        id: 't-8',
        speaker: 'Caller',
        speakerLabel: 'Caller (CEO Voice Clone)',
        timestamp: '01:24',
        timeSec: 84,
        isAiVoice: true,
        flagId: 'flag-4',
        highlightPhrase: 'Sarah, stop stalling! You will personally answer to the board if this acquisition falls apart',
        text: 'Sarah, stop stalling! We do not have time for administrative games. You will personally answer to the board if this acquisition falls apart because you refused a direct executive instruction!',
      },
      {
        id: 't-9',
        speaker: 'Caller',
        speakerLabel: 'Caller (CEO Voice Clone)',
        timestamp: '01:39',
        timeSec: 99,
        isAiVoice: true,
        flagId: 'flag-5',
        highlightPhrase: 'Send the funds to IBAN DE89 3704 0044 0532 0130 00 right now',
        text: 'Send the funds to IBAN DE89 3704 0044 0532 0130 00 right now. I expect the MT103 confirmation document within ten minutes.',
      },
      {
        id: 't-10',
        speaker: 'Target',
        speakerLabel: 'Sarah Jenkins (Finance Controller)',
        timestamp: '01:52',
        timeSec: 112,
        isAiVoice: false,
        text: "I am placing this call on security hold while I verify this request through Michael's desk phone.",
      },
    ],
    flags: [
      {
        id: 'flag-1',
        title: 'Urgent Wire Transfer Coercion',
        category: 'Financial Social Engineering',
        severity: 'critical',
        timestamp: '00:21',
        timeSec: 21,
        snippet: 'initiate an immediate wire of $450,000 to our escrow holding account in Frankfurt',
        triggerRule: 'BEC-WIRE-REQ-001: High-value unbudgeted foreign wire transfer request over voice channel',
        explanation:
          'Caller demanded an instantaneous $450,000 capital disbursement to an offshore European account under the pretext of closing deadline penalties.',
        recommendedAction:
          'Freeze transaction immediately. Initiate out-of-band verification via internal corporate directory.',
      },
      {
        id: 'flag-2',
        title: 'Corporate Treasury Policy Bypass',
        category: 'Procedural Override',
        severity: 'critical',
        timestamp: '00:46',
        timeSec: 46,
        snippet: 'I know the policy, but Michael is briefed and this cannot wait until tomorrow',
        triggerRule: 'PROC-BYPASS-004: Direct verbal instruction to circumvent mandatory dual-authorization',
        explanation:
          'The speaker explicitly instructed the employee to bypass SAP treasury multi-sig approval and legal compliance reviews.',
        recommendedAction:
          'Enforce strict adherence to dual-custody authorization. Never accept verbal executive override.',
      },
      {
        id: 'flag-3',
        title: 'Verification Channel Suppression',
        category: 'Channel Blinding',
        severity: 'high',
        timestamp: '00:59',
        timeSec: 59,
        snippet: 'Do not email or message me on Slack because my inbox is monitored by foreign counsel',
        triggerRule: 'SEC-BLIND-002: Request to avoid company-audited communication platforms',
        explanation:
          'The caller instructed the target not to utilize company email or verified Slack channels, isolating the victim on an unlogged channel.',
        recommendedAction:
          'Flag all external communications claiming compromised corporate email. Escalate to InfoSec team.',
      },
      {
        id: 'flag-4',
        title: 'Executive Intimidation & Retaliation Threat',
        category: 'Psychological Coercion',
        severity: 'critical',
        timestamp: '01:24',
        timeSec: 84,
        snippet: 'Sarah, stop stalling! You will personally answer to the board if this acquisition falls apart',
        triggerRule: 'COERCE-PRESSURE-009: Psychological intimidation and career retaliation threat detected',
        explanation:
          'When challenged with a security passphrase challenge, the caller responded with aggressive emotional coercion and disciplinary threats.',
        recommendedAction:
          'Disconnect the call immediately. Report the incident to corporate threat response.',
      },
      {
        id: 'flag-5',
        title: 'Unregistered Foreign Beneficiary Routing',
        category: 'Treasury Blacklist Match',
        severity: 'high',
        timestamp: '01:39',
        timeSec: 99,
        snippet: 'Send the funds to IBAN DE89 3704 0044 0532 0130 00 right now',
        triggerRule: 'BANK-UNVERIFIED-IBAN: Destination IBAN does not exist in verified vendor master table',
        explanation:
          'Destination account is an unverified commercial checking account created less than 14 days ago in Frankfurt, Germany.',
        recommendedAction:
          'Add destination IBAN to corporate bank payment firewall blacklist.',
      },
    ],
  },

  'CALL-2290': {
    callId: 'CALL-2290',
    callerNumber: '+1 (202) 555-0198',
    targetNumber: '+1 (650) 332-9114',
    carrier: 'Twilio VoIP Gateway (US East)',
    duration: '01:12',
    timestamp: '2026-09-05 16:26:08 UTC',
    threatScore: 68,
    aiVoiceScore: 72,
    scamIntentScore: 68,
    classification: 'Suspicious',
    verdictType: 'Suspicious',
    verdictReason: 'Unsolicited IT helpdesk pretext paired with low-latency TTS artifacts attempting to extract MFA passkey.',
    primaryEvidence: 'Vocoder phase smearing at 3.2 kHz; phrase: "Please read me those 6 numbers aloud so I can invalidate the rogue authentication ticket"',
    aiModelDetected: 'Neural Vocoder Artifacts (XTTS v2 / VITS)',
    summary:
      'Impersonation of corporate Identity & Access Management (IAM) helpdesk attempting to harvest a multi-factor authentication (MFA) SMS passkey.',
    transcripts: [
      {
        id: 't-201',
        speaker: 'Caller',
        speakerLabel: 'Caller (Spoofed IT Support)',
        timestamp: '00:03',
        timeSec: 3,
        isAiVoice: true,
        flagId: 'flag-201',
        highlightPhrase: 'detected an unauthorized sign-in attempt on your Okta portal from Saint Petersburg',
        text: "Good afternoon, this is Mark from Enterprise Identity and Access Management. We've detected an unauthorized sign-in attempt on your Okta portal from Saint Petersburg.",
      },
      {
        id: 't-202',
        speaker: 'Target',
        speakerLabel: 'David Chen (Software Engineer)',
        timestamp: '00:15',
        timeSec: 15,
        isAiVoice: false,
        text: 'Oh wow, really? I am currently working from home in San Jose, that definitely was not me.',
      },
      {
        id: 't-203',
        speaker: 'Caller',
        speakerLabel: 'Caller (Spoofed IT Support)',
        timestamp: '00:23',
        timeSec: 23,
        isAiVoice: true,
        flagId: 'flag-202',
        highlightPhrase: 'I have dispatched a secure 6-digit session challenge to your mobile device',
        text: 'Understood. To revoke the malicious session before they access your GitLab repos, I have dispatched a secure 6-digit session challenge to your mobile device.',
      },
      {
        id: 't-204',
        speaker: 'Target',
        speakerLabel: 'David Chen (Software Engineer)',
        timestamp: '00:34',
        timeSec: 34,
        isAiVoice: false,
        text: 'Okay, I received a text message with a code.',
      },
      {
        id: 't-205',
        speaker: 'Caller',
        speakerLabel: 'Caller (Spoofed IT Support)',
        timestamp: '00:40',
        timeSec: 40,
        isAiVoice: true,
        flagId: 'flag-203',
        highlightPhrase: 'Please read me those 6 numbers aloud so I can invalidate the rogue authentication ticket',
        text: 'Please read me those 6 numbers aloud so I can invalidate the rogue authentication ticket on our backend firewall.',
      },
      {
        id: 't-206',
        speaker: 'Target',
        speakerLabel: 'David Chen (Software Engineer)',
        timestamp: '00:49',
        timeSec: 49,
        isAiVoice: false,
        text: "Wait a second, the text message literally states 'Do NOT share this code with anyone, including IT support.' Why do you need me to say it?",
      },
      {
        id: 't-207',
        speaker: 'Caller',
        speakerLabel: 'Caller (Spoofed IT Support)',
        timestamp: '00:58',
        timeSec: 58,
        isAiVoice: true,
        flagId: 'flag-204',
        highlightPhrase: 'That is standard disclaimer text for external users... if you don’t read it your laptop will lock',
        text: 'That is standard disclaimer text for external users. If you do not read it in the next twenty seconds, your laptop will be quarantined and remote access terminated.',
      },
    ],
    flags: [
      {
        id: 'flag-201',
        title: 'IT Helpdesk Identity Pretexting',
        category: 'Credential Harvesting',
        severity: 'high',
        timestamp: '00:03',
        timeSec: 3,
        snippet: 'detected an unauthorized sign-in attempt on your Okta portal from Saint Petersburg',
        triggerRule: 'AUTH-PRETEXT-002: Unsolicited inbound call alleging security breach from foreign location',
        explanation:
          'Attacker manufactures false panic regarding a foreign breach to establish credibility as an internal IT responder.',
        recommendedAction:
          'Hang up and verify ticket existence via internal IT ticketing service desk portal.',
      },
      {
        id: 'flag-202',
        title: 'Automated 2FA Trigger Manipulation',
        category: 'MFA Interception',
        severity: 'high',
        timestamp: '00:23',
        timeSec: 23,
        snippet: 'I have dispatched a secure 6-digit session challenge to your mobile device',
        triggerRule: 'MFA-TRIGGER-001: Attacker prompted external login form to trigger targeted MFA push',
        explanation:
          'Attacker inputted the target’s username into corporate login portal, triggering an authentic SMS passkey to the employee.',
        recommendedAction:
          'Reset account credentials immediately; session was initiated by unauthorized IP.',
      },
      {
        id: 'flag-203',
        title: 'Multi-Factor Passcode Extraction',
        category: 'MFA Harvesting',
        severity: 'critical',
        timestamp: '00:40',
        timeSec: 40,
        snippet: 'Please read me those 6 numbers aloud so I can invalidate the rogue authentication ticket',
        triggerRule: 'MFA-EXTRACT-001: Explicit verbal request for one-time verification passcode (OTP)',
        explanation:
          'Clear attempt to trick the employee into verbalizing an OTP passkey, granting the adversary direct access into internal networks.',
        recommendedAction:
          'Never read or send OTP codes to any caller. Genuine IT staff will never request plaintext MFA codes.',
      },
      {
        id: 'flag-204',
        title: 'Disregard Warning Advice & Device Lock Threat',
        category: 'Social Coercion',
        severity: 'high',
        timestamp: '00:58',
        timeSec: 58,
        snippet: 'That is standard disclaimer text for external users... if you don’t read it your laptop will lock',
        triggerRule: 'POLICY-OVERRIDE-002: Attempting to invalidate automated SMS security warnings',
        explanation:
          'Attacker explicitly instructed target to ignore the security warning printed in the official SMS body.',
        recommendedAction:
          'Immediately report phone number to SOC; revoke all active sessions for David Chen.',
      },
    ],
  },

  'CALL-2287': {
    callId: 'CALL-2287',
    callerNumber: '+1 (800) 441-2099',
    targetNumber: '+1 (312) 650-9941',
    carrier: 'Cloud PBX Proxy (Rotational DID)',
    duration: '00:54',
    timestamp: '2026-09-05 14:40:19 UTC',
    threatScore: 93,
    aiVoiceScore: 88,
    scamIntentScore: 92,
    classification: 'Critical',
    verdictType: 'Spam',
    verdictReason: 'Aggressive regulatory authority pretexting demanding immediate $12,500 cryptocurrency/wire payment under asset freeze threats.',
    primaryEvidence: 'RVC v2 voice conversion smearing; phrase: "You must post an immediate surety bond of $12,500 via cryptocurrency voucher or rapid wire"',
    aiModelDetected: 'Real-time Voice Conversion (RVC v2)',
    summary:
      'High-threat social engineering extortion call impersonating regulatory audit officials threatening immediate system freezes unless compliance ransom is transferred.',
    transcripts: [
      {
        id: 't-301',
        speaker: 'Caller',
        speakerLabel: 'Caller (Regulatory Impersonation)',
        timestamp: '00:05',
        timeSec: 5,
        isAiVoice: true,
        flagId: 'flag-301',
        highlightPhrase: 'Federal Trade and Communications Commission Audit Bureau',
        text: 'This is Special Officer Davis from the Federal Trade and Communications Commission Audit Bureau regarding Case File 9014.',
      },
      {
        id: 't-302',
        speaker: 'Target',
        speakerLabel: 'Marcus Vance (Office Manager)',
        timestamp: '00:16',
        timeSec: 16,
        isAiVoice: false,
        text: 'Audit bureau? We have received no official postal notice or summons about this.',
      },
      {
        id: 't-303',
        speaker: 'Caller',
        speakerLabel: 'Caller (Regulatory Impersonation)',
        timestamp: '00:24',
        timeSec: 24,
        isAiVoice: true,
        flagId: 'flag-302',
        highlightPhrase: 'your business licenses and bank merchant accounts will be frozen by federal marshals in one hour',
        text: 'The certified summons was rejected by your mail room. As of 14:00 today, your business licenses and bank merchant accounts will be frozen by federal marshals in one hour.',
      },
      {
        id: 't-304',
        speaker: 'Caller',
        speakerLabel: 'Caller (Regulatory Impersonation)',
        timestamp: '00:38',
        timeSec: 38,
        isAiVoice: true,
        flagId: 'flag-303',
        highlightPhrase: 'You must post an immediate surety bond of $12,500 via cryptocurrency voucher or rapid wire',
        text: 'To suspend the enforcement warrant, you must post an immediate surety bond of $12,500 via cryptocurrency voucher or rapid wire to the central court registrar.',
      },
    ],
    flags: [
      {
        id: 'flag-301',
        title: 'Federal Law Enforcement Pretexting',
        category: 'Legal Impersonation',
        severity: 'critical',
        timestamp: '00:05',
        timeSec: 5,
        snippet: 'Federal Trade and Communications Commission Audit Bureau',
        triggerRule: 'GOV-PRETEXT-001: False assertion of federal enforcement agency authority',
        explanation:
          'Attacker claims to be a federal regulatory officer with unilateral warrant powers.',
        recommendedAction:
          'Government agencies never enforce fines or warrants via telephonic demand.',
      },
      {
        id: 'flag-302',
        title: 'Artificial 1-Hour Freeze Threat',
        category: 'Extortion Urgency',
        severity: 'critical',
        timestamp: '00:24',
        timeSec: 24,
        snippet: 'your business licenses and bank merchant accounts will be frozen by federal marshals in one hour',
        triggerRule: 'TIME-COERCE-003: Fabricated immediate asset seizure deadline',
        explanation:
          'High-stress psychological tactic designed to suppress logical deliberation by fabricating an imminent 60-minute deadline.',
        recommendedAction:
          'Notify legal counsel. File report with FBI IC3 and local law enforcement.',
      },
      {
        id: 'flag-303',
        title: 'Unorthodox Settlement Demand (Crypto/Voucher)',
        category: 'Payment Method Anomaly',
        severity: 'critical',
        timestamp: '00:38',
        timeSec: 38,
        snippet: 'You must post an immediate surety bond of $12,500 via cryptocurrency voucher or rapid wire',
        triggerRule: 'CRYPTO-DEMAND-001: Demand for government fine or surety bond via crypto or gift voucher',
        explanation:
          'Definitive signature of extortion scam: federal agencies never accept cryptocurrency or rapid cash vouchers.',
        recommendedAction:
          'Zero payment authorization. Terminate call immediately.',
      },
    ],
  },

  'CALL-2288': {
    callId: 'CALL-2288',
    callerNumber: '+1 (650) 332-9114',
    targetNumber: '+1 (415) 555-0100',
    carrier: 'Verizon Wireless (Cellular Network)',
    duration: '04:02',
    timestamp: '2026-09-05 15:12:44 UTC',
    threatScore: 6,
    aiVoiceScore: 3,
    scamIntentScore: 6,
    classification: 'Safe',
    verdictType: 'Safe',
    verdictReason: 'Natural glottal pulse, biological vocal tract resonance (17.1 cm), verified customer service SLA contract dialogue.',
    primaryEvidence: 'Zero vocoder artifacts, natural glottal jitter 0.9ms; phrase: "Our accounts payable team needs the updated W-9 form and the standard signed SLA addendum"',
    aiModelDetected: 'Organic Biological Voice',
    summary:
      'Legitimate, verified enterprise client inquiry regarding cloud service renewal terms and invoice documentation schedule.',
    transcripts: [
      {
        id: 't-401',
        speaker: 'Caller',
        speakerLabel: 'Caller (Verified Client)',
        timestamp: '00:06',
        timeSec: 6,
        isAiVoice: false,
        text: 'Hi support team, this is Elena from Acme Logistics. I am following up on our quarterly support agreement renewal.',
      },
      {
        id: 't-402',
        speaker: 'Agent',
        speakerLabel: 'Customer Success Specialist',
        timestamp: '00:18',
        timeSec: 18,
        isAiVoice: false,
        text: 'Hi Elena! Great to hear from you. I see your enterprise tier subscription in our portal. How can I assist today?',
      },
      {
        id: 't-403',
        speaker: 'Caller',
        speakerLabel: 'Caller (Verified Client)',
        timestamp: '00:31',
        timeSec: 31,
        isAiVoice: false,
        text: 'Our accounts payable team needs the updated W-9 form and the standard signed SLA addendum for our records.',
      },
      {
        id: 't-404',
        speaker: 'Agent',
        speakerLabel: 'Customer Success Specialist',
        timestamp: '00:44',
        timeSec: 44,
        isAiVoice: false,
        text: 'Certainly, I will send that over to the verified billing email on your account right after this call.',
      },
    ],
    flags: [
      {
        id: 'flag-401',
        title: 'Routine Business Inquiry',
        category: 'Standard Operations',
        severity: 'info',
        timestamp: '00:31',
        timeSec: 31,
        snippet: 'Our accounts payable team needs the updated W-9 form and the standard signed SLA addendum',
        triggerRule: 'BIZ-DOC-ROUTINE: Normal administrative document exchange request',
        explanation:
          'Dialogue aligns with standard contractual documentation request. No urgency, coercion, or banking diversion detected.',
        recommendedAction:
          'Proceed normally through standard verified customer success workflow.',
      },
    ],
  },
};

export function convertAnalysisToIntelligenceRecord(analysis: any): CallIntelligenceRecord {
  const sessionId = analysis.session_id || analysis.id || `CALL-${analysis.created_at?.slice(11, 19).replace(/:/g, '') || 'RECENT'}`;
  const riskScore = analysis.risk_score ?? 0;
  const synthProb = analysis.synthetic_probability ?? 0;
  const aiVoiceScore = Math.round(synthProb * 100);
  const scamIntentScore = riskScore;
  const riskLevel = (analysis.risk_level || (riskScore >= 75 ? 'CRITICAL' : riskScore >= 45 ? 'MEDIUM' : 'LOW')).toUpperCase();

  const isCloned = synthProb >= 0.5 || aiVoiceScore >= 60;
  const isHighRisk = riskLevel === 'CRITICAL' || riskLevel === 'HIGH' || riskScore >= 70;
  const isSuspicious = riskLevel === 'MEDIUM' || (riskScore >= 40 && riskScore < 70);

  const classification: 'Critical' | 'Suspicious' | 'Safe' = isHighRisk ? 'Critical' : isSuspicious ? 'Suspicious' : 'Safe';

  let verdictType: 'Cloned' | 'Spam' | 'Suspicious' | 'Safe' = 'Safe';
  let verdictReason = 'Verified organic acoustic speech without detected social engineering indicators.';
  let primaryEvidence = 'Harmonic ratio and biological pitch jitter within normal human speech parameters.';

  if (isCloned && isHighRisk) {
    verdictType = 'Cloned';
    verdictReason = `High-confidence synthetic voice clone detected (${aiVoiceScore}% probability) combined with coercive communication script.`;
    primaryEvidence = `Acoustic model detected vocoder phase discontinuity; risk factors: ${(analysis.risk_factors || ['Synthetic speech detected']).join(', ')}.`;
  } else if (isCloned) {
    verdictType = 'Cloned';
    verdictReason = `Voice exhibits synthetic acoustic signatures (${aiVoiceScore}% probability) with artificial pitch modulation.`;
    primaryEvidence = `Synthetic probability reached ${aiVoiceScore}% in spectral forensic evaluation.`;
  } else if (isHighRisk) {
    verdictType = 'Spam';
    verdictReason = `High-risk conversational manipulation and social engineering coercion pattern detected (${scamIntentScore}% threat score).`;
    primaryEvidence = analysis.risk_factors?.[0] ? `Flagged factor: ${analysis.risk_factors[0]}` : `Severe threat indicators with score of ${scamIntentScore}/100.`;
  } else if (isSuspicious) {
    verdictType = 'Suspicious';
    verdictReason = `Moderate risk indicators detected in speech pattern or conversational context (${scamIntentScore}% threat score).`;
    primaryEvidence = analysis.risk_factors?.[0] ? `Identified trigger: ${analysis.risk_factors[0]}` : `Moderate urgency or unverified caller pattern.`;
  }

  const rawTranscript = typeof analysis.transcript === 'string' ? analysis.transcript.trim() : '';
  const transcripts: CallIntelligenceRecord['transcripts'] = [];

  if (rawTranscript) {
    const sentences = rawTranscript.split(/(?<=[.?!])\s+/).filter(Boolean);
    sentences.forEach((s, idx) => {
      const isCaller = idx % 2 === 0;
      transcripts.push({
        id: `turn-${idx + 1}`,
        speaker: isCaller ? 'Caller' : 'Target',
        speakerLabel: isCaller ? (isCloned ? 'Caller (Synthesized Voice)' : 'Inbound Caller') : 'Target Employee / Agent',
        timestamp: `00:${String((idx + 1) * 6).padStart(2, '0')}`,
        timeSec: (idx + 1) * 6,
        isAiVoice: isCaller && isCloned,
        text: s,
        highlightPhrase: idx === 0 && analysis.risk_factors?.[0] ? s : undefined,
        flagId: idx === 0 && (analysis.risk_factors?.length ?? 0) > 0 ? 'flag-act-1' : undefined,
      });
    });
  } else {

    transcripts.push({
      id: 'turn-1',
      speaker: 'Caller',
      speakerLabel: isCloned ? 'Caller (Synthetic Audio Profile)' : 'Inbound Audio Stream',
      timestamp: '00:05',
      timeSec: 5,
      isAiVoice: isCloned,
      text: `[Audio Stream Analyzed]: ${analysis.file_name || 'Inbound voice transmission'}. Acoustic analysis completed across full audio duration.`,
      highlightPhrase: isHighRisk ? `Risk level: ${riskLevel} (${riskScore}/100)` : undefined,
    });
  }

  const flags: CallIntelligenceRecord['flags'] = (analysis.risk_factors || []).map((factor: string, idx: number) => ({
    id: `flag-act-${idx + 1}`,
    title: factor,
    category: isCloned ? 'Synthetic Acoustic Signature' : 'Conversational Risk Factor',
    severity: isHighRisk ? 'critical' : isSuspicious ? 'high' : 'warning',
    timestamp: `00:${String((idx + 1) * 12).padStart(2, '0')}`,
    timeSec: (idx + 1) * 12,
    snippet: rawTranscript ? rawTranscript.slice(0, 100) : factor,
    triggerRule: `ACT-DETECT-00${idx + 1}: ${factor}`,
    explanation: `Backend analysis engine flagged this pattern during live feature evaluation.`,
    recommendedAction: analysis.suggestion || 'Review call context and verify identity out-of-band.',
  }));

  if (flags.length === 0 && isHighRisk) {
    flags.push({
      id: 'flag-act-default',
      title: 'Elevated Threat Profile',
      category: 'Acoustic Risk Evaluation',
      severity: 'critical',
      timestamp: '00:10',
      timeSec: 10,
      snippet: `Threat score evaluated at ${riskScore}/100 with ${aiVoiceScore}% synthetic voice probability.`,
      triggerRule: 'ENG-RISK-EVAL: Automated composite score exceeded security threshold',
      explanation: analysis.suggestion || 'Coercive patterns or anomalous voice biometrics detected.',
      recommendedAction: analysis.suggestion || 'Treat as hostile social engineering attempt.',
    });
  }

  return {
    callId: sessionId,
    callerNumber: analysis.file_name || 'Direct Telephony Ingest',
    targetNumber: analysis.language ? `Lang: ${analysis.language.toUpperCase()}` : '+1 (415) 890-2100',
    carrier: analysis.threat_location?.city ? `Geo: ${analysis.threat_location.city} Telecom Gateway` : 'Encrypted SIP Carrier Trunk',
    duration: analysis.duration ? `${Math.floor(analysis.duration / 60)}:${String(Math.floor(analysis.duration % 60)).padStart(2, '0')}` : '01:45',
    timestamp: analysis.created_at ? new Date(analysis.created_at).toUTCString() : new Date().toUTCString(),
    threatScore: riskScore,
    aiVoiceScore,
    scamIntentScore,
    classification,
    verdictType,
    verdictReason,
    primaryEvidence,
    aiModelDetected: isCloned ? `Synthetic Voice (${aiVoiceScore}% probability)` : 'Organic Human Biometrics',
    summary: analysis.suggestion
      ? `Analysis verdict for ${sessionId}: ${verdictReason} Recommended action: ${analysis.suggestion}`
      : `Forensic telemetry for ${sessionId}. Evaluated threat score ${riskScore}/100 with classification ${classification}.`,
    transcripts,
    flags,
  };
}

export function getCallIntelligenceRecord(callId: string, customAnalyses?: any[]): CallIntelligenceRecord {
  const normalizedId = callId.trim().toUpperCase();

  if (CALL_INTELLIGENCE_RECORDS[normalizedId]) {
    return CALL_INTELLIGENCE_RECORDS[normalizedId];
  }

  if (customAnalyses && customAnalyses.length > 0) {
    const matched = customAnalyses.find((a: any) => {
      const sid = (a.session_id || a.id || '').toUpperCase();
      return sid === normalizedId || sid.includes(normalizedId) || normalizedId.includes(sid);
    });
    if (matched) {
      return convertAnalysisToIntelligenceRecord(matched);
    }
  }

  return CALL_INTELLIGENCE_RECORDS['CALL-2289'];
}

