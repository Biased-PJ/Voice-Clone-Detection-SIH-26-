import React, { useState } from 'react';
import {
  MapPin,
  Flame,
  ArrowRight,
  Crosshair,
  AlertCircle,
} from 'lucide-react';

export type ThreatSeverity = 'Critical' | 'Suspicious';

export interface IndiaLocationThreat {
  id: string;
  name: string;
  state: string;
  xPercent: number;
  yPercent: number;
  threatCount: number;
  criticalCount: number;
  suspiciousCount: number;
  severity: ThreatSeverity;
  primaryVector: string;
  carrierTrunk: string;
  recentIncident: string;
  telecomCircle: string;
}

export const INDIA_THREAT_HUBS: IndiaLocationThreat[] = [
  {
    id: 'delhi',
    name: 'New Delhi / NCR',
    state: 'Delhi NCR',
    xPercent: 34.5,
    yPercent: 32.0,
    threatCount: 48,
    criticalCount: 28,
    suspiciousCount: 20,
    severity: 'Critical',
    primaryVector: 'C-Suite Executive Clone & Digital Arrest Vishing',
    carrierTrunk: 'Jio 5G Enterprise SIP Trunk',
    recentIncident: 'CALL-2289: PSU Executive clone wire authorization intercepted (99% AI score)',
    telecomCircle: 'DL-NCR Circle 01',
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    xPercent: 21.0,
    yPercent: 60.5,
    threatCount: 41,
    criticalCount: 24,
    suspiciousCount: 17,
    severity: 'Critical',
    primaryVector: 'Banking OTP Audio Clone & Securities Fraud',
    carrierTrunk: 'Airtel Enterprise Direct SIP',
    recentIncident: 'CALL-2290: Twilio VoIP proxy deepfake voice KYC impersonation',
    telecomCircle: 'MH-MUM Circle 02',
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    xPercent: 31.0,
    yPercent: 77.0,
    threatCount: 29,
    criticalCount: 16,
    suspiciousCount: 13,
    severity: 'Critical',
    primaryVector: 'Tech Support Social Engineering & IT Impersonation',
    carrierTrunk: 'Tata Tele Business Cloud PBX',
    recentIncident: 'CALL-2287: Synthetic neural vocoder audio spoofing IT Helpdesk password reset',
    telecomCircle: 'KA-BLR Circle 04',
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    xPercent: 68.5,
    yPercent: 51.5,
    threatCount: 26,
    criticalCount: 15,
    suspiciousCount: 11,
    severity: 'Critical',
    primaryVector: 'Cross-Border Telecom SIM Swap & Lottery Vishing',
    carrierTrunk: 'BSNL National PSTN Gateway',
    recentIncident: 'CALL-2288: Zero-shot RVC v2 voice clone mimicking emergency extortion',
    telecomCircle: 'WB-KOL Circle 06',
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    xPercent: 39.5,
    yPercent: 64.0,
    threatCount: 23,
    criticalCount: 12,
    suspiciousCount: 11,
    severity: 'Critical',
    primaryVector: 'Fintech Loan Recovery Robocalls with Neural TTS',
    carrierTrunk: 'Vodafone Idea Tele-Cloud',
    recentIncident: 'Automated debt collection voice clone executing coercive tactics',
    telecomCircle: 'TS-HYD Circle 08',
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    xPercent: 42.0,
    yPercent: 81.5,
    threatCount: 19,
    criticalCount: 9,
    suspiciousCount: 10,
    severity: 'Suspicious',
    primaryVector: 'Customs Courier Impersonation & Parcel Seizure Scam',
    carrierTrunk: 'Airtel Enterprise SIP Gateway',
    recentIncident: 'Spoofed Indian Customs officer clone threatening legal action for contraband',
    telecomCircle: 'TN-CHE Circle 05',
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    xPercent: 18.0,
    yPercent: 48.0,
    threatCount: 17,
    criticalCount: 8,
    suspiciousCount: 9,
    severity: 'Suspicious',
    primaryVector: 'Demat & Commodities Trading Investment Scam',
    carrierTrunk: 'Jio 5G Commercial Trunk',
    recentIncident: 'Fraudulent algorithmic trade advisor voice clone pushing fake IPO allotments',
    telecomCircle: 'GJ-AHM Circle 03',
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    xPercent: 25.0,
    yPercent: 63.5,
    threatCount: 15,
    criticalCount: 7,
    suspiciousCount: 8,
    severity: 'Suspicious',
    primaryVector: 'Credit Card Limit Upgrade Voice Cloning',
    carrierTrunk: 'Tata Tele Ingest',
    recentIncident: 'HDFC voice bot clone tricking customer into reciting CVV & OTP tokens',
    telecomCircle: 'MH-PUN Circle 09',
  },
  {
    id: 'lucknow',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    xPercent: 46.0,
    yPercent: 36.5,
    threatCount: 14,
    criticalCount: 6,
    suspiciousCount: 8,
    severity: 'Suspicious',
    primaryVector: 'Government Subsidy & Electricity Disconnection Threat',
    carrierTrunk: 'BSNL Fiber Trunk',
    recentIncident: 'State electricity board impersonation threatening power cutoff within 1 hour',
    telecomCircle: 'UP-LKO Circle 10',
  },
  {
    id: 'patna',
    name: 'Patna',
    state: 'Bihar',
    xPercent: 60.0,
    yPercent: 40.5,
    threatCount: 13,
    criticalCount: 6,
    suspiciousCount: 7,
    severity: 'Suspicious',
    primaryVector: 'Railway Recruitment Board Impersonation Vishing',
    carrierTrunk: 'Airtel Regional Trunk',
    recentIncident: 'Fake interview call requesting security deposit via UPI link',
    telecomCircle: 'BR-PAT Circle 12',
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    xPercent: 29.5,
    yPercent: 38.0,
    threatCount: 12,
    criticalCount: 5,
    suspiciousCount: 7,
    severity: 'Suspicious',
    primaryVector: 'Heritage Hotel Booking Fraud & Travel Refund Scam',
    carrierTrunk: 'Vodafone Idea Western Trunk',
    recentIncident: 'Hotels aggregator representative spoof collecting advance payment for palace stays',
    telecomCircle: 'RJ-JAI Circle 07',
  },
  {
    id: 'chandigarh',
    name: 'Chandigarh',
    state: 'Punjab / Haryana',
    xPercent: 36.5,
    yPercent: 24.5,
    threatCount: 11,
    criticalCount: 5,
    suspiciousCount: 6,
    severity: 'Suspicious',
    primaryVector: 'Immigration & Student Visa Expedited Processing Scam',
    carrierTrunk: 'Jio Fiber Telephony Gateway',
    recentIncident: 'Canada / UK embassy visa counselor clone demanding immediate compliance fee',
    telecomCircle: 'PB-CHD Circle 11',
  },
  {
    id: 'bhopal',
    name: 'Bhopal',
    state: 'Madhya Pradesh',
    xPercent: 38.0,
    yPercent: 49.5,
    threatCount: 9,
    criticalCount: 4,
    suspiciousCount: 5,
    severity: 'Suspicious',
    primaryVector: 'Kisan Credit Card Subsidy Voice Phishing',
    carrierTrunk: 'BSNL Central Core',
    recentIncident: 'Agricultural loan subsidy confirmation scam harvesting Aadhaar credentials',
    telecomCircle: 'MP-BHO Circle 13',
  },
  {
    id: 'bhubaneswar',
    name: 'Bhubaneswar',
    state: 'Odisha',
    xPercent: 60.0,
    yPercent: 57.5,
    threatCount: 8,
    criticalCount: 3,
    suspiciousCount: 5,
    severity: 'Suspicious',
    primaryVector: 'Mining License & Public Works Tender Wire Fraud',
    carrierTrunk: 'Airtel Eastern Gateway',
    recentIncident: 'Fake procurement officer clone requesting bid collateral transfer',
    telecomCircle: 'OD-BBI Circle 14',
  },
  {
    id: 'guwahati',
    name: 'Guwahati',
    state: 'Assam',
    xPercent: 79.5,
    yPercent: 37.5,
    threatCount: 8,
    criticalCount: 3,
    suspiciousCount: 5,
    severity: 'Suspicious',
    primaryVector: 'Telecom Border Verification & SIM Deactivation Scam',
    carrierTrunk: 'BSNL NE-1 Gateway',
    recentIncident: 'DoT spoof calling warning of immediate SIM deactivation for illegal activity',
    telecomCircle: 'AS-GAU Circle 15',
  },
  {
    id: 'kochi',
    name: 'Kochi',
    state: 'Kerala',
    xPercent: 29.0,
    yPercent: 89.5,
    threatCount: 7,
    criticalCount: 3,
    suspiciousCount: 4,
    severity: 'Suspicious',
    primaryVector: 'Gulf NRI Remittance & Overseas Employment Vishing',
    carrierTrunk: 'Jio South Ingest Hub',
    recentIncident: 'Dubai immigration consultant voice clone requesting visa processing stamp fees',
    telecomCircle: 'KL-KOC Circle 16',
  },
  {
    id: 'srinagar',
    name: 'Srinagar',
    state: 'Jammu & Kashmir',
    xPercent: 35.5,
    yPercent: 13.5,
    threatCount: 6,
    criticalCount: 2,
    suspiciousCount: 4,
    severity: 'Suspicious',
    primaryVector: 'Postpaid Roaming Plan Verification Voice Spoofing',
    carrierTrunk: 'Airtel Northern Security Ingest',
    recentIncident: 'Telecom KYC update clone threatening service suspension across J&K circle',
    telecomCircle: 'JK-SXR Circle 17',
  },
];

interface IndiaThreatMapProps {
  onInspectIntelligence?: (callId: string) => void;
  locations?: Array<{ city: string; latitude: number; longitude: number; id: string }>;
}

const EMPTY_HUB: IndiaLocationThreat = {
  id: 'empty', name: 'No persisted points', state: '—', xPercent: 50, yPercent: 50,
  threatCount: 0, criticalCount: 0, suspiciousCount: 0, severity: 'Suspicious',
  primaryVector: 'No call or analysis locations have been persisted yet.',
  carrierTrunk: '—', recentIncident: 'No real activity recorded.', telecomCircle: '—',
};

export const IndiaThreatMap: React.FC<IndiaThreatMapProps> = ({ onInspectIntelligence, locations = [] }) => {
  const mapHubs: IndiaLocationThreat[] = locations.map((location) => ({
    id: location.id,
    name: location.city,
    state: 'India',
    xPercent: Math.max(3, Math.min(97, ((location.longitude - 68) / 30) * 100)),
    yPercent: Math.max(3, Math.min(97, ((35 - location.latitude) / 25) * 100)),
    threatCount: 1,
    criticalCount: 0,
    suspiciousCount: 1,
    severity: 'Suspicious',
    primaryVector: 'Persisted visualization point for a completed analysis.',
    carrierTrunk: 'Backend analysis record',
    recentIncident: 'Locations shown are approximate visualization points.',
    telecomCircle: 'Persisted point',
  }));
  const [selectedHub, setSelectedHub] = useState<IndiaLocationThreat>(EMPTY_HUB);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'Critical' | 'Suspicious'>('ALL');
  const [hoveredHub, setHoveredHub] = useState<IndiaLocationThreat | null>(null);

  const filteredHubs = mapHubs.filter(
    (h) => filterSeverity === 'ALL' || h.severity === filterSeverity
  );

  const totalThreats = mapHubs.length;
  const totalCritical = mapHubs.reduce((acc, h) => acc + h.criticalCount, 0);
  const totalSuspicious = mapHubs.reduce((acc, h) => acc + h.suspiciousCount, 0);

  const activeDisplayHub = hoveredHub || selectedHub;

  React.useEffect(() => {
    setSelectedHub(mapHubs[0] || EMPTY_HUB);
  }, [locations]);

  return (
    <div className="w-full flex flex-col gap-5 animate-in fade-in duration-300 select-none">
      <div className="p-4 sm:p-5 rounded-2xl bg-[#091219]/90 border border-slate-800/90 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-white tracking-tight shrink-0">
          Virtual Threat Map of India
        </h2>

        <div className="flex items-center gap-2.5 font-mono text-xs overflow-x-auto">
          {(['ALL', 'Critical', 'Suspicious'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setFilterSeverity(filter)}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${filterSeverity === filter
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 shadow-[0_0_12px_rgba(45,212,191,0.25)]'
                : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
            >
              {filter === 'ALL'
                ? `All India (${totalThreats})`
                : filter === 'Critical'
                  ? `Critical (${totalCritical})`
                  : `Suspicious (${totalSuspicious})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#091219]/90 border border-amber-500/30 text-amber-300 text-xs font-mono shadow-sm backdrop-blur-md">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
        <span>Location shown may be inaccurate and is intended for reference only.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 rounded-3xl bg-[#060a0f] border border-teal-500/30 p-4 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl flex flex-col justify-between h-full">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 rounded-full bg-cyan-500/10 blur-[100px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-teal-500/10 blur-[100px]"
          />

          <div className="w-full flex items-center justify-between font-mono text-[11px] text-slate-400 border-b border-slate-800/80 pb-2.5 mb-2 z-10">
            <div className="flex items-center gap-2 text-teal-400 font-bold">
              <Crosshair className="w-3.5 h-3.5" />
              <span>BHARAT TELECOM SURVEILLANCE</span>
            </div>
            <div className="text-slate-400 text-[10px]">
              {filteredHubs.length} Circles Active
            </div>
          </div>

          <div className="flex-1 w-full flex items-center justify-center my-auto py-1">
            <div className="relative w-full max-w-[680px] min-h-[640px] sm:min-h-[720px] lg:min-h-[790px] aspect-[877/1024] mx-auto rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(0,0,0,0.8)] border border-slate-800/90 z-10">
              <img
                src="/assets/india-map.png"
                alt="Political Map of India"
                className="w-full h-full object-contain pointer-events-none transition-all duration-300 filter invert-[0.92] hue-rotate-[185deg] contrast-[1.15] brightness-[0.95]"
              />

              <div
                className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(6,10,15,0.7)_100%)]"
              />

              {filteredHubs.map((hub) => {
                const isSelected = selectedHub.id === hub.id;
                const isHovered = hoveredHub?.id === hub.id;

                return (
                  <div
                    key={hub.id}
                    style={{
                      left: `${hub.xPercent}%`,
                      top: `${hub.yPercent}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
                    onClick={() => setSelectedHub(hub)}
                    onMouseEnter={() => setHoveredHub(hub)}
                    onMouseLeave={() => setHoveredHub(null)}
                  >
                    <div
                      className={`absolute -inset-2.5 sm:-inset-3.5 rounded-full animate-ping opacity-60 pointer-events-none ${hub.severity === 'Critical' ? 'bg-rose-500/40' : 'bg-amber-400/40'
                        }`}
                    />

                    <div
                      className={`relative w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${isSelected
                        ? 'scale-125 ring-4 ring-teal-400/50 bg-teal-400 border-white shadow-[0_0_15px_rgba(45,212,191,0.8)]'
                        : hub.severity === 'Critical'
                          ? 'bg-rose-500 border-white shadow-[0_0_12px_rgba(244,63,94,0.9)]'
                          : 'bg-amber-400 border-white shadow-[0_0_12px_rgba(251,191,36,0.9)]'
                        }`}
                    >
                      <div className="w-1 h-1 rounded-full bg-slate-950" />
                    </div>

                    <div
                      className={`absolute left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded-md font-mono text-[9px] sm:text-[10px] font-black tracking-wider whitespace-nowrap shadow-lg border transition-all duration-150 ${isSelected
                        ? 'bg-teal-400 text-slate-950 border-white scale-110 shadow-[0_0_12px_rgba(45,212,191,0.6)] z-30'
                        : hub.severity === 'Critical'
                          ? 'bg-rose-950/95 text-rose-200 border-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                          : 'bg-amber-950/95 text-amber-200 border-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        }`}
                    >
                      {hub.threatCount}
                    </div>

                    {(isSelected || isHovered) && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-slate-950/95 border border-teal-500/80 text-slate-100 font-mono text-[11px] whitespace-nowrap shadow-2xl z-40 flex items-center gap-2 backdrop-blur-md pointer-events-none">
                        <span
                          className={`w-2 h-2 rounded-full ${hub.severity === 'Critical' ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                            }`}
                        />
                        <span className="font-bold text-white">{hub.name}</span>
                        <span className="text-teal-300 font-bold">
                          [{hub.threatCount} threats]
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-full flex flex-wrap items-center justify-between gap-3 mt-3 pt-2.5 border-t border-slate-800/80 text-xs font-mono text-slate-400 z-10">
            <div className="flex items-center gap-3.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
                <span className="text-slate-300 font-bold text-[11px]">Critical (&gt;20 threats)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" />
                <span className="text-slate-300 font-bold text-[11px]">Suspicious (≤20 threats)</span>
              </div>
            </div>

            <div className="text-slate-400 text-[10px] flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Location shown may be inaccurate and is intended for reference only.</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between gap-4 h-full">
          <div className="p-5 sm:p-6 rounded-3xl bg-[#091219]/95 border border-teal-500/40 shadow-2xl backdrop-blur-xl flex flex-col gap-3.5">
            <div className="flex items-start justify-between border-b border-slate-800/80 pb-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-[11px] font-mono text-teal-400 font-bold tracking-wider uppercase">
                    {activeDisplayHub.telecomCircle}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-['Space_Grotesk'] text-white mt-0.5">
                  {activeDisplayHub.name}
                </h3>
                <span className="text-xs font-mono text-slate-400">{activeDisplayHub.state}</span>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${activeDisplayHub.severity === 'Critical'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  }`}
              >
                {activeDisplayHub.severity} Risk
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#05080c] border border-teal-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                  ACTIVE VOICE THREATS
                </span>
                <span className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-white">
                  {activeDisplayHub.threatCount}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1.5">intercepted</span>
              </div>

              <div className="text-right font-mono text-xs">
                <div className="text-rose-400 font-bold">
                  {activeDisplayHub.criticalCount} Critical
                </div>
                <div className="text-amber-400 font-bold mt-0.5">
                  {activeDisplayHub.suspiciousCount} Suspicious
                </div>
              </div>
            </div>

            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Risk Distribution</span>
                <span className="text-rose-400 font-bold">
                  {Math.round((activeDisplayHub.criticalCount / activeDisplayHub.threatCount) * 100)}% High Risk
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{
                    width: `${(activeDisplayHub.criticalCount / activeDisplayHub.threatCount) * 100}%`,
                  }}
                  title={`Critical: ${activeDisplayHub.criticalCount}`}
                />
                <div
                  className="bg-amber-400 h-full transition-all duration-300"
                  style={{
                    width: `${(activeDisplayHub.suspiciousCount / activeDisplayHub.threatCount) * 100}%`,
                  }}
                  title={`Suspicious: ${activeDisplayHub.suspiciousCount}`}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-0.5">
              <div className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                PRIMARY SCAM VECTOR DETECTED
              </div>
              <div className="text-xs text-slate-200 font-medium leading-relaxed">
                {activeDisplayHub.primaryVector}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-0.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                TELECOM INGEST TRUNK
              </div>
              <div className="text-xs font-mono font-bold text-cyan-300">
                {activeDisplayHub.carrierTrunk}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
              <div className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-bold">
                LATEST INTERCEPTED WIRE INCIDENT
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                {activeDisplayHub.recentIncident}
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onInspectIntelligence) {
                    onInspectIntelligence('CALL-2289');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_18px_rgba(45,212,191,0.3)] hover:scale-[1.01] active:scale-[0.98]"
              >
                <span>Inspect Telecom Forensics</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#091219]/95 border border-slate-800/90 shadow-xl backdrop-blur-md flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 uppercase font-bold tracking-wider">
                MONITORED CITIES ({filteredHubs.length})
              </span>
              <span className="text-teal-400 font-bold">
                {filteredHubs.reduce((a, b) => a + b.threatCount, 0)} Threats
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {filteredHubs.map((hub) => {
                const isSelected = selectedHub.id === hub.id;
                return (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => setSelectedHub(hub)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${isSelected
                      ? 'bg-teal-500/20 border-teal-500/60 shadow-[0_0_12px_rgba(45,212,191,0.2)]'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">{hub.name}</span>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${hub.severity === 'Critical' ? 'bg-rose-500' : 'bg-amber-400'
                          }`}
                      />
                    </div>
                    <div className="mt-1 flex items-baseline justify-between font-mono">
                      <span className="text-sm font-bold text-teal-300">{hub.threatCount}</span>
                      <span className="text-[10px] text-slate-400">threats</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
