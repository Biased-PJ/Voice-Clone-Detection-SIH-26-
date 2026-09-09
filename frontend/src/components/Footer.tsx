import React, { useState } from 'react';
import { ShieldCheck, Lock, Activity, X } from 'lucide-react';

export const Footer: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | 'compliance' | null>(null);

  return (
    <>
      <footer className="relative z-10 w-full mt-12 pt-8 pb-10 border-t border-slate-800/80 bg-[#05090d]/95 backdrop-blur-md text-slate-400 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col gap-6">
          {/* Top Row: Brand, Telemetry & Status Badges */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="text-[#22d3ee] text-sm leading-none drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                ◆
              </span>
              <span className="font-['Space_Grotesk'] font-bold text-sm text-[#2dd4bf] tracking-widest uppercase">
                TEAM ROCKET
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                Voice Threat Intelligence & Acoustic Forensics
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-[11px]">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold">NODE US-EAST-01 ACTIVE</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span>18ms SIP Latency</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                <Lock className="w-3 h-3 text-teal-400" />
                <span>SHA-256 Tamper Sealed</span>
              </div>
            </div>
          </div>

          {/* Middle Row: Description & Navigation Links */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
            <p className="text-slate-400 max-w-2xl leading-relaxed text-[11.5px]">
              Voice Guardian by Team Rocket delivers real-time voice clone detection, neural vocoder analysis, and social-engineering defense with verifiable cryptographic evidence.
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11.5px]">
              <button
                type="button"
                onClick={() => setActiveModal('compliance')}
                className="hover:text-cyan-300 transition-colors cursor-pointer"
              >
                Security & Compliance
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('terms')}
                className="hover:text-teal-300 transition-colors cursor-pointer"
              >
                Terms of Use
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('privacy')}
                className="hover:text-teal-300 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
            </div>
          </div>

          {/* Bottom Row: Disclaimer & Copyright */}
          <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10.5px] font-mono text-slate-400">
            <span>© 2026 Team Rocket. All rights reserved.</span>
            <span>Location shown may be inaccurate and is intended for reference only.</span>
          </div>
        </div>
      </footer>

      {/* Modal Dialog for Terms, Privacy, Compliance */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border bg-[#0d161d] border-slate-800 text-slate-200 shadow-[0_25px_60px_rgba(0,0,0,0.85)] relative">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                {activeModal === 'terms' && 'Terms of Use'}
                {activeModal === 'privacy' && 'Privacy & Data Governance'}
                {activeModal === 'compliance' && 'Security & Forensic Compliance'}
              </h3>
            </div>

            <div className="text-xs space-y-3 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed text-slate-300 font-mono">
              {activeModal === 'terms' && (
                <>
                  <p>
                    Voice Guardian provides real-time acoustic forensics and synthetic voice clone detection. By uploading or streaming audio, you certify you have legal authorization to analyze the telephony metadata and voice biometrics.
                  </p>
                  <p>
                    Authenticated users have their risk evaluations stored securely in their account audit log. Guest analysis results are evaluated ephemerally in-memory and discarded upon session completion.
                  </p>
                </>
              )}

              {activeModal === 'privacy' && (
                <>
                  <p>
                    Your voice data and biometric privacy are protected under strict enterprise standards. Uploaded audio is processed purely to extract acoustic features (spectral centroid, micro-jitter, vocoder artifacts) and semantic threat cues.
                  </p>
                  <p>
                    Audio files are never sold, exposed to third parties, or used for training commercial foundation speech models.
                  </p>
                </>
              )}

              {activeModal === 'compliance' && (
                <>
                  <p>
                    <strong>FIPS-140-2 Compatible:</strong> Cryptographic SHA-256 hashes seal every analysis output to guarantee forensic chain-of-custody for enterprise fraud reporting.
                  </p>
                  <p>
                    <strong>Geographic Telemetry Notice:</strong> Location shown may be inaccurate and is intended for reference only. Carrier trunks are geocoded based on SIP signaling points and public telecom circle boundaries.
                  </p>
                  <p>
                    <strong>Zero Model Retention:</strong> Transient raw audio buffers are purged post-feature extraction; only the mathematical acoustic signature and conversational risk indicators are retained for audit history.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold font-mono transition-colors shadow-sm cursor-pointer bg-teal-400 text-slate-950 hover:bg-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.3)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
