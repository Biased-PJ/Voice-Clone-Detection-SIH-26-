import { jsPDF } from 'jspdf';
import { AudioAnalysisResult } from '../types';

export function generatePdfReport(result: AudioAnalysisResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Dark background top banner
  doc.setFillColor(8, 13, 17);
  doc.rect(0, 0, 210, 40, 'F');

  // Cyan brand accent line
  doc.setFillColor(34, 211, 238);
  doc.rect(0, 40, 210, 2, 'F');

  // Brand header text
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 212, 191);
  doc.setFontSize(16);
  doc.text('TEAM ROCKET', 15, 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(10);
  doc.text('VOICE THREAT INTELLIGENCE & FORENSICS REPORT', 15, 26);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8);
  doc.text(`Generated: ${result.analysisTimestamp}`, 15, 33);

  // Verdict box
  const isAi = result.isAiGenerated;
  if (isAi) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.rect(15, 48, 180, 26, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(13);
    doc.text('VERDICT: AI VOICE IMPERSONATION ATTACK DETECTED', 22, 58);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(153, 27, 27);
    doc.setFontSize(9);
    doc.text(
      `AI Voice Score (Frequency/Pitch): ${result.aiVoiceScore ?? result.confidenceScore}/100  |  Scam Intent Score (Content): ${result.scamIntentScore ?? result.confidenceScore}/100`,
      22,
      66
    );
  } else {
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(20, 184, 166);
    doc.rect(15, 48, 180, 26, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110);
    doc.setFontSize(13);
    doc.text('VERDICT: AUTHENTIC HUMAN VOICE VERIFIED', 22, 58);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 94, 89);
    doc.setFontSize(9);
    doc.text(
      `AI Voice Score (Frequency/Pitch): ${result.aiVoiceScore ?? 4}/100  |  Scam Intent Score (Content): ${result.scamIntentScore ?? 6}/100`,
      22,
      66
    );
  }

  // Audio Telemetry Section
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text('AUDIO STREAM METADATA', 15, 84);

  doc.setDrawColor(226, 232, 240);
  doc.line(15, 87, 195, 87);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  doc.text(`File Name: ${result.fileName}`, 15, 95);
  doc.text(`File Size: ${result.fileSize}`, 15, 102);
  doc.text(`Duration: ${result.duration} seconds`, 110, 95);
  doc.text(`Sample Rate: ${result.sampleRate} Hz`, 110, 102);

  // Acoustic DSP Forensics
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text('BIOMETRIC & SPECTRAL FORENSICS', 15, 116);
  doc.line(15, 119, 195, 119);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  doc.text(
    `Spectral Centroid: ${result.acousticMetrics.spectralCentroid} Hz`,
    15,
    127
  );
  doc.text(
    `Zero-Crossing Rate: ${result.acousticMetrics.zeroCrossingRate}`,
    15,
    134
  );
  doc.text(
    `Micro-Jitter: ${result.acousticMetrics.jitterPercent}%`,
    110,
    127
  );
  doc.text(
    `Micro-Shimmer: ${result.acousticMetrics.shimmerPercent}%`,
    110,
    134
  );

  // 5 Checkpoints
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text('5-CHECKPOINT EVALUATION MATRIX', 15, 148);
  doc.line(15, 151, 195, 151);

  let currentY = 159;
  result.checkpoints.forEach((cp, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    if (cp.status === 'failed') {
      doc.setTextColor(220, 38, 38);
      doc.text(`[FAIL] Stage ${idx + 1}: ${cp.name}`, 15, currentY);
    } else {
      doc.setTextColor(16, 149, 115);
      doc.text(`[PASS] Stage ${idx + 1}: ${cp.name}`, 15, currentY);
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8.5);
    doc.text(cp.detail, 20, currentY + 5);

    currentY += 13;
  });

  // Recommended Remediation Action
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text('INCIDENT RESPONSE & ACTION GUIDANCE', 15, currentY + 4);
  doc.line(15, currentY + 7, 195, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  const actionLines = doc.splitTextToSize(result.recommendedAction, 180);
  doc.text(actionLines, 15, currentY + 15);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'CONFIDENTIAL - FOR INTERNAL SECURITY OPERATIONS USE ONLY - TEAM ROCKET DEFENSE',
    15,
    285
  );

  const cleanName = result.fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`TeamRocket_Threat_Report_${cleanName}.pdf`);
}
